import authManager from './auth.js';
import { ClerkUtils } from './clerk-config.js';
import { Logger } from './logger.js';

// Initialize logger
const logger = new Logger('MainApp');

// Global variables
let loginModal, registerModal;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    logger.info('Application initialized');
    initializeApp();
});

function initializeApp() {
    // Initialize modals
    initializeModals();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize UI components
    initializeUIComponents();
    
    // Log application start
    logger.logSystemEvent('APPLICATION_STARTED', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    });
}

function initializeModals() {
    // Initialize Bootstrap modals (keeping for backward compatibility)
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
}

function initializeFormHandlers() {
    // Form handlers are now handled by Clerk
    logger.info('Form handlers initialized - using Clerk authentication');
}

function initializeUIComponents() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states to buttons
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.addEventListener('click', function() {
            if (this.form && this.form.checkValidity()) {
                this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
                this.disabled = true;
            }
        });
    });
}

// Handle role change in registration form
function handleRoleChange(event) {
    const role = event.target.value;
    const studentFields = document.getElementById('studentFields');
    const teacherFields = document.getElementById('teacherFields');
    
    // Hide all role-specific fields
    studentFields.classList.add('d-none');
    teacherFields.classList.add('d-none');
    
    // Show relevant fields based on role
    if (role === 'student') {
        studentFields.classList.remove('d-none');
        // Make student fields required
        document.getElementById('studentId').required = true;
        document.getElementById('program').required = true;
        // Make teacher fields optional
        document.getElementById('department').required = false;
        document.getElementById('subject').required = false;
    } else if (role === 'teacher') {
        teacherFields.classList.remove('d-none');
        // Make teacher fields required
        document.getElementById('department').required = true;
        document.getElementById('subject').required = true;
        // Make student fields optional
        document.getElementById('studentId').required = false;
        document.getElementById('program').required = false;
    }
    
    logger.logUserAction('ROLE_SELECTED', { role });
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email') || document.getElementById('loginEmail').value,
        password: formData.get('password') || document.getElementById('loginPassword').value,
        role: formData.get('role') || document.getElementById('loginRole').value
    };
    
    logger.logUserAction('LOGIN_ATTEMPT', { email: loginData.email, role: loginData.role });
    
    // Validate form data
    if (!loginData.email || !loginData.password || !loginData.role) {
        showNotification('Please fill in all fields', 'error');
        resetSubmitButton(event.target);
        return;
    }
    
    // Attempt login
    const result = await authManager.signIn(loginData.email, loginData.password, loginData.role);
    
    if (result.success) {
        loginModal.hide();
        logger.logUserAction('LOGIN_SUCCESS', { email: loginData.email, role: loginData.role });
    } else {
        logger.logUserAction('LOGIN_FAILED', { email: loginData.email, role: loginData.role, error: result.error });
    }
    
    resetSubmitButton(event.target);
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const registerData = {
        name: formData.get('name') || document.getElementById('registerName').value,
        email: formData.get('email') || document.getElementById('registerEmail').value,
        password: formData.get('password') || document.getElementById('registerPassword').value,
        role: formData.get('role') || document.getElementById('registerRole').value
    };
    
    // Add role-specific fields
    if (registerData.role === 'student') {
        registerData.studentId = document.getElementById('studentId').value;
        registerData.program = document.getElementById('program').value;
    } else if (registerData.role === 'teacher') {
        registerData.department = document.getElementById('department').value;
        registerData.subject = document.getElementById('subject').value;
    }
    
    logger.logUserAction('REGISTER_ATTEMPT', { email: registerData.email, role: registerData.role });
    
    // Validate form data
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.role) {
        showNotification('Please fill in all required fields', 'error');
        resetSubmitButton(event.target);
        return;
    }
    
    // Validate password strength
    if (registerData.password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        resetSubmitButton(event.target);
        return;
    }
    
    // Attempt registration
    const result = await authManager.register(registerData);
    
    if (result.success) {
        registerModal.hide();
        if (registerData.role === 'teacher') {
            showNotification('Registration successful! Your account is pending approval.', 'success');
        } else {
            showNotification('Registration successful! You can now log in.', 'success');
        }
        logger.logUserAction('REGISTER_SUCCESS', { email: registerData.email, role: registerData.role });
    } else {
        logger.logUserAction('REGISTER_FAILED', { email: registerData.email, role: registerData.role, error: result.error });
    }
    
    resetSubmitButton(event.target);
}

// Reset submit button state
function resetSubmitButton(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.getAttribute('data-original-text') || 'Submit';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    logger.logSystemEvent('NOTIFICATION_SHOWN', { message, type });
}

// Global functions for modal control
window.showLoginModal = function() {
    logger.logUserAction('LOGIN_MODAL_OPENED');
    ClerkUtils.openSignIn();
};

window.showRegisterModal = function() {
    logger.logUserAction('REGISTER_MODAL_OPENED');
    ClerkUtils.openSignUp();
};

// Global logout function
window.logout = async function() {
    const result = await authManager.signOut();
    if (result.success) {
        logger.logUserAction('LOGOUT_SUCCESS');
    }
};

// Performance monitoring
function monitorPerformance() {
    // Monitor page load time
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        logger.info('Page loaded', { loadTime: `${loadTime.toFixed(2)}ms` });
    });
    
    // Monitor navigation timing
    if (performance.navigation) {
        const navType = performance.navigation.type;
        const navTypes = {
            0: 'navigate',
            1: 'reload',
            2: 'back_forward'
        };
        
        logger.info('Navigation type', { type: navTypes[navType] || 'unknown' });
    }
}

// Initialize performance monitoring
monitorPerformance();

// Export functions for use in other modules
export {
    showNotification,
    logger
};
