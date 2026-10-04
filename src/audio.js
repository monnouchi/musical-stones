import { timeline } from './music.js?v=0.4.5';

// A defined upper harmonic gives the lead presence on small speakers without
// increasing master volume. Chords and bass stay behind the melody.
export const VOICES = {
  melody: { peak: .13, attack: .009, decay: .09, sustain: .54, release: .10, partials: [1,.32,.14,.06,.025] },
  bass: { peak: .035, attack: .015, decay: .11, sustain: .26, release: .08, partials: [1,.42,.18] },
  pad: { peak: .025, attack: .085, decay: .13, sustain: .54, release: .12 },
  spark: { peak: .045, attack: .006, decay: .045, sustain: .18, release: .07 },
  arp: { peak: .035, attack: .012, decay: .06, sustain: .22, release: .12 },
  musicbox: {peak:.105,attack:.004,release:1.8,modes:[[1,1,.52],[2,.17,.24],[3,.06,.13],[4.05,.025,.07]]},
  musicboxSoft: {peak:.036,attack:.006,release:.9,modes:[[1,1,.32],[2,.14,.13],[4.05,.015,.06]]},
  musicboxBass: {peak:.034,attack:.007,release:.7,modes:[[1,1,.30],[2,.25,.16]]},
};

export class SoundPlayer {
  constructor({ contextFactory, onUpdate = () => {}, timers = globalThis } = {}) {
    this.contextFactory = contextFactory ?? (() => {
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) throw new Error('このブラウザーでは音を再生できません。Chrome / Safari などで開いてください。');
      return new AudioContextClass();
    });
    this.onUpdate = onUpdate;
    this.timers = timers;
    this.context = null;
    this.master = null;
    this.nodes = new Set();
    this.interval = null;
    this.generation = 0;
    this.volume = .65;
    this.muted = false;
    this.playing = false;
    this.waves = new Map();
  }
  setVolume(volume, muted = this.muted) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.context.currentTime, .015);
  }
  async ready() {
    if (!this.context) {
      this.context = this.contextFactory();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.context.destination);
      this.context.onstatechange = () => {
        if (this.playing && this.context.state !== 'running') this.stop('音が一時停止しました。再生ボタンでもう一度聴けます。');
      };
    }
    if (this.context.state !== 'running') await this.context.resume();
    if (this.context.state !== 'running') throw new Error('音声を開始できませんでした。再生ボタンをもう一度押してください。');
  }
  tone(event, start) {
    if(event.timbre?.startsWith('musicbox'))return this.bellTone(event,start);
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + event.at;
    const voice = VOICES[event.voice];
    const attack = Math.min(voice.attack, event.length / 4);
    const decayEnd = at + Math.min(event.length * .65, attack + voice.decay);
    const peak = voice.peak * event.velocity;
    oscillator.type = 'triangle';
    if (voice.partials && ctx.createPeriodicWave && oscillator.setPeriodicWave) {
      if (!this.waves.has(event.voice)) {
        const real = new Float32Array(voice.partials.length + 1);
        const imaginary = new Float32Array([0, ...voice.partials]);
        this.waves.set(event.voice, ctx.createPeriodicWave(real, imaginary));
      }
      oscillator.setPeriodicWave(this.waves.get(event.voice));
    }
    oscillator.frequency.value = 440 * 2 ** ((event.midi - 69) / 12);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, peak * voice.sustain), decayEnd);
    gain.gain.setValueAtTime(Math.max(.0001, peak * voice.sustain), at + event.length);
    gain.gain.exponentialRampToValueAtTime(.0001, at + event.length + voice.release);
    gain.gain.linearRampToValueAtTime(0, at + event.length + voice.release + .012);
    oscillator.connect(gain);
    gain.connect(this.master);
    const node = { oscillator, gain };
    this.nodes.add(node);
    oscillator.onended = () => {
      oscillator.disconnect(); gain.disconnect(); this.nodes.delete(node);
    };
    oscillator.start(at);
    oscillator.stop(at + event.length + voice.release + .025);
  }
  bellTone(event,start) {
    const ctx=this.context,voice=VOICES[event.timbre],at=start+event.at;
    const root=440*2**((event.midi-69)/12);
    for(const [ratio,weight,decay] of voice.modes){
      const oscillator=ctx.createOscillator(),gain=ctx.createGain();
      const peak=voice.peak*weight*event.velocity;
      const length=ratio===1?event.length+voice.release:Math.min(event.length+voice.release,decay*7);
      oscillator.type='sine';oscillator.frequency.value=root*ratio;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+voice.attack);
      gain.gain.exponentialRampToValueAtTime(Math.max(.00001,peak*Math.exp(-(length-voice.attack)/decay)),at+length);
      gain.gain.linearRampToValueAtTime(0,at+length+.04);
      oscillator.connect(gain);gain.connect(this.master);
      const node={oscillator,gain};this.nodes.add(node);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.nodes.delete(node);};
      oscillator.start(at);oscillator.stop(at+length+.05);
    }
  }
  async play(level, ids, { rich = false, label = '再生中', revealFragments = true, immersive = false } = {}) {
    this.stop();
    if (!ids.length) return false;
    const generation = this.generation;
    try {
      await this.ready();
      if (generation !== this.generation) return false;
      const score = timeline(level, ids, rich);
      const duration = score.duration + score.tailDuration;
      const start = this.context.currentTime + .045;
      for (const event of score.events) this.tone(event, start);
      this.playing = true;
      const update = () => {
        if (generation !== this.generation) return;
        const elapsed = Math.max(0, this.context.currentTime - start);
        if (elapsed >= duration + .12) { this.stop('再生がおわりました。'); return; }
        const index = Math.min(ids.length - 1, Math.floor(elapsed / score.fragmentDuration));
        this.onUpdate({ playing: true, label, fraction: Math.min(1, elapsed / duration), id: revealFragments ? ids[index] : null, index, elapsed, duration, immersive });
      };
      update();
      this.interval = this.timers.setInterval(update, 45);
      return true;
    } catch (error) {
      if (generation === this.generation) this.stop(error.message || '音声を開始できませんでした。もう一度お試しください。');
      return false;
    }
  }
  stop(label = '停止しました。') {
    this.generation++;
    this.playing = false;
    if (this.interval !== null) this.timers.clearInterval(this.interval);
    this.interval = null;
    for (const { oscillator, gain } of this.nodes) {
      try {
        const now = this.context.currentTime;
        if (gain.gain.cancelAndHoldAtTime) gain.gain.cancelAndHoldAtTime(now);
        else { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); }
        gain.gain.linearRampToValueAtTime(0, now + .018);
        oscillator.stop(now + .022);
      } catch { /* already ended */ }
    }
    this.nodes.clear();
    this.onUpdate({ playing: false, label, fraction: 0, id: null });
  }
  background() {
    this.stop('画面を離れたため停止しました。再生ボタンで続けられます。');
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }
}
