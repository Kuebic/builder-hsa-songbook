// Export all models for easy importing
export { Song, type ISong, type Difficulty } from "./Song";
export { User, type IUser, type MusicalKey } from "./User";
export { Arrangement, type IArrangement } from "./Arrangement";
export { Setlist, type ISetlist, type ISetlistItem } from "./Setlist";
export { Verse, type IVerse, type VerseStatus } from "./Verse";
export { Review, type IReview } from "./Review";

// Re-export mongoose types for convenience
export { Types } from "mongoose";
