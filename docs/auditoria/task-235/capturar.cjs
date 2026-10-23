// Capturas de revisão em Chromium headless isolado; não usa o navegador pessoal.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const paths=process.env.CAPTURE_PATHS?process.env.CAPTURE_PATHS.split(','):['/','/funcionalidades','/ambiental','/social','/governanca','/documentacao','/faq','/sobre-nos','/contato','/seguranca','/privacidade','/termos'];
const dir=process.argv[2]||'/tmp/daton-task-235-capturas',base=process.argv[3]||'http://127.0.0.1:5186';
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {})});const out=[];
for(const [label,width,height] of [['desktop',1440,1000],['mobile',375,812]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();
 for(const path of paths){const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+path,{waitUntil:'networkidle'});await page.waitForTimeout(1300);
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=650){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}window.scrollTo(0,0);});await page.waitForTimeout(800);
 const key=path==='/'?'inicio':path.slice(1);await page.screenshot({path:`${dir}/${key}-${label}.png`,fullPage:true});
 const data=await page.evaluate(()=>({title:document.title,text:document.body.innerText,headings:[...document.querySelectorAll('h1,h2,h3,h4')].map(e=>({tag:e.tagName,text:e.textContent})),links:[...document.querySelectorAll('a')].map(e=>({text:e.textContent,href:e.getAttribute('href')})),structure:[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE','PATH','DIV'].includes(e.tagName)).map(e=>({tag:e.tagName,class:e.getAttribute('class'),style:e.getAttribute('style')})),overflow:document.documentElement.scrollWidth>innerWidth}));out.push({path,viewport:label,errors,...data});console.log(path,label,JSON.stringify({errors,overflow:data.overflow,title:data.title}));page.removeAllListeners('pageerror');
 }await context.close();}const old=fs.existsSync(`${dir}/inventory.json`)?JSON.parse(fs.readFileSync(`${dir}/inventory.json`)):[];const merged=old.filter(x=>!out.some(y=>y.path===x.path&&y.viewport===x.viewport)).concat(out);fs.writeFileSync(`${dir}/inventory.json`,JSON.stringify(merged,null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
