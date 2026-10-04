/**
 * Notifications Manager
 * Main controller for notifications and announcements system
 */

window.NotificationsManager = {
    initialized: false,
    displayQueue: [],

    /**
     * Initialize the notifications system
     */
    async init() {
        if (this.initialized) {
            console.log('[NotificationsManager] Already initialized');
            return;
        }

        try {
            console.log('[NotificationsManager] Initializing...');

            // Fetch content from API
            const result = await window.NotificationsAPI.fetchContent();

            if (!result.success) {
                console.warn('[NotificationsManager] Failed to fetch content:', result.error);
                return;
            }

            const { notifications = [], announcements = [] } = result.data || {};

            if (window.NotificationsConfig?.debug) {
                console.log('[NotificationsManager] Received:', {
                    notifications: notifications.length,
                    announcements: announcements.length
                });
            }

            // Filter items that should be shown
            const itemsToShow = this._filterAndSort([...announcements, ...notifications]);

            if (itemsToShow.length === 0) {
                console.log('[NotificationsManager] No items to display');
                this.initialized = true;
                return;
            }

            // Display items
            await this._displayItems(itemsToShow);

            this.initialized = true;
            console.log('[NotificationsManager] Initialized successfully');

        } catch (error) {
            console.error('[NotificationsManager] Initialization error:', error);
        }
    },

    /**
     * Filter and sort items
     * @private
     */
    _filterAndSort(items) {
        // Filter items that should be shown
        const filtered = items.filter(item => {
            return window.NotificationsStorage.shouldShow(item);
        });

        // Sort by priority (highest first)
        filtered.sort((a, b) => {
            const priorityA = a.priority || 0;
            const priorityB = b.priority || 0;
            return priorityB - priorityA;
        });

        return filtered;
    },

    /**
     * Display items sequentially
     * @private
     */
    async _displayItems(items) {
        const config = window.NotificationsConfig?.display || {};
        const delayBetween = config.delayBetween || 800;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Display the item
            this._displayItem(item);

            // Mark as shown
            window.NotificationsStorage.markAsShown(item);

            // Wait before showing next item
            if (i < items.length - 1) {
                await this._delay(delayBetween);
            }
        }
    },

    /**
     * Display single item
     * @private
     */
    _displayItem(item) {
        const template = item.template_type || 'modal';
        let element = null;

        // Determine if it's announcement or notification
        const isAnnouncement = item.position !== undefined; // Announcements have position

        if (isAnnouncement && (template === 'bar' || template === 'banner')) {
            // Banner
            element = window.NotificationsRenderer.renderBanner(item);
            console.error('container test:', this.getContainer());
             const customContainer = this.getContainer();
             if (customContainer) {
                 customContainer.appendChild(element);
             } else {   
            document.body.appendChild(element);
             }



            // Add show class for animation
            setTimeout(() => {
                element.classList.add('nt-banner-show');
            }, 10);

            // Auto close if configured
            const autoClose = window.NotificationsConfig?.display?.autoCloseDelay;
            if (autoClose && !item.is_dismissible) {
                // setTimeout(() => {
                //     window.NotificationsRenderer._removeBanner(element);
                // }, autoClose);
            }

        } else if (template === 'modal') {
            // Modal
            element = window.NotificationsRenderer.renderModal(item);
            document.body.appendChild(element);

            // Add show class for animation
            setTimeout(() => {
                element.classList.add('nt-modal-show');
            }, 10);

            // Auto close if configured
            const autoClose = window.NotificationsConfig?.display?.autoCloseDelay;
            if (autoClose) {
                // setTimeout(() => {
                //     window.NotificationsRenderer._removeModal(element);
                // }, autoClose);
            }

        } else if (template === 'centered_card') {
            // Centered Card
            element = window.NotificationsRenderer.renderCenteredCard(item);
            document.body.appendChild(element);

            // Add show class for animation
            setTimeout(() => {
                element.classList.add('nt-card-show');
            }, 10);

            // Auto close if configured
            const autoClose = window.NotificationsConfig?.display?.autoCloseDelay;
            if (autoClose) {
                // setTimeout(() => {
                //     window.NotificationsRenderer._removeCard(element);
                // }, autoClose);
            }
        }

        if (window.NotificationsConfig?.debug && element) {
            console.log('[NotificationsManager] Displayed:', {
                id: item.id,
                template,
                type: isAnnouncement ? 'announcement' : 'notification'
            });
        }
    },
     getContainer() {
        let container = document.getElementById('announcements-container');

        if (!container) {
            console.log('[Announcements] Container not found, creating one...');
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.className = 'announcements-wrapper';

            if (document.body) {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }

        return container;
    },


    /**
     * Delay helper
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NotificationsManager;
}
