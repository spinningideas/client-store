/*
adapted from: https://github.com/knadh/localStorageDB

Kailash Nadh (http://nadh.in)

localStorageDB v 2.3.1
A simple database layer for localStorage

v 2.3.1 Mar 2015
v 2.3 Feb 2014 Contribution: Christian Kellner (http://orange-coding.net)
v 2.2 Jan 2014 Contribution: Andy Hawkins (http://a904guy.com)
v 2.1 Nov 2013
v 2.0 June 2013
v 1.9 Nov 2012

License	:	MIT License
*/
export class localStorageDB {
  public db_name: string;
  public db_prefix: string = "db_";
  public db_id: string;
  public db_new: boolean = false; // this flag determines whether a new database was created during an object initialisation
  public db: any;
  public storage: any;

  constructor(db_name: string) {
    this.db_name = db_name;
    this.db_id = this.db_prefix + this.db_name;
    this.db_new = false;
    this.db = null;

    this.storage = window.localStorage;

    // if the database doesn't exist, create it
    this.db = this.storage[this.db_id];
    if (
      !(
        this.db &&
        (this.db = JSON.parse(this.db)) &&
        this.db.tables &&
        this.db.data
      )
    ) {
      if (!this._validateName(this.db_name)) {
        this.error(
          "The name '" + this.db_name + "' contains invalid characters"
        );
      } else {
        this.db = { tables: {}, data: {} };
        this.commit();
        this.db_new = true;
      }
    }
  }

  // PRIVATE METHODS

  // database Admin

  // drop the database
  private _drop() {
    if (this.storage.hasOwnProperty(this.db_id)) {
      delete this.storage[this.db_id];
    }
    this.db = null;
  }

  // number of tables in the database
  private _tableCount() {
    let count = 0;
    for (let table in this.db.tables) {
      if (this.db.tables.hasOwnProperty(table)) {
        count++;
      }
    }
    return count;
  }

  // tABLES

  // returns all fields in a table.
  private _tableFields(table_name) {
    return this.db.tables[table_name].fields;
  }

  // check whether a table exists
  private _tableExists(table_name) {
    return this.db.tables[table_name] ? true : false;
  }

  // check whether a table exists, and if not, throw an error
  private _tableExistsWarn(table_name) {
    if (!this.tableExists(table_name)) {
      this.error("The table '" + table_name + "' does not exist");
    }
  }

  // check whether a table column exists
  private _columnExists(table_name, field_name) {
    let exists = false;
    let table_fields = this.db.tables[table_name].fields;
    for (let field in table_fields) {
      if (table_fields[field] === field_name) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  // create a table
  private _createTable(table_name, fields) {
    this.db.tables[table_name] = { fields: fields, auto_increment: 1 };
    this.db.data[table_name] = {};
  }

  // drop a table
  private _dropTable(table_name) {
    delete this.db.tables[table_name];
    delete this.db.data[table_name];
  }

  // empty a table
  private _truncate(table_name) {
    this.db.tables[table_name].auto_increment = 1;
    this.db.data[table_name] = {};
  }

  // alter a table
  private _alterTable(table_name, new_fields, default_values) {
    this.db.tables[table_name].fields =
      this.db.tables[table_name].fields.concat(new_fields);

    // insert default values in existing table
    if (typeof default_values !== "undefined") {
      // loop through all the records in the table
      for (let ID in this.db.data[table_name]) {
        if (!this.db.data[table_name].hasOwnProperty(ID)) {
          continue;
        }
        for (let field in new_fields) {
          if (typeof default_values === "object") {
            this.db.data[table_name][ID][new_fields[field]] =
              default_values[new_fields[field]];
          } else {
            this.db.data[table_name][ID][new_fields[field]] = default_values;
          }
        }
      }
    }
  }

  // number of rows in a table
  private _rowCount(table_name) {
    let count = 0;
    for (let ID in this.db.data[table_name]) {
      if (this.db.data[table_name].hasOwnProperty(ID)) {
        count++;
      }
    }
    return count;
  }

  // insert a new row
  private _insert(table_name, data) {
    data.ID = this.db.tables[table_name].auto_increment;
    this.db.data[table_name][this.db.tables[table_name].auto_increment] = data;
    this.db.tables[table_name].auto_increment++;
    return data.ID;
  }

  // select rows, given a list of IDs of rows in a table
  private _select(table_name, ids, start, limit, sort, distinct) {
    let ID = null,
      results = [],
      row = null;

    for (let x = 0; x < ids.length; x++) {
      ID = ids[x];
      row = this.db.data[table_name][ID];
      results.push(this._clone(row));
    }

    // there are sorting params
    if (sort && sort instanceof Array) {
      for (let i = 0; i < sort.length; i++) {
        results.sort(
          this._sort_results(sort[i][0], sort[i].length > 1 ? sort[i][1] : null)
        );
      }
    }

    // distinct params
    if (distinct && distinct instanceof Array) {
      for (let j = 0; j < distinct.length; j++) {
        let seen = {},
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

      // can't use .filter(ie8)
      let new_results = [];
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

  // sort a result set
  private _sort_results(field, order) {
    return (x, y) => {
      // case insensitive comparison for string values
      let v1 = typeof x[field] === "string" ? x[field].toLowerCase() : x[field],
        v2 = typeof y[field] === "string" ? y[field].toLowerCase() : y[field];

      if (order === "DESC") {
        return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
      } else {
        return v1 === v2 ? 0 : v1 > v2 ? 1 : -1;
      }
    };
  }

  // select rows in a table by field-value pairs, returns the IDs of matches
  private _queryByValues(table_name, data) {
    let result_ids = [],
      exists = false,
      row = null;

    // loop through all the records in the table, looking for matches
    for (let ID in this.db.data[table_name]) {
      if (!this.db.data[table_name].hasOwnProperty(ID)) {
        continue;
      }

      row = this.db.data[table_name][ID];
      exists = true;

      for (let field in data) {
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
        result_ids.push(ID);
      }
    }

    return result_ids;
  }

  // select rows in a table by a , returns the IDs of matches
  private _queryBy(table_name, query_) {
    let result_ids = [],
      exists = false,
      row = null;

    // loop through all the records in the table, looking for matches
    for (let ID in this.db.data[table_name]) {
      if (!this.db.data[table_name].hasOwnProperty(ID)) {
        continue;
      }

      row = this.db.data[table_name][ID];

      if (query_(this._clone(row)) === true) {
        // it's a match if the supplied conditional  is satisfied
        result_ids.push(ID);
      }
    }

    return result_ids;
  }

  // return all the IDs in a table
  private _getIDs(table_name) {
    let result_ids = [];

    for (let ID in this.db.data[table_name]) {
      if (this.db.data[table_name].hasOwnProperty(ID)) {
        result_ids.push(ID);
      }
    }
    return result_ids;
  }

  // delete rows, given a list of their IDs in a table
  private _deleteRows(table_name, ids) {
    for (let i = 0; i < ids.length; i++) {
      if (this.db.data[table_name].hasOwnProperty(ids[i])) {
        delete this.db.data[table_name][ids[i]];
      }
    }
    return ids.length;
  }

  // update rows
  private _update(table_name, ids, update_) {
    let ID = "",
      num = 0;

    for (let i = 0; i < ids.length; i++) {
      ID = ids[i];

      let updated_data = update_(this._clone(this.db.data[table_name][ID]));

      if (updated_data) {
        delete updated_data["ID"]; // no updates possible to ID

        let new_data = this.db.data[table_name][ID];
        // merge updated data with existing data
        for (let field in updated_data) {
          if (updated_data.hasOwnProperty(field)) {
            new_data[field] = updated_data[field];
          }
        }

        this.db.data[table_name][ID] = this._validFields(table_name, new_data);
        num++;
      }
    }
    return num;
  }

  // commit the database to localStorage
  private _commit() {
    try {
      this.storage.setItem(this.db_id, JSON.stringify(this.db));
      return true;
    } catch (e) {
      return false;
    }
  }

  // serialize the database
  private _serialize() {
    return JSON.stringify(this.db);
  }

  // clone an object
  private _clone(obj) {
    let new_obj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        new_obj[key] = obj[key];
      }
    }
    return new_obj;
  }

  // validate db, table, field names (alpha-numeric only)
  private _validateName(name) {
    return name.toString().match(/[^a-z_0-9]/gi) ? false : true;
  }

  // given a data list, only retain valid fields in a table
  private _validFields(table_name, data) {
    let field = "",
      new_data = {};

    for (let i = 0; i < this.db.tables[table_name].fields.length; i++) {
      field = this.db.tables[table_name].fields[i];

      if (data[field] !== undefined) {
        new_data[field] = data[field];
      }
    }
    return new_data;
  }

  // given a data list, populate with valid field names of a table
  private _validateData(table_name, data) {
    let field = "",
      new_data = {};
    for (let i = 0; i < this.db.tables[table_name].fields.length; i++) {
      field = this.db.tables[table_name].fields[i];
      new_data[field] =
        data[field] === null || data[field] === undefined ? null : data[field];
    }
    return new_data;
  }

  // pUBLIC METHODS

  // throw an error
  public error(msg) {
    throw new Error(msg);
  }

  // commit the database to localStorage
  public commit() {
    return this._commit();
  }

  // is this instance a newly created database?
  public isNew() {
    return this.db_new;
  }

  // delete the database
  public drop() {
    this._drop();
  }

  // serialize the database
  public serialize() {
    return this._serialize();
  }

  // check whether a table exists
  public tableExists(table_name) {
    return this._tableExists(table_name);
  }

  // list of keys in a table
  public tableFields(table_name) {
    return this._tableFields(table_name);
  }

  // number of tables in the database
  public tableCount() {
    return this._tableCount();
  }

  public columnExists(table_name, field_name) {
    return this._columnExists(table_name, field_name);
  }

  // create a table
  public createTable(table_name, fields) {
    let result = false;
    if (!this._validateName(table_name)) {
      this.error(
        "The database name '" + table_name + "' contains invalid characters."
      );
    } else if (this._tableExists(table_name)) {
      this.error("The table name '" + table_name + "' already exists.");
    } else {
      // make sure field names are valid
      let is_valid = true;
      for (let i = 0; i < fields.length; i++) {
        if (!this._validateName(fields[i])) {
          is_valid = false;
          break;
        }
      }

      if (is_valid) {
        // cannot use indexOf due to <IE9 incompatibility
        // de-duplicate the field list
        let fields_literal = {};
        for (let m = 0; m < fields.length; m++) {
          fields_literal[fields[m]] = true;
        }
        delete fields_literal["ID"]; // iD is a reserved field name

        fields = ["ID"];
        for (let field in fields_literal) {
          if (fields_literal.hasOwnProperty(field)) {
            fields.push(field);
          }
        }

        this._createTable(table_name, fields);
        result = true;
      } else {
        this.error(
          "One or more field names in the table definition contains invalid characters"
        );
      }
    }

    return result;
  }

  // create a table using array of Objects @ [{k:v,k:v},{k:v,k:v},etc]
  public createTableWithData(table_name, data) {
    if (typeof data !== "object" || !data.length || data.length < 1) {
      this.error(
        "Data supplied isn't in object form. Example: [{k:v,k:v},{k:v,k:v} ..]"
      );
    }

    let fields = Object.keys(data[0]);

    // create the table
    if (this.createTable(table_name, fields)) {
      this.commit();

      // populate
      for (let i = 0; i < data.length; i++) {
        if (!this.insert(table_name, data[i])) {
          this.error(
            "Failed to insert record: [" + JSON.stringify(data[i]) + "]"
          );
        }
      }
      this.commit();
    }
    return true;
  }

  // drop a table
  public dropTable(table_name) {
    this._tableExistsWarn(table_name);
    this._dropTable(table_name);
  }

  // empty a table
  public truncate(table_name) {
    this._tableExistsWarn(table_name);
    this._truncate(table_name);
  }

  // alter a table
  public alterTable(table_name, new_fields, default_values) {
    let result = false;
    if (!this._validateName(table_name)) {
      this.error(
        "The database name '" + table_name + "' contains invalid characters"
      );
    } else {
      if (typeof new_fields === "object") {
        // make sure field names are valid
        let is_valid = true;
        for (let i = 0; i < new_fields.length; i++) {
          if (!this._validateName(new_fields[i])) {
            is_valid = false;
            break;
          }
        }

        if (is_valid) {
          // cannot use indexOf due to <IE9 incompatibility
          // de-duplicate the field list
          let fields_literal = {};
          for (let n = 0; n < new_fields.length; n++) {
            fields_literal[new_fields[n]] = true;
          }
          delete fields_literal["ID"]; // iD is a reserved field name

          new_fields = [];
          for (let field in fields_literal) {
            if (fields_literal.hasOwnProperty(field)) {
              new_fields.push(field);
            }
          }

          this._alterTable(table_name, new_fields, default_values);
          result = true;
        } else {
          this.error(
            "One or more field names in the table definition contains invalid characters"
          );
        }
      } else if (typeof new_fields === "string") {
        if (this._validateName(new_fields)) {
          let new_fields_array = [];
          new_fields_array.push(new_fields);
          this._alterTable(table_name, new_fields_array, default_values);
          result = true;
        } else {
          this.error(
            "One or more field names in the table definition contains invalid characters"
          );
        }
      }
    }

    return result;
  }

  // number of rows in a table
  public rowCount(table_name) {
    this._tableExistsWarn(table_name);
    return this._rowCount(table_name);
  }

  // insert a row
  public insert(table_name, data) {
    this._tableExistsWarn(table_name);
    return this._insert(table_name, this._validateData(table_name, data));
  }

  // insert or update based on a given condition
  public insertOrUpdate(table_name, query, data) {
    this._tableExistsWarn(table_name);

    let result_ids = [];
    if (!query) {
      result_ids = this._getIDs(table_name); // there is no query. applies to all records
    } else if (typeof query === "object") {
      // the query has key-value pairs provided
      result_ids = this._queryByValues(
        table_name,
        this._validFields(table_name, query)
      );
    } else if (typeof query === "string") {
      // the query has a conditional map  provided
      result_ids = this._queryBy(table_name, query);
    }

    // no existing records matched, so insert a new row
    if (result_ids.length === 0) {
      return this.insert(table_name, this._validateData(table_name, data));
    } else {
      let ids = [];
      for (let n = 0; n < result_ids.length; n++) {
        this._update(table_name, result_ids, (o) => {
          ids.push(o.ID);
          return data;
        });
      }
      return ids;
    }
  }

  // update rows
  public update(table_name, query, update_) {
    this._tableExistsWarn(table_name);

    let result_ids = [];
    if (!query) {
      result_ids = this._getIDs(table_name); // there is no query. applies to all records
    } else if (typeof query === "object") {
      // the query has key-value pairs provided
      result_ids = this._queryByValues(
        table_name,
        this._validFields(table_name, query)
      );
    } else if (typeof query === "string") {
      // the query has a conditional map  provided
      result_ids = this._queryBy(table_name, query);
    }
    return this._update(table_name, result_ids, update_);
  }

  // select rows - NOTE: limit, start, sort and distinct ARE NOT USED!!!??? - TODO: Remove this methods or correctly implement limit and start and sort
  public query(table_name, query, limit, start, sort, distinct) {
    this._tableExistsWarn(table_name);

    let result_ids = [];
    if (!query) {
      result_ids = this._getIDs(table_name); // no conditions given, return all records
    } else if (typeof query === "object") {
      // the query has key-value pairs provided
      result_ids = this._queryByValues(
        table_name,
        this._validFields(table_name, query)
      );
    } else if (typeof query === "string") {
      // the query has a conditional map  provided
      result_ids = this._queryBy(table_name, query);
    }

    return this._select(table_name, result_ids, start, limit, sort, distinct);
  }

  // alias for query() that takes a dict of params instead of positional arrguments
  public queryAll(table_name, params) {
    if (!params) {
      return this.query(table_name, null, null, null, null, null);
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
  }

  // delete rows
  public deleteRows(table_name, query) {
    this._tableExistsWarn(table_name);

    let result_ids = [];
    if (!query) {
      result_ids = this._getIDs(table_name);
    } else if (typeof query === "object") {
      result_ids = this._queryByValues(
        table_name,
        this._validFields(table_name, query)
      );
    } else if (typeof query === "string") {
      result_ids = this._queryBy(table_name, query);
    }
    return this._deleteRows(table_name, result_ids);
  }
}
