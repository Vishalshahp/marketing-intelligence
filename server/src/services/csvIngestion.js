import Papa from 'papaparse';
import { sanitizeField, sanitizeRecord } from '../utils/sanitizer.js';
import { computeMetrics } from '../utils/kpiMath.js';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { ImportJob } from '../models/ImportJob.js';

// Alias dictionary for automatic header detection
export const ALIAS_DICTIONARY = {
  date: ['date', 'day', 'reporting starts', 'reporting start', 'timestamp', 'time'],
  campaign_id: ['campaign id', 'campaign_id', 'cid', 'ad set id', 'campaign identifier'],
  campaign_name: ['campaign name', 'campaign_name', 'campaign', 'ad campaign', 'ad name'],
  channel: ['channel', 'platform', 'source', 'network', 'publisher platform', 'medium'],
  spend: ['spend', 'cost', 'amount spent', 'amount spent (inr)', 'amount spent (usd)', 'amount spent (eur)', 'ad spend', 'total spend'],
  impressions: ['impressions', 'impr', 'views', 'total impressions'],
  clicks: ['clicks', 'link clicks', 'url clicks', 'total clicks'],
  leads: ['leads', 'lead submissions', 'signups', 'form submissions'],
  conversions: ['conversions', 'results', 'purchases', 'orders', 'conv', 'actions'],
  revenue: ['revenue', 'conversion value', 'purchase conversion value', 'sales', 'order value', 'total revenue']
};

export function autoDetectMapping(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => ({
    original: h,
    normalized: String(h).replace(/^[\uFEFF\u200B"']+|["']+$/g, '').trim().toLowerCase()
  }));

  for (const [targetField, aliases] of Object.entries(ALIAS_DICTIONARY)) {
    for (const item of lowerHeaders) {
      if (aliases.includes(item.normalized)) {
        mapping[targetField] = item.original;
        break;
      }
    }
  }

  // Detect preset signature
  let detectedPreset = 'CUSTOM';
  const normOriginals = lowerHeaders.map(h => h.normalized);
  if (normOriginals.some(h => h.includes('amount spent') || h.includes('reporting starts') || h.includes('link clicks'))) {
    detectedPreset = 'META_ADS';
  } else if (normOriginals.some(h => h.includes('cost') || h.includes('impr.') || h.includes('conv.'))) {
    detectedPreset = 'GOOGLE_ADS';
  } else if (normOriginals.includes('campaign_id') && normOriginals.includes('spend')) {
    detectedPreset = 'HEZAL_STANDARD';
  }

  return { mapping, detectedPreset };
}

export function parseCSVString(csvContent) {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data || [],
    errors: result.errors || []
  };
}

export async function processAndSaveImport(workspaceId, filename, fileSize, rows, columnMapping) {
  const importJob = await ImportJob.create({
    workspace_id: workspaceId,
    filename,
    file_size: fileSize,
    row_count: rows.length,
    status: 'VALIDATING',
    validation_errors: []
  });

  const validationErrors = [];
  const metricsToInsert = [];

  const isRevenueTracked = Boolean(columnMapping.revenue && columnMapping.revenue.trim() !== '');

  rows.forEach((rawRow, index) => {
    const rowNum = index + 1;
    try {
      // 1. Sanitize string values for formula injection defense
      const sanitizedRaw = sanitizeRecord(rawRow);

      // 2. Extract values using column mapping
      const dateVal = sanitizedRaw[columnMapping.date];
      const campName = sanitizedRaw[columnMapping.campaign_name];
      const campId = sanitizedRaw[columnMapping.campaign_id] || (campName ? campName.toLowerCase().replace(/[^a-z0-9]/g, '_') : `camp_${rowNum}`);
      const channelRaw = (sanitizedRaw[columnMapping.channel] || 'OTHER').toUpperCase();
      
      let channel = 'OTHER';
      if (channelRaw.includes('META') || channelRaw.includes('FACEBOOK') || channelRaw.includes('INSTAGRAM')) {
        channel = 'META';
      } else if (channelRaw.includes('GOOGLE') || channelRaw.includes('ADWORDS') || channelRaw.includes('YOUTUBE')) {
        channel = 'GOOGLE';
      } else if (channelRaw.includes('LINKEDIN')) {
        channel = 'LINKEDIN';
      }

      const spendVal = columnMapping.spend ? parseFloat(sanitizedRaw[columnMapping.spend]) : 0;
      const impressionsVal = columnMapping.impressions ? parseInt(sanitizedRaw[columnMapping.impressions], 10) : 0;
      const clicksVal = columnMapping.clicks ? parseInt(sanitizedRaw[columnMapping.clicks], 10) : 0;
      
      let conversionsVal = null;
      if (columnMapping.conversions && sanitizedRaw[columnMapping.conversions] !== undefined && sanitizedRaw[columnMapping.conversions] !== '') {
        conversionsVal = parseFloat(sanitizedRaw[columnMapping.conversions]);
      }

      let revenueVal = null;
      if (isRevenueTracked && sanitizedRaw[columnMapping.revenue] !== undefined && sanitizedRaw[columnMapping.revenue] !== '') {
        revenueVal = parseFloat(sanitizedRaw[columnMapping.revenue]);
      }

      let leadsVal = null;
      if (columnMapping.leads && sanitizedRaw[columnMapping.leads] !== undefined && sanitizedRaw[columnMapping.leads] !== '') {
        leadsVal = parseInt(sanitizedRaw[columnMapping.leads], 10);
      }

      // Validations
      if (!campName) {
        validationErrors.push({ row: rowNum, field: 'campaign_name', message: 'Campaign name is required.' });
        return;
      }
      
      let parsedDate = dateVal ? new Date(dateVal) : new Date();
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      // 3. Deterministic KPI calculation with division-by-zero guards
      const computed = computeMetrics({
        spend: isNaN(spendVal) ? 0 : spendVal,
        impressions: isNaN(impressionsVal) ? 0 : impressionsVal,
        clicks: isNaN(clicksVal) ? 0 : clicksVal,
        conversions: isNaN(conversionsVal) ? null : conversionsVal,
        revenue: isNaN(revenueVal) ? null : revenueVal,
        is_revenue_tracked: isRevenueTracked
      });

      metricsToInsert.push({
        workspace_id: workspaceId,
        import_job_id: importJob._id,
        date: parsedDate,
        campaign_id: sanitizeField(campId),
        campaign_name: sanitizeField(campName),
        channel,
        spend: computed.spend,
        impressions: computed.impressions,
        clicks: computed.clicks,
        leads: leadsVal,
        conversions: computed.conversions,
        revenue: computed.revenue,
        ctr: computed.ctr,
        cpc: computed.cpc,
        cvr: computed.cvr,
        cpa: computed.cpa,
        roas: computed.roas,
        is_revenue_tracked: computed.is_revenue_tracked
      });
    } catch (rowErr) {
      validationErrors.push({ row: rowNum, field: 'general', message: rowErr.message });
    }
  });

  if (metricsToInsert.length > 0) {
    await DailyCampaignMetric.insertMany(metricsToInsert);
    importJob.status = validationErrors.length > 0 ? 'COMPLETED' : 'COMPLETED';
    importJob.row_count = metricsToInsert.length;
  } else {
    importJob.status = 'FAILED';
  }

  importJob.validation_errors = validationErrors;
  await importJob.save();

  return {
    job: importJob,
    insertedCount: metricsToInsert.length,
    errorsCount: validationErrors.length
  };
}
