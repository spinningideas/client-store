/**
 * Callback function to update a row in a table.
 * @param object - The row to update.
 * @returns The updated row.
 */
declare type updateCallback = (object: staticFields) => dataFields;

/**
 * Callback function to filter rows in a table.
 * @param object - The row to filter.
 * @returns True if the row should be included, false otherwise.
 */
declare type updateCallbackFilter = (object: staticFields) => boolean;

/** Fields that are specified at time of table creation and column definition */
interface dataFields {
  [T: string]: any;
}

/** Full set of data fields that comprise a given table definition.
 * The ROW_IDENTIFIER field is used to identify a row in the storage database.
 * The other fields are the fields that comprise a given table definition.
 */
interface staticFields extends dataFields {
  ROW_IDENTIFIER: string;
}

/**
 * A simple client side data storage library implemented using localStorage or sessionStorage depending on the desired storage engine.
 * clientStore provides a set of functions to store structured data like a database containing tables and rows of data in a tabular format.
 * It supports query operations and standard CRUD operations.
 *
 * @param storeName - The name of the storage storage database.
 * @param storageEngine - The storage engine to use (localStorage or sessionStorage). Defaults to localStorage.
 * @returns A clientStore instance with methods for working with the storage database.
 */
function clientStore(storeName: string, storageEngine?: Storage) {
  const storePrefix = "store_";
  const storageIdentifier = storePrefix + storeName;
  let storageExists = false; // determines whether a new storage database was created during an object initialization
  let storageInstance = null;
  const storage =
    storageEngine === sessionStorage
      ? window.sessionStorage
      : window.localStorage;

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
      handleError("The name '" + storeName + "' contains invalid characters");
    } else {
      storageInstance = { tables: {}, data: {} };
      commit();
      storageExists = true;
    }
  }

  // --------- private methods

  /**
   * Produces a string in GUID (Globally Unique Identifier) format
   * of {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
   *
   * Returns {string} in GUID format.
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

  // --------- storage database functions

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
    if (storage.hasOwnProperty(storageIdentifier)) {
      delete storage[storageIdentifier];
    }
    storageInstance = null;
  }

  /**
   * Retrieve specified value from localStorage
   * @param {string} key - The key to retrieve
   * @returns {string|null} The value or null if not found
   */
  function getItem(key: string): string | null {
    try {
      return storage.storage[key];
    } catch (e) {
      return null;
    }
  }

  /**
   * Set value for localStorage
   * @param {string} key - The key to set
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

  // --------- table functions

  /**
   * Returns the list of fields of a table
   * @param {string} tableName - The name of the table
   * @returns {string[]} Array of field names
   */
  function tableFields(tableName: string): string[] {
    return storageInstance.tables[tableName].fields;
  }

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
    storageInstance.tables[tableName] = { fields: fields, auto_increment: 1 };
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
    storageInstance.tables[tableName].auto_increment = 1;
    storageInstance.data[tableName] = {};
  }

  /**
   * Alter a table
   * @param {string} tableName - The name of the table to alter
   * @param {string[]} newFields - Array of columns to add
   * @param {dataFields|string} defaultValues - Can be an object of column's default values OR a default value string for single column for existing rows
   */
  function alterTable(
    tableName: string,
    newFields: string[],
    defaultValues?: dataFields | string
  ): void {
    tableMissingThrowError(tableName);
    storageInstance.tables[tableName].fields =
      storageInstance.tables[tableName].fields.concat(newFields);

    // insert default values in existing table
    if (typeof defaultValues !== "undefined") {
      // loop through all the records in the table
      for (var rowIdentifier in storageInstance.data[tableName]) {
        if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
          continue;
        }
        for (var field in newFields) {
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
   * @param {dataFields} data - The data to insert
   * @returns {string|null} The ROW_IDENTIFIER of the inserted row, or null if insertion failed
   */
  function insert(tableName: string, data: dataFields): string | null {
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
   * @param {any[]} [sort] - Array of sort conditions, each one of which is an array with two values
   * @param {string[]} [distinct] - Array of fields whose values have to be unique in the returned rows
   * @returns {staticFields[]} Array of rows matching the query
   */
  function query(
    tableName: string,
    ids: string[],
    start?: number,
    limit?: number,
    sort?: any[],
    distinct?: string[]
  ): staticFields[] {
    tableMissingThrowError(tableName);
    let rowIdentifier = null,
      row = null,
      results: staticFields[] = [];

    for (let i = 0; i < ids.length; i++) {
      rowIdentifier = ids[i];
      row = storageInstance.data[tableName][rowIdentifier];
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
        const seen: { [key: string]: number } = {};
        const d = distinct[j];

        for (let i = 0; i < results.length; i++) {
          if (results[i] === undefined) {
            continue;
          }

          if (
            results[i].hasOwnProperty(d) &&
            seen.hasOwnProperty(results[i][d])
          ) {
            delete results[i];
          } else {
            seen[results[i][d]] = 1;
          }
        }
      }

      // Filter out undefined values
      results = results.filter(
        (item): item is staticFields => item !== undefined
      );
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
   * Sort a result set by a specific field
   * @param {string} field - The field to sort by
   * @param {string} [order] - The sort order (ASC or DESC)
   * @returns {Function} A comparison function for sorting
   */
  function sortResults(
    field: string,
    order?: string
  ): (x: staticFields, y: staticFields) => number {
    return function (x: staticFields, y: staticFields): number {
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
   * Select rows in a table by field-value pairs, returns the ROW_IDENTIFIERs of matches
   * @param {string} tableName - The name of the table
   * @param {dataFields} data - Object with field-value pairs to match
   * @param {number} [limit] - The maximum number of rows to be returned
   * @param {number} [start] - The number of rows to skip from the beginning (offset)
   * @returns {string[]} Array of ROW_IDENTIFIERs matching the query
   */
  function queryByValues(
    tableName: string,
    data: dataFields,
    limit?: number,
    start?: number
  ): string[] {
    let resultIds: string[] = [];
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
        resultIds.push(rowIdentifier);
      }
    }
    if (limit) {
      resultIds = resultIds.slice(start, start + limit);
    } else if (start) {
      resultIds = resultIds.slice(start);
    }

    return resultIds;
  }

  // select rows in a table by a function, returns the ROW_IDENTIFIERs of matches
  function queryByFunction(
    tableName: string,
    queryFunction: updateCallbackFilter,
    limit?: number,
    start?: number
  ): string[] {
    let resultIds: string[] = [];
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        continue;
      }

      row = storageInstance.data[tableName][rowIdentifier];

      if (queryFunction(clone(row)) === true) {
        // it's a match if the supplied conditional function is satisfied
        resultIds.push(rowIdentifier);
      }
    }
    if (limit) {
      resultIds = resultIds.slice(start, start + limit);
    } else if (start) {
      resultIds = resultIds.slice(start);
    }
    return resultIds;
  }

  /**
   * Returns all the ROW_IDENTIFIERs in a table.
   * @param {string} tableName - The name of the table
   * @param {number} limit - The maximum number of ROW_IDENTIFIERs to return
   * @param {number} start - The starting index of the ROW_IDENTIFIERs to return
   * @returns {string[]} Array of ROW_IDENTIFIERs
   */
  function getRowIdentifiers(
    tableName: string,
    limit?: number,
    start?: number
  ): string[] {
    let resultIds: string[] = [];

    for (const rowIdentifier in storageInstance.data[tableName]) {
      if (storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
        resultIds.push(rowIdentifier);
      }
    }

    if (limit) {
      resultIds = resultIds.slice(start, start + limit);
    } else if (start) {
      resultIds = resultIds.slice(start);
    }
    return resultIds;
  }

  /**
   * Deletes rows, given a list of their ROW_IDENTIFIERs in a table
   * @param tableName
   * @param ids
   * @returns
   */
  function deleteRows(tableName: string, ids: string[]): number {
    for (let i = 0; i < ids.length; i++) {
      if (storageInstance.data[tableName].hasOwnProperty(ids[i])) {
        delete storageInstance.data[tableName][ids[i]];
      }
    }
    return ids.length;
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
    updateFunction: updateCallback
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
   * @param {string} tableName - The name of the table
   * @param {dataFields | updateCallbackFilter | null} query - The query to match rows
   * @param {dataFields} data - The data to insert or update
   * @returns {string[] | null} Array of ROW_IDENTIFIERs of the updated rows
   */
  function upsertOrUpdate(
    tableName: string,
    query: dataFields | updateCallbackFilter | null,
    data: dataFields
  ) {
    return upsert(tableName, query, data);
  }

  // insert or update based on a given condition
  function upsert(
    tableName: string,
    query: dataFields | updateCallbackFilter | null,
    data: dataFields
  ): string[] | null {
    tableMissingThrowError(tableName);

    let resultIds: string[] = [];
    if (!query) {
      resultIds = getRowIdentifiers(tableName); // there is no query. applies to all records
    } else if (typeof query === "object") {
      // the query has key-value pairs provided
      resultIds = queryByValues(tableName, validFields(tableName, query));
    } else if (typeof query === "function") {
      // the query has a conditional map function provided
      resultIds = queryByFunction(tableName, query);
    }

    // no existing records matched, so insert a new row
    if (resultIds.length === 0) {
      const insertedId = insert(tableName, validateData(tableName, data));
      return insertedId ? [insertedId] : null;
    } else {
      const ids: string[] = [];
      update(tableName, resultIds, function (o) {
        if (typeof o.ROW_IDENTIFIER === "string") {
          ids.push(o.ROW_IDENTIFIER);
        }
        return data;
      });

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
   * Clones an object.
   * @param obj - The object to clone.
   * @returns The cloned object.
   */
  function clone<T extends staticFields>(obj: T): T {
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
   * @param data - The data to validate.
   * @returns The validated data.
   */
  function validFields(tableName: string, data: dataFields): dataFields {
    let field = "";
    const newData: dataFields = {};

    for (field in data) {
      const index = storageInstance.tables[tableName].fields.indexOf(field);
      if (index === -1) {
        handleError("Invalid query parameter: " + field);
      }
      newData[field] = data[field];
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
  function validateData(tableName: string, data: dataFields): dataFields {
    let field = "";
    const newData: dataFields = {};
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
    insert,
    upsert,
    upsertOrUpdate,
    update,
    deleteRows,
  };
}

// Export for TypeScript modules
export default clientStore;
