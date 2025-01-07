document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";

    const debatesContainer = document.getElementById("debates-container");
    const createDebateButton = document.getElementById("create-debate-button");
    const debateForm = document.getElementById("debate-form");
    const debateModalLabel = document.getElementById("debateModalLabel");
    const debateTitleInput = document.getElementById("debate-title");
    const debateCatInput = document.getElementById("debate-category");
    const debateDescriptionInput = document.getElementById("debate-description");
    const debateIdInput = document.getElementById("debate-id");
    const debateModal = new bootstrap.Modal(document.getElementById("debateModal"));

    const username = document.getElementById("username");
    const dropdownPictureElement = document.getElementById("dropdown-picture");

    let userId = '';

    const wordCountElement = document.getElementById("word-count");

    // Initialize Quill editor with custom toolbar
    const quill = new Quill("#debate-description", {
        theme: "snow",
        placeholder: "Write debate description...",
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

    // Fetch debates
    async function fetchDebates() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/user/${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch debates.");

            const debates = await response.json();
            console.log("DEBATES: " + JSON.stringify(debates));
            renderDebates(debates);
        } catch (error) {
            console.error("Error fetching debates:", error);
            debatesContainer.innerHTML = "<p class='text-muted'>Failed to load debates.</p>";
        }
    }

    // Render debates
    function renderDebates(debates) {
        debatesContainer.innerHTML = "";

        debates.forEach((debate) => {
            // Check if the debate is reported and add a badge
            const reportedBadge = debate.report_flag
            ? `<span class="badge-reported btn-sm btn btn-danger"><i class="bi bi-flag-fill"></i>&nbsp;Reported</span><br><br>`
            : "";

            const debateCard = `
                <div class="col-lg-4 mb-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                        ${reportedBadge}
                            <h5 class="card-title"><a href="http://localhost:3000/debate/${debate.id}">${debate.title}</a></h5>
                            <small class="card-text">${debate.category}</small>
                            <p class="card-text">${debate.description}</p>
                            <p class="text-muted">
                                Topic: ${debate.topic_title || "General"}<br>
                                Created by: ${debate.created_by_user || "Unknown"}
                            </p>
                            <button class="btn btn-warning btn-sm edit-debate" data-id="${debate.id}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-debate" data-id="${debate.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            debatesContainer.insertAdjacentHTML("beforeend", debateCard);
        });

        // Attach event listeners for Edit/Delete
        document.querySelectorAll(".edit-debate").forEach((button) =>
            button.addEventListener("click", handleEditDebate)
        );
        document.querySelectorAll(".delete-debate").forEach((button) =>
            button.addEventListener("click", handleDeleteDebate)
        );
    }

    // Handle create debate
    createDebateButton.addEventListener("click", () => {
        debateModalLabel.textContent = "Create Debate";
        debateTitleInput.value = "";
        debateCatInput.value = "";
        debateDescriptionInput.value = "";
        debateIdInput.value = "";
        debateModal.show();
    });

    // Handle edit debate
    function handleEditDebate(event) {
        const debateId = event.target.dataset.id;
        fetch(`${API_BASE_URL}/debates/${debateId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((debate) => {
                debateModalLabel.textContent = "Edit Debate";
                debateTitleInput.value = debate.title;
                debateCatInput.value = debate.category;

                // Set the Quill editor content with the debate description HTML
                quill.root.innerHTML = debate.description;

                debateIdInput.value = debate.id;
                debateModal.show();
            })
            .catch((error) => {
                console.error("Error fetching debate:", error);
                alert("Failed to fetch debate details.");
            });
    }

    // Handle delete debate
    function handleDeleteDebate(event) {
        const debateId = event.target.dataset.id;
        if (!confirm("Are you sure you want to delete this debate?")) return;

        fetch(`${API_BASE_URL}/debates/${debateId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to delete debate.");
                alert("Debate deleted successfully.");
                fetchDebates();
            })
            .catch((error) => {
                console.error("Error deleting debate:", error);
                alert("Failed to delete debate.");
            });
    }

    // Handle debate form submission
    debateForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const debateData = {
            title: debateTitleInput.value.trim(),
            category: debateCatInput.value.trim(),
            description: quill.root.innerHTML.trim(),
            created_by: userId, // Assuming userId is stored in localStorage
        };

        const debateId = debateIdInput.value;
        const method = debateId ? "PUT" : "POST";
        const endpoint = debateId
            ? `${API_BASE_URL}/debates/${debateId}`
            : `${API_BASE_URL}/debates`;

        fetch(endpoint, {
            method,
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(debateData),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to save debate.");
                alert("Debate saved successfully.");
                debateModal.hide();
                fetchDebates();
            })
            .catch((error) => {
                console.error("Error saving debate:", error);
                alert("Failed to save debate.");
            });
    });

    // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

    // Initialize page
    fetchDebates();
});
