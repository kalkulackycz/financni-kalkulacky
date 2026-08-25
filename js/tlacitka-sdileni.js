// ============================================================
// NOVÝ SDÍLENÝ SOUBOR — obsluha tlačítek Tisk / PDF a Sdílet
// pro všechny kalkulačky (důvod: jednotné chování na jednom
// místě místo kopírování do každé stránky).
// Skript se načítá na konci <body>, takže DOM je připravený.
// ============================================================
(function() {
    const tlacitkoTisk = document.getElementById("tisk-pdf");
    if (tlacitkoTisk) {
        tlacitkoTisk.addEventListener("click", function() { window.print(); });
    }

    const tlacitkoSdilet = document.getElementById("sdilet");
    if (!tlacitkoSdilet) return;

    const nazev = (document.querySelector("h1") ? document.querySelector("h1").textContent.trim() : document.title);
    const text = nazev + " – Finanční Mapa";
    const url = window.location.href;

    tlacitkoSdilet.addEventListener("click", async function() {
        if (navigator.share) {
            try { await navigator.share({ title: document.title, text: text, url: url }); return; } catch (e) {}
        }
        try {
            await navigator.clipboard.writeText(url);
            alert("Odkaz na kalkulačku byl zkopírován do schránky.");
        } catch (e) {
            window.location.href = "mailto:?subject=" + encodeURIComponent(text) + "&body=" + encodeURIComponent(url);
        }
    });
})();