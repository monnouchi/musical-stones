import { LEVELS } from './music.js?v=0.2.1';

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
export function newPuzzle(level, random = Math.random) {
  return { tray: shuffled(solution(level), random, false), slots: Array(level.fragments.length).fill(null) };
}
export function place(puzzle, id, index) {
  if (!puzzle.tray.includes(id) || !Number.isInteger(index) || index < 0 || index >= puzzle.slots.length) return puzzle;
  const slots = [...puzzle.slots];
  const source = slots.indexOf(id);
  if (source === index) return puzzle;
  if (source >= 0) slots[source] = slots[index];
  slots[index] = id; // an unplaced selection returns the old occupant to the tray
  return { ...puzzle, slots };
}
export function remove(puzzle, index) {
  return { ...puzzle, slots: puzzle.slots.map((id, i) => i === index ? null : id) };
}
export function evaluate(level, slots) {
  if (slots.length !== level.fragments.length || slots.some(id => !id)) return 'incomplete';
  return solution(level).every((id, i) => id === slots[i]) ? 'correct' : 'retry';
}
export function freshState() {
  return { version: 1, levelIndex: 0, puzzles: Object.fromEntries(LEVELS.map(l => [l.id, newPuzzle(l)])), solved: [], volume: .65, muted: false };
}
export function restoreState(raw) {
  const state = freshState();
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1) return state;
    if (Number.isInteger(saved.levelIndex) && saved.levelIndex >= 0 && saved.levelIndex < LEVELS.length) state.levelIndex = saved.levelIndex;
    if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) state.volume = Math.max(0, Math.min(1, saved.volume));
    state.muted = saved.muted === true;
    state.solved = LEVELS.filter(l => Array.isArray(saved.solved) && saved.solved.includes(l.id)).map(l => l.id);
    for (const level of LEVELS) {
      const puzzle = saved.puzzles?.[level.id];
      const valid = solution(level);
      if (!puzzle || !Array.isArray(puzzle.tray) || !Array.isArray(puzzle.slots)) continue;
      if (puzzle.tray.length !== valid.length || new Set(puzzle.tray).size !== valid.length || !puzzle.tray.every(id => valid.includes(id))) continue;
      if (puzzle.slots.length !== valid.length || !puzzle.slots.every(id => id === null || valid.includes(id))) continue;
      const placed = puzzle.slots.filter(Boolean);
      if (new Set(placed).size !== placed.length) continue;
      state.puzzles[level.id] = { tray: [...puzzle.tray], slots: [...puzzle.slots] };
    }
  } catch { /* inaccessible/corrupt storage starts a playable fresh game */ }
  return state;
}
export function readState(storage) {
  try { return restoreState(storage.getItem(STORAGE_KEY)); } catch { return freshState(); }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
