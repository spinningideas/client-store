# client-db

A simple client side database library implemented using localStorage or sessionStorage depending on the desired storage engine. clientDB is a simple layer over localStorage (and sessionStorage) that provides a set of functions to store structured data like databases and tables.

It provides basic insert/update/delete/query capabilities.
clientDB has no dependencies, and is not based on WebSQL. Underneath it all, the structured data is stored as serialized JSON in localStorage or sessionStorage.

- Inspired by localStorageDB by Kailash Nadh (https://github.com/knadh/localStorageDB)

# License

- Licensed: MIT license

## Installation

## NPM

`npm install clientDB`

# Run Tests

See testing section below in the README for more information on running tests.

`npm run test`

# Supported Browsers

Browsers need to support "Local Storage" in order for clientDB to function.

# Usage / Examples

### Creating a database, table, and populating the table

```javascript
// Initialise. If the database doesn't exist, it is created
const moviesDB = new clientDB("movies", localStorage);

// Check if the database was just created. Useful for initial database setup
if (moviesDB.isNew()) {
  // create the "movies" table
  moviesDB.createTable("movies", [
    "episodeId",
    "title",
    "releaseYear",
    "boxOffice",
    "isBest",
  ]);

  // insert some data
  moviesDB.insert("movies", {
    episodeId: "IV",
    title: "Star Wars: A New Hope",
    releaseYear: 1977,
    boxOffice: 775.4, // box office in millions of dollars
    isBest: false,
  });
  moviesDB.insert("movies", {
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4, // box office in millions of dollars
    isBest: true, // The Empire Strikes Back is considered the best
  });
  moviesDB.insert("movies", {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 475.1, // box office in millions of dollars
    isBest: false,
  });

  // commit the database to localStorage
  // all create/drop/insert/update/delete operations should be committed
  moviesDB.commit();
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
moviesDB.createTableWithData("movies", rows);

moviesDB.commit();
```

### Altering

```javascript
// If database already exists, and want to alter existing tables
if (!moviesDB.columnExists("movies", "runTime")) {
  moviesDB.alterTable("movies", "runTime", 121);
  moviesDB.commit(); // commit the deletions to localStorage
}

// Multiple columns can also added at once
if (
  !(
    moviesDB.columnExists("movies", "runTime") &&
    moviesDB.columnExists("movies", "rating")
  )
) {
  moviesDB.alterTable("movies", ["runTime", "rating"], {
    runTime: 121,
    rating: "PG",
  });
  moviesDB.commit(); // commit the deletions to localStorage
}
```

### Querying

```javascript
// simple select queries
moviesDB.query("movies", {
  query: { releaseYear: 1980 },
});
moviesDB.query("movies", {
  query: { releaseYear: 1977, boxOffice: 775.4 },
});

// select all movies
moviesDB.query("movies");

// select all movies released after 1979
moviesDB.query("movies", {
  query: (row) => {
    // the callback function is applied to every row in the table
    if (row.releaseYear > 1979) {
      // if it returns true, the row is selected
      return true;
    } else {
      return false;
    }
  },
});

// or with a more concise arrow function
moviesDB.query("movies", {
  query: (row) => row.releaseYear > 1979,
});

// select all movies with box office over 500 million
moviesDB.query("movies", {
  query: (row) => row.boxOffice > 500, // concise arrow function
  limit: 2,
});

// select the best movie (using the boolean field)
moviesDB.query("movies", {
  query: { isBest: true },
});
```

### Sorting

```javascript
// select 2 rows sorted in ascending order by boxOffice
moviesDB.query("movies", { limit: 2, sort: [["boxOffice", "ASC"]] });

// select all rows first sorted in ascending order by boxOffice, and then, in descending, by releaseYear
moviesDB.query("movies", {
  sort: [
    ["boxOffice", "ASC"],
    ["releaseYear", "DESC"],
  ],
});

moviesDB.query("movies", {
  query: { releaseYear: 1980 },
  limit: 1,
  sort: [["boxOffice", "ASC"]],
});
```

### Distinct records

```javascript
moviesDB.query("movies", { distinct: ["releaseYear", "boxOffice"] });
```

### Example results from a query

```javascript
// query results are returned as arrays of object literals
// an "row_identifier" field with the internal auto-incremented identifier of the row is also included
// thus, row_identifier is a reserved field name

moviesDB.query("movies", { query: { isBest: true } });

/* results
[
 {
   ID: 2,
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
// update all movies from 1977 to $800M box office
moviesDB.update("movies", { releaseYear: 1977 }, (row) => {
  return { boxOffice: 800.0 };
});

// or update all movies released before 1980 to $800M box office
moviesDB.update(
  "movies",
  (row) => row.releaseYear < 1980, // simplified arrow function with implicit return
  (row) => ({ boxOffice: 800.0 }) // arrow function with implicit return of object
);
```

### Insert or Update conditionally

```javascript
// if there's a movie with episodeId VI, update it, or insert it as a new row
moviesDB.insertOrUpdate(
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

moviesDB.commit();
```

### Deleting

```javascript
// delete all movies from 1977
moviesDB.deleteRows("movies", { releaseYear: 1977 });

// delete all movies published before 1980
moviesDB.deleteRows("movies", (row) => row.releaseYear < 1980);

moviesDB.commit(); // commit the deletions to localStorage
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
			<td>clientDB()</td>
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

While the library is meant for storing fundamental types (strings, numbers, bools), it is possible to store object literals and arrays as column values, with certain caveats. Some comparison queries, distinct etc. may not work. In addition, if you retrieve a stored array in a query result and modify its values in place, these changes will persist throughout further queries until the page is refreshed. This is because clientDB loads and unserializes data and keeps it in memory in a global pool until the page is refreshed, and arrays and objects returned in results are passed by reference.

If you really need to store arrays and objects, you should implement a deep-copy function through which you pass the results before manipulation.

# Feature Roadmap

1. Implement support to store arrays and objects as column values.
2. Implement support for storing JSON objects as column values.
3. Add more comprehensive tests to check other aspects of the clientDB functionality
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
