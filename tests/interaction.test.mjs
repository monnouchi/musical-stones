import test from 'node:test';
import assert from 'node:assert/strict';
import { geometry, dropTarget, applyDrop } from '../src/interaction.js';

const p = {tray:['a','b','c','d'],slots:['b',null,'a','d']};
test('same sockets accept every gem, inside shelf removes, gap and outside cancel', () => {
  for (const width of [276,340,850]) {
    const g = geometry(width,226,4);
    for(let i=0;i<4;i++) assert.deepEqual(dropTarget(g.x(i),g.socketY,g),{kind:'socket',index:i});
    assert.equal(dropTarget(-1,g.socketY,g).kind,'cancel');
    assert.equal(dropTarget(width+1,g.socketY,g).kind,'cancel');
    assert.equal(dropTarget(70,135,g).kind,'shelf');
    assert.equal(dropTarget(70,124,g).kind,'cancel');
  }
});
test('drop commits a swap or replacement once and cancellation keeps every stone', () => {
  assert.deepEqual(applyDrop(p,'a',{kind:'socket',index:0}).slots,['a',null,'b','d']);
  assert.deepEqual(applyDrop(p,'c',{kind:'socket',index:0}).slots,['c',null,'a','d']);
  assert.deepEqual(applyDrop(p,'a',{kind:'shelf'}).slots,['b',null,null,'d']);
  assert.equal(applyDrop(p,'a',{kind:'cancel'}),p);
  assert.equal(applyDrop(p,'c',{kind:'shelf'}),p);
  for(const id of p.tray) for(let index=0;index<4;index++) {
    const next=applyDrop(p,id,{kind:'socket',index});
    assert.deepEqual(next.tray,p.tray);
    assert.equal(new Set(next.slots.filter(Boolean)).size,next.slots.filter(Boolean).length);
    assert.equal(next.slots[index],id);
  }
});
