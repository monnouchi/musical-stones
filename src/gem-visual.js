// A small solid gemstone, projected into SVG. No textures or rendering dependency.
const SIDES = 6;
const rings = [{ y: -.84, radius: .43 }, { y: -.2, radius: .91 }, { y: .76, radius: .47 }];
const vertices = rings.flatMap(r => Array.from({ length: SIDES }, (_, i) => {
  const a = (i + .5) * Math.PI * 2 / SIDES;
  return [Math.cos(a) * r.radius, r.y, Math.sin(a) * r.radius];
}));
const faces = [Array.from({ length: SIDES }, (_, i) => SIDES - 1 - i)];
for (let ring = 0; ring < rings.length - 1; ring++) {
  for (let i = 0; i < SIDES; i++) {
    const j = (i + 1) % SIDES;
    faces.push([ring * SIDES + i, ring * SIDES + j, (ring + 1) * SIDES + j, (ring + 1) * SIDES + i]);
  }
}
faces.push(Array.from({ length: SIDES }, (_, i) => (rings.length - 1) * SIDES + i));
const light = [-.45, -.65, -1];
const normalize = v => { const n = Math.hypot(...v); return v.map(x => x / n); };
const lightDirection = normalize(light);

export function gemFaces(color, angle = 0) {
  angle = ((angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  const rgb = color.match(/[\da-f]{2}/gi).map(v => parseInt(v, 16));
  const c = Math.cos(angle), s = Math.sin(angle);
  // A fixed slight tilt reveals the crown without moving the label or target.
  const tilt = .12, ct = Math.cos(tilt), st = Math.sin(tilt);
  const points = vertices.map(([x, y, z]) => {
    const rx = x * c + z * s, rz = z * c - x * s;
    return [rx, y * ct - rz * st, y * st + rz * ct];
  });
  return faces.map((ids, i) => {
    const p = ids.map(id => points[id]);
    const a = p[1].map((v, j) => v - p[0][j]), b = p[2].map((v, j) => v - p[0][j]);
    let normal = normalize([a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]);
    const center = p[0].map((_, j) => p.reduce((sum, v) => sum + v[j], 0) / p.length);
    if (normal.reduce((sum, v, j) => sum + v * center[j], 0) < 0) normal = normal.map(v => -v);
    const diffuse = Math.max(0, normal.reduce((sum, v, j) => sum + v * lightDirection[j], 0));
    const shine = Math.pow(Math.max(0, -normal[2]), 12) * .18;
    const intensity = .57 + diffuse * .54;
    const fill = rgb.map(v => Math.round(Math.min(255, v * intensity + 255 * shine)));
    const d = p.map(([x,y,z], j) => {
      const perspective = 1 / (1 + z * .12);
      return `${j ? 'L' : 'M'}${(30+x*27*perspective).toFixed(2)} ${(34+y*32*perspective).toFixed(2)}`;
    }).join(' ') + 'Z';
    return { depth: center[2], d, fill, i };
  }).sort((a,b) => Math.abs(b.depth-a.depth)<1e-8 ? a.i-b.i : b.depth-a.depth).map(f => `<path data-face="${f.i}" d="${f.d}" fill="rgb(${f.fill.join(',')})" stroke="rgba(238,255,240,.22)" stroke-width=".55" stroke-linejoin="round"/>`).join('');
}

export function startGemVisuals(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null, last = 0, angle = 0, elapsed = 0;
  const targets = () => {
    const room = [...root.querySelectorAll('.listening-room[open] .gem-face')];
    return room.length ? room : [...root.querySelectorAll('.gem-stage.is-awakened .gem-face')];
  };
  const paint = svg => { svg.innerHTML = gemFaces(svg.dataset.color, angle); svg.dataset.angle = String(angle); };
  const tick = now => {
    frame = null;
    if (document.hidden || reduce.matches || !targets().length) { last = 0; return; }
    if (!last || now-last >= 1000/30) {
      if (last) elapsed += Math.min(now-last, 80);
      last = now; angle = elapsed/9000*Math.PI*2;
      targets().forEach(paint);
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (document.hidden || reduce.matches || !targets().length) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; last = 0;
      if (reduce.matches) { angle = 0; targets().forEach(paint); }
    } else if (frame === null) { last = 0; frame = requestAnimationFrame(tick); }
  };
  reduce.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  return { sync };
}
