document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:3000/api";

    const debatesContainer = document.getElementById("debates-container");
    const createDebateButton = document.getElementById("create-debate-button");
    const debateForm = document.getElementById("debate-form");
    const debateModalLabel = document.getElementById("debateModalLabel");
    const debateTitleInput = document.getElementById("debate-title");
    const debateCatInput = document.getElementById("debate-category");
    const debateDescriptionInput = document.getElementById("debate-description");
    const debateIdInput = document.getElementById("debate-id");
    const debateModal = new bootstrap.Modal(document.getElementById("debateModal"));

    // Fetch debates
    async function fetchDebates() {
        try {
            const response = await fetch(`${API_BASE_URL}/debates`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch debates.");

            const debates = await response.json();
            renderDebates(debates);
        } catch (error) {
            console.error("Error fetching debates:", error);
            debatesContainer.innerHTML = "<p class='text-muted'>Failed to load debates.</p>";
        }
    }

    // Render debates
    function renderDebates(debates) {
        debatesContainer.innerHTML = "";

        debates.forEach((debate) => {
            const debateCard = `
                <div class="col-lg-4 mb-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${debate.title}</h5>
                            <small class="card-text">${debate.category}</small>
                            <p class="card-text">${debate.description}</p>
                            <p class="text-muted">
                                Topic: ${debate.topic_title || "General"}<br>
                                Created by: ${debate.created_by_user || "Unknown"}
                            </p>
                            <button class="btn btn-warning btn-sm edit-debate" data-id="${debate.id}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-debate" data-id="${debate.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            debatesContainer.insertAdjacentHTML("beforeend", debateCard);
        });

        // Attach event listeners for Edit/Delete
        document.querySelectorAll(".edit-debate").forEach((button) =>
            button.addEventListener("click", handleEditDebate)
        );
        document.querySelectorAll(".delete-debate").forEach((button) =>
            button.addEventListener("click", handleDeleteDebate)
        );
    }

    // Handle create debate
    createDebateButton.addEventListener("click", () => {
        debateModalLabel.textContent = "Create Debate";
        debateTitleInput.value = "";
        debateCatInput.value = "";
        debateDescriptionInput.value = "";
        debateIdInput.value = "";
        debateModal.show();
    });

    // Handle edit debate
    function handleEditDebate(event) {
        const debateId = event.target.dataset.id;
        fetch(`${API_BASE_URL}/debates/${debateId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((debate) => {
                debateModalLabel.textContent = "Edit Debate";
                debateTitleInput.value = debate.title;
                debateCatInput.value = debate.category;
                debateDescriptionInput.value = debate.description;
                debateIdInput.value = debate.id;
                debateModal.show();
            })
            .catch((error) => {
                console.error("Error fetching debate:", error);
                alert("Failed to fetch debate details.");
            });
    }

    // Handle delete debate
    function handleDeleteDebate(event) {
        const debateId = event.target.dataset.id;
        if (!confirm("Are you sure you want to delete this debate?")) return;

        fetch(`${API_BASE_URL}/debates/${debateId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to delete debate.");
                alert("Debate deleted successfully.");
                fetchDebates();
            })
            .catch((error) => {
                console.error("Error deleting debate:", error);
                alert("Failed to delete debate.");
            });
    }

    // Handle debate form submission
    debateForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const debateData = {
            title: debateTitleInput.value.trim(),
            category: debateCatInput.value.trim(),
            description: debateDescriptionInput.value.trim(),
            created_by: localStorage.getItem("userId"), // Assuming userId is stored in localStorage
        };

        const debateId = debateIdInput.value;
        const method = debateId ? "PUT" : "POST";
        const endpoint = debateId
            ? `${API_BASE_URL}/debates/${debateId}`
            : `${API_BASE_URL}/debates`;

        fetch(endpoint, {
            method,
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(debateData),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to save debate.");
                alert("Debate saved successfully.");
                debateModal.hide();
                fetchDebates();
            })
            .catch((error) => {
                console.error("Error saving debate:", error);
                alert("Failed to save debate.");
            });
    });

    // Initialize page
    fetchDebates();
});
