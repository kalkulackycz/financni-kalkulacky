(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; vypoctiMzdu(); };
    document.head.appendChild(s2);
})();

const CONFIG = {
    SLEVA_POPLATNIK: 2570,
    INVALIDITA: { 1: 210, 2: 210, 3: 420 },
    SLEVA_ZTP: 1345,
    PRUMERNA_MZDA: 48967,
    get LIMIT_DAN_23_MESIC() { return Math.floor((this.PRUMERNA_MZDA * 3) / 100) * 100; },
    MIN_PRIJEM_ROCNI_BONUS: 134400,
    MAX_DANOVY_BONUS_MESIC: 5025,
    DETI_SAZBY: { 1: 1267, 2: 1860, 3: 2320 }
};

let el = {};
let mujGrafMzda = null;

function validujInput(input, chybaId, napoveda, podminka) {
    const chybaEl = document.getElementById(chybaId);
    if (!chybaEl) return true;
    if (!podminka) {
        chybaEl.innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
        chybaEl.style.display = "block";
        input.classList.add("input-chyba");
        return false;
    } else {
        chybaEl.style.display = "none";
        input.classList.remove("input-chyba");
        return true;
    }
}

function naformatujHrubou() {
    const input = el.hruba;
    let cursorPosition = input.selectionStart;
    const oldVal = input.value;
    
    let val = oldVal.replace(/\s/g, '');
    if (val === "") {
        input.value = "";
        vypoctiMzdu();
        return;
    }
    if (isNaN(val)) return;

    let formatted = parseInt(val, 10).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
    input.value = formatted;

    let diff = formatted.length - oldVal.length;
    input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);

    vypoctiMzdu();
}

// OPRAVA: dle §38h odst. 2 zákona o daních z příjmů se základ pro výpočet MĚSÍČNÍ zálohy
// zaokrouhluje NAHORU (do 100 Kč na celé koruny nahoru, nad 100 Kč na celé stokoruny nahoru).
// Původní kód chybně používal Math.floor (zaokrouhlení dolů), což platí jen pro ROČNÍ základ daně (§16 ZDP), ne pro měsíční zálohu.
function zaokrouhliZakladDane(hruba) {
    if (hruba <= 100) return Math.ceil(hruba);
    return Math.ceil(hruba / 100) * 100;
}
function pojisteni(zaklad, sazba) { return Math.ceil(zaklad * sazba); }

function generujDiteZtpInputs(pocet) {
    if (!el.kontejnerZtp) return;
    const stare = [...document.querySelectorAll(".ztp-dite:checked")].map(e => Number(e.value));
    el.kontejnerZtp.innerHTML = "";
    for (let i = 1; i <= pocet; i++) {
        el.kontejnerZtp.insertAdjacentHTML("beforeend", `
            <div class="sleva-radek">
                <input type="checkbox" class="ztp-dite" value="${i}" id="dite${i}" ${stare.includes(i) ? "checked" : ""}>
                <label for="dite${i}">Dítě ${i} (ZTP/P)</label>
            </div>`);
        document.getElementById(`dite${i}`).addEventListener("change", vypoctiMzdu);
    }
}

function vypoctiMzdu() {
    const chybovaHlaska = document.getElementById("chybova-hlaska");
    if (chybovaHlaska) chybovaHlaska.style.display = "none";

    const hruba = parseFloat(el.hruba.value.replace(/\s/g, '')) || 0;
    const jeHrubaOk = validujInput(el.hruba, "hrubaMzda-chyba", "Např.: 45 000", hruba > 0);
    if (!jeHrubaOk) return;

    const pocetDeti = Number(el.pocetDeti?.value) || 0;
    const ztpDeti = [...document.querySelectorAll(".ztp-dite:checked")].map(e => Number(e.value));
    const jePoplatnik = document.getElementById("slevaPoplatnik")?.checked;
    const invaliditaStupen = Number(document.getElementById("invalidita")?.value) || 0;
    const jeZtpP = document.getElementById("ztpP")?.checked;

    const socPoj = pojisteni(hruba, 0.071);
    const zdravPoj = pojisteni(hruba, 0.045);

    const zaklad = zaokrouhliZakladDane(hruba);
    const dan = (zaklad > CONFIG.LIMIT_DAN_23_MESIC)
        ? Math.ceil(CONFIG.LIMIT_DAN_23_MESIC * 0.15) + Math.ceil((zaklad - CONFIG.LIMIT_DAN_23_MESIC) * 0.23)
        : Math.ceil(zaklad * 0.15);

    let zvyhodneniDeti = 0;
    for (let i = 1; i <= pocetDeti; i++) {
        let sazba = CONFIG.DETI_SAZBY[Math.min(i, 3)];
        if (ztpDeti.includes(i)) sazba *= 2;
        zvyhodneniDeti += sazba;
    }

    const slevyNaDani = (jePoplatnik ? CONFIG.SLEVA_POPLATNIK : 0) +
                        (CONFIG.INVALIDITA[invaliditaStupen] || 0) +
                        (jeZtpP ? CONFIG.SLEVA_ZTP : 0);

    const danPoSlevach = Math.max(0, dan - slevyNaDani);

    let danKPlaceni = danPoSlevach;
    let danovyBonus = 0;
    let danPoZvyhodneni = danPoSlevach - zvyhodneniDeti;

    if (danPoZvyhodneni < 0) {
        const moznyBonus = Math.abs(danPoZvyhodneni);
        danovyBonus = (hruba * 12 >= CONFIG.MIN_PRIJEM_ROCNI_BONUS) ? moznyBonus : 0;
        danKPlaceni = 0;
    } else {
        danKPlaceni = danPoZvyhodneni;
    }

    const cistaMzda = hruba - socPoj - zdravPoj - danKPlaceni + danovyBonus;

    if (el.vysledekText) {
        el.vysledekText.textContent = "Čistý měsíční příjem: " + Math.round(cistaMzda).toLocaleString("cs-CZ") + " Kč";
        el.vysledekText.style.border = "2px solid #22c55e";
        el.vysledekText.style.backgroundColor = "#f0fdf4";
        el.vysledekText.style.padding = "14px 18px";
        el.vysledekText.style.borderRadius = "8px";
        el.vysledekText.style.textAlign = "center";
        el.vysledekText.style.color = "#166534";
        el.vysledekText.style.fontWeight = "bold";
    }

    let slevyTextDetail = "";
    if (slevyNaDani > 0) {
        let castiSlev = [];
        if (jePoplatnik) castiSlev.push("poplatník");
        if (invaliditaStupen > 0) castiSlev.push(`invalidita ${invaliditaStupen}. st.`);
        if (jeZtpP) castiSlev.push("ZTP/P");
        slevyTextDetail = ` (${castiSlev.join(", ")})`;
    }

    el.detaily.innerHTML = `
        <p>Hrubá mzda: <strong>${hruba.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Soc. pojištění: <strong>-${socPoj.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Zdrav. pojištění: <strong>-${zdravPoj.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Daň (před slevami): <strong>${dan.toLocaleString("cs-CZ")} Kč</strong></p>
        ${slevyNaDani > 0 ? `<p style="color:#059669;">Slevy na dani${slevyTextDetail}: <strong>-${slevyNaDani.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
        <p>Daň po slevách: <strong>${danPoSlevach.toLocaleString("cs-CZ")} Kč</strong></p>
        ${zvyhodneniDeti > 0 ? `<p style="color:#059669;">Zvýhodnění na děti (${pocetDeti} ${pocetDeti === 1 ? 'dítě' : pocetDeti < 5 ? 'děti' : 'dětí'}): <strong>-${zvyhodneniDeti.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
        ${danovyBonus > 0 ? `<p style="color:#059669;">Daňový bonus: <strong>+${danovyBonus.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
    `;

    if (window.ChartJsPripraven && typeof Chart !== "undefined" && el.graf) {
        if (mujGrafMzda !== null) mujGrafMzda.destroy();
        const ctx = el.graf.getContext("2d");
        mujGrafMzda = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Čistý příjem", "Odvody", "Daň"],
                datasets: [{ data: [cistaMzda, socPoj + zdravPoj, danKPlaceni], backgroundColor: ["#22c55e", "#4f46e5", "#ef4444"] }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) label += context.parsed.toLocaleString('cs-CZ') + ' Kč';
                                return label;
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

let fontyRobotoNacteny = false;

async function zajistiRobotoFont(doc) {
    if (fontyRobotoNacteny) {
        doc.setFont("Roboto");
        return "Roboto";
    }
    try {
        const [regular, bold] = await Promise.all([
            nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'),
            nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf')
        ]);
        doc.addFileToVFS('Roboto-Regular.ttf', regular);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFileToVFS('Roboto-Medium.ttf', bold);
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        fontyRobotoNacteny = true;
        doc.setFont("Roboto");
        return "Roboto";
    } catch (chyba) {
        console.warn('Nepodařilo se načíst font Roboto pro PDF, použije se záložní font.', chyba);
        doc.setFont("helvetica");
        return "helvetica";
    }
}

function bezpečnýText(text, fontName) {
    if (fontName === 'helvetica') {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return text;
}

async function generujPDFMzda() {
    if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
        alert("Knihovna pro PDF se ještě nenačetla, zkuste to prosím za chvíli.");
        return;
    }

    const tlacitkoExport = el.exportPdfBtn;
    const puvodniTextTlacitka = tlacitkoExport.innerHTML;
    tlacitkoExport.disabled = true;
    tlacitkoExport.style.opacity = '0.7';
    tlacitkoExport.innerHTML = '⏳ Generuji PDF…';

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fontName = await zajistiRobotoFont(doc);

        const hruba = parseFloat(el.hruba.value.replace(/\s/g, '')) || 0;
        const pocetDeti = Number(el.pocetDeti?.value) || 0;
        const ztpDeti = [...document.querySelectorAll(".ztp-dite:checked")].map(e => Number(e.value));
        const jePoplatnik = document.getElementById("slevaPoplatnik")?.checked;
        const invaliditaStupen = Number(document.getElementById("invalidita")?.value) || 0;
        const jeZtpP = document.getElementById("ztpP")?.checked;

        const socPoj = pojisteni(hruba, 0.071);
        const zdravPoj = pojisteni(hruba, 0.045);
        const zaklad = zaokrouhliZakladDane(hruba);
        const dan = (zaklad > CONFIG.LIMIT_DAN_23_MESIC)
            ? Math.ceil(CONFIG.LIMIT_DAN_23_MESIC * 0.15) + Math.ceil((zaklad - CONFIG.LIMIT_DAN_23_MESIC) * 0.23)
            : Math.ceil(zaklad * 0.15);

        let zvyhodneniDeti = 0;
        for (let i = 1; i <= pocetDeti; i++) {
            let sazba = CONFIG.DETI_SAZBY[Math.min(i, 3)];
            if (ztpDeti.includes(i)) sazba *= 2;
            zvyhodneniDeti += sazba;
        }

        const slevyNaDani = (jePoplatnik ? CONFIG.SLEVA_POPLATNIK : 0) +
                            (CONFIG.INVALIDITA[invaliditaStupen] || 0) +
                            (jeZtpP ? CONFIG.SLEVA_ZTP : 0);

        const danPoSlevach = Math.max(0, dan - slevyNaDani);
        let danKPlaceni = danPoSlevach;
        let danovyBonus = 0;
        let danPoZvyhodneni = danPoSlevach - zvyhodneniDeti;

        if (danPoZvyhodneni < 0) {
            const moznyBonus = Math.abs(danPoZvyhodneni);
            danovyBonus = (hruba * 12 >= CONFIG.MIN_PRIJEM_ROCNI_BONUS) ? moznyBonus : 0;
            danKPlaceni = 0;
        } else {
            danKPlaceni = danPoZvyhodneni;
        }

        const cistaMzda = hruba - socPoj - zdravPoj - danKPlaceni + danovyBonus;

        // Záhlaví PDF
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(fontName, "bold");
        doc.text(bezpečnýText("Výpočet čisté mzdy", fontName), 105, 20, { align: 'center' });

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont(fontName, "normal");
        doc.text(bezpečnýText(`Datum výpočtu: ${new Date().toLocaleDateString("cs-CZ")}`, fontName), 105, 38, { align: 'center' });

        // Zelený rámeček pro výsledek v PDF
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, 44, 182, 24, 3, 3, 'FD');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(16);
        doc.setFont(fontName, "bold");
        doc.text(bezpečnýText(`Čistý měsíční příjem: ${Math.round(cistaMzda).toLocaleString("cs-CZ")} Kč`, fontName), 105, 60, { align: 'center' });

        let slevyNazev = "Slevy na dani";
        let castiSlev = [];
        if (jePoplatnik) castiSlev.push("poplatník");
        if (invaliditaStupen > 0) castiSlev.push(`inv. ${invaliditaStupen}. st.`);
        if (jeZtpP) castiSlev.push("ZTP/P");
        if (castiSlev.length > 0) slevyNazev += ` (${castiSlev.join(", ")})`;

        let detiNazev = `Daňové zvýhodnění na děti (${pocetDeti} ${pocetDeti === 1 ? 'dítě' : pocetDeti < 5 ? 'děti' : 'dětí'})`;

        const tabulkaData = [
            ["Hrubá mzda", `${hruba.toLocaleString("cs-CZ")} Kč`],
            ["Sociální pojištění (7,1 %)", `-${socPoj.toLocaleString("cs-CZ")} Kč`],
            ["Zdravotní pojištění (4,5 %)", `-${zdravPoj.toLocaleString("cs-CZ")} Kč`],
            ["Daň z příjmů (před slevami)", `${dan.toLocaleString("cs-CZ")} Kč`],
            [slevyNazev, `-${slevyNaDani.toLocaleString("cs-CZ")} Kč`],
            ["Daň po slevách", `${danPoSlevach.toLocaleString("cs-CZ")} Kč`],
            [detiNazev, `-${zvyhodneniDeti.toLocaleString("cs-CZ")} Kč`],
            ["Daňový bonus", `+${danovyBonus.toLocaleString("cs-CZ")} Kč`],
            ["Výsledná daň k úhradě", `${danKPlaceni.toLocaleString("cs-CZ")} Kč`],
            ["Čistý měsíční příjem", `${Math.round(cistaMzda).toLocaleString("cs-CZ")} Kč`]
        ];

        const bezpecnaTabulkaData = tabulkaData.map(radek => [
            bezpečnýText(radek[0], fontName),
            radek[1]
        ]);

        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                startY: 75,
                head: [[bezpečnýText("Položka", fontName), "Částka"]],
                body: bezpecnaTabulkaData,
                theme: "striped",
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", font: fontName },
                styles: { fontSize: 9.5, cellPadding: 3.5, font: fontName },
                columnStyles: { 1: { halign: "right", fontStyle: "bold" } }
            });
        }

        const pocetStran = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pocetStran; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont(fontName, "normal");
            doc.text(bezpečnýText("Generováno z webu Finanční mapa. Kalkulačka slouží pouze pro orientační výpočet.", fontName), 105, 285, { align: 'center' });
        }

        doc.save("vypocet-ciste-mzdy.pdf");
    } catch (chyba) {
        console.error('Export PDF selhal:', chyba);
        alert('Export do PDF se bohužel nezdařil. Zkuste to prosím znovu.');
    } finally {
        tlacitkoExport.disabled = false;
        tlacitkoExport.style.opacity = '';
        tlacitkoExport.innerHTML = puvodniTextTlacitka;
    }
}

window.addEventListener("DOMContentLoaded", function() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ikona-otaznik')) {
            const bublina = e.target.nextElementSibling;
            if (bublina && bublina.classList.contains('bublina-text')) {
                document.querySelectorAll('.bublina-text').forEach(b => {
                    if (b !== bublina) b.classList.remove('aktivni');
                });
                bublina.classList.toggle('aktivni');
                if (bublina.classList.contains('aktivni')) {
                    setTimeout(() => bublina.classList.remove('aktivni'), 3000);
                }
                e.stopPropagation();
            }
        } else {
            document.querySelectorAll('.bublina-text').forEach(b => b.classList.remove('aktivni'));
        }
    });

    el = {
        hruba: document.getElementById("hrubaMzda"),
        slider: document.getElementById("hrubaMzda-slider"),
        pocetDeti: document.getElementById("pocetDeti"),
        tlacitko: document.getElementById("vypocitatMzdu"),
        graf: document.getElementById("grafMzda"),
        kontejnerZtp: document.getElementById("kontejner-ztp-deti"),
        detaily: document.getElementById("detailyMzda"),
        vysledekText: document.getElementById("vysledekMzda"),
        exportPdfBtn: document.getElementById("export-pdf")
    };

    if (el.pocetDeti) {
        el.pocetDeti.addEventListener('change', () => { generujDiteZtpInputs(Number(el.pocetDeti.value) || 0); vypoctiMzdu(); });
        generujDiteZtpInputs(Number(el.pocetDeti.value) || 0);
    }

    ["slevaPoplatnik", "invalidita", "ztpP"].forEach(id => document.getElementById(id)?.addEventListener("change", vypoctiMzdu));
    
    // Ošetřeno e.preventDefault(), aby tlačítko neodesílalo formulář / nerefreshovalo stránku
    el.tlacitko?.addEventListener("click", function(e) {
        e.preventDefault();
        vypoctiMzdu();
    });

    el.exportPdfBtn?.addEventListener("click", generujPDFMzda);

    el.slider?.addEventListener("input", function() {
        el.hruba.value = Number(this.value).toLocaleString("cs-CZ").replace(/\u00A0/g, " ");
        vypoctiMzdu();
    });
    
    el.hruba?.addEventListener("input", function() {
        let v = Number(this.value.replace(/\s/g, ''));
        if (!isNaN(v) && el.slider) {
            el.slider.value = Math.min(Math.max(v, 10000), 300000);
        }
        naformatujHrubou();
    });

    el.hruba?.addEventListener("blur", function() {
        naformatujHrubou();
    });

    el.hruba?.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.blur();
            if (el.pocetDeti) {
                el.pocetDeti.focus();
            }
        }
    });

    if (window.ChartJsPripraven) vypoctiMzdu();
});