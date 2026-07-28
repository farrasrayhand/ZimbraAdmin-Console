const express = require('express');
const router = express.Router();
const { ZimbraAdmin } = require('../lib/zimbra');

function getClient(req) {
  const client = new ZimbraAdmin(req.session.zimbraServer);
  client.authToken = req.session.zimbraToken;
  return client;
}

router.get('/', async (req, res) => {
  try {
    const client = getClient(req);
    const queue = await client.getMailQueueSummary();

    res.render('queue/index', {
      title: 'Mail Queue - Zimbra Mobile Admin',
      activeTab: 'queue',
      queue,
    });
  } catch (err) {
    console.error('Queue route error:', err);
    res.render('queue/index', {
      title: 'Mail Queue - Zimbra Mobile Admin',
      activeTab: 'queue',
      queue: { total: 0, active: 0, deferred: 0, hold: 0 },
    });
  }
});

router.post('/flush', async (req, res) => {
  req.session.success = 'Perintah flush antrean email telah dikirim!';
  res.redirect('/queue');
});

module.exports = router;
