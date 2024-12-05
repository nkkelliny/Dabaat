document.addEventListener("DOMContentLoaded", async () => {
            const API_BASE_URL = "http://localhost:3000/api";

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const accountForm = document.getElementById("account-form");

            const mfaEnabledSwitch = document.getElementById("mfa-enabled");
            const mfaSetupSection = document.getElementById("mfa-setup");
            const mfaQrCode = document.getElementById("mfa-qr-code");
            const mfaCodeInput = document.getElementById("mfa-code");
            const verifyMfaButton = document.getElementById("verify-mfa");

            // Fetch account settings
            async function fetchSettings() {
                try {
                    const response = await fetch(`${API_BASE_URL}/user/settings`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (!response.ok) throw new Error("Failed to fetch settings.");

                    const settings = await response.json();
                    emailInput.value = settings.email || "";
                    mfaEnabledSwitch.checked = settings.mfa_enabled;
                } catch (error) {
                    console.error("Error fetching settings:", error);
                    alert("Failed to load settings. Please try again later.");
                }
            }

            // Update account information
            accountForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                try {
                    const response = await fetch(`${API_BASE_URL}/user/settings`, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email, password }),
                    });

                    if (!response.ok) throw new Error("Failed to update account information.");

                    alert("Account information updated successfully.");
                } catch (error) {
                    console.error("Error updating account:", error);
                    alert("Failed to update account information. Please try again.");
                }
            });

            // Enable/Disable MFA
            mfaEnabledSwitch.addEventListener("change", async () => {
                const enabled = mfaEnabledSwitch.checked;

                if (enabled) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/user/mfa/setup`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        });

                        if (!response.ok) throw new Error("Failed to set up MFA.");

                        const { qr_code_url } = await response.json();
                        mfaQrCode.src = qr_code_url;
                        mfaSetupSection.style.display = "block";
                    } catch (error) {
                        console.error("Error enabling MFA:", error);
                        alert("Failed to enable MFA. Please try again.");
                    }
                } else {
                    mfaSetupSection.style.display = "none";
                }
            });

            // Verify MFA
            verifyMfaButton.addEventListener("click", async () => {
                const code = mfaCodeInput.value.trim();

                if (!code) {
                    return alert("Please enter the code from your authenticator app.");
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/user/mfa/verify`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ code }),
                    });

                    if (!response.ok) throw new Error("Failed to verify MFA.");

                    alert("MFA setup verified successfully.");
                    mfaSetupSection.style.display = "none";
                } catch (error) {
                    console.error("Error verifying MFA:", error);
                    alert("Failed to verify MFA. Please try again.");
                }
            });

            // Initialize settings page
            await fetchSettings();
        });