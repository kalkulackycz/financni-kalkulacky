document.addEventListener("DOMContentLoaded", function () {
    const castkaInput = document.getElementById("castka");
    const castkaSlider = document.getElementById("castka-slider");
    const inflaceInput = document.getElementById("inflace");
    const inflaceSlider = document.getElementById("inflace-slider");
    const dobaInput = document.getElementById("doba");
    const dobaSlider = document.getElementById("doba-slider");
    const tlacitko = document.getElementById("vypocitatInflaci");

    if (!castkaInput || !castkaSlider || !inflaceInput || !inflaceSlider || !dobaInput || !dobaSlider || !tlacitko) return;

    function formatCz(value, fractionDigits = 0) {
        return Number(value).toLocaleString("cs-CZ", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).replace(/\u00A0/g, " ");
    }

    function parseNumber(value) {
        const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
        return parseFloat(normalized);
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

    function formatInputAmount() {
        const raw = castkaInput.value.replace(/\s/g, "");
        if (raw === "") {
            castkaInput.value = "";
            return;
        }
        if (isNaN(raw)) return;
        const value = parseInt(raw, 10);
        castkaInput.value = formatCz(value, 0);
    }

    function formatInputInflace() {
        const raw = inflaceInput.value.replace(/\s/g, "").replace(",", ".");
        if (raw === "") {
            inflaceInput.value = "";
            return;
        }
        if (isNaN(raw)) return;
        const value = parseFloat(raw);
        inflaceInput.value = formatCz(value, 1).replace(" ", "");
    }

    function formatInputDoba() {
        const raw = dobaInput.value.replace(/\s/g, "");
        if (raw === "") {
            dobaInput.value = "";
            return;
        }
        if (isNaN(raw)) return;
        const value = parseInt(raw, 10);
        dobaInput.value = formatCz(value, 0);
    }

    function vypoctiInflaci() {
        const chybovaHlaska = document.getElementById("chybova-hlaska");
        const vysledekEl = document.getElementById("vysledekInflace");
        const detailyEl = document.getElementById("detailyInflace");

        if (chybovaHlaska) {
            chybovaHlaska.style.display = "none";
        }

        const castka = parseNumber(castkaInput.value);
        const inflace = parseNumber(inflaceInput.value);
        const doba = parseNumber(dobaInput.value);

        const jeCastkaOk = validujInput(castkaInput, "castka-chyba", "Např.: 100 000", castka > 0);
        const jeInflaceOk = validujInput(inflaceInput, "inflace-chyba", "Např.: 4,5", inflace >= 0);
        const jeDobaOk = validujInput(dobaInput, "doba-chyba", "Např.: 5", doba > 0);

        if (!jeCastkaOk || !jeInflaceOk || !jeDobaOk) {
            if (vysledekEl) vysledekEl.textContent = "";
            if (detailyEl) detailyEl.innerHTML = "";
            return;
        }

        const realnaHodnota = castka / Math.pow(1 + inflace / 100, doba);
        const ztrata = castka - realnaHodnota;
        const procentualniZtrata = (ztrata / castka) * 100;

        if (vysledekEl) {
            vysledekEl.textContent = `Reálná hodnota za ${doba} ${doba === 1 ? "rok" : doba < 5 ? "roky" : "let"}: ${formatCz(realnaHodnota, 0)} Kč`;
            vysledekEl.style.display = "inline-flex";
            vysledekEl.style.alignItems = "center";
            vysledekEl.style.justifyContent = "center";
            vysledekEl.style.whiteSpace = "nowrap";
            vysledekEl.style.border = "2px solid #22c55e";
            vysledekEl.style.backgroundColor = "#f0fdf4";
            vysledekEl.style.padding = "10px 14px";
            vysledekEl.style.fontSize = "18px";
            vysledekEl.style.borderRadius = "8px";
            vysledekEl.style.margin = "0 auto";
            vysledekEl.style.color = "#166534";
            vysledekEl.style.fontWeight = "bold";
        }

        if (detailyEl) {
            detailyEl.innerHTML = `
                <p>Současná částka: <strong>${formatCz(castka, 0)} Kč</strong></p>
                <p>Roční inflace: <strong>${formatCz(inflace, 1)} %</strong></p>
                <p>Doba: <strong>${formatCz(doba, 0)} ${doba === 1 ? "rok" : "roky"}</strong></p>
                <p>Reálná hodnota: <strong>${formatCz(realnaHodnota, 0)} Kč</strong></p>
                <p>Ztráta kupní síly: <strong>${formatCz(ztrata, 0)} Kč</strong> (${formatCz(procentualniZtrata, 1)} %)</p>
            `;
        }
    }

    castkaInput.addEventListener("input", function () {
        formatInputAmount();
        vypoctiInflaci();
    });

    castkaSlider.addEventListener("input", function () {
        castkaInput.value = formatCz(this.value, 0);
        vypoctiInflaci();
    });

    // While typing, avoid aggressive formatting (prevents caret jumps).
    inflaceInput.addEventListener("input", function () {
        // only recalculate, format on blur instead
        vypoctiInflaci();
    });

    inflaceSlider.addEventListener("input", function () {
        inflaceInput.value = formatCz(this.value, 1);
        vypoctiInflaci();
    });

    dobaInput.addEventListener("input", function () {
        formatInputDoba();
        vypoctiInflaci();
    });

    dobaSlider.addEventListener("input", function () {
        dobaInput.value = formatCz(this.value, 0);
        vypoctiInflaci();
    });

    tlacitko.addEventListener("click", vypoctiInflaci);

    castkaInput.addEventListener("blur", formatInputAmount);
    inflaceInput.addEventListener("blur", formatInputInflace);
    dobaInput.addEventListener("blur", formatInputDoba);

    // Prevent Enter from jumping focus to the next field or submitting unexpectedly.
    function handleEnterPrevent(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            // Recalculate first
            try { vypoctiInflaci(); } catch (err) {}
            // Move focus to the next control in logical order
            const order = [castkaInput, inflaceInput, dobaInput, tlacitko];
            const current = e.target;
            const idx = order.indexOf(current);
            let next = null;
            if (idx >= 0 && idx < order.length - 1) next = order[idx + 1];
            else if (idx === order.length - 1) next = order[0];
            else next = order[0];
            if (next) {
                next.focus();
                if (typeof next.select === 'function') {
                    try { next.select(); } catch (err) {}
                }
                // If next is the calculate button, trigger click to show result
                if (next === tlacitko) {
                    try { tlacitko.click(); } catch (err) {}
                }
            }
        }
    }

    castkaInput.addEventListener("keydown", handleEnterPrevent);
    inflaceInput.addEventListener("keydown", handleEnterPrevent);
    dobaInput.addEventListener("keydown", handleEnterPrevent);

    vypoctiInflaci();
});
