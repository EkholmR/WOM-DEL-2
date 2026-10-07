const express = require('express');
const cors = require('cors');
const pool = require('./db');


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'database unavailable' });
  }
});


app.use('/boards/:boardId/notes', require('./routes/boardNotes'));

// Unknown routes -> 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler 
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

//Tack Claude för error troubleshooting