document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const urlPath = window.location.pathname; // Get the path, e.g., "/debate/3"
    const debateId = urlPath.split('/').pop(); // Split by "/" and get the last part
    console.log("DEBATE ID: " + debateId);

    const debateTitleElement = document.getElementById("debate-title");
    const debateDescriptionElement = document.getElementById("debate-description");
    const commentsContainer = document.getElementById("comments-container");
    const newCommentInput = document.getElementById("new-comment");
    const submitCommentButton = document.getElementById("submit-comment");

    const voteProButton = document.getElementById("vote-pro");
    const voteConButton = document.getElementById("vote-con");

    const proVoteCountElement = document.getElementById("pro-votes-count");
    const conVoteCountElement = document.getElementById("con-votes-count");

    // Fetch debate details
    async function fetchDebateDetails() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}`);
            if (!response.ok) throw new Error("Failed to fetch debate details.");

            const debate = await response.json();
            debateTitleElement.textContent = debate.title;
            debateDescriptionElement.textContent = debate.description;
        } catch (error) {
            debateTitleElement.textContent = "Error Loading Debate";
            debateDescriptionElement.textContent = error.message;
        }
    }

    // Fetch votes
    async function fetchVotes() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/votes`);
            if (!response.ok) throw new Error("Failed to fetch votes.");

            const votes = await response.json();
            proVoteCountElement.textContent = votes.pro_votes || 0;
            conVoteCountElement.textContent = votes.con_votes || 0;
        } catch (error) {
            console.error("Error fetching votes:", error.message);
            proVoteCountElement.textContent = 0;
            conVoteCountElement.textContent = 0;
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
                const commentElement = `
                    <div class="mb-3">
                        <strong>${comment.commenter}</strong>
                        <p>${comment.content}</p>
                        <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                        <hr>
                    </div>
                `;
                commentsContainer.insertAdjacentHTML("beforeend", commentElement);
            });
        } catch (error) {
            commentsContainer.innerHTML = `<p class="text-muted">${error.message}</p>`;
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
    voteProButton.addEventListener("click", async () => vote("pro"));
    voteConButton.addEventListener("click", async () => vote("con"));

    async function vote(type) {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: localStorage.getItem("userId"), type }),
            });

            if (!response.ok) throw new Error("Failed to submit vote.");
            await fetchVotes();
            alert(`You voted ${type === "pro" ? "Pro" : "Con"}.`);
        } catch (error) {
            alert(error.message);
        }
    }

    // Initialize the page
    await fetchDebateDetails();
    await fetchVotes();
    await fetchComments();
});
