// Export the main IndexedDB manager and hooks
export { indexedDB } from "./database";
export {
  useIndexedDB,
  useCachedSongs,
  useCachedSetlists,
  useSyncQueue,
  useOfflinePreferences,
} from "../../hooks/useIndexedDB";
