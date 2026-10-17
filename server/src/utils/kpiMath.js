/**
 * Project Hezal - Deterministic Analytical KPI Model
 * Enforces strict boundary assertions, division-by-zero guards, and explicit revenue tracking rules.
 */

export function calculateCTR(clicks, impressions) {
  if (impressions === null || impressions === undefined || impressions <= 0) {
    return null;
  }
  const safeClicks = Math.max(0, Number(clicks) || 0);
  return Number(((safeClicks / Number(impressions)) * 100).toFixed(4));
}

export function calculateCPC(spend, clicks) {
  if (clicks === null || clicks === undefined || clicks <= 0) {
    return null;
  }
  const safeSpend = Math.max(0, Number(spend) || 0);
  return Number((safeSpend / Number(clicks)).toFixed(4));
}

export function calculateCVR(conversions, clicks) {
  if (conversions === null || conversions === undefined) {
    return null;
  }
  if (clicks === null || clicks === undefined || clicks <= 0) {
    return null;
  }
  const safeConversions = Math.max(0, Number(conversions) || 0);
  return Number(((safeConversions / Number(clicks)) * 100).toFixed(4));
}

export function calculateCPA(spend, conversions) {
  if (conversions === null || conversions === undefined || conversions <= 0) {
    return null;
  }
  const safeSpend = Math.max(0, Number(spend) || 0);
  return Number((safeSpend / Number(conversions)).toFixed(4));
}

export function calculateROAS(revenue, spend, isRevenueTracked) {
  // CRITICAL AUDIT RULE: Never substitute 0 for missing revenue.
  // Missing revenue -> is_revenue_tracked = false -> roas = null.
  if (!isRevenueTracked || revenue === null || revenue === undefined) {
    return null;
  }
  if (spend === null || spend === undefined || spend <= 0) {
    return null;
  }
  return Number((Number(revenue) / Number(spend)).toFixed(4));
}

/**
 * Computes all KPI metrics for a row or aggregate summary
 */
export function computeMetrics({ spend, impressions, clicks, conversions, revenue, is_revenue_tracked }) {
  const numSpend = spend !== null && spend !== undefined ? Math.max(0, Number(spend)) : 0;
  const numImpressions = impressions !== null && impressions !== undefined ? Math.max(0, Number(impressions)) : 0;
  const numClicks = clicks !== null && clicks !== undefined ? Math.max(0, Number(clicks)) : 0;
  const numConversions = conversions !== null && conversions !== undefined ? Math.max(0, Number(conversions)) : null;
  
  const isRevTracked = Boolean(is_revenue_tracked);
  const numRevenue = isRevTracked && revenue !== null && revenue !== undefined ? Math.max(0, Number(revenue)) : null;

  return {
    spend: numSpend,
    impressions: numImpressions,
    clicks: numClicks,
    conversions: numConversions,
    revenue: numRevenue,
    is_revenue_tracked: isRevTracked,
    ctr: calculateCTR(numClicks, numImpressions),
    cpc: calculateCPC(numSpend, numClicks),
    cvr: calculateCVR(numConversions, numClicks),
    cpa: calculateCPA(numSpend, numConversions),
    roas: calculateROAS(numRevenue, numSpend, isRevTracked)
  };
}
