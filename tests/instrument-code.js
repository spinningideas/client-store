const { createInstrumenter } = require('istanbul-lib-instrument');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');
const glob = require('glob');

// Create the instrumenter
const instrumenter = createInstrumenter({
  esModules: true,
  produceSourceMap: true,
});

// Find all TypeScript files in the src directory
const srcFiles = glob.sync('src/**/*.ts', { ignore: ['**/*.d.ts'] });

// Instrument each file
srcFiles.forEach(file => {
  const srcPath = join(process.cwd(), file);
  const code = readFileSync(srcPath, 'utf8');
  
  // Instrument the code
  const instrumentedCode = instrumenter.instrumentSync(
    code,
    srcPath,
    { coverageVariable: '__coverage__' }
  );
  
  // Create the output directory for the instrumented file
  const outputPath = join(process.cwd(), 'coverage-instrumented', file);
  const outputDir = dirname(outputPath);
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the instrumented code
  writeFileSync(outputPath, instrumentedCode);
  
  console.log(`Instrumented: ${file}`);
});

console.log('Code instrumentation complete!');
