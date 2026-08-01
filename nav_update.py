from pathlib import Path

root = Path(r"c:\Users\mm\Desktop\Projekt 0.1\financni-kalkulacky")
nav_defs = {
    'uvod.html': '''    <nav class="menu">
        <a href="uvod.html" class="aktivni">Domů</a>
        <a href="kalkulacky.html">Kalkulačky</a>
    </nav>''',
    'kalkulacky.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'index.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'inflace.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'mzda.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'nemocenska-2026.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'ppm.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'pujcka.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'refinancovani.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'sporeni.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'mimoradna-splatka.html': '''    <nav class="menu">
        <a href="uvod.html">Domů</a>
        <a href="kalkulacky.html" class="aktivni">Kalkulačky</a>
    </nav>''',
    'cla/inflace-vysvetlene.html': '''    <nav class="menu">
        <a href="../uvod.html">Domů</a>
        <a href="../kalkulacky.html">Kalkulačky</a>
    </nav>''',
    'cla/rpsn-vysvetlene.html': '''    <nav class="menu">
        <a href="../uvod.html">Domů</a>
        <a href="../kalkulacky.html">Kalkulačky</a>
    </nav>''',
}

for rel, replacement in nav_defs.items():
    p = root / rel
    if not p.exists():
        print(f'MISSING {rel}')
        continue
    text = p.read_text(encoding='utf-8')
    start = text.find('<nav class="menu">')
    if start < 0:
        print(f'NAV NOT FOUND in {rel}')
        continue
    end = text.find('</nav>', start)
    if end < 0:
        print(f'NO CLOSING NAV in {rel}')
        continue
    end += len('</nav>')
    new_text = text[:start] + replacement + text[end:]
    if new_text != text:
        p.write_text(new_text, encoding='utf-8')
        print(f'UPDATED {rel}')
    else:
        print(f'UNCHANGED {rel}')
