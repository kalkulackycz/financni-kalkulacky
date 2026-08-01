(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    // Inicializace klikacích otazníků
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

    let mujGrafRefin = null;

    // Pomocná funkce pro validaci
    function validujInput(input, chybaId, napoveda, podminka) {
        const chybaEl = document.getElementById(chybaId);
        if (!chybaEl) return true;
        if (!podminka) {
            chybaEl.innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
            chybaEl.style.display = "block";
            input.classList.add("input-chyba");
            return false;
        } else {
            chybaEl.style.display = "none";
            input.classList.remove("input-chyba");
            return true;
        }
    }

    // Funkce pro formátování a validaci vstupu
    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.addEventListener('blur', function(e) {
            let val = e.target.value.replace(/\s/g, '');
            if (val !== "" && !isNaN(val.replace(",", "."))) {
                if (inputId === 'zbytekDluhu') {
                    e.target.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
                }
            }
            validujInput(el, chybaId, napoveda, validacniFunkce(el.value));
        });
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    // Propojení sliderů s inputy
    function propojSlider(inputId, sliderId, isFloat = false) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        if (!input || !slider) return;

        slider.addEventListener('input', function() {
            if (isFloat) {
                input.value = slider.value.replace('.', ',');
            } else {
                input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            const tlacitko = document.getElementById("vypocitatRefin");
            if (tlacitko) tlacitko.click();
        });

        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('zbytekDluhu', 'zbytekDluhu-slider');
    propojSlider('staryUrok', 'staryUrok-slider', true);
    propojSlider('novyUrok', 'novyUrok-slider', true);
    propojSlider('dobaRefin', 'dobaRefin-slider');

    const tlacitkoVypocetRefin = document.getElementById("vypocitatRefin");
    if (tlacitkoVypocetRefin) {
        tlacitkoVypocetRefin.addEventListener("click", function(e) {
            if (e) e.preventDefault();
            const chybovaHlaska = document.getElementById("chybova-hlaska");
            if (chybovaHlaska) chybovaHlaska.style.display = "none";

            const jistinaInput = document.getElementById("zbytekDluhu");
            const staryUrokInput = document.getElementById("staryUrok");
            const novyUrokInput = document.getElementById("novyUrok");
            const dobaInput = document.getElementById("dobaRefin");

            if (!jistinaInput || !staryUrokInput || !novyUrokInput || !dobaInput) return;

            const P = parseFloat(jistinaInput.value.replace(/\s/g, ''));
            const staryUrokRocni = parseFloat(staryUrokInput.value.replace(",", "."));
            const novyUrokRocni = parseFloat(novyUrokInput.value.replace(",", "."));
            const roky = parseFloat(dobaInput.value);

            const jeJistinaOk = !isNaN(P) && P > 0;
            const jeStaryUrokOk = !isNaN(staryUrokRocni) && staryUrokRocni >= 0;
            const jeNovyUrokOk = !isNaN(novyUrokRocni) && novyUrokRocni >= 0;
            const jeDobaOk = !isNaN(roky) && roky > 0;

            validujInput(jistinaInput, "zbytekDluhu-chyba", "Např.: 2 000 000", jeJistinaOk);
            validujInput(staryUrokInput, "staryUrok-chyba", "Např.: 5,9", jeStaryUrokOk);
            validujInput(novyUrokInput, "novyUrok-chyba", "Např.: 4,2", jeNovyUrokOk);
            validujInput(dobaInput, "dobaRefin-chyba", "Např.: 20", jeDobaOk);

            if (!jeJistinaOk || !jeStaryUrokOk || !jeNovyUrokOk || !jeDobaOk) return;

            const n = roky * 12;

            const rStary = staryUrokRocni / 100 / 12;
            const rNovy = novyUrokRocni / 100 / 12;

            // OPRAVA: puvodni vzorec pri 0% uroku (r=0) delil nulou a vracel NaN.
            // Validace uroku povoluje hodnotu 0 (napr. novyUrokRocni >= 0), takze k chybe realne dochazelo,
            // typicky u nove sazby (napr. bezurocna nabidka refinancovani).
            const staryVysledek = rStary === 0
                ? P / n
                : P * (rStary * Math.pow(1 + rStary, n)) / (Math.pow(1 + rStary, n) - 1);
            const novyVysledek = rNovy === 0
                ? P / n
                : P * (rNovy * Math.pow(1 + rNovy, n)) / (Math.pow(1 + rNovy, n) - 1);
            const mesicniUspora = staryVysledek - novyVysledek;
            const celkovaUspora = mesicniUspora * n;
            const noveCelkoveUroky = (novyVysledek * n) - P;

            const el = document.getElementById("vysledekRefin");
            if (el) {
                if (mesicniUspora > 0) {
                    el.innerText = "Měsíčně ušetříte: " + Math.round(mesicniUspora).toLocaleString("cs-CZ") + " Kč";
                } else {
                    el.innerText = "Nová nabídka se nevyplatí.";
                }
                el.style.border = "2px solid #22c55e";
                el.style.backgroundColor = "#f0fdf4";
                el.style.padding = "14px 18px";
                el.style.borderRadius = "8px";
                el.style.textAlign = "center";
                el.style.color = "#166534";
                el.style.fontWeight = "bold";
            }

            const detailyEl = document.getElementById("detailyRefin");
            if (detailyEl) {
                detailyEl.innerHTML =
                    "<p>Původní měsíční splátka: <strong>" + Math.round(staryVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
                    "<p>Nová měsíční splátka: <strong>" + Math.round(novyVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
                    "<p>Celková úspora za " + (n / 12) + " let: <strong style='color: #22c55e;'> " + Math.round(Math.max(0, celkovaUspora)).toLocaleString("cs-CZ") + " Kč</strong></p>";
            }

            if (mujGrafRefin !== null) mujGrafRefin.destroy();

            if (typeof Chart !== "undefined") { vykresliGraf(P, noveCelkoveUroky); }
            else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(P, noveCelkoveUroky); }, 500); }
        });
    }

    function vykresliGraf(P, noveCelkoveUroky) {
        const grafEl = document.getElementById("grafRefin");
        if (!grafEl) return;
        const ctx = grafEl.getContext("2d");
        mujGrafRefin = new Chart(ctx, {
            type: "doughnut",
            data: { labels: ["Zbývající jistina", "Nové budoucí úroky"], datasets: [{ data: [P, Math.max(0, noveCelkoveUroky)], backgroundColor: ["#4f46e5", "#f97316"] }] },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                    label += context.parsed.toLocaleString('cs-CZ') + ' Kč';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    zapnoutFormatovani('zbytekDluhu', 'zbytekDluhu-chyba', 'Např.: 2 000 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('staryUrok', 'staryUrok-chyba', 'Např.: 5,9', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('novyUrok', 'novyUrok-chyba', 'Např.: 4,2', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('dobaRefin', 'dobaRefin-chyba', 'Např.: 20', v => !isNaN(v) && parseFloat(v) > 0);

    const inputZbytek = document.getElementById("zbytekDluhu");
    const inputStaryUrok = document.getElementById("staryUrok");
    const inputNovyUrok = document.getElementById("novyUrok");
    const inputDobaRefin = document.getElementById("dobaRefin");
    const tlacitkoVypocitatRefin = document.getElementById("vypocitatRefin");

    if (inputZbytek && inputStaryUrok && inputNovyUrok && inputDobaRefin && tlacitkoVypocitatRefin) {
        inputZbytek.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputStaryUrok.focus(); } });
        inputStaryUrok.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputNovyUrok.focus(); } });
        inputNovyUrok.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDobaRefin.focus(); } });
        inputDobaRefin.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatRefin.click(); } });
    }

    setTimeout(function() { 
        const tlacitko = document.getElementById("vypocitatRefin");
        if (tlacitko) tlacitko.click(); 
    }, 300);

    // Export do PDF
    const exportPdfBtn = document.getElementById("export-pdf");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", async function() {
            const jistinaInput = document.getElementById("zbytekDluhu");
            const staryUrokInput = document.getElementById("staryUrok");
            const novyUrokInput = document.getElementById("novyUrok");
            const dobaInput = document.getElementById("dobaRefin");
            if (!jistinaInput || !staryUrokInput || !novyUrokInput || !dobaInput) return;

            const P = parseFloat(jistinaInput.value.replace(/\s/g, ''));
            const staryUrokRocni = parseFloat(staryUrokInput.value.replace(",", "."));
            const novyUrokRocni = parseFloat(novyUrokInput.value.replace(",", "."));
            const roky = parseFloat(dobaInput.value);

            if (isNaN(P) || P <= 0 || isNaN(staryUrokRocni) || isNaN(novyUrokRocni) || isNaN(roky) || roky <= 0) {
                alert('Zadejte prosím platné hodnoty před exportem do PDF.');
                return;
            }

            const n = roky * 12;
            const rStary = staryUrokRocni / 100 / 12;
            const rNovy = novyUrokRocni / 100 / 12;
            const staryVysledek = rStary === 0 ? P / n : P * (rStary * Math.pow(1 + rStary, n)) / (Math.pow(1 + rStary, n) - 1);
            const novyVysledek = rNovy === 0 ? P / n : P * (rNovy * Math.pow(1 + rNovy, n)) / (Math.pow(1 + rNovy, n) - 1);
            const mesicniUspora = staryVysledek - novyVysledek;
            const celkovaUspora = Math.max(0, mesicniUspora * n);

            const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ") + " Kč";
            const hlavniText = mesicniUspora > 0
                ? "Měsíčně ušetříte: " + fmt(mesicniUspora)
                : "Nová nabídka se nevyplatí";

            await window.PDFSpolecne.exportKalkulackaPDF({
                nazev: "Výpočet refinancování",
                hlavniVysledek: hlavniText,
                radky: [
                    ["Zbývající jistina", fmt(P)],
                    ["Současná úroková sazba", staryUrokRocni.toLocaleString("cs-CZ") + " %"],
                    ["Nová úroková sazba", novyUrokRocni.toLocaleString("cs-CZ") + " %"],
                    ["Zbývající doba splácení", roky + " let"],
                    ["Původní měsíční splátka", fmt(staryVysledek)],
                    ["Nová měsíční splátka", fmt(novyVysledek)],
                    ["Celková úspora za " + (n / 12) + " let", fmt(celkovaUspora)]
                ],
                souborNazev: "vypocet-refinancovani",
                canvasId: "grafRefin",
                tlacitko: exportPdfBtn
            });
        });
    }
});