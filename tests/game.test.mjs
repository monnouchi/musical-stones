import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, timeline } from '../src/music.js';
import { solution, shuffled, newPuzzle, place, remove, evaluate, freshState, restoreState, readState, saveState, STORAGE_KEY } from '../src/game.js';

function permutations(list) { return list.length ? list.flatMap((id, i) => permutations(list.filter((_, j) => i !== j)).map(p => [id, ...p])) : [[]]; }

test('each level has exactly one correct permutation; incomplete and malformed orders fail', () => {
  for (const level of LEVELS) {
    const answers = permutations(solution(level)).filter(p => evaluate(level, p) === 'correct');
    assert.deepEqual(answers, [solution(level)]);
    assert.equal(evaluate(level, [null, ...solution(level).slice(1)]), 'incomplete');
    assert.equal(evaluate(level, []), 'incomplete');
    assert.equal(evaluate(level, Array(level.fragments.length).fill(solution(level)[0])), 'retry');
  }
});
test('shuffle conserves every fragment and never produces the solution, including degenerate RNG', () => {
  for (const level of LEVELS) for (let seed = 0; seed <= 100; seed++) {
    const ids = solution(level); const result = shuffled(ids, () => seed / 100);
    assert.deepEqual([...result].sort(), [...ids].sort());
    assert.notDeepEqual(result, ids); assert.deepEqual(ids, solution(level));
  }
});
test('neutral A/B labels are randomized without an always-reversed two-piece answer', () => {
  const level = LEVELS[0];
  assert.deepEqual(newPuzzle(level, () => 0).tray, [...solution(level)].reverse());
  assert.deepEqual(newPuzzle(level, () => .999).tray, solution(level));
  for(const candidate of LEVELS)for(const random of [()=>0,()=>.999,Math.random]){
    const p=newPuzzle(candidate,random);
    const order=[...p.tray].sort((a,b)=>p.world[a].x-p.world[b].x);
    assert.notDeepEqual(order,solution(candidate));assert.ok(p.slots.every(id=>id===null));
    assert.equal(new Set(Object.values(p.world).map(point=>point.x)).size,p.tray.length);
  }
});
test('tap placement swaps placed fragments, evicts unplaced replacements, and removes without duplication', () => {
  const level = LEVELS[2]; const [a,b,c,d] = solution(level);
  let puzzle = newPuzzle(level);
  puzzle = place(puzzle,a,0); puzzle = place(puzzle,b,1);
  const original = puzzle;
  puzzle = place(puzzle,a,1);
  assert.deepEqual(puzzle.slots,[b,a,null,null]);
  assert.deepEqual(original.slots,[a,b,null,null]);
  puzzle = place(puzzle,c,1);
  assert.deepEqual(puzzle.slots,[b,c,null,null]);
  puzzle = place(puzzle,d,3);
  puzzle = remove(puzzle,0);
  assert.deepEqual(puzzle.slots,[null,c,null,d]);
  assert.equal(place(puzzle,'fake',1),puzzle);
  assert.equal(place(puzzle,a,99),puzzle);
  assert.equal(place(puzzle,a,NaN),puzzle);
});
test('every startup ignores old positions and achievements but retains unrelated settings',()=>{
 for(const version of [1,2,3,4])for(const completed of [false,true]){
  const old=freshState();old.version=version;old.levelIndex=2;old.volume=.27;old.muted=true;old.solved=['sprout','walk','lantern'];
  for(const level of LEVELS){old.puzzles[level.id].tray=solution(level);old.puzzles[level.id].slots=completed?solution(level):[solution(level)[0],...Array(level.fragments.length-1).fill(null)];for(const id of solution(level))old.puzzles[level.id].world[id]={x:.01,y:.01};}
  const restored=restoreState(JSON.stringify(old));
  assert.equal(restored.levelIndex,2);assert.equal(restored.volume,.27);assert.equal(restored.muted,true);assert.deepEqual(restored.solved,[]);assert.equal(restored.version,4);
  for(const level of LEVELS){const p=restored.puzzles[level.id];assert.ok(p.slots.every(id=>id===null));assert.ok(Object.values(p.world).every(point=>point.y===.77));assert.notDeepEqual([...p.tray].sort((a,b)=>p.world[a].x-p.world[b].x),solution(level));}
 }
});
test('corrupt puzzle snapshots cannot override a fresh start; bad settings are repaired',()=>{
 for(const raw of ['broken','null','{}','{"version":99}',undefined])assert.equal(restoreState(raw).version,4);
 const old=freshState();old.levelIndex=99;old.volume=9;old.muted=true;old.solved=['sprout'];old.puzzles.walk={tray:['fake'],slots:['fake'],world:null};
 const restored=restoreState(JSON.stringify(old));assert.equal(restored.levelIndex,0);assert.equal(restored.volume,1);assert.equal(restored.muted,true);assert.deepEqual(restored.solved,[]);
 assert.ok(restored.puzzles.walk.slots.every(id=>id===null));assert.ok(restored.puzzles.walk.tray.every(id=>solution(LEVELS[1]).includes(id)));
});
test('storage security/quota failure does not prevent playing', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(readState(blocked).version,4); assert.equal(saveState(blocked,freshState()),false);
  assert.equal(readState(null).version,4);
  let stored;
  assert.equal(saveState({setItem(k,v) { stored = [k,v]; }},freshState()),true);
  assert.equal(stored[0],STORAGE_KEY); assert.equal(JSON.parse(stored[1]).version,4);
});
test('original scores have valid bounded notes, rich arrangement retains melody and no ambiguous exact duplicates', () => {
  const globalIds = LEVELS.flatMap(l => solution(l)); assert.equal(new Set(globalIds).size,globalIds.length);
  for (const level of LEVELS) {
    const plain = timeline(level,solution(level)); const rich = timeline(level,solution(level),true);
    assert.equal(plain.duration,level.fragments.length * level.beats * 60 / level.bpm);
    assert.ok(rich.events.length > plain.events.length);
    assert.deepEqual(rich.events.filter(e => e.voice === 'melody'),plain.events.filter(e => e.voice === 'melody'));
    const patterns = level.fragments.map(f => JSON.stringify(f.notes));
    assert.equal(new Set(patterns).size,patterns.length);
    for (const score of [plain, rich]) for (const event of score.events) {
      for (const key of ['at','length','midi','velocity']) assert.ok(Number.isFinite(event[key]), `${level.id}/${key}`);
      assert.ok(event.at >= 0 && event.at + event.length <= score.duration + score.tailDuration + .001);
      assert.ok(event.midi >= 36 && event.midi <= 90 && event.length > 0 && event.velocity > 0);
    }
  }
  assert.throws(() => timeline(LEVELS[0],['missing']));
});
test('bass sounds every harmonic boundary and leaves room before the next root',()=>{
  for(const level of LEVELS)for(const fragment of level.fragments) {
    const beat=60/level.bpm,score=timeline(level,[fragment.id],true);
    const bass=score.events.filter(e=>e.voice==='bass').sort((a,b)=>a.at-b.at);
    for(const change of fragment.harmony)assert.ok(bass.some(e=>Math.abs(e.at-change.beat*beat)<.0001&&e.midi===change.bass),`${fragment.id} root ${change.beat}`);
    for(let i=0;i<bass.length-1;i++)assert.ok(bass[i].at+bass[i].length+.08 < bass[i+1].at,`${fragment.id} bass overlap`);
    assert.ok(score.events.some(e=>e.voice==='arp'));
    assert.ok(!timeline(level,[fragment.id]).events.some(e=>e.voice==='arp'));
  }
});
