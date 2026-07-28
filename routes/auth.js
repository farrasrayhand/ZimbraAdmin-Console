const express = require('express');
const router = express.Router();
const { ZimbraAdmin } = require('../lib/zimbra');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', {
    title: 'Login - Zimbra Admin',
    savedServer: req.cookies.zimbraServer || '',
  });
});

router.post('/login', async (req, res) => {
  const { username, password, server, rememberServer } = req.body;

  if (rememberServer && server) {
    res.cookie('zimbraServer', server, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
    });
  } else {
    res.clearCookie('zimbraServer');
  }

  if (!username || !password) {
    req.session.error = 'Username dan password harus diisi';
    return res.redirect('/login');
  }

  try {
    const zimbra = new ZimbraAdmin(server || undefined);
    const authResult = await zimbra.auth(username, password);

    req.session.user = { username, accountId: authResult.accountId };
    req.session.zimbraToken = authResult.token;
    req.session.zimbraServer = server || undefined;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login failed:', err.reason || err.message || err);
    req.session.error = 'Login gagal: ' + (err.reason || err.message || 'Periksa username, password & URL server.');
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
