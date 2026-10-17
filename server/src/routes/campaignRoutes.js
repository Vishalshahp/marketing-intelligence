import { Router } from 'express';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { authenticateAndScopeTenant } from '../middleware/auth.js';
import { computeMetrics } from '../utils/kpiMath.js';

const router = Router();

// GET /api/campaigns - Filterable, sortable campaign list
router.get('/', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { start_date, end_date, channel, search, sort_by = 'spend', sort_order = 'desc' } = req.query;
    const query = req.scopedFilter();

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (channel && channel !== 'ALL') {
      query.channel = channel.toUpperCase();
    }
    if (search) {
      query.campaign_name = { $regex: search, $options: 'i' };
    }

    const records = await DailyCampaignMetric.find(query);

    // Group by campaign_id
    const campaignMap = new Map();

    for (const r of records) {
      if (!campaignMap.has(r.campaign_id)) {
        campaignMap.set(r.campaign_id, {
          campaign_id: r.campaign_id,
          campaign_name: r.campaign_name,
          channel: r.channel,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          hasConversions: false,
          revenue: 0,
          isRevenueTracked: false,
          daysActive: new Set()
        });
      }

      const item = campaignMap.get(r.campaign_id);
      item.spend += r.spend || 0;
      item.impressions += r.impressions || 0;
      item.clicks += r.clicks || 0;
      item.daysActive.add(r.date.toISOString().split('T')[0]);

      if (r.conversions !== null && r.conversions !== undefined) {
        item.conversions += r.conversions;
        item.hasConversions = true;
      }

      if (r.is_revenue_tracked && r.revenue !== null && r.revenue !== undefined) {
        item.revenue += r.revenue;
        item.isRevenueTracked = true;
      }
    }

    const campaigns = Array.from(campaignMap.values()).map(c => {
      const computed = computeMetrics({
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.hasConversions ? c.conversions : null,
        revenue: c.isRevenueTracked ? c.revenue : null,
        is_revenue_tracked: c.isRevenueTracked
      });

      return {
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        channel: c.channel,
        days_active: c.daysActive.size,
        ...computed
      };
    });

    // Sorting
    campaigns.sort((a, b) => {
      let valA = a[sort_by] ?? -Infinity;
      let valB = b[sort_by] ?? -Infinity;
      if (sort_order === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    res.json({
      totalCampaigns: campaigns.length,
      currency: req.currentWorkspace?.settings?.currency || 'USD',
      campaigns
    });
  } catch (err) {
    console.error('[Campaigns Error]', err);
    res.status(500).json({ error: 'Failed to fetch campaigns.' });
  }
});

// GET /api/campaigns/:id - Detailed drill-down for a single campaign
router.get('/:id', authenticateAndScopeTenant, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const records = await DailyCampaignMetric.find({
      campaign_id: campaignId,
      workspace_id: req.workspaceId
    }).sort({ date: 1 });

    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'Campaign not found in workspace.' });
    }

    const campaignName = records[0].campaign_name;
    const channel = records[0].channel;

    // Period-over-period delta calculation:
    // Split into first half (previous window) and second half (current window)
    const midIndex = Math.floor(records.length / 2);
    const prevWindow = records.slice(0, midIndex);
    const currWindow = records.slice(midIndex);

    const sumRecords = (list) => {
      let spend = 0, impressions = 0, clicks = 0, conversions = 0, revenue = 0;
      let hasConversions = false, hasRevenue = false;

      for (const r of list) {
        spend += r.spend || 0;
        impressions += r.impressions || 0;
        clicks += r.clicks || 0;
        if (r.conversions !== null && r.conversions !== undefined) {
          conversions += r.conversions;
          hasConversions = true;
        }
        if (r.is_revenue_tracked && r.revenue !== null && r.revenue !== undefined) {
          revenue += r.revenue;
          hasRevenue = true;
        }
      }

      return computeMetrics({
        spend,
        impressions,
        clicks,
        conversions: hasConversions ? conversions : null,
        revenue: hasRevenue ? revenue : null,
        is_revenue_tracked: hasRevenue
      });
    };

    const overall = sumRecords(records);
    const prevMetrics = sumRecords(prevWindow);
    const currMetrics = sumRecords(currWindow);

    // Calculate percentage deltas
    const calculateDelta = (current, previous) => {
      if (previous === null || previous === undefined || previous === 0) return null;
      if (current === null || current === undefined) return null;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const delta = {
      spend: calculateDelta(currMetrics.spend, prevMetrics.spend),
      impressions: calculateDelta(currMetrics.impressions, prevMetrics.impressions),
      clicks: calculateDelta(currMetrics.clicks, prevMetrics.clicks),
      conversions: calculateDelta(currMetrics.conversions, prevMetrics.conversions),
      ctr: calculateDelta(currMetrics.ctr, prevMetrics.ctr),
      cpc: calculateDelta(currMetrics.cpc, prevMetrics.cpc),
      cpa: calculateDelta(currMetrics.cpa, prevMetrics.cpa),
      roas: calculateDelta(currMetrics.roas, prevMetrics.roas)
    };

    // Daily breakdown for visual chart
    const dailyBreakdown = records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      spend: r.spend,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions,
      revenue: r.revenue,
      ctr: r.ctr,
      cpc: r.cpc,
      cpa: r.cpa,
      roas: r.roas
    }));

    res.json({
      campaign_id: campaignId,
      campaign_name: campaignName,
      channel,
      currency: req.currentWorkspace?.settings?.currency || 'USD',
      metrics: overall,
      periodOverPeriod: {
        currentWindow: currMetrics,
        previousWindow: prevMetrics,
        delta
      },
      dailyBreakdown
    });
  } catch (err) {
    console.error('[Campaign Detail Error]', err);
    res.status(500).json({ error: 'Failed to fetch campaign details.' });
  }
});

export default router;
