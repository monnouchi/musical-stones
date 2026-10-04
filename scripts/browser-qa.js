async(page)=>{
 let checks=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
 await page.goto('about:blank');const cdp=await page.context().newCDPSession(page);await cdp.send('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:4187',storageTypes:'local_storage'});await cdp.detach();
 await page.setViewportSize({width:390,height:664});await page.goto('http://127.0.0.1:4187/musical-stones/');await page.emulateMedia({reducedMotion:'reduce'});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')));
 const puzzle=async()=>{const s=await saved();return s.puzzles[['sprout','walk','lantern'][s.levelIndex]];};
 const nav=i=>page.locator('#levels button').nth(i).click();
 const select=async id=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press('Enter');};
 const put=async(id,i)=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press(String(i+1));};
 const board=()=>page.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.left+b.clientLeft,y:r.top+b.clientTop,w:b.clientWidth,h:b.clientHeight};});
 const point=async(x,y)=>{const b=await board();return{x:b.x+x*b.w,y:b.y+y*b.h};};
 const socket=async i=>{const b=await board(),p=await puzzle();return{x:b.x+(i+.5)*b.w/p.slots.length,y:b.y+b.h*.29};};
 const begin=async(id,to)=>{await select(id);const e=page.locator(`[data-gem="${id}"]`),b=await e.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});};
 const drag=async(id,to)=>{await begin(id,to);await page.mouse.up();};
 assert(await page.locator('#stop').isDisabled(),'initial silence');
 await select('s-kite');await page.waitForFunction(()=>!document.getElementById('stop').disabled);assert(await page.locator('.gem.is-playing').count()===1,'one preview');
 await page.locator('#place-active').click();assert((await puzzle()).slots.includes('s-kite'),'tap nearest empty well');
 await page.locator('#return-active').click();assert(!(await puzzle()).slots.includes('s-kite'),'tap detach');
 await nav(2);await drag('l-moss',await point(.46,.61));
 let p=await puzzle();assert(!p.slots.includes('l-moss'),'free drop not ordered');assert(Math.abs(p.world['l-moss'].x-.46)<.01&&Math.abs(p.world['l-moss'].y-.61)<.01,'exact release persisted');
 const freeBefore=JSON.stringify(p.world['l-moss']);await page.reload();p=await puzzle();assert(p.slots.every(id=>id===null)&&JSON.stringify(p.world['l-moss'])!==freeBefore,'reload starts outside wells');assert(await page.locator('#stop').isDisabled(),'reload silent');
 // Near a well: physical stone stays attached to its DOM, is gently pulled, and commits once.
 await select('l-moss');const e=page.locator('[data-gem="l-moss"]'),handle=await e.elementHandle(),bb=await e.boundingBox(),s=await socket(0),g=await board();
 const near={x:s.x+Math.min(38,g.w/4*.44)*.8,y:s.y};const before=JSON.stringify(await puzzle());
 await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();await page.mouse.move(near.x,near.y,{steps:7});
 assert(await handle.evaluate(el=>el.isConnected),'same stone DOM');assert(await page.locator('.socket.is-target').count()===1,'magnet only destination');
 assert(JSON.stringify(await puzzle())===before,'no hover save');
 const pulled=await e.evaluate(el=>parseFloat(el.style.left));assert(pulled<near.x-g.x&&pulled>(s.x-g.x),'continuous pull');
 await page.mouse.up();assert((await puzzle()).slots[0]==='l-moss','snap drop');assert(await page.locator('#stop').isDisabled(),'no drop playback');
 await drag('l-moss',await point(.71,.61));assert(!(await puzzle()).slots.includes('l-moss'),'pull out of well');
 await drag('l-moss',await point(-.5,.61));p=await puzzle();assert(!p.slots.includes('l-moss')&&p.world['l-moss'].x<.2,'outside keeps safe free position');
 const safe=await e.boundingBox(),b=await board();assert(safe.x>=b.x-1&&safe.x+safe.width<=b.x+b.w+1,'safe left boundary');
 const cancelBefore=JSON.stringify(await puzzle());await begin('l-moss',await point(.55,.65));await page.keyboard.press('Escape');await page.mouse.up();assert(JSON.stringify(await puzzle())===cancelBefore,'Esc restores position');
 await begin('l-moss',await point(.58,.62));await e.dispatchEvent('pointercancel');await page.mouse.up();assert(JSON.stringify(await puzzle())===cancelBefore,'pointercancel restores');
 await put('l-moss',0);await put('l-rain',1);await drag('l-moss',await socket(1));assert(JSON.stringify((await puzzle()).slots.slice(0,2))===JSON.stringify(['l-rain','l-moss']),'well swap');
 await drag('l-fern',await point(.50,.66));const displaced=JSON.stringify((await puzzle()).world['l-fern']);await drag('l-fern',await socket(0));assert((await puzzle()).slots[0]==='l-fern','free to occupied');assert(JSON.stringify((await puzzle()).world['l-rain'])===displaced,'occupant moves to source free point');
 assert(await page.locator('.gem').count()===4,'all stones preserved');
 await page.locator('[data-gem="l-fern"]').focus();await page.keyboard.press('ArrowDown');assert(!(await puzzle()).slots.includes('l-fern'),'keyboard free detach');
 const keyBefore=(await puzzle()).world['l-fern'].y;await page.keyboard.press('ArrowDown');assert((await puzzle()).world['l-fern'].y>keyBefore,'keyboard free move');
 await page.keyboard.press('2');assert((await puzzle()).slots[1]==='l-fern','digit snap');await page.keyboard.press('Shift+ArrowLeft');assert((await puzzle()).slots[0]==='l-fern','keyboard slot swap');await page.keyboard.press('Delete');assert(!(await puzzle()).slots.includes('l-fern'),'Delete detach');
 await select('l-fern');const tap=await point(.84,.50);await page.mouse.click(tap.x,tap.y);assert(Math.abs((await puzzle()).world['l-fern'].x-.84)<.015,'tap ground free placement');
 // Resize cannot strand a stone off-screen or let a captured pointer overwrite state.
 const resizeBefore=JSON.stringify(await puzzle());await begin('l-fern',await point(.95,.65));await page.setViewportSize({width:320,height:568});await page.mouse.up();assert(JSON.stringify(await puzzle())===resizeBefore,'resize cancels drag');
 for(const viewport of [{width:320,height:568},{width:390,height:664},{width:850,height:900}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>scrollTo(0,0));
  const fits=await page.evaluate(()=>{const b=document.getElementById('gem-stage').getBoundingClientRect();return [...document.querySelectorAll('.gem')].every(el=>{const r=el.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom;});});
  assert(fits,'resize clamps stones');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'resize no overflow');
 }
 const solutions=[['s-kite','s-pebble'],['w-sand','w-cloud','w-reed'],['l-moss','l-rain','l-fern','l-shell']];
 for(let i=0;i<3;i++){
  await nav(i);for(let n=0;n<solutions[i].length;n++)await put(solutions[i][n],n);
  await page.locator('#play-order').click();assert(!await page.locator('#listening-room').evaluate(el=>el.open),'judgement gates reward');await page.locator('#stop').click();
  await page.locator('#check').click();await page.waitForFunction(()=>document.getElementById('listening-room').open);assert(await page.locator('.room-gem').count()===solutions[i].length,'whole song room');await page.locator('#room-stop').click();assert(await page.locator('#stop').isDisabled(),'room stopped');
 }
 for(const viewport of [{width:390,height:844},{width:390,height:664},{width:320,height:568}]){
  await page.setViewportSize(viewport);
  for(let i=0;i<3;i++){
   await nav(i);await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#stop').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'core in one viewport');
   await select(solutions[i][0]);await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#stop').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'core after tap');await page.locator('#stop').click();
  }
 }
 await page.locator('#reference').click();await page.waitForFunction(()=>!document.getElementById('stop').disabled);assert(await page.locator('.gem.is-playing').count()===0,'reference hides order');await page.locator('#stop').click();
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarged no overflow');await page.locator('#stop').scrollIntoViewIfNeeded();assert(await page.locator('#stop').isVisible(),'enlarged reachable');await page.evaluate(()=>document.documentElement.style.fontSize='');
 assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length===0),'reduced motion');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/free-320.png'});assert(errors.length===0,`page errors ${errors}`);
 return {checks,errors,version:(await saved()).version};
}
