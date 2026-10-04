(function () {
    "use strict";

    let isSystemLoaded = false;
    let loadingPromise = null;

    async function loadLoyaltySystem() {
        if (isSystemLoaded) return true;
        if (loadingPromise) return loadingPromise;

        loadingPromise = (async () => {
            try {
                console.log("[LoyaltyIntegration] Loading system scripts...");
                const scripts = [
                    "js/loyalty-system/loyalty-config.js",
                    "js/loyalty-system/loyalty-storage.js",
                    "js/loyalty-system/loyalty-api.js",
                    "js/loyalty-system/loyalty-manager.js",
                    "js/loyalty-system/banner.js",
                    "js/loyalty-system/loyalty-modal.js"
                ];

                for (const scriptUrl of scripts) {
                    await loadScript(scriptUrl);
                }

                if (window.LoyaltyManager && typeof window.LoyaltyManager.init === 'function') {
                    await window.LoyaltyManager.init();
                }

                isSystemLoaded = true;
                console.log("[LoyaltyIntegration] Loyalty system loaded successfully");
                updateInlinePointsElements();
                return true;
            } catch (err) {
                console.error("[LoyaltyIntegration] Failed to load loyalty system:", err);
                return false;
            }
        })();

        return loadingPromise;
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already in DOM
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                return resolve();
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => {
                console.log(`[LoyaltyIntegration] Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`[LoyaltyIntegration] Optional script failed to load: ${src}`);
                resolve(); // Don't reject to keep running
            };
            document.head.appendChild(script);
        });
    }

    function setupLoginPointsHook() {
        const origUserLogin = window.userLogin;
        window.userLogin = async function (arg) {
            let cardValue = "";
            if (document.login && document.login.username) {
                cardValue = document.login.username.value;
            }

            if (origUserLogin && typeof origUserLogin === 'function') {
                try {
                    origUserLogin.call(this, arg);
                } catch (e) {
                    console.error("[LoyaltyIntegration] Original userLogin error:", e);
                }
            }

            if (await loadLoyaltySystem()) {
                if (window.LoyaltyManager && window.LoyaltyManager.isLoggedIn()) {
                    window.LoyaltyManager.updateUI();
                    if (cardValue) {
                        try {
                            const res = await window.LoyaltyManager.addPointsForCard(cardValue);
                            if (res && res.success && typeof Banner !== 'undefined' && Banner.show) {
                                Banner.show(res.message, "success");
                            }
                        } catch (err) {
                            // Non-blocking card check
                        }
                    }
                }
            }
        };
    }

    function updateInlinePointsElements() {
        const isLogged = window.LoyaltyManager && typeof window.LoyaltyManager.isLoggedIn === 'function' && window.LoyaltyManager.isLoggedIn();
        
        const regSec = document.getElementById("loyalty-registered-section");
        const unregSec = document.getElementById("loyalty-unregistered-section");
        const regStatusSec = document.getElementById("loyalty-registered-section-status");
        const unregStatusSec = document.getElementById("loyalty-unregistered-section-status");

        if (isLogged) {
            if (regSec) regSec.style.display = "block";
            if (unregSec) unregSec.style.display = "none";
            if (regStatusSec) regStatusSec.style.display = "block";
            if (unregStatusSec) unregStatusSec.style.display = "none";

            const currentUser = window.LoyaltyManager.getCurrentUser();
            const phone = currentUser ? currentUser.phone : (localStorage.getItem('points_user_phone') || '');
            const points = window.LoyaltyManager.getPoints();

            document.querySelectorAll("#loyalty-user-phone, #loyalty-user-phone-status, .loyalty-user-phone, .loyalty-user-phone-display").forEach(el => {
                if (el) el.textContent = phone;
            });

            document.querySelectorAll(".loyalty-points-value").forEach(el => {
                if (el) el.textContent = points;
            });
        } else {
            if (regSec) regSec.style.display = "none";
            if (unregSec) unregSec.style.display = "block";
            if (regStatusSec) regStatusSec.style.display = "none";
            if (unregStatusSec) unregStatusSec.style.display = "block";
        }
    }

    function bindLoyaltyActionButtons() {
        // Universal delegated listener on document for high reliability across screen changes
        if (!window._loyaltyDelegatedBound) {
            window._loyaltyDelegatedBound = true;
            document.addEventListener("click", function (e) {
                // Loan buttons
                const loanBtn = e.target.closest("#loyalty-loan-btn, #loyalty-loan-btn-status, [data-loyalty-loan]");
                if (loanBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager && window.LoyaltyManager.isLoggedIn()) {
                        window.LoyaltyManager.openLoanModal();
                    } else if (window.LoyaltyManager) {
                        window.LoyaltyManager.openRegistrationModal();
                    }
                    return;
                }

                // Buy card / exchange points buttons
                const buyBtn = e.target.closest("#loyalty-buy-card-btn, #loyalty-buy-card-btn-status, [data-loyalty-buy]");
                if (buyBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager && window.LoyaltyManager.isLoggedIn()) {
                        window.LoyaltyManager.openBuyCardModal();
                    } else if (window.LoyaltyManager) {
                        window.LoyaltyManager.openRegistrationModal();
                    }
                    return;
                }

                // Saved cards buttons
                const savedBtn = e.target.closest("#loyalty-saved-cards-btn, #loyalty-saved-cards-btn-status, [data-loyalty-saved]");
                if (savedBtn) {
                    e.preventDefault();
                    if (window.LoyaltyModal && typeof window.LoyaltyModal.showSavedCards === "function") {
                        window.LoyaltyModal.showSavedCards();
                    } else if (window.LoyaltyManager) {
                        window.LoyaltyManager.openRegistrationModal();
                    }
                    return;
                }

                // Points account / portal page buttons
                const accountBtn = e.target.closest("#loyalty-account-btn, #loyalty-account-btn-status, [data-loyalty-account]");
                if (accountBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager && window.LoyaltyManager.isLoggedIn()) {
                        window.LoyaltyManager.openPointsPage();
                    } else if (window.LoyaltyManager) {
                        window.LoyaltyManager.openRegistrationModal();
                    }
                    return;
                }

                // Logout buttons
                const logoutBtn = e.target.closest("#loyalty-logout-btn, #loyalty-logout-btn-status, .loyalty-logout-pill-btn, [data-loyalty-logout]");
                if (logoutBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager) {
                        window.LoyaltyManager.logout();
                        updateInlinePointsElements();
                    }
                    return;
                }

                // Registration trigger buttons
                const regBtn = e.target.closest("#openPointsRegisterBtn, #openPointsRegisterBtnStatus, .points-register-btn, .loyalty-register-btn, [data-loyalty-register]");
                if (regBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager) {
                        window.LoyaltyManager.openRegistrationModal();
                    } else if (typeof window.openAppModal === "function") {
                        window.openAppModal("points-register-modal");
                    }
                    return;
                }
            });
        }
    }

    async function init() {
        console.log("[LoyaltyIntegration] Initializing loyalty integration...");
        
        // Capture Hotspot Metadata if present
        window.hotspotData = window.hotspotData || { ip: "", mac: "", identity: "" };
        try {
            document.querySelectorAll("script").forEach((s) => {
                const text = s.textContent;
                const ipMatch = text.match(/"ip"\s*:\s*"([^"]+)"/);
                if (ipMatch) window.hotspotData.ip = ipMatch[1];
                const macMatch = text.match(/"mac"\s*:\s*"([^"]+)"/);
                if (macMatch) window.hotspotData.mac = macMatch[1];
            });
        } catch (e) {}

        bindLoyaltyActionButtons();
        setupLoginPointsHook();

        await loadLoyaltySystem();

        if (window.LoyaltyManager) {
            window.LoyaltyManager.updateUI();
            updateInlinePointsElements();
            if (window.LoyaltyManager.isLoggedIn()) {
                window.LoyaltyManager.getUserPoint();
            }
        }

        bindLoyaltyActionButtons();
    }

    window.updateInlinePointsElements = updateInlinePointsElements;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
