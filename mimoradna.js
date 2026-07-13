(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafMimoradna = null;

    // Funkce pro formátování vstupu
    function zapnoutFormatovani(inputId) {
        const el = document.getElementById(inputId);
        // Formátujeme až když uživatel vyjede z políčka
        el.addEventListener('blur', function(e) {
            let val = e.target.value.replace(/\s/g, '');
            if (val !== "" && !isNaN(val)) {
                e.target.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
        });
        // Při kliknutí do pole zase odstraníme mezery pro snadnou editaci
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }
    zapnoutFormatovani('aktualniDluh');
    zapnoutFormatovani('vyskaSplatky');

    document.getElementById("vypocitatMimoradnou").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";
        const dluh = parseFloat(document.getElementById("aktualniDluh").value.replace(/\s/g, ''));
        const rocniSazba = parseFloat(document.getElementById("urokMimoradna").value);
        const roky = parseFloat(document.getElementById("zbyvajiciDoba").value);
        const mimoradnaSplatka = parseFloat(document.getElementById("vyskaSplatky").value.replace(/\s/g, ''));

        if (isNaN(dluh) || isNaN(rocniSazba) || isNaN(roky) || isNaN(mimoradnaSplatka) || dluh <= 0 || mimoradnaSplatka <= 0) {
            if (chybovaHlaska) {
                chybovaHlaska.textContent = "Prosím, vyplňte všechny hodnoty správně.";
                chybovaHlaska.style.display = "block";
            }
            return;
        }
        if (mimoradnaSplatka >= dluh) {
            if (chybovaHlaska) {
                chybovaHlaska.textContent = "Mimořádná splátka nemůže být vyšší než samotný dluh.";
                chybovaHlaska.style.display = "block";
            }
            return;
        }

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

    // OPRAVENO: Sjíždění dolů přes 4 políčka pro mimořádné splátky
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

