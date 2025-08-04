#!/usr/bin/env tsx

/**
 * Database Setup & Schema Validation Test Script
 * 
 * This script tests the MongoDB setup and schema implementation
 * as specified in the PRD. It performs:
 * 
 * 1. Database connection and reset
 * 2. Core MVP schema validation
 * 3. Compression functionality testing
 * 4. Index effectiveness verification
 * 5. CRUD operations testing
 */

import dotenv from 'dotenv';
import { database } from './database/connection.js';
import { User, Song, Arrangement, Setlist, Types } from './database/models/index.js';
import { compress, decompress } from '@mongodb-js/zstd';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
  details?: any;
}

class DatabaseTester {
  private results: TestResult[] = [];
  
  private log(message: string): void {
    console.log(`🧪 ${message}`);
  }
  
  private logSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }
  
  private logError(message: string): void {
    console.log(`❌ ${message}`);
  }
  
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    this.log(`Running: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        test: testName,
        passed: true,
        duration,
        details: result
      });
      
      this.logSuccess(`${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        test: testName,
        passed: false,
        error: errorMessage,
        duration
      });
      
      this.logError(`${testName}: ${errorMessage} (${duration}ms)`);
    }
  }
  
  async testDatabaseConnection(): Promise<void> {
    await this.runTest('Database Connection', async () => {
      await database.connect();
      const info = database.getConnectionInfo();
      
      if (!info.isConnected) {
        throw new Error('Database connection failed');
      }
      
      return info;
    });
  }
  
  async testDatabaseReset(): Promise<void> {
    await this.runTest('Database Reset', async () => {
      const result = await database.resetDatabase();
      
      if (!result.dropped || !result.recreated) {
        throw new Error('Database reset incomplete');
      }
      
      return result;
    });
  }
  
  async testCompressionFunctionality(): Promise<void> {
    await this.runTest('Zstd Compression', async () => {
      const testData = `
        {title: Amazing Grace}
        {artist: John Newton}
        {key: G}
        
        [G]Amazing [C]grace how [G]sweet the [D]sound
        That [G]saved a [C]wretch like [G]me
        I [G]once was [C]lost but [G]now am [Em]found
        Was [G]blind but [D]now I [G]see
      `;
      
      const originalSize = Buffer.byteLength(testData, 'utf8');
      const compressed = await compress(Buffer.from(testData, 'utf8'), 3);
      const decompressed = await decompress(compressed);
      const decompressedData = decompressed.toString('utf8');
      
      const compressionRatio = (1 - compressed.length / originalSize) * 100;
      
      if (decompressedData !== testData) {
        throw new Error('Compression/decompression data mismatch');
      }
      
      if (compressionRatio < 10) {
        throw new Error('Compression ratio too low');
      }
      
      return {
        originalSize,
        compressedSize: compressed.length,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        dataIntegrity: decompressedData === testData
      };
    });
  }
  
  async testUserSchemaOperations(): Promise<void> {
    await this.runTest('User Schema CRUD', async () => {
      // Create user
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        preferences: {
          defaultKey: 'G',
          fontSize: 16,
          theme: 'light'
        },
        profile: {
          bio: 'Test user for schema validation',
          location: 'Test City'
        }
      });
      
      const savedUser = await user.save();
      
      // Test methods
      await savedUser.incrementSongCount();
      await savedUser.updateLastLogin();
      
      // Verify increments
      const updatedUser = await User.findById(savedUser._id);
      if (!updatedUser) throw new Error('User not found after update');
      if (updatedUser.stats.songsCreated !== 1) throw new Error('Song count not incremented');
      if (!updatedUser.lastLoginAt) throw new Error('Last login not updated');
      
      // Test static methods
      const foundUser = await User.findByEmail('test@example.com');
      if (!foundUser) throw new Error('User not found by email');
      
      return {
        userId: savedUser._id,
        email: savedUser.email,
        stats: updatedUser.stats,
        lastLogin: updatedUser.lastLoginAt
      };
    });
  }
  
  async testSongSchemaOperations(): Promise<void> {
    await this.runTest('Song Schema CRUD', async () => {
      // Find user for createdBy reference
      const user = await User.findOne({ email: 'test@example.com' });
      if (!user) throw new Error('Test user not found');
      
      // Create song with ChordPro data
      const chordProData = `
        {title: Amazing Grace}
        {artist: John Newton}
        {key: G}
        
        [G]Amazing [C]grace how [G]sweet the [D]sound
        That [G]saved a [C]wretch like [G]me
      `;
      
      const song = new Song({
        title: 'Amazing Grace',
        artist: 'John Newton',
        chordData: chordProData, // Will be compressed automatically
        key: 'G',
        tempo: 90,
        timeSignature: '4/4',
        difficulty: 'beginner',
        themes: ['worship', 'grace', 'traditional'],
        source: 'Traditional Hymn',
        lyrics: 'Amazing grace how sweet the sound...',
        metadata: {
          createdBy: user._id,
          lastModifiedBy: user._id,
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0
        }
      });
      
      const savedSong = await song.save();
      
      // Test compression
      if (!Buffer.isBuffer(savedSong.chordData)) {
        throw new Error('Chord data not compressed to Buffer');
      }
      
      // Test decompression method
      const decompressed = await savedSong.getDecompressedChordData();
      if (!decompressed.includes('Amazing grace')) {
        throw new Error('Decompression failed');
      }
      
      // Test methods
      await savedSong.updateViews();
      await savedSong.addRating(4.5);
      
      // Verify updates
      const updatedSong = await Song.findById(savedSong._id);
      if (!updatedSong) throw new Error('Song not found after update');
      if (updatedSong.metadata.views !== 1) throw new Error('Views not incremented');
      if (updatedSong.metadata.ratings.average !== 4.5) throw new Error('Rating not added');
      
      return {
        songId: savedSong._id,
        title: savedSong.title,
        compressionWorking: Buffer.isBuffer(savedSong.chordData),
        decompressionWorking: decompressed.length > 0,
        views: updatedSong.metadata.views,
        rating: updatedSong.metadata.ratings.average,
        documentSize: savedSong.documentSize
      };
    });
  }
  
  async testArrangementSchemaOperations(): Promise<void> {
    await this.runTest('Arrangement Schema CRUD', async () => {
      // Find user and song
      const user = await User.findOne({ email: 'test@example.com' });
      const song = await Song.findOne({ title: 'Amazing Grace' });
      if (!user || !song) throw new Error('Test user or song not found');
      
      // Create arrangement
      const arrangementData = `
        {title: Amazing Grace - Acoustic}
        {key: D}
        {capo: 5}
        
        [D]Amazing [G]grace how [D]sweet the [A]sound
        That [D]saved a [G]wretch like [D]me
      `;
      
      const arrangement = new Arrangement({
        name: 'Amazing Grace - Acoustic',
        songIds: [song._id],
        createdBy: user._id,
        chordData: arrangementData,
        key: 'D',
        tempo: 85,
        timeSignature: '4/4',
        difficulty: 'intermediate',
        description: 'Acoustic arrangement with capo on 5th fret',
        tags: ['acoustic', 'capo', 'easy'],
        metadata: {
          isMashup: false, // Will be auto-set
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0
        }
      });
      
      const savedArrangement = await arrangement.save();
      
      // Test auto-set isMashup
      if (savedArrangement.metadata.isMashup !== false) {
        throw new Error('isMashup not auto-set correctly for single song');
      }
      
      // Test methods
      await savedArrangement.updateViews();
      await savedArrangement.addRating(4.8);
      
      // Create mashup arrangement
      const mashup = new Arrangement({
        name: 'Amazing Grace + How Great Thou Art Mashup',
        songIds: [song._id, new Types.ObjectId()], // Second song doesn't exist, but that's OK for test
        createdBy: user._id,
        chordData: 'Mashup chord data...',
        key: 'G',
        difficulty: 'advanced',
        description: 'Mashup of two classic hymns',
        tags: ['mashup', 'traditional'],
        metadata: {
          mashupSections: [
            {
              songId: song._id,
              title: 'Amazing Grace',
              startBar: 1,
              endBar: 16
            }
          ],
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0
        }
      });
      
      const savedMashup = await mashup.save();
      
      // Test auto-set isMashup for multiple songs
      if (savedMashup.metadata.isMashup !== true) {
        throw new Error('isMashup not auto-set correctly for mashup');
      }
      
      return {
        arrangementId: savedArrangement._id,
        mashupId: savedMashup._id,
        singleSongMashup: savedArrangement.metadata.isMashup,
        multiSongMashup: savedMashup.metadata.isMashup,
        compressionWorking: Buffer.isBuffer(savedArrangement.chordData)
      };
    });
  }
  
  async testSetlistSchemaOperations(): Promise<void> {
    await this.runTest('Setlist Schema CRUD', async () => {
      // Find user and song
      const user = await User.findOne({ email: 'test@example.com' });
      const song = await Song.findOne({ title: 'Amazing Grace' });
      const arrangement = await Arrangement.findOne({ name: 'Amazing Grace - Acoustic' });
      if (!user || !song || !arrangement) throw new Error('Test data not found');
      
      // Create setlist
      const setlist = new Setlist({
        name: 'Sunday Morning Worship',
        description: 'Morning worship service setlist',
        createdBy: user._id,
        songs: [
          {
            songId: song._id,
            arrangementId: arrangement._id,
            transpose: 2,
            notes: 'Start slow, build energy',
            order: 0
          }
        ],
        tags: ['worship', 'sunday', 'morning'],
        metadata: {
          isPublic: true,
          usageCount: 0
        }
      });
      
      const savedSetlist = await setlist.save();
      
      // Test auto-calculated duration
      if (savedSetlist.metadata.estimatedDuration !== 4) {
        throw new Error('Estimated duration not calculated correctly');
      }
      
      // Test methods
      await savedSetlist.addSong(song._id.toString(), arrangement._id.toString(), -1, 'Second song');
      await savedSetlist.incrementUsage();
      
      // Verify updates
      const updatedSetlist = await Setlist.findById(savedSetlist._id);
      if (!updatedSetlist) throw new Error('Setlist not found after update');
      if (updatedSetlist.songs.length !== 2) throw new Error('Song not added to setlist');
      if (updatedSetlist.metadata.usageCount !== 1) throw new Error('Usage count not incremented');
      if (updatedSetlist.metadata.estimatedDuration !== 8) throw new Error('Duration not recalculated');
      
      // Test share token generation for public setlist
      if (!updatedSetlist.metadata.shareToken) {
        throw new Error('Share token not generated for public setlist');
      }
      
      return {
        setlistId: savedSetlist._id,
        songCount: updatedSetlist.songs.length,
        estimatedDuration: updatedSetlist.metadata.estimatedDuration,
        shareToken: updatedSetlist.metadata.shareToken,
        usageCount: updatedSetlist.metadata.usageCount
      };
    });
  }
  
  async testSearchAndIndexes(): Promise<void> {
    await this.runTest('Search & Index Functionality', async () => {
      // Test song search
      const songSearchResults = await Song.searchSongs('Amazing', 10);
      if (songSearchResults.length === 0) {
        throw new Error('Song search returned no results');
      }
      
      // Test arrangement search
      const arrangementSearchResults = await Arrangement.searchArrangements('acoustic', 10);
      if (arrangementSearchResults.length === 0) {
        throw new Error('Arrangement search returned no results');
      }
      
      // Test setlist search
      const setlistSearchResults = await Setlist.searchSetlists('worship', 10);
      if (setlistSearchResults.length === 0) {
        throw new Error('Setlist search returned no results');
      }
      
      // Test static finder methods
      const publicSetlists = await Setlist.findPublic(5);
      const songsByDifficulty = await Song.findByDifficulty('beginner');
      const arrangementsByTag = await Arrangement.findByTags(['acoustic'], 5);
      
      return {
        songSearchResults: songSearchResults.length,
        arrangementSearchResults: arrangementSearchResults.length,
        setlistSearchResults: setlistSearchResults.length,
        publicSetlists: publicSetlists.length,
        beginnerSongs: songsByDifficulty.length,
        acousticArrangements: arrangementsByTag.length
      };
    });
  }
  
  async testStorageOptimization(): Promise<void> {
    await this.runTest('Storage Optimization', async () => {
      const stats = await database.getStorageStats();
      
      // Get document counts
      const userCount = await User.countDocuments();
      const songCount = await Song.countDocuments();
      const arrangementCount = await Arrangement.countDocuments();
      const setlistCount = await Setlist.countDocuments();
      
      // Calculate average document sizes
      const songs = await Song.find().select('documentSize');
      const avgSongSize = songs.reduce((sum, song) => sum + song.documentSize, 0) / songs.length;
      
      return {
        storageStats: stats,
        documentCounts: {
          users: userCount,
          songs: songCount,
          arrangements: arrangementCount,
          setlists: setlistCount
        },
        averageDocumentSizes: {
          songs: Math.round(avgSongSize)
        }
      };
    });
  }
  
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting MongoDB Setup & Schema Validation Tests\n');
    
    // Phase 1: Connection & Reset
    await this.testDatabaseConnection();
    await this.testDatabaseReset();
    
    // Phase 2: Compression
    await this.testCompressionFunctionality();
    
    // Phase 3: Schema Operations
    await this.testUserSchemaOperations();
    await this.testSongSchemaOperations();
    await this.testArrangementSchemaOperations();
    await this.testSetlistSchemaOperations();
    
    // Phase 4: Search & Optimization
    await this.testSearchAndIndexes();
    await this.testStorageOptimization();
    
    // Cleanup
    await database.disconnect();
    
    // Results summary
    this.printResults();
  }
  
  private printResults(): void {
    console.log('\n📊 Test Results Summary\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);
    
    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.test}: ${r.error}`);
        });
      console.log('');
    }
    
    console.log('📋 Detailed Results:');
    this.results.forEach(r => {
      const status = r.passed ? '✅' : '❌';
      const duration = r.duration ? `(${r.duration}ms)` : '';
      console.log(`   ${status} ${r.test} ${duration}`);
      
      if (r.details && r.passed) {
        Object.entries(r.details).forEach(([key, value]) => {
          console.log(`      ${key}: ${JSON.stringify(value)}`);
        });
      }
    });
    
    console.log(`\n🏁 MongoDB Setup & Schema Implementation: ${failed === 0 ? 'SUCCESS' : 'FAILED'}`);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DatabaseTester();
  tester.runAllTests().catch(console.error);
}

export { DatabaseTester };