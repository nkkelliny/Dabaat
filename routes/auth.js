const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../email');
const config = require('../config');
const db = require('../database').db;

const router = express.Router();

// Middleware to Check Blacklisted Tokens
const checkBlacklist = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
        // Check if token is blacklisted
        const [rows] = await db.query(`SELECT * FROM blacklisted_tokens WHERE token = ?`, [token]);

        if (rows.length > 0) {
            return res.status(401).json({ error: 'Token is blacklisted' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

router.get('/validate', async (req, res) => {
    const { field, value } = req.query;

    if (!field || !value || (field !== "username" && field !== "email")) {
        return res.status(400).json({ error: "Invalid field or value" });
    }

    try {
        const query = `SELECT COUNT(*) AS count FROM users WHERE ${field} = ?`;
        const [rows] = await db.query(query, [value]);

        const isUnique = rows[0].count === 0;
        res.status(200).json({ isUnique });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Registration Route
router.post('/register', async (req, res) => {
    const { username, email, password, first_name, last_name, date_of_birth } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        await db.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, first_name, last_name, date_of_birth]
        );

        // Send a welcome email
        await sendEmail(
            email,
            'Welcome to Dabaat!',
            `<h1>Welcome, ${username}!</h1><p>Thank you for joining Dabaat. Let's start debating!</p>`
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const [users] = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role }, config.security.jwtSecret, {
            expiresIn: process.env.JWT_EXPIRATION || '1h',
        });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const [users] = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Update user with reset token
        await db.query(`UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`, [
            resetToken,
            resetTokenExpiry,
            user.id,
        ]);

        // Send reset email
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        await sendEmail(
            email,
            'Password Reset Request',
            `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
        );

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Check if token is valid
        const [users] = await db.query(`SELECT * FROM users WHERE reset_token = ?`, [token]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const user = users[0];

        if (user.reset_token_expiry < Date.now()) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and clear reset token
        await db.query(
            `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout Route
router.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Bearer header

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
        // Verify token
        jwt.verify(token, config.security.jwtSecret);

        // Blacklist the token
        await db.query(`INSERT INTO blacklisted_tokens (token) VALUES (?)`, [token]);

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
});

module.exports = { router, checkBlacklist };
