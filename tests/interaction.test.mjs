import test from 'node:test';
import assert from 'node:assert/strict';
import { geometry, dropTarget, applyDrop, magnetPoint, gemPoint, clampPoint } from '../src/interaction.js';
import { newPuzzle, moveFree, place, restoreState, freshState } from '../src/game.js';
import { LEVELS } from '../src/music.js';

const p={tray:['a','b','c','d'],slots:['b',null,'a','d'],world:{a:{x:.2,y:.8},b:{x:.4,y:.7},c:{x:.7,y:.6},d:{x:.9,y:.8}}};
test('only nearby wells attract; the rest of the board remains free',()=>{
 for(const width of [276,340,850]){
  const g=geometry(width,226,4);
  for(let i=0;i<4;i++)assert.equal(dropTarget(g.x(i),g.socketY,g).index,i);
  assert.equal(dropTarget(g.x(0),g.socketY+48,g).kind,'free');
  assert.equal(dropTarget(g.x(0)+g.radiusX+1,g.socketY,g).kind,'free');
  assert.equal(dropTarget(width*.42,160,g).kind,'free');
  assert.equal(dropTarget(-80,60,g).kind,'free');
 }
});
test('magnet moves continuously toward the well and reaches its center',()=>{
 const g=geometry(340,244,4),x=g.x(1);
 const near=dropTarget(x+g.radiusX*.8,g.socketY,g),point=magnetPoint(near,g);
 assert.ok(point.x<x+g.radiusX*.8&&point.x>x);
 assert.deepEqual(magnetPoint(dropTarget(x+g.radiusX*.3,g.socketY,g),g),{x,y:g.socketY});
 const free=dropTarget(170,190,g);assert.equal(magnetPoint(free,g),free.point);
});
test('free drop detaches and saves the release position; off-board release clamps instead of cancelling',()=>{
 const g=geometry(340,244,4);
 const next=applyDrop(p,'a',dropTarget(137,173,g),g);
 assert.equal(next.slots.includes('a'),false);assert.deepEqual(next.world.a,{x:137/340,y:173/244});
 const edge=applyDrop(next,'a',dropTarget(-500,600,g),g),point=gemPoint(edge,'a',g);
 assert.deepEqual(point,{x:g.halfW,y:g.height-g.halfH});
 assert.notDeepEqual(edge.world.a,p.world.a);
 assert.equal(applyDrop(p,'a',{kind:'cancel'},g),p);
});
test('free-to-occupied exchange uses the old free position; placed stones swap without corrupting world',()=>{
 const g=geometry(340,244,4);
 assert.deepEqual(applyDrop(p,'a',{kind:'socket',index:0},g).slots,['a',null,'b','d']);
 const next=applyDrop(p,'c',{kind:'socket',index:0},g);
 assert.deepEqual(next.slots,['c',null,'a','d']);assert.deepEqual(next.world.b,p.world.c);
 assert.deepEqual(p.slots,['b',null,'a','d']);
 for(const id of p.tray)for(let i=0;i<4;i++){
  const next=applyDrop(p,id,{kind:'socket',index:i},g);
  assert.deepEqual(next.tray,p.tray);assert.equal(new Set(next.slots.filter(Boolean)).size,next.slots.filter(Boolean).length);
 }
});
test('resize clamps every free gem inside the current board without changing stored relative position',()=>{
 const next=moveFree(p,'a',{x:.999,y:.001});
 for(const [w,h] of [[850,276],[340,244],[276,210]]){
  const g=geometry(w,h,4),point=gemPoint(next,'a',g);
  assert.ok(point.x+g.halfW<=w&&point.x-g.halfW>=0&&point.y-g.halfH>=0&&point.y+g.halfH<=h);
 }
 assert.deepEqual(next.world.a,{x:.999,y:.001});assert.deepEqual(clampPoint(-4,999,geometry(276,210,4)),{x:37,y:165});
});
test('world state restores, malformed coordinates are repaired, and old arrangements migrate safely',()=>{
 const s=freshState();s.puzzles.sprout=moveFree(s.puzzles.sprout,'s-kite',{x:.42,y:.64});
 assert.deepEqual(restoreState(JSON.stringify(s)),s);
 const legacy={...structuredClone(s),version:1,solved:['sprout','walk','lantern']};delete legacy.puzzles.sprout.world;
 const migrated=restoreState(JSON.stringify(legacy));assert.deepEqual(migrated.solved,[]);assert.equal(migrated.version,3);
 assert.ok(migrated.puzzles.sprout.world['s-kite']);
 const previous={...structuredClone(s),version:2,solved:['sprout','walk','lantern']};
 const renewed=restoreState(JSON.stringify(previous));assert.deepEqual(renewed.solved,['sprout']);assert.deepEqual(renewed.puzzles,previous.puzzles);
 s.puzzles.sprout.world['s-kite']={x:null,y:'invalid'};
 assert.ok(Number.isFinite(restoreState(JSON.stringify(s)).puzzles.sprout.world['s-kite'].x));
 const untouched=newPuzzle(LEVELS[0]);assert.equal(moveFree(untouched,'fake',{x:1,y:1}),untouched);
 assert.equal(moveFree(untouched,'s-kite',{x:NaN,y:.5}),untouched);
});
