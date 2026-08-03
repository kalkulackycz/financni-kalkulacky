(function() {
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
        if (!input || !slider) return;

        slider.addEventListener('input', function() {
            if (isFloat) {
                input.value = slider.value.replace('.', ',');
            } else {
                input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            const tlacitko = document.getElementById("vypocitatMimoradnou");
            if (tlacitko) tlacitko.click();
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

    const tlacitkoVypocetMimoradna = document.getElementById("vypocitatMimoradnou");
    if (tlacitkoVypocetMimoradna) {
        tlacitkoVypocetMimoradna.addEventListener("click", function(e) {
            if (e) e.preventDefault();
            const chybovaHlaska = document.getElementById("chybova-hlaska");
            if (chybovaHlaska) chybovaHlaska.style.display = "none";

            const dluhInput = document.getElementById("aktualniDluh");
            const urokInput = document.getElementById("urokMimoradna");
            const dobaInput = document.getElementById("zbyvajiciDoba");
            const splatkaInput = document.getElementById("vyskaSplatky");

            if (!dluhInput || !urokInput || !dobaInput || !splatkaInput) return;

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
            // OPRAVA: puvodni vzorec pri 0% uroku (r=0) delil nulou a vracel NaN.
            // Validace uroku povoluje hodnotu 0 (rocniSazba >= 0), takze k teto chybe realne dochazelo.
            const mesicniSplatka = r === 0
                ? dluh / nPuvodni
                : dluh * (r * Math.pow(1 + r, nPuvodni)) / (Math.pow(1 + r, nPuvodni) - 1);
            const celkemPuvodne = mesicniSplatka * nPuvodni;
            const urokyPuvodne = celkemPuvodne - dluh;
            const novyDluh = dluh - mimoradnaSplatka;
            // OPRAVA: puvodni logaritmicky vzorec pro novy pocet mesicu take pri r=0 delil nulou
            // (log(1+0) = 0 ve jmenovateli). Pri 0% uroku je novy pocet mesicu proste linearni podil.
            let nNove;
            if (r === 0) {
                nNove = novyDluh / mesicniSplatka;
            } else {
                const horniCitatel = Math.log(1 - (novyDluh * r) / mesicniSplatka);
                const spodniJmenovatel = Math.log(1 + r);
                nNove = -horniCitatel / spodniJmenovatel;
            }
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

            const el = document.getElementById("vysledekMimoradna");
            if (el) {
                el.innerText = "Ušetříte na úrocích: " + Math.round(Math.max(0, usporaNaUrocich)).toLocaleString("cs-CZ") + " Kč";
                el.style.border = "2px solid #22c55e";
                el.style.backgroundColor = "#f0fdf4";
                el.style.padding = "14px 18px";
                el.style.borderRadius = "8px";
                el.style.textAlign = "center";
                el.style.color = "#166534";
                el.style.fontWeight = "bold";
            }

            const detailyEl = document.getElementById("detailyMimoradna");
            if (detailyEl) {
                detailyEl.innerHTML =
                    "<p>Hypotéku doplatíte dříve o: <strong>" + textCasu + "</strong></p>" +
                    "<p>Původní celkové úroky: <strong>" + Math.round(urokyPuvodne).toLocaleString("cs-CZ") + " Kč</strong></p>" +
                    "<p>Nové celkové úroky: <strong>" + Math.round(Math.max(0, urokyNove)).toLocaleString("cs-CZ") + " Kč</strong></p>";
            }

            if (mujGrafMimoradna !== null) mujGrafMimoradna.destroy();

            if (typeof Chart !== "undefined") { vykresliGraf(urokyNove, usporaNaUrocich); }
            else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(urokyNove, usporaNaUrocich); }, 500); }
        });
    }

    function vykresliGraf(urokyNove, usporaNaUrocich) {
        const grafEl = document.getElementById("grafMimoradna");
        if (!grafEl) return;
        const ctx = grafEl.getContext("2d");
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

    setTimeout(function() { 
        const tlacitko = document.getElementById("vypocitatMimoradnou");
        if (tlacitko) tlacitko.click(); 
    }, 300);
});