// Battle scene: three animated zones, characters and an event-driven effects layer.
// The scene reads the engine state and reacts to what changed since the last frame,
// so the game logic never has to know about animation.
import {painter, OL, hash, rng, ease, clamp} from './pixel.js';
import {drawSum0, drawEnemy, ENEMY_ART} from './actors.js';

const ZONE_OF=[0,0,1,1,2,2];
let fx=fresh(), prev=null;
const bgCache=new Map();

function fresh(){ return {T:0, clock:0, enemyClock:0, hitstop:0, shake:0, flash:0, flashColor:'#ffffff', parts:[], shots:[], pops:[], timers:[], rand:rng(7),
 pl:{atk:9, hurt:9, block:9, hop:9, happy:9, heal:9, recoil:0, kb:0}, en:{atk:9, hit:9, kb:0, enter:1, dying:-1, gone:false, round:0, flying:false},
 emit:{smoke:0, spark:0, snow:0}}; }

export function layout(W,H){ const portrait=H>W*1.1; const F=Math.round(H*(portrait?.58:.7)); return {W,H,F,px:Math.round(W*(portrait?.27:.3)),ex:Math.round(W*(portrait?.73:.7)),portrait}; }

// ---------- public ----------
export function paint(ctx,s,opt={}){
 const W=ctx.canvas.width, H=ctx.canvas.height, L=layout(W,H), P=painter(ctx);
 const reduced=!!opt.reduced, paused=!!opt.paused;
 let dt=paused?0:Math.min(opt.dt||0,.1);
 detect(s,L);
 if(fx.hitstop>0){ fx.hitstop-=dt; dt*=.15; }
 update(dt,s,L,reduced);
 const amb=reduced?0:fx.clock;
 const sh=reduced||fx.shake<.3?0:fx.shake; P.ox=Math.round((hash(Math.floor(fx.T*60))-.5)*2*sh); P.oy=Math.round((hash(Math.floor(fx.T*60)+99)-.5)*2*sh);
 const zone=ZONE_OF[s.round]||0;
 P.ox-=0; drawBackground(P,ctx,zone,L,amb,s);
 drawShadows(P,L,s);
 drawParts(P,'back');
 drawEnemyActor(P,L,s,reduced);
 drawPlayer(P,L,s,amb,reduced);
 drawShots(P,L);
 drawParts(P,'front');
 drawPops(P);
 P.ox=0;P.oy=0;
 overlays(P,L,s,amb,zone);
}

// ---------- event detection ----------
function snap(s){ return {phase:s.phase,round:s.round,correct:s.correct,wrong:s.wrong,hp:s.hp,shield:s.shield,armed:s.armed,frozen:s.frozen>0,enemyHp:s.enemyHp,lastDamage:s.lastDamage}; }
function detect(s,L){
 const p=prev, n=snap(s); prev=n;
 if(!p||n.correct<p.correct||n.wrong<p.wrong){ const keep=fx.T; fx=fresh(); fx.T=keep; fx.en.round=s.round; if(s.phase==='battle') enter(L,s.round); return; }
 if(['intro','cinematic'].includes(p.phase)&&n.phase==='battle'){ enter(L,s.round); }
 if(n.round!==p.round){ enter(L,n.round); }
 if(n.correct>p.correct) playerAttack(L,s,n.lastDamage,n.enemyHp===0);
 if(n.wrong>p.wrong) enemyAttack(L,s,p.shield&&!n.shield&&n.hp===p.hp,n.hp<=0);
 if(n.hp>p.hp&&n.wrong===p.wrong){ fx.pl.heal=0; burst(L.px,L.F-22,10,['#9dff8a','#e8ffd8'],{vy:-50,spread:30,g:-20,life:.9,kind:'plus'}); pop(L.px,L.F-46,`+${n.hp-p.hp}`,'#9dff8a'); }
 if(n.armed&&!p.armed){ burst(L.px+20,L.F-12,14,['#ffe08a','#ffffff'],{spread:70,life:.5}); }
 if(n.frozen&&!p.frozen){ burst(L.W/2,L.F-60,30,['#bff6ff','#ffffff','#8fe0ef'],{spread:120,life:1,g:30}); fx.flash=.35; fx.flashColor='#bff6ff'; }
}
const at=(d,fn)=>fx.timers.push({t:d,fn});

function enter(L,round){ const e=fx.en; e.round=round; e.enter=0; e.gone=false; e.dying=-1; e.hit=9; e.atk=9; e.kb=0; fx.enemyClock=0; }

function muzzle(L){ return {x:L.px+20,y:L.F-12}; }
function enemyCenter(L,round){ const a=ENEMY_ART[round]; return {x:L.ex,y:L.F+Math.round(a.top*.45)}; }

function playerAttack(L,s,dmg,kill){
 const pl=fx.pl; pl.atk=0;
 const kind=dmg>=3?'beam':dmg===2?'big':'bolt', round=s.round;
 at(.16,()=>{ pl.recoil=kind==='beam'?5:3; const m=muzzle(L), c=enemyCenter(L,round);
  burst(m.x+2,m.y,6,['#ffffff','#c9ffb2'],{spread:50,life:.25,vx:60});
  fx.shots.push({kind,from:m,to:c,t:0,dur:kind==='beam'?.14:.2,arc:0,friendly:true,onHit:()=>enemyHit(L,round,dmg,kill)}); });
}
function enemyHit(L,round,dmg,kill){
 const e=fx.en, c=enemyCenter(L,round); e.hit=0; e.kb=6+dmg*3; fx.shake=Math.max(fx.shake,2+dmg*1.5); fx.hitstop=.05+dmg*.02;
 const cols=dmg>=3?['#ffffff','#ffe08a','#9ff6ff']:dmg===2?['#ffffff','#ffe08a','#ffb24a']:['#ffffff','#c9ffb2','#fadd8a'];
 burst(c.x-6,c.y,12+dmg*6,cols,{spread:110+dmg*20,life:.45,g:160});
 ring(c.x-4,c.y,dmg>=2?'#ffe08a':'#c9ffb2',10+dmg*4);
 pop(c.x,L.F+ENEMY_ART[round].top-6,`-${dmg}`,dmg>1?'#ffe08a':'#ffffff',dmg>=3?'PULSO!':dmg===2?'CHISPA!':'');
 if(kill){ e.dying=0; fx.pl.happy=0; at(.75,()=>explode(L,round)); }
}
function explode(L,round){
 const a=ENEMY_ART[round], c=enemyCenter(L,round), big=a.boss?2:1, e=fx.en; e.gone=true; e.dying=-1;
 fx.shake=Math.max(fx.shake,5*big); fx.hitstop=.08; fx.flash=.5; fx.flashColor='#fff4d0';
 ring(c.x,c.y,'#ffffff',24*big); ring(c.x,c.y,'#ffe08a',16*big);
 burst(c.x,c.y,26*big,a.colors,{spread:150*big,life:1.6,g:300,vy:-90,kind:'debris',floor:L.F});
 burst(c.x,c.y,18*big,['#ffffff','#ffe08a','#ff9a5c'],{spread:200,life:.5,g:60});
 for(let i=0;i<8*big;i++) fx.parts.push({x:c.x+(fx.rand()-.5)*20*big,y:c.y+(fx.rand()-.5)*20*big,vx:(fx.rand()-.5)*30,vy:-15-fx.rand()*25,g:-10,life:1.2+fx.rand(),max:2.2,c:i%2?'#56636a':'#3e484e',kind:'smoke',size:3+fx.rand()*3*big,layer:'back'});
 fx.pl.hop=0;
}
function enemyAttack(L,s,blocked,dead){
 const e=fx.en, round=s.round, a=ENEMY_ART[round]; e.atk=0;
 at(.32,()=>{ const from={x:L.ex+a.origin[0],y:L.F+a.origin[1]}, to={x:L.px+2,y:L.F-18};
  if(a.shot==='laser') burst(from.x,from.y,6,['#ff5b5b','#ffffff'],{spread:40,life:.3});
  fx.shots.push({kind:a.shot,from,to,t:0,dur:a.shot==='laser'?.16:.26,arc:['dust','screw','stamp','gear'].includes(a.shot)?14:4,onHit:()=>playerHit(L,blocked,dead)}); });
}
function playerHit(L,blocked,dead){
 const pl=fx.pl, c={x:L.px,y:L.F-20};
 if(blocked){ pl.block=0; ring(c.x,c.y,'#9ff6ff',20); burst(c.x+10,c.y,16,['#9ff6ff','#ffffff'],{spread:90,life:.4}); pop(c.x,L.F-50,'BLOQUEO','#9ff6ff'); fx.shake=Math.max(fx.shake,2); return; }
 pl.hurt=0; pl.kb=7; fx.shake=Math.max(fx.shake,4); fx.hitstop=.07; fx.flash=.25; fx.flashColor='#ff8d7b';
 burst(c.x+6,c.y,16,['#ff8d7b','#ffe08a','#ffffff'],{spread:110,life:.45,g:200});
 burst(c.x+4,c.y,5,['#8a9a9a','#c6d0cc'],{spread:70,life:.9,g:300,kind:'debris',floor:L.F,vx:-40});
 pop(c.x,L.F-50,'-1','#ff8d7b');
 if(dead){ at(.5,()=>{ fx.shake=4; burst(c.x,L.F-6,14,['#56636a','#3e484e'],{spread:50,life:1.6,g:-20,kind:'smoke'}); }); }
}

// ---------- particles ----------
function burst(x,y,n,cols,o={}){
 for(let i=0;i<n;i++){ const a=fx.rand()*Math.PI*2, sp=(o.spread||80)*(.35+fx.rand()*.65);
  fx.parts.push({x,y,vx:Math.cos(a)*sp+(o.vx||0),vy:Math.sin(a)*sp+(o.vy||0),g:o.g??120,life:(o.life||.6)*(.6+fx.rand()*.5),max:(o.life||.6),c:cols[i%cols.length],kind:o.kind||'px',size:o.kind==='debris'?2+Math.floor(fx.rand()*3):o.kind==='smoke'?3+fx.rand()*3:1+(fx.rand()<.3?1:0),floor:o.floor,spin:fx.rand(),layer:o.kind==='smoke'?'back':'front'}); }
}
function ring(x,y,c,r){ fx.parts.push({x,y,vx:0,vy:0,g:0,life:.3,max:.3,c,kind:'ring',size:r,layer:'front'}); }
function pop(x,y,text,c,label=''){ fx.pops.push({x,y,text,c,label,t:0}); }

function update(dt,s,L,reduced){
 fx.T+=dt; fx.clock+=dt;
 const frozen=s.frozen>0&&s.phase==='battle';
 fx.enemyClock+=dt*(frozen?.2:1);
 for(const tm of fx.timers) tm.t-=dt; const due=fx.timers.filter(tm=>tm.t<=0); fx.timers=fx.timers.filter(tm=>tm.t>0); due.forEach(tm=>tm.fn());
 const pl=fx.pl, e=fx.en;
 pl.atk+=dt; pl.hurt+=dt; pl.block+=dt; pl.hop+=dt; pl.happy+=dt; pl.heal+=dt;
 pl.recoil=Math.max(0,pl.recoil-dt*25); pl.kb=Math.max(0,pl.kb-dt*30);
 e.atk+=dt; e.hit+=dt; e.kb=Math.max(0,e.kb-dt*35); e.enter=Math.min(1,e.enter+dt/(ENEMY_ART[e.round]?.boss?1.4:.9)); if(e.dying>=0) e.dying+=dt;
 fx.shake=Math.max(0,fx.shake-dt*22); fx.flash=Math.max(0,fx.flash-dt*2.2);
 for(const sh of fx.shots){ sh.t+=dt; if(sh.t>=sh.dur&&!sh.done){ sh.done=true; sh.onHit&&sh.onHit(); } }
 fx.shots=fx.shots.filter(sh=>sh.t<sh.dur+.08);
 for(const p of fx.parts){ p.life-=dt; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.kind==='smoke'){p.vx*=.97;p.size+=dt*4;} if(p.floor&&p.y>p.floor-1){ p.y=p.floor-1; p.vy*=-.35; p.vx*=.6; } if(p.kind==='ring') p.size+=dt*60; }
 fx.parts=fx.parts.filter(p=>p.life>0); if(fx.parts.length>500) fx.parts.splice(0,fx.parts.length-500);
 for(const p of fx.pops) p.t+=dt; fx.pops=fx.pops.filter(p=>p.t<1);
 if(reduced||dt===0) return;
 // ambient emitters
 const em=fx.emit, live=['battle','feedback','upgrade'].includes(s.phase);
 if(live&&s.hp<=2||s.phase==='dead'){ em.smoke+=dt; if(em.smoke>.22){ em.smoke=0; const hx=s.phase==='dead'?L.px+4:L.px; fx.parts.push({x:hx+(fx.rand()-.5)*6,y:L.F-(s.phase==='dead'?14:32),vx:(fx.rand()-.3)*8,vy:-14-fx.rand()*8,g:-4,life:1.4,max:1.4,c:fx.rand()<.5?'#56636a':'#6f7b80',kind:'smoke',size:2,layer:'back'}); if(fx.rand()<.25) burst(hx+6,L.F-24,3,['#ffe08a','#ffffff'],{spread:40,life:.25}); } }
 if(live&&s.combo>=3){ em.spark+=dt; if(em.spark>.18){ em.spark=0; fx.parts.push({x:L.px+(fx.rand()-.5)*26,y:L.F-10-fx.rand()*30,vx:0,vy:-12,g:0,life:.6,max:.6,c:fx.rand()<.5?'#ffe08a':'#c9ffb2',kind:'star',size:1,layer:'front'}); } }
 if(frozen){ em.snow+=dt; if(em.snow>.05){ em.snow=0; fx.parts.push({x:fx.rand()*L.W,y:-2,vx:-6+fx.rand()*4,vy:18+fx.rand()*14,g:0,life:L.H/22,max:L.H/22,c:fx.rand()<.4?'#ffffff':'#bff6ff',kind:'px',size:1,layer:'front'}); } }
 if(s.phase==='won'&&e.gone){ em.spark+=dt; if(em.spark>.08){ em.spark=0; const cols=['#ffe08a','#c9ffb2','#9ff6ff','#ff9a7a','#ffffff']; fx.parts.push({x:fx.rand()*L.W,y:-2,vx:(fx.rand()-.5)*20,vy:30+fx.rand()*30,g:10,life:3,max:3,c:cols[Math.floor(fx.rand()*5)],kind:'confetti',size:2,spin:fx.rand(),layer:'front'}); } }
}

function drawParts(P,layer){
 for(const p of fx.parts){ if(p.layer!==layer) continue; const a=clamp(p.life/p.max);
  if(p.kind==='smoke') P.alpha(.55*a,()=>P.disc(p.x,p.y,Math.round(p.size),p.c));
  else if(p.kind==='ring') P.alpha(a,()=>{ const r=Math.round(p.size); P.r(p.x-r,p.y,1,1,p.c);P.r(p.x+r,p.y,1,1,p.c);P.r(p.x,p.y-r,1,1,p.c);P.r(p.x,p.y+r,1,1,p.c); const d=Math.round(r*.7); P.r(p.x-d,p.y-d,1,1,p.c);P.r(p.x+d,p.y-d,1,1,p.c);P.r(p.x-d,p.y+d,1,1,p.c);P.r(p.x+d,p.y+d,1,1,p.c); });
  else if(p.kind==='plus') P.alpha(a,()=>{P.r(p.x-1,p.y,3,1,p.c);P.r(p.x,p.y-1,1,3,p.c);});
  else if(p.kind==='star') P.alpha(a,()=>{P.r(p.x,p.y,1,1,'#ffffff');if(a>.5){P.r(p.x-1,p.y,3,1,p.c);P.r(p.x,p.y-1,1,3,p.c);}});
  else if(p.kind==='confetti'){ const f=Math.floor(fx.T*8+p.spin*8)%2; P.r(p.x,p.y,f?2:1,f?1:2,p.c); }
  else if(p.kind==='debris'){ P.r(p.x-1,p.y-1,p.size+2,p.size+2,OL); P.r(p.x,p.y,p.size,p.size,p.c); }
  else P.alpha(Math.min(1,a*1.5),()=>P.r(p.x,p.y,p.size,p.size,p.c));
 }
}
function drawPops(P){
 for(const p of fx.pops){ const k=ease.out(p.t/.5), y=p.y-k*12, a=p.t<.7?1:1-(p.t-.7)/.3, sc=p.t<.08?3:2;
  P.alpha(a,()=>{ P.text(p.text,p.x,y,p.c,sc,'center',OL); if(p.label) P.text(p.label,p.x,y-9,p.c,1,'center',OL); }); }
}

// ---------- characters ----------
function drawShadows(P,L,s){
 P.alpha(.35,()=>{ P.r(L.px-11,L.F-1,22,2,'#000000'); P.r(L.px-8,L.F,16,1,'#000000');
  const e=fx.en, a=ENEMY_ART[e.round]; if(!e.gone&&!a.fly){ const w=a.boss?60:28, x=enemyX(L); P.r(x-w/2,L.F-1,w,2,'#000000'); } });
}
function enemyX(L){ const e=fx.en, a=ENEMY_ART[e.round]; const off=(1-ease.out(e.enter))*(L.W*.5+70); return L.ex+off+Math.round(e.kb)-(e.atk<.6&&e.atk>.25?Math.round(Math.sin((e.atk-.25)/.35*Math.PI)*(a.boss?3:6)):0); }

function drawEnemyActor(P,L,s,reduced){
 const e=fx.en; if(e.gone) return; const a=ENEMY_ART[e.round]; if(!a) return;
 let x=enemyX(L), y=L.F;
 if(a.fly&&e.enter<1) y-=Math.round((1-ease.out(e.enter))*40);
 if(e.enter<1&&!a.fly&&!a.boss) y-=Math.abs(Math.round(Math.sin(e.enter*Math.PI*5)*2));
 const atk=e.atk<.6?e.atk/.6:0;
 if(e.dying>=0){ x+=Math.round(Math.sin(e.dying*60)*2); if(Math.floor(e.dying*16)%2===0) P.tint='#ffffff'; }
 else if(e.hit<.12) P.tint='#ffffff';
 else if(e.hit<.22) P.tint='#ffd0c0';
 drawEnemy(P,e.round,x,y,{t:reduced?0:fx.enemyClock,atk,look:-1,move:e.enter<1});
 P.tint=null;
 if(e.dying>=0) P.alpha(.6,()=>{ for(let i=0;i<3;i++){ const k=(e.dying*2+i/3)%1; P.disc(x+(hash(i)-.5)*20,y-20-k*20,1+Math.round(k*2),'#56636a'); } });
 if(e.enter<1&&e.enter>.0&&!a.fly){ if(Math.floor(e.enter*20)%3===0) fx.parts.push({x:x+(a.boss?26:14),y:L.F-2,vx:20,vy:-6,g:0,life:.5,max:.5,c:'#4d5e60',kind:'smoke',size:1.5,layer:'back'}); if(a.boss&&e.enter>.97&&!e.landed){ e.landed=true; fx.shake=6; burst(x,L.F-2,16,['#56636a','#7a8487'],{spread:60,life:.8,g:-10,kind:'smoke'}); } }
}

function drawPlayer(P,L,s,amb,reduced){
 const pl=fx.pl, e=fx.en;
 let pose='idle', face='normal', y=L.F, x=L.px-Math.round(pl.kb);
 const atkAct=pl.atk<.5, charge=pl.atk<.16?pl.atk/.16:0;
 if(s.phase==='dead'&&pl.hurt>.45){ pose='dead'; face='dead'; }
 else if(s.phase==='won'&&e.gone){ pose='win'; face='happy'; y-=Math.round(Math.abs(Math.sin(amb*5))*6); }
 if(pose==='idle'){
  if(pl.hurt<.5) face='hurt';
  else if(pl.happy<1.6||pl.heal<.8) face='happy';
  else if(atkAct||s.frozen>0) face='focus';
  else if(s.phase==='battle'&&s.time<4) face='worried';
 }
 if(pl.hop<.45) y-=Math.round(Math.sin(pl.hop/.45*Math.PI)*8);
 const lean=atkAct&&pl.atk<.16?-1:pl.recoil>0?-Math.ceil(pl.recoil/2):0;
 if(pl.hurt<.12) P.tint='#ffffff'; else if(pl.hurt<.3) P.tint=null;
 drawSum0(P,x,y,{t:amb,pose,face,look:1,lean,recoil:pl.recoil,charge,armed:s.armed,shield:s.shield>0,antenna:pl.hurt<.4?Math.round(Math.sin(pl.hurt*30)*2):0});
 P.tint=null;
 if(pl.hurt>=.12&&pl.hurt<.3) P.alpha(.45,()=>drawSum0(Object.assign(P,{tint:'#ff8d7b'}),x,y,{t:amb,pose,face,lean})); P.tint=null;
 if(pl.block<.4){ const a=1-pl.block/.4; P.alpha(a,()=>{ for(let j=-20;j<=4;j+=3){ const w=Math.round(Math.sqrt(Math.max(0,500-j*j*1.2))/1.3); P.r(x+14+Math.round(w/3),L.F-18+j,2,2,'#9ff6ff'); } }); }
 if(s.shield>0&&pose==='idle'&&!reduced){ const k=(amb*.6)%1; if(k<.25) P.alpha(.5,()=>P.r(x-10,L.F-14-Math.round(k*40),2,1,'#e3fdff')); }
}

function drawShots(P,L){
 for(const sh of fx.shots){ const k=clamp(sh.t/sh.dur);
  const pos=q=>({x:sh.from.x+(sh.to.x-sh.from.x)*q, y:sh.from.y+(sh.to.y-sh.from.y)*q-Math.sin(q*Math.PI)*sh.arc});
  const p=pos(k);
  if(sh.kind==='beam'){ const h=Math.max(1,Math.round(6*(1-Math.max(0,(sh.t-sh.dur)/.08)))); const x0=sh.from.x, x1=sh.to.x;
   P.alpha(.5,()=>P.r(x0,sh.from.y-h-1,x1-x0,h*2+3,'#9ff6ff')); P.r(x0,sh.from.y-h/2,x1-x0,h,'#ffe08a'); P.r(x0,sh.from.y-1,x1-x0,2,'#ffffff');
   for(let i=0;i<6;i++){ const xx=x0+hash(i+Math.floor(sh.t*40)*7)*(x1-x0); P.r(xx,sh.from.y-h-2-Math.round(hash(i*3)*3),1,1,'#ffffff'); } continue; }
  if(sh.kind==='laser'){ if(sh.t>sh.dur) continue; const fl=Math.floor(sh.t*40)%2; P.line(sh.from.x,sh.from.y,sh.to.x,sh.to.y,fl?'#ff5b5b':'#ffffff',2); P.alpha(.35,()=>P.line(sh.from.x,sh.from.y,sh.to.x,sh.to.y,'#ff5b5b',4));
   for(let i=0;i<5;i++){ const q=(i/5+sh.t*3)%1, pp=pos(q); P.r(pp.x-1,pp.y-3,2,2,'#ffe066'); } continue; }
  if(sh.t>sh.dur) continue;
  // trail
  for(let i=1;i<=5;i++){ const tp=pos(Math.max(0,k-i*.05)); const a=.5-i*.08;
   const c=sh.kind==='bolt'?'#c9ffb2':sh.kind==='big'?'#ffe08a':sh.kind==='fire'?'#ff8a3d':sh.kind==='dust'?'#a48a64':'#c6d0cc';
   if(sh.kind==='screw'||sh.kind==='stamp'||sh.kind==='gear') continue; P.alpha(a,()=>P.r(tp.x-1,tp.y-1,sh.kind==='big'||sh.kind==='fire'?3:2,2,c)); }
  const spin=Math.floor(sh.t*24)%4;
  switch(sh.kind){
   case 'bolt': P.alpha(.6,()=>P.disc(p.x,p.y,3,'#c9ffb2')); P.r(p.x-3,p.y-1,6,2,'#ffffff'); break;
   case 'big': P.alpha(.6,()=>P.disc(p.x,p.y,4,'#ffe08a')); P.disc(p.x,p.y,2,'#ffffff'); P.r(p.x-5,p.y,10,1,'#ffffff'); break;
   case 'dust': for(let i=0;i<4;i++){ const a=sh.t*10+i*1.6; P.disc(p.x+Math.round(Math.cos(a)*3),p.y+Math.round(Math.sin(a)*2),2,i%2?'#a48a64':'#cdb48a'); } P.r(p.x-1,p.y-1,2,2,'#6d8a84'); break;
   case 'screw': P.r(p.x-2,p.y-2,5,5,OL); if(spin%2){ P.r(p.x-1,p.y,4,1,'#c6d0cc'); P.r(p.x-2,p.y-1,1,3,'#8a9a9a'); } else { P.r(p.x,p.y-1,1,4,'#c6d0cc'); P.r(p.x-1,p.y-2,3,1,'#8a9a9a'); } break;
   case 'stamp': P.r(p.x-4,p.y-4,8,8,OL); P.r(p.x-3,p.y-3,6,6,'#c43a3a'); if(spin%2){P.r(p.x-2,p.y-2,1,1,'#ffffff');P.r(p.x+1,p.y+1,1,1,'#ffffff');P.r(p.x+1,p.y-2,1,1,'#ffffff');P.r(p.x-2,p.y+1,1,1,'#ffffff');}else{P.r(p.x-1,p.y-1,2,2,'#ffffff');} break;
   case 'gear': P.disc(p.x,p.y,4,OL); P.disc(p.x,p.y,3,'#9aa6a8'); P.r(p.x,p.y,1,1,OL); for(let i=0;i<4;i++){ const a=sh.t*14+i*Math.PI/2; P.r(p.x+Math.round(Math.cos(a)*4)-1,p.y+Math.round(Math.sin(a)*4)-1,2,2,'#c6d0cc'); } break;
   case 'fire': P.alpha(.5,()=>P.disc(p.x,p.y,5,'#ff8a3d')); P.disc(p.x,p.y,3,'#ffb24a'); P.disc(p.x,p.y,1,'#fff1c0'); if(Math.floor(sh.t*60)%2) fx.parts.push({x:p.x,y:p.y,vx:(fx.rand()-.5)*20,vy:-20,g:0,life:.3,max:.3,c:'#ffb24a',kind:'px',size:1,layer:'front'}); break;
  }
 }
}

// ---------- overlays ----------
function overlays(P,L,s,amb,zone){
 const {W,H}=L;
 // vignette in stepped bands keeps the pixel look
 for(let i=0;i<6;i++) P.alpha(.07,()=>{ P.r(0,0,W,4+i*5,'#000000'); P.r(0,H-4-i*7,W,4+i*7,'#000000'); P.r(0,0,3+i*4,H,'#000000'); P.r(W-3-i*4,0,3+i*4,H,'#000000'); });
 if(s.frozen>0&&s.phase==='battle'){ P.alpha(.14,()=>P.r(0,0,W,H,'#8fe0ef'));
  for(let x=0;x<W;x+=7){ const h=2+Math.floor(hash(x)*6); P.r(x,0,3,h,'#dffbff'); P.r(x+1,h,1,2,'#bff6ff'); } }
 if(fx.flash>0) P.alpha(fx.flash*.5,()=>P.r(0,0,W,H,fx.flashColor));
 if(s.phase==='dead'&&fx.pl.hurt>.5) P.alpha(Math.min(.35,(fx.pl.hurt-.5)*.3),()=>P.r(0,0,W,H,'#1a0606'));
}

// ---------- backgrounds ----------
function drawBackground(P,ctx,zone,L,t,s){
 const key=`${zone}:${L.W}x${L.H}`;
 let cached=bgCache.get(key);
 if(!cached&&typeof document!=='undefined'&&document.createElement){ const c=document.createElement('canvas'); c.width=L.W; c.height=L.H; const cx=c.getContext('2d'); if(cx){ backdrop(painter(cx),zone,L); cached=c; if(bgCache.size>6) bgCache.clear(); bgCache.set(key,c); } }
 if(cached&&ctx.drawImage) ctx.drawImage(cached,P.ox,P.oy); else backdrop(P,zone,L);
 live(P,zone,L,t,s);
}

const ZP=[
 {sky:'#0b1a1f',wall:'#15303a',wall2:'#1a3842',beam:['#1d3940','#2c4d55','#4a6e72'],floor:'#1f3a3e',floor2:'#183033',edge:'#5a7e76',light:'#e8d79a'},
 {sky:'#140b0c',wall:'#2a1819',wall2:'#331d1c',beam:['#2a1a18','#47302b','#6e4b3e'],floor:'#2a2020',floor2:'#1f1718',edge:'#a8674a',light:'#ffb070'},
 {sky:'#0a121a',wall:'#141f29',wall2:'#192733',beam:['#18232c','#2a3a46','#465a68'],floor:'#1b2730',floor2:'#141e26',edge:'#6f8f8a',light:'#c9ffb2'}
];

function backdrop(P,zone,L){
 const {W,H,F}=L, z=ZP[zone];
 P.r(0,0,W,H,z.sky);
 const top=F-104;
 P.r(0,top,W,F-top,z.wall);
 if(zone===1){ // brick foundry wall, warmer near the molten channel
  for(let y=top;y<F;y+=5){ const off=((y-top)/5)%2?5:0; for(let x=-off;x<W;x+=10){ P.r(x,y,9,4,hash(x*31+y)>.8?'#3a2220':z.wall2); } }
  for(let i=0;i<5;i++) P.alpha(.06,()=>P.r(0,F-12-i*12,W,12+i*12,'#ff7a2d'));
 } else { for(let x=0;x<W;x+=4) P.r(x,top,2,F-top,z.wall2); }
 // ceiling pipes
 P.part(-2,top-14,W+4,4,z.beam); P.part(-2,top-7,W+4,2,z.beam);
 for(let x=20;x<W;x+=58) P.part(x,top-16,4,10,z.beam);
 // girder and columns with cross braces
 P.part(-2,top-3,W+4,5,z.beam);
 const cols=[]; for(let x=8;x<W;x+=Math.max(90,Math.round(W/4))) cols.push(x);
 for(let i=0;i<cols.length-1;i++){ const a=cols[i]+6,b=cols[i+1]; P.alpha(.45,()=>{P.line(a,top+3,b,F-30,z.beam[0],2);P.line(b,top+3,a,F-30,z.beam[0],2);}); }
 for(const x of cols){ P.part(x,top,6,F-top,z.beam); for(let y=top+6;y<F;y+=12) P.r(x+2,y,1,1,z.beam[2]); }
 if(zone===0){
  // racks of salvage crates
  for(let x=24;x<W-30;x+=Math.max(110,Math.round(W/3.2))){ const rx=x+20; P.part(rx,F-62,46,2,z.beam); P.part(rx,F-38,46,2,z.beam); P.r(rx,F-62,2,40,z.beam[0]); P.r(rx+44,F-62,2,40,z.beam[0]);
   for(let i=0;i<3;i++){ const w=10+Math.floor(hash(x+i)*6); if(hash(x*3+i)>.25) P.part(rx+3+i*14,F-62-w+2,w,w-2,['#3a4a3e','#55644f','#76856a']); if(hash(x*5+i)>.3) P.part(rx+4+i*14,F-49,11,10,['#3c4f50','#53696a','#7d9693']); } }
  // scrap mound
  for(let i=0;i<16;i++){ const x=6+hash(i)*44, y=F-4-hash(i+9)*14; P.part(x,y,4+hash(i+3)*6,3+hash(i+5)*4,['#2b3a3b','#44585a','#6a7f7e']); }
  // conveyor frame
  P.part(-2,F-24,W+4,4,['#1b2e31','#2d4447','#4d6a6a']); for(let x=10;x<W;x+=40) P.r(x,F-20,3,20,'#14272b');
  // sign board
  const sx=Math.round(W/2); P.part(sx-34,top+10,68,17,['#0c191d','#13262b','#2a4248']);
 }
 if(zone===1){
  // vats and gauges
  for(const vx of [Math.round(W*.08),Math.round(W*.86)]){ P.part(vx,F-76,26,48,['#24191a','#3a2a28','#5e4438']); P.r(vx+3,F-70,20,2,'#5e4438'); P.disc(vx+13,F-58,4,OL); P.disc(vx+13,F-58,3,'#d9cfb0'); P.r(vx+13,F-60,1,2,'#c43a3a'); P.r(vx+4,F-28,4,3,'#24191a'); P.r(vx+18,F-28,4,3,'#24191a'); }
  P.r(0,F-26,W,10,OL); P.part(-2,F-16,W+4,3,z.beam);
  // crucible on its chain
  const cx=Math.round(W/2); P.r(cx-1,0,2,top+26,'#3a2a28'); P.part(cx-14,top+26,28,18,['#1f1514','#3a2a28','#5e4438']); P.r(cx-14,top+26,28,2,'#ffb24a');
 }
 if(zone===2){
  // the big exit door looking out to the night
  const dw=Math.min(150,Math.round(W*.42)), dx=Math.round(W/2-dw/2), dy=top+16, dh=F-dy;
  const bands=['#0a1430','#101d40','#172752','#203364','#2c4274'];
  for(let i=0;i<bands.length;i++) P.r(dx,dy+Math.round(i*dh/bands.length),dw,Math.ceil(dh/bands.length),bands[i]);
  P.disc(dx+dw-26,dy+18,7,'#f3f0d0'); P.r(dx+dw-29,dy+15,2,2,'#d9d4b0'); P.r(dx+dw-24,dy+21,3,2,'#d9d4b0'); P.alpha(.12,()=>P.disc(dx+dw-26,dy+18,12,'#f3f0d0'));
  for(let x=0;x<dw;x++){ const h=Math.round(10+Math.sin(x*.05)*5+Math.sin(x*.13+1)*3); P.r(dx+x,F-h-14,1,h+14,'#0e1a2e'); const h2=Math.round(6+Math.sin(x*.09+2)*3); P.r(dx+x,F-h2-6,1,h2+6,'#0a1322'); }
  for(let i=0;i<14;i++){ const x=dx+4+Math.floor(hash(i+40)*(dw-8)); P.r(x,F-10-Math.floor(hash(i+70)*8),1,1,'#ffd27a'); }
  P.part(dx-8,dy-6,8,dh+6,['#2a2a20','#3e3c2c','#5e5a40']); P.part(dx+dw,dy-6,8,dh+6,['#2a2a20','#3e3c2c','#5e5a40']);
  for(let y=dy;y<F;y+=8){ P.r(dx-7,y,6,4,'#d8b84a'); P.r(dx+dw+1,y,6,4,'#d8b84a'); }
  P.part(dx-8,dy-10,dw+16,6,['#2a2a20','#3e3c2c','#5e5a40']);
  for(let i=0;i<5;i++) P.r(dx,dy-4+i*2,dw,1,'#2f3a44');
  P.part(Math.round(W/2)-22,dy-26,44,12,['#0a1a10','#10261a','#1d3a28']);
  for(const bx of [Math.round(W*.08),Math.round(W*.88)]){ for(let i=0;i<3;i++) P.part(bx+(i%2)*8,F-12-Math.floor(i/2)*11,13,11,['#2c3a3e','#435458','#64777a']); }
 }
 // floor
 P.r(0,F,W,H-F,z.floor); P.r(0,F,W,1,z.edge); P.r(0,F+1,W,2,z.floor2);
 for(let y=F+8,row=0;y<H;y+=10+row*3,row++) P.r(0,y,W,1,z.floor2);
 for(let x=0;x<W;x+=32){ P.r(x,F+3,1,H-F,z.floor2); P.r(x+3,F+5,1,1,z.edge); }
 for(let x=0;x<W;x+=12) P.r(x,F+1,6,1,zone===1?'#7a3a26':'#8a7a46');
 if(zone===2){ for(let i=0;i<3;i++){ const ax=Math.round(W*.42)+i*14; P.alpha(.35,()=>P.text('>',ax,F+6,'#d8b84a',2)); } }
}

function live(P,zone,L,t,s){
 const {W,H,F}=L, z=ZP[zone], top=F-104;
 // hanging lamps with soft, flickering cones
 for(let x=Math.round(W*.15),i=0;x<W;x+=Math.max(100,Math.round(W/3)),i++){
  const sway=Math.round(Math.sin(t*1.1+i)*1.5), lx=x+sway, ly=top-4;
  const flick=zone===0&&i===1?(hash(Math.floor(t*10))>.85?.25:1):1;
  P.alpha(.05*flick,()=>{ for(let j=0;j<F-ly;j+=2){ const w=6+j*.7; P.r(lx-w/2,ly+6+j,w,2,z.light); } });
  P.line(x,top-18,lx,ly,'#0c1416',1); P.part(lx-5,ly,10,4,z.beam); P.r(lx-3,ly+4,6,1,flick>.5?z.light:'#5a5240');
 }
 if(zone===0){
  // conveyor belt with scrap riding along
  P.r(0,F-24,W,2,'#3b5a5c');
  const off=(t*18)%8; for(let x=-8;x<W+8;x+=8) P.r(Math.round(x+off),F-24,3,1,'#6d8a84');
  for(let i=0;i<Math.ceil(W/70)+1;i++){ const x=((i*70+t*18)%(W+70))-35, kind=i%3; if(kind===0) P.part(x,F-31,7,6,['#3a4a3e','#5c6b55','#85957a']); else if(kind===1){ P.part(x,F-32,5,7,['#6e2e22','#a24a32','#d27852']); } else P.part(x,F-29,9,4,['#3c4f50','#53696a','#7d9693']); }
  const sx=Math.round(W/2); P.text('RECICLAJE',sx-1,top+14,z.light,1,'center'); const on=Math.sin(t*4)>0; P.text('> 07',sx,top+21,on?'#ffcb77':'#6a5a3a',1,'center');
 }
 if(zone===1){
  // molten stream, channel, bubbles and embers
  const cx=Math.round(W/2), wob=Math.round(Math.sin(t*9));
  P.r(cx-2+wob,top+44,4,F-24-top-44,'#ff9a3d'); P.r(cx-1+wob,top+44,2,F-24-top-44,'#ffe08a');
  P.alpha(.15,()=>P.r(cx-5,top+44,10,F-24-top-44,'#ffb24a'));
  P.r(0,F-25,W,8,'#d9561f'); for(let x=0;x<W;x+=6){ const h=Math.round(Math.sin(x*.3+t*3)*1); P.r(x,F-25+h,4,2,'#ffb24a'); } P.r(0,F-19,W,1,'#ff9a3d');
  for(let i=0;i<6;i++){ const k=(t*.8+hash(i))%1, x=Math.floor(hash(i+3)*W); if(k<.3) P.disc(x,F-24,Math.round(k*6),'#ffe08a'); }
  for(let i=0;i<4;i++){ const k=(t*2+i/4)%1; P.r(cx-5+i*3,F-27-Math.round(Math.sin(k*Math.PI)*6),1,1,'#ffe08a'); }
  for(let i=0;i<26;i++){ const k=(t*.25+hash(i+20))%1; const x=hash(i)*W+Math.sin(t*2+i)*5; const y=F-6-k*(F-6); P.alpha(1-k,()=>P.r(x,y,1,1,i%3?'#ffb24a':'#ffe08a')); }
  for(const hx of [Math.round(W*.27),Math.round(W*.74)]){ const sw=Math.sin(t*.9+hx)*4; P.line(hx,top-18,hx+sw,top+20,'#47302b',1); P.part(hx+sw-2,top+20,4,3,['#2a1a18','#6e4b3e','#9b7258']); P.r(hx+sw+2,top+23,1,3,'#9b7258'); }
  const glow=.07+.03*Math.sin(t*2); P.alpha(glow,()=>P.r(0,F-30,W,30,'#ff7a2d'));
 }
 if(zone===2){
  const dw=Math.min(150,Math.round(W*.42)), dx=Math.round(W/2-dw/2), dy=top+16;
  for(let i=0;i<22;i++){ const x=dx+2+Math.floor(hash(i)*(dw-4)), y=dy+2+Math.floor(hash(i+100)*(F-dy-34)); const tw=Math.sin(t*(1+hash(i+5)*3)+i); if(tw>-.3) P.r(x,y,1,1,tw>.7?'#ffffff':'#9fb2d8'); if(tw>.95){P.r(x-1,y,3,1,'#c9d6f0');P.r(x,y-1,1,3,'#c9d6f0');} }
  const sk=(t*.12)%1; if(sk<.08){ const q=sk/.08; const x=dx+dw-10-q*(dw*.6), y=dy+6+q*16; for(let j=0;j<6;j++) P.alpha(1-j/6,()=>P.r(x+j*2,y-j,1,1,'#ffffff')); }
  P.alpha(.06,()=>{ const a=Math.sin(t*.5)*.6; for(let j=0;j<80;j+=2){ P.r(dx+dw/2+Math.round(a*j*1.4)-j/6,dy+60-j,2+j/5,2,'#dfe8ff'); } });
  const sx=Math.round(W/2), fl=hash(Math.floor(t*8))>.93?'#2c5a3a':'#c9ffb2'; P.alpha(.12,()=>P.r(sx-26,dy-30,52,18,'#c9ffb2')); P.text('SALIDA',sx,dy-23,fl,1,'center',OL);
  if(s.round===5&&s.phase!=='won'){ for(const bx of [16,W-22]){ const a=t*4; P.part(bx,top-2,6,4,['#5a1010','#c43a3a','#ff7b6b']); P.alpha(.08+.06*Math.max(0,Math.sin(a)),()=>{ for(let j=0;j<60;j+=2){ P.r(bx+3+Math.round(Math.cos(a)*j*1.5)-j/4,top+2+j,2+j/3,2,'#ff4b3b'); } }); } P.alpha(.04+.04*Math.max(0,Math.sin(t*4)),()=>P.r(0,0,W,H,'#ff2b2b')); }
 }
 // drifting dust in every zone
 for(let i=0;i<18;i++){ const x=(hash(i)*W+t*(3+hash(i+1)*5))%W, y=top+10+hash(i+7)*(F-top-10)+Math.sin(t+i)*3; P.alpha(.6,()=>P.r(x,y,1,1,zone===1?'#ffb27a':'#8fb0a2')); }
}

// ---------- art gallery (?gallery) for checking every character and state ----------
export function paintGallery(ctx,t){
 const W=ctx.canvas.width, H=ctx.canvas.height, P=painter(ctx);
 P.r(0,0,W,H,'#16262b'); for(let x=0;x<W;x+=8) P.r(x,0,1,H,'#1b2e33');
 const row1=Math.round(H*.4), row2=Math.round(H*.82);
 const poses=[['idle','normal'],['attack','focus'],['hurt','hurt'],['worried','worried'],['win','happy'],['dead','dead']];
 const step=W/(poses.length+1);
 poses.forEach(([pose,face],i)=>{ const x=Math.round(step*(i+1)); P.r(x-16,row1,32,1,'#3b5a5c');
  drawSum0(P,x,row1,{t,pose:pose==='attack'||pose==='hurt'||pose==='worried'?'idle':pose,face,look:1,charge:pose==='attack'?.8:0,armed:pose==='attack',shield:pose==='hurt'});
  P.text(pose,x,row1+4,'#9bb5ad',1,'center'); });
 const estep=W/7;
 ENEMY_ART.forEach((a,i)=>{ const x=Math.round(estep*(i+1)); P.r(x-20,row2,40,1,'#3b5a5c'); const atk=((t*.5+i*.13)%1.6)<.6?((t*.5+i*.13)%1.6)/.6:0;
  drawEnemy(P,i,x,row2,{t,atk,look:-1}); P.text(String(i+1),x,row2+4,'#9bb5ad',1,'center'); });
}

export function resetScene(){ fx=fresh(); prev=null; }
export function sceneBusy(){ return fx.timers.length>0||fx.shots.length>0||fx.en.dying>=0; }
