# Doplní og:image tagy za og:url ve všech HTML souborech projektu.
# Idempotentní: pokud og:image už stránka má, přeskočí ji.
# Pracuje v binárním režimu, aby nedocházelo k přepisu konců řádků (CRLF/LF).
# Spuštění: python scripts/add_og_tags.py
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAGS = (b'    <meta property="og:image" content="https://financnimapa.cz/images/og-image.jpg">\r\n'
        b'    <meta property="og:image:width" content="1200">\r\n'
        b'    <meta property="og:image:height" content="630">')
TAGS_LF = TAGS.replace(b"\r\n", b"\n")

count = 0
for dirpath, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith(".html"):
            continue
        path = os.path.join(dirpath, fn)
        with open(path, "rb") as f:
            src = f.read()
        if b'property="og:image"' in src:
            print("SKIP (uz ma og:image):", os.path.relpath(path, ROOT))
            continue
        # vloz za posledni og:url meta tag; zachovej CRLF i LF
        m_crlf = list(re.finditer(rb'[ \t]*<meta property="og:url"[^>]*>\r\n', src))
        m_lf = list(re.finditer(rb'[ \t]*<meta property="og:url"[^>]*>\n', src))
        if m_crlf:
            m = m_crlf[-1]; ins = TAGS + b"\r\n"
        elif m_lf:
            m = m_lf[-1]; ins = TAGS_LF + b"\n"
        else:
            print("CHYBA - neni og:url:", os.path.relpath(path, ROOT))
            continue
        src = src[:m.end()] + ins + src[m.end():]
        with open(path, "wb") as f:
            f.write(src)
        count += 1

print("Upraveno stranek:", count)