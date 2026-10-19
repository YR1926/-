"""Usage: python tools/search.py 卷积"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
query = ' '.join(sys.argv[1:]).strip().casefold()
if not query:
    raise SystemExit('用法：python tools/search.py 关键词')
for item in json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8')):
    body = (ROOT / item['path']).read_text(encoding='utf-8') if item.get('path') else ''
    if query in (item['title'] + ' ' + item['summary'] + ' ' + ' '.join(item['tags']) + body).casefold():
        print(json.dumps({k:item[k] for k in ['id','title','path','reviewStatus','prerequisites']}, ensure_ascii=False))
