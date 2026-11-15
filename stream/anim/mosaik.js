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
const T_INTRO=6.8;
let buchst=[];
function textAufbau(titel,sub){
  const h=$('title');h.textContent='';
  buchst=[...titel].map(ch=>{const s=document.createElement('span');s.textContent=ch===' '?' ':ch;h.appendChild(s);return s;});
  $('sub').textContent=sub;
}
function intro(t){
  x.clearRect(0,0,W,H);
  const voll=t>1.75&&t<2.35;
  for(const z of cells){
    const a=back((t-(.25+z.d*1.0))/.5);
    if(a<=0)continue;
    if(z.ziel){
      const p=eio((t-(2.45+z.ziel.j*.035))/1.15);
      if(p>=1)continue;
      const bog=Math.sin(p*Math.PI)*90*(z.cx<PX?-1:1);
      quad(z.cx+(z.ziel.x-z.cx)*p+bog*.4,z.cy+(z.ziel.y-z.cy)*p-Math.abs(bog),(S+1)*a+(TS-S)*p,FARBEN[z.f]);
    }else{
      const b=ei((t-(2.35+(1-z.d)*.75))/.55);
      if(b>=1)continue;
      quad(z.cx+(PX-z.cx)*b*.3,z.cy+(PY-z.cy)*b*.3,(voll?S+1:S)*a*(1-b)+(a>=1&&b===0?1:0),FARBEN[z.f]);
    }
  }
  /* Lichtstreifen über die volle Wand */
  const g=(t-1.55)/1.0;
  if(g>0&&g<1){
    const gx=-600+g*(W+1200);const gr=x.createLinearGradient(gx-260,0,gx+260,160);
    gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');
    x.globalCompositeOperation='source-atop';x.fillStyle=gr;x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over';
  }
  /* Säule fertig: echte Logo-Farbflächen, kurzer Lichtpuls */
  const fertig=cl((t-3.55)/.5);
  const puls=Math.max(0,1-Math.abs(t-3.85)/.45);
  if(puls>0){const r=260,gr=x.createRadialGradient(PX,PY,0,PX,PY,r);gr.addColorStop(0,`rgba(190,210,255,${.5*puls})`);gr.addColorStop(1,'rgba(190,210,255,0)');x.fillStyle=gr;x.fillRect(PX-r,PY-r,2*r,2*r);}
  logo(cl((t-3.6)/.6),eo((t-3.6)/1.1),fertig);
  /* Text */
  buchst.forEach((s,i)=>{const p=eo((t-(4.35+i*.045))/.7);s.style.opacity=p;s.style.transform=`translateY(${(1-p)*26}px)`;});
  $('strip').style.transform=`scaleX(${eo((t-4.95)/1.0)})`;
  $('strip').style.backgroundPosition=`${((Math.max(0,t-5.9)/7)%1)*156}px 0`;
  $('sub').style.opacity=cl((t-5.5)/1.1);
}
function abspann(t){
  const halt=+(Q.get('halt')||2.5);
  const tt=Math.max(0,T_INTRO-Math.max(0,t-halt)*1.15);
  intro(tt);
  $('strip').style.backgroundPosition=`${((t/7)%1)*156}px 0`;
  $('schwarz').style.opacity=cl((2.3-tt)/.55);
}

/* ---------- Stinger (durchsichtig, Schnittpunkt bei 1,0 s) ---------- */
function stinger(t){
  x.clearRect(0,0,W,H);
  for(const z of cells){
    const s0=z.diag*.45,s1=1.1+z.diag*.45;
    const fa=eo((t-s0)/.3)*(1-ei((t-s1-.14)/.3));
    const na=eo((t-s0-.14)/.3)*(1-ei((t-s1)/.3));
    if(fa>0&&na<1)quad(z.cx,z.cy,(S+1)*fa,FARBEN[z.f]);
    if(na>0)quad(z.cx,z.cy,(S+1)*na,NAVY);
  }
  const la=cl((t-.72)/.2)*(1-cl((t-1.08)/.16));
  if(la>0){const lw=760,lh=lw*1488/3597;x.globalAlpha=la;const lx=(W-lw)/2,ly=(H-lh)/2;
    if(imgF.complete)x.drawImage(imgF,lx,ly,lw,lh);if(imgW.complete)x.drawImage(imgW,lx,ly,lw,lh);x.globalAlpha=1;}
}

/* ---------- Ruhiger Hintergrund (Schleife 24 s) ---------- */
function hintergrund(t){
  x.clearRect(0,0,W,H);
  const st=+(Q.get('staerke')||1);
  for(const z of cells){
    const w=Math.sin(2*Math.PI*(t/z.per+z.ph));
    const a=Math.pow(Math.max(0,w),4)*.2*st;
    x.globalAlpha=.035*st;x.strokeStyle='#aab6e0';x.lineWidth=1;x.strokeRect(z.cx-S/2+6.5,z.cy-S/2+6.5,S-13,S-13);
    if(a>.002){x.globalAlpha=a;quad(z.cx,z.cy,S-12,FARBEN[z.f]);}
  }
  x.globalAlpha=1;
}

/* ---------- Stinger 2: Farbbalken ---------- */
function balken(t){
  x.clearRect(0,0,W,H);const h=H/6;
  for(let i=0;i<6;i++){
    const d=i*.06,y=i*h;
    const cf=W*eo((t-d)/.5),nf=W*eo((t-d-.12)/.5);
    const nl=W*ei((t-1.1-d)/.42),clx=W*ei((t-1.1-d-.12)/.42);
    if(cf>clx){x.fillStyle=FARBEN[i];x.fillRect(clx,y,cf-clx,h+1);}
    if(nf>nl){x.fillStyle=NAVY;x.fillRect(nl,y,nf-nl,h+1);}
  }
  const la=cl((t-.8)/.16)*(1-cl((t-1.08)/.16));
  if(la>0){const lw=760,lh=lw*1488/3597;x.globalAlpha=la;const lx=(W-lw)/2,ly=(H-lh)/2;
    if(imgF.complete)x.drawImage(imgF,lx,ly,lw,lh);if(imgW.complete)x.drawImage(imgW,lx,ly,lw,lh);x.globalAlpha=1;}
}

/* ---------- Wellen: sechs Farblinien, Schleife 24 s ---------- */
function wellen(t){
  x.clearRect(0,0,W,H);
  const st=+(Q.get('staerke')||1),y0=+(Q.get('y')||790),u=2*Math.PI*t/24;
  x.lineWidth=3;x.lineCap='round';
  for(let i=0;i<6;i++){
    x.beginPath();
    for(let px=-20;px<=W+20;px+=10){
      const k=px/W;
      const y=y0+i*16+Math.sin(k*5.2+u*(1+i%2)+i*.55)*56*st+Math.sin(k*11.3-u*2+i*1.3)*20*st+Math.sin(k*2.1+u+i*.2)*46*st;
      px<0?x.moveTo(px,y):x.lineTo(px,y);
    }
    x.strokeStyle=FARBEN[i];x.shadowColor=FARBEN[i];x.shadowBlur=22;x.globalAlpha=.8;x.stroke();
  }
  x.shadowBlur=0;x.globalAlpha=1;
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
  for(let i=0;i<n;i++){const a=back((t-(.3+i*.045))/.45);if(a>0)quad(sx,rect.top+kk*(i+.5),kk*a,FARBEN[i%6]);}
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
  const k=40,n=W/k,cy=rect.top+rect.height/2,mitte=W/2;
  for(let i=0;i<n;i++){
    const cx=i*k+k/2,j=Math.round((cx-mitte)/k+.5),bleibt=j>=-2&&j<=3;
    const a=back((t-(.2+i*.014))/.35);if(a<=0)continue;
    const f=FARBEN[bleibt?j+2:(i*5+3)%6];
    if(bleibt)quad(cx,cy,k*a,f);
    else{const b=ei((t-(1.15+(1-Math.abs(cx-mitte)/mitte)*.45))/.4);if(b<1)quad(cx+(mitte-cx)*b*.25,cy,k*a*(1-b),f);}
  }
  $('ober').style.opacity=cl((t-1.5)/.8);
  ws.forEach((s,i)=>{const p=eo((t-(1.35+i*.1))/.8);s.style.opacity=p;s.style.transform=`translateY(${(1-p)*34}px)`;});
  $('unter').style.opacity=cl((t-(1.9+ws.length*.1))/.9);
  logo(cl((t-2.2)/1)*.95,1,cl((t-2.2)/1),(W-230)/2,H-80-95,230);
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
const szene={intro,abspann,stinger:Q.get('art')==='balken'?balken:stinger,hintergrund,wellen,vers,titel}[MODE];
if(MODE==='vers')versAufbau();if(MODE==='titel')titelAufbau();
if(MODE==='intro')textAufbau(Q.get('titel')||'Willkommen',Q.get('text')||'Der Gottesdienst beginnt in Kürze');
if(MODE==='abspann')textAufbau(Q.get('titel')||'Der Gottesdienst ist beendet',Q.get('text')||'Gottes Segen für deine Woche');
const DAUER={intro:Infinity,abspann:Infinity,stinger:+(Q.get('pause')||1.5)+2,hintergrund:Infinity}[MODE]||Infinity;
let hand=false;const SCHLEIFE=MODE==='hintergrund'||MODE==='wellen';const off=SCHLEIFE?0:Math.random()*1e4;
window.SEEK=t=>{hand=true;tinte(500+(SCHLEIFE?0:t));szene(t);};
window.DAUER_VIDEO={intro:10,abspann:8.5,stinger:2,hintergrund:24,wellen:24,vers:12,titel:8}[MODE];
window.BEREIT=Promise.all([imgW.decode(),imgF.decode(),document.fonts.ready,document.fonts.load('600 50px InterD'),document.fonts.load('500 22px InterM')]).catch(()=>{});
window.BEREIT.then(()=>{
  const t0=performance.now();
  const loop=now=>{if(hand)return;const t=(now-t0)/1000;tinte(off+t);szene(DAUER===Infinity?t:t%DAUER);requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
});
})();
