const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new topic
router.post('/', async (req, res) => {
    const { title, description, created_by } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO topics (title, description, created_by) VALUES (?, ?, ?)`,
            [title, description, created_by]
        );
        res.status(201).json({ message: 'Topic created successfully!', topicId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all topics
router.get('/', async (req, res) => {
    try {
        const [topics] = await db.query(
            `SELECT t.*, u.username AS created_by_user
            FROM topics t
            JOIN users u ON t.created_by = u.id`
        );
        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
