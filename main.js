const express = require('express');
const bodyParser = require('body-parser');
const { router: authRoutes, checkBlacklist } = require('./routes/auth');
const cors = require('cors');
const path = require('path'); // For resolving file paths
const { createTables, db, close } = require('./database'); // Assuming database.js is the file with table creation logic
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public'))); // Assumes HTML files are in a folder named "public"

// Initialize Database Tables
(async () => {
    try {
        await createTables();
        console.log('Database tables initialized.');
    } catch (error) {
        console.error('Error initializing tables:', error.message);
    }
})();

// Routes for HTML Files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/forgotpassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgotpassword.html'));
});

app.get('/resetpassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetpassword.html'));
});

app.get('/debate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debate.html'));
});

app.get('/debate/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debate.html'));
});

app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});

app.get('/saved', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'save.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/tos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tos.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// API Routes
app.use('/api/auth', authRoutes);

// Apply middleware for secure routes
app.use('/api/secure', checkBlacklist, (req, res) => {
    res.status(200).json({ message: 'You have accessed a secure route!' });
});

// User Routes
app.use('/api/users', require('./routes/users'));

// Debate Routes
app.use('/api/debates', require('./routes/debates'));

// Topics Routes
app.use('/api/topics', require('./routes/topics'));

// Comments Routes
app.use('/api/comments', require('./routes/comments'));

// Flags Routes
app.use('/api/flags', require('./routes/flags'));

// Contact Routes
app.use('/api/contact', require('./routes/contact'));

// Encrypt/Decrypt Routes
app.use('/api/encrypt', require('./routes/encrypt'));

// Complaints Routes
app.use('/api/complaints', require('./routes/complaints'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'An error occurred!' });
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await close();
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
