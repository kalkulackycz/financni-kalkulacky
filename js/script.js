(function() {
    // 3. Vložení Chart.js
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); 
    s2.src = chartUrl;
    s2.onload = function() { 
        window.ChartJsPripraven = true; 
        var tlacitko = document.getElementById("vypocitat"); 
        if (tlacitko) tlacitko.click(); 
    };
    document.head.appendChild(s2);
})();

// Globální proměnná pro sdílení dat
let amortizacniPlan = [];
// SDÍLENÁ DATA PRO PDF EXPORT
let rocniPlan = [];
// Globální proměnná pro instanci grafu
let mujGraf = null;

function vypocitejZbyvajiciUroky(castka, urokovaSazba, roky, mesicMimoradneSplatky, mimoradnaSplatka) {
    let celkemMesicu = roky * 12;
    const mesicniUrok = urokovaSazba / 100 / 12;
    // OPRAVA: stejny fix jako ve funkci vypocitat() - pri 0% uroku puvodni vzorec delil nulou.
    let mesicniSplatka = mesicniUrok === 0
        ? castka / celkemMesicu
        : (castka * mesicniUrok) / (1 - Math.pow(1 + mesicniUrok, -celkemMesicu));

    let zUrokyBez = 0;
    let zUrokyS = 0;
    let zZustatekBez = castka;
    let zZustatekS = castka;
    let zAktualniSplatkaS = mesicniSplatka;
    for (let i = 1; i <= celkemMesicu; i++) {
        let urokBez = zZustatekBez * (urokovaSazba / 100 / 12);
        let jistinaBez = Math.min(mesicniSplatka - urokBez, zZustatekBez);
        zZustatekBez -= jistinaBez;
        let urokS = zZustatekS * (urokovaSazba / 100 / 12);
        if (i === mesicMimoradneSplatky) {
            zZustatekS -= mimoradnaSplatka;
        }
        if (zZustatekS <= 0) {
            zZustatekS = 0;
        }
        let jistinaS = zZustatekS > 0 ? Math.min(zAktualniSplatkaS - urokS, zZustatekS) : 0;
        zZustatekS -= jistinaS;

        if (i > mesicMimoradneSplatky) {
            zUrokyBez += urokBez;
            if (zZustatekS >= 0) {
                zUrokyS += urokS;
            }
        }
    }
    return { bez: zUrokyBez, s: zUrokyS };
}

function aktualizujGraf(jistina, uroky) {
    const canvas = document.getElementById("graf");
    if (!canvas) return;

    if (mujGraf !== null) {
        mujGraf.destroy();
    }

    const ctx = canvas.getContext("2d");
    mujGraf = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Jistina", "Úroky"],
            datasets: [{
                data: [Math.max(0, jistina), Math.max(0, uroky)],
                backgroundColor: ["#4f46e5", "#f97316"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

window.addEventListener("DOMContentLoaded", function() {
    // Globální logika pro otazníky (PC hover / Mobil klik)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ikona-otaznik') || e.target.closest('.tabulka-napoveda')) {
            const target = e.target.closest('.tabulka-napoveda') || e.target;
            const bublina = target.nextElementSibling;
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

    function validujInput(input, chybaId, napoveda, podminka) {
        if (!podminka) {
            document.getElementById(chybaId).innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
            document.getElementById(chybaId).style.display = "block";
            input.classList.add("input-chyba");
            return false;
        } else {
            document.getElementById(chybaId).style.display = "none";
            input.classList.remove("input-chyba");
            return true;
        }
    }

    // Naformátuje hodnotu pole na "3 000 000" nebo "5,5" a uloží zpět do inputu
    function naformatujPole(inputId) {
        const el = document.getElementById(inputId);
        let val = el.value.replace(/\s/g, '');
        if (val === "" || isNaN(val.replace(",", "."))) return;
        if (val.includes(",")) {
            el.value = val;
        } else {
            el.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        }
    }

    // 1. Ovládání UI (skrytí/zobrazení)
    const aktivator = document.getElementById('aktivator-checkbox');
    const blokMimoradna = document.getElementById('blok-mimoradna-splatka');
    if (aktivator && blokMimoradna) {
        aktivator.addEventListener('change', function() {
            if (this.checked) {
                blokMimoradna.style.opacity = '1';
                blokMimoradna.style.pointerEvents = 'auto';
            } else {
                blokMimoradna.style.opacity = '0.7';
                blokMimoradna.style.pointerEvents = 'none';
                document.getElementById("mimoradna-splatka").value = "0";
                document.getElementById("mimoradna-rok").value = "0";
            }
            vypocitat();
        });
    }

    // 2. Výpočetní logika
    function vypocitat() {
        const castka = parseFloat(document.getElementById("castka").value.replace(/\s/g, '')) || 0;
        const urokovaSazba = parseFloat(document.getElementById("urok").value.replace(",", ".")) || 0;
        const roky = parseFloat(document.getElementById("doba").value) || 0;
        const mimoradnaSplatka = document.getElementById("mimoradna-splatka") ? parseFloat(document.getElementById("mimoradna-splatka").value.replace(/\s/g, '')) : 0;
        const mesicMimoradneSplatky = document.getElementById("mimoradna-rok") ? parseInt(document.getElementById("mimoradna-rok").value) * 12 : 0;
        const aktivni = aktivator ? aktivator.checked : false;

        let celkemMesicu = roky * 12;
        // OPRAVA: guard proti nesmyslnym/neplatnym vstupum, ktere mohou obejit validaci
        // tlacitka "Vypocitat" (napr. primy volani vypocitat() z checkboxu mimoradne splatky).
        if (castka <= 0 || celkemMesicu <= 0) return;

        const mesicniUrok = urokovaSazba / 100 / 12;
        // OPRAVA: puvodni vzorec pri 0% uroku delil nulou (1 - (1+0)^-n = 0) a vracel NaN.
        // Pri 0% uroku je mesicni splatka proste jistina / pocet mesicu.
        let mesicniSplatka = mesicniUrok === 0
            ? castka / celkemMesicu
            : (castka * mesicniUrok) / (1 - Math.pow(1 + mesicniUrok, -celkemMesicu));
        let aktualniMesicniSplatka = mesicniSplatka;
        let zustatekS = castka;
        let zustatekBez = castka;
        let celkemUrokyBez = 0;
        let celkemUrokyS = 0;
        let celkemZaplacenoBez = 0;
        let celkemZaplacenoS = 0;
        amortizacniPlan = [];
        rocniPlan = [];
        let ročníJistina = 0;
        let ročníUroky = 0;
        let aktualniRok = 1;

        for (let i = 1; i <= celkemMesicu; i++) {
            let urokBez = zustatekBez * (urokovaSazba / 100 / 12);
            celkemUrokyBez += urokBez;
            let jistinaBez = Math.min(mesicniSplatka - urokBez, zustatekBez);
            zustatekBez -= jistinaBez;
            celkemZaplacenoBez += (jistinaBez + urokBez);

            let urokS = zustatekS * (urokovaSazba / 100 / 12);

            if (aktivni && i === mesicMimoradneSplatky) {
                zustatekS -= mimoradnaSplatka;
                celkemZaplacenoS += mimoradnaSplatka;
            }

            if (zustatekS <= 0) {
                zustatekS = 0;
            } else {
                celkemUrokyS += urokS;
                let jistinaS = Math.min(aktualniMesicniSplatka - urokS, zustatekS);
                zustatekS -= jistinaS;
                celkemZaplacenoS += (jistinaS + urokS);

                ročníJistina += jistinaS;
                ročníUroky += urokS;
            }

            if (i % 12 === 0 || i === celkemMesicu) {
                amortizacniPlan.push({
                    rok: aktualniRok,
                    splatkaJistiny: Math.round(ročníJistina).toLocaleString("cs-CZ") + " Kč",
                    zaplaceneUroky: Math.round(ročníUroky).toLocaleString("cs-CZ") + " Kč",
                    zustatek: Math.max(0, Math.round(zustatekS)).toLocaleString("cs-CZ") + " Kč"
                });
                ročníJistina = 0;
                ročníUroky = 0;
                aktualniRok++;
            }
            if (zustatekS <= 0 && zustatekBez <= 0) break;
        }

        const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";

        // Vykreslení výsledku do bloku a nastavení jednotného JEMNĚ ZELENÉHO RÁMEČKU pro všechny kalkulačky
        const vysledekEl = document.getElementById("vysledek");
        if (vysledekEl) {
            vysledekEl.innerText = "Měsíční splátka: " + Math.round(mesicniSplatka).toLocaleString("cs-CZ") + " Kč";
            vysledekEl.style.backgroundColor = "#f0fdf4";       // Jemně zelené pozadí (Tailwind green-50)
            vysledekEl.style.border = "2px solid #22c55e";      // Svěží zelený rámeček (Tailwind green-500)
            vysledekEl.style.color = "#166534";                 // Tmavě zelený text pro perfektní čitelnost
            vysledekEl.style.borderRadius = "12px";             // Zaoblené rohy
            vysledekEl.style.padding = "16px 20px";             // Vnitřní odsazení
            vysledekEl.style.textAlign = "center";              // Zarovnání na střed
            vysledekEl.style.fontSize = "19px";                 // Velikost písma
            vysledekEl.style.fontWeight = "bold";               // Tučné
            vysledekEl.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)"; // Jemný stín
            vysledekEl.style.margin = "20px 0";                 // Vnější okraje
        }

        const detailyEl = document.getElementById("detaily");
        if (detailyEl) {
            detailyEl.innerHTML =
                "<p>Celkem zaplaceno: <strong id='celkem-zaplaceno-hodnota'>" + fmt(celkemZaplacenoS) + "</strong></p>" +
                "<p>Z toho úroky: <strong id='z-toho-uroky-hodnota'>" + fmt(celkemUrokyS) + "</strong></p>";
        }

        const blokSrovnani = document.getElementById('blokSrovnani');
        if (blokSrovnani) {
            if (aktivni && mimoradnaSplatka > 0) {
                blokSrovnani.style.display = 'block';
                document.getElementById("mimo-parametry").innerText = `Mimořádná splátka: ${fmt(mimoradnaSplatka)} v ${document.getElementById("mimoradna-rok").value}. roce`;

                let srovnani = vypocitejZbyvajiciUroky(castka, urokovaSazba, roky, mesicMimoradneSplatky, mimoradnaSplatka);
                document.getElementById("vysledekStandard").textContent = "Úroky zbývající bez mimořádné splátky: " + Math.round(srovnani.bez).toLocaleString() + " Kč";
                document.getElementById("vysledekMimo").textContent = "Úroky zbývající po mimořádné splátce: " + Math.round(srovnani.s).toLocaleString() + " Kč";
                document.getElementById("vysledekUspora").textContent = "💰 Úspora na zbývajících úrocích: " + Math.round(srovnani.bez - srovnani.s).toLocaleString() + " Kč";

                window.temp_standard = {celkemUroky: celkemUrokyBez};
                window.temp_mimo = {celkemUroky: celkemUrokyS, jistina: castka};
                aktualujGraf(castka, celkemUrokyS);
            } else {
                blokSrovnani.style.display = 'none';
                aktualujGraf(castka, celkemUrokyBez);
            }
        }
        
        vykresliAmortizacniPlan();
    }

    function aktualujGraf(jistina, uroky) {
        if (typeof aktualizujGraf === 'function') aktualizujGraf(jistina, uroky);
    }

    function vykresliAmortizacniPlan() {
        const tbody = document.getElementById("amortizacni-telo");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        if (!amortizacniPlan || amortizacniPlan.length === 0) {
            return;
        }
        
        amortizacniPlan.forEach((radek, index) => {
            const tr = document.createElement("tr");
            tr.style.background = index % 2 === 0 ? "#ffffff" : "#f8fafc";
            tr.style.borderBottom = "1px solid #e2e8f0";
            
            tr.innerHTML = `
                <td style="padding: 10px 12px; text-align: left; color: #334155;">${radek.rok}</td>
                <td style="padding: 10px 12px; text-align: right; color: #334155;">${radek.splatkaJistiny}</td>
                <td style="padding: 10px 12px; text-align: right; color: #334155;">${radek.zaplaceneUroky}</td>
                <td style="padding: 10px 12px; text-align: right; color: #334155; font-weight: 600;">${radek.zustatek}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const tlacitkoVypocitat = document.getElementById("vypocitat");
    if (tlacitkoVypocitat) {
        tlacitkoVypocitat.addEventListener("click", function() {
            naformatujPole("castka");
            naformatujPole("urok");
            naformatujPole("doba");

            const chybovaHlaska = document.getElementById("chybova-hlaska");
            if (chybovaHlaska) chybovaHlaska.style.display = "none";

            const castkaInput = document.getElementById("castka");
            const urokInput = document.getElementById("urok");
            const dobaInput = document.getElementById("doba");

            const P = parseFloat(castkaInput.value.replace(/\s/g, ''));
            const urokText = urokInput.value.replace(",", ".");
            const rocniSazba = parseFloat(urokText);
            const roky = parseFloat(dobaInput.value);

            const jeCastkaOk = !isNaN(P) && P > 0;
            const jeUrokOk = !isNaN(rocniSazba) && rocniSazba >= 0;
            const jeDobaOk = !isNaN(roky) && roky > 0;

            validujInput(castkaInput, "castka-chyba", "Např.: 3 000 000", jeCastkaOk);
            validujInput(urokInput, "urok-chyba", "Např.: 5,5", jeUrokOk);
            validujInput(dobaInput, "doba-chyba", "Např.: 30", jeDobaOk);

            if (!jeCastkaOk || !jeUrokOk || !jeDobaOk) return;
            vypocitat();
        });
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

    // PDF Export (sjednoceno se zeleným designem)
    const exportPdfBtn = document.getElementById("export-pdf");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", async function() {
            vypocitat();
            
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('PDF knihovny nejsou načteny. Zkuste obnovit stránku.');
                return;
            }

            const tlacitkoExport = this;
            const puvodniTextTlacitka = tlacitkoExport.innerHTML;
            tlacitkoExport.disabled = true;
            tlacitkoExport.style.opacity = '0.7';
            tlacitkoExport.innerHTML = '⏳ Generuji PDF…';

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const fontName = await zajistiRobotoFont(doc);
                const castka = document.getElementById("castka").value;
                const urok = document.getElementById("urok").value;
                const doba = document.getElementById("doba").value;
                const el = document.getElementById("vysledek");
                const splatka = el ? el.textContent : "";
                const celkemEl = document.getElementById("celkem-zaplaceno-hodnota");
                const urokyEl = document.getElementById("z-toho-uroky-hodnota");
                const celkem = celkemEl ? celkemEl.textContent.trim() : "0 Kč";
                const uroky = urokyEl ? urokyEl.textContent.trim() : "0 Kč";

                // Horní hlavička PDF
                doc.setFillColor(79, 70, 229);
                doc.rect(0, 0, 210, 42, 'F');
                doc.setFillColor(99, 102, 241);
                doc.rect(0, 42, 210, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont(fontName, "normal");
                doc.setFontSize(9);
                doc.text("FINANČNÍ MAPA", 105, 13, { align: "center" });
                doc.setFont(fontName, "bold");
                doc.setFontSize(20);
                doc.text("Hypoteční kalkulačka", 105, 30, { align: "center" });

                // --- 2. Dominantní karta MĚSÍČNÍ SPLÁTKA (jemně zelená i v PDF) ---
                doc.setFillColor(240, 253, 244);
                doc.roundedRect(35, 56, 140, 40, 6, 6, 'F');
                doc.setDrawColor(34, 197, 94);
                doc.setLineWidth(0.8);
                doc.roundedRect(35, 56, 140, 40, 6, 6, 'S');
                doc.setTextColor(22, 101, 52);
                doc.setFont(fontName, "bold");
                doc.setFontSize(10);
                doc.text("MĚSÍČNÍ SPLÁTKA", 105, 70, { align: "center" });
                doc.setFontSize(22);
                doc.text(splatka, 105, 90, { align: "center" });

                // --- 3. PARAMETRY ÚVĚRU (3 sloupce) ---
                doc.setTextColor(71, 85, 105);
                doc.setFont(fontName, "bold");
                doc.setFontSize(10);
                doc.text("PARAMETRY ÚVĚRU", 20, 112);
                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.3);
                doc.line(20, 115, 190, 115);

                const paramBoxes = [
                    { x: 20, label: "Výše úvěru", value: castka + " Kč" },
                    { x: 85, label: "Úroková sazba", value: urok + " %" },
                    { x: 145, label: "Doba splácení", value: doba + " let" }
                ];
                paramBoxes.forEach((p) => {
                    doc.setFillColor(248, 250, 252);
                    doc.roundedRect(p.x, 120, 55, 24, 4, 4, 'F');
                    doc.setTextColor(100, 116, 139);
                    doc.setFont(fontName, "normal");
                    doc.setFontSize(7);
                    doc.text(p.label, p.x + 27.5, 130, { align: "center" });
                    doc.setTextColor(30, 41, 59);
                    doc.setFont(fontName, "bold");
                    doc.setFontSize(9);
                    doc.text(p.value, p.x + 27.5, 140, { align: "center" });
                });

                // --- 4. CELKOVÉ NÁKLADY ÚVĚRU (2 karty) ---
                doc.setTextColor(71, 85, 105);
                doc.setFont(fontName, "bold");
                doc.setFontSize(10);
                doc.text("CELKOVÉ NÁKLADY ÚVĚRU", 20, 160);
                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.3);
                doc.line(20, 163, 190, 163);

                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.6);
                doc.roundedRect(20, 168, 80, 32, 4, 4, 'FD');
                doc.setTextColor(71, 85, 105);
                doc.setFont(fontName, "bold");
                doc.setFontSize(8);
                doc.text("CELKEM ZAPLACENO", 60, 178, { align: "center" });
                doc.setTextColor(30, 41, 59);
                doc.setFont(fontName, "normal");
                doc.setFontSize(11);
                doc.text(celkem, 60, 192, { align: "center" });

                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.6);
                doc.roundedRect(110, 168, 80, 32, 4, 4, 'FD');
                doc.setTextColor(71, 85, 105);
                doc.setFont(fontName, "bold");
                doc.setFontSize(8);
                doc.text("Z TOHO ÚROKY", 150, 178, { align: "center" });
                doc.setTextColor(249, 115, 22);
                doc.setFont(fontName, "normal");
                doc.setFontSize(11);
                doc.text(uroky, 150, 192, { align: "center" });

                // --- 5. MIMOŘÁDNÁ SPLÁTKA + ÚSPORA ---
                const aktivatorEl = document.getElementById('aktivator-checkbox');
                if (aktivatorEl && aktivatorEl.checked && window.temp_mimo) {
                    const mimoCastka = document.getElementById("mimoradna-splatka").value;
                    const mimoRok = document.getElementById("mimoradna-rok").value;
                    const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";
                    const uspora = window.temp_standard.celkemUroky - window.temp_mimo.celkemUroky;

                    doc.setFillColor(255, 247, 237);
                    doc.setDrawColor(251, 146, 60);
                    doc.setLineWidth(0.6);
                    doc.roundedRect(20, 210, 170, 22, 4, 4, 'FD');
                    doc.setTextColor(194, 65, 12);
                    doc.setFont(fontName, "bold");
                    doc.setFontSize(8);
                    doc.text("MIMOŘÁDNÁ SPLÁTKA", 105, 220, { align: "center" });
                    doc.setTextColor(30, 41, 59);
                    doc.setFont(fontName, "normal");
                    doc.setFontSize(10);
                    doc.text(mimoCastka + " Kč  •  Rok " + mimoRok, 105, 228, { align: "center" });

                    doc.setTextColor(71, 85, 105);
                    doc.setFont(fontName, "bold");
                    doc.setFontSize(10);
                    doc.text("ÚSPORA NA ÚROCÍCH", 20, 248);
                    doc.setDrawColor(79, 70, 229);
                    doc.setLineWidth(0.3);
                    doc.line(20, 251, 190, 251);

                    doc.setTextColor(79, 70, 229);
                    doc.setFont(fontName, "bold");
                    doc.setFontSize(16);
                    doc.text(fmt(uspora), 105, 268, { align: "center" });

                    doc.setTextColor(100, 116, 139);
                    doc.setFont(fontName, "normal");
                    doc.setFontSize(8);
                    doc.text("Původní úroky: " + fmt(window.temp_standard.celkemUroky) + "   |   Úroky po mimoř. splátce: " + fmt(window.temp_mimo.celkemUroky), 105, 280, { align: "center" });
                }

                if (typeof doc.autoTable === 'function') {
                    doc.addPage();
                    doc.setFont(fontName, "bold");
                    doc.setFontSize(16);
                    doc.text("Amortizační tabulka", 105, 15, { align: 'center' });
                    doc.autoTable({
                       startY: 25,
                       head: [['Rok', 'Splátka jistiny', 'Zaplacené úroky', 'Zůstatek']],
                       body: amortizacniPlan.map(row => [
                          row.rok,
                          row.splatkaJistiny,
                          row.zaplaceneUroky,
                          row.zustatek
                       ]),
                       theme: 'striped',
                       styles: { font: fontName, fontStyle: 'normal' },
                       bodyStyles: { font: fontName },
                       headStyles: { fillColor: [79, 70, 229], font: fontName, fontStyle: 'bold' }
                    });
                }
                doc.save("vypocet_hypoteky.pdf");
            } catch (chyba) {
                console.error('Export PDF selhal:', chyba);
                alert('Export do PDF se bohužel nezdařil. Zkuste to prosím znovu.');
            } finally {
                tlacitkoExport.disabled = false;
                tlacitkoExport.style.opacity = '';
                tlacitkoExport.innerHTML = puvodniTextTlacitka;
            }
        });
    }

    if (document.getElementById("tlacitko-tabulka")) {
        document.getElementById("tlacitko-tabulka").onclick = function() {
            const obal = document.getElementById("obal-tabulky");
            this.classList.toggle("aktivni");
            obal.style.display = (obal.style.display === "none") ? "block" : "none";
        };
    }

    function zapnoutFormatovani(inputId, chybaId, napoveda) {
        const el = document.getElementById(inputId);
        if (el) {
            el.addEventListener('focus', function(e) {
                e.target.value = e.target.value.replace(/\s/g, '');
            });
        }
    }

    zapnoutFormatovani('castka', 'castka-chyba', 'Např.: 3 000 000');
    zapnoutFormatovani('urok', 'urok-chyba', 'Např.: 5,5');
    zapnoutFormatovani('doba', 'doba-chyba', 'Např.: 30');

    const poleIds = ["castka", "urok", "doba", "mimoradna-splatka", "mimoradna-rok"];
    const tlacitko = document.getElementById("vypocitat");

    poleIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", function() {
                clearTimeout(window.calcTimer);
                window.calcTimer = setTimeout(() => {
                    if (tlacitko) tlacitko.click();
                }, 500);
            });
            el.addEventListener("blur", function() {
                naformatujPole(id);
                if (tlacitko) tlacitko.click();
            });
            el.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    naformatujPole(id);
                    if (tlacitko) tlacitko.click();

                    const aktivni = aktivator ? aktivator.checked : false;
                    let currentActivePoleIds = ["castka", "urok", "doba"];
                    if (aktivni) {
                        currentActivePoleIds.push("mimoradna-splatka", "mimoradna-rok");
                    }

                    const currentIndex = currentActivePoleIds.indexOf(id);
                    if (currentIndex !== -1 && currentIndex < currentActivePoleIds.length - 1) {
                        const nextId = currentActivePoleIds[currentIndex + 1];
                        const nextEl = document.getElementById(nextId);
                        if (nextEl) {
                            nextEl.focus();
                            nextEl.select();
                        }
                    }
                }
            });
        }
    });

    function propojSlider(inputId, sliderId) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        if (input && slider) {
            slider.addEventListener('input', function() {
                if (inputId === 'urok') {
                    input.value = slider.value.replace('.', ',');
                } else {
                    input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
                }
                if (tlacitko) tlacitko.click();
            });
            input.addEventListener('input', function() {
                let val = input.value.replace(/\s/g, '').replace(',', '.');
                if (!isNaN(val) && val !== '') {
                    slider.value = val;
                }
            });
        }
    }

    propojSlider('castka', 'castka-slider');
    propojSlider('urok', 'urok-slider');
    propojSlider('doba', 'doba-slider');

    if (window.ChartJsPripraven && tlacitko) {
        tlacitko.click();
    }
});