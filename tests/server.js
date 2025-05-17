const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8080;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  let filePath;
  
  if (req.url === '/' || req.url === '/index.html') {
    // Serve the test page
    filePath = path.join(__dirname, 'index.html');
    serveFile(filePath, 'text/html', res);
  } else if (req.url.startsWith('/dist/') && req.url.endsWith('.js')) {
    // Serve the actual clientStore.js file
    filePath = path.join(__dirname, '..', req.url);
    serveFile(filePath, 'application/javascript', res);
  } else if (req.url.endsWith('.js')) {
    // Serve other JavaScript files
    filePath = path.join(__dirname, '..', req.url);
    serveFile(filePath, 'application/javascript', res);
  } else {
    // Handle 404
    res.writeHead(404);
    res.end('Not found');
  }
});

// Helper function to serve files
function serveFile(filePath, contentType, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end(`File not found: ${filePath}`);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Start the server
server.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
