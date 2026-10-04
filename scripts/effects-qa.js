async(page)=>{
 let checks=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
 await page.goto('http://127.0.0.1:4187/musical-stones/');await page.setViewportSize({width:390,height:664});await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#levels button').nth(2).click();
 const ids=['l-moss','l-rain','l-fern','l-shell'];
 const put=async(id,index)=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press(String(index+1));};
 const board=()=>page.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.left+b.clientLeft,y:r.top+b.clientTop,w:b.clientWidth,h:b.clientHeight};});
 const info=()=>page.evaluate(()=>({items:document.querySelector('#magic-layer').children.length,sparks:document.querySelectorAll('.magic-spark').length,glow:document.querySelectorAll('.gem.has-magic').length,rings:document.querySelectorAll('.magic-ripple').length,flow:document.querySelectorAll('.magic-flow-path').length}));
 const frames=[];const capture=async(name)=>{const time=await page.evaluate(()=>performance.now());await page.screenshot({path:`output/playwright/magic-${name}.png`});frames.push({name,time,...await info()});};
 for(let i=0;i<4;i++)await put(ids[i],i);await page.waitForTimeout(720);
 const curves=await page.locator('#connections').innerHTML();await put(ids[0],1);assert(await page.locator('#connections').innerHTML()===curves,'no answer signal');await put(ids[0],0);await page.waitForTimeout(720);
 const gem=page.locator('[data-gem="l-moss"]');let box=await gem.boundingBox();const g=await board();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 let state=await info();assert(state.glow===1&&state.sparks===3&&state.rings===0,'immediate touch');assert(await gem.evaluate(el=>el.classList.contains('has-magic')),'gem lit');
 await capture('touch-0');await page.waitForTimeout(80);await capture('touch-80');
 await page.mouse.move(g.x+g.w*.55,g.y+g.h*.65,{steps:8});await page.mouse.up();
 state=await info();assert(state.sparks===3&&state.rings===0&&state.glow===1,'free landing');await capture('free-drop');await page.waitForTimeout(720);
 assert((await info()).items===0&&(await info()).glow===0,'free effects expire');
 box=await gem.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(g.x+g.w*.125,g.y+g.h*.29,{steps:8});await page.mouse.up();
 state=await info();assert(state.rings===1&&state.flow===3&&state.glow===1,'snap ripple and links');await capture('snap-0');await page.waitForTimeout(120);await capture('snap-120');await page.waitForTimeout(180);await capture('snap-300');await page.waitForTimeout(720);
 assert((await info()).items===0&&(await info()).glow===0,'all expire');await capture('settled');
 // Flood actual pointer taps: particles remain bounded; no stranded animations.
 let maximum=0;
 box=await gem.boundingBox();
 for(let i=0;i<20;i++){await page.mouse.click(box.x+box.width/2,box.y+box.height/2);maximum=Math.max(maximum,(await info()).items);}
 const cadence=await page.evaluate(()=>new Promise(resolve=>{const gaps=[];let last=performance.now(),start=last;function frame(now){gaps.push(now-last);last=now;if(now-start>=450)resolve({frames:gaps.length,medianMs:gaps.sort((a,b)=>a-b)[Math.floor(gaps.length/2)],maxMs:Math.max(...gaps)});else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
 assert(maximum<=18,'bounded effects');await page.locator('#stop').click();assert((await info()).items===0&&(await info()).glow===0,'stop cleanup');
 await page.locator('.help summary').click();await put(ids[0],2);await page.locator('#shuffle').click();assert((await info()).items===0,'shuffle cleanup');
 await put(ids[0],1);await page.locator('#clear').click();assert((await info()).items===0,'clear cleanup');await page.locator('.help summary').click();
 await put(ids[0],0);await page.setViewportSize({width:390,height:700});await page.waitForTimeout(60);assert((await info()).items===0,'resize cleanup');
 await put(ids[0],1);await page.locator('#reference').click();assert((await info()).items===0,'play cleanup');await page.locator('#stop').click();
 await put(ids[0],2);await page.locator('#levels button').nth(1).click();assert((await info()).items===0&&(await info()).glow===0,'level cleanup');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-gem="w-sand"]').focus();await page.keyboard.press('1');
 state=await info();assert(state.items===0&&state.glow===1,'reduced static glow');assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length===0),'no motion');
 await page.waitForTimeout(220);assert((await info()).glow===0,'reduced expires');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-gem="w-sand"]').focus();await page.keyboard.press('2');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});assert((await info()).items===0&&(await info()).glow===0,'background cleanup');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 assert(errors.length===0,`errors ${errors}`);return {checks,maximum,cadence,frames,errors};
}
