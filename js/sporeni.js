(function() {
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
    // NOVÉ — fallback: při úspěchu i selhání načtení Chart.js se spustí výpočet,
    // aby kalkulačka fungovala i bez grafu (graf se pak prostě nezobrazí)
    s2.onload = function() { window.ChartJsStav = "ok"; if (window._sporeniVypocet) window._sporeniVypocet(); };
    s2.onerror = function() { window.ChartJsStav = "chyba"; if (window._sporeniVypocet) window._sporeniVypocet(); };
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

    let mujGrafSporeni = null;

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
                if (inputId === 'mesicniVklad') {
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
            const tlacitko = document.getElementById("vypocitatSporeni");
            if (tlacitko) tlacitko.click();
        });

        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('mesicniVklad', 'mesicniVklad-slider');
    propojSlider('urokSporeni', 'urokSporeni-slider', true);
    propojSlider('dobaSporeni', 'dobaSporeni-slider');

    const tlacitkoVypocet = document.getElementById("vypocitatSporeni");
    if (tlacitkoVypocet) {
        tlacitkoVypocet.addEventListener("click", function(e) {
            if (e) e.preventDefault();
            const chybovaHlaska = document.getElementById("chybova-hlaska");
            if (chybovaHlaska) chybovaHlaska.style.display = "none";
            
            const vkladInput = document.getElementById("mesicniVklad");
            const urokInput = document.getElementById("urokSporeni");
            const dobaInput = document.getElementById("dobaSporeni");

            if (!vkladInput || !urokInput || !dobaInput) return;

            const vklad = parseFloat(vkladInput.value.replace(/\s/g, ''));
            const rocniUrok = parseFloat(urokInput.value.replace(",", "."));
            const roky = parseFloat(dobaInput.value);

            const jeVkladOk = !isNaN(vklad) && vklad > 0;
            const jeUrokOk = !isNaN(rocniUrok) && rocniUrok >= 0;
            const jeDobaOk = !isNaN(roky) && roky > 0;

            validujInput(vkladInput, "mesicniVklad-chyba", "Např.: 5 000", jeVkladOk);
            validujInput(urokInput, "urokSporeni-chyba", "Např.: 4", jeUrokOk);
            validujInput(dobaInput, "dobaSporeni-chyba", "Např.: 10", jeDobaOk);

            if (!jeVkladOk || !jeUrokOk || !jeDobaOk) return;
            const mesice = roky * 12;
            const r = rocniUrok / 100 / 12;
            let celkemVlozeno = vklad * mesice;
            let celkovaCastka = r > 0 ? vklad * ((Math.pow(1 + r, mesice) - 1) / r) * (1 + r) : celkemVlozeno;
            const urokCelkem = celkovaCastka - celkemVlozeno;

            const vysledekEl = document.getElementById("vysledekSporeni");
            if (vysledekEl) {
                // Vzhled výsledku řídí sdílená třída .kalkulacka-profi v css/style.css
                vysledekEl.textContent = "Naspořená částka: " + Math.round(celkovaCastka).toLocaleString("cs-CZ") + " Kč";
            }

            const detailyEl = document.getElementById("detailySporeni");
            if (detailyEl) {
                detailyEl.innerHTML =
                    "<p>Celkem vloženo: <strong>" + Math.round(celkemVlozeno).toLocaleString("cs-CZ") + " Kč</strong></p>" +
                    "<p>Získaný úrok: <strong>" + Math.round(urokCelkem).toLocaleString("cs-CZ") + " Kč</strong></p>";
            }

            if (mujGrafSporeni !== null) mujGrafSporeni.destroy();

            if (typeof Chart !== "undefined") { vykresliGraf(celkemVlozeno, urokCelkem); }
            else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(celkemVlozeno, urokCelkem); }, 500); }
        });
    }

    function vykresliGraf(celkemVlozeno, urokCelkem) {
        const grafEl = document.getElementById("grafSporeni");
        if (!grafEl) return;
        const ctx = grafEl.getContext("2d");
        mujGrafSporeni = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Vaše vklady", "Získané úroky"],
                datasets: [{
                    data: [Math.max(0, celkemVlozeno), Math.max(0, urokCelkem)],
                    backgroundColor: ["#1e1b4b", "#818cf8"],
                    borderWidth: 3,
                    borderColor: "#ffffff",
                    spacing: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "62%",
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            color: "#334155",
                            font: { size: 13, weight: "600" },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        padding: 10,
                        cornerRadius: 8,
                        titleFont: { weight: "700" },
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

    zapnoutFormatovani('mesicniVklad', 'mesicniVklad-chyba', 'Např.: 5 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urokSporeni', 'urokSporeni-chyba', 'Např.: 4', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('dobaSporeni', 'dobaSporeni-chyba', 'Např.: 10', v => !isNaN(v) && parseFloat(v) > 0);

    const inputVklad = document.getElementById("mesicniVklad");
    const inputUrokSporeni = document.getElementById("urokSporeni");
    const inputDobaSporeni = document.getElementById("dobaSporeni");
    const tlacitkoVypocitatSporeni = document.getElementById("vypocitatSporeni");

    if (inputVklad && inputUrokSporeni && inputDobaSporeni && tlacitkoVypocitatSporeni) {
        inputVklad.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrokSporeni.focus(); } });
        inputUrokSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDobaSporeni.focus(); } });
        inputDobaSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatSporeni.click(); } });
    }

    // NOVÉ — první výpočet: spustí se po načtení DOM i po doběhu/erru Chart.js;
    // pojistný časovač zajistí výpočet, i kdyby se knihovna grafu nenačetla vůbec
    window._sporeniVypocet = function() {
        const tlacitko = document.getElementById("vypocitatSporeni");
        if (tlacitko) tlacitko.click();
    };
    if (window.ChartJsStav) window._sporeniVypocet();
    setTimeout(function() {
        const vysledekEl = document.getElementById("vysledekSporeni");
        if (!vysledekEl || !vysledekEl.textContent) window._sporeniVypocet();
    }, 1500);
});