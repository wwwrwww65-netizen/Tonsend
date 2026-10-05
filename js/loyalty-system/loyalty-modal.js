window.LoyaltyModal = {
    modalElement: null,
    contentContainer: null,

    init() {
        if (!this.modalElement) {
            this.modalElement = document.createElement("div");
            this.modalElement.className = "loyalty-modal";
            this.modalElement.innerHTML = `
                <div class="loyalty-modal-content">
                    <button class="loyalty-modal-close" onclick="window.LoyaltyModal.close()">×</button>
                    <div id="loyalty-dynamic-content" class="glass-premium"></div>
                </div>
            `;
            document.body.appendChild(this.modalElement);
            this.contentContainer = this.modalElement.querySelector("#loyalty-dynamic-content");
            this.modalElement.addEventListener("click", (e) => {
                if (e.target === this.modalElement) {
                    this.close();
                }
            });
        }
    },

    open() {
        this.init();
        this.showLoginView();
        this.modalElement.classList.add("active");
        if (window.ModalScrollLock) window.ModalScrollLock.lock();
        else document.body.style.overflow = "hidden";
    },

    close() {
        if (this.modalElement) {
            this.modalElement.classList.remove("active");
        }
        if (window.ModalScrollLock) window.ModalScrollLock.unlock();
        else document.body.style.overflow = "";
    },

    showToast(message, type = "info", duration = 4000) {
        let container = document.getElementById("loyalty-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "loyalty-toast-container";
            container.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 100001; display: flex; flex-direction: column; gap: 10px; pointer-events: none;`;
            document.body.appendChild(container);
        }

        const styles = {
            error: { icon: "❌", bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "#f87171" },
            success: { icon: "✅", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "#34d399" },
            warning: { icon: "⚠️", bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", border: "#fbbf24" },
            info: { icon: "ℹ️", bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", border: "#60a5fa" }
        };

        const { icon, bg, border } = styles[type] || styles.info;
        const toast = document.createElement("div");
        toast.className = "loyalty-toast";
        toast.style.cssText = `background: ${bg}; border: 1px solid ${border}; border-radius: 12px; padding: 15px 20px; color: white; font-size: 14px; font-weight: 500; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); display: flex; align-items: center; gap: 10px; pointer-events: auto; animation: toastSlideIn 0.3s ease-out; max-width: 90vw; text-align: center;`;
        toast.innerHTML = `<span style="font-size: 20px;">${icon}</span><span>${message}</span>`;

        if (!document.getElementById("loyalty-toast-styles")) {
            const style = document.createElement("style");
            style.id = "loyalty-toast-styles";
            style.textContent = `
                @keyframes toastSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes toastSlideOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = "toastSlideOut 0.3s ease-out forwards";
            setTimeout(() => { toast.remove(); }, 300);
        }, duration);
    },

    showLoginView() {
        if (!this.contentContainer) return;
        const regUrl = (window.LoyaltyConfig && window.LoyaltyConfig.api && window.LoyaltyConfig.api.baseURL) 
            ? `${window.LoyaltyConfig.api.baseURL}/auth/register` 
            : "https://tunisnet.shabakaty.site/auth/register";

        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">تسجيل الدخول</h2>
                <p style="font-size: 0.9em;" class="text-text-secondary">قم بادخال بيانات حسابك</p>
            </div>
            <div class="loyalty-modal-body">
                <form id="loyalty-login-form" onsubmit="window.LoyaltyModal.handleLoginSubmit(event)">
                    <div class="loyalty-form-group">
                        <label class="loyalty-form-label text-text-secondary">رقم الهاتف</label>
                        <input type="tel" id="loyalty-phone-input" class="flex h-10 w-full rounded-md border-input px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm text-center border-0 placeholder:text-text-muted" placeholder="7xxxxxxxx" required>
                        <label class="loyalty-form-label text-text-secondary">كلمة السر</label>
                        <input type="password" id="loyalty-password-input" class="flex h-10 w-full rounded-md border-input px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm text-center border-0 placeholder:text-text-muted" placeholder="********" required>
                    </div>
                    <button type="submit" class="loyalty-btn bg-gradient-primary" id="loyalty-submit-btn">الدخول</button>
                    <div style="margin-top: 15px; text-align: center;">
                        <span class="text-text-secondary">اذا لم تنشئ حساب من قبل؟ </span>
                        <a href="${regUrl}" onclick="window.LoyaltyModal.go_to_registar_page(); return false;" style="color: #38bdf8; font-weight: bold; text-decoration: none;">قم بانشاء حساب جديد</a>
                    </div>
                    <div id="loyalty-message"></div>
                </form>
            </div>
        `;
        setTimeout(() => {
            const input = document.getElementById("loyalty-phone-input");
            if (input) input.focus();
        }, 100);
    },

    go_to_registar_page() {
        const url = (window.LoyaltyConfig && window.LoyaltyConfig.api && window.LoyaltyConfig.api.baseURL)
            ? `${window.LoyaltyConfig.api.baseURL}/auth/register`
            : "https://tunisnet.shabakaty.site/auth/register";
        
        if (typeof window.showRedirectLoader === 'function') {
            window.showRedirectLoader({
                url: url,
                title: "جاري الانتقال لصفحة إنشاء الحساب...",
                subtitle: "يتم تحويلك إلى بوابة التسجيل الرسمية في شبكتي لنظام النقاط"
            });
        } else {
            window.location.href = url;
        }
    },

    go_to_home() {
        const url = (window.LoyaltyConfig && window.LoyaltyConfig.api && window.LoyaltyConfig.api.baseURL)
            ? `${window.LoyaltyConfig.api.baseURL}/home`
            : "https://tunisnet.shabakaty.site/home";
        window.location.href = url;
    },

    async handleLoginSubmit(e) {
        e.preventDefault();
        const phone = document.getElementById("loyalty-phone-input").value.trim();
        const password = document.getElementById("loyalty-password-input").value;
        const btn = document.getElementById("loyalty-submit-btn");
        const msg = document.getElementById("loyalty-message");
        this._processForm(btn, msg, async () => {
            return await window.LoyaltyManager.login(phone, password);
        });
    },

    async _processForm(btn, msgEl, action) {
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = "جاري الدخول...";
        btn.classList.add("loyalty-btn-loading");
        msgEl.innerHTML = "";

        try {
            if (!window.LoyaltyManager) throw new Error("النظام غير محمل");
            const result = await action();
            if (result.success) {
                msgEl.className = "loyalty-success";
                msgEl.textContent = result.message || "تم تسجيل الدخول بنجاح!";
                setTimeout(() => {
                    this.close();
                    msgEl.textContent = "";
                }, 1200);
            } else {
                msgEl.className = "loyalty-error";
                msgEl.textContent = result.error || "فشل تسجيل الدخول";
            }
        } catch (err) {
            console.error("Error:", err);
            msgEl.className = "loyalty-error";
            msgEl.textContent = err.message || "حدث خطأ غير متوقع";
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.classList.remove("loyalty-btn-loading");
        }
    },

    async showLoanModal() {
        this.init();
        this.modalElement.classList.add("active");
        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">سلفني</h2>
                <p class="text-text-secondary" style="font-size: 0.9em;">طلب سلفة</p>
            </div>
            <div class="loyalty-modal-body text-center">
                <div class="loader"></div>
                <p class="text-text-secondary">جاري تحميل الخيارات...</p>
            </div>
        `;
        try {
            const res = await window.LoyaltyManager.getLoanOptions();
            if (res.success) {
                this.renderLoanOptions(res.data);
            } else {
                this.showError(res.error || "فشل في تحميل خيارات السلفة");
            }
        } catch (err) {
            this.showError("حدث خطأ في الاتصال");
        }
    },

    renderLoanOptions(data) {
        const canRequest = data.can_request_loan;
        const hasActive = data.has_active_loan;
        const loanEnabled = data.loan_enabled;
        const reward = data.reward;
        const pointCost = data.point_cost;
        const userPoints = data.user_points;

        if (!loanEnabled) {
            this.contentContainer.innerHTML = `
                <div class="loyalty-modal-header">
                    <h2 class="text-text-primary">سلفني</h2>
                </div>
                <div class="loyalty-modal-body text-center">
                    <div style="color: #fbbf24; font-size: 48px; margin-bottom: 15px;">⚠️</div>
                    <p class="text-text-secondary">خدمة السلفة غير متاحة حالياً</p>
                    <button type="button" class="loyalty-btn bg-gradient-primary" onclick="window.LoyaltyModal.close()" style="margin-top: 20px;">إغلاق</button>
                </div>
            `;
            return;
        }

        if (hasActive && data.active_loan) {
            this.contentContainer.innerHTML = `
                <div class="loyalty-modal-header">
                    <h2 class="text-text-primary">سلفني</h2>
                </div>
                <div class="loyalty-modal-body text-center">
                    <div style="color: #ef4444; font-size: 48px; margin-bottom: 15px;">📋</div>
                    <p class="text-text-secondary" style="margin-bottom: 15px;">لديك سلفة نشطة حالياً</p>
                    <div style="background: #0d213780; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <p style="color: #fbbf24;">يجب سداد السلفة الحالية قبل طلب سلفة جديدة</p>
                    </div>
                    <button type="button" class="loyalty-btn bg-gradient-primary" onclick="window.LoyaltyModal.close()" style="margin-top: 10px;">إغلاق</button>
                </div>
            `;
            return;
        }

        const thresholdMsg = data.threshold_message || "";
        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">سلفني</h2>
                <p class="text-text-secondary" style="font-size: 0.9em;">رصيدك الحالي: <span style="color: #fbbf24; font-weight: bold;">${userPoints}</span> نقطة</p>
            </div>
            <div class="loyalty-modal-body">
                <div class="loan-card" style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); border: 1px solid #374151; border-radius: 12px; padding: 20px; text-align: center;">
                    ${reward ? `<p style="color: #fbbf24; font-weight: bold; font-size: 1.1em; margin-bottom: 10px;">${reward.name}</p>${reward.description ? `<p style="color: #6b7280; font-size: 0.8em; margin-bottom: 15px;">${reward.description}</p>` : ""}` : ""}
                    <div style="background: #0d213780; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <span style="color: #9ca3af;">تكلفة السلفة:</span>
                        <span style="color: #ef4444; font-weight: bold; font-size: 1.2em;"> ${pointCost} نقطة</span>
                    </div>
                    ${thresholdMsg ? `<p style="color: #fbbf24; font-size: 0.85em; margin-bottom: 15px;">${thresholdMsg}</p>` : ""}
                    <button type="button" class="loan-request-btn loyalty-btn ${canRequest ? "bg-gradient-primary" : ""}" id="loan-request-btn" data-reward-id="${reward ? reward.id : ""}" data-point-cost="${pointCost}" ${canRequest ? "" : "disabled"} style="width: 100%; padding: 12px; font-size: 1em;">
                        ${canRequest ? "🎁 طلب السلفة" : "❌ السلفة غير متاحة"}
                    </button>
                    ${canRequest ? "" : `<p style="color: #ef4444; font-size: 0.8em; margin-top: 10px;">${data.available_cards ? "" : "لا توجد كروت متاحة حالياً"}</p>`}
                </div>
                <div id="loan-message" style="margin-top: 10px;"></div>
            </div>
        `;

        const btn = this.contentContainer.querySelector("#loan-request-btn");
        if (btn && canRequest) {
            btn.addEventListener("click", () => {
                const rId = parseInt(btn.dataset.rewardId);
                const cost = parseInt(btn.dataset.pointCost);
                this.handleLoanSubmit(rId, cost);
            });
        }
    },

    async handleLoanSubmit(rewardId, pointCost) {
        const btn = this.contentContainer.querySelector("#loan-request-btn");
        const originalText = btn ? btn.textContent : "";
        if (btn) {
            btn.disabled = true;
            btn.textContent = "جاري الطلب...";
        }

        try {
            const res = await window.LoyaltyManager.requestLoan(rewardId);
            if (res.success) {
                this.showResultModal("loan", res.data);
            } else {
                const msg = res.message || res.error || "فشل طلب السلفة";
                this.showToast(msg, "error", 5000);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            }
        } catch (err) {
            const msg = err.message || "حدث خطأ في الاتصال";
            this.showToast(msg, "error", 5000);
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
    },

    async showBuyCardModal() {
        this.init();
        this.modalElement.classList.add("active");
        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">استبدال كرت</h2>
                <p class="text-text-secondary" style="font-size: 0.9em;">استبدل نقاطك بكرت</p>
            </div>
            <div class="loyalty-modal-body text-center">
                <div class="loader"></div>
                <p class="text-text-secondary">جاري تحميل الكروت المتاحة...</p>
            </div>
        `;

        try {
            const res = await window.LoyaltyManager.getCardTypes();
            if (res.success) {
                const points = res.data.user_points || window.LoyaltyManager.getPoints();
                this.renderCardTypes(res.data.rewards, points);
            } else {
                this.showError(res.error || "فشل في تحميل أنواع الكروت");
            }
        } catch (err) {
            this.showError("حدث خطأ في الاتصال");
        }
    },

    renderCardTypes(rewards, userPoints) {
        const listHtml = rewards.map((item) => {
            const canRedeem = item.can_redeem !== undefined ? item.can_redeem : userPoints >= item.points_required;
            return `
                <div class="card-type-item ${canRedeem ? "" : "disabled"}">
                    <div class="card-info">
                        <span class="card-name">${item.name}</span>
                        <span class="card-value">${item.category_name || ""}</span>
                        ${item.description ? `<span class="card-desc" style="font-size: 0.75em; color: #9ca3af;">${item.description}</span>` : ""}
                    </div>
                    <div class="card-points">${item.points_required} نقطة</div>
                    <button type="button" class="buy-card-btn" data-id="${item.id}" data-type="${item.name}" data-points="${item.points_required}" ${canRedeem ? "" : "disabled"}>
                        ${canRedeem ? "شراء" : "غير متاح"}
                    </button>
                </div>
            `;
        }).join("");

        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">استبدال كرت</h2>
                <p class="text-text-secondary" style="font-size: 0.9em;">رصيدك الحالي: <span style="color: #fbbf24; font-weight: bold;">${userPoints}</span> نقطة</p>
            </div>
            <div class="loyalty-modal-body">
                <div class="card-types-list">${listHtml}</div>
                <div id="buy-card-message"></div>
            </div>
        `;

        this.contentContainer.querySelectorAll(".buy-card-btn").forEach((b) => {
            b.addEventListener("click", () => {
                const id = parseInt(b.dataset.id);
                const type = b.dataset.type;
                const points = parseInt(b.dataset.points);
                this.handleBuyCardSubmit(id, type, points, b);
            });
        });
    },

    async handleBuyCardSubmit(rewardId, cardType, points, btn) {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري الشراء...";

        try {
            const res = await window.LoyaltyManager.buyCard(rewardId, cardType, points);
            if (res.success) {
                this.showResultModal("card", res.data);
            } else {
                const msg = res.message || res.error || "فشل شراء الكرت";
                this.showToast(msg, "error", 5000);
                btn.disabled = false;
                btn.textContent = originalText;
            }
        } catch (err) {
            const msg = err.message || "حدث خطأ في الاتصال";
            this.showToast(msg, "error", 5000);
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    showResultModal(type, data) {
        this.saveCardToStorage(type, data);
        const hasPass = data.card_password && data.card_password.trim() !== "";
        const title = data.reward_name || "";

        const codeContent = hasPass
            ? `
                <div class="card-code-container">
                    ${title ? `<p class="text-text-primary" style="margin-bottom: 15px; font-weight: bold;">${title}</p>` : ""}
                    <div class="credential-item" style="margin-bottom: 12px;">
                        <p class="text-text-secondary" style="margin-bottom: 5px; font-size: 0.9em;">👤 اسم المستخدم:</p>
                        <div class="card-code" id="generated-username" onclick="window.LoyaltyModal.selectAndCopy(this)" style="font-size: 16px;">${data.card_code}</div>
                    </div>
                    <div class="credential-item">
                        <p class="text-text-secondary" style="margin-bottom: 5px; font-size: 0.9em;">🔑 كلمة المرور:</p>
                        <div class="card-code" id="generated-password" onclick="window.LoyaltyModal.selectAndCopy(this)" style="font-size: 16px;">${data.card_password}</div>
                    </div>
                    <p class="text-text-muted" style="font-size: 0.75em; margin-top: 10px;">اضغط على أي حقل لتحديده ونسخه</p>
                </div>
            `
            : `
                <div class="card-code-container">
                    ${title ? `<p class="text-text-primary" style="margin-bottom: 15px; font-weight: bold;">${title}</p>` : ""}
                    <p class="text-text-secondary" style="margin-bottom: 10px;">رمز الكرت:</p>
                    <div class="card-code" id="generated-card-code" onclick="window.LoyaltyModal.selectAndCopy(this)">${data.card_code}</div>
                    <p class="text-text-muted" style="font-size: 0.75em; margin-top: 5px;">اضغط على الرمز لتحديده ونسخه</p>
                </div>
            `;

        const newBal = data.new_balance !== undefined ? data.new_balance : data.remaining_points;
        const usedPoints = data.points_used !== undefined ? data.points_used : data.point_cost;

        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header result-success">
                <div class="result-icon">${type === "loan" ? "💰" : "🎉"}</div>
                <h2 class="text-text-primary">${type === "loan" ? "تم طلب السلفة بنجاح!" : "تم شراء الكرت بنجاح!"}</h2>
            </div>
            <div class="loyalty-modal-body text-center">
                ${codeContent}
                <div class="save-confirmation" style="background: #10b98120; border: 1px solid #10b981; border-radius: 8px; padding: 10px; margin-top: 10px;">
                    <span style="color: #10b981;">✅ تم حفظ الكرت تلقائياً</span>
                </div>
                <p class="text-text-muted" style="font-size: 0.85em; margin-top: 15px;">
                    ${usedPoints ? `النقاط المستخدمة: ${usedPoints}<br>` : ""}
                    ${newBal !== undefined ? `الرصيد المتبقي: ${newBal}` : ""}
                </p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" class="loyalty-btn" onclick="window.LoyaltyModal.showSavedCards()" style="flex: 1;">📋 الكروت المحفوظة</button>
                    <button type="button" class="loyalty-btn bg-gradient-primary" onclick="window.LoyaltyModal.close()" style="flex: 1;">إغلاق</button>
                </div>
            </div>
        `;
    },

    selectAndCopy(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try {
            document.execCommand("copy");
            el.style.background = "#10b98140";
            setTimeout(() => { el.style.background = ""; }, 500);
        } catch (e) {}
    },

    copyCardCode() {
        const el = document.getElementById("generated-card-code");
        if (el) this.selectAndCopy(el);
    },

    saveCardToStorage(type, data) {
        const hasPass = data.card_password && data.card_password.trim() !== "";
        const item = {
            type: type,
            has_password: hasPass,
            code: data.card_code || null,
            password: hasPass ? data.card_password : null,
            reward_name: data.reward_name || null,
            points_used: data.points_used || data.point_cost || null,
            remaining_points: data.new_balance || data.remaining_points || null,
            created_at: new Date().toISOString()
        };

        try {
            let list = this.getSavedCards();
            list.unshift(item);
            if (list.length > 50) list = list.slice(0, 50);
            localStorage.setItem("loyalty_saved_cards", JSON.stringify(list));
        } catch (e) {
            console.error("[LoyaltyModal] Failed to save card:", e);
        }
    },

    getSavedCards() {
        try {
            const raw = localStorage.getItem("loyalty_saved_cards");
            if (!raw) return [];
            let cards = JSON.parse(raw);
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            cards = cards.filter(c => new Date(c.created_at).getTime() > weekAgo);
            localStorage.setItem("loyalty_saved_cards", JSON.stringify(cards));
            return cards;
        } catch (e) {
            return [];
        }
    },

    showSavedCards() {
        this.init();
        this.modalElement.classList.add("active");
        if (window.ModalScrollLock) window.ModalScrollLock.lock();
        else document.body.style.overflow = "hidden";
        const list = this.getSavedCards();

        if (list.length === 0) {
            this.contentContainer.innerHTML = `
                <div class="loyalty-modal-header">
                    <h2 class="text-text-primary">الكروت المحفوظة</h2>
                </div>
                <div class="loyalty-modal-body text-center">
                    <p class="text-text-muted">لا توجد كروت محفوظة</p>
                    <button type="button" class="loyalty-btn" onclick="window.LoyaltyModal.close()" style="margin-top: 20px;">إغلاق</button>
                </div>
            `;
            return;
        }

        const cardsHtml = list.map((item) => {
            const hasPass = item.has_password || item.credential_type === "credentials";
            return `
                <div class="saved-card-item" style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); border: 1px solid #374151; border-radius: 12px; padding: 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #fbbf24; font-weight: bold;">${item.type === "loan" ? "💰 سلفة" : "🎟️ كرت"}${hasPass ? " (حساب)" : ""}</span>
                        <span style="color: #9ca3af; font-size: 0.8em;">${new Date(item.created_at).toLocaleDateString("ar-SA")}</span>
                    </div>
                    ${hasPass && item.code && item.password ? `
                        ${item.reward_name ? `<div style="color: #fbbf24; font-size: 0.85em; margin-bottom: 8px;">${item.reward_name}</div>` : ""}
                        <div style="margin-bottom: 6px;">
                            <span style="color: #9ca3af; font-size: 0.8em;">👤 </span>
                            <span class="card-code" onclick="window.LoyaltyModal.selectAndCopy(this)" style="background: #0d213780; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; display: inline-block;">${item.code}</span>
                        </div>
                        <div>
                            <span style="color: #9ca3af; font-size: 0.8em;">🔑 </span>
                            <span class="card-code" onclick="window.LoyaltyModal.selectAndCopy(this)" style="background: #0d213780; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; display: inline-block;">${item.password}</span>
                        </div>
                    ` : `
                        ${item.reward_name ? `<div style="color: #fbbf24; font-size: 0.85em; margin-bottom: 8px;">${item.reward_name}</div>` : ""}
                        <div class="card-code" onclick="window.LoyaltyModal.selectAndCopy(this)" style="background: #0d213780; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 14px;">${item.code || item.username || "---"}</div>
                    `}
                    ${item.amount ? `<div style="color: #9ca3af; font-size: 0.8em; margin-top: 5px;">المبلغ: ${item.amount} ريال</div>` : ""}
                    ${item.points_used ? `<div style="color: #9ca3af; font-size: 0.8em; margin-top: 5px;">النقاط: ${item.points_used}</div>` : ""}
                </div>
            `;
        }).join("");

        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">الكروت المحفوظة</h2>
                <p class="text-text-secondary" style="font-size: 0.9em;">اضغط على أي رمز لتحديده ونسخه</p>
            </div>
            <div class="loyalty-modal-body" style="max-height: 400px; overflow-y: auto;">${cardsHtml}</div>
            <div style="padding: 0 24px 24px; display: flex; gap: 10px;">
                <button type="button" class="loyalty-btn" onclick="window.LoyaltyModal.clearSavedCards()" style="flex: 1; background: #ef4444;">🗑️ مسح الكل</button>
                <button type="button" class="loyalty-btn bg-gradient-primary" onclick="window.LoyaltyModal.close()" style="flex: 1;">إغلاق</button>
            </div>
        `;
    },

    clearSavedCards() {
        if (confirm("هل أنت متأكد من حذف جميع الكروت المحفوظة؟")) {
            try {
                localStorage.removeItem("loyalty_saved_cards");
                this.showSavedCards();
            } catch (e) {
                console.error("Failed to clear cards");
            }
        }
    },

    showError(msg) {
        this.contentContainer.innerHTML = `
            <div class="loyalty-modal-header">
                <h2 class="text-text-primary">خطأ</h2>
            </div>
            <div class="loyalty-modal-body text-center">
                <div class="loyalty-error">${msg}</div>
                <button type="button" class="loyalty-btn" onclick="window.LoyaltyModal.close()" style="margin-top: 20px;">إغلاق</button>
            </div>
        `;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = window.LoyaltyModal;
}
