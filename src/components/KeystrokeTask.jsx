import React, { useRef, useState } from 'react';
import TaskShell from './TaskShell.jsx';

export default function KeystrokeTask({ t, onComplete, onBack, onSkip }) {
  const target = t('keystroke_sentence_1');
  const startedAt = useRef(null);
  const keyDownAt = useRef(new Map());
  const dwells = useRef([]);
  const flights = useRef([]);
  const lastKeyUpAt = useRef(null);
  const [text, setText] = useState('');
  const finish = () => {
    const elapsedMinutes = Math.max((Date.now() - startedAt.current) / 60000, 0.01);
    const matches = [...text].filter((char, index) => char === target[index]).length;
    const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const variance = values => {
      const mean = average(values);
      return values.length ? average(values.map(value => (value - mean) ** 2)) : 0;
    };
    onComplete({ avgDwellTime: average(dwells.current), avgFlightTime: average(flights.current), dwellTimeVariance: variance(dwells.current), flightTimeVariance: variance(flights.current), wpm: text.trim().split(/\s+/).length / elapsedMinutes, accuracy: matches / target.length, totalKeystrokes: text.length, errorRate: 1 - matches / target.length });
  };
  const keyDown = event => {
    if (!event.repeat) {
      keyDownAt.current.set(event.code, Date.now());
      if (lastKeyUpAt.current) flights.current.push(Date.now() - lastKeyUpAt.current);
    }
  };
  const keyUp = event => {
    const downAt = keyDownAt.current.get(event.code);
    if (downAt) dwells.current.push(Date.now() - downAt);
    keyDownAt.current.delete(event.code);
    lastKeyUpAt.current = Date.now();
  };
  return (
    <TaskShell t={t} title={t('keystroke_task_title')} description={t('keystroke_task_desc')} onBack={onBack} onSkip={onSkip} onComplete={finish} disableComplete={!text}>
      <div className="glass-card-static">
        <p className="font-semibold mb-md">{target}</p>
        <textarea className="form-input w-full" rows="5" value={text} placeholder={t('keystroke_type_here')} onKeyDown={keyDown} onKeyUp={keyUp} onChange={event => { if (!startedAt.current) startedAt.current = Date.now(); setText(event.target.value); }} />
      </div>
    </TaskShell>
  );
}
