async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4187/demo5/review/first-song.html');
 await page.waitForFunction(()=>Number.isFinite(document.querySelector('audio').duration));
 const before=await page.locator('audio').evaluate(a=>({duration:a.duration,paused:a.paused}));
 await page.locator('#sample-play').click();await page.waitForFunction(()=>document.querySelector('audio').currentTime>.08&&!document.querySelector('audio').paused);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=await page.locator('audio').evaluate(a=>a.paused);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 const visible=await page.locator('audio').evaluate(a=>a.paused);
 await page.locator('audio').evaluate(a=>{a.currentTime=8;});await page.waitForFunction(()=>Math.abs(document.querySelector('audio').currentTime-8)<.1);
 const range=await page.evaluate(async()=>{const r=await fetch('./sprout-musicbox.wav',{headers:{Range:'bytes=0-43'}}),b=new Uint8Array(await r.arrayBuffer());return{status:r.status,bytes:b.length,range:r.headers.get('content-range')};});
 const file=await page.evaluate(async()=>{const r=await fetch('./sprout-musicbox.wav'),b=new Uint8Array(await r.arrayBuffer());return{status:r.status,type:r.headers.get('content-type'),riff:String.fromCharCode(...b.slice(0,4)),bytes:b.length};});
 await page.screenshot({path:'output/playwright/first-song-player.png'});
 await page.setViewportSize({width:320,height:568});const narrow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 if(!before.paused||Math.abs(before.duration-16.95)>.01||!hidden||!visible||file.status!==200||file.type!=='audio/wav'||file.riff!=='RIFF'||range.status!==206||range.bytes!==44||!narrow||errors.length)throw new Error(JSON.stringify({before,hidden,visible,file,range,narrow,errors}));
 return{before,hidden,visible,file,range,narrow,errors};
}
