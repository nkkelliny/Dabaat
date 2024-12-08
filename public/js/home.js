document.addEventListener("DOMContentLoaded", async () => {
        const usernameElement = document.getElementById("username");
        const recentDebatesSection = document.querySelector("#your-debates .row");

        // Base API URL
        const API_BASE_URL = "http://localhost:3000/api";

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

        // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

        await fetchUserProfile();
    });