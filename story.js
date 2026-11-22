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
 const t=reduced?6:Math.min(6,Math.max(0,time));const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{const q=clamp(v);return q*q*(3-2*q)};
 ctx.save();ctx.scale(2,2);
 const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
 const text=(word,x,y,size=7,c='#c6efac')=>{ctx.fillStyle=c;ctx.font=`bold ${size}px monospace`;ctx.textAlign='center';ctx.fillText(word,x,y)};
 r(0,0,320,160,'#10252c');r(0,18,320,102,'#223c42');
 for(let x=0;x<320;x+=40){r(x,18,1,101,'#314e51');r(x+4,23,2,2,'#567064');r(x+35,114,2,2,'#567064')}
 r(11,0,5,120,'#48665e');r(13,0,1,120,'#78927b');r(0,31,32,4,'#48665e');
 for(let x=25;x<320;x+=80){r(x,0,2,14,'#5b746a');r(x-10,14,24,3,'#839579');r(x-8,17,20,2,'#d8e1a0')}
 // Robot arm on the assembly line, inspection screen and exit.
 r(28,53,8,50,'#52776c');r(28,53,39,7,'#829b81');r(60,58,7,15,'#52776c');r(55,71,6,9,'#9aac8e');r(68,71,6,9,'#9aac8e');
 r(184,30,85,47,'#0c2329');r(187,33,79,41,'#4a6a60');r(190,36,73,35,index>0&&index<3?'#4d3232':'#183b40');
 const failed=index>1||(index===1&&t>1.2);text(index===0?'1 + 1 = ?':index===1?(t<1.2?'1 + 1 = 3':'ERROR: 2'):'RECICLAJE',226,51,8,failed?'#ffb197':'#c6efac');text(index===0?'CONTROL DE CALIDAD':index===1?'CALCULO NO VALIDO':'SUM-0 DESCARTADO',226,64,4,failed?'#ec9a80':'#8abca0');
 r(286,45,25,76,'#10262b');r(289,48,19,73,index===3?'#b7d49a':'#456759');if(index===3){r(300,48,8,73,'#87ad8b');text('→',298,83,12,'#1d4544')}text('SALIDA',298,40,4);
 // Slower than 1 Hz alarm: glow only, never a full-screen flash.
 const alarm=failed?(reduced?1:.5+.5*Math.sin(t*4)):0;r(159,24,13,5,'#567064');r(162,17,7,7,failed?'#dc8067':'#729a77');if(alarm>.4)r(160,14,11,2,'#eaaa7c');
 // Conveyor with rotating rollers and scrolling stripes.
 r(0,121,320,9,'#0a2027');r(0,119,320,3,'#8c9a7a');const belt=index===0?Math.min(t,3)*10:0;
 for(let x=-20;x<340;x+=16){r(x+(belt%16),120,8,2,'#d1b779');r(x+3,125,7,4,'#547365');r(x+5,126,3,1,'#a3b38a')}
 r(0,132,320,28,'#1c3338');for(let x=0;x<320;x+=34)r(x,149,29,1,'#37534f');
 const door=index>=2?(index===2?ease((t-.7)/1.2):1):0;
 if(door>0){r(121,119,62,13,'#06181f');r(121,132,62,28,'#0a1d24');r(121,121,Math.round(30*(1-door)),3,'#a1a882');r(154+Math.round(29*door),121,Math.round(29*(1-door)),3,'#a1a882');r(125,150,53,3,'#ab634f');for(let x=128;x<178;x+=9)r(x,146,4,6,'#d69b6e');text('TRITURADOR',152,141,4,'#bb876b')}
 let x=137,y=77,pose='normal';
 if(index===0)x=20+117*ease(t/3.2);
 if(index===1)pose=t>1.2?'worried':'think';
 if(index===2){const fall=ease((t-1)/1.4);x=137+16*fall;y=77+35*fall;pose=fall>.85?'hang':'panic';}
 if(index===3){const pull=ease(t/1.8);x=153+30*pull+88*ease((t-2.1)/3.1);y=112-35*pull;pose=t<1.8?'hang':'run';}
 robot(x,y,pose);
 if(index===1&&t<1.7){r(146,57,25,13,'#d5dfb6');text('3?',158,66,8,'#315147');r(150,70,3,3,'#d5dfb6')}
 if(index===1&&t>=1.7){text('!',x-10,y+3,12,'#f0b57b');r(x+27,y-3,2,4,'#89c7c4')}
 if(index===2&&t>2.4){r(176,117,11,4,'#d7dfb9');text('…!',199,105,8,'#e6c58b')}
 if(index===3&&t>=5.3){r(282,118,20,2,'#c6e6a8');text('↗',257,70,10);}
 // A framing rail gives a fixed visual baseline across all shots.
 r(0,0,320,5,'#0a1b22');text('ENSAMBLAJE / 07',66,12,4,'#8aab93');text(`SUM-0 / ${index+1}`,278,12,4,'#8aab93');
 function robot(rx,ry,pose){const hang=pose==='hang',run=pose==='run';const stride=reduced?0:run&&t<5.3?Math.sin(t*10)*3:0;
  r(rx+4,ry+33,6,9+Math.round(stride),'#6f9787');r(rx+19,ry+33,6,9-Math.round(stride),'#6f9787');r(rx+1,ry+41+stride,10,3,'#bdcfac');r(rx+18,ry+41-stride,11,3,'#bdcfac');
  r(rx+1,ry+18,27,18,'#afcba9');r(rx+6,ry+22,16,10,'#648e79');r(rx+12,ry+25,5,5,'#e3c57e');
  const tilt=pose==='think'?-2:pose==='worried'?2:0;r(rx+tilt,ry,30,19,'#bed7b4');r(rx+3+tilt,ry+4,24,11,'#193940');
  r(rx+7+tilt,ry+8,4,pose==='worried'?2:4,'#c5f0a6');r(rx+21+tilt,ry+8,4,pose==='worried'?2:4,'#c5f0a6');r(rx+14+tilt,ry+13,4,1,'#87af8f');r(rx+14,ry-6,2,6,'#6b9583');r(rx+12,ry-8,5,3,pose==='panic'||hang?'#eca17c':'#e8ca85');
  if(hang){r(rx-4,ry+22,4,15,'#7c9c86');r(rx-6,ry+35,8,4,'#cfdeb4');r(rx+27,ry+8,4,16,'#7c9c86');r(rx+26,ry+5,8,4,'#cfdeb4')}
  else{const raised=pose==='panic'||pose==='think';r(rx-5,ry+(raised?9:22),5,15,'#7c9c86');r(rx-7,ry+(raised?7:33),8,5,'#c3d6ad');r(rx+28,ry+21,5,14,'#7c9c86');r(rx+28,ry+32,8,5,'#c3d6ad')}
 }
 ctx.restore();
}
