import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Implement code coverage collection
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    supportFile: 'tests/cypress/support/e2e.ts',
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // Disable baseUrl since we're not using a server
    baseUrl: null,
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
