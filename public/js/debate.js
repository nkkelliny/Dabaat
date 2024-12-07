document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const urlPath = window.location.pathname; // Get the path, e.g., "/debate/3"
    const debateId = urlPath.split("/").pop(); // Split by "/" and get the last part
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

            // Update vote counts
            proVotesCountElement.textContent = debate.pro_votes || 0;
            conVotesCountElement.textContent = debate.con_votes || 0;
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
                    <div class="comment">
                        <img src="https://www.gravatar.com/avatar/${gravatarHash}?s=50&d=identicon" alt="User Gravatar">
                        <div>
                            <strong>${comment.username}</strong>
                            <p>${comment.text}</p>
                            <hr>
                        </div>
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
                body: JSON.stringify({ text: commentText }),
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
                body: JSON.stringify({ type }),
            });

            if (!response.ok) throw new Error("Failed to submit vote.");
            alert(`You voted ${type === "pro" ? "Pro" : "Con"}.`);
            await fetchDebateDetails(); // Refresh vote counts
        } catch (error) {
            alert(error.message);
        }
    }

    // Initialize the page
    await fetchDebateDetails();
    await fetchComments();
});
