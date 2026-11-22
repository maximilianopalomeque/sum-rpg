// Pixel icons for the HUD and the workshop, built as crisp inline SVG from grids.
const C={o:'#0a1316',m:'#bcfba4',M:'#e8ffd8',d:'#5f9a6a',a:'#ffcb77',A:'#fff1c0',r:'#ff7d6b',R:'#ffc2b5',k:'#7a2a22',b:'#9ff6ff',B:'#e3fdff',c:'#3f8a99',g:'#6c7a7f',G:'#c6d0cc',e:'#2a3b3f',w:'#ffffff'};
const ICONS={
 heart:['.oo.oo.','orRorro','orrrrro','orrrrko','.orrko.','..oko..','...o...'],
 heartEmpty:['.oo.oo.','oeeoeeo','oe...eo','oe...eo','.oe.eo.','..oeo..','...o...'],
 shield:['ooooooo','obBbbbo','obBbbco','obbbbco','.obbco.','..oco..','...o...'],
 freeze:['...o...','.o.b.o.','..oBo..','obBwBbo','..oBo..','.o.b.o.','...o...'],
 combo:['....oo.','...oao.','..oao..','.oAaaoo','oo.oao.','..oao..','.oo....'],
 heal:['..ooo..','..omo..','oooMooo','omMMMmo','oooMooo','..omo..','..ooo..'],
 battery:['..ooo..','.ooooo.','.ommmo.','.oMmmo.','.ommmo.','.odddo.','.ooooo.'],
 regen:['.oo.oo.','omMomro','ommmmro','.ommro.','oao.oao','.oaaao.','..ooo..'],
 charge:['.ooooo.','.oaAao.','.oaaao.','ooooooo','..oao..','.oAo...','.oo....'],
 sound:['...o...','..oo.o.','ooGo..o','oGGo.o.','ooGo..o','..oo.o.','...o...'],
 mute:['...o...','..oo...','ooGo.o.o','oGGo..o.','ooGo.o.o','..oo...','...o...'],
 pause:['.......','.oo.oo.','.oG.oG.','.oG.oG.','.oG.oG.','.oo.oo.','.......'],
 play:['.o.....','.oGo...','.oGGo..','.oGGGo.','.oGGo..','.oGo...','.o.....']
};
export function icon(name,size=14,cls=''){
 const g=ICONS[name]||ICONS.heart, h=g.length, w=Math.max(...g.map(r=>r.length)); let rects='';
 g.forEach((row,y)=>{ for(let x=0;x<row.length;x++){ const c=C[row[x]]; if(c) rects+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; } });
 return `<svg class="px-icon ${cls}" viewBox="0 0 ${w} ${h}" width="${size}" height="${Math.round(size*h/w)}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
export const POWER_ICON={shield:'shield',freeze:'freeze',combo:'combo',heal:'heal',battery:'battery',regen:'regen',charge:'charge'};
