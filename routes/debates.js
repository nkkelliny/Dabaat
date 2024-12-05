const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new debate
router.post('/', async (req, res) => {
    const { title, category, description, created_by } = req.body;

    console.log("CREATED BY:  " + created_by);

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

module.exports = router;
