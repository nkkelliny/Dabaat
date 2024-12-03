const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new debate
router.post('/', async (req, res) => {
    const { title, description, created_by } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO debates (title, description, created_by) VALUES (?, ?, ?)`,
            [title, created_by]
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
            `SELECT d.*, t.title AS topic_title, u.username AS created_by_user
            FROM debates d
            JOIN topics t ON d.topic_id = t.id
            JOIN users u ON d.created_by = u.id`
        );
        res.status(200).json(debates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
