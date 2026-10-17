import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hezal-secret-jwt-key-2026';

/**
 * Tenant scoping & Authentication middleware.
 * Guarantees req.workspaceId is always set and verified.
 */
export async function authenticateAndScopeTenant(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Explicit workspace header override (if user switches workspace context)
    const headerWorkspaceId = req.headers['x-workspace-id'];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
          req.workspaceId = headerWorkspaceId || user.active_workspace_id?.toString();
          
          if (!req.workspaceId && user.active_workspace_id) {
            req.workspaceId = user.active_workspace_id.toString();
          }
        }
      } catch (jwtErr) {
        // Token invalid or expired
        return res.status(401).json({ error: 'Invalid or expired session token.' });
      }
    }

    // If still no workspace context (e.g. initial demo exploration or public guest view),
    // resolve to the active demo workspace or create one safely
    if (!req.workspaceId) {
      if (headerWorkspaceId) {
        req.workspaceId = headerWorkspaceId;
      } else {
        let demoWorkspace = await Workspace.findOne({ is_demo: true });
        if (!demoWorkspace) {
          demoWorkspace = await Workspace.create({
            name: 'Acme Global Marketing (Demo)',
            is_demo: true,
            settings: { currency: 'USD', timezone: 'UTC' }
          });
        }
        req.workspaceId = demoWorkspace._id.toString();
        req.isDemoContext = true;
      }
    }

    // Verify workspace exists
    const currentWorkspace = await Workspace.findById(req.workspaceId);
    if (!currentWorkspace) {
      return res.status(404).json({ error: 'Active workspace not found or inaccessible.' });
    }
    req.currentWorkspace = currentWorkspace;

    // Helper to generate guaranteed tenant-scoped query filters
    req.scopedFilter = (filter = {}) => {
      return {
        ...filter,
        workspace_id: req.workspaceId
      };
    };

    next();
  } catch (err) {
    console.error('[Tenant Middleware Error]', err);
    res.status(500).json({ error: 'Internal server error resolving tenant context.' });
  }
}
