import { database } from "../database/connection";
import { Song, User, Arrangement } from "../database/models";

// Mock ChordPro data for each song
const mockChordProData = {
  "Amazing Grace": `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 85}

{start_of_verse}
Amazing [G]grace how [C]sweet the [G]sound
That saved a [D]wretch like [G]me
I once was [G]lost but now am [C]found
Was [G]blind but [D]now I [G]see
{end_of_verse}

{start_of_verse}
T'was [G]grace that [C]taught my heart to [G]fear
And grace my [D]fears re[G]lieved
How precious [G]did that [C]grace appear
The [G]hour I [D]first be[G]lieved
{end_of_verse}

{start_of_chorus}
Amazing [G]grace how [C]sweet the [G]sound
That saved a [D]wretch like [G]me
{end_of_chorus}`,

  "How Great Is Our God": `{title: How Great Is Our God}
{artist: Chris Tomlin}
{key: A}
{tempo: 120}

{start_of_verse}
The [A]splendor of the [E]King
Clothed in [F#m]majesty [D]
Let all the [A]earth re[E]joice
All the [F#m]earth re[D]joice

He [A]wraps Himself in [E]light
And darkness [F#m]tries to [D]hide
And trembles [A]at His [E]voice
And trembles [F#m]at His [D]voice
{end_of_verse}

{start_of_chorus}
How [A]great is our [E]God
Sing with [F#m]me, how [D]great is our [A]God
And all will [E]see how [F#m]great, how [D]great is our [A]God
{end_of_chorus}

{start_of_bridge}
[A]Name above all [E]names
[F#m]Worthy of all [D]praise
[A]My heart will sing how [E]great is our [F#m]God [D]
{end_of_bridge}`,

  "Holy Spirit": `{title: Holy Spirit}
{artist: Francesca Battistelli}
{key: E}
{tempo: 72}

{start_of_verse}
There's nothing [E]worth more that will ever come [A]close
No thing can com[B]pare, You're our living [C#m]hope
Your presence, [A]Lord
{end_of_verse}

{start_of_verse}
I've tasted and [E]seen of the sweetest of [A]loves
Where my heart be[B]comes free and my shame is un[C#m]done
Your presence, [A]Lord
{end_of_verse}

{start_of_chorus}
Holy [E]Spirit, You are [A]welcome here
Come [B]flood this place and [C#m]fill the atmos[A]phere
Your [E]glory, God, is [A]what our hearts long [B]for
To be over[C#m]come by Your [A]presence, Lord
{end_of_chorus}`,

  Cornerstone: `{title: Cornerstone}
{artist: Hillsong}
{key: C}
{tempo: 95}

{start_of_verse}
My [C]hope is built on nothing less
Than [F]Jesus' blood and [G]righteous[C]ness
I dare not trust the sweetest frame
But [F]wholly lean on [G]Jesus' [C]name
{end_of_verse}

{start_of_chorus}
Christ a[C]lone, corner[F]stone
Weak made [Am]strong in the [G]Savior's [F]love
Through the [C]storm, He is [F]Lord
Lord of [Am]all [G] [C]
{end_of_chorus}

{start_of_verse}
When [C]darkness seems to hide His face
I [F]rest on His un[G]changing [C]grace
In every high and stormy gale
My [F]anchor holds within [G]the [C]veil
{end_of_verse}

{start_of_verse}
When [C]He shall come with trumpet sound
Oh [F]may I then in [G]Him be [C]found
Dressed in His righteousness alone
Fault[F]less to stand be[G]fore the [C]throne
{end_of_verse}`,

  "Great Are You Lord": `{title: Great Are You Lord}
{artist: All Sons & Daughters}
{key: D}
{tempo: 130}

{start_of_verse}
You give [D]life, You are [A]love
You bring [Bm]light to the [G]darkness
You give [D]hope, You re[A]store
Every [Bm]heart that is [G]broken

[Em]Great are You, [D/F#]Lord
{end_of_verse}

{start_of_chorus}
It's Your [D]breath in our [A]lungs
So we [Bm]pour out our [G]praise, we [Em]pour out our [D/F#]praise
It's Your [D]breath in our [A]lungs
So we [Bm]pour out our [G]praise to You [D]only
{end_of_chorus}

{start_of_verse}
You give [D]life, You are [A]love
You bring [Bm]light to the [G]darkness
You give [D]hope, You re[A]store
Every [Bm]heart that is [G]broken

[Em]Great are You, [D/F#]Lord
{end_of_verse}`,

  "In Christ Alone": `{title: In Christ Alone}
{artist: Keith Getty & Stuart Townend}
{key: F}
{tempo: 80}

{start_of_verse}
In Christ a[F]lone my hope is [C]found
He is my [Dm]light, my strength, my [Bb]song
This corner[F]stone, this solid [C]ground
Firm through the [Dm]fiercest drought and [Bb]storm [F]

What heights of [F]love, what depths of [C]peace
When fears are [Dm]stilled, when strivings [Bb]cease
My comfor[F]ter, my all in [C]all
Here in the [Dm]love of Christ I [Bb]stand [F]
{end_of_verse}

{start_of_verse}
In Christ a[F]lone, who took on [C]flesh
Fullness of [Dm]God in helpless [Bb]babe
This gift of [F]love and righteous[C]ness
Scorned by the [Dm]ones He came to [Bb]save [F]

'Til on that [F]cross as Jesus [C]died
The wrath of [Dm]God was satis[Bb]fied
For every [F]sin on Him was [C]laid
Here in the [Dm]death of Christ I [Bb]live [F]
{end_of_verse}`,
};

// Mock data structure matching the original mockSongs
const mockSongs = [
  {
    title: "Amazing Grace",
    artist: "John Newton",
    key: "G",
    tempo: 85,
    difficulty: "beginner" as const,
    themes: ["grace", "salvation", "traditional"],
    source: "traditional",
  },
  {
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    key: "A",
    tempo: 120,
    difficulty: "intermediate" as const,
    themes: ["worship", "praise", "contemporary"],
    source: "contemporary",
  },
  {
    title: "Holy Spirit",
    artist: "Francesca Battistelli",
    key: "E",
    tempo: 72,
    difficulty: "intermediate" as const,
    themes: ["holy spirit", "prayer", "worship"],
    source: "contemporary",
  },
  {
    title: "Cornerstone",
    artist: "Hillsong",
    key: "C",
    tempo: 95,
    difficulty: "advanced" as const,
    themes: ["foundation", "hope", "contemporary"],
    source: "contemporary",
  },
  {
    title: "Great Are You Lord",
    artist: "All Sons & Daughters",
    key: "D",
    tempo: 130,
    difficulty: "beginner" as const,
    themes: ["praise", "worship", "contemporary"],
    source: "contemporary",
  },
  {
    title: "In Christ Alone",
    artist: "Keith Getty & Stuart Townend",
    key: "F",
    tempo: 80,
    difficulty: "intermediate" as const,
    themes: ["christ", "salvation", "hymn"],
    source: "contemporary",
  },
];

export async function migrateMockData() {
  try {
    console.log("🔄 Starting migration of mock song data...");

    // Connect to database
    await database.connect();

    // Create a default admin user for the songs
    const adminUserId = "admin_user_123";

    // Check if admin user exists, create if not
    let adminUser = await User.findById(adminUserId);
    if (!adminUser) {
      adminUser = new User({
        _id: adminUserId,
        email: "admin@hsasongbook.com",
        name: "HSA Admin",
        role: "ADMIN",
        profile: {
          bio: "Default admin user for HSA Songbook",
        },
        preferences: {
          fontSize: 16,
          theme: "light",
        },
        stats: {
          songsCreated: 0,
          arrangementsCreated: 0,
          setlistsCreated: 0,
        },
      });
      await adminUser.save();
      console.log("✅ Created admin user");
    }

    // Clear existing songs to avoid duplicates
    await Song.deleteMany({});
    console.log("🗑️  Cleared existing songs");

    // Migrate each song
    for (const mockSong of mockSongs) {
      const chordData =
        mockChordProData[mockSong.title as keyof typeof mockChordProData] ||
        `{title: ${mockSong.title}}\n{artist: ${mockSong.artist}}\n{key: ${mockSong.key}}\n\n[${mockSong.key}]Sample chord progression\n[${mockSong.key}]More chords here`;

      // First create the song without arrangement
      const song = new Song({
        title: mockSong.title,
        artist: mockSong.artist,
        themes: mockSong.themes,
        source: mockSong.source,
        lyrics: `Sample lyrics for ${mockSong.title}`,
        notes: `Sample arrangement notes for ${mockSong.title}`,
        metadata: {
          createdBy: adminUserId,
          lastModifiedBy: adminUserId,
          isPublic: true,
          ratings: {
            average: Math.random() * 1.5 + 3.5, // Random rating between 3.5-5.0
            count: Math.floor(Math.random() * 50) + 10, // Random count 10-60
          },
          views: Math.floor(Math.random() * 2000) + 100, // Random views 100-2100
        },
        documentSize: 0, // Will be calculated in pre-save middleware
      });

      await song.save();

      // Create a default arrangement for the song
      const arrangement = new Arrangement({
        name: "Default",
        songIds: [song._id],
        createdBy: adminUserId,
        chordData,
        key: mockSong.key,
        tempo: mockSong.tempo,
        timeSignature: "4/4",
        difficulty: mockSong.difficulty,
        description: `Default arrangement for ${mockSong.title}`,
        tags: ["default", "original"],
        metadata: {
          isMashup: false,
          isPublic: true,
          ratings: {
            average: 0,
            count: 0,
          },
          views: 0,
          setlistCount: 0,
          reviewCount: 0,
        },
        documentSize: 0,
      });

      await arrangement.save();

      // Update the song with the default arrangement
      song.defaultArrangement = arrangement._id;
      await song.save();

      console.log(
        `✅ Migrated: ${song.title} (${song.slug}) with default arrangement`,
      );
    }

    // Create sample arrangements for the first few songs
    console.log("🎵 Creating sample arrangements...");
    const createdSongs = await Song.find({}).limit(3); // Get first 3 songs
    let arrangementsCreated = 0;

    for (const song of createdSongs) {
      // Create 2 arrangements per song (different keys/styles)
      const arrangements = [
        {
          name: `${song.title} - Original Key`,
          songIds: [song._id],
          createdBy: adminUserId,
          chordData:
            (mockChordProData as Record<string, string>)[song.title] ||
            `{title: ${song.title}}
{key: G}

[G]Sample chord data for ${song.title}
[C]This is a basic [G]arrangement
[D]In the original [G]key`,
          key: "G",
          tempo: 85,
          timeSignature: "4/4",
          difficulty: "intermediate",
          description: `Original key arrangement for ${song.title}`,
          tags: ["worship", "traditional"],
          metadata: {
            isMashup: false,
            isPublic: true,
            ratings: {
              average: 4.2,
              count: 15,
            },
            views: 50,
          },
        },
        {
          name: `${song.title} - Capo Version`,
          songIds: [song._id],
          createdBy: adminUserId,
          chordData: `{title: ${song.title} - Capo Version}
{key: C}

[C]Same song but with capo on 5th fret
[F]Makes it easier for [C]beginners
[G]Simple chord [C]progression`,
          key: "C",
          tempo: 80,
          timeSignature: "4/4",
          difficulty: "beginner",
          description: `Beginner-friendly capo arrangement for ${song.title}`,
          tags: ["worship", "beginner", "capo"],
          metadata: {
            isMashup: false,
            isPublic: true,
            ratings: {
              average: 4.5,
              count: 8,
            },
            views: 25,
          },
        },
      ];

      for (const arrangementData of arrangements) {
        const arrangement = new Arrangement(arrangementData);
        await arrangement.save();
        arrangementsCreated++;
        console.log(`✅ Created arrangement: ${arrangement.name}`);
      }
    }

    // Update admin user stats
    adminUser.stats.songsCreated = mockSongs.length;
    adminUser.stats.arrangementsCreated = arrangementsCreated;
    await adminUser.save();

    console.log("✅ Migration completed successfully!");
    console.log(
      `📊 Migrated ${mockSongs.length} songs and ${arrangementsCreated} arrangements`,
    );

    // Get storage stats
    const stats = await database.getStorageStats();
    console.log(
      `💾 Database usage: ${stats.usage}MB / ${stats.limit}MB (${stats.percentage}%)`,
    );

    return {
      success: true,
      migrated: mockSongs.length,
      storageUsage: stats,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Function to run migration
export async function runMigration() {
  try {
    const result = await migrateMockData();
    console.log("Migration result:", result);
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

// If this file is run directly, execute the migration
if (import.meta.url === `file://${process.argv[1]}.js`) {
  runMigration();
}
