import {writeFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.DEMO5_PLAYWRIGHT_MODULE ?? 'playwright-core');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4187/demo5/');
 const result=await page.evaluate(async()=>{
  const {LEVELS,timeline}=await import('./src/music.js?v=0.3.0-local');
  const {SoundPlayer}=await import('./src/audio.js?v=0.3.0-local');
  const score=timeline(LEVELS[0],LEVELS[0].fragments.map(f=>f.id),true),rate=44100;
  const ctx=new OfflineAudioContext(1,Math.ceil((score.duration+score.tailDuration+.30)*rate),rate);
  const player=new SoundPlayer();player.context=ctx;player.master=ctx.createGain();player.master.gain.value=1;player.master.connect(ctx.destination);
  for(const event of score.events)player.tone(event,.04);
  const pcm=(await ctx.startRendering()).getChannelData(0);
  let peak=0,sum=0;for(const v of pcm){if(!Number.isFinite(v))throw new Error('Nonfinite PCM');peak=Math.max(peak,Math.abs(v));sum+=v*v;}
  if(peak>.8)throw new Error('Too loud');
  const bytes=new Uint8Array(44+pcm.length*2),v=new DataView(bytes.buffer);
  const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
  text(0,'RIFF');v.setUint32(4,bytes.length-8,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,pcm.length*2,true);
  for(let i=0;i<pcm.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),true);
  let binary='';for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));
  return {data:btoa(binary),metadata:{song:LEVELS[0].title,meter:'3/4',bpm:96,bars:8,seconds:pcm.length/rate,sampleRate:rate,channels:1,peak,rms:Math.sqrt(sum/pcm.length),noteEvents:score.events.length}};
 });
 await mkdir('review',{recursive:true});await writeFile('review/sprout-musicbox.wav',Buffer.from(result.data,'base64'));
 await writeFile('review/sprout-musicbox.json',JSON.stringify(result.metadata,null,2)+'\n');console.log(JSON.stringify(result.metadata,null,2));
}finally{await browser.close();}
