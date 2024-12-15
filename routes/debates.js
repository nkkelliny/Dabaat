const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new debate
router.post('/', async (req, res) => {
    const { title, category, description, created_by } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO debates (title, category, description, created_by) VALUES (?, ?, ?, ?)`,
            [title, category, description, created_by]
        );
        res.status(201).json({ message: 'Debate created successfully!', debateId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search debates with optional filters
router.get('/search', async (req, res) => {
    try {
        const { keyword = '', category = '' } = req.query;

        // Construct SQL query with filters
        let query = `
            SELECT d.*, u.username AS created_by_user, u.email AS email
            FROM debates d
            JOIN users u ON d.created_by = u.id
            WHERE 1=1
        `;

        const params = [];

        // Add keyword search filter (searches in title and description)
        if (keyword) {
            query += ` AND (d.title LIKE ? OR d.description LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // Add category filter
        if (category) {
            query += ` AND d.category = ?`;
            params.push(category);
        }

        query += ` ORDER BY d.created_at DESC`;

        // Execute the query
        const [debates] = await db.query(query, params);

        res.status(200).json(debates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Get debates with pagination (supports cursor-based and offset-based pagination)
router.get('/', async (req, res) => {
    // Extract query parameters for pagination and filtering
    let { page = 1, size = 5, lastLoadedId, category } = req.query;

    // Convert page and size to integers and set defaults if invalid
    page = parseInt(page) || 1;
    size = parseInt(size) || 5;

    try {
        let debatesQuery;
        let queryParams = [];

        // Base query with optional category filtering
        let baseQuery = `SELECT d.*, u.username AS created_by_user, u.email AS email FROM debates d
        JOIN users u ON d.created_by = u.id`;
        let whereClauses = [];

        if (category) {
            whereClauses.push(`category = ?`);
            queryParams.push(category);
        }

        if (lastLoadedId) {
            // Cursor-based pagination with optional category filter
            whereClauses.push(`id < ?`);
            queryParams.push(lastLoadedId);
            debatesQuery = `
                ${baseQuery}
                ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
                ORDER BY id DESC
                LIMIT ?`;
            queryParams.push(size);
        } else {
            // Offset-based pagination with optional category filter
            const offset = (page - 1) * size;
            debatesQuery = `
                ${baseQuery}
                ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
                ORDER BY id DESC
                LIMIT ? OFFSET ?`;
            queryParams.push(size, offset);
        }

        // Execute the debates query
        const [debates] = await db.query(debatesQuery, queryParams);

        // Query to get the total count of debates (for offset-based pagination)
        let total = null;
        if (!lastLoadedId) {
            let countQuery = `SELECT COUNT(*) AS total FROM debates`;
            if (category) {
                countQuery += ` WHERE category = ?`;
            }
            const [countResult] = await db.query(countQuery, category ? [category] : []);
            total = countResult[0].total;
        }

        // Return debates and pagination info
        res.status(200).json({
            data: debates,
            pagination: lastLoadedId
                ? { hasMore: debates.length === size }
                : {
                      currentPage: page,
                      pageSize: size,
                      totalItems: total,
                      totalPages: Math.ceil(total / size),
                  },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Get a debate by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [debates] = await db.query(
            `SELECT d.*, u.username AS created_by_user, u.email AS creator_email
            FROM debates d
            JOIN users u ON d.created_by = u.id
            WHERE d.id = ?`,
            [id]
        );

        if (debates.length === 0) {
            return res.status(404).json({ error: 'Debate not found' });
        }

        res.status(200).json(debates[0]);
        console.log("DEBATE: " + JSON.stringify(debates[0]))
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get votes for a debate
router.get('/:id/votes', async (req, res) => {
    const { id } = req.params;

    try {
        const [votes] = await db.query(
            `SELECT 
                SUM(CASE WHEN vote_type = 'pro' THEN 1 ELSE 0 END) AS pro_votes,
                SUM(CASE WHEN vote_type = 'con' THEN 1 ELSE 0 END) AS con_votes
            FROM votes WHERE debate_id = ?`,
            [id]
        );

        res.status(200).json(votes[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get votes for a debate and the user's specific vote
router.get('/:id/votes/:userId', async (req, res) => {
    const { id, userId } = req.params;

    try {
        // Get total pro and con votes for the debate
        const [totalVotes] = await db.query(
            `SELECT 
                SUM(CASE WHEN vote_type = 'pro' THEN 1 ELSE 0 END) AS pro_votes,
                SUM(CASE WHEN vote_type = 'con' THEN 1 ELSE 0 END) AS con_votes
            FROM votes WHERE debate_id = ?`,
            [id]
        );

        // Get the user's specific vote type (if any)
        const [userVote] = await db.query(
            `SELECT vote_type FROM votes WHERE debate_id = ? AND user_id = ? LIMIT 1`,
            [id, userId]
        );

        res.status(200).json({
            pro_votes: totalVotes[0].pro_votes || 0,
            con_votes: totalVotes[0].con_votes || 0,
            user_vote: userVote.length > 0 ? userVote[0].vote_type : null
        });

        console.log("Total Votes: ", totalVotes[0]);
        console.log("User Vote: ", userVote.length > 0 ? userVote[0].vote_type : "No vote");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user's vote for a debate
router.delete('/:id/vote/:userId', async (req, res) => {
    const { id, userId } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM votes WHERE debate_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vote not found.' });
        }

        res.status(200).json({ message: 'Vote deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Add a vote to a debate
router.post('/:id/vote', async (req, res) => {
    const { id } = req.params;
    const { user_id, type } = req.body; // type can be "pro" or "con"

    try {
        const [result] = await db.query(
            `INSERT INTO votes (debate_id, user_id, vote_type) VALUES (?, ?, ?)`,
            [id, user_id, type]
        );
        res.status(201).json({ message: 'Vote added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comments for a debate
router.get('/:id/comments', async (req, res) => {
    const { id } = req.params;

    try {
        const [comments] = await db.query(
            `SELECT c.*, u.username AS commenter, u.email AS email
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.debate_id = ?`,
            [id]
        );

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a comment to a debate
router.post('/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { user_id, text } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO comments (debate_id, user_id, content) VALUES (?, ?, ?)`,
            [id, user_id, text]
        );
        res.status(201).json({ message: 'Comment added successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit a comment
router.put('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE comments SET content = ? WHERE id = ?`,
            [text, commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        const [result] = await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get debates by UserID
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [debates] = await db.query(
            `SELECT d.*, u.username AS created_by_user
            FROM debates d
            JOIN users u ON d.created_by = u.id
            WHERE u.id = ?`,
            [id]
        );

        if (debates.length === 0) {
            return res.status(404).json({ error: 'No debates found for this user.' });
        }

        res.status(200).json(debates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a debate
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, category, description } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE debates SET title = ?, category = ?, description = ? WHERE id = ?`,
            [title, category, description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debate not found.' });
        }

        res.status(200).json({ message: 'Debate updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a debate
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(`DELETE FROM debates WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debate not found.' });
        }

        res.status(200).json({ message: 'Debate deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save a debate
router.post('/:id/save', async (req, res) => {
    const { id } = req.params; // Debate ID
    const { user_id } = req.body; // User ID from request body

    try {
        // Insert into saved_debates table, ensuring no duplicates
        await db.query(
            `INSERT INTO saved_debates (user_id, debate_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE saved_at = CURRENT_TIMESTAMP`,
            [user_id, id]
        );

        res.status(200).json({ message: 'Debate saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unsave a debate
router.delete('/:id/unsave', async (req, res) => {
    const { id } = req.params; // Debate ID
    const { user_id } = req.body; // User ID from request body

    try {
        const [result] = await db.query(
            `DELETE FROM saved_debates WHERE debate_id = ? AND user_id = ?`,
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Debate not found in saved list.' });
        }

        res.status(200).json({ message: 'Debate unsaved successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all saved debates for a user
router.get('/saved/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [savedDebates] = await db.query(
            `SELECT d.*, u.username AS created_by_user
             FROM saved_debates sd
             JOIN debates d ON sd.debate_id = d.id
             JOIN users u ON d.created_by = u.id
             WHERE sd.user_id = ?`,
            [userId]
        );

        res.status(200).json(savedDebates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:debateId/saved/:userId', async (req, res) => {
    const { debateId, userId } = req.params;

    try {
        const [result] = await db.query(
            `SELECT * FROM saved_debates WHERE debate_id = ? AND user_id = ?`,
            [debateId, userId]
        );

        if (result.length > 0) {
            res.status(200).json({ isSaved: true });
        } else {
            res.status(200).json({ isSaved: false });
        }
    } catch (error) {
        console.error("Error checking if debate is saved:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get user votes for comments in a specific debate
router.get('/:debateId/user-votes/:userId', async (req, res) => {
    const { debateId, userId } = req.params;

    try {
        const [votes] = await db.query(
            `SELECT comment_id, vote FROM comment_votes
             WHERE comment_id IN (SELECT id FROM comments WHERE debate_id = ?) AND user_id = ?`,
            [debateId, userId]
        );

        res.status(200).json(votes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
