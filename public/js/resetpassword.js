document.addEventListener("DOMContentLoaded", function () {
        const form = document.querySelector(".user");
        const passwordInput = document.querySelector("#exampleInputPassword");
        const confirmPasswordInput = document.querySelector("#exampleInputConfirm\\ Password");

        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent form from reloading the page

            const urlParams = new URLSearchParams(window.location.search);
            const resetToken = urlParams.get("token"); // Extract token from query params

            const newPassword = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // Validate passwords
            if (!newPassword || !confirmPassword) {
                alert("Please fill in all password fields.");
                return;
            }
            if (newPassword !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            // Send reset password request to the backend
            try {
                const response = await fetch("http://localhost:3000/api/auth/resetpassword", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: resetToken, newPassword }),
                });

                if (response.ok) {
                    alert("Password reset successfully!");
                    window.location.href = "/login"; // Redirect to login page
                } else {
                    const data = await response.json();
                    alert(`Error: ${data.error || "An unexpected error occurred."}`);
                }
            } catch (error) {
                console.error("Error during password reset:", error);
                alert("Failed to reset password. Please try again later.");
            }
        });
    });