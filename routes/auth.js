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
            'Welcome to Dabaat - Your Debating Journey Begins!',
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 10px;">
                <div style="text-align: center;">
                    <img src="https://example.com/dabaat-logo.png" alt="Dabaat Logo" style="width: 150px; margin-bottom: 20px;" />
                </div>
                <h1 style="text-align: center; color: #333;">Welcome, ${username}!</h1>
                <p style="text-align: center; color: #555; font-size: 16px;">
                    Thank you for joining <strong>Dabaat</strong>, the ultimate platform for meaningful debates and idea exchange!
                </p>
                <p style="text-align: center; color: #555; font-size: 16px;">
                    Get started by exploring debates, sharing your opinions, and making your voice heard.
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://dabaat.com/login" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #ff6f00; text-decoration: none; border-radius: 5px; font-size: 16px;">Start Debating</a>
                </div>
                <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eaeaea;" />
                <p style="text-align: center; color: #888; font-size: 14px;">
                    Need help? Visit our <a href="https://dabaat.com/support" style="color: #ff6f00; text-decoration: none;">Support Center</a>.
                </p>
                <p style="text-align: center; color: #888; font-size: 14px;">
                    &copy; ${new Date().getFullYear()} Dabaat. All rights reserved.
                </p>
            </div>`
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password, mfa_code } = req.body; // Accept MFA code if provided

    try {
        // Check if user exists
        const [users] = await db.query(`SELECT * FROM users WHERE username = ?`, [username]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if MFA is enabled for the user
        if (user.mfa_enabled) {
            if (!mfa_code) {
                // Return a temporary token and prompt for MFA code
                const tempToken = jwt.sign({ id: user.id, mfa: true }, config.security.jwtSecret, {
                    expiresIn: '10m',
                });

                return res.status(200).json({
                    message: 'MFA required',
                    tempToken,
                });
            }

            // Verify the provided MFA code
            const isMfaValid = verifyMfaCode(user.mfa_secret, mfa_code); // Assume verifyMfaCode is a function to validate MFA code
            if (!isMfaValid) {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }
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

// Function to verify the MFA code
const speakeasy = require('speakeasy'); // Install speakeasy: npm install speakeasy
function verifyMfaCode(secret, token) {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Allow a window of 1 time step for clock drift
    });
}


// Forgot Password Route
router.post('/forgotpassword', async (req, res) => {
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
        const resetUrl = `http://localhost:3000/resetpassword?token=${resetToken}`;
        await sendEmail(
            email,
            'Password Reset Request',
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://example.com/dabaat-logo.png" alt="Dabaat Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p style="color: #555; font-size: 16px; text-align: center;">
                You requested to reset your password for your Dabaat account. Click the button below to reset it.
                <br />This link will expire in <strong>1 hour</strong>.
            </p>
            <div style="text-align: center; margin-top: 20px;">
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff6f00; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    Reset Password
                </a>
            </div>
            <p style="color: #555; font-size: 14px; text-align: center; margin-top: 20px;">
                If you didn't request a password reset, please ignore this email or contact our support if you have any concerns.
            </p>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eaeaea;" />
            <p style="color: #888; font-size: 14px; text-align: center;">
                &copy; ${new Date().getFullYear()} Dabaat. All rights reserved.
            </p>
            </div>`
        );

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset Password Route
router.post('/resetpassword', async (req, res) => {
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
