// Type definitions for clientDB
interface ClientDBFields {
  row_identifier: string;
  [key: string]: any;
}

interface ClientDBDynamicFields {
  [key: string]: any;
}

interface ClientDBCallback {
  (object: ClientDBFields): ClientDBDynamicFields;
}

interface ClientDBCallbackFilter {
  (object: ClientDBFields): boolean;
}

interface ClientDBQueryParams {
  query?: ClientDBDynamicFields | ClientDBCallbackFilter | null;
  limit?: number;
  start?: number;
  sort?: any[];
  distinct?: string[];
}

interface ClientDB {
  isNew(): boolean;
  drop(): void;
  getItem(key: string): string | null;
  replace(json: string): void;
  setItem(key: string, value: string): void;
  tableCount(): number;
  commit(): boolean;
  serialize(): string;
  tableExists(tableName: string): boolean;
  tableFields(tableName: string): string[];
  createTable(tableName: string, fields: string[]): boolean;
  createTableWithData(tableName: string, rows: { [T: string]: any }[]): boolean;
  alterTable(
    tableName: string,
    newFields: string[] | string,
    defaultValues?: ClientDBDynamicFields | string
  ): boolean;
  dropTable(tableName: string): void;
  truncate(tableName: string): void;
  columnExists(tableName: string, fieldName: string): boolean;
  rowCount(tableName: string): number;
  insert(tableName: string, data: { [T: string]: any }): string | null;
  query(
    tableName: string,
    query?: ClientDBDynamicFields | ClientDBCallbackFilter | null,
    limit?: number,
    start?: number,
    sort?: any[],
    distinct?: string[]
  ): ClientDBFields[];
  query(
    tableName: string,
    params: ClientDBQueryParams
  ): ClientDBFields[];
  update(
    tableName: string,
    query: ClientDBDynamicFields | ClientDBCallbackFilter | null,
    updateFunction: ClientDBCallback
  ): number;
  insertOrUpdate(
    tableName: string,
    query: ClientDBDynamicFields | ClientDBCallbackFilter | null,
    data: ClientDBDynamicFields
  ): string[] | null;
  deleteRows(
    tableName: string,
    query?: ClientDBDynamicFields | ClientDBCallbackFilter | null
  ): number;
}

// Extend Window interface to include clientDB
export {}; // Make this file a module

declare global {
  interface Window {
    clientDB: {
      new(dbName: string, storageEngine?: Storage): ClientDB;
    };
  }
}
