import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENCE HOOK (localStorage — works in PWA standalone mode)
// ═══════════════════════════════════════════════════════════════════════════

function useLocalState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch (e) { console.error('Save failed:', e); }
  }, [key, state]);
  return [state, setState];
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════

function useMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED DRAWING LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  skin: "#c8a882", skinL: "#d4b594", skinS: "#a88a6a", skinD: "#96785c",
  contour: "#7a6248", active: "#00d4aa", activeF: "rgba(0,212,170,0.22)",
  activeFLo: "rgba(0,212,170,0.12)", secondary: "#f39c12",
  secondaryF: "rgba(243,156,18,0.15)", metal: "#555568", pad: "#2e2e3c",
  plate: "#48dbfb", floor: "#0b0b12", floorLine: "#15151e",
};

function setupCanvas(canvas, w, h) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  return ctx;
}

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a, b, t) { return a + (b - a) * t; }
function ang(x1,y1,x2,y2) { return Math.atan2(y2-y1,x2-x1); }
function dist(x1,y1,x2,y2) { return Math.sqrt((x2-x1)**2+(y2-y1)**2); }

function stdProgress(elapsed, dur = 2800) {
  const t = (elapsed % dur) / dur;
  if (t < 0.4) return easeInOut(t / 0.4);
  if (t < 0.5) return 1;
  if (t < 0.9) return 1 - easeInOut((t - 0.5) / 0.4);
  return 0;
}

function drawLimb(ctx, x1,y1,x2,y2, w1,wM,w2, fill, outline, sepLine) {
  const a = ang(x1,y1,x2,y2), p = a+Math.PI/2;
  const co = Math.cos(p), si = Math.sin(p);
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  ctx.beginPath();
  ctx.moveTo(x1+co*w1/2, y1+si*w1/2);
  ctx.quadraticCurveTo(mx+co*wM/2, my+si*wM/2, x2+co*w2/2, y2+si*w2/2);
  ctx.lineTo(x2-co*w2/2, y2-si*w2/2);
  ctx.quadraticCurveTo(mx-co*wM*0.42, my-si*wM*0.42, x1-co*w1/2, y1-si*w1/2);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 1.3; ctx.stroke();
  if (sepLine) {
    ctx.strokeStyle = sepLine; ctx.lineWidth = 0.8;
    const off = wM*0.12;
    ctx.beginPath();
    ctx.moveTo(x1+co*off, y1+si*off);
    ctx.quadraticCurveTo(mx+co*(off+1), my+si*(off+1), x2+co*off*0.4, y2+si*off*0.4);
    ctx.stroke();
  }
}

function drawMuscleHL(ctx, x1,y1,x2,y2, w1,wM,w2, side, color, fill) {
  const a = ang(x1,y1,x2,y2), p = a+Math.PI/2;
  const co = Math.cos(p), si = Math.sin(p);
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const s = side==="outer"?1:-1, sh=0.82;
  ctx.beginPath();
  ctx.moveTo(x1+s*co*w1/2*sh, y1+s*si*w1/2*sh);
  ctx.quadraticCurveTo(mx+s*co*wM/2*sh, my+s*si*wM/2*sh, x2+s*co*w2/2*sh, y2+s*si*w2/2*sh);
  ctx.lineTo(x2+s*co*w2*0.04, y2+s*si*w2*0.04);
  ctx.quadraticCurveTo(mx+s*co*wM*0.04, my+s*si*wM*0.04, x1+s*co*w1*0.04, y1+s*si*w1*0.04);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
}

function drawJoint(ctx, x, y, r, kneecap) {
  ctx.fillStyle = C.skin; ctx.strokeStyle = C.contour; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
  if (kneecap) {
    ctx.fillStyle = C.skinL;
    ctx.beginPath(); ctx.ellipse(x+2,y,r*0.6,r*0.75,0.1,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = C.contour; ctx.lineWidth = 0.6; ctx.stroke();
  }
}

function drawHead(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle = C.skin;
  ctx.beginPath(); ctx.ellipse(0,0,11,13,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = C.contour; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.strokeStyle = C.contour; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-8,3); ctx.quadraticCurveTo(-6,12,0,13); ctx.quadraticCurveTo(4,12,6,5); ctx.stroke();
  ctx.fillStyle = C.skinS;
  ctx.beginPath(); ctx.ellipse(-3,-2,3,2,-0.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#3a3028";
  ctx.beginPath(); ctx.ellipse(-3,-2,1.5,1,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = C.contour; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(9,-1,3,5,0.1,-0.5,Math.PI*1.5); ctx.stroke();
  ctx.strokeStyle = C.skinD; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(-9,2); ctx.lineTo(-7,4); ctx.stroke();
  ctx.fillStyle = C.skin;
  ctx.beginPath(); ctx.moveTo(-5,11); ctx.lineTo(-6,24); ctx.lineTo(8,24); ctx.lineTo(7,9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.contour; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-5,11); ctx.lineTo(-6,24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7,9); ctx.lineTo(8,24); ctx.stroke();
  ctx.strokeStyle = C.skinS; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(1,10); ctx.quadraticCurveTo(-1,17,2,24); ctx.stroke();
  ctx.restore();
}

function drawTorso(ctx, sx,sy, hx,hy) {
  const a = ang(sx,sy,hx,hy), p = a+Math.PI/2;
  const co = Math.cos(p), si = Math.sin(p);
  const sWf=20,sWb=14, hWf=12,hWb=10;
  const sf=[sx+co*sWf,sy+si*sWf], sb=[sx-co*sWb,sy-si*sWb];
  const hf=[hx+co*hWf,hy+si*hWf], hb=[hx-co*hWb,hy-si*hWb];
  const wt=0.6, wY=sy+(hy-sy)*wt, wX=sx+(hx-sx)*wt;
  const wf=[wX+co*10,wY+si*10], wb=[wX-co*9,wY-si*9];
  ctx.beginPath(); ctx.moveTo(sf[0],sf[1]);
  ctx.quadraticCurveTo((sf[0]+wf[0])/2+co*3,(sf[1]+wf[1])/2+si*3, wf[0],wf[1]);
  ctx.quadraticCurveTo((wf[0]+hf[0])/2+co,(wf[1]+hf[1])/2+si, hf[0],hf[1]);
  ctx.lineTo(hb[0],hb[1]);
  ctx.quadraticCurveTo((wb[0]+hb[0])/2,(wb[1]+hb[1])/2, wb[0],wb[1]);
  ctx.quadraticCurveTo((sb[0]+wb[0])/2-co,(sb[1]+wb[1])/2-si, sb[0],sb[1]);
  ctx.closePath();
  const g = ctx.createLinearGradient(sf[0],sf[1],sb[0],sb[1]);
  g.addColorStop(0,C.skinL); g.addColorStop(0.6,C.skin); g.addColorStop(1,C.skinS);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = C.contour; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.strokeStyle = C.skinS; ctx.lineWidth = 0.7;
  const pY=sy+(hy-sy)*0.15, pX=sx+(hx-sx)*0.15;
  ctx.beginPath(); ctx.moveTo(pX+co*sWf*0.8,pY+si*sWf*0.8);
  ctx.quadraticCurveTo(pX+co*5,pY+si*5+4,pX-co*2,pY-si*2+3); ctx.stroke();
  for(let i=0;i<3;i++){const yo=i*8,oY=sy+(hy-sy)*(0.35+i*0.03),oX=sx+(hx-sx)*(0.35+i*0.03);
  ctx.beginPath();ctx.moveTo(oX+co*12+(hx-sx)*0.03*yo,oY+si*12+yo);
  ctx.lineTo(oX+co*6+(hx-sx)*0.03*yo,oY+si*6+yo+3);ctx.stroke();}
  ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(sx+co*3,sy+si*3+5);ctx.lineTo(hx+co,hy+si-2);ctx.stroke();
  for(let i=1;i<=3;i++){const t=0.3+i*0.15,ay=sy+(hy-sy)*t,ax=sx+(hx-sx)*t;
  ctx.beginPath();ctx.moveTo(ax+co,ay+si);ctx.lineTo(ax+co*8,ay+si*8);ctx.stroke();}
  ctx.fillStyle = C.skin; ctx.strokeStyle = C.contour; ctx.lineWidth = 1;
  const ca=Math.cos(a),sa=Math.sin(a);
  ctx.beginPath(); ctx.moveTo(sf[0]-co*2,sf[1]-si*2);
  ctx.quadraticCurveTo(sx+co*sWf+co*6+ca*3,sy+si*sWf+si*6+sa*3,sx+co*sWf*0.5+ca*18,sy+si*sWf*0.5+sa*18);
  ctx.quadraticCurveTo(sx+co*2+ca*15,sy+si*2+sa*15,sx+co*2,sy+si*2+5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=C.skinS;ctx.lineWidth=0.6;
  ctx.beginPath();ctx.moveTo(sf[0]-co,sf[1]-si+2);
  ctx.quadraticCurveTo(sx+co*sWf*0.7+ca*10,sy+si*sWf*0.7+sa*10,sx+co*5+ca*16,sy+si*5+sa*16);ctx.stroke();
  ctx.fillStyle=C.skinS;ctx.beginPath();ctx.moveTo(sb[0],sb[1]);
  ctx.quadraticCurveTo(sx-co*sWb-co*3+ca*5,sy-si*sWb-si*3+sa*5,sx-co*sWb*0.3+ca*16,sy-si*sWb*0.3+sa*16);
  ctx.lineTo(sx-co*3,sy-si*3+5);ctx.closePath();ctx.fill();
  ctx.strokeStyle=C.contour;ctx.lineWidth=0.8;ctx.stroke();
}

function drawHand(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle=C.skin; ctx.strokeStyle=C.contour; ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.ellipse(0,0,5,4.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=C.skinS; ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(-3,3);ctx.lineTo(2,3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-3,1.5);ctx.lineTo(2,1.5);ctx.stroke();
  ctx.fillStyle=C.skinL;ctx.beginPath();ctx.ellipse(3.5,-2,2.5,2,0.4,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawSneaker(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle="#1a1a28";ctx.beginPath();ctx.moveTo(-20,3);ctx.lineTo(8,3);ctx.quadraticCurveTo(12,3,12,0);ctx.lineTo(-20,0);ctx.closePath();ctx.fill();
  ctx.fillStyle="#e0e0e0";ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(11,0);ctx.quadraticCurveTo(13,0,13,-2);ctx.lineTo(-20,-2);ctx.closePath();ctx.fill();
  ctx.fillStyle="#2a2a3e";ctx.beginPath();ctx.moveTo(-18,-2);ctx.lineTo(10,-2);ctx.quadraticCurveTo(13,-3,12,-7);ctx.lineTo(5,-12);ctx.quadraticCurveTo(-2,-14,-8,-12);ctx.lineTo(-18,-6);ctx.closePath();ctx.fill();ctx.strokeStyle="#3a3a50";ctx.lineWidth=0.8;ctx.stroke();
  ctx.restore();
}

function drawBenchFoot(ctx, x, y) {
  ctx.fillStyle="#2a2a3e";ctx.beginPath();ctx.ellipse(x,y,10,4,0.1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#3a3a50";ctx.lineWidth=0.8;ctx.stroke();
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.ellipse(x+7,y-2,4,3.5,0.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=C.contour;ctx.lineWidth=0.7;ctx.stroke();
}

function drawDumbbell(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.strokeStyle=C.metal;ctx.lineWidth=2.5;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();
  for(const xo of [-15,10]){
    const g=ctx.createLinearGradient(xo,-6,xo,6);g.addColorStop(0,"#5ae0f5");g.addColorStop(1,"#2a8fa3");
    ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(xo,-6,5,12,1);ctx.fill();ctx.strokeStyle="#2a8fa3";ctx.lineWidth=0.5;ctx.stroke();
  }
  ctx.restore();
}

function drawBench(ctx, x, y) {
  ctx.strokeStyle="#444458";ctx.lineWidth=3.5;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x+6,y+9);ctx.lineTo(x+6,y+65);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+60,y+9);ctx.lineTo(x+60,y+65);ctx.stroke();
  ctx.strokeStyle="#3a3a4a";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+6,y+48);ctx.lineTo(x+60,y+48);ctx.stroke();
  ctx.fillStyle="#222233";ctx.fillRect(x+1,y+63,10,3);ctx.fillRect(x+55,y+63,10,3);
  const g=ctx.createLinearGradient(x,y,x,y+10);g.addColorStop(0,"#3a3a48");g.addColorStop(1,"#2a2a36");
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x-3,y,72,10,3);ctx.fill();
  ctx.strokeStyle="#4a4a58";ctx.lineWidth=0.8;ctx.stroke();
  ctx.fillStyle="#42424f";ctx.beginPath();ctx.roundRect(x,y+1,66,3,2);ctx.fill();
}

function drawKB(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  const g=ctx.createRadialGradient(0,4,2,0,4,10);g.addColorStop(0,"#555");g.addColorStop(1,"#333");
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,5,9,8,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle="#777";ctx.lineWidth=2.5;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-6,-2);ctx.quadraticCurveTo(-6,-10,0,-10);ctx.quadraticCurveTo(6,-10,6,-2);ctx.stroke();
  ctx.restore();
}

function drawCableMachine(ctx, x, y, h, pulleyY) {
  ctx.fillStyle="#1a1a25";ctx.beginPath();ctx.roundRect(x,y,16,h,3);ctx.fill();
  ctx.strokeStyle="#2a2a3a";ctx.lineWidth=1;ctx.stroke();
  for(let i=0;i<6;i++){ctx.fillStyle=i<3?"#333":"#252530";ctx.fillRect(x+2,y+5+i*12,12,10);}
  ctx.fillStyle="#555";ctx.beginPath();ctx.arc(x+8,pulleyY,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#777";ctx.lineWidth=1;ctx.stroke();
}

function drawCable(ctx, x1,y1,x2,y2) {
  ctx.strokeStyle="#48dbfb88";ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
}

function drawFloor(ctx, w, h) {
  ctx.fillStyle=C.floor;ctx.fillRect(0,h-22,w,22);
  ctx.strokeStyle=C.floorLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,h-22);ctx.lineTo(w,h-22);ctx.stroke();
}

function drawShadow(ctx, x, y, rx, ry) {
  ctx.fillStyle="rgba(0,0,0,0.12)";ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}

function drawLabel(ctx, text, x, y, color) {
  ctx.font="7.5px 'JetBrains Mono',monospace";ctx.fillStyle=color||"rgba(0,212,170,0.35)";ctx.fillText(text,x,y);
}

function drawBar(ctx, x1,y1,x2,y2,w) {
  ctx.strokeStyle=C.metal;ctx.lineWidth=w||4;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}

function drawPullupBar(ctx, x, y, w) {
  ctx.strokeStyle="#48dbfb";ctx.lineWidth=5;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();
  ctx.strokeStyle="#333";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w,y-10);ctx.stroke();
}

function drawBand(ctx, x1,y1,x2,y2) {
  ctx.strokeStyle="#f39c1288";ctx.lineWidth=3;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}

function drawFoamRoller(ctx, x, y) {
  ctx.fillStyle="#333348";ctx.beginPath();ctx.ellipse(x,y,12,10,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#444458";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="#3a3a50";ctx.beginPath();ctx.ellipse(x,y-2,8,4,0,0,Math.PI*2);ctx.fill();
}

function drawBox(ctx, x, y, w, h) {
  ctx.fillStyle="#1a1a28";ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();
  ctx.strokeStyle="#2a2a3a";ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle="#222233";ctx.beginPath();ctx.roundRect(x+3,y+2,w-6,h*0.3,2);ctx.fill();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXERCISE ANIMATION FUNCTIONS (unchanged from Phase 1)
// ═══════════════════════════════════════════════════════════════════════════

const EXERCISES = {};

function figureFL(ctx, pose, opts = {}) {
  const { headX, headY, sx, sy, hx, hy, fkx, fky, fax, fay, ffx, ffy,
    bkx, bky, bax, bay, bfx, bfy,
    feX, feY, fhX, fhY, beX, beY, bhX, bhY, tLean } = pose;
  const { noBackLeg, noFrontSneaker, backOnBench, hideArms, flipFoot } = opts;

  drawShadow(ctx, (ffx||fax)+20, ffy||fay+14, 45, 5);

  if (!hideArms && beX != null) {
    drawLimb(ctx, sx+12,sy+6,beX,beY,7,8,6,C.skinS,C.contour,null);
    drawLimb(ctx, beX,beY,bhX,bhY,6,6,5,C.skinS,C.contour,null);
  }

  if (!noBackLeg && bkx != null) {
    drawLimb(ctx, hx+5,hy+6,bkx,bky,12,13,8,C.skinS,C.contour,C.skinD);
    drawJoint(ctx,bkx,bky,4);
    if (bax != null && bay != null) {
      drawLimb(ctx, bkx,bky,bax,bay,8,8,5,C.skinS,C.contour,null);
    }
    if (backOnBench) drawBenchFoot(ctx,bfx,bfy);
  }

  drawLimb(ctx, hx-4,hy+6,fkx,fky,14,17,11,C.skin,C.contour,C.skinS);
  drawJoint(ctx,fkx,fky,5.5,true);
  drawLimb(ctx, fkx,fky,fax,fay,10,12,6,C.skin,C.contour,C.skinS);
  drawJoint(ctx,fax,fay,3.5);
  if (!noFrontSneaker) drawSneaker(ctx,ffx||fax-5,ffy||fay+10,flipFoot?Math.PI:0);

  drawJoint(ctx,hx,hy,5.5);
  drawTorso(ctx,sx,sy,hx,hy);
  drawJoint(ctx,sx,sy,5);

  if (!hideArms && feX != null) {
    drawLimb(ctx, sx-12,sy+6,feX,feY,9,10,7,C.skin,C.contour,C.skinS);
    drawJoint(ctx,feX,feY,3.5);
    drawLimb(ctx, feX,feY,fhX,fhY,7,7.5,5.5,C.skin,C.contour,null);
  }

  drawHead(ctx,headX,headY,(tLean||0)*0.3);
}

EXERCISES["Bulgarian Split Squat"] = {
  dur: 2800,
  draw(ctx, w, h, p) {
    drawFloor(ctx,w,h);
    const floorY=h-26, bX=250, bY=200;
    drawBench(ctx,bX,bY);
    const fkx=lerp(130,124,p),fky=lerp(205,242,p);
    const hx=lerp(170,164,p),hy=lerp(162,200,p);
    const tL=lerp(-0.18,-0.24,p),tLen=68;
    const sx=hx+Math.sin(tL)*tLen,sy=hy-Math.cos(tL)*tLen;
    const pose={headX:sx+Math.sin(tL)*24,headY:sy-Math.cos(tL)*24,sx,sy,hx,hy,
      fkx,fky,fax:120+4,fay:floorY-10,ffx:115,ffy:floorY,
      bkx:lerp(222,215,p),bky:lerp(218,256,p),bfx:bX+28,bfy:bY-1,
      bax:bX+23,bay:bY+3,
      feX:sx-5,feY:sy+30,fhX:sx-7,fhY:lerp(sy+54,sy+60,p),
      beX:sx+7,beY:sy+28,bhX:sx+5,bhY:lerp(sy+52,sy+58,p),tLean:tL};
    drawMuscleHL(ctx,hx-4,hy+6,fkx,fky,14,17,11,"outer",C.active,C.activeF);
    const ga=ang(sx,sy,hx,hy),gp=ga+Math.PI/2;
    ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8;
    ctx.beginPath();ctx.ellipse(hx-Math.cos(gp)*6,hy-Math.sin(gp)*6-3,9,7,ga+0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(p>0.2) drawMuscleHL(ctx,hx+5,hy+6,pose.bkx,pose.bky,12,13,8,"inner",C.secondary,C.secondaryF);
    figureFL(ctx,pose,{backOnBench:true});
    drawHand(ctx,pose.fhX,pose.fhY,Math.PI/2);drawDumbbell(ctx,pose.fhX,pose.fhY+1,0);
    drawHand(ctx,pose.bhX,pose.bhY,Math.PI/2);drawDumbbell(ctx,pose.bhX,pose.bhY+1,0);
    drawLabel(ctx,"quads",fkx+16,fky-18);drawLabel(ctx,"glute",hx-30,hy+2);
    if(p>0.4){drawLabel(ctx,"hip flexor",pose.bkx-12,pose.bky-24,"rgba(243,156,18,0.3)");drawLabel(ctx,"(stretch)",pose.bkx-9,pose.bky-15,"rgba(243,156,18,0.3)");}
  }
};

EXERCISES["Cable Row (seated or standing)"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const benchY=floorY-50; ctx.fillStyle="#2e2e3c";ctx.beginPath();ctx.roundRect(80,benchY,60,8,3);ctx.fill();ctx.strokeStyle="#4a4a58";ctx.lineWidth=0.8;ctx.stroke(); ctx.strokeStyle="#444";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(90,benchY+8);ctx.lineTo(90,floorY);ctx.stroke();ctx.beginPath();ctx.moveTo(130,benchY+8);ctx.lineTo(130,floorY);ctx.stroke(); drawCableMachine(ctx,w-40,40,floorY-40,benchY-10); const hx=110,hy=benchY-5; const sx=hx-2,sy=hy-55; const handX=lerp(sx+60,sx+10,p),handY=lerp(sy+20,sy+15,p); const elbX=lerp(sx+45,sx+25,p),elbY=lerp(sy+25,sy+12,p); drawCable(ctx,handX,handY,w-32,benchY-10); drawLimb(ctx,hx,hy+10,150,floorY-15,11,10,7,C.skin,C.contour,C.skinS); drawSneaker(ctx,158,floorY,0); drawLimb(ctx,hx,hy,hx,hy+10,10,10,10,C.skin,C.contour,null); drawTorso(ctx,sx,sy,hx,hy); drawJoint(ctx,hx,hy,5);drawJoint(ctx,sx,sy,5); drawMuscleHL(ctx,sx,sy,hx,hy,20,18,12,"inner",C.active,C.activeF); drawLimb(ctx,sx-10,sy+5,elbX,elbY,8,9,7,C.skin,C.contour,C.skinS); drawJoint(ctx,elbX,elbY,3.5); drawLimb(ctx,elbX,elbY,handX,handY,7,7,5,C.skin,C.contour,null); drawHand(ctx,handX,handY,0); drawHead(ctx,sx+Math.sin(-0.1)*22,sy-Math.cos(-0.1)*22,-0.1*0.3); drawLabel(ctx,"lats",hx-35,hy-15);drawLabel(ctx,"rhomboids",sx-45,sy+10); } };

EXERCISES["90/90 Hip Switches"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26, seatY=floorY-8; const hx=150,hy=seatY-35; const sx=hx,sy=hy-55; const rot=lerp(-0.3,0.3,p); const fkx=lerp(110,190,p),fky=seatY-5; const fax=lerp(100,200,p),fay=seatY; const bkx=lerp(190,110,p),bky=seatY-5; const bax=lerp(200,100,p),bay=seatY; drawShadow(ctx,hx,seatY+5,50,4); drawLimb(ctx,hx-5,hy+10,fkx,fky,12,11,8,C.skin,C.contour,C.skinS); drawJoint(ctx,fkx,fky,4); drawLimb(ctx,fkx,fky,fax,fay,8,7,5,C.skin,C.contour,null); drawLimb(ctx,hx+5,hy+10,bkx,bky,12,11,8,C.skinS,C.contour,C.skinD); drawJoint(ctx,bkx,bky,4); drawLimb(ctx,bkx,bky,bax,bay,8,7,5,C.skinS,C.contour,null); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy+5,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy); drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-10,sy+5,sx-15,sy+35,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+10,sy+5,sx+15,sy+35,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"hip rotators",hx+15,hy+8); } };

EXERCISES["Band Pull-Aparts"] = { dur: 2200, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-15,floorY-10,12,11,7,C.skin,C.contour,C.skinS); drawSneaker(ctx,hx-20,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+15,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+10,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy); drawJoint(ctx,sx,sy,5); const armSpread=lerp(20,65,p); const lhX=sx-armSpread,lhY=sy+5,rhX=sx+armSpread,rhY=sy+5; const leX=sx-armSpread*0.5,leY=sy+3,reX=sx+armSpread*0.5,reY=sy+3; drawLimb(ctx,sx-14,sy+4,leX,leY,8,8,6,C.skin,C.contour,null); drawJoint(ctx,leX,leY,3); drawLimb(ctx,leX,leY,lhX,lhY,6,6,5,C.skin,C.contour,null); drawLimb(ctx,sx+14,sy+4,reX,reY,8,8,6,C.skinS,C.contour,null); drawJoint(ctx,reX,reY,3); drawLimb(ctx,reX,reY,rhX,rhY,6,6,5,C.skinS,C.contour,null); drawHand(ctx,lhX,lhY,0);drawHand(ctx,rhX,rhY,0); drawBand(ctx,lhX,lhY,rhX,rhY); drawMuscleHL(ctx,sx-14,sy+4,leX,leY,8,8,6,"outer",C.active,C.activeF); drawMuscleHL(ctx,sx+14,sy+4,reX,reY,8,8,6,"outer",C.active,C.activeF); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"rear delts",sx-50,sy-8);drawLabel(ctx,"rhomboids",sx+15,sy+20); } };

EXERCISES["Cat-Cow + Thread the Needle"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const spineArc=lerp(-12,12,p); const hx=220,hy=floorY-50; const sx=120,sy=floorY-50+spineArc; const headX=sx-30,headY=sy-15+spineArc*0.5; drawShadow(ctx,(sx+hx)/2,floorY+4,60,5); drawLimb(ctx,hx,hy+5,hx+10,floorY-8,11,10,7,C.skin,C.contour,null); drawLimb(ctx,hx+10,floorY-8,hx+15,floorY,7,6,5,C.skin,C.contour,null); drawLimb(ctx,sx,sy+5,sx-5,floorY-8,8,8,6,C.skin,C.contour,null); ctx.fillStyle=C.skin;ctx.strokeStyle=C.contour;ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(sx+15,sy-12+spineArc*0.3); ctx.quadraticCurveTo((sx+hx)/2,sy-18+spineArc*0.8,hx-10,hy-12); ctx.quadraticCurveTo((sx+hx)/2,hy+5+spineArc*0.3,sx+15,sy+8); ctx.closePath();ctx.fill();ctx.stroke(); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse((sx+hx)/2,sy-5+spineArc*0.5,20,8,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5);drawJoint(ctx,sx,sy,5); drawHead(ctx,headX,headY,lerp(0.2,-0.2,p)); drawLabel(ctx,"t-spine",(sx+hx)/2-15,sy-20+spineArc*0.5); } };

EXERCISES["Goblet Squat"] = { dur: 2800, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=lerp(floorY-95,floorY-55,p); const sx=hx+lerp(0,-3,p),sy=hy-lerp(65,55,p); const fkx=lerp(140,130,p),fky=lerp(floorY-50,floorY-25,p); const fax=135,fay=floorY-10; const bkx=lerp(180,190,p),bky=lerp(floorY-50,floorY-25,p); drawShadow(ctx,hx,floorY+4,40,5); drawLimb(ctx,hx-5,hy+6,fkx,fky,13,16,10,C.skin,C.contour,C.skinS); drawMuscleHL(ctx,hx-5,hy+6,fkx,fky,13,16,10,"outer",C.active,C.activeF); drawJoint(ctx,fkx,fky,5,true); drawLimb(ctx,fkx,fky,fax,fay,10,11,6,C.skin,C.contour,null); drawSneaker(ctx,130,floorY,0); drawLimb(ctx,hx+5,hy+6,bkx,bky,13,16,10,C.skinS,C.contour,null); drawJoint(ctx,bkx,bky,5); drawLimb(ctx,bkx,bky,bkx+5,floorY-10,10,11,6,C.skinS,C.contour,null); drawSneaker(ctx,bkx,floorY,Math.PI); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy+3,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const kbY=sy+lerp(12,22,p); drawKB(ctx,sx,kbY,0); drawLimb(ctx,sx-14,sy+5,sx-10,kbY-5,8,8,6,C.skin,C.contour,null); drawLimb(ctx,sx+14,sy+5,sx+10,kbY-5,8,7,6,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"quads",fkx+12,fky-15);drawLabel(ctx,"glutes/core",hx+15,hy+10); } };

EXERCISES["Face Pulls"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; drawCableMachine(ctx,w-40,40,floorY-40,80); const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const spread=lerp(10,45,p),pullBack=lerp(30,5,p); const lhX=sx-spread,lhY=sy+pullBack-20,rhX=sx+spread,rhY=sy+pullBack-20; const leX=sx-spread*0.5,leY=sy+pullBack*0.5-10,reX=sx+spread*0.5,reY=sy+pullBack*0.5-10; drawCable(ctx,lhX,lhY,w-32,80);drawCable(ctx,rhX,rhY,w-32,80); drawLimb(ctx,sx-14,sy+4,leX,leY,8,9,7,C.skin,C.contour,null); drawJoint(ctx,leX,leY,3.5); drawLimb(ctx,leX,leY,lhX,lhY,7,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+14,sy+4,reX,reY,8,9,7,C.skinS,C.contour,null); drawJoint(ctx,reX,reY,3.5); drawLimb(ctx,reX,reY,rhX,rhY,7,7,5,C.skinS,C.contour,null); drawHand(ctx,lhX,lhY,0);drawHand(ctx,rhX,rhY,0); drawMuscleHL(ctx,sx-14,sy+4,leX,leY,8,9,7,"outer",C.active,C.activeF); drawMuscleHL(ctx,sx+14,sy+4,reX,reY,8,9,7,"outer",C.active,C.activeF); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"rear delts",sx-55,sy-8);drawLabel(ctx,"rotator cuff",sx+15,sy-8); } };

EXERCISES["Dead Hang"] = { dur: 3000, draw(ctx, w, h, p) { drawPullupBar(ctx,80,25,120); const sway=Math.sin(p*Math.PI*2)*5; const sx=140+sway,sy=55; const hx=140+sway,hy=sy+65; drawLimb(ctx,sx-15,sy,120,25,7,6,5,C.skin,C.contour,null); drawLimb(ctx,sx+15,sy,160,25,7,6,5,C.skinS,C.contour,null); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,hx,hy,5);drawJoint(ctx,sx,sy,5); drawLimb(ctx,hx-5,hy+5,hx-8,hy+45,12,11,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-8,hy+45,4); drawLimb(ctx,hx-8,hy+45,hx-10,hy+75,9,9,6,C.skin,C.contour,null); drawLimb(ctx,hx+5,hy+5,hx+8,hy+45,12,11,8,C.skinS,C.contour,null); drawJoint(ctx,hx+8,hy+45,4); drawLimb(ctx,hx+8,hy+45,hx+10,hy+75,9,9,6,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(sx,sy+3,8,5,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawLabel(ctx,"shoulders",sx+20,sy);drawLabel(ctx,"grip",sx-40,sy+15); } };

EXERCISES["Supine Hip Flexor Stretch"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const benchY=floorY-35; ctx.fillStyle="#2e2e3c";ctx.beginPath();ctx.roundRect(60,benchY,180,10,3);ctx.fill();ctx.strokeStyle="#4a4a58";ctx.lineWidth=0.8;ctx.stroke(); const sink=lerp(0,15,p); const hx=150,hy=benchY-10; drawLimb(ctx,hx-5,hy+5,120,benchY-8,14,14,10,C.skin,C.contour,C.skinS); drawJoint(ctx,120,benchY-8,5,true); drawLimb(ctx,120,benchY-8,100,benchY-15,10,10,7,C.skin,C.contour,null); drawLimb(ctx,hx+5,hy+5,hx+25,benchY+sink,13,13,9,C.skinS,C.contour,C.skinD); drawMuscleHL(ctx,hx+5,hy+5,hx+25,benchY+sink,13,13,9,"outer",C.secondary,C.secondaryF); drawJoint(ctx,hx+25,benchY+sink,4); drawLimb(ctx,hx+25,benchY+sink,hx+20,benchY+sink+25,9,8,6,C.skinS,C.contour,null); drawLimb(ctx,hx,hy,hx-30,hy-5,16,14,12,C.skin,C.contour,C.skinS); const sx=hx-30,sy=hy-5; drawJoint(ctx,hx,hy,5.5); drawJoint(ctx,sx,sy,5); drawHead(ctx,70,benchY-15,Math.PI/2-0.2); drawLabel(ctx,"hip flexor",hx+30,benchY+sink-10,"rgba(243,156,18,0.35)"); } };

EXERCISES["Hip CARs (Controlled Articular Rotations)"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,30,4); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const ca=p*Math.PI*2-Math.PI/2,legR=45; const kx=hx-8+Math.cos(ca)*legR,ky=hy+5+Math.sin(ca)*legR; drawLimb(ctx,hx-8,hy+5,kx,ky,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,kx,ky,5,true); const ax=kx+Math.cos(ca+Math.PI/2)*25,ay=ky+Math.sin(ca+Math.PI/2)*25; drawLimb(ctx,kx,ky,ax,ay,9,9,6,C.skin,C.contour,null); ctx.strokeStyle="rgba(0,212,170,0.12)";ctx.lineWidth=1;ctx.setLineDash([4,5]); ctx.beginPath();ctx.ellipse(hx-8,hy+5,legR,legR,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx-5,hy+3,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawLimb(ctx,sx-12,sy+5,sx-18,sy+35,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+18,sy+35,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"hip rotators",hx+15,hy+8); } };

EXERCISES["Glute Bridges"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const lift=lerp(0,25,p); const hx=160,hy=floorY-20-lift; const sx=hx-50,sy=floorY-15; drawShadow(ctx,hx,floorY+4,50,4); drawLimb(ctx,sx,sy,hx,hy,14,14,12,C.skin,C.contour,C.skinS); drawLimb(ctx,hx-5,hy+5,hx-25,floorY-5,13,14,9,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-25,floorY-5,4,true); drawLimb(ctx,hx-25,floorY-5,hx-40,floorY,8,8,6,C.skin,C.contour,null); drawLimb(ctx,hx+5,hy+5,hx+25,floorY-5,13,14,9,C.skinS,C.contour,null); drawJoint(ctx,hx+25,floorY-5,4); drawLimb(ctx,hx+25,floorY-5,hx+40,floorY,8,8,6,C.skinS,C.contour,null); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy+3,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5.5);drawJoint(ctx,sx,sy,5); drawHead(ctx,sx-20,sy-10,Math.PI/2-0.3); drawLabel(ctx,"glutes",hx+15,hy); } };

EXERCISES["Lunge + Reach Rotation"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const rotate=Math.sin(p*Math.PI)*0.5; const hx=170,hy=floorY-55; const sx=hx+Math.sin(-0.15+rotate*0.3)*65,sy=hy-Math.cos(-0.15)*65; drawShadow(ctx,hx,floorY+4,40,5); drawLimb(ctx,hx-8,hy+6,140,floorY-20,14,15,10,C.skin,C.contour,C.skinS); drawJoint(ctx,140,floorY-20,5,true); drawLimb(ctx,140,floorY-20,130,floorY-8,10,10,6,C.skin,C.contour,null); drawSneaker(ctx,125,floorY,0); drawLimb(ctx,hx+8,hy+6,200,floorY-5,13,14,9,C.skinS,C.contour,C.skinD); drawJoint(ctx,200,floorY-5,4); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const reachAngle=-Math.PI/2+rotate*2; const reachX=sx+Math.cos(reachAngle)*45,reachY=sy+Math.sin(reachAngle)*45; drawLimb(ctx,sx-12,sy+5,sx-20,sy+35,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,reachX,reachY,8,7,5,C.skinS,C.contour,null); drawHand(ctx,reachX,reachY,reachAngle); drawHead(ctx,sx+Math.sin(-0.15+rotate*0.3)*22,sy-Math.cos(-0.15)*22,rotate*0.4); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,(sy+hy)/2,9,16,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawLabel(ctx,"t-spine",sx+25,sy-5);drawLabel(ctx,"hip flexor",hx+20,hy+15,"rgba(243,156,18,0.3)"); } };

EXERCISES["Kettlebell Swings"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; let kbAngle,hipHinge,kbX,kbY; if(p<0.5){const t=p/0.5;hipHinge=lerp(0.4,0,easeInOut(t));const swA=lerp(Math.PI*0.7,-Math.PI*0.3,easeInOut(t));kbX=160+Math.cos(swA)*55;kbY=floorY-80+Math.sin(swA)*55;kbAngle=swA;} else{const t=(p-0.5)/0.5;hipHinge=lerp(0,0.4,easeInOut(t));const swA=lerp(-Math.PI*0.3,Math.PI*0.7,easeInOut(t));kbX=160+Math.cos(swA)*55;kbY=floorY-80+Math.sin(swA)*55;kbAngle=swA;} const hx=160,hy=floorY-60-hipHinge*10; const sx=hx+Math.sin(-0.05-hipHinge)*65,sy=hy-Math.cos(-0.05-hipHinge)*65; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-15,floorY-10,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-15,floorY-10,5,true); drawLimb(ctx,hx-15,floorY-10,hx-18,floorY-2,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,hx-23,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+15,floorY-10,12,12,8,C.skinS,C.contour,null); drawJoint(ctx,hx+15,floorY-10,5); drawLimb(ctx,hx+15,floorY-10,hx+18,floorY-2,9,9,6,C.skinS,C.contour,null); drawSneaker(ctx,hx+13,floorY,Math.PI); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy+3,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,kbX-5,kbY,8,8,6,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,kbX+5,kbY,8,7,6,C.skinS,C.contour,null); drawKB(ctx,kbX,kbY,kbAngle); drawHead(ctx,sx+Math.sin(-0.05-hipHinge)*22,sy-Math.cos(-0.05-hipHinge)*22,(-0.05-hipHinge)*0.3); drawLabel(ctx,"glutes/hips",hx+20,hy); } };

EXERCISES["Single-Leg Romanian Deadlift (DB)"] = { dur: 2800, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hinge=lerp(0,0.8,p); const hx=160,hy=floorY-60; const sx=hx+Math.sin(-hinge)*65,sy=hy-Math.cos(-hinge)*65; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-5,hy+5,hx-8,floorY-15,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-8,floorY-15,5,true); drawLimb(ctx,hx-8,floorY-15,hx-10,floorY-5,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,hx-15,floorY,0); const backLegAngle=-Math.PI/2+hinge*1.2; const bkx=hx+5+Math.cos(backLegAngle)*40,bky=hy+5+Math.sin(backLegAngle)*40; drawLimb(ctx,hx+5,hy+5,bkx,bky,12,11,8,C.skinS,C.contour,null); const bax=bkx+Math.cos(backLegAngle)*30,bay=bky+Math.sin(backLegAngle)*30; drawLimb(ctx,bkx,bky,bax,bay,8,8,6,C.skinS,C.contour,null); drawMuscleHL(ctx,hx-5,hy+5,hx-8,floorY-15,12,12,8,"inner",C.active,C.activeF); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const dbY=sy+lerp(25,50,p); drawLimb(ctx,sx+12,sy+5,sx+10,dbY-10,8,7,5,C.skinS,C.contour,null); drawHand(ctx,sx+10,dbY-5,Math.PI/2);drawDumbbell(ctx,sx+10,dbY-4,0); drawLimb(ctx,sx-12,sy+5,sx-15,sy+30,8,7,5,C.skin,C.contour,null); drawHead(ctx,sx+Math.sin(-hinge)*22,sy-Math.cos(-hinge)*22,(-hinge)*0.3); drawLabel(ctx,"hamstrings",hx-40,hy+15);drawLabel(ctx,"glute",hx+15,hy); } };

EXERCISES["Box Jumps"] = { dur: 2800, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; drawBox(ctx,190,floorY-45,70,45); let figY,onBox; if(p<0.3){const t=p/0.3;figY=floorY-30-Math.sin(t*Math.PI)*80;onBox=false;} else if(p<0.6){figY=floorY-75;onBox=true;} else{const t=(p-0.6)/0.4;figY=lerp(floorY-75,floorY-30,t);onBox=false;} const hx=onBox?225:150,hy=figY; const sx=hx,sy=hy-60; drawShadow(ctx,hx,onBox?floorY-45+4:floorY+4,35,4); const kneeBend=onBox?0.1:0.3; drawLimb(ctx,hx-8,hy+5,hx-12,hy+35,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-12,hy+35,5,true); drawLimb(ctx,hx-12,hy+35,hx-10,onBox?floorY-45:floorY-5,9,9,6,C.skin,C.contour,null); if(!onBox)drawSneaker(ctx,hx-15,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,hy+35,12,12,8,C.skinS,C.contour,null); drawJoint(ctx,hx+12,hy+35,5); drawLimb(ctx,hx+12,hy+35,hx+10,onBox?floorY-45:floorY-5,9,9,6,C.skinS,C.contour,null); if(!onBox)drawSneaker(ctx,hx+5,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const armAngle=onBox?0.3:-0.5; drawLimb(ctx,sx-12,sy+5,sx-20,sy+30+armAngle*20,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+20,sy+30+armAngle*20,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"explosive power",hx-30,hy-15); } };

EXERCISES["Pallof Press (cable)"] = { dur: 2600, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; drawCableMachine(ctx,10,40,floorY-40,80); const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,(sy+hy)/2,9,16,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const pressX=lerp(sx+10,sx+50,p),pressY=sy+15; drawLimb(ctx,sx-12,sy+5,pressX-5,pressY,8,8,6,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,pressX+5,pressY,8,7,6,C.skinS,C.contour,null); drawHand(ctx,pressX,pressY,0); drawCable(ctx,pressX,pressY,18,80); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"anti-rotation",hx+20,(sy+hy)/2); } };

EXERCISES["Reverse Lunge to Knee Drive"] = { dur: 2800, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; let lx,ly,rx,ry,driveKnee; if(p<0.5){const t=p/0.5;lx=lerp(150,150,t);ly=lerp(floorY-60,floorY-60,t);rx=lerp(200,200,t);ry=lerp(floorY-5,floorY-5,t);driveKnee=0;} else{const t=(p-0.5)/0.5;driveKnee=Math.sin(t*Math.PI);rx=200;ry=lerp(floorY-5,floorY-60,driveKnee);} const hx=160,hy=floorY-55; const sx=hx,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+6,140,floorY-20,14,15,10,C.skin,C.contour,C.skinS); drawJoint(ctx,140,floorY-20,5,true); drawLimb(ctx,140,floorY-20,135,floorY-8,10,10,6,C.skin,C.contour,null); drawSneaker(ctx,130,floorY,0); if(driveKnee<0.5){ drawLimb(ctx,hx+8,hy+6,rx-20,ry,13,13,9,C.skinS,C.contour,C.skinD); drawJoint(ctx,rx-20,ry,4); drawLimb(ctx,rx-20,ry,rx,ry+15,9,8,6,C.skinS,C.contour,null); } else { drawLimb(ctx,hx+8,hy+6,hx+10,hy-10,13,13,9,C.skinS,C.contour,null); drawJoint(ctx,hx+10,hy-10,4); drawLimb(ctx,hx+10,hy-10,hx+5,hy+15,9,8,6,C.skinS,C.contour,null); } drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,sx-18,sy+35,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+18,sy+35,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"glutes/quads",hx-35,hy-10); } };

EXERCISES["TRX or Cable Y-T-W Raises"] = { dur: 3600, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); let lx,ly,rx,ry,dirLabel; if(p<0.33){const t=p/0.33;lx=sx-30;ly=sy-lerp(10,50,t);rx=sx+30;ry=sy-lerp(10,50,t);dirLabel="Y";} else if(p<0.66){const t=(p-0.33)/0.33;lx=sx-lerp(30,55,t);ly=sy;rx=sx+lerp(30,55,t);ry=sy;dirLabel="T";} else{const t=(p-0.66)/0.34;lx=sx-lerp(25,35,t);ly=sy+lerp(5,-10,t);rx=sx+lerp(25,35,t);ry=sy+lerp(5,-10,t);dirLabel="W";} drawLimb(ctx,sx-14,sy+4,(sx+lx)/2,(sy+ly)/2,8,8,6,C.skin,C.contour,null); drawLimb(ctx,(sx+lx)/2,(sy+ly)/2,lx,ly,6,6,5,C.skin,C.contour,null); drawHand(ctx,lx,ly,0); drawLimb(ctx,sx+14,sy+4,(sx+rx)/2,(sy+ry)/2,8,7,6,C.skinS,C.contour,null); drawLimb(ctx,(sx+rx)/2,(sy+ry)/2,rx,ry,6,6,5,C.skinS,C.contour,null); drawHand(ctx,rx,ry,0); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.arc(sx-14,sy+4,5,0,Math.PI*2);ctx.fill();ctx.stroke(); ctx.beginPath();ctx.arc(sx+14,sy+4,5,0,Math.PI*2);ctx.fill();ctx.stroke(); drawHead(ctx,sx,sy-22,0); ctx.font="10px 'JetBrains Mono',monospace";ctx.fillStyle="rgba(0,212,170,0.4)";ctx.fillText(dirLabel,lx-10,ly-8); drawLabel(ctx,"stabilizers",hx+15,hy+8); } };

EXERCISES["Single-Leg Balance Reach (3-way)"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,30,4); drawLimb(ctx,hx-5,hy+5,hx-8,floorY-15,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-8,floorY-15,5,true); drawLimb(ctx,hx-8,floorY-15,hx-10,floorY-5,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,hx-15,floorY,0); let reachX,reachY,dirLabel; if(p<0.33){const t=p/0.33;reachX=hx+5;reachY=hy+5+t*35;dirLabel="FWD";} else if(p<0.66){const t=(p-0.33)/0.33;reachX=hx+5+t*40;reachY=hy+5+20;dirLabel="LAT";} else{const t=(p-0.66)/0.34;reachX=hx+5-t*30;reachY=hy+5+t*30;dirLabel="BACK";} drawLimb(ctx,hx+5,hy+5,reachX,reachY,12,11,8,C.skinS,C.contour,null); drawJoint(ctx,reachX,reachY,4); drawLimb(ctx,reachX,reachY,reachX+5,reachY+20,8,8,6,C.skinS,C.contour,null); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,sx-25,sy+25,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+25,sy+25,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); ctx.font="10px 'JetBrains Mono',monospace";ctx.fillStyle="rgba(0,212,170,0.4)";ctx.fillText(dirLabel,reachX+10,reachY-8); drawLabel(ctx,"stabilizers",hx+15,hy+8); } };

EXERCISES["Pigeon Stretch"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const sinkDown=lerp(0,15,p); const hx=160,hy=floorY-30-sinkDown; drawShadow(ctx,hx,floorY+4,55,5); drawLimb(ctx,hx-10,hy+10,hx-50,hy+15,12,11,7,C.skin,C.contour,null); drawJoint(ctx,hx-50,hy+15,4); drawLimb(ctx,hx-50,hy+15,hx-70,hy+10,8,7,5,C.skin,C.contour,null); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx-5,hy+8,12,8,0.2,0,Math.PI*2);ctx.fill();ctx.stroke(); drawLimb(ctx,hx+10,hy+5,hx+70,hy+15,12,11,7,C.skinS,C.contour,null); drawLimb(ctx,hx+70,hy+15,hx+90,hy+12,8,7,5,C.skinS,C.contour,null); const sx=hx-lerp(15,25,p),sy=hy-lerp(50,35,p); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-10,sy+5,sx-25,sy+lerp(30,40,p),8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+10,sy+5,sx+5,sy+lerp(30,40,p),8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx-15,sy-18,lerp(-0.3,-0.5,p)); drawLabel(ctx,"glute/piriformis",hx+10,hy-5);drawLabel(ctx,"ext. rotators",hx+10,hy+5); } };

EXERCISES["Foam Roll: T-spine + Lats"] = { dur: 2800, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const rollX=lerp(140,200,p); drawFoamRoller(ctx,rollX,floorY-40); const headX=100,headY=floorY-48; drawLimb(ctx,120,floorY-45,rollX-5,floorY-48,16,15,14,C.skin,C.contour,C.skinS); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(rollX,floorY-48,15,8,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawLimb(ctx,rollX+20,floorY-40,rollX+35,floorY-20,12,12,8,C.skin,C.contour,null); drawLimb(ctx,rollX+35,floorY-20,rollX+30,floorY-5,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,rollX+25,floorY,0); drawLimb(ctx,120,floorY-48,110,floorY-55,7,6,5,C.skin,C.contour,null); drawHead(ctx,headX,headY,-Math.PI/2+0.2); drawLabel(ctx,"t-spine",rollX-15,floorY-60); } };

EXERCISES["Shoulder CARs"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,30,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx+12,sy+5,sx+18,sy+40,8,7,5,C.skinS,C.contour,null); const ca=p*Math.PI*2-Math.PI/2,armR=45; const ahx=sx-12+Math.cos(ca)*armR,ahy=sy+5+Math.sin(ca)*armR; drawLimb(ctx,sx-12,sy+5,ahx,ahy,8,8,6,C.skin,C.contour,null); drawHand(ctx,ahx,ahy,ca); ctx.strokeStyle="rgba(0,212,170,0.12)";ctx.lineWidth=1;ctx.setLineDash([4,5]); ctx.beginPath();ctx.ellipse(sx-12,sy+5,armR,armR,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.arc(sx-12,sy+3,6,0,Math.PI*2);ctx.fill();ctx.stroke(); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"shoulder complex",sx-55,sy-8); } };

EXERCISES["Deep Squat Hold + Shift"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const shiftX=Math.sin(p*Math.PI*2)*15; const hx=160+shiftX,hy=floorY-40; const sx=hx,sy=hy-50; drawShadow(ctx,hx,floorY+4,40,5); drawLimb(ctx,hx-8,hy+6,hx-20+shiftX*0.3,hy+25,14,16,10,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-20+shiftX*0.3,hy+25,5,true); drawLimb(ctx,hx-20+shiftX*0.3,hy+25,hx-22,floorY-10,10,11,6,C.skin,C.contour,null); drawSneaker(ctx,hx-27,floorY,0); drawLimb(ctx,hx+8,hy+6,hx+20+shiftX*0.3,hy+25,14,16,10,C.skinS,C.contour,null); drawJoint(ctx,hx+20+shiftX*0.3,hy+25,5); drawLimb(ctx,hx+20+shiftX*0.3,hy+25,hx+22,floorY-10,10,11,6,C.skinS,C.contour,null); drawSneaker(ctx,hx+17,floorY,Math.PI); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy+3,10,7,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,sx-15,sy+30,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+15,sy+30,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"hips/ankles",hx+25,hy+10); } };

EXERCISES["Landmine Press (single arm)"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=180,hy=floorY-60,sx=180,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); ctx.fillStyle="#444";ctx.beginPath();ctx.arc(50,floorY-5,6,0,Math.PI*2);ctx.fill(); ctx.strokeStyle="#555";ctx.lineWidth=1;ctx.stroke(); const pressY=sy-lerp(5,35,p); drawBar(ctx,50,floorY-5,sx-15,pressY,4); drawLimb(ctx,hx-8,hy+5,hx-15,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-20,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+10,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+5,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,(sy+hy)/2,9,15,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,sx-15,pressY+10,8,9,7,C.skin,C.contour,null); drawLimb(ctx,sx-15,pressY+10,sx-15,pressY,7,7,5,C.skin,C.contour,null); drawHand(ctx,sx-15,pressY,0); drawMuscleHL(ctx,sx-12,sy+5,sx-15,pressY+10,8,9,7,"outer",C.active,C.activeF); drawLimb(ctx,sx+12,sy+5,sx+18,sy+35,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"delts/core",sx-55,sy); } };

EXERCISES["Front Squat (DB or Goblet)"] = EXERCISES["Goblet Squat"];

EXERCISES["Push-Up to Rotation (T-Push-Up)"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; let armBend,rotation; if(p<0.4){const t=p/0.4;armBend=Math.sin(t*Math.PI);rotation=0;} else if(p<0.7){const t=(p-0.4)/0.3;armBend=0;rotation=easeInOut(t);} else{const t=(p-0.7)/0.3;armBend=0;rotation=1-easeInOut(t);} const bodyY=floorY-30-armBend*15; const hx=200,hy=bodyY,sx=100,sy=bodyY+rotation*-20; drawShadow(ctx,(sx+hx)/2,floorY+4,55,4); drawLimb(ctx,sx,sy,hx,hy,16,15,13,C.skin,C.contour,C.skinS); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse((sx+hx)/2,(sy+hy)/2,15,8,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawLimb(ctx,hx,hy+5,hx+30,hy+5,11,10,7,C.skin,C.contour,null); drawLimb(ctx,hx+30,hy+5,hx+50,floorY-8,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx,sy+5,sx,floorY-12-armBend*10,8,8,6,C.skin,C.contour,null); drawHand(ctx,sx,floorY-8,0); const rotArmX=sx+rotation*20,rotArmY=sy-rotation*45; drawLimb(ctx,sx,sy+5,rotArmX,rotArmY,8,7,5,C.skin,C.contour,null); drawHand(ctx,rotArmX,rotArmY,0); drawHead(ctx,sx-15,sy-12+rotation*-5,-0.3+rotation*0.3); drawLabel(ctx,"chest/core",(sx+hx)/2-20,sy-15); } };

EXERCISES["Cable Low-to-High Chop"] = { dur: 2600, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; drawCableMachine(ctx,10,40,floorY-40,floorY-20); const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,(sy+hy)/2,10,16,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const handX=lerp(sx-40,sx+30,p),handY=lerp(hy+10,sy-30,p); drawLimb(ctx,sx-12,sy+5,handX-5,handY+10,8,8,6,C.skin,C.contour,null); drawLimb(ctx,handX-5,handY+10,handX,handY,6,6,5,C.skin,C.contour,null); drawHand(ctx,handX,handY,0); drawCable(ctx,handX,handY,18,floorY-20); drawHead(ctx,sx,sy-22,lerp(-0.1,0.1,p)); drawLabel(ctx,"obliques",hx+15,(sy+hy)/2); } };

EXERCISES["Farmer Carry"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const walkCycle=p*Math.PI*4; const stepL=Math.sin(walkCycle)*8,stepR=Math.sin(walkCycle+Math.PI)*8; const hx=160,hy=floorY-85,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); const lfky=floorY-40+stepL*0.5,rfky=floorY-40+stepR*0.5; drawLimb(ctx,hx-8,hy+5,hx-12,lfky,12,12,8,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-12,lfky,5,true); drawLimb(ctx,hx-12,lfky,hx-10,floorY-10+stepL,9,10,6,C.skin,C.contour,null); drawSneaker(ctx,hx-15,floorY+stepL,0); drawLimb(ctx,hx+8,hy+5,hx+12,rfky,12,12,8,C.skinS,C.contour,null); drawJoint(ctx,hx+12,rfky,5); drawLimb(ctx,hx+12,rfky,hx+10,floorY-10+stepR,9,10,6,C.skinS,C.contour,null); drawSneaker(ctx,hx+5,floorY+stepR,Math.PI); drawJoint(ctx,hx,hy,5.5); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(sx,(sy+hy)/2,9,18,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const handY=sy+55; drawLimb(ctx,sx-14,sy+5,sx-16,sy+30,8,7,6,C.skin,C.contour,null); drawLimb(ctx,sx-16,sy+30,sx-16,handY,6,6,5,C.skin,C.contour,null); drawHand(ctx,sx-16,handY,Math.PI/2);drawDumbbell(ctx,sx-16,handY+1,0); drawLimb(ctx,sx+14,sy+5,sx+16,sy+30,8,7,6,C.skinS,C.contour,null); drawLimb(ctx,sx+16,sy+30,sx+16,handY,6,6,5,C.skinS,C.contour,null); drawHand(ctx,sx+16,handY,Math.PI/2);drawDumbbell(ctx,sx+16,handY+1,0); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"grip/core",sx+25,sy+25);drawLabel(ctx,"traps",sx-40,sy); } };

EXERCISES["Band External Rotations"] = { dur: 2200, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const hx=160,hy=floorY-60,sx=160,sy=hy-60; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+5,hx-12,floorY-10,12,11,7,C.skin,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,hx+8,hy+5,hx+12,floorY-10,12,11,7,C.skinS,C.contour,null); drawSneaker(ctx,hx+7,floorY,Math.PI); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const rot=lerp(0,35,p); const leX=sx-12,leY=sy+20,reX=sx+12,reY=sy+20; drawLimb(ctx,sx-14,sy+4,leX,leY,8,7,6,C.skin,C.contour,null); drawJoint(ctx,leX,leY,3); drawLimb(ctx,leX,leY,leX-rot,leY,6,6,5,C.skin,C.contour,null); drawHand(ctx,leX-rot,leY,0); drawLimb(ctx,sx+14,sy+4,reX,reY,8,7,6,C.skinS,C.contour,null); drawJoint(ctx,reX,reY,3); drawLimb(ctx,reX,reY,reX+rot,reY,6,6,5,C.skinS,C.contour,null); drawHand(ctx,reX+rot,reY,0); drawBand(ctx,leX-rot,leY,reX+rot,reY); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.arc(sx-14,sy+4,5,0,Math.PI*2);ctx.fill();ctx.stroke(); ctx.beginPath();ctx.arc(sx+14,sy+4,5,0,Math.PI*2);ctx.fill();ctx.stroke(); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"rotator cuff",sx-50,sy-8); } };

EXERCISES["Hanging Leg Raises (or knee tucks)"] = { dur: 2600, draw(ctx, w, h, p) { drawPullupBar(ctx,80,25,120); const sx=140,sy=55; const hx=140,hy=sy+65; drawLimb(ctx,sx-15,sy,120,25,7,6,5,C.skin,C.contour,null); drawLimb(ctx,sx+15,sy,160,25,7,6,5,C.skinS,C.contour,null); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,hx,hy,5);drawJoint(ctx,sx,sy,5); const legAngle=lerp(0.1,-0.7,p); const kx=hx+Math.cos(legAngle+Math.PI/2)*40,ky=hy+Math.sin(legAngle+Math.PI/2)*40; const ax=kx+Math.cos(legAngle+Math.PI/2)*30,ay=ky+Math.sin(legAngle+Math.PI/2)*30; drawLimb(ctx,hx-3,hy+5,kx-3,ky,12,12,8,C.skin,C.contour,C.skinS); drawMuscleHL(ctx,hx-3,hy+5,kx-3,ky,12,12,8,"outer",C.active,C.activeF); drawJoint(ctx,kx-3,ky,5,true); drawLimb(ctx,kx-3,ky,ax-3,ay,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,ax-8,ay+8,legAngle); drawLimb(ctx,hx+3,hy+5,kx+3,ky,12,12,8,C.skinS,C.contour,null); drawJoint(ctx,kx+3,ky,5); drawLimb(ctx,kx+3,ky,ax+3,ay,9,9,6,C.skinS,C.contour,null); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,hy-5,8,10,0,0,Math.PI*2);ctx.fill();ctx.stroke(); drawHead(ctx,sx,sy-22,0); drawLabel(ctx,"lower abs",hx+15,hy-5);drawLabel(ctx,"hip flexors",hx+15,hy+8); } };

EXERCISES["Half-Kneeling Hip Flexor Stretch"] = { dur: 3000, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; const sinkFwd=lerp(0,12,p); const hx=160,hy=floorY-55-sinkFwd*0.5; const sx=hx+Math.sin(-0.1)*60,sy=hy-Math.cos(-0.1)*60; drawShadow(ctx,hx,floorY+4,40,4); drawLimb(ctx,hx-8,hy+6,130,floorY-25,14,15,10,C.skin,C.contour,C.skinS); drawJoint(ctx,130,floorY-25,5,true); drawLimb(ctx,130,floorY-25,125,floorY-10,10,10,6,C.skin,C.contour,null); drawSneaker(ctx,120,floorY,0); const bky=floorY-5; drawLimb(ctx,hx+8,hy+6,195,bky,13,14,9,C.skinS,C.contour,C.skinD); drawMuscleHL(ctx,hx+8,hy+6,195,bky,13,14,9,"outer",C.secondary,C.secondaryF); drawJoint(ctx,195,bky,4); drawLimb(ctx,195,bky,210,floorY,8,7,5,C.skinS,C.contour,null); drawJoint(ctx,hx,hy,5.5); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); drawLimb(ctx,sx-12,sy+5,sx-20,sy+35,8,7,5,C.skin,C.contour,null); drawLimb(ctx,sx+12,sy+5,sx+20,sy+35,8,7,5,C.skinS,C.contour,null); drawHead(ctx,sx+Math.sin(-0.1)*22,sy-Math.cos(-0.1)*22,-0.03); drawLabel(ctx,"hip flexor",hx+20,hy+15,"rgba(243,156,18,0.35)");drawLabel(ctx,"(stretch)",hx+23,hy+25,"rgba(243,156,18,0.35)"); } };

EXERCISES["Half-Kneeling Cable Chop (high to low)"] = { dur: 2600, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; drawCableMachine(ctx,w-40,20,floorY-20,30); const hx=150,hy=floorY-45; const sx=hx,sy=hy-55; drawShadow(ctx,hx,floorY+4,35,4); drawLimb(ctx,hx-8,hy+6,hx-20,floorY-20,13,14,9,C.skin,C.contour,C.skinS); drawJoint(ctx,hx-20,floorY-20,5,true); drawLimb(ctx,hx-20,floorY-20,hx-25,floorY-8,9,9,6,C.skin,C.contour,null); drawSneaker(ctx,hx-30,floorY,0); drawLimb(ctx,hx+8,hy+6,hx+20,floorY-5,12,11,7,C.skinS,C.contour,null); drawJoint(ctx,hx+20,floorY-5,4); drawJoint(ctx,hx,hy,5.5); ctx.fillStyle=C.activeF;ctx.strokeStyle=C.active;ctx.lineWidth=0.8; ctx.beginPath();ctx.ellipse(hx,(sy+hy)/2,9,16,ang(sx,sy,hx,hy),0,Math.PI*2);ctx.fill();ctx.stroke(); drawTorso(ctx,sx,sy,hx,hy);drawJoint(ctx,sx,sy,5); const handX=lerp(sx+50,sx-40,p),handY=lerp(sy-20,hy+15,p); drawLimb(ctx,sx-10,sy+5,handX-5,handY+10,8,8,6,C.skin,C.contour,null); drawLimb(ctx,handX-5,handY+10,handX,handY,6,6,5,C.skin,C.contour,null); drawHand(ctx,handX,handY,0); drawCable(ctx,handX,handY,w-32,30); drawHead(ctx,sx,sy-22,lerp(0.1,-0.1,p)); drawLabel(ctx,"obliques",hx+18,(sy+hy)/2); } };

EXERCISES["Single-Arm Dumbbell Row"] = { dur: 2400, draw(ctx, w, h, p) { drawFloor(ctx,w,h); const floorY=h-26; ctx.fillStyle="#2e2e3c";ctx.beginPath();ctx.roundRect(100,floorY-50,80,8,3);ctx.fill();ctx.strokeStyle="#4a4a58";ctx.lineWidth=0.8;ctx.stroke(); ctx.strokeStyle="#444";ctx.lineWidth=3; ctx.beginPath();ctx.moveTo(110,floorY-42);ctx.lineTo(110,floorY);ctx.stroke(); ctx.beginPath();ctx.moveTo(170,floorY-42);ctx.lineTo(170,floorY);ctx.stroke(); const hx=175,hy=floorY-55; const sx=110,sy=floorY-60; drawShadow(ctx,(sx+hx)/2,floorY+4,45,4); drawLimb(ctx,sx+5,sy+5,115,floorY-55,7,7,5,C.skin,C.contour,null); drawLimb(ctx,hx,hy+5,165,floorY-50,11,10,7,C.skin,C.contour,null); drawLimb(ctx,hx-10,hy+5,hx-15,floorY-25,12,12,8,C.skinS,C.contour,null); drawJoint(ctx,hx-15,floorY-25,5,true); drawLimb(ctx,hx-15,floorY-25,hx-12,floorY-10,9,9,6,C.skinS,C.contour,null); drawSneaker(ctx,hx-17,floorY,0); drawLimb(ctx,sx,sy,hx,hy,16,15,13,C.skin,C.contour,C.skinS); drawMuscleHL(ctx,sx,sy,hx,hy,16,15,13,"inner",C.active,C.activeF); drawJoint(ctx,hx,hy,5);drawJoint(ctx,sx,sy,5); const handY=lerp(sy+50,sy+25,p); const elbY=lerp(sy+30,sy+15,p); drawLimb(ctx,sx+15,sy+5,sx+18,elbY,8,9,7,C.skinS,C.contour,null); drawJoint(ctx,sx+18,elbY,3.5); drawLimb(ctx,sx+18,elbY,sx+15,handY,7,7,5,C.skinS,C.contour,null); drawHand(ctx,sx+15,handY,Math.PI/2);drawDumbbell(ctx,sx+15,handY+1,0); drawHead(ctx,sx-15,sy-12,-0.3); drawLabel(ctx,"lats",hx-30,hy-10);drawLabel(ctx,"rhomboids",(sx+hx)/2-20,sy-10); } };

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED EXERCISE CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedExercise({ exerciseName, width = 380, height = 340 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const ex = EXERCISES[exerciseName];

  useEffect(() => {
    if (!ex) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    let start = null;
    function loop(ts) {
      if (!start) start = ts;
      const p = stdProgress(ts - start, ex.dur || 2800);
      ctx.clearRect(0, 0, width, height);
      ex.draw(ctx, width, height, p);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [exerciseName, width, height, ex]);

  if (!ex) return <div style={{width,height,display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontSize:"12px"}}>Animation coming soon</div>;
  return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px`, display: "block" }} />;
}

// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// EXERCISE DETAIL DATA
// ═══════════════════════════════════════════════════════════════════════════

const EX_DATA = {
"90/90 Hip Switches":{muscles:"Hip rotators, glutes, hip flexors",equip:"Floor / mat",surfWhy:"Opens internal and external hip rotation for deeper bottom turns, faster pop-ups, and better surf stance.",steps:["Sit on the floor with both knees bent at 90 degrees, one in front, one to the side.","Keep spine tall and chest up. Do not round forward.","Rotate both legs to the opposite side so positions switch.","Move slowly. Feel the stretch in the outer hip of the trailing leg.","Pause 2 seconds each side. Keep sit bones grounded.","Avoid flexing the spine. Stay upright, rotate at the hips."]},
"Band Pull-Aparts":{muscles:"Rear delts, rhomboids, lower traps",equip:"Resistance band",surfWhy:"Counteracts internal shoulder rotation from paddling. Builds scapular retraction for surfer's shoulder prevention.",steps:["Hold band at shoulder width, arms straight at chest height.","Keep slight bend in elbows throughout.","Pull band apart by squeezing shoulder blades together until it touches chest.","Hold end position 1 second. Feel contraction between shoulder blades.","Return slowly. Don't let band snap back.","Shoulders down, away from ears. No shrugging."]},
"Cat-Cow + Thread the Needle":{muscles:"Thoracic spine, erector spinae, obliques",equip:"Floor / mat",surfWhy:"T-spine mobility is the prerequisite for shoulder health and rotational power in surfing.",steps:["Start on hands and knees, wrists under shoulders, knees under hips.","Cat: Exhale, round spine to ceiling, tuck chin and tailbone. Hold 2 sec.","Cow: Inhale, arch back, lift chest and tailbone. Hold 2 sec. Repeat 8x.","Thread the Needle: Reach right arm under body toward left.","Lower right shoulder and temple to floor. Feel mid-back rotation.","Hold 5 seconds, then reach arm to ceiling. Repeat 5 each side."]},
"Cable Row (seated or standing)":{muscles:"Lats, rhomboids, rear delts, biceps, core",equip:"Cable machine, V-bar or straight bar",surfWhy:"Primary paddle muscle builder. Lats power your stroke, scapular stabilizers keep shoulders healthy.",steps:["Sit at cable row or stand. Grab handle, arms extended, chest up.","Pull handle toward lower chest by driving elbows straight back.","Squeeze shoulder blades at end of pull. Hold 1 second.","Return slowly with control. Don't let weight stack slam.","Keep elbows close to body. Don't shrug shoulders.","Think 'proud chest' throughout."]},
"Bulgarian Split Squat":{muscles:"Quads, glutes, hamstrings, hip flexors (stretch), core",equip:"Bench, dumbbells (optional)",surfWhy:"Cody Thompson's top lower-body pick. Single-leg power for turns, fixes imbalances, stretches rear hip flexor.",steps:["Stand 2 feet from bench. Place rear foot laces down on bench.","Hold dumbbells at sides. Chest tall, hips square, core braced.","Lower by bending front knee. Slight forward torso lean. Shin stays roughly vertical.","Descend until front thigh reaches parallel, back knee hovers above floor.","Drive through front heel to stand. Squeeze glute at top.","Keep front knee tracking over second toe. Never let it cave inward."]},
"Half-Kneeling Cable Chop (high to low)":{muscles:"Obliques, transverse abdominis, hip stabilizers",equip:"Cable machine, D-handle",surfWhy:"Rotational power for cutbacks and carves. Trains trunk to generate and decelerate rotational force.",steps:["Set cable high. Kneel on knee closest to machine, opposite foot forward.","Grab handle with both hands toward the high cable.","Pull handle diagonally across body from high to low, rotating trunk.","Keep hips still. All rotation from upper spine and core.","Control the return slowly.","Exhale on chop, inhale on return. Ribs down throughout."]},
"Single-Arm Dumbbell Row":{muscles:"Lats, rhomboids, rear delts, biceps, core (anti-rotation)",equip:"Dumbbell, bench",surfWhy:"Unilateral pulling corrects paddle-side asymmetry. Anti-rotation demand trains core stability.",steps:["Left knee and hand on bench, right foot on floor. Back flat, hips square.","Hold dumbbell in right hand, arm fully extended.","Pull dumbbell toward hip by driving elbow up and back. Don't rotate torso.","Squeeze shoulder blade at top. Pause 1 second.","Lower with control. Keep core braced and hips level.","Pull with elbow, not hand. Engages lat over bicep."]},
"Goblet Squat":{muscles:"Quads, glutes, core, upper back",equip:"Dumbbell or kettlebell",surfWhy:"Front-loaded squat forces upright posture and core engagement. Knee-friendly alternative to barbell back squats.",steps:["Hold dumbbell or kettlebell vertically at chest height with both hands.","Feet shoulder-width, toes slightly out (15-30 degrees).","Squat by pushing hips back and bending knees simultaneously.","Elbows inside knees, chest tall. Go as deep as mobility allows.","Drive through whole foot to stand. Squeeze glutes at top.","Weight counterbalances you forward, helping you stay upright."]},
"Face Pulls":{muscles:"Rear delts, external rotators, lower traps, rhomboids",equip:"Cable machine, rope attachment",surfWhy:"#1 shoulder prehab for surfers. Builds posterior shoulder and rotator cuff endurance for long paddles.",steps:["Set cable with rope at upper chest to face height.","Grab rope palms down. Step back for tension.","Pull toward face, driving elbows back and out.","End position: hands beside ears, elbows high, blades squeezed.","Externally rotate so hands finish above elbows.","Light weight, high reps. This is prehab, not ego lifting."]},
"Dead Hang":{muscles:"Grip, lats, shoulders (decompression), thoracic spine",equip:"Pull-up bar",surfWhy:"Decompresses shoulders after paddling. Builds grip endurance and opens thoracic spine.",steps:["Grab pull-up bar overhand, hands shoulder-width.","Hang fully with arms straight. Feet off ground.","Relax shoulders, let gravity create traction.","Breathe deeply. Focus on relaxing lats.","Hold for time. Use straps if grip fails early.","Engage shoulders slightly at end for active hang."]},
"Supine Hip Flexor Stretch":{muscles:"Psoas, iliacus, rectus femoris",equip:"Bench or floor",surfWhy:"Targets hip flexors shortened by sitting and paddling position.",steps:["Lie on back at bench edge. Pull one knee to chest.","Let other leg hang off edge. Gravity stretches the hip flexor.","Posteriorly tilt pelvis by flattening lower back to surface.","Feel deep stretch in front of hanging hip. Breathe into it.","Hold 45 seconds per side. Don't arch lower back.","Can also be done on floor: one knee hugged, other leg straight."]},
"Hip CARs (Controlled Articular Rotations)":{muscles:"Hip rotators, glute med, hip flexors, adductors",equip:"None (wall for balance)",surfWhy:"Maps hip's full active range of motion. Translates to more fluid pop-ups and turns.",steps:["Stand on one leg. Lift other knee to hip height.","Slowly rotate lifted knee out to side (external rotation).","Continue rotating leg behind you, opening the hip.","Bring leg back through internal rotation, completing full circle.","10 seconds per revolution. Control, not speed.","Reverse direction. Keep standing glute engaged."]},
"Glute Bridges":{muscles:"Glutes, hamstrings, core",equip:"Floor / mat",surfWhy:"Glute activation before training. Weak glutes let the knee cave inward during turns.",steps:["Lie on back, knees bent, feet flat hip-width apart.","Press through heels, squeeze glutes to lift hips.","Body forms straight line from knees to shoulders at top.","Hold 2 seconds. Squeeze glutes hard.","Lower slowly with control.","Don't hyperextend lower back. Belt buckle to ceiling."]},
"Lunge + Reach Rotation":{muscles:"Hip flexors, quads, glutes, obliques, T-spine",equip:"None",surfWhy:"Combines hip opening with thoracic rotation. Called the 'all-time favorite surf mobility exercise' by multiple coaches.",steps:["Step into deep lunge. Back knee hovers above ground.","Place same-side hand on floor inside front foot.","Reach other hand to ceiling, rotating through mid-back. Follow hand with eyes.","Hold 3 seconds. Feel hip flexor stretch and spinal rotation.","Return hand to floor, step back to standing. Repeat other side.","Move slowly and deliberately."]},
"Kettlebell Swings":{muscles:"Glutes, hamstrings, hips, core, lats",equip:"Kettlebell",surfWhy:"Ultimate hip power builder. Explosive hip extension for bottom turns, cutbacks, and speed generation.",steps:["Feet slightly wider than shoulder-width. KB on floor in front.","Hinge at hips to grip KB. Flat back, shoulders above hips.","Hike KB back between legs like a football snap.","Thrust hips forward explosively. KB floats from hip power, not arms.","At top: standing tall, glutes locked, core tight. KB at chest height.","Let KB fall and hinge to absorb. It's a hinge, NOT a squat."]},
"Single-Leg Romanian Deadlift (DB)":{muscles:"Hamstrings, glutes, lower back, core (balance)",equip:"Dumbbell(s)",surfWhy:"Posterior chain + single-leg balance. Corrects asymmetries between dominant and non-dominant side.",steps:["Stand on one leg, dumbbell in opposite hand.","Hinge at hip, sending free leg straight behind as counterbalance.","Lower dumbbell toward floor, back flat, hips square.","Feel hamstring stretch on standing leg.","Drive through heel to return upright. Squeeze glute.","Free leg, torso, and arm form one straight line like a seesaw."]},
"Box Jumps":{muscles:"Quads, glutes, calves, hip flexors (explosive)",equip:"Plyo box (20-24 inches)",surfWhy:"Explosive lower body power. Cody Thompson's pick for fast-twitch fibers surfers need.",steps:["Stand facing box, feet shoulder-width, about one foot away.","Load by swinging arms back, hinging slightly at hips.","Explode upward through whole foot. Swing arms forward.","Land softly on box with both feet, absorb through bent knees.","Stand fully upright. Step down (don't jump) to protect knees.","Reset completely between reps. Quality over speed."]},
"Pallof Press (cable)":{muscles:"Transverse abdominis, obliques, hip stabilizers",equip:"Cable machine, D-handle",surfWhy:"Anti-rotation core. Teaches spine to resist rotational forces while the wave tries to throw you.",steps:["Cable at chest height. Stand sideways, handle at chest with both hands.","Step out until cable tries to rotate you toward machine.","Brace core, press handle straight out in front.","Hold extended 2-3 seconds. Don't let cable rotate torso.","Bring back to chest with control.","Further you extend, harder it gets. Feet hip-width, no weight shift."]},
"Reverse Lunge to Knee Drive":{muscles:"Glutes, quads, hip flexors, core",equip:"None (dumbbells optional)",surfWhy:"Mimics explosive pop-up pattern. Builds single-leg power and hip flexor strength.",steps:["Stand tall. Step one foot back into reverse lunge.","Lower until back knee nearly touches floor. Torso upright.","Explosively drive through front foot, bring back knee up toward chest.","Balance momentarily with knee driven high.","Step back into next lunge or alternate.","Add dumbbells at sides for progression."]},
"TRX or Cable Y-T-W Raises":{muscles:"Rotator cuff, lower traps, rear delts, serratus anterior",equip:"TRX straps or light dumbbells",surfWhy:"Shoulder endurance prehab. Targets small stabilizers that fatigue first during long paddles.",steps:["Y: Arms overhead in Y shape, thumbs up. Squeeze lower traps. 8 reps.","T: Arms out to sides in T. Squeeze shoulder blades. 8 reps.","W: Elbows down and back, externally rotate to W shape. 8 reps.","Use very light weight. Endurance/activation, not strength.","2 seconds up, 2 seconds down.","TRX: lean further back for difficulty. Maintain rigid body."]},
"Single-Leg Balance Reach (3-way)":{muscles:"Glute med, ankle stabilizers, core, proprioception",equip:"None",surfWhy:"Cody Thompson's top stability pick. All three planes of motion for stabilizer and motor control.",steps:["Stand on one leg, slight knee bend. Hips level.","Reach free foot forward, tap floor, return to center.","Reach laterally (out to side), tap, return.","Reach behind you, tap, return. That's one rep (3 directions).","Keep standing knee over second toe. No caving.","Go slowly. Control and stability, not speed."]},
"Pigeon Stretch":{muscles:"Glute max, piriformis, external hip rotators",equip:"Floor / mat",surfWhy:"Deep external hip rotation stretch. Opens tight lateral hip for getting low in turns.",steps:["From all fours, bring right knee behind right wrist.","Angle shin roughly parallel to front of mat.","Extend left leg straight behind, top of foot on floor.","Walk hands forward, lower torso over front shin.","Hold 45-60 seconds per side. Breathe deeply.","Too intense? Stay more upright or use block under hip."]},
"Foam Roll: T-spine + Lats":{muscles:"Thoracic erectors, lats, posterior shoulder",equip:"Foam roller",surfWhy:"Tissue prep before pressing. Releases tight upper back and lats from paddling.",steps:["T-spine: Lie on roller across mid-back. Support head with hands.","Lift hips, roll from mid to upper back. Pause on tight spots 15-20 sec.","Extend over roller at each segment to open thoracic spine.","Lats: Lie on side, roller under armpit. Arm overhead.","Roll from armpit to bottom of ribcage. Rotate slightly to hit full lat.","1 minute per area. Breathe through discomfort."]},
"Shoulder CARs":{muscles:"Full shoulder complex, rotator cuff, deltoids",equip:"None",surfWhy:"Maps shoulder's full active range. Prevents impingement before pressing movements.",steps:["Stand tall, fist clenched at side. Create full-body tension.","Slowly raise arm forward and up overhead, thumb leading.","Once overhead, rotate so palm faces outward.","Continue circle behind you and back down.","15+ seconds per circle. Maximize range at every point.","Reverse direction. Torso completely still."]},
"Deep Squat Hold + Shift":{muscles:"Hips, ankles, adductors, thoracic spine",equip:"None (doorframe for support)",surfWhy:"Opens ankles and hips under load in a position surfers use on every wave.",steps:["Feet shoulder-width or wider, toes out about 30 degrees.","Squat as deep as you can. Heels flat, back upright.","Hold at bottom. Use elbows to push knees apart.","Slowly shift weight side to side, forward and back.","60 seconds total. Breathe deeply.","Settling into position, not fighting it."]},
"Landmine Press (single arm)":{muscles:"Shoulders, chest, triceps, core (anti-rotation)",equip:"Barbell in landmine attachment",surfWhy:"Shoulder-friendly pressing angle. Single-arm trains anti-rotation for core stability on waves.",steps:["Set barbell in landmine. Stand at free end, staggered stance.","Hold end at shoulder height with one hand.","Press up and slightly forward. Arm finishes nearly straight.","Don't let torso rotate. Brace core against rotational force.","Lower with control. Keep ribs down.","Arc of barbell provides natural, shoulder-friendly path."]},
"Front Squat (DB or Goblet)":{muscles:"Quads, glutes, core, upper back",equip:"Dumbbells or kettlebell",surfWhy:"Anterior load forces upright posture and heavy core engagement for compressed surf stance.",steps:["Hold dumbbells at shoulder height or KB in goblet position.","Feet shoulder-width, toes slightly out. Core braced.","Squat keeping elbows high, chest proud.","Go as deep as mobility allows. At least thighs parallel.","Drive through whole foot to stand. Maintain upright torso.","Keep elbows high to maintain anterior load."]},
"Push-Up to Rotation (T-Push-Up)":{muscles:"Chest, shoulders, triceps, obliques, core",equip:"None",surfWhy:"Mimics pop-up to rotation sequence. Press off ground then rotate, just like popping up into a turn.",steps:["Start in push-up position. Perform full push-up.","At top, shift weight to one hand.","Rotate body sideways, stack feet. Free arm to ceiling.","Body forms T from hand to hand.","Hold 1-2 seconds, rotate back. Next push-up.","Alternate sides. Core tight during rotation."]},
"Cable Low-to-High Chop":{muscles:"Obliques, shoulders, hip rotators",equip:"Cable machine, D-handle",surfWhy:"Opposite rotational vector to high-to-low chop. Backside turn and recovery movement power.",steps:["Cable at lowest position. Stand sideways, feet wide.","Grab handle with both hands near the low side.","Rotate torso, pull handle diagonally upward across body.","Power from hips and core rotating, not arms lifting.","Control return. Don't let weight stack crash.","Hips relatively stable. Rotation from trunk, not pelvis."]},
"Farmer Carry":{muscles:"Grip, traps, core, shoulders, full body stability",equip:"Heavy dumbbells or kettlebells",surfWhy:"Grip endurance and shoulder stability for long paddles. Full-body bracing and upright posture.",steps:["Pick up heavy dumbbell/KB in each hand. Stand tall.","Shoulders down and back. Core braced. Don't lean.","Walk 40 meters (or 30-40 seconds) in straight line.","Short, controlled steps. Don't rush.","Maintain upright posture. Book on head.","Set down with control. Rest 60-90 sec. Go heavy."]},
"Band External Rotations":{muscles:"Infraspinatus, teres minor, rotator cuff",equip:"Resistance band",surfWhy:"Rotator cuff endurance for paddling longevity. High reps build endurance these small muscles need.",steps:["Hold band, elbows at 90 degrees tucked to sides.","Keep elbows glued to ribs throughout.","Rotate forearms outward against band resistance.","Squeeze at end range 1 second. Control return.","Light resistance. Should never feel heavy.","Can also do one arm with band anchored to doorknob."]},
"Hanging Leg Raises (or knee tucks)":{muscles:"Lower abs, hip flexors, grip",equip:"Pull-up bar",surfWhy:"Lower ab and hip flexor strength for explosive pop-ups. Core compression for tube riding.",steps:["Hang from bar overhand, arms extended.","Brace core, slight posterior pelvic tilt.","Raise legs (straight or bent) to 90 degrees.","Pause at top. No swinging. Go slower if swinging.","Lower slowly with control. Fight gravity.","Keep shoulders engaged. Active shoulders, not passive hang."]},
"Half-Kneeling Hip Flexor Stretch":{muscles:"Psoas, iliacus, rectus femoris, quads",equip:"Floor / mat",surfWhy:"Opens hip flexors shortened by sitting. Key for tight hips.",steps:["Kneel on one knee, other foot flat in front (90/90).","Tuck tailbone by squeezing glute of down-knee side. This is key.","With posterior tilt, gently shift hips forward.","Stretch should be in front of hip on kneeling side. Not lower back.","Hold 45 seconds. Breathe. Raise same-side arm for extra stretch.","Common mistake: arching back instead of tilting pelvis. Stay tucked."]},
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKOUT DATA
// ═══════════════════════════════════════════════════════════════════════════

const WORKOUT_PROGRAMS = {
A:{name:"PADDLE POWER + ROTATION",focus:"Upper body pull, rotational core, hip mobility",why:"54% of surf time is paddling. Builds lat endurance, scapular stability, and rotational trunk strength.",sources:"Cris Mills (Surf Strength Coach), Cody Thompson (Surfer Mag), The Inertia",
warmup:[{exercise:"90/90 Hip Switches",sets:"2\u00d78 each",notes:"Open tight hips. Sit tall, rotate at hips."},{exercise:"Band Pull-Aparts",sets:"2\u00d715",notes:"Rear delt + scapular warmup."},{exercise:"Cat-Cow + Thread the Needle",sets:"1 min each",notes:"T-spine mobility before pulling."}],
main:[{exercise:"Cable Row (seated or standing)",sets:"4\u00d710",notes:"Primary paddle muscle builder."},{exercise:"Bulgarian Split Squat",sets:"3\u00d78 each leg",notes:"Cody Thompson's #1 lower body pick."},{exercise:"Half-Kneeling Cable Chop (high to low)",sets:"3\u00d710 each side",notes:"Rotational power for turns."},{exercise:"Single-Arm Dumbbell Row",sets:"3\u00d710 each",notes:"Anti-rotation + pulling strength."},{exercise:"Goblet Squat",sets:"3\u00d710",notes:"Front-loaded squat. Knee-friendly."}],
finisher:[{exercise:"Face Pulls",sets:"3\u00d715",notes:"Shoulder prehab."},{exercise:"Dead Hang",sets:"2\u00d730sec",notes:"Shoulder decompression + grip."},{exercise:"Supine Hip Flexor Stretch",sets:"2\u00d745sec each",notes:"For tight hips."}]},
B:{name:"EXPLOSIVE POWER + LEGS",focus:"Lower body power, single-leg stability, anti-rotation core",why:"Generating speed, loading off the bottom, and absorbing landings demand explosive single-leg power.",sources:"Cody Thompson, Again Faster, Surf Strength Coach, Jaco Rehab",
warmup:[{exercise:"Hip CARs (Controlled Articular Rotations)",sets:"2\u00d75 each direction",notes:"Active hip range of motion."},{exercise:"Glute Bridges",sets:"2\u00d712",notes:"Glute activation for knee alignment."},{exercise:"Lunge + Reach Rotation",sets:"2\u00d76 each",notes:"Hip flexor + T-spine warmup."}],
main:[{exercise:"Kettlebell Swings",sets:"4\u00d712",notes:"Explosive hip power."},{exercise:"Single-Leg Romanian Deadlift (DB)",sets:"3\u00d78 each",notes:"Posterior chain + balance."},{exercise:"Box Jumps",sets:"4\u00d75",notes:"Lower body explosive power."},{exercise:"Pallof Press (cable)",sets:"3\u00d710 each side",notes:"Anti-rotation core."},{exercise:"Reverse Lunge to Knee Drive",sets:"3\u00d78 each",notes:"Pop-up drive pattern."}],
finisher:[{exercise:"TRX or Cable Y-T-W Raises",sets:"2\u00d78 each position",notes:"Shoulder endurance prehab."},{exercise:"Single-Leg Balance Reach (3-way)",sets:"2\u00d75 each direction",notes:"Stability in all planes."},{exercise:"Pigeon Stretch",sets:"2\u00d745sec each",notes:"Deep hip rotation stretch."}]},
C:{name:"PUSH + PADDLE ENDURANCE",focus:"Upper body push, shoulder endurance, dynamic core",why:"Pop-ups are explosive push-ups. Builds shoulder endurance and dynamic core for wave riding.",sources:"Surf Strength Coach, Waterboyz, Cody Thompson, SurferToday",
warmup:[{exercise:"Foam Roll: T-spine + Lats",sets:"1 min each",notes:"Tissue prep before pressing."},{exercise:"Shoulder CARs",sets:"2\u00d75 each direction",notes:"Full shoulder ROM."},{exercise:"Deep Squat Hold + Shift",sets:"1\u00d760sec",notes:"Ankle + hip mobility."}],
main:[{exercise:"Landmine Press (single arm)",sets:"3\u00d78 each",notes:"Shoulder-friendly pressing."},{exercise:"Front Squat (DB or Goblet)",sets:"4\u00d78",notes:"Anterior-loaded squat. Core + quads."},{exercise:"Push-Up to Rotation (T-Push-Up)",sets:"3\u00d76 each side",notes:"Pop-up + rotation pattern."},{exercise:"Cable Low-to-High Chop",sets:"3\u00d710 each side",notes:"Rotational power."},{exercise:"Farmer Carry",sets:"3\u00d740m",notes:"Grip + shoulder stability."}],
finisher:[{exercise:"Band External Rotations",sets:"2\u00d715 each",notes:"Rotator cuff endurance."},{exercise:"Hanging Leg Raises (or knee tucks)",sets:"3\u00d710",notes:"Lower abs + hip flexors."},{exercise:"Half-Kneeling Hip Flexor Stretch",sets:"2\u00d745sec each",notes:"Key for tight hips."}]},
};

// ═══════════════════════════════════════════════════════════════════════════
// ALT ACTIVITIES + STRETCH ROUTINES (Phase 2 expansion)
// ═══════════════════════════════════════════════════════════════════════════

const ALT_ACTIVITIES = {
  run:{name:"Trail Run",duration:"30-45 min",icon:"\ud83c\udfc3",detail:"Interval run: 5 min warmup, 8\u00d7(30s sprint/90s jog), 5 min cooldown.",color:"#82e0aa"},
  mtb:{name:"MTB Ride",duration:"45-60 min",icon:"\ud83d\udeb5",detail:"Cross-training cardio without joint impact.",color:"#82e0aa"},
  yoga:{name:"Yoga / Mobility",duration:"30-40 min",icon:"\ud83e\uddd8",detail:"Hip openers, T-spine rotation, shoulder stretches.",color:"#82e0aa"},
  stretch_short:{name:"AM Surf Prep",duration:"12-15 min",icon:"\ud83e\udd38",detail:"Quick morning flow targeting hips, shoulders, and spine before your day.",color:"#e6b800"},
  stretch_full:{name:"Deep Mobility",duration:"25-30 min",icon:"\ud83e\uddd8\u200d\u2642\ufe0f",detail:"Full mobility session: foam rolling, hip openers, T-spine work, and long-hold stretches.",color:"#e6b800"},
};

const STRETCH_ROUTINES = {
  short: {
    name: "AM SURF PREP FLOW",
    duration: "12-15 min",
    focus: "Quick wake-up targeting the areas surfers need most: hips, shoulders, T-spine, ankles.",
    philosophy: "Based on the program's principle that hip and thoracic mobility are prerequisites for both performance and injury prevention. Every movement here directly feeds your surf stance, paddle, and pop-up.",
    exercises: [
      { exercise: "Cat-Cow + Thread the Needle", sets: "8 reps + 3 each side", notes: "Spinal segmentation. Wake up your T-spine.", time: "2 min" },
      { exercise: "90/90 Hip Switches", sets: "8 each side", notes: "Open hip rotation for bottom turns.", time: "2 min" },
      { exercise: "Lunge + Reach Rotation", sets: "5 each side", notes: "Hip flexor + T-spine combo opener.", time: "2.5 min" },
      { exercise: "Shoulder CARs", sets: "3 each direction", notes: "Full shoulder ROM before paddling.", time: "2 min" },
      { exercise: "Deep Squat Hold + Shift", sets: "60 sec", notes: "Ankles + hips under load.", time: "1.5 min" },
      { exercise: "Glute Bridges", sets: "10 reps", notes: "Activate glutes, protect knees.", time: "1 min" },
    ]
  },
  full: {
    name: "DEEP MOBILITY SESSION",
    duration: "25-30 min",
    focus: "Comprehensive mobility work. Foam rolling, long-hold stretches, full joint circles. Best on rest days or evenings.",
    philosophy: "Jaco Rehab: 'If the hip cannot rotate, that twisting force goes to the knee.' This session systematically addresses every joint that surfing demands, with emphasis on the hips, T-spine, and shoulders that get tight from both paddling and sitting.",
    exercises: [
      { exercise: "Foam Roll: T-spine + Lats", sets: "1 min each area", notes: "Release tissue before stretching.", time: "3 min" },
      { exercise: "Cat-Cow + Thread the Needle", sets: "8 reps + 5 each side", notes: "Spinal mobility through full range.", time: "3 min" },
      { exercise: "90/90 Hip Switches", sets: "10 each side", notes: "Hip internal + external rotation.", time: "2 min" },
      { exercise: "Hip CARs (Controlled Articular Rotations)", sets: "5 each direction, each leg", notes: "Map full hip ROM.", time: "3 min" },
      { exercise: "Pigeon Stretch", sets: "60 sec each side", notes: "Deep glute and piriformis release.", time: "2.5 min" },
      { exercise: "Half-Kneeling Hip Flexor Stretch", sets: "45 sec each side", notes: "Psoas release. Posterior tilt is key.", time: "2 min" },
      { exercise: "Supine Hip Flexor Stretch", sets: "45 sec each side", notes: "Gravity-assisted hip flexor opening.", time: "2 min" },
      { exercise: "Shoulder CARs", sets: "5 each direction", notes: "Full shoulder ROM circles.", time: "2 min" },
      { exercise: "Deep Squat Hold + Shift", sets: "90 sec", notes: "Settling into hips and ankles.", time: "2 min" },
      { exercise: "Lunge + Reach Rotation", sets: "5 each side", notes: "Integrate hip + spine mobility.", time: "2.5 min" },
      { exercise: "Band Pull-Aparts", sets: "15 reps", notes: "Finish with scapular activation.", time: "1 min" },
    ]
  }
};

// Activity details for clickable cards (surf, run, mtb, yoga, softball, stretch)
const ACTIVITY_DETAILS = {
  surf: {
    title: "Surf Session",
    icon: "\ud83c\udfc4",
    color: "#48dbfb",
    duration: "1.5-3 hours",
    description: "The primary activity. Everything else in this program exists to make your surf sessions better, longer, and more injury-free.",
    guidelines: [
      "Always prioritize surfing over gym when waves are good",
      "Warm up shoulders with arm circles and band pull-aparts before paddling out",
      "Post-session: dead hang for shoulder decompression, hip flexor stretch",
      "Log your spot, board, and conditions \u2014 tracking builds awareness of your patterns",
      "On big days, consider this your gym equivalent: explosive power, cardio, and core",
    ],
    surfWhy: "Cody Thompson: 'I never choose gym over a good surf session. The ocean is the ultimate training ground.'"
  },
  run: {
    title: "Trail Run",
    icon: "\ud83c\udfc3",
    color: "#82e0aa",
    duration: "30-45 min",
    description: "Interval-based trail running builds the cardiovascular base and leg endurance that long surf sessions demand.",
    guidelines: [
      "Structure: 5 min easy warmup \u2192 8\u00d7(30s hard / 90s easy) \u2192 5 min cooldown",
      "Trails over pavement: softer surface, better proprioception",
      "Keep intensity conversational on easy intervals",
      "Good flat-day substitute when surf is small",
      "Stretch hip flexors and calves after",
    ],
    surfWhy: "Cardio endurance for paddle-outs and long sessions. Trail surfaces train ankle stability."
  },
  mtb: {
    title: "Mountain Bike Ride",
    icon: "\ud83d\udeb5",
    color: "#82e0aa",
    duration: "45-60 min",
    description: "Low-impact cross-training that builds leg endurance and cardiovascular fitness without joint stress.",
    guidelines: [
      "Focus on sustained effort, not max speed",
      "Great for active recovery days",
      "Trails add balance and reaction time training",
      "Keep cadence high (80+ RPM) to protect knees",
      "Hydrate well, especially before surf days",
    ],
    surfWhy: "Builds leg endurance for duck diving and long sessions. Zero joint impact."
  },
  yoga: {
    title: "Yoga / Mobility",
    icon: "\ud83e\uddd8",
    color: "#82e0aa",
    duration: "30-40 min",
    description: "Dedicated flexibility and body awareness work. Targets the hip, shoulder, and spine mobility that surfing demands.",
    guidelines: [
      "Focus on hip openers: pigeon, lizard, frog, 90/90",
      "T-spine rotations: thread the needle, seated twists",
      "Shoulder work: puppy pose, eagle arms, wall stretches",
      "Hold stretches 45-60 sec for real tissue change",
      "Breathe deeply. Stretch on exhale.",
    ],
    surfWhy: "Direct transfer to surf mobility. Flexible hips = deeper turns. Mobile T-spine = better rotation."
  },
  softball: {
    title: "Softball Night",
    icon: "\ud83e\udd4e",
    color: "#c39bd3",
    duration: "1.5-2 hours",
    description: "Thursday evening recreational softball. Social cross-training with rotational power, sprinting, and throwing.",
    guidelines: [
      "Warm up shoulders before throwing",
      "Batting is rotational power \u2014 similar movement pattern to cutbacks",
      "Base running = sprint intervals",
      "Don't skip warm-up, especially for cold evening games",
      "Counts as your PM activity for Thursday",
    ],
    surfWhy: "Rotational power transfers. Social component keeps training fun and sustainable."
  },
  stretch_short: {
    title: "AM Surf Prep Flow",
    icon: "\ud83e\udd38",
    color: "#e6b800",
    duration: "12-15 min",
    description: "Quick morning mobility routine targeting hips, shoulders, and T-spine. Perfect before surf or as a standalone AM activity.",
    guidelines: [
      "Can be done in your living room, no equipment needed",
      "Focus on movement quality over speed",
      "Great before surf sessions for better pop-ups",
      "Ideal swap for gym mornings when your body needs recovery",
      "Every exercise directly feeds surf performance",
    ],
    surfWhy: "Primes the movement patterns surfing demands. 12 minutes that make the rest of your day move better."
  },
  stretch_full: {
    title: "Deep Mobility Session",
    icon: "\ud83e\uddd8\u200d\u2642\ufe0f",
    color: "#e6b800",
    duration: "25-30 min",
    description: "Comprehensive foam rolling and long-hold stretches. Best for rest days, evenings, or when your body is telling you to recover instead of train.",
    guidelines: [
      "Foam roller recommended but not required",
      "Hold stretches minimum 45 seconds for tissue change",
      "Breathe deeply into tight areas",
      "Great for evenings after long surf days",
      "Can replace a gym session on heavy surf weeks",
    ],
    surfWhy: "Jaco Rehab: 'If the hip cannot rotate, that twisting force goes to the knee.' This is your joint insurance policy."
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE ENGINE (infinite rolling mesocycles)
// ═══════════════════════════════════════════════════════════════════════════

const MESO_LENGTH = 4; // weeks per mesocycle
const GYM_PATS = [[1,3,5],[1,2,4],[1,3,4],[2,3,5]]; // normal week gym day patterns (weekday 1=Mon)
const GYM_PATS_DELOAD = [[1,4],[2,5],[1,3],[2,4]]; // deload: only 2 gym days

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function countGymDaysBefore(globalWeek) {
  let count = 0;
  for (let w = 0; w < globalWeek; w++) {
    const isDeload = (w % MESO_LENGTH) === (MESO_LENGTH - 1);
    const pats = isDeload ? GYM_PATS_DELOAD : GYM_PATS;
    count += pats[w % pats.length].length;
  }
  return count;
}

function generateWeek(startDate, globalWeek, overrides) {
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + globalWeek * 7);
  const weekInMeso = (globalWeek % MESO_LENGTH) + 1;
  const mesocycle = Math.floor(globalWeek / MESO_LENGTH) + 1;
  const isDeload = weekInMeso === MESO_LENGTH;
  const pats = isDeload ? GYM_PATS_DELOAD : GYM_PATS;
  const pat = pats[globalWeek % pats.length];
  const gymBefore = countGymDaysBefore(globalWeek);
  const rot = ["A", "B", "C"];
  let gymCount = 0;
  const days = [];

  for (let d = 0; d < 7; d++) {
    const dt = new Date(weekStart);
    dt.setDate(dt.getDate() + d);
    const dow = dt.getDay();
    const dn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow];
    const dk = dateKey(dt);

    // Check for user override
    if (overrides && overrides[dk]) {
      const ov = overrides[dk];
      if (ov.am?.type === 'gym') gymCount++;
      days.push({ date: dt, dayOfWeek: dow, dayName: dn, am: ov.am, pm: ov.pm, isOverride: true });
      continue;
    }

    let am = null, pm = null;

    if (dow === 0 || dow === 6) {
      pm = { type: "surf", label: "Surf" };
    } else {
      if (pat.includes(dow) && gymCount < pat.length) {
        const progIdx = (gymBefore + gymCount) % 3;
        am = { type: "gym", program: rot[progIdx] };
        gymCount++;
      }
      if (dow === 4) {
        pm = { type: "softball", label: "Softball (or Surf)" };
      } else {
        const slots = [1, 2, 3, 5];
        const slotIdx = slots.indexOf(dow);
        const a1 = globalWeek % 4, a2 = (globalWeek + 2) % 4;
        const twoAlt = weekInMeso === 3;
        if (slotIdx >= 0 && (slotIdx === a1 || (twoAlt && slotIdx === a2))) {
          const opts = ["run", "mtb", "yoga"];
          pm = { type: "alt", activity: opts[slotIdx === a1 ? globalWeek % 3 : (globalWeek + 1) % 3] };
        } else {
          pm = { type: "surf", label: "Surf" };
        }
      }
    }
    days.push({ date: dt, dayOfWeek: dow, dayName: dn, am, pm });
  }

  return { weekNumber: globalWeek + 1, startDate: weekStart, days, mesocycle, weekInMeso, isDeload };
}

function generateVisibleWeeks(startDate, overrides) {
  const now = new Date();
  const msPerDay = 86400000;
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
  const currentGW = Math.max(0, Math.floor(daysDiff / 7));
  const first = Math.max(0, currentGW - 2);
  const last = currentGW + 5;
  const weeks = [];
  for (let w = first; w <= last; w++) {
    weeks.push(generateWeek(startDate, w, overrides));
  }
  return weeks;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING (localStorage)
// ═══════════════════════════════════════════════════════════════════════════

function useProgress() {
  const [progress, setProgress] = useLocalState('surf-progress', {});
  const toggle = useCallback((date, activity) => {
    const key = dateKey(date);
    setProgress(prev => {
      const dayData = { ...(prev[key] || {}) };
      if (dayData[activity]) delete dayData[activity];
      else dayData[activity] = true;
      const next = { ...prev };
      if (Object.keys(dayData).length === 0) delete next[key];
      else next[key] = dayData;
      return next;
    });
  }, [setProgress]);
  const isComplete = useCallback((date, activity) => {
    const key = dateKey(date);
    return !!(progress[key] && progress[key][activity]);
  }, [progress]);
  const reset = useCallback(() => setProgress({}), [setProgress]);
  return { progress, toggle, isComplete, reset };
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function CheckBtn({ checked, onClick, size = 20, color = "#00d4aa" }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
      width: size, height: size, borderRadius: size / 2,
      border: checked ? `2px solid ${color}` : "2px solid #333",
      backgroundColor: checked ? color : "transparent",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s", flexShrink: 0, padding: 0,
    }}>
      {checked && <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-6" stroke="#08080c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXERCISE DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════

function ExerciseDetailView({ exerciseName, sets, sectionColor, onBack, mobile }) {
  const data = EX_DATA[exerciseName];
  const canvasW = mobile ? 320 : 380;
  const canvasH = mobile ? 290 : 340;
  if (!data) return (
    <div style={{padding:"20px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#00d4aa",cursor:"pointer",fontSize:"13px",marginBottom:"16px"}}>&larr; Back</button>
      <p style={{color:"#888"}}>Detail coming soon for "{exerciseName}".</p>
    </div>
  );
  return (
    <div style={{animation:"slideIn 0.25s ease-out"}}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#00d4aa",cursor:"pointer",fontSize:"13px",marginBottom:"20px",fontFamily:"'JetBrains Mono',monospace"}}>&larr; Back to workout</button>
      <div style={{fontSize:"10px",letterSpacing:"2px",color:sectionColor,fontFamily:"'JetBrains Mono',monospace",marginBottom:"6px"}}>{sets}</div>
      <h3 style={{fontSize:mobile?"18px":"22px",fontWeight:700,color:"#fff",marginBottom:"16px",fontFamily:"'Instrument Sans',sans-serif"}}>{exerciseName}</h3>
      <div style={{backgroundColor:"#0a0a10",borderRadius:"16px",border:"1px solid #1a1a22",marginBottom:"20px",overflow:"hidden",display:"flex",justifyContent:"center"}}>
        <AnimatedExercise exerciseName={exerciseName} width={canvasW} height={canvasH} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"24px"}}>
        <div style={{backgroundColor:"#0c0c10",borderRadius:"10px",padding:"14px",border:"1px solid #1a1a1f"}}>
          <div style={{fontSize:"9px",letterSpacing:"1.5px",color:"#555",marginBottom:"4px",fontFamily:"'JetBrains Mono',monospace"}}>MUSCLES</div>
          <div style={{fontSize:"12px",color:"#aaa"}}>{data.muscles}</div>
        </div>
        <div style={{backgroundColor:"#0c0c10",borderRadius:"10px",padding:"14px",border:"1px solid #1a1a1f"}}>
          <div style={{fontSize:"9px",letterSpacing:"1.5px",color:"#555",marginBottom:"4px",fontFamily:"'JetBrains Mono',monospace"}}>EQUIPMENT</div>
          <div style={{fontSize:"12px",color:"#aaa"}}>{data.equip}</div>
        </div>
      </div>
      <div style={{backgroundColor:"#00d4aa08",borderRadius:"10px",padding:mobile?"12px":"16px",border:"1px solid #00d4aa15",marginBottom:"24px"}}>
        <div style={{fontSize:"9px",letterSpacing:"1.5px",color:"#00d4aa",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>WHY THIS FOR SURFING</div>
        <div style={{fontSize:"13px",color:"#999",lineHeight:1.6}}>{data.surfWhy}</div>
      </div>
      <div>
        <div style={{fontSize:"10px",letterSpacing:"2px",color:sectionColor,marginBottom:"14px",fontFamily:"'JetBrains Mono',monospace"}}>HOW TO PERFORM</div>
        {data.steps.map((step,i)=>(
          <div key={i} style={{display:"flex",gap:"12px",marginBottom:"14px",alignItems:"flex-start"}}>
            <div style={{width:"22px",height:"22px",borderRadius:"6px",backgroundColor:`${sectionColor}15`,color:sectionColor,fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{i+1}</div>
            <div style={{fontSize:"13px",color:"#bbb",lineHeight:1.6}}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXERCISE SWAP BOTTOM SHEET (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════

function ExerciseSwapSheet({ exerciseName, onSwap, onClose, mobile }) {
  const alts = EXERCISE_ALTERNATIVES[exerciseName] || [];
  if (alts.length === 0) return null;
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,top:0,zIndex:1100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} />
      <div style={{position:"relative",backgroundColor:"#111116",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"500px",padding:mobile?"20px 16px 32px":"28px 24px 36px",maxHeight:"60vh",overflowY:"auto",animation:"sheetUp 0.25s ease-out"}} onClick={e=>e.stopPropagation()}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{width:"40px",height:"4px",backgroundColor:"#333",borderRadius:"2px",margin:"0 auto 16px"}} />
        <div style={{fontSize:"10px",letterSpacing:"2px",color:"#555",fontFamily:"'JetBrains Mono',monospace",marginBottom:"4px"}}>SWAP EXERCISE</div>
        <div style={{fontSize:"16px",fontWeight:600,color:"#fff",marginBottom:"16px"}}>{exerciseName}</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {alts.map((alt,i) => (
            <button key={i} onClick={() => onSwap(alt.name)} style={{display:"flex",flexDirection:"column",gap:"4px",padding:"14px",backgroundColor:"#0c0c10",border:"1px solid #1a1a1f",borderRadius:"12px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#00d4aa44"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1f"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"14px",fontWeight:600,color:"#ddd"}}>{alt.name}</span>
                <span style={{fontSize:"10px",color:"#00d4aa",fontFamily:"'JetBrains Mono',monospace"}}>SELECT</span>
              </div>
              <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                <span style={{fontSize:"10px",color:"#48dbfb",backgroundColor:"#48dbfb15",padding:"2px 8px",borderRadius:"4px",fontFamily:"'JetBrains Mono',monospace"}}>{alt.equip}</span>
                <span style={{fontSize:"11px",color:"#888"}}>{alt.note}</span>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{marginTop:"16px",width:"100%",padding:"12px",backgroundColor:"#1a1a1f",border:"none",borderRadius:"10px",color:"#888",fontSize:"13px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Keep current exercise</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKOUT DETAIL (updated: X button fix + swap buttons)
// ═══════════════════════════════════════════════════════════════════════════

function WorkoutDetail({ program, onClose, mobile, swaps, onSwapExercise }) {
  const [sel, setSel] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const data = WORKOUT_PROGRAMS[program]; if (!data) return null;
  const sections = [{label:"WARMUP",items:data.warmup,color:"#f39c12"},{label:"MAIN WORK",items:data.main,color:"#00d4aa"},{label:"FINISHER + MOBILITY",items:data.finisher,color:"#48dbfb"}];

  const getDisplayName = (name) => (swaps && swaps[name]) || name;
  const isSwapped = (name) => swaps && swaps[name] && swaps[name] !== name;

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:mobile?"flex-start":"center",justifyContent:"center",padding:mobile?0:"20px",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{backgroundColor:"#111116",borderRadius:mobile?0:"20px",maxWidth:mobile?"100%":"680px",width:"100%",maxHeight:mobile?"100vh":"85vh",height:mobile?"100vh":"auto",overflowY:"auto",padding:mobile?"0 16px 36px":"36px",color:"#e8e8ec",border:mobile?"none":"1px solid rgba(0,212,170,0.2)",position:"relative",WebkitOverflowScrolling:"touch"}} onClick={e=>e.stopPropagation()}>
        {/* FIXED: Safe-area-aware close button header */}
        <div style={{position:"sticky",top:0,zIndex:10,backgroundColor:"#111116",paddingTop:mobile?"max(12px, env(safe-area-inset-top, 12px))":"16px",paddingBottom:"8px",display:"flex",justifyContent:"flex-end",marginBottom:"4px"}}>
          <button onClick={onClose} style={{background:"#222",border:"none",color:"#888",fontSize:"16px",cursor:"pointer",width:"36px",height:"36px",borderRadius:"18px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>&times;</button>
        </div>
        {sel ? (
          <ExerciseDetailView exerciseName={getDisplayName(sel.exercise)} sets={sel.sets} sectionColor={sel.color} onBack={()=>setSel(null)} mobile={mobile}/>
        ) : (
          <>
            <div style={{fontSize:"11px",letterSpacing:"3px",color:"#00d4aa",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>WORKOUT {program}</div>
            <h2 style={{fontSize:mobile?"20px":"24px",fontWeight:700,marginBottom:"8px",fontFamily:"'Instrument Sans',sans-serif",color:"#fff"}}>{data.name}</h2>
            <p style={{fontSize:"13px",color:"#999",marginBottom:"6px",lineHeight:1.5}}>{data.focus}</p>
            <p style={{fontSize:"13px",color:"#777",marginBottom:"20px",lineHeight:1.5,fontStyle:"italic"}}>{data.why}</p>
            <p style={{fontSize:"11px",color:"#555",marginBottom:"24px"}}>Sources: {data.sources}</p>
            {sections.map(s => (
              <div key={s.label} style={{marginBottom:"24px"}}>
                <div style={{fontSize:"10px",letterSpacing:"2.5px",color:s.color,marginBottom:"12px",fontFamily:"'JetBrains Mono',monospace",borderBottom:`1px solid ${s.color}33`,paddingBottom:"6px"}}>{s.label}</div>
                {s.items.map((item, i) => {
                  const displayName = getDisplayName(item.exercise);
                  const swapped = isSwapped(item.exercise);
                  const has = !!EX_DATA[displayName];
                  const hasAlts = !!EXERCISE_ALTERNATIVES[item.exercise];
                  return (
                    <div key={i} style={{marginBottom:mobile?"10px":"14px",paddingLeft:"12px",borderLeft:`2px solid ${s.color}44`,borderRadius:"0 8px 8px 0",padding:mobile?"8px 10px":"10px 12px",backgroundColor:"transparent",minHeight:mobile?"44px":"auto",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px",gap:"8px"}}>
                        <div style={{flex:1,cursor:has?"pointer":"default"}} onClick={()=>has&&setSel({...item,exercise:item.exercise,color:s.color})}>
                          <span style={{fontSize:mobile?"13px":"14px",fontWeight:600,color:swapped?"#e6b800":"#ddd"}}>{displayName}</span>
                          {swapped && <span style={{fontSize:"9px",color:"#888",marginLeft:"6px"}}>(swapped)</span>}
                          {has && <span style={{fontSize:"10px",color:`${s.color}88`,marginLeft:"8px"}}>&rarr;</span>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                          <span style={{fontSize:"12px",color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{item.sets}</span>
                          {hasAlts && (
                            <button onClick={(e)=>{e.stopPropagation();setSwapTarget(item.exercise);}} style={{background:"#1a1a2e",border:"1px solid #333",borderRadius:"6px",padding:"4px 8px",cursor:"pointer",fontSize:"9px",color:"#888",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.5px"}}>SWAP</button>
                          )}
                        </div>
                      </div>
                      <p style={{fontSize:"12px",color:"#888",lineHeight:1.5,margin:0}}>{item.notes}</p>
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{fontSize:"11px",color:"#555",marginTop:"16px",paddingTop:"16px",borderTop:"1px solid #222"}}>Target: 45-55 min. Tap any exercise for guide. Tap SWAP for alternatives.</div>
          </>
        )}
      </div>
      {swapTarget && (
        <ExerciseSwapSheet
          exerciseName={swapTarget}
          onSwap={(newName) => { onSwapExercise(swapTarget, newName); setSwapTarget(null); }}
          onClose={() => setSwapTarget(null)}
          mobile={mobile}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY DETAIL MODAL (Phase 2 — clickable activities)
// ═══════════════════════════════════════════════════════════════════════════

function ActivityDetailModal({ activityKey, onClose, mobile }) {
  const info = ACTIVITY_DETAILS[activityKey];
  if (!info) return null;
  const routine = activityKey === 'stretch_short' ? STRETCH_ROUTINES.short :
                  activityKey === 'stretch_full' ? STRETCH_ROUTINES.full : null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:mobile?"flex-start":"center",justifyContent:"center",padding:mobile?0:"20px",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{backgroundColor:"#111116",borderRadius:mobile?0:"20px",maxWidth:mobile?"100%":"600px",width:"100%",maxHeight:mobile?"100vh":"85vh",height:mobile?"100vh":"auto",overflowY:"auto",padding:mobile?"0 16px 36px":"36px",color:"#e8e8ec",border:mobile?"none":`1px solid ${info.color}33`,position:"relative",WebkitOverflowScrolling:"touch"}} onClick={e=>e.stopPropagation()}>
        <div style={{position:"sticky",top:0,zIndex:10,backgroundColor:"#111116",paddingTop:mobile?"max(12px, env(safe-area-inset-top, 12px))":"16px",paddingBottom:"8px",display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"#222",border:"none",color:"#888",fontSize:"16px",cursor:"pointer",width:"36px",height:"36px",borderRadius:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>&times;</button>
        </div>
        <div style={{fontSize:"36px",marginBottom:"12px"}}>{info.icon}</div>
        <div style={{fontSize:"10px",letterSpacing:"2px",color:info.color,fontFamily:"'JetBrains Mono',monospace",marginBottom:"6px"}}>{info.duration}</div>
        <h2 style={{fontSize:mobile?"20px":"24px",fontWeight:700,marginBottom:"12px",fontFamily:"'Instrument Sans',sans-serif"}}>{info.title}</h2>
        <p style={{fontSize:"13px",color:"#999",lineHeight:1.6,marginBottom:"20px"}}>{info.description}</p>

        {info.surfWhy && (
          <div style={{backgroundColor:`${info.color}08`,borderRadius:"10px",padding:"14px",border:`1px solid ${info.color}15`,marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"1.5px",color:info.color,marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>SURF CONNECTION</div>
            <div style={{fontSize:"12px",color:"#999",lineHeight:1.6,fontStyle:"italic"}}>{info.surfWhy}</div>
          </div>
        )}

        {/* Guidelines */}
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"10px",letterSpacing:"2px",color:info.color,marginBottom:"12px",fontFamily:"'JetBrains Mono',monospace"}}>GUIDELINES</div>
          {info.guidelines.map((g, i) => (
            <div key={i} style={{display:"flex",gap:"10px",marginBottom:"10px",alignItems:"flex-start"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"3px",backgroundColor:info.color,marginTop:"6px",flexShrink:0,opacity:0.6}} />
              <div style={{fontSize:"13px",color:"#bbb",lineHeight:1.5}}>{g}</div>
            </div>
          ))}
        </div>

        {/* Stretch routine exercises if applicable */}
        {routine && (
          <div>
            <div style={{fontSize:"10px",letterSpacing:"2px",color:info.color,marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>{routine.name}</div>
            <p style={{fontSize:"11px",color:"#777",marginBottom:"16px",fontStyle:"italic",lineHeight:1.5}}>{routine.philosophy}</p>
            {routine.exercises.map((ex, i) => (
              <div key={i} style={{display:"flex",gap:"12px",marginBottom:"12px",padding:"10px",backgroundColor:"#0c0c10",borderRadius:"10px",border:"1px solid #1a1a1f",alignItems:"flex-start"}}>
                <div style={{fontSize:"11px",color:info.color,fontFamily:"'JetBrains Mono',monospace",minWidth:"40px",flexShrink:0}}>{ex.time}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#ddd",marginBottom:"2px"}}>{ex.exercise}</div>
                  <div style={{fontSize:"11px",color:"#888"}}>{ex.sets} — {ex.notes}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY EDIT MODAL (Phase 2 — tap day to edit schedule)
// ═══════════════════════════════════════════════════════════════════════════

const ACTIVITY_OPTIONS = [
  { label: "Gym A", value: { type: "gym", program: "A" }, color: "#00d4aa" },
  { label: "Gym B", value: { type: "gym", program: "B" }, color: "#00d4aa" },
  { label: "Gym C", value: { type: "gym", program: "C" }, color: "#00d4aa" },
  { label: "Surf", value: { type: "surf", label: "Surf" }, color: "#48dbfb" },
  { label: "Trail Run", value: { type: "alt", activity: "run" }, color: "#82e0aa" },
  { label: "MTB Ride", value: { type: "alt", activity: "mtb" }, color: "#82e0aa" },
  { label: "Yoga", value: { type: "alt", activity: "yoga" }, color: "#82e0aa" },
  { label: "AM Stretch", value: { type: "alt", activity: "stretch_short" }, color: "#e6b800" },
  { label: "Deep Mobility", value: { type: "alt", activity: "stretch_full" }, color: "#e6b800" },
  { label: "Softball", value: { type: "softball", label: "Softball (or Surf)" }, color: "#c39bd3" },
  { label: "Rest (none)", value: null, color: "#555" },
];

function DayEditModal({ day, onSave, onClose, mobile }) {
  const [am, setAm] = useState(day.am);
  const [pm, setPm] = useState(day.pm);
  const ds = day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const getLabel = (slot) => {
    if (!slot) return "Rest";
    if (slot.type === "gym") return `Gym ${slot.program}`;
    if (slot.type === "surf") return "Surf";
    if (slot.type === "softball") return "Softball";
    if (slot.type === "alt") return ALT_ACTIVITIES[slot.activity]?.name || "Active";
    return "Unknown";
  };

  const getColor = (slot) => {
    if (!slot) return "#555";
    if (slot.type === "gym") return "#00d4aa";
    if (slot.type === "surf") return "#48dbfb";
    if (slot.type === "softball") return "#c39bd3";
    return "#82e0aa";
  };

  const SlotPicker = ({ label, value, onChange }) => (
    <div style={{marginBottom:"20px"}}>
      <div style={{fontSize:"10px",letterSpacing:"2px",color:"#888",fontFamily:"'JetBrains Mono',monospace",marginBottom:"10px"}}>{label}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {ACTIVITY_OPTIONS.map((opt, i) => {
          const isSelected = JSON.stringify(value) === JSON.stringify(opt.value);
          return (
            <button key={i} onClick={() => onChange(opt.value)} style={{
              padding:"8px 12px",borderRadius:"8px",border:isSelected?`2px solid ${opt.color}`:"1px solid #222",
              backgroundColor:isSelected?`${opt.color}15`:"#0c0c10",color:isSelected?opt.color:"#888",
              fontSize:"11px",fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.15s"
            }}>{opt.label}</button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",padding:mobile?0:"20px",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{backgroundColor:"#111116",borderRadius:mobile?"20px 20px 0 0":"20px",maxWidth:"500px",width:"100%",padding:mobile?"20px 16px 36px":"32px",color:"#e8e8ec",border:mobile?"none":"1px solid #1a1a2e",maxHeight:mobile?"85vh":"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"10px",letterSpacing:"2px",color:"#00d4aa",fontFamily:"'JetBrains Mono',monospace",marginBottom:"4px"}}>EDIT DAY</div>
            <div style={{fontSize:"16px",fontWeight:600,color:"#fff"}}>{ds}</div>
          </div>
          <button onClick={onClose} style={{background:"#222",border:"none",color:"#888",fontSize:"16px",cursor:"pointer",width:"36px",height:"36px",borderRadius:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>&times;</button>
        </div>

        <div style={{backgroundColor:"#0c0c10",borderRadius:"12px",padding:"14px",border:"1px solid #1a1a1f",marginBottom:"20px"}}>
          <div style={{fontSize:"10px",color:"#555",fontFamily:"'JetBrains Mono',monospace",marginBottom:"6px"}}>CURRENT</div>
          <div style={{display:"flex",gap:"12px"}}>
            <span style={{fontSize:"12px",color:getColor(day.am)}}>AM: {getLabel(day.am)}</span>
            <span style={{fontSize:"12px",color:getColor(day.pm)}}>PM: {getLabel(day.pm)}</span>
          </div>
          {day.isOverride && <div style={{fontSize:"9px",color:"#e6b800",marginTop:"6px",fontFamily:"'JetBrains Mono',monospace"}}>CUSTOM OVERRIDE</div>}
        </div>

        <SlotPicker label="AM ACTIVITY" value={am} onChange={setAm} />
        <SlotPicker label="PM ACTIVITY" value={pm} onChange={setPm} />

        <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
          <button onClick={() => { onSave(am, pm); onClose(); }} style={{flex:1,padding:"14px",backgroundColor:"#00d4aa",border:"none",borderRadius:"12px",color:"#08080c",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Save Changes</button>
          <button onClick={() => { onSave("__reset__", "__reset__"); onClose(); }} style={{padding:"14px 16px",backgroundColor:"#1a1a1f",border:"1px solid #333",borderRadius:"12px",color:"#888",fontSize:"11px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY CARD (updated: tap to edit, activity clicks)
// ═══════════════════════════════════════════════════════════════════════════

function DayCard({ day, onOpenWorkout, mobile, progress, toggle, onEditDay, onOpenActivity }) {
  const hasAM = day.am !== null, hasPM = day.pm !== null;
  const isToday = new Date().toDateString() === day.date.toDateString();
  const isWE = day.dayOfWeek === 0 || day.dayOfWeek === 6;
  const ds = day.date.toLocaleDateString("en-US", {month:"short",day:"numeric"});
  const dk = dateKey(day.date);
  const dayP = (progress && progress[dk]) || {};
  const gymDone = dayP.gym;
  const pmType = day.pm?.type;
  const pmDone = pmType === 'surf' ? dayP.surf : pmType === 'softball' ? dayP.softball : dayP.alt;
  const pmKey = pmType === 'surf' ? 'surf' : pmType === 'softball' ? 'softball' : 'alt';
  const pmActivity = day.pm?.activity || day.pm?.type;

  const getPmLabel = () => {
    if (!hasPM) return "";
    if (pmType === "surf") return "\ud83c\udfc4 Surf";
    if (pmType === "softball") return "\ud83e\udd4e Softball";
    const act = ALT_ACTIVITIES[day.pm.activity];
    return act ? `${act.icon} ${act.name}` : "Active";
  };

  if (mobile) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",backgroundColor:isToday?"#1a1a2e":day.isOverride?"#1a1518":"#0c0c10",borderRadius:"10px",border:isToday?"1px solid #00d4aa44":day.isOverride?"1px solid #e6b80033":"1px solid #1a1a1f",position:"relative",minHeight:"48px"}}>
        {isToday && <div style={{position:"absolute",left:"-1px",top:"50%",transform:"translateY(-50%)",width:"3px",height:"24px",borderRadius:"0 3px 3px 0",backgroundColor:"#00d4aa"}} />}
        <div style={{width:"36px",textAlign:"center",flexShrink:0}} onClick={() => onEditDay && onEditDay(day)}>
          <div style={{fontSize:"10px",fontWeight:700,color:isWE?"#48dbfb":"#666",letterSpacing:"1px",fontFamily:"'JetBrains Mono',monospace"}}>{day.dayName.toUpperCase()}</div>
          <div style={{fontSize:"9px",color:"#444"}}>{ds}</div>
          {onEditDay && <div style={{fontSize:"7px",color:"#444",marginTop:"2px"}}>edit</div>}
        </div>
        <div style={{flex:1,display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {hasAM && day.am.type === "gym" && (
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              {toggle && <CheckBtn checked={!!gymDone} onClick={() => toggle(day.date,'gym')} size={18} color="#00d4aa"/>}
              <div onClick={() => onOpenWorkout(day.am.program)} style={{backgroundColor:"#00d4aa12",borderRadius:"6px",padding:"4px 10px",border:"1px solid #00d4aa22",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",opacity:gymDone?0.5:1}}>
                <span style={{fontSize:"9px",color:"#00d4aa",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>GYM</span>
                <span style={{fontSize:"11px",fontWeight:600,color:"#ccc",textDecoration:gymDone?"line-through":"none"}}>{WORKOUT_PROGRAMS[day.am.program]?.name.split("+")[0].trim()}</span>
                <span style={{fontSize:"10px",color:"#00d4aa88"}}>&rarr;</span>
              </div>
            </div>
          )}
          {hasAM && day.am.type !== "gym" && (
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <span onClick={() => onOpenActivity && onOpenActivity(day.am.activity || day.am.type)} style={{fontSize:"11px",color:"#e6b80088",cursor:"pointer"}}>{ALT_ACTIVITIES[day.am.activity]?.icon} {ALT_ACTIVITIES[day.am.activity]?.name || "Activity"}</span>
            </div>
          )}
          {hasPM && (
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              {toggle && <CheckBtn checked={!!pmDone} onClick={() => toggle(day.date,pmKey)} size={18} color={pmType==='surf'?'#48dbfb':pmType==='softball'?'#c39bd3':'#82e0aa'}/>}
              <span onClick={() => onOpenActivity && onOpenActivity(pmActivity)} style={{fontSize:"11px",color:pmDone?"#33333388":pmType==="surf"?"#48dbfb88":pmType==="softball"?"#c39bd388":"#82e0aa88",textDecoration:pmDone?"line-through":"none",cursor:"pointer"}}>{getPmLabel()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop card
  return (
    <div style={{minWidth:"120px",flex:1,backgroundColor:isToday?"#1a1a2e":day.isOverride?"#1a1518":"#0c0c10",borderRadius:"12px",padding:"14px 12px",border:isToday?"1px solid #00d4aa44":day.isOverride?"1px solid #e6b80033":"1px solid #1a1a1f",display:"flex",flexDirection:"column",gap:"6px",position:"relative",cursor:"pointer"}} onClick={() => onEditDay && onEditDay(day)}>
      {isToday && <div style={{position:"absolute",top:"-1px",left:"50%",transform:"translateX(-50%)",width:"30px",height:"3px",borderRadius:"0 0 3px 3px",backgroundColor:"#00d4aa"}} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <span style={{fontSize:"11px",fontWeight:700,color:isWE?"#48dbfb":"#777",letterSpacing:"1px",fontFamily:"'JetBrains Mono',monospace"}}>{day.dayName.toUpperCase()}</span>
        <span style={{fontSize:"10px",color:"#444"}}>{ds}</span>
      </div>
      {hasAM && day.am.type === "gym" && (
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          {toggle && <CheckBtn checked={!!gymDone} onClick={() => toggle(day.date,'gym')} size={18} color="#00d4aa"/>}
          <div onClick={(e) => { e.stopPropagation(); onOpenWorkout(day.am.program); }} style={{flex:1,backgroundColor:"#00d4aa12",borderRadius:"8px",padding:"8px",cursor:"pointer",border:"1px solid #00d4aa22",opacity:gymDone?0.5:1}}>
            <div style={{fontSize:"9px",color:"#00d4aa",letterSpacing:"1.5px",fontFamily:"'JetBrains Mono',monospace",marginBottom:"2px"}}>AM GYM</div>
            <div style={{fontSize:"12px",fontWeight:600,color:"#ccc",textDecoration:gymDone?"line-through":"none"}}>{WORKOUT_PROGRAMS[day.am.program]?.name.split("+")[0].trim()}</div>
          </div>
        </div>
      )}
      {hasAM && day.am.type !== "gym" && (
        <div onClick={(e) => { e.stopPropagation(); onOpenActivity && onOpenActivity(day.am.activity || day.am.type); }} style={{backgroundColor:"#e6b80008",borderRadius:"8px",padding:"8px",border:"1px solid #e6b80015",cursor:"pointer"}}>
          <div style={{fontSize:"9px",color:"#e6b800",letterSpacing:"1.5px",fontFamily:"'JetBrains Mono',monospace",marginBottom:"2px"}}>AM</div>
          <div style={{fontSize:"12px",fontWeight:500,color:"#aaa"}}>{ALT_ACTIVITIES[day.am.activity]?.icon} {ALT_ACTIVITIES[day.am.activity]?.name}</div>
        </div>
      )}
      {hasPM && (
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          {toggle && <CheckBtn checked={!!pmDone} onClick={() => toggle(day.date,pmKey)} size={18} color={pmType==='surf'?'#48dbfb':pmType==='softball'?'#c39bd3':'#82e0aa'}/>}
          <div onClick={(e) => { e.stopPropagation(); onOpenActivity && onOpenActivity(pmActivity); }} style={{flex:1,backgroundColor:pmType==="surf"?"#48dbfb0a":pmType==="softball"?"#c39bd30a":"#82e0aa0a",borderRadius:"8px",padding:"8px",border:`1px solid ${pmType==="surf"?"#48dbfb15":pmType==="softball"?"#c39bd315":"#82e0aa15"}`,opacity:pmDone?0.5:1,cursor:"pointer"}}>
            <div style={{fontSize:"9px",letterSpacing:"1.5px",fontFamily:"'JetBrains Mono',monospace",marginBottom:"2px",color:pmType==="surf"?"#48dbfb":pmType==="softball"?"#c39bd3":"#82e0aa"}}>{isWE ? "" : "PM "}{pmType==="surf"?"SURF":pmType==="softball"?"SOFTBALL":"ACTIVE"}</div>
            <div style={{fontSize:"12px",fontWeight:500,color:"#aaa",textDecoration:pmDone?"line-through":"none"}}>{getPmLabel()}</div>
          </div>
        </div>
      )}
      {!hasAM && !hasPM && <div style={{fontSize:"10px",color:"#333"}}>Rest</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEK ROW
// ═══════════════════════════════════════════════════════════════════════════

function WeekRow({ week, onOpenWorkout, mobile, progress, toggle, onEditDay, onOpenActivity }) {
  const ss = week.startDate.toLocaleDateString("en-US",{month:"long",day:"numeric"});
  const ed = new Date(week.startDate); ed.setDate(ed.getDate()+6);
  const es = ed.toLocaleDateString("en-US",{month:"long",day:"numeric"});

  let gymTotal=0,gymDone=0,surfTotal=0,surfDone=0;
  week.days.forEach(d=>{
    const dk=dateKey(d.date);const dayP=(progress&&progress[dk])||{};
    if(d.am&&d.am.type==='gym'){gymTotal++;if(dayP.gym)gymDone++;}
    if(d.pm&&d.pm.type==='surf'){surfTotal++;if(dayP.surf)surfDone++;}
  });

  return (
    <div style={{marginBottom:mobile?"24px":"32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:mobile?"8px":"12px",padding:"0 4px",flexWrap:"wrap",gap:"4px"}}>
        <div>
          <span style={{fontSize:mobile?"10px":"11px",letterSpacing:"3px",color:week.isDeload?"#e6b800":"#00d4aa",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>
            {week.isDeload ? "DELOAD" : `M${week.mesocycle} W${week.weekInMeso}`}
          </span>
          <span style={{fontSize:mobile?"11px":"13px",color:"#555",marginLeft:mobile?"8px":"12px"}}>{ss} &mdash; {es}</span>
        </div>
        <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
          <span style={{fontSize:"10px",color:gymDone===gymTotal&&gymTotal>0?"#00d4aa":"#00d4aa88",fontFamily:"'JetBrains Mono',monospace"}}>{gymDone}/{gymTotal} gym{gymDone===gymTotal&&gymTotal>0?" \u2713":""}</span>
          <span style={{fontSize:"10px",color:surfDone===surfTotal&&surfTotal>0?"#48dbfb":"#48dbfb88",fontFamily:"'JetBrains Mono',monospace"}}>{surfDone}/{surfTotal} surf{surfDone===surfTotal&&surfTotal>0?" \u2713":""}</span>
        </div>
      </div>
      {mobile ? (
        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{week.days.map((d,i) => <DayCard key={i} day={d} onOpenWorkout={onOpenWorkout} mobile={mobile} progress={progress} toggle={toggle} onEditDay={onEditDay} onOpenActivity={onOpenActivity} />)}</div>
      ) : (
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px"}}>{week.days.map((d,i) => <DayCard key={i} day={d} onOpenWorkout={onOpenWorkout} mobile={mobile} progress={progress} toggle={toggle} onEditDay={onEditDay} onOpenActivity={onOpenActivity} />)}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM OVERVIEW + ALT ACTIVITIES (updated: clickable)
// ═══════════════════════════════════════════════════════════════════════════

function ProgramOverview({ onOpenWorkout, mobile }) {
  return (
    <div style={{marginBottom:mobile?"32px":"48px"}}>
      <h2 style={{fontSize:"16px",fontWeight:700,color:"#ddd",marginBottom:"20px",fontFamily:"'Instrument Sans',sans-serif"}}>THE THREE SESSIONS</h2>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",flexDirection:mobile?"column":"row"}}>
        {["A","B","C"].map(k => { const p = WORKOUT_PROGRAMS[k]; return (
          <div key={k} onClick={() => onOpenWorkout(k)} style={{flex:mobile?"none":"1 1 200px",backgroundColor:"#0c0c10",borderRadius:"14px",padding:mobile?"16px":"20px",border:"1px solid #1a1a1f",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#00d4aa44";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1a1a1f";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{fontSize:"10px",letterSpacing:"2px",color:"#00d4aa",fontFamily:"'JetBrains Mono',monospace",marginBottom:"8px"}}>WORKOUT {k}</div>
            <div style={{fontSize:"15px",fontWeight:700,color:"#ddd",marginBottom:"6px"}}>{p.name}</div>
            <div style={{fontSize:"12px",color:"#666",lineHeight:1.5}}>{p.focus}</div>
            <div style={{fontSize:"11px",color:"#00d4aa66",marginTop:"12px"}}>Tap for full breakdown &rarr;</div>
          </div>
        );})}
      </div>
    </div>
  );
}

function AltActivities({ mobile, onOpenActivity }) {
  return (
    <div style={{marginBottom:mobile?"32px":"48px"}}>
      <h2 style={{fontSize:"16px",fontWeight:700,color:"#ddd",marginBottom:"20px",fontFamily:"'Instrument Sans',sans-serif"}}>ACTIVITIES &amp; ALTERNATIVES</h2>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",flexDirection:mobile?"column":"row"}}>
        {Object.entries(ALT_ACTIVITIES).map(([k, a]) => (
          <div key={k} onClick={() => onOpenActivity && onOpenActivity(k)} style={{flex:"1 1 200px",backgroundColor:"#0c0c10",borderRadius:"14px",padding:"20px",border:`1px solid ${a.color || '#1a1a1f'}22`,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=`${a.color||'#82e0aa'}44`;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${a.color||'#1a1a1f'}22`;e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{fontSize:"22px",marginBottom:"8px"}}>{a.icon}</div>
            <div style={{fontSize:"14px",fontWeight:600,color:a.color||"#82e0aa",marginBottom:"4px"}}>{a.name}</div>
            <div style={{fontSize:"11px",color:"#666",marginBottom:"8px"}}>{a.duration}</div>
            <div style={{fontSize:"12px",color:"#888",lineHeight:1.5}}>{a.detail}</div>
            <div style={{fontSize:"10px",color:`${a.color||'#82e0aa'}66`,marginTop:"10px"}}>Tap for details &rarr;</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PHILOSOPHY SECTION
// ═══════════════════════════════════════════════════════════════════════════

function PhilosophySection({ mobile }) {
  return (
    <div style={{marginBottom:mobile?"32px":"48px",backgroundColor:"#0c0c10",borderRadius:"16px",padding:mobile?"20px":"28px",border:"1px solid #1a1a1f"}}>
      <h2 style={{fontSize:"16px",fontWeight:700,color:"#ddd",marginBottom:"16px",fontFamily:"'Instrument Sans',sans-serif"}}>TRAINING PHILOSOPHY</h2>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fit,minmax(250px,1fr))",gap:"20px"}}>
        {[
          {title:"Surf First, Gym Second",text:"Cody Thompson trains no more than 3x/week and never chooses gym over a surf session."},
          {title:"Movement Patterns, Not Muscles",text:"Cris Mills: 'Squats, lunges, bends, rotations, pushes, pulls \u2014 those are the foundation.'"},
          {title:"Hips & Knees Are Connected",text:"Jaco Rehab: 'If the hip cannot rotate, that twisting force goes to the knee.' Every session addresses both."},
          {title:"Train Smart, Not Hard",text:"Dr. Tim Brown (Kelly Slater's coach): 'Simply training to make muscles stronger is a recipe for injury.'"},
          {title:"Mesocycle Periodization",text:"4-week blocks: 3 weeks progressive training, 1 week deload. This program repeats forever \u2014 sustainable gains without burnout."},
          {title:"Stretch as Training",text:"Dedicated mobility isn't optional. Short AM flows and deep sessions are equal citizens in the program."},
        ].map((item, i) => (
          <div key={i}>
            <div style={{fontSize:"13px",fontWeight:600,color:"#00d4aa",marginBottom:"6px"}}>{item.title}</div>
            <div style={{fontSize:"12px",color:"#888",lineHeight:1.6}}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS CHART (Canvas)
// ═══════════════════════════════════════════════════════════════════════════

function ProgressChart({ schedule, progress, mobile }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || schedule.length === 0) return;

    const cw = container.offsetWidth;
    const ch = mobile ? 260 : 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 40, right: 20, bottom: 50, left: 44 };
    const gw = cw - pad.left - pad.right;
    const gh = ch - pad.top - pad.bottom;

    const weekData = schedule.map(week => {
      let gym = 0, gymTotal = 0, surf = 0, surfTotal = 0, other = 0, otherTotal = 0;
      week.days.forEach(d => {
        const key = dateKey(d.date);
        const dayP = progress[key] || {};
        if (d.am && d.am.type === 'gym') { gymTotal++; if (dayP.gym) gym++; }
        if (d.pm) {
          if (d.pm.type === 'surf') { surfTotal++; if (dayP.surf) surf++; }
          else if (d.pm.type === 'softball') { otherTotal++; if (dayP.softball) other++; }
          else { otherTotal++; if (dayP.alt) other++; }
        }
      });
      return { gym, gymTotal, surf, surfTotal, other, otherTotal, total: gym + surf + other, totalPossible: gymTotal + surfTotal + otherTotal, weekNum: week.weekNumber };
    });

    ctx.fillStyle = '#08080c'; ctx.fillRect(0, 0, cw, ch);

    const maxY = Math.max(10, ...weekData.map(w => w.totalPossible));
    const ySteps = 5;
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#444'; ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round(maxY * i / ySteps);
      const y = pad.top + gh - (gh * i / ySteps);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gw, y); ctx.stroke();
      ctx.fillText(val, pad.left - 8, y + 4);
    }

    ctx.textAlign = 'center'; ctx.fillStyle = '#444';
    const barGroupW = gw / weekData.length;
    weekData.forEach((w, i) => {
      const x = pad.left + i * barGroupW + barGroupW / 2;
      ctx.fillText(`W${w.weekNum}`, x, ch - pad.bottom + 18);
    });

    weekData.forEach((w, i) => {
      const x = pad.left + i * barGroupW + barGroupW * 0.15;
      const bw = barGroupW * 0.35;
      const x2 = x + bw + barGroupW * 0.05;
      const possH = (w.totalPossible / maxY) * gh;
      ctx.fillStyle = '#151520';
      ctx.beginPath(); ctx.roundRect(x, pad.top + gh - possH, bw * 2 + barGroupW * 0.05, possH, 3); ctx.fill();
      const gymH = (w.gym / maxY) * gh;
      if (gymH > 0) { ctx.fillStyle = '#00d4aa'; ctx.beginPath(); ctx.roundRect(x, pad.top + gh - gymH, bw, gymH, [3, 3, 0, 0]); ctx.fill(); }
      const surfH = (w.surf / maxY) * gh;
      const otherH = (w.other / maxY) * gh;
      if (surfH > 0) { ctx.fillStyle = '#48dbfb'; ctx.beginPath(); ctx.roundRect(x2, pad.top + gh - surfH - otherH, bw, surfH, otherH > 0 ? 0 : [3, 3, 0, 0]); ctx.fill(); }
      if (otherH > 0) { ctx.fillStyle = '#c39bd3'; ctx.beginPath(); ctx.roundRect(x2, pad.top + gh - otherH, bw, otherH, [3, 3, 0, 0]); ctx.fill(); }
    });

    ctx.font = "11px 'JetBrains Mono', monospace"; ctx.fillStyle = '#555'; ctx.textAlign = 'left';
    ctx.fillText('ACTIVITIES COMPLETED BY WEEK', pad.left, 20);
    const legendX = cw - pad.right; ctx.textAlign = 'right';
    ctx.font = "9px 'JetBrains Mono', monospace";
    [{ c: '#00d4aa', l: 'Gym' }, { c: '#48dbfb', l: 'Surf' }, { c: '#c39bd3', l: 'Other' }].forEach((item, i) => {
      const lx = legendX - i * 65;
      ctx.fillStyle = item.c; ctx.fillRect(lx - 50, 14, 8, 8);
      ctx.fillStyle = '#666'; ctx.fillText(item.l, lx, 22);
    });
  }, [schedule, progress, mobile]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: mobile ? '260px' : '320px', display: 'block' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS VIEW
// ═══════════════════════════════════════════════════════════════════════════

function ProgressView({ schedule, progress, isComplete, toggle, mobile, reset }) {
  let totalGym = 0, doneGym = 0, totalSurf = 0, doneSurf = 0, totalOther = 0, doneOther = 0;
  schedule.forEach(week => {
    week.days.forEach(d => {
      const key = dateKey(d.date);
      const dayP = progress[key] || {};
      if (d.am && d.am.type === 'gym') { totalGym++; if (dayP.gym) doneGym++; }
      if (d.pm) {
        if (d.pm.type === 'surf') { totalSurf++; if (dayP.surf) doneSurf++; }
        else if (d.pm.type === 'softball') { totalOther++; if (dayP.softball) doneOther++; }
        else { totalOther++; if (dayP.alt) doneOther++; }
      }
    });
  });
  const totalDone = doneGym + doneSurf + doneOther;
  const totalAll = totalGym + totalSurf + totalOther;
  const pct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;

  const now = new Date();
  const curWeek = schedule.find(w => {
    const end = new Date(w.startDate); end.setDate(end.getDate() + 6);
    return now >= w.startDate && now <= end;
  });

  const [showReset, setShowReset] = useState(false);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Overall', value: `${pct}%`, sub: `${totalDone}/${totalAll} activities`, color: '#00d4aa' },
          { label: 'Gym', value: `${doneGym}/${totalGym}`, sub: 'sessions', color: '#00d4aa' },
          { label: 'Surf', value: `${doneSurf}/${totalSurf}`, sub: 'sessions', color: '#48dbfb' },
          { label: 'Other', value: `${doneOther}/${totalOther}`, sub: 'softball + alt', color: '#c39bd3' },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: '#0c0c10', borderRadius: '12px', padding: mobile ? '14px' : '18px', border: '1px solid #1a1a1f', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: '#555', fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px' }}>{c.label.toUpperCase()}</div>
            <div style={{ fontSize: mobile ? '22px' : '28px', fontWeight: 700, color: c.color, fontFamily: "'JetBrains Mono',monospace" }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {curWeek && (
        <div style={{ backgroundColor: '#0c0c10', borderRadius: '14px', padding: mobile ? '16px' : '20px', border: '1px solid #1a1a1f', marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: curWeek.isDeload ? '#e6b800' : '#00d4aa', fontFamily: "'JetBrains Mono',monospace", marginBottom: '12px' }}>
            THIS WEEK ({curWeek.isDeload ? 'DELOAD' : `M${curWeek.mesocycle} W${curWeek.weekInMeso}`})
          </div>
          <div style={{ display: 'flex', gap: mobile ? '8px' : '16px', flexWrap: 'wrap' }}>
            {curWeek.days.map((d, i) => {
              const key = dateKey(d.date);
              const dayP = progress[key] || {};
              const isToday = now.toDateString() === d.date.toDateString();
              const hasGym = d.am && d.am.type === 'gym';
              const hasPM = d.pm !== null;
              const gymDone = dayP.gym;
              const pmType = d.pm?.type;
              const pmDone = pmType === 'surf' ? dayP.surf : pmType === 'softball' ? dayP.softball : dayP.alt;
              const allDone = (!hasGym || gymDone) && (!hasPM || pmDone);
              const isPast = d.date < now && !isToday;
              return (
                <div key={i} style={{ flex: mobile ? '1 1 calc(50% - 4px)' : '1 1 0', minWidth: mobile ? 'calc(50% - 4px)' : '100px', backgroundColor: isToday ? '#1a1a2e' : '#111116', borderRadius: '10px', padding: '10px', border: isToday ? '1px solid #00d4aa33' : '1px solid #181820', position: 'relative', opacity: isPast && !allDone ? 0.5 : 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: isToday ? '#00d4aa' : '#555', fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px' }}>
                    {d.dayName.toUpperCase()} {isToday && <span style={{ fontSize: '8px', color: '#00d4aa88' }}>TODAY</span>}
                  </div>
                  {hasGym && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckBtn checked={!!gymDone} onClick={() => toggle(d.date, 'gym')} size={18} color="#00d4aa" />
                      <span style={{ fontSize: '11px', color: gymDone ? '#00d4aa88' : '#888', textDecoration: gymDone ? 'line-through' : 'none' }}>Gym {d.am.program}</span>
                    </div>
                  )}
                  {hasPM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckBtn checked={!!pmDone} onClick={() => toggle(d.date, pmType === 'surf' ? 'surf' : pmType === 'softball' ? 'softball' : 'alt')} size={18} color={pmType === 'surf' ? '#48dbfb' : pmType === 'softball' ? '#c39bd3' : '#82e0aa'} />
                      <span style={{ fontSize: '11px', color: pmDone ? '#66666688' : '#888', textDecoration: pmDone ? 'line-through' : 'none' }}>
                        {pmType === 'surf' ? 'Surf' : pmType === 'softball' ? 'Softball' : ALT_ACTIVITIES[d.pm.activity]?.name || 'Active'}
                      </span>
                    </div>
                  )}
                  {!hasGym && !hasPM && <div style={{ fontSize: '10px', color: '#333' }}>Rest</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#0c0c10', borderRadius: '14px', padding: mobile ? '12px' : '20px', border: '1px solid #1a1a1f', marginBottom: '28px' }}>
        <ProgressChart schedule={schedule} progress={progress} mobile={mobile} />
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {!showReset ? (
          <button onClick={() => setShowReset(true)} style={{ background: 'none', border: 'none', color: '#333', fontSize: '11px', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Reset all progress</button>
        ) : (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888' }}>Are you sure?</span>
            <button onClick={() => { reset(); setShowReset(false); }} style={{ background: '#ff4757', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Yes, reset</button>
            <button onClick={() => setShowReset(false)} style={{ background: '#222', border: 'none', color: '#888', fontSize: '11px', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

export default function SurfTrainingSchedule() {
  const mobile = useMobile(480);
  const [activeTab, setActiveTab] = useState("schedule");
  const [openWorkout, setOpenWorkout] = useState(null);
  const [editDay, setEditDay] = useState(null);
  const [openActivity, setOpenActivity] = useState(null);
  const { progress, toggle, isComplete, reset } = useProgress();
  const [overrides, setOverrides] = useLocalState('surf-overrides', {});
  const [swaps, setSwaps] = useLocalState('surf-swaps', {});

  // Program start date — stored so it persists
  const [startDateStr] = useLocalState('surf-start-date', '2026-03-16');
  const startDate = new Date(startDateStr + 'T00:00:00');

  // Generate schedule
  const schedule = generateVisibleWeeks(startDate, overrides);

  // Today's exercise swaps (keyed by today's date)
  const todayKey = dateKey(new Date());
  const todaySwaps = swaps[todayKey] || {};

  const handleSwapExercise = (original, replacement) => {
    setSwaps(prev => ({
      ...prev,
      [todayKey]: { ...(prev[todayKey] || {}), [original]: replacement }
    }));
  };

  const handleEditDay = (am, pm) => {
    if (!editDay) return;
    const dk = dateKey(editDay.date);
    if (am === "__reset__") {
      // Remove override
      setOverrides(prev => {
        const next = { ...prev };
        delete next[dk];
        return next;
      });
    } else {
      setOverrides(prev => ({ ...prev, [dk]: { am, pm } }));
    }
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#08080c",color:"#e8e8ec",fontFamily:"'Instrument Sans',-apple-system,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
        body{background:#08080c}
      `}</style>

      {openWorkout && <WorkoutDetail program={openWorkout} onClose={() => setOpenWorkout(null)} mobile={mobile} swaps={todaySwaps} onSwapExercise={handleSwapExercise} />}
      {editDay && <DayEditModal day={editDay} onSave={handleEditDay} onClose={() => setEditDay(null)} mobile={mobile} />}
      {openActivity && <ActivityDetailModal activityKey={openActivity} onClose={() => setOpenActivity(null)} mobile={mobile} />}

      <div style={{padding:mobile?"28px 16px 20px":"48px 32px 32px",maxWidth:"1100px",margin:"0 auto",borderBottom:"1px solid #111"}}>
        <div style={{fontSize:mobile?"9px":"10px",letterSpacing:mobile?"3px":"4px",color:"#00d4aa",fontFamily:"'JetBrains Mono',monospace",marginBottom:"8px"}}>SURF PERFORMANCE PROGRAM</div>
        <h1 style={{fontSize:mobile?"24px":"36px",fontWeight:700,lineHeight:1.1,marginBottom:"8px"}}>
          <span style={{color:"#fff"}}>Surf </span><span style={{color:"#48dbfb"}}>+</span><span style={{color:"#fff"}}> </span><span style={{color:"#00d4aa"}}>Strength</span>
        </h1>
        <p style={{fontSize:mobile?"12px":"14px",color:"#666",maxWidth:"600px",lineHeight:1.5}}>
          3 gym sessions &middot; 3 surf sessions &middot; 1 softball night &middot; alt activities for flat days.
          {!mobile && <br/>}{mobile ? " \u2014 " : " "}
          Rolling mesocycles. Tap any day to customize. Tap SWAP on exercises.
        </p>
        <div style={{display:"flex",gap:"2px",marginTop:mobile?"16px":"24px",flexWrap:"wrap"}}>
          {[{key:"schedule",label:"Schedule"},{key:"progress",label:"Progress"},{key:"workouts",label:"Workouts"},{key:"philosophy",label:"Philosophy"}].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{padding:mobile?"6px 10px":"8px 16px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:mobile?"11px":"12px",letterSpacing:"1px",fontFamily:"'JetBrains Mono',monospace",backgroundColor:activeTab===tab.key?"#00d4aa15":"transparent",color:activeTab===tab.key?"#00d4aa":"#555"}}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:mobile?"16px":"32px"}}>
        {activeTab === "schedule" && (
          <>
            {!mobile && <div style={{display:"flex",gap:"20px",marginBottom:"32px",flexWrap:"wrap"}}>
              {[{color:"#00d4aa",label:"AM Gym"},{color:"#48dbfb",label:"Surf"},{color:"#c39bd3",label:"Softball"},{color:"#82e0aa",label:"Alt Activity"},{color:"#e6b800",label:"Stretch"}].map(l => (
                <div key={l.label} style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"8px",height:"8px",borderRadius:"2px",backgroundColor:l.color}}/><span style={{fontSize:"11px",color:"#666",fontFamily:"'JetBrains Mono',monospace"}}>{l.label}</span></div>
              ))}
            </div>}
            {schedule.map((week, idx) => {
              const pm = idx > 0 ? schedule[idx-1].startDate.getMonth() : -1;
              const cm = week.startDate.getMonth();
              const mn = week.startDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
              return (
                <div key={week.weekNumber}>
                  {cm !== pm && <div style={{fontSize:mobile?"16px":"20px",fontWeight:700,color:"#333",marginBottom:mobile?"12px":"20px",marginTop:idx===0?"0":mobile?"32px":"48px",paddingBottom:"12px",borderBottom:"1px solid #151518",fontFamily:"'Instrument Sans',sans-serif",letterSpacing:"-0.5px"}}>{mn}</div>}
                  <WeekRow week={week} onOpenWorkout={setOpenWorkout} mobile={mobile} progress={progress} toggle={toggle} onEditDay={setEditDay} onOpenActivity={setOpenActivity} />
                </div>
              );
            })}
            <div style={{marginTop:mobile?"24px":"40px",padding:mobile?"16px":"24px",backgroundColor:"#0c0c10",borderRadius:"14px",border:"1px solid #1a1a1f"}}>
              <div style={{fontSize:"10px",letterSpacing:"2px",color:"#f39c12",fontFamily:"'JetBrains Mono',monospace",marginBottom:"8px"}}>PROGRAM STRUCTURE</div>
              <div style={{fontSize:"12px",color:"#888",lineHeight:1.7}}>4-week mesocycles: 3 progressive weeks + 1 deload. Workouts cycle A&rarr;B&rarr;C. Deload weeks have 2 gym sessions instead of 3. Tap any day to swap activities. The program rolls forever — no end date.</div>
            </div>
          </>
        )}
        {activeTab === "progress" && <ProgressView schedule={schedule} progress={progress} isComplete={isComplete} toggle={toggle} mobile={mobile} reset={reset} />}
        {activeTab === "workouts" && <><ProgramOverview onOpenWorkout={setOpenWorkout} mobile={mobile} /><AltActivities mobile={mobile} onOpenActivity={setOpenActivity} /></>}
        {activeTab === "philosophy" && <PhilosophySection mobile={mobile} />}
      </div>

      <div style={{padding:mobile?"16px":"32px",maxWidth:"1100px",margin:"0 auto",borderTop:"1px solid #111",marginTop:mobile?"24px":"40px"}}>
        <div style={{fontSize:"10px",color:"#333",lineHeight:1.8,fontFamily:"'JetBrains Mono',monospace"}}>Sources: Cris Mills (CSCS) &middot; Cody Thompson (CPT) &middot; The Inertia &middot; Jaco Rehab &middot; Waterboyz &middot; Again Faster &middot; SurferToday &middot; Renegade Surf Travel &middot; Dr. Tim Brown (ESPN/Slater).</div>
      </div>
    </div>
  );
}
