import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { Workspace } from './models/Workspace.js';
import { DailyCampaignMetric } from './models/DailyCampaignMetric.js';
import { seedDemoData } from './scripts/seed.js';

import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import importRoutes from './routes/importRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Hezal Marketing Intelligence Platform API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Core API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/metrics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/reports', reportRoutes);

// Direct blueprint aliases for recommendations and customer segments
app.get('/api/recommendations', (req, res, next) => {
  req.url = '/recommendations';
  analyticsRoutes(req, res, next);
});

app.get('/api/customer-segments', (req, res, next) => {
  req.url = '/customer-segments';
  analyticsRoutes(req, res, next);
});

// Serve Frontend Static Assets
app.use(express.static(clientDistPath));

// SPA Fallback: Any non-API route serves the frontend index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled API Exception]', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: err.message
  });
});

// Initialize Database & Server
async function startServer() {
  try {
    await connectDB();

    // Check if initial demo workspace exists, if not seed it automatically
    const existingDemo = await Workspace.findOne({ is_demo: true });
    const metricCount = await DailyCampaignMetric.countDocuments();

    if (!existingDemo || metricCount === 0) {
      console.log('[Init] No existing demo dataset found. Running initial 90-day seed...');
      await seedDemoData();
    } else {
      console.log(`[Init] Existing dataset verified (${metricCount} daily metrics found).`);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Project Hezal Full-Stack Platform running`);
      console.log(`📡 URL: http://0.0.0.0:${PORT}`);
      console.log(`🛡️  Serving Frontend & Backend unified on port ${PORT}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Startup Fatal Error]', err);
    process.exit(1);
  }
}

startServer();
