/**
 * Notifications Renderer
 * Renders different templates for notifications and announcements
 */

window.NotificationsRenderer = {
    /**
     * Render a banner (announcement bar)
     * @param {Object} announcement - Announcement object
     * @returns {HTMLElement}
     */
    // renderBanner(announcement) {
    //     const {
    //         id,
    //         message,
    //         title,
    //         position = 'top',
    //         bg_color = '#1e2532',
    //         text_color = '#fce2a9',
    //         button_color = '#f4c430',
    //         icon,
    //         action_text,
    //         action_url,
    //         is_dismissible = true
    //     } = announcement;

    //     const banner = document.createElement('div');
    //     banner.className = `nt-banner nt-banner-${position}`;
    //     banner.setAttribute('data-notification-id', id);
    //     banner.style.cssText = `
    //   background-color: ${bg_color};
    //   color: ${text_color};
    // `;

    //     let innerHTML = '<div class="nt-banner-content">';

    //     // Icon
    //     if (icon) {
    //         innerHTML += `<i class="fa ${icon} nt-banner-icon"></i>`;
    //     }

    //     // Title and message
    //     innerHTML += '<div class="nt-banner-text">';
    //     if (title) {
    //         innerHTML += `<strong class="nt-banner-title">${this._escapeHtml(title)}</strong>`;
    //     }
    //     innerHTML += `<span class="nt-banner-message">${this._escapeHtml(message)}</span>`;
    //     innerHTML += '</div>';

    //     // Action button
    //     if (action_text && action_url) {
    //         innerHTML += `
    //     <a href="${this._escapeHtml(action_url)}" 
    //        class="nt-banner-action" 
    //        style="background-color: ${button_color}; color: ${bg_color};"
    //        target="_blank">
    //       ${this._escapeHtml(action_text)}
    //     </a>
    //   `;
    //     }

    //     // Close button
    //     if (is_dismissible) {
    //         innerHTML += '<button class="nt-banner-close" aria-label="Close">×</button>';
    //     }

    //     innerHTML += '</div>';
    //     banner.innerHTML = innerHTML;

    //     // Add event listeners
    //     if (is_dismissible) {
    //         const closeBtn = banner.querySelector('.nt-banner-close');
    //         if (closeBtn) {
    //             closeBtn.onclick = () => this._removeBanner(banner);
    //         }
    //     }

    //     return banner;
    // },
    renderBanner(announcement) {
    const {
        id,
        message,
        title,
        position = 'top',
        bg_color = '#1e2532',
        text_color = '#fce2a9',
        button_color = '#f4c430',
        icon,
        action_text,
        action_url,
        is_dismissible = true
    } = announcement;

    const banner = document.createElement('div');
    banner.className = `nt-banner nt-banner-${position}`;
    banner.setAttribute('data-notification-id', id);
    banner.style.cssText = `
        background-color: ${bg_color} !important;
        color: ${text_color} !important;
    `;

    let innerHTML = '<div class="nt-banner-content">';

    // Icon
    if (icon) {
        innerHTML += `<i class="fa ${icon} nt-banner-icon"></i>`;
    }

    // Title and message
    innerHTML += '<div class="nt-banner-text">';
    if (title) {
        innerHTML += `<strong class="nt-banner-title" style="color: ${text_color} !important;">${this._escapeHtml(title)}</strong>`;
    }
    innerHTML += `<span class="nt-banner-message" style="color: ${text_color} !important; ">${this._escapeHtml(message)}</span>`;
    innerHTML += '</div>';

    // Action button
    if (action_text && action_url) {
        innerHTML += `
            <a href="${this._escapeHtml(action_url)}" 
               class="nt-banner-action" 
               style="background-color: ${button_color}!important; color: ${bg_color} !important;"
               target="_blank">
              ${this._escapeHtml(action_text)}
            </a>
        `;
    }

    // Close button
    if (is_dismissible) {
        innerHTML += '<button class="nt-banner-close" aria-label="Close">×</button>';
    }

    innerHTML += '</div>';
    banner.innerHTML = innerHTML;

    // Add event listeners
    if (is_dismissible) {
        const closeBtn = banner.querySelector('.nt-banner-close');
        if (closeBtn) {
            closeBtn.onclick = () => this._removeBanner(banner);
        }
    }

    // --- المنطق الجديد للإضافة داخل حاوية محددة ---
    // استبدل 'my-banner-container' بالـ ID الذي أنشأته في صفحتك
   
    // إذا لم يجد الدف، لا نفعل شيئاً هنا لأن مدير الإشعارات 
    // سيقوم بإضافته إلى document.body تلقائياً كما في الكود السابق.

    return banner;
},

    /**
     * Render a modal (popup notification)
     * @param {Object} notification - Notification object
     * @returns {HTMLElement}
     */
    renderModal(notification) {
        const {
            id,
            title,
            message,
            bg_color = '#ffffff',
            text_color = '#17385F',
            button_color = '#17385F',
            action_text,
            action_url
        } = notification;

        const modal = document.createElement('div');
        modal.className = 'nt-modal-overlay';
        modal.setAttribute('data-notification-id', id);
        if (window.ModalScrollLock) window.ModalScrollLock.lock();
        else document.body.style.overflow = 'hidden';

        let innerHTML = `
      <div class="nt-modal" style="background-color: ${bg_color} !important; color: ${text_color} !important; ">
        <button class="nt-modal-close" aria-label="Close">×</button>
        <div class="nt-modal-content">
    `;

        if (title) {
            innerHTML += `<h3 class="nt-modal-title" style="color: ${text_color} !important;">${this._escapeHtml(title)}</h3>`;
        }

        innerHTML += `<p class="nt-modal-message" style="color: ${text_color} !important;">${this._escapeHtml(message)}</p>`;

        if (action_text && action_url) {
            innerHTML += `
        <a href="${this._escapeHtml(action_url)}" 
           class="nt-modal-action" 
           style="background-color: ${button_color} !important; color: ${bg_color} !important;"
           target="_blank">
          ${this._escapeHtml(action_text)}
        </a>
      `;
        }

        innerHTML += '</div></div>';
        modal.innerHTML = innerHTML;

        // Event listeners
        const closeBtn = modal.querySelector('.nt-modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this._removeModal(modal);
        }

        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                this._removeModal(modal);
            }
        };

        return modal;
    },

    /**
     * Render a centered card
     * @param {Object} notification - Notification object
     * @returns {HTMLElement}
     */
    renderCenteredCard(notification) {
        const {
            id,
            title,
            message,
            bg_color = '#ffffff',
            text_color = '#17385F',
            button_color = '#17385F',
            action_text,
            action_url
        } = notification;

        const card = document.createElement('div');
        card.className = 'nt-card-overlay';
        card.setAttribute('data-notification-id', id);
        if (window.ModalScrollLock) window.ModalScrollLock.lock();
        else document.body.style.overflow = 'hidden';

        let innerHTML = `
      <div class="nt-card" style="background-color: ${bg_color} !important; color: ${text_color} !important;">
        <button class="nt-card-close" aria-label="Close">×</button>
        <div class="nt-card-content">
          <div class="nt-card-icon">🔔</div>
    `;

        if (title) {
            innerHTML += `<h3 class="nt-card-title" style="color: ${text_color} !important;">${this._escapeHtml(title)}</h3>`;
        }

        innerHTML += `<p class="nt-card-message" style="color: ${text_color} !important;">${this._escapeHtml(message)}</p>`;

        if (action_text && action_url) {
            innerHTML += `
        <a href="${this._escapeHtml(action_url)}" 
           class="nt-card-action" 
           style="background-color: ${button_color} !important; color: ${bg_color} !important;"
           target="_blank">
          ${this._escapeHtml(action_text)}
        </a>
      `;
        }

        innerHTML += '</div></div>';
        card.innerHTML = innerHTML;

        // Event listeners
        const closeBtn = card.querySelector('.nt-card-close');
        if (closeBtn) {
            closeBtn.onclick = () => this._removeCard(card);
        }

        // Close on overlay click
        card.onclick = (e) => {
            if (e.target === card) {
                this._removeCard(card);
            }
        };

        return card;
    },

    /**
     * Remove banner with animation
     * @private
     */
    _removeBanner(banner) {
        banner.classList.add('nt-banner-hide');
        // setTimeout(() => {
        //     if (banner.parentNode) {
        //         banner.parentNode.removeChild(banner);
        //     }
        // }, 300);
    },

    /**
     * Remove modal with animation
     * @private
     */
    _removeModal(modal) {
        modal.classList.add('nt-modal-hide');
        // setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        // }, 300);
        if (window.ModalScrollLock) window.ModalScrollLock.unlock();
        else document.body.style.overflow = '';
    },

    /**
     * Remove card with animation
     * @private
     */
    _removeCard(card) {
        card.classList.add('nt-card-hide');
        // setTimeout(() => {
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
        // }, 300);
        if (window.ModalScrollLock) window.ModalScrollLock.unlock();
        else document.body.style.overflow = '';
    },

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NotificationsRenderer;
}
