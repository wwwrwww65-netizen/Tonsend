/**
 * Notifications System Configuration
 * Integrated configuration for notifications and announcements display
 */

window.NotificationsConfig = {
    // API Settings
    api: {
        // Get base URL from LoyaltyConfig if available, otherwise use current origin
        get baseURL() {
            return window.LoyaltyConfig?.api?.baseURL || window.location.origin;
        },

        // Main endpoint for fetching notifications and announcements
        endpoint: '/api/v1/public/content',

        // Request settings
        timeout: 10000,        // 10 seconds timeout
        retries: 1,           // Number of retries on failure
        retryDelay: 1000      // Delay between retries (1 second)
    },

    // Storage settings for tracking shown items
    storage: {
        prefix: 'nt_',
        sessionKey: 'session_shown',      // For once_per_session items
        permanentKey: 'permanent_shown',  // For once (永久) items
        ttl: 86400000                     // 24 hours cleanup
    },

    // Display settings
    display: {
        maxConcurrent: 1,     // Max items shown at once
        delayBetween: 800,    // Delay between items (ms)
        autoCloseDelay: 5000, // Auto close after 5 seconds
        zIndexBase: 10000     // Base z-index for elements
    },

    // Animation settings
    animations: {
        enabled: true,
        duration: 400,        // Animation duration (ms)
        easing: 'ease-out'
    },

    // Debug mode
    debug: false
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NotificationsConfig;
}
