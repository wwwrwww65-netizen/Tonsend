const MarqueeBanner = (function () {

    let containerEl = null;
    let bannerEl = null;
    let textEl = null;

    function createBanner() {
        bannerEl = document.createElement("div");
        bannerEl.className = "marquee-banner";
        bannerEl.style.width = "100%";
        bannerEl.style.height = "31px";
        bannerEl.style.overflow = "hidden";
        bannerEl.style.position = "relative";
        bannerEl.style.background = "#cf3a3aff";
        bannerEl.style.borderRadius = "8px";
        bannerEl.style.padding = "5px 0";

        textEl = document.createElement("div");
        textEl.className = "marquee-text";
        textEl.style.whiteSpace = "nowrap";
        textEl.style.position = "absolute";
        textEl.style.left = "-100%";  // يبدأ من اليسار خارج الإطار
        textEl.style.fontSize = "14px";
        textEl.style.fontWeight = "bold";
    
        textEl.style.paddingLeft = "20px";

        bannerEl.appendChild(textEl);
        containerEl.appendChild(bannerEl);

        startAnimation();
    }

    function startAnimation() {
        function animate() {
            const containerWidth = bannerEl.offsetWidth;
            const textWidth = textEl.offsetWidth;

            let position = -textWidth-650; // يبدأ خارج الإطار من اليسار

            function frame() {
                position += 1.3; // ← الحركة الآن تتجه لليمين

                textEl.style.left = position + "px";

                // إذا خرج النص خارج اليمين، يرجع للبداية
                if (position > containerWidth) {
                    position = -textWidth-650;
                }

                requestAnimationFrame(frame);
            }

            frame();
        }

        animate();
    }

    function show(text, options = {}) {
        const {
            selector = ".banner-container",
            background = "rgb(184, 24, 24)",
            color = "#fff",
        } = options;

        containerEl = document.querySelector(selector);

        if (!containerEl) {
            console.warn("Container not found! Creating one automatically");
            containerEl = document.createElement("div");
            containerEl.className = selector.replace(".", "");
            document.body.appendChild(containerEl);
        }

        if (bannerEl) {
            bannerEl.remove();
            bannerEl = null;
        }

        createBanner();

        bannerEl.style.background = background;
        textEl.style.color = color;
        textEl.innerText = text;
    }

    function hide() {
        if (bannerEl) {
            bannerEl.remove();
            bannerEl = null;
        }
    }

    return { show, hide };

})();
