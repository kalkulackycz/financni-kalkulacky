(function () {
    var GA_ID = 'G-2BW708HYKH';

    function loadAnalytics() {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_ID);
    }

    function vlozListu() {
        var html =
            '<div id="cookie-lista" class="cookie-lista" style="display:none;">' +
            '  <p>Tento web používá cookies pro analýzu návštěvnosti (Google Analytics). Více v ' +
            '     <a href="zasady-ochrany-osobnich-udaju.html">zásadách ochrany osobních údajů</a>.</p>' +
            '  <div class="cookie-tlacitka">' +
            '    <button id="cookie-prijmout">Přijmout</button>' +
            '    <button id="cookie-odmitnout">Odmítnout</button>' +
            '  </div>' +
            '</div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    document.addEventListener('DOMContentLoaded', function () {
        vlozListu();

        var souhlas = localStorage.getItem('cookie-souhlas');
        var banner = document.getElementById('cookie-lista');

        if (souhlas === 'prijato') {
            loadAnalytics();
        } else if (souhlas === null) {
            banner.style.display = 'flex';
        }

        document.getElementById('cookie-prijmout').addEventListener('click', function () {
            localStorage.setItem('cookie-souhlas', 'prijato');
            banner.style.display = 'none';
            loadAnalytics();
        });

        document.getElementById('cookie-odmitnout').addEventListener('click', function () {
            localStorage.setItem('cookie-souhlas', 'odmitnuto');
            banner.style.display = 'none';
        });
    });
})();