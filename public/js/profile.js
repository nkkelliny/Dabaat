document.addEventListener("DOMContentLoaded", async () => {
            const API_BASE_URL = "http://localhost:3000/api";

            const profilePictureElement = document.getElementById("profile-picture");
            const profileUsernameElement = document.getElementById("profile-username");
            const firstNameInput = document.getElementById("first-name");
            const lastNameInput = document.getElementById("last-name");
            const emailInput = document.getElementById("email");
            const profilePictureUpload = document.getElementById("profile-picture-upload");
            const profileForm = document.getElementById("profile-form");

            // Fetch user profile
            async function fetchUserProfile() {
                try {
                    const response = await fetch(`${API_BASE_URL}/user/profile`, {
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
                    profilePictureElement.src = profile.profile_picture || "assets/default-profile.png";
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    alert("Failed to load profile. Please log in again.");
                    window.location.href = "login.html";
                }
            }

            // Update user profile
            profileForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const formData = new FormData();
                formData.append("first_name", firstNameInput.value.trim());
                formData.append("last_name", lastNameInput.value.trim());
                formData.append("email", emailInput.value.trim());
                if (profilePictureUpload.files[0]) {
                    formData.append("profile_picture", profilePictureUpload.files[0]);
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/user/profile`, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: formData,
                    });

                    if (!response.ok) throw new Error("Failed to update profile.");

                    alert("Profile updated successfully!");
                    await fetchUserProfile(); // Reload updated profile
                } catch (error) {
                    console.error("Error updating profile:", error);
                    alert("Failed to update profile. Please try again.");
                }
            });

            // Initialize profile
            await fetchUserProfile();
        });