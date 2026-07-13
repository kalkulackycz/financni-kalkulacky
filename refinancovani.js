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

    // Funkce pro formátování a validaci vstupu
    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
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

        slider.addEventListener('input', function() {
            if (isFloat) {
                input.value = slider.value.replace('.', ',');
            } else {
                input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            document.getElementById("vypocitatRefin").click();
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

    document.getElementById("vypocitatRefin").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";

        const jistinaInput = document.getElementById("zbytekDluhu");
        const staryUrokInput = document.getElementById("staryUrok");
        const novyUrokInput = document.getElementById("novyUrok");
        const dobaInput = document.getElementById("dobaRefin");

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

        const staryVysledek = P * (rStary * Math.pow(1 + rStary, n)) / (Math.pow(1 + rStary, n) - 1);
        const novyVysledek = P * (rNovy * Math.pow(1 + rNovy, n)) / (Math.pow(1 + rNovy, n) - 1);
        const mesicniUspora = staryVysledek - novyVysledek;
        const celkovaUspora = mesicniUspora * n;
        const noveCelkoveUroky = (novyVysledek * n) - P;

        if (mesicniUspora > 0) {
            document.getElementById("vysledekRefin").textContent = "Měsíčně ušetříte: " + Math.round(mesicniUspora).toLocaleString("cs-CZ") + " Kč";
        } else {
            document.getElementById("vysledekRefin").textContent = "Nová nabídka se nevyplatí.";
        }

        document.getElementById("detailyRefin").innerHTML =
            "<p>Původní měsíční splátka: <strong>" + Math.round(staryVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Nová měsíční splátka: <strong>" + Math.round(novyVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Celková úspora za " + (n / 12) + " let: <strong style='color: #22c55e;'> " + Math.round(Math.max(0, celkovaUspora)).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafRefin !== null) mujGrafRefin.destroy();

        if (typeof Chart !== "undefined") { vykresliGraf(P, noveCelkoveUroky); }
        else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(P, noveCelkoveUroky); }, 500); }
    });

    function vykresliGraf(P, noveCelkoveUroky) {
        const ctx = document.getElementById("grafRefin").getContext("2d");
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

    // OPRAVENO: Sekvenční řetězení Enteru pro refinancování
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

    setTimeout(function() { document.getElementById("vypocitatRefin").click(); }, 300);
});

