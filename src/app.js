import { LEVELS } from './music.js';
import { solution, shuffled, place, remove, evaluate, readState, saveState } from './game.js';
import { SoundPlayer } from './audio.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = readState(storage);
let selected = null;
let feedback = '';
let feedbackKind = '';
let lastPlaying = null;
const level = () => LEVELS[state.levelIndex];
const puzzle = () => state.puzzles[level().id];
const letter = id => String.fromCharCode(65 + puzzle().tray.indexOf(id));
const name = id => `音 ${letter(id)}`;
const player = new SoundPlayer({ onUpdate: updatePlayback });
player.setVolume(state.volume, state.muted);

function persist() {
  if (!saveState(storage, state)) $('playback-state').textContent = '保存できない環境です。この画面ではそのまま遊べます。';
}
function updatePlayback(info) {
  lastPlaying = info;
  const playbackLabel = info.label + (info.playing && (state.muted || state.volume === 0) ? '（消音中）' : '');
  if ($('playback-state').textContent !== playbackLabel) $('playback-state').textContent = playbackLabel;
  $('playback-time').textContent = info.playing ? `${Math.floor(info.elapsed)} / ${Math.ceil(info.duration)} 秒` : '';
  $('progress').style.width = `${info.fraction * 100}%`;
  $('stop').disabled = !info.playing;
  document.querySelectorAll('[data-piece]').forEach(el => el.classList.toggle('is-playing', info.playing && el.dataset.piece === info.id));
  document.querySelectorAll('[data-slot]').forEach(el => el.classList.toggle('is-playing', info.playing && el.dataset.piece === info.id));
}
function button(label, css, action, focusKey) {
  const element = document.createElement('button');
  element.type = 'button'; element.className = css; element.textContent = label;
  element.dataset.focus = focusKey;
  element.addEventListener('click', action);
  return element;
}
function choose(id) {
  selected = selected === id ? null : id;
  render();
}
function changePuzzle(nextPuzzle) {
  player.stop();
  state.puzzles[level().id] = nextPuzzle;
  selected = null; feedback = ''; feedbackKind = '';
  persist(); render();
}
function switchLevel(index) {
  player.stop(); state.levelIndex = index;
  selected = null; feedback = ''; feedbackKind = '';
  persist(); render();
}
function render() {
  const focus = document.activeElement?.dataset.focus;
  const current = level(); const currentPuzzle = puzzle();
  $('levels').replaceChildren(...LEVELS.map((item, i) => {
    const done = state.solved.includes(item.id);
    const element = button(`${String(i + 1).padStart(2, '0')}  ${item.title}${done ? '  ✓' : ''}`, 'level-button', () => switchLevel(i), `level-${i}`);
    element.setAttribute('aria-current', i === state.levelIndex ? 'step' : 'false');
    element.setAttribute('aria-label', `${i + 1}曲目 ${item.title}${done ? ' 達成済み' : ''}`);
    return element;
  }));
  $('level-kicker').textContent = `SONG ${String(state.levelIndex + 1).padStart(2, '0')} / ${current.fragments.length} PIECES`;
  $('level-title').textContent = current.title;
  $('level-description').textContent = current.description;
  $('pieces').replaceChildren(...currentPuzzle.tray.map(id => {
    const card = document.createElement('div'); card.className = 'piece-card'; card.dataset.piece = id;
    const placed = currentPuzzle.slots.includes(id);
    if (selected === id) card.classList.add('is-selected');
    const glyph = document.createElement('span'); glyph.className = 'piece-glyph'; glyph.textContent = '⌁'; glyph.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong'); title.textContent = name(id);
    const info = document.createElement('span'); info.className = 'piece-caption'; info.textContent = placed ? '配置済み' : '音のかけら';
    const controls = document.createElement('div'); controls.className = 'piece-controls';
    const listen = button('▷ 聴く', 'listen-button', () => player.play(current, [id], { label: `${name(id)} を再生中` }), `listen-${id}`);
    listen.setAttribute('aria-label', `${name(id)} を聴く`);
    const select = button(selected === id ? '選択中' : '選ぶ', 'select-button', () => choose(id), `select-${id}`);
    select.setAttribute('aria-label', `${name(id)} を選ぶ`); select.setAttribute('aria-pressed', selected === id);
    controls.append(listen, select); card.append(glyph, title, info, controls); return card;
  }));
  $('selection').textContent = selected ? `${name(selected)} を選択中。置き場所を押してください。` : 'かけらを選び、下の置き場所を押してください。';
  const placedCount = currentPuzzle.slots.filter(Boolean).length;
  $('placed-count').textContent = `${placedCount} / ${current.fragments.length}`;
  $('slots').style.setProperty('--slot-count', current.fragments.length);
  $('slots').replaceChildren(...currentPuzzle.slots.map((id, i) => {
    const container = document.createElement('div'); container.className = 'slot-wrap';
    const slot = button('', `slot${id ? ' filled' : ''}${selected ? ' ready-to-place' : ''}`, () => {
      if (selected) changePuzzle(place(puzzle(), selected, i)); else if (id) choose(id);
    }, `slot-${i}`);
    slot.dataset.slot = i; slot.dataset.piece = id ?? '';
    slot.setAttribute('aria-label', `置き場所 ${i + 1}${id ? ` ${name(id)}` : ' 空'}${selected ? ` に ${name(selected)} を置く` : ''}`);
    const count = document.createElement('span'); count.className = 'slot-number'; count.textContent = String(i + 1).padStart(2, '0');
    const symbol = document.createElement('span'); symbol.className = 'slot-symbol'; symbol.textContent = id ? '⌁' : '+'; symbol.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span'); text.className = 'slot-name'; text.textContent = id ? name(id) : 'ここに置く';
    slot.append(count, symbol, text); container.append(slot);
    if (id) {
      const removeButton = button('×', 'remove-button', () => changePuzzle(remove(puzzle(), i)), `remove-${i}`);
      removeButton.setAttribute('aria-label', `置き場所 ${i + 1} から ${name(id)} を外す`);
      container.append(removeButton);
    }
    return container;
  }));
  $('play-order').disabled = placedCount === 0;
  $('check').disabled = placedCount !== current.fragments.length;
  $('clear').disabled = placedCount === 0;
  $('feedback').textContent = feedback || (state.solved.includes(current.id) ? 'この曲はつながりました。何度でも、聴いて並べて遊べます。' : current.subtitle);
  $('feedback').className = `feedback ${feedbackKind}`;
  $('next').hidden = !(state.solved.includes(current.id) && state.levelIndex < LEVELS.length - 1);
  $('mute').textContent = state.muted ? 'ミュート中' : '音あり';
  $('mute').setAttribute('aria-pressed', state.muted);
  $('volume').value = Math.round(state.volume * 100);
  if (lastPlaying) updatePlayback(lastPlaying);
  if (focus) document.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
}
function playOrder() {
  const ids = puzzle().slots.filter(Boolean);
  if (ids.length) player.play(level(), ids, { rich: evaluate(level(), puzzle().slots) === 'correct', label: 'あなたの並びを再生中' });
}
function check() {
  player.stop();
  const result = evaluate(level(), puzzle().slots);
  if (result === 'incomplete') return;
  if (result === 'correct') {
    if (!state.solved.includes(level().id)) state.solved.push(level().id);
    feedback = state.solved.length === LEVELS.length ? '3曲、つながった！音をさがしてくれてありがとう。もう一度、好きな曲を聴いてみよう。' : 'つながった！ あなたの一曲に、伴奏がひらきます。';
    feedbackKind = 'success'; persist(); render();
    player.play(level(), solution(level()), { rich: true, label: '完成した曲を再生中' });
  } else {
    feedback = `もう少し。${level().hint}`; feedbackKind = 'retry'; render();
  }
}
$('reference').addEventListener('click', () => player.play(level(), solution(level()), { label: 'お手本を再生中', revealFragments: false }));
$('play-order').addEventListener('click', playOrder);
$('check').addEventListener('click', check);
$('stop').addEventListener('click', () => player.stop());
$('shuffle').addEventListener('click', () => changePuzzle({ ...puzzle(), slots: shuffled(solution(level())) }));
$('clear').addEventListener('click', () => changePuzzle({ ...puzzle(), slots: puzzle().slots.map(() => null) }));
$('next').addEventListener('click', () => switchLevel(Math.min(LEVELS.length - 1, state.levelIndex + 1)));
function toggleMute() { state.muted = !state.muted; player.setVolume(state.volume, state.muted); persist(); render(); }
$('mute').addEventListener('click', toggleMute);
$('volume').addEventListener('input', event => {
  state.volume = Number(event.target.value) / 100;
  player.setVolume(state.volume, state.muted); persist();
  if (lastPlaying) updatePlayback(lastPlaying);
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'Escape') { event.preventDefault(); selected = null; player.stop(); render(); }
  else if (selected && /^[1-4]$/.test(event.key) && Number(event.key) <= puzzle().slots.length) { event.preventDefault(); changePuzzle(place(puzzle(), selected, Number(event.key) - 1)); }
  else if (event.key.toLowerCase() === 'p') { event.preventDefault(); playOrder(); }
  else if (event.key.toLowerCase() === 's') { event.preventDefault(); player.stop(); }
  else if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleMute(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { player.background(); persist(); } });
window.addEventListener('pagehide', () => { player.background(); persist(); });
render();
