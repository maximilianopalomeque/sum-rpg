// Original pixel art. Everything is painted on a 320 × 134 logical canvas.
export function paint(ctx,s,t,flash){ctx.save();ctx.scale(3,3);ctx.imageSmoothingEnabled=false;const zone=Math.floor(s.round/2),w=320,h=134;const palettes=[['#193039','#27444b','#42605d','#c9ae73'],['#312d30','#4c3836','#765546','#e89c5e'],['#172e32','#254347','#476663','#bbdda0']];const [bg,wall,metal,light]=palettes[zone];const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
r(0,0,w,h,bg);r(0,24,w,76,wall);
// riveted wall panels, overhead cables and ventilation
for(let x=0;x<320;x+=40){r(x,24,1,77,bg);r(x+3,27,1,1,metal);r(x+36,27,1,1,metal);r(x+3,95,1,1,metal)}
for(let x=18;x<320;x+=79){r(x,6,3,13,'#0b2028');r(x-10,16,25,4,'#65756a');r(x-8,20,21,2,light);r(x-7,22,19,21,zone===1?'#4b3b32':'#2d4545')}
r(0,10,320,2,'#0c2128');r(0,14,320,1,'#3b5152');r(6,0,5,95,metal);r(8,0,1,95,'#6e8070');r(0,43,18,5,metal);r(300,5,6,94,metal);r(302,5,1,94,'#819184');
// rear windows and industrial silhouettes
for(let x=37;x<290;x+=82){r(x,39,49,42,'#13282e');r(x+2,41,45,38,metal);r(x+4,43,41,34,'#1b3338');for(let i=0;i<4;i++)r(x+8+i*9,49,5,23,'#2b4749');r(x+3,59,43,2,metal);r(x+23,42,2,36,metal)}
if(zone===1){for(let x=47;x<290;x+=82){r(x,69,30,7,'#c16c42');r(x+4,71,22,5,'#f6b56d')}}
if(zone===2){r(136,35,49,64,'#73927b');r(140,39,41,60,'#bed6a1');r(140,51,41,48,'#7fa88b');r(151,61,30,38,'#618c7e');r(145,31,30,6,'#badf9b');ctx.fillStyle='#253f39';ctx.font='4px monospace';ctx.fillText('SALIDA →',148,36);r(160,39,2,60,'#344f4c')}
else{r(141,34,40,25,'#13262b');r(143,36,36,21,'#3d514c');ctx.fillStyle=light;ctx.font='4px monospace';ctx.fillText(zone===0?'RECICLAJE':'NO PENSAR',145,45);ctx.fillText(zone===0?'→ 07':'SOLO SUMAR',147,52)}
// terminal and stacked salvage crates
r(13,71,22,27,'#1c2f35');r(15,74,18,12,'#596c5b');r(17,76,14,8,'#9fc796');r(18,78,7,1,'#385e4e');r(18,81,10,1,'#385e4e');r(17,89,3,2,light);r(25,89,5,2,'#79887a');
for(let i=0;i<3;i++){const x=265+i%2*14,y=87-Math.floor(i/2)*13;r(x,y,13,12,'#58655a');r(x+1,y+1,11,2,'#84907a');r(x+5,y+3,2,8,'#334b47');r(x+1,y+9,11,1,'#34443f')}
r(0,99,w,5,'#0b2025');r(0,104,w,3,metal);for(let x=0;x<w;x+=14){r(x,104,7,3,light)}r(0,107,w,27,'#233b3e');for(let x=-30;x<350;x+=32){r(x,115,26,1,'#45605a');r(x+14,127,26,1,'#45605a');r(x+25,108,1,7,'#172e33');r(x+8,116,1,11,'#172e33')}
// drifting dust, deterministic animation
for(let i=0;i<16;i++){const x=(i*43+t*2)%320,y=32+(i*23)%61;r(x,y,1,1,i%2?'#779587':'#46635c')}
const bob=Math.sin(t*3)>0?0:1;const kick=flash>0&&s.last==='hit'?4:0;const hurt=flash>0&&s.last==='hurt';
r(62,105,37,3,'#122a2d');r(233,105,40,3,'#122a2d');robot(68+kick,66+bob,hurt);enemy(237-kick,67+bob,s.round);
if(s.shield){ctx.strokeStyle='#bdf5a6';ctx.lineWidth=1;ctx.strokeRect(64,62,33,45)}if(s.frozen){r(0,0,320,2,'#94e4ef');r(0,132,320,2,'#94e4ef')}
if(flash>0&&s.last==='hit'){for(let i=0;i<7;i++)r(227+i*7,75+Math.sin(i*3)*14,2,2,'#fadd8a');r(111,82,110,2,'#c5efa2')}
function robot(x,y,hurt){const body=hurt?'#f5b08f':'#b9d6b5',shade='#73998a';r(x+5,y+32,7,7,shade);r(x+19,y+32,7,7,shade);r(x+2,y+38,11,3,'#d2dfbe');r(x+19,y+38,11,3,'#d2dfbe');r(x+3,y+17,25,17,body);r(x+7,y+21,16,9,shade);r(x+12,y+23,5,5,'#eed28a');r(x+2,y,28,18,body);r(x,y+3,2,10,shade);r(x+30,y+3,2,10,shade);r(x+5,y+4,22,10,'#213d43');r(x+9,y+7,3,3,'#c5f7ac');r(x+21,y+7,3,3,'#c5f7ac');r(x+16,y+11,3,1,'#8dbb9b');r(x+14,y-6,2,6,shade);r(x+13,y-8,4,3,'#ffcb77');r(x-3,y+20,5,11,shade);r(x-4,y+29,7,5,body);r(x+29,y+19,5,11,shade);r(x+31,y+26,8,6,body);r(x+37,y+27,4,4,'#e9cf8a');r(x+3,y+1,4,2,'#eaf0cf')}
function enemy(x,y,n){const boss=n===5, c=boss?'#d89c73':n%2?'#a1a4a0':'#beae8b',shade='#6e6d63';if(boss){x-=8;y-=12}const size=boss?40:28;r(x+2,y+32,size-4,7,shade);r(x,y+37,size,4,'#162c30');for(let i=0;i<size;i+=7)r(x+i,y+38,4,3,'#4b6866');r(x,y+8,size,24,c);r(x+3,y+11,size-6,11,'#253a3d');r(x+6,y+14,5,3,'#ffab77');r(x+size-11,y+14,5,3,'#ffab77');r(x+7,y+27,size-14,2,'#706f61');r(x+6,y, size-12,7,shade);r(x+10,y-3,size-20,4,c);r(x-5,y+13,5,14,shade);r(x+size,y+13,5,14,shade);r(x-7,y+23,8,6,c);r(x+size,y+23,8,6,c);if(n%2){r(x+size+5,y+19,3,6,'#e1bb7b');r(x+size+5,y+29,3,6,'#e1bb7b')}else{r(x-5,y+29,3,9,'#c6ac77');r(x-9,y+37,12,3,'#a2a48a')}if(boss){r(x+4,y+4,5,3,'#ffc478');r(x+size-9,y+4,5,3,'#ffc478');r(x+12,y+24,16,5,'#a75d4f')}}
ctx.restore();}
