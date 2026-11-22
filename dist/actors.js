// Characters, drawn from shaded parts so every limb can move on its own.
// Coordinates: x is the character's centre, y the floor under its feet.
import {OL} from './pixel.js';

const S0 = {lo:'#6f9886',base:'#b8d8ae',hi:'#eef8dc',deep:'#466c61',deepLo:'#2f4d47',scr:'#0e2429',glow:'#c9ffb2',dim:'#6fcf8f',amber:'#ffc66b',amberHi:'#ffe7a8',red:'#ff7d6b'};
const BODY=[S0.lo,S0.base,S0.hi], DEEP=[S0.deepLo,S0.deep,S0.lo];
const METAL=['#3d474c','#6c7a7f','#aebcbe'], DARK=['#161d20','#252f33','#3b484d'];
const step=(t,hz)=>Math.sin(t*Math.PI*2*hz);

// ---------- SUM-0 ----------
// o: {t, pose, face, look, lean, recoil, charge, armed, shield, blinkOff, antenna}
export function drawSum0(P,x,y,o={}){
 const t=o.t||0, pose=o.pose||'idle', lean=Math.round(o.lean||0);
 const idle=pose==='idle'||pose==='attack'||pose==='armed';
 const bob=idle&&step(t,.75)<0?1:0, headBob=idle&&step(t-.18,.75)<0?1:0;
 const run=pose==='run', down=pose==='dead', hang=pose==='hang', win=pose==='win', panic=pose==='panic';
 const ph=t*11, legA=run?Math.round(Math.sin(ph)*2):0, legB=-legA;
 const liftA=run?Math.max(0,Math.round(-Math.cos(ph)*2)):0, liftB=run?Math.max(0,Math.round(Math.cos(ph)*2)):0;
 const by=down?4:0; // collapsed body sits lower
 // legs and feet
 if(down){ P.part(x-9,y-3,7,3,DEEP); P.part(x+3,y-3,7,3,DEEP); }
 else if(hang){ P.part(x-5,y-7+Math.round(step(t,1.3)),3,6,DEEP); P.part(x+2,y-7-Math.round(step(t,1.3)),3,6,DEEP); P.part(x-6,y-2,5,2,BODY); P.part(x+2,y-2,5,2,BODY); }
 else { P.part(x-5+legA,y-6-liftA,3,5,DEEP); P.part(x+2+legB,y-6-liftB,3,5,DEEP); P.part(x-7+legA,y-2-liftA,6,2,BODY); P.part(x+1+legB,y-2-liftB,6,2,BODY); }
 const ty=y-17+bob+by, tx=x-8+lean;
 // back arm (behind torso)
 if(hang||win||panic){ const wave=panic?Math.round(step(t,3)*2):0; P.limb(tx+1,ty+3,tx-3,ty-9+wave,S0.deep,2); P.part(tx-5,ty-12+wave,4,3,BODY); }
 else if(down){ P.limb(tx+1,ty+4,tx-4,ty+10,S0.deep,2); }
 else { const sw=run?Math.round(Math.sin(ph)*2):0; P.limb(tx+1,ty+3,tx-2+sw,ty+9,S0.deep,2); P.part(tx-4+sw,ty+8,4,3,BODY); }
 // torso
 P.part(tx,ty,16,11,BODY);
 P.r(tx+2,ty+8,12,1,S0.lo);
 P.part(tx+4,ty+2,8,6,DEEP);
 const sig=(o.armed||Math.sin(t*2.4)>.4)?S0.amberHi:S0.amber;
 P.grid(['11111','01000','00100','01000','11111'],tx+5,ty+3,{1:down?'#7b6a4a':sig});
 if(o.shield){ P.part(tx-2,ty+2,4,5,['#3f7f8c','#8fe0ef','#e3fdff']); }
 // neck and head
 const hx=x-9+lean+(down?5:0)+(o.tilt||0), hy=y-31+headBob+(down?13:0);
 P.r(tx+6,ty-2,4,3,S0.deep);
 // antenna with a lagging spring
 const sway=down?3:Math.round(step(t,.55)*1+(o.antenna||0));
 P.line(hx+12,hy-1,hx+12+sway,hy-6,S0.deep,1);
 const bulbOn=!down&&(Math.sin(t*3.1)>-.2||o.armed);
 P.disc(hx+12+sway,hy-7,2,OL); P.disc(hx+12+sway,hy-7,1,bulbOn?(o.armed?'#9ff6ff':S0.amber):'#7a5f3a');
 if(bulbOn&&!down) P.alpha(.25,()=>P.disc(hx+12+sway,hy-7,3,o.armed?'#9ff6ff':S0.amber));
 P.part(hx,hy,18,13,BODY);
 P.part(hx-2,hy+4,2,4,DEEP); P.part(hx+18,hy+4,2,4,DEEP);
 P.r(hx+2,hy+2,14,9,OL); P.r(hx+3,hy+3,12,7,S0.scr); P.r(hx+3,hy+3,2,1,'#2b4a50');
 face(P,hx+3,hy+3,o.face||(down?'dead':'normal'),o.look||0,t);
 // front arm: arm cannon, or raised arms when celebrating / hanging
 if(win||hang){ const lift=win?Math.round(Math.abs(step(t,2))*2):0; P.limb(tx+15,ty+3,tx+19,ty-9-lift,S0.deep,2); P.part(tx+17,ty-13-lift,5,4,BODY); }
 else if(panic){ const wave=Math.round(step(t+.2,3)*2); P.limb(tx+15,ty+3,tx+19,ty-8-wave,S0.deep,2); P.part(tx+17,ty-12-wave,5,4,BODY); }
 else if(down){ P.part(tx+12,y-5,9,4,DEEP); }
 else {
  const rc=-Math.round(o.recoil||0), cy=ty+2+(run?Math.round(Math.cos(ph)):0);
  P.disc(tx+15,ty+3,2,OL); P.disc(tx+15,ty+3,1,S0.deep);
  P.part(tx+15+rc,cy,10,6,DEEP); P.r(tx+17+rc,cy+2,6,1,S0.deepLo);
  P.part(tx+24+rc,cy-1,3,8,BODY);
  const ch=o.charge||0, mx=tx+28+rc, my=cy+3;
  P.r(mx-1,my-1,1,2,ch>0||o.armed?'#ffffff':S0.glow);
  if(ch>0){ P.alpha(.35+ch*.4,()=>P.disc(mx,my,1+Math.round(ch*3),o.armed?'#ffe08a':'#d6ffc0')); P.disc(mx,my,Math.round(ch*1.5),'#ffffff'); }
  if(o.armed){ for(let i=0;i<3;i++){ const a=t*9+i*2.1; P.r(mx+Math.round(Math.cos(a)*5),my+Math.round(Math.sin(a)*4),1,1,i%2?'#ffe08a':'#ffffff'); } }
 }
}

function face(P,sx,sy,kind,look,t){
 const g=S0.glow, d=S0.dim, lx=Math.round(look);
 const blink=(t%3.7)>3.55;
 const eyes=(fn)=>{fn(sx+2+lx);fn(sx+7+lx);};
 switch(kind){
  case 'happy': eyes(e=>{P.r(e,sy+2,1,1,g);P.r(e+1,sy+1,1,1,g);P.r(e+2,sy+2,1,1,g);}); P.r(sx+4+lx,sy+4,1,1,d);P.r(sx+5+lx,sy+5,2,1,d);P.r(sx+7+lx,sy+4,1,1,d); break;
  case 'hurt': { const c=S0.red; P.r(sx+2,sy+1,1,1,c);P.r(sx+3,sy+2,1,1,c);P.r(sx+2,sy+3,1,1,c); P.r(sx+9,sy+1,1,1,c);P.r(sx+8,sy+2,1,1,c);P.r(sx+9,sy+3,1,1,c); for(let i=0;i<5;i++)P.r(sx+4+i,sy+5+(i%2),1,1,c); break; }
  case 'worried': eyes(e=>{P.r(e,sy+2,2,2,g);}); P.r(sx+2+lx,sy,2,1,d);P.r(sx+8+lx,sy,2,1,d); for(let i=0;i<4;i++)P.r(sx+4+i+lx,sy+5+(i%2),1,1,d); break;
  case 'focus': eyes(e=>{P.r(e,sy+2,3,2,g);P.r(e,sy+1,3,1,d);}); P.r(sx+5+lx,sy+5,3,1,d); break;
  case 'think': P.r(sx+3,sy+1,2,2,g);P.r(sx+8,sy+1,2,2,g); P.r(sx+6,sy+4,1,1,d); break;
  case 'panic': eyes(e=>{P.r(e,sy+1,3,3,g);P.r(e+1,sy+2,1,1,S0.scr);}); P.r(sx+5,sy+4,2,2,d); break;
  case 'dead': { const c='#5d7a72'; eyes(e=>{P.r(e,sy+1,1,1,c);P.r(e+2,sy+1,1,1,c);P.r(e+1,sy+2,1,1,c);P.r(e,sy+3,1,1,c);P.r(e+2,sy+3,1,1,c);}); P.r(sx+4,sy+5,4,1,c);
   for(let i=0;i<6;i++){ const n=(Math.floor(t*14)*7+i*13)%84; P.r(sx+n%12,sy+Math.floor(n/12),1,1,'#28434a'); } break; }
  default:
   if(blink) eyes(e=>P.r(e,sy+2,2,1,g)); else eyes(e=>{P.r(e,sy+1,2,3,g);P.r(e,sy+1,1,1,'#ffffff');});
   P.r(sx+5+lx,sy+5,2,1,d);
 }
}

// ---------- Enemies ----------
// o: {t, atk (0..1 windup→strike), look, move (walk cycle speed 0..1)}

function sweeper(P,x,y,o){
 const t=o.t, atk=o.atk||0, SAND=['#8a6638','#c9a15a','#f1d38c'];
 const sweep=Math.sin(t*3.2), roll=o.move?t*14:0;
 // wheel
 P.disc(x,y-4,4,OL); P.disc(x,y-4,3,'#3a4446'); P.disc(x,y-4,1,'#9aa9a6');
 for(let i=0;i<2;i++){ const a=roll+i*Math.PI/2; P.r(x+Math.round(Math.cos(a)*2),y-4+Math.round(Math.sin(a)*2),1,1,'#c1cdc8'); }
 P.r(x-1,y-11,3,4,METAL[0]);
 // can body
 P.part(x-8,y-26,16,16,SAND);
 for(let i=0;i<3;i++) P.r(x-4+i*4,y-24,1,12,SAND[0]);
 P.r(x-7,y-15,14,1,'#7a5a30');
 P.part(x-10,y-30,20,4,['#6d7c78','#9fb0a8','#d7e2d6']); P.part(x-3,y-33,6,2,DARK);
 // antenna + warning light
 P.line(x+5,y-33,x+7,y-38,METAL[1]); const on=Math.sin(t*5)>0; P.disc(x+7,y-40,1,OL); P.r(x+7,y-40,1,1,on?'#ff5d5d':'#6b2b2b'); if(on) P.alpha(.3,()=>P.disc(x+7,y-40,3,'#ff5d5d'));
 // big camera eye
 const lx=Math.round(o.look||-1);
 P.disc(x-2,y-20,4,OL); P.disc(x-2,y-20,3,'#262d30'); P.disc(x-2+lx,y-20,2,'#ff9a5c'); P.r(x-2+lx,y-21,1,1,'#fff3c0');
 if((t%4.1)>3.95) P.r(x-5,y-23,7,4,SAND[1]);
 // broom: sweeps at rest, rears up and swings forward to attack
 const wind=Math.min(1,atk*2), strike=Math.max(0,atk*2-1);
 const topX=x-4-wind*4+strike*2, topY=y-34-wind*4+strike*6;
 const botX=x-17+Math.round(sweep*4)*(1-wind)+wind*6-strike*18, botY=y-3-wind*24+strike*12;
 P.limb(x-6,y-21,(topX+botX)/2+2,(topY+botY)/2,METAL[1],2);
 P.limb(topX,topY,botX,botY,'#a87a48',2);
 P.part(botX-6,botY-2,12,3,['#5a3e22','#8a5e30','#b98850']);
 for(let i=0;i<6;i++) P.r(botX-6+i*2,botY+1,1,2+(i%2),'#d9b36a');
}

function claw(P,x,y,o){
 const t=o.t, atk=o.atk||0, PU=['#5d4f7a','#9083b8','#cbbff0'];
 // legs
 for(let i=0;i<3;i++){ const w=Math.round(Math.sin(t*(o.move?14:3)+i*2)*(o.move?2:1)); P.limb(x-7+i*6,y-9,x-10+i*8+w,y-1,PU[0],2); }
 // receipt claw (back)
 P.limb(x+10,y-13,x+15,y-19,PU[0],2);
 P.part(x+12,y-30,7,9,['#b8b49e','#efeadb','#ffffff']); for(let i=0;i<3;i++)P.r(x+13,y-28+i*2,5,1,'#a19c86'); P.r(x+13,y-22,3,1,'#d24b4b');
 // body
 P.part(x-12,y-18,24,10,PU); P.r(x-10,y-11,20,1,PU[0]); for(let i=0;i<4;i++)P.r(x-8+i*5,y-15,1,1,PU[2]);
 // bowler hat
 P.part(x-1,y-21,13,2,['#141218','#26222e','#4a4458']); P.part(x+2,y-27,7,6,['#141218','#26222e','#4a4458']); P.r(x+2,y-23,7,1,'#ffcb77');
 // eye stalks
 for(const [bx,tx,ph] of [[-9,-12,0],[-5,-6,1.3]]){ const wob=Math.round(Math.sin(t*2+ph)); P.line(x+bx,y-18,x+tx+wob,y-25,PU[0],1); P.disc(x+tx+wob,y-27,2,OL); P.disc(x+tx+wob,y-27,1,'#ffffff'); P.r(x+tx+wob-1,y-27,1,1,'#1a1626'); if((t+ph)%3.3>3.15) P.r(x+tx+wob-1,y-28,3,2,PU[1]); }
 // big pincer: snaps in idle, extends to pinch
 const p=t%2.6, snap=p<.12?0:p<.3?4:2;
 const reach=Math.round(Math.sin(Math.min(1,atk)*Math.PI)*14), open=atk>0?(atk<.55?5:0):snap;
 const cx=x-20-reach, cy=y-15;
 P.limb(x-11,y-14,x-16-reach/2,y-18,PU[0],3); P.limb(x-16-reach/2,y-18,cx+3,cy,PU[0],3);
 P.part(cx-9,cy-4-open,10,3,PU); P.part(cx-9,cy+2+open,10,3,PU);
 P.r(cx-9,cy-1-open,1,2,'#ffffff'); P.r(cx-9,cy+1+open,1,1,'#ffffff');
 P.part(cx,cy-4,5,9,PU);
}

function inspector(P,x,y,o){
 const t=o.t, atk=o.atk||0, COAT=['#3e6a74','#62a0ac','#a8dde2'];
 // legs and shoes
 P.limb(x-3,y-15,x-4,y-3,METAL[0],2); P.limb(x+3,y-15,x+4,y-3,METAL[0],2);
 P.part(x-8,y-2,6,2,DARK); P.part(x+2,y-2,6,2,DARK);
 // stamp arm (behind)
 const raise=atk<.6?atk/.6:1-(atk-.6)/.4, sx=x+9+Math.round(raise*2), sy=y-21-Math.round(raise*14);
 P.limb(x+5,y-28,sx,sy,METAL[1],2);
 P.part(sx-2,sy-5,5,4,['#5a3e22','#8a5e30','#b98850']); P.part(sx-3,sy-1,7,2,['#7a1f1f','#c43a3a','#ff7b6b']);
 // coat
 P.part(x-7,y-31,14,16,COAT); P.part(x-8,y-17,16,3,COAT);
 P.r(x-1,y-30,1,12,COAT[0]); P.r(x-3,y-30,2,3,COAT[2]); P.r(x+1,y-30,2,3,COAT[2]);
 P.r(x-7,y-21,14,2,'#25404a'); P.r(x-1,y-21,2,2,'#ffcb77');
 // head, cap and monocle
 P.part(x-6,y-41,12,9,METAL); P.r(x-4,y-34,6,1,METAL[0]);
 P.part(x-9,y-43,13,2,['#1b2a30','#2f4850','#4f727a']); P.part(x-5,y-48,11,5,['#1b2a30','#2f4850','#4f727a']); P.r(x,y-46,2,2,'#ffcb77');
 P.r(x-4,y-39,2,2,'#bff3ff');
 P.disc(x-3,y-38,3,'#d9a44a'); P.disc(x-3,y-38,2,'#1d3a44'); P.r(x-4,y-39,2,2,'#bff3ff');
 if(Math.sin(t*2.2)>.85) P.r(x-5,y-40,1,1,'#ffffff');
 P.line(x-1,y-36,x+1,y-27,'#d9a44a',1);
 // magnifier traces a figure eight, with a scan cone onto the floor
 const hx=x-15+Math.round(Math.sin(t*1.5)*3), hy=y-23+Math.round(Math.sin(t*3)*2);
 P.alpha(.07,()=>{ for(let j=0;j<y-hy-4;j+=1){ const w=2+Math.round(j*.35); P.r(hx-4-w/2,hy+4+j,w,1,'#bff3ff'); } });
 const sl=Math.round(Math.sin(t*2.4)*6); P.alpha(.6,()=>P.r(hx-4+sl-3,y-1,6,1,'#bff3ff'));
 P.limb(x-6,y-28,hx+2,hy+3,METAL[1],2);
 P.line(hx+1,hy+2,hx-2,hy-1,'#8a5e30',2);
 P.disc(hx-4,hy-3,5,OL); P.disc(hx-4,hy-3,4,'#d9a44a'); P.disc(hx-4,hy-3,3,'#8fd2e4'); P.r(hx-6,hy-5,2,1,'#ffffff');
}

function drone(P,x,y,o){
 const t=o.t, atk=o.atk||0, OR=['#b4562c','#ee8a45','#ffc48a'], WH=['#9aa7a8','#dfe7e3','#ffffff'];
 const hy=y-32+Math.round(Math.sin(t*3)*2)-Math.round(Math.sin(atk*Math.PI)*3);
 // shadow breathes with altitude
 P.alpha(.22,()=>P.r(x-9+Math.round(Math.sin(t*3)),y-1,18-Math.round(Math.sin(t*3)*2),2,'#000000'));
 // arms and rotors
 for(const s of [-1,1]){ P.limb(x+s*10,hy-4,x+s*16,hy-9,WH[0],2); P.part(x+s*16-2,hy-11,4,3,DARK);
  const f=Math.floor(t*30+(s>0?1:0))%3; P.alpha(.3,()=>P.r(x+s*16-8,hy-13,16,1,'#e6f2f2'));
  if(f===0) P.r(x+s*16-8,hy-13,16,1,'#f4fbfb'); else if(f===1) P.r(x+s*16-4,hy-13,8,1,'#f4fbfb'); else P.r(x+s*16-1,hy-14,2,2,'#f4fbfb'); }
 // body with counter display
 P.part(x-12,hy-7,24,12,WH); P.r(x-12,hy+1,24,2,OR[1]);
 P.part(x-7,hy-5,15,7,DARK);
 const count=String(Math.floor(t*6)%1000).padStart(3,'0'); P.text(count,x-6,hy-4,atk>0?'#ffe066':'#ff6b5b');
 P.part(x-10,hy+5,20,3,OR);
 P.r(x-1,hy-9,2,2,Math.sin(t*6)>0?'#ff4b4b':'#5a2222');
 // scanner eye and idle scan line
 P.part(x-3,hy+8,6,3,DARK); const eye=Math.sin(t*4)>0?'#ff5b5b':'#ff9a7a'; P.r(x-1,hy+9,2,1,eye);
 if(!atk){ const sx=x+Math.round(Math.sin(t*1.7)*12); P.alpha(.35,()=>P.line(x,hy+11,sx,y-1,'#ff5b5b')); }
 P.line(x-8,hy+8,x-10,hy+12,WH[0]); P.line(x+8,hy+8,x+10,hy+12,WH[0]);
}

function shredder(P,x,y,o){
 const t=o.t, atk=o.atk||0, RU=['#7d2f26','#b9493a','#ec8a6c'];
 const jx=Math.floor(t*18)%2, gape=Math.round(Math.sin(Math.min(1,atk)*Math.PI)*3);
 // treads
 P.part(x-15,y-7,30,7,DARK);
 for(let i=0;i<4;i++){ P.disc(x-11+i*7,y-4,2,'#5d6a6c'); P.r(x-11+i*7,y-4,1,1,'#aab6b4'); }
 for(let i=0;i<8;i++) P.r(x-15+((i*4+Math.floor(t*(o.move?40:8)))%30),y-7,2,1,'#5d6a6c');
 const bx=x+jx;
 // arms
 P.limb(bx-12,y-16,bx-17,y-11,METAL[1],2); P.part(bx-20,y-12,4,4,METAL);
 // body with hazard band
 P.part(bx-13,y-27,26,19,RU);
 for(let i=0;i<6;i++) P.r(bx-12+i*4,y-27,2,2,i%2?'#1c1c1c':'#f2c14e');
 P.r(bx+9,y-23,2,1,RU[2]); P.r(bx+9,y-12,2,1,RU[0]);
 // eyes with angry brows
 P.r(bx-9,y-23,3,2,'#ffe066'); P.r(bx-3,y-23,3,2,'#ffe066'); P.r(bx-10,y-25,3,1,OL); P.r(bx-7,y-24,1,1,OL); P.r(bx-3,y-24,1,1,OL); P.r(bx-2,y-25,3,1,OL);
 // grinder mouth with counter-rotating teeth
 P.r(bx-11,y-20-gape,18,8+gape*2,OL); P.r(bx-10,y-19-gape,16,6+gape*2,'#180c0a');
 if(atk>0) P.alpha(.6,()=>P.r(bx-8,y-17,12,2+gape*2,'#ff8a3d'));
 const sh=Math.floor(t*(atk>0?30:12))%3;
 for(let i=-1;i<6;i++){ const ux=bx-10+i*3+sh; if(ux>=bx-10&&ux<=bx+4){ P.r(ux,y-19-gape,2,1,'#d6dcdc'); P.r(ux,y-18-gape,1,1,'#9aa4a4'); }
  const lx2=bx-10+i*3+(2-sh); if(lx2>=bx-10&&lx2<=bx+4){ P.r(lx2,y-14+gape,2,1,'#d6dcdc'); P.r(lx2+1,y-15+gape,1,1,'#9aa4a4'); } }
 // blender-jar hat: its dream
 P.part(bx-7,y-29,13,2,METAL);
 P.alpha(.75,()=>P.part(bx-6,y-38,11,9,['#5f98a0','#a9dbe0','#e6fbff']));
 const b=Math.floor(t*20)%2; P.r(bx-3+(b?0:2),y-33,b?6:2,1,'#e9f2f2'); P.r(bx-1,y-34,2,3,'#7d8a8c');
 P.part(bx-7,y-40,13,2,DARK);
 // steam
 for(let i=0;i<2;i++){ const k=((t*.8+i*.5)%1); P.alpha(.5*(1-k),()=>P.disc(bx+8+Math.round(Math.sin(k*6+i)*2),y-32-Math.round(k*12),1+Math.round(k*2),'#c9d3d2')); }
}

function boss(P,x,y,o){
 const t=o.t, atk=o.atk||0, IR=['#2c2a2e','#4a464d','#7a7480'], RU=['#6e2e22','#a24a32','#d27852'];
 const sway=Math.round(Math.sin(t*1.4)*2), pulse=.5+.5*Math.sin(t*3);
 // chimneys and smoke
 P.part(x+11,y-68,5,11,IR); P.part(x+18,y-64,4,8,IR);
 for(let i=0;i<3;i++){ const k=(t*.45+i/3)%1; P.alpha(.45*(1-k),()=>P.disc(x+13+Math.round(Math.sin(k*5+i)*3)+Math.round(k*6),y-71-Math.round(k*20),2+Math.round(k*3),'#57535a')); }
 // back crane arm
 P.limb(x+24,y-42,x+33,y-53+sway,RU[0],4); P.limb(x+33,y-53+sway,x+37,y-34+sway,RU[0],4); P.part(x+32,y-34+sway,10,5,RU);
 // treads
 P.part(x-28,y-9,56,9,DARK); for(let i=0;i<6;i++){ P.disc(x-22+i*9,y-5,2,'#5d6a6c'); }
 // furnace body with a heat aura behind it
 P.alpha(.12+pulse*.1,()=>P.disc(x,y-30,32,'#ff8a3d'));
 P.part(x-24,y-47,48,38,IR);
 for(let i=0;i<7;i++){ P.r(x-21+i*7,y-45,1,1,IR[2]); P.r(x-21+i*7,y-12,1,1,IR[2]); }
 // molten chest grille
 P.r(x-15,y-38,30,17,OL);
 const hot=pulse>.5?'#ffb24a':'#ff8a3d'; P.r(x-14,y-37,28,15,hot); P.alpha(.5+pulse*.4,()=>P.r(x-11,y-34,22,9,'#ffe08a'));
 for(let i=0;i<7;i++) P.r(x-13+i*4,y-37,2,15,IR[1]);
 // recycle plate
 P.part(x-8,y-18,16,6,RU); P.grid(['..1..','.1.1.','11111'],x-2,y-17,{1:'#ffcb77'});
 // head with scanning visor
 P.part(x-13,y-59,26,12,RU); P.r(x-11,y-55,22,5,OL);
 const ex=x-10+Math.round((Math.sin(t*1.6)*.5+.5)*14); P.r(ex,y-54,6,3,atk>0?'#ffe066':'#ff4b3b'); P.alpha(.35,()=>P.r(ex-2,y-55,10,5,'#ff4b3b'));
 P.r(x-9,y-62,2,3,IR[2]); P.r(x+7,y-62,2,3,IR[2]);
 // front crane arm with magnet; it rears up and slams for attacks
 const up=atk<.55?atk/.55:1-(atk-.55)/.45, slam=atk>=.55?1-up:0;
 const ex2=x-37-Math.round(slam*8), ey2=y-52+sway-Math.round(up*10);
 const mx=x-44-Math.round(slam*14), my=y-33+sway-Math.round(up*16)+Math.round(slam*12);
 P.disc(x-24,y-41,4,OL); P.disc(x-24,y-41,3,RU[1]);
 P.limb(x-25,y-42,ex2,ey2,RU[1],4); P.limb(ex2,ey2,mx,my,RU[1],4);
 P.part(mx-6,my,12,5,RU); P.part(mx-6,my+5,3,3,METAL); P.part(mx+3,my+5,3,3,METAL);
 P.alpha(.25+pulse*.2,()=>{P.r(mx-7,my+9,4,1,'#9ff6ff');P.r(mx+3,my+9,4,1,'#9ff6ff');});
}

export const ENEMY_ART=[
 {draw:sweeper, shot:'dust', origin:[-18,-6], top:-42, colors:['#c9a15a','#8a6638','#9fb0a8','#ff9a5c']},
 {draw:claw, shot:'screw', origin:[-26,-15], top:-30, colors:['#9083b8','#5d4f7a','#efeadb','#26222e']},
 {draw:inspector, shot:'stamp', origin:[8,-30], top:-50, colors:['#62a0ac','#3e6a74','#7d8a95','#c43a3a']},
 {draw:drone, shot:'laser', origin:[0,-22], top:-48, fly:true, colors:['#dfe7e3','#ee8a45','#252f33','#ff5b5b']},
 {draw:shredder, shot:'gear', origin:[-10,-16], top:-42, colors:['#b9493a','#7d2f26','#f2c14e','#6c7a7f']},
 {draw:boss, shot:'fire', origin:[-44,-26], top:-74, boss:true, colors:['#4a464d','#a24a32','#ff8a3d','#ffe08a']}
];

export function drawEnemy(P,i,x,y,o){ ENEMY_ART[i].draw(P,x,y,o); }
