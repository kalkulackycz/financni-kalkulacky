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

    // Správný přístup k přepsání dat v poli [0]
    if (mujGrafPujcka !== null) {
        mujGrafPujcka.data.datasets[0].data = [P, Math.max(0, celkoveUroky), poplatek];
        mujGrafPujcka.update(); 
    } else {
        const ctx = document.getElementById("grafPujcka").getContext("2d");
        mujGrafPujcka = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Jistina (půjčené peníze)", "Úroky", "Poplatek"],
                datasets: [{ data: [P, Math.max(0, celkoveUroky), poplatek], backgroundColor: ["#4f46e5", "#f97316", "#ef4444"] }]
            },
            options: { 
                responsive: true, 
                plugins: { legend: { position: "bottom" } },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }
        });
    }
});

document.getElementById("vypocitatPujcka").click();
