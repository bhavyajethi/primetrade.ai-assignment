# 📌 Backend Developer (Intern) Assignment - Scalable REST API

This repository contains the solution for the Backend Developer Internship assignment, which required building a secure, scalable REST API with JWT authentication, Role-Based Access Control (RBAC), and a supportive frontend UI, delivered within a 3-day constraint.

---

## 🚀 Key Features and Deliverables

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

## 🛠️ Tech Stack

* **Backend:** Python 3.10+, FastAPI
* **Database:** MySQL (via SQLAlchemy)
* **Security:** JWT, Bcrypt
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Server:** Uvicorn (ASGI)

---

## ⚙️ Setup and Running Locally

Follow these steps to get the API and UI running on your local machine.

### 1. Prerequisites

* Python 3.10+
* **MySQL Server** running locally (default port 3306).
* The target database (`intern_assignment_db`) must be created in MySQL *before* running the application.

### 2. Get the Code

```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd assignment
