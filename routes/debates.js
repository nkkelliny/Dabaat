const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new debate
router.post('/', async (req, res) => {
    const { title, category, description, created_by } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO debates (title, category, description, created_by) VALUES (?, ?, ?, ?)`,
            [title, category, description, created_by]
        );
        res.status(201).json({ message: 'Debate created successfully!', debateId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all debates
router.get('/', async (req, res) => {
    try {
        const [debates] = await db.query(
            `SELECT d.*, u.username AS created_by_user
            FROM debates d
            JOIN users u ON d.created_by = u.id`
        );
        res.status(200).json(debates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a debate by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [debates] = await db.query(
            `SELECT d.*, u.username AS created_by_user
            FROM debates d
            JOIN users u ON d.created_by = u.id
            WHERE d.id = ?`,
            [id]
        );

        if (debates.length === 0) {
            return res.status(404).json({ error: 'Debate not found' });
        }

        res.status(200).json(debates[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get votes for a debate
router.get('/:id/votes', async (req, res) => {
    const { id } = req.params;

    try {
        const [votes] = await db.query(
            `SELECT 
                SUM(CASE WHEN vote_type = 'pro' THEN 1 ELSE 0 END) AS pro_votes,
                SUM(CASE WHEN vote_type = 'con' THEN 1 ELSE 0 END) AS con_votes
            FROM votes WHERE debate_id = ?`,
            [id]
        );

        res.status(200).json(votes[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a vote to a debate
router.post('/:id/vote', async (req, res) => {
    const { id } = req.params;
    const { user_id, type } = req.body; // type can be "pro" or "con"

    try {
        const [result] = await db.query(
            `INSERT INTO votes (debate_id, user_id, vote_type) VALUES (?, ?, ?)`,
            [id, user_id, type]
        );
        res.status(201).json({ message: 'Vote added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comments for a debate
router.get('/:id/comments', async (req, res) => {
    const { id } = req.params;

    try {
        const [comments] = await db.query(
            `SELECT c.*, u.username AS commenter
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.debate_id = ?`,
            [id]
        );

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a comment to a debate
router.post('/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { user_id, text } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO comments (debate_id, user_id, content) VALUES (?, ?, ?)`,
            [id, user_id, text]
        );
        res.status(201).json({ message: 'Comment added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit a comment
router.put('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE comments SET content = ? WHERE id = ?`,
            [text, commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        const [result] = await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get debates by UserID
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [debates] = await db.query(
            `SELECT d.*, u.username AS created_by_user
            FROM debates d
            JOIN users u ON d.created_by = u.id
            WHERE u.id = ?`,
            [id]
        );

        if (debates.length === 0) {
            return res.status(404).json({ error: 'No debates found for this user.' });
        }

        res.status(200).json(debates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a debate
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, category, description } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE debates SET title = ?, category = ?, description = ? WHERE id = ?`,
            [title, category, description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debate not found.' });
        }

        res.status(200).json({ message: 'Debate updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a debate
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(`DELETE FROM debates WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debate not found.' });
        }

        res.status(200).json({ message: 'Debate deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
