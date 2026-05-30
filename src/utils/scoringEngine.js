/**
 * NeuroScreen — Scoring Engine
 * Multi-modal cognitive risk assessment algorithms
 * Handles baseline calibration, sub-score computation, and overall risk classification
 */

// ── Speech Score ──
export function calculateSpeechScore(metrics) {
  const {
    totalWords = 0,
    uniqueWords = 0,
    pauseRatio = 0.5,
    speechRate = 0,
    totalDuration = 60,
    hesitations = 0,
  } = metrics;

  // Vocabulary richness (type-token ratio)
  const ttr = totalWords > 0 ? uniqueWords / totalWords : 0;
  const ttrScore = Math.min(ttr / 0.7, 1.0) * 30;

  // Word production rate (expected ~15-25 words per minute for fluency)
  const wordsPerMin = (totalWords / totalDuration) * 60;
  const productionScore = Math.min(wordsPerMin / 20, 1.0) * 25;

  // Pause ratio (lower is better, healthy ~0.2-0.35)
  const pauseScore = Math.max(0, (1 - pauseRatio / 0.6)) * 25;

  // Hesitation penalty
  const hesitationPenalty = Math.min(hesitations * 3, 20);

  const rawScore = Math.round(ttrScore + productionScore + pauseScore - hesitationPenalty);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    details: {
      vocabularyRichness: Math.round(ttr * 100),
      wordsPerMinute: Math.round(wordsPerMin * 10) / 10,
      pauseRatio: Math.round(pauseRatio * 100),
      totalWords,
      uniqueWords,
      hesitations,
    },
  };
}

// ── Clock Drawing Score ──
export function calculateClockScore(metrics) {
  const {
    totalStrokes = 0,
    drawingDuration = 0,
    boundingBoxRatio = 1,
    strokeSmoothness = 1,
    coverageArea = 0,
    symmetryScore = 0.5,
    tremor = 0,
  } = metrics;

  // Sufficient content (expected 15-30 strokes for a complete clock)
  const contentScore = Math.min(totalStrokes / 15, 1.0) * 20;

  // Drawing speed (not too fast, not too slow; ideal 30-90 seconds)
  let speedScore = 0;
  if (drawingDuration >= 20 && drawingDuration <= 120) {
    speedScore = 20;
  } else if (drawingDuration > 120) {
    speedScore = Math.max(0, 20 - (drawingDuration - 120) / 10);
  } else {
    speedScore = Math.max(0, drawingDuration);
  }

  // Shape quality (bounding box should be roughly square)
  const shapeScore = (1 - Math.abs(boundingBoxRatio - 1)) * 20;

  // Smoothness (1 = smooth, 0 = jittery)
  const smoothScore = strokeSmoothness * 20;

  // Symmetry
  const symScore = symmetryScore * 20;

  // Tremor penalty
  const tremorPenalty = Math.min(tremor * 10, 15);

  const rawScore = Math.round(contentScore + speedScore + shapeScore + smoothScore + symScore - tremorPenalty);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    details: {
      totalStrokes,
      drawingDuration: Math.round(drawingDuration),
      shapeQuality: Math.round(shapeScore * 5),
      smoothness: Math.round(strokeSmoothness * 100),
      symmetry: Math.round(symmetryScore * 100),
      tremorDetected: tremor > 0.3,
    },
  };
}

// ── Trail Making Score ──
export function calculateTrailScore(metrics) {
  const {
    completionTimeA = 0,
    completionTimeB = 0,
    errorsA = 0,
    errorsB = 0,
    nodesCompletedA = 0,
    nodesCompletedB = 0,
    totalNodesA = 25,
    totalNodesB = 25,
    avgLatencyA = 0,
    avgLatencyB = 0,
  } = metrics;

  // Part A scoring (expected completion: 29-78 seconds for age 55-89)
  const completionRateA = nodesCompletedA / totalNodesA;
  const timeScoreA = completionTimeA > 0 ? Math.max(0, 1 - completionTimeA / 120) * 25 : 0;
  const errorPenaltyA = errorsA * 5;
  const partAScore = (timeScoreA * completionRateA) - errorPenaltyA;

  // Part B scoring (expected: 75-273 seconds)
  const completionRateB = nodesCompletedB / totalNodesB;
  const timeScoreB = completionTimeB > 0 ? Math.max(0, 1 - completionTimeB / 240) * 25 : 0;
  const errorPenaltyB = errorsB * 5;
  const partBScore = (timeScoreB * completionRateB) - errorPenaltyB;

  // Latency consistency (lower variation is better)
  const avgLatency = (avgLatencyA + avgLatencyB) / 2;
  const latencyScore = Math.max(0, 25 - avgLatency / 100);

  const rawScore = Math.round(partAScore + partBScore + latencyScore + completionRateA * 12.5 + completionRateB * 12.5);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    details: {
      partA: {
        time: Math.round(completionTimeA),
        errors: errorsA,
        completed: nodesCompletedA,
        total: totalNodesA,
      },
      partB: {
        time: Math.round(completionTimeB),
        errors: errorsB,
        completed: nodesCompletedB,
        total: totalNodesB,
      },
      avgLatency: Math.round(avgLatency),
    },
  };
}

// ── Digit Span Score ──
export function calculateDigitSpanScore(metrics) {
  const {
    maxSpanForward = 0,
    maxSpanBackward = 0,
    totalCorrectForward = 0,
    totalCorrectBackward = 0,
    totalTrials = 0,
    avgResponseTime = 0,
  } = metrics;

  // Forward span (normal: 5-9 digits)
  const forwardScore = Math.min(maxSpanForward / 7, 1.0) * 30;

  // Backward span (normal: 4-7 digits)
  const backwardScore = Math.min(maxSpanBackward / 6, 1.0) * 30;

  // Accuracy
  const accuracy = totalTrials > 0 ? (totalCorrectForward + totalCorrectBackward) / totalTrials : 0;
  const accuracyScore = accuracy * 25;

  // Response time consistency
  const rtScore = avgResponseTime > 0 ? Math.max(0, 15 - avgResponseTime / 400) : 0;

  const rawScore = Math.round(forwardScore + backwardScore + accuracyScore + rtScore);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    details: {
      maxSpanForward,
      maxSpanBackward,
      totalCorrectForward,
      totalCorrectBackward,
      accuracy: Math.round(accuracy * 100),
      avgResponseTime: Math.round(avgResponseTime),
    },
  };
}

// ── Keystroke Dynamics Score ──
export function calculateKeystrokeScore(metrics) {
  const {
    avgDwellTime = 0,
    avgFlightTime = 0,
    dwellTimeVariance = 0,
    flightTimeVariance = 0,
    wpm = 0,
    accuracy = 0,
    totalKeystrokes = 0,
    errorRate = 0,
  } = metrics;

  // Typing speed (healthy elderly: 15-35 WPM)
  const speedScore = wpm > 0 ? Math.min(wpm / 25, 1.0) * 20 : 0;

  // Accuracy
  const accScore = accuracy * 25;

  // Dwell time consistency (lower variance is better)
  const dwellConsistency = Math.max(0, 1 - dwellTimeVariance / 5000) * 20;

  // Flight time consistency
  const flightConsistency = Math.max(0, 1 - flightTimeVariance / 10000) * 20;

  // Error rate penalty
  const errorPenalty = errorRate * 15;

  // Volume sufficiency
  const volumeScore = Math.min(totalKeystrokes / 50, 1.0) * 15;

  const rawScore = Math.round(speedScore + accScore + dwellConsistency + flightConsistency + volumeScore - errorPenalty);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    details: {
      avgDwellTime: Math.round(avgDwellTime),
      avgFlightTime: Math.round(avgFlightTime),
      dwellVariance: Math.round(dwellTimeVariance),
      flightVariance: Math.round(flightTimeVariance),
      wpm: Math.round(wpm * 10) / 10,
      accuracy: Math.round(accuracy * 100),
      totalKeystrokes,
    },
  };
}

// ── Baseline Computation ──
export function getBaselineFromSessions(sessions) {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  // Use last 3-5 sessions for baseline
  const recentSessions = sessions.filter(s => Number.isFinite(s.scores?.overall)).slice(-5);
  if (recentSessions.length === 0) return null;

  const baseline = {
    speech: avg(recentSessions.map(s => s.scores?.speech || 0)),
    clock: avg(recentSessions.map(s => s.scores?.clock || 0)),
    trail: avg(recentSessions.map(s => s.scores?.trail || 0)),
    digitSpan: avg(recentSessions.map(s => s.scores?.digitSpan || 0)),
    keystroke: avg(recentSessions.map(s => s.scores?.keystroke || 0)),
    overall: avg(recentSessions.map(s => s.scores?.overall || 0)),
    sessionCount: recentSessions.length,
  };

  return baseline;
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

// ── Overall Risk Classification ──
export function calculateOverallRisk(subScores, baseline) {
  // Weights for each sub-system
  const weights = {
    speech: 0.25,
    clock: 0.20,
    trail: 0.20,
    digitSpan: 0.20,
    keystroke: 0.15,
  };

  // Only complete screenings receive a risk classification. Partial composites
  // are retained for internal review without inventing neutral task scores.
  const completedTasks = Object.keys(weights).filter(key => Number.isFinite(subScores[key]));
  const missingTasks = Object.keys(weights).filter(key => !Number.isFinite(subScores[key]));
  const completedWeight = completedTasks.reduce((sum, key) => sum + weights[key], 0);
  const composite = completedWeight > 0
    ? completedTasks.reduce((sum, key) => sum + subScores[key] * weights[key], 0) / completedWeight
    : null;
  const isComplete = missingTasks.length === 0;
  const normalizedScore = isComplete ? Math.round(composite) : null;

  // Calculate baseline deviations
  let deviations = {};
  let baselineDeviation = 0;
  if (baseline && isComplete) {
    deviations = {
      speech: Math.round(subScores.speech - baseline.speech),
      clock: Math.round(subScores.clock - baseline.clock),
      trail: Math.round(subScores.trail - baseline.trail),
      digitSpan: Math.round(subScores.digitSpan - baseline.digitSpan),
      keystroke: Math.round(subScores.keystroke - baseline.keystroke),
    };
    baselineDeviation = Math.round(normalizedScore - baseline.overall);
  }

  // Risk classification
  let riskLevel = 'insufficient';
  if (isComplete && normalizedScore >= 70) {
    riskLevel = 'low';
  } else if (isComplete && normalizedScore >= 45) {
    riskLevel = 'moderate';
  } else if (isComplete) {
    riskLevel = 'high';
  }

  // If significant decline from baseline, escalate risk
  if (baseline && baselineDeviation < -15 && riskLevel === 'low') {
    riskLevel = 'moderate';
  }
  if (baseline && baselineDeviation < -25 && riskLevel === 'moderate') {
    riskLevel = 'high';
  }

  return {
    riskLevel,
    score: normalizedScore,
    isComplete,
    completedTasks,
    missingTasks,
    deviations,
    baselineDeviation,
    rawComposite: composite === null ? null : Math.round(composite),
    subScores: { ...subScores },
    weights,
  };
}

// ── Generate simulated historical sessions for demo ──
export function generateDemoSessions(count = 8) {
  const sessions = [];
  const baseDate = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 14); // Every 2 weeks

    // Simulate slight decline over time for demo
    const declineOffset = i < 3 ? 0 : (i - 2) * 3;
    const noise = () => (Math.random() - 0.5) * 10;

    const speech = Math.round(Math.max(20, Math.min(100, 75 - declineOffset + noise())));
    const clock = Math.round(Math.max(20, Math.min(100, 80 - declineOffset + noise())));
    const trail = Math.round(Math.max(20, Math.min(100, 70 - declineOffset + noise())));
    const digitSpan = Math.round(Math.max(20, Math.min(100, 72 - declineOffset + noise())));
    const keystroke = Math.round(Math.max(20, Math.min(100, 78 - declineOffset + noise())));
    const overall = Math.round((speech * 0.25 + clock * 0.2 + trail * 0.2 + digitSpan * 0.2 + keystroke * 0.15));

    sessions.push({
      id: `session-${i}`,
      date: date.toISOString(),
      scores: { speech, clock, trail, digitSpan, keystroke, overall },
      riskLevel: overall >= 70 ? 'low' : overall >= 45 ? 'moderate' : 'high',
    });
  }

  return sessions;
}
