async(page)=>{
 let checks=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const assert=(v,msg)=>{if(!v)throw new Error(msg);checks++;};
 await page.goto('http://127.0.0.1:4187/demo5/review/');
 await page.waitForFunction(()=>document.querySelectorAll('audio').length===3&&[...document.querySelectorAll('audio')].every(a=>Number.isFinite(a.duration)));
 const initial=await page.locator('audio').evaluateAll(as=>as.map(a=>({duration:a.duration,paused:a.paused,volume:a.volume})));
 assert(initial.every(a=>a.paused&&a.volume===.65),'initial silence');
 const expected=[16.95,15.2833560091,18.3136507937];assert(initial.every((a,i)=>Math.abs(a.duration-expected[i])<.02),'all metadata duration');
 const names=await page.locator('.sample h2').allTextContents();assert(names.join('|')==='1 芽吹く光|2 水晶のこだま|3 月影の祈り','names');
 for(let i=0;i<3;i++){
  await page.locator('.sample-play').nth(i).click();await page.waitForFunction(i=>{const a=document.querySelectorAll('audio')[i];return !a.paused&&a.currentTime>.08;},i);
  assert(await page.locator('audio').evaluateAll((as,i)=>as.filter(a=>!a.paused).length===1&&!as[i].paused,i),'exclusive playback');
 }
 await page.locator('#sample-mute').click();assert(await page.locator('audio').evaluateAll(as=>as.every(a=>a.muted)),'all muted');
 await page.locator('#sample-volume').fill('28');await page.locator('#sample-volume').dispatchEvent('input');assert(await page.locator('audio').evaluateAll(as=>as.every(a=>Math.abs(a.volume-.28)<.001)),'volume');
 await page.locator('#sample-mute').click();assert(await page.locator('audio').evaluateAll(as=>as.every(a=>!a.muted&&a.volume===.28)),'unmute retains volume');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 assert(await page.locator('audio').evaluateAll(as=>as.every(a=>a.paused)),'background pause');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 assert(await page.locator('audio').evaluateAll(as=>as.every(a=>a.paused)),'return no autoplay');
 for(let i=0;i<3;i++){
  await page.locator('audio').nth(i).evaluate(a=>a.currentTime=a.duration-.12);await page.locator('.sample-play').nth(i).focus();await page.keyboard.press('Enter');
  await page.waitForFunction(i=>document.querySelectorAll('audio')[i].ended,i);
  assert(await page.locator('.audio-status').nth(i).textContent()==='曲が終わりました。もう一度聴けます。','natural end');
 }
 await page.locator('.sample-play').nth(0).click();await page.locator('.sample-stop').nth(0).click();assert(await page.locator('audio').nth(0).evaluate(a=>a.paused&&a.currentTime===0),'single stop');
 await page.locator('.sample-play').nth(2).click();await page.locator('#stop-all').click();assert(await page.locator('audio').evaluateAll(as=>as.every(a=>a.paused&&a.currentTime===0)),'stop all');
 const files=await page.evaluate(async()=>Promise.all(['sprout','walk','lantern'].map(async id=>{const r=await fetch(`./${id}-musicbox.wav`),b=new Uint8Array(await r.arrayBuffer());return{id,status:r.status,type:r.headers.get('content-type'),riff:String.fromCharCode(...b.slice(0,4)),bytes:b.length};})));
 assert(files.every(f=>f.status===200&&f.type==='audio/wav'&&f.riff==='RIFF'),'all WAV files');
 await page.setViewportSize({width:320,height:568});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'narrow no overflow');
 await page.locator('footer a').scrollIntoViewIfNeeded();assert(await page.locator('footer a').isVisible(),'game link reachable');
 await page.screenshot({path:'output/playwright/set-samples-320.png'});
 assert(errors.length===0,`errors ${errors}`);return {checks,initial,names,files,errors};
}
