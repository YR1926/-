"""Validate content integrity and ensure generated data is current."""
import json
from pathlib import Path
from build import markdown

ROOT = Path(__file__).resolve().parents[1]


def main():
    data = json.loads((ROOT / 'curriculum.json').read_text(encoding='utf-8'))
    nodes = data['nodes']
    ids = {n['id'] for n in nodes}
    assert len(ids) == len(nodes), 'Duplicate IDs'
    sources = json.loads((ROOT / 'sources/registry.json').read_text(encoding='utf-8'))
    by_id = {n['id']:n for n in nodes}
    stages = {s['id'] for s in data['stages']}
    assert {r['id'] for r in data['rounds']} == {1, 2, 3}
    main_ids = data['mainPath']
    assert len(main_ids) == len(set(main_ids))
    assert set(main_ids) == {n['id'] for n in nodes if n['round'] < 3}
    main_covered = set()
    for i in main_ids:
        assert by_id[i].get('path'), f'Main course missing lesson: {i}'
        assert set(by_id[i]['prerequisites']) <= main_covered, f'Main order: {i}'
        main_covered.add(i)
    for track in data['learningPaths']:
        assert len(track['nodes']) == len(set(track['nodes']))
        assert set(track['nodes']) <= ids
    done, active = set(), set()
    def visit(i):
        assert i not in active, f'Prerequisite cycle at {i}'
        if i in done: return
        active.add(i)
        for p in by_id[i]['prerequisites']: visit(p)
        active.remove(i); done.add(i)
    for n in nodes:
        assert n['stage'] in stages
        assert n['round'] in {1, 2, 3}
        assert n['id'] not in n['prerequisites'] + n['related']
        assert all(i in ids for i in n['prerequisites'] + n['related']), n['id']
        assert all(by_id[i]['round'] <= n['round'] for i in n['prerequisites']), n['id']
        assert all(i in sources for i in n['sources']), n['id']
        if n.get('path'):
            path = (ROOT / n['path']).resolve()
            assert path.is_relative_to(ROOT)
            text = path.read_text(encoding='utf-8')
            assert text.startswith('# ' + n['title']), n['id']
            for heading in ['## 你会解决什么问题', '## 常见误区', '## 与计算机视觉的联系']:
                assert heading in text, (n['id'], heading)
            assert len(n['quiz']) == 2
            assert n['version'] >= 1 and n['reviewStatus'] == 'draft'
            for q in n['quiz']:
                assert len(q['options']) >= 3 and 0 <= q['answer'] < len(q['options'])
                assert q['explanation']
        visit(n['id'])
    assert len(data['starterPath']) == sum(bool(n.get('path')) for n in nodes)
    assert not any(n['stage']=='python' for n in nodes)
    assert set(data.get('retiredIds',[])).isdisjoint(ids)
    covered = set()
    for i in data['starterPath']:
        assert by_id[i].get('path')
        assert set(by_id[i]['prerequisites']) <= covered, f'Starter path order: {i}'
        covered.add(i)
    generated = (ROOT / 'site/data.js').read_text(encoding='utf-8')
    snapshot = json.loads(generated.removeprefix('window.LEARNING_KB = ').strip().removesuffix(';'))
    assert snapshot['sources'] == sources
    assert snapshot['stages'] == data['stages']
    assert snapshot['starterPath'] == data['starterPath']
    assert snapshot['mainPath'] == data['mainPath']
    assert snapshot['rounds'] == data['rounds']
    assert len(snapshot['nodes']) == len(nodes)
    for n in snapshot['nodes']:
        original = by_id[n['id']]
        for key,value in original.items(): assert n[key] == value, (n['id'],key)
        if n['available']:
            text = (ROOT / n['path']).read_text(encoding='utf-8')
            assert n['html'] == markdown(text) and n['searchText'] == text
    for resource in snapshot['resources']:
        assert resource['html'] == markdown((ROOT / resource['path']).read_text(encoding='utf-8'))
    for name,impl in snapshot['implementations'].items():
        assert impl['code'] == (ROOT/'examples'/name).read_text(encoding='utf-8')
    for n in nodes:
        if n.get('implementation'): assert n['implementation'] in snapshot['implementations']
    export = (ROOT / 'export/全部入门课程.md').read_text(encoding='utf-8')
    for n in nodes:
        if n.get('path'):
            assert (ROOT / n['path']).read_text(encoding='utf-8') in export
    print(f'PASS: {len(nodes)} nodes, {len(data["starterPath"])} lessons, sources, prerequisites, DAG, implementation snapshots.')


if __name__ == '__main__':
    main()
