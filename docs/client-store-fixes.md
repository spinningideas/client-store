# client-store Fixes

Documentation of issues found in `@spinningideas/client-store` usage in `StorageService.ts` and how to resolve them both in consuming code and in the package itself.

---

## Issues Found

### 1. `queryAll` — Incorrect filter syntax

**Wrong** — wrapping the filter function inside an object under a `query` key does not work. The object is passed as the query arg but the function inside it is never called:

```ts
// ❌ Function is never called — creates an object with a method named 'query'
getDb().queryAll(tableName, {
  query: function (row) {
    return row.value === value;
  },
});
```

**Correct** — pass the filter function directly as the second argument, matching the `storageUpdateCallbackFilter` interface `(object: ClientStorageFields): boolean`:

```ts
// ✅ Arrow function passed directly
getDb().queryAll(tableName, (row) => row.value === value);
```

Similarly, equality filters should be a flat object, not nested under `query`:

```ts
// ❌ Wrong — nested under 'query' key, ignored
getDb().queryAll(tableName, { query: { settingName: settingName } });

// ✅ Correct — flat object passed directly
getDb().queryAll(tableName, { settingName: settingName });
```

---

### 2. `insertOrUpdate` does not exist

The package interface uses `upsert`, not `insertOrUpdate`. All calls must be renamed:

```ts
// ❌ Wrong
getDb().insertOrUpdate(tableName, query, data);

// ✅ Correct
getDb().upsert(tableName, query, data);
```

---

### 3. `deleteRows` — query argument required

The typed interface requires a `query` argument. To delete all rows, pass an empty object:

```ts
// ❌ Wrong — missing required second argument
getDb().deleteRows(tableName);

// ✅ Correct — empty object matches all rows
getDb().deleteRows(tableName, {});
```

---

### 4. Return type casts require `as unknown as T`

`queryAll` returns `ClientStorageFields[]`. TypeScript will not allow a direct cast to domain types like `Playlist[]` because they don't sufficiently overlap structurally. The workaround is to go through `unknown` first:

```ts
// ❌ TypeScript error — types don't overlap
const data = getDb().queryAll(tableName) as Playlist[];

// ✅ Correct — cast through unknown first
const data = getDb().queryAll(tableName) as unknown as Playlist[];
```

---

## queryAll Fixes

### Option A — Module augmentation (no package changes)

Add a local declaration file to augment the package interface with a generic `queryAll<T>` overload. This survives `npm install` and requires no upstream changes:

```ts
// src/types/client-store.d.ts
import {
  ClientStorageDataFields,
  storageUpdateCallbackFilter,
} from "@spinningideas/client-store";

declare module "@spinningideas/client-store" {
  interface clientStore {
    // Generic overload — callers can specify T to get typed results
    queryAll<T = ClientStorageDataFields>(
      tableName: string,
      query?: ClientStorageDataFields | storageUpdateCallbackFilter,
    ): T[];

    // Make deleteRows query optional so deleteRows(tableName) works
    deleteRows(
      tableName: string,
      query?: string[] | ClientStorageDataFields | storageUpdateCallbackFilter,
    ): number;
  }
}
```

With this in place, all `as unknown as T[]` casts can be replaced with a type argument:

```ts
// Before (with ugly cast workaround)
const data = getDb().queryAll(tableName) as unknown as Playlist[];

// After (clean generic call)
const data = getDb().queryAll<Playlist>(tableName);
```

### Option B — Update the source package (recommended long-term)

Since `@spinningideas/client-store` is a first-party package, update the type definitions in the source and republish:

#### In `src/types/clientStore.d.ts`, update the interface:

```ts
interface clientStore {
  // Add generic T with default to avoid breaking existing callers
  queryAll<T = ClientStorageDataFields>(
    tableName: string,
    query?: ClientStorageDataFields | storageUpdateCallbackFilter,
  ): T[];

  // Make query optional so no-arg deleteRows works
  deleteRows(
    tableName: string,
    query?: string[] | ClientStorageDataFields | storageUpdateCallbackFilter,
  ): number;
}
```

The `= ClientStorageDataFields` default means existing callers with no type arg continue to work unchanged — there are no breaking changes.

#### Benefits over Option A:

- Cleaner — no local augmentation file to maintain
- Consumers of the package get the types automatically
- Correct place for the fix to live

---

# ClientStore type definitions

Export the `clientStore` instance interface from the package under a clean PascalCase name so consumers can import it directly as a type.

## Change in the package (`clientStore.d.ts`)

Export the interface as a named type:

```ts
// Export the instance interface with a clean public name
export interface ClientStore {
  queryAll<T = ClientStorageDataFields>(
    tableName: string,
    query?: ClientStorageDataFields | storageUpdateCallbackFilter,
  ): T[];
  upsert(
    tableName: string,
    query: ClientStorageDataFields | storageUpdateCallbackFilter | null,
    data: ClientStorageDataFields,
  ): string[];
  deleteRows(
    tableName: string,
    query?: string[] | ClientStorageDataFields | storageUpdateCallbackFilter,
  ): number;
  // ... rest of methods
}
```

## Consumer usage (after the package change)

```ts
import clientStore, { ClientStore } from "@spinningideas/client-store";

// Before (clunky — requires knowing the factory pattern):
let db: ReturnType<typeof clientStore> | null = null;

// After (clean named type):
let db: ClientStore | null = null;
```

## Notes

- No runtime/JS output changes — this is purely a `.d.ts` export addition
- Non-breaking: existing consumers using `ReturnType<typeof clientStore>` continue to work
- The lowercase `clientStore` interface already exists internally in the `.d.ts` — this just exports it under a public PascalCase alias
