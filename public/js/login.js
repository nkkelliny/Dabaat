document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".user");
    const usernameInput = document.querySelector("#exampleInputUsername");
    const passwordInput = document.querySelector("#exampleInputPassword");
    const rememberMeCheckbox = document.querySelector("#rememberMe"); // Remember Me checkbox

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent form from reloading the page

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberMeCheckbox.checked;

        // Validate inputs
        if (!username) {
            alert("Please enter your username.");
            return;
        }
        if (!password) {
            alert("Please enter your password.");
            return;
        }

        try {
            // Send login request to the backend
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, remember_me: rememberMe }),
            });

            const data = await response.json();

            if (response.ok && data.tempToken) {
                // MFA required: Prompt for MFA code
                const mfaCode = prompt("Enter your MFA code:");
                if (mfaCode) {
                    await loginWithMfa(data.tempToken, mfaCode);
                } else {
                    alert("MFA code is required to complete login.");
                }
            } else if (response.ok) {
                // Successful login without MFA
                handleSuccessfulLogin(data.token);
            } else {
                throw new Error(data.error || "Invalid credentials.");
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert(`Login failed: ${error.message}`);
        }
    });

    // Function to handle MFA verification
    async function loginWithMfa(tempToken, mfaCode) {

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate inputs
        if (!username) {
            alert("Please enter your username.");
            return;
        }
        if (!password) {
            alert("Please enter your password.");
            return;
        }


        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tempToken}`,
                },
                body: JSON.stringify({ username, password, mfa_code: mfaCode, remember_me: rememberMe }),
            });

            const data = await response.json();

            if (response.ok) {
                handleSuccessfulLogin(data.token);
            } else {
                throw new Error(data.error || "MFA verification failed.");
            }
        } catch (error) {
            console.error("Error during MFA verification:", error);
            alert(`MFA verification failed: ${error.message}`);
        }
    }

    // Function to handle successful login
async function handleSuccessfulLogin(token) {
    const userId = parseJwt(token).id;

    try {
        // Encrypt the userId using the encryptData function
        const response = await fetch('http://localhost:3000/api/encrypt/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to encrypt user ID.');
        }

        const result = await response.json();
        const encryptedUserId = result.encryptedData;

        // Store the token and encrypted user ID in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', encryptedUserId);

        alert('Login successful!');
        window.location.href = '/home'; // Redirect to the dashboard
    } catch (error) {
        console.error('Error during encryption:', error);
        alert('Failed to encrypt user ID. Please try again.');
    }
}

// Helper function to parse JWT and extract payload
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Failed to parse token:", error);
        return {};
    }
}

});
