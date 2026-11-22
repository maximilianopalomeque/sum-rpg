import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../engine.js';
import {paint,paintGallery,resetScene,layout} from '../art.js';
import {icon} from '../icons.js';

function mockCtx(w,h){ let calls=0; return {canvas:{width:w,height:h},globalAlpha:1,fillStyle:'',fillRect(){calls++;},get calls(){return calls;}}; }
const frames=(ctx,s,n,opt={})=>{ for(let i=0;i<n;i++) paint(ctx,s,{dt:1/60,...opt}); };

for(const [w,h] of [[320,180],[195,422],[338,279]]){
 test(`scene renders a whole run at ${w}x${h} without errors`,()=>{
  resetScene(); const ctx=mockCtx(w,h), s=engine.initial(); frames(ctx,s,3); engine.begin(s,()=>.5); frames(ctx,s,90);
  while(s.phase!=='won'){
   if(s.phase==='battle'){ engine.answer(s,s.question.answer); frames(ctx,s,40); if(s.phase==='feedback'){ engine.next(s,()=>.5); } }
   if(s.phase==='upgrade'){ frames(ctx,s,100); engine.choose(s,s.choices[0],()=>.5); frames(ctx,s,70); engine.answer(s,-1); frames(ctx,s,60); if(s.phase==='feedback') engine.next(s,()=>.5); }
  }
  frames(ctx,s,240); assert.ok(ctx.calls>10000);
  // death path, frozen and armed states, pause and reduced motion
  const d=engine.initial(); d.powers=['freeze','charge','shield']; d.charge=4; engine.begin(d,()=>.5); frames(ctx,d,10); engine.freeze(d); engine.arm(d); frames(ctx,d,60,{reduced:true}); frames(ctx,d,10,{paused:true});
  while(d.phase!=='dead'){ engine.answer(d,-1); frames(ctx,d,40); if(d.phase==='feedback') engine.next(d,()=>.5); }
  frames(ctx,d,200);
 });
}

test('layout keeps both fighters on screen and the gallery draws every actor',()=>{
 for(const [w,h] of [[320,180],[195,422],[480,200]]){ const L=layout(w,h); assert.ok(L.px>20&&L.ex<w-20&&L.F<h); }
 const ctx=mockCtx(320,180); paintGallery(ctx,1.3); assert.ok(ctx.calls>2000);
});

test('pixel icons are crisp inline SVG',()=>{ const svg=icon('heart',16); assert.match(svg,/^<svg[^>]+crispEdges/); assert.ok((svg.match(/<rect/g)||[]).length>20); });
