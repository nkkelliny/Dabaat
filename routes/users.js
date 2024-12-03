const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new user
router.post('/register', async (req, res) => {
    const { username, email, password, first_name, last_name, date_of_birth } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, password, first_name, last_name, date_of_birth]
        );
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, role, is_banned FROM users');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user details
router.get('/details', async (req, res) => {
    const userId = req.user?.id || req.query.id; // Extract user ID from token or query

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [users] = await db.query(
            `SELECT id, username, email, first_name, last_name, date_of_birth, role, is_banned 
             FROM users 
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
