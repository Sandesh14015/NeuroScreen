import React from 'react';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

export default function TaskShell({ t, title, description, children, onBack, onSkip, onComplete, completeLabel, disableComplete = false }) {
  return (
    <div className="task-screen fade-in">
      <div className="task-header">
        <h2 className="task-title">{title}</h2>
        <p className="task-description">{description}</p>
      </div>
      <div className="task-content">{children}</div>
      <div className="task-actions">
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={18} /> {t('back')}</button>
        <button className="btn btn-ghost" onClick={onSkip}><SkipForward size={18} /> {t('skip')}</button>
        {onComplete && (
          <button className="btn btn-primary" onClick={onComplete} disabled={disableComplete}>
            {completeLabel || t('continue')} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
