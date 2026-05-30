/**
 * Bearer Token Auth
 * 
 * Public endpoints (no auth required):
 *   - $metadata on any service
 *   - /health
 *   - / (root info)
 */
const API_KEY = process.env.API_KEY || 'change-me';

function authenticate(req, res, next) {
  // Public endpoints — no auth needed
  if (req.path.endsWith('/$metadata')) return next();
  if (req.path === '/health') return next();
  if (req.path === '/') return next();

  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: '401',
        message: 'Unauthorized',
        details: [{ code: 'MISSING_AUTH_HEADER', message: 'Authorization: Bearer <token> required' }]
      }
    });
  }

  const token = auth.split(' ')[1];
  if (token !== API_KEY) {
    return res.status(401).json({
      error: {
        code: '401',
        message: 'Unauthorized',
        details: [{ code: 'INVALID_TOKEN', message: 'Bearer token invalid' }]
      }
    });
  }

  next();
}

module.exports = { authenticate, API_KEY };
