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

    const saveDebateButton = document.getElementById("save-debate-button");
    let isDebateSaved = false;


    let userId = '';
    let isUserComment = false;

    const wordCountElement = document.getElementById("word-count");

    // Initialize Quill editor with custom toolbar
    const quill = new Quill("#editor-container", {
        theme: "snow",
        placeholder: "Write your comment...",
        modules: {
            toolbar: {
                container: "#toolbar",
                handlers: {
                    'color': function () {},
                    'background': function () {}
                }
            }
        }
    });

    document.getElementById("insert-image-button").addEventListener("click", () => {
        const imageUrl = prompt("Enter the image URL:");
        if (imageUrl) {
            const range = quill.getSelection();
            quill.insertEmbed(range.index, "image", imageUrl);
        }
    });


    quill.on("text-change", (delta, oldDelta, source) => {
        const text = quill.getText().trim();
        const lines = text.split("\n");
        const wordCount = text ? text.split(/\s+/).length : 0;
        const charCount = text.length;

        wordCountElement.textContent = `Words: ${wordCount} | Characters: ${charCount}`;

        document.querySelectorAll("pre.ql-syntax").forEach((block) => {
            hljs.highlightElement(block);
        });
    
        lines.forEach((line, index) => {
            if (line.startsWith("@")) {
                const start = quill.getLine(index)[1].index;
                const length = line.length;
                quill.formatText(start, length, "bold", true);
            }
        });
    });

    quill.getModule("toolbar").addHandler("image", () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();
    
        input.onchange = () => {
            const file = input.files[0];
            const reader = new FileReader();
    
            reader.onload = () => {
                const range = quill.getSelection();
                quill.insertEmbed(range.index, "image", reader.result);
            };
    
            reader.readAsDataURL(file);
        };
    });
    
    document.getElementById("undo-button").addEventListener("click", () => quill.history.undo());
    document.getElementById("redo-button").addEventListener("click", () => quill.history.redo());

    // Add a custom button click event for inserting videos
document.getElementById("insert-video-button").addEventListener("click", () => {
    const videoUrl = prompt("Enter the video URL (YouTube or direct video URL):");

    if (videoUrl) {
        const range = quill.getSelection();

        // Check if the URL is a YouTube link
        const youtubeMatch = videoUrl.match(
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w\-]+)/
        );

        if (youtubeMatch) {
            // Insert YouTube embed iframe
            const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
            quill.insertEmbed(range.index, "video", youtubeEmbedUrl);
        } else if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
            // For direct video file URLs, insert the URL as a video
            quill.insertEmbed(range.index, "video", videoUrl);
        } else {
            alert("Invalid video URL. Please enter a valid YouTube or direct video URL.");
        }
    }
});


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
            debateDescriptionElement.innerHTML = debate.description;

            // Display the creator's username and Gravatar
            creatorUsernameElement.textContent = debate.created_by_user;
            const gravatarHash = md5(debate.creator_email.trim().toLowerCase());
            creatorGravatarElement.src = `https://www.gravatar.com/avatar/${gravatarHash}`;

            await fetchVotes();
            await checkIfDebateSaved();
        } catch (error) {
            debateTitleElement.textContent = "Error Loading Debate";
            debateDescriptionElement.textContent = error.message;
        }
    }

    async function fetchComments() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/comments`);
            if (!response.ok) throw new Error("Failed to fetch comments.");

            const comments = await response.json();
            renderComments(comments, userId); // Pass the current user's userId
        } catch (error) {
            commentsContainer.innerHTML = `<p class="text-muted">${error.message}</p>`;
        }
    }

    async function fetchUserVotes(debateId, userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/user-votes/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch user votes.');
    
            return await response.json(); // Returns an array of votes [{ comment_id: 1, vote: 'like' }]
        } catch (error) {
            console.error('Error fetching user votes:', error);
            return [];
        }
    }

    let userVotes = await fetchUserVotes(debateId, userId);
    

    function renderComments(comments, currentUserId) {
        commentsContainer.innerHTML = ""; // Clear existing comments
    
        comments.forEach((comment) => {
            const gravatarHash = md5(comment.email.trim().toLowerCase());
            const isUserComment = comment.user_id === currentUserId;
            const userVote = userVotes.find(vote => vote.comment_id === comment.id);
            let commentElement = '';

            if(comment.user_id == currentUserId){
                commentElement = `
                <div class="comment d-flex align-items-start mb-3" style="border-bottom: 1px solid; padding-bottom: 5px;">
                    <img src="https://www.gravatar.com/avatar/${gravatarHash}" alt="User Gravatar" class="avatar me-3 rounded-circle">
                    <div style="width: 100%;">
                        <strong>${comment.commenter}</strong>
                        <p>${comment.content}</p>
                        <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-warning reply-btn" data-comment-id="${comment.id}" data-commenter="${comment.commenter}" data-content="${comment.content}" style="border: 0;">Reply</button>
                            <button class="btn btn-sm btn-outline-success like-btn" style="border: 0;" data-comment-id="${comment.id}" ${userVote}>
                                <i class="bi bi-hand-thumbs-up"></i> (${comment.likes || 0})
                            </button>
                            <button class="btn btn-sm btn-outline-danger dislike-btn" style="border: 0;" data-comment-id="${comment.id}" ${userVote}>
                                <i class="bi bi-hand-thumbs-down"></i> (${comment.dislikes || 0})
                            </button>
                        </div>
                        <button class="btn btn-sm btn-outline-danger delete-comment-btn" data-comment-id="${comment.id}" style="float: right; border: 0;"><i class="bi bi-x"></i> Delete</button>
                    </div>
                </div>
                `;
            }
            else{
                commentElement = `
                <div class="comment d-flex align-items-start mb-3" style="border-bottom: 1px solid; padding-bottom: 5px;">
                    <img src="https://www.gravatar.com/avatar/${gravatarHash}" alt="User Gravatar" class="avatar me-3 rounded-circle">
                    <div style="width: 100%;">
                        <strong>${comment.commenter}</strong>
                        <p>${comment.content}</p>
                        <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-warning reply-btn" data-comment-id="${comment.id}" data-commenter="${comment.commenter}" data-content="${comment.content}" style="border: 0;">Reply</button>
                            <button class="btn btn-sm btn-outline-success like-btn" style="border: 0;" data-comment-id="${comment.id}" ${userVote}>
                                <i class="bi bi-hand-thumbs-up"></i> (${comment.likes || 0})
                            </button>
                            <button class="btn btn-sm btn-outline-danger dislike-btn" style="border: 0;" data-comment-id="${comment.id}" ${userVote}>
                                <i class="bi bi-hand-thumbs-down"></i> (${comment.dislikes || 0})
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }
    
            commentsContainer.insertAdjacentHTML("beforeend", commentElement);
        });
    
        // Add event listener for reply buttons
        document.querySelectorAll(".reply-btn").forEach((button) => {
            button.addEventListener("click", handleReply);
        });
    
        document.querySelectorAll(".like-btn").forEach((button) => {
            button.addEventListener("click", () => handleLikeDislike(button.dataset.commentId, userId, "like"));
        });
    
        document.querySelectorAll(".dislike-btn").forEach((button) => {
            button.addEventListener("click", () => handleLikeDislike(button.dataset.commentId, userId, "dislike"));
        });
    
        document.querySelectorAll(".delete-comment-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                const commentId = event.currentTarget.dataset.commentId;
                handleDeleteComment(commentId);
            });
        });
    }

    function handleReply(event) {
        // Get the commenter and content from the button's data attributes
        const commenter = event.currentTarget.dataset.commenter;
        const content = event.currentTarget.dataset.content;
    
        if (!commenter || !content) {
            alert("Failed to capture commenter or content for the reply.");
            return;
        }
    
        console.log("Replying to:", commenter);
        console.log("Original comment content:", content);
    
        // Format the quoted content with a blockquote
        const quotedContent = `
            <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; color: #555;">
                <span><strong>@${commenter}</strong> said:${content}</span>
            </blockquote><p><br></p>
        `;
    
        // Insert the quoted content into the editor
        quill.clipboard.dangerouslyPasteHTML(quill.getLength(), quotedContent);
    
        // Focus the editor for the user to start typing their reply
        quill.focus();
    }
    
    
    async function handleLikeDislike(commentId, userId, action) {
        console.log("USER ID: " + userId);
        try {
            const response = await fetch(`${API_BASE_URL}/comments/${commentId}/${userId}/${action}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
    
            if (!response.ok) throw new Error(`Failed to ${action} the comment.`);
    
            await fetchComments(); // Refresh comments to show updated likes/dislikes
        } catch (error) {
            alert(error.message);
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
document.getElementById("submit-comment").addEventListener("click", async () => {
    const commentText = quill.root.innerHTML.trim();
    if (!commentText || commentText === "<p><br></p>") {
        return alert("Please write a comment before submitting.");
    }

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

        quill.setContents([]); // Clear the editor after submission
        await fetchComments(); // Refresh the comments
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

    // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

        async function handleDeleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) throw new Error("Failed to delete comment.");

        alert("Comment deleted successfully.");
        window.location.reload();
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment.");
    }
}

async function checkIfDebateSaved() {
    try {
        const response = await fetch(`${API_BASE_URL}/debates/${debateId}/saved/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) throw new Error("Failed to check if debate is saved.");

        const data = await response.json();
        isDebateSaved = data.isSaved;
        updateSaveButton();
    } catch (error) {
        console.error("Error checking if debate is saved:", error);
    }
}

    // Update the save button text based on save status
    function updateSaveButton() {
        if (isDebateSaved) {
            saveDebateButton.innerHTML = `<i class="bi bi-bookmark-fill"></i> Unsave Debate`;
        } else {
            saveDebateButton.innerHTML = `<i class="bi bi-bookmark"></i> Save Debate`;
        }
    }

    // Save debate function
    async function saveDebate() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) throw new Error("Failed to save debate.");

            isDebateSaved = true;
            updateSaveButton();
            alert("Debate saved successfully!");
        } catch (error) {
            console.error("Error saving debate:", error);
            alert("Failed to save debate.");
        }
    }

    // Unsave debate function
    async function unsaveDebate() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/${debateId}/unsave`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) throw new Error("Failed to unsave debate.");

            isDebateSaved = false;
            updateSaveButton();
            alert("Debate unsaved successfully!");
        } catch (error) {
            console.error("Error unsaving debate:", error);
            alert("Failed to unsave debate.");
        }
    }

    // Handle save button click
    saveDebateButton.addEventListener("click", () => {
        if (isDebateSaved) {
            unsaveDebate();
        } else {
            saveDebate();
        }
    });

    // Initialize the page
    await fetchDebateDetails();
    await fetchVotes();
    await fetchComments();
});
