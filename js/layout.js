document.addEventListener("DOMContentLoaded", function() {
    // 1. Horní odkaz zpět (vloží se automaticky hned pod nadpis <h1>)
    const zpetNahoruHTML = `
        <div style="max-width: 800px; margin: 0 auto 15px auto; padding: 0 20px;">
            <a href="kalkulacky.html" style="color: #4f46e5; text-decoration: none; font-weight: 500;">← Zpět na všechny kalkulačky</a>
        </div>
    `;

    // 2. Dolní odkaz zpět (vloží se automaticky na konec kalkulačky)
    const zpetDoluHTML = `
        <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="kalkulacky.html" style="color: #4f46e5; text-decoration: none; font-weight: 500;">← Zpět na všechny kalkulačky</a>
        </div>
    `;

    // Vložení horního odkazu pod <h1>
    const h1Element = document.querySelector('.kalkulacka h1');
    if (h1Element) {
        h1Element.insertAdjacentHTML('afterend', zpetNahoruHTML);
    }

    // Vložení dolního odkazu na konec kalkulačky
    const kalkulacka = document.querySelector('.kalkulacka');
    if (kalkulacka) {
        kalkulacka.insertAdjacentHTML('beforeend', zpetDoluHTML);
    }
});