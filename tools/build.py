"""Build a dependency-free offline reading snapshot from Markdown and JSON."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def inline(text):
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    def link(m):
        label, url = m.group(1), html.unescape(m.group(2))
        if not re.match(r'^(https?://|#/lesson/)', url):
            return label
        external = ' target="_blank" rel="noopener noreferrer"' if url.startswith(('https:','http:')) else ''
        return f'<a href="{html.escape(url, quote=True)}"{external}>{label}</a>'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, text)


def markdown(text):
    out, paragraph, list_open = [], [], False
    code, code_lines = False, []
    def flush():
        if paragraph:
            out.append('<p>' + inline(' '.join(paragraph)) + '</p>')
            paragraph.clear()
    for line in text.splitlines():
        if line.startswith('```'):
            flush()
            if list_open:
                out.append('</ul>'); list_open = False
            if code:
                out.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
                code_lines.clear()
            code = not code
            continue
        if code:
            code_lines.append(line); continue
        if line.startswith('- '):
            flush()
            if not list_open:
                out.append('<ul>'); list_open = True
            out.append('<li>' + inline(line[2:]) + '</li>'); continue
        if list_open:
            out.append('</ul>'); list_open = False
        if not line.strip():
            flush(); continue
        if line.startswith('#'):
            flush()
            level = min(len(line) - len(line.lstrip('#')), 6)
            if level > 1:
                out.append(f'<h{level}>' + inline(line[level:].strip()) + f'</h{level}>')
        else:
            paragraph.append(line)
    flush()
    if list_open: out.append('</ul>')
    if code: raise ValueError('Unclosed code fence')
    return '\n'.join(out)


def main():
    curriculum = json.loads((ROOT / 'curriculum.json').read_text(encoding='utf-8'))
    sources = json.loads((ROOT / 'sources/registry.json').read_text(encoding='utf-8'))
    entries, catalog = [], []
    for item in curriculum['nodes']:
        note = dict(item)
        note['available'] = bool(note.get('path'))
        note['backlinks'] = [n['id'] for n in curriculum['nodes'] if note['id'] in n['prerequisites']]
        if note['available']:
            raw = (ROOT / note['path']).read_text(encoding='utf-8')
            note['html'] = markdown(raw)
            note['searchText'] = raw
        else:
            note['html'] = ''
            note['searchText'] = note['summary']
        entries.append(note)
        catalog.append({k:v for k,v in note.items() if k not in ('html', 'searchText', 'quiz')})
    resource_specs = [
        ('start', '新生开始学习指南', 'docs/开始学习.md'),
        ('practice', 'PyTorch：从算法到可运行实验', 'examples/README.md'),
        ('maintain', '维护与迁移指南', 'docs/维护指南.md'),
    ]
    resources = []
    for rid, title, path in resource_specs:
        text = (ROOT / path).read_text(encoding='utf-8')
        resources.append(dict(id=rid,title=title,path=path,html=markdown(text)))
    implementation_specs = {
        'cnn_basics.py': ('小型 CNN：从训练到评估', 'CPU合成横竖线分类；完整CNN训练/验证/测试，另含形状、残差和冻结梯度检查。'),
        'torch_ml.py': ('机器学习 PyTorch 实验', '线性回归、逻辑回归、kNN、K-means 与 PCA；合成数据，CPU 运行。'),
        'torch_foundations.py': ('PyTorch 训练基础', '张量、自动微分、CNN 形状检查与 MLP 完整训练/验证/测试。'),
        'q_learning.py': ('表格 Q-learning', '五状态走廊，只有标准库；终止与采样截断分开处理。'),
        'dqn_torch.py': ('DQN 完整小实验', '网络、经验回放、目标网络、终止掩码与评估；需同目录 q_learning.py。'),
        'policy_torch.py': ('REINFORCE 与 PPO 目标检查', 'REINFORCE 完整小训练；PPO 部分仅是裁剪目标验证，需同目录 q_learning.py。'),
    }
    implementations = {name:dict(title=title,description=description,code=(ROOT/'examples'/name).read_text(encoding='utf-8')) for name,(title,description) in implementation_specs.items()}
    data = {**curriculum, 'nodes': entries, 'sources': sources, 'resources':resources, 'implementations':implementations}
    (ROOT / 'site').mkdir(exist_ok=True)
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    (ROOT / 'site/data.js').write_text('window.LEARNING_KB = ' + encoded + ';\n', encoding='utf-8')
    (ROOT / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    exported = ROOT / 'export'
    exported.mkdir(exist_ok=True)
    text = '# 看见智能：全部基础课程\n\n'
    count=sum(n['available'] for n in entries)
    text += f"版本 {curriculum['version']}。{count} 篇正文，均为 Agent 编写、待教师审核。另有 {len(entries)-count} 个后续框架节点，尚无正文。默认已掌握 Python 语言。\n\n"
    text += '给 Agent：请区分资料内容、教学简化和推断；按稳定知识点 ID 引用，先查先修再解释。不把练习通过等同于掌握。\n\n'
    for note in entries:
        if note['available']:
            text += '\n---\n\n知识点 ID：'+note['id']+'\n\n轮次：'+str(note['round'])+('（主线）' if note['round']<3 else '（选修拓展）')+'\n\n先修：'+(', '.join(note['prerequisites']) or '无')+'\n\n'+note['searchText']+'\n'
    (exported / '全部入门课程.md').write_text(text, encoding='utf-8')
    print(f'Built {len(entries)} nodes; {sum(n["available"] for n in entries)} complete lessons.')


if __name__ == '__main__':
    main()
