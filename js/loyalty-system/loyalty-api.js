class LoyaltyAPI {
    constructor(config) {
        this.config = config.api;
        this.security = config.security || {};
        this.debugMode = config.development?.mode || false;
        this.cache = new Map();
        this.rateLimiter = {
            requests: [],
            maxRequests: this.security.maxRequests || 5,
            window: this.security.rateLimitWindow || 60000
        };
    }

    isJWT(token) {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
    }

    async request(endpoint, options = {}) {
        try {
            if (this.security.rateLimitEnabled && !this.canMakeRequest()) {
                throw new Error("Rate limit exceeded. Please wait.");
            }

            const url = this.config.baseURL + endpoint;
            const defaultOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Add authorization header ONLY if a valid JWT token exists
            const user = this.getUserFromStorage();
            if (user?.token && this.isJWT(user.token)) {
                finalOptions.headers["Authorization"] = `Bearer ${user.token}`;
            }

            this.log("Making request", { url, method: finalOptions.method });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 20000);

            try {
                const response = await fetch(url, {
                    ...finalOptions,
                    signal: controller.signal,
                    credentials: "omit"
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    let errorData = null;
                    let serverMessage = response.statusText;
                    try {
                        errorData = await response.json();
                        serverMessage = errorData.message || errorData.error || errorData.error_en || response.statusText;
                    } catch (e) {
                        this.log("Failed to parse error response body");
                    }

                    const error = new Error(serverMessage || `Request failed with status ${response.status}`);
                    error.status = response.status;
                    error.statusText = response.statusText;
                    error.data = errorData;

                    // Handle invalid/unauthorized token
                    if (response.status === 401 || (typeof serverMessage === 'string' && (serverMessage.includes('توكن') || serverMessage.includes('token') || serverMessage.includes('segments')))) {
                        this.log("Unauthorized or invalid token detected. Resetting session.");
                        if (window.loyaltyStorageInstance) {
                            window.loyaltyStorageInstance.clear();
                        }
                        if (window.LoyaltyManager && typeof window.LoyaltyManager.logout === 'function') {
                            window.LoyaltyManager.logout();
                        }
                    }

                    throw error;
                }

                const data = await response.json();
                this.log("Request successful", data);
                return data;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === "AbortError") {
                    throw new Error("Request timeout");
                }
                throw fetchError;
            }
        } catch (error) {
            this.log("Request status/handled:", error.message || error);
            throw error;
        }
    }

    async requestWithRetry(endpoint, options = {}, retries = this.config.retries || 0) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (retries > 0) {
                this.log(`Retrying... (${retries} attempts left)`);
                await this.delay(this.config.retryDelay || 1000);
                return this.requestWithRetry(endpoint, options, retries - 1);
            }
            throw error;
        }
    }

    async register(phone, username, password) {
        try {
            const formattedPhone = this.sanitizePhone(phone);
            return await this.requestWithRetry(this.config.endpoints.register, {
                method: "POST",
                body: JSON.stringify({
                    username: username || formattedPhone,
                    phone: formattedPhone,
                    password: password
                })
            });
        } catch (error) {
            this.logError("Registration failed", error);
            throw error;
        }
    }

    async login(phone, password) {
        try {
            const formattedPhone = this.sanitizePhone(phone);
            return await this.requestWithRetry(this.config.endpoints.login, {
                method: "POST",
                body: JSON.stringify({
                    phone: formattedPhone,
                    password: password
                })
            });
        } catch (error) {
            this.logError("Login failed", error);
            throw error;
        }
    }

    async addPoints(couponCode) {
        try {
            if (!couponCode || !String(couponCode).trim()) {
                return { success: false, message: "رمز الكوبون مطلوب" };
            }
            return await this.requestWithRetry(this.config.endpoints.addPoints, {
                method: "POST",
                body: JSON.stringify({ coupon_code: String(couponCode).trim() })
            });
        } catch (error) {
            this.log("Add points status:", error.message || error);
            return {
                success: false,
                message: error.message || "رمز الكوبون غير موجود أو تم حذفه",
                error: error.message || "رمز الكوبون غير موجود أو تم حذفه"
            };
        }
    }

    async getUser(userId) {
        try {
            const cacheKey = `user_${userId}`;
            if (this.hasValidCache(cacheKey)) {
                this.log("Returning cached user data");
                return this.getFromCache(cacheKey);
            }
            const data = await this.requestWithRetry(`${this.config.endpoints.getUser}/${userId}`);
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            this.logError("Get user failed", error);
            throw error;
        }
    }

    async getPoints() {
        try {
            return await this.requestWithRetry(this.config.endpoints.getPoints);
        } catch (error) {
            this.logError("Get points failed", error);
            throw error;
        }
    }

    async requestLoan(rewardId) {
        try {
            if (window.LoyaltyConfig?.development?.mockAPI) {
                return this.mockRequestLoan(rewardId);
            }
            return await this.requestWithRetry(this.config.endpoints.requestLoan, {
                method: "POST",
                body: JSON.stringify({ reward_id: rewardId })
            });
        } catch (error) {
            this.logError("Request loan failed", error);
            throw error;
        }
    }

    async buyCard(rewardId, rewardName, points) {
        try {
            if (window.LoyaltyConfig?.development?.mockAPI) {
                return this.mockBuyCard(rewardId, rewardName, points);
            }
            return await this.requestWithRetry(this.config.endpoints.buyCard, {
                method: "POST",
                body: JSON.stringify({ reward_id: rewardId })
            });
        } catch (error) {
            this.logError("Buy card failed", error);
            throw error;
        }
    }

    async getLoanOptions() {
        try {
            if (window.LoyaltyConfig?.development?.mockAPI) {
                return this.mockGetLoanOptions();
            }
            return await this.requestWithRetry(this.config.endpoints.getLoanOptions);
        } catch (error) {
            this.logError("Get loan options failed", error);
            throw error;
        }
    }

    async getCardTypes() {
        try {
            if (window.LoyaltyConfig?.development?.mockAPI) {
                return this.mockGetCardTypes();
            }
            return await this.requestWithRetry(this.config.endpoints.getCardTypes);
        } catch (error) {
            this.logError("Get card types failed", error);
            throw error;
        }
    }

    mockRequestLoan(rewardId) {
        this.log("Mock: Request loan", { rewardId });
        const points = window.LoyaltyManager?.getPoints() || 0;
        return new Promise((resolve) => {
            setTimeout(() => {
                const isPassword = Math.random() > 0.5;
                const cardCode = Math.random().toString().substring(2, 10);
                const cardPassword = isPassword ? Math.random().toString().substring(2, 6) : "";
                resolve({
                    success: true,
                    message: "تهانينا! لقد حصلت على سلفة 'كرت 400 ميجا'.",
                    data: {
                        card_code: cardCode,
                        card_password: cardPassword,
                        debt_amount: 0,
                        debt_status: "unpaid",
                        point_cost: 100,
                        remaining_points: Math.max(0, points - 100),
                        reward_code: cardPassword ? `${cardCode} | كلمة المرور: ${cardPassword}` : cardCode,
                        reward_name: "كرت 400 ميجا"
                    }
                });
            }, 500);
        });
    }

    mockBuyCard(rewardId, rewardName, pointsCost) {
        this.log("Mock: Buy card", { rewardId, rewardName, points: pointsCost });
        const currentPoints = window.LoyaltyManager?.getPoints() || 0;
        return new Promise((resolve) => {
            setTimeout(() => {
                if (currentPoints >= pointsCost) {
                    const isPassword = Math.random() > 0.5;
                    const cardCode = Math.random().toString().substring(2, 10);
                    const cardPassword = isPassword ? Math.random().toString().substring(2, 6) : "";
                    const newBal = currentPoints - pointsCost;
                    resolve({
                        success: true,
                        message: `تم استبدال ${pointsCost} نقطة بنجاح!`,
                        data: {
                            card_code: cardCode,
                            card_password: cardPassword,
                            new_balance: newBal,
                            points_used: pointsCost,
                            previous_balance: currentPoints,
                            reward_name: rewardName
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        message: `نقاطك غير كافية. تحتاج ${pointsCost} نقطة ولديك ${currentPoints} نقطة فقط.`
                    });
                }
            }, 500);
        });
    }

    mockGetLoanOptions() {
        const points = window.LoyaltyManager?.getPoints() || 0;
        return Promise.resolve({
            success: true,
            data: {
                active_loan: null,
                available_cards: true,
                can_request_loan: true,
                has_active_loan: false,
                loan_enabled: true,
                min_points_threshold: null,
                point_cost: 100,
                reward: {
                    id: 1,
                    name: "كرت 400 ميجا",
                    category_name: "كرت ابو 100",
                    description: "",
                    image_url: null
                },
                threshold_message: null,
                total_positive_points: 0,
                user_points: points
            }
        });
    }

    mockGetCardTypes() {
        const points = window.LoyaltyManager?.getPoints() || 0;
        return Promise.resolve({
            success: true,
            data: {
                rewards: [
                    { id: 1, name: "كرت 400 ميجا", category_name: "كرت ابو 100", description: "", image_url: null, points_required: 90, can_redeem: points >= 90 },
                    { id: 2, name: "مكافئة 800 ميجا", category_name: "كرت ابو 500", description: "", image_url: null, points_required: 200, can_redeem: points >= 200 },
                    { id: 10, name: "كرت 500", category_name: "كرت ابو 100", description: "", image_url: null, points_required: 50, can_redeem: points >= 50 },
                    { id: 3, name: "مكافئة 2 جيجا", category_name: "كرت ابو 1000", description: "", image_url: null, points_required: 50000, can_redeem: points >= 50000 }
                ],
                user_points: points
            }
        });
    }

    sanitizePhone(phone) {
        if (!phone) return "";
        let cleaned = String(phone).replace(/[\s\-\(\)]/g, "");
        return cleaned;
    }

    canMakeRequest() {
        const now = Date.now();
        this.rateLimiter.requests = this.rateLimiter.requests.filter(time => now - time < this.rateLimiter.window);
        if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            return false;
        }
        this.rateLimiter.requests.push(now);
        return true;
    }

    saveToCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        return item ? item.data : null;
    }

    hasValidCache(key) {
        if (!this.cache.has(key)) return false;
        const item = this.cache.get(key);
        const ttl = window.LoyaltyConfig?.performance?.cacheTTL || 300000;
        return Date.now() - item.timestamp < ttl;
    }

    clearCache() {
        this.cache.clear();
        this.log("Cache cleared");
    }

    getUserFromStorage() {
        try {
            if (window.loyaltyStorageInstance) {
                return window.loyaltyStorageInstance.load();
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(msg, data = null) {
        if (this.debugMode) console.log(`[LoyaltyAPI] ${msg}`, data || "");
    }

    logError(msg, err) {
        if (this.debugMode) console.error(`[LoyaltyAPI] ${msg}:`, err);
    }
}

window.LoyaltyAPI = LoyaltyAPI;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyAPI;
}
