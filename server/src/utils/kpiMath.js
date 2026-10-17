/**
 * Project Hezal - Deterministic Analytical KPI Model
 * Enforces strict boundary assertions, division-by-zero guards, and explicit revenue tracking rules.
 */

export function calculateCTR(clicks, impressions) {
  const numImpressions = Number(impressions);
  if (isNaN(numImpressions) || numImpressions <= 0) {
    return null;
  }
  const safeClicks = Math.max(0, isNaN(Number(clicks)) ? 0 : Number(clicks));
  return Number(((safeClicks / numImpressions) * 100).toFixed(4));
}

export function calculateCPC(spend, clicks) {
  const numClicks = Number(clicks);
  if (isNaN(numClicks) || numClicks <= 0) {
    return null;
  }
  const safeSpend = Math.max(0, isNaN(Number(spend)) ? 0 : Number(spend));
  return Number((safeSpend / numClicks).toFixed(4));
}

export function calculateCVR(conversions, clicks) {
  if (conversions === null || conversions === undefined) {
    return null;
  }
  const numConv = Number(conversions);
  if (isNaN(numConv) || numConv < 0) {
    return null;
  }
  const numClicks = Number(clicks);
  if (isNaN(numClicks) || numClicks <= 0) {
    return null;
  }
  return Number(((numConv / numClicks) * 100).toFixed(4));
}

export function calculateCPA(spend, conversions) {
  if (conversions === null || conversions === undefined) {
    return null;
  }
  const numConversions = Number(conversions);
  if (isNaN(numConversions) || numConversions <= 0) {
    return null;
  }
  const safeSpend = Math.max(0, isNaN(Number(spend)) ? 0 : Number(spend));
  return Number((safeSpend / numConversions).toFixed(4));
}

export function calculateROAS(revenue, spend, isRevenueTracked) {
  // CRITICAL AUDIT RULE: Never substitute 0 for missing revenue.
  // Missing revenue -> is_revenue_tracked = false -> roas = null.
  if (!isRevenueTracked || revenue === null || revenue === undefined) {
    return null;
  }
  const numSpend = Number(spend);
  if (isNaN(numSpend) || numSpend <= 0) {
    return null;
  }
  const numRevenue = Number(revenue);
  if (isNaN(numRevenue) || numRevenue < 0) {
    return null;
  }
  return Number((numRevenue / numSpend).toFixed(4));
}

/**
 * Computes all KPI metrics for a row or aggregate summary
 */
export function computeMetrics({ spend, impressions, clicks, conversions, revenue, is_revenue_tracked }) {
  const numSpend = spend !== null && spend !== undefined && !isNaN(Number(spend)) ? Math.max(0, Number(spend)) : 0;
  const numImpressions = impressions !== null && impressions !== undefined && !isNaN(Number(impressions)) ? Math.max(0, Number(impressions)) : 0;
  const numClicks = clicks !== null && clicks !== undefined && !isNaN(Number(clicks)) ? Math.max(0, Number(clicks)) : 0;
  const numConversions = conversions !== null && conversions !== undefined && !isNaN(Number(conversions)) ? Math.max(0, Number(conversions)) : null;
  
  const isRevTracked = Boolean(is_revenue_tracked);
  const numRevenue = isRevTracked && revenue !== null && revenue !== undefined && !isNaN(Number(revenue)) ? Math.max(0, Number(revenue)) : null;

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
