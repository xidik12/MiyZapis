const http = require('http');

const port = process.env.PORT || 3000;

const req = http.get(`http://localhost:${port}/health`, { timeout: 3000 }, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => process.exit(1));
req.on('timeout', () => { req.destroy(); process.exit(1); });
