import test from 'node:test';
import assert from 'node:assert/strict';
import { ReferenceGuide, GUIDE_KEY } from '../src/reference-guide.js';
const storage = () => {const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}};
test('first reference guide survives reload until audible playback or skip, independently of game storage',()=>{
 const s=storage();s.setItem('demo5.sound-stitch.v1','saved puzzle');const g=new ReferenceGuide(s);
 assert.equal(g.step,'reference');g.started(false);assert.equal(g.step,'reference');assert.equal(new ReferenceGuide(s).step,'reference');
 g.started(true);assert.equal(g.step,'stones');assert.equal(s.getItem(GUIDE_KEY),'1');assert.equal(new ReferenceGuide(s).step,'hidden');g.preview();assert.equal(g.step,'hidden');assert.equal(s.getItem('demo5.sound-stitch.v1'),'saved puzzle');
});
test('skip and re-open are stable even when an asynchronous reference starts later',()=>{
 const s=storage(),g=new ReferenceGuide(s);g.skip();g.started(true);assert.equal(g.step,'hidden');g.reopen();assert.equal(g.step,'reference');assert.equal(new ReferenceGuide(s).step,'hidden');g.skip();assert.equal(g.step,'hidden');
});
test('blocked storage never blocks playback, preview, or skip',()=>{
 const s={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};const g=new ReferenceGuide(s);g.started(true);g.preview();g.reopen();g.skip();assert.equal(g.step,'hidden');
});
