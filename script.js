document.getElementById('vypocitat').addEventListener('click', () => {
    const page = window.location.pathname;
    let vysledek = 0;

    if (page.includes('index.html')) {
        let c = document.getElementById('castka').value;
        let u = document.getElementById('urok').value / 100 / 12;
        let d = document.getElementById('doba').value * 12;
        vysledek = (c * u) / (1 - Math.pow(1 + u, -d));
        document.getElementById('vysledek').innerHTML = "Měsíční splátka: " + Math.round(vysledek) + " Kč";
    } 
    else if (page.includes('sporeni.html')) {
        let v = parseFloat(document.getElementById('vklad').value);
        let u = parseFloat(document.getElementById('urok').value) / 100 / 12;
        let d = parseFloat(document.getElementById('doba').value) * 12;
        vysledek = v * ((Math.pow(1 + u, d) - 1) / u);
        document.getElementById('vysledek').innerHTML = "Naspořeno celkem: " + Math.round(vysledek) + " Kč";
    }
    else if (page.includes('pujcka.html')) {
        let c = document.getElementById('castka').value;
        let u = document.getElementById('urok').value / 100 / 12;
        let d = document.getElementById('doba').value * 12;
        vysledek = (c * u) / (1 - Math.pow(1 + u, -d));
        document.getElementById('vysledek').innerHTML = "Měsíční splátka: " + Math.round(vysledek) + " Kč";
    }
});