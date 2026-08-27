// js/utils.js

// 1. Init tooltip handler (global)
function initTooltipHandler() {
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
}

// 2. Validuj Input
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

// 3. Bind Input Formatting
// formatterFn: optional function to format value
function bindInputFormatting(inputId, chybaId, napoveda, validacniFn, formatterFn) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('blur', function(e) {
        let val = e.target.value.replace(/\s/g, '');
        if (val !== "" && !isNaN(val.replace(",", "."))) {
            if (formatterFn) {
                e.target.value = formatterFn(val);
            }
        }
        validujInput(el, chybaId, napoveda, validacniFn(el.value));
    });
    el.addEventListener('focus', function(e) {
        e.target.value = e.target.value.replace(/\s/g, '');
    });
}

// 4. Bind Slider
function bindSlider(inputId, sliderId, onInputFn, isFloat = false) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    if (!input || !slider) return;

    slider.addEventListener('input', function() {
        if (isFloat) {
            input.value = slider.value.replace('.', ',');
        } else {
            input.value = parseInt(slider.value).toLocaleString('cs-CZ').replace(/\u00A0/g, ' ');
        }
        if (onInputFn) onInputFn();
    });

    input.addEventListener('input', function() {
        let val = input.value.replace(/\s/g, '').replace(',', '.');
        if (!isNaN(val) && val !== '') {
            slider.value = Math.min(Math.max(parseFloat(val), parseFloat(slider.min || 0)), parseFloat(slider.max || 1000000));
        }
    });
}
