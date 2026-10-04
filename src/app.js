import { LEVELS } from './music.js';
import { solution, shuffled, place, remove, evaluate, readState, saveState } from './game.js';
import { geometry, dropTarget, applyDrop } from './interaction.js';
import { SoundPlayer } from './audio.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const state = readState(storage);
let active = null, feedback = '', feedbackKind = '', lastPlaying = null, drag = null;
let renderedLevel = null, suppressClickUntil = 0;
let awakened = false;
const gems = new Map();
const colors = ['#4b9c8b', '#ba9757', '#9683b3', '#6b9cae'];
const level = () => LEVELS[state.levelIndex];
const puzzle = () => state.puzzles[level().id];
const letter = id => String.fromCharCode(65 + puzzle().tray.indexOf(id));
const name = id => `音 ${letter(id)}`;
const boardGeometry = () => geometry($('gem-stage').clientWidth, $('gem-stage').clientHeight, puzzle().slots.length);
const player = new SoundPlayer({ onUpdate: updatePlayback });
player.setVolume(state.volume, state.muted);

function gemArt(id) {
  const color = colors[puzzle().tray.indexOf(id)];
  return `<svg class="gem-face" viewBox="0 0 60 68" aria-hidden="true"><path fill="${color}" d="M18 3H42L58 26L45 63H15L2 26Z"/><path fill="#ffffff" opacity=".30" d="M18 3L30 24L2 26Z"/><path fill="#ffffff" opacity=".16" d="M18 3H42L30 24Z"/><path fill="#ffffff" opacity=".09" d="M30 24L58 26L45 63Z"/><path fill="#1c3d39" opacity=".22" d="M2 26L30 24L15 63Z"/><path fill="#ffffff" opacity=".19" d="M30 24L45 63H15Z"/><path fill="none" stroke="#ffffff" stroke-opacity=".32" stroke-width=".7" d="M18 3L30 24L42 3M2 26L30 24L58 26M15 63L30 24L45 63"/></svg><span class="gem-name">${name(id)}</span>`;
}
function persist() {
  if (!saveState(storage, state)) $('playback-state').textContent = '保存できない環境です。この画面では遊べます。';
}
function soundSettings() {
  for (const id of ['mute', 'room-mute']) {
    $(id).textContent = state.muted ? '消音中' : '音あり';
    $(id).setAttribute('aria-pressed', String(state.muted));
  }
  for (const id of ['volume', 'room-volume']) $(id).value = Math.round(state.volume * 100);
}
function closeRoom() {
  if ($('listening-room').open) $('listening-room').close();
  document.body.classList.remove('is-listening');
}
function updatePlayback(info) {
  lastPlaying = info;
  const label = info.label + (info.playing && (state.muted || state.volume === 0) ? '（消音中）' : '');
  $('playback-state').textContent = label;
  $('playback-time').textContent = info.playing ? `${Math.floor(info.elapsed)} / ${Math.ceil(info.duration)} 秒` : '';
  $('progress').style.width = `${info.fraction * 100}%`;
  $('stop').disabled = !info.playing;
  gems.forEach((el, id) => el.classList.toggle('is-playing', info.playing && id === info.id));
  if (info.playing && info.immersive) {
    if (!$('listening-room').open) {
      $('room-title').textContent = level().title;
      $('room-gems').innerHTML = puzzle().slots.map(id => `<div class="room-gem" style="--gem-color:${colors[puzzle().tray.indexOf(id)]}">${gemArt(id)}</div>`).join('');
      document.body.classList.add('is-listening');
      $('listening-room').showModal();
      $('room-stop').focus({ preventScroll: true });
    }
    $('room-progress').style.width = `${info.fraction * 100}%`;
    $('room-state').textContent = state.muted || state.volume === 0 ? '消音中 — 音ありに切り替えると聴けます。' : '完成した曲を聴いています。';
  } else closeRoom();
}
function status(message) { $('gesture-status').textContent = message; }
function commit(next, message) {
  player.stop();
  state.puzzles[level().id] = next;
  awakened = false;
  feedback = ''; feedbackKind = '';
  persist(); render();
  if (message) status(message);
}
function changeLevel(index) {
  cancelDrag(); player.stop(); state.levelIndex = index;
  active = null; awakened = false; feedback = ''; feedbackKind = '';
  persist(); render(); status('宝石を聴いて、くぼみへ。横に並ぶと光がつながります。');
}
function audition(id) {
  active = id; controls();
  status(`${name(id)} を選びました。ドラッグ、または「はめる」で台座へ。`);
  player.play(level(), [id], { label: `${name(id)} を再生中` });
}
function controls() {
  const source = active ? puzzle().slots.indexOf(active) : -1;
  const count = puzzle().slots.filter(Boolean).length;
  $('active-name').textContent = active ? name(active) : '宝石を選ぶ';
  $('place-active').disabled = !active || source >= 0 || !puzzle().slots.includes(null);
  $('move-left').disabled = source <= 0;
  $('move-right').disabled = source < 0 || source === puzzle().slots.length - 1;
  $('return-active').disabled = source < 0;
  $('play-order').disabled = count === 0;
  $('check').disabled = count !== level().fragments.length;
  $('clear').disabled = count === 0;
  gems.forEach((el, id) => {
    el.classList.toggle('is-active', active === id);
    el.setAttribute('aria-pressed', String(active === id));
    const index = puzzle().slots.indexOf(id);
    el.setAttribute('aria-label', `${name(id)} を聴く。${index >= 0 ? `${index + 1}番目に配置。左右キーで交換、Deleteで棚へ。` : '棚にあります。数字キーで配置。'}`);
  });
}
function layout(displayPuzzle = puzzle()) {
  const g = boardGeometry();
  $('connections').setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  $('gem-stage').style.setProperty('--shelf-label-top', `${g.height * .53}px`);
  [...$('sockets').children].forEach((el, i) => {
    el.style.left = `${g.x(i)}px`; el.style.top = `${g.socketY}px`;
    el.classList.toggle('is-target', drag?.target?.kind === 'socket' && drag.target.index === i);
  });
  gems.forEach((el, id) => {
    const slot = displayPuzzle.slots.indexOf(id);
    el.style.left = `${g.x(slot < 0 ? displayPuzzle.tray.indexOf(id) : slot)}px`;
    el.style.top = `${slot < 0 ? g.shelfY : g.socketY}px`;
  });
  $('connections').innerHTML = displayPuzzle.slots.slice(0, -1).map((id, i) => {
    if (!id || !displayPuzzle.slots[i + 1]) return '';
    const x1 = g.x(i) + 16, x2 = g.x(i + 1) - 16, y = g.socketY + 7;
    return `<path class="light-link${drag?.isDragging ? ' is-preview' : ''}" d="M${x1} ${y} C${x1 + 12} ${y + 27}, ${x2 - 12} ${y + 27}, ${x2} ${y}"/>`;
  }).join('');
}
function render() {
  const current = level();
  if (!$('levels').children.length) $('levels').replaceChildren(...LEVELS.map((item, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'level-button';
    el.textContent = `${i + 1} ${item.title}${state.solved.includes(item.id) ? ' ✓' : ''}`;
    el.setAttribute('aria-current', i === state.levelIndex ? 'step' : 'false');
    el.addEventListener('click', () => changeLevel(i));
    return el;
  }));
  [...$('levels').children].forEach((el, i) => {
    el.textContent = `${i + 1} ${LEVELS[i].title}${state.solved.includes(LEVELS[i].id) ? ' ✓' : ''}`;
    el.setAttribute('aria-current', i === state.levelIndex ? 'step' : 'false');
  });
  $('level-kicker').textContent = `SONG ${state.levelIndex + 1} · ${current.fragments.length} GEMS`;
  $('level-title').textContent = current.title;
  $('level-description').textContent = current.description;
  if (renderedLevel !== current.id) {
    gems.clear(); $('gem-layer').replaceChildren();
    $('sockets').innerHTML = current.fragments.map((_, i) => `<div class="socket"><span class="socket-face"></span><span class="socket-index">${i + 1}</span></div>`).join('');
    puzzle().tray.forEach(id => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'gem'; el.dataset.gem = id;
      el.style.setProperty('--gem-color', colors[puzzle().tray.indexOf(id)]);
      el.innerHTML = gemArt(id);
      el.addEventListener('click', event => {
        if (event.detail && performance.now() < suppressClickUntil) return;
        audition(id);
      });
      el.addEventListener('pointerdown', event => pointerDown(event, id));
      el.addEventListener('pointermove', pointerMove);
      el.addEventListener('pointerup', pointerUp);
      el.addEventListener('pointercancel', cancelDrag);
      el.addEventListener('lostpointercapture', () => { if (drag) cancelDrag(); });
      el.addEventListener('keydown', event => gemKey(event, id));
      gems.set(id, el); $('gem-layer').append(el);
    });
    renderedLevel = current.id;
  }
  controls(); layout(); soundSettings();
  $('feedback').textContent = feedback || (state.solved.includes(current.id) ? 'この曲はよみがえりました。何度でも聴いて遊べます。' : current.subtitle);
  $('feedback').className = `feedback ${feedbackKind}`;
  $('next').hidden = !(state.solved.includes(current.id) && state.levelIndex < LEVELS.length - 1);
  if (lastPlaying) updatePlayback(lastPlaying);
}
function pointerDown(event, id) {
  if (event.button !== 0 || drag) return;
  suppressClickUntil = 0;
  drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, base: puzzle(), el: event.currentTarget, isDragging: false, target: { kind: 'cancel' } };
  event.currentTarget.setPointerCapture(event.pointerId);
}
function pointerMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.isDragging && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
  if (!drag.isDragging) {
    drag.isDragging = true; active = drag.id; player.stop(); controls();
    drag.el.classList.add('is-dragged');
    $('gem-stage').classList.add('is-dragging');
    $('drag-ghost').innerHTML = gemArt(drag.id);
    $('drag-ghost').hidden = false;
    status(`${name(drag.id)} を移動中。くぼみで離して配置、台座の外で離すと元へ。`);
  }
  event.preventDefault();
  const rect = $('gem-stage').getBoundingClientRect(), g = boardGeometry();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  drag.target = dropTarget(x, y, g);
  layout(applyDrop(drag.base, drag.id, drag.target));
  // Clamp the floating gem so an outside cancel never creates page overflow.
  const ghostX = drag.target.kind === 'socket' ? g.x(drag.target.index) : Math.max(39, Math.min(g.width - 39, x));
  const ghostY = drag.target.kind === 'socket' ? g.socketY : Math.max(46, Math.min(g.height - 46, y - 35));
  $('drag-ghost').style.left = `${ghostX}px`; $('drag-ghost').style.top = `${ghostY}px`;
}
function endDrag() {
  const ended = drag;
  drag = null;
  if (!ended) return;
  ended.el.classList.remove('is-dragged');
  if (ended.el.hasPointerCapture(ended.pointerId)) ended.el.releasePointerCapture(ended.pointerId);
  $('gem-stage').classList.remove('is-dragging'); $('drag-ghost').hidden = true;
  layout();
  return ended;
}
function cancelDrag() {
  const ended = endDrag();
  if (ended?.isDragging) { suppressClickUntil = performance.now() + 250; status('元の場所へ戻しました。'); }
}
function pointerUp(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const ended = endDrag();
  if (!ended.isDragging) return;
  suppressClickUntil = performance.now() + 250;
  const rect = $('gem-stage').getBoundingClientRect();
  const target = dropTarget(event.clientX - rect.left, event.clientY - rect.top, boardGeometry());
  const next = applyDrop(ended.base, ended.id, target);
  if (next === ended.base) { status('元の場所へ戻しました。'); return; }
  commit(next, target.kind === 'socket' ? `${name(ended.id)} が ${target.index + 1} 番目にはまりました。` : `${name(ended.id)} を棚へ戻しました。`);
  if (target.kind === 'socket' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ended.el.classList.add('just-snapped');
    setTimeout(() => ended.el.classList.remove('just-snapped'), 450);
  }
}
function put(index) {
  if (active) commit(place(puzzle(), active, index), `${name(active)} を ${index + 1} 番目へ。`);
}
function moveActive(delta) {
  const index = puzzle().slots.indexOf(active);
  if (index >= 0 && index + delta >= 0 && index + delta < puzzle().slots.length) put(index + delta);
}
function returnActive() {
  const index = puzzle().slots.indexOf(active);
  if (index >= 0) commit(remove(puzzle(), index), `${name(active)} を棚へ戻しました。`);
}
function gemKey(event, id) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[1-4]$/.test(event.key) && Number(event.key) <= puzzle().slots.length) {
    event.preventDefault(); event.stopPropagation(); active = id; put(Number(event.key) - 1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); active = id;
    if (puzzle().slots.includes(id)) moveActive(event.key === 'ArrowLeft' ? -1 : 1);
    else put(event.key === 'ArrowLeft' ? puzzle().slots.indexOf(null) : puzzle().slots.lastIndexOf(null));
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault(); active = id; returnActive();
  }
}
function playOrder() {
  const ids = puzzle().slots.filter(Boolean), complete = awakened && evaluate(level(), puzzle().slots) === 'correct';
  if (ids.length) player.play(level(), ids, { rich: complete, immersive: complete, label: complete ? '完成した曲を再生中' : '置いた宝石を左から再生中' });
}
function check() {
  player.stop();
  if (evaluate(level(), puzzle().slots) === 'correct') {
    awakened = true;
    if (!state.solved.includes(level().id)) state.solved.push(level().id);
    feedback = state.solved.length === LEVELS.length ? '3つの曲がよみがえった！ 好きな曲を、もう一度。' : '音がよみがえった。伴奏と、最後の余韻を聴いてみよう。';
    feedbackKind = 'success'; persist(); render();
    player.play(level(), solution(level()), { rich: true, immersive: true, label: '完成した曲を再生中' });
  } else if (evaluate(level(), puzzle().slots) === 'retry') {
    feedback = `もう少し。${level().hint}`; feedbackKind = 'retry'; render();
  }
}
$('reference').addEventListener('click', () => player.play(level(), solution(level()), { label: 'お手本を再生中', revealFragments: false }));
$('place-active').addEventListener('click', () => put(puzzle().slots.indexOf(null)));
$('move-left').addEventListener('click', () => moveActive(-1));
$('move-right').addEventListener('click', () => moveActive(1));
$('return-active').addEventListener('click', returnActive);
$('play-order').addEventListener('click', playOrder);
$('check').addEventListener('click', check);
for (const id of ['stop', 'room-stop']) $(id).addEventListener('click', () => player.stop());
$('listening-room').addEventListener('cancel', event => { event.preventDefault(); player.stop(); });
$('shuffle').addEventListener('click', () => { cancelDrag(); commit({ ...puzzle(), slots: shuffled(solution(level())) }); });
$('clear').addEventListener('click', () => { cancelDrag(); commit({ ...puzzle(), slots: puzzle().slots.map(() => null) }); });
$('next').addEventListener('click', () => changeLevel(Math.min(LEVELS.length - 1, state.levelIndex + 1)));
function toggleMute() {
  state.muted = !state.muted; player.setVolume(state.volume, state.muted); persist(); soundSettings();
  if (lastPlaying) updatePlayback(lastPlaying);
}
for (const id of ['mute', 'room-mute']) $(id).addEventListener('click', toggleMute);
for (const id of ['volume', 'room-volume']) $(id).addEventListener('input', event => {
  state.volume = Number(event.target.value) / 100;
  player.setVolume(state.volume, state.muted); persist(); soundSettings();
  if (lastPlaying) updatePlayback(lastPlaying);
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'Escape') { event.preventDefault(); if (drag) cancelDrag(); else player.stop(); }
  else if (active && /^[1-4]$/.test(event.key) && Number(event.key) <= puzzle().slots.length) { event.preventDefault(); put(Number(event.key) - 1); }
  else if (event.key.toLowerCase() === 'p') { event.preventDefault(); playOrder(); }
  else if (event.key.toLowerCase() === 's') { event.preventDefault(); player.stop(); }
  else if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleMute(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelDrag(); player.background(); persist(); } });
window.addEventListener('pagehide', () => { cancelDrag(); player.background(); persist(); });
new ResizeObserver(() => { if (!drag) layout(); }).observe($('gem-stage'));
render();
