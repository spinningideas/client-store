/// <reference types="cypress" />

describe('clientStore Public Methods Tests', () => {
  // Test each public method individually
  
  // List of all public methods to test
  const publicMethods = [
    'importStorage',
    'exportStorage',
    'dropStorage',
    'getItem',
    'setItem',
    'tableCount',
    'commit',
    'tableExists',
    'tableFields',
    'createTable',
    'alterTable',
    'dropTable',
    'truncate',
    'columnExists',
    'rowCount',
    'query',
    'insert',
    'upsert',
    'upsertOrUpdate',
    'update',
    'deleteRows'
  ];
  
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the test page that loads the actual clientStore implementation
    cy.visit('tests/cypress/fixtures/test.html');
    
    // Make sure clientStore is available
    cy.window().should('have.property', 'clientStore');
  });
  
  // Test that all public methods exist
  it('should expose all public methods', () => {
    cy.window().then(win => {
      // Create a clientStore instance using the actual implementation
      const db = win.clientStore('testDB');
      
      // Verify all public methods exist
      publicMethods.forEach(method => {
        expect(db[method]).to.be.a('function', `Method ${method} should exist`);
      });
    });
  });
  
  // Test basic functionality of each method
  // Test individual method functionality
  it('should have working methods', () => {
    cy.window().then(win => {
      // Create a clientStore instance using the actual implementation
      const db = win.clientStore('testDB');
      
      // Test each method with basic functionality
      
      // Test createTable
      expect(db.createTable('users', ['name', 'email'])).to.be.true;
      expect(db.tableExists('users')).to.be.true;
      expect(db.tableCount()).to.equal(1);
      
      // Test tableFields
      expect(db.tableFields('users')).to.deep.equal(['name', 'email']);
      
      // Test columnExists
      expect(db.columnExists('users', 'name')).to.be.true;
      expect(db.columnExists('users', 'nonexistent')).to.be.false;
      
      // Test insert
      const rowId = db.insert('users', { name: 'John', email: 'john@example.com' });
      expect(rowId).to.be.a('string');
      
      // Test rowCount
      expect(db.rowCount('users')).to.equal(1);
      
      // Test query
      const results = db.query('users');
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John');
      expect(results[0].email).to.equal('john@example.com');
      
      // Test update
      const updateCount = db.update('users', { name: 'John' }, (row) => {
        return { email: 'john.doe@example.com' };
      });
      expect(updateCount).to.be.at.least(1);
      
      // Test query after update
      const updatedResults = db.query('users');
      expect(updatedResults[0].email).to.equal('john.doe@example.com');
      
      // Test upsert (insert case)
      const upsertIds = db.upsert('users', { name: 'Jane' }, { name: 'Jane', email: 'jane@example.com' });
      expect(upsertIds).to.be.an('array');
      expect(upsertIds).to.have.length.at.least(1);
      
      // Test upsert (update case)
      const upsertUpdateIds = db.upsert('users', { name: 'Jane' }, { name: 'Jane', email: 'jane.doe@example.com' });
      expect(upsertUpdateIds).to.be.an('array');
      expect(upsertUpdateIds).to.have.length.at.least(1);
      
      // Test upsertOrUpdate (alias to upsert)
      const upsertOrUpdateIds = db.upsertOrUpdate('users', { name: 'Bob' }, { name: 'Bob', email: 'bob@example.com' });
      expect(upsertOrUpdateIds).to.be.an('array');
      expect(upsertOrUpdateIds).to.have.length.at.least(1);
      
      // Test deleteRows
      const deleteCount = db.deleteRows('users', { name: 'Bob' });
      expect(deleteCount).to.be.at.least(1);
      
      // Test alterTable
      expect(db.alterTable('users', ['phone'])).to.be.true;
      expect(db.tableFields('users')).to.include('phone');
      
      // Test truncate
      expect(db.truncate('users')).to.be.true;
      expect(db.rowCount('users')).to.equal(0);
      
      // Test dropTable
      expect(db.dropTable('users')).to.be.true;
      expect(db.tableExists('users')).to.be.false;
      
      // Test exportStorage and importStorage
      db.createTable('items', ['name', 'price']);
      db.insert('items', { name: 'Item 1', price: 10 });
      const exported = db.exportStorage();
      expect(exported).to.be.a('string');
      
      // Create a new instance and import
      const db2 = win.clientStore('testDB2');
      db2.importStorage(exported);
      expect(db2.tableExists('items')).to.be.true;
      expect(db2.rowCount('items')).to.equal(1);
      
      // Test dropStorage
      db.dropStorage();
      expect(db.tableCount()).to.equal(0);
    });
  });
});
