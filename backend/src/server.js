const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRouter = require('./routes/api');
require('./config/db'); // Bootstraps SQLite connection and creates schema

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS requests from React dev client (port 5173)
app.use(cors());

// Parse JSON request payloads
app.use(express.json());

// API Namespace routing
app.use('/api', apiRouter);

// Global express error handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: err.message 
  });
});

app.listen(port, () => {
  console.log(`Node.js/Express Backend running on http://localhost:${port}`);
  console.log(`Database sync connector ready.`);
});
