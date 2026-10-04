async(page)=>{
 let checks=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));const assert=(v,msg)=>{if(!v)throw Error(msg);checks++;};
 const url='http://127.0.0.1:4187/musical-stones/';
 const solutions=[['s-kite','s-pebble'],['w-sand','w-cloud','w-reed'],['l-moss','l-rain','l-fern','l-shell']];const levelIds=['sprout','walk','lantern'];
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')));
 const nav=i=>page.locator('#levels button').nth(i).click();
 const put=async(id,n)=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press(String(n+1));};
 const assertFresh=async()=>{
  const s=await saved();assert(s.version===4&&s.solved.length===0,'fresh achievements');
  for(let i=0;i<3;i++){
   const p=s.puzzles[levelIds[i]];assert(p.slots.every(id=>id===null),'every well empty');
   const order=p.tray.slice().sort((a,b)=>p.world[a].x-p.world[b].x);assert(JSON.stringify(order)!==JSON.stringify(solutions[i]),'non-identity start');assert(Object.values(p.world).every(point=>point.y===.77),'ignore old free positions');
  }
  assert(await page.locator('#stop').isDisabled()&&!await page.locator('#listening-room').evaluate(e=>e.open),'quiet startup');assert(await page.locator('.gem[data-location="free"]').count()===solutions[s.levelIndex].length,'all current gems free');
 };
 const assertGeometry=async()=>{
  const result=await page.evaluate(()=>{const b=document.getElementById('gem-stage').getBoundingClientRect(),g=[...document.querySelectorAll('.gem')].map(e=>e.getBoundingClientRect()),s=[...document.querySelectorAll('.socket')].map(e=>e.getBoundingClientRect());const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return{inside:g.every(r=>r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom),overlap:g.some((a,i)=>g.slice(i+1).some(c=>overlap(a,c))),inWell:g.some(a=>s.some(c=>overlap(a,c))),overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(result.inside&&!result.overlap&&!result.inWell&&!result.overflow,'initial geometry '+JSON.stringify(result));
 };
 await page.goto('about:blank');const cdp=await page.context().newCDPSession(page);await cdp.send('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:4187',storageTypes:'local_storage'});await cdp.detach();
 await page.setViewportSize({width:390,height:664});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url);await assertFresh();
 for(const viewport of [{width:320,height:568},{width:390,height:664},{width:1280,height:900}]){
  await page.setViewportSize(viewport);for(let i=0;i<3;i++){await nav(i);await assertGeometry();}
 }
 await page.setViewportSize({width:390,height:664});
 for(let i=0;i<3;i++){
  await nav(i);await put(solutions[i][0],0);
  await page.locator(`[data-gem="${solutions[i][1]}"]`).focus();await page.keyboard.press('ArrowUp');
  const before=(await saved()).puzzles[levelIds[i]];assert(before.slots[0]===solutions[i][0],'mid-game placed');
  await nav((i+1)%3);await nav(i);assert(JSON.stringify((await saved()).puzzles[levelIds[i]])===JSON.stringify(before),'switch preserves in-memory puzzle');
  await page.setViewportSize({width:320,height:568});await page.setViewportSize({width:390,height:664});assert(JSON.stringify((await saved()).puzzles[levelIds[i]])===JSON.stringify(before),'resize does not shuffle');
  await page.reload();assert((await saved()).levelIndex===i,'selected song retained');await assertFresh();await assertGeometry();
  for(let n=0;n<solutions[i].length;n++)await put(solutions[i][n],n);
  await page.locator('#check').click();await page.waitForFunction(()=>document.getElementById('listening-room').open);assert((await saved()).solved.includes(levelIds[i]),'completed in this session');
  await page.reload();await assertFresh();await assertGeometry();
  // Explicit restart clears only this puzzle, keeps labels and other live progress.
  await put(solutions[i][0],0);await nav((i+1)%3);await put(solutions[(i+1)%3][0],0);await nav(i);
  const snapshot=await saved(),tray=snapshot.puzzles[levelIds[i]].tray;
  await page.locator('.help summary').click();await page.locator('#shuffle').click();await page.locator('.help summary').click();
  const reset=await saved();assert(reset.puzzles[levelIds[i]].slots.every(id=>id===null),'restart wells empty');assert(JSON.stringify(reset.puzzles[levelIds[i]].tray)===JSON.stringify(tray),'restart labels stable');assert(JSON.stringify(reset.puzzles[levelIds[(i+1)%3]])===JSON.stringify(snapshot.puzzles[levelIds[(i+1)%3]]),'restart leaves other song alone');await assertGeometry();
  await put(solutions[i][0],0);await page.locator('.help summary').click();await page.locator('#clear').click();await page.locator('.help summary').click();assert((await saved()).puzzles[levelIds[i]].slots.every(id=>id===null),'detach all');
 }
 // Pagehide of the old app cannot overwrite the injected migration fixture.
 for(const version of [1,2,3,4]){
  await page.goto('about:blank');
  await page.goto('http://127.0.0.1:4187/musical-stones/review/first-song.html');
  await page.evaluate(({version,solutions,levelIds})=>{
   localStorage.setItem('demo5.sound-stitch.v1',JSON.stringify({version,levelIndex:2,volume:.28,muted:true,solved:levelIds,puzzles:Object.fromEntries(levelIds.map((id,i)=>[id,{tray:solutions[i],slots:solutions[i],world:Object.fromEntries(solutions[i].map(f=>[f,{x:.01,y:.01}]))}]))}));
  },{version,solutions,levelIds});
  await page.goto(url);await assertFresh();await assertGeometry();const s=await saved();assert(s.volume===.28&&s.muted&&s.levelIndex===2,'legacy preferences retained');
 }
 await page.locator('#mute').click();await page.locator('#volume').fill('41');await page.locator('#volume').dispatchEvent('input');await page.reload();const settings=await saved();assert(settings.volume===.41&&!settings.muted,'new preferences retained');await assertFresh();
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/startup-390.png'});assert(errors.length===0,`errors ${errors}`);return{checks,versions:[1,2,3,4],songs:3,viewports:['320x568','390x664','1280x900'],errors};
}
