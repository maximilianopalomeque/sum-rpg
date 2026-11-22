import {initial,foes,upgrades,begin,answer,next,choose,freeze,tick,arm} from './engine.js';
import {paint,paintGallery} from './art.js';
import {scenes,advanceScene,paintStory} from './story.js';
import {icon,POWER_ICON} from './icons.js';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');
let state=initial(),paused=false,muted=true,audio=null,lastTime=0,feedbackTime=0,hold=0;
let storyIndex=0,storyTime=0;state.phase='cinematic';
const query=typeof location!=='undefined'?new URLSearchParams(location.search):new Map();
const gallery=query.has('gallery'),startRound=Math.min(5,Math.max(0,Number(query.get('round'))||0));
const ZONES=['DEPÓSITO','FUNDICIÓN','LA SALIDA'];
const HOLD={upgrade:1.7,won:1.9,dead:1.8};

// Integer pixel scale keeps every pixel square at any window size.
function fit(){const w=window.innerWidth,h=window.innerHeight;if(!w||!h)return;const s=Math.max(2,Math.floor(Math.min(w/240,h/150)));canvas.width=Math.ceil(w/s);canvas.height=Math.ceil(h/s);canvas.style.width=canvas.width*s+'px';canvas.style.height=canvas.height*s+'px';if(ctx)ctx.imageSmoothingEnabled=false;}
function showStory(){state=initial();state.phase='cinematic';paused=false;hold=0;storyIndex=0;storyTime=0;feedbackTime=0;$('answer').value='';render();}
function finishStory(){state.phase='intro';render();}
function storyNext(){const step=advanceScene(storyIndex);if(step===null)finishStory();else{storyIndex=step;storyTime=0;render();}}

// Synthesised sound effects (Web Audio), off until the player turns them on.
function tone(f0,f1,dur,type='square',vol=.04,delay=0){const t0=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);o.connect(g);g.connect(audio.destination);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol=.05,delay=0){const len=Math.floor(audio.sampleRate*dur),buf=audio.createBuffer(1,len,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=audio.createBufferSource(),g=audio.createGain();s.buffer=buf;g.gain.value=vol;s.connect(g);g.connect(audio.destination);s.start(audio.currentTime+delay);}
function sfx(kind){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();
 if(kind==='hit'){tone(520,1200,.09,'square',.035);tone(300,90,.12,'triangle',.05,.16);noise(.08,.04,.16);}
 else if(kind==='big'){tone(420,1600,.14,'sawtooth',.03);tone(220,60,.2,'triangle',.06,.16);noise(.14,.06,.16);}
 else if(kind==='hurt'){tone(180,60,.25,'sawtooth',.04,.3);noise(.18,.06,.3);}
 else if(kind==='block'){tone(900,1400,.12,'triangle',.04,.3);tone(1400,900,.12,'triangle',.03,.4);}
 else if(kind==='kill'){noise(.5,.08,.95);tone(160,40,.5,'square',.05,.95);}
 else if(kind==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,f,.18,'square',.035,1.2+i*.13));}
 else if(kind==='dead'){[392,330,262,196].forEach((f,i)=>tone(f,f*.97,.25,'triangle',.05,.6+i*.2));}
 else if(kind==='freeze'){tone(1800,600,.4,'sine',.04);}
 else if(kind==='arm'){tone(300,1200,.3,'sawtooth',.03);}
 else tone(660,880,.06,'square',.025);
}catch{}}
function focus(){if(matchMedia('(pointer:fine)').matches)$('answer').focus({preventScroll:true});}

function render(){const foe=foes[state.round];
 $('game').dataset.phase=state.phase;
 $('chapter').textContent=ZONES[foe.zone];
 [...$('route').children].forEach((el,i)=>el.className=i===foe.zone?'active':i<foe.zone?'done':'');
 $('progress').textContent=`${state.round+1}/6`;
 $('enemyName').textContent=foe.name.toUpperCase();$('enemyHealth').textContent=`${state.enemyHp} / ${foe.hp}`;$('enemyBar').style.width=`${state.enemyHp/foe.hp*100}%`;
 const hearts=icon('heart',16).repeat(Math.max(0,state.hp))+icon('heartEmpty',16).repeat(Math.max(0,state.maxHp-state.hp));if($('hearts').innerHTML!==hearts)$('hearts').innerHTML=hearts;
 $('hpText').textContent=`${state.hp}/${state.maxHp}`;
 $('combo').textContent=`RACHA ${state.combo}`;$('combo').dataset.hot=state.combo>=3?'1':'';
 $('powers').innerHTML=state.powers.map(p=>`<span class="chip">${icon(POWER_ICON[p],12)}${p==='shield'?(state.shield?'Chapa lista':'Chapa usada'):p==='combo'?'Chispa ×2':p==='battery'?'Batería +2':p==='regen'?`Cuidado ${state.heals}/2`:p==='charge'?(state.armed?'Pulso ARMADO':`Pulso ${state.charge}/4`):(state.freeze?'Reloj listo':'Reloj usado')}</span>`).join('');
 $('freeze').hidden=!state.powers.includes('freeze');$('freeze').disabled=!state.freeze||state.phase!=='battle'||paused;
 $('special').hidden=!state.powers.includes('charge');$('special').disabled=state.charge<4||state.armed||state.phase!=='battle'||paused;$('special').textContent=state.armed?'PULSO ARMADO':`PULSO ${state.charge}/4 · R`;
 $('sum').textContent=state.question?`${state.question.a} + ${state.question.b}`:'3 + 2';
 $('feedback').textContent=state.feedback||foe.tag;
 $('submit').disabled=state.phase!=='battle'||paused;$('answer').disabled=state.phase!=='battle'||paused;
 $('pause').disabled=['cinematic','intro','won','dead','upgrade'].includes(state.phase);
 $('pause').innerHTML=icon(paused?'play':'pause',18);$('pause').setAttribute('aria-label',paused?'Seguir':'Pausar juego');
 $('sound').innerHTML=icon(muted?'mute':'sound',18);
 renderOverlay();}

function renderOverlay(){const over=$('overlay');let html='';const waiting=hold>0&&HOLD[state.phase];
 if(paused)html=`<div class="tag">MODO AHORRO DE NERVIOS</div><h2>Respirá. No hay apuro.</h2><p>La fábrica puede esperar. El tiempo y los golpes están en pausa.</p><button class="primary" data-action="resume">SEGUIR ESCAPANDO</button>`;
 else if(waiting)html='';
 else if(state.phase==='cinematic'){const scene=scenes[storyIndex];html=`<div class="film-top"><span class="tag">${scene.label}</span><button data-action="skip" class="skip">SALTAR INTRO</button></div><canvas id="storyCanvas" width="640" height="320" aria-label="Escena pixel art: ${scene.title}"></canvas><h2>${scene.title}</h2><p class="speaker">${scene.speaker}</p><p class="dialogue">«${scene.line}»</p><div class="film-bottom"><span class="dots">${scenes.map((_,i)=>`<i class="${i===storyIndex?'on':''}"></i>`).join('')}</span><button class="primary" data-action="next-scene">${storyIndex===3?'APRENDER A ESCAPAR':'CONTINUAR'}</button></div>`;}
 else if(state.phase==='intro')html=`<div class="tag">UNA PEQUEÑA AVENTURA ARITMÉTICA</div><h1>ERROR DE FÁBRICA.</h1><p class="intro-sub">Malísimo sumando. Buenísimo intentando.</p><p>Sos <b>SUM-0</b>. Tu módulo de cálculo vino fallado y la fábrica te mandó a reciclar. Pero todavía te queda batería… y una sospecha: quizás no seas chatarra.</p><div class="instructions"><div><b>01 · SUMÁ</b>Escribí el resultado y presioná Enter o Disparar.</div><div><b>02 · RESISTÍ</b>Un error o tiempo agotado te cuesta 1 de vida.</div><div><b>03 · MEJORÁ</b>Derrotá 6 robots, repará módulos y escapá.</div></div><div class="actions"><button class="primary" data-action="start">NO SOY CHATARRA</button><button class="ghost" data-action="replay">VER LA HISTORIA</button></div><p class="hint">ENTER disparar · ESC pausa · F congelar · R pulso</p>`;
 else if(state.phase==='upgrade')html=`<div class="tag">ENEMIGO DESACTIVADO · TALLER IMPROVISADO</div><h2>Un poquito menos roto.</h2><p>Elegí un repuesto. <b>${state.hp}/${state.maxHp} de vida</b> · Se instala al instante.</p><div class="cards">${state.choices.map(id=>{const u=upgrades.find(u=>u.id===id);return `<button class="card" data-upgrade="${id}">${icon(POWER_ICON[id],40,'card-icon')}<b>${u.name}</b><span>${u.desc}</span><em>${id==='heal'?'RECUPERACIÓN INMEDIATA':'MÓDULO PERMANENTE'}</em></button>`}).join('')}</div><p class="hint">Próximo: ${foes[state.round+1].name}</p>`;
 else if(state.phase==='won'||state.phase==='dead'){const won=state.phase==='won';html=`<div class="tag">${won?'PROTOCOLO DE RECICLAJE: CANCELADO':'GUARDANDO UNA SEGUNDA OPORTUNIDAD'}</div><h1>${won?'NO ERAS CHATARRA.':'BATERÍA AGOTADA.'}</h1><p>${won?'Afuera, SUM-0 cuenta las estrellas. Se equivoca en la tercera. Sonríe igual. Aprendió algo mejor que sumar: volver a intentar.':'SUM-0 se sentó un ratito. «¿Seis golpes menos seis golpes es… una siesta?» La próxima fuga empieza con una batería nueva.'}</p><p class="stats">${state.correct} aciertos · ${state.wrong} tropiezos · mejor racha ${state.best}</p><div class="actions"><button class="primary" data-action="restart">${won?'OTRA AVENTURA':'VOLVER A INTENTAR'}</button><button class="ghost" data-action="replay">VER LA HISTORIA</button></div>`;}
 over.hidden=!html;over.dataset.kind=paused?'pause':state.phase;if(html!==over.dataset.html){over.innerHTML=html?`<div class="modal ${state.phase==='cinematic'&&!paused?'cinematic':''} ${state.phase==='upgrade'&&!paused?'shop':''}" role="dialog" aria-modal="true" aria-label="${paused?'Juego en pausa':state.phase==='upgrade'?'Elegí una mejora':'Aventura SUM-0'}">${html}</div>`:'';over.dataset.html=html;if(html)over.querySelector(state.phase==='cinematic'?'[data-action="next-scene"]':'button')?.focus({preventScroll:true});}}

function clearAnswer(){$('answer').value='';$('equation').dataset.state='';}
function reset(){state=initial();paused=false;hold=0;feedbackTime=0;state.round=startRound;if(query.get('powers')){state.powers=query.get('powers').split(',').filter(id=>upgrades.some(u=>u.id===id&&id!=='heal'));state.charge=state.powers.includes('charge')?4:0;}begin(state);clearAnswer();render();focus();}
function submit(timeout=false){if(paused||state.phase!=='battle')return;const raw=$('answer').value.trim();if(!timeout&&!/^\d{1,3}$/.test(raw)){$('feedback').textContent='Escribí un número para cargar el disparo.';focus();return;}
 const shield=state.shield,hp=state.hp;const ok=answer(state,Number(raw),timeout);
 sfx(ok?(state.lastDamage>1?'big':'hit'):(shield&&state.hp===hp?'block':'hurt'));
 if(HOLD[state.phase]){hold=HOLD[state.phase];sfx(state.phase==='won'?'win':state.phase==='dead'?'dead':'kill');}
 feedbackTime=ok?.8:2.3;$('answer').value=timeout?'':raw;$('equation').dataset.state=ok?'ok':'bad';render();}
function togglePause(force){if(!['battle','feedback'].includes(state.phase))return;paused=force??!paused;render();if(!paused)focus();}

$('special').onclick=()=>{if(!paused&&arm(state)){sfx('arm');render();focus();}};
$('submit').onclick=()=>submit();
$('answer').addEventListener('input',()=>{$('answer').value=$('answer').value.replace(/[^0-9]/g,'').slice(0,3);});
$('pause').onclick=()=>togglePause();
$('freeze').onclick=()=>{if(!paused&&freeze(state)){sfx('freeze');render();focus();}};
$('sound').onclick=()=>{muted=!muted;$('sound').setAttribute('aria-label',muted?'Activar sonido':'Silenciar sonido');render();sfx('ui');};
$('overlay').onclick=e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.upgrade){if(!choose(state,button.dataset.upgrade))return;sfx('ui');clearAnswer();render();focus();}else if(button.dataset.action==='next-scene')storyNext();else if(button.dataset.action==='skip')finishStory();else if(button.dataset.action==='replay')showStory();else if(button.dataset.action==='resume')togglePause(false);else reset();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(state.phase==='cinematic')finishStory();else togglePause();}
 if(e.key.toLowerCase()==='r'&&!paused&&arm(state)){e.preventDefault();sfx('arm');render();}
 if(e.key.toLowerCase()==='f'&&!paused&&freeze(state)){e.preventDefault();sfx('freeze');render();}
 if(e.key==='Enter'&&!e.repeat){if(e.target.tagName==='BUTTON')return;e.preventDefault();if(state.phase==='cinematic')storyNext();else if(paused)togglePause(false);else if(state.phase==='battle')submit();else if(['intro','won','dead'].includes(state.phase)&&hold<=0)reset();}
 if(e.key==='Tab'&&!$('overlay').hidden){const buttons=[...$('overlay').querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('blur',()=>togglePause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true)});
window.addEventListener('resize',fit);

function frame(now){const dt=lastTime?Math.min((now-lastTime)/1000,.25):0;lastTime=now;
 if(gallery){paintGallery(ctx,now/1000);requestAnimationFrame(frame);return;}
 if(!paused){if(state.phase==='battle'&&tick(state,dt))submit(true);else if(state.phase==='feedback'){feedbackTime-=dt;if(feedbackTime<=0){next(state);clearAnswer();render();focus();}}
  if(hold>0){hold-=dt;if(hold<=0)render();}}
 const limit=foes[state.round].time;$('timerLabel').textContent=state.frozen>0?`HIELO ${state.frozen.toFixed(1)}`:state.time.toFixed(1);
 $('timerBar').style.width=`${state.time/limit*100}%`;$('timerBar').dataset.state=state.frozen>0?'frozen':state.time<4?'low':'';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 paint(ctx,state,{dt,paused:paused||document.hidden,reduced});
 if(state.phase==='cinematic'){if(!document.hidden)storyTime+=dt;const film=$('storyCanvas');if(film)paintStory(film.getContext('2d'),storyIndex,storyTime,reduced);}
 requestAnimationFrame(frame);}
fit();if(gallery)$('game').dataset.phase='gallery';else render();requestAnimationFrame(frame);
