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
    let val = el.hruba.value.replace(/\s/g, '');
    if (val === "" || isNaN(val)) return;
    el.hruba.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
}

function zaokrouhliZakladDane(hruba) { return Math.floor(hruba / 100) * 100; }
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
    naformatujHrubou();

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
        danovyBonus = (hruba * 12 >= CONFIG.MIN_PRIJEM_ROCNI_BONUS) ? Math.min(moznyBonus, CONFIG.MAX_DANOVY_BONUS_MESIC) : 0;
        danKPlaceni = 0;
    } else {
        danKPlaceni = danPoZvyhodneni;
    }

    const cistaMzda = hruba - socPoj - zdravPoj - danKPlaceni + danovyBonus;

    el.vysledekText.textContent = "Čistý měsíční příjem: " + Math.round(cistaMzda).toLocaleString("cs-CZ") + " Kč";

    el.detaily.innerHTML = `
        <p>Hrubá mzda: <strong>${hruba.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Soc. pojištění: <strong>-${socPoj.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Zdrav. pojištění: <strong>-${zdravPoj.toLocaleString("cs-CZ")} Kč</strong></p>
        <p>Daň (před slevami): <strong>${dan.toLocaleString("cs-CZ")} Kč</strong></p>
        ${slevyNaDani > 0 ? `<p style="color:#059669;">Slevy na dani: <strong>-${slevyNaDani.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
        <p>Daň po slevách: <strong>${danPoSlevach.toLocaleString("cs-CZ")} Kč</strong></p>
        ${zvyhodneniDeti > 0 ? `<p style="color:#059669;">Zvýhodnění děti: <strong>-${zvyhodneniDeti.toLocaleString("cs-CZ")} Kč</strong></p>` : ''}
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

window.addEventListener("DOMContentLoaded", function() {
    // Globální logika pro otazníky (PC hover / Mobil klik)
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
        vysledekText: document.getElementById("vysledekMzda")
    };

    if (el.pocetDeti) {
        el.pocetDeti.addEventListener('change', () => { generujDiteZtpInputs(Number(el.pocetDeti.value) || 0); vypoctiMzdu(); });
        generujDiteZtpInputs(Number(el.pocetDeti.value) || 0);
    }

    ["slevaPoplatnik", "invalidita", "ztpP"].forEach(id => document.getElementById(id)?.addEventListener("change", vypoctiMzdu));
    el.tlacitko?.addEventListener("click", vypoctiMzdu);

    el.slider?.addEventListener("input", function() {
        el.hruba.value = Number(this.value).toLocaleString("cs-CZ").replace(/\u00A0/g, " ");
        vypoctiMzdu();
    });
    el.hruba?.addEventListener("input", function() {
        let v = Number(this.value.replace(/\s/g, ''));
        if (!isNaN(v)) el.slider.value = Math.min(Math.max(v, 10000), 300000);
    });
    el.hruba?.addEventListener("blur", vypoctiMzdu);
    el.hruba?.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            vypoctiMzdu();
        }
    });

    if (window.ChartJsPripraven) vypoctiMzdu();
});