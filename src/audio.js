import { timeline } from './music.js';

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
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + event.at;
    const attack = event.voice === 'pad' ? .09 : .012;
    const tail = event.voice === 'pad' ? .18 : .07;
    const peaks = { melody: .12, bass: .085, pad: .033, spark: .045 };
    oscillator.type = event.voice === 'bass' ? 'sine' : 'triangle';
    oscillator.frequency.value = 440 * 2 ** ((event.midi - 69) / 12);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peaks[event.voice] * event.velocity, at + attack);
    gain.gain.exponentialRampToValueAtTime(.001, at + Math.max(attack + .01, event.length));
    gain.gain.linearRampToValueAtTime(0, at + event.length + tail);
    oscillator.connect(gain);
    gain.connect(this.master);
    const node = { oscillator, gain };
    this.nodes.add(node);
    oscillator.onended = () => {
      oscillator.disconnect(); gain.disconnect(); this.nodes.delete(node);
    };
    oscillator.start(at);
    oscillator.stop(at + event.length + tail + .01);
  }
  async play(level, ids, { rich = false, label = '再生中', revealFragments = true } = {}) {
    this.stop();
    if (!ids.length) return false;
    const generation = this.generation;
    try {
      await this.ready();
      if (generation !== this.generation) return false;
      const score = timeline(level, ids, rich);
      const start = this.context.currentTime + .045;
      for (const event of score.events) this.tone(event, start);
      this.playing = true;
      const update = () => {
        if (generation !== this.generation) return;
        const elapsed = Math.max(0, this.context.currentTime - start);
        if (elapsed >= score.duration + .25) { this.stop('再生がおわりました。'); return; }
        const index = Math.min(ids.length - 1, Math.floor(elapsed / score.fragmentDuration));
        this.onUpdate({ playing: true, label, fraction: Math.min(1, elapsed / score.duration), id: revealFragments ? ids[index] : null, index, elapsed, duration: score.duration });
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
        gain.gain.cancelScheduledValues(this.context.currentTime);
        gain.gain.setValueAtTime(0, this.context.currentTime);
        oscillator.stop(this.context.currentTime);
        oscillator.disconnect(); gain.disconnect();
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
