/*
 * ClientStorage is the contract for the type needed for data storage
 *  that can be implemented using actual localStorage or sessionStorage
 *  depending on the desired storage engine or environment.
 */
export class ClientStorage {
  store: { [key: string]: string };

  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] || null;
  }
}

/**
 * Callback function to update a row in a table.
 * @param object - The row to update.
 * @returns The updated row.
 */
declare type storageUpdateCallback = (
  object: ClientStorageFields
) => ClientStorageDataFields;

/**
 * Callback function to filter rows in a table.
 * @param object - The row to filter.
 * @returns True if the row should be included, false otherwise.
 */
declare type storageUpdateCallbackFilter = (
  object: ClientStorageFields
) => boolean;

/** Fields that are specified at time of table creation and column definition */
interface ClientStorageDataFields {
  [T: string]: any;
}

/** Full set of fields that comprise a given table definition.
 * The ROW_IDENTIFIER field is added to the data fields and is used to identify a row in the storage database.
 * The other data fields are the fields that comprise a given table definition.
 */
interface ClientStorageFields extends ClientStorageDataFields {
  ROW_IDENTIFIER: string;
}

/**
 * Direction to sort the query results.
 * @param field - The field to sort by.
 * @param direction - The direction to sort by (ASC or DESC).
 */
type ClientStorageSortDirection = [string, "ASC" | "DESC"];

/**
 * A simple client side data storage library implemented using localStorage or sessionStorage depending on the desired storage engine.
 * clientStore provides a set of functions to store structured data like a database containing tables and rows of data in a tabular format.
 * It supports query operations and standard CRUD operations.
 *
 * @param storeName - The name of the storage storage database.
 * @param storageEngine - The storage engine to use (localStorage or sessionStorage). Defaults to localStorage.
 * @returns A clientStore instance with methods for working with the storage database.
 */
function clientStore(
  storeName: string,
  storageEngine?: ClientStorage | typeof localStorage | typeof sessionStorage
) {
  const storePrefix = "store_";
  const storageIdentifier = storePrefix + storeName;
  let storageExists = false; // determines whether a new storage database was created during an object initialization
  let storageInstance = null;
  // Determine the appropriate storage mechanism based on environment
  // and handle both browser and Node.js environments
  let storage: ClientStorage | typeof localStorage | typeof sessionStorage;

  // Check if we're in a browser environment (window exists)
  if (typeof window !== "undefined") {
    // In browser environments
    if (storageEngine) {
      // If a storage engine is provided, use it
      storage = storageEngine;
    } else {
      // Default to localStorage if no storage engine is provided
      storage = window.localStorage;
    }
  } else {
    // In Node.js environment, use the provided storage engine or a fallback in-memory storage
    if (storageEngine) {
      // Use the provided storage engine (likely from a polyfill like sessionstorage-for-nodejs)
      storage = storageEngine;
    } else {
      // Create a fallback in-memory storage if none provided
      if (!global.clientStoreMemoryStorage) {
        global.clientStoreMemoryStorage = {};
      }
      storage = {
        getItem: (key) => global.clientStoreMemoryStorage[key] || null,
        setItem: (key, value) => {
          global.clientStoreMemoryStorage[key] = value;
        },
        removeItem: (key) => {
          delete global.clientStoreMemoryStorage[key];
        },
        length: global.clientStoreMemoryStorage.length,
        key: (index) => {
          return Object.keys(global.clientStoreMemoryStorage)[index];
        },
      } as ClientStorage;
    }
  }

  // if the storage database doesn't exist, create it
  storageInstance = storage[storageIdentifier];
  if (
    !(
      storageInstance &&
      (storageInstance = JSON.parse(storageInstance)) &&
      storageInstance.tables &&
      storageInstance.data
    )
  ) {
    if (!validateName(storeName)) {
      handleError(
        "The name '" +
          storeName +
          "' contains invalid characters. Only letters, numbers, and underscores are allowed."
      );
    } else {
      storageInstance = { tables: {}, data: {} };
      storageExists = true;
    }
  }

  // --------- private methods

  /**
   * Produces a string in GUID (Globally Unique Identifier) format
   * of {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
   *
   * Returns {string} in GUID format.
   * @private
   */
  function generateId() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  /***
   * Returns all the ROW_IDENTIFIERs in a table.
   * @param {string} tableName - The name of the table
   * @param {number} [limit] - The maximum number of ROW_IDENTIFIERs to return
   * @param {number} [start] - The starting index of the ROW_IDENTIFIERs to return
   * @returns {string[]} Array of ROW_IDENTIFIERs
   * @private
   */
  function getRowIdentifiers(
    tableName: string,
    limit?: number,
    start?: number
  ): string[] {
    tableMissingThrowError(tableName);
    let rowIds: string[] = [];

    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        rowIds.push(rowIdentifier);
      }
    }

    // Apply pagination
    start = start || 0;
    if (limit) {
      rowIds = rowIds.slice(start, start + limit);
    } else if (start > 0) {
      rowIds = rowIds.slice(start);
    }
    return rowIds;
  }

  /**
   * Sort a result set by a specific field
   * @param {string} field - The field to sort by
   * @param {string} [order] - The sort order (ASC or DESC)
   * @returns {Function} A comparison function for sorting
   * @private
   */
  function sortResults(
    field: string,
    order?: string
  ): (x: ClientStorageFields, y: ClientStorageFields) => number {
    return function (x: ClientStorageFields, y: ClientStorageFields): number {
      // case insensitive comparison for string values
      const v1 =
        typeof x[field] === "string" ? x[field].toLowerCase() : x[field];
      const v2 =
        typeof y[field] === "string" ? y[field].toLowerCase() : y[field];

      if (order === "DESC") {
        return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
      } else {
        return v1 === v2 ? 0 : v1 > v2 ? 1 : -1;
      }
    };
  }

  /**
   * Select rows, given a list of row IDs of rows in a table
   * @param {string} tableName - The name of the table
   * @param {string[]} ids - Array of ROW_IDENTIFIERs of rows to select
   * @param {number} [start] - The starting index of the rows to return
   * @param {number} [limit] - The maximum number of rows to return
   * @param {ClientStorageSortDirection[]} [sort] - Array of sorting parameters
   * @param {string[]} [distinct] - Array of fields to apply distinct operation on
   * @returns {ClientStorageFields[]} Array of selected rows
   * @private
   */
  function select(
    tableName: string,
    ids: string[],
    start?: number,
    limit?: number,
    sort?: ClientStorageSortDirection[],
    distinct?: string[]
  ): ClientStorageFields[] {
    let rowId: string | null = null,
      results: ClientStorageFields[] = [],
      row: ClientStorageFields | null = null;

    for (let x = 0; x < ids.length; x++) {
      rowId = ids[x];
      row = storageInstance.data[tableName][rowId];
      results.push(clone(row));
    }

    // there are sorting params
    if (sort && sort instanceof Array) {
      for (let i = 0; i < sort.length; i++) {
        results.sort(
          sortResults(sort[i][0], sort[i].length > 1 ? sort[i][1] : null)
        );
      }
    }

    // distinct params
    if (distinct && distinct instanceof Array) {
      for (let j = 0; j < distinct.length; j++) {
        let seen: { [key: string]: number } = {},
          d = distinct[j];

        for (let z = 0; z < results.length; z++) {
          if (results[z] === undefined) {
            continue;
          }

          if (
            results[z].hasOwnProperty(d) &&
            seen.hasOwnProperty(results[z][d])
          ) {
            delete results[z];
          } else {
            seen[results[z][d]] = 1;
          }
        }
      }

      // Filter out undefined values
      let new_results: ClientStorageFields[] = [];
      for (let c = 0; c < results.length; c++) {
        if (results[c] !== undefined) {
          new_results.push(results[c]);
        }
      }

      results = new_results;
    }

    // limit and offset
    start = start && typeof start === "number" ? start : null;
    limit = limit && typeof limit === "number" ? limit : null;

    if (start && limit) {
      results = results.slice(start, start + limit);
    } else if (start) {
      results = results.slice(start);
    } else if (limit) {
      results = results.slice(start, limit);
    }

    return results;
  }

  /**
   * Select rows in a table by field-value pairs, returns the ROW_IDENTIFIERs of matches
   * @param {string} tableName - The name of the table
   * @param {ClientStorageDataFields} data - Object with field-value pairs to match
   * @param {number} [limit] - The maximum number of rows to be returned
   * @param {number} [start] - The number of rows to skip from the beginning (offset)
   * @returns {string[]} Array of ROW_IDENTIFIERs matching the query
   * @private
   */
  function queryByValues(
    tableName: string,
    data: ClientStorageDataFields,
    limit?: number,
    start?: number
  ): string[] {
    let rowIds: string[] = [];
    let exists = false;
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        continue;
      }

      row = storageInstance.data[tableName][rowIdentifier];
      exists = true;

      for (const field in data) {
        if (!data.hasOwnProperty(field)) {
          continue;
        }

        if (typeof data[field] === "string") {
          // if the field is a string, do a case insensitive comparison
          if (
            row[field] === null ||
            row[field].toString().toLowerCase() !==
              data[field].toString().toLowerCase()
          ) {
            exists = false;
            break;
          }
        } else {
          if (row[field] !== data[field]) {
            exists = false;
            break;
          }
        }
      }
      if (exists) {
        rowIds.push(rowIdentifier);
      }
    }
    if (limit) {
      rowIds = rowIds.slice(start, start + limit);
    } else if (start) {
      rowIds = rowIds.slice(start);
    }

    return rowIds;
  }

  /**
   * Select rows in a table by a function, returns the ROW_IDENTIFIERs of matches.
   * @param {string} tableName - The name of the table to query.
   * @param {storageUpdateCallbackFilter} queryFunction - The function to use for filtering rows.
   * @param {number} [limit] - The maximum number of rows to return.
   * @param {number} [start] - The starting index of the rows to return.
   * @returns {string[]} Array of ROW_IDENTIFIERs matching the query.
   * @private
   */
  function queryByFunction(
    tableName: string,
    queryFunction: storageUpdateCallbackFilter,
    limit?: number,
    start?: number
  ): string[] {
    let rowIds: string[] = [];
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        continue;
      }

      row = storageInstance.data[tableName][rowIdentifier];

      if (queryFunction(clone(row)) === true) {
        // it's a match if the supplied conditional function is satisfied
        rowIds.push(rowIdentifier);
      }
    }
    if (limit) {
      rowIds = rowIds.slice(start, start + limit);
    } else if (start) {
      rowIds = rowIds.slice(start);
    }
    return rowIds;
  }

  // --------- public storage database functions

  /**
   * Returns true if the storage database has been created, false otherwise.
   * @returns {boolean} True if the storage database has been created, false otherwise.
   */
  const storageHasBeenCreated = (): boolean => {
    return storageExists;
  };

  /**
   * Returns the entire storage database as serialized JSON.
   * @description Retrieves the current state of the storage database as a JSON string.
   * @returns {string} The serialized storage database.
   */
  function exportStorage(): string {
    return JSON.stringify(storageInstance);
  }

  /**
   * Import and replace entire contents of localStorage storage database with passed in json
   * @param {string} data - The JSON data to replace the storage database with
   */
  function importStorage(data: string): void {
    setItem(storageIdentifier, data);
  }

  /**
   * Deletes a storage database, and purges it from localStorage
   */
  function dropStorage(): void {
    if (storage && storage.hasOwnProperty(storageIdentifier)) {
      delete storage[storageIdentifier];
    }
    storageInstance = null;
  }

  /**
   * Retrieve specified value from storage having given key
   * @param {string} key - The key of the value to retrieve
   * @returns {string|null} The value or null if not found
   */
  function getItem(key: string): string | null {
    try {
      return storage[key];
    } catch (e) {
      return null;
    }
  }

  /**
   * Set value into storage having given key
   * @param {string} key - The key to set the value for
   * @param {string} value - The value to set
   * @returns {boolean} True if successful, false otherwise
   */
  function setItem(key: string, value: string): boolean {
    try {
      storage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  // --------- table functions

  /**
   * Checks whether a table exists in the storage database
   * @param {string} tableName - The name of the table to check
   * @returns {boolean} True if the table exists, false otherwise
   */
  function tableExists(tableName: string): boolean {
    return storageInstance.tables[tableName] ? true : false;
  }

  // check whether a table exists, and if not, throw an error
  function tableMissingThrowError(tableName: string): void {
    if (!tableExists(tableName)) {
      handleError("The table '" + tableName + "' does not exist");
    }
  }

  /**
   * Returns the number of tables in a storage database
   * @returns {number} The number of tables
   */
  function tableCount(): number {
    let count = 0;
    for (const table in storageInstance.tables) {
      if (storageInstance.tables.hasOwnProperty(table)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Returns the list of fields of a table
   * @param {string} tableName - The name of the table
   * @returns {string[]} Array of field names
   */
  function tableFields(tableName: string): string[] {
    return storageInstance.tables[tableName].fields;
  }

  // check whether a table column exists
  /**
   * Checks whether a column exists in storage database table
   * @param {string} tableName - The name of the table
   * @param {string} fieldName - The name of the field/column to check
   * @returns {boolean} True if the column exists, false otherwise
   */
  function columnExists(tableName: string, fieldName: string): boolean {
    let exists = false;
    const tableFields = storageInstance.tables[tableName].fields;
    for (const field in tableFields) {
      if (tableFields[field] === fieldName) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  /**
   * Creates a table - fields is an array of string fieldnames. 'ROW_IDENTIFIER' is a reserved fieldname
   * @param {string} tableName - The name of the table to create
   * @param {string[]} fields - Array of field names
   */
  function createTable(tableName: string, fields: string[]): void {
    if (!validateName(tableName)) {
      handleError(
        "The table name name '" +
          tableName +
          "' contains invalid characters. Only letters, numbers, and underscores are allowed."
      );
    }
    storageInstance.tables[tableName] = { fields: fields };
    storageInstance.data[tableName] = {};
  }

  // drop a table
  function dropTable(tableName: string): void {
    tableMissingThrowError(tableName);
    delete storageInstance.tables[tableName];
    delete storageInstance.data[tableName];
  }

  // empty a table
  function truncate(tableName: string): void {
    tableMissingThrowError(tableName);
    storageInstance.data[tableName] = {};
  }

  // create a table using array of Objects @ [{k:v,k:v},{k:v,k:v},etc]
  function createTableWithData(
    tableName: string,
    data: ClientStorageDataFields[]
  ) {
    if (typeof data !== "object" || !data.length || data.length < 1) {
      handleError(
        "Data supplied isn't in object form. Example: [{k:v,k:v},{k:v,k:v} ..]"
      );
      return false;
    }

    let fields = Object.keys(data[0]);

    // create the table
    const tableExistsAlready = tableExists(tableName);
    if (!tableExistsAlready) {
      createTable(tableName, fields);
    }
    if (data && data.length > 0) {
      // populate
      for (let i = 0; i < data.length; i++) {
        if (!insert(tableName, data[i])) {
          handleError(
            "Failed to insert record: [" + JSON.stringify(data[i]) + "]"
          );
        }
      }
    }
    return true;
  }

  /**
   * Alter a table
   * @param {string} tableName - The name of the table to alter
   * @param {string[]} newFields - Array of columns to add
   * @param {ClientStorageDataFields|string} defaultValues - Can be an object of column's default values OR a default value string for single column for existing rows
   */
  function alterTable(
    tableName: string,
    newFields: string[],
    defaultValues?: ClientStorageDataFields | string
  ): void {
    tableMissingThrowError(tableName);
    storageInstance.tables[tableName].fields =
      storageInstance.tables[tableName].fields.concat(newFields);

    // insert default values in existing table
    if (typeof defaultValues !== "undefined") {
      // loop through all the records in the table
      for (const rowIdentifier in storageInstance.data[tableName]) {
        if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
          continue;
        }
        for (const field in newFields) {
          if (typeof defaultValues === "object") {
            storageInstance.data[tableName][rowIdentifier][newFields[field]] =
              defaultValues[newFields[field]];
          } else {
            storageInstance.data[tableName][rowIdentifier][newFields[field]] =
              defaultValues;
          }
        }
      }
    }
  }

  /**
   * Returns the number of rows in a table
   * @param {string} tableName - The name of the table
   * @returns {number} The number of rows
   */
  function rowCount(tableName: string): number {
    tableMissingThrowError(tableName);
    let count = 0;
    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Inserts a row into a table
   * @param {string} tableName - The name of the table
   * @param {ClientStorageDataFields} data - The data to insert
   * @returns {string|null} The ROW_IDENTIFIER of the inserted row, or null if insertion failed
   */
  function insert(
    tableName: string,
    data: ClientStorageDataFields
  ): string | null {
    tableMissingThrowError(tableName);
    data = validateData(tableName, data);
    if (!data) {
      return null;
    }

    const rowIdentifier = generateId();
    data.ROW_IDENTIFIER = rowIdentifier;
    storageInstance.data[tableName][rowIdentifier] = data;
    return rowIdentifier;
  }

  /**
   * Select rows, given a list of ROW_IDENTIFIERs of rows in a table
   * @param {string} tableName - The name of the table
   * @param {string[]} ids - Array of ROW_IDENTIFIERs to select
   * @param {number} [start] - The number of rows to skip from the beginning (offset)
   * @param {number} [limit] - The maximum number of rows to be returned
   * @param {ClientStorageSortDirection[]} [sort] - Array of sort conditions, each one of which is an array with two values
   * @param {string[]} [distinct] - Array of fields whose values have to be unique in the returned rows
   * @returns {ClientStorageFields[]} Array of rows matching the query
   */
  function query(
    tableName: string,
    queryParam?:
      | string[]
      | ClientStorageDataFields
      | storageUpdateCallbackFilter,
    start?: number,
    limit?: number,
    sort?: ClientStorageSortDirection[],
    distinct?: string[]
  ): ClientStorageFields[] {
    tableMissingThrowError(tableName);

    let rowIdentifiers: string[] = [];
    if (!queryParam) {
      rowIdentifiers = getRowIdentifiers(tableName); // no conditions given, return all records
    } else if (Array.isArray(queryParam)) {
      // If queryParam is an array of IDs, use it directly
      rowIdentifiers = queryParam;
    } else if (typeof queryParam === "object") {
      // the query has key-value pairs provided
      rowIdentifiers = queryByValues(
        tableName,
        validFields(tableName, queryParam as ClientStorageDataFields)
      );
    } else if (typeof queryParam === "function") {
      // the query is a function
      rowIdentifiers = queryByFunction(tableName, queryParam);
    }

    return select(tableName, rowIdentifiers, start, limit, sort, distinct);
  }

  /**
   * Select rows given a params object that is a where clause of the query.
   * If no params are provided, all rows are returned.
   * @param {string} tableName - The name of the table
   * @param {string[]|ClientStorageDataFields|storageUpdateCallbackFilter} params - The list of fields use in the select
   * @returns {ClientStorageFields[]} Array of rows matching the query
   */
  function queryAll(
    tableName: string,
    params?: string[] | ClientStorageDataFields | storageUpdateCallbackFilter
  ): ClientStorageFields[] {
    return query(tableName, params);
  }

  /**
   * Deletes rows, given a list of their ROW_IDENTIFIERs in a table
   * @param tableName
   * @param ids
   * @returns
   */
  function deleteRows(tableName: string, ids: string[]): number {
    tableMissingThrowError(tableName);
    let deletedCount = 0;

    for (let i = 0; i < ids.length; i++) {
      if (storageInstance.data[tableName].hasOwnProperty(ids[i])) {
        delete storageInstance.data[tableName][ids[i]];
        deletedCount++;
      }
    }
    return deletedCount;
  }
  /**
   * update rows having given row identifiers
   * @param tableName
   * @param ids
   * @param updateFunction
   * @returns
   */
  function update(
    tableName: string,
    ids: string[],
    updateFunction: storageUpdateCallback
  ): number {
    tableMissingThrowError(tableName);
    let rowIdentifier = "";
    let num = 0;

    for (let i = 0; i < ids.length; i++) {
      rowIdentifier = ids[i];

      const updatedData = updateFunction(
        clone(storageInstance.data[tableName][rowIdentifier])
      );

      if (updatedData) {
        delete updatedData["ROW_IDENTIFIER"]; // no updates possible to ROW_IDENTIFIER

        const newData = storageInstance.data[tableName][rowIdentifier];
        // merge updated data with existing data
        for (const field in updatedData) {
          if (updatedData.hasOwnProperty(field)) {
            newData[field] = updatedData[field];
          }
        }

        storageInstance.data[tableName][rowIdentifier] = validFields(
          tableName,
          newData
        );
        num++;
      }
    }
    return num;
  }

  /**
   * Insert or update rows based on a given condition.
   * Alias to upsert. Use upsert for better clarity.
   * @deprecated Use upsert instead.
   * @param {string} tableName - The name of the table
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | null} query - The query to match rows
   * @param {ClientStorageDataFields} data - The data to insert or update
   * @returns {string[] | null} Array of ROW_IDENTIFIERs of the updated rows
   */
  function insertOrUpdate(
    tableName: string,
    query: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    data: ClientStorageDataFields
  ) {
    tableMissingThrowError(tableName);
    console.warn("upsertOrUpdate is deprecated. Use upsert instead.");
    return upsert(tableName, query, data);
  }

  /**
   * Insert or update rows based on a given condition.
   * @param {string} tableName - The name of the table
   * @param {ClientStorageDataFields | storageUpdateCallbackFilter | null} query - The query to match rows
   * @param {ClientStorageDataFields} data - The data to insert or update
   * @returns {string[] | null} Array of ROW_IDENTIFIERs of the updated rows
   */
  function upsert(
    tableName: string,
    query: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    data: ClientStorageDataFields
  ): string[] | null {
    tableMissingThrowError(tableName);

    let rowIds: string[] = [];
    if (!query) {
      rowIds = getRowIdentifiers(tableName); // there is no query. applies to all records
    } else if (typeof query === "object") {
      // the query has key-value pairs provided
      rowIds = queryByValues(tableName, validFields(tableName, query));
    } else if (typeof query === "function") {
      // the query has a conditional map function provided
      rowIds = queryByFunction(tableName, query);
    }

    // no existing records matched, so insert a new row
    if (rowIds.length === 0) {
      const insertedId = insert(tableName, validateData(tableName, data));
      // insert already commits, so no need to commit again
      return insertedId ? [insertedId] : null;
    } else {
      const ids: string[] = [];
      update(tableName, rowIds, function (o) {
        if (typeof o.ROW_IDENTIFIER === "string") {
          ids.push(o.ROW_IDENTIFIER);
        }
        return data;
      });
      // update already commits, so no need to commit again
      return ids;
    }
  }

  /**
   * Commits the storage database to localStorage.
   * @description Saves the current state of the storage database to localStorage.
   * @returns {boolean} True if the commit was successful, false otherwise.
   */
  function commit(): boolean {
    try {
      storage.setItem(storageIdentifier, JSON.stringify(storageInstance));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Provides central error handling. Throws an error with the given message.
   * @param msg - The error message.
   * @returns Never returns.
   */
  function handleError(msg: string): never {
    throw new Error(msg);
  }

  /**
   * Clones an object into a new row of data to return to the caller.
   * @param obj - The object that is a row of data to clone.
   * @returns The cloned object that is a row of data.
   */
  function clone<T extends ClientStorageFields>(obj: T): T {
    const new_obj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        new_obj[key] = obj[key];
      }
    }
    return new_obj;
  }

  /**
   * Validates a name (storageInstance, table, field names) by checking if it contains only alpha-numeric characters and underscores.
   * @param name - The name to validate.
   * @returns True if the name is valid, false otherwise.
   */
  function validateName(name: string): boolean {
    return name.toString().match(/[^a-z_0-9]/gi) ? false : true;
  }

  /**
   * Provides a validation mechanism to ensure that only
   * fields that are defined in a table's schema
   * are included in data operations
   * @param tableName - The name of the table.
   * @param data - The data to validate that may have additional fields NOT defined in the table schema.
   * @returns Only dataset containing ONLY data for the valid fields for given table name
   */
  function validFields(
    tableName: string,
    data: ClientStorageDataFields
  ): ClientStorageDataFields {
    let field = "";
    const newData: ClientStorageDataFields = {};
    for (let i = 0; i < storageInstance.tables[tableName].fields.length; i++) {
      field = storageInstance.tables[tableName].fields[i];
      if (data[field] !== undefined) {
        newData[field] = data[field];
      }
    }
    return newData;
  }

  /** 
   * Ensures that data being inserted into a table contains 
   * all the required (validated) fields defined for that table.
   *  
   * @param tableName - The name of the table.
   * @param data - The data to validate.
   * @returns The validated data.
   * 
   * @example
   * ```
   * // Original data
  const data = { name: "John" };

  // After validateData
  const validatedData = validateData("users", data);
  // validatedData = { name: "John", email: null, age: null }

   * ```
  */
  function validateData(
    tableName: string,
    data: ClientStorageDataFields
  ): ClientStorageDataFields {
    let field = "";
    const newData: ClientStorageDataFields = {};
    for (let i = 0; i < storageInstance.tables[tableName].fields.length; i++) {
      field = storageInstance.tables[tableName].fields[i];
      newData[field] =
        data[field] === null || data[field] === undefined ? null : data[field];
    }
    return newData;
  }

  // --------- public methods
  return {
    storageHasBeenCreated,
    importStorage,
    exportStorage,
    dropStorage,
    tableExists,
    tableFields,
    createTable,
    createTableWithData,
    alterTable,
    dropTable,
    truncate,
    columnExists,
    commit,
    getItem,
    setItem,
    tableCount,
    rowCount,
    query,
    queryAll,
    insert,
    upsert,
    insertOrUpdate,
    update,
    deleteRows,
  };
}

// Export for TypeScript modules
export default clientStore;
