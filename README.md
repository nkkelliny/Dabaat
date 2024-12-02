<img src="https://github.com/Hubbzy/Dabaat/blob/main/public/assets/dabaat_logo.png" alt="Alt text" width="200" alt="Dabaat Logo">

Dabaat - Social Debating Platform
=================================

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg) ![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

Welcome to the official documentation of Dabaat, the platform for debating and sharing ideas!

Table of Contents
-----------------

*   [Description](#description)
*   [Features](#features)
*   [Installation](#installation)
*   [Usage](#usage)
*   [API Endpoints](#api)
*   [Technologies Used](#technologies)

Description
-----------

Dabaat is a social debating platform designed for people to engage in meaningful debates, share perspectives, and vote on the most compelling arguments. Whether you're discussing technology, politics, or lifestyle topics, Dabaat makes your voice heard.

Features
--------

*   User registration, login, and profile management.
*   Multi-factor authentication (MFA) for enhanced security.
*   Create, edit, and delete debates.
*   Participate in debates by commenting and voting.
*   Dynamic debate management for admins and users.
*   Responsive UI for seamless access on all devices.

Installation
------------

Follow these steps to set up the application locally:

1.  Clone the repository: `git clone https://github.com/username/dabaat.git`
2.  Navigate to the project directory: `cd dabaat`
3.  Install dependencies: `npm install`
4.  Set up the database and run the migration script (details in the backend folder).
5.  Create a `.env` file for environment variables (example provided in `.env.example`).
6.  Run the application: `npm start`
7.  Access the app at `http://localhost:3000`.

Usage
-----

Once installed, you can:

*   Sign up or log in to your account.
*   Navigate to **Manage Debates** to create, edit, or delete debates.
*   Participate in ongoing debates and share your opinions.
*   Enable MFA and update your account information in the **Settings** page.

API Endpoints
-------------

Below are some of the key API endpoints:

*   **GET /api/auth/login:** Login a user.
*   **POST /api/auth/register:** Register a new user.
*   **GET /api/user/profile:** Fetch user profile details.
*   **PUT /api/user/profile:** Update user profile details.
*   **GET /api/debates:** Fetch all debates created by the user.
*   **POST /api/debates:** Create a new debate.
*   **PUT /api/debates/:id:** Edit an existing debate.
*   **DELETE /api/debates/:id:** Delete a debate.

Technologies Used
-----------------

*   **Frontend:** HTML5, CSS3, JavaScript, Bootstrap
*   **Backend:** Node.js, Express.js
*   **Database:** MySQL
*   **Authentication:** JWT, Multi-factor authentication
*   **Deployment:** Compatible with Heroku, AWS, or any Node.js hosting platform