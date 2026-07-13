(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    // Inicializace klikacích otazníků (aby fungovalo i v ostatních JS)
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

    let mujGrafPujcka = null;

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
                 // U částek formátujeme, u procent/let necháváme nebo upravujeme dle typu
                if (inputId !== 'urokPujcka' && inputId !== 'dobaPujcka') {
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
            document.getElementById("vypocitatPujcka").click();
        });

        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('vysePujcky', 'vysePujcky-slider');
    propojSlider('urokPujcka', 'urokPujcka-slider', true);
    propojSlider('poplatek', 'poplatek-slider');
    propojSlider('dobaPujcka', 'dobaPujcka-slider');

    document.getElementById("vypocitatPujcka").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";
        const vyseInput = document.getElementById("vysePujcky");
        const urokInput = document.getElementById("urokPujcka");
        const poplatekInput = document.getElementById("poplatek");
        const dobaInput = document.getElementById("dobaPujcka");

        const P = parseFloat(vyseInput.value.replace(/\s/g, ''));
        const rocniSazba = parseFloat(urokInput.value.replace(",", "."));
        const poplatek = parseFloat(poplatekInput.value.replace(/\s/g, ''));
        const roky = parseFloat(dobaInput.value);

        const jeVyseOk = !isNaN(P) && P > 0;
        const jeUrokOk = !isNaN(rocniSazba) && rocniSazba >= 0;
        const jePoplatekOk = !isNaN(poplatek) && poplatek >= 0;
        const jeDobaOk = !isNaN(roky) && roky > 0;

        validujInput(vyseInput, "vysePujcky-chyba", "Např.: 100 000", jeVyseOk);
        validujInput(urokInput, "urokPujcka-chyba", "Např.: 8,9", jeUrokOk);
        validujInput(poplatekInput, "poplatek-chyba", "Např.: 1 500", jePoplatekOk);
        validujInput(dobaInput, "dobaPujcka-chyba", "Např.: 5", jeDobaOk);

        if (!jeVyseOk || !jeUrokOk || !jePoplatekOk || !jeDobaOk) return;

        const n = roky * 12;
        const r = rocniSazba / 100 / 12;

        const mesicniSplatka = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const vysledek = Math.round(mesicniSplatka);
        const celkemZaplacenoSplatkami = Math.round(mesicniSplatka * n);
        const celkoveUroky = celkemZaplacenoSplatkami - P;
        const celkovaCena = celkemZaplacenoSplatkami + poplatek;

        document.getElementById("vysledekPujcka").textContent =
            "Měsíční splátka: " + vysledek.toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailyPujcka").innerHTML =
            "<p>Celkem na splátkách: <strong>" + celkemZaplacenoSplatkami.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Z toho úroky: <strong>" + Math.round(celkoveUroky).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Celková cena půjčky (vč. poplatku): <strong>" + Math.round(celkovaCena).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafPujcka !== null) mujGrafPujcka.destroy();

        if (typeof Chart !== "undefined") { vykresliGraf(P, celkoveUroky, poplatek); }
        else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(P, celkoveUroky, poplatek); }, 500); }
    });

    function vykresliGraf(P, celkoveUroky, poplatek) {
        const ctx = document.getElementById("grafPujcka").getContext("2d");
        mujGrafPujcka = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Jistina (půjčené peníze)", "Úroky", "Poplatek"],
                datasets: [{ data: [P, Math.max(0, celkoveUroky), poplatek], backgroundColor: ["#4f46e5", "#f97316", "#ef4444"] }]
            },
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

    zapnoutFormatovani('vysePujcky', 'vysePujcky-chyba', 'Např.: 100 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urokPujcka', 'urokPujcka-chyba', 'Např.: 8,9', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('poplatek', 'poplatek-chyba', 'Např.: 1 500', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) >= 0);
    zapnoutFormatovani('dobaPujcka', 'dobaPujcka-chyba', 'Např.: 5', v => !isNaN(v) && parseFloat(v) > 0);
    const inputVyse = document.getElementById("vysePujcky");
    const inputUrokPujcka = document.getElementById("urokPujcka");
    const inputPoplatek = document.getElementById("poplatek");
    const inputDobaPujcka = document.getElementById("dobaPujcka");
    const tlacitkoVypocitatPujcka = document.getElementById("vypocitatPujcka");

    if (inputVyse && inputUrokPujcka && inputPoplatek && inputDobaPujcka && tlacitkoVypocitatPujcka) {
        inputVyse.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrokPujcka.focus(); } });
        inputUrokPujcka.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputPoplatek.focus(); } });
        inputPoplatek.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDobaPujcka.focus(); } });
        inputDobaPujcka.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatPujcka.click(); } });
    }

    setTimeout(function() { document.getElementById("vypocitatPujcka").click(); }, 300);
});

