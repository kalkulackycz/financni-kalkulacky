(function() {
    var gTagUrl = "https://googletagmanager.com";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cloudflare.com";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitat"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGraf = null;

    document.getElementById("vypocitat").addEventListener("click", function() {
        const P = parseFloat(document.getElementById("castka").value);
        let urokText = document.getElementById("urok").value;
        urokText = urokText.replace(",", ".");
        const rocniSazba = parseFloat(urokText);
        const roky = parseFloat(document.getElementById("doba").value);
        const n = roky * 12;
        const r = rocniSazba / 100 / 12;

        if (isNaN(P) || isNaN(rocniSazba) || isNaN(roky) || P <= 0) {
            return;
        }

        const mesicniSplatka = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const vysledek = Math.round(mesicniSplatka);
        const celkemZaplaceno = Math.round(mesicniSplatka * n);
        const celkoveUroky = celkemZaplaceno - P;

        document.getElementById("vysledek").textContent = "Měsíční splátka: " + vysledek.toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detaily").innerHTML =
            "<p>Celkem zaplatíte: <strong>" + celkemZaplaceno.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Z toho na úrocích: <strong>" + Math.round(celkoveUroky).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (window.ChartJsPripraven && typeof Chart !== "undefined") {
            if (mujGraf !== null) mujGraf.destroy();
            const ctx = document.getElementById("graf").getContext("2d");
            mujGraf = new Chart(ctx, {
                type: "doughnut",
                data: { labels: ["Jistina (půjčené peníze)", "Úroky"], datasets: [{ data: [P, Math.max(0, celkoveUroky)], backgroundColor: ["#4f46e5", "#f97316"] }] },
                options: { responsive: true, plugins: { legend: { position: "bottom" } } }
            });
        }
    });

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
