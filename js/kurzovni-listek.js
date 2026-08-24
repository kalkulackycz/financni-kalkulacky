document.addEventListener("DOMContentLoaded", function () {
    const ZDROJ_JSON = "kurzy.json";
    const ZDROJ_ERAPI = "https://open.er-api.com/v6/latest/CZK";
    const CACHE_KEY = "kurzyCnbCache";
    const CACHE_TTL = 60 * 60 * 1000;

    const TABULKOVE_MENY = ["EUR", "USD", "GBP", "CHF", "PLN", "HUF", "RON", "SEK", "NOK", "DKK", "CAD", "AUD", "CNY", "JPY", "TRY", "EGP", "TND", "BRL", "PHP", "HKD", "INR", "IDR", "ISK", "ILS", "ZAR", "KRW", "MYR", "MXN", "NZD", "SGD", "THB", "XDR"];
    const NAZVY_MEN = {
        EUR: "Euro", USD: "Dolar USA", GBP: "Britská libra", CHF: "Švýcarský frank",
        PLN: "Polský zlotý", HUF: "Maďarský forint", RON: "Rumunský lei",
        SEK: "Švédská koruna", NOK: "Norská koruna", DKK: "Dánská koruna",
        CAD: "Kanadský dolar", AUD: "Australský dolar", CNY: "Čínský juan",
        JPY: "Japonský jen", TRY: "Turecká lira", EGP: "Egyptská libra", TND: "Tuniský dinár", BRL: "Brazilský real", PHP: "Filipínské peso", HKD: "Hongkongský dolar", INR: "Indická rupie", IDR: "Indonéská rupie", ISK: "Islandská koruna", ILS: "Izraelský šekel", ZAR: "Jihoafrický rand", KRW: "Jihokorejský won", MYR: "Malajsijský ringgit", MXN: "Mexické peso", NZD: "Novozélandský dolar", SGD: "Singapurský dolar", THB: "Thajský baht", XDR: "SDR (MMF)"
    };
    const FLAGY = {
        EUR: "eu", USD: "us", GBP: "gb", CHF: "ch", PLN: "pl", HUF: "hu", RON: "ro",
        SEK: "se", NOK: "no", DKK: "dk", CAD: "ca", AUD: "au", CNY: "cn", JPY: "jp",
        TRY: "tr", EGP: "eg", TND: "tn", BRL: "br", PHP: "ph", HKD: "hk", INR: "in", IDR: "id", ISK: "is", ILS: "il", ZAR: "za", KRW: "kr", MYR: "my", MXN: "mx", NZD: "nz", SGD: "sg", THB: "th"
    };

    const datumEl = document.getElementById("listekDatum");
    const teloEl = document.getElementById("listekTelo");
    const hledatEl = document.getElementById("listekHledat");
    const prazdnoEl = document.getElementById("listekPrazdno");

    let kurzy = null;
    let poznamka = "";
    let hledani = "";
    let razeni = { klic: null, vzestupne: true };

    function vlajkaHTML(kod) {
        const zeme = FLAGY[kod];
        return zeme ? '<img class="mena-flag" src="https://flagcdn.com/w40/' + zeme + '.png" alt="" loading="lazy">' : "";
    }

    function formatujDatum(iso) {
        const [y, m, d] = String(iso || "").split("-");
        return y ? d + ". " + m + ". " + y : iso;
    }

    function seznamMena() {
        const radky = [];
        for (const kod of TABULKOVE_MENY) {
            const m = kurzy[kod];
            if (!m) continue;
            radky.push({ kod: kod, nazev: NAZVY_MEN[kod] || kod, mnozstvi: m.mnozstvi, kurz: m.kurz });
        }
        return radky;
    }

    function vykresli() {
        let radky = seznamMena();

        if (hledani) {
            const h = hledani.toLowerCase();
            radky = radky.filter(function (r) {
                return r.nazev.toLowerCase().indexOf(h) !== -1 || r.kod.toLowerCase().indexOf(h) !== -1;
            });
        }

        if (razeni.klic) {
            radky.sort(function (a, b) {
                let va = a[razeni.klic], vb = b[razeni.klic];
                if (typeof va === "string") {
                    va = va.toLowerCase(); vb = vb.toLowerCase();
                    return razeni.vzestupne ? va.localeCompare(vb, "cs") : vb.localeCompare(va, "cs");
                }
                return razeni.vzestupne ? va - vb : vb - va;
            });
        }

        teloEl.innerHTML = "";
        for (const r of radky) {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td><span class='mena-cell'>" + vlajkaHTML(r.kod) +
                    "<span>" + r.nazev + " <span class='mena-kod'>(" + r.kod + ")</span></span></span></td>" +
                "<td class='prava'>" + r.mnozstvi + "</td>" +
                "<td class='prava mena-kurz'>" + r.kurz.toLocaleString("cs-CZ", { minimumFractionDigits: 3 }) + "</td>";
            teloEl.appendChild(tr);
        }

        prazdnoEl.style.display = radky.length ? "none" : "block";

        for (const th of document.querySelectorAll(".tabulka-listek th")) {
            const smer = th.querySelector(".smer");
            if (smer) smer.textContent = th.dataset.sort === razeni.klic ? (razeni.vzestupne ? "▲" : "▼") : "";
        }
    }

    // ---------- CSV ----------
    function stahniCsv() {
        if (!kurzy) return;
        let csv = "\uFEFFMěna;Kód;Množství;Kurz (CZK)\r\n";
        for (const r of seznamMena()) {
            csv += r.nazev + ";" + r.kod + ";" + r.mnozstvi + ";" + String(r.kurz).replace(".", ",") + "\r\n";
        }
        if (poznamka) csv += "\r\n" + poznamka + ";Zdroj: ČNB\r\n";
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kurzovni-listek-cnb.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // ---------- Sdílení ----------
    async function sdilej() {
        const text = "Kurzovní lístek ČNB – aktuální kurzy měn na Finanční Mapě";
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: document.title, text: text, url: url }); return; } catch (e) { /* uživatel zrušil */ }
        }
        try {
            await navigator.clipboard.writeText(url);
            alert("Odkaz na kurzovní lístek byl zkopírován do schránky.");
        } catch (e) {
            window.location.href = "mailto:?subject=" + encodeURIComponent(text) + "&body=" + encodeURIComponent(url);
        }
    }

    // ---------- Načtení kurzů ----------
    function fetchSLimitom(url, limitMs) {
        const kontrola = new AbortController();
        const casovac = setTimeout(function () { kontrola.abort(); }, limitMs);
        return fetch(url, { signal: kontrola.signal }).finally(function () { clearTimeout(casovac); });
    }

    function jeMocStary(datum) {
        if (!datum) return false;
        const dnu = Math.floor((Date.now() - new Date(datum + "T14:30:00Z")) / 86400000);
        return dnu >= 2;
    }

    function zpracujJson(data) {
        if (!data || !data.kurzy || !data.kurzy.EUR) throw new Error("Neplatná data ČNB");
        const nove = {};
        for (const kod of Object.keys(data.kurzy)) {
            const z = data.kurzy[kod];
            if (z.m > 0 && z.r > 0) nove[kod] = { mnozstvi: z.m, kurz: z.r };
        }
        kurzy = nove;
    }

    function zpracujErApi(data) {
        if (!data || !data.rates) throw new Error("Neplatná data er-api");
        const nove = {};
        for (const kod of TABULKOVE_MENY) {
            const hodnota = data.rates[kod];
            if (hodnota && hodnota > 0) nove[kod] = { mnozstvi: 1, kurz: 1 / hodnota };
        }
        kurzy = nove;
    }

    function ulozCache(pozn, datum) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), datum: datum || null, poznamka: pozn || "", kurzy: kurzy }));
        } catch (e) { /* nevadí */ }
    }

    function nactiCache() {
        try {
            const c = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (!c || !c.kurzy || !c.ts || !c.kurzy.EUR) return null;
            return { kurzy: c.kurzy, poznamka: c.poznamka || "", datum: c.datum || null, starsi: (Date.now() - c.ts) > CACHE_TTL };
        } catch (e) {
            return null;
        }
    }

    function zobraz(text) {
        datumEl.textContent = "Kurzovní lístek ČNB" + (text ? " – " + text : "");
        vykresli();
    }

    async function nactiKurzy() {
        const cache = nactiCache();
        if (cache) {
            kurzy = cache.kurzy;
            poznamka = cache.poznamka;
            zobraz(poznamka || (cache.datum ? "lístek ze " + formatujDatum(cache.datum) : ""));
            if (!cache.starsi) return;
        }

        let uspech = false;
        let datumListkuCnb = null;

        try {
            const res = await fetchSLimitom(ZDROJ_JSON, 8000);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            zpracujJson(data);
            uspech = true;
            datumListkuCnb = data.datum || null;
            poznamka = data.datum ? "lístek ze " + formatujDatum(data.datum) : "";
        } catch (err) {
            console.warn("[listek] kurzy.json nedostupné: " + err.message);
        }

        if (!uspech || jeMocStary(datumListkuCnb)) {
            try {
                const res = await fetchSLimitom(ZDROJ_ERAPI, 8000);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const data = await res.json();
                zpracujErApi(data);
                uspech = true;
                poznamka = "tržní kurzy, přepočteno na CZK";
            } catch (err) {
                console.warn("[listek] er-api selhalo: " + err.message);
            }
        }

        if (uspech) {
            zobraz(poznamka);
            ulozCache(poznamka, datumListkuCnb);
        } else if (!cache) {
            datumEl.textContent = "⚠️ Kurzy se nepodařilo načíst. Zkuste stránku obnovit.";
        }
    }

    // ---------- Listenery ----------
    hledatEl.addEventListener("input", function () {
        hledani = hledatEl.value.trim();
        vykresli();
    });

    for (const th of document.querySelectorAll(".tabulka-listek th")) {
        th.addEventListener("click", function () {
            const klic = th.dataset.sort;
            if (razeni.klic === klic) {
                razeni.vzestupne = !razeni.vzestupne;
            } else {
                razeni = { klic: klic, vzestupne: true };
            }
            vykresli();
        });
    }

    document.getElementById("btnCsv").addEventListener("click", stahniCsv);
    document.getElementById("btnTisk").addEventListener("click", function () { window.print(); });
    document.getElementById("btnSdilet").addEventListener("click", sdilej);

    nactiKurzy();
});
