class LoyaltyManager {
    constructor() {
        this.config = window.LoyaltyConfig || {};
        this.storage = null;
        this.api = null;
        this.user = null;
        this.initialized = false;
        this.debugMode = this.config.development?.mode || false;
    }

    async init() {
        try {
            if (this.initialized) {
                this.log("Already initialized");
                this.updateUI();
                return true;
            }
            this.log("Initializing Loyalty System...");
            this.storage = new window.LoyaltyStorage(this.config);
            this.api = new window.LoyaltyAPI(this.config);
            window.loyaltyStorageInstance = this.storage;
            window.loyaltyAPIInstance = this.api;
            
            this.user = this.storage.load();

            // Validate token
            if (this.user) {
                if (!this.user.token || !this.isTokenValid(this.user.token)) {
                    this.log("Stored session token is invalid or expired, resetting session");
                    this.logout();
                }
            }

            this.initialized = true;
            this.log("Initialization complete", { isLoggedIn: this.isLoggedIn() });
            this.updateUI();
            return true;
        } catch (s) {
            return this.logError("Initialization failed", s), false;
        }
    }

    isLoggedIn() {
        return !!(this.user && this.user.userId && this.user.phone && this.user.token && this.isTokenValid(this.user.token));
    }

    isTokenValid(token) {
        if (!token || typeof token !== "string") return false;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    async register(phoneArg, nameOrPassword, passwordArg) {
        try {
            const phone = phoneArg ? String(phoneArg).trim() : "";
            let username = phone;
            let password = "";

            if (passwordArg !== undefined) {
                username = nameOrPassword ? String(nameOrPassword).trim() : phone;
                password = String(passwordArg).trim();
            } else {
                password = nameOrPassword ? String(nameOrPassword).trim() : "";
            }

            this.log("Registering user", { phone, username });
            if (!phone) {
                return { success: false, error: "يرجى إدخال رقم الهاتف" };
            }
            if (!password) {
                return { success: false, error: "يرجى إدخال كلمة المرور" };
            }

            const response = await this.api.register(phone, username, password);

            if (response && response.success) {
                const token = response.data?.access_token || response.data?.token || response.data?.accessToken;
                const userObj = response.data?.user || response.data;
                
                this.user = {
                    userId: userObj.id || userObj.userId || ("usr_" + phone),
                    phone: userObj.phone || phone,
                    username: userObj.username || username || phone,
                    points: userObj.points || 0,
                    token: token || null,
                    createdAt: userObj.created_at || new Date().toISOString()
                };

                if (this.user.token && this.isTokenValid(this.user.token)) {
                    this.storage.save(this.user);
                }

                this.log("Registration successful", this.user);
                this.updateUI();
                this.trackEvent("user_registered", { userId: this.user.userId });
                return {
                    success: true,
                    message: response.message || this.config.ui?.texts?.success || "تم التسجيل بنجاح!",
                    data: this.user
                };
            }

            return {
                success: false,
                error: (response && response.message) || "فشل إنشاء الحساب"
            };
        } catch (err) {
            this.logError("Registration error", err);
            return {
                success: false,
                error: err.message || this.getErrorMessage(err)
            };
        }
    }

    async login(phoneArg, passwordArg) {
        try {
            const rawPhone = phoneArg ? String(phoneArg).trim() : "";
            const password = passwordArg ? String(passwordArg).trim() : "";
            this.log("Logging in user", { phone: rawPhone });

            if (!rawPhone) {
                return { success: false, error: "يرجى إدخال رقم الهاتف" };
            }
            if (!password) {
                return { success: false, error: "يرجى إدخال كلمة المرور" };
            }

            // Attempt login with raw phone first, then alternative format if needed
            let response = null;
            let lastError = null;

            // Generate phone candidates: exactly as entered, and with/without 967
            const candidates = [];
            candidates.push(rawPhone);
            
            let sanitized = this.api.sanitizePhone(rawPhone);
            if (sanitized && !candidates.includes(sanitized)) {
                candidates.push(sanitized);
            }
            
            // Local 9-digit without country code (e.g., 777310606)
            let local9 = rawPhone.replace(/^(\+?967|00967|0)/, '');
            if (local9 && !candidates.includes(local9)) {
                candidates.push(local9);
            }

            for (const phoneCandidate of candidates) {
                try {
                    response = await this.api.login(phoneCandidate, password);
                    if (response && response.success) {
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    this.log(`Login attempt with ${phoneCandidate} failed, trying next candidate if any`);
                }
            }

            if (response && response.success && response.data) {
                const token = response.data.access_token || response.data.token;
                const u = response.data.user || response.data;

                this.user = {
                    userId: u.id || u.userId || ("usr_" + rawPhone),
                    phone: u.phone || rawPhone,
                    username: u.username || rawPhone,
                    points: u.points || 0,
                    token: token || null,
                    createdAt: u.created_at || new Date().toISOString()
                };

                if (this.user.token && this.isTokenValid(this.user.token)) {
                    this.storage.save(this.user);
                }

                this.log("Login successful", this.user);
                this.updateUI();
                this.trackEvent("user_logged_in", { userId: this.user.userId });
                return {
                    success: true,
                    message: response.message || this.config.ui?.texts?.success || "تم تسجيل الدخول بنجاح!",
                    data: this.user
                };
            }

            const errorMsg = (lastError && (lastError.message || lastError.toString())) || (response && response.message) || "رقم الهاتف أو كلمة المرور غير صحيحة";
            return {
                success: false,
                error: errorMsg
            };
        } catch (err) {
            this.logError("Login error", err);
            return {
                success: false,
                error: err.message || this.getErrorMessage(err)
            };
        }
    }

    async addPointsForCard(cardNum) {
        try {
            if (!this.isLoggedIn()) {
                return { success: false, skipped: true };
            }
            if (!cardNum || !String(cardNum).trim()) {
                return { success: false, skipped: true };
            }
            this.log("Checking card for loyalty points", { cardNumber: cardNum });
            const res = await this.api.addPoints(cardNum);
            if (res && res.success) {
                if (res.data && res.data.new_balance !== undefined) {
                    this.user.points = res.data.new_balance;
                    this.storage.save(this.user);
                }
                this.log("Points added successfully", res.data);
                this.updateUI();
                this.trackEvent("points_added", { userId: this.user.userId, points: res.data?.pointsAdded, cardNumber: cardNum });
                if (typeof Banner !== "undefined" && Banner.show) {
                    setTimeout(() => Banner.show(res.message || "تمت إضافة النقاط بنجاح!", "success"), 2000);
                }
                return { success: true, data: res.data, message: res.message };
            }
            this.log("Card points check result:", res?.message || res?.error);
            return { success: false, error: (res && (res.message || res.error)) || "لم يتم العثور على نقاط للكرت" };
        } catch (s) {
            this.log("Add points check caught:", s?.message || s);
            return { success: false, error: this.getErrorMessage(s) };
        }
    }

    async getUserPoint() {
        try {
            if (!this.isLoggedIn()) return { success: false, skipped: true };
            const res = await this.api.getPoints();
            if (res && res.success && res.data) {
                this.user.points = res.data.points;
                this.storage.save(this.user);
                this.updateUI();
                return { success: true, data: res.data };
            }
            return { success: false, error: "Failed to get points" };
        } catch (s) {
            return this.logError("get points error", s), { success: false, error: this.getErrorMessage(s) };
        }
    }

    getCurrentUser() {
        return this.user;
    }

    getPoints() {
        return (this.user && typeof this.user.points === "number") ? this.user.points : 0;
    }

    logout() {
        this.log("Logging out");
        this.user = null;
        if (this.storage) this.storage.clear();
        if (this.api) this.api.clearCache();
        try {
            localStorage.removeItem("points_user_logged_in");
            localStorage.removeItem("points_user_phone");
            localStorage.removeItem("points_user_points");
        } catch (e) {}
        this.updateUI();
        this.trackEvent("user_logged_out");
    }

    static logout_loy() {
        if (window.LoyaltyManager) {
            window.LoyaltyManager.logout();
            console.log("[LoyaltyManager] User logged out successfully");
        }
    }

    async requestLoan(rewardId) {
        try {
            if (!this.isLoggedIn()) return { success: false, error: "يجب تسجيل الدخول أولاً" };
            this.log("Requesting loan", { rewardId });
            const res = await this.api.requestLoan(rewardId);
            if (res && res.success) {
                const newPts = res.data.new_balance !== undefined ? res.data.new_balance : res.data.remaining_points;
                if (newPts !== undefined) {
                    this.user.points = newPts;
                    this.storage.save(this.user);
                    this.updateUI();
                }
                this.trackEvent("loan_requested", { userId: this.user.userId, rewardId });
            }
            return res;
        } catch (s) {
            return this.logError("Loan request error", s), { success: false, error: this.getErrorMessage(s) };
        }
    }

    async buyCard(rewardId, rewardName, pointsCost) {
        try {
            if (!this.isLoggedIn()) return { success: false, error: "يجب تسجيل الدخول أولاً" };
            if (this.getPoints() < pointsCost) {
                return { success: false, error: `نقاطك غير كافية. تحتاج ${pointsCost} نقطة ولديك ${this.getPoints()} نقطة فقط.` };
            }
            this.log("Buying card", { rewardId, rewardName, points: pointsCost });
            const res = await this.api.buyCard(rewardId, rewardName, pointsCost);
            if (res && res.success) {
                const newPts = res.data.new_balance !== undefined ? res.data.new_balance : res.data.remaining_points;
                if (newPts !== undefined) {
                    this.user.points = newPts;
                    this.storage.save(this.user);
                    this.updateUI();
                }
                this.trackEvent("card_purchased", { userId: this.user.userId, rewardId, rewardName, points: pointsCost });
            }
            return res;
        } catch (s) {
            return this.logError("Card purchase error", s), { success: false, error: this.getErrorMessage(s) };
        }
    }

    async getLoanOptions() {
        try {
            if (!this.isLoggedIn()) {
                return await this.api.mockGetLoanOptions();
            }
            return await this.api.getLoanOptions();
        } catch (s) {
            return await this.api.mockGetLoanOptions();
        }
    }

    async getCardTypes() {
        try {
            if (!this.isLoggedIn()) {
                return await this.api.mockGetCardTypes();
            }
            return await this.api.getCardTypes();
        } catch (s) {
            return await this.api.mockGetCardTypes();
        }
    }

    openLoanModal() {
        if (window.LoyaltyModal && typeof window.LoyaltyModal.showLoanModal === "function") {
            window.LoyaltyModal.showLoanModal();
        } else {
            this.openRegistrationModal();
        }
    }

    openBuyCardModal() {
        if (window.LoyaltyModal && typeof window.LoyaltyModal.showBuyCardModal === "function") {
            window.LoyaltyModal.showBuyCardModal();
        } else {
            this.openRegistrationModal();
        }
    }

    updateUI() {
        const fab = document.getElementById("loyalty-floating-btn");
        if (typeof window.updateInlinePointsElements === "function") {
            window.updateInlinePointsElements();
        }

        const isLogged = this.isLoggedIn();
        const currentPoints = this.getPoints();

        document.querySelectorAll("#loyalty-user-phone, .loyalty-user-phone-display").forEach(el => {
            if (el) el.textContent = this.user ? this.user.phone : "";
        });

        document.querySelectorAll(".loyalty-points-value").forEach(el => {
            if (el) el.textContent = currentPoints;
        });

        if (fab) {
            if (isLogged) {
                fab.innerHTML = `<span class="fab-icon">♦</span><span class="fab-text">${this.config.ui?.texts?.pointsButton || "نقاطي"}</span>`;
                fab.classList.add("logged-in");
                fab.classList.remove("logged-out");
                fab.onclick = async () => {
                    const orig = fab.innerHTML;
                    fab.innerHTML = '<span class="loader"></span><span class="fab-text">جاري الفتح...</span>';
                    fab.disabled = true;
                    this.openPointsPage(fab, orig);
                };
                this.updatePointsBadge(currentPoints);
            } else {
                fab.innerHTML = `<span class="fab-icon">★</span><span class="fab-text">${this.config.ui?.texts?.registerButton || "سجل في النقاط"}</span>`;
                fab.classList.remove("logged-in");
                fab.classList.add("logged-out");
                fab.onclick = () => this.openRegistrationModal();
                this.updatePointsBadge(0);
            }
        }
    }

    updatePointsBadge(pts) {
        let badge = document.querySelector(".fab-badge");
        if (!badge) {
            const fab = document.getElementById("loyalty-floating-btn");
            if (!fab) return;
            badge = document.createElement("span");
            badge.className = "fab-badge";
            fab.appendChild(badge);
        }
        if (pts) {
            badge.textContent = pts;
            badge.style.display = "block";
        } else {
            badge.style.display = "none";
        }
    }

    openRegistrationModal() {
        const modal = document.getElementById("points-register-modal");
        if (modal) {
            modal.classList.add("active");
            modal.style.display = "block";
            const loginEl = document.getElementById("login");
            if (loginEl) loginEl.classList.add("inactive");
        } else if (window.LoyaltyModal) {
            window.LoyaltyModal.open();
        }
    }

    openPointsPage(triggerBtn = null, origHTML = null) {
        if (!this.isLoggedIn()) {
            return void this.openRegistrationModal();
        }
        const token = (this.storage && this.storage.getAccessToken()) || (this.user && this.user.token);
        this.openLoyaltyAutoLogin({
            serverUrl: this.config.api?.baseURL || "https://tunisnet.shabakaty.site",
            accessToken: token,
            triggerButton: triggerBtn,
            originalBtnHTML: origHTML
        });
    }

    async openLoyaltyAutoLogin(options = {}) {
        const {
            serverUrl = this.config.api?.baseURL || "https://tunisnet.shabakaty.site",
            accessToken = null,
            onSuccess = null,
            onError = null,
            triggerButton = null,
            originalBtnHTML = null
        } = options;

        try {
            if (!accessToken || !this.isTokenValid(accessToken)) {
                window.open(serverUrl, "_blank");
                return;
            }

            const headers = { "Content-Type": "application/json" };
            headers.Authorization = `Bearer ${accessToken}`;

            const res = await fetch(`${serverUrl}/auth/generate-one-time-token`, {
                method: "POST",
                headers: headers,
                credentials: "omit",
                mode: "cors"
            });
            const data = await res.json();
            if (!data.success || !res.ok) {
                console.warn("Token generation response:", data.error_en || data.error);
                window.open(serverUrl, "_blank");
                if (onError) onError(data);
                return;
            }
            const url = `${serverUrl}/auth/auto-login?ott=${data.one_time_token}`;
            const win = window.open(url, "_blank");
            if (win && onSuccess) {
                onSuccess(data, url);
            }
        } catch (e) {
            console.warn("Auto-login redirect fallback:", e);
            window.open(serverUrl, "_blank");
            if (onError) onError(e);
        } finally {
            if (triggerButton && originalBtnHTML) {
                triggerButton.innerHTML = originalBtnHTML;
                triggerButton.disabled = false;
            }
        }
    }

    getErrorMessage(s) {
        if (!s) return "حدث خطأ غير متوقع";
        const msg = s.message || s.toString();
        return {
            "Failed to fetch": this.config.ui?.texts?.errorNetwork || "فشل الاتصال بالخادم",
            "Request timeout": this.config.ui?.texts?.errorTimeout || "انتهت مهلة الطلب",
            "Invalid phone number": this.config.ui?.texts?.errorInvalid || "رقم الهاتف غير صحيح"
        }[msg] || msg;
    }

    trackEvent(name, data = {}) {
        if (this.config.analytics?.enabled) {
            try {
                if (window.gtag) window.gtag("event", name, data);
                this.log("Event tracked", { eventName: name, eventData: data });
            } catch (e) {}
        }
    }

    log(msg, data = null) {
        if (this.debugMode) console.log(`[LoyaltyManager] ${msg}`, data || "");
    }

    logError(msg, err) {
        if (this.debugMode) console.error(`[LoyaltyManager] ${msg}:`, err);
    }
}

window.LoyaltyManager = new LoyaltyManager();
if (typeof module !== "undefined" && module.exports) {
    module.exports = LoyaltyManager;
}
