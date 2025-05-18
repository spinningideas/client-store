/// <reference types="cypress" />

describe('clientStore Implementation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the test page that loads the actual clientStore implementation
    cy.visit('tests/cypress/fixtures/test.html');
    
    // Make sure clientStore is available
    cy.window().should('have.property', 'clientStore');
  });

  it('should create a new clientStore instance', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      expect(db).to.exist;
      // Check for some of the expected methods
      expect(db.createTable).to.be.a('function');
      expect(db.exportStorage).to.be.a('function');
      expect(db.importStorage).to.be.a('function');
      expect(db.dropStorage).to.be.a('function');
    });
  });

  it('should create a table with fields', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      const result = db.createTable('users', ['id', 'name', 'email']);
      expect(result).to.be.true;
      expect(db.tableExists('users')).to.be.true;
      expect(db.tableFields('users')).to.deep.equal(['id', 'name', 'email']);
    });
  });

  it('should insert data into a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      const id = db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      expect(id).to.be.a('string');
      expect(db.rowCount('users')).to.equal(1);
    });
  });

  it('should query data from a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      db.insert('users', { id: 2, name: 'Jane Smith', email: 'jane@example.com' });
      
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
      expect(results[0].email).to.equal('john@example.com');
    });
  });

  it('should update data in a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      
      const updateCount = db.update('users', { name: 'John Doe' }, (row) => {
        return { email: 'john.doe@example.com' };
      });
      
      expect(updateCount).to.equal(1);
      const results = db.query('users', { name: 'John Doe' });
      expect(results[0].email).to.equal('john.doe@example.com');
    });
  });

  it('should delete data from a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      db.insert('users', { id: 2, name: 'Jane Smith', email: 'jane@example.com' });
      
      const deleteCount = db.deleteRows('users', { name: 'John Doe' });
      expect(deleteCount).to.equal(1);
      expect(db.rowCount('users')).to.equal(1);
    });
  });

  it('should upsert data in a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      
      // Insert new record
      const ids1 = db.upsert('users', { name: 'John Doe' }, { id: 1, name: 'John Doe', email: 'john@example.com' });
      expect(ids1).to.have.length(1);
      
      // Update existing record
      const ids2 = db.upsert('users', { name: 'John Doe' }, { id: 1, name: 'John Doe', email: 'john.doe@example.com' });
      expect(ids2).to.have.length(1);
      
      const results = db.query('users', { name: 'John Doe' });
      expect(results[0].email).to.equal('john.doe@example.com');
    });
  });

  it('should alter a table by adding new fields', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name']);
      
      const result = db.alterTable('users', ['email', 'phone']);
      expect(result).to.be.true;
      
      const fields = db.tableFields('users');
      expect(fields).to.include('id');
      expect(fields).to.include('name');
      expect(fields).to.include('email');
      expect(fields).to.include('phone');
    });
  });

  it('should drop a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      
      const result = db.dropTable('users');
      expect(result).to.be.true;
      expect(db.tableExists('users')).to.be.false;
    });
  });

  it('should truncate a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      db.insert('users', { id: 2, name: 'Jane Smith', email: 'jane@example.com' });
      
      const result = db.truncate('users');
      expect(result).to.be.true;
      expect(db.rowCount('users')).to.equal(0);
      expect(db.tableExists('users')).to.be.true;
    });
  });

  it('should check if a column exists', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      
      expect(db.columnExists('users', 'name')).to.be.true;
      expect(db.columnExists('users', 'phone')).to.be.false;
    });
  });

  it('should export and import storage', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      
      // Export the data
      const exported = db.exportStorage();
      expect(exported).to.be.a('string');
      
      // Create a new DB and import the data
      const db2 = win.clientStore('testDB2');
      db2.importStorage(exported);
      
      // Verify the imported data
      expect(db2.tableExists('users')).to.be.true;
      expect(db2.rowCount('users')).to.equal(1);
      
      const results = db2.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].email).to.equal('john@example.com');
    });
  });

  it('should drop storage', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['id', 'name', 'email']);
      db.insert('users', { id: 1, name: 'John Doe', email: 'john@example.com' });
      
      db.dropStorage();
      
      // Create a new instance with the same name
      const db2 = win.clientStore('testDB');
      expect(db2.tableExists('users')).to.be.false;
    });
  });

  it('should create a table with specified fields', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Verify table exists
      expect(db.tableExists('users')).to.be.true;
      
      // Verify table fields
      const fields = db.tableFields('users');
      expect(fields).to.deep.equal(['name', 'email', 'age']);
    });
  });

  it('should insert data into a table', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert a record
      const rowId = db.insert('users', { 
        name: 'John Doe', 
        email: 'john@example.com', 
        age: 30 
      });
      
      // Verify row ID is returned
      expect(rowId).to.be.a('string');
      
      // Query the record to verify it was inserted
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
      expect(results[0].email).to.equal('john@example.com');
      expect(results[0].age).to.equal(30);
    });
  });

  it('should query data by field values', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert multiple records
      db.insert('users', { name: 'John Doe', email: 'john@example.com', age: 30 });
      db.insert('users', { name: 'Jane Smith', email: 'jane@example.com', age: 25 });
      db.insert('users', { name: 'Bob Johnson', email: 'bob@example.com', age: 40 });
      
      // Query by name
      const results1 = db.query('users', { name: 'Jane Smith' });
      expect(results1).to.have.length(1);
      expect(results1[0].name).to.equal('Jane Smith');
      
      // Query by age
      const results2 = db.query('users', { age: 40 });
      expect(results2).to.have.length(1);
      expect(results2[0].name).to.equal('Bob Johnson');
    });
  });

  it('should update existing records', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert a record
      const rowId = db.insert('users', { 
        name: 'John Doe', 
        email: 'john@example.com', 
        age: 30 
      });
      
      // Update the record
      const updateCount = db.update('users', { name: 'John Doe' }, (row) => {
        return { ...row, age: 31, email: 'john.doe@example.com' };
      });
      
      // Verify update count
      expect(updateCount).to.equal(1);
      
      // Query to verify the update
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].age).to.equal(31);
      expect(results[0].email).to.equal('john.doe@example.com');
    });
  });

  it('should delete records', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Insert records
      db.insert('users', { name: 'John Doe', email: 'john@example.com', age: 30 });
      db.insert('users', { name: 'Jane Smith', email: 'jane@example.com', age: 25 });
      
      // Delete a record
      const deleteCount = db.deleteRows('users', { name: 'John Doe' });
      
      // Verify delete count
      expect(deleteCount).to.equal(1);
      
      // Query to verify the record was deleted
      const results = db.query('users', {});
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('Jane Smith');
    });
  });

  it('should use upsert to insert or update records', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email', 'age']);
      
      // Use upsert to insert a new record
      const ids1 = db.upsert('users', { name: 'John Doe' }, { 
        name: 'John Doe', 
        email: 'john@example.com', 
        age: 30 
      });
      
      // Verify record was inserted
      expect(ids1).to.have.length(1);
      
      // Use upsert to update the existing record
      const ids2 = db.upsert('users', { name: 'John Doe' }, { 
        name: 'John Doe', 
        email: 'john.updated@example.com', 
        age: 31 
      });
      
      // Verify record was updated
      expect(ids2).to.have.length(1);
      
      // Query to verify the update
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].email).to.equal('john.updated@example.com');
      expect(results[0].age).to.equal(31);
    });
  });

  it('should alter table to add new fields', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email']);
      
      // Insert a record
      db.insert('users', { name: 'John Doe', email: 'john@example.com' });
      
      // Alter table to add a new field
      db.alterTable('users', ['age'], { age: 0 });
      
      // Verify new field exists
      const fields = db.tableFields('users');
      expect(fields).to.include('age');
      
      // Query to verify default value was applied
      const results = db.query('users', { name: 'John Doe' });
      expect(results[0]).to.have.property('age');
      expect(results[0].age).to.equal(0);
    });
  });

  it('should persist data with commit', () => {
    cy.window().then((win) => {
      // Create DB and add data
      const db1 = win.clientStore('testDB');
      db1.createTable('users', ['name', 'email']);
      db1.insert('users', { name: 'John Doe', email: 'john@example.com' });
      
      // Commit changes
      const commitResult = db1.commit();
      expect(commitResult).to.be.true;
      
      // Create a new instance and verify data persists
      const db2 = win.clientStore('testDB');
      expect(db2.tableExists('users')).to.be.true;
      
      const results = db2.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
    });
  });

  it('should drop tables', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email']);
      db.createTable('products', ['name', 'price']);
      
      // Verify tables exist
      expect(db.tableExists('users')).to.be.true;
      expect(db.tableExists('products')).to.be.true;
      
      // Drop a table
      db.dropTable('users');
      
      // Verify table was dropped
      expect(db.tableExists('users')).to.be.false;
      expect(db.tableExists('products')).to.be.true;
    });
  });

  it('should truncate tables', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      db.createTable('users', ['name', 'email']);
      
      // Insert records
      db.insert('users', { name: 'John Doe', email: 'john@example.com' });
      db.insert('users', { name: 'Jane Smith', email: 'jane@example.com' });
      
      // Verify records exist
      expect(db.query('users', {}).length).to.equal(2);
      
      // Truncate the table
      db.truncate('users');
      
      // Verify table is empty but still exists
      expect(db.tableExists('users')).to.be.true;
      expect(db.query('users', {}).length).to.equal(0);
    });
  });
});
