// Brief, bounded feedback for physical interaction; never inspects the answer.
export class MagicEffects {
  constructor(stage) {
    this.stage=stage;
    this.layer=document.createElement('div');this.layer.id='magic-layer';this.layer.className='magic-layer';this.layer.setAttribute('aria-hidden','true');stage.append(this.layer);
    this.items=new Map();this.glows=new Map();this.limit=18;
    this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.motion.addEventListener('change',()=>this.clear());
  }
  point(el) {
    return {x:parseFloat(el.style.left),y:parseFloat(el.style.top)-9};
  }
  glow(el, socket=false) {
    const previous=this.glows.get(el);if(previous)clearTimeout(previous);
    el.classList.add('has-magic');
    if(socket&&!this.motion.matches)el.classList.add('just-snapped');
    const timer=setTimeout(()=>{el.classList.remove('has-magic','just-snapped');this.glows.delete(el);},this.motion.matches?180:450);
    this.glows.set(el,timer);
  }
  keep(el, animations, duration) {
    while(this.items.size>=this.limit)this.remove(this.items.keys().next().value);
    const timer=setTimeout(()=>this.remove(el),duration+40);
    this.items.set(el,{animations,timer});this.layer.append(el);
  }
  remove(el) {
    const item=this.items.get(el);if(!item)return;
    clearTimeout(item.timer);item.animations.forEach(a=>a.cancel());el.remove();this.items.delete(el);
  }
  sparks(point,count=3) {
    for(let i=0;i<count;i++) {
      const el=document.createElement('span');el.className='magic-spark';
      el.style.left=`${point.x}px`;el.style.top=`${point.y}px`;
      const angle=(i*2*Math.PI/count)-Math.PI/2,distance=22+i*4,duration=360+i*55;
      const animation=el.animate([{transform:'translate(-50%,-50%) scale(.5)',opacity:.9},{transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px),calc(-50% + ${Math.sin(angle)*distance}px)) scale(.1)`,opacity:0}],{duration,easing:'ease-out',fill:'forwards'});
      this.keep(el,[animation],duration);
    }
  }
  touch(el) {
    if(!el)return;this.glow(el);
    if(!this.motion.matches)this.sparks(this.point(el));
  }
  land(el,socket=false) {
    if(!el)return;this.glow(el,socket);
    if(this.motion.matches)return;
    const point=this.point(el);this.sparks(point);
    if(!socket)return;
    const ring=document.createElement('span');ring.className='magic-ripple';ring.style.left=`${point.x}px`;ring.style.top=`${point.y}px`;
    const animation=ring.animate([{transform:'translate(-50%,-50%) scale(.55)',opacity:.8},{transform:'translate(-50%,-50%) scale(1.65)',opacity:0}],{duration:600,easing:'ease-out',fill:'forwards'});
    this.keep(ring,[animation],600);
    const paths=[...this.stage.querySelectorAll('.light-link:not(.is-preview)')];
    if(!paths.length)return;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('magic-flow');svg.setAttribute('viewBox',this.stage.querySelector('#connections').getAttribute('viewBox'));
    const animations=paths.map(source=>{
      const path=source.cloneNode(false);path.setAttribute('class','magic-flow-path');svg.append(path);
      const length=source.getTotalLength();path.style.strokeDasharray=`${length*.25} ${length*.75}`;
      return path.animate([{strokeDashoffset:String(length),opacity:0},{strokeDashoffset:String(length*.8),opacity:1,offset:.15},{strokeDashoffset:'0',opacity:0}],{duration:620,easing:'ease-in-out',fill:'forwards'});
    });
    this.keep(svg,animations,620);
  }
  clear() {
    [...this.items.keys()].forEach(el=>this.remove(el));
    for(const [el,timer] of this.glows){clearTimeout(timer);el.classList.remove('has-magic','just-snapped');}
    this.glows.clear();
  }
}
