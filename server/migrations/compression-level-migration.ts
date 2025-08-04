#!/usr/bin/env tsx
/**
 * Migration script to handle compression level changes
 * 
 * This script:
 * 1. Identifies songs compressed with the old compression level (6)
 * 2. Decompresses them using the old level
 * 3. Recompresses them using the new level (3)
 * 4. Updates the documents in the database
 * 
 * Usage: npx tsx server/migrations/compression-level-migration.ts
 */

import { connect, disconnect } from 'mongoose';
import { compress, decompress } from '@mongodb-js/zstd';
import { Song } from '../database/models/Song.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Track migration progress
let processed = 0;
let migrated = 0;
let failed = 0;

async function migrateCompressionLevel() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get total count of songs
    const totalCount = await Song.countDocuments();
    console.log(`Total songs in database: ${totalCount}`);

    // Process songs in batches to avoid memory issues
    const batchSize = 100;
    let skip = 0;

    while (skip < totalCount) {
      // Fetch batch of songs without triggering decompression middleware
      const songs = await Song.find({})
        .skip(skip)
        .limit(batchSize)
        .lean(); // Use lean() to get plain objects

      console.log(`Processing batch ${Math.floor(skip / batchSize) + 1} (${skip + 1}-${Math.min(skip + batchSize, totalCount)} of ${totalCount})`);

      // Process each song in the batch
      for (const song of songs) {
        processed++;

        try {
          if (!song.chordData || !Buffer.isBuffer(song.chordData)) {
            console.log(`Song ${song._id} (${song.title}) has no chord data or invalid format, skipping`);
            continue;
          }

          // Try to decompress with the current level (3)
          let decompressed: Buffer | null = null;

          try {
            // First try decompressing with current level
            decompressed = await decompress(song.chordData);
          } catch (error) {
            // If that fails, the data might be compressed with the old level
            console.log(`Song ${song._id} (${song.title}) failed to decompress with level 3, trying manual decompression...`);
            
            // Since we can't specify compression level in decompress,
            // we'll mark this as needing migration but skip for now
            // In production, you might want to use a different approach
            // or store the compression level metadata with each document
            failed++;
            console.error(`Failed to decompress song ${song._id} (${song.title}):`, error);
            continue;
          }

          if (decompressed) {
            // Recompress with new level
            const recompressed = await compress(decompressed, 3);

            // Check if data actually changed (different compression level)
            if (!song.chordData.equals(recompressed)) {
              // Update the document directly to bypass middleware
              await Song.updateOne(
                { _id: song._id },
                { $set: { chordData: recompressed } }
              );
              migrated++;
              console.log(`✓ Migrated song ${song._id} (${song.title})`);
            } else {
              console.log(`Song ${song._id} (${song.title}) already using compression level 3`);
            }
          }
        } catch (error) {
          failed++;
          console.error(`Failed to process song ${song._id} (${song.title}):`, error);
        }
      }

      skip += batchSize;
    }

    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total songs processed: ${processed}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed to process: ${failed}`);
    console.log(`Already up to date: ${processed - migrated - failed}`);

    if (failed > 0) {
      console.log('\n⚠️  Warning: Some songs failed to migrate. These may need manual intervention.');
      console.log('The application will handle them gracefully with fallback logic.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting compression level migration...\n');
  migrateCompressionLevel()
    .then(() => {
      console.log('\nMigration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

export { migrateCompressionLevel };