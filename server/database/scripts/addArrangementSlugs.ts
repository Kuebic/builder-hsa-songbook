#!/usr/bin/env tsx

import { config } from "dotenv";
import { join } from "path";
import { Arrangement, Song } from "../models";
import { database } from "../connection";
import { createArrangementSlug } from "../../utils/slug";

// Load environment variables
config({ path: join(process.cwd(), ".env") });

/**
 * Migration script to add slugs to existing arrangements
 * Run with: npx tsx server/database/scripts/addArrangementSlugs.ts
 */
async function addArrangementSlugs() {
  try {
    console.log("🔌 Connecting to database...");
    await database.connect();
    console.log("✅ Connected to database");

    // Find all arrangements without slugs
    const arrangementsWithoutSlugs = await Arrangement.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    }).populate("songIds", "title");

    console.log(
      `📊 Found ${arrangementsWithoutSlugs.length} arrangements without slugs`,
    );

    if (arrangementsWithoutSlugs.length === 0) {
      console.log("✅ All arrangements already have slugs!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const existingSlugs: string[] = [];

    // Get all existing slugs to avoid duplicates
    const existingArrangements = await Arrangement.find({
      slug: { $exists: true, $ne: null, $ne: "" },
    }).select("slug");

    existingArrangements.forEach((arr) => {
      if (arr.slug) {
        existingSlugs.push(arr.slug);
      }
    });

    console.log(`📋 Found ${existingSlugs.length} existing slugs`);

    // Process each arrangement
    for (const arrangement of arrangementsWithoutSlugs) {
      try {
        // Get the first song's title for slug generation
        const firstSong = arrangement.songIds[0] as any;
        const songTitle = firstSong?.title || arrangement.name || "untitled";

        // Generate unique slug
        let slug = createArrangementSlug(songTitle);

        // Ensure uniqueness
        let counter = 1;
        const baseSlug = slug;
        while (existingSlugs.includes(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Update the arrangement with the new slug
        arrangement.slug = slug;
        await arrangement.save();

        existingSlugs.push(slug);
        successCount++;

        console.log(
          `✅ Added slug "${slug}" to arrangement "${arrangement.name}" (ID: ${arrangement._id})`,
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Failed to add slug to arrangement ${arrangement._id}:`,
          error,
        );
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully added slugs to ${successCount} arrangements`);
    if (errorCount > 0) {
      console.log(`❌ Failed to add slugs to ${errorCount} arrangements`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Disconnecting from database...");
    await database.disconnect();
    console.log("✅ Disconnected from database");
    process.exit(0);
  }
}

// Run the migration
addArrangementSlugs().catch(console.error);
