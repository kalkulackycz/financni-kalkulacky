(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitat"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);

    var jspdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.0.0/jspdf.umd.min.js";
    var s3 = document.createElement("script"); s3.src = jspdfUrl;
    document.head.appendChild(s3);

    var autoTableUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js";
    var s4 = document.createElement("script"); s4.src = autoTableUrl;
    document.head.appendChild(s4);
})();

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

    let mujGraf = null;

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

    // Naformátuje hodnotu pole na "3 0 00 000" nebo "5,5" a uloží zpět do inputu
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

    document.getElementById("vypocitat").addEventListener("click", function() {
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

        validujInput(castkaInput, "castka-chyba", "Např.: 3 0 00 000", jeCastkaOk);
        validujInput(urokInput, "urok-chyba", "Např.: 5,5", jeUrokOk);
        validujInput(dobaInput, "doba-chyba", "Např.: 30", jeDobaOk);

        if (!jeCastkaOk || !jeUrokOk || !jeDobaOk) return;
        const n = roky * 12;
        const r = rocniSazba / 100 / 12;

        const mesicniSplatka = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const vysledek = Math.round(mesicniSplatka);
        const celkemZaplaceno = Math.round(mesicniSplatka * n);
        const celkoveUroky = celkemZaplaceno - P;

        document.getElementById("vysledek").textContent = "Měsíční splátka: " + vysledek.toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detaily").innerHTML =
            "<p>Celkem zaplatíte: <strong>" + celkemZaplaceno.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Z toho na úrocích: <strong>" + Math.round(celkoveUroky).toLocaleString("cs-CZ") + " Kč</strong></p>";

        const tabulkaTelo = document.querySelector("#amortizacni-tabulka tbody");
        if (tabulkaTelo) {
            tabulkaTelo.innerHTML = "";
            document.getElementById("sekce-tabulka").style.display = "block";
            document.getElementById("obal-tabulky").style.display = "none";
            document.getElementById("tlacitko-tabulka").classList.remove("aktivni");

            let zbyvajiciJistina = P;
            let kumulovanyUrokRok = 0;
            let kumulovanaJistinaRok = 0;

            for (let m = 1; m <= n; m++) {
                const urokVtomtoMesici = zbyvajiciJistina * r;
                const jistinaVtomtoMesici = mesicniSplatka - urokVtomtoMesici;

                kumulovanyUrokRok += urokVtomtoMesici;
                kumulovanaJistinaRok += jistinaVtomtoMesici;
                zbyvajiciJistina -= jistinaVtomtoMesici;

                if (m % 12 === 0 || m === n) {
                    const rok = Math.ceil(m / 12);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${rok}</td><td>${Math.round(kumulovanaJistinaRok).toLocaleString("cs-CZ")} Kč</td><td>${Math.round(kumulovanyUrokRok).toLocaleString("cs-CZ")} Kč</td><td>${Math.max(0, Math.round(zbyvajiciJistina)).toLocaleString("cs-CZ")} Kč</td>`;
                    tabulkaTelo.appendChild(tr);
                    kumulovanyUrokRok = 0;
                    kumulovanaJistinaRok = 0;
                }
            }
        }

        if (window.ChartJsPripraven && typeof Chart !== "undefined") {
            if (mujGraf !== null) mujGraf.destroy();
            const ctx = document.getElementById("graf").getContext("2d");
            mujGraf = new Chart(ctx, {
                type: "doughnut",
                data: { labels: ["Jistina (půjčené peníze)", "Úroky"], datasets: [{ data: [P, Math.max(0, celkoveUroky)], backgroundColor: ["#4f46e5", "#f97316"] }] },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false, position: "bottom" },
                        tooltip: {
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
    });

    document.getElementById("export-pdf").addEventListener("click", function() {
        // 1. Kontrola dostupnosti knihoven
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert("PDF knihovna se ještě stahuje, počkejte prosím vteřinu...");
            console.error("jsPDF není definováno.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 2. Kontrola autoTable (pokud není dostupná, tabulka se nevykreslí)
        if (typeof doc.autoTable !== 'function') {
            console.error("Plugin autoTable není načten.");
        }

        const datum = new Date().toLocaleDateString('cs-CZ');

        // Registrace fontu (pokud není, použije se fallback)
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.setFont("Roboto");

        // Načtení dat z DOM
        const castka = document.getElementById("castka").value;
        const urok = document.getElementById("urok").value;
        const doba = document.getElementById("doba").value;
        const splatkaText = document.getElementById("vysledek").textContent;
        const splatka = splatkaText ? splatkaText.replace("Měsíční splátka: ", "") : "";

        const pTagy = document.getElementById("detaily").querySelectorAll("strong");
        const celkem = pTagy[0] ? pTagy[0].innerText : "";
        const celkoveUroky = pTagy[1] ? pTagy[1].innerText : "";

        try {
        // 1. Modrý pruh a zarovnaná hlavička
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(20);
        doc.text("🏠 Hypoteční kalkulačka", 105, 18, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("Roboto", "normal");
        doc.text("Finanční Mapa", 105, 26, { align: "center" });
        doc.setFontSize(10);
        doc.text("Datum vytvoření: " + datum, 105, 35, { align: "center" });

        // 2. Parametry
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.text("PARAMETRY ÚVĚRU", 20, 55);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(12);
        doc.text("Výše úvěru:", 20, 65); doc.text(castka + " Kč", 190, 65, { align: "right" });
        doc.text("Úroková sazba:", 20, 75); doc.text(urok + " %", 190, 75, { align: "right" });
        doc.text("Doba splácení:", 20, 85); doc.text(doba + " let", 190, 85, { align: "right" });

        // 3. Hlavní karta splátky
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 100, 170, 35, 3, 3, 'F');
        doc.setTextColor(79, 70, 229);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(12);
        doc.text("MĚSÍČNÍ SPLÁTKA", 105, 112, { align: "center" });
        doc.setFontSize(24);
        doc.text(splatka, 105, 128, { align: "center" });

        // 4. Detaily
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text("Celkem zaplatíte:", 60, 150, { align: "center" });
        doc.text("Zaplacené úroky:", 150, 150, { align: "center" });
        doc.setFont("Roboto", "bold");
        doc.setFontSize(12);
        doc.text(celkem, 60, 160, { align: "center" });
        doc.text(celkoveUroky, 150, 160, { align: "center" });
        // 5. Graf s vynuceným bílým pozadím
        const sourceCanvas = document.getElementById("graf");
        if (sourceCanvas) {
            const ctx = sourceCanvas.getContext('2d');

            // Vynucení bílého pozadí pod graf
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

            // Návrat do normálního režimu (aby graf zůstal na webu stejný)
            ctx.globalCompositeOperation = 'source-over';

            // Export
            const imgData = sourceCanvas.toDataURL("image/jpeg", 1.0);

            // Vložení do PDF (čtverec 80x80mm, vycentrovaný)
            const sirkaStranky = doc.internal.pageSize.getWidth();
            const rozmer = 80;
            doc.addImage(imgData, 'JPEG', (sirkaStranky - rozmer) / 2, 165, rozmer, rozmer);
        }

        // Legenda (vedle sebe vycentrovaná)
        doc.setFont("Roboto", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Jistina
        doc.setFillColor(79, 70, 229); // Odpovídá barvě v Chart.js
        doc.rect(50, 250, 5, 5, 'F');
        doc.text("Jistina: " + castka + " Kč", 58, 254);

        // Úroky
        doc.setFillColor(249, 115, 22); // Odpovídá barvě v Chart.js
        doc.rect(120, 250, 5, 5, 'F');
        doc.text("Úroky: " + celkoveUroky, 128, 254);

        // 6. Amortizační tabulka na nové straně
        doc.addPage();
        doc.setFont("Roboto", "bold");
        doc.setFontSize(16);
        doc.text("Amortizační tabulka", 105, 20, { align: 'center' });

        const body = [];
        let zbyvajiciJistina = parseFloat(castka.replace(/\s/g, ''));
        let kumulovanyUrokRok = 0;
        let kumulovanaJistinaRok = 0;
        const n = parseInt(doba) * 12;
        const r = parseFloat(urok.replace(",", ".")) / 100 / 12;
        const mesicniSplatka = zbyvajiciJistina * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

        for (let m = 1; m <= n; m++) {
            const urokVtomtoMesici = zbyvajiciJistina * r;
            const jistinaVtomtoMesici = mesicniSplatka - urokVtomtoMesici;
            kumulovanyUrokRok += urokVtomtoMesici;
            kumulovanaJistinaRok += jistinaVtomtoMesici;
            zbyvajiciJistina -= jistinaVtomtoMesici;

            if (m % 12 === 0 || m === n) {
                body.push([
                    Math.ceil(m / 12),
                    Math.round(kumulovanaJistinaRok).toLocaleString("cs-CZ") + " Kč",
                    Math.round(kumulovanyUrokRok).toLocaleString("cs-CZ") + " Kč",
                    Math.max(0, Math.round(zbyvajiciJistina)).toLocaleString("cs-CZ") + " Kč"
                ]);
                kumulovanyUrokRok = 0;
                kumulovanaJistinaRok = 0;
            }
        }

        // Vykreslení tabulky s upravenými popisnými hlavičkami
        doc.autoTable({
            head: [[
                'Rok splácení',
                'Splátka jistiny (umoření dluhu)',
                'Zaplacené úroky (náklady úvěru)',
                'Zůstatek jistiny'
            ]],
            body: body,
            startY: 30,
            theme: 'striped',
            styles: {
                font: 'Roboto',
                fontSize: 9 // Mírně menší font pro dlouhé názvy
            },
            headStyles: {
                fillColor: [79, 70, 229],
                fontSize: 10
            }
        });

        doc.save("hypotecni-vypocet.pdf");
        } catch (err) {
            console.error("Chyba při generování PDF:", err);
        }
    });

    if (document.getElementById("tlacitko-tabulka")) {
        document.getElementById("tlacitko-tabulka").onclick = function() {
            const obal = document.getElementById("obal-tabulky");
            this.classList.toggle("aktivni");
            obal.style.display = (obal.style.display === "none") ? "block" : "none";
        };
    }

    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    zapnoutFormatovani('castka', 'castka-chyba', 'Např.: 3 0 00 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urok', 'urok-chyba', 'Např.: 5,5', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('doba', 'doba-chyba', 'Např.: 30', v => !isNaN(v) && parseFloat(v) > 0);

    // Napojení na ruční psaní
    ["castka", "urok", "doba"].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            // Okamžitý přepočet (slider) - ponecháváme původní logiku
            el.addEventListener("input", function() {
                // Logika pro slidery zůstává (pokud je zde definována)
            });

            // Blur: naformátuj a vypočítej
            el.addEventListener("blur", function() {
                naformatujPole(id);
                document.getElementById("vypocitat").click();
            });
            
            // Enter: navigace a výpočet
            el.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    naformatujPole(id);
                    document.getElementById("vypocitat").click();
                }
            });
        }
    });

    function propojSlider(inputId, sliderId) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        slider.addEventListener('input', function() {
            if (inputId === 'urok') {
                input.value = slider.value.replace('.', ',');
            } else {
                input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            document.getElementById("vypocitat").click();
        });

        input.addEventListener('input', function() {
            let val = input.value.replace(/\s/g, '').replace(',', '.');
            if (!isNaN(val) && val !== '') {
                slider.value = val;
            }
        });
    }

    propojSlider('castka', 'castka-slider');
    propojSlider('urok', 'urok-slider');
    propojSlider('doba', 'doba-slider');

    if (window.ChartJsPripraven) {
        document.getElementById("vypocitat").click();
    }
});

