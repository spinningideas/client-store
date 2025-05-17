/// <reference types="cypress" />

describe('clientStore Implementation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit a basic HTML page for testing
    cy.visit('tests/cypress/fixtures/test.html');
    
    // Wait for clientStore to be loaded
    cy.window().should('have.property', 'clientStore');
  });

  it('should create a new clientStore instance', () => {
    cy.window().then((win) => {
      const db = win.clientStore('testDB');
      expect(db).to.exist;
      expect(db.storageExists).to.be.true;
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
