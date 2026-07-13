(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitat"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGraf = null;

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

    document.getElementById("vypocitat").addEventListener("click", function() {
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

        validujInput(castkaInput, "castka-chyba", "Např.: 3 000 000", jeCastkaOk);
        validujInput(urokInput, "urok-chyba", "Např.: 5,5", jeUrokOk);
        validujInput(dobaInput, "doba-chyba", "Např.: 30", jeDobaOk);

        if (!jeCastkaOk || !jeUrokOk || !jeDobaOk) return;
        const n = roky * 12;
        const r = rocniSazba / 100 / 12;

        const mesicniSplatka = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const vysledek = Math.round(mesicniSplatka);
        const celkemZaplaceno = Math.round(mesicniSplatka * n);
        const celkoveUroky = celkemZaplaceno - P;

        document.getElementById("vysledek").textContent = "Měsíční splátka: " + vysledek.toLocaleString("cs-CZ") + " Kč";
                document.getElementById("detaily").innerHTML =
            "<p>Celkem zaplatíte: <strong>" + celkemZaplaceno.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Z toho na úrocích: <strong>" + Math.round(celkoveUroky).toLocaleString("cs-CZ") + " Kč</strong></p>";

        // Logika tabulky
        const tabulkaTelo = document.querySelector("#amortizacni-tabulka tbody");
        tabulkaTelo.innerHTML = "";
        document.getElementById("sekce-tabulka").style.display = "block";
        document.getElementById("obal-tabulky").style.display = "none";
        document.getElementById("tlacitko-tabulka").classList.remove("aktivni");

        let zbyvajiciJistina = P;
        let kumulovanyUrokRok = 0;
        let kumulovanaJistinaRok = 0;

        for (let m = 1; m <= n; m++) {
            const urokVtomtoMesici = zbyvajiciJistina * r;
            const jistinaVtomtoMesici = mesicniSplatka - urokVtomtoMesici;
            
            kumulovanyUrokRok += urokVtomtoMesici;
            kumulovanaJistinaRok += jistinaVtomtoMesici;
            zbyvajiciJistina -= jistinaVtomtoMesici;

            // Každých 12 měsíců (nebo na konci) přidáme řádek do tabulky
            if (m % 12 === 0 || m === n) {
                const rok = Math.ceil(m / 12);
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${rok}</td><td>${Math.round(kumulovanaJistinaRok).toLocaleString("cs-CZ")} Kč</td><td>${Math.round(kumulovanyUrokRok).toLocaleString("cs-CZ")} Kč</td><td>${Math.max(0, Math.round(zbyvajiciJistina)).toLocaleString("cs-CZ")} Kč</td>`;
                tabulkaTelo.appendChild(tr);
                
                // Vynulovat kumulátory pro další rok
                kumulovanyUrokRok = 0;
                kumulovanaJistinaRok = 0;
            }
        }

        if (window.ChartJsPripraven && typeof Chart !== "undefined") {

            if (mujGraf !== null) mujGraf.destroy();
            const ctx = document.getElementById("graf").getContext("2d");
            mujGraf = new Chart(ctx, {
                type: "doughnut",
                data: { labels: ["Jistina (půjčené peníze)", "Úroky"], datasets: [{ data: [P, Math.max(0, celkoveUroky)], backgroundColor: ["#4f46e5", "#f97316"] }] },
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
    });

    // Ovládání rozbalování tabulky
    document.getElementById("tlacitko-tabulka").onclick = function() {
        const obal = document.getElementById("obal-tabulky");
        this.classList.toggle("aktivni");
        obal.style.display = (obal.style.display === "none") ? "block" : "none";
    };

    // Funkce pro formátování vstupu
    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
        el.addEventListener('blur', function(e) {
            let val = e.target.value.replace(/\s/g, '');
            if (val !== "" && !isNaN(val.replace(",", "."))) {
                e.target.value = (val.includes(",") ? val : parseInt(val).toLocaleString('cs-CZ')).replace(/\u00A0/g, ' ');
            }
            validujInput(el, chybaId, napoveda, validacniFunkce(el.value));
        });
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    zapnoutFormatovani('castka', 'castka-chyba', 'Např.: 3 000 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urok', 'urok-chyba', 'Např.: 5,5', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('doba', 'doba-chyba', 'Např.: 30', v => !isNaN(v) && parseFloat(v) > 0);
    const inputCastka = document.getElementById("castka");
    const inputUrok = document.getElementById("urok");
    const inputDoba = document.getElementById("doba");
    const tlacitkoVypocitat = document.getElementById("vypocitat");

    if (inputCastka && inputUrok && inputDoba && tlacitkoVypocitat) {
        inputCastka.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrok.focus(); } });
        inputUrok.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDoba.focus(); } });
        inputDoba.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitat.click(); } });
    }

    if (window.ChartJsPripraven) {
        document.getElementById("vypocitat").click();
    }
});

