import { useRef, useEffect } from 'react';
import { dateKey } from '../utils/dateUtils';

export function ProgressChart({ schedule, progress, mobile }) {
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

    // Compute weekly data
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
      return {
        gym, gymTotal, surf, surfTotal, other, otherTotal,
        total: gym + surf + other,
        totalPossible: gymTotal + surfTotal + otherTotal,
        weekNum: week.weekNumber,
      };
    });

    // Clear
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    const maxY = Math.max(10, ...weekData.map(w => w.totalPossible));
    const ySteps = 5;
    ctx.strokeStyle = '#1a1a22';
    ctx.lineWidth = 1;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#444';
    ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round(maxY * i / ySteps);
      const y = pad.top + gh - (gh * i / ySteps);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gw, y); ctx.stroke();
      ctx.fillText(val, pad.left - 8, y + 4);
    }

    // X axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#444';
    const barGroupW = gw / weekData.length;
    weekData.forEach((w, i) => {
      const x = pad.left + i * barGroupW + barGroupW / 2;
      ctx.fillText(`W${w.weekNum}`, x, ch - pad.bottom + 18);
    });

    // Stacked bars
    weekData.forEach((w, i) => {
      const x = pad.left + i * barGroupW + barGroupW * 0.15;
      const bw = barGroupW * 0.35;
      const x2 = x + bw + barGroupW * 0.05;

      // Possible (faded background bars)
      const possH = (w.totalPossible / maxY) * gh;
      ctx.fillStyle = '#151520';
      ctx.beginPath();
      ctx.roundRect(x, pad.top + gh - possH, bw * 2 + barGroupW * 0.05, possH, 3);
      ctx.fill();

      // Gym bar
      const gymH = (w.gym / maxY) * gh;
      if (gymH > 0) {
        ctx.fillStyle = '#00d4aa';
        ctx.beginPath();
        ctx.roundRect(x, pad.top + gh - gymH, bw, gymH, [3, 3, 0, 0]);
        ctx.fill();
      }

      // Surf + other bar
      const surfH = (w.surf / maxY) * gh;
      const otherH = (w.other / maxY) * gh;
      if (surfH > 0) {
        ctx.fillStyle = '#48dbfb';
        ctx.beginPath();
        ctx.roundRect(x2, pad.top + gh - surfH - otherH, bw, surfH, otherH > 0 ? 0 : [3, 3, 0, 0]);
        ctx.fill();
      }
      if (otherH > 0) {
        ctx.fillStyle = '#c39bd3';
        ctx.beginPath();
        ctx.roundRect(x2, pad.top + gh - otherH, bw, otherH, [3, 3, 0, 0]);
        ctx.fill();
      }
    });

    // Title
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVITIES COMPLETED BY WEEK', pad.left, 20);

    // Legend
    const legendX = cw - pad.right;
    ctx.textAlign = 'right';
    ctx.font = "9px 'JetBrains Mono', monospace";
    [
      { c: '#00d4aa', l: 'Gym' },
      { c: '#48dbfb', l: 'Surf' },
      { c: '#c39bd3', l: 'Other' },
    ].forEach((item, i) => {
      const lx = legendX - i * 65;
      ctx.fillStyle = item.c;
      ctx.fillRect(lx - 50, 14, 8, 8);
      ctx.fillStyle = '#666';
      ctx.fillText(item.l, lx, 22);
    });

  }, [schedule, progress, mobile]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: mobile ? '260px' : '320px', display: 'block' }}
      />
    </div>
  );
}
