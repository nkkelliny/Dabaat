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
            creatorGravatarElement.src = `https://www.gravatar.com/avatar/${gravatarHash}?s=60&d=identicon`;

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
                        <img src="https://www.gravatar.com/avatar/${gravatarHash}?s=50&d=identicon" alt="User Gravatar" class="me-3 rounded-circle">
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
            const userId = localStorage.getItem("userId");
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
                body: JSON.stringify({ user_id: localStorage.getItem("userId"), text: commentText }),
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
        const userId = localStorage.getItem("userId");

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

    // Initialize the page
    await fetchDebateDetails();
    await fetchVotes();
    await fetchComments();
});
