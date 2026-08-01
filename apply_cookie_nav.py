from pathlib import Path
import re

root = Path(r'c:\Users\mm\Desktop\Projekt 0.1\financni-kalkulacky')

cookie_file = root / 'cookie-lista.html'
if not cookie_file.exists():
    raise SystemExit('cookie-lista.html not found')

cookie_text = cookie_file.read_text(encoding='utf-8').strip()
if not cookie_text:
    raise SystemExit('cookie-lista.html is empty or could not be read')

# Files to modify: all .html in root except dekujeme.html and cookie-lista.html
exclude = {'dekujeme.html', 'cookie-lista.html'}
files = sorted([p for p in root.glob('*.html') if p.name not in exclude])

# Patterns for Google Analytics removal
script_src_pattern = re.compile(r'<script[^>]+src=["\']https?://www\.googletagmanager\.com/gtag/js\?id=(G-[A-Z0-9]+)["\'][^>]*>\s*</script>', re.I)
inline_gtag_pattern = re.compile(r'<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\s*\];\s*function\s+gtag\s*\(\)\s*\{[^}]*\}\s*gtag\(\'js\',\s*new Date\(\)\);\s*gtag\(\'config\',\s*\'G-[A-Z0-9]+\'\);\s*</script>', re.I | re.S)
inline_gtag_general = re.compile(r'<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\s*\];.*?<script>', re.I | re.S)

for path in files:
    text = path.read_text(encoding='utf-8')
    original = text

    # NAVIGATION
    nav_match = re.search(r'(<nav class="menu">.*?</nav>)', text, re.S)
    if nav_match:
        nav_html = nav_match.group(1)
        # Normalize any existing kontakt.html link text to O projektu
        nav_html = nav_html.replace('href="kontakt.html">Kontakt</a>', 'href="kontakt.html">O projektu</a>')
        nav_html = nav_html.replace("href='kontakt.html'>Kontakt</a>", "href='kontakt.html'>O projektu</a>")
        # If any of the required links are missing, insert them after Kalkulačky anchor
        missing = []
        if 'href="kontakt.html"' not in nav_html and "href='kontakt.html'" not in nav_html:
            missing.append('<a href="kontakt.html">O projektu</a>')
        if 'href="disclaimer.html"' not in nav_html and "href='disclaimer.html'" not in nav_html:
            missing.append('<a href="disclaimer.html">Disclaimer</a>')
        if 'href="zasady-ochrany-osobnich-udaju.html"' not in nav_html and "href='zasady-ochrany-osobnich-udaju.html'" not in nav_html:
            missing.append('<a href="zasady-ochrany-osobnich-udaju.html">Ochrana údajů</a>')
        if missing:
            # Insert after the Kalkulačky anchor if present
            new_nav_html, count = re.subn(
                r'(<a[^>]*>\s*Kalkulačky\s*</a>)',
                r'\1\n        ' + '\n        '.join(missing),
                nav_html,
                count=1,
            )
            if count == 1:
                text = text.replace(nav_html, new_nav_html)
            else:
                # fallback: append before closing nav
                text = text.replace(nav_html, nav_html.replace('</nav>', '        ' + '\n        '.join(missing) + '\n    </nav>'))

    # GOOGLE ANALYTICS removal in head
    ga_id = None
    # look for script src first
    m_src = script_src_pattern.search(text)
    if m_src:
        ga_id = m_src.group(1)
        text = script_src_pattern.sub('', text)
    # look for inline gtag block with config ID
    m_inline = re.search(r"<script>.*?gtag\('config',\s*'(?P<id>G-[A-Z0-9]+)'\).*?</script>", text, re.S)
    if m_inline:
        if ga_id is None:
            ga_id = m_inline.group('id')
        text = text[:m_inline.start()] + text[m_inline.end():]

    # COOKIE BANNER insertion before </body>
    body_exists = '</body>' in text
    has_banner = 'id="cookie-banner"' in text
    if not has_banner and body_exists:
        insertion = '\n' + cookie_text + '\n'
        text = text.replace('</body>', insertion + '</body>')
        print(f'Inserted banner into {path.name}')
    elif not body_exists:
        print(f'No </body> found in {path.name}')
    elif has_banner:
        print(f'Banner already present in {path.name}')

    if text != original:
        path.write_text(text, encoding='utf-8')
        print(f'Updated {path.name}')
    else:
        print(f'Unchanged {path.name}')
