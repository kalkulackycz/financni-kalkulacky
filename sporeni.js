let grafSporeni = null;

document.getElementById("vypocitatSporeni").addEventListener("click", function() {
    const vklad = parseFloat(document.getElementById("mesicniVklad").value);
    const rocniUrok = parseFloat(document.getElementById("urokSporeni").value) / 100;
    const roky = parseFloat(document.getElementById("dobaSporeni").value);
    
    let celkem = 0;
    for (let i = 0; i < roky * 12; i++) {
        celkem = (celkem + vklad) * (1 + rocniUrok / 12);
    }
    
    const vkladyCelkem = vklad * roky * 12;
    const zisk = celkem - vkladyCelkem;

    document.getElementById("vysledekSporeni").textContent = "Naspořeno celkem: " + Math.round(celkem).toLocaleString("cs-CZ") + " Kč";
    document.getElementById("detailySporeni").innerHTML = 
        "<p>Vlastní vklady: <strong>" + vkladyCelkem.toLocaleString("cs-CZ") + " Kč</strong></p>" +
        "<p>Úrokový výnos: <strong>" + Math.round(zisk).toLocaleString("cs-CZ") + " Kč</strong></p>";

    if (grafSporeni !== null) grafSporeni.destroy();
    const ctx = document.getElementById("grafSporeni").getContext("2d");
    grafSporeni = new Chart(ctx, {
        type: "doughnut",
        data: { labels: ["Vklady", "Úroky"], datasets: [{ data: [vkladyCelkem, zisk], backgroundColor: ["#4f46e5", "#10b981"] }] },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
});