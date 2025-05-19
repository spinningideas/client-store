// Main entry point for the package
import clientStore from './clientStore';
import { localStorageDB } from './localStorageDB';

// Export clientStore as the default export
export default clientStore;

/**
 * @deprecated This class is exposed for backward compatibility only and may be removed in future versions.
 * Use clientStore instead which provides a more robust and feature-complete API.
 */
export { localStorageDB };
