/**
 * Callback function to update a row in a table.
 * @param object - The row to update.
 * @returns The updated row.
 */
declare type updateCallback = (object: staticFields) => dynamicFields;

/**
 * Callback function to filter rows in a table.
 * @param object - The row to filter.
 * @returns True if the row should be included, false otherwise.
 */
declare type updateCallbackFilter = (object: staticFields) => boolean;

/** Fields that are not static but are specified at time of table creation and column definition */
interface dynamicFields {
  [T: string]: any;
}

/** Full set of static fields that comprise a given table definition
 * The ROW_IDENTIFIER field is used to identify a row in the database.
 * The other fields are the fields that comprise a given table definition.
 */
interface staticFields extends dynamicFields {
  ROW_IDENTIFIER: string;
}

interface queryParams {
  query?: { [T: string]: any }; // - query is either an object literal or null. If query is not supplied, all rows are returned
  limit?: number; // - limit is the maximum number of rows to be returned
  start?: number; // - start is the number of rows to be skipped from the beginning (offset)
  sort?: { [T: string]: any }[]; // - sort is an array of sort conditions, each one of which is an array in itself with two values
  distinct?: string[]; // - distinct is an array of fields whose values have to be unique in the returned rows
}

/**
 * Provides client side database functionality using localStorage or sessionStorage.
 */
declare class clientDB {
  constructor(databaseName: string, storageEngine?: Storage); // Constructor: storageEngine can either be localStorage (default) or sessionStorage
  isNew(): boolean; // Returns true if a database was created at the time of initialisation with the constructor
  drop(): void; // Deletes a database, and purges it from localStorage
  getItem(key: string): string; // Retrieve specified value from localStorage
  replace(json: string): void; // Replaced entire contents of localStorage database with passed in json
  setItem(key: string, value: string): void; // Set value for localStorage
  tableCount(): number; // Returns the number of tables in a database
  commit(): boolean; // Commits the database to localStorage. Returns true if successful, and false otherwise (highly unlikely)
  serialize(): string; // Returns the entire database as serialized JSON
  tableExists(tableName: string): boolean; // Checks whether a table exists in the database
  tableFields(tableName: string): string[]; // Returns the list of fields of a table
  createTable(tableName: string, fields: string[]); // Creates a table - fields is an array of string fieldnames. 'ROW_IDENTIFIER' is a reserved fieldname.
  createTableWithData(tableName: string, rows: { [T: string]: any }[]);
  /*
	 Creates a table and populates it
	 rows is an array of object literals where each object represents a record
	 [{field1: val, field2: val}, {field1: val, field2: val}]
	 */
  alterTable(
    tableName: string,
    newFields: string[] | string,
    defaultValues: dynamicFields | string
  );
  /*
	 Alter a table
	 - newFields can be a array of columns OR a string of single column.
	 - defaultValues (optional) can be a object of column's default values OR a default value string for single column for existing rows.
	 */
  dropTable(tableName: string): void; // Deletes a table from the database
  truncate(tableName: string): void; // Empties all records in a table and resets the internal auto increment ROW_IDENTIFIER to 0
  columnExists(tableName: string, fieldName: string): boolean; // Checks whether a column exists in database table.
  rowCount(tableName: string): number; // Returns the number of rows in a table
  insert(tableName: string, data: { [T: string]: any }): number;
  /* 
	 Returns an array of rows (object literals) from a table matching the query.
	 - query is either an object literal or null. If query is not supplied, all rows are returned
	 - limit is the maximum number of rows to be returned
	 - start is the number of rows to be skipped from the beginning (offset)
	 - sort is an array of sort conditions, each one of which is an array in itself with two values
	 - distinct is an array of fields whose values have to be unique in the returned rows
	 Every returned row will have it's internal auto-incremented row identifier assigned to the variable ROW_IDENTIFIER
	 */
  queryAll(tableName: string, params?: queryParams): staticFields[];
  /*
	 Returns an array of rows (object literals) from a table matching the query.
	 - query is either an object literal or null. If query is not supplied, all rows are returned
	 - limit is the maximum number of rows to be returned
	 - start is the number of rows to be skipped from the beginning (offset)
	 - sort is an array of sort conditions, each one of which is an array in itself with two values
	 - distinct is an array of fields whose values have to be unique in the returned rows
	 Every returned row will have it's internal auto-incremented row identifier assigned to the variable ROW_IDENTIFIER
	 */
  update(
    tableName: string,
    query: dynamicFields | updateCallbackFilter,
    updateFunction?: updateCallback
  ): number;
  /*
	 Updates existing records in a table matching query, and returns the number of rows affected
	 - query is an object literal or a function. If query is not supplied, all rows are updated
	 - updateFunction is a function that returns an object literal with the updated values
	 */
  insertOrUpdate(
    tableName: string,
    query: dynamicFields | updateCallbackFilter,
    data: dynamicFields
  ): number;
  /*
	 Inserts a row into a table if the given query matches no results, or updates the rows matching the query.
	 - query is either an object literal, function, or null.
	 - data is an object literal with field-values
	 Returns the numerical ROW_IDENTIFIER if a new row was inserted, or an array of IDs if rows were updated
	 */
  deleteRows(
    tableName: string,
    query: dynamicFields | updateCallbackFilter
  ): number;
  /*
	 Deletes rows from a table matching query, and returns the number of rows deleted
	 - query is either an object literal or a function. If query is not supplied, all rows are deleted
	 */
}

/**
 * Provides client side database functionality using localStorage or sessionStorage.
 *
 * @param dbName - The name of the database.
 * @param storageEngine - The storage engine to use (localStorage or sessionStorage). Defaults to localStorage.
 */
function clientDB(dbName: string, storageEngine?: Storage): any {
  const dbPrefix = "db_";
  const dbId = dbPrefix + dbName;
  let dbNew = false; // this flag determines whether a new database was created during an object initialisation
  let db = null;
  const storage =
    storageEngine === sessionStorage
      ? window.sessionStorage
      : window.localStorage;

  // if the database doesn't exist, create it
  db = storage[dbId];
  if (!(db && (db = JSON.parse(db)) && db.tables && db.data)) {
    if (!validateName(dbName)) {
      error("The name '" + dbName + "' contains invalid characters");
    } else {
      db = { tables: {}, data: {} };
      commit();
      dbNew = true;
    }
  }

  // ______________________ private methods

  // _________ database functions
  // drop the database
  function drop(): void {
    if (storage.hasOwnProperty(dbId)) {
      delete storage[dbId];
    }
    db = null;
  }

  function getItem(key: string): string | null {
    try {
      return storage.storage[key];
    } catch (e) {
      return null;
    }
  }

  function replace(data: string): void {
    setItem(dbId, data);
  }

  function setItem(key: string, value: string): boolean {
    try {
      storage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  // number of tables in the database
  function tableCount(): number {
    let count = 0;
    for (const table in db.tables) {
      if (db.tables.hasOwnProperty(table)) {
        count++;
      }
    }
    return count;
  }

  // _________ table functions

  // returns all fields in a table.
  function tableFields(tableName: string): string[] {
    return db.tables[tableName].fields;
  }

  // check whether a table exists
  function tableExists(tableName: string): boolean {
    return db.tables[tableName] ? true : false;
  }

  // check whether a table exists, and if not, throw an error
  function tableExistsWarn(tableName: string): void {
    if (!tableExists(tableName)) {
      error("The table '" + tableName + "' does not exist");
    }
  }

  // check whether a table column exists
  function columnExists(tableName: string, fieldName: string): boolean {
    let exists = false;
    const tableFields = db.tables[tableName].fields;
    for (const field in tableFields) {
      if (tableFields[field] === fieldName) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  // create a table
  function createTable(tableName: string, fields: string[]): void {
    db.tables[tableName] = { fields: fields, auto_increment: 1 };
    db.data[tableName] = {};
  }

  // drop a table
  function dropTable(tableName: string): void {
    delete db.tables[tableName];
    delete db.data[tableName];
  }

  // empty a table
  function truncate(tableName: string): void {
    db.tables[tableName].auto_increment = 1;
    db.data[tableName] = {};
  }

  //alter a table
  function alterTable(
    tableName: string,
    newFields: string[],
    defaultValues?: dynamicFields | string
  ): void {
    db.tables[tableName].fields = db.tables[tableName].fields.concat(newFields);

    // insert default values in existing table
    if (typeof defaultValues !== "undefined") {
      // loop through all the records in the table
      for (var rowIdentifier in db.data[tableName]) {
        if (!db.data[tableName].hasOwnProperty(rowIdentifier)) {
          continue;
        }
        for (var field in newFields) {
          if (typeof defaultValues === "object") {
            db.data[tableName][rowIdentifier][newFields[field]] =
              defaultValues[newFields[field]];
          } else {
            db.data[tableName][rowIdentifier][newFields[field]] = defaultValues;
          }
        }
      }
    }
  }

  // number of rows in a table
  function rowCount(tableName: string): number {
    let count = 0;
    for (const rowIdentifier in db.data[tableName]) {
      if (db.data[tableName].hasOwnProperty(rowIdentifier)) {
        count++;
      }
    }
    return count;
  }

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

  // insert a row
  function insert(tableName: string, data: dynamicFields): string | null {
    data = validateData(tableName, data);
    if (!data) {
      return null;
    }

    const rowIdentifier = generateId();
    data.ROW_IDENTIFIER = rowIdentifier;
    db.data[tableName][rowIdentifier] = data;
    return rowIdentifier;
  }

  // select rows, given a list of IDs of rows in a table
  function select(
    tableName: string,
    ids: string[],
    start?: number,
    limit?: number,
    sort?: any[],
    distinct?: string[]
  ): staticFields[] {
    let rowIdentifier = null,
      row = null,
      results: staticFields[] = [];

    for (let i = 0; i < ids.length; i++) {
      rowIdentifier = ids[i];
      row = db.data[tableName][rowIdentifier];
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

      // TODO: refactor this, can't use .filter(ie8)
      const new_results: staticFields[] = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i] !== undefined) {
          new_results.push(results[i]);
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

  // sort a result set
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

  // select rows in a table by field-value pairs, returns the IDs of matches
  function queryByValues(
    tableName: string,
    data: dynamicFields,
    limit?: number,
    start?: number
  ): string[] {
    let resultIds: string[] = [];
    let exists = false;
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const rowIdentifier in db.data[tableName]) {
      if (!db.data[tableName].hasOwnProperty(rowIdentifier)) {
        continue;
      }

      row = db.data[tableName][rowIdentifier];
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

  // select rows in a table by a function, returns the IDs of matches
  function queryByFunction(
    tableName: string,
    queryFunction: updateCallbackFilter,
    limit?: number,
    start?: number
  ): string[] {
    let resultIds: string[] = [];
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const rowIdentifier in db.data[tableName]) {
      if (!db.data[tableName].hasOwnProperty(rowIdentifier)) {
        continue;
      }

      row = db.data[tableName][rowIdentifier];

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

  // return all the IDs in a table
  function getIDs(tableName: string, limit?: number, start?: number): string[] {
    let resultIds: string[] = [];

    for (const rowIdentifier in db.data[tableName]) {
      if (db.data[tableName].hasOwnProperty(rowIdentifier)) {
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

  // delete rows, given a list of their IDs in a table
  function deleteRows(tableName: string, ids: string[]): number {
    for (let i = 0; i < ids.length; i++) {
      if (db.data[tableName].hasOwnProperty(ids[i])) {
        delete db.data[tableName][ids[i]];
      }
    }
    return ids.length;
  }

  // update rows
  function update(
    tableName: string,
    ids: string[],
    updateFunction: updateCallback
  ): number {
    let rowIdentifier = "";
    let num = 0;

    for (let i = 0; i < ids.length; i++) {
      rowIdentifier = ids[i];

      const updatedData = updateFunction(
        clone(db.data[tableName][rowIdentifier])
      );

      if (updatedData) {
        delete updatedData["ROW_IDENTIFIER"]; // no updates possible to ROW_IDENTIFIER

        const newData = db.data[tableName][rowIdentifier];
        // merge updated data with existing data
        for (const field in updatedData) {
          if (updatedData.hasOwnProperty(field)) {
            newData[field] = updatedData[field];
          }
        }

        db.data[tableName][rowIdentifier] = validFields(tableName, newData);
        num++;
      }
    }
    return num;
  }

  // commit the database to localStorage
  function commit(): boolean {
    try {
      storage.setItem(dbId, JSON.stringify(db));
      return true;
    } catch (e) {
      return false;
    }
  }

  // serialize the database
  function serialize(): string {
    return JSON.stringify(db);
  }

  // throw an error
  function error(msg: string): never {
    throw new Error(msg);
  }

  // clone an object
  function clone<T extends staticFields>(obj: T): T {
    const new_obj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        new_obj[key] = obj[key];
      }
    }
    return new_obj;
  }

  // validate db, table, field names (alpha-numeric only)
  function validateName(name: string): boolean {
    return name.toString().match(/[^a-z_0-9]/gi) ? false : true;
  }

  // given a data list, only retain valid fields in a table
  function validFields(tableName: string, data: dynamicFields): dynamicFields {
    let field = "";
    const newData: dynamicFields = {};

    for (field in data) {
      const index = db.tables[tableName].fields.indexOf(field);
      if (index === -1) {
        error("Invalid query parameter: " + field);
      }
      newData[field] = data[field];
    }
    return newData;
  }

  // given a data list, populate with valid field names of a table
  function validateData(tableName: string, data: dynamicFields): dynamicFields {
    let field = "";
    const newData: dynamicFields = {};
    for (let i = 0; i < db.tables[tableName].fields.length; i++) {
      field = db.tables[tableName].fields[i];
      newData[field] =
        data[field] === null || data[field] === undefined ? null : data[field];
    }
    return newData;
  }

  // ______________________ public methods

  return {
    // commit the database to localStorage
    commit: function () {
      return commit();
    },

    // is this instance a newly created database?
    isNew: function () {
      return dbNew;
    },

    // delete the database
    drop: function () {
      drop();
    },

    getItem: function (key: string): string | null {
      return getItem(key);
    },

    replace: function (data: string): void {
      replace(data);
    },

    // serialize the database
    serialize: function (): string {
      return serialize();
    },

    // check whether a table exists
    tableExists: function (tableName: string): boolean {
      return tableExists(tableName);
    },

    // list of keys in a table
    tableFields: function (tableName: string): string[] {
      return tableFields(tableName);
    },

    // number of tables in the database
    tableCount: function (): number {
      return tableCount();
    },

    columnExists: function (tableName: string, fieldName: string): boolean {
      return columnExists(tableName, fieldName);
    },

    // create a table
    createTable: function (tableName: string, fields: string[]): boolean {
      let result = false;
      if (!validateName(tableName)) {
        error(
          "The database name '" + tableName + "' contains invalid characters."
        );
      } else if (this.tableExists(tableName)) {
        error("The table name '" + tableName + "' already exists.");
      } else {
        // make sure field names are valid
        let isValid = true;
        let i;
        for (i = 0; i < fields.length; i++) {
          if (!validateName(fields[i])) {
            isValid = false;
            break;
          }
        }

        if (isValid) {
          // cannot use indexOf due to <IE9 incompatibility
          // de-duplicate the field list
          const fieldsLiteral = {};
          for (i = 0; i < fields.length; i++) {
            fieldsLiteral[fields[i]] = true;
          }
          delete fieldsLiteral["ROW_IDENTIFIER"]; // ROW_IDENTIFIER is a reserved field name

          fields = ["ROW_IDENTIFIER"];
          for (const field in fieldsLiteral) {
            if (fieldsLiteral.hasOwnProperty(field)) {
              fields.push(field);
            }
          }

          createTable(tableName, fields);
          result = true;
        } else {
          error(
            "One or more field names in the table definition contains invalid characters"
          );
        }
      }

      return result;
    },

    // Create a table using array of Objects @ [{k:v,k:v},{k:v,k:v},etc]
    createTableWithData: function (
      tableName: string,
      data: dynamicFields[]
    ): boolean {
      if (typeof data !== "object" || !data.length || data.length < 1) {
        error(
          "Data supplied isn't in object form. Example: [{k:v,k:v},{k:v,k:v} ..]"
        );
      }

      const fields = Object.keys(data[0]);

      // create the table
      if (this.createTable(tableName, fields)) {
        this.commit();

        // populate
        for (let i = 0; i < data.length; i++) {
          if (!insert(tableName, data[i])) {
            error("Failed to insert record: [" + JSON.stringify(data[i]) + "]");
          }
        }
        this.commit();
      }
      return true;
    },

    // drop a table
    dropTable: function (tableName: string): void {
      tableExistsWarn(tableName);
      dropTable(tableName);
    },

    // empty a table
    truncate: function (tableName: string): void {
      tableExistsWarn(tableName);
      truncate(tableName);
    },

    // alter a table
    alterTable: function (
      tableName: string,
      newFields: string[],
      defaultValues?: dynamicFields
    ): boolean {
      let result = false;
      if (!validateName(tableName)) {
        error(
          "The database name '" + tableName + "' contains invalid characters"
        );
      } else {
        if (typeof newFields === "object") {
          // make sure field names are valid
          let isValid = true;
          let i;
          for (i = 0; i < newFields.length; i++) {
            if (!validateName(newFields[i])) {
              isValid = false;
              break;
            }
          }

          if (isValid) {
            // cannot use indexOf due to <IE9 incompatibility
            // de-duplicate the field list
            const fieldsLiteral = {};
            for (i = 0; i < newFields.length; i++) {
              fieldsLiteral[newFields[i]] = true;
            }
            delete fieldsLiteral["ROW_IDENTIFIER"]; // ROW_IDENTIFIER is a reserved field name

            newFields = [];
            for (const field in fieldsLiteral) {
              if (fieldsLiteral.hasOwnProperty(field)) {
                newFields.push(field);
              }
            }

            alterTable(tableName, newFields, defaultValues);
            result = true;
          } else {
            error(
              "One or more field names in the table definition contains invalid characters"
            );
          }
        } else if (typeof newFields === "string") {
          if (validateName(newFields)) {
            const newFieldsArray = [];
            newFieldsArray.push(newFields);
            alterTable(tableName, newFieldsArray, defaultValues);
            result = true;
          } else {
            error(
              "One or more field names in the table definition contains invalid characters"
            );
          }
        }
      }

      return result;
    },

    // number of rows in a table
    rowCount: function (tableName: string): number {
      tableExistsWarn(tableName);
      return rowCount(tableName);
    },

    // insert a row
    insert: function (tableName: string, data: dynamicFields): string | null {
      tableExistsWarn(tableName);
      return insert(tableName, validateData(tableName, data));
    },

    // insert or update based on a given condition
    insertOrUpdate: function (
      tableName: string,
      query: dynamicFields | updateCallbackFilter | null,
      data: dynamicFields
    ): string[] | null {
      tableExistsWarn(tableName);

      let resultIds: string[] = [];
      if (!query) {
        resultIds = getIDs(tableName); // there is no query. applies to all records
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
    },

    // update rows
    update: function (
      tableName: string,
      query: dynamicFields | updateCallbackFilter | null,
      updateFunction: updateCallback
    ): number {
      tableExistsWarn(tableName);

      let resultIds: string[] = [];
      if (!query) {
        resultIds = getIDs(tableName); // there is no query. applies to all records
      } else if (typeof query === "object") {
        // the query has key-value pairs provided
        resultIds = queryByValues(tableName, validFields(tableName, query));
      } else if (typeof query === "function") {
        // the query has a conditional map function provided
        resultIds = queryByFunction(tableName, query);
      }
      return update(tableName, resultIds, updateFunction);
    },

    // select rows
    queryPagedSorted: function (
      tableName: string,
      query?: dynamicFields | updateCallbackFilter | null,
      limit?: number,
      start?: number,
      sort?: any[],
      distinct?: string[]
    ): staticFields[] {
      tableExistsWarn(tableName);

      let resultIds: string[] = [];
      if (!query) {
        resultIds = getIDs(tableName, limit, start); // no conditions given, return all records
      } else if (typeof query === "object") {
        // the query has key-value pairs provided
        resultIds = queryByValues(
          tableName,
          validFields(tableName, query),
          limit,
          start
        );
      } else if (typeof query === "function") {
        // the query has a conditional map function provided
        resultIds = queryByFunction(tableName, query, limit, start);
      }

      return select(tableName, resultIds, start, limit, sort, distinct);
    },

    // alias for queryPagedSorted() that takes a dict of params instead of positional arrguments
    queryAll: function (
      tableName: string,
      params?: queryParams
    ): staticFields[] {
      if (!params) {
        return this.queryPagedSorted(tableName);
      } else {
        return this.queryPagedSorted(
          tableName,
          params.hasOwnProperty("query") ? params.query : null,
          params.hasOwnProperty("limit") ? params.limit : null,
          params.hasOwnProperty("start") ? params.start : null,
          params.hasOwnProperty("sort") ? params.sort : null,
          params.hasOwnProperty("distinct") ? params.distinct : null
        );
      }
    },

    // delete rows
    deleteRows: function (
      tableName: string,
      query?: dynamicFields | updateCallbackFilter | null
    ): number {
      tableExistsWarn(tableName);

      let resultIds: string[] = [];
      if (!query) {
        resultIds = getIDs(tableName);
      } else if (typeof query === "object") {
        resultIds = queryByValues(tableName, validFields(tableName, query));
      } else if (typeof query === "function") {
        resultIds = queryByFunction(tableName, query);
      }
      return deleteRows(tableName, resultIds);
    },
  };
}

// Export for TypeScript modules
export default clientDB;
