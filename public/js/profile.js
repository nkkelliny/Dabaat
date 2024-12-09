document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";

    const profilePictureElement = document.getElementById("profile-picture");
    const dropdownPictureElement = document.getElementById("dropdown-picture");
    const profileUsernameElement = document.getElementById("profile-username");
    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const emailInput = document.getElementById("email");
    const profileForm = document.getElementById("profile-form");
    const username = document.getElementById("username");

    let userId = '';
    let userEmail = '';

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
            profileUsernameElement.textContent = profile.username;
            firstNameInput.value = profile.first_name || "";
            lastNameInput.value = profile.last_name || "";
            emailInput.value = profile.email || "";
            username.textContent = profile.username;

            userEmail = profile.email;

            dropdownPictureElement.src = getGravatarUrl(profile.email);
            // Set the Gravatar profile picture
            profilePictureElement.src = getGravatarUrl(profile.email);
        } catch (error) {
            console.error("Error fetching profile:", error);
            alert("Failed to load profile. Please log in again.");
            window.location.href = "/login";
        }
    }

    // Update user profile
    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const updatedProfile = {
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile?userId=${userId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedProfile),
            });

            if (!response.ok) throw new Error("Failed to update profile.");

            alert("Profile updated successfully!");
            await fetchUserProfile(); // Reload updated profile
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Email may be already taken.");
        }
    });

    // Function to load MD5 hashing library
    function loadMd5Library() {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js";
            script.onload = resolve;
            document.body.appendChild(script);
        });
    }

    // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

    // Initialize profile
    await loadMd5Library();
    await fetchUserProfile();
});
