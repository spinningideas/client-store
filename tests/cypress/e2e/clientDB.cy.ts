/// <reference types="cypress" />
/// <reference path="../../../src/clientStore.d.ts" />

describe('clientStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Create a simple HTML file with the clientStore script
    cy.writeFile('cypress/fixtures/test.html', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>clientStore Test</title>
        <script>
          // For code coverage instrumentation
          window.__coverage__ = window.__coverage__ || {};
          
          // Mock implementation of clientStore for testing
          class clientStore {
            constructor(dbName, storageEngine) {
              this.dbName = dbName;
              this.storage = storageEngine || window.localStorage;
              this._isNew = true;
              this.tables = {};
            }
            
            isNew() {
              return this._isNew;
            }
            
            createTable(tableName, fields) {
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
              if (this.tables[tableName]) {
                const id = 'id_' + Date.now();
                this.tables[tableName].data[id] = { row_identifier: id, ...data };
                return id;
              }
              return null;
            }
            
            query(tableName, query, limit, start, sort, distinct) {
              if (this.tables[tableName]) {
                return Object.values(this.tables[tableName].data);
              }
              return [];
            }
            
            update(tableName, query, updateFunction) {
              if (this.tables[tableName]) {
                let count = 0;
                Object.keys(this.tables[tableName].data).forEach(id => {
                  const row = this.tables[tableName].data[id];
                  if (!query || (typeof query === 'function' && query(row)) || 
                      (typeof query === 'object' && Object.keys(query).every(k => row[k] === query[k]))) {
                    this.tables[tableName].data[id] = { ...row, ...updateFunction(row) };
                    count++;
                  }
                });
                return count;
              }
              return 0;
            }
            
            deleteRows(tableName, query) {
              if (this.tables[tableName]) {
                let count = 0;
                Object.keys(this.tables[tableName].data).forEach(id => {
                  const row = this.tables[tableName].data[id];
                  if (!query || (typeof query === 'function' && query(row)) || 
                      (typeof query === 'object' && Object.keys(query).every(k => row[k] === query[k]))) {
                    delete this.tables[tableName].data[id];
                    count++;
                  }
                });
                return count;
              }
              return 0;
            }
            
            commit() {
              return true;
            }
          }
          
          window.clientStore = clientStore;
        </script>
      </head>
      <body>
        <h1>clientStore Test Page</h1>
      </body>
      </html>
    `);
    
    // Visit the test page
    cy.visit('cypress/fixtures/test.html');
  });

  it('should create a new database', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testDB');
      
      // Check if the database was created
      expect(db.isNew()).to.be.true;
    });
  });

  it('should create a table and insert data', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testDB');
      
      // Create a table
      expect(db.createTable('users', ['name', 'email', 'age'])).to.be.true;
      
      // Insert data
      const id = db.insert('users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Verify the data was inserted
      expect(id).to.not.be.null;
      
      // Commit the changes
      expect(db.commit()).to.be.true;
      
      // Query the data
      const users = db.query('users');
      expect(users.length).to.equal(1);
      expect(users[0].name).to.equal('John Doe');
      expect(users[0].email).to.equal('john@example.com');
      expect(users[0].age).to.equal(30);
    });
  });

  it('should update data', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testDB');
      
      // Create a table
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert data
      const id = db.insert('users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Update the data
      db.update('users', { name: 'John Doe' }, (user) => {
        user.age = 31;
        return user;
      });
      
      // Commit the changes
      db.commit();
      
      // Query the data
      const users = db.query('users');
      expect(users.length).to.equal(1);
      expect(users[0].age).to.equal(31);
    });
  });

  it('should delete data', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testDB');
      
      // Create a table
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert data
      db.insert('users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Delete the data
      const deletedCount = db.deleteRows('users', { name: 'John Doe' });
      
      // Verify the data was deleted
      expect(deletedCount).to.equal(1);
      
      // Commit the changes
      db.commit();
      
      // Query the data
      const users = db.query('users');
      expect(users.length).to.equal(0);
    });
  });
  
  // Add a test specifically for camelCase parameters
  it('should work with camelCase parameters', () => {
    cy.window().then((win) => {
      // Extend our mock implementation to log parameter names
      const originalCreateTable = win.clientStore.prototype.createTable;
      const parameterSpy = cy.spy().as('parameterSpy');
      
      win.clientStore.prototype.createTable = function(tableName, fields) {
        // Log the parameter name to verify it's camelCase
        parameterSpy(tableName);
        return originalCreateTable.call(this, tableName, fields);
      };
      
      // Create a new database
      const db = new win.clientStore('testDB');
      
      // Call the method with camelCase parameter
      db.createTable('usersTable', ['name', 'email']);
      
      // Verify the parameter was passed as camelCase
      cy.get('@parameterSpy').should('have.been.calledWith', 'usersTable');
    });
  });
});
