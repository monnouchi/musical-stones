// Original compositions for this prototype; no samples or quotations.
// n(midi, beat, duration) describes an oscillator note, not sheet-music UI.
const n = (midi, beat, duration, velocity = 1) => ({ midi, beat, duration, velocity });
const h = (beat, chord, bass) => ({ beat, chord, bass });
const phrase = (id, notes, harmony, ornaments = []) => ({ id, notes, harmony, ornaments });

export const LEVELS = [
  {
    id: 'sprout', title: 'ひとつの芽', subtitle: 'まずは、はじまりと終わり。',
    description: '2つのかけら。呼びかける音と、ほっと落ち着く音を聴き分けよう。',
    hint: '上にのぼる呼びかけから、ゆっくり落ち着く返事へ。お手本と聴き比べてみよう。',
    bpm: 108, beats: 8,
    fragments: [
      // The original C-E-G-A seed now breathes, then leans into the reply.
      phrase('s-kite', [n(72,0,.42,.78),n(76,.75,.42,.88),n(79,1.5,1.02),n(76,3,.32,.72),n(79,3.5,.35,.86),n(81,4.25,1.08,.94),n(79,5.75,.4,.78),n(74,6.5,.42,.74),n(71,7.25,.52,.8)],
        [h(0,[64,67,69],60),h(4,[64,69,72],53),h(6,[65,67,71],55)], [n(76,2.75,.18,.45),n(77,5.5,.18,.4)]),
      // The boundary resolves B to C before the original descending reply.
      phrase('s-pebble', [n(72,0,.28,.8),n(79,.5,.28,.88),n(76,1,.35,.79),n(74,1.75,.95,.86),n(76,3,.35,.7),n(72,3.75,.65,.76),n(74,4.75,.32,.74),n(76,5.25,.32,.8),n(71,5.75,.32,.7),n(72,6.5,1.2,.83)],
        [h(0,[64,67,72],60),h(2,[65,69,72],50),h(4,[65,71,74],55),h(6,[64,67,72],60)], [n(67,2.9,.16,.38)]),
    ],
  },
  {
    id: 'walk', title: '窓辺のさんぽ', subtitle: 'つづきの音を、さがして。',
    description: '3つのかけら。短い呼びかけが、少しずつ遠くへ歩いていきます。',
    hint: '小さな呼びかけ、いちばん高いところ、帰り道。最後の長い音の余韻にも耳をすませよう。',
    bpm: 112, beats: 6,
    fragments: [
      // Keep the E-G-E walking motif, with little rests and an answering lift.
      phrase('w-sand', [n(76,0,.4,.8),n(79,.75,.4,.91),n(76,1.5,.72,.86),n(74,3,.35,.72),n(76,3.5,.3,.78),n(79,4.25,.7,.92),n(76,5.25,.3,.74),n(77,5.75,.18,.68)],
        [h(0,[64,67,74],60),h(3,[64,69,72],53)], [n(72,2.5,.22,.42)]),
      phrase('w-cloud', [n(81,0,.4,.86),n(84,.75,.4),n(81,1.5,.75,.89),n(79,3,.32,.75),n(83,3.75,.4,.88),n(84,4.5,.65,.93),n(79,5.5,.28,.74)],
        [h(0,[64,67,71],57),h(3,[65,69,74],53),h(4.5,[65,71,74],55)], [n(76,2.5,.2,.4)]),
      phrase('w-reed', [n(84,0,.65,.95),n(83,.75,.4,.87),n(79,1.5,.5,.83),n(76,2.25,.35,.76),n(74,3,.65,.78),n(71,4,.35,.68),n(72,4.75,.95,.83)],
        [h(0,[64,69,72],53),h(1.5,[65,69,72],50),h(3,[65,71,74],55),h(4.5,[64,67,72],60)], [n(67,2.75,.15,.3)]),
    ],
  },
  {
    id: 'lantern', title: '灯りの帰り道', subtitle: '4つの景色を、一曲に。',
    description: '4つのかけら。似たリズムの中にある、音の高さと行き先を聴いてみよう。',
    hint: '呼びかけの音型が高くなり、いちばん高い音から下って、最後に落ち着きます。迷ったらお手本へ。',
    bpm: 112, beats: 8,
    fragments: [
      phrase('l-moss', [n(72,0,.42,.77),n(76,.75,.42,.86),n(79,1.5,.95,.94),n(76,3,.45,.78),n(74,4,.33,.72),n(76,4.5,.33,.8),n(79,5.25,.8,.9),n(81,6.5,.58,.94),n(83,7.25,.45,.84)],
        [h(0,[64,67,69],60),h(3,[64,67,71],52),h(4,[64,69,72],53),h(6,[65,71,74],55)], [n(74,2.75,.18,.4)]),
      phrase('l-rain', [n(81,0,.42,.89),n(84,.75,.8),n(83,2,.45,.9),n(81,2.75,.7,.84),n(79,4,.4,.76),n(81,4.75,.33,.85),n(84,5.75,.65,.97),n(83,7,.65,.86)],
        [h(0,[64,67,71],57),h(4,[64,69,72],53),h(6,[65,71,74],55)], [n(76,3.75,.17,.42)]),
      phrase('l-fern', [n(84,0,1.1),n(83,1.75,.55,.91),n(81,2.75,.8,.86),n(79,4,.5,.81),n(76,4.75,.5,.76),n(77,5.5,.5,.8),n(76,6.5,.5,.75),n(74,7.25,.45,.7)],
        [h(0,[64,67,71],52),h(2.5,[64,67,72],57),h(4,[65,69,72],50),h(6,[65,71,74],55)], [n(72,1.35,.18,.38),n(71,3.75,.18,.35)]),
      phrase('l-shell', [n(77,0,.65,.83),n(76,1,.45,.79),n(74,1.75,.8,.77),n(76,3,.32,.74),n(79,3.5,.55,.87),n(76,4.75,.4,.78),n(71,5.5,.3,.7),n(74,6,.25,.69),n(72,6.75,.95,.84)],
        [h(0,[64,69,72],53),h(2,[65,69,76],50),h(4,[65,71,74],55),h(6.5,[64,67,72],60)], [n(67,2.75,.18,.36)]),
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
    const harmonies = fragment.harmony;
    const bassBeats = [...new Set([...harmonies.map(change => change.beat), ...Array.from({length: Math.ceil(level.beats / 2)}, (_, i) => i * 2)])].sort((a,b) => a-b);
    for (let i = 0; i < bassBeats.length; i++) {
      const b = bassBeats[i];
      const active = harmonies.filter(change => change.beat <= b).at(-1);
      const until = bassBeats[i + 1] ?? level.beats;
      events.push({ midi: active.bass, at: (base + b) * secondsPerBeat, length: Math.min(1.3, until - b - .18) * secondsPerBeat, voice: 'bass', velocity: .72, fragment: id });
    }
    harmonies.forEach((change, i) => {
      const until = harmonies[i + 1]?.beat ?? level.beats;
      const finalRest = rich && index === ids.length - 1 && i === harmonies.length - 1 ? .85 : 0;
      change.chord.forEach((midi, j) => events.push({ midi, at: (base + change.beat + j * .025) * secondsPerBeat, length: Math.max(.2, until - change.beat - .3) * secondsPerBeat + finalRest, voice: 'pad', velocity: rich ? .55 : .34, fragment: id }));
      // Two quiet answering notes open up only in the completed arrangement.
      if (rich) [.32,.68].forEach((fraction, j) => events.push({midi: change.chord[j] + 12, at: (base + change.beat + (until - change.beat) * fraction) * secondsPerBeat, length: .2 * secondsPerBeat, voice: 'arp', velocity: .48, fragment: id}));
    });
    if (rich) for (const note of fragment.ornaments ?? []) events.push({ ...note, at: (base + note.beat) * secondsPerBeat, length: note.duration * secondsPerBeat, voice: 'spark', fragment: id });
  });
  return { events, duration: ids.length * level.beats * secondsPerBeat, fragmentDuration: level.beats * secondsPerBeat, tailDuration: rich ? .85 : .15 };
}
