/* Mosaik-Animationen FECG Singen. Alles hängt nur von der Zeit t ab (window.SEEK(t) für die Video-Aufnahme). */
(()=>{
const Q=new URLSearchParams(location.search);
const MODE=document.body.dataset.modus;
const W=1920,H=1080,S=120,NC=16,NR=9;
const FARBEN=['#eb6f5a','#3ab2df','#3adf4b','#dbd549','#5692e2','#b158e2'];
const NAVY='#0b1020';
const $=id=>document.getElementById(id);
const cv=$('m'),x=cv.getContext('2d');
const cl=v=>v<0?0:v>1?1:v;
const eo=p=>1-Math.pow(1-cl(p),3), ei=p=>Math.pow(cl(p),3);
const eio=p=>{p=cl(p);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;};
const back=p=>{p=cl(p);const c=1.4;return 1+(c+1)*Math.pow(p-1,3)+c*Math.pow(p-1,2);};
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;

/* Logo-Lage wie im Startbild: 440 breit, oben 300 */
const LW=+(Q.get('logo')||440),K=LW/3597,LH=1488*K,LX=(W-LW)/2,LY=300;
const PX=LX+(469+183)*K,PY=LY+LH/2;           // Mitte der Farbsäule
const SAEULE=[[0,0,0],[1,0,1],[2,0,2],[0,2,3],[1,2,4],[2,2,5],[1,3,0],[2,3,1],[0,10,3],[1,10,4],[2,10,2],[0,11,5],[1,11,0],[2,11,1]];
const imgW=new Image(),imgF=new Image();imgW.src='anim/logo-weiss.svg';imgF.src='anim/logo-farbe.svg';

/* Kachelwand 16 x 9 */
const cells=[];let maxd=0;
for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){
  let f;do{f=Math.floor(rnd()*6);}while((c>0&&cells[cells.length-1].f===f)||(r>0&&cells[(r-1)*NC+c].f===f));
  const cx=c*S+S/2,cy=r*S+S/2,d=Math.hypot(cx-PX,cy-PY);maxd=Math.max(maxd,d);
  cells.push({c,r,f,cx,cy,d,ph:rnd(),per:[8,12,24][Math.floor(rnd()*3)],diag:(c+r*.6)/(NC-1+(NR-1)*.6)});
}
cells.forEach(z=>z.d/=maxd);
SAEULE.forEach(([c,r,f],j)=>{
  const frei=cells.filter(z=>z.f===f&&!z.ziel&&z.d>.25);
  const z=frei[Math.floor(rnd()*frei.length)];
  z.ziel={x:LX+(469+122*c+61)*K,y:LY+(4+122*r+61)*K,j};
});
const TS=122*K;

function quad(cx,cy,s,farbe){x.fillStyle=farbe;x.fillRect(cx-s/2,cy-s/2,s,s);}
function logo(alpha,weiss,farbe,lx=LX,ly=LY,lw=LW){
  const lh=lw*1488/3597;
  if(farbe>0&&imgF.complete){x.globalAlpha=farbe;x.drawImage(imgF,lx,ly,lw,lh);}
  if(weiss>0&&imgW.complete){x.globalAlpha=alpha;x.save();
    const px=lx+(469+183)*lw/3597,b=lw*weiss;x.beginPath();x.rect(px-b,ly-10,2*b,lh+20);x.clip();
    x.drawImage(imgW,lx,ly,lw,lh);x.restore();}
  x.globalAlpha=1;
}

/* ---------- Intro (und rückwärts als Abspann) ---------- */
const T_INTRO=5.8;
let buchst=[];
function textAufbau(titel,sub){
  const h=$('title');h.textContent='';
  buchst=[...titel].map(ch=>{const s=document.createElement('span');s.textContent=ch===' '?' ':ch;h.appendChild(s);return s;});
  $('sub').textContent=sub;
}
const REIHE=[6,0,11,3,9,1,13,5,8,2,10,4,12,7];
function intro(t){
  x.clearRect(0,0,W,H);
  /* Farbsäule: Kachel für Kachel sanft einblenden, dann das Logo */
  SAEULE.forEach(([c,r,f],j)=>{
    const p=eo((t-(.5+REIHE[j]*.13))/.9);if(p<=0)return;
    x.globalAlpha=p;quad(LX+(469+122*c+61)*K,LY+(4+122*r+61)*K,TS*(.6+.4*p)+.5,FARBEN[f]);
  });
  x.globalAlpha=1;
  logo(eio((t-2.3)/1.4),1,cl((t-2.9)/.6));
  buchst.forEach((s,i)=>{const p=eo((t-(3.3+i*.045))/.9);s.style.opacity=p;s.style.transform=`translateY(${(1-p)*14}px)`;});
  $('strip').style.transform=`scaleX(${eo((t-3.9)/1.1)})`;
  $('strip').style.backgroundPosition=`${((Math.max(0,t-5)/7)%1)*156}px 0`;
  $('sub').style.opacity=cl((t-4.4)/1.2);
}
function abspann(t){
  const halt=+(Q.get('halt')||2.5);
  const tt=Math.max(0,T_INTRO-Math.max(0,t-halt)*1.15);
  intro(tt);
  $('strip').style.backgroundPosition=`${((t/7)%1)*156}px 0`;
  $('schwarz').style.opacity=cl((1.5-tt)/1.3);
}

/* ---------- Wörter einzeln aufbauen ---------- */
function woerter(el,text){
  el.textContent='';const out=[];
  text.split(/\s+/).forEach((w,i)=>{if(i)el.appendChild(document.createTextNode(' '));const s=document.createElement('span');s.className='w';s.textContent=w;el.appendChild(s);out.push(s);});
  return out;
}
let ws=[],rect=null;

/* ---------- Bibelvers ---------- */
function versAufbau(){
  const text=Q.get('text')||'Denn so sehr hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren geht, sondern ewiges Leben hat.';
  const v=$('verstext');v.style.fontSize=(text.length>260?46:text.length>150?56:text.length>70?66:78)+'px';
  ws=woerter(v,text);$('stelle').textContent=Q.get('stelle')||'Johannes 3,16';
}
function vers(t){
  x.clearRect(0,0,W,H);
  if(!rect)rect=$('versblock').getBoundingClientRect();
  const k=28,n=Math.max(4,Math.round(rect.height/k)),kk=rect.height/n,sx=rect.left-70;
  for(let i=0;i<n;i++){const a=eo((t-(.3+i*.06))/.8);if(a>0){x.globalAlpha=a;quad(sx,rect.top+kk*(i+.5),kk,FARBEN[i%6]);x.globalAlpha=1;}}
  const t1=.3+n*.045;
  ws.forEach((s,i)=>{const p=eo((t-(t1+i*.07))/.7);s.style.opacity=p;s.style.transform=`translateY(${(1-p)*18}px)`;});
  const t2=t1+ws.length*.07+.3;
  $('stelle').style.opacity=cl((t-t2)/.9);
  $('strip').style.transform=`scaleX(${eo((t-t2+.2)/1.0)})`;
  $('strip').style.backgroundPosition=`${((Math.max(0,t-t2)/7)%1)*156}px 0`;
  logo(cl((t-t2)/1)*.95,1,cl((t-t2)/1),W-150-230,H-90-95,230);
}

/* ---------- Titelkarte (Thema, Abendmahl, Gebet …) ---------- */
function titelAufbau(){
  const th=Q.get('thema')||'Abendmahl';
  const h=$('thema');h.style.fontSize=(th.length>40?84:th.length>22?104:132)+'px';
  ws=woerter(h,th);
  $('ober').textContent=Q.get('ober')||'';$('unter').textContent=Q.get('unter')||'';
}
function titel(t){
  x.clearRect(0,0,W,H);
  if(!rect)rect=$('reihe').getBoundingClientRect();
  const k=40,cy=rect.top+rect.height/2;
  for(let j=0;j<6;j++){const a=eo((t-(.4+j*.12))/.9);if(a<=0)continue;x.globalAlpha=a;quad(W/2+(j-2.5)*k,cy,k,FARBEN[j]);}
  x.globalAlpha=1;
  $('ober').style.opacity=cl((t-1.5)/.8);
  ws.forEach((s,i)=>{const p=eo((t-(1.35+i*.1))/1.0);s.style.opacity=p;s.style.transform=`translateY(${(1-p)*14}px)`;});
  $('unter').style.opacity=cl((t-(1.9+ws.length*.1))/.9);
  logo(cl((t-2.2)/1)*.95,1,cl((t-2.2)/1),(W-230)/2,H-80-95,230);
}

/* ---------- Logo-Schleife: die Farbsäule lebt (24 s) ---------- */
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const misch=(a,b,p)=>{const A=hex(a),B=hex(b);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*p)).join(',')})`;};
const LEBT=SAEULE.map(([c,r,f],j)=>{const per=[6,8,12][j%3];return {c,r,f,per,sch:per===8?2:3,ph:(j*2.7)%per};});
function logoschleife(t){
  x.clearRect(0,0,W,H);
  const lw=+(Q.get('breite')||900),k=lw/3597,lh=1488*k,lx=(W-lw)/2,ly=(H-lh)/2-(Q.get('text')?40:0);
  const px=lx+(469+183)*k,py=ly+lh/2,g=.5+.5*Math.sin(2*Math.PI*t/12);
  const r=lh*1.5,gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,`rgba(120,150,255,${.10+.10*g})`);gr.addColorStop(1,'rgba(120,150,255,0)');
  x.fillStyle=gr;x.fillRect(px-r,py-r,2*r,2*r);
  for(const z of LEBT){
    const u=(t+z.ph)/z.per,n=Math.floor(u),p=eio((u-n-(1-1.4/z.per))/(1.4/z.per));
    x.fillStyle=misch(FARBEN[(z.f+n*z.sch)%6],FARBEN[(z.f+(n+1)*z.sch)%6],p);
    x.fillRect(lx+(469+122*z.c)*k-.5,ly+(4+122*z.r)*k-.5,122*k+1,122*k+1);
  }
  if(imgW.complete)x.drawImage(imgW,lx,ly,lw,lh);
}

/* ---------- Tinte (wie im Startbild) ---------- */
let tinte=()=>{};
(()=>{const c=$('ink');if(!c)return;const gl=c.getContext('webgl',{preserveDrawingBuffer:true});if(!gl){c.remove();return;}
const vs="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const fs=`precision mediump float;uniform float t;uniform vec2 r;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*.9;
 float s=t*.007;
 vec2 q=vec2(fbm(p+vec2(0.,s)),fbm(p+vec2(5.2,1.3)-s));
 vec2 w=vec2(fbm(p+2.*q+vec2(1.7,9.2)+s*1.3),fbm(p+2.*q+vec2(8.3,2.8)-s*1.1));
 float f=fbm(p+2.2*w);
 vec3 c0=vec3(.03,.04,.085),c1=vec3(.13,.19,.38),c2=vec3(.30,.45,.85),c3=vec3(.30,.26,.62);
 vec3 col=mix(c0,c1,smoothstep(.35,.6,f));
 col=mix(col,c2,smoothstep(.35,.7,length(w)*f));
 col=mix(col,c3,smoothstep(.55,.95,q.y)*.5);
 float d=length((uv-vec2(.48,.46))*vec2(1.25,1.));
 col*=mix(.55,.95,smoothstep(.05,.7,d));col+=vec3(.05,.07,.15)*smoothstep(.55,0.,length((uv-vec2(.5,.56))*vec2(1.5,1.)));
 gl_FragColor=vec4(col,1.);
}`;
const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);return s;};
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const ut=gl.getUniformLocation(pr,"t"),ur=gl.getUniformLocation(pr,"r");gl.uniform2f(ur,c.width,c.height);
tinte=t=>{gl.uniform1f(ut,t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
})();

/* ---------- Ablauf ---------- */
const szene={intro,abspann,vers,titel,logoschleife}[MODE];
if(MODE==='logoschleife'&&Q.get('text')){$('sub').textContent=Q.get('text');$('sub').style.opacity=1;}
if(MODE==='vers')versAufbau();if(MODE==='titel')titelAufbau();
if(MODE==='intro')textAufbau(Q.get('titel')||'Willkommen',Q.get('text')||'Der Gottesdienst beginnt in Kürze');
if(MODE==='abspann')textAufbau(Q.get('titel')||'Der Gottesdienst ist beendet',Q.get('text')||'Gottes Segen für deine Woche');
const DAUER={intro:Infinity,abspann:Infinity,vers:Infinity,titel:Infinity,logoschleife:Infinity}[MODE]||Infinity;
let hand=false;const SCHLEIFE=MODE==='logoschleife';const off=SCHLEIFE?0:Math.random()*1e4;
window.SEEK=t=>{hand=true;tinte(500+(SCHLEIFE?0:t));szene(t);};
window.DAUER_VIDEO={intro:8,abspann:8,logoschleife:24,vers:12,titel:8}[MODE];
window.BEREIT=Promise.all([imgW.decode(),imgF.decode(),document.fonts.ready,document.fonts.load('600 50px InterD'),document.fonts.load('500 22px InterM')]).catch(()=>{});
window.BEREIT.then(()=>{
  const t0=performance.now();
  const loop=now=>{if(hand)return;const t=Math.max(0,(now-t0)/1000);tinte(off+t);szene(DAUER===Infinity?t:t%DAUER);requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
});
})();
