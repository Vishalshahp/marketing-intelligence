import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Root Landing & Status Route
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Hezal API Gateway</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F7FB; color: #182230; margin: 0; padding: 40px 20px; }
          .card { max-width: 650px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .badge { display: inline-block; background: #EDF7F1; color: #16804A; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
          h1 { margin: 0 0 8px 0; font-size: 24px; color: #14243A; }
          p { color: #667085; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          .btn { display: inline-block; background: #356AE6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-bottom: 24px; }
          .btn:hover { background: #2954C2; }
          .endpoints { border-top: 1px solid #E2E8F0; padding-top: 20px; }
          .endpoints h3 { font-size: 13px; text-transform: uppercase; color: #667085; margin: 0 0 12px 0; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { margin-bottom: 8px; }
          a.ep { color: #356AE6; text-decoration: none; font-family: monospace; font-size: 13px; }
          a.ep:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● API Gateway Online (Port 5000)</div>
          <h1>Hezal Marketing Intelligence API</h1>
          <p>The backend API server is operational. The full interactive web dashboard is running on port <strong>5173</strong>.</p>
          <a href="http://localhost:5173" class="btn">Open Web Application (http://localhost:5173) &rarr;</a>
          
          <div class="endpoints">
            <h3>Key REST API Endpoints</h3>
            <ul>
              <li><a class="ep" href="/api/health">GET /api/health</a> - Health check</li>
              <li><a class="ep" href="/api/metrics/overview">GET /api/metrics/overview</a> - Deterministic KPI overview</li>
              <li><a class="ep" href="/api/metrics/trends">GET /api/metrics/trends</a> - Daily time-series trends</li>
              <li><a class="ep" href="/api/campaigns">GET /api/campaigns</a> - Campaign comparative matrix</li>
              <li><a class="ep" href="/api/recommendations">GET /api/recommendations</a> - 5-tuple heuristic cards</li>
              <li><a class="ep" href="/api/customer-segments">GET /api/customer-segments</a> - RFM K-Means clustering</li>
              <li><a class="ep" href="/api/imports/template">GET /api/imports/template</a> - Download CSV template</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      status: 'ONLINE',
      service: 'Hezal Marketing Intelligence Platform API',
      version: '2.0.0',
      webAppUrl: 'http://localhost:5173'
    });
  }
});

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

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Project Hezal Marketing Intelligence API running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Enforcing IDOR Tenant Isolation & CSV Injection Defense`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Startup Fatal Error]', err);
    process.exit(1);
  }
}

startServer();
