async(page)=>{
 const context=await page.context().browser().newContext({viewport:{width:390,height:664},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 const phone=await context.newPage();let checks=0;const errors=[];phone.on('pageerror',e=>errors.push(e.message));
 const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
 try{
  await phone.goto('http://127.0.0.1:4187/demo5/');await phone.locator('#levels button').nth(2).tap();const cdp=await context.newCDPSession(phone);
  const saved=()=>phone.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')).puzzles.lantern);
  const board=()=>phone.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.left+b.clientLeft,y:r.top+b.clientTop,w:b.clientWidth,h:b.clientHeight};});
  const point=async(x,y)=>{const b=await board();return{x:b.x+x*b.w,y:b.y+y*b.h};};
  const move=async(id,to,cancel=false)=>{
   // Activate the stone before picking it up, so overlapping free stones remain accessible.
   await phone.locator(`[data-gem="${id}"]`).tap();
   const b=await phone.locator(`[data-gem="${id}"]`).boundingBox(),from={x:b.x+b.width/2,y:b.y+b.height/2};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
   for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  };
  await phone.locator('[data-gem="l-moss"]').tap();await phone.waitForFunction(()=>!document.getElementById('stop').disabled);assert(await phone.locator('.gem.is-playing').count()===1,'one touch preview');await phone.locator('#stop').tap();
  await move('l-moss',await point(.48,.60));assert(!(await saved()).slots.includes('l-moss'),'touch freely placed');assert(Math.abs((await saved()).world['l-moss'].x-.48)<.01,'touch point held');assert(await phone.locator('#stop').isDisabled(),'drop no replay');
  const free=JSON.stringify((await saved()).world['l-moss']);await phone.reload();assert((await saved()).slots.every(id=>id===null)&&JSON.stringify((await saved()).world['l-moss'])!==free,'touch reload starts fresh');
  await move('l-moss',await point(.125,.29));assert((await saved()).slots[0]==='l-moss','touch snap');
  await move('l-moss',await point(.70,.58));assert(!(await saved()).slots.includes('l-moss'),'touch detach');
  await move('l-moss',{x:2,y:(await point(.7,.60)).y});assert(!(await saved()).slots.includes('l-moss'),'off board becomes free');
  const b=await board(),gem=await phone.locator('[data-gem="l-moss"]').boundingBox();assert(gem.x>=b.x&&gem.x+gem.width<=b.x+b.w,'touch safe edge');
  const before=JSON.stringify(await saved());await move('l-moss',await point(.45,.58),true);assert(JSON.stringify(await saved())===before,'touchcancel restores');
  await move('l-moss',await point(.125,.29));await move('l-rain',await point(.375,.29));await move('l-moss',await point(.375,.29));assert(JSON.stringify((await saved()).slots.slice(0,2))===JSON.stringify(['l-rain','l-moss']),'touch swap');
  assert(await phone.locator('.gem').count()===4,'touch conserves stones');assert(await phone.evaluate(()=>scrollY===0&&document.documentElement.scrollWidth<=innerWidth),'drag prevents page scroll/overflow');
  await phone.locator('[data-gem="l-moss"]').tap();await phone.locator('#move-left').tap();assert((await saved()).slots[0]==='l-moss','tap only slot swap');await phone.locator('#return-active').tap();assert(!(await saved()).slots.includes('l-moss'),'tap only detach');
  await phone.locator('#place-active').tap();assert((await saved()).slots.includes('l-moss'),'tap nearest empty');
  await phone.locator('#reference').tap();await phone.waitForFunction(()=>!document.getElementById('stop').disabled);assert(await phone.locator('.gem.is-playing').count()===0,'touch reference hides order');await phone.locator('#stop').tap();
  assert(errors.length===0,`errors ${errors}`);return{checks,errors,touch:'native touchStart/move/end/cancel',viewport:'390x664'};
 }finally{await context.close();}
}
