import { Router } from 'express';
import multer from 'multer';
import { authenticateAndScopeTenant } from '../middleware/auth.js';
import { ImportJob } from '../models/ImportJob.js';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { parseCSVString, autoDetectMapping, processAndSaveImport } from '../services/csvIngestion.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

// GET /api/imports/template - Standard CSV template
router.get('/template', (req, res) => {
  const headers = [
    'date',
    'campaign_id',
    'campaign_name',
    'channel',
    'spend',
    'impressions',
    'clicks',
    'leads',
    'conversions',
    'revenue'
  ];

  const sampleRows = [
    '2026-09-01,camp_meta_retarget,Fall Clearance Retargeting,META,450.50,15400,320,15,8,1240.00',
    '2026-09-01,camp_goog_search,High Intent B2B Search,GOOGLE,680.00,12100,540,30,22,3100.00',
    '2026-09-01,camp_li_leadgen,Enterprise Decision Makers,LINKEDIN,890.00,8500,195,12,6,1800.00'
  ];

  const csv = [headers.join(','), ...sampleRows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hezal_campaign_template.csv"');
  res.send(csv);
});

// POST /api/imports/upload - Step 1: Upload & Inspect CSV
router.post('/upload', authenticateAndScopeTenant, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .csv file.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const { headers, rows, errors } = parseCSVString(fileContent);

    if (headers.length === 0) {
      return res.status(400).json({ error: 'Uploaded file contains no readable headers or is empty.' });
    }

    // Auto-detect mapping and preset
    const { mapping, detectedPreset } = autoDetectMapping(headers);

    // Return preview for the interactive visual column mapping modal
    res.json({
      filename: req.file.originalname,
      fileSize: req.file.size,
      totalRows: rows.length,
      detectedPreset,
      headers,
      suggestedMapping: mapping,
      previewRows: rows.slice(0, 5),
      rawContentSample: rows // in-memory rows for confirmation
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: 'Failed to parse CSV upload.' });
  }
});

// POST /api/imports/confirm - Step 2: Commit mapped rows with formula defense & KPI math
router.post('/confirm', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { filename, fileSize, rows, mapping } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for confirmation.' });
    }
    if (!mapping || !mapping.campaign_name || !mapping.spend || !mapping.clicks || !mapping.impressions) {
      return res.status(400).json({
        error: 'Required column mappings missing (campaign_name, spend, clicks, impressions are mandatory).'
      });
    }

    const result = await processAndSaveImport(
      req.workspaceId,
      filename || 'manual_upload.csv',
      fileSize || 0,
      rows,
      mapping
    );

    res.json({
      message: 'CSV import processed successfully.',
      jobId: result.job._id,
      insertedCount: result.insertedCount,
      errorsCount: result.errorsCount,
      validationErrors: result.job.validation_errors
    });
  } catch (err) {
    console.error('[Confirm Error]', err);
    res.status(500).json({ error: 'Failed to process and commit CSV data.' });
  }
});

// GET /api/imports/history - List import jobs
router.get('/history', authenticateAndScopeTenant, async (req, res) => {
  try {
    const history = await ImportJob.find(req.scopedFilter()).sort({ created_at: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch import history.' });
  }
});

// DELETE /api/imports/:id - Roll back import batch
router.delete('/:id', authenticateAndScopeTenant, async (req, res) => {
  try {
    const job = await ImportJob.findOne({
      _id: req.params.id,
      workspace_id: req.workspaceId
    });

    if (!job) {
      return res.status(404).json({ error: 'Import batch not found or not owned by workspace.' });
    }

    // Roll back metrics
    const deleteResult = await DailyCampaignMetric.deleteMany({
      import_job_id: job._id,
      workspace_id: req.workspaceId
    });

    await ImportJob.findByIdAndDelete(job._id);

    res.json({
      message: 'Import batch rolled back successfully.',
      deletedMetricsCount: deleteResult.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to roll back import.' });
  }
});

export default router;
