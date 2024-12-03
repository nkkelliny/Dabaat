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
                    body: JSON.stringify({ username: username, password }), // Use username as email for simplicity
                });

                if (response.ok) {
                    const data = await response.json();
                    alert("Login successful!");
                    localStorage.setItem("token", data.token); // Store the JWT token
                    window.location.href = "home.html"; // Redirect to the dashboard
                } else {
                    const errorData = await response.json();
                    alert(`Login failed: ${errorData.error || "Invalid credentials."}`);
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert("Failed to login. Please try again later.");
            }
        });
    });