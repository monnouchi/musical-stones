// Original compositions for this prototype; no samples or quotations.
// n(midi, beat, duration) describes an oscillator note, not sheet-music UI.
const n = (midi, beat, duration, velocity = 1) => ({ midi, beat, duration, velocity });
const h = (beat, chord, bass) => ({ beat, chord, bass });
const phrase = (id, notes, harmony, ornaments = []) => ({ id, notes, harmony, ornaments });

// Write complete tunes in measures, then cut only at phrase boundaries.
const measure = (chord, bass, notes) => ({ chord, bass, notes });
const compose = (meter, bars) => ({
  notes: bars.flatMap((bar,i) => bar.notes.map(note => ({...note,beat:i*meter+note.beat}))),
  harmony: bars.map((bar,i) => h(i*meter,bar.chord,bar.bass)),
});
function splitComposition(song, ids, beats) {
  return ids.map((id,i) => {
    const start=i*beats,end=start+beats;
    return phrase(id,song.notes.filter(note=>note.beat>=start&&note.beat<end).map(note=>({...note,beat:note.beat-start})),
      song.harmony.filter(change=>change.beat>=start&&change.beat<end).map(change=>({...change,beat:change.beat-start})));
  });
}

// G major, twelve clear 2/4 bars: call, higher reply, and returning refrain.
// B-D-B is the seed; the two eighths sit inside beat 2, never across a downbeat.
const crystal = compose(2,[
  measure([62,67,71],55,[n(71,0,.86,.90),n(74,1,.43,.78),n(71,1.5,.39,.73)]),
  measure([60,64,67],48,[n(72,0,.86,.88),n(76,1,.74,.79)]),
  measure([62,67,71],55,[n(71,0,.86,.89),n(74,1,.43,.78),n(71,1.5,.39,.73)]),
  measure([60,66,69],50,[n(69,0,.86,.84),n(66,1,.72,.72)]),
  measure([62,67,71],55,[n(67,0,.86,.88),n(71,1,.43,.79),n(74,1.5,.39,.75)]),
  measure([60,66,69],50,[n(76,0,.86,.91),n(78,1,.74,.83)]),
  measure([62,67,71],55,[n(79,0,.86,.98),n(78,1,.43,.81),n(76,1.5,.39,.75)]),
  measure([60,66,69],50,[n(74,0,.86,.85),n(72,1,.72,.72)]),
  measure([62,67,71],55,[n(71,0,.86,.88),n(74,1,.43,.77),n(71,1.5,.39,.73)]),
  measure([60,64,67],45,[n(72,0,.86,.84),n(69,1,.74,.74)]),
  measure([60,66,69],50,[n(74,0,.86,.86),n(66,1,.72,.71)]),
  measure([62,67,71],55,[n(67,0,1.45,.86)]),
]);

// D minor, eight 3/4 bars. D-F-E becomes D-E-F, then E-G-F.
// A7 supplies C-sharp: the opening question and final cadence resolve to D.
const moon = compose(3,[
  measure([62,65,69],50,[n(74,0,.86,.88),n(77,1,.84,.78),n(76,2,.74,.72)]),
  measure([61,64,67],45,[n(74,0,1.72,.83),n(73,2,.72,.72)]),
  measure([62,65,69],46,[n(74,0,.86,.88),n(76,1,.84,.80),n(77,2,.74,.76)]),
  measure([62,65,70],43,[n(79,0,1.74,.96),n(77,2,.72,.78)]),
  measure([62,67,70],52,[n(76,0,.86,.87),n(79,1,.84,.79),n(77,2,.74,.74)]),
  measure([62,65,70],43,[n(74,0,1.72,.81),n(70,2,.72,.70)]),
  measure([61,64,67],45,[n(73,0,.86,.84),n(76,1,.84,.75),n(73,2,.74,.70)]),
  measure([62,65,69],50,[n(74,0,2.25,.85)]),
]);

export const LEVELS = [
  {
    id:'sprout',title:'芽吹く光',subtitle:'小さな呼びかけに、返事が戻る。',
    description:'同じ小さな音の形が、姿を変えて戻ってきます。呼びかけと返事を聴き比べよう。',
    hint:'高い音へ問いかける終わりから、その音を受け止める返事へ。最後はゆっくり落ち着きます。',
    bpm:96,beats:12,meter:3,key:'C major',instrument:'musicbox',tail:1.65,
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
    id:'walk',title:'水晶のこだま',subtitle:'澄んだ呼びかけが、明るく返る。',
    description:'3つのかけら。ふたつの拍に乗った呼びかけと、高い返事、戻ってくる音の形。',
    hint:'短い呼びかけから、高い返事へ。同じ音の形が戻り、最後に落ち着きます。',
    bpm:108,beats:8,meter:2,key:'G major',instrument:'musicbox',tail:1.65,
    fragments:splitComposition(crystal,['w-sand','w-cloud','w-reed'],8),
  },
  {
    id:'lantern',title:'月影の祈り',subtitle:'静かな問いが、月明かりへほどける。',
    description:'4つのかけら。ゆっくりした3拍子の問いかけ、応答、影を帯びた変奏、静かな終わり。',
    hint:'問いかけの音が返事へほどけ、高い景色を通って、最後に同じ場所へ戻ります。',
    bpm:88,beats:6,meter:3,key:'D minor',instrument:'musicbox',tail:1.65,
    fragments:splitComposition(moon,['l-moss','l-rain','l-fern','l-shell'],6),
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
  for(let bar=0;bar<level.beats;bar+=level.meter){
    for(const offset of rich?Array.from({length:level.meter-1},(_,i)=>i+1):[1]){
      const at=bar+offset,change=harmonies.filter(h=>h.beat<=at).at(-1);
      const tones=rich?change.chord.slice(offset===1?0:1,offset===1?2:3):[change.chord[1]];
      tones.forEach((midi,j)=>events.push({midi,at:(base+at+j*.045)*beatSeconds,length:.28*beatSeconds,voice:rich?'arp':'pad',timbre:'musicboxSoft',velocity:offset===1?.66:.50,fragment:fragment.id}));
    }
  }
}
