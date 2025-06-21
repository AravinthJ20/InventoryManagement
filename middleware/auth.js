// core/middleware/auth.js
module.exports = {
  // Protect routes
  requireAuth: (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  },

  // Role-based access control
  requireRole: (role) => (req, res, next) => {
    if (req.session.user?.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  }
};