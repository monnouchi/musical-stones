import { LEVELS } from './music.js?v=0.4.5';

export const STORAGE_KEY = 'demo5.sound-stitch.v1';
export const solution = level => level.fragments.map(f => f.id);
export function shuffled(ids, random = Math.random, avoidSolution = true) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.max(0, Math.min(.999999, random())) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // A filled shuffle must not solve itself. Empty-board labels remain unbiased.
  if (avoidSolution && result.every((id, i) => id === ids[i]) && result.length > 1) result.push(result.shift());
  return result;
}
export function newPuzzle(level, random = Math.random, existingTray = null) {
  // Labels and physical order are independent: avoiding an ordered start must
  // not make the two-piece answer always B-A.
  const tray = existingTray ? [...existingTray] : shuffled(solution(level), random, false);
  const order = shuffled(solution(level), random);
  return { tray, slots: Array(tray.length).fill(null), world: Object.fromEntries(order.map((id,i) => [id,{x:(i+.5)/tray.length,y:.77}])) };
}
export const homePosition = (puzzle, id) => ({x:(puzzle.tray.indexOf(id)+.5)/puzzle.tray.length,y:.77});
export const worldPosition = (puzzle, id) => puzzle.world?.[id] ?? homePosition(puzzle,id);
export function moveFree(puzzle, id, point) {
  if (!puzzle.tray.includes(id) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return puzzle;
  return {...puzzle,slots:puzzle.slots.map(value => value===id ? null : value),world:{...puzzle.world,[id]:{x:Math.max(0,Math.min(1,point.x)),y:Math.max(0,Math.min(1,point.y))}}};
}
export function place(puzzle, id, index) {
  if (!puzzle.tray.includes(id) || !Number.isInteger(index) || index < 0 || index >= puzzle.slots.length) return puzzle;
  const slots = [...puzzle.slots];
  const source = slots.indexOf(id);
  if (source === index) return puzzle;
  if (source >= 0) slots[source] = slots[index];
  const displaced = slots[index];
  slots[index] = id;
  // From free space, exchange the occupant into the dragged stone's old position.
  const world = source < 0 && displaced ? {...puzzle.world,[displaced]:{...worldPosition(puzzle,id)}} : puzzle.world;
  return { ...puzzle, slots, ...(world ? {world} : {}) };
}
export function remove(puzzle, index) {
  return { ...puzzle, slots: puzzle.slots.map((id, i) => i === index ? null : id) };
}
export function evaluate(level, slots) {
  if (slots.length !== level.fragments.length || slots.some(id => !id)) return 'incomplete';
  return solution(level).every((id, i) => id === slots[i]) ? 'correct' : 'retry';
}
export function freshState() {
  return { version: 4, levelIndex: 0, puzzles: Object.fromEntries(LEVELS.map(l => [l.id, newPuzzle(l)])), solved: [], volume: .65, muted: false };
}
export function restoreState(raw) {
  const state = freshState();
  try {
    const saved = JSON.parse(raw);
    if (!saved || ![1,2,3,4].includes(saved.version)) return state;
    if (Number.isInteger(saved.levelIndex) && saved.levelIndex >= 0 && saved.levelIndex < LEVELS.length) state.levelIndex = saved.levelIndex;
    if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) state.volume = Math.max(0, Math.min(1, saved.volume));
    state.muted = saved.muted === true;
    // A new document is a new game. Never import saved slots, free positions,
    // label order or achievements, even from a completed legacy game.
  } catch { /* inaccessible/corrupt storage starts a playable fresh game */ }
  return state;
}
export function readState(storage) {
  try { return restoreState(storage.getItem(STORAGE_KEY)); } catch { return freshState(); }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
