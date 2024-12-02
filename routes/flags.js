const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new flag
router.post('/', async (req, res) => {
    const { flagged_by, topic_id, comment_id, reason } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO flags (flagged_by, topic_id, comment_id, reason) VALUES (?, ?, ?, ?)`,
            [flagged_by, topic_id, comment_id, reason]
        );
        res.status(201).json({ message: 'Flag submitted successfully!', flagId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all flags
router.get('/', async (req, res) => {
    try {
        const [flags] = await db.query(
            `SELECT f.*, u.username AS flagged_by_user
            FROM flags f
            JOIN users u ON f.flagged_by = u.id`
        );
        res.status(200).json(flags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
