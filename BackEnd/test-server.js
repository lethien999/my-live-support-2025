// test-server.js
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
