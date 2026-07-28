const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'zimbra-admin-mobile-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 3600000,
  },
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.error = req.session.error || null;
  res.locals.success = req.session.success || null;
  delete req.session.error;
  delete req.session.success;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.zimbraToken) {
    return res.redirect('/login');
  }
  next();
}

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const accountRoutes = require('./routes/accounts');
const domainRoutes = require('./routes/domains');
const queueRoutes = require('./routes/queue');

app.use('/', authRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/accounts', requireAuth, accountRoutes);
app.use('/domains', requireAuth, domainRoutes);
app.use('/queue', requireAuth, queueRoutes);

app.get('/', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

app.use((req, res) => {
  res.status(404).render('error', { title: '404 Not Found', message: 'Page not found' });
});

app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).render('error', { title: 'Error', message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Zimbra Admin Mobile running on http://0.0.0.0:${PORT}`);
});
