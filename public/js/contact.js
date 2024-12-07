document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        // Validate fields
        if (!name || !email || !message) {
            alert("All fields are required.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/contact/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, message }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message.");
            }

            alert("Message sent successfully!");
            contactForm.reset();
        } catch (error) {
            console.error("Error:", error);
            alert("There was an error sending your message. Please try again later.");
        }
    });
});
