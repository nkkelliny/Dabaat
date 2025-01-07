document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";

    const debatesContainer = document.getElementById("debates-container");
    const username = document.getElementById("username");
    const dropdownPictureElement = document.getElementById("dropdown-picture");

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



    await decryptData(localStorage.getItem("userId"));

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

    // Fetch saved debates
    async function fetchSavedDebates() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates/saved/${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch saved debates.");

            const savedDebates = await response.json();
            renderDebates(savedDebates);
        } catch (error) {
            console.error("Error fetching saved debates:", error);
            debatesContainer.innerHTML = "<p class='text-muted'>Failed to load saved debates.</p>";
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
                                Created by: ${debate.created_by_user || "Unknown"}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            debatesContainer.insertAdjacentHTML("beforeend", debateCard);
        });
    }

    // Initialize page
    fetchSavedDebates();
});
