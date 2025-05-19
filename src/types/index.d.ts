// Type definitions for the main entry point

import clientStore from './clientStore';
import { localStorageDB } from './localStorageDB';

// Export all types from clientStore.d.ts
export type {
  ClientStorageDataFields,
  ClientStorageFields,
  storageUpdateCallback,
  storageUpdateCallbackFilter,
  ClientStorageSortDirection
} from './clientStore';

// Export ClientStorage interface and LocalStorageService class
export { ClientStorage, LocalStorageService } from './clientStore';

export default clientStore;

/**
 * @deprecated This class is exposed for backward compatibility only and may be removed in future versions.
 * Use clientStore instead which provides a more robust and feature-complete API.
 */
export { localStorageDB };
