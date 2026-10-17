import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { CustomerCohort } from '../models/CustomerCohort.js';
import { computeMetrics } from '../utils/kpiMath.js';
import { connectDB } from '../config/db.js';

export async function seedDemoData(targetWorkspaceId = null) {
  let workspace;
  if (targetWorkspaceId) {
    workspace = await Workspace.findById(targetWorkspaceId);
  }

  if (!workspace) {
    workspace = await Workspace.findOne({ is_demo: true });
    if (!workspace) {
      workspace = await Workspace.create({
        name: 'Acme Global Marketing (Demo)',
        is_demo: true,
        settings: { currency: 'USD', timezone: 'UTC' }
      });
    }
  }

  const workspaceId = workspace._id;

  // Clear existing demo metrics for this workspace
  await DailyCampaignMetric.deleteMany({ workspace_id: workspaceId });
  await CustomerCohort.deleteMany({ workspace_id: workspaceId });

  console.log(`[Seed] Generating 90-day multi-channel synthetic dataset for workspace: ${workspace.name}...`);

  const now = new Date();
  const days = 90;
  const metrics = [];

  // Definition of 6 distinct campaigns tailored to trigger specific audit rules & insights
  const campaignConfigs = [
    {
      id: 'camp_meta_retarget',
      name: 'Summer Retargeting - Meta',
      channel: 'META',
      isRevenueTracked: true,
      generator: (dayIndex) => {
        // High spend with creative fatigue: in last 7 days (dayIndex >= 83), CTR drops drastically
        const isFatigued = dayIndex >= 83;
        const spend = 280 + Math.random() * 80; // sustained high spend
        const impressions = 12000 + Math.floor(Math.random() * 3000);
        // baseline CTR ~ 2.2%, fatigued CTR ~ 1.2% (drop > 25%)
        const ctrRate = isFatigued ? (0.011 + Math.random() * 0.003) : (0.021 + Math.random() * 0.004);
        const clicks = Math.round(impressions * ctrRate);
        const conversions = Math.round(clicks * 0.04);
        const revenue = conversions * (85 + Math.random() * 20);
        return { spend, impressions, clicks, conversions, revenue };
      }
    },
    {
      id: 'camp_google_high_intent',
      name: 'Search - High Intent Keywords',
      channel: 'GOOGLE',
      isRevenueTracked: true,
      generator: () => {
        // Landing page disconnect: high CTR (3.8%), but very low CVR (0.4%)
        const spend = 190 + Math.random() * 50;
        const impressions = 6000 + Math.floor(Math.random() * 1500);
        const clicks = Math.round(impressions * 0.038); // high CTR
        const conversions = Math.random() < 0.35 ? 1 : 0; // low CVR < 1%
        const revenue = conversions * 150;
        return { spend, impressions, clicks, conversions, revenue };
      }
    },
    {
      id: 'camp_meta_broad_bleed',
      name: 'Broad Brand Discovery - Meta',
      channel: 'META',
      isRevenueTracked: true,
      generator: () => {
        // Budget bleed: active spend, but 0 conversions
        const spend = 95 + Math.random() * 30;
        const impressions = 8500 + Math.floor(Math.random() * 2000);
        const clicks = Math.round(impressions * 0.012);
        const conversions = 0; // zero-conversion bleed
        const revenue = 0;
        return { spend, impressions, clicks, conversions, revenue };
      }
    },
    {
      id: 'camp_li_enterprise_scale',
      name: 'Enterprise Decision Makers - LinkedIn',
      channel: 'LINKEDIN',
      isRevenueTracked: true,
      generator: () => {
        // High efficiency: Low CPA (~$22 vs ~$48 average), strong conversion volume
        const spend = 160 + Math.random() * 40;
        const impressions = 4500 + Math.floor(Math.random() * 1000);
        const clicks = Math.round(impressions * 0.024);
        const conversions = 7 + Math.floor(Math.random() * 4); // high conversion count
        const revenue = conversions * (180 + Math.random() * 50);
        return { spend, impressions, clicks, conversions, revenue };
      }
    },
    {
      id: 'camp_google_pmax',
      name: 'Performance Max Omnichannel',
      channel: 'GOOGLE',
      isRevenueTracked: true,
      generator: () => {
        // Healthy staple campaign
        const spend = 220 + Math.random() * 60;
        const impressions = 10000 + Math.floor(Math.random() * 2500);
        const clicks = Math.round(impressions * 0.018);
        const conversions = 5 + Math.floor(Math.random() * 3);
        const revenue = conversions * 120;
        return { spend, impressions, clicks, conversions, revenue };
      }
    },
    {
      id: 'camp_li_brand_awareness',
      name: 'Global Executive Reach - LinkedIn',
      channel: 'LINKEDIN',
      isRevenueTracked: false, // AUDIT RULE: Revenue untracked, roas must be null, never 0
      generator: () => {
        const spend = 120 + Math.random() * 30;
        const impressions = 7000 + Math.floor(Math.random() * 1500);
        const clicks = Math.round(impressions * 0.014);
        const conversions = null; // untracked
        const revenue = null; // untracked
        return { spend, impressions, clicks, conversions, revenue };
      }
    }
  ];

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - d - 1));
    date.setHours(0, 0, 0, 0);

    for (const config of campaignConfigs) {
      const row = config.generator(d);
      const computed = computeMetrics({
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
        revenue: row.revenue,
        is_revenue_tracked: config.isRevenueTracked
      });

      metrics.push({
        workspace_id: workspaceId,
        date,
        campaign_id: config.id,
        campaign_name: config.name,
        channel: config.channel,
        spend: computed.spend,
        impressions: computed.impressions,
        clicks: computed.clicks,
        conversions: computed.conversions,
        revenue: computed.revenue,
        ctr: computed.ctr,
        cpc: computed.cpc,
        cvr: computed.cvr,
        cpa: computed.cpa,
        roas: computed.roas,
        is_revenue_tracked: computed.is_revenue_tracked
      });
    }
  }

  await DailyCampaignMetric.insertMany(metrics);
  console.log(`[Seed] Inserted ${metrics.length} daily campaign records across 90 days.`);

  // 2. Generate 120 Customer Cohort records for RFM K-Means Segmentation
  const cohorts = [];
  // Segment 1: High-Value Champions (Low recency <= 15 days, high frequency >= 8 orders, high spend >= $1,200)
  for (let i = 1; i <= 35; i++) {
    const recency = Math.floor(Math.random() * 14) + 1;
    const orders = Math.floor(Math.random() * 15) + 8;
    const spend = Math.floor(Math.random() * 2500) + 1200;
    const d = new Date(now);
    d.setDate(now.getDate() - recency);

    cohorts.push({
      workspace_id: workspaceId,
      customer_id: `CUST_CHAMP_${i}`,
      customer_email: `champion${i}@enterprise-client.com`,
      last_interaction_date: d,
      order_count: orders,
      monetary_total_spend: spend,
      recency_days: recency,
      cluster_name: 'High-Value Champions'
    });
  }

  // Segment 2: At-Risk High Spenders (High recency >= 45 days, good frequency >= 5, high spend >= $900)
  for (let i = 1; i <= 30; i++) {
    const recency = Math.floor(Math.random() * 45) + 45;
    const orders = Math.floor(Math.random() * 8) + 4;
    const spend = Math.floor(Math.random() * 1800) + 900;
    const d = new Date(now);
    d.setDate(now.getDate() - recency);

    cohorts.push({
      workspace_id: workspaceId,
      customer_id: `CUST_ATRISK_${i}`,
      customer_email: `dormant_vip${i}@corporate.org`,
      last_interaction_date: d,
      order_count: orders,
      monetary_total_spend: spend,
      recency_days: recency,
      cluster_name: 'At-Risk High Spenders'
    });
  }

  // Segment 3: Occasional Low-Spend Browsers (Moderate recency 15-60 days, low frequency 1-2, spend < $150)
  for (let i = 1; i <= 55; i++) {
    const recency = Math.floor(Math.random() * 50) + 15;
    const orders = Math.floor(Math.random() * 2) + 1;
    const spend = Math.floor(Math.random() * 120) + 25;
    const d = new Date(now);
    d.setDate(now.getDate() - recency);

    cohorts.push({
      workspace_id: workspaceId,
      customer_id: `CUST_BROWSE_${i}`,
      customer_email: `shopper${i}@gmail.com`,
      last_interaction_date: d,
      order_count: orders,
      monetary_total_spend: spend,
      recency_days: recency,
      cluster_name: 'Occasional Low-Spend Browsers'
    });
  }

  await CustomerCohort.insertMany(cohorts);
  console.log(`[Seed] Inserted ${cohorts.length} customer cohort records for RFM analysis.`);

  return { metricsCount: metrics.length, cohortsCount: cohorts.length, workspaceId };
}

// Direct execution support
if (process.argv[1]?.endsWith('seed.js')) {
  try {
    await connectDB();
    await seedDemoData();
    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}
