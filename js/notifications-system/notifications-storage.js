/**
 * Notifications Storage Manager
 * Manages localStorage/sessionStorage for tracking shown notifications
 */

window.NotificationsStorage = {
    /**
     * Check if item should be shown based on appearance_type
     * @param {Object} item - Notification or announcement object
     * @returns {boolean}
     */
    shouldShow(item) {
        if (!item || !item.appearance_type) return true;

        const { appearance_type, id } = item;

        // Always show
        if (appearance_type === 'always') {
            return true;
        }

        const config = window.NotificationsConfig?.storage || {};
        const prefix = config.prefix || 'nt_';

        // Once per session
        if (appearance_type === 'once_per_session') {
            const key = `${prefix}${config.sessionKey || 'session'}`;
            const shown = this._getSessionData(key);
            return !shown.includes(id);
        }

        // Once (permanent)
        if (appearance_type === 'once' || appearance_type === 'once_per_day') {
            const key = `${prefix}${config.permanentKey || 'permanent'}`;
            const shown = this._getPermanentData(key);
            return !shown.includes(id);
        }

        return true;
    },

    /**
     * Mark item as shown
     * @param {Object} item - Notification or announcement object
     */
    markAsShown(item) {
        if (!item || !item.appearance_type || item.appearance_type === 'always') {
            return;
        }

        const { appearance_type, id } = item;
        const config = window.NotificationsConfig?.storage || {};
        const prefix = config.prefix || 'nt_';

        if (appearance_type === 'once_per_session') {
            const key = `${prefix}${config.sessionKey || 'session'}`;
            const shown = this._getSessionData(key);
            if (!shown.includes(id)) {
                shown.push(id);
                this._setSessionData(key, shown);
            }
        }

        if (appearance_type === 'once' || appearance_type === 'once_per_day') {
            const key = `${prefix}${config.permanentKey || 'permanent'}`;
            const shown = this._getPermanentData(key);
            if (!shown.includes(id)) {
                shown.push(id);
                this._setPermanentData(key, shown);
            }
        }
    },

    /**
     * Get session data
     * @private
     */
    _getSessionData(key) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Set session data
     * @private
     */
    _setSessionData(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('[NotificationsStorage] Session storage error:', e);
        }
    },

    /**
     * Get permanent data
     * @private
     */
    _getPermanentData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Set permanent data
     * @private
     */
    _setPermanentData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('[NotificationsStorage] Local storage error:', e);
        }
    },

    /**
     * Clear old data (cleanup)
     */
    cleanup() {
        // Could implement cleanup of old items here
        // For now, we rely on browser's storage limits
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NotificationsStorage;
}
