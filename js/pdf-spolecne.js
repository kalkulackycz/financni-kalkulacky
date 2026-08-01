// ============================================================================
// Sdílený modul pro generování PDF exportů napříč všemi kalkulačkami
// Finanční Mapy. Řeší na jednom místě:
//   1) stažení a registraci fontu Roboto (podpora české diakritiky v PDF),
//   2) bezpečný fallback na text bez diakritiky, pokud se font nepodaří stáhnout,
//   3) jednotný vzhled hlavičky, zeleného výsledkového rámečku a patičky,
//   4) generický export jednoduchého reportu (výsledek + tabulka + graf).
//
// DŮLEŽITÉ: font se z CDN stahuje jen jednou za návštěvu stránky (cache), ale
// musí se zaregistrovat (addFileToVFS/addFont) do KAŽDÉHO nového jsPDF
// dokumentu zvlášť – registrace fontu patří ke konkrétní instanci dokumentu,
// ne globálně k celé stránce. (Tohle byla příčina bugu, kdy se po druhém
// stažení PDF rozsypala diakritika.)
// ============================================================================

(function (global) {
    'use strict';

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
            doc.setFont('Roboto');
            return 'Roboto';
        } catch (chyba) {
            console.warn('Nepodařilo se načíst font Roboto pro PDF, použije se záložní font.', chyba);
            doc.setFont('helvetica');
            return 'helvetica';
        }
    }

    function bezpecnyText(text, fontName) {
        if (fontName === 'helvetica') {
            return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return text;
    }

    function nakresliHlavicku(doc, fontName, nazevKalkulacky) {
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 42, 210, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(fontName, 'bold');
        doc.text(bezpecnyText(nazevKalkulacky, fontName), 105, 30, { align: 'center' });

        doc.setTextColor(245, 245, 245);
        doc.setFontSize(9);
        doc.setFont(fontName, 'normal');
        doc.text(bezpecnyText('Datum výpočtu: ' + new Date().toLocaleDateString('cs-CZ'), fontName), 105, 38, { align: 'center' });
    }

    function nakresliVysledek(doc, fontName, text) {
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, 50, 182, 24, 3, 3, 'FD');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(16);
        doc.setFont(fontName, 'bold');
        doc.text(bezpecnyText(text, fontName), 105, 66, { align: 'center' });
    }

    function nakresliPaticku(doc, fontName) {
        const pocetStran = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pocetStran; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont(fontName, 'normal');
            doc.text(
                bezpecnyText('Generováno z webu Finanční mapa. Kalkulačka slouží pouze pro orientační výpočet.', fontName),
                105, 285, { align: 'center' }
            );
        }
    }

    /**
     * Vygeneruje a stáhne standardní PDF report kalkulačky: hlavička, zelený
     * výsledkový rámeček, tabulka položek, volitelně graf pod tabulkou, patička.
     *
     * @param {Object} data
     * @param {string} data.nazev - Název v hlavičce, např. "Výpočet čisté mzdy"
     * @param {string} data.hlavniVysledek - Text ve zeleném rámečku
     * @param {Array<[string,string]>} data.radky - Řádky tabulky [popisek, hodnota]
     * @param {string} data.souborNazev - Název výsledného souboru bez přípony .pdf
     * @param {string} [data.canvasId] - ID <canvas> s Chart.js grafem, který se má vložit
     * @param {HTMLElement} [data.tlacitko] - Tlačítko exportu (zobrazí se na něm "Generuji…")
     */
    async function exportKalkulackaPDF(data) {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            alert('Knihovna pro PDF se ještě nenačetla, zkuste to prosím za chvíli.');
            return;
        }

        const tlacitko = data.tlacitko || null;
        const puvodniText = tlacitko ? tlacitko.innerHTML : null;
        if (tlacitko) {
            tlacitko.disabled = true;
            tlacitko.style.opacity = '0.7';
            tlacitko.innerHTML = '⏳ Generuji PDF…';
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const fontName = await zajistiRobotoFont(doc);

            nakresliHlavicku(doc, fontName, data.nazev);
            nakresliVysledek(doc, fontName, data.hlavniVysledek);

            let dalsiY = 80;

            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: 80,
                    margin: { left: 14, right: 14 },
                    tableWidth: 'auto',
                    head: [[bezpecnyText('Položka', fontName), 'Částka']],
                    body: data.radky.map(function (r) { return [bezpecnyText(r[0], fontName), r[1]]; }),
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', font: fontName },
                    styles: { fontSize: 9.5, cellPadding: 3.5, font: fontName, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 62, fontStyle: 'bold' } }
                });
                dalsiY = doc.lastAutoTable.finalY + 12;
            }

            const canvasEl = data.canvasId ? document.getElementById(data.canvasId) : null;
            if (canvasEl && canvasEl.width && canvasEl.height) {
                try {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvasEl.width;
                    tempCanvas.height = canvasEl.height;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    ctx.drawImage(canvasEl, 0, 0);
                    const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
                    const sirka = 90;
                    const vyska = (canvasEl.height / canvasEl.width) * sirka;
                    doc.addImage(imgData, 'JPEG', 105 - sirka / 2, dalsiY, sirka, vyska);
                } catch (chybaGrafu) {
                    console.warn('Graf se nepodařilo vložit do PDF.', chybaGrafu);
                }
            }

            nakresliPaticku(doc, fontName);
            doc.save(data.souborNazev + '.pdf');
        } catch (chyba) {
            console.error('Export PDF selhal:', chyba);
            alert('Export do PDF se bohužel nezdařil. Zkuste to prosím znovu.');
        } finally {
            if (tlacitko) {
                tlacitko.disabled = false;
                tlacitko.style.opacity = '';
                tlacitko.innerHTML = puvodniText;
            }
        }
    }

    global.PDFSpolecne = {
        zajistiRobotoFont: zajistiRobotoFont,
        bezpecnyText: bezpecnyText,
        nakresliHlavicku: nakresliHlavicku,
        nakresliVysledek: nakresliVysledek,
        nakresliPaticku: nakresliPaticku,
        exportKalkulackaPDF: exportKalkulackaPDF
    };
})(window);
