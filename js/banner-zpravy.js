(function () {
    var zpravy = [
        "<b>Novinka:</b> Měnová kalkulačka s kurzovním lístkem ČNB už je tady.",
        "<b>Vybíráme další:</b> Kalkulačku DPH – přepočet částek s DPH i bez DPH.",
        "<b>Plánujeme:</b> Kalkulačka úroků z prodlení – výpočet penále z nezaplacené faktury.",
        "<b>Chybí vám nějaká kalkulačka?</b> Napište nám."
    ];
    var el = document.getElementById("bannerZprava");
    if (!el) return;
    var index = 0;
    var interval = null;
    var snizenePohyby = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function vymen() {
        index = (index + 1) % zpravy.length;
        if (snizenePohyby) {
            el.innerHTML = zpravy[index];
            return;
        }
        el.classList.add("banner-zprava--opousti");
        setTimeout(function () {
            el.innerHTML = zpravy[index];
            el.classList.remove("banner-zprava--opousti");
        }, 350);
    }

    function spust() {
        interval = setInterval(vymen, 7000);
    }

    function zastav() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }

    var banner = el.closest(".banner-vyvoj");
    if (banner) {
        banner.addEventListener("mouseenter", zastav);
        banner.addEventListener("mouseleave", spust);
    }

    spust();
})();

