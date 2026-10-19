/* Maintainer check: a relocated HTML must work without its source directory.
   Same Playwright / browser environment variables as browser_acceptance.cjs. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.KB_TEST_OUTPUT||'browser-test-output');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'kb-portable-'));
const portable=path.join(temporary,'独立学习手册.html');
fs.copyFileSync(path.join(root,'看见智能.html'),portable);
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({offline:true,reducedMotion:'reduce',acceptDownloads:true,viewport:{width:1440,height:1050}});
  const p=await context.newPage(),requests=[],errors=[],failures=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failures.push(r.url()));
  const url=pathToFileURL(portable).href;
  await p.goto(url+'#/guide');await p.waitForSelector('.guide-grid');
  assert.equal(await p.locator('script[src],link[rel=stylesheet]').count(),0);
  async function downloadAndCompare(selector,expected,name){
   const waiting=p.waitForEvent('download');await p.locator(selector).click();const d=await waiting;
   assert.equal(d.suggestedFilename(),name);
   assert.equal(fs.readFileSync(await d.path(),'utf8').replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'));
  }
  await downloadAndCompare('a[href="export/全部入门课程.md"]',fs.readFileSync(path.join(root,'export/全部入门课程.md'),'utf8'),'全部入门课程.md');
  await p.goto(url+'#/resource/practice');await p.waitForSelector('.prose');
  const implementationNames=await p.evaluate(()=>Object.keys(window.LEARNING_KB.implementations));
  for(const name of implementationNames)await downloadAndCompare(`a[href="examples/${name}"]`,fs.readFileSync(path.join(root,'examples',name),'utf8'),name);
  await p.goto(url+'#/lesson/math-vectors');await p.waitForSelector('#export-context');
  const source=await p.evaluate(()=>window.LEARNING_KB.nodes.find(n=>n.id==='math-vectors').path);
  assert((await p.locator(`a[href="${source}"]`).textContent()).includes('下载'));
  await downloadAndCompare(`a[href="${source}"]`,fs.readFileSync(path.join(root,source),'utf8'),path.basename(source));
  const waiting=p.waitForEvent('download');await p.locator('#export-context').click();const lesson=await waiting;
  assert(fs.readFileSync(await lesson.path(),'utf8').includes('知识点 ID：math-vectors'));
  // Check all local links exposed by the dynamic UI resolve to embedded files.
  const routes=['guide','resource/start','resource/practice','resource/maintain'];
  const nodeIds=await p.evaluate(()=>window.LEARNING_KB.nodes.map(n=>n.id));
  for(const route of [...routes,...nodeIds.map(id=>'lesson/'+id)]){
   await p.goto(url+'#/'+route);await p.waitForSelector('#main > *');
   const local=await p.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h&&!/^(#|https?:|blob:|mailto:)/.test(h)));
   const embedded=await p.evaluate(()=>[...window.LEARNING_KB.nodes.filter(n=>n.available).map(n=>n.path),...Object.keys(window.LEARNING_KB.implementations).map(f=>'examples/'+f),'export/全部入门课程.md']);
   for(const href of local)assert(embedded.includes(href),`Missing embedded file: ${route} ${href}`);
  }
  await p.goto(url+'#/graph');await p.waitForSelector('#atlas-canvas');await p.screenshot({path:path.join(output,'portable-network.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  assert(requests.every(request=>request===url||request.startsWith(url+'#')||request.startsWith('blob:')),JSON.stringify(requests));
  const report={date:'2026-10-19',browser:await browser.version(),bytes:fs.statSync(portable).size,renamedAndRelocated:true,onlyFileInDirectory:fs.readdirSync(temporary).length===1,offline:true,checks:['all six Python downloads match sources','lesson Markdown and full course Markdown match sources','Agent context export','all dynamic local links are embedded','zero external or sibling asset requests'],errors,failures,requests};
  assert(report.onlyFileInDirectory);fs.writeFileSync(path.join(output,'portable-downloads.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{
  await browser.close();
  assert.equal(path.dirname(path.resolve(temporary)),path.resolve(os.tmpdir()));
  assert(path.basename(temporary).startsWith('kb-portable-'));
  fs.rmSync(temporary,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
