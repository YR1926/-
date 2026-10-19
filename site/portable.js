/* Embedded only by tools/standalone.py. No network or learner data is bundled. */
(() => {
  'use strict';
  window.KB_PORTABLE = true;
  const data = window.LEARNING_KB;
  const files = new Map(data.nodes.filter(n => n.available).map(n => [n.path, n.searchText]));
  for (const [name, implementation] of Object.entries(data.implementations)) {
    files.set('examples/' + name, implementation.code);
  }
  files.set('export/全部入门课程.md', __COURSE_MARKDOWN__);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    const path = link?.getAttribute('href');
    if (!files.has(path)) return;
    event.preventDefault();
    const name = path.split('/').pop();
    const type = name.endsWith('.py') ? 'text/x-python' : 'text/markdown';
    const url = URL.createObjectURL(new Blob([files.get(path)], {type: type + ';charset=utf-8'}));
    const download = document.createElement('a');
    download.href = url;
    download.download = name;
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, true);
})();
