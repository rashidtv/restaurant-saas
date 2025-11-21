// Create a new utility file: frontend/src/utils/apiHelpers.js

export const validateApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

export const safeApiCall = async (apiCall, fallbackData = null, errorMessage = 'API call failed') => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error);
    
    if (fallbackData !== null) {
      console.log('🔄 Using fallback data');
      return fallbackData;
    }
    
    throw error;
  }
};

// Usage in your components:
const updateTableStatus = async (tableId, newStatus) => {
  return safeApiCall(
    async () => {
      const response = await fetch(`https://restaurant-saas-backend-hbdz.onrender.com/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      return validateApiResponse(response);
    },
    null, // No fallback data - throw error
    'Failed to update table status'
  );
};