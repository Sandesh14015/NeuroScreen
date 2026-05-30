import React, { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import TaskShell from './TaskShell.jsx';
import { createSpeechAnalyzer } from '../utils/speechAnalyzer.js';

export default function AudioTask({ t, lang, onComplete, onBack, onSkip }) {
  const analyzer = useRef(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    analyzer.current = createSpeechAnalyzer();
    const started = await analyzer.current.start(lang);
    if (!started) return setError(t('error_mic_permission'));
    setError('');
    setRecording(true);
  };

  const stop = () => {
    analyzer.current.stop();
    setRecording(false);
    onComplete(analyzer.current.getMetrics());
  };

  return (
    <TaskShell t={t} title={t('speech_task_title')} description={t('speech_fluency_desc')} onBack={onBack} onSkip={onSkip}>
      <div className="glass-card-static text-center">
        <Mic size={52} className="text-cyan" style={{ margin: '0 auto var(--space-md)' }} />
        <p className="text-secondary mb-lg">{t('speech_cookie_theft_desc')}</p>
        {error && <p className="text-red mb-md">{error}</p>}
        {!recording ? (
          <button className="btn btn-primary btn-lg" onClick={start}><Mic size={20} /> {t('speech_start_recording')}</button>
        ) : (
          <button className="btn btn-danger btn-lg" onClick={stop}><Square size={18} /> {t('speech_stop_recording')}</button>
        )}
      </div>
    </TaskShell>
  );
}
