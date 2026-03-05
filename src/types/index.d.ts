// Type definitions for the main entry point
import clientStore from "./clientStore";

// Export all types from clientStore.d.ts
export type {
  ClientStore,
  ClientStorageDataFields,
  ClientStorageFields,
  storageUpdateCallback,
  storageUpdateCallbackFilter,
  ClientStorageSortDirection,
} from "./clientStore";

// Export ClientStorage interface and ClientStorageTyped class
export { ClientStorage, ClientStorageTyped } from "./clientStore";

export default clientStore;
