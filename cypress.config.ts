import { defineConfig } from "cypress";
import registerCodeCoverageTasks from '@cypress/code-coverage/task';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register code coverage tasks
      registerCodeCoverageTasks(on, config);
      return config;
    },
    supportFile: "tests/cypress/support/e2e.ts",
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: null,
    video: false,
    screenshotOnRunFailure: false,
    fixturesFolder: 'tests/cypress/fixtures',
    experimentalModifyObstructiveThirdPartyCode: true
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
    setupNodeEvents(on, config) {
      // Register code coverage tasks for component tests
      registerCodeCoverageTasks(on, config);
      return config;
    },
    supportFile: "tests/cypress/support/component.ts",
    specPattern: "tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    fixturesFolder: 'tests/cypress/fixtures'
  },
});
