const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new comment
router.post('/', async (req, res) => {
    const { content, debate_id, topic_id, user_id } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO comments (content, debate_id, topic_id, user_id) VALUES (?, ?, ?, ?)`,
            [content, debate_id, topic_id, user_id]
        );
        res.status(201).json({ message: 'Comment added successfully!', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comments for a specific debate
router.get('/debate/:debateId', async (req, res) => {
    const { debateId } = req.params;

    try {
        const [comments] = await db.query(
            `SELECT c.*, u.username AS commented_by, u.email AS email, u.id AS user_id
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.debate_id = ?`,
            [debateId]
        );
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
