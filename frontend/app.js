const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'task_manager_jwt';
const CURRENT_USER_EMAIL = 'current_user_email';
const CURRENT_USER_ROLE = 'current_user_role';

// --- Utility Functions ---

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

/** Handles HTTP fetch requests, including token header and error handling. */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers: headers
    };

    // For POST/PUT/PATCH, set Content-Type and body
    if (data) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(data);
    }
    
    // Catch-all CORS error handler (only for the browser running locally)
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Handle no-content response (e.g., DELETE 204)
        if (response.status === 204) {
             return null;
        }

        const responseData = await response.json();

        if (!response.ok) {
            // Throw an error with the detailed message from the API
            const detail = responseData.detail || 'An unknown API error occurred.';
            throw new Error(detail);
        }
        return responseData;

    } catch (error) {
        // If the error is due to network/CORS, or the detailed error from the API
        const errorMessage = error.message.includes('Could not validate credentials') ? 
                             'Session expired or invalid. Please log in again.' : 
                             error.message;
        
        displayMessage('error', errorMessage);

        // Redirect to login on authentication failure (401/403)
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


// --- Main App Logic ---

// Check which page we are on
if (document.getElementById('login-form')) {
    // --- Index/Login Page Logic ---
    
    // Toggle between login and registration forms
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    });

    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });

    // Handle Registration Form Submission
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const user = await apiRequest('/auth/register', 'POST', { email, password });
            displayMessage('success', `User ${user.email} registered successfully! Please log in.`);
            // Automatically switch to login form
            document.getElementById('show-login').click(); 
        } catch (error) {
            // Error displayed by apiRequest function
        }
    });

    // Handle Login Form Submission
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // FastAPI's login endpoint expects form-data, so we must use URLSearchParams
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI uses 'username' for email
        formData.append('password', password);
        
        try {
            // Need a special fetch for form-data, bypassing the JSON helper
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                // Decode JWT to get the user's role (optional, but needed for dashboard role display)
                // Note: In a real app, you'd verify the signature on the server, but for the FE demo, we just extract the role.
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
    
    // Redirect if already logged in
    if (localStorage.getItem(TOKEN_KEY)) {
        window.location.href = 'dashboard.html';
    }


} else if (document.getElementById('create-task-form')) {
    // --- Dashboard Page Logic ---
    
    // Check for token on entering dashboard
    if (!localStorage.getItem(TOKEN_KEY)) {
        logoutUser();
        // return;
    }

    // Set user info on the dashboard header
    document.getElementById('user-email').textContent = localStorage.getItem(CURRENT_USER_EMAIL);
    document.getElementById('user-role').textContent = localStorage.getItem(CURRENT_USER_ROLE).toUpperCase();

    // Handle Logout
    document.getElementById('logout-btn').addEventListener('click', logoutUser);

    // Fetch and display tasks
    async function fetchTasks() {
        try {
            const tasks = await apiRequest('/v1/tasks');
            const tasksList = document.getElementById('tasks-list');
            tasksList.innerHTML = ''; // Clear existing tasks

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
            
            // Add listeners to newly created buttons
            tasksList.querySelectorAll('.delete-btn').forEach(btn => 
                btn.addEventListener('click', handleDeleteTask)
            );
            tasksList.querySelectorAll('.complete-btn').forEach(btn => 
                btn.addEventListener('click', handleToggleComplete)
            );


        } catch (error) {
            // Error message already displayed by apiRequest
        }
    }
    
    // Handle Create Task Form Submission
    document.getElementById('create-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;

        try {
            await apiRequest('/v1/tasks', 'POST', { title, description });
            displayMessage('success', 'Task created successfully!');
            document.getElementById('create-task-form').reset();
            fetchTasks(); // Refresh list
        } catch (error) {
            // Error message already displayed by apiRequest
        }
    });

    // Handle Task Deletion
    async function handleDeleteTask(e) {
        const taskId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this task? (Requires ADMIN role)')) {
            try {
                // DELETE request returns 204 No Content
                await apiRequest(`/v1/tasks/${taskId}`, 'DELETE');
                displayMessage('success', `Task ${taskId} deleted.`);
                fetchTasks(); // Refresh list
            } catch (error) {
                // Error message already displayed (e.g., 403 Forbidden for non-admin)
            }
        }
    }

    // Handle Task Toggle (Complete/Uncomplete)
    async function handleToggleComplete(e) {
        const taskId = e.target.getAttribute('data-id');
        const isCompleted = e.target.getAttribute('data-completed') === 'true';
        
        try {
            // PATCH request to update the 'is_completed' field
            await apiRequest(`/v1/tasks/${taskId}`, 'PATCH', { is_completed: !isCompleted });
            displayMessage('success', `Task ${taskId} updated.`);
            fetchTasks(); // Refresh list
        } catch (error) {
            // Error message already displayed
        }
    }

    // Initial load of tasks when entering the dashboard
    fetchTasks();
}