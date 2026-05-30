import React, { useMemo, useRef, useState } from 'react';
import TaskShell from './TaskShell.jsx';

const PARTS = {
  A: ['1', '2', '3', '4', '5', '6', '7', '8'],
  B: ['1', 'A', '2', 'B', '3', 'C', '4', 'D'],
};

export default function TrailMakingTask({ t, onComplete, onBack, onSkip }) {
  const [part, setPart] = useState('A');
  const nodes = useMemo(() => PARTS[part].map((label, index) => ({ label, left: 8 + (index % 4) * 28, top: 12 + Math.floor(index / 4) * 55 })), [part]);
  const startedAt = useRef(Date.now());
  const partA = useRef(null);
  const [next, setNext] = useState(0);
  const [errors, setErrors] = useState(0);
  const advance = () => {
    const elapsed = (Date.now() - startedAt.current) / 1000;
    if (part === 'A') {
      partA.current = { time: elapsed, errors, latency: elapsed * 1000 / next };
      setPart('B');
      setNext(0);
      setErrors(0);
      startedAt.current = Date.now();
      return;
    }
    onComplete({
      completionTimeA: partA.current.time, completionTimeB: elapsed,
      errorsA: partA.current.errors, errorsB: errors,
      nodesCompletedA: 8, nodesCompletedB: next,
      totalNodesA: 8, totalNodesB: 8,
      avgLatencyA: partA.current.latency, avgLatencyB: elapsed * 1000 / next,
    });
  };
  return (
    <TaskShell t={t} title={`${t('trail_task_title')} - Part ${part}`} description={t('trail_instruction')} onBack={onBack} onSkip={onSkip} onComplete={advance} completeLabel={part === 'A' ? t('trail_start_part_b') : t('continue')} disableComplete={next < nodes.length}>
      <div className="glass-card-static relative" style={{ height: 300 }}>
        {nodes.map((node, index) => (
          <button key={node.label} className={`trail-node ${index < next ? 'visited' : ''}`} style={{ position: 'absolute', left: `${node.left}%`, top: `${node.top}%` }}
            onClick={() => index === next ? setNext(next + 1) : setErrors(errors + 1)}>{node.label}</button>
        ))}
      </div>
      <p className="text-secondary mt-md">{t('trail_nodes_completed')}: {next}/{nodes.length} | {t('trail_errors')}: {errors}</p>
    </TaskShell>
  );
}
