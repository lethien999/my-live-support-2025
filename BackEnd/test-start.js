const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(4000, () => {
  console.log('✅ Backend started on port 4000');
});
