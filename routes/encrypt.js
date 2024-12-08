const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // Import the native crypto module
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_32_characters_long_'; // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

// Encrypt function using crypto module
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Decrypt function using crypto module
function decrypt(encryptedData) {
    const [ivHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Encryption endpoint
router.post('/encrypt', (req, res) => {
    try {
        const { data } = req.body;
        console.log("Received Data: ", data);

        if (!data) {
            return res.status(400).json({ error: 'No data provided for encryption.' });
        }

        const encryptedData = encrypt(data.toString());
        res.status(200).json({ encryptedData });
    } catch (error) {
        console.error("Encryption Error: ", error);

        if (error instanceof TypeError) {
            res.status(400).json({ error: 'Invalid data type for encryption.' });
        } else if (error.message.includes('key')) {
            res.status(500).json({ error: 'Encryption key error. Ensure the key is valid.' });
        } else {
            res.status(500).json({ error: `Encryption failed: ${error.message}` });
        }
    }
});

// Decryption endpoint
router.post('/decrypt', (req, res) => {
    try {
        const { encryptedData } = req.body;
        console.log("Encrypted Data: ", encryptedData);

        if (!encryptedData) {
            return res.status(400).json({ error: 'No encrypted data provided for decryption.' });
        }

        const decryptedData = decrypt(encryptedData);
        res.status(200).json({ decryptedData });
    } catch (error) {
        console.error("Decryption Error: ", error);

        res.status(500).json({ error: `Decryption failed: ${error.message}` });
    }
});

module.exports = router;
