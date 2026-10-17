import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { authenticateAndScopeTenant } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hezal-secret-jwt-key-2026';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, workspaceName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialWorkspace = await Workspace.create({
      name: workspaceName || `${name}'s Workspace`,
      is_demo: false,
      settings: { currency: 'USD', timezone: 'UTC' }
    });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      active_workspace_id: initialWorkspace._id
    });

    initialWorkspace.owner_user_id = user._id;
    await initialWorkspace.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, workspaceId: initialWorkspace._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        activeWorkspace: initialWorkspace
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    let activeWorkspace = null;
    if (user.active_workspace_id) {
      activeWorkspace = await Workspace.findById(user.active_workspace_id);
    }
    if (!activeWorkspace) {
      activeWorkspace = await Workspace.findOne({ owner_user_id: user._id });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, workspaceId: activeWorkspace?._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        activeWorkspace
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateAndScopeTenant, async (req, res) => {
  res.json({
    user: req.user ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    } : {
      id: 'guest',
      name: 'Demo Analyst',
      email: 'demo@hezal.io'
    },
    workspace: req.currentWorkspace,
    isDemo: Boolean(req.isDemoContext || req.currentWorkspace?.is_demo)
  });
});

export default router;
