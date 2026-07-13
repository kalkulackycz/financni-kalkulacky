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

    let mujGrafMimoradna = null;

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
                if (inputId === 'aktualniDluh' || inputId === 'vyskaSplatky') {
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
            document.getElementById("vypocitatMimoradnou").click();
        });

        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('aktualniDluh', 'aktualniDluh-slider');
    propojSlider('urokMimoradna', 'urokMimoradna-slider', true);
    propojSlider('zbyvajiciDoba', 'zbyvajiciDoba-slider');
    propojSlider('vyskaSplatky', 'vyskaSplatky-slider');

    document.getElementById("vypocitatMimoradnou").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";
        const dluhInput = document.getElementById("aktualniDluh");
        const urokInput = document.getElementById("urokMimoradna");
        const dobaInput = document.getElementById("zbyvajiciDoba");
        const splatkaInput = document.getElementById("vyskaSplatky");

        const dluh = parseFloat(dluhInput.value.replace(/\s/g, ''));
        const rocniSazba = parseFloat(urokInput.value.replace(",", "."));
        const roky = parseFloat(dobaInput.value);
        const mimoradnaSplatka = parseFloat(splatkaInput.value.replace(/\s/g, ''));

        const jeDluhOk = !isNaN(dluh) && dluh > 0;
        const jeUrokOk = !isNaN(rocniSazba) && rocniSazba >= 0;
        const jeDobaOk = !isNaN(roky) && roky > 0;
        const jeSplatkaOk = !isNaN(mimoradnaSplatka) && mimoradnaSplatka > 0 && mimoradnaSplatka < dluh;

        validujInput(dluhInput, "aktualniDluh-chyba", "Např.: 2 000 000", jeDluhOk);
        validujInput(urokInput, "urokMimoradna-chyba", "Např.: 5,5", jeUrokOk);
        validujInput(dobaInput, "zbyvajiciDoba-chyba", "Např.: 25", jeDobaOk);
        validujInput(splatkaInput, "vyskaSplatky-chyba", "Např.: 100 000 (méně než dluh)", jeSplatkaOk);

        if (!jeDluhOk || !jeUrokOk || !jeDobaOk || !jeSplatkaOk) return;
        const r = rocniSazba / 100 / 12;
        const nPuvodni = roky * 12;
        const mesicniSplatka = dluh * (r * Math.pow(1 + r, nPuvodni)) / (Math.pow(1 + r, nPuvodni) - 1);
        const celkemPuvodne = mesicniSplatka * nPuvodni;
        const urokyPuvodne = celkemPuvodne - dluh;
        const novyDluh = dluh - mimoradnaSplatka;
        const horniCitatel = Math.log(1 - (novyDluh * r) / mesicniSplatka);
        const spodniJmenovatel = Math.log(1 + r);
        const nNove = -horniCitatel / spodniJmenovatel;
        const mesiceNove = Math.ceil(nNove);
        const usetrenoMesicu = nPuvodni - mesiceNove;
        const celkemNoveBezMimoradne = mesicniSplatka * nNove;
        const urokyNove = celkemNoveBezMimoradne - novyDluh;
        const usporaNaUrocich = urokyPuvodne - urokyNove;

        const usporaLet = Math.floor(usetrenoMesicu / 12);
        const usporaZbytekMesicu = usetrenoMesicu % 12;
        let textCasu = "";
        if (usporaLet > 0) textCasu += usporaLet + " " + (usporaLet === 1 ? "rok" : (usporaLet < 5 ? "roky" : "let"));
        if (usporaZbytekMesicu > 0) { if (textCasu !== "") textCasu += " a "; textCasu += usporaZbytekMesicu + " " + (usporaZbytekMesicu === 1 ? "měsíc" : (usporaZbytekMesicu < 5 ? "měsíce" : "měsíců")); }

        document.getElementById("vysledekMimoradna").textContent = "Ušetříte na úrocích: " + Math.round(Math.max(0, usporaNaUrocich)).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailyMimoradna").innerHTML =
            "<p>Hypotéku doplatíte dříve o: <strong>" + textCasu + "</strong></p>" +
            "<p>Původní celkové úroky: <strong>" + Math.round(urokyPuvodne).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Nové celkové úroky: <strong>" + Math.round(Math.max(0, urokyNove)).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafMimoradna !== null) mujGrafMimoradna.destroy();

        if (typeof Chart !== "undefined") { vykresliGraf(urokyNove, usporaNaUrocich); }
        else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(urokyNove, usporaNaUrocich); }, 500); }
    });

    function vykresliGraf(urokyNove, usporaNaUrocich) {
        const ctx = document.getElementById("grafMimoradna").getContext("2d");
        mujGrafMimoradna = new Chart(ctx, {
            type: "doughnut",
            data: { labels: ["Nové úroky", "Čistá finanční úspora"], datasets: [{ data: [Math.round(Math.max(0, urokyNove)), Math.round(Math.max(0, usporaNaUrocich))], backgroundColor: ["#f97316", "#22c55e"] }] },
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

    zapnoutFormatovani('aktualniDluh', 'aktualniDluh-chyba', 'Např.: 2 000 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urokMimoradna', 'urokMimoradna-chyba', 'Např.: 5,5', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('zbyvajiciDoba', 'zbyvajiciDoba-chyba', 'Např.: 25', v => !isNaN(v) && parseFloat(v) > 0);
    zapnoutFormatovani('vyskaSplatky', 'vyskaSplatky-chyba', 'Např.: 100 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    const inputDluh = document.getElementById("aktualniDluh");
    const inputUrokMimoradna = document.getElementById("urokMimoradna");
    const inputZbyvajiciDoba = document.getElementById("zbyvajiciDoba");
    const inputVyskaSplatky = document.getElementById("vyskaSplatky");
    const tlacitkoVypocitatMimoradnou = document.getElementById("vypocitatMimoradnou");

    if (inputDluh && inputUrokMimoradna && inputZbyvajiciDoba && inputVyskaSplatky && tlacitkoVypocitatMimoradnou) {
        inputDluh.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrokMimoradna.focus(); } });
        inputUrokMimoradna.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputZbyvajiciDoba.focus(); } });
        inputZbyvajiciDoba.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputVyskaSplatky.focus(); } });
        inputVyskaSplatky.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatMimoradnou.click(); } });
    }

    setTimeout(function() { document.getElementById("vypocitatMimoradnou").click(); }, 300);
});

