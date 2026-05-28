/**
 * Role-based access control middleware factory.
 * @param {string[]} roles - Array of allowed roles
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = checkRole;
