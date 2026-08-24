document.addEventListener("DOMContentLoaded", function () {
    // Zdroje kurzů: primárně stejno-doménní kurzy.json (denně generuje GitHub Actions
    // z oficiálního kurzovní lístku ČNB – žádný problém s CORS), záložně open er-api.
    const ZDROJ_JSON = "kurzy.json";
    const ZDROJ_ERAPI = "https://open.er-api.com/v6/latest/CZK";

    // Měny pro tabulku kurzů (v tomto pořadí) + české názvy
    const TABULKOVE_MENY = ["EUR", "USD", "GBP", "CHF", "PLN", "HUF", "RON", "SEK", "NOK", "DKK", "CAD", "AUD", "CNY", "JPY", "TRY", "EGP", "TND"];
    const NAZVY_MEN = {
        EUR: "Euro", USD: "Dolar USA", GBP: "Britská libra", CHF: "Švýcarský frank",
        PLN: "Polský zlotý", HUF: "Maďarský forint", RON: "Rumunský lei",
        SEK: "Švédská koruna", NOK: "Norská koruna", DKK: "Dánská koruna",
        CAD: "Kanadský dolar", AUD: "Australský dolar", CNY: "Čínský juan",
        JPY: "Japonský jen", TRY: "Turecká lira",
        EGP: "Egyptská libra", TND: "Tuniský dinár",
        BGN: "Bulharský lev", ISK: "Islandská koruna", CZK: "Česká koruna",
        BRL: "Brazilský real", PHP: "Filipínské peso", HKD: "Hongkongský dolar",
        INR: "Indická rupie", IDR: "Indonéská rupie", ILS: "Izraelský šekel",
        ZAR: "Jihoafrický rand", KRW: "Jižokorejský won", MYR: "Malajsijský ringgit",
        MXN: "Mexické peso", NZD: "Novozélandský dolar", SGD: "Singapurský dolar",
        THB: "Thajský baht", XDR: "Zvláštní práva čerpání (MMF)"
    };
    // Mapa měna → kód země pro vlaječky (obrázky z flagcdn.com)
    const FLAGY = {
        EUR: "eu", USD: "us", GBP: "gb", CHF: "ch", PLN: "pl", HUF: "hu", RON: "ro",
        SEK: "se", NOK: "no", DKK: "dk", CAD: "ca", AUD: "au", CNY: "cn", JPY: "jp",
        TRY: "tr", EGP: "eg", TND: "tn", BGN: "bg", ISK: "is", CZK: "cz", BRL: "br",
        PHP: "ph", HKD: "hk", INR: "in", IDR: "id", ILS: "il", ZAR: "za", KRW: "kr",
        MYR: "my", MXN: "mx", NZD: "nz", SGD: "sg", THB: "th"
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

    // ---------- Vlastní dropdown s vlaječkami (nahrazuje nativní select) ----------
    const dropDowny = {};
    let aktualizujDropdowny = function () {};

    function vlajkaHTML(kod) {
        if (kod === "XDR") return '<span class="mena-flag mena-flag-xdr">🏦</span>';
        const zeme = FLAGY[kod];
        return zeme ? '<img class="mena-flag" src="https://flagcdn.com/w40/' + zeme + '.png" alt="" loading="lazy">' : "";
    }

    function vytvorDropdown(select) {
        const wrap = document.createElement("div");
        wrap.className = "mena-drop";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mena-drop-btn";
        btn.setAttribute("aria-haspopup", "listbox");
        const list = document.createElement("div");
        list.className = "mena-drop-list";
        list.setAttribute("role", "listbox");

        function aktualizuj() {
            const kod = select.value;
            btn.innerHTML = vlajkaHTML(kod) +
                '<span class="mena-drop-nazev">' + (NAZVY_MEN[kod] || kod) + "</span>" +
                '<span class="mena-drop-kod">' + kod + '</span>' +
                '<span class="mena-drop-sipka">▾</span>';
            for (const el of list.children) el.classList.toggle("aktivni", el.dataset.kod === kod);
        }

        function napln() {
            list.innerHTML = "";
            for (const opt of select.options) {
                if (opt.disabled) {
                    const oddelovac = document.createElement("div");
                    oddelovac.className = "mena-drop-oddelovac";
                    list.appendChild(oddelovac);
                    continue;
                }
                const polozka = document.createElement("div");
                polozka.className = "mena-drop-polozka";
                polozka.dataset.kod = opt.value;
                polozka.setAttribute("role", "option");
                polozka.innerHTML = vlajkaHTML(opt.value) +
                    '<span class="mena-drop-nazev">' + (NAZVY_MEN[opt.value] || opt.value) + "</span>" +
                    '<span class="mena-drop-kod">' + opt.value + "</span>";
                polozka.addEventListener("click", function () {
                    select.value = opt.value;
                    aktualizuj();
                    zavrit();
                    select.dispatchEvent(new Event("change"));
                });
                list.appendChild(polozka);
            }
            aktualizuj();
        }

        function zavrit() { wrap.classList.remove("otevren"); }

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            wrap.classList.toggle("otevren");
        });
        document.addEventListener("click", function (e) {
            if (!wrap.contains(e.target)) zavrit();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") zavrit();
        });

        select.style.display = "none";
        select.insertAdjacentElement("afterend", wrap);
        wrap.appendChild(btn);
        wrap.appendChild(list);
        napln();
        return { aktualizuj: aktualizuj, napln: napln };
    }

    function zajistiDropdowny() {
        for (const select of [zMenyEl, doMenyEl]) {
            if (!dropDowny[select.id]) dropDowny[select.id] = vytvorDropdown(select);
            else dropDowny[select.id].napln();
        }
        aktualizujDropdowny = function () {
            for (const id in dropDowny) dropDowny[id].aktualizuj();
        };
    }

    function naplnSelecty() {
        const TOP_MENY = ["EUR", "USD", "GBP", "CHF", "PLN", "CZK"];
        const kody = [];
        for (const kod of TOP_MENY) if (kurzy[kod]) kody.push(kod);
        kody.push("---");
        for (const kod of Object.keys(kurzy).sort()) if (kody.indexOf(kod) === -1) kody.push(kod);
        for (const select of [zMenyEl, doMenyEl]) {
            select.innerHTML = "";
            for (const kod of kody) {
                const opt = document.createElement("option");
                opt.value = kod;
                if (kod === "---") { opt.disabled = true; opt.textContent = "──────────"; }
                else opt.textContent = (NAZVY_MEN[kod] || kod) + " (" + kod + ")";
                select.appendChild(opt);
            }
        }
        zMenyEl.value = "EUR";
        doMenyEl.value = "CZK";
        zajistiDropdowny();
        aktualizujDropdowny();
    }

    function vykresliTabulku() {
        if (!teloTabulky) return;
        teloTabulky.innerHTML = "";
        const kody = Object.keys(kurzy).filter(function (k) { return k !== "CZK"; }).sort();
        for (const kod of kody) {
            const m = kurzy[kod];
            if (!m) continue;
            const tr = document.createElement("tr");

            tr.innerHTML =
                "<td><span class='mena-cell'>" + vlajkaHTML(kod) +
                    "<span>" + (NAZVY_MEN[kod] || kod) + " (" + kod + ")</span></span></td>" +
                "<td class='mena-mnozstvi'>" + m.mnozstvi + "</td>" +
                "<td class='mena-kurz'>" +
                    m.kurz.toLocaleString("cs-CZ", { minimumFractionDigits: 3 }) + "</td>";
            teloTabulky.appendChild(tr);
        }
    }

    function nastavDatumText(text) {
        if (!datumListku) return;        datumListku.textContent = text;
    }

    function zobrazKurzy(poznamka) {
        stavNacitani.style.display = "none";
        naplnSelecty();
        vykresliTabulku();
        nastavDatumText("Aktuální kurzovní lístek ČNB" + (poznamka ? " – " + poznamka : ""));
        preved();
        pripojListenery();
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
            aktualizujDropdowny();
            preved();
        });
    }

    // ---------- Cache (localStorage, TTL 1 hodina) ----------
    const CACHE_KEY = "kurzyCnbCache";
    const CACHE_TTL = 60 * 60 * 1000;

    function ulozCache(poznamka, datum) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                ts: Date.now(),
                datum: datum || null,
                poznamka: poznamka || "",
                kurzy: kurzy
            }));
        } catch (e) { /* localStorage nedostupný – nevadí */ }
    }

    function nactiCache() {
        try {
            const c = JSON.parse(localStorage.getItem(CACHE_KEY));
            // Cache je platná jen tehdy, když obsahuje skutečné kurzy (min. EUR)
            if (!c || !c.kurzy || !c.ts || !c.kurzy.EUR) return null;
            if (!c.kurzy.CZK) c.kurzy.CZK = { mnozstvi: 1, kurz: 1 };
            return { kurzy: c.kurzy, poznamka: c.poznamka || "", starsi: (Date.now() - c.ts) > CACHE_TTL };
        } catch (e) {
            return null;
        }
    }

    // ---------- Načtení kurzů ----------
    async function nactiKurzy() {
        try {
            const cache = nactiCache();
            if (cache) {
                kurzy = cache.kurzy;
                zobrazKurzy(cache.poznamka);
                if (!cache.starsi) return; // čerstvá cache → síťový požadavek netřeba
                // starší cache: zobrazeno hned, níže proběhne obnovení na pozadí
            }

            // Fetch s časovým limitem, aby stránka nikdy nevisela na pomalém zdroji
            function fetchSLimitom(url, limitMs) {
                const kontrola = new AbortController();
                const casovac = setTimeout(function () { kontrola.abort(); }, limitMs);
                return fetch(url, { signal: kontrola.signal }).finally(function () {
                    clearTimeout(casovac);
                });
            }

            let uspech = false;
            let poznamka = "";
            let datumListkuCnb = null;

            // 1) kurzy.json z naší domény (oficiální data ČNB, generovaná jednou denně)
            try {
                const res = await fetchSLimitom(ZDROJ_JSON, 8000);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const data = await res.json();
                zpracujJson(data);
                uspech = true;
                datumListkuCnb = data.datum || null;
                poznamka = data.datum ? "lístek ČNB ze " + formatujDatum(data.datum) : "";
            } catch (err) {
                console.warn("[kurzy] kurzy.json nedostupné: " + err.message);
            }

            // 2) záložně er-api (tržní kurzy), pokud JSON selhal nebo je lístek moc starý
            if (!uspech || jeMocStary(datumListkuCnb)) {
                try {
                    const res = await fetchSLimitom(ZDROJ_ERAPI, 8000);
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    const data = await res.json();
                    zpracujErApi(data);
                    uspech = true;
                    poznamka = "tržní kurzy, přepočteno na CZK";
                } catch (err) {
                    console.warn("[kurzy] er-api selhalo: " + err.message);
                }
            }

            if (uspech) {
                zobrazKurzy(poznamka);
                ulozCache(poznamka, datumListkuCnb);
            } else if (cache) {
                zobrazKurzy("data z cache, nepodařilo se obnovit");
            } else {
                stavNacitani.style.display = "none";
                chybaKurzy.textContent = "⚠️ Kurzy se nepodařilo načíst. Zkuste prosím stránku obnovit.";
                chybaKurzy.style.display = "block";
            }
        } catch (e) {
            console.error("[kurzy] NEOČEKÁVANÁ CHYBA v nactiKurzy:", e);
            stavNacitani.style.display = "none";
            chybaKurzy.textContent = "⚠️ Chyba při načítání kurzů: " + e.message;
            chybaKurzy.style.display = "block";
        }
    }

    function formatujDatum(iso) {
        const [y, m, d] = String(iso || "").split("-");
        return y ? d + ". " + m + ". " + y : iso;
    }

    // Lístek je „moc starý", když není z dneška ani z včerejška
    // (víkend/svátek → lístek starší 1 den je v pořádku, ČNB ho neaktualizuje)
    function jeMocStary(datum) {
        if (!datum) return false;
        const dnu = Math.floor((Date.now() - new Date(datum + "T14:30:00Z")) / 86400000);
        return dnu >= 2;
    }

    // Převod dat na jednotný formát kurzy[kod] = { mnozstvi, kurz (CZK) }
    function zpracujJson(data) {
        if (!data || !data.kurzy || !data.kurzy.EUR) throw new Error("Neplatná data ČNB");
        const nove = { CZK: { mnozstvi: 1, kurz: 1 } };
        for (const kod of Object.keys(data.kurzy)) {
            const z = data.kurzy[kod];
            if (z.m > 0 && z.r > 0) nove[kod] = { mnozstvi: z.m, kurz: z.r };
        }
        kurzy = nove;
    }

    function zpracujErApi(data) {
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
    }

    nactiKurzy();
});

