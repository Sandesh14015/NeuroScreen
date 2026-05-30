import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOverallRisk, getBaselineFromSessions } from '../src/utils/scoringEngine.js';

const completeScores = { speech: 80, clock: 70, trail: 60, digitSpan: 90, keystroke: 75 };

test('classifies a complete screening from all five assessments', () => {
  const result = calculateOverallRisk(completeScores, null);
  assert.equal(result.isComplete, true);
  assert.equal(result.score, 75);
  assert.equal(result.riskLevel, 'low');
});

test('does not invent scores or classify a screening with skipped tasks', () => {
  const result = calculateOverallRisk({ ...completeScores, speech: null, trail: null }, null);
  assert.equal(result.isComplete, false);
  assert.equal(result.score, null);
  assert.equal(result.riskLevel, 'insufficient');
  assert.deepEqual(result.missingTasks, ['speech', 'trail']);
});

test('escalates risk when a complete result drops substantially below baseline', () => {
  const baseline = getBaselineFromSessions([{ scores: { ...completeScores, overall: 90 } }]);
  const result = calculateOverallRisk({ speech: 68, clock: 68, trail: 68, digitSpan: 68, keystroke: 68 }, baseline);
  assert.equal(result.riskLevel, 'moderate');
  assert.equal(result.baselineDeviation, -22);
});

test('ignores incomplete sessions when computing a historical baseline', () => {
  const baseline = getBaselineFromSessions([
    { scores: { ...completeScores, overall: 75 } },
    { scores: { speech: 10, overall: null } },
  ]);
  assert.equal(baseline.overall, 75);
  assert.equal(baseline.sessionCount, 1);
});
