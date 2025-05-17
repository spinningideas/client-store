// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import the clientDB type definitions
/// <reference path="./clientDB.d.ts" />

export {}; // Make this file a module

// Cypress namespace declaration
declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom commands here
      // Example: createClientDB(name: string): Chainable<Element>
    }
  }
}

// -- This is a parent command --
// Cypress.Commands.add('createClientDB', (name) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
