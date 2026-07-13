(function() {
    var gTagUrl = "https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH";
    var s1 = document.createElement("script"); s1.async = true; s1.src = gTagUrl; document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || []; window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-2BW708HYKH');
    var chartUrl = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    var s2 = document.createElement("script"); s2.src = chartUrl; document.head.appendChild(s2);
})();

window.addEventListener("DOMContentLoaded", function() {
    let mujGrafSporeni = null;

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
            if (val !== "" && !isNaN(val.replace(",", "."))) {
                if (inputId === 'mesicniVklad') {
                e.target.value = parseInt(val).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
            }
            }
            validujInput(el, chybaId, napoveda, validacniFunkce(el.value));
        });
        el.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }
    document.getElementById("vypocitatSporeni").addEventListener("click", function() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        if (chybovaHlaska) chybovaHlaska.style.display = "none";

        const vkladInput = document.getElementById("mesicniVklad");
        const urokInput = document.getElementById("urokSporeni");
        const dobaInput = document.getElementById("dobaSporeni");
        
        const vklad = parseFloat(vkladInput.value.replace(/\s/g, ''));
        const rocniUrok = parseFloat(urokInput.value.replace(",", "."));
        const roky = parseFloat(dobaInput.value);

        const jeVkladOk = !isNaN(vklad) && vklad > 0;
        const jeUrokOk = !isNaN(rocniUrok) && rocniUrok >= 0;
        const jeDobaOk = !isNaN(roky) && roky > 0;

        validujInput(vkladInput, "mesicniVklad-chyba", "Např.: 5 000", jeVkladOk);
        validujInput(urokInput, "urokSporeni-chyba", "Např.: 4", jeUrokOk);
        validujInput(dobaInput, "dobaSporeni-chyba", "Např.: 10", jeDobaOk);

        if (!jeVkladOk || !jeUrokOk || !jeDobaOk) return;
        const mesice = roky * 12;
        const r = rocniUrok / 100 / 12;
        let celkemVlozeno = vklad * mesice;
        let celkovaCastka = r > 0 ? vklad * ((Math.pow(1 + r, mesice) - 1) / r) * (1 + r) : celkemVlozeno;
        const urokCelkem = celkovaCastka - celkemVlozeno;

        document.getElementById("vysledekSporeni").textContent =
            "Naspořená částka: " + Math.round(celkovaCastka).toLocaleString("cs-CZ") + " Kč";
        document.getElementById("detailySporeni").innerHTML =
            "<p>Celkem vloženo: <strong>" + Math.round(celkemVlozeno).toLocaleString("cs-CZ") + " Kč</strong></p>" +
            "<p>Získaný úrok: <strong>" + Math.round(urokCelkem).toLocaleString("cs-CZ") + " Kč</strong></p>";

        if (mujGrafSporeni !== null) mujGrafSporeni.destroy();

        if (typeof Chart !== "undefined") { vykresliGraf(celkemVlozeno, urokCelkem); }
        else { setTimeout(function() { if (typeof Chart !== "undefined") vykresliGraf(celkemVlozeno, urokCelkem); }, 500); }
    });

    function vykresliGraf(celkemVlozeno, urokCelkem) {
        const ctx = document.getElementById("grafSporeni").getContext("2d");
        mujGrafSporeni = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Vaše vklady", "Získané úroky"],
                datasets: [{ data: [celkemVlozeno, Math.max(0, urokCelkem)], backgroundColor: ["#4f46e5", "#22c55e"] }]
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

    zapnoutFormatovani('mesicniVklad', 'mesicniVklad-chyba', 'Např.: 5 000', v => !isNaN(v.replace(/\s/g, '')) && parseFloat(v.replace(/\s/g, '')) > 0);
    zapnoutFormatovani('urokSporeni', 'urokSporeni-chyba', 'Např.: 4', v => !isNaN(v.replace(',', '.')) && parseFloat(v.replace(',', '.')) >= 0);
    zapnoutFormatovani('dobaSporeni', 'dobaSporeni-chyba', 'Např.: 10', v => !isNaN(v) && parseFloat(v) > 0);

    const inputVklad = document.getElementById("mesicniVklad");
    const inputUrokSporeni = document.getElementById("urokSporeni");
    const inputDobaSporeni = document.getElementById("dobaSporeni");
    const tlacitkoVypocitatSporeni = document.getElementById("vypocitatSporeni");

    if (inputVklad && inputUrokSporeni && inputDobaSporeni && tlacitkoVypocitatSporeni) {
        inputVklad.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputUrokSporeni.focus(); } });
        inputUrokSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); inputDobaSporeni.focus(); } });
        inputDobaSporeni.addEventListener("keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); tlacitkoVypocitatSporeni.click(); } });
    }

    setTimeout(function() { document.getElementById("vypocitatSporeni").click(); }, 300);
});

