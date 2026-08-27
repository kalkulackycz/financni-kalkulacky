(function() {
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    initTooltipHandler();

    let mujGrafPujcka = null;






    bindSlider('vysePujcky', 'vysePujcky-slider', () => document.getElementById("vypocitatPujcka").click());
    bindSlider('urokPujcka', 'urokPujcka-slider', () => document.getElementById("vypocitatPujcka").click(), true);
    bindSlider('poplatek', 'poplatek-slider', () => document.getElementById("vypocitatPujcka").click());
    bindSlider('dobaPujcka', 'dobaPujcka-slider', () => document.getElementById("vypocitatPujcka").click());


    const tlacitkoVypocet = document.getElementById("vypocitatPujcka");
    if (tlacitkoVypocet) {
        tlacitkoVypocet.addEventListener("click", function(e) {
            if (e) e.preventDefault();
            const chybovaHlaska = document.getElementById("chybova-hlaska");
            if (chybovaHlaska) chybovaHlaska.style.display = "none";
            const vyseInput = document.getElementById("vysePujcky");
            const urokInput = document.getElementById("urokPujcka");
            const poplatekInput = document.getElementById("poplatek");
            const dobaInput = document.getElementById("dobaPujcka");

            if (!vyseInput || !urokInput || !poplatekInput || !dobaInput) return;

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

            // OPRAVA: puvodni vzorec pri 0% uroku (r=0) delil nulou ((1+0)^n - 1 = 0) a vracel NaN.
            // Validace uroku povoluje hodnotu 0 (rocniSazba >= 0), takze k teto chybe realne dochazelo.
            const mesicniSplatka = r === 0
                ? P / n
                : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

            // K celkové částce (splátky * počet měsíců) přičteme poplatek
            const celkemZaplaceno = (mesicniSplatka * n) + poplatek;

            // Úroky jsou pouze to, co přeplatíš na splátkách nad rámec půjčené částky (jistiny)
            const celkoveUroky = (mesicniSplatka * n) - P;

            // Formátovací funkce
            const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";

            // Zápis do výsledku se zeleným rámečkem
            const el = document.getElementById("text-vysledek");
            if (el) {
                el.innerText = "Měsíční splátka: " + fmt(mesicniSplatka);
                el.style.border = "2px solid #22c55e";
                el.style.backgroundColor = "#f0fdf4";
                el.style.padding = "14px 18px";
                el.style.borderRadius = "8px";
                el.style.textAlign = "center";
                el.style.color = "#166534";
                el.style.fontWeight = "bold";
            }

            // Zápis do detailů (GRID)
            const detailyEl = document.getElementById("detaily");
            if (detailyEl) {
                detailyEl.innerHTML =
                    `<p>Celkem zaplaceno <strong>${fmt(celkemZaplaceno)}</strong></p>` +
                    `<p>Z toho úroky <strong>${fmt(celkoveUroky)}</strong></p>`;
            }
            if (mujGrafPujcka !== null) mujGrafPujcka.destroy();

            if (typeof Chart !== "undefined") { vykresliGraf(P, celkoveUroky, poplatek); }
            else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(P, celkoveUroky, poplatek); }, 500); }
        });
    }

    function vykresliGraf(P, celkoveUroky, poplatek) {
        const grafEl = document.getElementById("grafPujcka");
        if (!grafEl) return;
        const ctx = grafEl.getContext("2d");
        mujGrafPujcka = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Jistina (půjčené peníze)", "Úroky", "Poplatek"],
                datasets: [{
                    data: [P, Math.max(0, celkoveUroky), Math.max(0, poplatek)],
                    backgroundColor: ["#1e1b4b", "#818cf8", "#c7d2fe"],
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

    bindInputFormatting('vysePujcky', 'vysePujcky-chyba', 'Např.: 100 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0, v => parseInt(v).toLocaleString('cs-CZ').replace(/\u00A0/g, ' '));
    bindInputFormatting('urokPujcka', 'urokPujcka-chyba', 'Např.: 8,9', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0, v => v);
    bindInputFormatting('poplatek', 'poplatek-chyba', 'Např.: 1 500', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) >= 0, v => parseInt(v).toLocaleString('cs-CZ').replace(/\u00A0/g, ' '));
    bindInputFormatting('dobaPujcka', 'dobaPujcka-chyba', 'Např.: 5', v => !isNaN(v) && parseFloat(v) > 0, v => v);
    
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

    setTimeout(function() { 
        const tlacitko = document.getElementById("vypocitatPujcka");
        if (tlacitko) tlacitko.click(); 
    }, 300);
});