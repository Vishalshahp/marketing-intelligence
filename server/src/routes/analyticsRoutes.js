import { Router } from 'express';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { authenticateAndScopeTenant } from '../middleware/auth.js';
import { computeMetrics } from '../utils/kpiMath.js';
import { generateRecommendations } from '../services/recommendationEngine.js';
import { runRFMSegmentation } from '../services/rfmSegmentation.js';

const router = Router();

// GET /api/metrics/overview - Dashboard summary KPI cards with boundary rules
router.get('/overview', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { start_date, end_date, channel } = req.query;
    const query = req.scopedFilter();

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (channel && channel !== 'ALL') {
      query.channel = channel.toUpperCase();
    }

    const metrics = await DailyCampaignMetric.find(query);

    // Latest freshness date
    const latestRecord = await DailyCampaignMetric.findOne(req.scopedFilter()).sort({ date: -1 });

    if (!metrics || metrics.length === 0) {
      return res.json({
        totalRecords: 0,
        currency: req.currentWorkspace?.settings?.currency || 'USD',
        freshness: {
          lastSyncDate: latestRecord ? latestRecord.date : null,
          hasData: false
        },
        kpis: {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: null,
          revenue: null,
          ctr: null,
          cpc: null,
          cvr: null,
          cpa: null,
          roas: null,
          is_revenue_tracked: false
        },
        channelBreakdown: []
      });
    }

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let hasConversions = false;
    let totalRevenue = 0;
    let hasRevenue = false;

    const channelMap = {};

    for (const m of metrics) {
      totalSpend += m.spend || 0;
      totalImpressions += m.impressions || 0;
      totalClicks += m.clicks || 0;

      if (m.conversions !== null && m.conversions !== undefined) {
        totalConversions += m.conversions;
        hasConversions = true;
      }

      if (m.is_revenue_tracked && m.revenue !== null && m.revenue !== undefined) {
        totalRevenue += m.revenue;
        hasRevenue = true;
      }

      const ch = m.channel || 'OTHER';
      if (!channelMap[ch]) {
        channelMap[ch] = { channel: ch, spend: 0, clicks: 0, conversions: 0, impressions: 0 };
      }
      channelMap[ch].spend += m.spend || 0;
      channelMap[ch].clicks += m.clicks || 0;
      channelMap[ch].impressions += m.impressions || 0;
      if (m.conversions !== null && m.conversions !== undefined) {
        channelMap[ch].conversions += m.conversions;
      }
    }

    const computed = computeMetrics({
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: hasConversions ? totalConversions : null,
      revenue: hasRevenue ? totalRevenue : null,
      is_revenue_tracked: hasRevenue
    });

    res.json({
      totalRecords: metrics.length,
      currency: req.currentWorkspace?.settings?.currency || 'USD',
      freshness: {
        lastSyncDate: latestRecord ? latestRecord.date : null,
        hasData: true
      },
      kpis: computed,
      channelBreakdown: Object.values(channelMap)
    });
  } catch (err) {
    console.error('[Overview Error]', err);
    res.status(500).json({ error: 'Failed to compute overview metrics.' });
  }
});

// GET /api/metrics/trends - Daily time-series breakdown
router.get('/trends', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { start_date, end_date, channel } = req.query;
    const query = req.scopedFilter();

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (channel && channel !== 'ALL') {
      query.channel = channel.toUpperCase();
    }

    const metrics = await DailyCampaignMetric.find(query).sort({ date: 1 });

    // Group by YYYY-MM-DD
    const dayMap = {};
    for (const m of metrics) {
      const dStr = m.date.toISOString().split('T')[0];
      if (!dayMap[dStr]) {
        dayMap[dStr] = {
          date: dStr,
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          revenue: 0,
          hasRevenue: false
        };
      }
      dayMap[dStr].spend += m.spend || 0;
      dayMap[dStr].clicks += m.clicks || 0;
      dayMap[dStr].impressions += m.impressions || 0;
      if (m.conversions !== null && m.conversions !== undefined) {
        dayMap[dStr].conversions += m.conversions;
      }
      if (m.is_revenue_tracked && m.revenue !== null && m.revenue !== undefined) {
        dayMap[dStr].revenue += m.revenue;
        dayMap[dStr].hasRevenue = true;
      }
    }

    const trends = Object.values(dayMap).map(d => {
      const cpa = d.conversions > 0 ? Number((d.spend / d.conversions).toFixed(2)) : null;
      const ctr = d.impressions > 0 ? Number(((d.clicks / d.impressions) * 100).toFixed(2)) : null;
      const cpc = d.clicks > 0 ? Number((d.spend / d.clicks).toFixed(2)) : null;
      const roas = d.hasRevenue && d.spend > 0 ? Number((d.revenue / d.spend).toFixed(2)) : null;

      return {
        ...d,
        spend: Number(d.spend.toFixed(2)),
        cpa,
        ctr,
        cpc,
        roas
      };
    });

    res.json({ trends });
  } catch (err) {
    console.error('[Trends Error]', err);
    res.status(500).json({ error: 'Failed to fetch metric trends.' });
  }
});

// GET /api/recommendations - Active evidence-linked heuristic recommendations
router.get('/recommendations', authenticateAndScopeTenant, async (req, res) => {
  try {
    const currency = req.currentWorkspace?.settings?.currency || 'USD';
    const recs = await generateRecommendations(req.workspaceId, currency);
    res.json({
      recommendations: recs,
      count: recs.length,
      evaluatedAt: new Date()
    });
  } catch (err) {
    console.error('[Recommendations Error]', err);
    res.status(500).json({ error: 'Failed to evaluate recommendations.' });
  }
});

// GET /api/customer-segments - RFM K-Means Segmentation & ML Baseline
router.get('/customer-segments', authenticateAndScopeTenant, async (req, res) => {
  try {
    const segmentation = await runRFMSegmentation(req.workspaceId);
    res.json(segmentation);
  } catch (err) {
    console.error('[Segmentation Error]', err);
    res.status(500).json({ error: 'Failed to run customer segmentation.' });
  }
});

export default router;
