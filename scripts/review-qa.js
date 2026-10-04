async(page)=>{
  let checks=0;const assert=(ok,msg)=>{if(!ok)throw new Error(msg);checks++;};
  await page.goto('http://127.0.0.1:4187/demo5/');await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:568});
  await page.locator('#levels button').nth(2).click();await page.evaluate(()=>scrollTo(0,0));
  const slots=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')).puzzles.lantern.slots);
  const put=async(id,n)=>{await page.locator(`[data-gem="${id}"]`).focus();await page.keyboard.press(String(n+1));};
  const ids=['l-moss','l-rain','l-fern','l-shell'];for(let i=0;i<4;i++)await put(ids[i],i);
  const correct=await page.locator('#connections').innerHTML();await put('l-moss',1);assert(await page.locator('#connections').innerHTML()===correct,'curve leaks correctness');
  const el=page.locator('[data-gem="l-moss"]'),handle=await el.elementHandle();
  await el.evaluate(el=>el.addEventListener('pointerdown',e=>el.dataset.qaPointer=String(e.pointerId),{once:true}));
  const box=await el.boundingBox(),before=JSON.stringify(await slots());
  const socket=await page.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.left+b.clientWidth*.875,y:r.top+b.clientHeight*.29};});
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(socket.x,socket.y,{steps:7});
  assert(await handle.evaluate(el=>el.isConnected&&el.hasPointerCapture(Number(el.dataset.qaPointer))),'drag detached/capture lost');
  assert(await page.locator('.socket.is-target').count()===1,'magnet destination');
  assert(JSON.stringify(await slots())===before,'hover saved preview');
  // A keyboard placement cancels the drag; the later pointer release cannot overwrite it.
  await page.keyboard.press('3');const keyboardState=JSON.stringify(await slots());assert((await slots())[2]==='l-moss','keyboard while dragging');
  await page.mouse.up();assert(JSON.stringify(await slots())===keyboardState,'old drag overwrote key edit');
  assert(await page.locator('#drag-ghost').isHidden(),'ghost removed');
  for(let i=0;i<4;i++)await put(ids[i],i);
  assert(await page.locator('.just-snapped').count()===0,'reduced motion JS glow');
  await page.locator('#play-order').click();assert(!await page.locator('#listening-room').evaluate(el=>el.open),'rich before judge');await page.locator('#stop').click();
  await page.locator('#check').click();await page.waitForFunction(()=>document.getElementById('listening-room').open);
  assert(await page.locator('.room-gem').count()===4,'all gems in room');
  assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length===0),'reduced room animation');
  assert(await page.locator('#room-stop').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'small room stop visible');
  await page.locator('#room-mute').click();assert((await page.locator('#room-state').textContent()).includes('消音中'),'muted room state');await page.locator('#room-mute').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert(!await page.locator('#listening-room').evaluate(el=>el.open),'background room close');
  assert(await page.locator('#stop').isDisabled(),'background silent');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert(await page.locator('#stop').isDisabled(),'return autoplay');
  const geometry=await page.evaluate(()=>({font:parseFloat(getComputedStyle(document.getElementById('check')).fontSize),statusFont:parseFloat(getComputedStyle(document.getElementById('gesture-status')).fontSize),coreBottom:document.getElementById('stop').getBoundingClientRect().bottom}));
  assert(geometry.font>=14&&geometry.statusFont>=13&&geometry.coreBottom<=568,'ordinary font core');
  await page.screenshot({path:'output/playwright/review-320.png'});
  return {checks,geometry,order:await slots()};
}
