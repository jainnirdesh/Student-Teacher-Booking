// Clerk configuration and initialization
// Remove ES6 import since we're loading Clerk from CDN

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
if (typeof window !== 'undefined' && window.Clerk) {
  clerk = new window.Clerk(clerkConfig.publishableKey);
  
  // Load Clerk
  clerk.load().then(() => {
    console.log('Clerk loaded successfully');
    // Make clerk available globally
    window.clerk = clerk;
  }).catch((error) => {
    console.error('Error loading Clerk:', error);
  });
} else {
  console.warn('Clerk not available on window object');
}

// Export Clerk instance (make it globally available)
if (typeof window !== 'undefined') {
  window.clerk = clerk;
}

// Utility functions for Clerk integration
const ClerkUtils = {
  // Get current user
  getCurrentUser: () => {
    return window.clerk?.user || null;
  },

  // Check if user is signed in
  isSignedIn: () => {
    return window.clerk?.user !== null;
  },

  // Get user role from metadata
  getUserRole: () => {
    const user = window.clerk?.user;
    return user?.publicMetadata?.role || user?.privateMetadata?.role || 'student';
  },
    const user = clerk?.user;
    return user?.publicMetadata?.role || user?.privateMetadata?.role || 'student';
  },

  // Get user profile data
  getUserProfile: () => {
    const user = window.clerk?.user;
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
      await window.clerk?.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Open sign in modal
  openSignIn: () => {
    window.clerk?.openSignIn();
  },

  // Open sign up modal
  openSignUp: () => {
    window.clerk?.openSignUp();
  },

  // Open user profile modal
  openUserProfile: () => {
    window.clerk?.openUserProfile();
  },

  // Update user metadata
  updateUserMetadata: async (metadata) => {
    try {
      const user = window.clerk?.user;
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

// Make ClerkUtils available globally
if (typeof window !== 'undefined') {
  window.ClerkUtils = ClerkUtils;
}

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
  setTimeout(() => {
    if (window.clerk) {
      window.clerk.addListener(handleAuthChange);
    }
  }, 1000);
}
