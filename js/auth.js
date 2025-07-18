import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail 
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    updateDoc 
} from 'firebase/firestore';
import { Logger } from './logger.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.logger = new Logger('AuthManager');
        this.initAuthStateListener();
    }

    // Initialize authentication state listener
    initAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                this.redirectToDashboard();
                this.logger.info('User authenticated', { userId: user.uid });
            } else {
                this.currentUser = null;
                this.userRole = null;
                this.redirectToLogin();
                this.logger.info('User signed out');
            }
        });
    }

    // Register new user
    async register(userData) {
        try {
            this.showLoading();
            this.logger.info('Attempting user registration', { email: userData.email, role: userData.role });

            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );

            const user = userCredential.user;

            // Create user profile document
            const userProfile = {
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                createdAt: new Date(),
                isApproved: userData.role === 'student' ? true : false, // Students auto-approved, teachers need approval
                isActive: true
            };

            // Add role-specific fields
            if (userData.role === 'student') {
                userProfile.studentId = userData.studentId;
                userProfile.program = userData.program;
            } else if (userData.role === 'teacher') {
                userProfile.department = userData.department;
                userProfile.subject = userData.subject;
                userProfile.availableSlots = [];
            }

            // Save user profile to Firestore
            await setDoc(doc(db, 'users', user.uid), userProfile);

            // Log registration activity
            await this.logActivity('USER_REGISTERED', {
                userId: user.uid,
                role: userData.role,
                email: userData.email
            });

            this.hideLoading();
            this.showNotification('Registration successful!', 'success');
            this.logger.info('User registration successful', { userId: user.uid });

            return { success: true, user: userCredential.user };
        } catch (error) {
            this.hideLoading();
            this.handleAuthError(error);
            this.logger.error('Registration failed', error);
            return { success: false, error: error.message };
        }
    }

    // Sign in user
    async signIn(email, password, role) {
        try {
            this.showLoading();
            this.logger.info('Attempting user sign in', { email, role });

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Verify user role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                throw new Error('User profile not found');
            }

            const userData = userDoc.data();
            if (userData.role !== role) {
                await signOut(auth);
                throw new Error('Invalid role selected');
            }

            if (!userData.isApproved) {
                await signOut(auth);
                throw new Error('Account pending approval');
            }

            if (!userData.isActive) {
                await signOut(auth);
                throw new Error('Account has been deactivated');
            }

            // Log sign in activity
            await this.logActivity('USER_SIGNED_IN', {
                userId: user.uid,
                role: userData.role
            });

            this.hideLoading();
            this.showNotification('Sign in successful!', 'success');
            this.logger.info('User sign in successful', { userId: user.uid });

            return { success: true, user: userCredential.user };
        } catch (error) {
            this.hideLoading();
            this.handleAuthError(error);
            this.logger.error('Sign in failed', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out user
    async signOut() {
        try {
            if (this.currentUser) {
                await this.logActivity('USER_SIGNED_OUT', {
                    userId: this.currentUser.uid
                });
            }

            await signOut(auth);
            this.showNotification('Signed out successfully!', 'info');
            this.logger.info('User signed out');
            return { success: true };
        } catch (error) {
            this.handleAuthError(error);
            this.logger.error('Sign out failed', error);
            return { success: false, error: error.message };
        }
    }

    // Load user profile data
    async loadUserProfile() {
        try {
            if (!this.currentUser) return null;

            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.userRole = userData.role;
                return userData;
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to load user profile', error);
            return null;
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            this.showNotification('Password reset email sent!', 'info');
            this.logger.info('Password reset email sent', { email });
            return { success: true };
        } catch (error) {
            this.handleAuthError(error);
            this.logger.error('Password reset failed', error);
            return { success: false, error: error.message };
        }
    }

    // Log user activity
    async logActivity(action, details = {}) {
        try {
            await addDoc(collection(db, 'activityLogs'), {
                action,
                details,
                timestamp: new Date(),
                userId: this.currentUser?.uid || 'anonymous',
                userEmail: this.currentUser?.email || 'unknown'
            });
        } catch (error) {
            this.logger.error('Failed to log activity', error);
        }
    }

    // Handle authentication errors
    handleAuthError(error) {
        let message = 'An error occurred';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'Email already in use';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak';
                break;
            case 'auth/user-not-found':
                message = 'User not found';
                break;
            case 'auth/wrong-password':
                message = 'Invalid password';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address';
                break;
            case 'auth/user-disabled':
                message = 'Account has been disabled';
                break;
            default:
                message = error.message;
        }
        
        this.showNotification(message, 'error');
    }

    // Redirect to dashboard based on role
    redirectToDashboard() {
        if (!this.userRole) return;

        const currentPath = window.location.pathname;
        const dashboardPaths = ['/admin-dashboard.html', '/teacher-dashboard.html', '/student-dashboard.html'];
        
        if (!dashboardPaths.includes(currentPath)) {
            switch (this.userRole) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'teacher':
                    window.location.href = 'teacher-dashboard.html';
                    break;
                case 'student':
                    window.location.href = 'student-dashboard.html';
                    break;
            }
        }
    }

    // Redirect to login page
    redirectToLogin() {
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/index.html') {
            window.location.href = 'index.html';
        }
    }

    // Show loading overlay
    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('d-none');
    }

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('d-none');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user role
    getUserRole() {
        return this.userRole;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userRole === role;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();
export default authManager;
