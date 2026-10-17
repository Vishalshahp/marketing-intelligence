import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCTR, calculateCPC, calculateCVR, calculateCPA, calculateROAS, computeMetrics } from '../utils/kpiMath.js';
import { sanitizeField, sanitizeExportString, sanitizeRecord } from '../utils/sanitizer.js';
import { autoDetectMapping, parseCSVString } from '../services/csvIngestion.js';

test('1. KPI Math - Extreme Edge Cases & Boundary Assertions', () => {
  // Extreme edge cases
  assert.equal(calculateCTR(0, 0), null, 'CTR must be null when both clicks and impressions are 0');
  assert.equal(calculateCTR(-50, 100), 0, 'Negative clicks should be clamped to 0');
  assert.equal(calculateCTR(100, -50), null, 'Negative impressions should return null');
  assert.equal(calculateCTR(undefined, undefined), null, 'Undefined inputs should return null');
  assert.equal(calculateCTR(NaN, 1000), 0, 'NaN clicks should be clamped to 0');
  assert.equal(calculateCTR(50, NaN), null, 'NaN impressions should return null');

  // CPC
  assert.equal(calculateCPC(100, 0), null, 'CPC must be null when clicks = 0');
  assert.equal(calculateCPC(0, 100), 0, 'CPC is 0 when spend is 0 and clicks > 0');
  assert.equal(calculateCPC(null, 100), 0, 'Null spend treated as 0');

  // CPA
  assert.equal(calculateCPA(500, 0), null, 'CPA must be null when conversions = 0');
  assert.equal(calculateCPA(500, null), null, 'CPA must be null when conversions is null');
  assert.equal(calculateCPA(0, 10), 0, 'CPA is 0 when spend is 0 and conversions > 0');

  // ROAS & Missing Revenue
  assert.equal(calculateROAS(null, 500, false), null, 'Untracked revenue must yield null ROAS');
  assert.equal(calculateROAS(0, 500, false), null, 'Untracked revenue with 0 value must yield null ROAS');
  assert.equal(calculateROAS(0, 500, true), 0, 'Tracked revenue with 0 earned yields 0.0 ROAS');
  assert.equal(calculateROAS(500, 0, true), null, 'Zero spend with revenue yields null ROAS (avoids division by zero)');
});

test('2. CSV Injection Sanitizer - Malicious Formula Payloads', () => {
  const maliciousInputs = [
    "=CMD|' /C calc'!A0",
    "=SUM(A1:B10)",
    "-2+3+cmd|' /C calc'!A0",
    "+1337",
    "@SUM(1,2)",
    "\t=DANGEROUS",
    "\r=MALWARE",
    "=1+1"
  ];

  for (const input of maliciousInputs) {
    const sanitized = sanitizeField(input);
    assert.ok(sanitized.startsWith("'"), `Dangerous input "${input}" must be prepended with a single quote. Got: ${sanitized}`);
    
    const exportSanitized = sanitizeExportString(input);
    assert.ok(exportSanitized.startsWith("'"), `Export string "${input}" must be escaped.`);
  }

  // Safe input preservation
  assert.equal(sanitizeField("Summer Campaign 2026"), "Summer Campaign 2026");
  assert.equal(sanitizeField("12345"), "12345");
  assert.equal(sanitizeField(""), "");
  assert.equal(sanitizeField(null), null);
});

test('3. Ingestion Header Aliases - Meta, Google, and Hezal Presets', () => {
  // Meta export headers
  const metaHeaders = ['Campaign Name', 'Amount spent (USD)', 'Link clicks', 'Impressions', 'Purchases', 'Date'];
  const metaDetection = autoDetectMapping(metaHeaders);
  assert.equal(metaDetection.detectedPreset, 'META_ADS', 'Should detect Meta preset');
  assert.equal(metaDetection.mapping.spend, 'Amount spent (USD)');
  assert.equal(metaDetection.mapping.clicks, 'Link clicks');

  // Google Ads headers
  const googleHeaders = ['Campaign', 'Cost', 'Clicks', 'Impr.', 'Conversions'];
  const googleDetection = autoDetectMapping(googleHeaders);
  assert.equal(googleDetection.detectedPreset, 'GOOGLE_ADS', 'Should detect Google preset');
  assert.equal(googleDetection.mapping.spend, 'Cost');

  // Custom ambiguous headers
  const customHeaders = ['Ad Group', 'Total Spend', 'Views', 'Actions'];
  const customDetection = autoDetectMapping(customHeaders);
  assert.equal(customDetection.mapping.spend, 'Total Spend');
  assert.equal(customDetection.mapping.impressions, 'Views');
});

test('4. ComputeMetrics Aggregate Boundary Stress Test', () => {
  const emptyRow = computeMetrics({
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: null,
    revenue: null,
    is_revenue_tracked: false
  });

  assert.equal(emptyRow.ctr, null);
  assert.equal(emptyRow.cpc, null);
  assert.equal(emptyRow.cvr, null);
  assert.equal(emptyRow.cpa, null);
  assert.equal(emptyRow.roas, null);
  assert.equal(emptyRow.is_revenue_tracked, false);

  const zeroConversionsRow = computeMetrics({
    spend: 1000,
    impressions: 50000,
    clicks: 1200,
    conversions: 0,
    revenue: 0,
    is_revenue_tracked: true
  });

  assert.equal(zeroConversionsRow.cvr, 0.0);
  assert.equal(zeroConversionsRow.cpa, null, 'CPA must be null when conversions = 0');
  assert.equal(zeroConversionsRow.roas, 0.0, 'ROAS is 0.0 when tracked and revenue is 0');
});
