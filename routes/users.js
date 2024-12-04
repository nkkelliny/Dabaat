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

// Get user profile (authenticated user)
router.get('/profile', async (req, res) => {
    const userId = req.user?.id; // Extract user ID from token middleware

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized access' });
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

// Update user profile
router.put('/profile', async (req, res) => {
    const userId = req.user?.id; // Extract user ID from token middleware
    const { first_name, last_name, email } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
        await db.query(
            `UPDATE users 
             SET first_name = ?, last_name = ?, email = ? 
             WHERE id = ?`,
            [first_name, last_name, email, userId]
        );
        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile picture (Optional, if required)
router.put('/profile/picture', async (req, res) => {
    const userId = req.user?.id; // Extract user ID from token middleware
    const { profile_picture_url } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
        await db.query(
            `UPDATE users 
             SET profile_picture = ? 
             WHERE id = ?`,
            [profile_picture_url, userId]
        );
        res.status(200).json({ message: 'Profile picture updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
