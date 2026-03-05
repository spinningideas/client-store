// Type definitions for clientStore

/**
 * ClientStorage is the contract for the type needed for data storage.
 * This matches the interface of the localStorage object and
 * can be implemented using actual localStorage or a polyfill for Node.js environments
 * depending on the desired storage engine or environment.
 */
export interface ClientStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
  clear(): void;
}

/**
 * A typed storage service that implements the ClientStorage interface using localStorage.
 * @template T - The type of the data to store.
 */
export class ClientStorageTyped<T extends Record<string, any>> {
  private storage: Storage;

  /**
   * Sets an item in localStorage with the given key and value.
   * @param key - The key to store the value under.
   * @param value - The value to store.
   */
  setItem<K extends keyof T>(key: K, value: T[K]): void;

  /**
   * Gets an item from localStorage with the given key.
   * @param key - The key to retrieve the value for.
   * @returns The value stored under the key, or null if not found.
   */
  getItem<K extends keyof T>(key: K): T[K] | null;

  /**
   * Removes an item from localStorage with the given key.
   * @param key - The key to remove.
   */
  removeItem<K extends keyof T>(key: K): void;

  /**
   * Clears all items from localStorage.
   */
  clear(): void;
}

/**
 * Fields that are specified at time of table creation and column definition
 */
export interface ClientStorageDataFields {
  [T: string]: any;
}

/**
 * Full set of fields that comprise a given table definition.
 * The ROW_IDENTIFIER field is added to the data fields and is used to identify a row in the storage database.
 * The other data fields are the fields that comprise a given table definition.
 */
export interface ClientStorageFields extends ClientStorageDataFields {
  ROW_IDENTIFIER: string;
}

/**
 * Callback function to update a row in a table.
 * @param object - The row to update.
 * @returns The updated row.
 */
export interface storageUpdateCallback {
  (object: ClientStorageFields): ClientStorageDataFields;
}

/**
 * Callback function to filter rows in a table.
 * @param object - The row to filter.
 * @returns True if the row should be included, false otherwise.
 */
export interface storageUpdateCallbackFilter {
  (object: ClientStorageFields): boolean;
}

/**
 * Direction to sort the query results.
 * @param field - The field to sort by.
 * @param direction - The direction to sort by (ASC or DESC).
 */
export type ClientStorageSortDirection = [string, "ASC" | "DESC"];

/**
 * Parameters for querying data from a table.
 * @param query - The query to filter the data.
 * @param limit - The maximum number of rows to return.
 * @param start - The starting index of the rows to return.
 * @param sort - Array of sort conditions.
 * @param distinct - Array of fields whose values have to be unique in the returned rows.
 */
interface clientStoreQueryParams {
  query?: ClientStorageDataFields | storageUpdateCallbackFilter | null;
  limit?: number;
  start?: number;
  sort?: ClientStorageSortDirection[];
  distinct?: string[];
}

export interface ClientStore {
  /**
   * Checks if the storage database has been created.
   * @returns {boolean} True if the storage database has been created, false otherwise.
   */
  storageHasBeenCreated(): boolean;

  /**
   * Imports a JSON string into the storage database.
   * @param {string} json - The JSON string to import.
   */
  importStorage(json: string): void;

  /**
   * Returns the entire storage database as serialized JSON.
   * @description Retrieves the current state of the storage database as a JSON string.
   * @returns {string} The serialized storage database.
   */
  exportStorage(): string;

  /**
   * Drops the storage database.
   * This will delete all tables and data in the storage database.
   */
  dropStorage(): void;

  /**
   * Commits the current state of the storage database to the storage engine.
   * This is useful when you want to explicitly save the current state of the storage database.
   */
  commit(): void;

  /**
   * Checks if a table exists in the storage database.
   * @param {string} tableName - The name of the table to check.
   * @returns {boolean} True if the table exists, false otherwise.
   */
  tableExists(tableName: string): boolean;

  /**
   * Gets the fields of a table.
   * @param {string} tableName - The name of the table.
   * @returns {string[]} Array of field names.
   */
  tableFields(tableName: string): string[];

  /**
   * Creates a new table in the storage database.
   * @param {string} tableName - The name of the table to create.
   * @param {string[]} fields - Array of field names.
   * @returns {boolean} True if the table was created, false otherwise.
   */
  createTable(tableName: string, fields: string[]): boolean;

  /**
   * Alters a table by adding new fields.
   * @param {string} tableName - The name of the table to alter.
   * @param {string[] | string} newFields - Array of field names or a single field name.
   * @param {ClientStorageDataFields | string} [defaultValues] - Default values for the new fields.
   * @returns {boolean} True if the table was altered, false otherwise.
   */
  alterTable(
    tableName: string,
    newFields: string[] | string,
    defaultValues?: ClientStorageDataFields | string,
  ): boolean;

  /**
   * Drops a table from the storage database.
   * @param {string} tableName - The name of the table to drop.
   */
  dropTable(tableName: string): void;

  /**
   * Truncates a table (removes all rows).
   * @param {string} tableName - The name of the table to truncate.
   */
  truncate(tableName: string): void;

  /**
   * Checks if a column exists in a table.
   * @param {string} tableName - The name of the table.
   * @param {string} fieldName - The name of the field to check.
   * @returns {boolean} True if the column exists, false otherwise.
   */
  columnExists(tableName: string, fieldName: string): boolean;

  /**
   * Commits changes to storage.
   * This will persist any changes made to the storage database.
   * @returns {boolean} True if the commit was successful, false otherwise.
   */
  commit(): boolean;

  /**
   * Gets an item from storage by key.
   * @param {string} key - The key of the item to get.
   * @returns {string | null} The value of the item, or null if the item does not exist.
   */
  getItem(key: string): string | null;

  /**
   * Sets an item in storage.
   * @param {string} key - The key of the item to set.
   * @param {string} value - The value to set.
   */
  setItem(key: string, value: string): void;

  /**
   * Gets the number of tables in the storage database.
   * @returns {number} The number of tables.
   */
  tableCount(): number;

  /**
   * Gets the number of rows in a table.
   * @param {string} tableName - The name of the table.
   * @returns {number} The number of rows in the table.
   */
  rowCount(tableName: string): number;

  /**
   * Queries data from a table.
   * @param {string} tableName - The name of the table to query.
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | string[]} [query] - The query to filter the data.
   * @param {number} [limit] - The maximum number of rows to return.
   * @param {number} [start] - The starting index of the rows to return.
   * @param {ClientStorageSortDirection[]} [sort] - Array of sort conditions.
   * @param {string[]} [distinct] - Array of fields whose values have to be unique in the returned rows.
   * @returns {ClientStorageFields[]} Array of rows matching the query.
   */
  query(
    tableName: string,
    query?: ClientStorageDataFields | storageUpdateCallbackFilter | string[],
    limit?: number,
    start?: number,
    sort?: ClientStorageSortDirection[],
    distinct?: string[],
  ): ClientStorageFields[];

  /**
   * Queries data from a table using query parameters.
   * @param {string} tableName - The name of the table to query.
   * @param {clientStoreQueryParams} params - The query parameters.
   * @returns {ClientStorageFields[]} Array of rows matching the query.
   */
  query(
    tableName: string,
    params: clientStoreQueryParams,
  ): ClientStorageFields[];

  /**
   * Queries all data from a table.
   * If no params are provided, all rows are returned.
   * @param {string} tableName - The name of the table to query.
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter} [query] - The query to filter the data.
   * @returns {ClientStorageFields[]} Array of rows matching the query.
   */
  queryAll<T = ClientStorageDataFields>(
    tableName: string,
    query?: ClientStorageDataFields | storageUpdateCallbackFilter,
  ): T[];

  /**
   * Inserts a row into a table.
   * @param {string} tableName - The name of the table.
   * @param {ClientStorageDataFields} data - The data to insert.
   * @returns {string | null} The ROW_IDENTIFIER of the inserted row, or null if the insertion failed.
   */
  insert(tableName: string, data: ClientStorageDataFields): string | null;

  /**
   * Updates rows in a table.
   * @param {string} tableName - The name of the table.
   * @param {string[]} ids - Array of ROW_IDENTIFIERs to update.
   * @param {storageUpdateCallback} updateFunction - Function to update the data.
   * @returns {number} The number of rows updated.
   */
  update(
    tableName: string,
    ids: string[],
    updateFunction: storageUpdateCallback,
  ): number;

  /**
   * Inserts or updates rows in a table.
   * @param {string} tableName - The name of the table.
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | null} query - The query to match rows.
   * @param {ClientStorageDataFields} data - The data to insert or update.
   * @returns {string[]} Array of ROW_IDENTIFIERs of the inserted or updated rows.
   */
  upsert(
    tableName: string,
    query: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    data: ClientStorageDataFields,
  ): string[];

  /**
   * Deletes rows from a table based on the provided query.
   * @param {string} tableName - The name of the table.
   * @param {string[] | ClientStorageDataFields | storageUpdateCallbackFilter} query - The query to filter the rows to delete.
   * @returns {number} The number of rows deleted.
   */
  deleteRows(
    tableName: string,
    query?: string[] | ClientStorageDataFields | storageUpdateCallbackFilter,
  ): number;

  /**
   * Creates a table and inserts data in one operation.
   * @param {string} tableName - The name of the table to create.
   * @param {ClientStorageDataFields[]} data - Array of data to insert.
   * @returns {boolean} True if the operation was successful, false otherwise.
   */
  createTableWithData(
    tableName: string,
    data: ClientStorageDataFields[],
  ): boolean;
}

// Make this file a module
export {};

/**
 * A simple client side data storage library implemented using localStorage or a polyfill for Node.js environments depending on the desired storage engine.
 * clientStore provides a set of functions to store structured data like a database containing tables and rows of data in a tabular format.
 * It supports query operations and standard CRUD operations.
 *
 * @param storeName - The name of the storage storage database.
 * @param storageEngine - The storage engine to use (localStorage or node-localstorage). Defaults to localStorage.
 * @param storePrefix - The prefix to use for the storage identifier. Defaults to "clientstore_".
 * @returns A clientStore instance with methods for working with the storage database.
 */
declare function clientStore(
  storeName: string,
  storageEngine?: ClientStorage | typeof localStorage,
  storePrefix?: string,
): ClientStore;

// Export the factory function as default
export default clientStore;

/**
 * Augment the Window interface to include clientStore
 */
declare global {
  /**
   * Extend the Window interface to include the clientStore global.
   */
  interface Window {
    clientStore: typeof clientStore;
  }
}
