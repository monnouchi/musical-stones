// Chromium touch emulation, separate isolated context. Not an iOS Safari test.
async page => {
  const context = await page.context().browser().newContext({ viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1 });
  const mobile = await context.newPage();const checks=[];const errors=[];
  const assert = (ok,label) => {if(!ok)throw new Error(label);checks.push(label);};
  mobile.on('pageerror',error=>errors.push(error.message));
  try {
    await mobile.goto('http://127.0.0.1:4187/demo5/');await mobile.waitForSelector('#pieces button');
    assert(await mobile.evaluate(()=>navigator.maxTouchPoints>0),'Touch-enabled Chrome context');
    await mobile.getByRole('button',{name:'音 A を選ぶ',exact:true}).tap();
    await mobile.locator('[data-slot="0"]').tap();
    assert((await mobile.locator('[data-slot="0"]').textContent()).includes('音 A'),'Tap selects and places a piece');
    await mobile.getByRole('button',{name:'音 B を選ぶ',exact:true}).tap();await mobile.locator('[data-slot="1"]').tap();
    await mobile.locator('[data-slot="0"]').tap();await mobile.locator('[data-slot="1"]').tap();
    assert((await mobile.locator('[data-slot="1"]').textContent()).includes('音 A'),'Tap swaps occupied pieces');
    await mobile.getByRole('button',{name:/置き場所 2 から/}).tap();
    assert(await mobile.locator('#check').isDisabled(),'Tap remove returns to incomplete state');
    await mobile.getByRole('button',{name:/^3曲目/}).tap();await mobile.locator('#shuffle').tap();
    assert((await mobile.locator('#placed-count').textContent()).includes('4 / 4'),'Four-piece layout works with touch');
    await mobile.locator('#check').tap();assert((await mobile.locator('#feedback').textContent()).includes('もう少し'),'Wrong order gives feedback on mobile');
    assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Touch viewport has no horizontal overflow');
    const targets=await mobile.locator('#pieces button,#slots button,#levels button,.transport button,#reference,#mute').evaluateAll(elements=>elements.map(el=>({label:el.getAttribute('aria-label')||el.textContent,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
    assert(targets.every(t=>t.width>=44 && t.height>=44),'Every primary touch target is at least 44×44 CSS pixels');
    await mobile.screenshot({path:'output/playwright/mobile-touch-level3.png',fullPage:true});
    assert(errors.length===0,'No JavaScript errors in touch flow');
    return {passed:checks.length,checks,errors};
  } finally {await context.close();}
}
