(function() {
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; inicializace(); };
    document.head.appendChild(s2);
})();

let elRp = {};
let mujGrafRp = null;

const PRAVIDLA = {
    2023: { zaklad: 300000, vicercata: 450000, maxRoky: 4 },
    2024: { zaklad: 350000, vicercata: 525000, maxRoky: 3 },
    2026: { zaklad: 350000, vicercata: 700000, maxRoky: 3 },
    2027: { zaklad: 400000, vicercata: 800000, maxRoky: 3 }
};

function inicializace() {
    elRp = {
        rokNarozeni: document.getElementById("rokNarozeni"),
        vicercata: document.getElementById("vicercata"),
        hruba: document.getElementById("hrubaPrijem"),
        pozadovana: document.getElementById("pozadovanaCastka"),
        slider: document.getElementById("pozadovanaCastka-slider"),
        btnVypocet: document.getElementById("vypocitatRp"),
        btnPdf: document.getElementById("export-pdf"),
        vysledekCelkem: document.getElementById("vysledekCelkem"),
        detaily: document.getElementById("detailyRp"),
        graf: document.getElementById("grafRp"),
        chybaCastka: document.getElementById("castka-chyba")
    };

    elRp.hruba.addEventListener("input", () => { naformatujCislo(elRp.hruba); prepoctiLimityASlider(); });
    elRp.pozadovana.addEventListener("input", () => { naformatujCislo(elRp.pozadovana); syncSlider(false); });
    elRp.slider.addEventListener("input", () => { syncSlider(true); });
    
    elRp.rokNarozeni.addEventListener("change", prepoctiLimityASlider);
    elRp.vicercata.addEventListener("change", prepoctiLimityASlider);
    elRp.btnVypocet.addEventListener("click", vypoctiRp);
    
    if (elRp.btnPdf) elRp.btnPdf.addEventListener("click", generujPDFRp);

    prepoctiLimityASlider();
}

function naformatujCislo(inputEl) {
    let cursorPosition = inputEl.selectionStart;
    const oldVal = inputEl.value;
    let val = oldVal.replace(/\s/g, '');
    
    if (val === "") {
        inputEl.value = "";
        return;
    }
    if (isNaN(val)) return;

    let formatted = parseInt(val, 10).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
    inputEl.value = formatted;

    let diff = formatted.length - oldVal.length;
    inputEl.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
}

function ziskejCislo(inputEl) {
    return parseFloat(inputEl.value.replace(/\s/g, '')) || 0;
}

function spoctiMaxLimit(hruba, jeVicercata, rokKlic) {
    let zakladniLimit = jeVicercata && (rokKlic >= 2026) ? 30000 : 15000;
    
    if (hruba > 0) {
        let dvz = (hruba * 12) / 365;
        let penezitaPomocLimit = 30 * dvz * 0.70;
        return Math.max(zakladniLimit, penezitaPomocLimit);
    }
    return zakladniLimit;
}

function prepoctiLimityASlider() {
    let rokKlic = parseInt(elRp.rokNarozeni.value);
    let jeVicercata = elRp.vicercata.checked;
    let hruba = ziskejCislo(elRp.hruba);

    let maximalniMesicne = Math.floor(spoctiMaxLimit(hruba, jeVicercata, rokKlic));
    
    elRp.slider.max = maximalniMesicne;
    
    let soucasnaPozadovana = ziskejCislo(elRp.pozadovana);
    if (soucasnaPozadovana > maximalniMesicne) {
        elRp.pozadovana.value = maximalniMesicne.toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        elRp.slider.value = maximalniMesicne;
    }

    vypoctiRp();
}

function syncSlider(odSlideru) {
    if (odSlideru) {
        elRp.pozadovana.value = parseInt(elRp.slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
    } else {
        let hodnota = ziskejCislo(elRp.pozadovana);
        elRp.slider.value = hodnota <= elRp.slider.max ? hodnota : elRp.slider.max;
    }
    vypoctiRp();
}

function vypoctiRp() {
    let rokKlic = parseInt(elRp.rokNarozeni.value);
    let jeVicercata = elRp.vicercata.checked;
    let hruba = ziskejCislo(elRp.hruba);
    let pozadovana = ziskejCislo(elRp.pozadovana);

    let pravidla = PRAVIDLA[rokKlic];
    let celkovaCastka = jeVicercata ? pravidla.vicercata : pravidla.zaklad;
    let maxMesicuZakon = pravidla.maxRoky * 12;

    let absolutniMaxLimit = Math.floor(spoctiMaxLimit(hruba, jeVicercata, rokKlic));

    if (pozadovana > absolutniMaxLimit) {
        elRp.chybaCastka.innerHTML = `Váš měsíční limit je max. <strong>${absolniMaxLimit.toLocaleString("cs-CZ")} Kč</strong>.`;
        elRp.chybaCastka.style.display = "block";
        elRp.pozadovana.classList.add("input-chyba");
        pozadovana = absolutniMaxLimit; 
    } else if (pozadovana <= 0) {
        elRp.chybaCastka.innerHTML = `Částka musí být větší než nula.`;
        elRp.chybaCastka.style.display = "block";
        elRp.pozadovana.classList.add("input-chyba");
        return;
    } else {
        elRp.chybaCastka.style.display = "none";
        elRp.pozadovana.classList.remove("input-chyba");
    }

    let plnychMesicu = Math.floor(celkovaCastka / pozadovana);
    let zbytek = celkovaCastka % pozadovana;
    
    let skutecnychMesicuCelkem = plnychMesicu + (zbytek > 0 ? 1 : 0);
    
    let varovani = "";
    if (skutecnychMesicuCelkem > maxMesicuZakon) {
        varovani = `<p style="color: #ef4444; font-weight: bold;">⚠️ Upozornění: Vaše měsíční částka je příliš nízká. Příspěvek můžete čerpat maximálně ${maxMesicuZakon} měsíců. Zbytek peněz by propadl. Zvyšte měsíční částku alespoň na ${Math.ceil(celkovaCastka/maxMesicuZakon).toLocaleString("cs-CZ")} Kč.</p>`;
    }

    elRp.vysledekCelkem.textContent = "Celkový nárok: " + celkovaCastka.toLocaleString("cs-CZ") + " Kč";
    elRp.vysledekCelkem.style.border = "2px solid #22c55e";
    elRp.vysledekCelkem.style.backgroundColor = "#f0fdf4";
    elRp.vysledekCelkem.style.padding = "14px 18px";
    elRp.vysledekCelkem.style.borderRadius = "8px";
    elRp.vysledekCelkem.style.textAlign = "center";
    elRp.vysledekCelkem.style.color = "#166534";

    elRp.detaily.innerHTML = `
        <p>Měsíční výplata: <strong>${pozadovana.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Doba pobírání: <strong>${plnychMesicu} měsíců</strong> (plná částka)</p>
        ${zbytek > 0 ? `<p>Poslední ${plnychMesicu + 1}. měsíc obdržíte: <strong>${zbytek.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
        <p>Váš maximální legislativní měsíční limit: <strong>${absolutniMaxLimit.toLocaleString("cs-CZ")} Kč</strong></p>
        ${varovani}
    `;

    // Vykreslení grafu (Doba pobírání vs nevyužité měsíce do limitu 3 nebo 4 let)
    if (window.ChartJsPripraven && typeof Chart !== "undefined" && elRp.graf) {
        if (mujGrafRp !== null) mujGrafRp.destroy();
        const ctx = elRp.graf.getContext("2d");
        
        let vycerpano = Math.min(skutecnychMesicuCelkem, maxMesicuZakon);
        let propadnuto = skutecnychMesicuCelkem > maxMesicuZakon ? (skutecnychMesicuCelkem - maxMesicuZakon) : 0;
        let zbyvaMesicu = Math.max(0, maxMesicuZakon - vycerpano);

        mujGrafRp = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Měsíce čerpání", "Volné měsíce (do limitu věku)", "Propadnuté měsíce"],
                datasets: [{ 
                    data: [vycerpano, zbyvaMesicu, propadnuto], 
                    backgroundColor: ["#4f46e5", "#e2e8f0", "#ef4444"] 
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.parsed} měs.`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Funkce pro PDF zůstává podobná předloze z mzdové kalkulačky
async function generujPDFRp() {
    if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
        alert("Knihovna pro PDF se ještě nenačetla.");
        return;
    }
    const tlacitkoExport = elRp.btnPdf;
    tlacitkoExport.disabled = true;
    tlacitkoExport.innerHTML = '⏳ Generuji PDF…';

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Plán čerpání rodičovského příspěvku", 14, 20);
        
        const rok = elRp.rokNarozeni.options[elRp.rokNarozeni.selectedIndex].text;
        const jeVicercata = elRp.vicercata.checked ? "Ano" : "Ne";
        
        doc.autoTable({
            startY: 30,
            body: [
                ["Narození dítěte:", rok],
                ["Vícerčata:", jeVicercata],
                ["Celkový nárok:", elRp.vysledekCelkem.innerText.replace('Celkový nárok: ', '')],
            ],
        });
        
        doc.save("rodicovsky-prispevek-plan.pdf");
    } catch (e) {
        console.error(e);
        alert("Chyba při tvorbě PDF.");
    } finally {
        tlacitkoExport.disabled = false;
        tlacitkoExport.innerHTML = '📥 Stáhnout PDF plán';
    }
}