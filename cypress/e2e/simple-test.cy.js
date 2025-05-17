describe('clientDB Parameter Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the test page with our mock implementation
    cy.visit('cypress/fixtures/simple-test.html');
  });

  it('should use camelCase parameters in createTable', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Call the method with camelCase parameter
      db.createTable('usersTable', ['name', 'email']);
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the createTable call
      const createTableCall = calls.find(call => call.method === 'createTable');
      expect(createTableCall).to.not.be.undefined;
      expect(createTableCall.args[0]).to.equal('usersTable'); // tableName parameter
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
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the insert call
      const insertCall = calls.find(call => call.method === 'insert');
      expect(insertCall).to.not.be.undefined;
      expect(insertCall.args[0]).to.equal('usersTable'); // tableName parameter
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
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the update call
      const updateCall = calls.find(call => call.method === 'update');
      expect(updateCall).to.not.be.undefined;
      expect(updateCall.args[0]).to.equal('usersTable'); // tableName parameter
      expect(updateCall.args[2]).to.equal(updateFn); // updateFunction parameter
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
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Verify the parameter names - the index might vary based on how many calls were made
      // Find the deleteRows call
      const deleteRowsCall = calls.find(call => call.method === 'deleteRows');
      expect(deleteRowsCall).to.not.be.undefined;
      expect(deleteRowsCall.args[0]).to.equal('usersTable'); // tableName parameter
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
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the alterTable call
      const alterTableCall = calls.find(call => call.method === 'alterTable');
      expect(alterTableCall).to.not.be.undefined;
      expect(alterTableCall.args[0]).to.equal('usersTable'); // tableName parameter
      expect(alterTableCall.args[1]).to.deep.equal(['age', 'address']); // newFields parameter
    });
  });
  
  it('should use camelCase parameters in query with object params', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email', 'age']);
      
      // Insert some test data
      db.insert('usersTable', { name: 'John', email: 'john@example.com', age: 30 });
      db.insert('usersTable', { name: 'Jane', email: 'jane@example.com', age: 25 });
      
      // Call the query method with params object (modern approach)
      db.query('usersTable', {
        query: { age: 25 },
        limit: 10,
        start: 0,
        sort: [['name', 'ASC']],
        distinct: ['name']
      });
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the query call
      const queryCall = calls.find(call => call.method === 'query');
      expect(queryCall).to.not.be.undefined;
      expect(queryCall.args[0]).to.equal('usersTable'); // tableName parameter
      
      // Check that the params object has the correct properties
      const params = queryCall.args[1];
      expect(params).to.be.an('object');
      expect(params.query).to.deep.equal({ age: 25 });
      expect(params.limit).to.equal(10);
      expect(params.start).to.equal(0);
      expect(params.sort).to.deep.equal([['name', 'ASC']]);
      expect(params.distinct).to.deep.equal(['name']);
    });
  });
  
  it('should handle simple query calls with just the tableName', () => {
    cy.window().then((win) => {
      // Create a new database
      const db = new win.clientDB('testDB');
      
      // Create a table
      db.createTable('usersTable', ['name', 'email']);
      
      // Call query with just the tableName to get all records
      db.query('usersTable');
      
      // Get the recorded parameter calls
      const calls = db.getParameterCalls();
      
      // Log the calls to help debug
      cy.log('Calls:', JSON.stringify(calls));
      
      // Find the query call
      const queryCall = calls.find(call => call.method === 'query');
      expect(queryCall).to.not.be.undefined;
      expect(queryCall.args[0]).to.equal('usersTable'); // tableName parameter
      expect(queryCall.args[1]).to.be.undefined; // No params provided
    });
  });
});
