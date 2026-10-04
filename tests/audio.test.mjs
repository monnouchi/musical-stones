import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundPlayer } from '../src/audio.js';
import { LEVELS } from '../src/music.js';
import { solution } from '../src/game.js';

function fixture() {
  const param = () => ({value:0, calls:[], setValueAtTime(...args){this.calls.push(['set',...args]);},linearRampToValueAtTime(...args){this.calls.push(['linear',...args]);},exponentialRampToValueAtTime(...args){this.calls.push(['exp',...args]);},cancelScheduledValues(...args){this.calls.push(['cancel',...args]);},setTargetAtTime(...args){this.calls.push(['target',...args]);}});
  const ctx = { state:'suspended', currentTime:0, destination:{}, oscillators:[], gains:[], resumeCount:0, suspendCount:0,
    async resume(){this.state='running';this.resumeCount++;},async suspend(){this.state='suspended';this.suspendCount++;},
    createGain(){const gain = {gain:param(),connect(){},disconnect(){this.disconnected=true;}};this.gains.push(gain);return gain;},
    createOscillator(){const osc = {frequency:param(),starts:[],stops:[],connect(){},disconnect(){this.disconnected=true;},start(at){this.starts.push(at);},stop(at){this.stops.push(at);}};this.oscillators.push(osc);return osc;},
  };
  const clock = {active:new Map(),next:1,setInterval(fn){const id=this.next++;this.active.set(id,fn);return id;},clearInterval(id){this.active.delete(id);}};
  const updates = []; let creations = 0;
  const player = new SoundPlayer({contextFactory:()=>{creations++;return ctx;},timers:clock,onUpdate:x=>updates.push(x)});
  return {player,ctx,clock,updates,creations:()=>creations};
}
test('no audio context/autoplay at startup; explicit play resumes and schedules a score', async () => {
  const f=fixture(); assert.equal(f.creations(),0); assert.equal(f.player.playing,false);
  await f.player.play(LEVELS[0],solution(LEVELS[0]));
  assert.equal(f.creations(),1); assert.equal(f.ctx.resumeCount,1); assert.ok(f.ctx.oscillators.length>0); assert.equal(f.clock.active.size,1);
  assert.ok(f.updates.at(-1).playing); f.player.stop();
});
test('stop cancels every future note, progress timer and pending asynchronous resume', async () => {
  const f=fixture(); let resolve;
  f.ctx.resume=()=>new Promise(r=>{resolve=()=>{f.ctx.state='running';r();};});
  const pending=f.player.play(LEVELS[0],solution(LEVELS[0])); f.player.stop();resolve();
  assert.equal(await pending,false); assert.equal(f.ctx.oscillators.length,0);
  await f.player.play(LEVELS[0],solution(LEVELS[0])); f.player.stop();
  assert.equal(f.player.nodes.size,0); assert.equal(f.clock.active.size,0); assert.equal(f.player.playing,false);
  for(const osc of f.ctx.oscillators){assert.equal(osc.stops.at(-1),.022);osc.onended();assert.equal(osc.disconnected,true);}
  for(const gain of f.ctx.gains.slice(1)) assert.ok(gain.gain.calls.some(call=>call[0]==='linear' && call[1]===0 && call[2]===.018));
});
test('new preview stops previous score instead of layering', async () => {
  const f=fixture(); await f.player.play(LEVELS[2],solution(LEVELS[2]),{rich:true}); const previous=[...f.ctx.oscillators];
  await f.player.play(LEVELS[2],[solution(LEVELS[2])[0]]);
  assert.equal(f.clock.active.size,1); assert.ok(previous.every(o=>o.stops.at(-1)===.022));
  previous.forEach(o=>o.onended());assert.ok(previous.every(o=>o.disconnected));assert.equal(f.ctx.resumeCount,1);f.player.stop();
});
test('reference plays without exposing answer order through fragment highlights', async () => {
  const f=fixture(); await f.player.play(LEVELS[2],solution(LEVELS[2]),{revealFragments:false});
  assert.equal(f.updates.at(-1).id,null); f.ctx.currentTime=6;[...f.clock.active.values()][0]();
  assert.equal(f.updates.at(-1).id,null);assert.ok(f.updates.at(-1).playing);f.player.stop();
});
test('volume and mute affect master gain without losing saved loudness', async () => {
  const f=fixture(); f.player.setVolume(.3,true);await f.player.play(LEVELS[0],solution(LEVELS[0]));
  assert.equal(f.ctx.gains[0].gain.value,0);f.player.setVolume(.3,false);
  assert.equal(f.ctx.gains[0].gain.calls.at(-1)[1],.3);f.player.setVolume(0);assert.equal(f.ctx.gains[0].gain.calls.at(-1)[1],0);f.player.stop();
});
test('background stops and suspends; returning does not automatically resume; interrupted playback stops', async () => {
  const f=fixture(); await f.player.play(LEVELS[0],solution(LEVELS[0]));f.player.background();
  assert.equal(f.player.playing,false);assert.equal(f.ctx.suspendCount,1);assert.equal(f.clock.active.size,0);assert.equal(f.ctx.resumeCount,1);
  await f.player.play(LEVELS[0],solution(LEVELS[0]));assert.equal(f.ctx.resumeCount,2);
  f.ctx.state='interrupted';f.ctx.onstatechange();assert.equal(f.player.playing,false);assert.equal(f.clock.active.size,0);
});
test('natural completion clears progress and timers; unsupported/rejected audio is recoverable', async () => {
  const f=fixture();await f.player.play(LEVELS[0],solution(LEVELS[0]));f.ctx.currentTime=99;[...f.clock.active.values()][0]();
  assert.equal(f.player.playing,false);assert.equal(f.clock.active.size,0);
  const errors=[];const broken=new SoundPlayer({contextFactory:()=>{throw new Error('unsupported');},onUpdate:x=>errors.push(x)});
  assert.equal(await broken.play(LEVELS[0],solution(LEVELS[0])),false);assert.equal(errors.at(-1).label,'unsupported');
  const g=fixture();g.ctx.resume=async()=>{throw new Error('blocked');};assert.equal(await g.player.play(LEVELS[0],solution(LEVELS[0])),false);assert.equal(g.player.nodes.size,0);
});
test('completed playback includes its tonic tail and leaves immersive mode on stop', async () => {
  const f=fixture();await f.player.play(LEVELS[0],solution(LEVELS[0]),{rich:true,immersive:true});
  assert.equal(f.updates.at(-1).immersive,true);
  assert.ok(f.updates.at(-1).duration > LEVELS[0].beats * 2 * 60 / LEVELS[0].bpm);
  f.player.stop();assert.equal(f.updates.at(-1).playing,false);
});
