let grafSporeni = null;

document.getElementById("vypocitatSporeni").addEventListener("click", function() {
    const mesicniVklad = parseFloat(document.getElementById("mesicniVklad").value);
    const rocniUrok = parseFloat(document.getElementById("urokSporeni").value);
    const roky = parseFloat(document.getElementById("dobaSporeni").value);
    const mesicniUrok = rocniUrok / 100 / 12;
    const pocetMesicu = roky * 12;

    const konecnaHodnota = mesicniVklad * ((Math.pow(1 + mesicniUrok, pocetMesicu) - 1) / mesicniUrok);
    const celkemVlozeno = mesicniVklad * pocetMesicu;
    const vydelaneUroky = konecnaHodnota - celkemVlozeno;

    document.getElementById("vysledekSporeni").textContent =
        "Naspoříte: " + Math.round(konecnaHodnota).toLocaleString("cs-CZ") + " Kč";
    document.getElementById("detailySporeni").innerHTML =
        "<p>Celkem vloženo: <strong>" + Math.round(celkemVlozeno).toLocaleString("cs-CZ") + " Kč</strong></p>" +
        "<p>Vyděláno na úrocích: <strong>" + Math.round(vydelaneUroky).toLocaleString("cs-CZ") + " Kč</strong></p>";

    if (grafSporeni !== null) grafSporeni.destroy();

    const ctx = document.getElementById("grafSporeni").getContext("2d");
    grafSporeni = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Vloženo", "Vyděláno na úrocích"],
            datasets: [{ data: [celkemVlozeno, vydelaneUroky], backgroundColor: ["#4f46e5", "#22c55e"] }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
});