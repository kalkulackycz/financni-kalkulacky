let grafRefin = null;

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

    // Výpočet staré a nové měsíční splátky
    const staryVysledek = P * (rStary * Math.pow(1 + rStary, n)) / (Math.pow(1 + rStary, n) - 1);
    const novyVysledek = P * (rNovy * Math.pow(1 + rNovy, n)) / (Math.pow(1 + rNovy, n) - 1);

    const mesicniUspora = staryVysledek - novyVysledek;
    const celkovaUspora = mesicniUspora * n;
    
    const noveCelkoveUroky = (novyVysledek * n) - P;

    // Výpis hlavního výsledku
    if (mesicniUspora > 0) {
        document.getElementById("vysledekRefin").textContent = 
            "Měsíčně ušetříte: " + Math.round(mesicniUspora).toLocaleString("cs-CZ") + " Kč";
    } else {
        document.getElementById("vysledekRefin").textContent = "Nová nabídka se nevyplatí.";
    }

    // Výpis detailů porovnání
    document.getElementById("detailyRefin").innerHTML =
        "<p>Původní měsíční splátka: <strong>" + Math.round(staryVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
        "<p>Nová měsíční splátka: <strong>" + Math.round(novyVysledek).toLocaleString("cs-CZ") + " Kč</strong></p>" +
        "<p>Celková úspora za " + (n / 12) + " let: <strong style='color: #22c55e;'>" + Math.round(Math.max(0, celkovaUspora)).toLocaleString("cs-CZ") + " Kč</strong></p>";

    // Vykreslení grafu s novým rozložením nákladů
    if (grafRefin !== null) grafRefin.destroy();

    const ctx = document.getElementById("grafRefin").getContext("2d");
    grafRefin = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Zbývající jistina", "Nové budoucí úroky"],
            datasets: [{ 
                data: [P, Math.max(0, noveCelkoveUroky)], 
                backgroundColor: ["#4f46e5", "#f97316"] 
            }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
});
