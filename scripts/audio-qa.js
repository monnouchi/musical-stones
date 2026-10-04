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
    p.tone({midi:72,at:0,length:.5,voice:'melody',timbre:'musicbox',velocity:1},0);
    const s=(await ctx.startRendering()).getChannelData(0),freq=440*2**(3/12);
    const amplitude=f=>{let re=0,im=0;for(let i=7200;i<19200;i++){const phase=2*Math.PI*f*i/48000;re+=s[i]*Math.cos(phase);im+=s[i]*Math.sin(phase);}return Math.hypot(re,im);};
    const fundamental=amplitude(freq),partials=[2,3,4].map(h=>+(amplitude(freq*h)/fundamental).toFixed(3));
    const bands=[];
    for(const midi of [66,84]){
      const render=async(filtered)=>{
        const c=new OfflineAudioContext(1,96000,48000),player=new SoundPlayer();player.context=c;player.master=c.createGain();
        if(filtered){const hi=c.createBiquadFilter(),lo=c.createBiquadFilter();hi.type='highpass';hi.frequency.value=250;hi.Q.value=-3.0103;lo.type='lowpass';lo.frequency.value=6000;lo.Q.value=-3.0103;player.master.connect(hi);hi.connect(lo);lo.connect(c.destination);}else player.master.connect(c.destination);
        player.tone({midi,at:0,length:.9,voice:'melody',timbre:'musicbox',velocity:1},.015);
        const data=(await c.startRendering()).getChannelData(0);return Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);
      };
      const raw=await render(false),band=await render(true);bands.push({midi,frequency:+(440*2**((midi-69)/12)).toFixed(1),rmsRatio:+(band/raw).toFixed(3)});
    }
    return {scores,musicboxHarmonicRatios:partials,bands,voiceLevels:Object.fromEntries(Object.entries(VOICES).map(([name,v])=>[name,v.peak]))};
  });
  for(const score of results.scores)if(score.invalid || score.peak>.8 || score.rms<.005)throw new Error(`invalid audio ${JSON.stringify(score)}`);
  if(results.musicboxHarmonicRatios[0]<.03)throw new Error('missing musicbox upper harmonic');
  if(results.bands.some(b=>b.rmsRatio<.65||b.rmsRatio>1.05))throw new Error('band result '+JSON.stringify(results.bands));
  // Actual AudioContext nodes disconnect shortly after stop, including future notes.
  const lifecycles=[];
  for(const index of [0,1,2]){
    const lifecycle=await page.evaluate(async(index)=>{
      const {LEVELS}=await import('./src/music.js');const {SoundPlayer}=await import('./src/audio.js');
      const p=new SoundPlayer(),ok=await p.play(LEVELS[index],LEVELS[index].fragments.map(f=>f.id),{rich:true});
      let ended=0;const count=p.nodes.size;
      for(const node of p.nodes){const original=node.oscillator.onended;node.oscillator.onended=()=>{ended++;original();};}
      p.stop();await new Promise(resolve=>setTimeout(resolve,150));
      const result={song:LEVELS[index].id,ok,count,ended,nodes:p.nodes.size,playing:p.playing};await p.context.close();return result;
    },index);
    if(!lifecycle.ok||lifecycle.count!==lifecycle.ended||lifecycle.nodes||lifecycle.playing)throw new Error(`stop leak ${JSON.stringify(lifecycle)}`);
    lifecycles.push(lifecycle);
  }
  return {...results,lifecycles};
}
