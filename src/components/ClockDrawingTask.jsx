import React, { useRef, useState } from 'react';
import TaskShell from './TaskShell.jsx';

export default function ClockDrawingTask({ t, onComplete, onBack, onSkip }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const startedAt = useRef(null);
  const points = useRef([]);
  const [strokes, setStrokes] = useState(0);

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const down = (event) => {
    if (!startedAt.current) startedAt.current = Date.now();
    drawing.current = true;
    const { x, y } = point(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    points.current.push({ x, y });
    setStrokes(value => value + 1);
  };
  const move = (event) => {
    if (!drawing.current) return;
    const { x, y } = point(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    points.current.push({ x, y });
  };
  const clear = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, 640, 360);
    startedAt.current = null;
    points.current = [];
    setStrokes(0);
  };
  const finish = () => {
    const xs = points.current.map(value => value.x);
    const ys = points.current.map(value => value.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const ratio = height ? width / height : 0;
    const symmetry = width && height ? Math.min(width, height) / Math.max(width, height) : 0;
    onComplete({
      totalStrokes: strokes,
      drawingDuration: startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0,
      boundingBoxRatio: ratio,
      strokeSmoothness: Math.min(points.current.length / 180, 1),
      symmetryScore: symmetry,
      coverageArea: width * height,
      tremor: 0,
    });
  };

  return (
    <TaskShell t={t} title={t('clock_task_title')} description={t('clock_task_desc')} onBack={onBack} onSkip={onSkip} onComplete={finish} disableComplete={!strokes}>
      <div className="canvas-container">
        <canvas ref={canvasRef} width="640" height="360" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }} />
      </div>
      <div className="canvas-toolbar"><button className="btn btn-secondary" onClick={clear}>{t('clock_clear_canvas')}</button></div>
    </TaskShell>
  );
}
