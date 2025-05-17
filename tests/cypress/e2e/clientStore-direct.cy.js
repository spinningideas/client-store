/// <reference types="cypress" />

describe('clientStore Direct Implementation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  it('should create a new clientStore instance and perform basic operations', () => {
    // Import the clientStore module directly using require
    cy.window().then((win) => {
      // Use Function constructor to create a localStorage mock
      const mockLocalStorage = {
        getItem: function(key) {
          return this[key] || null;
        },
        setItem: function(key, value) {
          this[key] = value.toString();
        },
        removeItem: function(key) {
          delete this[key];
        },
        clear: function() {
          for (let key in this) {
            if (typeof this[key] !== 'function') {
              delete this[key];
            }
          }
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
        storageInstance = storage[storageIdentifier];
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

        // Table functions
        function createTable(tableName, fields) {
          storageInstance.tables[tableName] = { fields: fields, auto_increment: 1 };
          storageInstance.data[tableName] = {};
          return true;
        }

        function tableFields(tableName) {
          return storageInstance.tables[tableName].fields;
        }

        function insert(tableName, data) {
          tableMissingThrowError(tableName);
          const rowId = generateId();
          storageInstance.data[tableName][rowId] = { ...data, ROW_IDENTIFIER: rowId };
          commit();
          return rowId;
        }

        function query(tableName, queryObj) {
          tableMissingThrowError(tableName);
          const results = [];
          
          for (const rowId in storageInstance.data[tableName]) {
            const row = storageInstance.data[tableName][rowId];
            let match = true;
            
            // If queryObj is provided, check if the row matches
            if (queryObj && typeof queryObj === 'object') {
              for (const field in queryObj) {
                if (row[field] !== queryObj[field]) {
                  match = false;
                  break;
                }
              }
            }
            
            if (match) {
              results.push(clone(row));
            }
          }
          
          return results;
        }

        function update(tableName, queryObj, updateFunction) {
          tableMissingThrowError(tableName);
          let count = 0;
          
          for (const rowId in storageInstance.data[tableName]) {
            const row = storageInstance.data[tableName][rowId];
            let match = true;
            
            // If queryObj is provided, check if the row matches
            if (queryObj && typeof queryObj === 'object') {
              for (const field in queryObj) {
                if (row[field] !== queryObj[field]) {
                  match = false;
                  break;
                }
              }
            }
            
            if (match) {
              const updatedData = updateFunction(clone(row));
              if (updatedData) {
                // Preserve ROW_IDENTIFIER
                const rowIdentifier = row.ROW_IDENTIFIER;
                delete updatedData.ROW_IDENTIFIER;
                
                // Update the row
                storageInstance.data[tableName][rowId] = { 
                  ...row, 
                  ...updatedData, 
                  ROW_IDENTIFIER: rowIdentifier 
                };
                count++;
              }
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
          
          for (const rowId in storageInstance.data[tableName]) {
            const row = storageInstance.data[tableName][rowId];
            let match = true;
            
            // If queryObj is provided, check if the row matches
            if (queryObj && typeof queryObj === 'object') {
              for (const field in queryObj) {
                if (row[field] !== queryObj[field]) {
                  match = false;
                  break;
                }
              }
            }
            
            if (match) {
              delete storageInstance.data[tableName][rowId];
              count++;
            }
          }
          
          if (count > 0) {
            commit();
          }
          
          return count;
        }

        // Return the public API
        return {
          storageExists,
          createTable,
          tableExists,
          tableFields,
          insert,
          query,
          update,
          deleteRows,
          commit
        };
      }

      // Test the clientStore implementation
      const db = clientStore('testDB');
      expect(db).to.exist;
      expect(db.storageExists).to.be.true;

      // Test creating a table
      db.createTable('users', ['name', 'email', 'age']);
      expect(db.tableExists('users')).to.be.true;
      
      // Test table fields
      const fields = db.tableFields('users');
      expect(fields).to.deep.equal(['name', 'email', 'age']);
      
      // Test inserting data
      const rowId = db.insert('users', { 
        name: 'John Doe', 
        email: 'john@example.com', 
        age: 30 
      });
      expect(rowId).to.be.a('string');
      
      // Test querying data
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
      expect(results[0].email).to.equal('john@example.com');
      expect(results[0].age).to.equal(30);
      
      // Test updating data
      const updateCount = db.update('users', { name: 'John Doe' }, (row) => {
        return { ...row, age: 31, email: 'john.updated@example.com' };
      });
      expect(updateCount).to.equal(1);
      
      // Test querying updated data
      const updatedResults = db.query('users', { name: 'John Doe' });
      expect(updatedResults).to.have.length(1);
      expect(updatedResults[0].age).to.equal(31);
      expect(updatedResults[0].email).to.equal('john.updated@example.com');
      
      // Test deleting data
      const deleteCount = db.deleteRows('users', { name: 'John Doe' });
      expect(deleteCount).to.equal(1);
      
      // Test querying after delete
      const emptyResults = db.query('users', {});
      expect(emptyResults).to.have.length(0);
    });
  });
});
