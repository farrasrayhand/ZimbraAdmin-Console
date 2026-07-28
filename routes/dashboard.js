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
    const [accountsResult, cosList, serviceStatus, mailQueue, domains, quotaMap] = await Promise.all([
      client.searchAccounts('cn=*', 5000, 0).catch(() => ({ accounts: [], total: 0 })),
      client.getCosList().catch(() => []),
      client.getServiceStatus().catch(() => []),
      client.getMailQueueSummary().catch(() => ({ total: 0, active: 0, deferred: 0, hold: 0 })),
      client.getAllDomains().catch(() => []),
      client.getQuotaUsage().catch(() => ({})),
    ]);

    const quotaCount = Object.keys(quotaMap).length;
    const totalAccounts = Math.max(accountsResult.total || 0, accountsResult.accounts.length || 0, quotaCount || 0);

    res.render('dashboard', {
      title: 'Dashboard - Zimbra Mobile Admin',
      activeTab: 'dashboard',
      totalAccounts,
      cosList,
      serviceStatus,
      mailQueue,
      domains,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard', {
      title: 'Dashboard - Zimbra Mobile Admin',
      activeTab: 'dashboard',
      totalAccounts: 0,
      cosList: [],
      serviceStatus: [],
      mailQueue: { total: 0, active: 0, deferred: 0, hold: 0 },
      domains: [],
    });
  }
});

module.exports = router;
