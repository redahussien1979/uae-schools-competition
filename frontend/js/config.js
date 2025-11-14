/* ============================================
   API Configuration
   ============================================ */

// API URL Configuration
// Change this to your production backend URL when deploying
// This will be used by all frontend JavaScript files

// For production: Replace 'https://your-backend-url.com' with your actual backend URL
// For development: Keep as 'http://localhost:5000'

// Detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '' ||
                    window.location.protocol === 'file:';

// Set API URL based on environment
const PRODUCTION_API_URL = 'https://uae-schools-backend.onrender.com'; // ✅ Updated with Render.com backend URL
const DEVELOPMENT_API_URL = 'http://localhost:5000';

// Set API URL based on environment
window.API_URL = isLocalhost ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// Force set for production (override any cached values)
if (!isLocalhost && window.location.hostname.includes('onrender.com')) {
    window.API_URL = PRODUCTION_API_URL;
}

// Debug logging
console.log('🌐 API Configuration:');
console.log('  Hostname:', window.location.hostname);
console.log('  Protocol:', window.location.protocol);
console.log('  Is Localhost:', isLocalhost);
console.log('  API URL:', window.API_URL);

// Warn if using placeholder URL in production
if (!isLocalhost && PRODUCTION_API_URL.includes('your-backend-url.com')) {
    console.error('⚠️ WARNING: You need to update the API URL in frontend/js/config.js!');
    console.error('Current URL:', PRODUCTION_API_URL);
    console.error('Please replace it with your actual Render.com backend URL.');
}

// Warn if opening via file:// protocol
if (window.location.protocol === 'file:') {
    console.warn('⚠️ WARNING: You are opening the file directly (file:// protocol)');
    console.warn('This will cause CORS errors!');
    console.warn('Please use a web server instead:');
    console.warn('  - Python: python -m http.server 8000');
    console.warn('  - Node: npx http-server -p 8000');
    console.warn('  - VS Code: Install "Live Server" extension');
}

// Make it available as a constant for backward compatibility
const API_URL = window.API_URL;

