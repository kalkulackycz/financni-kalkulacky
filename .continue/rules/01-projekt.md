---
name: Pravidla projektu financni-kalkulacky
alwaysApply: true
---

# Závazná pravidla pro práci na tomto projektu

- Upravuj POUZE to, o co tě výslovně požádám. Nic jiného. Neopravuj, nerefaktoruj, nezjednodušuj kód, který jsem nezmínil.

- Nikdy neměň, nezkracuj ani jinak needituj URL adresy v `<script src>`, `<link href>` nebo v proměnných typu `var xUrl = "..."`. Platí to zejména pro:
  - https://www.googletagmanager.com/gtag/js?id=G-2BW708HYKH
  - https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js
  Tyto řetězce musí zůstat znakově identické.

- Nikdy neodstraňuj a nepřepisuj existující funkční mechanismy – zejména dynamické načítání Google Analytics a Chart.js pomocí `document.createElement("script")`, validaci vstupů (`validujInput`, `zapnoutFormatovani`), propojení slideru s textovým polem (`propojSlider`), ovládání klávesou Enter mezi poli.

- Vždy vrať KOMPLETNÍ obsah celého souboru, ne fragment nebo diff.

- Zachovej přesnou strukturu HTML tříd, na kterých závisí CSS a JS (pole-s-napovedou, sleva-radek, label-radek, ikona-otaznik, bublina-text, chyba-text, input-chyba). Nepřejmenovávej je.

- Než cokoliv upravíš, řekni mi nejdřív krátce, co přesně změníš.

- Pokud si nejsi jistý, jestli něco smíš změnit, ZEPTEJ SE, než to uděláš.

- Necituj a nepřepisuj CSS proměnné barev, mezer, velikostí písma, pokud o to výslovně nežádám.