// Sdílený generátor PDF reportů pro všechny kalkulačky Finanční Mapy
// Používá jsPDF (https://github.com/parallax/jsPDF)
// Font Roboto (podpora české diakritiky) z Fontsource CDN

function formatKc(cislo) {
    return Math.round(cislo).toLocaleString("cs-CZ") + " Kč";
}

// Cache stažených fontů, aby se nestahovaly znovu při každém exportu
let fontRegularCache = null;
let fontBoldCache = null;

async function nactiFontBase64(url) {
    const odpoved = await fetch(url);
    const arrayBuffer = await odpoved.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binarniRetezec = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binarniRetezec += String.fromCharCode(bytes[i]);
    }
    return btoa(binarniRetezec);
}

async function pripravCeskyFont(doc) {
    if (!fontRegularCache) {
        fontRegularCache = await nactiFontBase64(
            "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-400-normal.ttf"
        );
    }
    if (!fontBoldCache) {
        fontBoldCache = await nactiFontBase64(
            "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-700-normal.ttf"
        );
    }

    doc.addFileToVFS("Roboto-Regular.ttf", fontRegularCache);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    doc.addFileToVFS("Roboto-Bold.ttf", fontBoldCache);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
}

/**
 * Vygeneruje a stáhne profesionální PDF report kalkulačky s podporou české diakritiky.
 *
 * @param {Object} data
 * @param {string} data.nazevKalkulacky - Např. "Hypoteční kalkulačka"
 * @param {Array<{label: string, hodnota: string}>} data.parametry - Vstupní hodnoty
 * @param {{label: string, hodnota: string}} data.hlavniVysledek - Zvýrazněná karta (např. měsíční splátka)
 * @param {Array<{label: string, hodnota: string}>} data.infoKarty - Dvě informační karty
 * @param {string} [data.canvasId] - ID <canvas> s Chart.js grafem, který se má vložit
 * @param {string} data.souborNazev - Název výsledného PDF souboru bez přípony
 * @param {string} [data.castka] - Hodnota jistiny pro legendu
 * @param {string} [data.celkoveUroky] - Hodnota úroků pro legendu
 */
async function exportKalkulackaPDF(kalkulackaData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // FIX: Ošetření undefined objektu pro zabránění TypeError
    const data = kalkulackaData || { nazevKalkulacky: "Hypoteční kalkulačka" };

    await pripravCeskyFont(doc);

    const sirkaStranky = 210;
    const barvaHlavni = [79, 70, 229];   // #4f46e5
    const barvaTmava = [26, 26, 46];     // #1a1a2e
    const barvaSeda = [100, 116, 139];   // #64748b
    const barvaSvetla = [238, 242, 255]; // #eef2ff

    // ---------- HLAVIČKA ----------
    doc.setFillColor(...barvaHlavni);
    doc.rect(0, 0, sirkaStranky, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(20);
    doc.text(data.nazevKalkulacky, 15, 16);

    doc.setFont("Roboto", "normal");
    doc.setFontSize(11);
    doc.text("Finanční Mapa", 15, 24);

    const datum = new Date().toLocaleDateString("cs-CZ");
    doc.setFontSize(9);
    doc.text("Vytvořeno: " + datum, sirkaStranky - 15, 16, { align: "right" });

    let y = 45;

    // ---------- PARAMETRY ----------
    doc.setTextColor(...barvaTmava);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(13);
    doc.text("Parametry", 15, y);
    y += 8;

    doc.setFont("Roboto", "normal");
    doc.setFontSize(11);
    data.parametry.forEach(function (p) {
        doc.setTextColor(...barvaSeda);
        doc.text(p.label, 15, y);
        doc.setTextColor(...barvaTmava);
        doc.setFont("Roboto", "bold");
        doc.text(p.hodnota, sirkaStranky - 15, y, { align: "right" });
        doc.setFont("Roboto", "normal");
        y += 7;
    });

    y += 6;

    // ---------- ZVÝRAZNĚNÁ KARTA (hlavní výsledek) ----------
    const vyskaKarty = 28;
    doc.setFillColor(...barvaHlavni);
    doc.roundedRect(15, y, sirkaStranky - 30, vyskaKarty, 4, 4, "F");

    doc.setTextColor(220, 220, 255);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.text(data.hlavniVysledek.label.toUpperCase(), sirkaStranky / 2, y + 9, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.text(data.hlavniVysledek.hodnota, sirkaStranky / 2, y + 21, { align: "center" });

    y += vyskaKarty + 10;

    // ---------- DVĚ INFORMAČNÍ KARTY ----------
    const sirkaKarty = (sirkaStranky - 30 - 8) / 2;
    const vyskaInfoKarty = 24;

    data.infoKarty.forEach(function (karta, index) {
        const x = 15 + index * (sirkaKarty + 8);
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(...barvaSvetla);
        doc.roundedRect(x, y, sirkaKarty, vyskaInfoKarty, 3, 3, "FD");

        doc.setTextColor(...barvaSeda);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text(karta.label, x + sirkaKarty / 2, y + 8, { align: "center" });

        doc.setTextColor(...barvaTmava);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text(karta.hodnota, x + sirkaKarty / 2, y + 18, { align: "center" });
    });

    y += vyskaInfoKarty + 12;

    // ---------- GRAF (pokud existuje) ----------
    const sourceCanvas = document.getElementById("graf");
    if (sourceCanvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sourceCanvas.width;
        tempCanvas.height = sourceCanvas.height;
        const ctx = tempCanvas.getContext('2d');

        // Bílé pozadí
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(sourceCanvas, 0, 0);
        const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);
        doc.addImage(imgData, 'JPEG', 65, 160, 80, 70);

        // 7. Legenda pod grafem (čistá, ručně vykreslená)
    doc.setFont("Roboto", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Legenda - Jistina
        doc.setFillColor(79, 70, 229); // #4f46e5
        doc.rect(50, 235, 5, 5, 'F');
        doc.text("Jistina: " + (data.castka || "") + " Kč", 60, 239);

        // Legenda - Úroky
        doc.setFillColor(249, 115, 22); // #f97316
        doc.rect(120, 235, 5, 5, 'F');
        doc.text("Úroky: " + (data.celkoveUroky || ""), 130, 239);
    }

    // ---------- PATIČKA ----------
    const yPaticky = 280;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, yPaticky - 6, sirkaStranky - 15, yPaticky - 6);
    doc.setTextColor(...barvaSeda);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text("Tento výpočet je orientační.", sirkaStranky / 2, yPaticky, { align: "center" });

    doc.setTextColor(...barvaHlavni);
    doc.text("www.financnimapa.cz", sirkaStranky / 2, yPaticky + 6, { align: "center" });

    // ---------- ULOŽENÍ ----------
    body: data.amortizacniPlan.map(row => [row.rok, row.splatkaJistiny, row.zaplaceneUroky, row.zustatek]),
    doc.save(data.souborNazev + ".pdf");
}