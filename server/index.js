const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const { corsPolicy } = require('./middleware/corsPolicy');

const app = express();
app.use(corsPolicy);
app.use(express.json({ limit: '2mb' }));

app.use('/api/trip', require('./routes/trip'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/parse', require('./routes/parse'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// Lightweight: no DB call. Used by Render's health check and the client warm-up ping.
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));

// Production: serve the built client
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'נתיב לא קיים' }));

// Central error handler — Hebrew messages everywhere
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.status ? err.message : 'אירעה שגיאה בשרת — נסו שוב' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] Thailand Trip API רץ על פורט ${PORT}`);
  });
}

module.exports = app;
