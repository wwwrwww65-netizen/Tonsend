(function () {
    "use strict";

    // Helper to check if loyalty system is enabled from config.js
    function isLoyaltyEnabled() {
        var cfg = (typeof hotspotConfig !== "undefined" && hotspotConfig) || 
                  (typeof window !== "undefined" && window.hotspotConfig) || 
                  (typeof hotOption !== "undefined" && hotOption) || {};
        if (cfg["enable-loyalty-system"] === false) {
            return false;
        }
        return true;
    }

    // Immediately handle disabled state if turned off in config
    if (!isLoyaltyEnabled()) {
        document.documentElement.classList.add("loyalty-system-disabled");
        if (document.body) {
            document.body.classList.add("loyalty-system-disabled");
        } else {
            document.addEventListener("DOMContentLoaded", function () {
                document.body.classList.add("loyalty-system-disabled");
            });
        }
        console.log("[LoyaltyIntegration] Loyalty system is DISABLED via config.js");
        return;
    }

    var isSystemLoaded = false;
    var loadingPromise = null;

    function loadLoyaltySystem() {
        if (!isLoyaltyEnabled()) return false;
        if (isSystemLoaded) return true;
        if (loadingPromise) return loadingPromise;

        loadingPromise = (function() {
            try {
                console.log("[LoyaltyIntegration] Loading system scripts...");
                var scripts = [
                    "js/loyalty-system/loyalty-config.js",
                    "js/loyalty-system/loyalty-storage.js",
                    "js/loyalty-system/loyalty-api.js",
                    "js/loyalty-system/loyalty-manager.js",
                    "js/loyalty-system/banner.js",
                    "js/loyalty-system/loyalty-modal.js"
                ];

                for (var scriptUrl of scripts) {
                    loadScript(scriptUrl);
                }

                if (window.LoyaltyManager && typeof window.LoyaltyManager.init === 'function') {
                    window.LoyaltyManager.init();
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
            var existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                return resolve();
            }
            var script = document.createElement("script");
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
        var origUserLogin = window.userLogin;
        window.userLogin = async function (arg) {
            var cardValue = "";
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
                            var res = await window.LoyaltyManager.addPointsForCard(cardValue);
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
        var isLogged = window.LoyaltyManager && typeof window.LoyaltyManager.isLoggedIn === 'function' && window.LoyaltyManager.isLoggedIn();
        
        var regSec = document.getElementById("loyalty-registered-section");
        var unregSec = document.getElementById("loyalty-unregistered-section");
        var regStatusSec = document.getElementById("loyalty-registered-section-status");
        var unregStatusSec = document.getElementById("loyalty-unregistered-section-status");

        if (isLogged) {
            if (regSec) regSec.style.display = "block";
            if (unregSec) unregSec.style.display = "none";
            if (regStatusSec) regStatusSec.style.display = "block";
            if (unregStatusSec) unregStatusSec.style.display = "none";

            var currentUser = window.LoyaltyManager.getCurrentUser();
            var phone = currentUser ? currentUser.phone : (localStorage.getItem('points_user_phone') || '');
            var points = window.LoyaltyManager.getPoints();

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
                var loanBtn = e.target.closest("#loyalty-loan-btn, #loyalty-loan-btn-status, [data-loyalty-loan]");
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
                var buyBtn = e.target.closest("#loyalty-buy-card-btn, #loyalty-buy-card-btn-status, [data-loyalty-buy]");
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
                var savedBtn = e.target.closest("#loyalty-saved-cards-btn, #loyalty-saved-cards-btn-status, [data-loyalty-saved]");
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
                var accountBtn = e.target.closest("#loyalty-account-btn, #loyalty-account-btn-status, [data-loyalty-account]");
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
                var logoutBtn = e.target.closest("#loyalty-logout-btn, #loyalty-logout-btn-status, .loyalty-logout-pill-btn, [data-loyalty-logout]");
                if (logoutBtn) {
                    e.preventDefault();
                    if (window.LoyaltyManager) {
                        window.LoyaltyManager.logout();
                        updateInlinePointsElements();
                    }
                    return;
                }

                // Registration trigger buttons
                var regBtn = e.target.closest("#openPointsRegisterBtn, #openPointsRegisterBtnStatus, .points-register-btn, .loyalty-register-btn, [data-loyalty-register]");
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
        if (!isLoyaltyEnabled()) return;
        console.log("[LoyaltyIntegration] Initializing loyalty integration...");
        
        // Capture Hotspot Metadata if present
        window.hotspotData = window.hotspotData || { ip: "", mac: "", identity: "" };
        try {
            document.querySelectorAll("script").forEach((s) => {
                var text = s.textContent;
                var ipMatch = text.match(/"ip"\s*:\s*"([^"]+)"/);
                if (ipMatch) window.hotspotData.ip = ipMatch[1];
                var macMatch = text.match(/"mac"\s*:\s*"([^"]+)"/);
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
