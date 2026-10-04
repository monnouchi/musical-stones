import { LEVELS } from './music.js?v=0.4.5';
import { solution, newPuzzle, place, moveFree, evaluate, readState, saveState } from './game.js?v=0.4.5';
import { geometry, dropTarget, applyDrop, gemPoint, magnetPoint, clampPoint } from './interaction.js?v=0.4.5';
import { SoundPlayer } from './audio.js?v=0.4.5';
import { MagicEffects } from './effects.js?v=0.4.5';

import { ReferenceGuide } from './reference-guide.js?v=0.4.5';
import { gemFaces, startGemVisuals } from './gem-visual.js?v=0.4.5';

const gemVisuals = startGemVisuals();
const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const state = readState(storage);
const guide = new ReferenceGuide(storage);
let guideError = false;
let active = null, feedback = '', feedbackKind = '', lastPlaying = null, drag = null;
let renderedLevel = null, suppressClickUntil = 0;
let awakened = false;
const gems = new Map();
const colors = ['#4b9c8b', '#ba9757', '#9683b3', '#6b9cae'];
const level = () => LEVELS[state.levelIndex];
const puzzle = () => state.puzzles[level().id];
const letter = id => String.fromCharCode(65 + puzzle().tray.indexOf(id));
const name = id => `音 ${letter(id)}`;
const boardGeometry = () => {
  const gem=gems.values().next().value;
  return geometry($('gem-stage').clientWidth,$('gem-stage').clientHeight,puzzle().slots.length,gem?.clientWidth,gem?.clientHeight);
};
const effects = new MagicEffects($('gem-stage'));
const player = new SoundPlayer({ onUpdate: updatePlayback });
player.setVolume(state.volume, state.muted);

function gemArt(id) {
  const color = colors[puzzle().tray.indexOf(id)];
  return `<svg class="gem-face" viewBox="0 0 60 68" data-color="${color}" aria-hidden="true">${gemFaces(color)}</svg><span class="gem-name">${name(id)}</span>`;
}
function persist() {
  if (!saveState(storage, state)) $('playback-state').textContent = '保存できない環境です。この画面では遊べます。';
}
function guideGem() {
  // Physical position only: neither the melody nor its solution chooses the target.
  return [...gems.values()].sort((a,b)=>parseFloat(a.style.top)-parseFloat(b.style.top)||parseFloat(a.style.left)-parseFloat(b.style.left))[0];
}
function positionGuide() {
  if(guide.step!=='stones')return;
  const hint=$('reference-guide'),target=guideGem();
  if(!target)return;
  const stage=$('gem-stage'),width=hint.offsetWidth;
  const x=parseFloat(target.style.left),y=parseFloat(target.style.top);
  const left=Math.max(8,Math.min(stage.clientWidth-width-8,x-width/2));
  hint.style.left=`${left}px`;
  hint.style.top=`${y-target.offsetHeight/2-hint.offsetHeight-14}px`;
  hint.style.setProperty('--guide-arrow-x',`${x-left}px`);
  hint.dataset.anchor=target.dataset.gem;
}
function renderGuide() {
  const hint=$('reference-guide'),stones=guide.step==='stones',shown=guide.step!=='hidden';
  const parent=stones ? $('gem-stage') : $('reference').parentElement;
  if(hint.parentElement!==parent)parent.append(hint);
  hint.hidden=!shown;
  hint.classList.toggle('is-stones',stones);
  $('reference').classList.toggle('is-guided',guide.step==='reference');
  $('reference').removeAttribute('aria-describedby');
  gems.forEach(el=>{el.classList.remove('is-guide-target');el.removeAttribute('aria-describedby');});
  if(stones){
    const target=guideGem();
    target?.classList.add('is-guide-target');
    target?.setAttribute('aria-describedby','reference-guide-text');
  }else{
    hint.style.removeProperty('left');hint.style.removeProperty('top');
    hint.style.removeProperty('--guide-arrow-x');delete hint.dataset.anchor;
    if(shown)$('reference').setAttribute('aria-describedby','reference-guide-text');
  }
  $('reference-guide-text').textContent=stones ? 'この宝石に触れて音を聴き、くぼみへ動かしてみましょう。どの宝石からでも遊べます。' : guideError ? '音を開始できませんでした。「お手本」をもう一度押すか、スキップできます。' : state.muted||state.volume===0 ? 'まず完成した曲を聴きましょう。今は消音中です。「音あり」や音量で調整してから、お手本を押してください。' : 'まず「お手本」で完成した曲を聴きましょう。音のつながりを覚えると、宝石を並べやすくなります。';
  $('guide-dismiss').textContent=stones ? '閉じる' : 'スキップ';
  positionGuide();
}
function soundSettings() {
  for (const id of ['mute', 'room-mute']) {
    $(id).textContent = state.muted ? '消音中' : '音あり';
    $(id).setAttribute('aria-pressed', String(state.muted));
  }
  for (const id of ['volume', 'room-volume']) $(id).value = Math.round(state.volume * 100);
  renderGuide();
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
      effects.clear();
      $('room-title').textContent = level().title;
      $('room-gems').innerHTML = puzzle().slots.map(id => `<div class="room-gem" style="--gem-color:${colors[puzzle().tray.indexOf(id)]}">${gemArt(id)}</div>`).join('');
      document.body.classList.add('is-listening');
      $('listening-room').showModal();
      $('room-stop').focus({ preventScroll: true });
    }
    $('room-progress').style.width = `${info.fraction * 100}%`;
    $('room-state').textContent = state.muted || state.volume === 0 ? '消音中 — 音ありに切り替えると聴けます。' : '完成した曲を聴いています。';
  } else closeRoom();
  gemVisuals.sync();
}
function status(message) { $('gesture-status').textContent = message; }
function commit(next, message, landing=null) {
  cancelDrag();
  player.stop();
  state.puzzles[level().id] = next;
  awakened = false;
  feedback = ''; feedbackKind = '';
  persist(); render();
  if (message) status(message);
  if (landing) effects.land(gems.get(landing.id),landing.socket);
}
function changeLevel(index) {
  cancelDrag(); effects.clear(); player.stop(); state.levelIndex = index;
  active = null; awakened = false; feedback = ''; feedbackKind = '';
  persist(); render(); status('自由に動かして、くぼみの近くへ。');
}
function audition(id) {
  guide.preview(); renderGuide();
  active = id; controls();
  status(`${name(id)}：自由に動かす／盤面をタップ／はめる。`);
  player.play(level(), [id], { label: `${name(id)} を再生中` });
}
function controls() {
  const source = active ? puzzle().slots.indexOf(active) : -1;
  const count = puzzle().slots.filter(Boolean).length;
  $('active-name').textContent = active ? name(active) : '宝石を選ぶ';
  $('place-active').disabled = !active || source >= 0 || !puzzle().slots.includes(null);
  $('move-left').disabled = !active || source===0;
  $('move-right').disabled = !active || source===puzzle().slots.length-1;
  $('move-left').setAttribute('aria-label',source>=0?'左の宝石と交換':'選んだ宝石を左へ');
  $('move-right').setAttribute('aria-label',source>=0?'右の宝石と交換':'選んだ宝石を右へ');
  $('return-active').disabled = source < 0;
  $('play-order').disabled = count === 0;
  $('check').disabled = count !== level().fragments.length;
  $('clear').disabled = count === 0;
  gems.forEach((el, id) => {
    el.classList.toggle('is-active', active === id);
    el.setAttribute('aria-pressed', String(active === id));
    const index = puzzle().slots.indexOf(id);
    el.dataset.location=index>=0 ? `socket-${index}` : 'free';
    el.setAttribute('aria-label', `${name(id)} を聴く。${index>=0 ? `${index+1}番目に配置。` : '自由な位置。'}矢印キーで自由移動、数字で台座へ、Deleteで外す。`);
  });
}
function layout(displayPuzzle = puzzle(), movingPoint = null) {
  const g = boardGeometry();
  $('connections').setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  $('gem-stage').style.setProperty('--shelf-label-top', `${g.height * .53}px`);
  [...$('sockets').children].forEach((el, i) => {
    el.style.left = `${g.x(i)}px`; el.style.top = `${g.socketY}px`;
    el.classList.toggle('is-target', drag?.target?.kind === 'socket' && drag.target.index === i);
  });
  const points=new Map();
  gems.forEach((el,id)=>{
    const point=id===drag?.id&&movingPoint ? movingPoint : gemPoint(displayPuzzle,id,g);
    points.set(id,point);
    el.style.left=`${point.x}px`;el.style.top=`${point.y}px`;
  });
  $('connections').innerHTML = displayPuzzle.slots.slice(0, -1).map((id, i) => {
    if (!id || !displayPuzzle.slots[i + 1]) return '';
    const a=points.get(id),b=points.get(displayPuzzle.slots[i+1]);
    const x1=a.x+16,x2=b.x-16,y1=a.y+7,y2=b.y+7;
    return `<path class="light-link${drag?.isDragging ? ' is-preview' : ''}" d="M${x1} ${y1} C${x1+12} ${y1+27}, ${x2-12} ${y2+27}, ${x2} ${y2}"/>`;
  }).join('');
  if(guide.step==='stones')renderGuide();
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
    const done = state.solved.includes(LEVELS[i].id);
    const caption = document.createElement('span'); caption.className = 'level-caption';
    caption.textContent = `${i + 1} ${LEVELS[i].title}`;
    const achievement = document.createElement('span'); achievement.className = 'level-achievement';
    achievement.textContent = done ? '✓' : ''; achievement.setAttribute('aria-hidden','true');
    el.replaceChildren(caption, achievement);
    el.setAttribute('aria-label', `${i + 1}曲目 ${LEVELS[i].title}${done ? ' 達成済み' : ''}`);
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
        if(!event.detail)effects.touch(el);
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
  $('gem-stage').classList.toggle('is-awakened', awakened);
  gems.forEach(el=>{if(!awakened){const svg=el.querySelector('.gem-face');svg.innerHTML=gemFaces(svg.dataset.color);svg.dataset.angle='0';}});
  gemVisuals.sync();
  controls(); layout(); soundSettings();
  $('feedback').textContent = feedback || (state.solved.includes(current.id) ? 'この曲はよみがえりました。何度でも聴いて遊べます。' : current.subtitle);
  $('feedback').className = `feedback ${feedbackKind}`;
  $('next').hidden = !(state.solved.includes(current.id) && state.levelIndex < LEVELS.length - 1);
  if (lastPlaying) updatePlayback(lastPlaying);
}
function pointerDown(event,id) {
  if(event.button!==0||drag)return;
  suppressClickUntil=0;
  effects.touch(event.currentTarget);
  const rect=event.currentTarget.getBoundingClientRect();
  drag={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,grabX:event.clientX-(rect.left+rect.width/2),grabY:event.clientY-(rect.top+rect.height/2),base:puzzle(),el:event.currentTarget,isDragging:false,target:{kind:'cancel'},width:$('gem-stage').clientWidth,height:$('gem-stage').clientHeight,viewportWidth:innerWidth,viewportHeight:innerHeight};
  event.currentTarget.setPointerCapture(event.pointerId);
}
function pointerTarget(event,gesture) {
  const stage=$('gem-stage'),rect=stage.getBoundingClientRect(),g=boardGeometry();
  return {g,target:dropTarget(event.clientX-rect.left-stage.clientLeft-gesture.grabX,event.clientY-rect.top-stage.clientTop-gesture.grabY,g)};
}
function geometryChanged(gesture){
  return gesture.width!==$('gem-stage').clientWidth||gesture.height!==$('gem-stage').clientHeight||gesture.viewportWidth!==innerWidth||gesture.viewportHeight!==innerHeight;
}
function pointerMove(event) {
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(geometryChanged(drag)){cancelDrag();return;}
  if(!drag.isDragging&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<8)return;
  if(!drag.isDragging){
    drag.isDragging=true;active=drag.id;guide.preview();renderGuide();player.stop();controls();
    drag.el.classList.add('is-dragging');$('gem-stage').classList.add('is-dragging');
    status(`${name(drag.id)} を移動中。近づくと吸着。`);
  }
  event.preventDefault();
  const {g,target}=pointerTarget(event,drag);drag.target=target;
  layout(applyDrop(drag.base,drag.id,target,g),magnetPoint(target,g));
}
function endDrag(restore=true) {
  const ended=drag;drag=null;if(!ended)return;
  ended.el.classList.remove('is-dragging');
  if(ended.el.hasPointerCapture(ended.pointerId))ended.el.releasePointerCapture(ended.pointerId);
  $('gem-stage').classList.remove('is-dragging');
  if(restore)layout();
  return ended;
}
function cancelDrag() {
  effects.clear();
  const ended=endDrag();
  if(ended?.isDragging){suppressClickUntil=performance.now()+250;status('移動を取り消しました。');}
}
function pointerUp(event) {
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(geometryChanged(drag)){cancelDrag();return;}
  const {g,target}=pointerTarget(event,drag),ended=endDrag(false);
  if(!ended.isDragging)return;
  suppressClickUntil=performance.now()+250;
  const next=applyDrop(ended.base,ended.id,target,g);
  commit(next,target.kind==='socket' ? `${name(ended.id)} が ${target.index+1} 番目にはまりました。` : `${name(ended.id)} をここに置きました。`,{id:ended.id,socket:target.kind==='socket'});
}
function put(index) {
  if (active) commit(place(puzzle(), active, index), `${name(active)} を ${index + 1} 番目へ。`,{id:active,socket:true});
}
function moveActive(delta) {
  const index=puzzle().slots.indexOf(active);
  if(index>=0&&index+delta>=0&&index+delta<puzzle().slots.length)put(index+delta);
  else if(index<0)nudge(delta*16,0);
}
function nudge(dx,dy) {
  if(!active)return;
  const g=boardGeometry(),point=gemPoint(puzzle(),active,g),next=clampPoint(point.x+dx,point.y+dy,g);
  commit(moveFree(puzzle(),active,{x:next.x/g.width,y:next.y/g.height}),`${name(active)} を自由に移動。数字で台座へ。`,{id:active,socket:false});
}
function returnActive() {
  const index=puzzle().slots.indexOf(active);
  if(index>=0){const g=boardGeometry(),point=clampPoint(g.x(index),g.socketY+64,g);commit(moveFree(puzzle(),active,{x:point.x/g.width,y:point.y/g.height}),`${name(active)} を台座から外しました。`,{id:active,socket:false});}
}
function gemKey(event,id) {
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(/^[1-4]$/.test(event.key)&&Number(event.key)<=puzzle().slots.length){
    event.preventDefault();event.stopPropagation();active=id;put(Number(event.key)-1);
  }else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();active=id;
    if(event.shiftKey&&['ArrowLeft','ArrowRight'].includes(event.key))moveActive(event.key==='ArrowLeft'?-1:1);
    else nudge(event.key==='ArrowLeft'?-16:event.key==='ArrowRight'?16:0,event.key==='ArrowUp'?-16:event.key==='ArrowDown'?16:0);
  }else if(event.key==='Delete'||event.key==='Backspace'){
    event.preventDefault();active=id;returnActive();
  }
}
function playOrder() {
  effects.clear();
  const ids = puzzle().slots.filter(Boolean), complete = awakened && evaluate(level(), puzzle().slots) === 'correct';
  if (ids.length) player.play(level(), ids, { rich: complete, immersive: complete, label: complete ? '完成した曲を再生中' : '置いた宝石を左から再生中' });
}
function check() {
  effects.clear();player.stop();
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
$('reference').addEventListener('click', async () => {
  effects.clear(); guideError=false; renderGuide();
  const started=await player.play(level(), solution(level()), {rich:level().instrument==='musicbox',label:'お手本を再生中',revealFragments:false});
  if(started)guide.started(!state.muted&&state.volume>0);
  else guideError=true;
  renderGuide();
});
$('guide-dismiss').addEventListener('click',()=>{const target=guide.step==='stones'?guideGem():$('reference');guide.skip();renderGuide();target?.focus({preventScroll:true});});
$('guide-again').addEventListener('click',()=>{guide.reopen();guideError=false;renderGuide();$('reference').scrollIntoView({block:'center'});$('reference').focus({preventScroll:true});});
$('place-active').addEventListener('click',()=>{if(!active)return;const g=boardGeometry(),point=gemPoint(puzzle(),active,g);const empty=puzzle().slots.map((id,i)=>id?null:i).filter(i=>i!==null).sort((a,b)=>Math.abs(g.x(a)-point.x)-Math.abs(g.x(b)-point.x));if(empty.length)put(empty[0]);});
$('move-left').addEventListener('click', () => moveActive(-1));
$('move-right').addEventListener('click', () => moveActive(1));
$('return-active').addEventListener('click', returnActive);
$('gem-stage').addEventListener('pointerdown',()=>{suppressClickUntil=0;},{capture:true});
$('gem-stage').addEventListener('click',event=>{if(!active||event.target.closest('.gem')||performance.now()<suppressClickUntil)return;const stage=$('gem-stage'),rect=stage.getBoundingClientRect(),g=boardGeometry(),target=dropTarget(event.clientX-rect.left-stage.clientLeft,event.clientY-rect.top-stage.clientTop,g);commit(applyDrop(puzzle(),active,target,g),target.kind==='socket'?`${name(active)} を ${target.index+1} 番目へ。`:`${name(active)} をここに置きました。`,{id:active,socket:target.kind==='socket'});});
$('play-order').addEventListener('click', playOrder);
$('check').addEventListener('click', check);
for (const id of ['stop', 'room-stop']) $(id).addEventListener('click', () => {effects.clear();player.stop();});
$('listening-room').addEventListener('cancel', event => { event.preventDefault(); effects.clear();player.stop(); });
$('shuffle').addEventListener('click', () => { active=null;state.solved=state.solved.filter(id=>id!==level().id);commit(newPuzzle(level(),Math.random,puzzle().tray),'台座を空にしてシャッフルしました。'); });
$('clear').addEventListener('click',()=>{cancelDrag();const g=boardGeometry();let next=puzzle();next.slots.forEach((id,i)=>{if(id){const point=clampPoint(g.x(i),g.socketY+64,g);next=moveFree(next,id,{x:point.x/g.width,y:point.y/g.height});}});commit(next,'すべての宝石を台座から外しました。');});
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
  if (event.key === 'Escape') { event.preventDefault(); if (drag) cancelDrag(); else {effects.clear();player.stop();} }
  else if (active && /^[1-4]$/.test(event.key) && Number(event.key) <= puzzle().slots.length) { event.preventDefault(); put(Number(event.key) - 1); }
  else if (event.key.toLowerCase() === 'p') { event.preventDefault(); playOrder(); }
  else if (event.key.toLowerCase() === 's') { event.preventDefault(); effects.clear();player.stop(); }
  else if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleMute(); }
});
document.addEventListener('visibilitychange', () => { document.body.classList.toggle('is-background',document.hidden); if (document.hidden) { cancelDrag(); player.background(); persist(); } });
window.addEventListener('pagehide', () => { cancelDrag(); player.background(); persist(); });
window.addEventListener('resize',()=>{effects.clear();if(drag)cancelDrag();layout();});
new ResizeObserver(()=>{effects.clear();if(drag)cancelDrag();layout();}).observe($('gem-stage'));
render();
persist(); // Replace legacy placement snapshots with this fresh session once.
