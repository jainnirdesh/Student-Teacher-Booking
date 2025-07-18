// Authentication Manager for Student-Teacher Booking System
// Uses Clerk for authentication

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
                    if (window.clerk?.loaded) {
                        resolve();
                    } else {
                        setTimeout(checkClerk, 100);
                    }
                };
                checkClerk();
            });

            const user = window.ClerkUtils?.getCurrentUser();
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
            window.ClerkUtils?.openSignUp();

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
            window.ClerkUtils?.openSignIn();

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

            await window.ClerkUtils?.signOut();

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
            const user = window.ClerkUtils?.getCurrentUser();
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

            // Save to Firestore using Firebase v9 syntax
            if (window.firebase && window.db) {
                const docRef = window.firebase.firestore.doc(window.db, 'users', user.id);
                await window.firebase.firestore.setDoc(docRef, userProfile);
            }

            // Update Clerk user metadata
            await window.ClerkUtils?.updateUserMetadata({ 
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

    // Load user profile from Firestore
    async loadUserProfile() {
        try {
            const user = window.ClerkUtils?.getCurrentUser();
            if (!user) return null;

            // Try to get user profile from Firestore
            if (window.firebase && window.db) {
                const docRef = window.firebase.firestore.doc(window.db, 'users', user.id);
                const docSnap = await window.firebase.firestore.getDoc(docRef);
                
                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    this.userRole = profileData.role;
                    return profileData;
                }
            }

            // Fallback to Clerk data
            this.userRole = window.ClerkUtils?.getUserRole();
            return window.ClerkUtils?.getUserProfile();

        } catch (error) {
            this.logger.error('Error loading user profile', error);
            // Fallback to Clerk data
            this.userRole = window.ClerkUtils?.getUserRole();
            return window.ClerkUtils?.getUserProfile();
        }
    }

    // Redirect to appropriate dashboard based on user role
    redirectToDashboard() {
        const role = this.userRole || window.ClerkUtils?.getUserRole();
        
        switch (role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher-dashboard.html';
                break;
            case 'student':
            default:
                window.location.href = 'student-dashboard.html';
                break;
        }
    }

    // Redirect to login page
    redirectToLogin() {
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }

    // Show loading indicator
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('d-none');
        }
    }

    // Hide loading indicator
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('d-none');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // You can implement a toast notification system here
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Simple alert for now
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else if (type === 'success') {
            alert(`Success: ${message}`);
        }
    }

    // Get error message from error object
    getErrorMessage(error) {
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    return 'No user found with this email address.';
                case 'auth/wrong-password':
                    return 'Incorrect password.';
                case 'auth/email-already-in-use':
                    return 'An account with this email already exists.';
                case 'auth/weak-password':
                    return 'Password should be at least 6 characters.';
                case 'auth/invalid-email':
                    return 'Invalid email address.';
                default:
                    return error.message || 'An error occurred.';
            }
        }
        return error.message || 'An unexpected error occurred.';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser || window.ClerkUtils?.getCurrentUser();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    // Get user role
    getUserRole() {
        return this.userRole || window.ClerkUtils?.getUserRole();
    }
}

// Create global auth manager instance
if (typeof window !== 'undefined') {
    window.authManager = new AuthManager();
}

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
