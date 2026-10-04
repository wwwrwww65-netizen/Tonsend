/**
 * احتياطي محلي — يُعرض عند فشل تحميل تطبيق المنصة من المصدر الأساسي.
 * ملف واحد: منطق + تنسيق مضمّن.
 */
(function showFallback() {
    if (window.__ZL_APP_READY__ || window.__ZL_FALLBACK__) return;
    window.__ZL_FALLBACK__ = true;

    if (window.__ZL_BOOT__) {
        clearTimeout(window.__ZL_BOOT__);
        window.__ZL_BOOT__ = null;
    }

    const css = `
        .zl-fallback {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: grid;
            place-items: center;
            padding: 24px;
            background:
                radial-gradient(ellipse 80% 50% at 50% -10%, rgba(15, 155, 142, 0.22), transparent 55%),
                #0f1419;
            color: #e8eef2;
            font-family: Tahoma, "Segoe UI", sans-serif;
            text-align: center;
            direction: rtl;
        }
        .zl-fallback__card {
            max-width: 420px;
            width: 100%;
        }
        .zl-fallback__brand {
            margin: 0 0 20px;
            font-size: 1.75rem;
            font-weight: 800;
            letter-spacing: 0.02em;
        }
        .zl-fallback__brand span {
            color: #0f9b8e;
        }
        .zl-fallback__title {
            margin: 0 0 10px;
            font-size: 1.15rem;
            font-weight: 700;
        }
        .zl-fallback__text {
            margin: 0 0 22px;
            font-size: 0.95rem;
            line-height: 1.6;
            color: rgba(232, 238, 242, 0.78);
        }
        .zl-fallback__btn {
            border: 0;
            border-radius: 10px;
            padding: 12px 22px;
            background: #0f9b8e;
            color: #fff;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }
        .zl-fallback__btn:hover {
            filter: brightness(1.08);
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    const root = document.createElement('div');
    root.className = 'zl-fallback';
    root.setAttribute('role', 'alert');
    root.innerHTML = `
        <div class="zl-fallback__card">
            <p class="zl-fallback__brand">Zero<span>LAG</span></p>
            <h1 class="zl-fallback__title">تعذر تحميل المنصة</h1>
            <p class="zl-fallback__text">
                هناك مشكلة في جلب ملفات التطبيق.
                تحقق من الاتصال أو حاول مرة أخرى بعد قليل.
            </p>
            <button type="button" class="zl-fallback__btn">إعادة المحاولة</button>
        </div>
    `;
    root.querySelector('.zl-fallback__btn').addEventListener('click', () => {
        location.reload();
    });
    document.body.appendChild(root);
})();
