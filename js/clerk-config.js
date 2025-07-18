// Clerk configuration and initialization
import { Clerk } from '@clerk/clerk-js';

// Clerk configuration
const clerkConfig = {
  publishableKey: 'pk_test_bm9ybWFsLW9jZWxvdC01My5jbGVyay5hY2NvdW50cy5kZXYk',
  appearance: {
    theme: {
      primaryColor: '#4A90E2',
      primaryButtonColor: '#4A90E2',
    },
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      card: 'shadow-lg border border-gray-200',
      headerTitle: 'text-2xl font-bold text-gray-900',
      headerSubtitle: 'text-gray-600',
    }
  }
};

// Initialize Clerk
let clerk;
if (typeof window !== 'undefined') {
  clerk = new Clerk(clerkConfig.publishableKey);
  
  // Load Clerk
  clerk.load().then(() => {
    console.log('Clerk loaded successfully');
  }).catch((error) => {
    console.error('Error loading Clerk:', error);
  });
}

// Export Clerk instance
export { clerk };

// Utility functions for Clerk integration
export const ClerkUtils = {
  // Get current user
  getCurrentUser: () => {
    return clerk?.user || null;
  },

  // Check if user is signed in
  isSignedIn: () => {
    return clerk?.user !== null;
  },

  // Get user role from metadata
  getUserRole: () => {
    const user = clerk?.user;
    return user?.publicMetadata?.role || user?.privateMetadata?.role || 'student';
  },

  // Get user profile data
  getUserProfile: () => {
    const user = clerk?.user;
    if (!user) return null;

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.primaryPhoneNumber?.phoneNumber,
      role: ClerkUtils.getUserRole(),
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt
    };
  },

  // Sign out user
  signOut: async () => {
    try {
      await clerk?.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Open sign in modal
  openSignIn: () => {
    clerk?.openSignIn();
  },

  // Open sign up modal
  openSignUp: () => {
    clerk?.openSignUp();
  },

  // Open user profile modal
  openUserProfile: () => {
    clerk?.openUserProfile();
  },

  // Update user metadata
  updateUserMetadata: async (metadata) => {
    try {
      const user = clerk?.user;
      if (!user) throw new Error('No user signed in');
      
      await user.update({
        publicMetadata: { ...user.publicMetadata, ...metadata }
      });
    } catch (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
  }
};

// Authentication event listeners
if (typeof window !== 'undefined') {
  // Listen for authentication state changes
  const handleAuthChange = (user) => {
    if (user) {
      console.log('User signed in:', user);
      // Trigger custom event for auth state change
      window.dispatchEvent(new CustomEvent('clerkUserSignedIn', { detail: user }));
    } else {
      console.log('User signed out');
      window.dispatchEvent(new CustomEvent('clerkUserSignedOut'));
    }
  };

  // Set up auth state listener when Clerk loads
  if (clerk) {
    clerk.addListener(handleAuthChange);
  }
}

export default clerk;
