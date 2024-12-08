document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const accountForm = document.getElementById("account-form");

    const mfaEnabledSwitch = document.getElementById("mfa-enabled");
    const mfaSetupSection = document.getElementById("mfa-setup");
    const mfaQrCode = document.getElementById("mfa-qr-code");
    const mfaCodeInput = document.getElementById("mfa-code");
    const verifyMfaButton = document.getElementById("verify-mfa");

    const deleteAccountButton = document.getElementById("confirm-delete-button");
    const confirmDeleteInput = document.getElementById("confirm-delete-input");

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
        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
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

    // Fetch account settings
    async function fetchSettings() {
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/settings?userId=${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch settings.");

            const settings = await response.json();
            emailInput.value = settings.email || "";
            mfaEnabledSwitch.checked = settings.mfa_enabled;
        } catch (error) {
            console.error("Error fetching settings:", error);
            alert("Failed to load settings. Please try again later.");
        }
    }

    // Delete account functionality
    deleteAccountButton.addEventListener("click", async () => {
        const confirmationText = confirmDeleteInput.value.trim();

        if (confirmationText !== "delete") {
            alert("You must type 'delete' to confirm account deletion.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/delete?userId=${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete account.");

            alert("Account deleted successfully.");
            localStorage.clear();
            window.location.href = "/login";
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Failed to delete account. Please try again.");
        }
    });


    // Update account information
    accountForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/users/settings?userId=${userId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: userId, email, password }),
            });

            if (!response.ok) throw new Error("Failed to update account information.");

            alert("Account information updated successfully.");
        } catch (error) {
            console.error("Error updating account:", error);
            alert("Failed to update account information. Please try again.");
        }
    });

    // Enable MFA and display QR code for setup
    mfaEnabledSwitch.addEventListener("change", async () => {
        if (mfaEnabledSwitch.checked) {
            try {
                const response = await fetch(`${API_BASE_URL}/users/settings/mfa/enable?userId=${userId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ userId: userId})
                });

                if (!response.ok) throw new Error("Failed to set up MFA.");

                const { qrCodeUrl } = await response.json();
                mfaQrCode.src = qrCodeUrl;
                mfaSetupSection.style.display = "block";
            } catch (error) {
                console.error("Error enabling MFA:", error);
                alert("Failed to enable MFA. Please try again.");
                mfaEnabledSwitch.checked = false;
            }
        } else {
            try {
                const response = await fetch(`${API_BASE_URL}/users/settings/mfa/disable?userId=${userId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ userId: userId})

                });

                if (!response.ok) throw new Error("Failed to disable MFA.");

                alert("MFA disabled successfully.");
                mfaSetupSection.style.display = "none";
            } catch (error) {
                console.error("Error disabling MFA:", error);
                alert("Failed to disable MFA. Please try again.");
                mfaEnabledSwitch.checked = true;
            }
        }
    });

    // Verify MFA code
    verifyMfaButton.addEventListener("click", async () => {
        const code = mfaCodeInput.value.trim();

        if (!code) {
            return alert("Please enter the code from your authenticator app.");
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/settings/mfa/verify?userId=${userId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: userId, token: code }),
            });

            if (!response.ok) throw new Error("Failed to verify MFA.");

            alert("MFA setup verified successfully.");
            mfaSetupSection.style.display = "none";
        } catch (error) {
            console.error("Error verifying MFA:", error);
            alert("Failed to verify MFA. Please try again.");
        }
    });

    // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            localStorage.removeItem("userId"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

    // Initialize settings page
    await fetchSettings();
    await fetchUserProfile();
});
