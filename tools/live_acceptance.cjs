/* Verify the published site without reading any real learner records.
   Uses an isolated browser context; requires the same Playwright setup as the
   offline acceptance tool. KB_LIVE_URL optionally overrides the public URL. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.KB_TEST_OUTPUT||'browser-test-output');
const url=process.env.KB_LIVE_URL||'https://yr1926.github.io/-/';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',acceptDownloads:true});
  const p=await context.newPage(),errors=[],failedResponses=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)failedResponses.push({url:r.url(),status:r.status()})});
  const response=await p.goto(url);assert.equal(response.status(),200);await p.waitForSelector('.hero-v2');
  assert.equal(await p.evaluate(()=>window.LEARNING_KB.nodes.length),62);
  const sources=await p.locator('script[src],link[rel=stylesheet]').evaluateAll(elements=>elements.map(e=>e.src||e.href));
  for(const source of sources){const r=await context.request.get(source);assert.equal(r.status(),200,source)}
  await p.goto(url+'#/graph');await p.waitForSelector('#atlas-canvas');await p.locator('#atlas-node-select').selectOption('cv-resnet');
  assert((await p.locator('#atlas-selection').textContent()).includes('残差'));
  await p.locator('#atlas-open').click();await p.waitForSelector('#implementation');
  const downloadPromise=p.waitForEvent('download');await p.locator('a[href="examples/cnn_basics.py"]').click();const d=await downloadPromise;
  assert.equal(fs.readFileSync(await d.path(),'utf8').replace(/\r\n/g,'\n'),fs.readFileSync(path.join(root,'examples/cnn_basics.py'),'utf8').replace(/\r\n/g,'\n'));
  await p.goto(url+'#/graph?view=2d');await p.waitForSelector('.chapter-card');assert.equal(await p.locator('.chapter-card').count(),36);
  await p.locator('#axis-next').click();await p.waitForFunction(()=>document.querySelector('.chronicle-scroll').scrollLeft>0);
  await p.goto(url+'#/lesson/ml-gradient');await p.waitForSelector('#gd-step');await p.locator('#gd-step').click();assert((await p.locator('#gd-result').textContent()).includes('w = 0.6'));
  await p.goto(url+'#/lesson/math-vectors');await p.waitForSelector('#personal-note');await p.locator('#personal-note').fill('网页部署验收：仅合成测试笔记');await p.reload();await p.waitForSelector('#personal-note');assert.equal(await p.locator('#personal-note').inputValue(),'网页部署验收：仅合成测试笔记');
  await p.locator('#progress-open').click();const backupPromise=p.waitForEvent('download');await p.locator('#export-progress').click();const backup=JSON.parse(fs.readFileSync(await (await backupPromise).path(),'utf8'));
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const m=await mobile.newPage();m.on('pageerror',e=>errors.push(e.message));
  await m.goto(url+'#/lesson/math-vectors');await m.waitForSelector('#progress-open');await m.locator('#progress-open').tap();await m.locator('#import-progress').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await m.waitForFunction(()=>document.querySelector('#import-result').textContent.includes('导入完成'));await m.locator('[data-close=progress-dialog]').tap();assert.equal(await m.locator('#personal-note').inputValue(),'网页部署验收：仅合成测试笔记');
  for(const route of ['home','graph','graph?view=2d','path','lab','resource/practice']){
   await m.goto(url+'#/'+route);await m.waitForSelector('#main > *');assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route);
  }
  await m.goto(url+'#/graph');await m.waitForSelector('#atlas-canvas');await m.locator('#atlas-node-select').selectOption('math-vectors');await m.locator('#atlas-open').tap();await m.waitForSelector('.lesson-header');assert((await m.locator('.lesson-header h1').textContent()).includes('向量'));
  await m.goto(url+'#/graph');await m.waitForSelector('#atlas-canvas');await m.screenshot({path:path.join(output,'live-mobile.png'),fullPage:true});
  const markdown=await context.request.get(url+'export/'+encodeURIComponent('全部入门课程.md'));assert.equal(markdown.status(),200);assert((await markdown.text()).includes('知识点 ID：math-vectors'));
  assert.deepEqual(errors,[]);assert.deepEqual(failedResponses,[]);
  const report={date:'2026-10-19',url,browser:await browser.version(),checks:['HTTPS home and all linked scripts/styles return 200','3D select and lesson navigation','horizontal chronicle scrolling','interactive experiment arithmetic','Python download matches source','notes survive reload','JSON export/import to fresh mobile context','390px mobile emulation and touch buttons','full Markdown export accessible'],mobileScope:'Chromium mobile emulation; no physical Android or iPhone test',errors,failedResponses};
  fs.writeFileSync(path.join(output,'live-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
