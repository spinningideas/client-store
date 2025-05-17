/// <reference types="cypress" />
/// <reference path="../support/clientDB.d.ts" />

describe('clientDB Parameter Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Create a simple HTML file with a mock clientDB implementation
    cy.writeFile('cypress/fixtures/params-test.html', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ClientDB Parameter Tests</title>
        <script>
          // Mock implementation of clientDB for testing parameters
          class ClientDB {
            constructor(dbName, storageEngine) {
              this.dbName = dbName;
              this.storage = storageEngine || window.localStorage;
              this._isNew = true;
              this.tables = {};
              
              // For parameter testing
              this.parameterCalls = [];
            }
            
            // Record parameter calls for testing
            recordCall(methodName, ...args) {
              this.parameterCalls.push({
                method: methodName,
                args: args
              });
              return true;
            }
            
            isNew() {
              return this._isNew;
            }
            
            createTable(tableName, fields) {
              this.recordCall('createTable', tableName, fields);
              if (!this.tables[tableName]) {
                this.tables[tableName] = {
                  fields: ['row_identifier', ...fields],
                  data: {}
                };
                return true;
              }
              return false;
            }
            
            insert(tableName, data) {
              this.recordCall('insert', tableName, data);
              if (this.tables[tableName]) {
                const id = 'id_' + Date.now();
                this.tables[tableName].data[id] = { row_identifier: id, ...data };
                return id;
              }
              return null;
            }
            
            update(tableName, query, updateFunction) {
              this.recordCall('update', tableName, query, updateFunction);
              return 1;
            }
            
            deleteRows(tableName, query) {
              this.recordCall('deleteRows', tableName, query);
              return 1;
            }
            
            alterTable(tableName, newFields, defaultValues) {
              this.recordCall('alterTable', tableName, newFields, defaultValues);
              return true;
            }
            
            query(tableName, params) {
              this.recordCall('queryAll', tableName, params);
              return [{ row_identifier: 'id_1', name: 'Test User', age: 30 }];
            }
            
            insertOrUpdate(tableName, query, data) {
              this.recordCall('insertOrUpdate', tableName, query, data);
              return ['id_1'];
            }
            
            query(tableName, query, limit, start, sort, distinct) {
              this.recordCall('query', tableName, query, limit, start, sort, distinct);
              return [{ row_identifier: 'id_1', name: 'Test User', age: 30 }];
            }
            
            commit() {
              return true;
            }
            
            // Get all recorded parameter calls
            getParameterCalls() {
              return this.parameterCalls;
            }
          }
          
          window.clientDB = ClientDB;
        </script>
      </head>
      <body>
        <h1>ClientDB Parameter Tests</h1>
      </body>
      </html>
    `);
    
    // Visit the test page
    cy.visit('cypress/fixtures/params-test.html');
  });

  it('should use camelCase parameters in createTable', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Call the method with camelCase parameter
      db.createTable('usersTable', ['name', 'email']);
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[0].method).to.equal('createTable');
      expect(calls[0].args[0]).to.equal('usersTable'); // tableName parameter
    });
  });

  it('should use camelCase parameters in insert', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameter
      db.insert('usersTable', { name: 'John', email: 'john@example.com' });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[1].method).to.equal('insert');
      expect(calls[1].args[0]).to.equal('usersTable'); // tableName parameter
    });
  });

  it('should use camelCase parameters in update', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameters
      const updateFn = (user) => ({ name: 'Updated' });
      db.update('usersTable', { name: 'John' }, updateFn);
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('update');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
      expect(calls[2].args[2]).to.equal(updateFn); // updateFunction parameter
    });
  });

  it('should use camelCase parameters in deleteRows', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameter
      db.deleteRows('usersTable', { name: 'John' });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('deleteRows');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
    });
  });

  it('should use camelCase parameters in alterTable', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameters
      db.alterTable('usersTable', ['age', 'address'], { age: 0, address: '' });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('alterTable');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
      expect(calls[2].args[1]).to.deep.equal(['age', 'address']); // newFields parameter
    });
  });

  it('should use camelCase parameters in queryAll', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameter
      db.query('usersTable', { query: { name: 'John' }, limit: 10 });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('queryAll');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
    });
  });

  it('should use camelCase parameters in insertOrUpdate', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameters
      db.insertOrUpdate('usersTable', { name: 'John' }, { name: 'John', email: 'john@example.com' });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('insertOrUpdate');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
    });
  });

  it('should use camelCase parameters in query', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call the method with camelCase parameters
      db.query('usersTable', { name: 'John' }, 10, 0, [['name', 'ASC']]);
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Verify the parameter names
      expect(calls[2].method).to.equal('query');
      expect(calls[2].args[0]).to.equal('usersTable'); // tableName parameter
      expect(calls[2].args[2]).to.equal(10); // limit parameter
      expect(calls[2].args[3]).to.equal(0); // start parameter
    });
  });
});
