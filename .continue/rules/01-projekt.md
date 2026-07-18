---

name: Pravidla projektu financni-kalkulacky
alwaysApply: true
-----------------

# Pravidla projektu

* Upravuj pouze to, co výslovně požaduji. Neměň ostatní funkční logiku, nerefactoruj a nezjednodušuj nesouvisející kód.

* Před úpravou nejdříve načti a zkontroluj skutečný obsah relevantních souborů v projektu. Nikdy si nevymýšlej názvy funkcí, proměnných ani ID elementů.

* Pokud je požadovaná změna v existujícím kódu, uprav přímo skutečný soubor v projektu. Nepředkládej pouze ukázkový fragment s komentářem `// ... existing code ...`.

* Zachovej všechny existující funkční mechanismy, zejména:

  * Google Analytics a Chart.js
  * validaci vstupů
  * formátování vstupů
  * propojení sliderů s textovými poli
  * ovládání klávesou Enter
  * PDF export
  * grafy a amortizační tabulky

* Neměň URL adresy ve `<script src>`, `<link href>` ani URL uložené v proměnných, pokud to výslovně nepožaduji.

* Zachovej existující názvy HTML tříd, ID elementů a vazby mezi HTML, CSS a JavaScriptem.

* Před provedením změny stručně popiš, které konkrétní části upravíš.

* Pokud změna není jednoznačná nebo hrozí poškození jiné funkce, nejdříve se zeptej.

* Po úpravě ověř, že projekt neobsahuje nové chyby a že požadovaná funkce funguje.

* Při práci v editoru proveď změnu přímo v souboru. Nepoužívej pouze ukázkový kód ani obecný návrh změny.
