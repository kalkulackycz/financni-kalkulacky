async function exportKalkulackaPDF(data) {
    const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDFLib) {
        alert("Knihovna jsPDF nebyla načtena.");
        return;
    }

    const doc = new jsPDFLib({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Registrace bezplatného fontu Roboto s podporou češtiny z CDN
    try {
        const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
        const fontBoldUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf";
        
        // Načteme regulérní i tučný font
        const fontResponse = await fetch(fontUrl);
        const fontBlob = await fontResponse.blob();
        const fontBase64 = await blobToBase64(fontBlob);

        const boldResponse = await fetch(fontBoldUrl);
        const boldBlob = await boldResponse.blob();
        const boldBase64 = await blobToBase64(boldBlob);

        doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

        doc.addFileToVFS("Roboto-Medium.ttf", boldBase64);
        doc.addFont("Roboto-Medium.ttf", "Roboto", "bold");

        doc.setFont("Roboto", "normal");
    } catch (e) {
        console.warn("Nepodařilo se načíst český font, použije se výchozí.", e);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // --- 1. HLAVIČKA ---
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(15);
    let nazev = data.nazevKalkulacky || "Výsledek kalkulace";
    doc.text(nazev, margin + 5, y + 14);
    
    y += 32;

    // --- 2. PARAMETRY ---
    if (data.parametry && data.parametry.length > 0) {
        doc.setTextColor(107, 114, 128);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        
        let paramText = data.parametry.map(p => `${p.label} ${p.hodnota}`).join("  |  ");
        doc.text(paramText, margin, y);
        y += 10;
    }

    // --- 3. HLAVNÍ VÝSLEDEK ---
    if (data.hlavniVysledek) {
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

        doc.setTextColor(55, 65, 81);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(10);
        doc.text(data.hlavniVysledek.label, margin + 5, y + 11);

        doc.setTextColor(16, 185, 129);
        doc.setFontSize(13);
        doc.text(data.hlavniVysledek.hodnota, pageWidth - margin - 5, y + 11, { align: 'right' });
        
        y += 24;
    }

    // --- 4. INFO KARTY ---
    if (data.infoKarty && data.infoKarty.length > 0) {
        let cardWidth = (contentWidth - 5) / 2;
        let startX = margin;

        data.infoKarty.forEach((karta, index) => {
            let x = startX + (index * (cardWidth + 5));
            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(x, y, cardWidth, 14, 1, 1, 'FD');

            doc.setTextColor(107, 114, 128);
            doc.setFont("Roboto", "normal");
            doc.setFontSize(8);
            doc.text(karta.label, x + 4, y + 9);

            doc.setTextColor(31, 41, 55);
            doc.setFont("Roboto", "bold");
            doc.setFontSize(9);
            doc.text(karta.hodnota, x + cardWidth - 4, y + 9, { align: 'right' });
        });
        y += 20;
    }

    // --- 5. TABULKA ---
    if (data.amortizacniPlan && data.amortizacniPlan.length > 0) {
        doc.setTextColor(31, 41, 55);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(11);
        doc.text("Položkový rozpis", margin, y);
        y += 6;

        doc.setFillColor(243, 244, 246);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(8);
        doc.text("Položka / Období", margin + 4, y + 5.5);
        doc.text("Částka", pageWidth - margin - 4, y + 5.5, { align: 'right' });
        y += 8;

        doc.setFont("Roboto", "normal");
        data.amortizacniPlan.forEach((radek, idx) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            if (idx % 2 === 1) {
                doc.setFillColor(249, 250, 251);
                doc.rect(margin, y, contentWidth, 7, 'F');
            }

            doc.setTextColor(55, 65, 81);
            doc.setFontSize(8);
            let nazev = String(radek[0] || "");
            let hodnota = String(radek[1] || radek[2] || "");

            doc.text(nazev, margin + 4, y + 4.5);
            doc.text(hodnota, pageWidth - margin - 4, y + 4.5, { align: 'right' });

            doc.setDrawColor(243, 244, 246);
            doc.line(margin, y + 7, pageWidth - margin, y + 7);

            y += 7;
        });
        y += 10;
    }

    // --- 6. PATIČKA ---
    doc.setTextColor(156, 163, 175);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.text("Dokument byl vygenerován online kalkulačkou.", margin, 285);
    doc.text("Strana 1 z 1", pageWidth - margin, 285, { align: 'right' });

    const nazevSouboru = (data.souborNazev || "kalkulace") + ".pdf";
    doc.save(nazevSouboru);
}

// Pomocná funkce pro převod blob dat fontu do Base64
function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}