/// <reference types="cypress" />
/// <reference path="../support/clientStore.d.ts" />

describe('clientStore Real Implementation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Create a test HTML file that loads the actual clientStore implementation
    cy.writeFile('cypress/fixtures/real-test.html', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>clientStore Real Implementation Test</title>
        <!-- Load the actual clientStore implementation -->
        <script src="/dist/clientStore.js"></script>
      </head>
      <body>
        <h1>clientStore Real Implementation Test</h1>
      </body>
      </html>
    `);
    
    // Visit the test page
    cy.visit('cypress/fixtures/real-test.html');
  });

  it('should create a new database with the real implementation', () => {
    cy.window().then((win) => {
      // Verify clientStore is loaded
      expect(win.clientStore).to.exist;
      
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Check if the database was created
      expect(db.isNew()).to.be.true;
    });
  });

  it('should create a table and insert data with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      expect(db.createTable('usersTable', ['name', 'email', 'age'])).to.be.true;
      
      // Insert data with camelCase parameter
      const id = db.insert('usersTable', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Verify the data was inserted
      expect(id).to.not.be.null;
      
      // Commit the changes
      expect(db.commit()).to.be.true;
      
      // Query the data with camelCase parameter
      const users = db.query('usersTable');
      expect(users.length).to.equal(1);
      expect(users[0].name).to.equal('John Doe');
      expect(users[0].email).to.equal('john@example.com');
      expect(users[0].age).to.equal(30);
    });
  });

  it('should update data with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      db.createTable('usersTable', ['name', 'email', 'age']);
      
      // Insert data with camelCase parameter
      const id = db.insert('usersTable', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Update the data with camelCase parameters
      db.update('usersTable', { name: 'John Doe' }, (user) => {
        user.age = 31;
        return user;
      });
      
      // Commit the changes
      db.commit();
      
      // Query the data with camelCase parameter
      const users = db.query('usersTable');
      expect(users.length).to.equal(1);
      expect(users[0].age).to.equal(31);
    });
  });

  it('should delete data with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      db.createTable('usersTable', ['name', 'email', 'age']);
      
      // Insert data with camelCase parameter
      db.insert('usersTable', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Delete the data with camelCase parameter
      const deletedCount = db.deleteRows('usersTable', { name: 'John Doe' });
      
      // Verify the data was deleted
      expect(deletedCount).to.equal(1);
      
      // Commit the changes
      db.commit();
      
      // Query the data with camelCase parameter
      const users = db.query('usersTable');
      expect(users.length).to.equal(0);
    });
  });

  it('should test alterTable with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      db.createTable('usersTable', ['name', 'email']);
      
      // Alter the table with camelCase parameters
      expect(db.alterTable('usersTable', ['age', 'address'], { age: 0, address: '' })).to.be.true;
      
      // Insert data with the new fields
      const id = db.insert('usersTable', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        address: '123 Main St'
      });
      
      // Commit the changes
      db.commit();
      
      // Query the data with camelCase parameter
      const users = db.query('usersTable');
      expect(users.length).to.equal(1);
      expect(users[0].age).to.equal(30);
      expect(users[0].address).to.equal('123 Main St');
    });
  });

  it('should test queryAll with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      db.createTable('usersTable', ['name', 'email', 'age']);
      
      // Insert multiple records
      db.insert('usersTable', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      db.insert('usersTable', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 25
      });
      
      // Commit the changes
      db.commit();
      
      // Use queryAll with camelCase parameters
      const users = db.query('usersTable', {
        query: { age: 25 },
        limit: 10,
        start: 0
      });
      
      expect(users.length).to.equal(1);
      expect(users[0].name).to.equal('Jane Smith');
    });
  });

  it('should test insertOrUpdate with camelCase parameters', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientStore('testRealDB');
      
      // Create a table with camelCase parameter
      db.createTable('usersTable', ['name', 'email', 'age']);
      
      // Use insertOrUpdate to insert a new record
      const insertIds = db.insertOrUpdate('usersTable', { name: 'John Doe' }, {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      
      // Commit the changes
      db.commit();
      
      // Verify the record was inserted
      let users = db.query('usersTable');
      expect(users.length).to.equal(1);
      expect(users[0].age).to.equal(30);
      
      // Use insertOrUpdate to update the existing record
      const updateIds = db.insertOrUpdate('usersTable', { name: 'John Doe' }, {
        name: 'John Doe',
        email: 'john.updated@example.com',
        age: 31
      });
      
      // Commit the changes
      db.commit();
      
      // Verify the record was updated
      users = db.query('usersTable');
      expect(users.length).to.equal(1);
      expect(users[0].email).to.equal('john.updated@example.com');
      expect(users[0].age).to.equal(31);
    });
  });
});
