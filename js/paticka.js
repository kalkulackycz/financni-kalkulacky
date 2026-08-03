document.addEventListener("DOMContentLoaded", function () {
    const paticka = document.getElementById("paticka");

    if (paticka) {
        paticka.innerHTML = `
            <p style="margin-bottom: 8px;">
                © 2026 Finanční Mapa | Kalkulačky slouží pouze pro orientační výpočty.
            </p>

            <div style="display: flex; justify-content: center; gap: 16px; font-size: 13px;">
                <a href="podminky.html" style="color: #4f46e5; text-decoration: none;">
                    Právní informace a podmínky použití
                </a>

                <span>•</span>

                <a href="ochrana-soukromi.html" style="color: #4f46e5; text-decoration: none;">
                    Ochrana osobních údajů (GDPR)
                </a>
            </div>
        `;
    }
});