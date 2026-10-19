"""Build a single offline HTML from the same public sources as the folder edition.

Run: python tools/standalone.py
No browser, Node, external dependencies, or personal learner data is required.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '看见智能.html'


def local_asset(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f'Not a public local asset: {relative}')
    return path.read_text(encoding='utf-8')


def script_block(source):
    # HTML parses script end tags even inside JavaScript strings and comments.
    # Escape the slash so lesson text cannot prematurely close this element.
    return '<script>\n' + re.sub(r'</script', r'<\\/script', source, flags=re.I) + '\n</script>'


def build():
    page = local_asset('index.html')
    scripts = []

    def stylesheet(match):
        source = local_asset(match[1])
        if re.search(r'url\s*\(|@import|</style', source, re.I):
            raise ValueError('Inline styles need explicit handling for external assets or end tags')
        return '<style>\n' + source + '\n</style>'

    def javascript(match):
        scripts.append(local_asset(match[1]))
        return ''

    page = re.sub(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, page)
    page = re.sub(r'<script defer src="([^"]+)"></script>', javascript, page)
    if len(scripts) != 5 or re.search(r'<script[^>]+src=|<link[^>]+stylesheet', page):
        raise ValueError('Review changed index.html dependencies before building the portable edition')

    # Existing data already carries every lesson and every implementation. Only
    # the full Markdown export is additional; progress stays in browser storage.
    exported = json.dumps(local_asset('export/全部入门课程.md'), ensure_ascii=False)
    portable = local_asset('site/portable.js').replace('__COURSE_MARKDOWN__', exported)
    # Keep the same dependency order, but run after the page DOM has been parsed.
    scripts.insert(1, portable)
    page = page.replace('</body>', '\n'.join(map(script_block, scripts)) + '\n</body>')
    page = page.replace('<html lang="zh-CN">', '<html lang="zh-CN" data-edition="portable">')
    page = page.replace('LOCAL EDITION · 03', 'SINGLE FILE · 03')
    page = page.replace('一本可以探索的学习手册', '一本随身携带的学习手册')
    OUTPUT.write_text(page, encoding='utf-8', newline='\n')
    print(f'Portable HTML: {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)')


def main():
    for name in ['build.py', 'validate.py']:
        subprocess.run([sys.executable, str(ROOT / 'tools' / name)], check=True)
    build()


if __name__ == '__main__':
    main()
