/**
 * Configuration for API endpoint
 * Automatically detects environment and sets appropriate backend URL
 */

const getBackendURL = () => {
    // If window variable is set (from Vercel environment)
    if (window.__API_URL__) {
        return window.__API_URL__;
    }
    
    // If localStorage has saved URL (for testing)
    const saved = localStorage.getItem('WATERMARK_API_URL');
    if (saved) {
        return saved;
    }
    
    // In production: use the deployed backend URL
    // In development: use local URL
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    
    // Default production: Change this to your Render backend URL once deployed
    // Format: https://watermark-api.onrender.com
    return 'https://justremove-api-ibu3.onrender.com';
};

const API_URL = getBackendURL();

// For debugging - remove in production
console.log('JustRemove using backend:', API_URL);

// Export for use in script.js
const CONFIG = {
    API_URL: API_URL
};
