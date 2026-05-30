import React from 'react';
import { Activity, AlertTriangle, Plus, Users } from 'lucide-react';

export default function Dashboard({ t, sessions, onNewScreening }) {
  const complete = sessions.filter(session => Number.isFinite(session.scores?.overall));
  const average = complete.length ? Math.round(complete.reduce((sum, session) => sum + session.scores.overall, 0) / complete.length) : null;
  return (
    <div className="page-container-wide fade-in">
      <div className="section-header flex justify-between items-center">
        <div><h1 className="section-title">{t('dashboard_title')}</h1><p className="section-subtitle">{t('dashboard_subtitle')}</p></div>
        <button className="btn btn-primary" onClick={onNewScreening}><Plus size={18} /> {t('dashboard_new_screening')}</button>
      </div>
      <div className="stats-grid">
        <Stat icon={Activity} label={t('dashboard_total_screenings')} value={sessions.length} />
        <Stat icon={Users} label={t('dashboard_patients')} value={new Set(sessions.map(session => session.profile?.name).filter(Boolean)).size} />
        <Stat icon={AlertTriangle} label={t('dashboard_high_risk_patients')} value={sessions.filter(session => session.riskLevel === 'high').length} />
        <Stat icon={Activity} label={t('dashboard_avg_risk')} value={average ?? '--'} />
      </div>
      <div className="glass-card-static mt-xl">
        <h2 className="mb-md">{t('dashboard_recent_sessions')}</h2>
        {!sessions.length ? <p className="text-secondary">{t('dashboard_no_data_desc')}</p> : (
          <table className="data-table"><thead><tr><th>{t('results_date')}</th><th>{t('field_name')}</th><th>{t('results_score')}</th><th>{t('results_overall_risk')}</th></tr></thead>
            <tbody>{[...sessions].reverse().map(session => <tr key={session.id}><td>{new Date(session.date).toLocaleDateString()}</td><td>{session.profile?.name || '--'}</td><td>{session.scores?.overall ?? '--'}</td><td>{session.riskLevel}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <div className="stat-card"><div className="stat-card-icon cyan"><Icon size={20} /></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>;
}
