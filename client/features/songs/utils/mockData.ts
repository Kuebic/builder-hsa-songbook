import { Song, ClientSong, songToClientFormat } from "../types/song.types";

// New schema-compliant mock songs
export const mockSongs: Song[] = [
  {
    _id: "1",
    title: "Amazing Grace",
    artist: "John Newton",
    slug: "amazing-grace-jn-4k7p2",
    chordData:
      "{title: Amazing Grace}\n{artist: John Newton}\n{key: G}\n\n[G]Amazing grace how [C]sweet the [G]sound\nThat saved a [D]wretch like [G]me",
    key: "G",
    tempo: 85,
    timeSignature: "4/4",
    difficulty: "beginner",
    themes: ["grace", "salvation", "traditional"],
    source: "traditional",
    lyrics: "Amazing grace how sweet the sound...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.8,
        count: 124,
      },
      views: 1524,
    },
    documentSize: 2048,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    _id: "2",
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    slug: "how-great-is-our-god-ct-8m3n5",
    chordData:
      "{title: How Great Is Our God}\n{artist: Chris Tomlin}\n{key: A}\n\nThe [A]splendor of the [E]King\nClothed in [F#m]majesty [D]",
    key: "A",
    tempo: 120,
    timeSignature: "4/4",
    difficulty: "intermediate",
    themes: ["worship", "praise", "contemporary"],
    source: "contemporary",
    lyrics: "The splendor of the King...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.9,
        count: 86,
      },
      views: 2341,
    },
    documentSize: 2560,
    createdAt: "2024-01-10T10:00:00.000Z",
    updatedAt: "2024-01-10T10:00:00.000Z",
  },
  {
    _id: "3",
    title: "Holy Spirit",
    artist: "Francesca Battistelli",
    slug: "holy-spirit-fb-7x9k1",
    chordData:
      "{title: Holy Spirit}\n{artist: Francesca Battistelli}\n{key: E}\n\nThere's nothing [E]worth more that will ever come [A]close",
    key: "E",
    tempo: 72,
    timeSignature: "4/4",
    difficulty: "intermediate",
    themes: ["holy spirit", "prayer", "worship"],
    source: "contemporary",
    lyrics: "There's nothing worth more...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.7,
        count: 52,
      },
      views: 987,
    },
    documentSize: 1920,
    createdAt: "2024-01-08T10:00:00.000Z",
    updatedAt: "2024-01-08T10:00:00.000Z",
  },
  {
    _id: "4",
    title: "Cornerstone",
    artist: "Hillsong",
    slug: "cornerstone-h-5p2w8",
    chordData:
      "{title: Cornerstone}\n{artist: Hillsong}\n{key: C}\n\nMy [C]hope is built on nothing less\nThan [F]Jesus' blood and [G]righteous[C]ness",
    key: "C",
    tempo: 95,
    timeSignature: "4/4",
    difficulty: "advanced",
    themes: ["foundation", "hope", "contemporary"],
    source: "contemporary",
    lyrics: "My hope is built on nothing less...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.6,
        count: 73,
      },
      views: 1876,
    },
    documentSize: 3072,
    createdAt: "2024-01-12T10:00:00.000Z",
    updatedAt: "2024-01-12T10:00:00.000Z",
  },
  {
    _id: "5",
    title: "Great Are You Lord",
    artist: "All Sons & Daughters",
    slug: "great-are-you-lord-asd-9q1m3",
    chordData:
      "{title: Great Are You Lord}\n{artist: All Sons & Daughters}\n{key: D}\n\nYou give [D]life, You are [A]love",
    key: "D",
    tempo: 130,
    timeSignature: "4/4",
    difficulty: "beginner",
    themes: ["praise", "worship", "contemporary"],
    source: "contemporary",
    lyrics: "You give life, You are love...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.5,
        count: 41,
      },
      views: 1432,
    },
    documentSize: 1536,
    createdAt: "2024-01-11T10:00:00.000Z",
    updatedAt: "2024-01-11T10:00:00.000Z",
  },
  {
    _id: "6",
    title: "In Christ Alone",
    artist: "Keith Getty & Stuart Townend",
    slug: "in-christ-alone-kg-st-6n4k7",
    chordData:
      "{title: In Christ Alone}\n{artist: Keith Getty & Stuart Townend}\n{key: F}\n\nIn Christ a[F]lone my hope is [C]found",
    key: "F",
    tempo: 80,
    timeSignature: "4/4",
    difficulty: "intermediate",
    themes: ["christ", "salvation", "hymn"],
    source: "contemporary",
    lyrics: "In Christ alone my hope is found...",
    metadata: {
      createdBy: "admin_user",
      isPublic: true,
      ratings: {
        average: 4.9,
        count: 97,
      },
      views: 2145,
    },
    documentSize: 2816,
    createdAt: "2024-01-12T10:00:00.000Z",
    updatedAt: "2024-01-12T10:00:00.000Z",
  },
];

// Convert to client format for backward compatibility
export const mockClientSongs: ClientSong[] = mockSongs.map(songToClientFormat);

export const mockStats = {
  totalSongs: 1247,
  totalSetlists: 89,
  recentlyAdded: 12,
  topContributors: 45,
};
