/**
 * Notifications System - Hotspot Integration
 * Integrates notifications and announcements into MikroTik Hotspot page
 */

(function () {
    'use strict';

    function isLoyaltyEnabled() {
        var cfg = (typeof hotspotConfig !== 'undefined' && hotspotConfig) || 
                  (typeof window !== 'undefined' && window.hotspotConfig) || 
                  (typeof hotOption !== 'undefined' && hotOption) || {};
        if (cfg['enable-loyalty-system'] === false) {
            return false;
        }
        return true;
    }

    // Check if loyalty/shabakaty system is disabled via config.js
    if (!isLoyaltyEnabled()) {
        console.log('[NotificationsIntegration] Suppressed due to enable-loyalty-system: false');
        return;
    }

    let systemLoaded = false;
    let loadingPromise = null;

    /**
     * Load notifications system
     * @returns {Promise<boolean>}
     */
    async function loadNotificationsSystem() {
        if (!isLoyaltyEnabled()) {
            return false;
        }
        if (systemLoaded) {
            return true;
        }

        if (loadingPromise) {
            return loadingPromise;
        }

        loadingPromise = (async () => {
            try {
                if (!isLoyaltyEnabled()) return false;
                console.log('[NotificationsIntegration] Loading system...');

                const scripts = [
                    'js/notifications-system/notifications-config.js',
                    'js/notifications-system/notifications-storage.js',
                    'js/notifications-system/notifications-api.js',
                    'js/notifications-system/notifications-renderer.js',
                    'js/notifications-system/notifications-manager.js'
                ];

                // Load scripts in order
                for (const src of scripts) {
                    await loadScript(src);
                }

                // Initialize manager
                await window.NotificationsManager.init();

                systemLoaded = true;
                console.log('[NotificationsIntegration] System loaded successfully');

                return true;

            } catch (error) {
                console.error('[NotificationsIntegration] Failed to load system:', error);
                return false;
            }
        })();

        return loadingPromise;
    }

    /**
     * Load JavaScript script
     * @param {string} src - Script source
     * @returns {Promise}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`[NotificationsIntegration] Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize on page load
     */
    function init() {
        console.log('[NotificationsIntegration] Initializing...');

        // Load system after delay (after loyalty system)
        const delay = 1500; // 1.5 seconds after page load
        setTimeout(async () => {
            await loadNotificationsSystem();
        }, delay);

        console.log('[NotificationsIntegration] Setup complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
