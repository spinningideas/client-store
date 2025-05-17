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
var lib = new clientDB("library", localStorage);

// Check if the database was just created. Useful for initial database setup
if (lib.isNew()) {
  // create the "movies" table
  lib.createTable("movies", ["episodeId", "title", "releaseYear", "boxOffice"]);

  // insert some data
  lib.insert("movies", {
    episodeId: "IV",
    title: "Star Wars: A New Hope",
    releaseYear: 1977,
    boxOffice: 775.4, // box office in millions of dollars
  });
  lib.insert("movies", {
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4, // box office in millions of dollars
  });
  lib.insert("movies", {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 475.1, // box office in millions of dollars
  });

  // commit the database to localStorage
  // all create/drop/insert/update/delete operations should be committed
  lib.commit();
}
```

### Creating and populating a table in one go

```javascript
// rows for pre-population
var rows = [
  {
    episodeId: "IV",
    title: "Star Wars: A New Hope",
    releaseYear: 1977,
    boxOffice: 775.4, // box office in millions of dollars
  },
  {
    episodeId: "V",
    title: "Star Wars: The Empire Strikes Back",
    releaseYear: 1980,
    boxOffice: 538.4, // box office in millions of dollars
  },
  {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 475.1, // box office in millions of dollars
  },
];

// create the table and insert records in one go
lib.createTableWithData("movies", rows);

lib.commit();
```

### Altering

```javascript
// If database already exists, and want to alter existing tables
if (!lib.columnExists("movies", "runTime")) {
  lib.alterTable("movies", "runTime", 121);
  lib.commit(); // commit the deletions to localStorage
}

// Multiple columns can also added at once
if (
  !(
    lib.columnExists("movies", "runTime") &&
    lib.columnExists("movies", "rating")
  )
) {
  lib.alterTable("movies", ["runTime", "rating"], {
    runTime: 121,
    rating: "PG",
  });
  lib.commit(); // commit the deletions to localStorage
}
```

### Querying

`query()` is deprecated. Use `queryAll()` instead.

```javascript
// simple select queries
lib.queryAll("movies", {
  query: { releaseYear: 1980 },
});
lib.queryAll("movies", {
  query: { releaseYear: 1977, boxOffice: 775.4 },
});

// select all movies
lib.queryAll("movies");

// select all movies released after 1979
lib.queryAll("movies", {
  query: function (row) {
    // the callback function is applied to every row in the table
    if (row.releaseYear > 1979) {
      // if it returns true, the row is selected
      return true;
    } else {
      return false;
    }
  },
});

// select all movies with box office over 500 million
lib.queryAll("movies", {
  query: function (row) {
    if (row.boxOffice > 500) {
      return true;
    } else {
      return false;
    }
  },
  limit: 2,
});
```

### Sorting

```javascript
// select 2 rows sorted in ascending order by boxOffice
lib.queryAll("movies", { limit: 2, sort: [["boxOffice", "ASC"]] });

// select all rows first sorted in ascending order by boxOffice, and then, in descending, by releaseYear
lib.queryAll("movies", {
  sort: [
    ["boxOffice", "ASC"],
    ["releaseYear", "DESC"],
  ],
});

lib.queryAll("movies", {
  query: { releaseYear: 1980 },
  limit: 1,
  sort: [["boxOffice", "ASC"]],
});

// or using query()'s positional arguments, which is a little messy (DEPRECATED)
lib.query("movies", null, null, null, [["boxOffice", "ASC"]]);
```

### Distinct records

```javascript
lib.queryAll("movies", { distinct: ["releaseYear", "boxOffice"] });
```

### Example results from a query

```javascript
// query results are returned as arrays of object literals
// an ID field with the internal auto-incremented id of the row is also included
// thus, ID is a reserved field name

lib.queryAll("movies", { query: { releaseYear: 1977 } });

/* results
[
 {
   ID: 1,
   episodeId: "IV",
   title: "Star Wars: A New Hope",
   releaseYear: 1977,
   boxOffice: 775.4
 }
]
*/
```

### Updating

```javascript
// update all movies from 1977 to $800M box office
lib.update("movies", { releaseYear: 1977 }, function (row) {
  return { boxOffice: 800.0 };
});

// or update all movies released before 1980 to $800M box office
lib.update(
  "movies",
  function (row) {
    if (row.releaseYear < 1980) {
      return true;
    } else {
      return false;
    }
  },
  function (row) {
    return { boxOffice: 800.0 };
  }
);
```

### Insert or Update conditionally

```javascript
// if there's a movie with episodeId VI, update it, or insert it as a new row
lib.insertOrUpdate(
  "movies",
  { episodeId: "VI" },
  {
    episodeId: "VI",
    title: "Star Wars: Return of the Jedi",
    releaseYear: 1983,
    boxOffice: 500.5, // box office in millions of dollars
  }
);

lib.commit();
```

### Deleting

```javascript
// delete all movies from 1977
lib.deleteRows("movies", { releaseYear: 1977 });

// delete all movies published before 1980
lib.deleteRows("movies", function (row) {
  if (row.releaseYear < 1980) {
    return true;
  } else {
    return false;
  }
});

lib.commit(); // commit the deletions to localStorage
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
			<td>database_name, storage_engine</td>
			<td>Constructor<br />
				- storage_engine can either be localStorage (default) or sessionStorage
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
			<td>query() DEPRECATED</td>
			<td>tableName, query, limit, start, sort</td>
			<td></td>
		</tr>
        <tr>
			<td>queryAll()</td>
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

1) Implement support to store arrays and objects as column values.
2) Implement support for storing JSON objects as column values.
3) Add more comprehensive tests to check other aspects of the clientDB functionality
4) Set up code coverage reporting to see how well the tests are covering the codebase
5) Create a GitHub Actions workflow to automatically run these tests on pull requests
6) Document the testing approach in the project README

# Tests

To run tests, use the following command:

```npm run test```

To run tests with coverage, use the following command:

```npm run test:coverage```

To run open the coverage report, use the following command:

```npm run coverage:report```

To open the coverage report in a browser, use the following command:  

```npm run coverage:open```

The coverage report will show you:

Percentage of lines covered
Percentage of functions covered
Percentage of statements covered
Percentage of branches covered
The HTML report provides a detailed view of which parts of your code are covered by tests and which aren't, with color-coded highlighting:

Green: Code that is covered by tests
Red: Code that is not covered by tests
Yellow: Branches that are partially covered
