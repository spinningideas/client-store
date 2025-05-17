# client-store

A simple client-side data storage library implemented using localStorage or sessionStorage. clientStore provides a set of functions to store structured data like a database containing tables and supporting queries and standard CRUD operations for data. It provides basic insert/update/delete/query capabilities with no dependencies. The structured data is stored as serialized JSON in localStorage or sessionStorage.

- Inspired by localStorageDB by Kailash Nadh (https://github.com/knadh/localStorageDB) but updated to modern JavaScript standards and TypeScript support.

# License

- Licensed: MIT license

## Installation

## NPM

`npm install client-store`

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

### Creating and populating a table in one go

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

### Altering

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

### Querying

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

### Sorting

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

### Distinct records

```javascript
// Get records with distinct releaseYear and boxOffice values
const distinctMovies = moviesStore.query("movies", {
  distinct: ["releaseYear", "boxOffice"],
});
```

### Example results from a query

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

### Updating

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

### Insert or Update conditionally

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

### Deleting

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

# Methods

<table>
	<thead>
		<tr>
			<th>Method</th/>
			<th>Arguments</th/>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>clientStore()</td>
			<td>databaseName, storageEngine</td>
			<td>Constructor<br />
				- storageEngine can either be an instance of localStorage (default) or sessionStorage from window object
			</td>
		</tr>
		<tr>
			<td>isNew()</td>
			<td></td>
			<td>Returns true if a database was created at the time of initialisation with the constructor</td>
		</tr>
		<tr>
			<td>drop()</td>
			<td></td>
			<td>Deletes a database, and purges it from localStorage</td>
		</tr>
		<tr>
			<td>tableCount()</td>
			<td></td>
			<td>Returns the number of tables in a database</td>
		</tr>
		<tr>
			<td>commit()</td>
			<td></td>
			<td>Commits the database to localStorage. Returns true if successful, and false otherwise (highly unlikely)</td>
		</tr>
		<tr>
			<td>serialize()</td>
			<td></td>
			<td>Returns the entire database as serialized JSON</td>
		</tr>
		<tr>
			<td>tableExists()</td>
			<td>tableName</td>
			<td>Checks whether a table exists in the database</td>
		</tr>
		<tr>
			<td>tableFields()</td>
			<td>tableName</td>
			<td>Returns the list of fields of a table</td>
		</tr>
		<tr>
			<td>createTable()</td>
			<td>tableName, fields</td>
			<td>Creates a table<br />
				- fields is an array of string fieldnames. 'ID' is a reserved fieldname.
			</td>
		</tr>
		<tr>
			<td>createTableWithData()</td>
			<td>tableName, rows</td>
			<td>Creates a table and populates it<br />
				- rows is an array of object literals where each object represents a record<br />
				[{field1: val, field2: val}, {field1: val, field2: val}]
			</td>
		</tr>
		<tr>
			<td>alterTable()</td>
			<td>tableName, new_fields, default_values</td>
			<td>Alter a table<br />
				- new_fields can be a array of columns OR a string of single column.<br />
				- default_values (optional) can be a object of column's default values OR a default value string for single column for existing rows.
			</td>
		</tr>
		<tr>
			<td>dropTable()</td>
			<td>tableName</td>
			<td>Deletes a table from the database</td>
		</tr>
		<tr>
			<td>truncate()</td>
			<td>tableName</td>
			<td>Empties all records in a table and resets the internal auto increment ID to 0</td>
		</tr>
		<tr>
			<td>columnExists()</td>
			<td>tableName, field_name</td>
			<td>Checks whether a column exists in database table.</td>
		</tr>
		<tr>
			<td>rowCount()</td>
			<td>tableName</td>
			<td>Returns the number of rows in a table</td>
		</tr>
		<tr>
			<td>insert()</td>
			<td>tableName, data</td>
			<td>Inserts a row into a table and returns its numerical ID<br />
				- data is an object literal with field-values<br />
				Every row is assigned an auto-incremented numerical ID automatically
			</td>
		</tr>
      <tr>
			<td>query()</td>
			<td>tableName, params{}</td>
			<td>
				Returns an array of rows (object literals) from a table matching the query.<br />
				- query is either an object literal or null. If query is not supplied, all rows are returned<br />
				- limit is the maximum number of rows to be returned<br />
    			- start is the  number of rows to be skipped from the beginning (offset)<br />
    			- sort is an array of sort conditions, each one of which is an array in itself with two values<br />
    			- distinct is an array of fields whose values have to be unique in the returned rows<br />
				Every returned row will have it's internal auto-incremented id assigned to the variable ID</td>
		</tr>
		<tr>
			<td>update()</td>
			<td>tableName, query, updateFunction</td>
			<td>Updates existing records in a table matching query, and returns the number of rows affected<br />
				- query is an object literal or a function. If query is not supplied, all rows are updated<br />
				- updateFunction is a function that returns an object literal with the updated values
			</td>
		</tr>
			<tr>
				<td>insertOrUpdate()</td>
				<td>tableName, query, data</td>
				<td>Inserts a row into a table if the given query matches no results, or updates the rows matching the query.<br />
					- query is either an object literal, function, or null.<br />
					- data is an object literal with field-values
					<br /><br />
					Returns the numerical ID if a new row was inserted, or an array of IDs if rows were updated
				</td>
			</tr>
		<tr>
			<td>deleteRows()</td>
			<td>tableName, query</td>
			<td>Deletes rows from a table matching query, and returns the number of rows deleted<br />
				- query is either an object literal or a function. If query is not supplied, all rows are deleted
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
import clientStore from "client-store";

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
3. Add more comprehensive tests to check other aspects of the clientStore functionality
4. Set up code coverage reporting to see how well the tests are covering the codebase
5. Create a GitHub Actions workflow to automatically run these tests on pull requests
6. Document the testing approach in the project README

# Tests

To run tests, use the following command:

`npm run test`

To run tests with coverage, use the following command:

`npm run test:coverage`

To run open the coverage report, use the following command:

`npm run coverage:report`

To open the coverage report in a browser, use the following command:

`npm run coverage:open`

The coverage report will show you:

Percentage of lines covered
Percentage of functions covered
Percentage of statements covered
Percentage of branches covered
The HTML report provides a detailed view of which parts of your code are covered by tests and which aren't, with color-coded highlighting:

Green: Code that is covered by tests
Red: Code that is not covered by tests
Yellow: Branches that are partially covered
