import { defineConfig } from 'cypress';
const path = require('path');

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Implement code coverage collection when available
      try {
        require('@cypress/code-coverage/task')(on, config);
      } catch (e) {
        console.log('Code coverage module not available, skipping');
      }
      return config;
    },
    supportFile: 'tests/cypress/support/e2e.ts',
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:8080',
    // Enable TypeScript processing
    video: false,
    screenshotOnRunFailure: false,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    supportFile: 'tests/cypress/support/component.ts',
    specPattern: 'tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});
