(function () {

    var GA_ID = 'G-2BW708HYKH';

    function loadAnalytics() {

        if (window.gtagLoaded) return;

        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }

        window.gtag = gtag;
        window.gtagLoaded = true;

        gtag('js', new Date());

        gtag('config', GA_ID, {
            anonymize_ip: true
        });
    }


    function ulozSouhlas(nastaveni) {

        localStorage.setItem(
            'cookie-nastaveni',
            JSON.stringify(nastaveni)
        );

        // kompatibilita se starou verzí
        if (nastaveni.analytics) {
            localStorage.setItem('cookie-souhlas', 'prijato');
        } else {
            localStorage.setItem('cookie-souhlas', 'odmitnuto');
        }
    }


    function nactiSouhlas() {

        var ulozene = localStorage.getItem('cookie-nastaveni');

        if (ulozene) {

            try {
                return JSON.parse(ulozene);
            } catch (e) {
                return null;
            }
        }


        // převod starého systému
        var starySouhlas = localStorage.getItem('cookie-souhlas');

        if (starySouhlas === 'prijato') {

            var stareNastaveni = {
                analytics: true,
                ads: false
            };

            ulozSouhlas(stareNastaveni);

            return stareNastaveni;
        }


        if (starySouhlas === 'odmitnuto') {

            var odmitnuto = {
                analytics: false,
                ads: false
            };

            ulozSouhlas(odmitnuto);

            return odmitnuto;
        }


        return null;
    }



    function vlozModal() {

        var html =

        '<div id="cookie-overlay" class="cookie-overlay" style="display:none;">' +

        '<div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-nadpis">' +

        '<h2 id="cookie-nadpis">Cookies na tomto webu</h2>' +

        '<p>' +
        'Používáme cookies pro <strong>analytiku návštěvnosti (Google Analytics)</strong> ' +
        'a <strong>zobrazování reklam (Google AdSense)</strong>. ' +
        'Web funguje v obou případech. ' +
        '<a href="/ochrana-soukromi.html">Zásady ochrany osobních údajů</a>.' +
        '</p>' +

        '<div id="cookie-vrstva1">' +

        '<div class="cookie-tlacitka">' +

        '<button id="cookie-prijmout" class="cookie-btn-souhlas">' +
        'Souhlasím' +
        '</button>' +

        '<button id="cookie-odmitnout" class="cookie-btn-odmitnout">' +
        'Odmítnout' +
        '</button>' +

        '</div>' +

        '<button type="button" id="cookie-podrobne" class="cookie-podrobne-odkaz">' +
        'Podrobné nastavení' +
        '</button>' +

        '</div>' +

        '<div id="cookie-vrstva2" style="display:none;">' +

        '<label class="cookie-prepinac">' +
        '<input type="checkbox" id="cookie-toggle-analytika" checked>' +
        '<span>Analytika (Google Analytics)</span>' +
        '</label>' +

        '<label class="cookie-prepinac">' +
        '<input type="checkbox" id="cookie-toggle-reklamy">' +
        '<span>Reklamy (Google AdSense)</span>' +
        '</label>' +

        '<button type="button" id="cookie-ulozit" class="cookie-btn-souhlas cookie-btn-ulozit">' +
        'Uložit nastavení' +
        '</button>' +

        '</div>' +

        '</div>' +

        '</div>';

        document.body.insertAdjacentHTML(
            'beforeend',
            html
        );
    }



    function otevriModal(modal) {

        modal.style.display = 'flex';

        document.body.style.overflow = 'hidden';

        document
        .getElementById('cookie-prijmout')
        .focus();
    }


    function zavriModal(modal) {

        modal.style.display = 'none';

        document.body.style.overflow = '';
    }




    document.addEventListener(
        'DOMContentLoaded',
        function () {


            vlozModal();


            var overlay =
                document.getElementById(
                    'cookie-overlay'
                );


            var souhlas =
                nactiSouhlas();



            if (souhlas) {


                if (souhlas.analytics) {

                    loadAnalytics();

                }


            } else {


                otevriModal(overlay);

            }



            document
            .getElementById('cookie-prijmout')
            .addEventListener(
                'click',
                function () {


                    // TODO: až bude AdSense schválen, změnit výchozí hodnotu ads na true při souhlasu (nebo navázat na přepínač z druhé vrstvy)
                    ulozSouhlas({

                        analytics: true,

                        ads: false

                    });


                    zavriModal(overlay);


                    loadAnalytics();

                }
            );



            document
            .getElementById('cookie-odmitnout')
            .addEventListener(
                'click',
                function () {


                    ulozSouhlas({

                        analytics: false,

                        ads: false

                    });


                    zavriModal(overlay);

                }
            );



            document
            .getElementById('cookie-podrobne')
            .addEventListener(
                'click',
                function () {

                    document
                    .getElementById('cookie-vrstva1')
                    .style.display = 'none';

                    document
                    .getElementById('cookie-vrstva2')
                    .style.display = 'block';

                    document
                    .getElementById('cookie-toggle-analytika')
                    .focus();

                }
            );



            document
            .getElementById('cookie-ulozit')
            .addEventListener(
                'click',
                function () {

                    var analytika =
                        document.getElementById('cookie-toggle-analytika').checked;

                    var reklamy =
                        document.getElementById('cookie-toggle-reklamy').checked;


                    // TODO: až bude AdSense schválen, změnit výchozí hodnotu ads na true při souhlasu (nebo navázat na přepínač z druhé vrstvy)
                    ulozSouhlas({

                        analytics: analytika,

                        ads: reklamy

                    });


                    zavriModal(overlay);


                    if (analytika) {
                        loadAnalytics();
                    }

                }
            );


        }
    );



})();
