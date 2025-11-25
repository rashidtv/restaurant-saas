export const SessionUtils = {
  // Validate session on app start
  initializeSession: async () => {
    try {
      // Check if we have a session cookie
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/customers/me`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.status === 401) {
        // Session expired or invalid
        console.log('Session initialization: No valid session found');
        this.clearSession();
        return null;
      }
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.customer) {
          console.log('Session initialization: Valid session found');
          return result.customer;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Session initialization failed:', error);
      return null;
    }
  },

  // Clear session data
  clearSession: () => {
    // Clear any local storage if used
    localStorage.removeItem('customerSession');
    sessionStorage.removeItem('customerSession');
  },

  // Session health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/health`, {
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};