const { defineConfig } = require('cypress');
const codeCoverageTask = require('@cypress/code-coverage/task');

module.exports = (on, config) => {
  // Enable code coverage collection
  codeCoverageTask(on, config);
  
  // Add preprocessor for TypeScript files
  on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));
  
  return config;
};
