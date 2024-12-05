document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".user");
    const usernameInput = document.querySelector("#exampleInputUsername");
    const passwordInput = document.querySelector("#exampleInputPassword");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent form from reloading the page

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

        // Send login request to the backend
        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();

                // Save token and user ID to localStorage
                const { token } = data;
                const userId = parseJwt(token).id;

                localStorage.setItem("token", token);
                localStorage.setItem("userId", userId);

                alert("Login successful!");
                window.location.href = "/home"; // Redirect to the dashboard
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error || "Invalid credentials."}`);
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("Failed to login. Please try again later.");
        }
    });

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
