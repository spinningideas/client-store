declare type localStorageDB_callback = (
  object: localStorageDB_fields
) => localStorageDB_dynamicFields;
declare type localStorageDB_callbackFilter = (
  object: localStorageDB_fields
) => boolean;

declare class localStorageDB {
  constructor(database_name: string, storage_engine?: Storage); // Constructor: storage_engine can either be localStorage (default) or sessionStorage
  isNew(): boolean; // Returns true if a database was created at the time of initialisation with the constructor
  drop(): void; // Deletes a database, and purges it from localStorage
  getItem(key: string): string; // Retrieve specified value from localStorage
  replace(json: string): void; // Replaced entire contents of localStorage database with passed in json
  setItem(key: string, value: string): void; // Set value for localStorage
  tableCount(): number; // Returns the number of tables in a database
  commit(): boolean; // Commits the database to localStorage. Returns true if successful, and false otherwise (highly unlikely)
  serialize(): string; // Returns the entire database as serialized JSON
  tableExists(table: string): boolean; // Checks whether a table exists in the database
  tableFields(table: string): string[]; // Returns the list of fields of a table
  createTable(table: string, fields: string[]); // Creates a table - fields is an array of string fieldnames. 'row_identifier' is a reserved fieldname.
  createTableWithData(table: string, rows: { [T: string]: any }[]);
  /*
	 Creates a table and populates it
	 rows is an array of object literals where each object represents a record
	 [{field1: val, field2: val}, {field1: val, field2: val}]
	 */
  alterTable(
    table: string,
    new_fields: string[] | string,
    default_values: localStorageDB_dynamicFields | string
  );
  /*
	 Alter a table
	 - new_fields can be a array of columns OR a string of single column.
	 - default_values (optional) can be a object of column's default values OR a default value string for single column for existing rows.
	 */
  dropTable(table: string): void; // Deletes a table from the database
  truncate(table: string): void; // Empties all records in a table and resets the internal auto increment row_identifier to 0
  columnExists(table: string, field: string): boolean; // Checks whether a column exists in database table.
  rowCount(table: string): number; // Returns the number of rows in a table
  insert(table: string, data: { [T: string]: any }): number;
  /*
	 Inserts a row into a table and returns its numerical row_identifier
	 - data is an object literal with field-values
	 every row is assigned an auto-incremented numerical row_identifier automatically
	 */
  query(
    table: string,
    query?: { [T: string]: any },
    limit?: number,
    start?: number,
    sort?: any
  ): localStorageDB_fields[];
  /* DEPRECATED
	 Returns an array of rows (object literals) from a table matching the query.
	 - query is either an object literal or null. If query is not supplied, all rows are returned
	 - limit is the maximum number of rows to be returned
	 - start is the number of rows to be skipped from the beginning (offset)
	 - sort is an array of sort conditions, each one of which is an array in itself with two values
	 - distinct is an array of fields whose values have to be unique in the returned rows
	 Every returned row will have it's internal auto-incremented row identifier assigned to the variable row_identifier
	 */
  queryAll(
    table: string,
    params: localStorageDB_queryParams
  ): localStorageDB_fields[];
  /*
	 Returns an array of rows (object literals) from a table matching the query.
	 - query is either an object literal or null. If query is not supplied, all rows are returned
	 - limit is the maximum number of rows to be returned
	 - start is the number of rows to be skipped from the beginning (offset)
	 - sort is an array of sort conditions, each one of which is an array in itself with two values
	 - distinct is an array of fields whose values have to be unique in the returned rows
	 Every returned row will have it's internal auto-incremented row identifier assigned to the variable row_identifier
	 */
  update(
    table: string,
    query: localStorageDB_dynamicFields | localStorageDB_callbackFilter,
    update?: localStorageDB_callback
  ): number;
  /*
	 Updates existing records in a table matching query, and returns the number of rows affected
	 - query is an object literal or a function. If query is not supplied, all rows are updated
	 - update_function is a function that returns an object literal with the updated values
	 */
  insertOrUpdate(
    table: string,
    query: localStorageDB_dynamicFields | localStorageDB_callbackFilter,
    data: localStorageDB_fields
  ): number;
  /*
	 Inserts a row into a table if the given query matches no results, or updates the rows matching the query.
	 - query is either an object literal, function, or null.
	 - data is an object literal with field-values
	 Returns the numerical row_identifier if a new row was inserted, or an array of IDs if rows were updated
	 */
  deleteRows(
    table: string,
    query: localStorageDB_dynamicFields | localStorageDB_callbackFilter
  ): number;
  /*
	 Deletes rows from a table matching query, and returns the number of rows deleted
	 - query is either an object literal or a function. If query is not supplied, all rows are deleted
	 */
}

interface localStorageDB_fields extends localStorageDB_dynamicFields {
  row_identifier: string;
}

interface localStorageDB_dynamicFields {
  [T: string]: any;
}

interface localStorageDB_queryParams {
  query?: { [T: string]: any }; // - query is either an object literal or null. If query is not supplied, all rows are returned
  limit?: number; // - limit is the maximum number of rows to be returned
  start?: number; // - start is the number of rows to be skipped from the beginning (offset)
  sort?: { [T: string]: any }[]; // - sort is an array of sort conditions, each one of which is an array in itself with two values
  distinct?: string[]; // - distinct is an array of fields whose values have to be unique in the returned rows
}

/*
	Kailash Nadh (http://nadh.in)

	localStorageDB v 2.3.2
	A simple database layer for localStorage

    v 2.3.2 Mar 2018 Contribution: Ken Kohler
	v 2.3.1 Mar 2015
	v 2.3 Feb 2014 Contribution: Christian Kellner (http://orange-coding.net)
	v 2.2 Jan 2014 Contribution: Andy Hawkins (http://a904guy.com) 
	v 2.1 Nov 2013
	v 2.0 June 2013
	v 1.9 Nov 2012

	License	:	MIT License
*/

function localStorageDB(db_name: string, engine?: Storage): any {
  const db_prefix = "db_";
  const db_id = db_prefix + db_name;
  let db_new = false; // this flag determines whether a new database was created during an object initialisation
  let db = null;

  let storage;
  try {
    storage =
      engine === sessionStorage ? window.sessionStorage : window.localStorage;
  } catch (e) {
    // ie8 hack
    storage = engine;
  }

  // if the database doesn't exist, create it
  db = storage[db_id];
  if (!(db && (db = JSON.parse(db)) && db.tables && db.data)) {
    if (!validateName(db_name)) {
      error("The name '" + db_name + "' contains invalid characters");
    } else {
      db = { tables: {}, data: {} };
      commit();
      db_new = true;
    }
  }

  // ______________________ private methods

  // _________ database functions
  // drop the database
  function drop(): void {
    if (storage.hasOwnProperty(db_id)) {
      delete storage[db_id];
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
    setItem(db_id, data);
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
  function tableFields(table_name: string): string[] {
    return db.tables[table_name].fields;
  }

  // check whether a table exists
  function tableExists(table_name: string): boolean {
    return db.tables[table_name] ? true : false;
  }

  // check whether a table exists, and if not, throw an error
  function tableExistsWarn(table_name: string): void {
    if (!tableExists(table_name)) {
      error("The table '" + table_name + "' does not exist");
    }
  }

  // check whether a table column exists
  function columnExists(table_name: string, field_name: string): boolean {
    let exists = false;
    const table_fields = db.tables[table_name].fields;
    for (const field in table_fields) {
      if (table_fields[field] === field_name) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  // create a table
  function createTable(table_name: string, fields: string[]): void {
    db.tables[table_name] = { fields: fields, auto_increment: 1 };
    db.data[table_name] = {};
  }

  // drop a table
  function dropTable(table_name: string): void {
    delete db.tables[table_name];
    delete db.data[table_name];
  }

  // empty a table
  function truncate(table_name: string): void {
    db.tables[table_name].auto_increment = 1;
    db.data[table_name] = {};
  }

  //alter a table
  function alterTable(
    table_name: string,
    new_fields: string[],
    default_values?: localStorageDB_dynamicFields | string
  ): void {
    db.tables[table_name].fields =
      db.tables[table_name].fields.concat(new_fields);

    // insert default values in existing table
    if (typeof default_values !== "undefined") {
      // loop through all the records in the table
      for (var row_identifier in db.data[table_name]) {
        if (!db.data[table_name].hasOwnProperty(row_identifier)) {
          continue;
        }
        for (var field in new_fields) {
          if (typeof default_values === "object") {
            db.data[table_name][row_identifier][new_fields[field]] =
              default_values[new_fields[field]];
          } else {
            db.data[table_name][row_identifier][new_fields[field]] =
              default_values;
          }
        }
      }
    }
  }

  // number of rows in a table
  function rowCount(table_name: string): number {
    let count = 0;
    for (const row_identifier in db.data[table_name]) {
      if (db.data[table_name].hasOwnProperty(row_identifier)) {
        count++;
      }
    }
    return count;
  }

  // Generate a UUID
  function uuid(): string {
    // Simple UUID generation for this implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // insert a row
  function insert(table_name: string, data: localStorageDB_dynamicFields): string | null {
    data = validateData(table_name, data);
    if (!data) {
      return null;
    }

    const row_identifier = uuid();
    data.row_identifier = row_identifier;
    db.data[table_name][row_identifier] = data;
    return row_identifier;
  }

  // select rows, given a list of IDs of rows in a table
  function select(
    table_name: string,
    ids: string[],
    start?: number,
    limit?: number,
    sort?: any[],
    distinct?: string[]
  ): localStorageDB_fields[] {
    let row_identifier = null,
      row = null,
      results: localStorageDB_fields[] = [];

    for (let i = 0; i < ids.length; i++) {
      row_identifier = ids[i];
      row = db.data[table_name][row_identifier];
      results.push(clone(row));
    }

    // there are sorting params
    if (sort && sort instanceof Array) {
      for (let i = 0; i < sort.length; i++) {
        results.sort(
          sort_results(sort[i][0], sort[i].length > 1 ? sort[i][1] : null)
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

      // can't use .filter(ie8)
      const new_results: localStorageDB_fields[] = [];
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
  function sort_results(
    field: string,
    order?: string
  ): (x: localStorageDB_fields, y: localStorageDB_fields) => number {
    return function (
      x: localStorageDB_fields,
      y: localStorageDB_fields
    ): number {
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
    table_name: string,
    data: localStorageDB_dynamicFields,
    limit?: number,
    start?: number
  ): string[] {
    let result_ids: string[] = [];
    let exists = false;
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const row_identifier in db.data[table_name]) {
      if (!db.data[table_name].hasOwnProperty(row_identifier)) {
        continue;
      }

      row = db.data[table_name][row_identifier];
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
        result_ids.push(row_identifier);
      }
    }
    if (limit) {
      result_ids = result_ids.slice(start, start + limit);
    } else if (start) {
      result_ids = result_ids.slice(start);
    }

    return result_ids;
  }

  // select rows in a table by a function, returns the IDs of matches
  function queryByFunction(
    table_name: string,
    query_function: localStorageDB_callbackFilter,
    limit?: number,
    start?: number
  ): string[] {
    let result_ids: string[] = [];
    let row = null;

    // loop through all the records in the table, looking for matches
    for (const row_identifier in db.data[table_name]) {
      if (!db.data[table_name].hasOwnProperty(row_identifier)) {
        continue;
      }

      row = db.data[table_name][row_identifier];

      if (query_function(clone(row)) === true) {
        // it's a match if the supplied conditional function is satisfied
        result_ids.push(row_identifier);
      }
    }
    if (limit) {
      result_ids = result_ids.slice(start, start + limit);
    } else if (start) {
      result_ids = result_ids.slice(start);
    }
    return result_ids;
  }

  // return all the IDs in a table
  function getIDs(
    table_name: string,
    limit?: number,
    start?: number
  ): string[] {
    let result_ids: string[] = [];

    for (const row_identifier in db.data[table_name]) {
      if (db.data[table_name].hasOwnProperty(row_identifier)) {
        result_ids.push(row_identifier);
      }
    }

    if (limit) {
      result_ids = result_ids.slice(start, start + limit);
    } else if (start) {
      result_ids = result_ids.slice(start);
    }
    return result_ids;
  }

  // delete rows, given a list of their IDs in a table
  function deleteRows(table_name: string, ids: string[]): number {
    for (let i = 0; i < ids.length; i++) {
      if (db.data[table_name].hasOwnProperty(ids[i])) {
        delete db.data[table_name][ids[i]];
      }
    }
    return ids.length;
  }

  // update rows
  function update(table_name: string, ids: string[], update_function: localStorageDB_callback): number {
    let row_identifier = "";
    let num = 0;

    for (let i = 0; i < ids.length; i++) {
      row_identifier = ids[i];

      const updated_data = update_function(
        clone(db.data[table_name][row_identifier])
      );

      if (updated_data) {
        delete updated_data["row_identifier"]; // no updates possible to row_identifier

        const new_data = db.data[table_name][row_identifier];
        // merge updated data with existing data
        for (const field in updated_data) {
          if (updated_data.hasOwnProperty(field)) {
            new_data[field] = updated_data[field];
          }
        }

        db.data[table_name][row_identifier] = validFields(table_name, new_data);
        num++;
      }
    }
    return num;
  }

  // commit the database to localStorage
  function commit(): boolean {
    try {
      storage.setItem(db_id, JSON.stringify(db));
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
  function clone<T extends localStorageDB_fields>(obj: T): T {
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
  function validFields(table_name: string, data: localStorageDB_dynamicFields): localStorageDB_dynamicFields {
    let field = "";
    const new_data: localStorageDB_dynamicFields = {};

    for (field in data) {
      const index = db.tables[table_name].fields.indexOf(field);
      if (index === -1) {
        error("Invalid query parameter: " + field);
      }
      new_data[field] = data[field];
    }
    return new_data;
  }

  // given a data list, populate with valid field names of a table
  function validateData(table_name: string, data: localStorageDB_dynamicFields): localStorageDB_dynamicFields {
    let field = "";
    const new_data: localStorageDB_dynamicFields = {};
    for (let i = 0; i < db.tables[table_name].fields.length; i++) {
      field = db.tables[table_name].fields[i];
      new_data[field] =
        data[field] === null || data[field] === undefined ? null : data[field];
    }
    return new_data;
  }

  // ______________________ public methods

  return {
    // commit the database to localStorage
    commit: function () {
      return commit();
    },

    // is this instance a newly created database?
    isNew: function () {
      return db_new;
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
    tableExists: function (table_name: string): boolean {
      return tableExists(table_name);
    },

    // list of keys in a table
    tableFields: function (table_name: string): string[] {
      return tableFields(table_name);
    },

    // number of tables in the database
    tableCount: function (): number {
      return tableCount();
    },

    columnExists: function (table_name: string, field_name: string): boolean {
      return columnExists(table_name, field_name);
    },

    // create a table
    createTable: function (table_name: string, fields: string[]): boolean {
      let result = false;
      if (!validateName(table_name)) {
        error(
          "The database name '" + table_name + "' contains invalid characters."
        );
      } else if (this.tableExists(table_name)) {
        error("The table name '" + table_name + "' already exists.");
      } else {
        // make sure field names are valid
        let is_valid = true;
        let i;
        for (i = 0; i < fields.length; i++) {
          if (!validateName(fields[i])) {
            is_valid = false;
            break;
          }
        }

        if (is_valid) {
          // cannot use indexOf due to <IE9 incompatibility
          // de-duplicate the field list
          const fields_literal = {};
          for (i = 0; i < fields.length; i++) {
            fields_literal[fields[i]] = true;
          }
          delete fields_literal["row_identifier"]; // row_identifier is a reserved field name

          fields = ["row_identifier"];
          for (const field in fields_literal) {
            if (fields_literal.hasOwnProperty(field)) {
              fields.push(field);
            }
          }

          createTable(table_name, fields);
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
    createTableWithData: function (table_name: string, data: localStorageDB_dynamicFields[]): boolean {
      if (typeof data !== "object" || !data.length || data.length < 1) {
        error(
          "Data supplied isn't in object form. Example: [{k:v,k:v},{k:v,k:v} ..]"
        );
      }

      const fields = Object.keys(data[0]);

      // create the table
      if (this.createTable(table_name, fields)) {
        this.commit();

        // populate
        for (let i = 0; i < data.length; i++) {
          if (!insert(table_name, data[i])) {
            error("Failed to insert record: [" + JSON.stringify(data[i]) + "]");
          }
        }
        this.commit();
      }
      return true;
    },

    // drop a table
    dropTable: function (table_name: string): void {
      tableExistsWarn(table_name);
      dropTable(table_name);
    },

    // empty a table
    truncate: function (table_name: string): void {
      tableExistsWarn(table_name);
      truncate(table_name);
    },

    // alter a table
    alterTable: function (table_name: string, new_fields: string[], default_values?: localStorageDB_dynamicFields): boolean {
      let result = false;
      if (!validateName(table_name)) {
        error(
          "The database name '" + table_name + "' contains invalid characters"
        );
      } else {
        if (typeof new_fields === "object") {
          // make sure field names are valid
          let is_valid = true;
          let i;
          for (i = 0; i < new_fields.length; i++) {
            if (!validateName(new_fields[i])) {
              is_valid = false;
              break;
            }
          }

          if (is_valid) {
            // cannot use indexOf due to <IE9 incompatibility
            // de-duplicate the field list
            const fields_literal = {};
            for (i = 0; i < new_fields.length; i++) {
              fields_literal[new_fields[i]] = true;
            }
            delete fields_literal["row_identifier"]; // row_identifier is a reserved field name

            new_fields = [];
            for (const field in fields_literal) {
              if (fields_literal.hasOwnProperty(field)) {
                new_fields.push(field);
              }
            }

            alterTable(table_name, new_fields, default_values);
            result = true;
          } else {
            error(
              "One or more field names in the table definition contains invalid characters"
            );
          }
        } else if (typeof new_fields === "string") {
          if (validateName(new_fields)) {
            const new_fields_array = [];
            new_fields_array.push(new_fields);
            alterTable(table_name, new_fields_array, default_values);
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
    rowCount: function (table_name: string): number {
      tableExistsWarn(table_name);
      return rowCount(table_name);
    },

    // insert a row
    insert: function (table_name: string, data: localStorageDB_dynamicFields): string | null {
      tableExistsWarn(table_name);
      return insert(table_name, validateData(table_name, data));
    },

    // insert or update based on a given condition
    insertOrUpdate: function (table_name: string, query: localStorageDB_dynamicFields | localStorageDB_callbackFilter | null, data: localStorageDB_dynamicFields): string[] | null {
      tableExistsWarn(table_name);

      let result_ids: string[] = [];
      if (!query) {
        result_ids = getIDs(table_name); // there is no query. applies to all records
      } else if (typeof query === "object") {
        // the query has key-value pairs provided
        result_ids = queryByValues(table_name, validFields(table_name, query));
      } else if (typeof query === "function") {
        // the query has a conditional map function provided
        result_ids = queryByFunction(table_name, query);
      }

      // no existing records matched, so insert a new row
      if (result_ids.length === 0) {
        const insertedId = insert(table_name, validateData(table_name, data));
        return insertedId ? [insertedId] : null;
      } else {
        const ids: string[] = [];
        update(table_name, result_ids, function (o) {
          if (typeof o.row_identifier === 'string') {
            ids.push(o.row_identifier);
          }
          return data;
        });

        return ids;
      }
    },

    // update rows
    update: function (table_name: string, query: localStorageDB_dynamicFields | localStorageDB_callbackFilter | null, update_function: localStorageDB_callback): number {
      tableExistsWarn(table_name);

      let result_ids: string[] = [];
      if (!query) {
        result_ids = getIDs(table_name); // there is no query. applies to all records
      } else if (typeof query === "object") {
        // the query has key-value pairs provided
        result_ids = queryByValues(table_name, validFields(table_name, query));
      } else if (typeof query === "function") {
        // the query has a conditional map function provided
        result_ids = queryByFunction(table_name, query);
      }
      return update(table_name, result_ids, update_function);
    },

    // select rows
    query: function (table_name: string, query?: localStorageDB_dynamicFields | localStorageDB_callbackFilter | null, limit?: number, start?: number, sort?: any[], distinct?: string[]): localStorageDB_fields[] {
      tableExistsWarn(table_name);

      let result_ids: string[] = [];
      if (!query) {
        result_ids = getIDs(table_name, limit, start); // no conditions given, return all records
      } else if (typeof query === "object") {
        // the query has key-value pairs provided
        result_ids = queryByValues(
          table_name,
          validFields(table_name, query),
          limit,
          start
        );
      } else if (typeof query === "function") {
        // the query has a conditional map function provided
        result_ids = queryByFunction(table_name, query, limit, start);
      }

      return select(table_name, result_ids, start, limit, sort, distinct);
    },

    // alias for query() that takes a dict of params instead of positional arrguments
    queryAll: function (table_name: string, params?: localStorageDB_queryParams): localStorageDB_fields[] {
      if (!params) {
        return this.query(table_name);
      } else {
        return this.query(
          table_name,
          params.hasOwnProperty("query") ? params.query : null,
          params.hasOwnProperty("limit") ? params.limit : null,
          params.hasOwnProperty("start") ? params.start : null,
          params.hasOwnProperty("sort") ? params.sort : null,
          params.hasOwnProperty("distinct") ? params.distinct : null
        );
      }
    },

    // delete rows
    deleteRows: function (table_name: string, query?: localStorageDB_dynamicFields | localStorageDB_callbackFilter | null): number {
      tableExistsWarn(table_name);

      let result_ids: string[] = [];
      if (!query) {
        result_ids = getIDs(table_name);
      } else if (typeof query === "object") {
        result_ids = queryByValues(table_name, validFields(table_name, query));
      } else if (typeof query === "function") {
        result_ids = queryByFunction(table_name, query);
      }
      return deleteRows(table_name, result_ids);
    },
  };
}

// Export for TypeScript modules
export default localStorageDB;
