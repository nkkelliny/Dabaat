const express = require('express');
const router = express.Router();
const db = require('../database').db;

router.get('/popular', async (req, res) => {
    try {
        const query = `
            SELECT 
                d.id, 
                d.title, 
                d.category, 
                d.description, 
                u.username AS created_by_user, 
                u.email AS creator_email,
                COALESCE(SUM(CASE WHEN v.vote_type IN ('pro', 'con') THEN 1 ELSE 0 END), 0) AS total_votes
            FROM debates d
            LEFT JOIN votes v ON d.id = v.debate_id
            JOIN users u ON d.created_by = u.id
            GROUP BY d.id, d.title, d.category, d.description, u.username, u.email
            ORDER BY total_votes DESC
            LIMIT 5
        `;

        const [popularDebates] = await db.query(query);

        // Log the result for debugging
        console.log("Popular debates result:", popularDebates);

        // If no debates are found
        if (!popularDebates || popularDebates.length === 0) {
            return res.status(200).json({ message: 'No popular debates found.' });
        }

        // Return the popular debates
        res.status(200).json(popularDebates);
    } catch (error) {
        console.error("Error fetching popular debates:", error);
        res.status(500).json({ error: 'An error occurred while fetching popular debates.' });
    }
});

module.exports = router;
