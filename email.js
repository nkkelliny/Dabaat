const nodemailer = require('nodemailer');
const config = require('./config');

// Create a transporter
const transporter = nodemailer.createTransport({
    host: config.smtpConfig.host,
    port: config.smtpConfig.port,
    secure: config.smtpConfig.secure, // true for SSL, false for plain text or STARTTLS
    auth: {
        user: config.smtpConfig.user,
        pass: config.smtpConfig.password,
    },
});

// Send email function
async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"Dabaat" <${config.smtpConfig.user}>`, // sender address
            to, // recipient address
            subject, // Subject line
            html, // Email content in HTML
        });
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
}

module.exports = { sendEmail };
