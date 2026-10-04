import test from 'node:test';
import assert from 'node:assert/strict';
import { gemFaces } from '../src/gem-visual.js';

test('solid gem keeps its volume, valid facets and visible shading through a full turn', () => {
  const widths = [];
  const fills = new Set();
  for (let degree = 0; degree <= 360; degree += 15) {
    const svg = gemFaces('#4b9c8b', degree*Math.PI/180);
    const paths = [...svg.matchAll(/d="([^"]+)" fill="([^"]+)"/g)];
    assert.equal(paths.length, 14);
    const points = paths.flatMap(p => [...p[1].matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(m => [Number(m[1]),Number(m[2])]));
    assert.ok(points.every(([x,y]) => Number.isFinite(x)&&Number.isFinite(y)&&x>0&&x<60&&y>0&&y<68));
    widths.push(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])));
    paths.forEach(p=>fills.add(p[2]));
  }
  assert.ok(Math.min(...widths)>40,'edge-on silhouette has real width');
  assert.ok(Math.max(...widths)/Math.min(...widths)<1.25,'no collapsed side angle');
  assert.ok(fills.size>20,'changing face normals create shading');
  assert.equal(gemFaces('#4b9c8b',0),gemFaces('#4b9c8b',Math.PI*2),'complete turn returns to front');
});
