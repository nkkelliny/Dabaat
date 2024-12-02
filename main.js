const express = require('express');
const bodyParser = require('body-parser');
const { router: authRoutes, checkBlacklist } = require('./routes/auth');
const cors = require('cors');
const { createTables, db, close } = require('./database'); // Assuming database.js is the file with table creation logic
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Database Tables
(async () => {
    try {
        await createTables();
        console.log('Database tables initialized.');
    } catch (error) {
        console.error('Error initializing tables:', error.message);
    }
})();

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Dabaat - Social Debating Platform API');
});

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
