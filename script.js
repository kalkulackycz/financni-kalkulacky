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

// Globální proměnná pro sdílení dat
let amortizacniPlan = [];
// SDÍLENÁ DATA PRO PDF EXPORT
let rocniPlan = [];
// Globální proměnná pro instanci grafu
    let mujGraf = null;

function vypocitejZbyvajiciUroky(castka, urokovaSazba, roky, mesicMimoradneSplatky, mimoradnaSplatka) {
        let celkemMesicu = roky * 12;
        let mesicniSplatka = (castka * (urokovaSazba / 100 / 12)) / (1 - Math.pow(1 + (urokovaSazba / 100 / 12), -celkemMesicu));

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
            zAktualniSplatkaS = (zZustatekS * (urokovaSazba / 100 / 12)) / (1 - Math.pow(1 + (urokovaSazba / 100 / 12), -(celkemMesicu - i)));
                }
        let jistinaS = Math.min(zAktualniSplatkaS - urokS, zZustatekS);
        zZustatekS -= jistinaS;

        if (i > mesicMimoradneSplatky) {
            zUrokyBez += urokBez;
            zUrokyS += urokS;
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

    // 1. Ovládání UI (skrytí/zobrazení)
    const aktivator = document.getElementById('aktivator-checkbox');
    const blokMimoradna = document.getElementById('blok-mimoradna-splatka');
    aktivator.addEventListener('change', function() {
        if (this.checked) {
            blokMimoradna.style.opacity = '1';
            blokMimoradna.style.pointerEvents = 'auto';
    } else {
            blokMimoradna.style.opacity = '0.7';
            blokMimoradna.style.pointerEvents = 'none';
            // Reset hodnot při vypnutí
            document.getElementById("mimoradna-splatka").value = "0";
            document.getElementById("mimoradna-rok").value = "0";
    }
        vypocitat();
});

    // 2. Výpočetní logika
    function vypocitat() {
        const castka = parseFloat(document.getElementById("castka").value.replace(/\s/g, '')) || 0;
        const urokovaSazba = parseFloat(document.getElementById("urok").value.replace(",", ".")) || 0;
        const roky = parseFloat(document.getElementById("doba").value) || 0;
        const mimoradnaSplatka = parseFloat(document.getElementById("mimoradna-splatka").value.replace(/\s/g, '')) || 0;
        const mesicMimoradneSplatky = parseInt(document.getElementById("mimoradna-rok").value) * 12 || 0;
        const aktivni = document.getElementById('aktivator-checkbox').checked;

        let celkemMesicu = roky * 12;
        let mesicniSplatka = (castka * (urokovaSazba / 100 / 12)) / (1 - Math.pow(1 + (urokovaSazba / 100 / 12), -celkemMesicu));
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
            // Výpočet bez mimořádné splátky
            let urokBez = zustatekBez * (urokovaSazba / 100 / 12);
            celkemUrokyBez += urokBez;
            let jistinaBez = Math.min(mesicniSplatka - urokBez, zustatekBez);
            zustatekBez -= jistinaBez;
            celkemZaplacenoBez += (jistinaBez + urokBez);

            // Výpočet s mimořádnou splátkou
            let urokS = zustatekS * (urokovaSazba / 100 / 12);

            if (aktivni && i === mesicMimoradneSplatky) {
                zustatekS -= mimoradnaSplatka;
                celkemZaplacenoS += mimoradnaSplatka;
                if (zustatekS > 0) {
                    aktualniMesicniSplatka = (zustatekS * (urokovaSazba / 100 / 12)) / (1 - Math.pow(1 + (urokovaSazba / 100 / 12), -(celkemMesicu - i)));
                } else {
                    aktualniMesicniSplatka = 0;
                }
            }

            celkemUrokyS += urokS;
            let jistinaS = Math.min(aktualniMesicniSplatka - urokS, zustatekS);
            zustatekS -= jistinaS;
            celkemZaplacenoS += (jistinaS + urokS);

            ročníJistina += jistinaS;
            ročníUroky += urokS;

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

        document.getElementById("vysledek").innerText = "Měsíční splátka: " + Math.round(mesicniSplatka).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detaily").innerHTML =
            "<p>Celkem zaplaceno: <strong id='celkem-zaplaceno-hodnota'>" + fmt(celkemZaplacenoS) + "</strong></p>" +
            "<p>Z toho úroky: <strong id='z-toho-uroky-hodnota'>" + fmt(celkemUrokyS) + "</strong></p>";

        const blokSrovnani = document.getElementById('blokSrovnani');
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

    function aktualujGraf(jistina, uroky) {
        if (typeof aktualizujGraf === 'function') aktualizujGraf(jistina, uroky);
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
        vypocitat();
    });

    // PDF Export
    document.getElementById("export-pdf").addEventListener("click", function() {
    // Zajistí výpočet a vytvoření amortizačního plánu před exportem PDF
        vypocitat();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.setFont("Roboto");
        const castka = document.getElementById("castka").value;
        const urok = document.getElementById("urok").value;
        const doba = document.getElementById("doba").value;
        const el = document.getElementById("vysledek");
        const splatka = el ? el.textContent : "";
        const detailyEl = document.getElementById("detaily");
        const celkemEl = document.getElementById("celkem-zaplaceno-hodnota");
        const urokyEl = document.getElementById("z-toho-uroky-hodnota");
        const celkem = celkemEl ? celkemEl.textContent.trim() : "0 Kč";
        const uroky = urokyEl ? urokyEl.textContent.trim() : "0 Kč";
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 42, 210, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text("FINANČNÍ MAPA", 20, 13);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(20);
        doc.text("Hypoteční kalkulačka", 20, 30);
        doc.setTextColor(30, 41, 59);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(15);
        doc.text("VÁŠ HYPOTEČNÍ PŘEHLED", 20, 52);
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(20, 56, 190, 56);
        doc.setFontSize(10);
        doc.setFont("Roboto", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Parametry úvěru", 20, 68);
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text("Výše úvěru: " + castka + " Kč", 20, 78);
        doc.text("Úroková sazba: " + urok + " %", 20, 85);
        doc.text("Doba splácení: " + doba + " let", 20, 92);
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(20, 102, 170, 34, 5, 5, 'F');
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.8);
        doc.roundedRect(20, 102, 170, 34, 5, 5, 'S');
        doc.setTextColor(79, 70, 229);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(9);
        doc.text("MĚSÍČNÍ SPLÁTKA", 105, 113, { align: "center" });
        doc.setFontSize(20);
        doc.text(splatka, 105, 130, { align: "center" });
        doc.setTextColor(30, 41, 59);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(10);
        doc.text("Celkem zaplaceno: " + celkem, 20, 150);
        doc.text("Z toho úroky: " + uroky, 20, 157);
        if (document.getElementById('aktivator-checkbox').checked && window.temp_mimo) {
            doc.setFont("Roboto", "bold");
            doc.text("Mimořádná splátka: " + document.getElementById("mimoradna-splatka").value + " Kč v roce " + document.getElementById("mimoradna-rok").value, 20, 170);
            doc.setFontSize(13);
            doc.text("SROVNÁNÍ ÚVĚRU", 20, 210);
            doc.setFont("Roboto", "normal");
            doc.setFontSize(10);
            const fmt = (cislo) => Math.round(cislo).toLocaleString("cs-CZ", {maximumFractionDigits: 0}).replace(/\u00A0/g, ' ') + " Kč";
            doc.text("Původní celkové úroky: " + fmt(window.temp_standard.celkemUroky), 20, 222);
            doc.text("Úroky s mimořádnou splátkou: " + fmt(window.temp_mimo.celkemUroky), 20, 230);
            doc.setTextColor(79, 70, 229);
            doc.text("Úspora: " + fmt(window.temp_standard.celkemUroky - window.temp_mimo.celkemUroky), 20, 240);
        }
        if (typeof doc.autoTable === 'function') {
            doc.addPage();
            doc.setFont("Roboto", "bold");
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
               styles: {
                  font: 'Roboto',
                  fontStyle: 'normal'
        },
               bodyStyles: {
               font: 'Roboto'
        },
               headStyles: {
               fillColor: [79, 70, 229],
               font: 'Roboto',
               fontStyle: 'bold'
        }
});
        }
        doc.save("vypocet_hypoteky.pdf");
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
