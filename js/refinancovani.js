(function() {
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    initTooltipHandler();

    let mujGrafRefin = null;

    bindInputFormatting('zbytekDluhu', 'zbytekDluhu-chyba', 'Např.: 2 000 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0, v => parseInt(v).toLocaleString('cs-CZ').replace(/\u00A0/g, ' '));
    bindInputFormatting('staryUrok', 'staryUrok-chyba', 'Např.: 5,9', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    bindInputFormatting('novyUrok', 'novyUrok-chyba', 'Např.: 4,2', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    bindInputFormatting('dobaRefin', 'dobaRefin-chyba', 'Např.: 20', v => !isNaN(v) && parseFloat(v) > 0);

    bindSlider('zbytekDluhu', 'zbytekDluhu-slider', () => document.getElementById("vypocitatRefin").click());
    bindSlider('staryUrok', 'staryUrok-slider', () => document.getElementById("vypocitatRefin").click(), true);
    bindSlider('novyUrok', 'novyUrok-slider', () => document.getElementById("vypocitatRefin").click(), true);
    bindSlider('dobaRefin', 'dobaRefin-slider', () => document.getElementById("vypocitatRefin").click());

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
            data: {
                labels: ["Zbývající jistina", "Nové budoucí úroky"],
                datasets: [{
                    data: [P, Math.max(0, noveCelkoveUroky)],
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
});