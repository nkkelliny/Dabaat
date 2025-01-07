document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const urlPath = window.location.pathname;
    const debateId = urlPath.split("/").pop();
    console.log("DEBATE ID: " + debateId);

    const debateTitleElement = document.getElementById("debate-title");
    const debateDescriptionElement = document.getElementById("debate-description");
    const creatorUsernameElement = document.getElementById("creator-username");
    const creatorGravatarElement = document.getElementById("creator-gravatar");
    const commentsContainer = document.getElementById("comments-container");
    const newCommentInput = document.getElementById("new-comment");
    const submitCommentButton = document.getElementById("submit-comment");

    const voteProButton = document.getElementById("vote-pro");
    const voteConButton = document.getElementById("vote-con");
    const proVotesCountElement = document.getElementById("pro-votes-count");
    const conVotesCountElement = document.getElementById("con-votes-count");

    let userVote = null;

    const username = document.getElementById("username");
    const dropdownPictureElement = document.getElementById("dropdown-picture");

    // Other existing elements
    const reportDebateButton = document.getElementById("report-debate-button");
    const confirmReportButton = document.getElementById("confirm-report-button");
    const reportReasonInput = document.getElementById("report-reason");


    let userId = '';

    async function decryptData(encryptedData) {
    try {
        const response = await fetch(`${API_BASE_URL}/encrypt/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedData }),
        });

        if (!response.ok) {
            throw new Error('Failed to decrypt data.');
        }

        const result = await response.json();
        console.log('Decrypted Data:', result.decryptedData);
        userId = result.decryptedData;
        return result.decryptedData;
    } catch (error) {
        console.error('Error during decryption:', error);
        return null;
    }
}


    await decryptData(localStorage.getItem("userId"));

    // Function to generate Gravatar URL
    function getGravatarUrl(email, size = 150) {
        const hash = md5(email.trim().toLowerCase());
        return `https://www.gravatar.com/avatar/${hash}`;
    }

    // Function to load MD5 hashing library
    function loadMd5Library() {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js";
            script.onload = resolve;
            document.body.appendChild(script);
        });
    }

    // Initialize profile
    await loadMd5Library();

    // Fetch user profile
    async function fetchUserProfile() {
        

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile?userId=${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch user profile.");

            const profile = await response.json();
            
            username.textContent = profile.username;
            dropdownPictureElement.src = getGravatarUrl(profile.email);
        } catch (error) {
            console.error("Error fetching profile:", error);
            alert("Failed to load profile. Please log in again.");
            window.location.href = "/login";
        }
    }

    await fetchUserProfile();

    // Fetch debate details
    async function fetchDebateDetails() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}`);
            if (!response.ok) throw new Error("Failed to fetch debate details.");

            const debate = await response.json();
            debateTitleElement.textContent = debate.title;
            debateDescriptionElement.textContent = debate.description;

            // Display the creator's username and Gravatar
            creatorUsernameElement.textContent = debate.created_by_user;
            const gravatarHash = md5(debate.creator_email.trim().toLowerCase());
            creatorGravatarElement.src = `https://www.gravatar.com/avatar/${gravatarHash}`;

            await fetchVotes();
        } catch (error) {
            debateTitleElement.textContent = "Error Loading Debate";
            debateDescriptionElement.textContent = error.message;
        }
    }

    // Fetch comments
    async function fetchComments() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/comments`);
            if (!response.ok) throw new Error("Failed to fetch comments.");

            const comments = await response.json();
            commentsContainer.innerHTML = "";

            comments.forEach((comment) => {
                const gravatarHash = md5(comment.email.trim().toLowerCase());
                const commentElement = `
                    <div class="comment d-flex align-items-start mb-3">
                        <img src="https://www.gravatar.com/avatar/${gravatarHash}" alt="User Gravatar" class="me-3 rounded-circle">
                        <div>
                            <strong>${comment.commenter}</strong>
                            <p>${comment.content}</p>
                            <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                        </div>
                    </div>
                `;
                commentsContainer.insertAdjacentHTML("beforeend", commentElement);
            });
        } catch (error) {
            commentsContainer.innerHTML = `<p class="text-muted">${error.message}</p>`;
        }
    }

    // Fetch votes
    async function fetchVotes() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/votes/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch votes.");

            const votes = await response.json();
            proVotesCountElement.textContent = votes.pro_votes || 0;
            conVotesCountElement.textContent = votes.con_votes || 0;
            userVote = votes.user_vote;
            console.log("USER VOTE: " + userVote);
        } catch (error) {
            console.error("Error fetching votes:", error.message);
            userVote = null;
        }
    }

    // Submit a comment
    submitCommentButton.addEventListener("click", async () => {
        const commentText = newCommentInput.value.trim();
        if (!commentText) return alert("Please write a comment before submitting.");

        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: userId, text: commentText }),
            });

            if (!response.ok) throw new Error("Failed to submit comment.");

            newCommentInput.value = "";
            await fetchComments();
        } catch (error) {
            alert(error.message);
        }
    });

    // Handle voting
    voteProButton.addEventListener("click", async () => handleVote("pro"));
    voteConButton.addEventListener("click", async () => handleVote("con"));

    async function handleVote(type) {

        try {
            // Delete the user's current vote if it exists
            if (userVote) {
                await fetch(`${API_BASE_URL}/debates/${debateId}/vote/${userId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
            }

            // Submit the new vote
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: userId, type }),
            });

            if (!response.ok) throw new Error("Failed to submit vote.");

            userVote = type;
            alert(`You voted ${type === "pro" ? "Pro" : "Con"}.`);
            await fetchVotes();
        } catch (error) {
            alert(error.message);
        }
    }

    // Function to report a debate
    async function reportDebate() {
        const reason = reportReasonInput.value.trim();

        if (!reason) {
            alert("Please provide a reason for reporting.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ report_reason: reason }),
            });

            if (!response.ok) throw new Error("Failed to report the debate.");

            alert("Debate reported successfully!");
            reportReasonInput.value = ""; // Clear the input
            document.getElementById("reportModal").querySelector(".btn-close").click(); // Close modal
        } catch (error) {
            alert(error.message);
        }
    }

    // Attach event listener to confirm report button
    confirmReportButton.addEventListener("click", reportDebate);

    // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

    // Initialize the page
    await fetchDebateDetails();
    await fetchVotes();
    await fetchComments();
});
