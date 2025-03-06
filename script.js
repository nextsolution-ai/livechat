// Update the server URL configuration
const SERVER_URL = {
    PRODUCTION: 'https://livechat-server-s24m.onrender.com',
    LOCAL: 'http://localhost:3000'
};

// Function to determine which server to use
function getServerUrl() {
    // Check if we're on the GitHub Pages domain
    if (window.location.hostname.includes('github.io')) {
        return SERVER_URL.PRODUCTION;
    }
    return SERVER_URL.LOCAL;
}

// Update the socket connection to use the dynamic server URL
const socket = io(getServerUrl(), {
    transports: ['websocket', 'polling']
}); 