(function() {
    var gTagUrl = "https://googletagmanager.com";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cloudflare.com";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafRefin = null;

    document.getElementById("vypocitatRefin").addEventListener("click", function() {
        const P = parseFloat(document.getElementById("zbytekDluhu").value);
        const staryUrokRocni = parseFloat(document.getElementById("staryUrok").value);
        const novyUrokRocni = parseFloat(document.getElementById("novyUrok").value);
        const n = parseFloat(document.getElementById("dobaRefin").value) * 12;
        const rStary = staryUrokRocni / 100 / 12;
        const rNovy = novyUrokRocni / 100 / 12;

        if (isNaN(P) || isNaN(staryUrokRocni) || isNaN(novyUrokRocni) || isNaN(n) || P <= 0) {
            alert("Prosím, vyplňte všechny hodnoty správně.");
            return;
        }

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
            options: { responsive: true, plugins: { legend: { position: "bottom" } } }
        });
    }

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
