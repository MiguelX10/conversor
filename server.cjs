const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - No encontrado</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
              h1 { color: #e74c3c; }
              a { color: #3498db; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>404 - Archivo no encontrado</h1>
            <p>El archivo que buscas no existe.</p>
            <a href="/">← Volver al inicio</a>
          </body>
          </html>
        `);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Error del servidor: ${error.code}`);
      }
    } else {
      // Success
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 ¡Servidor iniciado exitosamente!

📱 Accede a tu convertidor PDF to Word en:
   http://localhost:${PORT}

🌐 También disponible en:
   http://127.0.0.1:${PORT}

📁 Sirviendo archivos desde: ${__dirname}

⚡ Para detener el servidor: Ctrl + C
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ El puerto ${PORT} ya está en uso.`);
    console.log(`💡 Intenta con: node server.js`);
  } else {
    console.log(`❌ Error del servidor:`, err);
  }
});