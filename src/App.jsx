import React, { useState, useCallback, useEffect } from 'react';
import { createTranslator } from './i18n/translations.js';
import {
  calculateSpeechScore,
  calculateClockScore,
  calculateTrailScore,
  calculateDigitSpanScore,
  calculateKeystrokeScore,
  calculateOverallRisk,
  getBaselineFromSessions,
} from './utils/scoringEngine.js';

// Lazy-load components
import AudioTask from './components/AudioTask.jsx';
import ClockDrawingTask from './components/ClockDrawingTask.jsx';
import TrailMakingTask from './components/TrailMakingTask.jsx';
import DigitSpanTask from './components/DigitSpanTask.jsx';
import KeystrokeTask from './components/KeystrokeTask.jsx';
import Dashboard from './components/Dashboard.jsx';
import ReportView from './components/ReportView.jsx';

import {
  Brain,
  Globe,
  User,
  Mic,
  Clock,
  Route,
  Binary,
  Keyboard,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Shield,
  Heart,
  CheckCircle,
  Activity,
  Home,
  Plus,
} from 'lucide-react';

const STEPS = [
  { id: 'language', icon: Globe },
  { id: 'profile', icon: User },
  { id: 'speech', icon: Mic },
  { id: 'clock', icon: Clock },
  { id: 'trails', icon: Route },
  { id: 'memory', icon: Binary },
  { id: 'typing', icon: Keyboard },
  { id: 'results', icon: BarChart3 },
];

function App() {
  // ── State ──
  const [lang, setLang] = useState('en');
  const [currentStep, setCurrentStep] = useState(0);
  const [view, setView] = useState('landing'); // 'landing' | 'screening' | 'dashboard' | 'report'

  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    education: '',
    caregiver: '',
  });

  const [taskResults, setTaskResults] = useState({
    speech: null,
    clock: null,
    trail: null,
    digitSpan: null,
    keystroke: null,
  });

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('neuroscreen_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionResult, setCurrentSessionResult] = useState(null);

  // Translation function
  const t = useCallback(createTranslator(lang), [lang]);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem('neuroscreen_sessions', JSON.stringify(sessions));
    } catch { /* ignore */ }
  }, [sessions]);

  // ── Navigation ──
  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const startScreening = useCallback(() => {
    setView('screening');
    setCurrentStep(0);
    setTaskResults({ speech: null, clock: null, trail: null, digitSpan: null, keystroke: null });
    setCurrentSessionResult(null);
  }, []);

  const goToDashboard = useCallback(() => {
    setView('dashboard');
  }, []);

  const goToLanding = useCallback(() => {
    setView('landing');
  }, []);

  // ── Task Completion Handlers ──
  const handleSpeechComplete = useCallback((metrics) => {
    const scoreResult = calculateSpeechScore(metrics);
    setTaskResults((prev) => ({ ...prev, speech: { metrics, ...scoreResult } }));
    goNext();
  }, [goNext]);

  const handleClockComplete = useCallback((metrics) => {
    const scoreResult = calculateClockScore(metrics);
    setTaskResults((prev) => ({ ...prev, clock: { metrics, ...scoreResult } }));
    goNext();
  }, [goNext]);

  const handleTrailComplete = useCallback((metrics) => {
    const scoreResult = calculateTrailScore(metrics);
    setTaskResults((prev) => ({ ...prev, trail: { metrics, ...scoreResult } }));
    goNext();
  }, [goNext]);

  const handleDigitSpanComplete = useCallback((metrics) => {
    const scoreResult = calculateDigitSpanScore(metrics);
    setTaskResults((prev) => ({ ...prev, digitSpan: { metrics, ...scoreResult } }));
    goNext();
  }, [goNext]);

  const completeSession = useCallback((keystrokeResult = null) => {
    const subScores = {
      speech: taskResults.speech?.score ?? null,
      clock: taskResults.clock?.score ?? null,
      trail: taskResults.trail?.score ?? null,
      digitSpan: taskResults.digitSpan?.score ?? null,
      keystroke: keystrokeResult?.score ?? null,
    };

    const baseline = getBaselineFromSessions(sessions);
    const riskResult = calculateOverallRisk(subScores, baseline);

    const sessionResult = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      scores: { ...subScores, overall: riskResult.score },
      riskLevel: riskResult.riskLevel,
      riskResult,
      profile: { ...profile },
      details: {
        speech: taskResults.speech?.details,
        clock: taskResults.clock?.details,
        trail: taskResults.trail?.details,
        digitSpan: taskResults.digitSpan?.details,
        keystroke: keystrokeResult?.details,
      },
    };

    setCurrentSessionResult(sessionResult);
    setSessions((prev) => [...prev, sessionResult]);
    goNext();
  }, [goNext, taskResults, sessions, profile]);

  const handleKeystrokeComplete = useCallback((metrics) => {
    const scoreResult = calculateKeystrokeScore(metrics);
    setTaskResults((prev) => ({ ...prev, keystroke: { metrics, ...scoreResult } }));
    completeSession(scoreResult);
  }, [completeSession]);

  // ── Stepper Component ──
  const Stepper = () => (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        const stepLabel = t(`step_${step.id}`);

        return (
          <React.Fragment key={step.id}>
            <div className="stepper-step">
              <div className={`stepper-dot ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className={`stepper-label ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                {stepLabel}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Topbar ──
  const Topbar = () => (
    <nav className="topbar">
      <div className="topbar-brand" onClick={goToLanding} style={{ cursor: 'pointer' }}>
        <div className="topbar-logo">
          <Brain size={22} />
        </div>
        <div>
          <div className="topbar-title">{t('app_name')}</div>
          <div className="topbar-subtitle">{t('app_tagline')}</div>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="lang-switcher">
          {['en', 'hi', 'or'].map((l) => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'ଓ'}
            </button>
          ))}
        </div>
        {view !== 'landing' && (
          <button className="btn btn-ghost" onClick={goToLanding}>
            <Home size={18} />
          </button>
        )}
      </div>
    </nav>
  );

  // ── Landing Page ──
  const LandingPage = () => (
    <div className="page-container fade-in">
      <div className="landing-hero" style={{
        textAlign: 'center',
        padding: 'var(--space-3xl) var(--space-md)',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-xl)',
          boxShadow: 'var(--shadow-glow-cyan)',
        }}>
          <Brain size={48} color="#0f172a" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-4xl)',
          fontWeight: 800,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--space-md)',
          lineHeight: 1.2,
        }}>
          {t('app_name')}
        </h1>

        <p style={{
          fontSize: 'var(--text-xl)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2xl)',
          lineHeight: 1.6,
        }}>
          {t('app_tagline')}
        </p>

        <div className="flex justify-center gap-lg" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={startScreening}>
            <Plus size={22} />
            {t('nav_new_screening')}
          </button>
          <button className="btn btn-secondary btn-lg" onClick={goToDashboard}>
            <Activity size={22} />
            {t('nav_dashboard')}
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid-3 mt-xl slide-up" style={{ textAlign: 'left' }}>
          {[
            { icon: Mic, title: t('results_speech_score'), color: 'cyan', desc: 'Voice pattern analysis & linguistic assessment' },
            { icon: Brain, title: t('results_digit_score'), color: 'green', desc: 'Memory span & cognitive task performance' },
            { icon: Shield, title: t('privacy_notice').substring(0, 60) + '...', color: 'purple', desc: 'Browser-stored history with transparent privacy notes' },
          ].map((feature, idx) => (
            <div key={idx} className={`glass-card slide-up stagger-${idx + 1}`}>
              <div className={`stat-card-icon ${feature.color}`} style={{ marginBottom: 'var(--space-md)' }}>
                <feature.icon size={22} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-sm)' }}>
                {feature.title}
              </h3>
              <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy & Disclaimer */}
        <div className="glass-card-alt mt-xl" style={{ textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-sm mb-sm">
            <Shield size={18} className="text-cyan" />
            <span className="font-semibold text-cyan" style={{ fontSize: 'var(--text-sm)' }}>
              {t('privacy_notice')}
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
            {t('report_disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );

  // ── Language Selection Step ──
  const LanguageStep = () => (
    <div className="task-screen fade-in">
      <div className="task-header">
        <Globe size={48} className="text-cyan mb-md" style={{ margin: '0 auto var(--space-md)' }} />
        <h2 className="task-title">{t('select_language')}</h2>
        <p className="task-description">{t('select_language_desc')}</p>
      </div>
      <div className="task-content" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="flex flex-col gap-md">
          {[
            { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
            { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
            { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
          ].map((l) => (
            <button
              key={l.code}
              className={`glass-card ${lang === l.code ? 'glass-card-alt' : ''}`}
              onClick={() => setLang(l.code)}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                border: lang === l.code ? '2px solid var(--color-accent-cyan)' : undefined,
                boxShadow: lang === l.code ? 'var(--shadow-glow-cyan)' : undefined,
              }}
            >
              <div className="flex items-center gap-lg">
                <span style={{ fontSize: '2rem' }}>{l.flag}</span>
                <div>
                  <div className="font-semibold" style={{ fontSize: 'var(--text-lg)' }}>{l.native}</div>
                  <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>{l.label}</div>
                </div>
                {lang === l.code && <CheckCircle size={24} className="text-cyan" style={{ marginLeft: 'auto' }} />}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="task-actions">
        <button className="btn btn-primary btn-lg" onClick={goNext}>
          {t('continue')} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  // ── Profile Step ──
  const ProfileStep = () => (
    <div className="task-screen fade-in">
      <div className="task-header">
        <User size={48} className="text-purple" style={{ margin: '0 auto var(--space-md)' }} />
        <h2 className="task-title">{t('profile_setup')}</h2>
        <p className="task-description">{t('profile_setup_desc')}</p>
      </div>
      <div className="task-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('field_name')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('field_name_placeholder')}
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('field_age')}</label>
              <input
                type="number"
                className="form-input"
                placeholder={t('field_age_placeholder')}
                min="40"
                max="120"
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('field_gender')}</label>
              <select
                className="form-select"
                value={profile.gender}
                onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
              >
                <option value="">--</option>
                <option value="male">{t('gender_male')}</option>
                <option value="female">{t('gender_female')}</option>
                <option value="other">{t('gender_other')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('field_education')}</label>
              <select
                className="form-select"
                value={profile.education}
                onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))}
              >
                <option value="">--</option>
                <option value="none">{t('education_none')}</option>
                <option value="primary">{t('education_primary')}</option>
                <option value="secondary">{t('education_secondary')}</option>
                <option value="graduate">{t('education_graduate')}</option>
                <option value="postgraduate">{t('education_postgraduate')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('field_caregiver')}</label>
            <input
              type="text"
              className="form-input"
              placeholder={t('field_caregiver_placeholder')}
              value={profile.caregiver}
              onChange={(e) => setProfile((p) => ({ ...p, caregiver: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button className="btn btn-secondary" onClick={goBack}>
          <ChevronLeft size={20} /> {t('back')}
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={goNext}
          disabled={!profile.name || !profile.age}
        >
          {t('continue')} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  // ── Results Step ──
  const ResultsStep = () => {
    if (!currentSessionResult) {
      // If somehow we got here without results, compute them
      return (
        <div className="task-screen fade-in">
          <div className="empty-state">
            <div className="empty-state-icon"><Activity size={36} /></div>
            <h3 className="empty-state-title">{t('loading')}</h3>
          </div>
        </div>
      );
    }

    return (
      <ReportView
        t={t}
        lang={lang}
        patientProfile={profile}
        sessionResults={currentSessionResult}
        previousSessions={sessions.slice(0, -1)}
        onClose={goToLanding}
        onNewScreening={startScreening}
      />
    );
  };

  // ── Render Current Step ──
  const renderStep = () => {
    switch (STEPS[currentStep]?.id) {
      case 'language':
        return <LanguageStep />;
      case 'profile':
        return <ProfileStep />;
      case 'speech':
        return (
          <AudioTask
            t={t}
            lang={lang}
            onComplete={handleSpeechComplete}
            onBack={goBack}
            onSkip={goNext}
          />
        );
      case 'clock':
        return (
          <ClockDrawingTask
            t={t}
            onComplete={handleClockComplete}
            onBack={goBack}
            onSkip={goNext}
          />
        );
      case 'trails':
        return (
          <TrailMakingTask
            t={t}
            onComplete={handleTrailComplete}
            onBack={goBack}
            onSkip={goNext}
          />
        );
      case 'memory':
        return (
          <DigitSpanTask
            t={t}
            onComplete={handleDigitSpanComplete}
            onBack={goBack}
            onSkip={goNext}
          />
        );
      case 'typing':
        return (
          <KeystrokeTask
            t={t}
            lang={lang}
            onComplete={handleKeystrokeComplete}
            onBack={goBack}
            onSkip={() => completeSession()}
          />
        );
      case 'results':
        return <ResultsStep />;
      default:
        return null;
    }
  };

  // ── Main Render ──
  return (
    <div className="app">
      <Topbar />

      {view === 'landing' && <LandingPage />}

      {view === 'screening' && (
        <div className="page-container">
          <Stepper />
          {renderStep()}
        </div>
      )}

      {view === 'dashboard' && (
        <Dashboard
          t={t}
          sessions={sessions}
          onNewScreening={startScreening}
          patientProfile={profile}
        />
      )}

      {view === 'report' && currentSessionResult && (
        <ReportView
          t={t}
          lang={lang}
          patientProfile={profile}
          sessionResults={currentSessionResult}
          previousSessions={sessions.slice(0, -1)}
          onClose={goToLanding}
          onNewScreening={startScreening}
        />
      )}
    </div>
  );
}

export default App;
