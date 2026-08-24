document.addEventListener("DOMContentLoaded", function () {
    const PRIMARNI_URL = "https://api.cnb.cz/cnbapi/exrates/daily?lang=CZ";
    // Zdroje kurzů se zkouší postupně, dokud jeden neuspěje (ČNB API nemá CORS,
    // proto jsou jako záloha proxy a otevřené API s podporou CORS).
    const ZDROJE = [
        {
            nazev: "cnb",
            url: PRIMARNI_URL,
            typ: "cnb-json"
        },
        {
            nazev: "corsproxy-cnb",
            url: "https://corsproxy.io/?" + encodeURIComponent(PRIMARNI_URL),
            typ: "cnb-json"
        },
        {
            nazev: "allorigins-cnb",
            url: "https://api.allorigins.win/raw?url=" + encodeURIComponent(PRIMARNI_URL),
            typ: "cnb-json"
        },
        {
            nazev: "open-er-api",
            url: "https://open.er-api.com/v6/latest/CZK",
            typ: "er-api"
        }
    ];

    // Měny pro tabulku kurzů (v tomto pořadí) + české názvy
    const TABULKOVE_MENY = ["EUR", "USD", "GBP", "CHF", "PLN", "HUF", "RON", "SEK", "NOK", "DKK", "CAD", "AUD", "CNY", "JPY", "TRY"];
    const NAZVY_MEN = {
        EUR: "Euro", USD: "Dolar USA", GBP: "Britská libra", CHF: "Švýcarský frank",
        PLN: "Polský zlotý", HUF: "Maďarský forint", RON: "Rumunský lei",
        SEK: "Švédská koruna", NOK: "Norská koruna", DKK: "Dánská koruna",
        CAD: "Kanadský dolar", AUD: "Australský dolar", CNY: "Čínský juan",
        JPY: "Japonský jen", TRY: "Turecká lira",
        BGN: "Bulharský lev", ISK: "Islandská koruna"
    };
    // Měny povolené v převodníku (fallback er-api nabízí 160+ měn, filtrujeme na běžnou sadu)
    const PVOLENE_MENY = TABULKOVE_MENY.concat(["BGN", "ISK"]);

    const castkaEl = document.getElementById("castkaMenova");
    const zMenyEl = document.getElementById("zMeny");
    const doMenyEl = document.getElementById("doMeny");
    const prohoditBtn = document.getElementById("prohoditMeny");
    const vysledekEl = document.getElementById("vysledekPrevodu");
    const stavNacitani = document.getElementById("stavNacitani");
    const chybaKurzy = document.getElementById("chybaKurzy");
    const datumListku = document.getElementById("datumListku");
    const teloTabulky = document.getElementById("telo-tabulky-men");

    // kurzy: kód měny → { mnozstvi, kurz (CZK) }
    let kurzy = { CZK: { mnozstvi: 1, kurz: 1 } };
    let poslouchaciPripojeny = false;

    function parsujCastku(text) {
        if (!text) return NaN;
        return parseFloat(String(text).replace(/\s/g, "").replace(",", "."));
    }

    function prevodDoCzk(castka, mena) {
        const m = kurzy[mena];
        return castka / m.mnozstvi * m.kurz;
    }

    function prevodZCzk(castka, mena) {
        const m = kurzy[mena];
        return castka * m.mnozstvi / m.kurz;
    }

    function preved() {
        const castka = parsujCastku(castkaEl.value);
        const zMeny = zMenyEl.value;
        const doMeny = doMenyEl.value;

        if (isNaN(castka) || !kurzy[zMeny] || !kurzy[doMeny]) {
            vysledekEl.textContent = "";
            return;
        }

        const vCzk = prevodDoCzk(castka, zMeny);
        const vysledek = prevodZCzk(vCzk, doMeny);

        vysledekEl.textContent =
            castka.toLocaleString("cs-CZ") + " " + zMeny +
            " = " + vysledek.toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) + " " + doMeny;
    }

    function naplnSelecty() {
        const kody = Object.keys(kurzy).sort();
        for (const select of [zMenyEl, doMenyEl]) {
            select.innerHTML = "";
            for (const kod of kody) {
                const opt = document.createElement("option");
                opt.value = kod;
                opt.textContent = kod === "CZK" ? "CZK (koruna)" : (NAZVY_MEN[kod] || kod) + " (" + kod + ")";
                select.appendChild(opt);
            }
        }
        zMenyEl.value = "EUR";
        doMenyEl.value = "CZK";
    }

    function vykresliTabulku() {
        teloTabulky.innerHTML = "";
        for (const kod of TABULKOVE_MENY) {
            const m = kurzy[kod];
            if (!m) continue;
            const tr = document.createElement("tr");

            tr.innerHTML =
                "<td>" + (NAZVY_MEN[kod] || kod) + " (" + kod + ")</td>" +
                "<td style='text-align: right;'>" + m.mnozstvi + "</td>" +
                "<td style='text-align: right; font-weight: 600; color: #3730a3;'>" +
                    m.kurz.toLocaleString("cs-CZ", { minimumFractionDigits: 3 }) + "</td>";
            teloTabulky.appendChild(tr);
        }
    }

    function nastavDatum(text) {
        // text typu "05 Aug 2026" nebo datum z JSON
        try {
            const d = new Date(text);
            if (!isNaN(d)) {
                datumListku.textContent = "Kurzovní lístek ČNB ze dne " + d.toLocaleDateString("cs-CZ");
                return;
            }
        } catch (e) { /* ignore */ }
        datumListku.textContent = "Aktuální kurzovní lístek ČNB";
    }

    function pripojListenery() {
        if (poslouchaciPripojeny) return;
        poslouchaciPripojeny = true;
        castkaEl.addEventListener("input", preved);
        zMenyEl.addEventListener("change", preved);
        doMenyEl.addEventListener("change", preved);
        prohoditBtn.addEventListener("click", function () {
            const tmp = zMenyEl.value;
            zMenyEl.value = doMenyEl.value;
            doMenyEl.value = tmp;
            preved();
        });
    }

    // Převod dat ze zdroje na jednotný formát kurzy[kod] = { mnozstvi, kurz (CZK) }
    function zpracujData(zdroj, data) {
        if (zdroj.typ === "cnb-json") {
            if (!data || !Array.isArray(data.rates)) throw new Error("Neplatná data ČNB");
            const nove = { CZK: { mnozstvi: 1, kurz: 1 } };
            for (const r of data.rates) {
                nove[r.code] = { mnozstvi: r.amount, kurz: r.rate };
            }
            kurzy = nove;
            nastavDatum(data.date);
        } else if (zdroj.typ === "er-api") {
            if (!data || !data.rates) throw new Error("Neplatná data er-api");
            const nove = { CZK: { mnozstvi: 1, kurz: 1 } };
            // er-api vrací rates vztažené k CZK jako základně:
            // rates[X] = kolik jednotek X dostaneš za 1 CZK
            for (const kod of PVOLENE_MENY) {
                const hodnota = data.rates[kod];
                if (hodnota && hodnota > 0) {
                    nove[kod] = { mnozstvi: 1, kurz: 1 / hodnota };
                }
            }
            kurzy = nove;
            nastavDatum(data.time_last_update_utc || "");
        } else {
            throw new Error("Neznámý typ zdroje");
        }
    }

    async function nactiKurzy() {
        let uspech = false;
        for (const zdroj of ZDROJE) {
            try {
                const res = await fetch(zdroj.url);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const data = await res.json();
                zpracujData(zdroj, data);
                uspech = true;
                break;
            } catch (err) {
                // zdroj selhal (CORS / síť / neplatná data) → zkusíme další
            }
        }

        if (uspech) {
            stavNacitani.style.display = "none";
            chybaKurzy.style.display = "none";
            naplnSelecty();
            vykresliTabulku();
            preved();
            pripojListenery();
        } else {
            stavNacitani.style.display = "none";
            chybaKurzy.style.display = "block";
        }
    }

    nactiKurzy();
});