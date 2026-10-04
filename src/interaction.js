import { place, remove } from './game.js';

export function geometry(width, height, count) {
  return { width, height, count, socketY: height * .29, shelfY: height * .77, x: i => (i + .5) * width / count };
}
export function dropTarget(x, y, board) {
  if (x < 0 || x > board.width || y < 0 || y > board.height) return { kind: 'cancel' };
  if (Math.abs(y - board.socketY) < 56) {
    const index = Math.min(board.count - 1, Math.floor(x / (board.width / board.count)));
    return { kind: 'socket', index };
  }
  return { kind: y >= board.height * .56 ? 'shelf' : 'cancel' };
}
export function applyDrop(puzzle, id, target) {
  if (target.kind === 'socket') return place(puzzle, id, target.index);
  const index = puzzle.slots.indexOf(id);
  return target.kind === 'shelf' && index >= 0 ? remove(puzzle, index) : puzzle;
}
