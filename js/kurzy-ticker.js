(function () {
    "use strict";

    // Denně generovaný kurzovní lístek ČNB (GitHub Actions), záložně open er-api
    var ZDROJ_JSON = "kurzy.json";
    var ZDROJ_ERAPI = "https://open.er-api.com/v6/latest/CZK";
    var CACHE_KLIC = "kurzTickerCache";

    // Měny v tickeru (v tomto pořadí) + české názvy
    var TICKER_MENY = ["EUR", "USD", "GBP", "CHF", "PLN", "NOK", "SEK", "DKK", "HUF", "RON", "JPY", "CNY", "CAD", "TRY", "EGP", "TND"];
    var NAZVY_MEN = {
        EUR: "Euro", USD: "Dolar USA", GBP: "Britská libra", CHF: "Švýc. frank",
        PLN: "Polský zlotý", NOK: "Norská koruna", SEK: "Švédská koruna",
        DKK: "Dánská koruna", HUF: "Maď. forint", RON: "Rumunský lei",
        JPY: "Japonský jen", CNY: "Čínský juan", CAD: "Kanadský dolar",
        TRY: "Turecká lira", EGP: "Egyptská libra", TND: "Tuniský dinar"
    };

    var pasEl = document.getElementById("kurzTickerPas");
    var datumEl = document.getElementById("kurzTickerDatum");
    var tickerEl = document.getElementById("kurzTicker");
    if (!pasEl || !datumEl || !tickerEl) return;

    function formatujDatum(iso) {
        var p = String(iso || "").split("-");
        return p.length === 3 ? p[2] + ". " + p[1] + ". " + p[0] : iso;
    }

    function jeMocStary(datum) {
        if (!datum) return false;
        return Math.floor((Date.now() - new Date(datum + "T14:30:00Z")) / 86400000) >= 2;
    }

    function nactiZCache() {
        try {
            var c = JSON.parse(localStorage.getItem(CACHE_KLIC));
            if (c && c.kurzy && (!c.datum || !jeMocStary(c.datum))) return c;
        } catch (e) { /* ignorovat */ }
        return null;
    }

    function ulozDoCache(data, poznamka) {
        try {
            localStorage.setItem(CACHE_KLIC, JSON.stringify({ kurzy: data, datum: data.__datum, poznamka: poznamka }));
        } catch (e) { /* ignorovat */ }
    }

    function zpracujJson(data) {
        if (!data || !data.kurzy || !data.kurzy.EUR) throw new Error("Neplatná data ČNB");
        var kurzy = {};
        for (var i = 0; i < TICKER_MENY.length; i++) {
            var kod = TICKER_MENY[i];
            var z = data.kurzy[kod];
            if (z && z.m > 0 && z.r > 0) kurzy[kod] = z.r / z.m;
        }
        if (!kurzy.EUR) throw new Error("Chybí EUR v datech ČNB");
        kurzy.__datum = data.datum || "";
        return kurzy;
    }

    function zpracujErApi(data) {
        if (!data || !data.rates) throw new Error("Neplatná data er-api");
        var kurzy = {};
        for (var i = 0; i < TICKER_MENY.length; i++) {
            var hodnota = data.rates[TICKER_MENY[i]];
            if (hodnota && hodnota > 0) kurzy[TICKER_MENY[i]] = 1 / hodnota;
        }
        if (!kurzy.EUR) throw new Error("Chybí EUR v datech er-api");
        kurzy.__datum = "";
        return kurzy;
    }

    function fetchSLimitom(url, ms) {
        var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        var casovac = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
        return fetch(url, ctrl ? { signal: ctrl.signal } : {}).finally(function () { clearTimeout(casovac); });
    }

    function vykresli(kurzy) {
        var casti = [];
        for (var i = 0; i < TICKER_MENY.length; i++) {
            var kod = TICKER_MENY[i];
            if (!(kod in kurzy)) continue;
            var hodnota = kurzy[kod].toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
            casti.push('<span class="kurz-ticker-hodnota"><b>' + kod + '</b><i>' + (NAZVY_MEN[kod] || "") + "</i><em>" + hodnota + " Kč</em></span>");
        }
        if (!casti.length) {
            tickerEl.style.display = "none";
            return;
        }
        // obsah 2× za sebou kvůli plynulé nekonečné smyčce posunu
        var pas = casti.join("");
        pasEl.innerHTML = '<span class="kurz-ticker-skupina">' + pas + '</span><span class="kurz-ticker-skupina" aria-hidden="true">' + pas + "</span>";
        if (kurzy.__datum) datumEl.textContent = "k " + formatujDatum(kurzy.__datum);
    }

    function nactiKurzy() {
        var cache = nactiZCache();

        fetchSLimitom(ZDROJ_JSON, 8000).then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        }).then(function (data) {
            var kurzy = zpracujJson(data);
            vykresli(kurzy);
            ulozDoCache(kurzy, "cnb");
        }).catch(function () {
            // záložně er-api, poté cache
            fetchSLimitom(ZDROJ_ERAPI, 8000).then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            }).then(function (data) {
                var kurzy = zpracujErApi(data);
                vykresli(kurzy);
                ulozDoCache(kurzy, "erapi");
            }).catch(function () {
                if (cache) {
                    vykresli(cache.kurzy);
                } else {
                    tickerEl.style.display = "none";
                }
            });
        });
    }

    nactiKurzy();
})();
