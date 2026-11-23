"""Install the approved source gallery in the generated Pages artifact."""

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MARKER = 'data-jp-source-gallery'
REDIRECT = re.compile(r'<meta\b[^>]*http-equiv\s*=\s*["\']?refresh\b', re.I)
BODY_END = re.compile(r'</body\s*>', re.I)


def inject(html, script):
    if MARKER in html or REDIRECT.search(html):
        return html
    endings = list(BODY_END.finditer(html))
    if not endings:
        return html
    end = endings[-1].start()
    return html[:end] + script + '\n' + html[end:]


def install(site, slug):
    if not site.is_dir():
        raise ValueError(f'Pages build missing: {site}')
    script = f'<script defer {MARKER} src="/{slug}/source-gallery.js"></script>'
    processed = 0
    for page in site.rglob('*.html'):
        original = page.read_bytes().decode('utf-8')
        revised = inject(original, script)
        if revised != original:
            page.write_bytes(revised.encode('utf-8'))
        processed += script in revised
    if not processed:
        raise ValueError('The Pages build has no gallery entry points')
    (site / 'source-gallery.js').write_bytes((ROOT / 'source-gallery.js').read_bytes())
    print(f'Installed the Google Drive source gallery on {processed} Pages routes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('site', type=Path)
    parser.add_argument('slug')
    arguments = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_.-]+', arguments.slug):
        parser.error('Invalid GitHub Pages repository name')
    install(arguments.site, arguments.slug)
