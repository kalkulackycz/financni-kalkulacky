(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafPujcka = null;

    document.getElementById("vypocitatPujcka").addEventListener("click", function() {
        const P = parseFloat(document.getElementById("vysePujcky").value);
        const rocniSazba = parseFloat(document.getElementById("urokPujcka").value);
        const poplatek = parseFloat(document.getElementById("poplatek").value);
        const n = parseFloat(document.getElementById("dobaPujcka").value) * 12;
        const r = rocniSazba / 100 / 12;

        if (isNaN(P) || isNaN(rocniSazba) || isNaN(poplatek) || isNaN(n) || P <= 0) {
            alert("Prosím, vyplňte všechny hodnoty správně.");
            return;
        }

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
            options: { responsive: true, plugins: { legend: { position: "bottom" } } }
        });
    }

    // OPRAVENO: Přesné cílení prvků pro sjíždění dolů přes Enter
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
