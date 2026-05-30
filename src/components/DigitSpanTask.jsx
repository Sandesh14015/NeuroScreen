import React, { useEffect, useRef, useState } from 'react';
import TaskShell from './TaskShell.jsx';

const SEQUENCE = [4, 1, 7, 3, 8];

export default function DigitSpanTask({ t, onComplete, onBack, onSkip }) {
  const startedAt = useRef(Date.now());
  const [mode, setMode] = useState('forward');
  const [watching, setWatching] = useState(true);
  const [answer, setAnswer] = useState([]);
  const forwardCorrect = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => setWatching(false), 2500);
    return () => clearTimeout(timer);
  }, []);
  const finish = () => {
    const expected = mode === 'forward' ? SEQUENCE : [...SEQUENCE].reverse();
    const correct = answer.join('') === expected.join('');
    if (mode === 'forward') {
      forwardCorrect.current = correct;
      setMode('backward');
      setWatching(true);
      setAnswer([]);
      startedAt.current = Date.now();
      setTimeout(() => setWatching(false), 2500);
      return;
    }
    onComplete({ maxSpanForward: forwardCorrect.current ? 5 : 0, maxSpanBackward: correct ? 5 : 0, totalCorrectForward: forwardCorrect.current ? 1 : 0, totalCorrectBackward: correct ? 1 : 0, totalTrials: 2, avgResponseTime: Date.now() - startedAt.current });
  };
  return (
    <TaskShell t={t} title={t('digit_task_title')} description={t('digit_task_desc')} onBack={onBack} onSkip={onSkip} onComplete={finish} disableComplete={answer.length !== SEQUENCE.length}>
      <div className="glass-card-static text-center">
        <h3 className="mb-lg">{watching ? `${t('digit_watch')} (${mode})` : mode === 'forward' ? t('digit_your_turn') : t('digit_your_turn_backward')}</h3>
        {watching ? <div className="stat-value">{SEQUENCE.join('  ')}</div> : (
          <div className="digit-grid">{[1,2,3,4,5,6,7,8,9].map(n => <button key={n} className="digit-tile" onClick={() => answer.length < SEQUENCE.length && setAnswer([...answer, n])}>{n}</button>)}</div>
        )}
        {!watching && <p className="text-secondary mt-md">{answer.join(' ') || '...'}</p>}
      </div>
    </TaskShell>
  );
}
