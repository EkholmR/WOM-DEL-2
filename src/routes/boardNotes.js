const express = require('express');
const pool = require('../db');
const authenticate = require('../../middleware/auth');
const requireBoardAccess = require('../../middleware/boardAccess');

const router = express.Router({ mergeParams: true });

// Every route in this file requires a valid token AND board access
router.use(authenticate, requireBoardAccess);

function parseNoteId(req, res) {
  const id = Number(req.params.noteId);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid note id' });
    return null;
  }
  return id;
}

function serverError(res, err) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

// GET /boards/:boardId/notes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE board_id = $1 ORDER BY created_at DESC',
      [req.board.id]
    );
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
});

// GET /boards/:boardId/notes/:noteId
router.get('/:noteId', async (req, res) => {
  const noteId = parseNoteId(req, res);
  if (!noteId) return;
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND board_id = $2',
      [noteId, req.board.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /boards/:boardId/notes
router.post('/', async (req, res) => {
  const { title, content } = req.body || {};
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  if (content !== undefined && content !== null && typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO notes (board_id, title, content, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.board.id, title.trim(), content ?? null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// PATCH /boards/:boardId/notes/:noteId  (author only)
router.patch('/:noteId', async (req, res) => {
  const noteId = parseNoteId(req, res);
  if (!noteId) return;

  const { title, content } = req.body || {};
  if (title === undefined && content === undefined) {
    return res.status(400).json({ error: 'Provide title and/or content' });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (content !== undefined && content !== null && typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }

  try {
    const found = await pool.query(
      'SELECT created_by FROM notes WHERE id = $1 AND board_id = $2',
      [noteId, req.board.id]
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (found.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the author can edit this note' });
    }

    const result = await pool.query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = CASE WHEN $2::boolean THEN $3 ELSE content END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title === undefined ? null : title.trim(), content !== undefined, content ?? null, noteId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

router.delete('/:noteId', async (req, res) => {
  const noteId = parseNoteId(req, res);
  if (!noteId) return;
  try {
    const found = await pool.query(
      'SELECT created_by FROM notes WHERE id = $1 AND board_id = $2',
      [noteId, req.board.id]
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (found.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the author can delete this note' });
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [noteId]);
    res.status(204).send();
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router; 