export const foes = [
 {name:'Escob-01',tag:'Un barrendero con malas intenciones.',hp:3,zone:0,time:14,max:5},
 {name:'Pinza fiscal',tag:'Dice que le debés dos tornillos.',hp:4,zone:0,time:13,max:9},
 {name:'Inspector de restos',tag:'Tu garantía emocional ha vencido.',hp:4,zone:1,time:12,max:14},
 {name:'Dron de inventario',tag:'Contó tus errores. Le faltó memoria.',hp:5,zone:1,time:11,max:20},
 {name:'Triturador junior',tag:'Su sueño es ser licuadora.',hp:5,zone:2,time:10,max:30},
 {name:'RECICLADOR CENTRAL',tag:'«Los robots no se equivocan». Mirá cómo sí.',hp:8,zone:2,time:12,max:45}
];
export const upgrades=[
 {id:'shield',icon:'◇',name:'Chapa de coraje',desc:'Bloquea el próximo golpe. Se recarga al comenzar cada combate.'},
 {id:'freeze',icon:'❄',name:'Reloj prestado',desc:'Un uso por combate: detiene el reloj durante 5 segundos. Tecla F.'},
 {id:'combo',icon:'ϟ',name:'Chispa de confianza',desc:'Cada tercera respuesta correcta seguida hace 2 de daño.'},
 {id:'heal',icon:'+',name:'Reparación urgente',desc:'Recuperá 3 de vida ahora. No aumenta tu capacidad. Se puede repetir.'},
 {id:'battery',icon:'▣',name:'Batería de repuesto',desc:'+2 de vida máxima y +2 de vida ahora. Una reserva para toda la fuga.'},
 {id:'regen',icon:'♥',name:'Circuito de cuidado',desc:'Cada 3 aciertos seguidos recuperás 1 de vida. Hasta 2 curaciones por combate.'},
 {id:'charge',icon:'↯',name:'Condensador rebelde',desc:'4 aciertos cargan un pulso. Activá R: tu próximo acierto hace +2 de daño. La carga se conserva.'}
];
export function initial(){return {phase:'intro',round:0,hp:6,maxHp:6,enemyHp:3,combo:0,best:0,correct:0,wrong:0,powers:[],charge:0,armed:false,heals:0,lastDamage:0,shield:0,freeze:0,frozen:0,time:14,question:null,feedback:'',last:'',choices:[]};}
export function question(state,rng=Math.random){const max=foes[state.round].max;const a=1+Math.floor(rng()*max), b=1+Math.floor(rng()*max);state.question={a,b,answer:a+b};state.time=foes[state.round].time;state.frozen=0;}
export function begin(state,rng=Math.random){state.phase='battle';state.enemyHp=foes[state.round].hp;state.combo=0;state.heals=0;state.shield=state.powers.includes('shield')?1:0;state.freeze=state.powers.includes('freeze')?1:0;state.feedback=foes[state.round].tag;question(state,rng);}
export function answer(state,value,timeout=false,rng=Math.random){if(state.phase!=='battle')return false;const ok=!timeout&&value===state.question.answer;state.last=ok?'hit':'hurt';if(ok){state.correct++;state.combo++;state.best=Math.max(state.best,state.combo);const damage=(state.powers.includes('combo')&&state.combo%3===0?2:1)+(state.armed?2:0);state.armed=false;state.lastDamage=damage;if(state.powers.includes('charge'))state.charge=Math.min(4,state.charge+1);state.enemyHp=Math.max(0,state.enemyHp-damage);state.feedback=damage>2?'¡PULSO REBELDE! Tu cálculo tiene potencia.':damage===2?'¡CHISPA DOBLE! Eso fue casi intencional.':'¡Bien! Un tornillo menos en tu camino.';if(state.powers.includes('regen')&&state.combo%3===0&&state.heals<2&&state.hp<state.maxHp){state.hp++;state.heals++;state.feedback+=' +1 de vida: circuito reparado.';}}else{state.wrong++;state.combo=0;state.feedback=`${timeout?'Se acabó el tiempo.':'Casi, robotito.'} ${state.question.a} + ${state.question.b} = ${state.question.answer}.`;if(state.shield){state.shield=0;state.feedback+=' ¡Chapa al rescate!';}else state.hp--;}
 if(state.hp<=0){state.phase='dead';return ok;}if(state.enemyHp<=0){if(state.round===foes.length-1)state.phase='won';else{state.phase='upgrade';state.choices=offer(state);}}else state.phase='feedback';return ok;}
export function next(state,rng=Math.random){if(state.phase==='feedback'){state.phase='battle';question(state,rng);}}
export function choose(state,id,rng=Math.random){if(state.phase!=='upgrade'||!state.choices.includes(id))return false;if(id==='heal'){state.hp=Math.min(state.maxHp,state.hp+3);}else{state.powers.push(id);if(id==='battery'){state.maxHp+=2;state.hp=Math.min(state.maxHp,state.hp+2);}}state.round++;begin(state,rng);return true;}
export function freeze(state){if(state.phase!=='battle'||!state.freeze)return false;state.freeze=0;state.frozen=5;return true;}
export function tick(state,dt){if(state.phase!=='battle')return false;const held=Math.min(state.frozen,dt);state.frozen-=held;state.time=Math.max(0,state.time-(dt-held));return state.time<=0;}

export function offer(state){const plan=[['battery','regen'],['charge','shield'],['combo','freeze'],['regen','charge'],['shield','battery']];const ids=[...(plan[state.round]||[]),...upgrades.map(u=>u.id)].filter((id,i,a)=>id!=='heal'&&!state.powers.includes(id)&&a.indexOf(id)===i);return [...ids.slice(0,2),'heal'];}
export function arm(state){if(state.phase!=='battle'||!state.powers.includes('charge')||state.charge<4||state.armed)return false;state.charge=0;state.armed=true;state.feedback='Pulso listo: tu próximo acierto hace +2 de daño.';return true;}
