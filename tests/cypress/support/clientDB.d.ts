// Type definitions for clientStore
interface clientStoreFields {
  row_identifier: string;
  [key: string]: any;
}

interface clientStoreDynamicFields {
  [key: string]: any;
}

interface clientStoreCallback {
  (object: clientStoreFields): clientStoreDynamicFields;
}

interface clientStoreCallbackFilter {
  (object: clientStoreFields): boolean;
}

interface clientStoreQueryParams {
  query?: clientStoreDynamicFields | clientStoreCallbackFilter | null;
  limit?: number;
  start?: number;
  sort?: any[];
  distinct?: string[];
}

interface clientStore {
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
    defaultValues?: clientStoreDynamicFields | string
  ): boolean;
  dropTable(tableName: string): void;
  truncate(tableName: string): void;
  columnExists(tableName: string, fieldName: string): boolean;
  rowCount(tableName: string): number;
  insert(tableName: string, data: { [T: string]: any }): string | null;
  query(
    tableName: string,
    query?: clientStoreDynamicFields | clientStoreCallbackFilter | null,
    limit?: number,
    start?: number,
    sort?: any[],
    distinct?: string[]
  ): clientStoreFields[];
  query(
    tableName: string,
    params: clientStoreQueryParams
  ): clientStoreFields[];
  update(
    tableName: string,
    query: clientStoreDynamicFields | clientStoreCallbackFilter | null,
    updateFunction: clientStoreCallback
  ): number;
  insertOrUpdate(
    tableName: string,
    query: clientStoreDynamicFields | clientStoreCallbackFilter | null,
    data: clientStoreDynamicFields
  ): string[] | null;
  deleteRows(
    tableName: string,
    query?: clientStoreDynamicFields | clientStoreCallbackFilter | null
  ): number;
}

// Extend Window interface to include clientStore
export {}; // Make this file a module

declare global {
  interface Window {
    clientStore: {
      new(dbName: string, storageEngine?: Storage): clientStore;
    };
  }
}
