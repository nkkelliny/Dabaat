document.addEventListener("DOMContentLoaded", async () => {
        const usernameElement = document.getElementById("username");
        const recentDebatesSection = document.querySelector("#your-debates .row");

        // Base API URL
        const API_BASE_URL = "http://localhost:3000/api";

        // Retrieve and display user details
        async function fetchUserDetails() {
            try {
                const response = await fetch(`${API_BASE_URL}/user/details`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming JWT is stored
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user details.");
                }

                const userData = await response.json();
                usernameElement.textContent = userData.username;
            } catch (error) {
                console.error("Error fetching user details:", error);
                alert("Failed to load user details. Please log in again.");
                window.location.href = "/login";
            }
        }

        // Retrieve and display recent debates
        async function fetchRecentDebates() {
            try {
                const response = await fetch(`${API_BASE_URL}/debates/recent`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch recent debates.");
                }

                const debates = await response.json();

                // Clear the existing debates
                recentDebatesSection.innerHTML = "";

                // Populate debates
                debates.forEach((debate) => {
                    const debateCard = `
                        <div class="col-lg-4 mb-5">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${debate.title}</h5>
                                    <p class="card-text">${debate.description}</p>
                                    <a href="/debates/${debate.id}" class="btn btn-warning">Continue Debate</a>
                                </div>
                            </div>
                        </div>
                    `;
                    recentDebatesSection.insertAdjacentHTML("beforeend", debateCard);
                });
            } catch (error) {
                console.error("Error fetching recent debates:", error);
                recentDebatesSection.innerHTML = "<p class='text-center'>Failed to load debates.</p>";
            }
        }

        // Logout functionality
        document.querySelector(".dropdown-item[href='/']").addEventListener("click", () => {
            localStorage.removeItem("token"); // Clear token
            window.location.href = "/login"; // Redirect to login
        });

        // Initialize the page by fetching user details and recent debates
        await fetchUserDetails();
        await fetchRecentDebates();
    });