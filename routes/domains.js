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
    const [domains, cosList] = await Promise.all([
      client.getAllDomains().catch(() => []),
      client.getCosList().catch(() => []),
    ]);

    res.render('domains/index', {
      title: 'Domain & COS - Zimbra Mobile Admin',
      activeTab: 'domains',
      domains,
      cosList,
    });
  } catch (err) {
    console.error('Domains route error:', err);
    res.render('domains/index', {
      title: 'Domain & COS - Zimbra Mobile Admin',
      activeTab: 'domains',
      domains: [],
      cosList: [],
    });
  }
});

module.exports = router;
