const btn = document.getElementById('vypocitat');
let mujGraf;

if (btn) {
    btn.addEventListener('click', () => {
        let c = document.getElementById('castka').value;
        let u = document.getElementById('urok').value / 100 / 12;
        let d = document.getElementById('doba').value * 12;
        let splatka = (c * u) / (1 - Math.pow(1 + u, -d));
        
        document.getElementById('vysledek').innerHTML = "Měsíční splátka: " + Math.round(splatka) + " Kč";

        const ctx = document.getElementById('graf').getContext('2d');
        if (mujGraf) mujGraf.destroy();
        mujGraf = new Chart(ctx, {
            type: 'pie',
            data: { labels: ['Jistina', 'Úroky'], datasets: [{ data: [c, splatka * d - c], backgroundColor: ['#4f46e5', '#e2e8f0'] }] }
        });
    });
}