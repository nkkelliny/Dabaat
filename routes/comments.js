const express = require('express');
const router = express.Router();
const db = require('../database').db;

// Create a new comment
router.post('/', async (req, res) => {
    const { content, debate_id, topic_id, user_id } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO comments (content, debate_id, topic_id, user_id) VALUES (?, ?, ?, ?)`,
            [content, debate_id, topic_id, user_id]
        );
        res.status(201).json({ message: 'Comment added successfully!', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Like a comment (toggle logic)
router.post('/:commentId/:userId/like', async (req, res) => {
    const { commentId, userId } = req.params;

    try {
        await db.query('START TRANSACTION');

        // Check if user already voted on this comment
        const [existingVote] = await db.query(
            `SELECT * FROM comment_votes WHERE comment_id = ? AND user_id = ?`,
            [commentId, userId]
        );

        if (existingVote.length > 0) {
            if (existingVote[0].vote === 'like') {
                // User clicked like again – remove the like
                await db.query(`DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?`, [commentId, userId]);
                await db.query(`UPDATE comments SET likes = likes - 1 WHERE id = ?`, [commentId]);
                await db.query('COMMIT');
                return res.status(200).json({ message: 'Like removed successfully!' });
            } else {
                // User switches from dislike to like
                await db.query(`UPDATE comment_votes SET vote = 'like' WHERE comment_id = ? AND user_id = ?`, [commentId, userId]);
                await db.query(`UPDATE comments SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = ?`, [commentId]);
                await db.query('COMMIT');
                return res.status(200).json({ message: 'Switched to like successfully!' });
            }
        } else {
            // New like
            await db.query(`INSERT INTO comment_votes (comment_id, user_id, vote) VALUES (?, ?, 'like')`, [commentId, userId]);
            await db.query(`UPDATE comments SET likes = likes + 1 WHERE id = ?`, [commentId]);
            await db.query('COMMIT');
            return res.status(200).json({ message: 'Comment liked successfully!' });
        }
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// Dislike a comment (toggle logic)
router.post('/:commentId/:userId/dislike', async (req, res) => {
    const { commentId, userId } = req.params;

    try {
        await db.query('START TRANSACTION');

        // Check if user already voted on this comment
        const [existingVote] = await db.query(
            `SELECT * FROM comment_votes WHERE comment_id = ? AND user_id = ?`,
            [commentId, userId]
        );

        if (existingVote.length > 0) {
            if (existingVote[0].vote === 'dislike') {
                // User clicked dislike again – remove the dislike
                await db.query(`DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?`, [commentId, userId]);
                await db.query(`UPDATE comments SET dislikes = dislikes - 1 WHERE id = ?`, [commentId]);
                await db.query('COMMIT');
                return res.status(200).json({ message: 'Dislike removed successfully!' });
            } else {
                // User switches from like to dislike
                await db.query(`UPDATE comment_votes SET vote = 'dislike' WHERE comment_id = ? AND user_id = ?`, [commentId, userId]);
                await db.query(`UPDATE comments SET dislikes = dislikes + 1, likes = likes - 1 WHERE id = ?`, [commentId]);
                await db.query('COMMIT');
                return res.status(200).json({ message: 'Switched to dislike successfully!' });
            }
        } else {
            // New dislike
            await db.query(`INSERT INTO comment_votes (comment_id, user_id, vote) VALUES (?, ?, 'dislike')`, [commentId, userId]);
            await db.query(`UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?`, [commentId]);
            await db.query('COMMIT');
            return res.status(200).json({ message: 'Comment disliked successfully!' });
        }
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});


// Reply to a comment
router.post('/reply', async (req, res) => {
    const { content, user_id, parent_comment_id } = req.body;

    if (!content || !user_id || !parent_comment_id) {
        return res.status(400).json({ error: "Content, user_id, and parent_comment_id are required." });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO comments (content, user_id, parent_comment_id) VALUES (?, ?, ?)`,
            [content, user_id, parent_comment_id]
        );
        res.status(201).json({ message: 'Reply added successfully!', commentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
