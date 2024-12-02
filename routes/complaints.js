const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new complaint
router.post('/', async (req, res) => {
    const { submitted_by, against_user, topic_id, comment_id, description } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO complaints (submitted_by, against_user, topic_id, comment_id, description) VALUES (?, ?, ?, ?, ?)`,
            [submitted_by, against_user, topic_id, comment_id, description]
        );
        res.status(201).json({ message: 'Complaint submitted successfully!', complaintId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all complaints
router.get('/', async (req, res) => {
    try {
        const [complaints] = await db.query(
            `SELECT c.*, u.username AS submitted_by_user, a.username AS against_user_name
            FROM complaints c
            LEFT JOIN users u ON c.submitted_by = u.id
            LEFT JOIN users a ON c.against_user = a.id`
        );
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
