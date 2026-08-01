from pathlib import Path

root = Path(r"c:\Users\mm\Desktop\Projekt 0.1\financni-kalkulacky\cla")
files = {
    "inflace-vysvetlene.html": '''<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Co je inflace a jak ovlivňuje ceny a úspory. Jednoduché vysvětlení.">
    <title>Co je inflace?</title>
    <link rel="stylesheet" href="/financni-kalkulacky/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📈</text></svg>">
</head>
<body>
    <nav class="menu">
        <a href="../uvod.html">Domů</a>
        <a href="../kalkulacky.html">Kalkulačky</a>
    </nav>
    <div class="kalkulacka clanek">
        <h1>Co je inflace?</h1>
        <p class="uvod">Inflace znamená, že ceny věcí rostou. To je důvod, proč si za stejnou částku koupíte méně než dříve.</p>
        <h2>Jak to ovlivní vaše úspory?</h2>
        <ul>
            <li>Vaše peníze ztrácejí kupní sílu, pokud rostou ceny rychleji než úrok na účtu.</li>
            <li>Proto je dobré sledovat inflaci a spořit tak, aby výnos nebyl nižší než ona.</li>
        </ul>
        <p>Nejjednodušší je mít přehled o tom, kolik utrácíte a jaké máte úročení na spoření. Pokud je inflace vysoká, je rozumné zvážit, kde vaše úspory uložíte.</p>
        <a href="../kalkulacky.html" class="zpet-odkaz">← Zpět na kalkulačky</a>
    </div>
    <footer class="paticka">
        <p>Text slouží jako orientační vysvětlení, nenahrazuje finanční poradenství.</p>
    </footer>
</body>
</html>''',
    "rpsn-vysvetlene.html": '''<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Co je RPSN a proč je důležité jej sledovat při půjčce. Jednoduché vysvětlení.">
    <title>Co je RPSN?</title>
    <link rel="stylesheet" href="/financni-kalkulacky/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💡</text></svg>">
</head>
<body>
    <nav class="menu">
        <a href="../uvod.html">Domů</a>
        <a href="../kalkulacky.html">Kalkulačky</a>
    </nav>
    <div class="kalkulacka clanek">
        <h1>Co je RPSN?</h1>
        <p class="uvod">RPSN ukazuje celkové roční náklady půjčky v procentech. Pomáhá porovnat, kolik skutečně zaplatíte.</p>
        <h2>Proč se na RPSN dívat?</h2>
        <ul>
            <li>Zahrnuje úrok i poplatky, takže ukazuje reálné náklady.</li>
            <li>Pomáhá porovnat půjčky se stejným úrokem, ale různými poplatky.</li>
        </ul>
        <p>Nižší RPSN obvykle znamená levnější úvěr. Při výběru půjčky se tedy dívejte hlavně na něj, ne jen na samotný úrok.</p>
        <a href="../kalkulacky.html" class="zpet-odkaz">← Zpět na kalkulačky</a>
    </div>
    <footer class="paticka">
        <p>Text slouží jako orientační vysvětlení, nenahrazuje finanční poradenství.</p>
    </footer>
</body>
</html>''',
    "refinancovani-vysvetlene.html": '''<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Co je refinancování hypotéky a kdy se vyplatí. Jednoduché vysvětlení bez složitých detailů.">
    <title>Refinancování hypotéky</title>
    <link rel="stylesheet" href="/financni-kalkulacky/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔄</text></svg>">
</head>
<body>
    <nav class="menu">
        <a href="../uvod.html">Domů</a>
        <a href="../kalkulacky.html">Kalkulačky</a>
    </nav>
    <div class="kalkulacka clanek">
        <h1>Refinancování hypotéky</h1>
        <p class="uvod">Refinancování znamená nahradit starou hypotéku novou s lepší úrokovou sazbou. Cílem je snížit měsíční splátku nebo ušetřit na úrocích.</p>
        <h2>Co je dobré sledovat?</h2>
        <ul>
            <li>Porovnávejte celkové náklady, nejen úrok.</li>
            <li>Ujistěte se, že poplatky za přechod nejsou vyšší než úspora.</li>
            <li>Refinancování se vyplatí nejvíce, když nová sazba je výrazně nižší než současná.</li>
        </ul>
        <p>Pokud nová hypotéka přinese nižší celkové náklady, může být refinancování užitečné. Pokud ne, je lepší zůstat u stávající smlouvy.</p>
        <a href="../kalkulacky.html" class="zpet-odkaz">← Zpět na kalkulačky</a>
    </div>
    <footer class="paticka">
        <p>Text slouží jako orientační vysvětlení, nenahrazuje finanční poradenství.</p>
    </footer>
</body>
</html>'''
}
for name, content in files.items():
    (root / name).write_text(content, encoding='utf-8')
