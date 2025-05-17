import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
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
    supportFile: "tests/cypress/support/component.ts",
    specPattern: "tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    fixturesFolder: 'tests/cypress/fixtures'
  },
});
