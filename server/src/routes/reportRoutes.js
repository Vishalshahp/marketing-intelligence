import { Router } from 'express';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { authenticateAndScopeTenant } from '../middleware/auth.js';
import { sanitizeExportString } from '../utils/sanitizer.js';
import { generateRecommendations } from '../services/recommendationEngine.js';

const router = Router();

// POST /api/reports/export - Generates sanitized CSV report
router.post('/export', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { start_date, end_date, channel, format = 'csv' } = req.body;
    const query = req.scopedFilter();

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (channel && channel !== 'ALL') {
      query.channel = channel.toUpperCase();
    }

    const records = await DailyCampaignMetric.find(query).sort({ date: 1 });
    const currency = req.currentWorkspace?.settings?.currency || 'USD';

    if (format === 'json') {
      const recs = await generateRecommendations(req.workspaceId, currency);
      return res.json({
        exportDate: new Date().toISOString(),
        workspace: req.currentWorkspace?.name,
        currency,
        dateWindow: { start_date: start_date || 'earliest', end_date: end_date || 'latest' },
        recordsCount: records.length,
        metrics: records,
        recommendations: recs
      });
    }

    // CSV Format with Formula Injection Defense
    const headers = [
      'Date',
      'Campaign ID',
      'Campaign Name',
      'Channel',
      `Spend (${currency})`,
      'Impressions',
      'Clicks',
      'CTR (%)',
      `CPC (${currency})`,
      'Conversions',
      'CVR (%)',
      `CPA (${currency})`,
      `Revenue (${currency})`,
      'ROAS',
      'Revenue Tracked'
    ];

    const rows = records.map(r => {
      const dStr = r.date.toISOString().split('T')[0];
      const safeId = sanitizeExportString(r.campaign_id);
      const safeName = `"${sanitizeExportString(r.campaign_name).replace(/"/g, '""')}"`;
      const safeChannel = sanitizeExportString(r.channel);
      const spend = r.spend.toFixed(2);
      const impr = r.impressions;
      const clicks = r.clicks;
      const ctr = r.ctr !== null ? r.ctr.toFixed(2) : 'N/A';
      const cpc = r.cpc !== null ? r.cpc.toFixed(2) : 'N/A';
      const conv = r.conversions !== null ? r.conversions : 'N/A';
      const cvr = r.cvr !== null ? r.cvr.toFixed(2) : 'N/A';
      const cpa = r.cpa !== null ? r.cpa.toFixed(2) : 'N/A';
      const rev = r.revenue !== null ? r.revenue.toFixed(2) : 'N/A';
      const roas = r.roas !== null ? r.roas.toFixed(2) : 'N/A';
      const revTracked = r.is_revenue_tracked ? 'YES' : 'NO';

      return [
        dStr,
        safeId,
        safeName,
        safeChannel,
        spend,
        impr,
        clicks,
        ctr,
        cpc,
        conv,
        cvr,
        cpa,
        rev,
        roas,
        revTracked
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="hezal_report_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (err) {
    console.error('[Export Error]', err);
    res.status(500).json({ error: 'Failed to generate export report.' });
  }
});

export default router;
