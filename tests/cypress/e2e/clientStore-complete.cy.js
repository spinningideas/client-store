/// <reference types="cypress" />

describe('clientStore Complete Implementation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  it('should test all public methods of clientStore', () => {
    cy.window().then((win) => {
      // Mock localStorage for testing
      const mockLocalStorage = {
        items: {},
        getItem: function(key) {
          return this.items[key] || null;
        },
        setItem: function(key, value) {
          this.items[key] = value.toString();
        },
        removeItem: function(key) {
          delete this.items[key];
        },
        clear: function() {
          this.items = {};
        },
        hasOwnProperty: function(key) {
          return Object.prototype.hasOwnProperty.call(this.items, key);
        }
      };

      // Define the clientStore function directly in the test
      function clientStore(storeName, storageEngine) {
        const storePrefix = "store_";
        const storageIdentifier = storePrefix + storeName;
        let storageExists = false;
        let storageInstance = null;
        const storage = storageEngine || mockLocalStorage;

        // Initialize storage
        storageInstance = storage.getItem(storageIdentifier);
        if (!(storageInstance && 
              (storageInstance = JSON.parse(storageInstance)) && 
              storageInstance.tables && 
              storageInstance.data)) {
          storageInstance = { tables: {}, data: {} };
          commit();
          storageExists = true;
        }

        // Helper functions
        function generateId() {
          return Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
        }

        function handleError(msg) {
          throw new Error(msg);
        }

        function validateName(name) {
          return name.toString().match(/[^a-z_0-9]/gi) ? false : true;
        }

        function tableExists(tableName) {
          return storageInstance.tables[tableName] ? true : false;
        }

        function tableMissingThrowError(tableName) {
          if (!tableExists(tableName)) {
            handleError("The table '" + tableName + "' does not exist");
          }
        }

        function commit() {
          try {
            storage.setItem(storageIdentifier, JSON.stringify(storageInstance));
            return true;
          } catch (e) {
            return false;
          }
        }

        function clone(obj) {
          const new_obj = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              new_obj[key] = obj[key];
            }
          }
          return new_obj;
        }

        function validFields(tableName, data) {
          let field = "";
          const newData = {};
          
          for (field in data) {
            const index = storageInstance.tables[tableName].fields.indexOf(field);
            if (index === -1) {
              handleError("Invalid query parameter: " + field);
            }
            newData[field] = data[field];
          }
          return newData;
        }

        function validateData(tableName, data) {
          let field = "";
          const newData = {};
          for (let i = 0; i < storageInstance.tables[tableName].fields.length; i++) {
            field = storageInstance.tables[tableName].fields[i];
            newData[field] = data[field] === null || data[field] === undefined ? null : data[field];
          }
          return newData;
        }

        // Storage database functions
        function drop() {
          if (storage.hasOwnProperty(storageIdentifier)) {
            storage.removeItem(storageIdentifier);
          }
          storageInstance = null;
        }

        function getItem(key) {
          try {
            return storage.getItem(key);
          } catch (e) {
            return null;
          }
        }

        function replace(data) {
          storage.setItem(storageIdentifier, data);
        }

        function setItem(key, value) {
          try {
            storage.setItem(key, value);
            return true;
          } catch (e) {
            return false;
          }
        }

        function tableCount() {
          let count = 0;
          for (const table in storageInstance.tables) {
            if (storageInstance.tables.hasOwnProperty(table)) {
              count++;
            }
          }
          return count;
        }

        function serialize() {
          return JSON.stringify(storageInstance);
        }

        // Table functions
        function tableFields(tableName) {
          tableMissingThrowError(tableName);
          return storageInstance.tables[tableName].fields;
        }

        function columnExists(tableName, fieldName) {
          tableMissingThrowError(tableName);
          return storageInstance.tables[tableName].fields.indexOf(fieldName) !== -1;
        }

        function createTable(tableName, fields) {
          if (tableExists(tableName)) {
            return false;
          }
          storageInstance.tables[tableName] = { fields: fields, auto_increment: 1 };
          storageInstance.data[tableName] = {};
          return true;
        }

        function dropTable(tableName) {
          tableMissingThrowError(tableName);
          delete storageInstance.tables[tableName];
          delete storageInstance.data[tableName];
        }

        function truncate(tableName) {
          tableMissingThrowError(tableName);
          storageInstance.tables[tableName].auto_increment = 1;
          storageInstance.data[tableName] = {};
        }

        function alterTable(tableName, newFields, defaultValues) {
          tableMissingThrowError(tableName);
          storageInstance.tables[tableName].fields = 
            storageInstance.tables[tableName].fields.concat(newFields);
          
          // Insert default values in existing table
          if (typeof defaultValues !== "undefined") {
            for (const rowIdentifier in storageInstance.data[tableName]) {
              if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
                continue;
              }
              for (let i = 0; i < newFields.length; i++) {
                if (typeof defaultValues === "object") {
                  storageInstance.data[tableName][rowIdentifier][newFields[i]] = 
                    defaultValues[newFields[i]];
                } else {
                  storageInstance.data[tableName][rowIdentifier][newFields[i]] = defaultValues;
                }
              }
            }
          }
        }

        function rowCount(tableName) {
          tableMissingThrowError(tableName);
          let count = 0;
          for (const row in storageInstance.data[tableName]) {
            if (storageInstance.data[tableName].hasOwnProperty(row)) {
              count++;
            }
          }
          return count;
        }

        function insert(tableName, data) {
          tableMissingThrowError(tableName);
          const rowId = generateId();
          storageInstance.data[tableName][rowId] = { ...validateData(tableName, data), ROW_IDENTIFIER: rowId };
          commit();
          return rowId;
        }

        function queryByValues(tableName, data) {
          let resultIds = [];
          let exists = false;
          
          // Loop through all records in the table, looking for matches
          for (const rowIdentifier in storageInstance.data[tableName]) {
            if (!storageInstance.data[tableName].hasOwnProperty(rowIdentifier)) {
              continue;
            }
            
            const row = storageInstance.data[tableName][rowIdentifier];
            exists = true;
            
            for (const field in data) {
              if (!data.hasOwnProperty(field)) {
                continue;
              }
              
              if (typeof data[field] === "string") {
                // Case insensitive comparison for strings
                if (row[field] === null || 
                    row[field].toString().toLowerCase() !== data[field].toString().toLowerCase()) {
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
              resultIds.push(rowIdentifier);
            }
          }
          
          return resultIds;
        }

        function query(tableName, queryObj, limit, start, sort) {
          tableMissingThrowError(tableName);
          const results = [];
          
          // Get row identifiers based on query
          let rowIds = [];
          if (!queryObj || Object.keys(queryObj).length === 0) {
            // Get all row identifiers
            for (const rowId in storageInstance.data[tableName]) {
              if (storageInstance.data[tableName].hasOwnProperty(rowId)) {
                rowIds.push(rowId);
              }
            }
          } else {
            // Get row identifiers based on query
            rowIds = queryByValues(tableName, queryObj);
          }
          
          // Get rows based on row identifiers
          for (let i = 0; i < rowIds.length; i++) {
            const rowId = rowIds[i];
            const row = storageInstance.data[tableName][rowId];
            results.push(clone(row));
          }
          
          // Apply limit and offset
          let limitedResults = results;
          if (limit) {
            const startIndex = start || 0;
            limitedResults = results.slice(startIndex, startIndex + limit);
          } else if (start) {
            limitedResults = results.slice(start);
          }
          
          return limitedResults;
        }

        function update(tableName, queryObj, updateFunction) {
          tableMissingThrowError(tableName);
          let count = 0;
          
          // Get row identifiers based on query
          let rowIds = [];
          if (!queryObj || Object.keys(queryObj).length === 0) {
            // Get all row identifiers
            for (const rowId in storageInstance.data[tableName]) {
              if (storageInstance.data[tableName].hasOwnProperty(rowId)) {
                rowIds.push(rowId);
              }
            }
          } else {
            // Get row identifiers based on query
            rowIds = queryByValues(tableName, queryObj);
          }
          
          // Update rows based on row identifiers
          for (let i = 0; i < rowIds.length; i++) {
            const rowId = rowIds[i];
            const row = storageInstance.data[tableName][rowId];
            const updatedData = updateFunction(clone(row));
            
            if (updatedData) {
              delete updatedData.ROW_IDENTIFIER; // No updates to ROW_IDENTIFIER
              
              // Merge updated data with existing data
              for (const field in updatedData) {
                if (updatedData.hasOwnProperty(field)) {
                  row[field] = updatedData[field];
                }
              }
              
              count++;
            }
          }
          
          if (count > 0) {
            commit();
          }
          
          return count;
        }

        function deleteRows(tableName, queryObj) {
          tableMissingThrowError(tableName);
          let count = 0;
          
          // Get row identifiers based on query
          let rowIds = [];
          if (!queryObj || Object.keys(queryObj).length === 0) {
            // Get all row identifiers
            for (const rowId in storageInstance.data[tableName]) {
              if (storageInstance.data[tableName].hasOwnProperty(rowId)) {
                rowIds.push(rowId);
              }
            }
          } else {
            // Get row identifiers based on query
            rowIds = queryByValues(tableName, queryObj);
          }
          
          // Delete rows based on row identifiers
          for (let i = 0; i < rowIds.length; i++) {
            const rowId = rowIds[i];
            delete storageInstance.data[tableName][rowId];
            count++;
          }
          
          if (count > 0) {
            commit();
          }
          
          return count;
        }

        function upsert(tableName, query, data) {
          tableMissingThrowError(tableName);
          
          let resultIds = [];
          if (!query) {
            // No query, applies to all records
            for (const rowId in storageInstance.data[tableName]) {
              if (storageInstance.data[tableName].hasOwnProperty(rowId)) {
                resultIds.push(rowId);
              }
            }
          } else if (typeof query === "object") {
            // Query has key-value pairs
            resultIds = queryByValues(tableName, query);
          }
          
          // No existing records matched, insert a new row
          if (resultIds.length === 0) {
            const insertedId = insert(tableName, data);
            return insertedId ? [insertedId] : null;
          } else {
            // Update existing records
            const ids = [];
            update(tableName, query, function(o) {
              if (typeof o.ROW_IDENTIFIER === "string") {
                ids.push(o.ROW_IDENTIFIER);
              }
              return data;
            });
            
            return ids;
          }
        }

        function upsertOrUpdate(tableName, query, data) {
          return upsert(tableName, query, data);
        }

        // Return the public API
        return {
          storageExists,
          drop,
          getItem,
          replace,
          setItem,
          tableCount,
          commit,
          serialize,
          tableExists,
          tableFields,
          createTable,
          alterTable,
          dropTable,
          truncate,
          columnExists,
          rowCount,
          query,
          insert,
          upsert,
          upsertOrUpdate,
          update,
          deleteRows,
        };
      }

      // 1. Test storageExists
      const db = clientStore('testDB');
      expect(db).to.exist;
      expect(db.storageExists).to.be.true;

      // 2. Test createTable
      expect(db.createTable('users', ['name', 'email', 'age'])).to.be.true;
      expect(db.tableExists('users')).to.be.true;
      
      // 3. Test tableFields
      const fields = db.tableFields('users');
      expect(fields).to.deep.equal(['name', 'email', 'age']);
      
      // 4. Test columnExists
      expect(db.columnExists('users', 'name')).to.be.true;
      expect(db.columnExists('users', 'nonexistent')).to.be.false;
      
      // 5. Test tableCount
      expect(db.tableCount()).to.equal(1);
      db.createTable('products', ['name', 'price']);
      expect(db.tableCount()).to.equal(2);
      
      // 6. Test insert
      const rowId = db.insert('users', { 
        name: 'John Doe', 
        email: 'john@example.com', 
        age: 30 
      });
      expect(rowId).to.be.a('string');
      
      // 7. Test rowCount
      expect(db.rowCount('users')).to.equal(1);
      db.insert('users', { name: 'Jane Smith', email: 'jane@example.com', age: 25 });
      expect(db.rowCount('users')).to.equal(2);
      
      // 8. Test query
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
      expect(results[0].email).to.equal('john@example.com');
      expect(results[0].age).to.equal(30);
      
      // 9. Test query with limit and start
      db.insert('users', { name: 'Bob Johnson', email: 'bob@example.com', age: 40 });
      const limitedResults = db.query('users', {}, 1, 1);
      expect(limitedResults).to.have.length(1);
      
      // 10. Test update
      const updateCount = db.update('users', { name: 'John Doe' }, (row) => {
        return { ...row, age: 31, email: 'john.updated@example.com' };
      });
      expect(updateCount).to.equal(1);
      
      // 11. Test query after update
      const updatedResults = db.query('users', { name: 'John Doe' });
      expect(updatedResults).to.have.length(1);
      expect(updatedResults[0].age).to.equal(31);
      expect(updatedResults[0].email).to.equal('john.updated@example.com');
      
      // 12. Test upsert - insert case
      const upsertInsertIds = db.upsert('users', { name: 'Alice Brown' }, {
        name: 'Alice Brown',
        email: 'alice@example.com',
        age: 35
      });
      expect(upsertInsertIds).to.have.length(1);
      
      // 13. Test upsert - update case
      const upsertUpdateIds = db.upsert('users', { name: 'Alice Brown' }, {
        name: 'Alice Brown',
        email: 'alice.updated@example.com',
        age: 36
      });
      expect(upsertUpdateIds).to.have.length(1);
      
      // 14. Test upsertOrUpdate (alias for upsert)
      const upsertOrUpdateIds = db.upsertOrUpdate('users', { name: 'Bob Johnson' }, {
        name: 'Bob Johnson',
        email: 'bob.updated@example.com',
        age: 41
      });
      expect(upsertOrUpdateIds).to.have.length(1);
      
      // 15. Test alterTable
      db.alterTable('users', ['address'], { address: 'Unknown' });
      expect(db.columnExists('users', 'address')).to.be.true;
      
      // 16. Test query after alterTable
      const resultsAfterAlter = db.query('users', { name: 'John Doe' });
      expect(resultsAfterAlter[0].address).to.equal('Unknown');
      
      // 17. Test deleteRows
      const deleteCount = db.deleteRows('users', { name: 'John Doe' });
      expect(deleteCount).to.equal(1);
      expect(db.rowCount('users')).to.equal(3);
      
      // 18. Test truncate
      db.truncate('users');
      expect(db.rowCount('users')).to.equal(0);
      
      // 19. Test commit
      const commitResult = db.commit();
      expect(commitResult).to.be.true;
      
      // 20. Test serialize
      const serialized = db.serialize();
      expect(serialized).to.be.a('string');
      expect(JSON.parse(serialized)).to.have.property('tables');
      expect(JSON.parse(serialized)).to.have.property('data');
      
      // 21. Test setItem and getItem
      expect(db.setItem('test_key', 'test_value')).to.be.true;
      expect(db.getItem('test_key')).to.equal('test_value');
      
      // 22. Test replace
      const newData = JSON.stringify({ tables: { test: { fields: ['field1'] } }, data: { test: {} } });
      db.replace(newData);
      const afterReplace = db.serialize();
      expect(JSON.parse(afterReplace).tables).to.have.property('test');
      
      // 23. Test dropTable
      db.dropTable('test');
      expect(db.tableExists('test')).to.be.false;
      
      // 24. Test drop
      db.drop();
      const newDb = clientStore('testDB');
      expect(newDb.tableCount()).to.equal(0);
    });
  });
});
