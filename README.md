# client-store

A simple client-side data storage library implemented using localStorage or sessionStorage. clientStore provides a set of functions to store structured data like a database containing tables and supporting queries and standard CRUD operations for data. It provides basic insert/update/delete/query capabilities with no dependencies. The structured data is stored as serialized JSON in localStorage or sessionStorage.

- Inspired by localStorageDB by Kailash Nadh (https://github.com/knadh/localStorageDB) but updated to modern JavaScript standards and TypeScript support.

# License

- Licensed: MIT license

## Installation

## NPM

`npm install @spinningideas/client-store`

# Run Tests

See testing section below in the README for more information on running tests.

`npm run test`

# Supported Browsers

Browsers need to support "Local Storage" and "Session Storage" in order for clientStore to function.

# Usage / Examples

### Creating a database, table, and populating the table

```javascript
// Initialize. If the storage doesn't exist, it is created
const moviesStore = clientStore("movies", localStorage);

// Check if the storage was just created. Useful for initial storage setup
if (moviesStore.storageExists === false) {
  // create the "movies" table
  moviesStore.createTable("movies", [
    "episodeId",
    "title",
    "releaseYear",
    "boxOffice",
    "isBest",
  ]);

  // insert some data
  moviesStore.insert("movies", {
    episodeId: "IV",
    title: "Star Wars: A New Hope",
    releaseYear: 1977,
    boxOffice: 775.4, // box office in millions of dollars
    isBest: false,
  });
  moviesStore.insert("movies", {
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4, // box office in millions of dollars
    isBest: true, // The Empire Strikes Back is considered the best
  });
  moviesStore.insert("movies", {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 475.1, // box office in millions of dollars
    isBest: false,
  });

  // save the data to localStorage
  // all create/drop/insert/update/delete operations should be committed
  moviesStore.commit();
}
```

### Create and seed sata into Table in one process

```javascript
// rows for pre-population
const rows = [
  {
    episodeId: "IV",
    title: "Star Wars: A New Hope",
    releaseYear: 1977,
    boxOffice: 775.4, // box office in millions of dollars
    isBest: false,
  },
  {
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4, // box office in millions of dollars
    isBest: true, // The Empire Strikes Back is considered the best
  },
  {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 475.1, // box office in millions of dollars
    isBest: false,
  },
];

// create the table and insert records in one go
moviesStore.createTableWithData("movies", rows);

moviesStore.commit();
```

### Alter existing Table to add two new Columns

```javascript
// If database already exists, and want to alter existing tables
if (!moviesStore.columnExists("movies", "runTime")) {
  moviesStore.alterTable("movies", "runTime", 121);
  moviesStore.commit(); // commit the deletions to localStorage
}

// Multiple columns can also added at once
if (
  !(
    moviesStore.columnExists("movies", "runTime") &&
    moviesStore.columnExists("movies", "rating")
  )
) {
  moviesStore.alterTable("movies", ["runTime", "rating"], {
    runTime: 121,
    rating: "PG",
  });
  moviesStore.commit(); // commit the deletions to localStorage
}
```

### Querying Data

```javascript
// Define query parameters
const queryParams = {
  query: { releaseYear: 1980 },
};

// Simple select queries
const movies1980 = moviesStore.query("movies", queryParams);

// Query with multiple conditions
const specificMovie = moviesStore.query("movies", {
  query: { releaseYear: 1977, boxOffice: 775.4 },
});

// Select all movies (no query parameters)
const allMovies = moviesStore.query("movies");

// Select all movies released after 1979 using a filter function
const newerMovies = moviesStore.query("movies", {
  query: (row) => {
    // The callback function is applied to every row in the table
    if (row.releaseYear > 1979) {
      // If it returns true, the row is selected
      return true;
    } else {
      return false;
    }
  },
});

// Or with a more concise arrow function
const newerMoviesAlt = moviesStore.query("movies", {
  query: (row) => row.releaseYear > 1979,
});

// Select movies with box office over 500 million, limited to 2 results
const highGrossing = moviesStore.query("movies", {
  query: (row) => row.boxOffice > 500,
  limit: 2,
});

// Select the best movie (using the boolean field)
const bestMovie = moviesStore.query("movies", {
  query: { isBest: true },
});
```

### Sorting Data

```javascript
// Select 2 rows sorted in ascending order by boxOffice
const sortedMovies = moviesStore.query("movies", {
  limit: 2,
  sort: [["boxOffice", "ASC"]],
});

// Select all rows first sorted in ascending order by boxOffice, and then, in descending, by releaseYear
const multiSortedMovies = moviesStore.query("movies", {
  sort: [
    ["boxOffice", "ASC"],
    ["releaseYear", "DESC"],
  ],
});

// Combine query, limit and sort
const filteredSortedMovies = moviesStore.query("movies", {
  query: { releaseYear: 1980 },
  limit: 1,
  sort: [["boxOffice", "ASC"]],
});
```

### Getting Distinct rows of data

```javascript
// Get records with distinct releaseYear and boxOffice values
const distinctMovies = moviesStore.query("movies", {
  distinct: ["releaseYear", "boxOffice"],
});
```

### Example Query Results

```javascript
// Query results are returned as arrays of object literals
// A "ROW_IDENTIFIER" field with the internal auto-incremented identifier of the row is also included
// Thus, ROW_IDENTIFIER is a reserved field name

const bestMovie = moviesStore.query("movies", { query: { isBest: true } });
console.log(bestMovie);

/* Results:
[
  {
    ROW_IDENTIFIER: "2",
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4,
    isBest: true
  }
]
*/
```

### Updating Data

```javascript
// Update all movies from 1977 to $800M box office
const updatedCount1 = moviesStore.update(
  "movies",
  { releaseYear: 1977 },
  (row) => {
    return { boxOffice: 800.0 };
  }
);
console.log(`Updated ${updatedCount1} records`);

// Or update all movies released before 1980 to $800M box office
const updatedCount2 = moviesStore.update(
  "movies",
  (row) => row.releaseYear < 1980, // Simplified arrow function with implicit return
  (row) => ({ boxOffice: 800.0 }) // Arrow function with implicit return of object
);
console.log(`Updated ${updatedCount2} records`);

// Don't forget to commit changes
moviesStore.commit();
```

### Upsert - Insert or Update conditionally

```javascript
// If there's a movie with episodeId VI, update it, or insert it as a new row
const result = moviesStore.upsert(
  "movies",
  { episodeId: "VI" },
  {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 500.5, // box office in millions of dollars
    isBest: false,
  }
);

// You can also use upsertOrUpdate which is an alias for upsert
const result2 = moviesStore.upsertOrUpdate(
  "movies",
  { episodeId: "VII" },
  {
    episodeId: "VII",
    title: "Star Wars: The Force Awakens",
    releaseYear: 2015,
    boxOffice: 2068.0,
    isBest: false,
  }
);

// If result is null, insertion failed
// If result is an array, it contains the ROW_IDENTIFIERs of updated rows
console.log(result ? `Updated ${result.length} rows` : "Inserted new row");
console.log(result2 ? `Updated ${result2.length} rows` : "Inserted new row");

moviesStore.commit();
```

### Deleting Data

```javascript
// Delete all movies from 1977
const deletedCount1 = moviesStore.deleteRows("movies", { releaseYear: 1977 });
console.log(`Deleted ${deletedCount1} records`);

// Delete all movies published before 1980
const deletedCount2 = moviesStore.deleteRows(
  "movies",
  (row) => row.releaseYear < 1980
);
console.log(`Deleted ${deletedCount2} records`);

// Commit the deletions to localStorage
moviesStore.commit();
```

# Available Methods

<table>
	<thead>
		<tr>
			<th>Method</th>
			<th>Arguments</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>clientStore()</td>
			<td>storeName, storageEngine</td>
			<td>Constructor<br />
				A simple client side data storage library implemented using localStorage or sessionStorage depending on the desired storage engine.<br />
				clientStore provides a set of functions to store structured data like a database containing tables and rows of data in a tabular format.<br />
				It supports query operations and standard CRUD operations.<br />
				- storeName: The name of the storage database.<br />
				- storageEngine: The storage engine to use (localStorage or sessionStorage). Defaults to localStorage.
			</td>
		</tr>
		<tr>
			<td>storageHasBeenCreated()</td>
			<td></td>
			<td>Returns true if the storage database has been created, false otherwise.</td>
		</tr>
		<tr>
			<td>importStorage()</td>
			<td>data</td>
			<td>Import and replace entire contents of localStorage storage database with passed in json.<br />
				- data: The JSON data to replace the storage database with.
			</td>
		</tr>
		<tr>
			<td>exportStorage()</td>
			<td></td>
			<td>Returns the entire storage database as serialized JSON.<br />
				Retrieves the current state of the storage database as a JSON string.
			</td>
		</tr>
		<tr>
			<td>dropStorage()</td>
			<td></td>
			<td>Deletes a storage database, and purges it from localStorage.</td>
		</tr>
		<tr>
			<td>tableExists()</td>
			<td>tableName</td>
			<td>Checks whether a table exists in the storage database.<br />
				- tableName: The name of the table to check.
			</td>
		</tr>
		<tr>
			<td>tableFields()</td>
			<td>tableName</td>
			<td>Returns the list of fields of a table.<br />
				- tableName: The name of the table.
			</td>
		</tr>
		<tr>
			<td>createTable()</td>
			<td>tableName, fields</td>
			<td>Creates a table - fields is an array of string fieldnames. 'ROW_IDENTIFIER' is a reserved fieldname.<br />
				- tableName: The name of the table to create.<br />
				- fields: Array of field names.
			</td>
		</tr>
		<tr>
			<td>alterTable()</td>
			<td>tableName, newFields, defaultValues</td>
			<td>Alter a table.<br />
				- tableName: The name of the table to alter.<br />
				- newFields: Array of columns to add.<br />
				- defaultValues: Can be an object of column's default values OR a default value string for single column for existing rows.
			</td>
		</tr>
		<tr>
			<td>dropTable()</td>
			<td>tableName</td>
			<td>Drop a table.<br />
				- tableName: The name of the table to drop.
			</td>
		</tr>
		<tr>
			<td>truncate()</td>
			<td>tableName</td>
			<td>Empty a table.<br />
				- tableName: The name of the table to truncate.
			</td>
		</tr>
		<tr>
			<td>columnExists()</td>
			<td>tableName, fieldName</td>
			<td>Checks whether a column exists in storage database table.<br />
				- tableName: The name of the table.<br />
				- fieldName: The name of the field/column to check.
			</td>
		</tr>
		<tr>
			<td>commit()</td>
			<td></td>
			<td>Commits the storage database to localStorage.<br />
				Saves the current state of the storage database to localStorage.<br />
				Returns true if the commit was successful, false otherwise.
			</td>
		</tr>
		<tr>
			<td>getItem()</td>
			<td>key</td>
			<td>Retrieve specified value from localStorage.<br />
				- key: The key to retrieve.<br />
				Returns the value or null if not found.
			</td>
		</tr>
		<tr>
			<td>setItem()</td>
			<td>key, value</td>
			<td>Set value for localStorage.<br />
				- key: The key to set.<br />
				- value: The value to set.<br />
				Returns true if successful, false otherwise.
			</td>
		</tr>
		<tr>
			<td>tableCount()</td>
			<td></td>
			<td>Returns the number of tables in a storage database.</td>
		</tr>
		<tr>
			<td>rowCount()</td>
			<td>tableName</td>
			<td>Returns the number of rows in a table.<br />
				- tableName: The name of the table.
			</td>
		</tr>
		<tr>
			<td>query()</td>
			<td>tableName, ids, start, limit, sort, distinct</td>
			<td>Select rows, given a list of ROW_IDENTIFIERs of rows in a table.<br />
				- tableName: The name of the table.<br />
				- ids: Array of ROW_IDENTIFIERs to select.<br />
				- start: The number of rows to skip from the beginning (offset).<br />
				- limit: The maximum number of rows to be returned.<br />
				- sort: Array of sort conditions, each one of which is an array with two values.<br />
				- distinct: Array of fields whose values have to be unique in the returned rows.<br />
				Returns array of rows matching the query.
			</td>
		</tr>
		<tr>
			<td>insert()</td>
			<td>tableName, data</td>
			<td>Inserts a row into a table.<br />
				- tableName: The name of the table.<br />
				- data: The data to insert.<br />
				Returns the ROW_IDENTIFIER of the inserted row, or null if insertion failed.
			</td>
		</tr>
		<tr>
			<td>upsert()</td>
			<td>tableName, query, data</td>
			<td>Insert or update based on a given condition.<br />
				- tableName: The name of the table.<br />
				- query: The query to match rows.<br />
				- data: The data to insert or update.<br />
				Returns array of ROW_IDENTIFIERs of the updated rows or null.
			</td>
		</tr>
		<tr>
			<td>upsertOrUpdate()</td>
			<td>tableName, query, data</td>
			<td>Insert or update rows based on a given condition.<br />
				Alias to upsert. Use upsert for better clarity.<br />
				- tableName: The name of the table.<br />
				- query: The query to match rows.<br />
				- data: The data to insert or update.<br />
				Returns array of ROW_IDENTIFIERs of the updated rows or null.
			</td>
		</tr>
		<tr>
			<td>update()</td>
			<td>tableName, ids, updateFunction</td>
			<td>Update rows having given row identifiers.<br />
				- tableName: The name of the table.<br />
				- ids: Array of ROW_IDENTIFIERs to update.<br />
				- updateFunction: A function that returns an object with the updated values.<br />
				Returns the number of rows updated.
			</td>
		</tr>
		<tr>
			<td>deleteRows()</td>
			<td>tableName, ids</td>
			<td>Deletes rows, given a list of their ROW_IDENTIFIERs in a table.<br />
				- tableName: The name of the table.<br />
				- ids: Array of ROW_IDENTIFIERs to delete.<br />
				Returns the number of rows deleted.
			</td>
		</tr>
	</tbody>
</table>

# Storing complex objects

While the library is meant for storing fundamental types (strings, numbers, bools), it is possible to store object literals and arrays as column values, with certain caveats. Some comparison queries, distinct etc. may not work. In addition, if you retrieve a stored array in a query result and modify its values in place, these changes will persist throughout further queries until the page is refreshed. This is because clientStore loads and unserializes data and keeps it in memory in a global pool until the page is refreshed, and arrays and objects returned in results are passed by reference.

If you really need to store arrays and objects, you should implement a deep-copy function through which you pass the results before manipulation.

# Package Publishing

This package is set up to be published to npm with support for both CommonJS and ES Modules. The package includes the following features:

- CommonJS build for Node.js and legacy environments
- ES Modules build for modern bundlers and environments
- TypeScript declaration files
- Tree-shakable exports

## Using the Package

### ES Modules (recommended)

```javascript
import clientStore from "@spinningideas/client-store";

const store = new clientStore("myDatabase");
```

### CommonJS

```javascript
const clientStore = require("client-store").default;

const store = new clientStore("myDatabase");
```

## Publishing to npm

To publish a new version of the package to npm:

1. Update the version in `package.json`
2. Run tests to ensure everything is working correctly: `npm test`
3. Build the package: `npm run build`
4. Publish to npm: `npm publish`

Alternatively, you can use npm version commands which will handle versioning and tagging:

```bash
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes
npm publish
```

# Feature Roadmap

1. Implement support to store arrays and objects as column values.
2. Implement support for storing JSON objects as column values.
3. Create a GitHub Actions workflow to automatically run these tests on pull requests
4. Add GitHub action to automatically build and publish the package to npm on push to main
5. Add GitHub Pages to host the documentation

# Testing

## Running Tests

The client-store library uses Mocha and Chai for testing. To run the tests, use the following command:

```bash
npm run test
```

## Test Coverage

To run tests with coverage reporting, use:

```bash
npm run test:coverage
```

This will run the tests and display a coverage summary in the terminal, showing:

- Percentage of statements covered
- Percentage of branches covered
- Percentage of functions covered
- Percentage of lines covered

## Coverage Report

To view a detailed HTML coverage report in your browser, run:

```bash
npm run coverage:report
```

The HTML report provides a detailed view of which parts of your code are covered by tests and which aren't, with color-coded highlighting:

- **Green**: Code that is covered by tests
- **Red**: Code that is not covered by tests
- **Yellow**: Branches that are partially covered

## Test Structure

The tests are organized into several sections:

1. **Basic Operations**: Tests for core functionality like creating stores and tables
2. **Storage Operations**: Tests for storage-related methods like import/export and storage management
3. **CRUD Operations**: Tests for data manipulation methods (Create, Read, Update, Delete)
4. **Additional Table Operations**: Tests for table-specific operations
5. **Error Handling**: Tests for proper error handling in various scenarios

## Adding New Tests

When adding new functionality to the library, please ensure you add corresponding tests to maintain good test coverage. Tests should be added to the appropriate section in `tests/client-store-tests.js`.

# npm package publishing

## Pre-requisites

```npm pack```
```npm version minor```
```npm publish```