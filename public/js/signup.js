document.addEventListener("DOMContentLoaded", function () {
        const form = document.querySelector(".user");
        const firstNameInput = document.querySelector("#exampleFirstName");
        const lastNameInput = document.querySelector("#exampleLastName");
        const dobInput = document.querySelector("#exampleDob");
        const usernameInput = document.querySelector("#exampleInputUsername");
        const emailInput = document.querySelector("#exampleInputEmail");
        const passwordInput = document.querySelector("#exampleInputPassword");
        const confirmPasswordInput = document.querySelector("#exampleRepeatPassword");
        const termsCheckbox = document.querySelector("#customCheck");

        const MIN_AGE = 13;

        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent form submission

            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const dateOfBirth = dobInput.value;
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // Validate all inputs
            if (!firstName || !lastName || !dateOfBirth || !username || !email || !password || !confirmPassword) {
                alert("Please fill in all fields.");
                return;
            }

            // Age validation
            const userAge = calculateAge(new Date(dateOfBirth));
            if (userAge < MIN_AGE) {
                alert("You must be at least 13 years old to create an account.");
                return;
            }

            // Validate unique username and email
            if (!(await isUnique("username", username))) {
                alert("Username is already taken. Please choose a different one.");
                return;
            }
            if (!(await isUnique("email", email))) {
                alert("Email is already registered. Please use a different email.");
                return;
            }

            // Password validation
            if (!validatePassword(password)) {
                alert(
                    "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character."
                );
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            if (!termsCheckbox.checked) {
                alert("You must agree to the Terms of Service and Privacy Policy.");
                return;
            }

            // Send signup request to the backend
            try {
                const response = await fetch("http://localhost:3000/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        first_name: firstName,
                        last_name: lastName,
                        date_of_birth: dateOfBirth,
                    }),
                });

                if (response.ok) {
                    alert("Account created successfully! Redirecting to login...");
                    window.location.href = "login.html"; // Redirect to login page
                } else {
                    const data = await response.json();
                    alert(`Error: ${data.error || "An unexpected error occurred."}`);
                }
            } catch (error) {
                console.error("Error during signup:", error);
                alert("Failed to create an account. Please try again later.");
            }
        });

        // Utility function to validate password strength
        function validatePassword(password) {
            const passwordRegex =
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            return passwordRegex.test(password);
        }

        // Utility function to calculate age from date of birth
        function calculateAge(dob) {
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                return age - 1;
            }
            return age;
        }

        // Utility function to check if username/email is unique
        async function isUnique(field, value) {
            try {
                const response = await fetch(
                    `http://localhost:3000/api/auth/validate?field=${field}&value=${value}`
                );
                const data = await response.json();
                return data.isUnique;
            } catch (error) {
                console.error("Error validating uniqueness:", error);
                return false;
            }
        }
    });