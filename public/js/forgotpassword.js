   document.addEventListener("DOMContentLoaded", function () {
        const form = document.querySelector(".user");
        const emailInput = document.querySelector("#exampleInputEmail");

        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent form from reloading the page

            const email = emailInput.value.trim();

            // Validate email
            if (!email) {
                alert("Please enter your email address.");
                return;
            }

            if (!validateEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            // Send forgot password request to the backend
            try {
                const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                });

                if (response.ok) {
                    alert("A password reset link has been sent to your email.");
                } else {
                    const data = await response.json();
                    alert(`Error: ${data.error || "An unexpected error occurred."}`);
                }
            } catch (error) {
                console.error("Error sending forgot password request:", error);
                alert("Failed to send the request. Please try again later.");
            }
        });

        // Utility function to validate email format
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
    });