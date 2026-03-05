// Main entry point for the package
import clientStore from "./clientStore";
import { ClientStorage, ClientStorageTyped } from "./clientStore";

// Export types from clientStore.ts
export type {
  ClientStore,
  ClientStorageDataFields,
  ClientStorageFields,
  storageUpdateCallback,
  storageUpdateCallbackFilter,
  ClientStorageSortDirection,
} from "./clientStore";

// Export ClientStorage interface and ClientStorageTyped class
export { ClientStorage, ClientStorageTyped };

// Export clientStore as the default export
export default clientStore;
