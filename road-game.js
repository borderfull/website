(function () {
'use strict';

const canvas = document.getElementById('road-canvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');

const P = {
  paper:'#f1e9d8', paper2:'#e8dec8', ink:'#1c1814',
  soft:'#4a4238',  mute:'#8a7f6e',   rule:'#c9bda5',
  accent:'#b15a3a', horizon:'#4a6d8c'
};

const GRAVITY = 0.52, JUMP_VY = -13.2, BX_FRAC = 0.22;
const OFFROAD_DUR = 8; // seconds biker is in off-road state

/* ── Ranges ─────────────────────────────────────────────────────────── */
const RANGES = [
  { name:'Range I',   sub:'The Valley Floor',  alt:'3,200m', coords:'34.02°N', dur:60, spd:3.0,
    set:['mountain','goat','mountain','tunnel','mountain','offroad','goat','mountain','goat','mountain'] },
  { name:'Range II',  sub:'The Upper Reaches', alt:'4,100m', coords:'34.84°N', dur:60, spd:4.1,
    set:['mountain','yak','mountain','offroad','tunnel','landslide','mountain','yak','mountain','offroad','mountain'] },
  { name:'Range III', sub:'Near the Pass',     alt:'5,300m', coords:'35.49°N', dur:60, spd:5.4,
    set:['offroad','landslide','mountain','construction','yak','mountain','tunnel','mountain','construction','yak','offroad','mountain','yak','mountain'] }
];

/* ── Obstacle configs ──────────────────────────────────────────────── */
const OCFG = {
  mountain:     { action:'jump',    wait:0,    pts:0, cw:104, ch:80, label:'Summit',        msg:'',                                               sound:'whoosh!'        },
  tunnel:       { action:'boost',   wait:0,    pts:3, cw:118, ch:76, label:'Tunnel',         msg:'',                                               sound:'whoooosh'       },
  offroad:      { action:'offroad', wait:0,    pts:4, cw:50,  ch:0,  label:'Off-road track', msg:'',                                               sound:'rattle rattle'  },
  goat:         { action:'wait',    wait:4500, pts:3, cw:58,  ch:46, label:'Goat crossing',  msg:'The goats do not know your schedule.',           sound:'baa...'         },
  yak:          { action:'wait',    wait:7500, pts:5, cw:66,  ch:54, label:'Yak herd',       msg:'A yak herd crosses. The mountain does not hurry.', sound:'hrrmph...'    },
  landslide:    { action:'wait',    wait:6000, pts:4, cw:72,  ch:58, label:'Landslide',      msg:'The mountain is rearranging itself. You wait.',  sound:'crack!'         },
  construction: { action:'wait',    wait:9000, pts:6, cw:84,  ch:60, label:'Road work',      msg:'Roads are always being made. Always becoming.',  sound:'rumbling!'      }
};

/* ── State variables ───────────────────────────────────────────────── */
let S = 'idle'; // idle | playing | waiting | transition | crashed | gameover | done
let rangeIdx=0, rangeT=0, moments=0, worldX=0, speed=3;
let bikerY=0, bikerVY=0, onGround=true, bikerBob=0, wheelAngle=0;
let boosted=false, boostT=0;
let offroad=false, offroadT=0;
let waitT=0, waitDur=0, waitMsg='', waitLabel='', waitPts=0;
let transT=0;
let obstacles=[], obsQueue=[], nextObsIn=620, timeSinceSpawn=0;
let totalJumps=0, totalWaits=0, totalTunnels=0;
let crashTimer=0, crashRange='', crashMoments=0;
let notifMsg='', notifT=0;
let soundPops=[], waitSound='';
let W=0, H=0, GY=0;
let highScore = parseInt(localStorage.getItem('road-game-highscore') || '0');

/* ── Resize ────────────────────────────────────────────────────────── */
function resize() {
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.parentElement.clientWidth || 900;
  const cssH = Math.round(Math.min(300, Math.max(220, cssW * 0.3)));
  W = cssW; H = cssH;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  GY = Math.round(H * 0.74);
  if (S !== 'playing') { bikerY = GY; bikerVY = 0; onGround = true; }
}

/* ── Background mountain layers (sum-of-sines terrain) ────────────── */
function drawMtnLayer(yOff, yAmp, scroll, color) {
  const ox = worldX * scroll / W;
  ctx.beginPath(); ctx.moveTo(-2, GY);
  for (let i = 0; i <= 50; i++) {
    const t = i/50, p = ox + t*3.8;
    const h = Math.max(0, Math.sin(p*Math.PI))*0.52
            + Math.max(0, Math.sin(p*Math.PI*2.3+1.1))*0.28
            + Math.max(0, Math.sin(p*Math.PI*0.7+2.4))*0.34;
    ctx.lineTo(t*W, GY - yOff - h*yAmp);
  }
  ctx.lineTo(W+2, GY); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}

function drawBg() {
  const sky = ctx.createLinearGradient(0,0,0,GY);
  sky.addColorStop(0,'#d5cec0'); sky.addColorStop(1,P.paper2);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,GY);

  drawMtnLayer(H*0.30, H*0.26, 0.07, 'rgba(74,109,140,0.15)');
  drawMtnLayer(H*0.10, H*0.18, 0.22, 'rgba(28,24,20,0.08)');
  drawMtnLayer(0,      H*0.09, 0.50, 'rgba(28,24,20,0.13)');

  const gnd = ctx.createLinearGradient(0,GY,0,H);
  gnd.addColorStop(0,'#cec2ad'); gnd.addColorStop(1,P.rule);
  ctx.fillStyle=gnd; ctx.fillRect(0,GY,W,H-GY);

  // Off-road gravel overlay (fades in/out)
  if (offroad && offroadT > 0) {
    const alpha = Math.min(1,(OFFROAD_DUR-offroadT)*2.5) * Math.min(1,offroadT*2.5);
    ctx.fillStyle=`rgba(140,118,90,${alpha*0.28})`;
    ctx.fillRect(0,GY,W,H-GY);
    if (alpha > 0.3) {
      const period=190, shift=worldX*0.85%period;
      [[18,0.40],[52,0.72],[88,0.22],[128,0.60],[162,0.88]].forEach(([bx2,yf]) => {
        for (let c=-1; c<=Math.ceil(W/period)+1; c++) {
          const rx=bx2+c*period-shift;
          if (rx<-5||rx>W+5) continue;
          ctx.beginPath(); ctx.arc(rx, GY+6+yf*(H-GY-14), 2+yf*1.5, 0, Math.PI*2);
          ctx.fillStyle=`rgba(100,85,65,${alpha*0.55})`; ctx.fill();
        }
      });
    }
  }

  ctx.strokeStyle='#a8997e'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke();

  if (!offroad) {
    const ry=GY+(H-GY)*0.38;
    ctx.strokeStyle='rgba(178,162,142,0.7)'; ctx.lineWidth=1.5;
    ctx.setLineDash([22,16]); ctx.lineDashOffset=-(worldX%38);
    ctx.beginPath(); ctx.moveTo(0,ry); ctx.lineTo(W,ry); ctx.stroke();
    ctx.setLineDash([]);
  }
}

/* ── Wheel ─────────────────────────────────────────────────────────── */
function drawWheel(lx, ly, r, a) {
  ctx.fillStyle=P.ink; ctx.beginPath(); ctx.arc(lx,ly,r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.paper2; ctx.beginPath(); ctx.arc(lx,ly,r*0.44,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=P.paper2; ctx.lineWidth=1;
  for (let i=0;i<4;i++) {
    const ang=a+i*Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(lx+Math.cos(ang)*r*0.44, ly+Math.sin(ang)*r*0.44);
    ctx.lineTo(lx+Math.cos(ang)*r*0.88, ly+Math.sin(ang)*r*0.88);
    ctx.stroke();
  }
}

/* ── Biker ─────────────────────────────────────────────────────────── */
function drawBikerFn() {
  const bx   = W * BX_FRAC;
  const lean = bikerVY < -3 ? -0.15 : (bikerVY > 2 ? 0.06 : 0);
  // Off-road: rapid vibration on both axes
  const vibX = offroad ? Math.sin(worldX*1.3)*2.8 : 0;
  const vibY = offroad
    ? Math.sin(bikerBob*3.5)*4.0
    : (onGround ? Math.sin(bikerBob*0.9)*0.7 : 0);

  // Crash: tilt forward progressively
  const crashLean = (S==='crashed'||S==='gameover')
    ? Math.min(crashTimer/1.2, 1) * (Math.PI*0.55)
    : 0;
  const crashDrop = (S==='crashed'||S==='gameover')
    ? Math.min(crashTimer/1.2, 1) * 22
    : 0;

  ctx.save();
  ctx.translate(bx+vibX, bikerY+vibY+crashDrop);
  ctx.rotate(lean + (offroad ? Math.sin(worldX*0.9)*0.05 : 0) + crashLean);

  if (boosted) {
    for (let i=0;i<4;i++) {
      ctx.beginPath(); ctx.arc(-32-i*14,-14-i*3,3-i*0.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(177,90,58,${0.48-i*0.1})`; ctx.fill();
    }
  } else if (offroad) {
    for (let i=0;i<3;i++) {
      ctx.beginPath(); ctx.arc(-28-i*10,-8-i*2,4-i*0.8,0,Math.PI*2);
      ctx.fillStyle=`rgba(140,118,90,${0.30-i*0.08})`; ctx.fill();
    }
  } else if (onGround) {
    ctx.beginPath(); ctx.arc(-30,-10,3,0,Math.PI*2);
    ctx.fillStyle='rgba(74,66,56,0.16)'; ctx.fill();
  }

  drawWheel(-17,-13,12,wheelAngle);
  drawWheel(18, -11,10,wheelAngle*1.05);

  ctx.fillStyle=P.ink;
  ctx.beginPath();
  ctx.moveTo(-22,-13); ctx.lineTo(-12,-28); ctx.lineTo(-4,-30);
  ctx.lineTo(10,-28);  ctx.lineTo(18,-22);  ctx.lineTo(18,-11);
  ctx.lineTo(10,-14);  ctx.lineTo(-2,-17);  ctx.lineTo(-22,-13);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-4,-17,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=P.ink; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(8,-28); ctx.lineTo(20,-31); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18,-14); ctx.quadraticCurveTo(-28,-8,-30,0);
  ctx.strokeStyle=P.soft; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=P.ink;
  ctx.save(); ctx.translate(-2,-36); ctx.rotate(-0.3);
  ctx.beginPath(); ctx.ellipse(0,0,6,10,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle=P.ink; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(2,-42); ctx.lineTo(14,-31); ctx.stroke();
  ctx.fillStyle=P.ink; ctx.beginPath(); ctx.arc(2,-47,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.paper2;
  ctx.save(); ctx.translate(4,-46);
  ctx.beginPath(); ctx.arc(0,0,5,-0.5,0.5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ── Obstacle draw functions ────────────────────────────────────────── */
function drawMountain(obs) {
  const {x,cw:w,ch:h}=obs, px=x+w/2, py=GY-h;
  ctx.beginPath();
  ctx.moveTo(x-12,GY);
  ctx.lineTo(x+w*0.12,GY-h*0.36); ctx.lineTo(x+w*0.22,GY-h*0.31);
  ctx.lineTo(px-9,GY-h*0.80); ctx.lineTo(px,py);
  ctx.lineTo(px+8,GY-h*0.78); ctx.lineTo(x+w*0.78,GY-h*0.34);
  ctx.lineTo(x+w*0.88,GY-h*0.40); ctx.lineTo(x+w+12,GY);
  ctx.closePath(); ctx.fillStyle=P.soft; ctx.fill();
  ctx.beginPath(); ctx.moveTo(px-9,GY-h*0.74); ctx.lineTo(px,py); ctx.lineTo(px+7,GY-h*0.72);
  ctx.closePath(); ctx.fillStyle=P.paper; ctx.fill();
  ctx.save(); ctx.strokeStyle=P.mute; ctx.lineWidth=0.7;
  ctx.beginPath(); ctx.moveTo(px-16,py+2); ctx.lineTo(px+22,py+6); ctx.stroke();
  [P.accent,P.horizon,P.paper2,P.mute].forEach((c,i)=>{
    ctx.fillStyle=c; ctx.beginPath(); ctx.rect(px-15+i*11,py-5,9,7); ctx.fill();
  });
  ctx.restore();
}

function drawTunnel(obs) {
  const {x,cw:w,ch:h}=obs;
  ctx.fillStyle='#5a5048'; ctx.beginPath(); ctx.rect(x,GY-h,w,h); ctx.fill();
  ctx.strokeStyle='rgba(28,24,20,0.2)'; ctx.lineWidth=0.5;
  for(let i=0;i<8;i++){ ctx.beginPath(); ctx.moveTo(x+i*(w/8),GY-h); ctx.lineTo(x+i*(w/8)+4,GY-h*0.55); ctx.stroke(); }
  const ow=w*0.68, ox2=x+(w-ow)/2;
  ctx.save(); ctx.beginPath();
  ctx.moveTo(ox2,GY); ctx.lineTo(ox2,GY-ow*0.4);
  ctx.quadraticCurveTo(ox2,GY-h*0.92,ox2+ow/2,GY-h*0.92);
  ctx.quadraticCurveTo(ox2+ow,GY-h*0.92,ox2+ow,GY-ow*0.4);
  ctx.lineTo(ox2+ow,GY); ctx.closePath();
  const tg=ctx.createLinearGradient(ox2,0,ox2+ow,0);
  tg.addColorStop(0,'#0e0c0a'); tg.addColorStop(0.5,'#1a1612'); tg.addColorStop(1,'#0e0c0a');
  ctx.fillStyle=tg; ctx.fill();
  const lg=ctx.createRadialGradient(ox2+ow/2,GY-h*0.6,0,ox2+ow/2,GY-h*0.6,ow*0.22);
  lg.addColorStop(0,'rgba(241,233,216,0.38)'); lg.addColorStop(1,'transparent');
  ctx.beginPath(); ctx.arc(ox2+ow/2,GY-h*0.6,ow*0.22,0,Math.PI*2); ctx.fillStyle=lg; ctx.fill();
  ctx.restore();
  // Label: dark ink for legibility against the sky background
  ctx.font='300 9px "IBM Plex Mono",monospace';
  ctx.fillStyle=P.soft; ctx.textAlign='center';
  ctx.fillText('TUNNEL', x+w/2, GY-h-8);
}

function drawGoat(obs) {
  const cx=obs.x+12, bob=Math.sin(obs.anim)*1.5;
  ctx.save(); ctx.translate(cx,GY+bob); ctx.fillStyle=P.ink; ctx.strokeStyle=P.ink;
  [0,30].forEach((ox,idx)=>{
    if(idx&&obs.cw<48) return;
    ctx.save(); ctx.translate(ox,0); if(idx) ctx.scale(-1,1);
    ctx.beginPath(); ctx.ellipse(0,-14,11,7,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13,-19,6,5,0.2,0,Math.PI*2); ctx.fill();
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(12,-23); ctx.lineTo(9,-29);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15,-23); ctx.lineTo(17,-29); ctx.stroke();
    ctx.lineWidth=2;
    [[-6,-7],[-1,-7],[5,-7],[9,-8]].forEach(([lx,ly])=>{ ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx-1,6); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-11,-10); ctx.lineTo(-16,-16); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawYak(obs) {
  const cx=obs.x+15, bob=Math.sin(obs.anim*0.7)*1.0;
  ctx.save(); ctx.translate(cx,GY+bob); ctx.fillStyle=P.ink; ctx.strokeStyle=P.ink;
  [0,46].forEach((ox,idx)=>{
    if(idx&&obs.cw<56) return;
    ctx.save(); ctx.translate(ox,0);
    ctx.beginPath(); ctx.ellipse(0,-18,16,10,-0.1,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,-10,14,5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18,-22,8,6,0.2,0,Math.PI*2); ctx.fill();
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(16,-27); ctx.quadraticCurveTo(12,-35,9,-32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(21,-26); ctx.quadraticCurveTo(24,-34,20,-32); ctx.stroke();
    ctx.lineWidth=3;
    [[-8,-7],[-2,-7],[4,-7],[9,-8]].forEach(([lx,ly])=>{ ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx-1,10); ctx.stroke(); });
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-16,-14); ctx.quadraticCurveTo(-25,-18,-23,-26); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawLandslide(obs) {
  const {x,cw:w,ch:h}=obs;
  ctx.beginPath();
  ctx.moveTo(x-8,GY); ctx.lineTo(x,GY-h*0.28); ctx.lineTo(x+w*0.12,GY-h);
  ctx.lineTo(x+w*0.22,GY-h*0.78); ctx.lineTo(x+w*0.38,GY-h*0.60);
  ctx.lineTo(x+w*0.50,GY-h*0.72); ctx.lineTo(x+w*0.65,GY-h*0.38);
  ctx.lineTo(x+w*0.80,GY-h*0.46); ctx.lineTo(x+w+8,GY-h*0.08); ctx.lineTo(x+w+14,GY);
  ctx.closePath(); ctx.fillStyle=P.soft; ctx.fill();
  ctx.strokeStyle='rgba(28,24,20,0.18)'; ctx.lineWidth=0.6;
  for(let i=0;i<4;i++){ const rx=x+w*0.1+i*(w*0.15),ry=GY-h*0.2-i*8; ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+10,ry+6); ctx.stroke(); }
  const sx=x+w*0.5, sy=GY-h-26;
  ctx.save(); ctx.beginPath(); ctx.moveTo(sx,sy-18); ctx.lineTo(sx-14,sy+6); ctx.lineTo(sx+14,sy+6); ctx.closePath();
  ctx.fillStyle=P.accent; ctx.fill(); ctx.strokeStyle=P.paper; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font='bold 13px "IBM Plex Mono",monospace'; ctx.fillStyle=P.paper;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('!',sx,sy-6); ctx.restore();
}

function drawBarrierAt(bx2,by) {
  ctx.save(); ctx.translate(bx2,by); ctx.fillStyle=P.ink;
  ctx.beginPath(); ctx.rect(-2,-40,4,40); ctx.fill();
  [P.accent,P.paper2,P.accent,P.paper2].forEach((c,i)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.rect(-8,-40+i*9,16,8); ctx.fill(); });
  ctx.strokeStyle=P.ink; ctx.lineWidth=1; ctx.beginPath(); ctx.rect(-8,-40,16,36); ctx.stroke();
  ctx.restore();
}

function drawConstruction(obs) {
  const {x,cw:w}=obs;
  ctx.save(); ctx.translate(x+w*0.62,GY); ctx.fillStyle=P.ink;
  ctx.beginPath(); ctx.rect(-4,-28,8,12); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-34,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.accent; ctx.beginPath(); ctx.ellipse(0,-30,7,3,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(4,-34); ctx.lineTo(4,-24); ctx.stroke();
  ctx.fillStyle=P.accent; ctx.beginPath(); ctx.rect(4,-36,11,7); ctx.fill();
  ctx.strokeStyle=P.ink; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(-2,-16); ctx.lineTo(-3,0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2,-16); ctx.lineTo(4,0); ctx.stroke();
  ctx.restore();
  drawBarrierAt(x+w*0.08,GY); drawBarrierAt(x+w*0.5,GY);
  ctx.font='300 9px "IBM Plex Mono",monospace'; ctx.fillStyle=P.ink; ctx.textAlign='center';
  ctx.fillText('ROAD WORK',x+w/2,GY-64);
}

function drawObs(obs) {
  if (obs.type==='offroad') return; // visual handled by bg state
  switch(obs.type) {
    case 'mountain':     drawMountain(obs);     break;
    case 'tunnel':       drawTunnel(obs);       break;
    case 'goat':         drawGoat(obs);         break;
    case 'yak':          drawYak(obs);          break;
    case 'landslide':    drawLandslide(obs);    break;
    case 'construction': drawConstruction(obs); break;
  }
}

/* ── HUD ───────────────────────────────────────────────────────────── */
function drawHUD() {
  const r=RANGES[rangeIdx];
  ctx.save(); ctx.textBaseline='top';
  ctx.font='300 9px "IBM Plex Mono",monospace'; ctx.fillStyle=P.mute; ctx.textAlign='left';
  ctx.fillText(r.name.toUpperCase()+' · '+r.sub, 14, 12);
  ctx.fillText(r.coords+' · '+r.alt, 14, 25);
  if (highScore > 0) {
    ctx.fillStyle=P.mute; ctx.font='300 8px "IBM Plex Mono",monospace';
    ctx.fillText('BEST · '+highScore, 14, 40);
  }
  ctx.textAlign='right'; ctx.fillStyle=P.mute;
  ctx.fillText('MOMENTS', W-14, 12);
  ctx.font='300 20px "IBM Plex Mono",monospace'; ctx.fillStyle=P.ink;
  ctx.fillText(Math.floor(moments), W-14, 22);
  if (offroad) {
    ctx.font='300 9px "IBM Plex Mono",monospace'; ctx.fillStyle=P.accent;
    ctx.textAlign='center'; ctx.fillText('— OFF-ROAD —', W/2, 14);
  }
  const p=Math.min(rangeT/r.dur,1);
  ctx.fillStyle='rgba(28,24,20,0.08)'; ctx.beginPath(); ctx.rect(0,H-3,W,3); ctx.fill();
  ctx.fillStyle=P.accent; ctx.beginPath(); ctx.rect(0,H-3,W*p,3); ctx.fill();
  if (notifT>0) {
    const a=Math.min(1,notifT*3)*Math.min(1,(notifT/2.5)*3);
    ctx.font='300 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle=`rgba(177,90,58,${a})`;
    ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(notifMsg,W/2,H-8);
  }
  ctx.restore();
}

/* ── Wait overlay ──────────────────────────────────────────────────── */
function drawWaitOverlay() {
  ctx.fillStyle='rgba(241,233,216,0.58)'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.textAlign='center';
  ctx.font='300 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle=P.accent; ctx.textBaseline='top';
  ctx.fillText('— '+waitLabel.toUpperCase()+' —', W/2, H*0.16);
  // Sound word — italic, gently pulsing
  if (waitSound) {
    const pulse = 1 + Math.sin(Date.now()*0.003)*0.06;
    ctx.save();
    ctx.translate(W/2, H*0.285);
    ctx.scale(pulse, pulse);
    ctx.font=`italic 300 ${Math.max(15,Math.round(W*0.028))}px "Cormorant Garamond",serif`;
    ctx.fillStyle=P.soft; ctx.textBaseline='middle'; ctx.textAlign='center';
    ctx.fillText(waitSound, 0, 0);
    ctx.restore();
  }
  ctx.font='italic 300 16px "Cormorant Garamond",serif';
  ctx.fillStyle=P.soft; ctx.textBaseline='middle';
  wrapText(ctx,waitMsg,W/2,H*0.44,W*0.65,24);
  const prog=1-waitT/waitDur, cx=W/2, cy=H*0.72, r=20;
  ctx.strokeStyle=P.rule; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle=P.accent; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+prog*Math.PI*2); ctx.stroke();
  ctx.font='300 10px "IBM Plex Mono",monospace'; ctx.fillStyle=P.ink;
  ctx.textBaseline='middle'; ctx.fillText(Math.ceil(waitT)+'s',cx,cy);
  ctx.font='300 8.5px "IBM Plex Mono",monospace'; ctx.fillStyle=P.mute;
  ctx.fillText('+'+waitPts+' moments',cx,cy+r+11);
  ctx.restore();
}

/* ── Crash overlay ─────────────────────────────────────────────────── */
function drawCrashOverlay() {
  const prog = Math.min(crashTimer / 1.2, 1);
  // Biker falls forward — drawn separately below normal biker
  // Impact flash (quick white flash at start)
  if (crashTimer < 0.12) {
    ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - crashTimer/0.12)})`;
    ctx.fillRect(0,0,W,H);
  }
  // Dust cloud at impact point
  const bx = W * BX_FRAC;
  for (let i=0; i<6; i++) {
    const a = (i/6)*Math.PI*2 + crashTimer*2;
    const dist = prog * (18 + i*5);
    const r2 = (4 - i*0.4) * (1 - prog*0.6);
    if(r2<=0) continue;
    ctx.beginPath(); ctx.arc(bx+Math.cos(a)*dist, GY-8+Math.sin(a)*dist*0.4, r2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(100,85,65,${0.5*(1-prog)})`; ctx.fill();
  }
  // Fade to dark for gameover handoff
  if (prog > 0.7) {
    ctx.fillStyle = `rgba(28,24,20,${(prog-0.7)/0.3 * 0.86})`;
    ctx.fillRect(0,0,W,H);
  }
}

/* ── Game over screen ──────────────────────────────────────────────── */
function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(28,24,20,0.88)'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='300 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle=P.accent;
  ctx.fillText('— THE MOUNTAIN STOPPED YOU —', W/2, H*0.16);
  const ts=Math.max(14,Math.round(W*0.028));
  ctx.font=`italic 300 ${ts}px "Cormorant Garamond",serif`; ctx.fillStyle=P.paper;
  ctx.fillText(crashMoments+' moments gathered', W/2, H*0.36);
  ctx.font=`300 ${Math.round(ts*0.6)}px "IBM Plex Mono",monospace`;
  ctx.fillStyle='rgba(241,233,216,0.5)';
  ctx.fillText(crashRange, W/2, H*0.52);
  ctx.font='300 9px "IBM Plex Mono",monospace'; ctx.fillStyle=P.mute;
  ctx.fillText(totalJumps+' summits cleared · '+totalWaits+' encounters', W/2, H*0.66);
  if (highScore > 0) { ctx.fillStyle=P.mute; ctx.fillText('YOUR BEST · '+highScore+' moments', W/2, H*0.74); }
  ctx.fillStyle=P.paper; ctx.fillText('SPACE · TAP TO RIDE AGAIN', W/2, H*0.82);
  ctx.restore();
}


function drawTransOverlay() {
  const fade=Math.min(1,Math.min(transT,3.5-transT)/1.2);
  ctx.fillStyle=`rgba(28,24,20,${fade*0.86})`; ctx.fillRect(0,0,W,H);
  if(fade<0.15) return;
  const r=RANGES[rangeIdx]; ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  const fs=Math.max(10,Math.round(W*0.022+8));
  ctx.font=`300 ${fs}px "IBM Plex Mono",monospace`; ctx.fillStyle=`rgba(241,233,216,${fade})`;
  ctx.fillText(r.name.toUpperCase(),W/2,H*0.36);
  ctx.font=`italic 300 ${Math.round(fs*1.7)}px "Cormorant Garamond",serif`;
  ctx.fillStyle=`rgba(241,233,216,${fade*0.88})`; ctx.fillText(r.sub,W/2,H*0.51);
  ctx.font=`300 ${Math.round(fs*0.9)}px "IBM Plex Mono",monospace`;
  ctx.fillStyle=`rgba(177,90,58,${fade})`; ctx.fillText(r.coords+' · '+r.alt,W/2,H*0.65);
  ctx.restore();
}

/* ── Idle & done screens ───────────────────────────────────────────── */
function drawIdleScreen() {
  ctx.save(); ctx.textAlign='center';
  ctx.font='300 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle=P.mute; ctx.textBaseline='top';
  ctx.fillText('PRESS SPACE · TAP · CLICK  TO BEGIN', W/2, 14);
  const ts=Math.max(14,Math.round(W*0.028));
  ctx.font=`italic 300 ${ts}px "Cormorant Garamond",serif`;
  ctx.fillStyle=P.soft; ctx.textBaseline='middle';
  ctx.fillText('Ride the road. Collect the moments.', W/2, H*0.30);
  ctx.restore();
}

function drawDoneScreen() {
  ctx.fillStyle='rgba(28,24,20,0.86)'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='300 9.5px "IBM Plex Mono",monospace'; ctx.fillStyle=P.accent;
  ctx.fillText('— PASS REACHED —', W/2, H*0.16);
  const ts=Math.max(14,Math.round(W*0.028));
  ctx.font=`italic 300 ${ts}px "Cormorant Garamond",serif`; ctx.fillStyle=P.paper;
  ctx.fillText(Math.floor(moments)+' moments gathered along the way', W/2, H*0.36);
  ctx.font=`italic 300 ${Math.round(ts*0.88)}px "Cormorant Garamond",serif`;
  ctx.fillStyle='rgba(241,233,216,0.62)';
  ctx.fillText('The destination was never the point.', W/2, H*0.51);
  ctx.font='300 9px "IBM Plex Mono",monospace'; ctx.fillStyle=P.mute;
  ctx.fillText(totalJumps+' summits · '+totalWaits+' encounters · '+totalTunnels+' tunnels', W/2, H*0.67);
  ctx.fillText('SPACE · TAP TO RIDE AGAIN', W/2, H*0.82);
  ctx.restore();
}

/* ── Utility ───────────────────────────────────────────────────────── */
function wrapText(ctx,text,x,y,maxW,lh) {
  const words=text.split(' '); const lines=[]; let line='';
  words.forEach(w=>{ const t=line?line+' '+w:w; if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t; });
  if(line) lines.push(line);
  const sy=y-(lines.length-1)*lh/2;
  lines.forEach((l,i)=>ctx.fillText(l,x,sy+i*lh));
}

function showNotif(msg) { notifMsg=msg; notifT=2.5; }

/* ── Sound pop particles ────────────────────────────────────────────── */
function spawnPop(text, x, y, color) {
  soundPops.push({
    text, x, y,
    vy: -0.9 - Math.random()*0.5,
    life: 1.0,
    color: color || P.ink,
    size: Math.max(12, Math.round(W * 0.025))
  });
}
function updatePops(dt) {
  soundPops.forEach(p => { p.y += p.vy; p.life -= dt * 0.52; });
  soundPops = soundPops.filter(p => p.life > 0);
}
function drawPops() {
  soundPops.forEach(p => {
    const alpha = Math.min(1, p.life * 2.8);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `italic 300 ${p.size}px "Cormorant Garamond",serif`;
    ctx.fillStyle = p.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // slight upward drift shadow for legibility against the terrain
    ctx.shadowColor = 'rgba(241,233,216,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });
}

/* ── Input ─────────────────────────────────────────────────────────── */
function doJump() {
  if (S==='idle') { startGame(); return; }
  if (S==='done'||S==='gameover') { startGame(); return; }
  if (S==='playing'&&onGround) { bikerVY=JUMP_VY; onGround=false; }
}
document.addEventListener('keydown', e=>{ if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();doJump();} });
canvas.addEventListener('click', doJump);
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); doJump(); }, {passive:false});

/* ── Game control ──────────────────────────────────────────────────── */
function startGame() {
  S='playing'; rangeIdx=0; rangeT=0; moments=0; worldX=0;
  obstacles=[]; obsQueue=[]; nextObsIn=620; timeSinceSpawn=0;
  bikerY=GY; bikerVY=0; onGround=true; bikerBob=0; wheelAngle=0;
  boosted=false; boostT=0; offroad=false; offroadT=0;
  notifMsg=''; notifT=0;
  soundPops=[]; waitSound='';
  totalJumps=0; totalWaits=0; totalTunnels=0;
  setupRange(0);
}

function setupRange(idx) {
  speed=RANGES[idx].spd;
  obsQueue=[...RANGES[idx].set];
  // Shuffle for variety
  for(let i=obsQueue.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [obsQueue[i],obsQueue[j]]=[obsQueue[j],obsQueue[i]];
  }
  nextObsIn=620; timeSinceSpawn=0;
}

function spawnObs() {
  if(!obsQueue.length) return;
  const type=obsQueue.shift(); const cfg=OCFG[type];
  obstacles.push({type,x:W+70,cw:cfg.cw,ch:cfg.ch,state:'active',anim:0});
  timeSinceSpawn=0;
}

/* ── Update ────────────────────────────────────────────────────────── */
function update(dt) {
  if(S==='idle'||S==='done') return;

  if(S==='waiting') {
    waitT-=dt;
    if(waitT<=0){
      waitT=0; S='playing'; moments+=waitPts;
      nextObsIn=450+Math.random()*150; timeSinceSpawn=0;
      if(!obsQueue.length) setupRange(rangeIdx);
    }
    return;
  }

  if(S==='crashed') { crashTimer+=dt; updatePops(dt); if(crashTimer>=1.2) { S='gameover'; const s=Math.floor(moments); if(s>highScore){highScore=s;localStorage.setItem('road-game-highscore',s);} } return; }
  if(S==='transition') { transT-=dt; if(transT<=0) S='playing'; return; }
  if(S==='gameover') return;
  if(S==='done') return;

  /* Playing */
  const r=RANGES[rangeIdx];
  rangeT+=dt; moments+=dt*0.07;
  if(notifT>0) notifT-=dt;
  updatePops(dt);

  // Off-road tick
  if(offroad) {
    offroadT-=dt; moments+=dt*0.12; // bonus accumulation while off-road
    if(offroadT<=0){offroad=false;offroadT=0;}
  }

  const spd=offroad ? speed*0.44 : (boosted ? speed*2.1 : speed);
  worldX+=spd; bikerBob+=spd*0.1; wheelAngle+=spd*0.085;
  if(boostT>0){boostT-=dt; if(boostT<=0){boosted=false;boostT=0;}}

  // Physics
  if(!onGround){bikerVY+=GRAVITY; bikerY+=bikerVY; if(bikerY>=GY){bikerY=GY;bikerVY=0;onGround=true;}}

  // Obstacle scroll + collision
  const bx=W*BX_FRAC;
  for(const obs of obstacles){
    obs.x-=spd; obs.anim=(obs.anim+dt*7)%(Math.PI*2);
    if(obs.state!=='active') continue;
    const cfg=OCFG[obs.type]; const peakX=obs.x+obs.cw/2;
    if(cfg.action==='jump'){
      // Trigger zone: tight window around the peak
      if(Math.abs(peakX-bx)<30){
        if(!onGround){
          // Any airborne state = cleared (not strict on height)
          obs.state='cleared'; totalJumps++;
          spawnPop('whoosh!', bx, bikerY-44, P.horizon);
        } else {
          // On the ground at peak = crash
          obs.state='cleared';
          crashTimer=0;
          crashRange=RANGES[rangeIdx].name+' · '+RANGES[rangeIdx].sub;
          crashMoments=Math.floor(moments);
          spawnPop('crack!', bx, bikerY-35, P.accent);
          S='crashed';
          return;
        }
      }
    } else if(cfg.action==='boost'){
      if(bx>obs.x+obs.cw*0.28&&bx<obs.x+obs.cw*0.72){
        obs.state='cleared';moments+=cfg.pts;boosted=true;boostT=2.4;totalTunnels++;
        spawnPop('whoooosh', bx, GY-82, P.horizon);
      }
    } else if(cfg.action==='wait'){
      if(peakX-bx<45&&peakX-bx>-15){
        obs.state='cleared';S='waiting';
        waitT=cfg.wait/1000;waitDur=cfg.wait/1000;
        waitMsg=cfg.msg;waitLabel=cfg.label;waitPts=cfg.pts;waitSound=cfg.sound||'';totalWaits++;
        spawnPop(cfg.sound||'', bx, GY-72, P.soft);
        return;
      }
    } else if(cfg.action==='offroad'){
      if(bx>obs.x+obs.cw*0.1&&!offroad){
        obs.state='cleared';offroad=true;offroadT=OFFROAD_DUR;
        moments+=cfg.pts;
        showNotif('OFF-ROAD TRACK · +'+cfg.pts+' MOMENTS');
        spawnPop('rattle rattle', bx, bikerY-44, P.mute);
        nextObsIn=300; // spawn next thing sooner after offroad ends
      }
    }
  }

  obstacles=obstacles.filter(o=>o.x>-240);

  // Spawn — enforce max 8s gap so no dead stretches
  timeSinceSpawn+=dt;
  const forceSpawn=timeSinceSpawn>8;
  const activeCount=obstacles.filter(o=>o.state==='active').length;
  if(activeCount<2&&!offroad) nextObsIn-=spd;
  if((nextObsIn<=0||forceSpawn)&&!offroad){
    if(!obsQueue.length) setupRange(rangeIdx); // refill when exhausted
    if(obsQueue.length){spawnObs();nextObsIn=340+Math.random()*200;}
  }

  // Range complete
  if(rangeT>=r.dur){
    if(rangeIdx<RANGES.length-1){
      rangeIdx++;rangeT=0;obstacles=[];obsQueue=[];nextObsIn=820;
      S='transition';transT=3.5;setupRange(rangeIdx);
    } else { S='done'; const s=Math.floor(moments); if(s>highScore){highScore=s;localStorage.setItem('road-game-highscore',s);} }
  }
}

/* ── Draw ──────────────────────────────────────────────────────────── */
function draw() {
  ctx.clearRect(0,0,W,H);
  drawBg();
  if(S==='idle'){drawBikerFn();drawIdleScreen();return;}
  obstacles.forEach(drawObs);
  drawBikerFn();
  drawPops();
  drawHUD();
  if(S==='waiting')    drawWaitOverlay();
  if(S==='transition') drawTransOverlay();
  if(S==='crashed')    drawCrashOverlay();
  if(S==='gameover')   drawGameOverScreen();
  if(S==='done')       drawDoneScreen();
}

/* ── Loop with IntersectionObserver pause ──────────────────────────── */
let lastTs=0, rafId=null;

function loop(ts) {
  const dt=Math.min((ts-lastTs)/1000,0.05);
  lastTs=ts; update(dt); draw();
  rafId=requestAnimationFrame(loop);
}

function startLoop() {
  if(rafId) return;
  lastTs=performance.now();
  rafId=requestAnimationFrame(loop);
}

function stopLoop() {
  if(rafId){cancelAnimationFrame(rafId);rafId=null;}
}

// Pause when canvas is off-screen — saves CPU for the rest of the page
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{
    entries[0].isIntersecting ? startLoop() : stopLoop();
  },{threshold:0.05});
  io.observe(canvas);
} else {
  startLoop(); // fallback
}

resize();
window.addEventListener('resize',resize);

})();
