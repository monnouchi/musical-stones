async (page) => {
  const context=await page.context().browser().newContext({viewport:{width:390,height:664},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const phone=await context.newPage();let checks=0;const errors=[];
  phone.on('pageerror',error=>errors.push(error.message));
  const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
  try {
    await phone.goto('http://127.0.0.1:4187/demo5/');
    await phone.locator('#levels button').nth(2).tap();
    const cdp=await context.newCDPSession(phone);
    const slots=()=>phone.evaluate(()=>JSON.parse(localStorage.getItem('demo5.sound-stitch.v1')).puzzles.lantern.slots);
    const gemCenter=async id=>{const b=await phone.locator(`[data-gem="${id}"]`).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2};};
    const socket=async i=>phone.evaluate(i=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.x+(i+.5)*b.clientWidth/4,y:r.y+b.clientHeight*.29};},i);
    const move=async(id,to,cancel=false)=>{
      const from=await gemCenter(id);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
      for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
    };
    await phone.locator('[data-gem="l-moss"]').tap();await phone.waitForFunction(()=>!document.getElementById('stop').disabled);
    assert(await phone.locator('.gem.is-playing').count()===1,'tap one preview');assert((await slots()).every(v=>!v),'tap does not place');
    await phone.locator('#stop').tap();
    await move('l-moss',await socket(0));assert((await slots())[0]==='l-moss','touch drag placement');assert(await phone.locator('#stop').isDisabled(),'drop no stray click/play');
    await move('l-rain',await socket(1));await move('l-moss',await socket(1));assert((await slots())[0]==='l-rain'&&(await slots())[1]==='l-moss','touch swap');
    const before=JSON.stringify(await slots());
    await move('l-moss',{x:3,y:5});assert(JSON.stringify(await slots())===before,'outside touch cancel');
    await move('l-moss',await socket(3),true);assert(JSON.stringify(await slots())===before,'touchCancel retains');
    assert(await phone.locator('.gem').count()===4,'four stone conservation');
    assert(await phone.evaluate(()=>scrollY===0&&document.documentElement.scrollWidth<=innerWidth),'no drag scroll/overflow');
    const shelf=await phone.evaluate(()=>{const b=document.getElementById('gem-stage'),r=b.getBoundingClientRect();return{x:r.x+30,y:r.y+b.clientHeight*.85};});
    await move('l-moss',shelf);assert(!(await slots()).includes('l-moss'),'touch return shelf');
    // Tap fallback places without dragging and moving never reveals correctness.
    await phone.locator('[data-gem="l-fern"]').tap();await phone.locator('#place-active').tap();assert((await slots()).includes('l-fern'),'tap fallback');
    assert(await phone.locator('#stop').isDisabled(),'fallback stops preview');
    await phone.locator('#move-right').tap();assert((await slots()).includes('l-fern'),'tap exchange');
    await phone.locator('#return-active').tap();assert(!(await slots()).includes('l-fern'),'tap removal');
    await phone.locator('[data-gem="l-shell"]').tap();await phone.locator('#reference').tap();
    await phone.waitForTimeout(100);assert(await phone.locator('.gem.is-playing').count()===0,'touch reference no answer glow');
    await phone.locator('#stop').tap();assert(errors.length===0,`errors ${errors}`);
    return {checks,errors,viewport:'390x664',touch:'Chrome CDP native touchStart/move/end/cancel'};
  } finally {await context.close();}
}
