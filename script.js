(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitat"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);

    var jspdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.0.0/jspdf.umd.min.js";
    var s3 = document.createElement("script"); s3.src = jspdfUrl;
    document.head.appendChild(s3);

    var autoTableUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js";
    var s4 = document.createElement("script"); s4.src = autoTableUrl;
    document.head.appendChild(s4);
})();

// Globální proměnná pro sdílení dat
let amortizacniPlan = [];

window.addEventListener("DOMContentLoaded", function() {
    // Globální logika pro otazníky (PC hover / Mobil klik)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ikona-otaznik') || e.target.closest('.tabulka-napoveda')) {
            const target = e.target.closest('.tabulka-napoveda') || e.target;
            const bublina = target.nextElementSibling;
            if (bublina && bublina.classList.contains('bublina-text')) {
                document.querySelectorAll('.bublina-text').forEach(b => {
                    if (b !== bublina) b.classList.remove('aktivni');
                });
                bublina.classList.toggle('aktivni');
                if (bublina.classList.contains('aktivni')) {
                    setTimeout(() => bublina.classList.remove('aktivni'), 3000);
                }
                e.stopPropagation();
            }
        } else {
            document.querySelectorAll('.bublina-text').forEach(b => b.classList.remove('aktivni'));
        }
    });

    let mujGraf = null;

    function validujInput(input, chybaId, napoveda, podminka) {
        if (!podminka) {
            document.getElementById(chybaId).innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
            document.getElementById(chybaId).style.display = "block";
            input.classList.add("input-chyba");
            return false;
        } else {
            document.getElementById(chybaId).style.display = "none";
            input.classList.remove("input-chyba");
            return true;
        }
    }

    // Naformátuje hodnotu pole na "3 0 00 000" nebo "5,5" a uloží zpět do inputu
    function naformatujPole(inputId) {
        const el = document.getElementById(inputId);
        let val = el.value.replace(/\s/g, '');
        if (val === "" || isNaN(val.replace(",", "."))) return;
        if (val.includes(",")) {
            el.value = val;
        } else {
            el.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        }
    }

    // 1. Ovládání UI (skrytí/zobrazení)
    const aktivator = document.getElementById('aktivator-checkbox');
    const blokMimoradna = document.getElementById('blok-mimoradna-splatka');
    aktivator.addEventListener('change', function() {
        if (this.checked) {
            blokMimoradna.style.opacity = '1';
            blokMimoradna.style.pointerEvents = 'auto';
        } else {
            blokMimoradna.style.opacity = '0.7';
            blokMimoradna.style.pointerEvents = 'none';
            // Reset hodnot při vypnutí
            document.getElementById("mimoradna-splatka").value = "0";
            document.getElementById("mimoradna-rok").value = "0";
        }
        vypocitat();
    });

    function getHypoData(pujcka, urok, roky, mimoSplatka, rokMimo) {
        let zustatek = pujcka;
        let celkemZaplaceno = 0;
        let celkemUroky = 0;
        let mesicniSplatka = pujcka * ((urok/100/12) * Math.pow(1 + (urok/100/12), roky * 12)) / (Math.pow(1 + (urok/100/12), roky * 12) - 1);

        for (let m = 1; zustatek > 0.1; m++) {
            let urokMesic = zustatek * (urok / 100 / 12);
            if (mimoSplatka > 0 && rokMimo > 0 && m === rokMimo * 12) {
                let mimoradna = Math.min(mimoSplatka, zustatek);
                zustatek -= mimoradna;
                celkemZaplaceno += mimoradna;
            }
            let jistinaMesic = Math.min(mesicniSplatka - urokMesic, zustatek);
            zustatek -= jistinaMesic;
            celkemZaplaceno += (jistinaMesic + urokMesic);
            celkemUroky += urokMesic;
            if (m > 600) break; // Bezpečnostní pojistka
        }
        return { celkemZaplaceno, celkemUroky };
    }

    // 2. Výpočetní logika
    function vypocitat() {
        const P = parseFloat(document.getElementById("castka").value.replace(/\s/g, '')) || 0;
        const rocniUrok = parseFloat(document.getElementById("urok").value.replace(",", ".")) || 0;
        const roky = parseFloat(document.getElementById("doba").value) || 0;

        let M = 0;
        let R = 0;
        if (document.getElementById('aktivator-checkbox').checked) {
            M = parseFloat(document.getElementById("mimoradna-splatka").value.replace(/\s/g, '')) || 0;
            R = parseInt(document.getElementById("mimoradna-rok").value) || 0;
        }

        // 1. Bezpečná kontrola checkboxu
        let checkbox = document.getElementById('aktivator-checkbox');
        let jeAktivni = checkbox ? checkbox.checked : false;

        // 2. Formátovací funkce
            const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";

        const N = roky * 12;
        const r_mesicni = rocniUrok / 100 / 12;

        // 1. STANDARDNÍ VÝPOČET (Zůstává nedotčen pro původní UI)
        let zustatekStandard = P;
        let celkemZaplaceno = 0; // Původní proměnná
        let celkemUroky = 0;    // Původní proměnná
        let mesicniSplatka = P * (r_mesicni * Math.pow(1 + r_mesicni, N)) / (Math.pow(1 + r_mesicni, N) - 1);

        for (let m = 1; m <= N; m++) {
            let urokMesicne = zustatekStandard * r_mesicni;
            let jistinaMesicne = Math.min(mesicniSplatka - urokMesicne, zustatekStandard);
            celkemUroky += urokMesicne;
            celkemZaplaceno += (jistinaMesicne + urokMesicne);
            zustatekStandard -= jistinaMesicne;
        }

        // 1. Zajištění proměnných pro mimořádnou splátku
            let celkemZaplacenoMimo = 0;
            let celkemUrokyMimo = 0;

        // 2. Pokud je aktivní, vypočítej tyto hodnoty pomocí pomocné funkce
        if (document.getElementById('aktivator-checkbox') && document.getElementById('aktivator-checkbox').checked) {
            const standard = getHypoData(P, rocniUrok, roky, 0, 0);
            const mimo = getHypoData(P, rocniUrok, roky, M, R);
            celkemZaplacenoMimo = mimo.celkemZaplaceno;
            celkemUrokyMimo = mimo.celkemUroky;

            // 3. Zobrazení výsledků v bloku srovnání
            const vysledekStandard = document.getElementById("vysledekStandard");
            const vysledekUspora = document.getElementById("vysledekUspora");

            if (vysledekStandard) {
                vysledekStandard.textContent = "Původní úroky: " + fmt(standard.celkemUroky);
            }
            if (vysledekUspora) {
                vysledekUspora.textContent = "Úspora na úrocích: " + fmt(standard.celkemUroky - celkemUrokyMimo);
            }
        }
        // Agregace pro tabulku
        let zustatekTab = P;
        let rocniPlan = [];
        let aktualniRok = 1;
        let ročníJistina = 0;
        let ročníUroky = 0;
        for (let m = 1; m <= N; m++) {
            let urokyMesicne = zustatekTab * r_mesicni;
            let jistinaMesicne = Math.min(mesicniSplatka - urokyMesicne, zustatekTab);

            // Přičtení mimořádné splátky v měsíci R*12
            if (M > 0 && R > 0 && m === R * 12) {
                let mimoradna = Math.min(M, zustatekTab - jistinaMesicne);
                jistinaMesicne += mimoradna;
            }
            zustatekTab -= jistinaMesicne;
            ročníJistina += jistinaMesicne;
            ročníUroky += urokyMesicne;

            // Pokud je konec roku nebo splaceno, uložíme řádek do plánu
            if (m % 12 === 0 || zustatekTab <= 0.1) {
                rocniPlan.push({
                    rok: aktualniRok,
                    splatkaJistiny: Math.round(ročníJistina).toLocaleString("cs-CZ", {useGrouping: true}).replace(/\u00A0/g, ' ') + " Kč",
                    zaplaceneUroky: Math.round(ročníUroky).toLocaleString("cs-CZ", {useGrouping: true}).replace(/\u00A0/g, ' ') + " Kč",
                    zustatek: Math.round(Math.max(0, zustatekTab)).toLocaleString("cs-CZ", {useGrouping: true}).replace(/\u00A0/g, ' ') + " Kč"
                });
                ročníJistina = 0;
                ročníUroky = 0;
                aktualniRok++;
            }
            if (zustatekTab <= 0.1) break;
        }

        // Propojení s PDF
        amortizacniPlan = rocniPlan;
        window.temp_standard = { celkemZaplaceno, celkemUroky };
        window.temp_mimo = (jeAktivni) ? { celkemZaplaceno: celkemZaplacenoMimo, celkemUroky: celkemUrokyMimo } : { celkemZaplaceno, celkemUroky };

        // 3. Výpis výsledků do UI
        const vysledekEl = document.getElementById("vysledek");
        if (vysledekEl) vysledekEl.textContent = "Měsíční splátka: " + fmt(mesicniSplatka);
        const detailyEl = document.getElementById("detaily");
        if (detailyEl) {
            detailyEl.innerHTML =
                "<p>Celkem zaplaceno: <strong>" + fmt(celkemZaplaceno) + "</strong></p>" +
                "<p>Z toho úroky: <strong>" + fmt(celkemUroky) + "</strong></p>";
        }

        // 4. Překreslení grafu (volání tvé existující funkce)
        if (typeof vykresliGraf === 'function') {
            vykresliGraf(amortizacniPlan);
        }

        // 5. Zobrazení bloku srovnání
        let blokSrovnani = document.getElementById('blokSrovnani');
        if (blokSrovnani) {
            blokSrovnani.style.display = jeAktivni ? 'block' : 'none';
        }
    } // Konec funkce vypocitat

    document.getElementById("vypocitat").addEventListener("click", function() {
        naformatujPole("castka");
        naformatujPole("urok");
        naformatujPole("doba");

        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";

        const castkaInput = document.getElementById("castka");
        const urokInput = document.getElementById("urok");
        const dobaInput = document.getElementById("doba");

        const P = parseFloat(castkaInput.value.replace(/\s/g, ''));
        const urokText = urokInput.value.replace(",", ".");
        const rocniSazba = parseFloat(urokText);
        const roky = parseFloat(dobaInput.value);

        const jeCastkaOk = !isNaN(P) && P > 0;
        const jeUrokOk = !isNaN(rocniSazba) && rocniSazba >= 0;
        const jeDobaOk = !isNaN(roky) && roky > 0;

        validujInput(castkaInput, "castka-chyba", "Např.: 3 0 00 000", jeCastkaOk);
        validujInput(urokInput, "urok-chyba", "Např.: 5,5", jeUrokOk);
        validujInput(dobaInput, "doba-chyba", "Např.: 30", jeDobaOk);

        if (!jeCastkaOk || !jeUrokOk || !jeDobaOk) return;
        vypocitat();
    });

    // PDF Export
    document.getElementById("export-pdf").addEventListener("click", function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 1. Registrace fontu
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.setFont("Roboto");

        // 2. Data
        const castka = document.getElementById("castka").value;
        const urok = document.getElementById("urok").value;
        const doba = document.getElementById("doba").value;
        const standard = window.temp_standard;
        const mimo = window.temp_mimo;

        // Oprava: Bezpečná kontrola existence elementu a hodnoty před voláním split
        const el = document.getElementById("vysledek");
        const hodnota = el ? el.textContent : "";
        let splatka = hodnota.replace("Měsíční splátka: ", "");

        // 1. Oprava načítání dat z detailů pomocí Regexu
        const detailyEl = document.getElementById("detaily");
        const textDetaily = detailyEl ? detailyEl.innerText : "";
        const celkemMatch = textDetaily.match(/Celkem zaplaceno:\s*([\d\s]+)\s*Kč/);
        const urokyMatch = textDetaily.match(/Z toho úroky:\s*([\d\s]+)\s*Kč/);
        const celkem = celkemMatch ? celkemMatch[1].trim() + " Kč" : "0 Kč";
        const uroky = urokyMatch ? urokyMatch[1].trim() + " Kč" : "0 Kč";

        // 3. Hlavička
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
            doc.setFont("Roboto", "bold");
        doc.setFontSize(20);
        doc.text("🏠 Hypoteční kalkulačka", 20, 20);
        doc.setFontSize(12);
        doc.setFont("Roboto", "normal");
        doc.text("Finanční Mapa", 20, 28);
        // 4. Parametry úvěru
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
            doc.setFont("Roboto", "bold");
        doc.text("PARAMETRY ÚVĚRU", 20, 55);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(12);
        doc.text("Výše úvěru: " + castka + " Kč", 20, 65);
        doc.text("Úroková sazba: " + urok + " %", 20, 75);
        doc.text("Doba splácení: " + doba + " let", 20, 85);

        // 4. MĚSÍČNÍ SPLÁTKA
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 100, 170, 30, 2, 2, 'F');
        doc.setTextColor(79, 70, 229);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(12);
        doc.text("MĚSÍČNÍ SPLÁTKA", 105, 112, { align: "center" });
        doc.setFontSize(22);
        doc.text(splatka, 105, 125, { align: "center" });

        // 2. Vykreslení výsledků do PDF
        doc.setTextColor(30, 41, 59);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(12);
        doc.text("Celkem zaplaceno: " + celkem, 20, 145);
        doc.text("Z toho úroky: " + uroky, 20, 155);

        // 3. Podmínka pro mimořádnou splátku
        if (document.getElementById('aktivator-checkbox').checked) {
            doc.setFont("Roboto", "bold");
            doc.text("Mimořádná splátka: " + document.getElementById("mimoradna-splatka").value + " Kč v roce " + document.getElementById("mimoradna-rok").value, 20, 165);
            doc.setFont("Roboto", "bold");
            doc.setFontSize(14);
            doc.text("SROVNÁNÍ ÚVĚRU", 20, 250);
            doc.setFont("Roboto", "normal");
            doc.setFontSize(10);

            const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";

            doc.text("Původní celkové úroky: " + fmt(standard.celkemUroky), 20, 260);
            doc.text("Úroky s mimořádnou splátkou: " + fmt(mimo.celkemUroky), 20, 267);
            doc.setTextColor(79, 70, 229);
            doc.text("Úspora: " + fmt(standard.celkemUroky - mimo.celkemUroky), 20, 274);
        }

        // 7. Amortizační tabulka (Obnoveno)
        if (typeof doc.autoTable === 'function') {
            doc.addPage();
            doc.setFont("Roboto", "bold");
            doc.setFontSize(16);
            doc.text("Amortizační tabulka", 105, 15, { align: 'center' });

            doc.autoTable({
                startY: 25,
            head: [['Rok', 'Splátka jistiny', 'Zaplacené úroky', 'Zůstatek']],
                body: amortizacniPlan.map(row => [row.rok, row.splatkaJistiny, row.zaplaceneUroky, row.zustatek]),
                theme: 'striped',
                styles: { font: 'Roboto' },
                headStyles: { fillColor: [79, 70, 229] }
            });
        }

        doc.save("vypocet_hypoteky.pdf");
});

    if (document.getElementById("tlacitko-tabulka")) {
        document.getElementById("tlacitko-tabulka").onclick = function() {
            const obal = document.getElementById("obal-tabulky");
            this.classList.toggle("aktivni");
            obal.style.display = (obal.style.display === "none") ? "block" : "none";
        };
    }

    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    zapnoutFormatovani('castka', 'castka-chyba', 'Např.: 3 0 00 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urok', 'urok-chyba', 'Např.: 5,5', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('doba', 'doba-chyba', 'Např.: 30', v => !isNaN(v) && parseFloat(v) > 0);

    ["castka", "urok", "doba"].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", function() {
                setTimeout(() => document.getElementById("vypocitat").click(), 500);
            });
        el.addEventListener("blur", function() {
                    naformatujPole(id);
        document.getElementById("vypocitat").click();
});
            el.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    naformatujPole(id);
                    if (id === "castka") document.getElementById("urok").focus();
                    else if (id === "urok") document.getElementById("doba").focus();
                    else document.getElementById("vypocitat").click();
    }
    });
    }
    });

    function propojSlider(inputId, sliderId) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        slider.addEventListener('input', function() {
            if (inputId === 'urok') {
                input.value = slider.value.replace('.', ',');
            } else {
                input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
        document.getElementById("vypocitat").click();
});
        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('castka', 'castka-slider');
    propojSlider('urok', 'urok-slider');
    propojSlider('doba', 'doba-slider');

    if (window.ChartJsPripraven) {
        document.getElementById("vypocitat").click();
    }
});

