(function(){
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s = document.createElement("script");
    s.src = chartUrl;
    // NOVÉ — fallback: kalkulačka se musí inicializovat i když se Chart.js nenačte,
    // jen se pak nezobrazí graf (výpočet a výsledky fungují dál)
    s.onload = function(){ window.ChartJsNemocenska = "ok"; if (window._nemocenskaInit) window._nemocenskaInit(); };
    s.onerror = function(){ window.ChartJsNemocenska = "chyba"; if (window._nemocenskaInit) window._nemocenskaInit(); };
    document.head.appendChild(s);
})();

const NEMO_CONFIG = {
    RED_HRANICE: [1633, 2449, 4897],
    RED_PROC: [0.90, 0.60, 0.30],
    SAZBY_DNU: [
        { from: 15, to: 30, rate: 0.60 },
        { from: 31, to: 60, rate: 0.66 },
        { from: 61, to: 99999, rate: 0.72 }
    ],
    NAHRADA_PRVNI_14_RATE: 0.60
};

let el = {};
let mujGraf = null;

function validujInput(input, chybaId, napoveda, podminka) {
    const chybaEl = document.getElementById(chybaId);
    if (!chybaEl) return true;
    if (!podminka) {
        chybaEl.innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
        chybaEl.style.display = "block";
        input.classList.add("input-chyba");
        return false;
    }

    chybaEl.style.display = "none";
    input.classList.remove("input-chyba");
    return true;
}

function fmtKc(n) {
    return Math.round(n).toLocaleString('cs-CZ') + ' Kč';
}

async function nactiFontJakoBase64(url) {
    const odpoved = await fetch(url);
    const buffer = await odpoved.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const kus = 0x8000;
    for (let i = 0; i < bytes.length; i += kus) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + kus));
    }
    return btoa(binary);
}

let cachedRobotoRegular = null;
let cachedRobotoBold = null;

async function zajistiRobotoFont(doc) {
    try {
        if (!cachedRobotoRegular || !cachedRobotoBold) {
            const [regular, bold] = await Promise.all([
                nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'),
                nactiFontJakoBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf')
            ]);
            cachedRobotoRegular = regular;
            cachedRobotoBold = bold;
        }
        doc.addFileToVFS('Roboto-Regular.ttf', cachedRobotoRegular);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFileToVFS('Roboto-Medium.ttf', cachedRobotoBold);
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.setFont('Roboto');
        return 'Roboto';
    } catch (e) {
        console.warn('Nepodařilo se načíst font Roboto pro PDF, použije se výchozí font.', e);
        doc.setFont('helvetica');
        return 'helvetica';
    }
}

function bezpecnyText(text, fontName) {
    if (fontName === 'helvetica') {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return text;
}

function vypocitejDenniVymZaklad(hrubaMesic) {
    const rocniVZ = hrubaMesic * 12;
    return rocniVZ / 365.0;
}

function redukujDenniZaklad(dvz) {
    const h = NEMO_CONFIG.RED_HRANICE;
    const p = NEMO_CONFIG.RED_PROC;
    let zbyva = dvz;
    let redukovane = 0;

    const cast1 = Math.min(zbyva, h[0]);
    redukovane += cast1 * p[0];
    zbyva -= cast1;
    if (zbyva <= 0) return Math.ceil(redukovane);

    const cast2 = Math.min(zbyva, h[1] - h[0]);
    redukovane += cast2 * p[1];
    zbyva -= cast2;
    if (zbyva <= 0) return Math.ceil(redukovane);

    const cast3 = Math.min(zbyva, h[2] - h[1]);
    redukovane += cast3 * p[2];
    return Math.ceil(redukovane);
}

function rozdelDnyAPorovnej(dny, redukovanyDVZ) {
    const resultPoDnech = [];
    let zbyvajici = dny;

    const prvni = Math.min(zbyvajici, 14);
    for (let i = 1; i <= prvni; i++) {
        resultPoDnech.push({
            index: i,
            typ: 'náhrada',
            sazba: NEMO_CONFIG.NAHRADA_PRVNI_14_RATE,
            castka: redukovanyDVZ * NEMO_CONFIG.NAHRADA_PRVNI_14_RATE
        });
    }
    zbyvajici -= prvni;

    let currentDay = 15;
    while (zbyvajici > 0) {
        const vhodne = NEMO_CONFIG.SAZBY_DNU.find(s => currentDay >= s.from && currentDay <= s.to);
        const sazba = vhodne ? vhodne.rate : 0;
        resultPoDnech.push({
            index: currentDay,
            typ: 'nemocenské',
            sazba: sazba,
            castka: redukovanyDVZ * sazba
        });
        currentDay++;
        zbyvajici--;
    }

    return resultPoDnech;
}

function sumarizujObdobi(dnyArr) {
    const skupiny = [
        { nazev: 'náhrada (1–14)', min: 1, max: 14, castka: 0, pocet: 0 },
        { nazev: 'nemocenské (15–30)', min: 15, max: 30, castka: 0, pocet: 0 },
        { nazev: 'nemocenské (31–60)', min: 31, max: 60, castka: 0, pocet: 0 },
        { nazev: 'nemocenské (61+)', min: 61, max: 99999, castka: 0, pocet: 0 }
    ];

    dnyArr.forEach(d => {
        const group = skupiny.find(s => d.index >= s.min && d.index <= s.max);
        if (group) {
            group.castka += d.castka;
            group.pocet += 1;
        }
    });

    return skupiny;
}

function vykresliGraf(celkovaNahrada, celkoveNemocenske) {
    if (!window.Chart) return;
    const ctx = el.graf.getContext('2d');
    if (mujGraf) mujGraf.destroy();
    mujGraf = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Náhrada mzdy (1–14)', 'Nemocenské (15+)'],
            datasets: [{
                data: [celkovaNahrada, celkoveNemocenske],
                backgroundColor: ['#1e1b4b', '#818cf8'],
                borderWidth: 3,
                borderColor: '#ffffff',
                spacing: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '62%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#334155',
                        font: { size: 13, weight: '600' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#1e1b4b',
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { weight: '700' },
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString('cs-CZ') + ' Kč';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function provestVypocet() {
    const hrubaStr = el.hruba.value.replace(/\s/g, '');
    const hruba = Number(hrubaStr);
    const datum = el.datum.value;
    const dny = Number(el.dny.value);

    const ok1 = validujInput(el.hruba, 'hrubaMzda-chyba', 'Např.: 45 000', !isNaN(hruba) && hruba > 0);
    const ok2 = validujInput(el.datum, 'datum-chyba', 'Vyberte platné datum', datum && !isNaN(new Date(datum)));
    const ok3 = validujInput(el.dny, 'dny-chyba', 'Počet dní (např. 30)', !isNaN(dny) && dny > 0);
    if (!ok1 || !ok2 || !ok3) return;

    const dvz = vypocitejDenniVymZaklad(hruba);
    const redukovanyDVZ = redukujDenniZaklad(dvz);
    const dnyPoDnech = rozdelDnyAPorovnej(dny, redukovanyDVZ);
    const shr = sumarizujObdobi(dnyPoDnech);
    const celkovaNahrada = shr[0].castka || 0;
    const celkoveNem = (shr[1].castka || 0) + (shr[2].castka || 0) + (shr[3].castka || 0);
    const celkemVyplaceno = celkovaNahrada + celkoveNem;

    el.vysledek.textContent = `Celkem vyplaceno: ${fmtKc(celkemVyplaceno)}`;
    // Vzhled výsledku řídí sdílená třída .kalkulacka-profi v css/style.css

    let html = '';
    html += `<p>Redukovaný denní vyměřovací základ: <strong>${Math.round(redukovanyDVZ).toLocaleString('cs-CZ')} Kč</strong></p>`;
    html += `<p>Náhrada mzdy (1–14): <strong>${fmtKc(celkovaNahrada)}</strong> — (${shr[0].pocet} dnů)</p>`;
    html += `<p>Nemocenské 15–30: <strong>${fmtKc(shr[1].castka)}</strong> — (${shr[1].pocet} dnů)</p>`;
    html += `<p>Nemocenské 31–60: <strong>${fmtKc(shr[2].castka)}</strong> — (${shr[2].pocet} dnů)</p>`;
    html += `<p>Nemocenské 61+: <strong>${fmtKc(shr[3].castka)}</strong> — (${shr[3].pocet} dnů)</p>`;
    html += `<h3>Detail po dnech (prvních 180 dnů / zkráceno při delším období)</h3>`;
    html += `<div class="detaily-riadek" style="max-height:260px; overflow:auto; padding:8px; border-radius:6px; border:1px solid #eee;">`;
    html += `<table style="width:100%; border-collapse:collapse; font-size:13px;">`;
    html += `<thead><tr><th style="text-align:left; padding:6px;">Den</th><th style="text-align:left; padding:6px;">Typ</th><th style="text-align:right; padding:6px;">Sazba</th><th style="text-align:right; padding:6px;">Částka</th></tr></thead>`;
    html += `<tbody>`;
    const maxRows = Math.min(dnyPoDnech.length, 180);
    for (let i = 0; i < maxRows; i++) {
        const r = dnyPoDnech[i];
        html += `<tr><td style="padding:6px;">${r.index}</td><td style="padding:6px;">${r.typ}</td><td style="padding:6px; text-align:right">${(r.sazba * 100).toFixed(0)} %</td><td style="padding:6px; text-align:right">${Math.round(r.castka).toLocaleString('cs-CZ')} Kč</td></tr>`;
    }
    html += `</tbody></table>`;
    if (dnyPoDnech.length > maxRows) {
        html += `<p style="font-size:13px; color:#666;">Výpis zkrácen — celkem ${dnyPoDnech.length} dnů</p>`;
    }
    html += `</div>`;

    el.detaily.innerHTML = html;
    vykresliGraf(celkovaNahrada, celkoveNem);
}

async function exportPDF() {
    const tl = el.exportPdfBtn;
    const puv = tl.innerHTML;
    tl.disabled = true;
    tl.style.opacity = '0.7';
    tl.innerHTML = '⏳ Generuji PDF…';

    try {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            alert('Knihovna pro PDF není dostupná.');
            return;
        }

        const hruba = Number(el.hruba.value.replace(/\s/g, ''));
        const datum = el.datum.value;
        const dny = Number(el.dny.value);

        const ok1 = validujInput(el.hruba, 'hrubaMzda-chyba', 'Např.: 45 000', !isNaN(hruba) && hruba > 0);
        const ok2 = validujInput(el.datum, 'datum-chyba', 'Vyberte platné datum', datum && !isNaN(new Date(datum)));
        const ok3 = validujInput(el.dny, 'dny-chyba', 'Počet dní (např. 30)', !isNaN(dny) && dny > 0);
        if (!ok1 || !ok2 || !ok3) {
            alert('Vyplňte prosím všechna pole správně před exportem.');
            return;
        }

        const dvz = vypocitejDenniVymZaklad(hruba);
        const redukovanyDVZ = redukujDenniZaklad(dvz);
        const dnyPoDnech = rozdelDnyAPorovnej(dny, redukovanyDVZ);
        const shr = sumarizujObdobi(dnyPoDnech);
        const nahrada = shr[0].castka || 0;
        const nem = (shr[1].castka || 0) + (shr[2].castka || 0) + (shr[3].castka || 0);
        const celkem = nahrada + nem;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fontName = await zajistiRobotoFont(doc);
        const hrubaFormatted = `${hruba.toLocaleString('cs-CZ')} Kč`;
        const dnyFormatted = `${dny} dní`;
        const redukovanyFormatted = `${Math.round(redukovanyDVZ).toLocaleString('cs-CZ')} Kč`;
        const nahradaFormatted = fmtKc(nahrada);
        const nemFormatted = fmtKc(nem);
        const celkemFormatted = fmtKc(celkem);

        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 42, 210, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.text('FINANČNÍ MAPA', 105, 13, { align: 'center' });
        doc.setFont(fontName, 'bold');
        doc.setFontSize(20);
        doc.text('Výpočet nemocenské 2026', 105, 30, { align: 'center' });

        doc.setFillColor(240, 253, 244);
        doc.roundedRect(35, 56, 140, 40, 6, 6, 'F');
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.8);
        doc.roundedRect(35, 56, 140, 40, 6, 6, 'S');
        doc.setTextColor(22, 101, 52);
        doc.setFont(fontName, 'bold');
        doc.setFontSize(10);
        doc.text('CELKEM VYPLACENO', 105, 70, { align: 'center' });
        doc.setFontSize(22);
        doc.text(celkemFormatted, 105, 90, { align: 'center' });

        doc.setTextColor(71, 85, 105);
        doc.setFont(fontName, 'bold');
        doc.setFontSize(10);
        doc.text('PARAMETRY NEMOCENSKÉ', 20, 112);
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.3);
        doc.line(20, 115, 190, 115);

        const paramBoxes = [
            { x: 20, label: 'Hrubá mzda', value: hrubaFormatted },
            { x: 85, label: 'Datum začátku PN', value: datum },
            { x: 145, label: 'Počet dnů PN', value: dnyFormatted }
        ];

        paramBoxes.forEach((p) => {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(p.x, 120, 55, 24, 4, 4, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFont(fontName, 'normal');
            doc.setFontSize(7);
            doc.text(p.label, p.x + 27.5, 130, { align: 'center' });
            doc.setTextColor(30, 41, 59);
            doc.setFont(fontName, 'bold');
            doc.setFontSize(9);
            doc.text(p.value, p.x + 27.5, 140, { align: 'center' });
        });

        doc.setTextColor(71, 85, 105);
        doc.setFont(fontName, 'bold');
        doc.setFontSize(10);
        doc.text('PŘEHLED VYPLACENÍ', 20, 160);
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.3);
        doc.line(20, 163, 190, 163);

        const cardData = [
            { label: 'Náhrada mzdy (1–14)', value: nahradaFormatted, color: [79, 70, 229] },
            { label: 'Nemocenské (15+)', value: nemFormatted, color: [249, 115, 22] }
        ];

        cardData.forEach((card, index) => {
            const x = 20 + index * 95;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.6);
            doc.roundedRect(x, 168, 80, 32, 4, 4, 'FD');
            doc.setTextColor(100, 116, 139);
            doc.setFont(fontName, 'normal');
            doc.setFontSize(8);
            doc.text(card.label, x + 40, 178, { align: 'center' });
            doc.setTextColor(card.color[0], card.color[1], card.color[2]);
            doc.setFont(fontName, 'bold');
            doc.setFontSize(11);
            doc.text(card.value, x + 40, 192, { align: 'center' });
        });

        if (typeof doc.autoTable === 'function') {
            doc.addPage();
            doc.setFont(fontName, 'bold');
            doc.setFontSize(16);
            doc.text('Podrobnosti výpočtu', 105, 15, { align: 'center' });
            doc.autoTable({
                startY: 25,
                head: [[bezpecnyText('Položka', fontName), bezpecnyText('Hodnota', fontName)]],
                body: [
                    ['Hrubá mzda', hrubaFormatted],
                    ['Datum začátku PN', datum],
                    ['Počet dnů PN', dnyFormatted],
                    ['Redukovaný DVZ', redukovanyFormatted],
                    ['Náhrada mzdy 1–14', nahradaFormatted],
                    ['Nemocenské 15+ (souhrn)', nemFormatted],
                    ['Celkem vyplaceno', celkemFormatted]
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', font: fontName },
                styles: { fontSize: 9.5, cellPadding: 3.5, font: fontName },
                columnStyles: { 1: { halign: 'right', fontStyle: 'normal' } }
            });
        } else {
            doc.setFont(fontName, 'bold');
            doc.setFontSize(12);
            doc.text('Podrobnosti výpočtu', 105, 75, { align: 'center' });
            doc.setFont(fontName, 'normal');
            doc.setFontSize(10);
            const rows = [
                ['Hrubá mzda', hrubaFormatted],
                ['Datum začátku PN', datum],
                ['Počet dnů PN', dnyFormatted],
                ['Redukovaný DVZ', redukovanyFormatted],
                ['Náhrada mzdy 1–14', nahradaFormatted],
                ['Nemocenské 15+ (souhrn)', nemFormatted],
                ['Celkem vyplaceno', celkemFormatted]
            ];
            rows.forEach((row, index) => {
                doc.text(bezpecnyText(row[0], fontName), 15, 85 + index * 6);
                doc.text(row[1], 195, 85 + index * 6, { align: 'right' });
            });
        }

        doc.save('vypocet_nemocenske_2026.pdf');
    } catch (e) {
        console.error('Export do PDF selhal', e);
        alert('Export do PDF se nezdařil.');
    } finally {
        tl.disabled = false;
        tl.style.opacity = '';
        tl.innerHTML = puv;
    }
}

function inicializujNemocenska() {
    el = {
        hruba: document.getElementById('hrubaMzda'),
        slider: document.getElementById('hrubaMzda-slider'),
        datum: document.getElementById('datumZacatku'),
        dny: document.getElementById('pocetDni'),
        tlacitko: document.getElementById('vypocitatNemocenska'),
        vysledek: document.getElementById('vysledekHlavni'),
        detaily: document.getElementById('detailyNemocenska'),
        graf: document.getElementById('graf'),
        exportPdfBtn: document.getElementById('export-pdf')
    };

    el.slider?.addEventListener('input', function() {
        el.hruba.value = Number(this.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
    });

    el.hruba?.addEventListener('input', function() {
        const val = this.value.replace(/\s/g, '');
        if (!isNaN(Number(val)) && el.slider) {
            el.slider.value = Math.min(Math.max(Number(val), 10000), 300000);
        }
        if (val === '') return;
        if (!isNaN(Number(val))) {
            this.value = Number(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        }
    });

    el.tlacitko?.addEventListener('click', function(e) {
        e.preventDefault();
        provestVypocet();
    });

    el.exportPdfBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        exportPDF();
    });
}

// NOVÉ — inicializace se spustí po načtení DOM, nezávisle na Chart.js;
// pojistný časovač zajistí init i kdyby se událost onload/onerror ztratila
window._nemocenskaInit = (function() {
    let probehlo = false;
    return function() {
        if (probehlo) return;
        probehlo = true;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializujNemocenska);
        } else {
            inicializujNemocenska();
        }
    };
})();
if (window.ChartJsNemocenska) window._nemocenskaInit();
setTimeout(function() { window._nemocenskaInit(); }, 1500);
