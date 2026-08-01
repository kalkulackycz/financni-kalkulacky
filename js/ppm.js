document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("hrubyMesicniPrijem");
    const slider = document.getElementById("hrubyMesicniPrijem-slider");
    const checkbox = document.getElementById("cekamVicercata");
    const button = document.getElementById("vypocitatPpm");

    if (!input || !slider || !button) return;

    const KONFIG = {
        PRVNI_HRANICE: 1633,
        DRUHA_HRANICE: 2449,
        TRETI_HRANICE: 4897,
        SAZBA: 0.70,
        ZAKLADNI_DNY: 196,
        VICE_DNY: 259
    };

    function formatCz(value) {
        return Math.round(value).toLocaleString("cs-CZ");
    }

    function parseInputValue(el) {
        const raw = el.value.replace(/\s/g, "");
        return parseFloat(raw) || 0;
    }

    function validujInput(inputEl, chybaId, napoveda, podminka) {
        const chybaEl = document.getElementById(chybaId);
        if (!chybaEl) return true;

        if (!podminka) {
            chybaEl.innerHTML = `Neplatný údaj. <span class="napoveda-format">${napoveda}</span>`;
            chybaEl.style.display = "block";
            inputEl.classList.add("input-chyba");
            return false;
        }

        chybaEl.style.display = "none";
        inputEl.classList.remove("input-chyba");
        return true;
    }

    function naformatujCislo() {
        const oldVal = input.value;
        let cursorPosition = input.selectionStart;

        let val = oldVal.replace(/\s/g, "");
        if (val === "") {
            input.value = "";
            return;
        }

        if (isNaN(val)) return;

        let formatted = parseInt(val, 10).toLocaleString("cs-CZ").replace(/\u00A0/g, " ");
        input.value = formatted;

        let diff = formatted.length - oldVal.length;
        input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
    }

    function vypoctiPpm() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        const vysledekEl = document.getElementById("vysledekPpm");
        const detailyEl = document.getElementById("detailyPpm");

        if (chybovaHlaska) {
            chybovaHlaska.style.display = "none";
        }

        const hrubyMesicniPrijem = parseInputValue(input);
        const jePrijemOk = validujInput(
            input,
            "hrubyMesicniPrijem-chyba",
            "Např.: 45 000",
            hrubyMesicniPrijem > 0
        );

        if (!jePrijemOk) return;

        const denniVymerovaciZaklad = (hrubyMesicniPrijem * 12) / 365;

        let redukovanyZaklad = denniVymerovaciZaklad;

        if (denniVymerovaciZaklad > KONFIG.PRVNI_HRANICE) {
            redukovanyZaklad = KONFIG.PRVNI_HRANICE + (Math.min(denniVymerovaciZaklad, KONFIG.DRUHA_HRANICE) - KONFIG.PRVNI_HRANICE) * 0.6;
        }

        if (denniVymerovaciZaklad > KONFIG.DRUHA_HRANICE) {
            redukovanyZaklad = KONFIG.PRVNI_HRANICE
                + (KONFIG.DRUHA_HRANICE - KONFIG.PRVNI_HRANICE) * 0.6
                + (Math.min(denniVymerovaciZaklad, KONFIG.TRETI_HRANICE) - KONFIG.DRUHA_HRANICE) * 0.3;
        }

        if (denniVymerovaciZaklad > KONFIG.TRETI_HRANICE) {
            redukovanyZaklad = KONFIG.PRVNI_HRANICE
                + (KONFIG.DRUHA_HRANICE - KONFIG.PRVNI_HRANICE) * 0.6
                + (KONFIG.TRETI_HRANICE - KONFIG.DRUHA_HRANICE) * 0.3;
        }

        const denniDava = redukovanyZaklad * KONFIG.SAZBA;
        const pocetDni = checkbox && checkbox.checked ? KONFIG.VICE_DNY : KONFIG.ZAKLADNI_DNY;
        const mesicniCastka = denniDava * 30;
        const celkovaCastka = denniDava * pocetDni;

        if (vysledekEl) {
            vysledekEl.textContent = `Orientační měsíční PPM: ${formatCz(mesicniCastka)} Kč`;
            vysledekEl.style.display = "inline-flex";
            vysledekEl.style.alignItems = "center";
            vysledekEl.style.justifyContent = "center";
            vysledekEl.style.border = "2px solid #22c55e";
            vysledekEl.style.backgroundColor = "#f0fdf4";
            vysledekEl.style.padding = "14px 18px";
            vysledekEl.style.borderRadius = "8px";
            vysledekEl.style.textAlign = "center";
            vysledekEl.style.color = "#166534";
            vysledekEl.style.fontWeight = "bold";
            vysledekEl.style.margin = "0";
        }

        if (detailyEl) {
            detailyEl.innerHTML = `
                <p>Hrubý měsíční příjem: <strong>${formatCz(hrubyMesicniPrijem)} Kč</strong></p>
                <p>Den. vyměřovací základ: <strong>${formatCz(denniVymerovaciZaklad)} Kč</strong></p>
                <p>Redukovaný denní základ: <strong>${formatCz(redukovanyZaklad)} Kč</strong></p>
                <p>PPM za 1 den (70 %): <strong>${formatCz(denniDava)} Kč</strong></p>
                <p>Orientační měsíční částka: <strong>${formatCz(mesicniCastka)} Kč</strong></p>
                <p>Celková částka za ${pocetDni} dní: <strong>${formatCz(celkovaCastka)} Kč</strong></p>
            `;
        }
    }

    input.addEventListener("input", function () {
        naformatujCislo();
        vypoctiPpm();
    });

    slider.addEventListener("input", function () {
        input.value = Number(this.value).toLocaleString("cs-CZ");
        vypoctiPpm();
    });

    if (checkbox) {
        checkbox.addEventListener("change", vypoctiPpm);
    }

    button.addEventListener("click", vypoctiPpm);

    const exportPdfBtn = document.getElementById("export-pdf");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", async function () {
            const hrubyMesicniPrijem = parseInputValue(input);
            const denniVymerovaciZaklad = (hrubyMesicniPrijem * 12) / 365;

            let redukovanyZaklad = denniVymerovaciZaklad;
            if (denniVymerovaciZaklad > KONFIG.PRVNI_HRANICE) {
                redukovanyZaklad = KONFIG.PRVNI_HRANICE + (Math.min(denniVymerovaciZaklad, KONFIG.DRUHA_HRANICE) - KONFIG.PRVNI_HRANICE) * 0.6;
            }
            if (denniVymerovaciZaklad > KONFIG.DRUHA_HRANICE) {
                redukovanyZaklad = KONFIG.PRVNI_HRANICE
                    + (KONFIG.DRUHA_HRANICE - KONFIG.PRVNI_HRANICE) * 0.6
                    + (Math.min(denniVymerovaciZaklad, KONFIG.TRETI_HRANICE) - KONFIG.DRUHA_HRANICE) * 0.3;
            }
            if (denniVymerovaciZaklad > KONFIG.TRETI_HRANICE) {
                redukovanyZaklad = KONFIG.PRVNI_HRANICE
                    + (KONFIG.DRUHA_HRANICE - KONFIG.PRVNI_HRANICE) * 0.6
                    + (KONFIG.TRETI_HRANICE - KONFIG.DRUHA_HRANICE) * 0.3;
            }

            const denniDava = redukovanyZaklad * KONFIG.SAZBA;
            const pocetDni = checkbox && checkbox.checked ? KONFIG.VICE_DNY : KONFIG.ZAKLADNI_DNY;
            const mesicniCastka = denniDava * 30;
            const celkovaCastka = denniDava * pocetDni;

            await window.PDFSpolecne.exportKalkulackaPDF({
                nazev: "Výpočet PPM",
                hlavniVysledek: "Orientační měsíční PPM: " + formatCz(mesicniCastka) + " Kč",
                radky: [
                    ["Hrubý měsíční příjem", formatCz(hrubyMesicniPrijem) + " Kč"],
                    ["Denní vyměřovací základ", formatCz(denniVymerovaciZaklad) + " Kč"],
                    ["Redukovaný denní základ", formatCz(redukovanyZaklad) + " Kč"],
                    ["PPM za 1 den (70 %)", formatCz(denniDava) + " Kč"],
                    ["Orientační měsíční částka", formatCz(mesicniCastka) + " Kč"],
                    ["Celková částka za " + pocetDni + " dní", formatCz(celkovaCastka) + " Kč"]
                ],
                souborNazev: "vypocet-ppm",
                tlacitko: exportPdfBtn
            });
        });
    }

    input.addEventListener("blur", naformatujCislo);

    vypoctiPpm();
});
