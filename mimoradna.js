window.addEventListener("DOMContentLoaded", function() {
    let mujGrafMimoradna = null;

    document.getElementById("vypocitatMimoradnou").addEventListener("click", function() {
        const dluh = parseFloat(document.getElementById("aktualniDluh").value);
        const rocniSazba = parseFloat(document.getElementById("urokMimoradna").value);
        const roky = parseFloat(document.getElementById("zbyvajiciDoba").value);
        const mimoradnaSplatka = parseFloat(document.getElementById("vyskaSplatky").value);

        if (isNaN(dluh) || isNaN(rocniSazba) || isNaN(roky) || isNaN(mimoradnaSplatka) || dluh <= 0 || mimoradnaSplatka <= 0) {
            alert("Prosím, vyplňte všechny hodnoty správně.");
            return;
        }

        if (mimoradnaSplatka >= dluh) {
            alert("Mimořádná splátka nemůže být vyšší než samotný dluh.");
            return;
        }

        const r = rocniSazba / 100 / 12;
        const nPuvodni = roky * 12;

        const mesicniSplatka = dluh * (r * Math.pow(1 + r, nPuvodni)) / (Math.pow(1 + r, nPuvodni) - 1);
        
        const celkemPuvodne = mesicniSplatka * nPuvodni;
        const urokyPuvodne = celkemPuvodne - dluh;

        const novyDluh = dluh - mimoradnaSplatka;
        
        const horniCitatel = Math.log(1 - (novyDluh * r) / mesicniSplatka);
        const spodniJmenovatel = Math.log(1 + r);
        const nNove = -horniCitatel / spodniJmenovatel;

        const mesiceNove = Math.ceil(nNove);
        const usetrenoMesicu = nPuvodni - mesiceNove;
        
        const celkemNoveBezMimoradne = mesicniSplatka * nNove;
        const urokyNove = celkemNoveBezMimoradne - novyDluh;
        
        const usporaNaUrocich = urokyPuvodne - urokyNove;

        const usporaLet = Math.floor(usetrenoMesicu / 12);
        const usporaZbytekMesicu = usetrenoMesicu % 12;
        let textCasu = "";
        
        if (usporaLet > 0) {
            textCasu += usporaLet + " " + (usporaLet === 1 ? "rok" : (usporaLet < 5 ? "roky" : "let"));
        }
        if (usporaZbytekMesicu > 0) {
            if (textCasu !== "") textCasu += " a ";
            textCasu += usporaZbytekMesicu + " " + (usporaZbytekMesicu === 1 ? "měsíc" : (usporaZbytekMesicu < 5 ? "měsíce" : "měsíců"));
        }

        document.getElementById("vysledekMimoradna").textContent =
            "Ušetříte na úrocích: " + Math.round(Math.max(0, usporaNaUrocich)).toLocaleString("cs-CZ") + " Kč";
        
        document.getElementById("detailyMimoradna").innerHTML =
            "<p>Hypotéku doplatíte dříve o: <strong>" + textCasu + "</strong></p>" +
            "<p>Původní celkové úroky: <strong>" + Math.round(urokyPuvodne).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Nové celkové úroky: <strong>" + Math.round(Math.max(0, urokyNove)).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafMimoradna !== null) mujGrafMimoradna.destroy();

        const ctx = document.getElementById("grafMimoradna").getContext("2d");
        mujGrafMimoradna = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Nové úroky", "Čistá finanční úspora"],
                datasets: [{ 
                    data: [Math.round(Math.max(0, urokyNove)), Math.round(Math.max(0, usporaNaUrocich))], 
                    backgroundColor: ["#f97316", "#22c55e"] 
                }]
            },
            options: { 
                responsive: true, 
                plugins: { legend: { position: "bottom" } } 
            }
        });
    });

    document.getElementById("vypocitatMimoradnou").click();
});
