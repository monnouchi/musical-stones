import { place, moveFree, worldPosition } from './game.js?v=0.4.5';

export function geometry(width, height, count, gemWidth=68, gemHeight=84) {
  return {width,height,count,socketY:height*.29,shelfY:height*.77,x:i=>(i+.5)*width/count,halfW:Math.min(width/2,gemWidth/2+3),halfH:Math.min(height/2,gemHeight/2+3),radiusX:Math.min(38,width/count*.44),radiusY:40};
}
export function clampPoint(x,y,g) {
  return {x:Math.max(g.halfW,Math.min(g.width-g.halfW,x)),y:Math.max(g.halfH,Math.min(g.height-g.halfH,y))};
}
export function dropTarget(x,y,g) {
  const point=clampPoint(x,y,g);
  if(x>=0&&x<=g.width&&y>=0&&y<=g.height) {
    const index=Math.max(0,Math.min(g.count-1,Math.floor(x/(g.width/g.count))));
    const distance=Math.hypot((x-g.x(index))/g.radiusX,(y-g.socketY)/g.radiusY);
    if(distance<=1) return {kind:'socket',index,point,distance};
  }
  return {kind:'free',point};
}
export function magnetPoint(target,g) {
  if(target.kind!=='socket') return target.point;
  const strength=Math.min(1,(1-target.distance)*2);
  return {x:target.point.x+(g.x(target.index)-target.point.x)*strength,y:target.point.y+(g.socketY-target.point.y)*strength};
}
export function gemPoint(puzzle,id,g) {
  const index=puzzle.slots.indexOf(id);
  if(index>=0) return {x:g.x(index),y:g.socketY};
  const point=worldPosition(puzzle,id);
  return clampPoint(point.x*g.width,point.y*g.height,g);
}
export function applyDrop(puzzle,id,target,g) {
  if(target.kind==='cancel')return puzzle;
  if(target.kind==='socket')return place(puzzle,id,target.index);
  if(target.kind==='free')return moveFree(puzzle,id,{x:target.point.x/g.width,y:target.point.y/g.height});
  return puzzle;
}
