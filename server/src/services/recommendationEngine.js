import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';

/**
 * Project Hezal - Production Heuristic Recommendation Engine
 * Evaluates campaigns deterministically and produces evidence-linked 5-tuples.
 */
export async function generateRecommendations(workspaceId, currency = 'USD') {
  const metrics = await DailyCampaignMetric.find({ workspace_id: workspaceId });
  if (!metrics || metrics.length === 0) {
    return [];
  }

  // Group metrics by campaign
  const campaignMap = new Map();
  let totalAccountSpend = 0;
  let totalAccountConversions = 0;

  for (const m of metrics) {
    totalAccountSpend += m.spend || 0;
    if (m.conversions !== null && m.conversions !== undefined) {
      totalAccountConversions += m.conversions;
    }

    if (!campaignMap.has(m.campaign_id)) {
      campaignMap.set(m.campaign_id, {
        campaign_id: m.campaign_id,
        campaign_name: m.campaign_name,
        channel: m.channel,
        records: []
      });
    }
    campaignMap.get(m.campaign_id).records.push(m);
  }

  const accountAvgCpa = totalAccountConversions > 0 ? totalAccountSpend / totalAccountConversions : 45.0;

  const campaignSummaries = [];
  for (const [campaignId, group] of campaignMap.entries()) {
    // Sort chronologically
    group.records.sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let hasConversionsTracked = false;

    for (const r of group.records) {
      totalSpend += r.spend || 0;
      totalImpressions += r.impressions || 0;
      totalClicks += r.clicks || 0;
      if (r.conversions !== null && r.conversions !== undefined) {
        totalConversions += r.conversions;
        hasConversionsTracked = true;
      }
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cvr = totalClicks > 0 && hasConversionsTracked ? (totalConversions / totalClicks) * 100 : null;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : null;

    campaignSummaries.push({
      campaign_id: campaignId,
      campaign_name: group.campaign_name,
      channel: group.channel,
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      hasConversionsTracked,
      ctr,
      cvr,
      cpa,
      records: group.records
    });
  }

  const recommendations = [];

  // Currency spend threshold adjustment
  const spendThresholdFatigue = currency === 'INR' ? 12000 : 150;
  const currSymbol = currency === 'INR' ? '₹' : (currency === 'EUR' ? '€' : '$');

  for (const camp of campaignSummaries) {
    // RULE 1: High Spend with Creative Fatigue (REC_CREATIVE_FATIGUE)
    // Check rolling 7-day CTR vs prior 14-day CTR
    if (camp.records.length >= 10 && camp.totalSpend > spendThresholdFatigue) {
      const recent7 = camp.records.slice(-7);
      const prior14 = camp.records.slice(-21, -7);

      if (prior14.length >= 3) {
        const priorImpr = prior14.reduce((s, r) => s + (r.impressions || 0), 0);
        const priorClicks = prior14.reduce((s, r) => s + (r.clicks || 0), 0);
        const baselineCtr = priorImpr > 0 ? (priorClicks / priorImpr) * 100 : 0;

        const recentImpr = recent7.reduce((s, r) => s + (r.impressions || 0), 0);
        const recentClicks = recent7.reduce((s, r) => s + (r.clicks || 0), 0);
        const currentCtr = recentImpr > 0 ? (recentClicks / recentImpr) * 100 : 0;
        const recentSpend = recent7.reduce((s, r) => s + (r.spend || 0), 0);

        if (baselineCtr > 0.8 && currentCtr < baselineCtr) {
          const dropPct = ((baselineCtr - currentCtr) / baselineCtr) * 100;
          if (dropPct >= 25.0) {
            recommendations.push({
              rule_id: 'REC_CREATIVE_FATIGUE',
              severity: 'HIGH',
              campaign_name: camp.campaign_name,
              observation: `Significant ${dropPct.toFixed(1)}% drop in Click-Through Rate (CTR) over the past 7 days despite active spend.`,
              evidence: {
                campaign_name: camp.campaign_name,
                channel: camp.channel,
                baseline_ctr: Number(baselineCtr.toFixed(2)),
                current_ctr: Number(currentCtr.toFixed(2)),
                period_spend: Number(recentSpend.toFixed(2)),
                impressions: recentImpr
              },
              interpretation: 'Prolonged audience exposure to identical creative visual assets often induces banner blindness and ad fatigue.',
              action_to_consider: 'Introduce 2-3 fresh creative variants or rotate copy headlines while capping campaign frequency at 3.0 impressions per user.',
              limitation: 'Does not measure competitor bidding shifts or broader holiday auction volume swings.'
            });
          }
        }
      }
    }

    // RULE 2: Landing Page Conversion Disconnect (REC_LP_DISCONNECT)
    // High CTR (>= 2.0% with min 100 clicks), but CVR < 1.0%
    if (camp.totalClicks >= 100 && camp.ctr >= 2.0 && camp.hasConversionsTracked && camp.cvr !== null && camp.cvr < 1.0) {
      recommendations.push({
        rule_id: 'REC_LP_DISCONNECT',
        severity: 'MEDIUM',
        campaign_name: camp.campaign_name,
        observation: 'High traffic acquisition rate with disproportionately low conversion completion.',
        evidence: {
          campaign_name: camp.campaign_name,
          channel: camp.channel,
          ctr: Number(camp.ctr.toFixed(2)),
          cvr: Number(camp.cvr.toFixed(2)),
          clicks: camp.totalClicks,
          conversions: camp.totalConversions
        },
        interpretation: 'Ad messaging is effectively capturing interest, but the landing page is introducing drop-off friction or failing to match search expectations.',
        action_to_consider: 'Audit page load times on 4G mobile connections, verify pricing consistency between ad copy and page header, and test a simplified 1-step form.',
        limitation: 'Conversion tracking pixels may be failing to fire on specific browser extensions or iOS Safari sessions.'
      });
    }

    // RULE 3: Budget Inefficiency / Zero-Conversion Bleed (REC_BUDGET_BLEED)
    // Total spend > 3x account average CPA, with conversions = 0
    if (camp.hasConversionsTracked && camp.totalConversions === 0 && camp.totalSpend > (3 * accountAvgCpa)) {
      recommendations.push({
        rule_id: 'REC_BUDGET_BLEED',
        severity: 'HIGH',
        campaign_name: camp.campaign_name,
        observation: `Campaign has consumed significant budget (${currSymbol}${camp.totalSpend.toFixed(2)}) without registering any conversion events.`,
        evidence: {
          campaign_name: camp.campaign_name,
          channel: camp.channel,
          total_spend: Number(camp.totalSpend.toFixed(2)),
          account_avg_cpa: Number(accountAvgCpa.toFixed(2)),
          spend_multiplier: Number((camp.totalSpend / accountAvgCpa).toFixed(1)),
          conversions: 0
        },
        interpretation: 'The campaign targeting or bid strategy is underperforming or conversion attribution is failing.',
        action_to_consider: 'Pause the campaign to prevent further budget loss while reviewing conversion tags and audience parameters.',
        limitation: 'Long sales cycles (high-consideration products) may have attribution lag exceeding the selected date window.'
      });
    }

    // RULE 4: High Efficiency Opportunity (REC_HIGH_EFFICIENCY)
    // CPA is >= 30% below account average with minimum 15 conversions
    if (camp.hasConversionsTracked && camp.totalConversions >= 15 && camp.cpa !== null && camp.cpa <= (accountAvgCpa * 0.70)) {
      const savingsPct = ((accountAvgCpa - camp.cpa) / accountAvgCpa) * 100;
      recommendations.push({
        rule_id: 'REC_HIGH_EFFICIENCY',
        severity: 'OPPORTUNITY',
        campaign_name: camp.campaign_name,
        observation: `Campaign delivers conversions at ${savingsPct.toFixed(1)}% lower cost than account average.`,
        evidence: {
          campaign_name: camp.campaign_name,
          channel: camp.channel,
          campaign_cpa: Number(camp.cpa.toFixed(2)),
          account_avg_cpa: Number(accountAvgCpa.toFixed(2)),
          total_conversions: camp.totalConversions,
          total_spend: Number(camp.totalSpend.toFixed(2))
        },
        interpretation: 'The campaign has found a receptive audience segment and effective creative pairing.',
        action_to_consider: 'Test incremental budget increases (15-20% at a time) to scale conversions without triggering auction penalty.',
        limitation: 'Scaling spend aggressively can saturate the audience and inflate CPA.'
      });
    }
  }

  return recommendations;
}
