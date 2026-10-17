import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCTR, calculateCPC, calculateCVR, calculateCPA, calculateROAS, computeMetrics } from '../utils/kpiMath.js';
import { sanitizeField, sanitizeExportString } from '../utils/sanitizer.js';

test('KPI Math - CTR returns null when impressions <= 0 (avoid 0% or Infinity)', () => {
  assert.equal(calculateCTR(10, 0), null);
  assert.equal(calculateCTR(10, -5), null);
  assert.equal(calculateCTR(10, null), null);
  assert.equal(calculateCTR(50, 1000), 5.0);
});

test('KPI Math - CPC returns null when clicks <= 0', () => {
  assert.equal(calculateCPC(100, 0), null);
  assert.equal(calculateCPC(100, -1), null);
  assert.equal(calculateCPC(100, 50), 2.0);
});

test('KPI Math - CVR handles null conversions vs 0 conversions', () => {
  assert.equal(calculateCVR(null, 100), null);
  assert.equal(calculateCVR(0, 100), 0.0);
  assert.equal(calculateCVR(10, 0), null);
  assert.equal(calculateCVR(5, 100), 5.0);
});

test('KPI Math - CPA returns null when conversions <= 0', () => {
  assert.equal(calculateCPA(500, 0), null);
  assert.equal(calculateCPA(500, null), null);
  assert.equal(calculateCPA(500, 10), 50.0);
});

test('KPI Math - ROAS never substitutes 0 for missing revenue', () => {
  // If revenue untracked
  assert.equal(calculateROAS(null, 500, false), null);
  assert.equal(calculateROAS(undefined, 500, false), null);
  assert.equal(calculateROAS(0, 500, false), null);
  
  // If revenue tracked and 0 earned
  assert.equal(calculateROAS(0, 500, true), 0.0);
  
  // Normal positive ROAS
  assert.equal(calculateROAS(1500, 500, true), 3.0);
});

test('Sanitizer - Formula injection characters are neutralized', () => {
  assert.equal(sanitizeField("=CMD|' /C calc'!A0"), "'=CMD|' /C calc'!A0");
  assert.equal(sanitizeField("+12345"), "'+12345");
  assert.equal(sanitizeField("-SUM(A1:B10)"), "'-SUM(A1:B10)");
  assert.equal(sanitizeField("@mention"), "'@mention");
  assert.equal(sanitizeField("Normal Campaign Name"), "Normal Campaign Name");
  assert.equal(sanitizeExportString("=1+1"), "'=1+1");
});
