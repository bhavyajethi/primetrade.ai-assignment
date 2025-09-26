const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'task_manager_jwt';
const CURRENT_USER_EMAIL = 'current_user_email';
const CURRENT_USER_ROLE = 'current_user_role';

/** Displays a message (success or error) to the user. */
function displayMessage(type, content) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    messageEl.className = 'message ' + type;
    messageEl.textContent = content;
    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }, 5000);
}

/** Validates password strength */
function validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
    if (!/\d/.test(password)) return 'Password must include at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include at least one special character.';
    return null;
}

/** Handles HTTP fetch requests, including token header and error handling. */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const config = { method, headers };
    if (data) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (response.status === 204) return null;
        const responseData = await response.json();
        if (!response.ok) {
            const detail = responseData.detail || 'An unknown API error occurred.';
            throw new Error(detail);
        }
        return responseData;
    } catch (error) {
        const errorMessage = error.message.includes('Could not validate credentials')
            ? 'Session expired or invalid. Please log in again.'
            : error.message;
        displayMessage('error', errorMessage);
        if (errorMessage.includes('credentials') || errorMessage.includes('authorized')) {
            logoutUser();
        }
        throw error;
    }
}

/** Stores token and user info, then redirects to dashboard. */
function loginSuccess(token, email, role) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_EMAIL, email);
    localStorage.setItem(CURRENT_USER_ROLE, role);
    window.location.href = 'dashboard.html';
}

/** Clears stored data and redirects to login page. */
function logoutUser() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_EMAIL);
    localStorage.removeItem(CURRENT_USER_ROLE);
    window.location.href = 'index.html';
}

//  Main App Logic 

if (document.getElementById('login-form')) {
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    });
    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        // Validate password strength before sending
        const pwError = validatePassword(password);
        if (pwError) {
            displayMessage('error', pwError);
            return;
        }
        try {
            const user = await apiRequest('/auth/register', 'POST', { email, password });
            displayMessage('success', `User ${user.email} registered successfully! Please log in.`);
            document.getElementById('show-login').click();
        } catch (error) {
            // Show detailed error if backend sends one
            if (error.message) displayMessage('error', error.message);
            else displayMessage('error', 'Registration failed.');
        }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                const [, payloadBase64] = data.access_token.split('.');
                const payload = JSON.parse(atob(payloadBase64));
                const role = payload.role || 'user';
                loginSuccess(data.access_token, email, role);
            } else {
                const detail = data.detail || 'Login failed.';
                displayMessage('error', detail);
            }
        } catch (error) {
            displayMessage('error', 'Login failed. Check server connection.');
        }
    });

    if (localStorage.getItem(TOKEN_KEY)) {
        window.location.href = 'dashboard.html';
    }
} else if (document.getElementById('create-task-form')) {
    fetchTasks()
        .then(() => {
            document.getElementById('user-email').textContent = localStorage.getItem(CURRENT_USER_EMAIL);
            document.getElementById('user-role').textContent = localStorage.getItem(CURRENT_USER_ROLE).toUpperCase();

            document.getElementById('logout-btn').addEventListener('click', logoutUser);

            document.getElementById('create-task-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('task-title').value;
                const description = document.getElementById('task-description').value;
                try {
                    await apiRequest('/v1/tasks', 'POST', { title, description });
                    displayMessage('success', 'Task created successfully!');
                    document.getElementById('create-task-form').reset();
                    fetchTasks();
                } catch (error) {}
            });
        })
        .catch(() => {
            logoutUser();
        });

    async function fetchTasks() {
        const tasks = await apiRequest('/v1/tasks');
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.is_completed ? 'task-completed' : '';
            li.innerHTML = `
                <div>
                    <strong>${task.title}</strong> 
                    <span style="font-size:0.8em; color:#666;"> (ID: ${task.id})</span>
                    <p>${task.description || 'No description'}</p>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}" data-completed="${task.is_completed}">
                        ${task.is_completed ? 'Uncomplete' : 'Complete'}
                    </button>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                </div>
            `;
            tasksList.appendChild(li);
        });

        tasksList.querySelectorAll('.delete-btn').forEach((btn) =>
            btn.addEventListener('click', handleDeleteTask)
        );
        tasksList.querySelectorAll('.complete-btn').forEach((btn) =>
            btn.addEventListener('click', handleToggleComplete)
        );
    }

    async function handleDeleteTask(e) {
        const taskId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this task? (Requires ADMIN role)')) {
            try {
                await apiRequest(`/v1/tasks/${taskId}`, 'DELETE');
                displayMessage('success', `Task ${taskId} deleted.`);
                fetchTasks();
            } catch (error) {}
        }
    }

    async function handleToggleComplete(e) {
        const taskId = e.target.getAttribute('data-id');
        const isCompleted = e.target.getAttribute('data-completed') === 'true';
        try {
            await apiRequest(`/v1/tasks/${taskId}`, 'PATCH', { is_completed: !isCompleted });
            displayMessage('success', `Task ${taskId} updated.`);
            fetchTasks();
        } catch (error) {}
    }
}
