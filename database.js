const mysql = require('mysql2/promise');
const config = require('./config');

const db = mysql.createPool(config.dbConfig);

async function createTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,            
            email VARCHAR(255) UNIQUE NOT NULL,               
            password_hash TEXT NOT NULL,                      
            first_name VARCHAR(100),                          
            last_name VARCHAR(100),                           
            date_of_birth DATE,                               
            profile_picture VARCHAR(255),
            role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
            is_banned BOOLEAN DEFAULT FALSE,
            ban_reason TEXT,
            banned_at DATETIME,
            reset_token TEXT,
            reset_token_expiry BIGINT,
            mfa_enabled BOOLEAN DEFAULT FALSE,
            mfa_secret TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;

    const createTopicsTable = `
        CREATE TABLE IF NOT EXISTS topics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            created_by INT NOT NULL,
            is_flagged BOOLEAN DEFAULT FALSE,
            flag_reason TEXT,
            flagged_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )`;

    const createDebatesTable = `
        CREATE TABLE IF NOT EXISTS debates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            topic_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            created_by INT NOT NULL,
            status ENUM('open', 'closed') DEFAULT 'open',
            winner_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (winner_id) REFERENCES users(id)
        )`;

    const createParticipantsTable = `
        CREATE TABLE IF NOT EXISTS participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            debate_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('pro', 'con') NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`;

    const createVotesTable = `
        CREATE TABLE IF NOT EXISTS votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            debate_id INT NOT NULL,
            user_id INT NOT NULL,
            vote_type ENUM('pro', 'con') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`;

    const createCommentsTable = `
        CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content TEXT NOT NULL,
            debate_id INT,
            topic_id INT,
            user_id INT NOT NULL,
            is_flagged BOOLEAN DEFAULT FALSE,
            flag_reason TEXT,
            flagged_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`;

    const createFlagsTable = `
        CREATE TABLE IF NOT EXISTS flags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            flagged_by INT NOT NULL,
            topic_id INT,
            comment_id INT,
            reason TEXT NOT NULL,
            status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )`;

    const createComplaintsTable = `
        CREATE TABLE IF NOT EXISTS complaints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submitted_by INT NOT NULL,
            against_user INT,
            topic_id INT,
            comment_id INT,
            description TEXT NOT NULL,
            status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (against_user) REFERENCES users(id),
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )`;

    const createUserBansTable = `
        CREATE TABLE IF NOT EXISTS user_bans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            banned_user_id INT NOT NULL,
            banned_by INT NOT NULL,
            reason TEXT NOT NULL,
            banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ban_duration VARCHAR(50),
            FOREIGN KEY (banned_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE
        )`;

    const createBlacklistTokens = `
    CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    await db.query(createUsersTable);
    await db.query(createTopicsTable);
    await db.query(createDebatesTable);
    await db.query(createParticipantsTable);
    await db.query(createVotesTable);
    await db.query(createCommentsTable);
    await db.query(createFlagsTable);
    await db.query(createComplaintsTable);
    await db.query(createUserBansTable);
    await db.query(createBlacklistTokens);
}

async function close() {
    await db.end();
}

module.exports = { db, createTables, close };
