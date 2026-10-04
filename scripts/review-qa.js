async(page)=>{
 let checks=0;const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
 await page.goto('http://127.0.0.1:4187/musical-stones/');await page.setViewportSize({width:390,height:664});await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#levels button').nth(2).click();
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')).puzzles.lantern);
 const put=async(id,n)=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press(String(n+1));};
 const ids=['l-moss','l-rain','l-fern','l-shell'];for(let i=0;i<4;i++)await put(ids[i],i);
 const correct=await page.locator('#connections').innerHTML();await put('l-moss',1);assert(await page.locator('#connections').innerHTML()===correct,'order not leaked');
 await page.locator('[data-gem="l-moss"]').focus();await page.keyboard.press('Delete');await page.waitForTimeout(250);
 const e=page.locator('[data-gem="l-moss"]'),box=await e.boundingBox();
 const g=await page.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.left+b.clientLeft,y:r.top+b.clientTop,w:b.clientWidth,h:b.clientHeight};});
 const grab={x:-12,y:-20},free={x:g.x+g.w*.56,y:g.y+g.h*.64},near={x:g.x+g.w*.125+Math.min(38,g.w/4*.44)*.8,y:g.y+g.h*.29};
 await page.mouse.move(box.x+box.width/2+grab.x,box.y+box.height/2+grab.y);await page.mouse.down();await page.mouse.move(free.x+grab.x,free.y+grab.y,{steps:8});
 const center=await e.boundingBox();assert(Math.abs(center.x+center.width/2-free.x)<2&&Math.abs(center.y+center.height/2-free.y)<2,'grab offset maintained');
 await page.mouse.move(near.x+grab.x,near.y+grab.y,{steps:8});await page.waitForTimeout(50);
 assert(await page.locator('.socket.is-target').count()===1,'near highlight');await page.mouse.up();
 assert((await saved()).slots[0]==='l-moss','snap');assert(await e.evaluate(el=>el.getAnimations().some(a=>a.playState==='running')),'animated seating');
 await page.waitForTimeout(500);await page.emulateMedia({reducedMotion:'reduce'});
 const next=await e.boundingBox();await page.mouse.move(next.x+next.width/2,next.y+next.height/2);await page.mouse.down();await page.mouse.move(g.x+g.w*.52,g.y+g.h*.63,{steps:7});
 const before=JSON.stringify(await saved());await page.keyboard.press('3');const key=JSON.stringify(await saved());assert(key!==before&&(await saved()).slots[2]==='l-moss','key cancels free drag');await page.mouse.up();assert(JSON.stringify(await saved())===key,'pointerup cannot overwrite key');
 assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length===0),'reduced movement');
 for(let i=0;i<4;i++)await put(ids[i],i);await page.locator('#check').click();await page.waitForFunction(()=>document.getElementById('listening-room').open);
 assert(await page.locator('.room-gem').count()===4,'all room gems');await page.locator('#room-stop').click();assert(await page.locator('#stop').isDisabled(),'room exit stopped');
 await page.screenshot({path:'output/playwright/free-390.png'});return{checks};
}
