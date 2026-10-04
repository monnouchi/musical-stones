async (page) => {
  const results=await page.evaluate(async()=>{
    const {LEVELS,timeline}=await import('./src/music.js');
    const {SoundPlayer,VOICES}=await import('./src/audio.js');
    const scores=[];
    for(const level of LEVELS)for(const rich of [false,true]) {
      const score=timeline(level,level.fragments.map(f=>f.id),rich);
      const ctx=new OfflineAudioContext(1,Math.ceil((score.duration+score.tailDuration+.5)*48000),48000);
      const player=new SoundPlayer();player.context=ctx;player.master=ctx.createGain();player.master.gain.value=1;player.master.connect(ctx.destination);
      for(const event of score.events)player.tone(event,.045);
      const samples=(await ctx.startRendering()).getChannelData(0);
      let peak=0,sum=0,invalid=0,tail=0;
      for(let i=0;i<samples.length;i++) {const v=samples[i];if(!Number.isFinite(v))invalid++;peak=Math.max(peak,Math.abs(v));sum+=v*v;if(i/48000>score.duration+.2)tail+=v*v;}
      const lead=score.events.filter(e=>e.voice==='melody').map(e=>e.midi);
      scores.push({song:level.id,rich,seconds:+(score.duration+score.tailDuration).toFixed(3),events:score.events.length,leadRange:[Math.min(...lead),Math.max(...lead)],peak:+peak.toFixed(5),rms:+Math.sqrt(sum/samples.length).toFixed(5),tailEnergy:+tail.toFixed(4),invalid});
    }
    const ctx=new OfflineAudioContext(1,48000,48000),p=new SoundPlayer();p.context=ctx;p.master=ctx.createGain();p.master.connect(ctx.destination);
    p.tone({midi:72,at:0,length:.5,voice:'melody',velocity:1},0);
    const s=(await ctx.startRendering()).getChannelData(0),freq=440*2**(3/12);
    const amplitude=f=>{let re=0,im=0;for(let i=7200;i<19200;i++){const phase=2*Math.PI*f*i/48000;re+=s[i]*Math.cos(phase);im+=s[i]*Math.sin(phase);}return Math.hypot(re,im);};
    const fundamental=amplitude(freq),partials=[2,3,4].map(h=>+(amplitude(freq*h)/fundamental).toFixed(3));
    return {scores,leadHarmonicRatios:partials,voiceLevels:Object.fromEntries(Object.entries(VOICES).map(([name,v])=>[name,v.peak]))};
  });
  for(const score of results.scores)if(score.invalid || score.peak>.8 || score.rms<.005)throw new Error(`invalid audio ${JSON.stringify(score)}`);
  if(results.leadHarmonicRatios[0]<.2 || results.leadHarmonicRatios[1]<.08)throw new Error('missing upper harmonics');
  // Actual AudioContext nodes disconnect shortly after stop, including future notes.
  const lifecycle=await page.evaluate(async()=>{
    const {LEVELS}=await import('./src/music.js');const {SoundPlayer}=await import('./src/audio.js');
    const p=new SoundPlayer(),ok=await p.play(LEVELS[2],LEVELS[2].fragments.map(f=>f.id),{rich:true});
    let ended=0;const count=p.nodes.size;
    for(const node of p.nodes) {const original=node.oscillator.onended;node.oscillator.onended=()=>{ended++;original();};}
    p.stop();await new Promise(resolve=>setTimeout(resolve,150));
    const result={ok,count,ended,nodes:p.nodes.size,playing:p.playing};await p.context.close();return result;
  });
  if(!lifecycle.ok || lifecycle.count!==lifecycle.ended || lifecycle.nodes || lifecycle.playing)throw new Error(`stop leak ${JSON.stringify(lifecycle)}`);
  return {...results,lifecycle};
}
