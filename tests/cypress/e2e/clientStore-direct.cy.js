/// <reference types="cypress" />

describe('clientStore Direct Implementation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the test page that loads the actual clientStore implementation
    cy.visit('tests/cypress/fixtures/test.html');
    
    // Make sure clientStore is available
    cy.window().should('have.property', 'clientStore');
  });

  it('should create a new clientStore instance and perform basic operations', () => {
    // Use the actual clientStore implementation loaded in the test page
    cy.window().then((win) => {
      // Create a clientStore instance
      const db = win.clientStore('testDB');
      
      // Test basic functionality
      expect(db).to.exist;
      
      // Create a table
      expect(db.createTable('users', ['name', 'email'])).to.be.true;
      expect(db.tableExists('users')).to.be.true;
      
      // Insert data
      const id = db.insert('users', { name: 'John Doe', email: 'john@example.com' });
      expect(id).to.be.a('string');
      
      // Query data
      const results = db.query('users', { name: 'John Doe' });
      expect(results).to.have.length(1);
      expect(results[0].name).to.equal('John Doe');
      
      // Update data
      const updateCount = db.update('users', { name: 'John Doe' }, (row) => {
        return { email: 'john.updated@example.com' };
      });
      expect(updateCount).to.equal(1);
      
      // Verify update
      const updatedResults = db.query('users', { name: 'John Doe' });
      expect(updatedResults[0].email).to.equal('john.updated@example.com');
      
      // Delete data
      const deleteCount = db.deleteRows('users', { name: 'John Doe' });
      expect(deleteCount).to.equal(1);
      expect(db.rowCount('users')).to.equal(0);
      
      // Drop table
      expect(db.dropTable('users')).to.be.true;
      expect(db.tableExists('users')).to.be.false;
      
      // Test storage operations
      db.createTable('items', ['name', 'price']);
      db.insert('items', { name: 'Item 1', price: 10 });
      
      // Export storage
      const exported = db.exportStorage();
      expect(exported).to.be.a('string');
      
      // Drop storage
      db.dropStorage();
      expect(db.tableExists('items')).to.be.false;
      
      // Import storage
      db.importStorage(exported);
      expect(db.tableExists('items')).to.be.true;
      expect(db.rowCount('items')).to.equal(1);
    });
  });
});
