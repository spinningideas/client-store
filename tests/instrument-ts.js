const { createInstrumenter } = require('istanbul-lib-instrument');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');
const glob = require('glob');
const ts = require('typescript');

// Read the TypeScript configuration
const tsConfig = ts.readConfigFile('./tsconfig.coverage.json', ts.sys.readFile).config;
const parsedConfig = ts.parseJsonConfigFileContent(tsConfig, ts.sys, './');

// Create the instrumenter
const instrumenter = createInstrumenter({
  esModules: true,
  produceSourceMap: true,
  autoWrap: true,
  preserveComments: true,
  compact: false
});

// Find all TypeScript files in the src directory
const srcFiles = glob.sync('src/**/*.ts', { ignore: ['**/*.d.ts'] });

console.log(`Found ${srcFiles.length} TypeScript files to instrument`);

// Instrument each file
srcFiles.forEach(file => {
  const srcPath = join(process.cwd(), file);
  const code = readFileSync(srcPath, 'utf8');
  
  // Compile TypeScript to JavaScript
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2015,
      sourceMap: true,
      inlineSources: true
    },
    fileName: srcPath
  });
  
  // Instrument the compiled JavaScript
  const instrumentedCode = instrumenter.instrumentSync(
    result.outputText,
    srcPath,
    { sourceMap: result.sourceMapText }
  );
  
  // Create the output directory for the instrumented file
  const outputPath = join(process.cwd(), 'coverage-instrumented', file.replace('.ts', '.js'));
  const outputDir = dirname(outputPath);
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the instrumented code
  writeFileSync(outputPath, instrumentedCode);
  
  console.log(`Instrumented: ${file}`);
});

console.log('Code instrumentation complete!');
