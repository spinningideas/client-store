// Type definitions for clientStore

/** 
 * Fields that are specified at time of table creation and column definition 
 */
interface ClientStorageDataFields {
  [T: string]: any;
}

/** 
 * Full set of fields that comprise a given table definition.
 * The ROW_IDENTIFIER field is added to the data fields and is used to identify a row in the storage database.
 * The other data fields are the fields that comprise a given table definition.
 */
interface ClientStorageFields extends ClientStorageDataFields {
  ROW_IDENTIFIER: string;
}

/**
 * Callback function to update a row in a table.
 * @param object - The row to update.
 * @returns The updated row.
 */
interface storageUpdateCallback {
  (object: ClientStorageFields): ClientStorageDataFields;
}

/**
 * Callback function to filter rows in a table.
 * @param object - The row to filter.
 * @returns True if the row should be included, false otherwise.
 */
interface storageUpdateCallbackFilter {
  (object: ClientStorageFields): boolean;
}

/**
 * Direction to sort the query results.
 * @param field - The field to sort by.
 * @param direction - The direction to sort by (ASC or DESC).
 */
interface ClientStorageSortDirection {
  field: string;
  direction: "ASC" | "DESC";
}

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

interface clientStore {
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
   * Exports the storage database as a JSON string.
   * @returns {string} The JSON string representation of the storage database.
   */
  exportStorage(): string;
  
  /**
   * Drops the storage database.
   * This will delete all tables and data in the storage database.
   */
  dropStorage(): void;
  
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
    defaultValues?: ClientStorageDataFields | string
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
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | null} [query] - The query to filter the data.
   * @param {number} [limit] - The maximum number of rows to return.
   * @param {number} [start] - The starting index of the rows to return.
   * @param {ClientStorageSortDirection[]} [sort] - Array of sort conditions.
   * @param {string[]} [distinct] - Array of fields whose values have to be unique in the returned rows.
   * @returns {ClientStorageFields[]} Array of rows matching the query.
   */
  query(
    tableName: string,
    query?: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    limit?: number,
    start?: number,
    sort?: ClientStorageSortDirection[],
    distinct?: string[]
  ): ClientStorageFields[];
  
  /**
   * Queries data from a table using query parameters.
   * @param {string} tableName - The name of the table to query.
   * @param {clientStoreQueryParams} params - The query parameters.
   * @returns {ClientStorageFields[]} Array of rows matching the query.
   */
  query(
    tableName: string,
    params: clientStoreQueryParams
  ): ClientStorageFields[];
  
  /**
   * Inserts data into a table.
   * @param {string} tableName - The name of the table to insert into.
   * @param {ClientStorageDataFields} data - The data to insert.
   * @returns {string | null} The ROW_IDENTIFIER of the inserted row, or null if the insertion failed.
   */
  insert(tableName: string, data: ClientStorageDataFields): string | null;
  
  /**
   * Upserts data into a table (insert if not exists, update if exists).
   * @param {string} tableName - The name of the table to upsert into.
   * @param {ClientStorageDataFields} data - The data to upsert.
   * @returns {string | null} The ROW_IDENTIFIER of the upserted row, or null if the upsert failed.
   */
  upsert(tableName: string, data: ClientStorageDataFields): string | null;
  
  /**
   * Inserts or updates data in a table based on a query.
   * @param {string} tableName - The name of the table to insert or update.
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | null} query - The query to filter the data.
   * @param {ClientStorageDataFields} data - The data to insert or update.
   * @returns {string[] | null} Array of ROW_IDENTIFIERs of the updated rows, or null if the operation failed.
   */
  insertOrUpdate(
    tableName: string,
    query: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    data: ClientStorageDataFields
  ): string[] | null;
  
  /**
   * Updates data in a table.
   * @param {string} tableName - The name of the table to update.
   * @param {string[]} ids - Array of ROW_IDENTIFIERs to update.
   * @param {storageUpdateCallback} updateFunction - Function to update the data.
   * @returns {number} The number of rows updated.
   */
  update(
    tableName: string,
    ids: string[],
    updateFunction: storageUpdateCallback
  ): number;
  
  /**
   * Deletes rows from a table.
   * @param {string} tableName - The name of the table to delete from.
   * @param {string[]} ids - Array of ROW_IDENTIFIERs to delete.
   * @returns {number} The number of rows deleted.
   */
  deleteRows(
    tableName: string,
    ids: string[]
  ): number;
}

// Make this file a module
export {};

/**
 * A simple client side data storage library implemented using localStorage or sessionStorage.
 * clientStore provides a set of functions to store structured data like a database containing tables and rows of data in a tabular format.
 * It supports query operations and standard CRUD operations in both browser and Node.js environments.
 * 
 * @param {string} storeName - The name of the storage database.
 * @param {any} [storageEngine] - The storage engine to use. In browser environments, this can be localStorage or sessionStorage.
 *                               In Node.js environments, this can be any object that implements the Storage interface (getItem, setItem, removeItem).
 *                               Defaults to localStorage in browser environments or an in-memory storage in Node.js environments.
 * @returns {clientStore} A clientStore instance with methods for working with the storage database.
 */
declare function clientStore(storeName: string, storageEngine?: any): clientStore;

// Export the factory function as default
export default clientStore;

/**
 * Extend Window interface to include clientStore for browser environments
 */
declare global {
  interface Window {
    clientStore: typeof clientStore;
  }
}
