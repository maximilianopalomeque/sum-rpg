import {painter, OL, hash, ease, clamp} from './pixel.js';
import {drawSum0} from './actors.js';

export const scenes = [
 {label:'01 / LÍNEA DE MONTAJE',title:'Unidad SUM-0. A prueba.',speaker:'CONTROL DE CALIDAD',line:'¿Cuánto es 1 + 1?'},
 {label:'02 / MÓDULO DEFECTUOSO',title:'Algo vino falladito.',speaker:'SUM-0',line:'…¿Tres?'},
 {label:'03 / PROTOCOLO DE RECICLAJE',title:'Todavía no.',speaker:'SISTEMA CENTRAL',line:'Error en el módulo de cálculo. Unidad SUM-0 descartada. Iniciar protocolo de reciclaje.'},
 {label:'04 / FUERA DE LA LÍNEA',title:'Una suma a la vez.',speaker:'SUM-0',line:'Primero salgo. Después aprendo.'}
];
export function advanceScene(index){return index+1<scenes.length?index+1:null;}

// Each shot tells its story in 6 seconds, then holds its final pose for the reader.
// Reduced motion presents that same final pose without conveyor, alarm or movement.
export function paintStory(ctx,index,time=0,reduced=false){
 const t=reduced?6:clamp(time,0,6), W=320, H=160, F=118;
 ctx.save(); ctx.scale(2,2);
 const P=painter(ctx);
 const amb=reduced?0:t;
 const failed=index>1||(index===1&&t>1.6);
 // backdrop: assembly hall
 P.r(0,0,W,H,'#0b1a1f'); P.r(0,14,W,F-14,'#15303a'); for(let x=0;x<W;x+=4) P.r(x,14,2,F-14,'#1a3842');
 P.part(-2,6,W+4,4,['#1d3940','#2c4d55','#4a6e72']); P.part(-2,14,W+4,4,['#1d3940','#2c4d55','#4a6e72']);
 for(const x of [8,104,208]){ P.part(x,18,6,F-18,['#1d3940','#2c4d55','#4a6e72']); }
 // alarm beacon glow
 const alarm=failed?(reduced?1:.5+.5*Math.sin(t*5)):0;
 P.part(156,20,10,5,failed?['#5a1010','#c43a3a','#ff7b6b']:['#2c3a3e','#435458','#64777a']);
 if(alarm>0){ P.alpha(.1+alarm*.12,()=>P.r(0,0,W,H,'#ff3b2b')); P.alpha(.35*alarm,()=>P.disc(161,22,9,'#ff5b4b')); }
 // QC screen
 P.part(198,30,84,46,['#0c191d','#13262b','#2a4248']); P.r(202,34,76,38,index>0&&failed?'#2a1214':'#0f2a2e');
 const scr=index===0?(Math.floor(amb*2)%2?'1 + 1 = ?':'1 + 1 =  '):index===1?(t<1.6?'1 + 1 = ?':t<2.2?'1 + 1 = 3':'ERROR'):index===2?'RECICLAJE':'SALIDA >';
 P.text(scr,240,44,failed?'#ff9a8a':'#c9ffb2',index===1&&t>=2.2||index===2?2:1,'center');
 P.text(index===0?'CONTROL DE CALIDAD':index===1&&failed?'CALCULO NO VALIDO':index===2?'UNIDAD DESCARTADA':'PUERTA ABIERTA',240,62,failed&&index<3?'#d47a6a':'#7fbf95',1,'center');
 // exit door at the right
 const doorOpen=index===3?ease.inOut((t-2.2)/1.4):0;
 P.part(290,40,26,F-40,['#2a2a20','#3e3c2c','#5e5a40']); P.r(293,43,20,F-43,'#0a1430');
 if(doorOpen>0){ for(let i=0;i<8;i++) P.r(294+Math.floor(hash(i)*18),46+Math.floor(hash(i+9)*50),1,1,'#dfe8ff'); P.r(293,F-10,20,10,'#0e1a2e'); }
 P.part(293,43,20,Math.round((F-43)*(1-doorOpen)),['#3c4f50','#53696a','#7d9693']);
 P.text('SALIDA',303,33,index===3?'#c9ffb2':'#4f7a5f',1,'center');
 // QC robot arm overhead with scanner
 const scanY=index===0?ease.inOut((t-3)/1.2):0;
 P.limb(40,10,40,34,'#466c61',3); P.limb(40,34,92,40+Math.round(scanY*6),'#466c61',3);
 P.part(88,38+Math.round(scanY*6),12,7,['#2f4d47','#466c61','#6f9886']); P.r(92,45+Math.round(scanY*6),4,1,'#c9ffb2');
 if(index===0&&t>3&&t<5.2){ const sy=Math.round(70+Math.sin(t*6)*18); P.alpha(.35,()=>{ P.r(120,sy,60,1,'#c9ffb2'); }); P.alpha(.08,()=>P.r(120,52,60,F-52,'#c9ffb2')); }
 // floor, conveyor and trapdoor pit
 const pit=index>=2?(index===2?ease.inOut((t-.6)/.8):1):0, pitL=138, pitR=180;
 P.r(0,F,W,H-F,'#1f3a3e');
 if(pit>0){ P.r(pitL,F,pitR-pitL,H-F,'#06161b'); for(let i=0;i<7;i++){ const k=(Math.floor(amb*16)+i)%3; P.r(pitL+3+i*6,H-10+(k===0?0:1),4,3,'#c6d0cc'); } P.alpha(.3+.2*Math.sin(amb*6),()=>P.r(pitL,H-16,pitR-pitL,16,'#ff8a3d')); }
 P.r(0,F,W,2,'#5a7e76'); P.r(0,F+2,W,8,'#2c4447');
 const belt=index===0?(reduced?0:Math.min(t,3.2)*22):0;
 for(let x=-16;x<W+16;x+=10){ P.r(Math.round(x+belt%10),F+2,4,1,'#8a9a7a'); }
 for(let x=6;x<W;x+=20){ P.disc(x,F+6,3,OL); P.disc(x,F+6,2,'#547365'); P.r(x+Math.round(Math.cos(belt*.3+x)*1),F+6+Math.round(Math.sin(belt*.3+x)*1),1,1,'#b3c39a'); }
 if(pit>0){ const half=Math.round((pitR-pitL)/2*(1-pit)); P.r(pitL,F,pitR-pitL,10,'#06161b'); P.part(pitL,F,half,4,['#2c4447','#5a7e76','#8aa8a0']); P.part(pitR-half,F,half,4,['#2c4447','#5a7e76','#8aa8a0']); }
 // SUM-0
 let x=158,y=F,pose='idle',face='normal',look=0;
 if(index===0){ x=Math.round(-24+182*ease.out(t/3.2)); look=t<3.2?Math.round(Math.sin(t*2)):1; face=t>5?'think':t>3.2?'focus':'normal'; }
 if(index===1){ face=t<1.6?'think':t<2.2?'happy':'worried'; if(t>2.2&&t<2.6) y-=Math.round(Math.sin((t-2.2)/.4*Math.PI)*6); }
 if(index===2){ const fall=ease.inOut((t-1)/1.1); face=t<1?'worried':'panic'; pose=fall>.9?'hang':t>1?'panic':'idle'; y=F+Math.round(fall*32); x=158+Math.round(fall*2); if(fall>.9){ face='worried'; } }
 if(index===3){ const climb=ease.inOut(t/1.8), run=ease.inOut((t-2)/3); if(t<1.8){ pose='hang'; face='focus'; y=F+32-Math.round(climb*32); x=160; } else { pose=t<5.1?'run':'idle'; face='focus'; x=160+Math.round(run*128); look=1; if(t>5.1) face='happy'; } }
 drawSum0(P,x,y,{t:amb,pose,face,look});
 if(index===2&&pit>0) { P.r(pitL-1,F+10,pitR-pitL+2,2,'#06161b'); }
 // speech marks
 if(index===1&&t>.3&&t<1.6){ P.part(x+12,F-58,22,13,['#9fb0a0','#e8f0d8','#ffffff']); P.text('3?',x+23,F-54,'#2a4a40',1,'center'); P.r(x+12,F-44,3,2,'#e8f0d8'); P.r(x+9,F-41,2,2,'#e8f0d8'); }
 if(index===1&&t>=2.2){ P.text('!',x-14,F-46,'#ffcb77',2); P.r(x+12,F-40,1,3,'#9ff6ff'); }
 if(index===2&&t>2.3){ P.text('!',x-16,F-12,'#ffcb77',2); }
 if(index===3&&t>5.1){ for(let i=0;i<3;i++) P.r(x+16+i*5,F-40-i*3,2,2,'#c9ffb2'); }
 // framing rail
 P.r(0,0,W,5,'#0a1b22'); P.text('ENSAMBLAJE 07',6,0,'#5f8a78'); P.text(`SUM-0 ${index+1}/4`,W-6,0,'#5f8a78',1,'right');
 ctx.restore();
}
