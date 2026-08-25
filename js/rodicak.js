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
    // Vzhled výsledku řídí sdílená třída .kalkulacka-profi v css/style.css

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
                    backgroundColor: ["#1e1b4b", "#818cf8", "#ef4444"],
                    borderWidth: 3,
                    borderColor: "#ffffff",
                    spacing: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "62%",
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            color: "#334155",
                            font: { size: 13, weight: "600" },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        padding: 10,
                        cornerRadius: 8,
                        titleFont: { weight: "700" },
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

async function nactiFontJakoBase64(url) {
    const odpoved = await fetch(url);
    const buffer = await odpoved.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const kus = 0x8000;
    for (let i = 0; i < bytes.length; i += kus) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + kus));
    }
    return btoa(binary);
}

let cachedRegular = null;
let cachedBold = null;

async function zajistiRobotoFont(doc) {
    try {
        if (!cachedRegular || !cachedBold) {
            const [regular, bold] = await Promise.all([
                nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'),
                nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf')
            ]);
            cachedRegular = regular;
            cachedBold = bold;
        }
        doc.addFileToVFS('Roboto-Regular.ttf', cachedRegular);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFileToVFS('Roboto-Medium.ttf', cachedBold);
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.setFont("Roboto");
        return "Roboto";
    } catch (chyba) {
        console.warn('Nepodařilo se načíst font Roboto pro PDF, použije se výchozí font.', chyba);
        doc.setFont("helvetica");
        return "helvetica";
    }
}

// Funkce pro PDF sjednocená se správným načítáním fontů a diakritikou
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
        const fontName = await zajistiRobotoFont(doc);
        
        doc.setFont(fontName, "bold");
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
            theme: 'striped',
            styles: { font: fontName, fontStyle: 'normal' },
            bodyStyles: { font: fontName },
            headStyles: { fillColor: [79, 70, 229], font: fontName, fontStyle: 'bold' }
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
