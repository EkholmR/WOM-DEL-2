const pool = require('../src/db');

async function requireBoardAccess(req, res, next) {
  const boardId = Number(req.params.boardId);

  if (!Number.isInteger(boardId) || boardId < 1) {
    return res.status(400).json({ error: 'Invalid board id' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, allowed_user_ids FROM boards WHERE id = $1',
      [boardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const board = result.rows[0];
    if (!board.allowed_user_ids.includes(req.user.id)) {
      return res.status(403).json({ error: 'You do not have access to this board' });
    }

    req.board = board;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = requireBoardAccess;