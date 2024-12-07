const express = require('express');
const router = express.Router();
const { sendEmail } = require('../email'); // Ensure you have a sendEmail function
require('dotenv').config();

// Contact form submission endpoint
router.post('/send', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Email content
        const subject = `New Contact Form Submission from ${name}`;
const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">New Contact Form Submission</h2>
            <hr style="border: 1px solid #ccc; width: 100%;">
        </div>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; color: #555; margin-bottom: 10px;">
                <strong style="color: #000;">Name:</strong> ${name}
            </p>
            <p style="font-size: 16px; color: #555; margin-bottom: 10px;">
                <strong style="color: #000;">Email:</strong> <a href="mailto:${email}" style="color: #007BFF; text-decoration: none;">${email}</a>
            </p>
            <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                <strong style="color: #000;">Message:</strong>
                <br>
                <span style="display: inline-block; margin-top: 10px; line-height: 1.6; color: #333;">${message}</span>
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
            <p>&copy; ${new Date().getFullYear()} Dabaat. All rights reserved.</p>
        </div>
    </div>
`;

        // Send email to admin
        await sendEmail(process.env.ADMIN_EMAIL, subject, htmlContent);

        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({ error: 'Failed to send the message. Please try again later.' });
    }
});

module.exports = router;
