const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'thailand-trip-dev-secret';

function signOrganizerToken() {
  return jwt.sign({ role: 'organizer' }, JWT_SECRET, { expiresIn: '7d' });
}

function requireOrganizer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'נדרשת התחברות כמארגן' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'organizer') throw new Error('bad role');
    next();
  } catch {
    return res.status(401).json({ error: 'ההתחברות פגה — התחברו מחדש כמארגן' });
  }
}

module.exports = { signOrganizerToken, requireOrganizer };
