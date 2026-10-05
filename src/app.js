const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authenticate = require('../middleware/auth');

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
// temporär test route för jwt
app.get('/me', authenticate, (req, res) => {
  res.json({ userId: req.user.id });
});

app.use('/boards/:boardId/notes', require('./routes/boardNotes'));

module.exports = app;