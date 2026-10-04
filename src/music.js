// Original compositions for this prototype; no samples or quotations.
// n(midi, beat, duration) describes an oscillator note, not sheet-music UI.
const n = (midi, beat, duration, velocity = 1) => ({ midi, beat, duration, velocity });
const h = (beat, chord, bass) => ({ beat, chord, bass });
const phrase = (id, notes, harmony, ornaments = []) => ({ id, notes, harmony, ornaments });

export const LEVELS = [
  {
    id:'sprout',title:'ひとつの芽',subtitle:'小さな呼びかけに、返事が戻る。',
    description:'同じ小さな音の形が、姿を変えて戻ってきます。呼びかけと返事を聴き比べよう。',
    hint:'高い音へ問いかける終わりから、その音を受け止める返事へ。最後はゆっくり落ち着きます。',
    bpm:96,beats:12,meter:3,instrument:'musicbox',tail:1.65,
    fragments:[
      // Four bars written as a complete antecedent, not assembled from puzzle clips.
      // Motif M: E-G-A-G, two eighths opening into two quarters.
      // Bar 3 transposes M down a tone; bar 4 opens its last note toward the reply.
      phrase('s-kite',[
        n(76,0,.46,.86),n(79,.5,.46,.75),n(81,1,.90,.96),n(79,2,.82,.80),
        n(76,3,.90,.84),n(72,4,.46,.73),n(74,4.5,.46,.76),n(76,5,.82,.81),
        n(74,6,.46,.83),n(77,6.5,.46,.75),n(79,7,.90,.91),n(77,8,.82,.78),
        n(74,9,.46,.80),n(77,9.5,.46,.74),n(79,10,.90,.89),n(83,11,.86,.84)
      ],[h(0,[60,64,67],48),h(3,[60,64,67],45),h(6,[60,65,69],50),h(9,[59,62,65],43)]),
      // The reply resolves B to C at the summit, returns M verbatim, and cadences.
      phrase('s-pebble',[
        n(84,0,.46,.96),n(83,.5,.46,.81),n(81,1,.90,.88),n(79,2,.82,.78),
        n(76,3,.46,.84),n(79,3.5,.46,.75),n(81,4,.90,.92),n(79,5,.82,.79),
        n(77,6,.46,.79),n(76,6.5,.46,.72),n(74,7,.90,.81),n(71,8,.82,.70),
        n(72,9,2.5,.84)
      ],[h(0,[60,64,67],48),h(3,[60,64,67],45),h(6,[60,65,69],50),h(7.5,[59,62,65],43),h(9,[60,64,67],48)])
    ]
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
        [h(0,[64,67,71],60),h(2.5,[64,67,72],57),h(4,[65,69,72],50),h(6,[65,71,74],55)], [n(72,1.35,.18,.38),n(71,3.75,.18,.35)]),
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
    for (const note of fragment.notes) events.push({ ...note, at: (base + note.beat) * secondsPerBeat, length: note.duration * secondsPerBeat, voice: 'melody', ...(level.instrument==='musicbox'?{timbre:'musicbox'}:{}), fragment: id });
    const harmonies = fragment.harmony;
    if(level.instrument==='musicbox'){
      musicboxAccompaniment(events,fragment,base,level,secondsPerBeat,rich);
      return;
    }
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
  return { events, duration: ids.length * level.beats * secondsPerBeat, fragmentDuration: level.beats * secondsPerBeat, tailDuration: level.tail ?? (rich ? .85 : .15) };
}

function musicboxAccompaniment(events,fragment,base,level,beatSeconds,rich){
  const harmonies=fragment.harmony;
  harmonies.forEach((change,i)=>{
    const end=harmonies[i+1]?.beat??level.beats;
    events.push({midi:change.bass,at:(base+change.beat)*beatSeconds,length:Math.min(.65,end-change.beat-.18)*beatSeconds,voice:'bass',timbre:'musicboxBass',velocity:.74,fragment:fragment.id});
  });
  for(let bar=0;bar<level.beats;bar+=3){
    for(const offset of rich?[1,2]:[1]){
      const at=bar+offset,change=harmonies.filter(h=>h.beat<=at).at(-1);
      const tones=rich?change.chord.slice(offset===1?0:1,offset===1?2:3):[change.chord[1]];
      tones.forEach((midi,j)=>events.push({midi,at:(base+at+j*.045)*beatSeconds,length:.28*beatSeconds,voice:rich?'arp':'pad',timbre:'musicboxSoft',velocity:offset===1?.66:.50,fragment:fragment.id}));
    }
  }
}
