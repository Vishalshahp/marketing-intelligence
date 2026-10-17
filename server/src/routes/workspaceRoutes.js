import { Router } from 'express';
import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { DailyCampaignMetric } from '../models/DailyCampaignMetric.js';
import { ImportJob } from '../models/ImportJob.js';
import { CustomerCohort } from '../models/CustomerCohort.js';
import { authenticateAndScopeTenant } from '../middleware/auth.js';
import { seedDemoData } from '../scripts/seed.js';

const router = Router();

// GET /api/workspaces - List accessible workspaces
router.get('/', authenticateAndScopeTenant, async (req, res) => {
  try {
    const query = { $or: [{ is_demo: true }] };
    if (req.user) {
      query.$or.push({ owner_user_id: req.user._id });
    }

    const workspaces = await Workspace.find(query).sort({ created_at: -1 });
    res.json({
      workspaces,
      activeWorkspaceId: req.workspaceId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspaces.' });
  }
});

// POST /api/workspaces - Create a new workspace
router.post('/', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { name, currency = 'USD' } = req.body;
    if (!name) return res.status(400).json({ error: 'Workspace name is required.' });

    const workspace = await Workspace.create({
      name,
      owner_user_id: req.user?._id,
      is_demo: false,
      settings: {
        currency: ['USD', 'INR', 'EUR'].includes(currency) ? currency : 'USD',
        timezone: 'UTC'
      }
    });

    if (req.user) {
      req.user.active_workspace_id = workspace._id;
      await req.user.save();
    }

    res.status(201).json({ workspace });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace.' });
  }
});

// POST /api/workspaces/switch - Switch active workspace
router.post('/switch', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Target workspaceId is required.' });

    const target = await Workspace.findById(workspaceId);
    if (!target) return res.status(404).json({ error: 'Workspace not found.' });

    if (req.user) {
      req.user.active_workspace_id = target._id;
      await req.user.save();
    }

    res.json({ message: 'Switched workspace context.', workspace: target });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch workspace.' });
  }
});

// PATCH /api/workspaces/settings - Update currency or settings
router.patch('/settings', authenticateAndScopeTenant, async (req, res) => {
  try {
    const { currency, timezone } = req.body;
    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

    if (currency && ['USD', 'INR', 'EUR'].includes(currency)) {
      workspace.settings.currency = currency;
    }
    if (timezone) {
      workspace.settings.timezone = timezone;
    }

    await workspace.save();
    res.json({ message: 'Workspace settings updated.', settings: workspace.settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// POST /api/workspaces/purge - Purge imported data in current workspace
router.post('/purge', authenticateAndScopeTenant, async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    await DailyCampaignMetric.deleteMany({ workspace_id: workspaceId });
    await ImportJob.deleteMany({ workspace_id: workspaceId });
    await CustomerCohort.deleteMany({ workspace_id: workspaceId });

    res.json({ message: 'All workspace analytics data purged cleanly.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to purge workspace data.' });
  }
});

// POST /api/workspaces/reset-demo - Re-seed synthetic dataset
router.post('/reset-demo', authenticateAndScopeTenant, async (req, res) => {
  try {
    await seedDemoData(req.workspaceId);
    res.json({ message: 'Demo dataset successfully refreshed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset demo dataset.' });
  }
});

export default router;
