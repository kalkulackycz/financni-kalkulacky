window.addEventListener("DOMContentLoaded", function() {
    let mujGraf = null;

    // NOVĚ PŘIDÁNO: Přeskakování mezi políčky pomocí klávesy Enter
    const inputCastka = document.getElementById("castka");
    const inputUrok = document.getElementById("urok");
    const inputDoba = document.getElementById("doba");
    const tlacitkoVypocitat = document.getElementById("vypocitat");

    if (inputCastka && inputUrok && inputDoba && tlacitkoVypocitat) {
        inputCastka.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                inputUrok.focus();
            }
        });

        inputUrok.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                inputDoba.focus();
            }
        });

        inputDoba.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                tlacitkoVypocitat.click(); // Na posledním políčku Enter rovnou spočítá výsledky
            }
        });
    }

    document.getElementById("vypocitat").addEventListener("click", function() {
        const P = parseFloat(document.getElementById("castka").value);
        const rocniSazba = parseFloat(document.getElementById("urok").value);
        const n = parseFloat(document.getElementById("doba").value) * 12;
        const r = rocniSazba / 100 / 12;

        const mesicniSplatka = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const vysledek = Math.round(mesicniSplatka);
        const celkemZaplaceno = Math.round(mesicniSplatka * n);
        const celkoveUroky = celkemZaplaceno - P;

        document.getElementById("vysledek").textContent =
            "Měsíční splátka: " + vysledek.toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detaily").innerHTML =
            "<p>Celkem zaplatíte: <strong>" + celkemZaplaceno.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Z toho na úrocích: <strong>" + Math.round(celkoveUroky).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGraf !== null) mujGraf.destroy();

        const ctx = document.getElementById("graf").getContext("2d");
        mujGraf = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Jistina (půjčené peníze)", "Úroky"],
                datasets: [{ data: [P, celkoveUroky], backgroundColor: ["#4f46e5", "#f97316"] }]
            },
            options: { responsive: true, plugins: { legend: { position: "bottom" } } }
        });
    });

    document.getElementById("vypocitat").click();
});
