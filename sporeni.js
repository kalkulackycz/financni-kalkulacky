(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafSporeni = null;

    document.getElementById("vypocitatSporeni").addEventListener("click", function() {
        const vklad = parseFloat(document.getElementById("mesicniVklad").value);
        const rocniUrok = parseFloat(document.getElementById("urokSporeni").value);
        const roky = parseFloat(document.getElementById("dobaSporeni").value);
        
        if (isNaN(vklad) || isNaN(rocniUrok) || isNaN(roky) || vklad <= 0) {
            alert("Prosím, vyplňte všechny hodnoty správně.");
            return;
        }

        const mesice = roky * 12;
        const r = rocniUrok / 100 / 12;
        let celkemVlozeno = vklad * mesice;
        let celkovaCastka = r > 0 ? vklad * ((Math.pow(1 + r, mesice) - 1) / r) * (1 + r) : celkemVlozeno;
        const urokCelkem = celkovaCastka - celkemVlozeno;

        document.getElementById("vysledekSporeni").textContent =
            "Naspořená částka: " + Math.round(celkovaCastka).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailySporeni").innerHTML =
            "<p>Celkem vloženo: <strong>" + Math.round(celkemVlozeno).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Získaný úrok: <strong>" + Math.round(urokCelkem).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafSporeni !== null) mujGrafSporeni.destroy();

        if (typeof Chart !== "undefined") { vykresliGraf(celkemVlozeno, urokCelkem); }
        else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(celkemVlozeno, urokCelkem); }, 500); }
    });

    function vykresliGraf(celkemVlozeno, urokCelkem) {
        const ctx = document.getElementById("grafSporeni").getContext("2d");
        mujGrafSporeni = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Vaše vklady", "Získané úroky"],
                datasets: [{ data: [celkemVlozeno, Math.max(0, urokCelkem)], backgroundColor: ["#4f46e5", "#22c55e"] }]
            },
            options: { responsive: true, plugins: { legend: { position: "bottom" } } }
        });
    }

    const inputVklad = document.getElementById("mesicniVklad");
    const inputUrokSporeni = document.getElementById("urokSporeni");
    const inputDobaSporeni = document.getElementById("dobaSporeni");
    const tlacitkoVypocitatSporeni = document.getElementById("vypocitatSporeni");

    if (inputVklad && inputUrokSporeni && inputDobaSporeni && tlacitkoVypocitatSporeni) {
        inputVklad.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrokSporeni.focus(); } });
        inputUrokSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDobaSporeni.focus(); } });
        inputDobaSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatSporeni.click(); } });
    }

    setTimeout(function() { document.getElementById("vypocitatSporeni").click(); }, 300);
});
