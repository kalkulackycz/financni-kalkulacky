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



    function vlozListu() {

        var html =

        '<div id="cookie-lista" class="cookie-lista" style="display:none;">' +

        '<p>' +
        'Tento web používá cookies pro analýzu návštěvnosti a zlepšování služeb. ' +
        'Reklamní cookies nejsou nyní aktivní. ' +
        '<a href="zasady-ochrany-osobnich-udaju.html">' +
        'Více v zásadách ochrany osobních údajů</a>.' +
        '</p>' +

        '<div class="cookie-tlacitka">' +

        '<button id="cookie-prijmout">' +
        'Přijmout vše' +
        '</button>' +

        '<button id="cookie-odmitnout">' +
        'Odmítnout vše' +
        '</button>' +

        '<button id="cookie-nastaveni">' +
        'Nastavení cookies' +
        '</button>' +

        '</div>' +

        '</div>';


        document.body.insertAdjacentHTML(
            'beforeend',
            html
        );
    }



    function zobrazNastaveni() {

        var volba = confirm(
            'Povolit analytické cookies (Google Analytics)?'
        );


        ulozSouhlas({

            analytics: volba,

            // připraveno pro reklamy
            ads: false

        });


        if (volba) {
            loadAnalytics();
        }

    }



    document.addEventListener(
        'DOMContentLoaded',
        function () {


            vlozListu();


            var banner =
                document.getElementById(
                    'cookie-lista'
                );


            var souhlas =
                nactiSouhlas();



            if (souhlas) {


                if (souhlas.analytics) {

                    loadAnalytics();

                }


            } else {


                banner.style.display = 'flex';

            }



            document
            .getElementById('cookie-prijmout')
            .addEventListener(
                'click',
                function () {


                    ulozSouhlas({

                        analytics: true,

                        ads: false

                    });


                    banner.style.display = 'none';


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


                    banner.style.display = 'none';

                }
            );



            document
            .getElementById('cookie-nastaveni')
            .addEventListener(
                'click',
                function () {

                    zobrazNastaveni();

                    banner.style.display = 'none';

                }
            );


        }
    );


})();