// Local Storage Authentication System
// Uses localStorage for user authentication and session management

class LocalAuthManager {
    constructor() {
        this.storageKey = 'edubook_auth';
        this.usersKey = 'edubook_users';
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('LocalAuthManager initialized');
        this.loadCurrentUser();
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const authData = localStorage.getItem(this.storageKey);
        if (authData) {
            try {
                this.currentUser = JSON.parse(authData);
                console.log('Current user loaded from localStorage:', this.currentUser);
            } catch (error) {
                console.error('Error loading user from localStorage:', error);
                localStorage.removeItem(this.storageKey);
            }
        }
    }

    // Save current user to localStorage
    saveCurrentUser(user) {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        this.currentUser = user;
    }

    // Get all users from localStorage
    getUsers() {
        const users = localStorage.getItem(this.usersKey);
        return users ? JSON.parse(users) : [];
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    // Register a new user
    register(userData) {
        const { email, password, firstName, lastName, role } = userData;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role) {
            return { success: false, error: 'All fields are required' };
        }

        // Check if user already exists
        const users = this.getUsers();
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return { success: false, error: 'User already exists with this email' };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            email,
            password: btoa(password), // Simple base64 encoding (not secure for production)
            firstName,
            lastName,
            role,
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };

        // Save user
        users.push(newUser);
        this.saveUsers(users);

        // Auto-login after registration
        const userForAuth = { ...newUser };
        delete userForAuth.password;
        this.saveCurrentUser(userForAuth);

        console.log('User registered successfully:', newUser.email);
        return { success: true, user: userForAuth };
    }

    // Login user
    login(email, password) {
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check password (decode base64)
        const decodedPassword = atob(user.password);
        if (decodedPassword !== password) {
            return { success: false, error: 'Invalid password' };
        }

        // Update last login
        user.lastLoginAt = new Date().toISOString();
        this.saveUsers(users);

        // Save current user (without password)
        const userForAuth = { ...user };
        delete userForAuth.password;
        this.saveCurrentUser(userForAuth);

        console.log('User logged in successfully:', user.email);
        return { success: true, user: userForAuth };
    }

    // Logout user
    logout() {
        localStorage.removeItem(this.storageKey);
        this.currentUser = null;
        console.log('User logged out');
        return { success: true };
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user role
    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    // Update user profile
    updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, error: 'No user logged in' };
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        // Update user data
        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);

        // Update current user
        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;
        this.saveCurrentUser(updatedUser);

        console.log('Profile updated successfully');
        return { success: true, user: updatedUser };
    }

    // Update current user directly
    updateCurrentUser(updatedData) {
        if (!this.currentUser) {
            return { success: false, error: 'No user logged in' };
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updatedData };
            this.saveUsers(users);
        }

        // Update current user in session
        const updatedUser = { ...this.currentUser, ...updatedData };
        this.saveCurrentUser(updatedUser);
        this.currentUser = updatedUser;

        return { success: true, user: updatedUser };
    }

    // Show login modal
    showLoginModal() {
        const modal = this.createLoginModal();
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // Show register modal
    showRegisterModal() {
        const modal = this.createRegisterModal();
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // Create login modal
    createLoginModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; position: relative;">
                <button class="modal-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; line-height: 1;">&times;</button>
                <h2 style="margin-top: 0;">Login</h2>
                <form id="loginForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Email:</label>
                        <input type="email" id="loginEmail" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Password:</label>
                        <input type="password" id="loginPassword" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Login</button>
                        <button type="button" class="cancel-btn" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                </form>
                <div id="loginError" style="color: red; margin-top: 1rem; display: none;"></div>
            </div>
        `;

        // Handle close button click
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Handle cancel button click
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Handle click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Handle ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Handle form submission
        modal.querySelector('#loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = modal.querySelector('#loginEmail').value;
            const password = modal.querySelector('#loginPassword').value;
            
            const result = this.login(email, password);
            if (result.success) {
                modal.remove();
                this.redirectToDashboard();
            } else {
                const errorDiv = modal.querySelector('#loginError');
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
            }
        });

        return modal;
    }

    // Create register modal
    createRegisterModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; position: relative;">
                <button class="modal-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; line-height: 1;">&times;</button>
                <h2 style="margin-top: 0;">Register</h2>
                <form id="registerForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">First Name:</label>
                        <input type="text" id="regFirstName" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Last Name:</label>
                        <input type="text" id="regLastName" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Email:</label>
                        <input type="email" id="regEmail" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Password:</label>
                        <input type="password" id="regPassword" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Role:</label>
                        <select id="regRole" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Select Role</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Register</button>
                        <button type="button" class="cancel-btn" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                </form>
                <div id="registerError" style="color: red; margin-top: 1rem; display: none;"></div>
            </div>
        `;

        // Handle close button click
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Handle cancel button click
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Handle click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Handle ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Handle form submission
        modal.querySelector('#registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                firstName: modal.querySelector('#regFirstName').value,
                lastName: modal.querySelector('#regLastName').value,
                email: modal.querySelector('#regEmail').value,
                password: modal.querySelector('#regPassword').value,
                role: modal.querySelector('#regRole').value
            };
            
            const result = this.register(formData);
            if (result.success) {
                modal.remove();
                this.redirectToDashboard();
            } else {
                const errorDiv = modal.querySelector('#registerError');
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
            }
        });

        return modal;
    }

    // Redirect to appropriate dashboard
    redirectToDashboard() {
        if (!this.currentUser) return;
        
        const role = this.currentUser.role;
        let redirectUrl = 'index.html';
        
        switch (role) {
            case 'student':
                redirectUrl = 'student-dashboard.html';
                break;
            case 'teacher':
                redirectUrl = 'teacher-dashboard.html';
                break;
            case 'admin':
                redirectUrl = 'admin-dashboard.html';
                break;
        }
        
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
    }
}

// Create global instance
const localAuthManager = new LocalAuthManager();

// Make available globally
if (typeof window !== 'undefined') {
    window.LocalAuthManager = LocalAuthManager;
    window.localAuthManager = localAuthManager;
    console.log('LocalAuthManager available globally');
}
