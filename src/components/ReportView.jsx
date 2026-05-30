import React from 'react';
import { Download, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const LABELS = { speech: 'Speech', clock: 'Clock drawing', trail: 'Trail making', digitSpan: 'Digit span', keystroke: 'Typing dynamics' };

export default function ReportView({ t, patientProfile, sessionResults, onClose, onNewScreening }) {
  const { riskResult, scores } = sessionResults;
  const incomplete = !riskResult.isComplete;
  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text('NeuroScreen Research Prototype Report', 14, 18);
    doc.text(`Patient: ${patientProfile.name || '--'}`, 14, 30);
    doc.text(`Result: ${incomplete ? 'Insufficient data' : sessionResults.riskLevel}`, 14, 40);
    autoTable(doc, { startY: 50, head: [['Assessment', 'Score']], body: Object.entries(LABELS).map(([key, label]) => [label, scores[key] ?? 'Not completed']) });
    doc.text('Research prototype only. This report is not a clinical diagnosis.', 14, doc.lastAutoTable.finalY + 16);
    doc.save(`neuroscreen-${Date.now()}.pdf`);
  };
  return (
    <div className="page-container fade-in">
      <div className="section-header flex justify-between items-center">
        <div><h1 className="section-title">{t('report_title')}</h1><p className="section-subtitle">Research prototype screening summary</p></div>
        <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="glass-card-alt text-center">
        <div className={`score-circle ${incomplete ? 'moderate' : sessionResults.riskLevel}`} style={{ margin: '0 auto var(--space-md)' }}>
          <div className="score-value">{scores.overall ?? '--'}</div><div className="score-label">{incomplete ? 'Incomplete' : t(`results_risk_${sessionResults.riskLevel}`)}</div>
        </div>
        <h2>{incomplete ? 'Insufficient data for a risk classification' : t('results_overall_risk')}</h2>
        {incomplete && <p className="text-secondary mt-sm">Missing assessments: {riskResult.missingTasks.map(key => LABELS[key]).join(', ')}.</p>}
      </div>
      <div className="glass-card-static mt-xl">
        <h2 className="mb-md">{t('report_detailed_results')}</h2>
        <table className="data-table"><thead><tr><th>Assessment</th><th>{t('results_score')}</th></tr></thead><tbody>
          {Object.entries(LABELS).map(([key, label]) => <tr key={key}><td>{label}</td><td>{scores[key] ?? 'Not completed'}</td></tr>)}
        </tbody></table>
      </div>
      <div className="glass-card-alt mt-xl"><p className="text-secondary">{t('report_disclaimer')}</p></div>
      <div className="task-actions">
        <button className="btn btn-secondary" onClick={exportPdf}><Download size={18} /> {t('export_pdf')}</button>
        <button className="btn btn-primary" onClick={onNewScreening}><Plus size={18} /> {t('nav_new_screening')}</button>
      </div>
    </div>
  );
}
