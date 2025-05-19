// Main entry point for the package
import clientStore from './clientStore';
import { localStorageDB } from './localStorageDB';
import { ClientStorage, ClientStorageTyped } from './clientStore';

// Export types from clientStore.ts
export type {
  ClientStorageDataFields,
  ClientStorageFields,
  storageUpdateCallback,
  storageUpdateCallbackFilter,
  ClientStorageSortDirection
} from './clientStore';

// Export ClientStorage interface and LocalStorageService class
export { ClientStorage, ClientStorageTyped };

// Export clientStore as the default export
export default clientStore;

/**
 * @deprecated This class is exposed for backward compatibility only and may be removed in future versions.
 * Use clientStore instead which provides a more robust and feature-complete API.
 */
export { localStorageDB };
