import { useRef, useEffect, useCallback, useState } from 'react';
import {
  STEM_COLORS, CANVAS_SIZE, CANVAS_CENTER, CANVAS_RADIUS, NODE_RADIUS,
} from '../constants';
import useAudioStore from '../store/audioStore';

const C           = CANVAS_CENTER;
const AUTO_RADIUS = CANVAS_RADIUS * 0.25;
const ROT_SPEED   = 0.007;

export default function SpatialCanvas({ onPositionChange }) {
  const canvasRef    = useRef(null);
  const draggingRef  = useRef(null);
  const rotAngleRef  = useRef(0);
  const animFrameRef = useRef(null);

  const [autoRotate, setAutoRotate] = useState(false);

  const { stems, nodePositions, stemMutes } = useAudioStore();

  const stemsRef            = useRef(stems);
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { stemsRef.current = stems; },                       [stems]);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    [0.25, 0.5, 0.75, 1.0].forEach((f, idx) => {
      ctx.beginPath();
      ctx.arc(C, C, CANVAS_RADIUS * f, 0, Math.PI * 2);
      ctx.strokeStyle = (autoRotate && idx === 0)
        ? 'rgba(255,255,255,0.25)'
        : `rgba(255,255,255,${0.04 + f * 0.04})`;
      ctx.lineWidth = (autoRotate && idx === 0) ? 1.5 : 1;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(C, C - CANVAS_RADIUS * 1.15); ctx.lineTo(C, C + CANVAS_RADIUS * 1.15);
    ctx.moveTo(C - CANVAS_RADIUS * 1.15, C); ctx.lineTo(C + CANVAS_RADIUS * 1.15, C);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', C, C - CANVAS_RADIUS - 12);
    ctx.fillText('BACK',  C, C + CANVAS_RADIUS + 22);
    ctx.textAlign = 'right';
    ctx.fillText('L', C - CANVAS_RADIUS - 12, C + 4);
    ctx.textAlign = 'left';
    ctx.fillText('R', C + CANVAS_RADIUS + 12, C + 4);

    ctx.beginPath();
    ctx.arc(C, C, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(C, C, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    stems.forEach((stem) => {
      const pos   = nodePositions[stem.id] ?? { x: 0, y: 0 };
      const nx    = C + pos.x;
      const ny    = C + pos.y;
      const color = STEM_COLORS[stem.stem_type] ?? '#888';
      const muted = stemMutes[stem.id];

      ctx.beginPath();
      ctx.moveTo(C, C);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = muted ? `${color}22` : `${color}44`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!muted) {
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, NODE_RADIUS * 2.5);
        grad.addColorStop(0, `${color}50`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(nx, ny, NODE_RADIUS * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(nx, ny, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = muted ? '#333' : color;
      ctx.fill();
      ctx.strokeStyle = muted ? '#555' : `${color}cc`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = muted ? '#666' : '#000';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(stem.stem_type.slice(0, 3).toUpperCase(), nx, ny + 3);
    });
  }, [stems, nodePositions, stemMutes, autoRotate]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!autoRotate) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
      return;
    }
    const step = () => {
      rotAngleRef.current += ROT_SPEED;
      const currentStems = stemsRef.current;
      currentStems.forEach((stem, i) => {
        const baseAngle = (i / currentStems.length) * Math.PI * 2 - Math.PI / 2;
        const angle = baseAngle + rotAngleRef.current;
        onPositionChangeRef.current?.(stem.id, Math.cos(angle) * AUTO_RADIUS, Math.sin(angle) * AUTO_RADIUS);
      });
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [autoRotate]);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const toCanvas = (e) => {
    const rect   = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return { x: (e.clientX - rect.left) * scaleX - C, y: (e.clientY - rect.top) * scaleY - C };
  };

  const hitTest = ({ x, y }) =>
    stems.find((stem) => {
      const pos = nodePositions[stem.id] ?? { x: 0, y: 0 };
      const dx = pos.x - x, dy = pos.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS + 4;
    });

  const onPointerDown = (e) => {
    if (autoRotate) return;
    const pos  = toCanvas(e);
    const node = hitTest(pos);
    if (node) { draggingRef.current = node.id; canvasRef.current.setPointerCapture(e.pointerId); }
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    let { x, y } = toCanvas(e);
    const dist = Math.sqrt(x * x + y * y);
    if (dist > CANVAS_RADIUS) { const s = CANVAS_RADIUS / dist; x *= s; y *= s; }
    onPositionChange?.(draggingRef.current, x, y);
  };

  const onPointerUp = () => { draggingRef.current = null; };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${CANVAS_SIZE}px` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ width: '100%', cursor: autoRotate ? 'default' : 'crosshair', borderRadius: '12px', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <button
        onClick={() => setAutoRotate((v) => !v)}
        title={autoRotate ? 'Stop auto-rotate' : 'Auto-rotate nodes on inner orbit'}
        style={{
          position: 'absolute', bottom: 12, right: 12,
          padding: '5px 12px',
          background:   autoRotate ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
          border:       `1px solid ${autoRotate ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 6,
          color:        autoRotate ? '#fff' : 'rgba(255,255,255,0.5)',
          fontSize: 10, fontFamily: 'inherit', letterSpacing: '0.1em',
          cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
        }}
      >
        {autoRotate ? '⏹ STOP' : '↻ AUTO-ROTATE'}
      </button>
    </div>
  );
}
