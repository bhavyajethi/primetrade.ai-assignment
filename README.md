# Backend Developer (Intern) Assignment - Scalable REST API

This repository contains the solution for the Backend Developer Internship assignment, which required building a secure, scalable REST API with JWT authentication, Role-Based Access Control (RBAC), and a supportive frontend UI, delivered within a 3-day constraint.

---

## Key Features and Deliverables

| Requirement | Status | Implementation Details |
| :--- | :--- | :--- |
| **API Framework** | ✅ | **FastAPI** for high performance, built-in validation, and automatic documentation. |
| **Authentication** | ✅ | User Registration/Login using **JWT** and secure **Bcrypt** password hashing. |
| **Role-Based Access** | ✅ | RBAC implemented via JWT payload check (`User` vs. `Admin`) in `utils/auth.py`. |
| **CRUD APIs** | ✅ | CRUD operations for the **Task** entity implemented under the versioned prefix `/v1/tasks`. |
| **API Versioning** | ✅ | All core APIs are prefixed with `/v1/`. |
| **Validation/Error Handling** | ✅ | Native Pydantic models used for input sanitization and automatic validation. |
| **Database** | ✅ | **MySQL** persistence layer using **SQLAlchemy** ORM. |
| **Basic Frontend** | ✅ | Simple UI built with **Vanilla JS/HTML/CSS** to demonstrate all API features. |

---

## Tech Stack

* **Backend:** Python 3.10+, FastAPI
* **Database:** MySQL (via SQLAlchemy)
* **Security:** JWT, Bcrypt
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Server:** Uvicorn (ASGI)

---

## Setup and Running Locally

Follow these steps to get the API and UI running on your local machine.

### 1. Prerequisites

* Python 3.10+
* **MySQL Server** running locally (default port 3306).
* The target database (`intern_assignment_db`) must be created in MySQL *before* running the application.

### 2. Get the Code
* Clone the repository
* git clone <YOUR_REPOSITORY_URL>
* cd assignment

  
### 3. Backend Setup
#### 1) Create Virtual Environment & Install Dependencies
- python -m venv venv
- source venv/bin/activate # On Windows: venv\Scripts\activate
- pip install -r backend/requirements.txt


#### 2) Configure Environment Variables
- Navigate to the backend/ directory and copy the template file to create the necessary .env file:
- Open `backend/.env` and replace all placeholder values (DB credentials, SECRET_KEY) with your actual local configuration.

#### 3) Run the API Server
- The first run will automatically create the database tables and necessary user/admin roles.
- uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
- The API will now be live at http://localhost:8000.

---

### 4. Frontend Access

- The frontend is a static application and does not require a separate server.
- Open your file explorer and navigate to the frontend/ directory.
- Right-click on `index.html` and select "Open with" -> "Web Browser (Chrome/Firefox)".

---

## Security and RBAC Testing Guide

To fully test the security features:

**Standard User Test:**

- Register a user on the frontend (e.g., `user@test.com`).
- Log in and verify Role: **USER**.
- Test RBAC: Trying to DELETE a task will correctly return a 403 Forbidden error.

**Admin User Test:**

- Register a second user (e.g., `admin@test.com`).
- Manually promote this user in MySQL:
- UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = 'admin@test.com';
- Log in as the Admin user and verify Role: **ADMIN**.
- Test RBAC: The Admin user will successfully DELETE any task, confirming the role override.
