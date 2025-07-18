import { clerk, ClerkUtils } from './clerk-config.js';
import { db } from './firebase-config.js';
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
        // Listen for Clerk authentication state changes
        if (typeof window !== 'undefined') {
            window.addEventListener('clerkUserSignedIn', async (event) => {
                const user = event.detail;
                this.currentUser = user;
                await this.loadUserProfile();
                this.redirectToDashboard();
                this.logger.info('User authenticated', { userId: user.id });
            });

            window.addEventListener('clerkUserSignedOut', () => {
                this.currentUser = null;
                this.userRole = null;
                this.redirectToLogin();
                this.logger.info('User signed out');
            });

            // Check initial auth state
            this.checkInitialAuthState();
        }
    }

    // Check initial authentication state
    async checkInitialAuthState() {
        try {
            // Wait for Clerk to load
            await new Promise(resolve => {
                const checkClerk = () => {
                    if (clerk?.loaded) {
                        resolve();
                    } else {
                        setTimeout(checkClerk, 100);
                    }
                };
                checkClerk();
            });

            const user = ClerkUtils.getCurrentUser();
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                this.redirectToDashboard();
            }
        } catch (error) {
            this.logger.error('Error checking initial auth state', error);
        }
    }

    // Register new user - now handled by Clerk UI
    async register(userData) {
        try {
            this.showLoading();
            this.logger.info('Attempting user registration', { email: userData.email, role: userData.role });

            // Open Clerk sign up modal
            ClerkUtils.openSignUp();

            // Note: Actual registration is handled by Clerk
            // We'll create the user profile after successful registration
            return {
                success: true,
                message: 'Please complete registration in the sign-up modal'
            };

        } catch (error) {
            this.logger.error('Registration error', error);
            return {
                success: false,
                message: this.getErrorMessage(error)
            };
        } finally {
            this.hideLoading();
        }
    }

    // Login user - now handled by Clerk UI
    async login(credentials) {
        try {
            this.showLoading();
            this.logger.info('Attempting user login', { email: credentials.email });

            // Open Clerk sign in modal
            ClerkUtils.openSignIn();

            return {
                success: true,
                message: 'Please complete login in the sign-in modal'
            };

        } catch (error) {
            this.logger.error('Login error', error);
            return {
                success: false,
                message: this.getErrorMessage(error)
            };
        } finally {
            this.hideLoading();
        }
    }

    // Logout user
    async logout() {
        try {
            this.showLoading();
            this.logger.info('User logout initiated');

            await ClerkUtils.signOut();

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            this.logger.error('Logout error', error);
            return {
                success: false,
                message: this.getErrorMessage(error)
            };
        } finally {
            this.hideLoading();
        }
    }

    // Create user profile after successful registration
    async createUserProfile(userData) {
        try {
            const user = ClerkUtils.getCurrentUser();
            if (!user) throw new Error('No authenticated user');

            const userProfile = {
                uid: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                name: userData.name || user.fullName,
                role: userData.role || 'student',
                phone: userData.phone || user.primaryPhoneNumber?.phoneNumber,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                ...userData
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', user.id), userProfile);

            // Update Clerk user metadata
            await ClerkUtils.updateUserMetadata({ 
                role: userData.role,
                profileCreated: true 
            });

            this.logger.info('User profile created', { userId: user.id, role: userData.role });
            return userProfile;

        } catch (error) {
            this.logger.error('Error creating user profile', error);
            throw error;
        }
    }

    // Load user profile from database
    async loadUserProfile() {
        try {
            const user = ClerkUtils.getCurrentUser();
            if (!user) return null;

            // Try to get profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.id));
            
            if (userDoc.exists()) {
                const profile = userDoc.data();
                this.userRole = profile.role;
                this.logger.info('User profile loaded', { userId: user.id, role: profile.role });
                return profile;
            } else {
                // If no profile exists, create a default one
                const role = ClerkUtils.getUserRole();
                const defaultProfile = {
                    uid: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName,
                    role: role,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true
                };
                
                await this.createUserProfile(defaultProfile);
                this.userRole = role;
                return defaultProfile;
            }

        } catch (error) {
            this.logger.error('Error loading user profile', error);
            return null;
        }
    }

    // Get current user
    getCurrentUser() {
        return ClerkUtils.getCurrentUser();
    }

    // Get user role
    getUserRole() {
        return this.userRole || ClerkUtils.getUserRole();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return ClerkUtils.isSignedIn();
    }

    // Password reset - handled by Clerk
    async resetPassword(email) {
        try {
            // Clerk handles password reset through their UI
            ClerkUtils.openSignIn();
            
            this.logger.info('Password reset initiated', { email });
            return {
                success: true,
                message: 'Password reset can be initiated from the sign-in modal'
            };

        } catch (error) {
            this.logger.error('Password reset error', error);
            return {
                success: false,
                message: this.getErrorMessage(error)
            };
        }
    }

    // Log user activity
    async logActivity(action, details = {}) {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            const logEntry = {
                userId: user.id,
                action: action,
                details: details,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                ip: 'client-side', // Would need server-side for real IP
                sessionId: this.generateSessionId()
            };

            await addDoc(collection(db, 'userActivityLogs'), logEntry);
            this.logger.info('User activity logged', logEntry);

        } catch (error) {
            this.logger.error('Error logging user activity', error);
        }
    }

    // Generate session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Redirect to appropriate dashboard based on role
    redirectToDashboard() {
        if (this.isOnLoginPage()) {
            const role = this.getUserRole();
            const dashboardUrls = {
                'student': 'student-dashboard.html',
                'teacher': 'teacher-dashboard.html',
                'admin': 'admin-dashboard.html'
            };

            const targetUrl = dashboardUrls[role] || 'student-dashboard.html';
            window.location.href = targetUrl;
        }
    }

    // Redirect to login page if not authenticated
    redirectToLogin() {
        if (!this.isOnLoginPage() && !this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }

    // Check if currently on login page
    isOnLoginPage() {
        const currentPage = window.location.pathname.split('/').pop();
        return currentPage === 'index.html' || currentPage === '';
    }

    // Show loading indicator
    showLoading() {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    // Hide loading indicator
    hideLoading() {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // Get user-friendly error message
    getErrorMessage(error) {
        const errorMessages = {
            'clerk_error': 'Authentication service error. Please try again.',
            'network_error': 'Network error. Please check your connection.',
            'default': 'An error occurred. Please try again.'
        };

        return errorMessages[error.code] || errorMessages.default;
    }

    // Update user profile
    async updateProfile(updates) {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('No authenticated user');

            // Update in Firestore
            await updateDoc(doc(db, 'users', user.id), {
                ...updates,
                updatedAt: new Date()
            });

            // Update Clerk metadata if role changed
            if (updates.role) {
                await ClerkUtils.updateUserMetadata({ role: updates.role });
                this.userRole = updates.role;
            }

            this.logger.info('User profile updated', { userId: user.id, updates });
            return { success: true };

        } catch (error) {
            this.logger.error('Error updating profile', error);
            throw error;
        }
    }

    // Check permissions for role-based access
    hasPermission(requiredRole) {
        const userRole = this.getUserRole();
        const roleHierarchy = {
            'admin': 3,
            'teacher': 2,
            'student': 1
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    // Initialize authentication on page load
    init() {
        this.checkInitialAuthState();
        this.logger.info('AuthManager initialized');
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;
