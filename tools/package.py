"""Build, validate and package only public course files. No personal progress."""
import hashlib
import subprocess
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import json

ROOT = Path(__file__).resolve().parents[1]


def main():
    for script in ['build.py','validate.py']:
        subprocess.run([sys.executable,str(ROOT/'tools'/script)],check=True)
    version=json.loads((ROOT/'curriculum.json').read_text(encoding='utf-8'))['version']
    releases=ROOT.parent/'releases'
    releases.mkdir(exist_ok=True)
    archive=releases/f'ai-cv-learning-{version}.zip'
    allowed_dirs={'content','site','sources','agent','templates','docs','tools','examples','export'}
    allowed_files={'README.md','AGENTS.md','LICENSE.md','THIRD_PARTY.md','CHANGELOG.md','curriculum.json','catalog.json','index.html','打开知识库.cmd'}
    allowed_suffixes={'.md','.json','.html','.css','.js','.cjs','.py','.cmd','.svg','.png'}
    files=[]
    for p in sorted(ROOT.rglob('*')):
        rel=p.relative_to(ROOT)
        if not p.is_file() or '__pycache__' in rel.parts or p.is_symlink(): continue
        if p.suffix not in allowed_suffixes: continue
        if (len(rel.parts)==1 and p.name in allowed_files) or (len(rel.parts)>1 and rel.parts[0] in allowed_dirs):
            files.append(p)
    with ZipFile(archive,'w',ZIP_DEFLATED) as z:
        for p in files:
            z.write(p,Path('ai-cv-learning')/p.relative_to(ROOT))
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.sha256').write_text(digest+'  '+archive.name+'\n',encoding='utf-8')
    print(f'Packaged {len(files)} files: {archive} ({archive.stat().st_size:,} bytes)')
    print('SHA-256:',digest)


if __name__=='__main__':
    main()
