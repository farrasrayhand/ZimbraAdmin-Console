const express = require('express');
const router = express.Router();
const { ZimbraAdmin } = require('../lib/zimbra');

function getClient(req) {
  const client = new ZimbraAdmin(req.session.zimbraServer);
  client.authToken = req.session.zimbraToken;
  return client;
}

router.get('/', async (req, res) => {
  const query = req.query.q || '';
  const domainFilter = req.query.domain || '';
  const statusFilter = req.query.status || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    const client = getClient(req);
    let searchQuery = 'cn=*';
    if (query && query.trim()) {
      const qClean = query.trim().replace(/[\(\)\\]/g, '');
      if (qClean) {
        searchQuery = `(|(mail=*${qClean}*)(zimbraMailAlias=*${qClean}*)(zimbraMailDeliveryAddress=*${qClean}*)(cn=*${qClean}*)(displayName=*${qClean}*)(sn=*${qClean}*))`;
      }
    }
    if (statusFilter) {
      searchQuery = `(&${searchQuery}(zimbraAccountStatus=${statusFilter}))`;
    }

    const [result, domains, cosList] = await Promise.all([
      client.searchAccounts(searchQuery, limit, offset, domainFilter),
      client.getAllDomains().catch(() => []),
      client.getCosList().catch(() => []),
    ]);

    // Direct account fallback if LDAP search returns 0 results for a specific email/user
    if (query && (!result.accounts || result.accounts.length === 0)) {
      try {
        const exactAcct = await client.getAccountInfo(query.trim());
        if (exactAcct && exactAcct.name) {
          const quotaBytes = exactAcct.quotaBytes || 0;
          const usedBytes = exactAcct.usedBytes || 0;
          result.accounts = [{
            id: exactAcct.id,
            name: exactAcct.name,
            displayName: exactAcct.displayName || exactAcct.name,
            status: exactAcct.status || 'active',
            quotaMB: exactAcct.quotaMB || '0',
            usedQuotaMB: exactAcct.usedQuotaMB || '0.0',
            quotaBytes,
            usedBytes,
            cosId: exactAcct.cosId || '',
            aliases: exactAcct.aliases || [],
          }];
          result.total = 1;
        }
      } catch (fallbackErr) {
        console.log('Exact account lookup fallback:', fallbackErr.reason || fallbackErr.message);
      }
    }

    let totalPages = Math.ceil(result.total / limit);
    if (result.more && page >= totalPages) {
      totalPages = page + 1;
    }
    totalPages = Math.max(1, totalPages);

    res.render('accounts/index', {
      title: 'Daftar Akun - Zimbra Mobile Admin',
      activeTab: 'accounts',
      accounts: result.accounts,
      total: result.total,
      moreAccounts: result.more,
      query,
      domainFilter,
      statusFilter,
      domains,
      cosList,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error('Search error:', err);
    req.session.error = 'Gagal mencari akun: ' + (err.reason || err.message || 'Unknown error');
    res.redirect('/accounts');
  }
});

router.get('/create', async (req, res) => {
  try {
    const client = getClient(req);
    const [domains, cosList] = await Promise.all([
      client.getAllDomains().catch(() => []),
      client.getCosList().catch(() => []),
    ]);

    res.render('accounts/create', {
      title: 'Buat Akun Baru - Zimbra Mobile Admin',
      activeTab: 'accounts',
      domains,
      cosList,
    });
  } catch (err) {
    res.render('accounts/create', {
      title: 'Buat Akun Baru - Zimbra Mobile Admin',
      activeTab: 'accounts',
      domains: [],
      cosList: [],
    });
  }
});

router.post('/create', async (req, res) => {
  const { name, domain, password, givenName, initials, sn, displayName, cosId, quotaMB, mustChangePassword } = req.body;

  if (!name || !password) {
    req.session.error = 'Email dan password harus diisi';
    return res.redirect('/accounts/create');
  }

  if (!sn || !sn.trim()) {
    req.session.error = 'Nama belakang (Last Name / sn) wajib diisi sesuai kebijakan Zimbra';
    return res.redirect('/accounts/create');
  }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    req.session.error = 'Password tidak memenuhi kebijakan server Zimbra (wajib memuat huruf besar A-Z, huruf kecil a-z, angka 0-9, dan simbol !@#$)';
    return res.redirect('/accounts/create');
  }

  const fullEmail = domain && !name.includes('@') ? `${name}@${domain}` : name;

  try {
    const client = getClient(req);
    const attrs = {};
    if (sn && sn.trim()) attrs.sn = sn.trim();
    if (givenName && givenName.trim()) attrs.givenName = givenName.trim();
    if (initials && initials.trim()) attrs.initials = initials.trim();

    const computedDisplayName = (displayName && displayName.trim())
      ? displayName.trim()
      : [givenName, initials ? (initials.length <= 2 && !initials.endsWith('.') ? initials + '.' : initials) : '', sn].filter(Boolean).join(' ');
    
    if (computedDisplayName) attrs.displayName = computedDisplayName;
    if (cosId && cosId.trim()) attrs.zimbraCOSId = cosId.trim();
    if (quotaMB && parseInt(quotaMB) > 0) attrs.zimbraMailQuota = parseInt(quotaMB) * 1048576;
    attrs.zimbraPasswordMustChange = (mustChangePassword === 'TRUE' || mustChangePassword === '1') ? 'TRUE' : 'FALSE';

    await client.createAccount(fullEmail, password, attrs);
    req.session.success = `Akun ${fullEmail} berhasil dibuat!`;
    res.redirect('/accounts?q=' + encodeURIComponent(fullEmail));
  } catch (err) {
    console.error('Create error:', err);
    req.session.error = 'Gagal membuat akun: ' + (err.reason || err.message || 'Periksa format email/password');
    res.redirect('/accounts/create');
  }
});

router.get('/:accountName', async (req, res) => {
  try {
    const client = getClient(req);
    const account = await client.getAccountInfo(req.params.accountName);

    let cosList = [];
    try {
      cosList = await client.getCosList();
    } catch {}

    res.render('accounts/detail', {
      title: `${account.name} - Zimbra Mobile Admin`,
      activeTab: 'accounts',
      account,
      cosList,
    });
  } catch (err) {
    console.error('Detail error:', err);
    req.session.error = 'Gagal memuat akun: ' + (err.reason || err.message || 'Akun tidak ditemukan');
    res.redirect('/accounts');
  }
});

router.post('/:accountName/password', async (req, res) => {
  const { newPassword, mustChangePassword } = req.body;

  if (!newPassword) {
    req.session.error = 'Password baru harus diisi';
    return res.redirect(`/accounts/${encodeURIComponent(req.params.accountName)}`);
  }

  try {
    const client = getClient(req);
    await client.setPassword(req.params.accountName, newPassword);
    const mustChange = (mustChangePassword === 'TRUE' || mustChangePassword === '1') ? 'TRUE' : 'FALSE';
    await client.modifyAccount(req.params.accountName, { zimbraPasswordMustChange: mustChange });
    
    req.session.success = 'Password berhasil diubah!';
    res.redirect(`/accounts/${encodeURIComponent(req.params.accountName)}`);
  } catch (err) {
    console.error('Password change error:', err);
    req.session.error = 'Gagal mengubah password: ' + (err.reason || err.message || 'Unknown error');
    res.redirect(`/accounts/${encodeURIComponent(req.params.accountName)}`);
  }
});

router.post('/:accountName/status', async (req, res) => {
  const { status } = req.body;
  const accountName = req.params.accountName;

  if (!status) {
    return res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }

  try {
    const client = getClient(req);
    await client.modifyAccount(accountName, { zimbraAccountStatus: status });
    req.session.success = `Status akun diubah menjadi ${status.toUpperCase()}`;
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  } catch (err) {
    console.error('Status change error:', err);
    req.session.error = 'Gagal mengubah status akun: ' + (err.reason || err.message || 'Unknown error');
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }
});

router.post('/:accountName/modify', async (req, res) => {
  const { givenName, initials, sn, displayName, cosId, quotaMB, mustChangePassword } = req.body;
  const accountName = req.params.accountName;

  try {
    const client = getClient(req);
    const attrs = {};
    if (givenName !== undefined) attrs.givenName = givenName.trim();
    if (initials !== undefined) attrs.initials = initials.trim();
    if (sn !== undefined && sn.trim()) attrs.sn = sn.trim();
    if (displayName !== undefined) attrs.displayName = displayName.trim();
    if (cosId && cosId.trim()) attrs.zimbraCOSId = cosId.trim();
    if (quotaMB !== undefined && quotaMB !== '') {
      attrs.zimbraMailQuota = parseInt(quotaMB) * 1048576;
    }
    attrs.zimbraPasswordMustChange = (mustChangePassword === 'TRUE' || mustChangePassword === '1') ? 'TRUE' : 'FALSE';

    await client.modifyAccount(accountName, attrs);
    req.session.success = 'Info profil & akun berhasil diperbarui!';
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  } catch (err) {
    console.error('Modify error:', err);
    req.session.error = 'Gagal mengubah akun: ' + (err.reason || err.message || 'Unknown error');
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }
});

router.post('/:accountName/alias/add', async (req, res) => {
  const { alias } = req.body;
  const accountName = req.params.accountName;

  if (!alias) {
    req.session.error = 'Alamat alias email tidak boleh kosong';
    return res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }

  try {
    const client = getClient(req);
    await client.addAccountAlias(accountName, alias);
    req.session.success = `Alias ${alias} berhasil ditambahkan!`;
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  } catch (err) {
    console.error('Add alias error:', err);
    req.session.error = 'Gagal menambah alias: ' + (err.reason || err.message || 'Format alias tidak valid');
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }
});

router.post('/:accountName/alias/remove', async (req, res) => {
  const { alias } = req.body;
  const accountName = req.params.accountName;

  try {
    const client = getClient(req);
    await client.removeAccountAlias(accountName, alias);
    req.session.success = `Alias ${alias} berhasil dihapus!`;
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  } catch (err) {
    console.error('Remove alias error:', err);
    req.session.error = 'Gagal menghapus alias: ' + (err.reason || err.message || 'Unknown error');
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }
});

router.post('/:accountName/delete', async (req, res) => {
  const { confirmEmail } = req.body;
  const accountName = req.params.accountName;

  if (confirmEmail !== accountName) {
    req.session.error = 'Konfirmasi tidak cocok. Ketik email yang benar untuk menghapus.';
    return res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }

  try {
    const client = getClient(req);
    await client.deleteAccount(accountName);
    req.session.success = `Akun ${accountName} berhasil dihapus!`;
    res.redirect('/accounts');
  } catch (err) {
    console.error('Delete error:', err);
    req.session.error = 'Gagal menghapus akun: ' + (err.reason || err.message || 'Unknown error');
    res.redirect(`/accounts/${encodeURIComponent(accountName)}`);
  }
});

module.exports = router;
