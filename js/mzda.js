(function() {
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

async function stahnoutPDFMzda() {
    if (typeof exportKalkulackaPDF !== "function") {
        alert("Sdílený generátor PDF nebyl načten.");
        return;
    }

    const tlacitkoExport = el.exportPdfBtn;
    const puvodniText = tlacitkoExport ? tlacitkoExport.innerHTML : "";
    if (tlacitkoExport) {
        tlacitkoExport.disabled = true;
        tlacitkoExport.style.opacity = '0.7';
        tlacitkoExport.innerHTML = '⏳ Generuji PDF…';
    }

    try {
        vypoctiMzdu();

        const hruba = parseFloat(el.hruba.value.replace(/\s/g, '')) || 0;
        if (hruba <= 0) {
            alert('Zadejte prosím platnou hrubou mzdu před exportem do PDF.');
            return;
        }

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

        let slevyTextDetail = [];
        if (jePoplatnik) slevyTextDetail.push("poplatník");
        if (invaliditaStupen > 0) slevyTextDetail.push(`inv. ${invaliditaStupen}. st.`);
        if (jeZtpP) slevyTextDetail.push("ZTP/P");
        const slevyPopis = slevyTextDetail.length > 0 ? `Slevy (${slevyTextDetail.join(", ")})` : "Slevy na dani";

        const pdfData = {
            nazevKalkulacky: "Výpočet čisté mzdy",
            souborNazev: "vypocet-ciste-mzdy",
            
            parametry: [
                { label: "Hrubá mzda:", hodnota: `${hruba.toLocaleString("cs-CZ")} Kč` },
                { label: "Počet dětí:", hodnota: String(pocetDeti) },
                { label: "Slevy na dani:", hodnota: slevyTextDetail.length > 0 ? slevyTextDetail.join(", ") : "Žádné" }
            ],

            hlavniVysledek: {
                label: "Čistý měsíční příjem",
                hodnota: `${Math.round(cistaMzda).toLocaleString("cs-CZ")} Kč`
            },

            infoKarty: [
                { label: "Sociální pojištění (7,1 %)", hodnota: `${socPoj.toLocaleString("cs-CZ")} Kč` },
                { label: "Zdravotní pojištění (4,5 %)", hodnota: `${zdravPoj.toLocaleString("cs-CZ")} Kč` }
            ],

            canvasId: "grafMzda",

            amortizacniPlan: [
            ["Hrubá mzda", `${hruba.toLocaleString("cs-CZ")} Kč`],
            ["Sociální pojištění (7,1 %)", `-${socPoj.toLocaleString("cs-CZ")} Kč`],
            ["Zdravotní pojištění (4,5 %)", `-${zdravPoj.toLocaleString("cs-CZ")} Kč`],
            ["Daň z příjmů (před slevami)", `${dan.toLocaleString("cs-CZ")} Kč`],
            [slevyPopis, `-${slevyNaDani.toLocaleString("cs-CZ")} Kč`],
            ["Daňové zvýhodnění na děti", `-${zvyhodneniDeti.toLocaleString("cs-CZ")} Kč`],
            [danovyBonus > 0 ? "Daňový bonus" : "Výsledná daň", danovyBonus > 0 ? `+${danovyBonus.toLocaleString("cs-CZ")} Kč` : `${danKPlaceni.toLocaleString("cs-CZ")} Kč`]
            ]
        };

        await exportKalkulackaPDF(pdfData);

    } catch (err) {
        console.error("Chyba při exportu PDF:", err);
        alert("Při generování PDF došlo k chybě.");
    } finally {
        if (tlacitkoExport) {
            tlacitkoExport.disabled = false;
            tlacitkoExport.style.opacity = '';
            tlacitkoExport.innerHTML = puvodniText;
        }
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
    
    el.tlacitko?.addEventListener("click", function(e) {
        e.preventDefault();
        vypoctiMzdu();
    });

    el.exportPdfBtn?.addEventListener("click", stahnoutPDFMzda);

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