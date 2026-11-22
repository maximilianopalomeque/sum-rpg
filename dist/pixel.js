// Pixel-art drawing kit. Only fillRect, fillStyle and globalAlpha are used, so the
// same code draws the live scene, the intro film and deterministic test doubles.

export const OL = '#0a1316';

const FONT = {
 '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001011001111','4':'101101111001001',
 '5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111',
 A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',
 F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',
 K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',
 P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
 U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',
 Z:'111001010100111','+':'000010111010000','-':'000000111000000','=':'000111000111000','!':'010010010000010',
 '?':'111001010000010','.':'000000000000010',':':'000010000010000','/':'001001010100100','>':'100010001010100',
 '<':'001010100010001','x':'000101010101000',' ':'000000000000000',"'":'010010000000000','…':'000000000000101'
};

export function painter(ctx){
 const P = {
  ctx, ox:0, oy:0, tint:null,
  r(x,y,w,h,c){ if(w<=0||h<=0) return; ctx.fillStyle = P.tint||c; ctx.fillRect(Math.round(x+P.ox),Math.round(y+P.oy),Math.round(w),Math.round(h)); },
  alpha(a,fn){ const prev = ctx.globalAlpha ?? 1; ctx.globalAlpha = Math.max(0,Math.min(1,a))*prev; fn(); ctx.globalAlpha = prev; },
  // Shaded block: outline, base, top/left light, bottom/right shadow. pal = [lo, base, hi]
  part(x,y,w,h,pal,round=true,ol=OL){
   x=Math.round(x); y=Math.round(y);
   if(round){ P.r(x-1,y,w+2,h,ol); P.r(x,y-1,w,h+2,ol); } else P.r(x-1,y-1,w+2,h+2,ol);
   P.r(x,y,w,h,pal[1]);
   if(h>2&&w>2){ P.r(x,y,w,1,pal[2]); P.r(x,y,1,h-1,pal[2]); P.r(x,y+h-1,w,1,pal[0]); P.r(x+w-1,y+1,1,h-1,pal[0]); }
  },
  disc(cx,cy,rad,c){ for(let dy=-rad; dy<=rad; dy++){ const half=Math.round(Math.sqrt(Math.max(0,rad*rad-dy*dy))); P.r(cx-half,cy+dy,half*2+1,1,c); } },
  ring(cx,cy,rad,c,fill){ P.disc(cx,cy,rad+1,c); if(fill) P.disc(cx,cy,rad,fill); },
  line(x0,y0,x1,y1,c,t=1){
   x0=Math.round(x0); y0=Math.round(y0); x1=Math.round(x1); y1=Math.round(y1);
   const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let err=dx+dy, guard=0;
   const o=Math.floor((t-1)/2);
   while(guard++<600){ P.r(x0-o,y0-o,t,t,c); if(x0===x1&&y0===y1) break; const e2=2*err; if(e2>=dy){err+=dy;x0+=sx;} if(e2<=dx){err+=dx;y0+=sy;} }
  },
  // Outlined thick segment, for limbs and crane arms.
  limb(x0,y0,x1,y1,c,t=3){ P.line(x0,y0,x1,y1,OL,t+2); P.line(x0,y0,x1,y1,c,t); },
  grid(rows,x,y,pal,flip=false){
   for(let j=0;j<rows.length;j++){ const row=rows[j]; let i=0;
    while(i<row.length){ const ch=row[i]; if(ch==='.'||ch===' '){i++;continue;} let k=i; while(k<row.length&&row[k]===ch) k++;
     const c=pal[ch]; if(c){ const w=k-i; P.r(flip? x+row.length-k : x+i, y+j, w, 1, c); } i=k; }
   }
  },
  text(str,x,y,c,scale=1,align='left',shadow=null){
   const s=String(str).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/→/g,'>').replace(/×/g,'X');
   const w=s.length*4*scale-scale; let sx=align==='center'?x-Math.floor(w/2):align==='right'?x-w:x;
   if(shadow){ for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[1,1]]) draw(sx+dx*scale,y+dy*scale,shadow); }
   draw(sx,y,c); return w;
   function draw(px,py,col){ for(let n=0;n<s.length;n++){ const g=FONT[s[n]]||FONT['?']; for(let row=0;row<5;row++) for(let col2=0;col2<3;col2++) if(g[row*3+col2]==='1') P.r(px+n*4*scale+col2*scale,py+row*scale,scale,scale,col); } }
  }
 };
 return P;
}

// Small deterministic noise so drawings never depend on Math.random.
export function hash(n){ n = Math.imul(n ^ (n>>>16), 0x45d9f3b); n = Math.imul(n ^ (n>>>16), 0x45d9f3b); return ((n ^ (n>>>16))>>>0)/4294967296; }
export function rng(seed){ let a = seed>>>0; return ()=>{ a = (a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
export const ease = { out:v=>1-Math.pow(1-clamp(v),3), inOut:v=>{const q=clamp(v);return q*q*(3-2*q);}, back:v=>{const q=clamp(v)-1;return 1+2.2*q*q*q+1.2*q*q;} };
export function clamp(v,a=0,b=1){ return Math.max(a,Math.min(b,v)); }
