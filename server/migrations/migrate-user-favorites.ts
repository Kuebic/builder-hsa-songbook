import { connect, disconnect } from "mongoose";
import { User, Song, Arrangement } from "../database/models";
import { Types } from "mongoose";
import * as fs from "fs/promises";
import * as path from "path";

interface MigrationStats {
  usersProcessed: number;
  favoritesConverted: number;
  songFavorites: number;
  arrangementFavorites: number;
  errors: Array<{ userId: string; error: string }>;
  startTime: Date;
  endTime?: Date;
}

/**
 * Migration script to convert user favorites from single array to dual system
 * Old schema: favorites: ObjectId[] (songs only)
 * New schema: favoriteSongs: ObjectId[], favoriteArrangements: ObjectId[]
 */
export async function migrateUserFavorites(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    usersProcessed: 0,
    favoritesConverted: 0,
    songFavorites: 0,
    arrangementFavorites: 0,
    errors: [],
    startTime: new Date(),
  };

  try {
    // Connect to database if not already connected
    if (!(global as any).mongoose?.connection?.readyState) {
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/hsa-songbook";
      await connect(mongoUri);
      console.log("📊 Connected to database for migration");
    }

    // Create backup before migration
    console.log("💾 Creating backup before migration...");
    await createBackup();

    // Find all users with the old favorites field
    const users = await User.find({ favorites: { $exists: true } } as any);
    console.log(`Found ${users.length} users with favorites to migrate`);

    // Process each user
    for (const user of users) {
      try {
        stats.usersProcessed++;
        
        // Skip if user doesn't have favorites or already migrated
        const userWithFavorites = user as any;
        if (!userWithFavorites.favorites || userWithFavorites.favorites.length === 0) {
          continue;
        }

        // Check if user already has new fields populated
        if (user.favoriteSongs?.length > 0 || user.favoriteArrangements?.length > 0) {
          console.log(`⚠️  User ${user._id} already has new favorites fields, skipping...`);
          continue;
        }

        // Validate each favorite ID and categorize
        const songFavorites: Types.ObjectId[] = [];
        const arrangementFavorites: Types.ObjectId[] = [];

        for (const favoriteId of userWithFavorites.favorites) {
          try {
            // Check if it's a valid song
            const song = await Song.findById(favoriteId);
            if (song) {
              songFavorites.push(favoriteId);
              stats.songFavorites++;
              continue;
            }

            // Check if it's a valid arrangement
            const arrangement = await Arrangement.findById(favoriteId);
            if (arrangement) {
              arrangementFavorites.push(favoriteId);
              stats.arrangementFavorites++;
              continue;
            }

            // If neither, log as error but continue
            console.warn(`⚠️  Favorite ID ${favoriteId} for user ${user._id} is neither a song nor arrangement`);
          } catch (error) {
            console.error(`Error checking favorite ${favoriteId}:`, error);
          }
        }

        // Update user with new fields
        user.favoriteSongs = songFavorites;
        user.favoriteArrangements = arrangementFavorites;
        
        // Save the user
        await user.save();
        stats.favoritesConverted += songFavorites.length + arrangementFavorites.length;
        
        console.log(`✅ Migrated user ${user._id}: ${songFavorites.length} songs, ${arrangementFavorites.length} arrangements`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push({
          userId: user._id.toString(),
          error: errorMessage,
        });
        console.error(`❌ Error migrating user ${user._id}:`, error);
      }
    }

    // Remove old favorites field from all users
    if (process.env.REMOVE_OLD_FIELD === "true") {
      console.log("🧹 Removing old favorites field...");
      await User.updateMany(
        { favorites: { $exists: true } },
        { $unset: { favorites: 1 } },
      );
    }

    stats.endTime = new Date();
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
    
    console.log("\n📊 Migration Summary:");
    console.log(`- Users processed: ${stats.usersProcessed}`);
    console.log(`- Total favorites converted: ${stats.favoritesConverted}`);
    console.log(`- Song favorites: ${stats.songFavorites}`);
    console.log(`- Arrangement favorites: ${stats.arrangementFavorites}`);
    console.log(`- Errors: ${stats.errors.length}`);
    console.log(`- Duration: ${duration.toFixed(2)} seconds`);

    // Save migration report
    await saveMigrationReport(stats);

    return stats;
  } catch (error) {
    console.error("Fatal migration error:", error);
    throw error;
  }
}

/**
 * Create a backup of user data before migration
 */
async function createBackup(): Promise<void> {
  const backupDir = path.join(__dirname, "../../backups");
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const backupFile = path.join(backupDir, `users-backup-${timestamp}.json`);

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  // Export all users with favorites
  const users = await User.find({ favorites: { $exists: true } })
    .select("_id email name favorites favoriteSongs favoriteArrangements")
    .lean();

  // Write backup
  await fs.writeFile(backupFile, JSON.stringify(users, null, 2));
  console.log(`✅ Backup created: ${backupFile}`);
}

/**
 * Save migration report
 */
async function saveMigrationReport(stats: MigrationStats): Promise<void> {
  const reportsDir = path.join(__dirname, "../../migration-reports");
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const reportFile = path.join(reportsDir, `favorites-migration-${timestamp}.json`);

  // Ensure reports directory exists
  await fs.mkdir(reportsDir, { recursive: true });

  // Write report
  await fs.writeFile(reportFile, JSON.stringify(stats, null, 2));
  console.log(`\n📄 Migration report saved: ${reportFile}`);
}

/**
 * Rollback migration (restore from backup)
 */
export async function rollbackFavoritesMigration(backupFile: string): Promise<void> {
  try {
    console.log("🔄 Starting rollback...");
    
    // Read backup file
    const backupData = await fs.readFile(backupFile, "utf-8");
    const users = JSON.parse(backupData);

    // Restore each user
    for (const userData of users) {
      await User.findByIdAndUpdate(userData._id, {
        favorites: userData.favorites,
        $unset: { favoriteSongs: 1, favoriteArrangements: 1 },
      });
    }

    console.log(`✅ Rollback completed. Restored ${users.length} users from backup.`);
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  (async () => {
    try {
      await migrateUserFavorites();
      await disconnect();
      process.exit(0);
    } catch (error) {
      console.error("Migration failed:", error);
      await disconnect();
      process.exit(1);
    }
  })();
}