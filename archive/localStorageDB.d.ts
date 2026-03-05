/**
 * localStorageDB provides a database-like layer for working with localStorage
 * It is the underlying storage engine used by clientStore
 * @deprecated This class is exposed for backward compatibility only and may be removed in future versions.
 * Use clientStore instead which provides a more robust and feature-complete API.
 */
export class localStorageDB {
  /**
   * Creates a new localStorageDB instance
   * @param db_name - The name of the database
   */
  constructor(db_name: string);
  
  /** The name of the database */
  db_name: string;
  
  /** The prefix used for database keys in storage */
  db_prefix: string;
  
  /** The full identifier for the database in storage */
  db_id: string;
  
  /** Flag indicating whether a new database was created during initialization */
  db_new: boolean;
  
  /** The database object */
  db: any;
  
  /** The storage engine being used */
  storage: any;
  
  /**
   * Creates a new database or loads an existing one
   * @returns The localStorageDB instance
   */
  init(): localStorageDB;
  
  /**
   * Checks if a table exists in the database
   * @param table_name - The name of the table to check
   * @returns True if the table exists, false otherwise
   */
  tableExists(table_name: string): boolean;
  
  /**
   * Creates a new table in the database
   * @param table_name - The name of the table to create
   * @param fields - The fields to create in the table
   * @returns The localStorageDB instance
   */
  createTable(table_name: string, fields: string[]): localStorageDB;
  
  /**
   * Drops a table from the database
   * @param table_name - The name of the table to drop
   * @returns The localStorageDB instance
   */
  dropTable(table_name: string): localStorageDB;
  
  /**
   * Truncates a table (removes all rows)
   * @param table_name - The name of the table to truncate
   * @returns The localStorageDB instance
   */
  truncate(table_name: string): localStorageDB;
  
  /**
   * Alters a table by adding new fields
   * @param table_name - The name of the table to alter
   * @param new_fields - The new fields to add
   * @param default_values - Default values for the new fields
   * @returns The localStorageDB instance
   */
  alterTable(table_name: string, new_fields: string[], default_values?: any): localStorageDB;
  
  /**
   * Inserts a row into a table
   * @param table_name - The name of the table
   * @param data - The data to insert
   * @returns The ID of the inserted row
   */
  insert(table_name: string, data: Record<string, any>): string;
  
  /**
   * Updates rows in a table
   * @param table_name - The name of the table
   * @param query - The query to filter rows
   * @param update_function - Function to update each row
   * @returns The number of updated rows
   */
  update(table_name: string, query: Record<string, any>, update_function: (row: any) => any): number;
  
  /**
   * Commits the changes to localStorage
   * @returns The localStorageDB instance
   */
  commit(): localStorageDB;
  
  /**
   * Queries rows from a table
   * @param table_name - The name of the table
   * @param query - The query to filter rows
   * @param limit - The maximum number of rows to return
   * @param start - The starting index
   * @param sort - The sort criteria
   * @returns Array of matching rows
   */
  query(table_name: string, query?: Record<string, any>, limit?: number, start?: number, sort?: [string, string][]): any[];
  
  /**
   * Deletes rows from a table
   * @param table_name - The name of the table
   * @param query - The query to filter rows to delete
   * @returns The number of deleted rows
   */
  deleteRows(table_name: string, query: Record<string, any>): number;
}
