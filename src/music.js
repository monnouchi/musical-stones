// Original compositions for this prototype; no samples or quotations.
// n(midi, beat, duration) describes an oscillator note, not sheet-music UI.
const n = (midi, beat, duration, velocity = 1) => ({ midi, beat, duration, velocity });
const phrase = (id, notes, chord, bass) => ({ id, notes, chord, bass });

export const LEVELS = [
  {
    id: 'sprout', title: 'ひとつの芽', subtitle: 'まずは、はじまりと終わり。',
    description: '2つのかけら。呼びかける音と、ほっと落ち着く音を聴き分けよう。',
    hint: '上にのぼる呼びかけから、ゆっくり落ち着く返事へ。お手本と聴き比べてみよう。',
    bpm: 100, beats: 4,
    fragments: [
      phrase('s-kite', [n(60,0,.7),n(64,1,.7),n(67,2,.7),n(69,3,.8)], [60,64,67], 48),
      phrase('s-pebble', [n(67,0,.7),n(64,1,.7),n(62,2,.5),n(60,2.75,1.1)], [60,64,67], 48),
    ],
  },
  {
    id: 'walk', title: '窓辺のさんぽ', subtitle: 'つづきの音を、さがして。',
    description: '3つのかけら。短い呼びかけが、少しずつ遠くへ歩いていきます。',
    hint: '小さな呼びかけ、いちばん高いところ、帰り道。最後の長い音の余韻にも耳をすませよう。',
    bpm: 112, beats: 6,
    fragments: [
      phrase('w-sand', [n(64,0,.45),n(67,.75,.45),n(64,1.5,.9),n(62,3,.7),n(64,4,.6),n(67,5,.8)], [60,64,67], 48),
      phrase('w-cloud', [n(69,0,.45),n(72,.75,.45),n(69,1.5,.9),n(67,3,.7),n(69,4,.6),n(71,5,.8)], [57,60,64], 45),
      phrase('w-reed', [n(72,0,.7),n(71,1,.6),n(67,2,.7),n(64,3,.7),n(60,4,1.8)], [60,64,67], 48),
    ],
  },
  {
    id: 'lantern', title: '灯りの帰り道', subtitle: '4つの景色を、一曲に。',
    description: '4つのかけら。似たリズムの中にある、音の高さと行き先を聴いてみよう。',
    hint: '呼びかけの音型が高くなり、いちばん高い音から下って、最後に落ち着きます。迷ったらお手本へ。',
    bpm: 120, beats: 8,
    fragments: [
      phrase('l-moss', [n(60,0,.45),n(64,.75,.45),n(67,1.5,1),n(64,3,.7),n(62,4,.45),n(64,4.75,.45),n(67,5.5,1),n(69,7,.8)], [60,64,67], 48),
      phrase('l-rain', [n(69,0,.45),n(72,.75,.45),n(76,1.5,1),n(72,3,.7),n(69,4,.45),n(71,4.75,.45),n(72,5.5,1),n(74,7,.8)], [57,60,64], 45),
      phrase('l-fern', [n(76,0,1.4),n(74,2,.7),n(72,3,.7),n(71,4,1.4),n(69,6,.7),n(67,7,.8)], [53,57,60], 41),
      phrase('l-shell', [n(65,0,.7),n(64,1,.7),n(62,2,1.6),n(67,4,.7),n(64,5,.7),n(60,6,1.8)], [60,64,67], 48),
    ],
  },
];

export function timeline(level, ids, rich = false) {
  const secondsPerBeat = 60 / level.bpm;
  const events = [];
  ids.forEach((id, index) => {
    const fragment = level.fragments.find(f => f.id === id);
    if (!fragment) throw new Error('Unknown fragment');
    const base = index * level.beats;
    for (const note of fragment.notes) events.push({ ...note, at: (base + note.beat) * secondsPerBeat, length: note.duration * secondsPerBeat, voice: 'melody', fragment: id });
    for (let b = 0; b < level.beats; b += 2) events.push({ midi: fragment.bass, at: (base + b) * secondsPerBeat, length: 1.6 * secondsPerBeat, voice: 'bass', velocity: .8, fragment: id });
    if (rich) {
      fragment.chord.forEach((midi, j) => events.push({ midi, at: (base + j * .045) * secondsPerBeat, length: (level.beats - .25) * secondsPerBeat, voice: 'pad', velocity: .65, fragment: id }));
      for (let b = .5; b < level.beats; b += 1) events.push({ midi: fragment.chord[Math.floor(b) % 3] + 12, at: (base + b) * secondsPerBeat, length: .25 * secondsPerBeat, voice: 'spark', velocity: .5, fragment: id });
    }
  });
  return { events, duration: ids.length * level.beats * secondsPerBeat, fragmentDuration: level.beats * secondsPerBeat };
}
