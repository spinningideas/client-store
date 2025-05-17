import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return config;
    },
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: null,
    video: false,
    screenshotOnRunFailure: false,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
    supportFile: "tests/cypress/support/component.ts",
    specPattern: "tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}",
  },
});
