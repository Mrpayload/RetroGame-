// --- GLOBAL VARIABLES & SETUP ---
const cur = document.getElementById('cur');
const cur2 = document.getElementById('cur2');
let mx = window.innerWidth/2, my = window.innerHeight/2;
const root = document.documentElement;

function setTheme(theme) {
  const next = theme || 'neon';
  if(next === 'neon') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', next);
  localStorage.setItem('holoTheme', next);
  document.querySelectorAll('.th-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === next);
  });
  cur2.style.background = getComputedStyle(root).getPropertyValue('--c1').trim();
}

setTheme(localStorage.getItem('holoTheme') || 'neon');
document.querySelectorAll('.th-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setTheme(btn.dataset.theme);
    sfx(520, 0.06, 'triangle', 0.07);
  });
});

// Custom Cursor
window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  cur2.style.left = mx + 'px'; cur2.style.top = my + 'px';
  if(Math.random()>0.7) createTrail(mx, my);
});
window.addEventListener('mousedown', () => cur.style.transform = 'translate(-50%,-50%) scale(0.8)');
window.addEventListener('mouseup', () => cur.style.transform = 'translate(-50%,-50%) scale(1)');

document.querySelectorAll('button, .db, .a-btn').forEach(b => {
  b.addEventListener('mouseenter', () => cur.classList.add('hover'));
  b.addEventListener('mouseleave', () => cur.classList.remove('hover'));
});

function createTrail(x, y) {
  const d = document.createElement('div');
  d.className = 'trail-dot';
  d.style.left = x + 'px'; d.style.top = y + 'px';
  d.style.width = Math.random()*5+2+'px';
  d.style.height = d.style.width;
  d.style.background = Math.random()>0.5 ? 'var(--c1)' : 'var(--c2)';
  d.style.boxShadow = '0 0 12px currentColor';
  d.style.color = d.style.background;
  document.body.appendChild(d);
  let op = 1;
  const anim = setInterval(() => {
    op -= 0.05; d.style.opacity = op;
    d.style.transform = `translate(-50%,-50%) translateY(${(1-op)*20}px)`;
    if(op <= 0) { clearInterval(anim); d.remove(); }
  }, 30);
}

// Background Canvas
const bgC = document.getElementById('bgCanvas');
const bgCtx = bgC.getContext('2d');
let stars = [];
function resizeBg() { bgC.width = window.innerWidth; bgC.height = window.innerHeight; }
window.addEventListener('resize', resizeBg); resizeBg();
for(let i=0; i<150; i++) stars.push({x:Math.random()*bgC.width, y:Math.random()*bgC.height, s:Math.random()*2, v:Math.random()*0.5+0.1});
function drawBg() {
  bgCtx.fillStyle = getComputedStyle(root).getPropertyValue('--bg').trim() || '#050810';
  bgCtx.fillRect(0,0,bgC.width,bgC.height);
  bgCtx.fillStyle = '#fff';
  stars.forEach(s => {
    s.y += s.v; if(s.y > bgC.height) { s.y = 0; s.x = Math.random()*bgC.width; }
    bgCtx.globalAlpha = Math.random()*0.5 + 0.3;
    bgCtx.fillRect(s.x, s.y, s.s, s.s);
  });
  bgCtx.globalAlpha = 1;
  requestAnimationFrame(drawBg);
}
drawBg();

// Audio
let actx = null;
function sfx(freq, dur, type='square', vol=0.1) {
  try {
    if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, actx.currentTime);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.start(actx.currentTime); o.stop(actx.currentTime + dur);
  } catch(e){}
}

// Game Canvas & State
const gc = document.getElementById('gc');
const ctx = gc.getContext('2d');
let CW = 400, CH = 300;
function resizeGame() {
  const rect = gc.parentElement.getBoundingClientRect();
  gc.width = rect.width; gc.height = rect.height;
  CW = gc.width; CH = gc.height;
}
window.addEventListener('resize', resizeGame); resizeGame();

let curGame = 'snake', loop = null, clean = null, score = 0, playing = false;
let keys = { up:false, down:false, left:false, right:false, a:false, b:false };

// Highscores
let hs = {};
try {
  hs = JSON.parse(localStorage.getItem('holoHS') || '{}') || {};
} catch (_) {
  hs = {};
}
function updateHSUI() {
  document.querySelectorAll('[id^="hs-"]').forEach(el => {
    const g = el.id.replace('hs-','');
    el.textContent = hs[g] || 0;
  });
  document.getElementById('hd').textContent = hs[curGame] || 0;
}
updateHSUI();
function saveScore() {
  if(!hs[curGame]) hs[curGame] = 0;
  if(score > hs[curGame]) {
    hs[curGame] = score;
    localStorage.setItem('holoHS', JSON.stringify(hs));
    updateHSUI();
    return true;
  }
  return false;
}

// Input Handling
const keyMap = {
  'ArrowUp':'up', 'w':'up', 'W':'up',
  'ArrowDown':'down', 's':'down', 'S':'down',
  'ArrowLeft':'left', 'a':'left', 'A':'left',
  'ArrowRight':'right', 'd':'right', 'D':'right',
  ' ':'a', 'Enter':'a', 'x':'b', 'X':'b'
};
window.addEventListener('keydown', e => {
  if(keyMap[e.key]) {
    keys[keyMap[e.key]] = true;
    if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  if(keyMap[e.key]) keys[keyMap[e.key]] = false;
});

// Virtual buttons
const vMap = { 'bu':'up', 'bd':'down', 'bl':'left', 'br':'right', 'bA':'a', 'bB':'b' };
for(let id in vMap) {
  const el = document.getElementById(id), k = vMap[id];
  const press = e => { e.preventDefault(); keys[k]=true; el.classList.add('on'); };
  const rel = e => { e.preventDefault(); keys[k]=false; el.classList.remove('on'); };
  el.addEventListener('mousedown', press); el.addEventListener('touchstart', press, {passive:false});
  el.addEventListener('mouseup', rel); el.addEventListener('touchend', rel, {passive:false});
  el.addEventListener('touchcancel', rel, {passive:false});
  el.addEventListener('mouseleave', rel);
}

// Game Flow
const gameInfo = {
  snake: { t:'SNAKE', i:'Arrow keys to move<br>Eat cubes to grow' },
  pong: { t:'PONG', i:'Up/Down to move paddle<br>First to 5 wins' },
  shooter: { t:'SHOOTER', i:'Arrows move, Space shoots<br>Destroy enemies' },
  dino: { t:'RUNNER', i:'Space to jump<br>Dodge obstacles' },
  breakout: { t:'BREAKER', i:'Left/Right to move<br>Clear all bricks' },
  flappy: { t:'FLAPPY', i:'Space to flap<br>Fly through pipes' },
  tetris: { t:'TETRIS', i:'Arrows to move/drop<br>Up/Space to rotate' },
  asteroids: { t:'ASTEROIDS', i:'Left/Right rotate<br>Up thrust, Space shoot' }
};

const ovStart = document.getElementById('ov-start');
const ovOver = document.getElementById('ov-over');

function showStart() {
  if(clean) clean(); if(loop) cancelAnimationFrame(loop); playing = false;
  keys = { up:false, down:false, left:false, right:false, a:false, b:false };
  document.getElementById('mq').textContent = `${gameInfo[curGame].t} — INSERT COIN`;
  document.getElementById('ov-title').textContent = gameInfo[curGame].t;
  document.getElementById('ov-inst').innerHTML = gameInfo[curGame].i;
  ovStart.classList.add('on'); ovOver.classList.remove('on');
  ctx.fillStyle='#020508'; ctx.fillRect(0,0,CW,CH);
}

function gameOver() {
  playing = false;
  if(clean) clean(); if(loop) cancelAnimationFrame(loop);
  const isNew = saveScore();
  ovOver.classList.add('on');
  document.getElementById('go-sc').textContent = score;
  document.getElementById('go-nh').style.display = isNew ? 'block' : 'none';
  sfx(200, 0.4, 'sawtooth', 0.2); setTimeout(()=>sfx(150, 0.5, 'sawtooth', 0.2), 200);
}

function startGame() {
  ovStart.classList.remove('on'); ovOver.classList.remove('on');
  score = 0; document.getElementById('sd').textContent = 0; playing = true;
  keys = { up:false, down:false, left:false, right:false, a:false, b:false };
  document.getElementById('mq').textContent = `${gameInfo[curGame].t} — PLAYING`;
  sfx(600, 0.1); setTimeout(()=>sfx(800, 0.2), 100);
  
  const games = { snake: runSnake, pong: runPong, shooter: runShooter, dino: runDino, breakout: runBreakout, flappy: runFlappy, tetris: runTetris, asteroids: runAsteroids };
  clean = games[curGame]();
}

document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnRetry').addEventListener('click', startGame);
document.querySelectorAll('.g-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.g-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    curGame = b.dataset.game;
    document.getElementById('hd').textContent = hs[curGame] || 0;
    sfx(400, 0.1, 'sine'); showStart();
  });
});

// Utils
function rect(x,y,w,h,c,g) {
  ctx.fillStyle = c;
  if(g) { ctx.shadowColor = c; ctx.shadowBlur = g; }
  ctx.fillRect(x,y,w,h); ctx.shadowBlur = 0;
}
function txt(s,x,y,c,f,a) {
  ctx.fillStyle = c; ctx.font = f; ctx.textAlign = a; ctx.fillText(s,x,y);
}

// ── 1. SNAKE ──
function runSnake() {
  const gs = 15; let cols = Math.floor(CW/gs), rows = Math.floor(CH/gs);
  let s = [{x:5,y:5},{x:4,y:5}], d = {x:1,y:0}, nd = {x:1,y:0}, f = {x:10,y:10}, t=0, spd=120;
  function up(time) {
    if(!playing) return; loop = requestAnimationFrame(up);
    if(keys.up && d.y===0) nd={x:0,y:-1}; if(keys.down && d.y===0) nd={x:0,y:1};
    if(keys.left && d.x===0) nd={x:-1,y:0}; if(keys.right && d.x===0) nd={x:1,y:0};
    if(time-t < spd) return; t=time; d={...nd};
    let h = {x:s[0].x+d.x, y:s[0].y+d.y};
    if(h.x<0||h.x>=cols||h.y<0||h.y>=rows||s.some(p=>p.x===h.x&&p.y===h.y)) return gameOver();
    s.unshift(h);
    if(h.x===f.x && h.y===f.y) {
      score+=10; document.getElementById('sd').textContent=score; spd=Math.max(40,spd-2);
      do {
        f = {x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows)};
      } while (s.some(p => p.x === f.x && p.y === f.y));
      sfx(800,0.05);
    } else s.pop();
    ctx.clearRect(0,0,CW,CH);
    rect(f.x*gs+1, f.y*gs+1, gs-2, gs-2, 'var(--c2)', 10);
    s.forEach((p,i) => rect(p.x*gs+1, p.y*gs+1, gs-2, gs-2, i===0?'#fff':'var(--c1)', i===0?10:5));
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 2. PONG ──
function runPong() {
  let py=CH/2-30, ay=CH/2-30, bx=CW/2, by=CH/2, vx=4, vy=3, pSc=0, aSc=0;
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up);
    if(keys.up) py = Math.max(0, py-6); if(keys.down) py = Math.min(CH-60, py+6);
    let asp = 3.5 + aSc*0.5;
    if(by < ay+30) ay -= asp; if(by > ay+30) ay += asp;
    bx+=vx; by+=vy;
    if(by<=0 || by>=CH-10) { vy*=-1; sfx(400,0.02); }
    if(bx<=20 && by>=py && by<=py+60 && vx<0) { vx*=-1.1; vy+=(by-(py+30))*0.1; sfx(600,0.05); }
    if(bx>=CW-20 && by>=ay && by<=ay+60 && vx>0) { vx*=-1.1; vy+=(by-(ay+30))*0.1; sfx(500,0.05); }
    if(bx<0) { aSc++; document.getElementById('sd').textContent=`${pSc}-${aSc}`; bx=CW/2;by=CH/2;vx=4; sfx(200,0.2); }
    if(bx>CW) { pSc++; score=pSc*100; document.getElementById('sd').textContent=`${pSc}-${aSc}`; bx=CW/2;by=CH/2;vx=-4; sfx(800,0.1); }
    if(pSc>=5 || aSc>=5) return gameOver();
    ctx.clearRect(0,0,CW,CH);
    rect(10, py, 10, 60, 'var(--c1)', 10); rect(CW-20, ay, 10, 60, 'var(--c2)', 10);
    rect(bx-5, by-5, 10, 10, '#fff', 10);
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 3. SHOOTER ──
function runShooter() {
  let px=CW/2, py=CH-30, b=[], e=[], lt=0;
  function up(t) {
    if(!playing) return; loop = requestAnimationFrame(up);
    if(keys.left) px=Math.max(0, px-5); if(keys.right) px=Math.min(CW-30, px+5);
    if(keys.up) py=Math.max(0, py-5); if(keys.down) py=Math.min(CH-30, py+5);
    if(keys.a && t-lt>150) { b.push({x:px+13,y:py,vy:-8}); lt=t; sfx(900,0.05); }
    if(Math.random() < 0.03 + score/50000) e.push({x:Math.random()*(CW-30),y:-30});
    b.forEach(i=>i.y+=i.vy); e.forEach(i=>i.y+=2+score/1000);
    b.forEach(ib => e.forEach(ie => {
      if(!ib.h && !ie.h && ib.x<ie.x+30 && ib.x+4>ie.x && ib.y<ie.y+30 && ib.y+10>ie.y) {
        ie.h=ib.h=true; score+=20; document.getElementById('sd').textContent=score; sfx(200,0.1);
      }
    }));
    b = b.filter(i=>!i.h && i.y>-20); e = e.filter(i=>!i.h && i.y<CH);
    if(e.some(ie => px<ie.x+25 && px+25>ie.x && py<ie.y+25 && py+25>ie.y)) return gameOver();
    ctx.clearRect(0,0,CW,CH);
    rect(px+10, py, 10, 20, 'var(--c1)', 10); rect(px, py+10, 30, 10, 'var(--c1)', 5);
    b.forEach(ib=>rect(ib.x, ib.y, 4, 10, 'var(--c3)', 10));
    e.forEach(ie=>rect(ie.x, ie.y, 30, 30, 'var(--c2)', 10));
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 4. RUNNER ──
function runDino() {
  let dy=CH-50, vy=0, j=false, o=[], f=0, spd=6;
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up); f++;
    vy+=0.6; dy+=vy; if(dy>=CH-50) { dy=CH-50; vy=0; j=false; }
    if(keys.a && !j) { vy=-12; j=true; sfx(400,0.1); }
    if(f%Math.max(40, 90-Math.floor(score/10))===0) o.push({x:CW, w:20+Math.random()*20, h:30+Math.random()*30});
    o.forEach(i=>i.x-=spd); o=o.filter(i=>i.x>-50);
    score++; if(score%10===0) document.getElementById('sd').textContent=score; spd = 6+score/1000;
    if(o.some(i => 50<i.x+i.w && 80>i.x && dy+40>CH-i.h)) return gameOver();
    ctx.clearRect(0,0,CW,CH);
    rect(0,CH-10,CW,2,'var(--c4)',5);
    rect(50, dy, 30, 40, 'var(--c1)', 10);
    o.forEach(i=>rect(i.x, CH-10-i.h, i.w, i.h, 'var(--c2)', 10));
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 5. BREAKER ──
function runBreakout() {
  let px=CW/2-40, bx=CW/2, by=CH-60, vx=4, vy=-4, b=[];
  for(let r=0;r<4;r++) for(let c=0;c<8;c++) b.push({x:10+c*((CW-20)/8), y:40+r*25, w:((CW-20)/8)-4, h:20});
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up);
    if(keys.left) px=Math.max(0,px-8); if(keys.right) px=Math.min(CW-80,px+8);
    bx+=vx; by+=vy;
    if(bx<=0||bx>=CW) vx*=-1; if(by<=0) vy*=-1;
    if(by>=CH-50 && by<=CH-40 && bx>=px && bx<=px+80) { vy=-Math.abs(vy); vx+=(bx-(px+40))*0.1; sfx(500,0.05); }
    if(by>CH) return gameOver();
    let hit=false;
    b.forEach(i => { if(!i.h && bx>i.x && bx<i.x+i.w && by>i.y && by<i.y+i.h) { i.h=true; hit=true; score+=50; document.getElementById('sd').textContent=score; sfx(800,0.05); } });
    if(hit) vy*=-1; b=b.filter(i=>!i.h);
    if(b.length===0) return gameOver();
    ctx.clearRect(0,0,CW,CH);
    rect(px, CH-40, 80, 10, 'var(--c1)', 10); rect(bx-5, by-5, 10, 10, '#fff', 10);
    b.forEach((i,idx)=>rect(i.x, i.y, i.w, i.h, idx%2===0?'var(--c2)':'var(--c4)', 5));
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 6. FLAPPY ──
function runFlappy() {
  let by=CH/2, vy=0, p=[], f=0, gap=140;
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up); f++;
    vy+=0.5; by+=vy;
    if(keys.a) { vy=-7; keys.a=false; sfx(400,0.1); }
    if(f%100===0) p.push({x:CW, t:50+Math.random()*(CH-gap-100), p:false});
    p.forEach(i=>{
      i.x-=3; if(!i.p && i.x<50) { i.p=true; score+=10; document.getElementById('sd').textContent=score; sfx(800,0.1); }
      if(70>i.x && 50<i.x+60 && (by<i.t || by+20>i.t+gap)) return gameOver();
    });
    p=p.filter(i=>i.x>-80);
    if(by>CH||by<-20) return gameOver();
    ctx.clearRect(0,0,CW,CH);
    rect(50, by, 30, 20, 'var(--c3)', 10);
    p.forEach(i => { rect(i.x, 0, 60, i.t, 'var(--c2)', 5); rect(i.x, i.t+gap, 60, CH, 'var(--c2)', 5); });
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 7. TETRIS ──
function runTetris() {
  const gs=20, cols=Math.floor(CW/gs), rows=Math.floor(CH/gs);
  let g=Array(rows).fill(0).map(()=>Array(cols).fill(0)), p=null, f=0;
  const pcs = [ [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]] ];
  function np() {
    let t=pcs[Math.floor(Math.random()*pcs.length)];
    p = { m:t, x:Math.floor(cols/2)-1, y:0, c:['var(--c1)','var(--c2)','var(--c3)','var(--c4)'][Math.floor(Math.random()*4)] };
    if(col(0,0,p.m)) gameOver();
  }
  function col(dx,dy,m) {
    for(let r=0;r<m.length;r++) for(let c=0;c<m[0].length;c++) {
      if(m[r][c] && (p.y+r+dy>=rows || p.x+c+dx<0 || p.x+c+dx>=cols || (p.y+r+dy>=0 && g[p.y+r+dy][p.x+c+dx]))) return true;
    }
    return false;
  }
  function rot() { let rm=p.m[0].map((v,i)=>p.m.map(r=>r[i]).reverse()); if(!col(0,0,rm)) p.m=rm; }
  np(); let lk={u:0,l:0,r:0,d:0};
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up); f++;
    if(keys.up && !lk.u) { rot(); lk.u=1; sfx(600,0.05); } if(!keys.up) lk.u=0;
    if(keys.left && !lk.l && !col(-1,0,p.m)) { p.x--; lk.l=1; } if(!keys.left) lk.l=0;
    if(keys.right && !lk.r && !col(1,0,p.m)) { p.x++; lk.r=1; } if(!keys.right) lk.r=0;
    let s=keys.down?5:30;
    if(f%s===0) {
      if(!col(0,1,p.m)) p.y++; else {
        for(let r=0;r<p.m.length;r++) for(let c=0;c<p.m[0].length;c++) if(p.m[r][c]) g[p.y+r][p.x+c]=p.c;
        let lns=0;
        for(let r=rows-1;r>=0;r--) if(g[r].every(v=>v)) { g.splice(r,1); g.unshift(Array(cols).fill(0)); lns++; r++; }
        if(lns>0) { score+=lns*100; document.getElementById('sd').textContent=score; sfx(800,0.1); }
        sfx(400,0.05); np();
      }
    }
    ctx.clearRect(0,0,CW,CH);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(g[r][c]) rect(c*gs,r*gs,gs-1,gs-1,g[r][c],5);
    for(let r=0;r<p.m.length;r++) for(let c=0;c<p.m[0].length;c++) if(p.m[r][c]) rect((p.x+c)*gs,(p.y+r)*gs,gs-1,gs-1,p.c,10);
  }
  loop = requestAnimationFrame(up); return ()=>{};
}

// ── 8. ASTEROIDS ──
function runAsteroids() {
  let s={x:CW/2,y:CH/2,a:0,vx:0,vy:0}, b=[], a=[];
  for(let i=0;i<5;i++) a.push({x:Math.random()*CW,y:Math.random()*CH,s:40,vx:Math.random()*2-1,vy:Math.random()*2-1});
  function up() {
    if(!playing) return; loop = requestAnimationFrame(up);
    if(keys.left) s.a-=0.1; if(keys.right) s.a+=0.1;
    if(keys.up) { s.vx+=Math.cos(s.a)*0.1; s.vy+=Math.sin(s.a)*0.1; sfx(100,0.02,'sawtooth',0.05); }
    s.x+=s.vx; s.y+=s.vy; s.vx*=0.99; s.vy*=0.99;
    if(s.x<0) s.x=CW; if(s.x>CW) s.x=0; if(s.y<0) s.y=CH; if(s.y>CH) s.y=0;
    if(keys.a) { keys.a=false; b.push({x:s.x,y:s.y,vx:Math.cos(s.a)*8,vy:Math.sin(s.a)*8,l:50}); sfx(800,0.05); }
    b.forEach(i=>{i.x+=i.vx;i.y+=i.vy;i.l--;}); b=b.filter(i=>i.l>0);
    a.forEach(i=>{ i.x+=i.vx; i.y+=i.vy; if(i.x<0)i.x=CW;if(i.x>CW)i.x=0;if(i.y<0)i.y=CH;if(i.y>CH)i.y=0; });
    b.forEach(ib => a.forEach(ia => {
      let dx=ib.x-ia.x, dy=ib.y-ia.y;
      if(!ib.h && !ia.h && Math.sqrt(dx*dx+dy*dy)<ia.s) {
        ib.h=ia.h=true; score+=10; document.getElementById('sd').textContent=score; sfx(400,0.1);
        if(ia.s>15) { a.push({x:ia.x,y:ia.y,s:ia.s/2,vx:Math.random()*4-2,vy:Math.random()*4-2}); a.push({x:ia.x,y:ia.y,s:ia.s/2,vx:Math.random()*4-2,vy:Math.random()*4-2}); }
      }
    }));
    b=b.filter(i=>!i.h); a=a.filter(i=>!i.h);
    if(a.some(i=>Math.sqrt((s.x-i.x)**2+(s.y-i.y)**2)<i.s)) return gameOver();
    if(a.length===0) for(let i=0;i<5+score/50;i++) a.push({x:Math.random()*CW,y:Math.random()*CH,s:40,vx:Math.random()*2-1,vy:Math.random()*2-1});
    ctx.clearRect(0,0,CW,CH);
    ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.a);
    ctx.strokeStyle='var(--c1)'; ctx.shadowColor='var(--c1)'; ctx.shadowBlur=10; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-10,8); ctx.lineTo(-10,-8); ctx.closePath(); ctx.stroke();
    if(keys.up) { ctx.beginPath(); ctx.moveTo(-10,4); ctx.lineTo(-20,0); ctx.lineTo(-10,-4); ctx.strokeStyle='var(--c2)'; ctx.stroke(); }
    ctx.restore(); ctx.shadowBlur=0;
    b.forEach(i=>rect(i.x,i.y,3,3,'var(--c3)',10));
    ctx.strokeStyle='var(--c4)'; ctx.shadowColor='var(--c4)'; ctx.shadowBlur=10;
    a.forEach(i=>{ ctx.beginPath(); ctx.arc(i.x,i.y,i.s,0,Math.PI*2); ctx.stroke(); }); ctx.shadowBlur=0;
  }
  loop = requestAnimationFrame(up); return ()=>{};
}
