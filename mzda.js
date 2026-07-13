// AUTOMATICKÉ NAČTENÍ EXTERNÍCH SOUBORŮ (Verze 0.12)
(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl;
    s2.onload = function() { window.ChartJsPripraven = true; var tlacitko = document.getElementById("vypocitatMzdu"); if (tlacitko) tlacitko.click(); };
    document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafMzda = null;

    // Pomocná funkce pro validaci
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
    // Funkce pro formátování a validaci vstupu
    function zapnoutFormatovani(inputId, chybaId, napoveda, validacniFunkce) {
        const el = document.getElementById(inputId);
        el.addEventListener('blur', function(e) {
            let val = e.target.value.replace(/\s/g, '');
            if (val !== "" && !isNaN(val)) {
                e.target.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            validujInput(el, chybaId, napoveda, validacniFunkce(el.value));
        });
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }
    document.getElementById("vypocitatMzdu").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";

        const hrubaInput = document.getElementById("hrubaMzda");
        const hruba = parseFloat(hrubaInput.value.replace(/\s/g, ''));

        const jeHrubaOk = !isNaN(hruba) && hruba > 0;

        validujInput(hrubaInput, "hrubaMzda-chyba", "Např.: 45 000", jeHrubaOk);

        if (!jeHrubaOk) return;
        // Aktuální sazebník odvodů zaměstnance
        const szPojisteniSazba = 0.071; 
        const zdPojisteniSazba = 0.045; 
        const danSazba = 0.15;          
        const slevaPoplatnik = 2570;    

        // Výpočty jednotlivých složek
        const socPoj = Math.ceil(hruba * szPojisteniSazba);
        const zdravPoj = Math.ceil(hruba * zdPojisteniSazba);
        
        let danPredSlevou = Math.ceil(hruba * danSazba);
        let cistaDan = danPredSlevou - slevaPoplatnik;
        if (cistaDan < 0) cistaDan = 0; 

        const cistaMzda = hruba - socPoj - zdravPoj - cistaDan;

        document.getElementById("vysledekMzda").textContent = "Čistá mzda: " + Math.round(cistaMzda).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailyMzda").innerHTML =
            "<p>Sociální pojištění: <strong>" + socPoj.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Zdravotní pojištění: <strong>" + zdravPoj.toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Daň z příjmu po slevě: <strong>" + cistaDan.toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (window.ChartJsPripraven && typeof Chart !== "undefined") {
            if (mujGrafMzda !== null) mujGrafMzda.destroy();
            const ctx = document.getElementById("grafMzda").getContext("2d");
            mujGrafMzda = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["Čistá mzda", "Sociální pojištění", "Zdravotní pojištění", "Daň z příjmu"],
                    datasets: [{ data: [cistaMzda, socPoj, zdravPoj, cistaDan], backgroundColor: ["#22c55e", "#4f46e5", "#f97316", "#ef4444"] }]
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

    zapnoutFormatovani('hrubaMzda', 'hrubaMzda-chyba', 'Např.: 45 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);

    // Propojení slideru
    const mzdaInput = document.getElementById("hrubaMzda");
    const mzdaSlider = document.getElementById("hrubaMzda-slider");

    mzdaSlider.addEventListener('input', function() {
        mzdaInput.value = parseInt(mzdaSlider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        document.getElementById("vypocitatMzdu").click();
    });
    mzdaInput.addEventListener('input', function() {
        let val = mzdaInput.value.replace(/\s/g, '');
        if (!isNaN(val) && val !== '') {
            mzdaSlider.value = val;
        }
    });

    const inputHruba = document.getElementById("hrubaMzda");
    const tlacitkoVypocitatMzdu = document.getElementById("vypocitatMzdu");

    if (inputHruba && tlacitkoVypocitatMzdu) {
        inputHruba.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                tlacitkoVypocitatMzdu.click();
            }
        });
    }

    // OPRAVENO: Název tlačítka změněn na správné vypocitatMzdu pro plynulý start grafu
    if (window.ChartJsPripraven) {
        var tlacitkoStart = document.getElementById("vypocitatMzdu");
        if (tlacitkoStart) tlacitkoStart.click();
    }
});

