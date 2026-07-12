// AUTOMATICKÉ NAČTENÍ EXTERNÍCH SOUBORŮ (Verze 0.12)
(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitatMzdu"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafMzda = null;

    document.getElementById("vypocitatMzdu").addEventListener("click", function() {
        const hruba = parseFloat(document.getElementById("hrubaMzda").value);

        if (isNaN(hruba) || hruba <= 0) {
            return;
        }

        // Aktuální sazebník odvodů zaměstnance
        const szPojisteniSazba = 0.071; 
        const zdPojisteniSazba = 0.045; 
        const danSazba = 0.15;          
        const slevaPoplatnik = 2570;    

        // Výpočty jednotlivých složek
        const socPoj = Math.ceil(hruba * szPojisteniSazba);
        const zdravPoj = Math.ceil(hruba * zdPojisteniSazba);
        
        let danPredSlevou = Math.ceil(hruba * danSazba);
        let cistaDan = danPredSlevou - slevaPoplatnik;
        if (cistaDan < 0) cistaDan = 0; 

        const cistaMzda = hruba - socPoj - zdravPoj - cistaDan;

        document.getElementById("vysledekMzda").textContent = "Čistá mzda: " + Math.round(cistaMzda).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailyMzda").innerHTML =
            "<p>Sociální pojištění: <strong>" + socPoj.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Zdravotní pojištění: <strong>" + zdravPoj.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Daň z příjmu po slevě: <strong>" + cistaDan.toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (window.ChartJsPripraven && typeof Chart !== "undefined") {
            if (mujGrafMzda !== null) mujGrafMzda.destroy();
            const ctx = document.getElementById("grafMzda").getContext("2d");
            mujGrafMzda = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["Čistá mzda", "Sociální pojištění", "Zdravotní pojištění", "Daň z příjmu"],
                    datasets: [{ data: [cistaMzda, socPoj, zdravPoj, cistaDan], backgroundColor: ["#22c55e", "#4f46e5", "#f97316", "#ef4444"] }]
                },
                options: { responsive: true, plugins: { legend: { position: "bottom" } } }
            });
        }
    });

    const inputHruba = document.getElementById("hrubaMzda");
    const tlacitkoVypocitatMzdu = document.getElementById("vypocitatMzdu");

    if (inputHruba && tlacitkoVypocitatMzdu) {
        inputHruba.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                tlacitkoVypocitatMzdu.click();
            }
        });
    }

    // OPRAVENO: Název tlačítka změněn na správné vypocitatMzdu pro plynulý start grafu
    if (window.ChartJsPripraven) {
        var tlacitkoStart = document.getElementById("vypocitatMzdu");
        if (tlacitkoStart) tlacitkoStart.click();
    }
});