import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS, timeline } from '../src/music.js';
import { solution } from '../src/game.js';

test('the approved first composition and both arrangements remain identical',()=>{
 const approved=JSON.parse(readFileSync(new URL('./fixtures/sprout-v0.3.json',import.meta.url)));
 const {bpm,beats,meter,instrument,tail,fragments}=LEVELS[0];
 assert.deepEqual({bpm,beats,meter,instrument,tail,fragments},approved);
});
test('three distinct tonal centers, including D minor with its leading-tone dominant',()=>{
 assert.deepEqual(LEVELS.map(l=>l.key),['C major','G major','D minor']);
 const scales=[[0,2,4,5,7,9,11],[7,9,11,0,2,4,6],[2,4,5,7,9,10,1]];
 const tonics=[0,7,2];
 LEVELS.forEach((level,i)=>{
  assert.equal(level.instrument,'musicbox');
  for(const f of level.fragments){
   for(const note of f.notes)assert.ok(scales[i].includes(note.midi%12),`${f.id} foreign melody ${note.midi}`);
   for(const h of f.harmony)for(const pitch of [...h.chord,h.bass])assert.ok(scales[i].includes(pitch%12),`${f.id} foreign harmony ${pitch}`);
  }
  const end=level.fragments.at(-1);
  assert.equal(end.notes.at(-1).midi%12,tonics[i]);assert.equal(end.harmony.at(-1).bass%12,tonics[i]);
 });
 const ending=LEVELS[2].fragments.at(-1);
 assert.ok(ending.harmony[0].chord.includes(61)); // C-sharp in A7.
 assert.equal(ending.notes.at(-2).midi%12,1);assert.equal(ending.notes.at(-1).midi%12,2);
 assert.deepEqual(ending.harmony.at(-1).chord.map(n=>n%12),[2,5,9]);
});
test('new songs have downbeat melody and bass, breaths, and no offbeat ties across a strong beat',()=>{
 for(const level of LEVELS.slice(1))for(const f of level.fragments){
  assert.equal(level.beats%level.meter,0);
  for(const note of f.notes){
   assert.equal(note.beat*2,Math.round(note.beat*2));
   if(note.beat%1)assert.ok(note.duration<Math.ceil(note.beat)-note.beat,`${f.id} syncopation at ${note.beat}`);
  }
  const bass=timeline(level,[f.id],true).events.filter(e=>e.voice==='bass');
  for(let bar=0;bar<level.beats;bar+=level.meter){
   const notes=f.notes.filter(n=>n.beat>=bar&&n.beat<bar+level.meter);
   assert.equal(notes[0].beat,bar);
   assert.ok(notes[0].velocity>=Math.max(...notes.slice(1).map(n=>n.velocity),0));
   assert.ok(bass.some(e=>Math.abs(e.at-bar*60/level.bpm)<.00001));
  }
  assert.ok(f.notes.at(-1).beat+f.notes.at(-1).duration<level.beats-.2,`${f.id} breathing space`);
 }
});
test('all melody fundamentals stay in a usable small-speaker register; no coincident duplicate voices',()=>{
 for(const level of LEVELS)for(const rich of [false,true]){
  const score=timeline(level,solution(level),rich);
  const seen=new Set();
  for(const e of score.events){
   if(e.voice==='melody'){const hz=440*2**((e.midi-69)/12);assert.ok(hz>=350&&hz<=1100,`${level.id} lead ${hz}`);}
   const key=[e.voice,e.timbre,e.midi,e.at.toFixed(6)].join('/');assert.ok(!seen.has(key),`${level.id} duplicate ${key}`);seen.add(key);
   assert.equal(e.timbre.startsWith('musicbox'),true);
  }
 }
});
