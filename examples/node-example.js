/**
 * Node.js Example for client-store
 * 
 * This example demonstrates how to use client-store in a Node.js environment.
 * Since client-store relies on localStorage/sessionStorage which are browser APIs,
 * we need to use a polyfill for Node.js environments.
 */

// Import the localStorage polyfill
// Note: In a real project, you would install this via npm:
// npm install node-localstorage
const { LocalStorage } = require('node-localstorage');

// Create a localStorage instance
const localStorage = new LocalStorage('./scratch');

// Import client-store
// Note: In a real project after npm install, you would use:
// const clientStore = require('client-store').default;
const clientStore = require('../dist/cjs/clientStore').default;

// Create a new database
const db = new clientStore('nodeExample', localStorage);

console.log('Creating database and table...');

// Check if this is a new database
if (db.isNew()) {
  console.log('Created a new database: nodeExample');
  
  // Create a table for products
  db.createTable('products', ['name', 'category', 'price', 'inStock']);
  console.log('Created "products" table with columns: name, category, price, inStock');
} else {
  console.log('Opened existing database: nodeExample');
  console.log(`Number of tables: ${db.tableCount()}`);
  
  if (db.tableExists('products')) {
    console.log(`Products table exists with ${db.rowCount('products')} records`);
  }
}

// Add sample products
console.log('\nAdding sample products...');
const products = [
  { name: 'Laptop', category: 'Electronics', price: 999.99, inStock: true },
  { name: 'Headphones', category: 'Electronics', price: 149.99, inStock: true },
  { name: 'Coffee Maker', category: 'Kitchen', price: 79.99, inStock: false },
  { name: 'Book', category: 'Books', price: 19.99, inStock: true },
  { name: 'Smartphone', category: 'Electronics', price: 799.99, inStock: true }
];

// Clear existing products
if (db.tableExists('products')) {
  db.truncate('products');
  console.log('Cleared existing products');
}

// Insert products
products.forEach(product => {
  const id = db.insert('products', product);
  console.log(`Inserted product "${product.name}" with ID: ${id}`);
});

// Commit changes
db.commit();
console.log(`Total products: ${db.rowCount('products')}`);

// Query all products
console.log('\nAll products:');
const allProducts = db.query('products');
console.log(JSON.stringify(allProducts, null, 2));

// Query electronics products
console.log('\nElectronics products:');
const electronics = db.query('products', { query: { category: 'Electronics' } });
console.log(JSON.stringify(electronics, null, 2));

// Query in-stock products
console.log('\nIn-stock products:');
const inStock = db.query('products', { query: { inStock: true } });
console.log(JSON.stringify(inStock, null, 2));

// Query products with price > 100
console.log('\nExpensive products (price > 100):');
const expensive = db.query('products', {
  query: function(product) {
    return product.price > 100;
  }
});
console.log(JSON.stringify(expensive, null, 2));

// Update products
console.log('\nUpdating products...');
const updated = db.update('products', { inStock: false }, function(product) {
  return { inStock: true };
});
console.log(`Updated ${updated} out-of-stock products to in-stock`);

// Apply a 10% price increase to all products
const priceUpdated = db.update('products', {}, function(product) {
  return { price: Math.round(product.price * 1.1 * 100) / 100 };
});
console.log(`Updated prices for ${priceUpdated} products (10% increase)`);

// Commit changes
db.commit();

// Show updated products
console.log('\nUpdated products:');
const updatedProducts = db.query('products');
console.log(JSON.stringify(updatedProducts, null, 2));

// Delete a product
console.log('\nDeleting a product...');
const deleted = db.deleteRows('products', { name: 'Book' });
console.log(`Deleted ${deleted} products`);

// Commit changes
db.commit();

// Show remaining products
console.log('\nRemaining products:');
const remainingProducts = db.query('products');
console.log(JSON.stringify(remainingProducts, null, 2));

console.log('\nExample completed successfully!');
