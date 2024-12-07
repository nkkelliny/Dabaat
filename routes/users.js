const express = require('express');
const router = express.Router();
const db = require('../database').db;
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { sendEmail } = require('../email');

// Middleware for authentication (placeholder)
const authenticate = (req, res, next) => {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    req.userId = userId;
    next();
};

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
    const userId = req.user?.id || req.query.userId; // Extract user ID from token middleware or query parameter

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
    const userId = req.user?.id || req.query.userId; // Extract user ID from token middleware
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

router.get('/settings', async (req, res) => {
    const userId = req.user?.id || req.query.userId; // Extract user ID from token middleware or query parameter

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized access. User ID is required.' });
    }

    try {
        const [settings] = await db.query(
            `SELECT email, mfa_enabled 
             FROM users 
             WHERE id = ?`,
            [userId]
        );

        if (settings.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(settings[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Update account settings (email and/or password)
router.put('/settings', authenticate, async (req, res) => {
    const { email, password } = req.body;
    const userId = req.query.userId;

    try {
        let query = `UPDATE users SET email = ?`;
        let params = [email];

        // If a new password is provided, hash it and update it as well
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password_hash = ?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id = ?`;
        params.push(userId);

        await db.query(query, params);
        res.status(200).json({ message: 'Account settings updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enable MFA and generate QR code
router.post('/settings/mfa/enable', authenticate, async (req, res) => {
    const userId = req.query.userId;

    try {
        // Generate a secret with the label "Dabaat" for the issuer name
        const secret = speakeasy.generateSecret({
            length: 20,
            name: `Dabaat`,
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Save the secret in the database temporarily
        await db.query(`UPDATE users SET mfa_secret = ? WHERE id = ?`, [secret.base32, userId]);

        res.status(200).json({ qrCodeUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify MFA code
router.post('/settings/mfa/verify', authenticate, async (req, res) => {
    const userId = req.query.userId;
    const { token } = req.body;

    try {
        const [result] = await db.query(`SELECT mfa_secret FROM users WHERE id = ?`, [userId]);

        if (result.length === 0 || !result[0].mfa_secret) {
            return res.status(400).json({ error: 'MFA is not set up for this user.' });
        }

        const verified = speakeasy.totp.verify({
            secret: result[0].mfa_secret,
            encoding: 'base32',
            token,
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid MFA code.' });
        }

        // Enable MFA for the user
        await db.query(`UPDATE users SET mfa_enabled = 1 WHERE id = ?`, [userId]);
        res.status(200).json({ message: 'MFA enabled successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Disable MFA
router.post('/settings/mfa/disable', authenticate, async (req, res) => {
    const userId = req.query.userId;

    try {
        await db.query(`UPDATE users SET mfa_secret = NULL, mfa_enabled = 0 WHERE id = ?`, [userId]);
        res.status(200).json({ message: 'MFA disabled successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user account and associated data
router.delete('/delete', authenticate, async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required for account deletion.' });
    }

    try {
        // Fetch the user's email and username before deletion
        const [userResult] = await db.query(`SELECT email, username FROM users WHERE id = ?`, [userId]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const { email, username } = userResult[0];

        // Delete user's votes
        await db.query(`DELETE FROM votes WHERE user_id = ?`, [userId]);

        // Delete user's comments
        await db.query(`DELETE FROM comments WHERE user_id = ?`, [userId]);

        // Delete user's debates
        await db.query(`DELETE FROM debates WHERE created_by = ?`, [userId]);

        // Delete the user account
        await db.query(`DELETE FROM users WHERE id = ?`, [userId]);

        // Send the account deletion email
        await sendEmail(
            email,
            'Account Deletion Confirmation',
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #ff6f00; text-align: center;">Account Deleted</h2>
                <p style="color: #555; font-size: 16px; text-align: center;">
                    Hello <strong>${username}</strong>,
                </p>
                <p style="color: #555; font-size: 16px; text-align: center;">
                    Your account has been successfully deleted. We're sorry to see you go!
                </p>
                <p style="color: #555; font-size: 16px; text-align: center;">
                    If this was a mistake or you wish to return, please contact our support team.
                </p>
                <p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">
                    &copy; ${new Date().getFullYear()} Dabaat. All rights reserved.
                </p>
            </div>`
        );

        res.status(200).json({ message: 'User account and associated data deleted successfully!' });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
