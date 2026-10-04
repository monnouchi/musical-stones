import { LEVELS } from '../src/music.js?v=0.4.5';
const descriptions={
 sprout:{key:'ハ長調',words:'小さな音の形が姿を変え、高い返事として戻る。芽が光へ伸びるような曲。'},
 walk:{key:'ト長調',words:'はっきりした2拍の上で、短い呼びかけが高く返り、同じ形で戻る。水晶の澄んだこだま。'},
 lantern:{key:'ニ短調',words:'静かな問いから、影を帯びた応答へ。ゆっくりした3拍に乗り、最後は同じ場所へ帰る祈り。'},
};
const audios=[];
let volume=.65,muted=false;
function stop(audio,reset=false){audio.pause();if(reset)audio.currentTime=0;}
function stopAll(reset=false){audios.forEach(a=>stop(a,reset));}
for(const [i,level] of LEVELS.entries()){
 const info=descriptions[level.id],card=document.createElement('section');card.className='sample';card.dataset.song=level.id;
 card.innerHTML=`<div class="sample-head"><h2>${i+1} ${level.title}</h2><span>${info.key} · ${level.meter}拍子 · ${level.bpm} BPM</span></div><p>${info.words}</p><div class="sample-controls"><button class="sample-play primary-button" type="button">▷ 曲全体を聴く</button><button class="sample-stop quiet-button" type="button">停止</button></div><audio controls preload="metadata" aria-label="${level.title}の完成曲"><source src="./${level.id}-musicbox.wav" type="audio/wav"></audio><p class="audio-status" role="status">再生ボタンで聴けます。</p><a href="./${level.id}-musicbox.wav" download>WAVを保存</a>`;
 document.getElementById('samples').append(card);
 const a=card.querySelector('audio'),status=card.querySelector('.audio-status');a.volume=volume;audios.push(a);
 card.querySelector('.sample-play').addEventListener('click',()=>{if(a.ended)a.currentTime=0;a.play().catch(()=>status.textContent='再生ボタンでもう一度聴けます。');});
 card.querySelector('.sample-stop').addEventListener('click',()=>{stop(a,true);status.textContent='停止しました。';});
 a.addEventListener('play',()=>{audios.forEach(other=>{if(other!==a)stop(other);});status.textContent=`${level.title}を再生中。`;});
 a.addEventListener('pause',()=>{status.textContent=a.ended?'曲が終わりました。もう一度聴けます。':'停止しました。';});
 a.addEventListener('ended',()=>status.textContent='曲が終わりました。もう一度聴けます。');
 a.addEventListener('error',()=>status.textContent='音声を読み込めませんでした。ページを開き直してください。');
}
document.getElementById('stop-all').addEventListener('click',()=>stopAll(true));
document.getElementById('sample-volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;audios.forEach(a=>a.volume=volume);});
document.getElementById('sample-mute').addEventListener('click',e=>{muted=!muted;audios.forEach(a=>a.muted=muted);e.currentTarget.textContent=muted?'消音中':'音あり';e.currentTarget.setAttribute('aria-pressed',String(muted));});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
window.addEventListener('pagehide',()=>stopAll());
