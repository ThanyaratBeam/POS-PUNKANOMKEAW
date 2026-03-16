/* ═══════════════════════════════════════
   firebase-config.js  v2  (fixed)
═══════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB_QV3RyJ4b3ZcJO5ATT7VOrG-HegsvgYo",
  authDomain:        "punkanomkeaw-pos.firebaseapp.com",
  databaseURL:       "https://punkanomkeaw-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "punkanomkeaw-pos",
  storageBucket:     "punkanomkeaw-pos.firebasestorage.app",
  messagingSenderId: "1060626505075",
  appId:             "1:1060626505075:web:5e8a889767a5f78b5c7906",
};

let _fbDb          = null;
let _fbOnline      = false;
let _fbInitialized = false;

function initFirebase() {
  try {
    if (_fbInitialized) return _fbOnline;
    _fbInitialized = true;
    if (!firebase?.apps?.length) firebase.initializeApp(FIREBASE_CONFIG);
    _fbDb     = firebase.database();
    _fbOnline = true;
    updateSyncStatus('connected');
    return true;
  } catch(e) {
    console.warn('Firebase init error:', e.message);
    _fbOnline = false;
    updateSyncStatus('error');
    return false;
  }
}

function isFirebaseReady() { return _fbOnline && _fbDb !== null; }

function updateSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    connected: { text:'☁️ ซิงค์แล้ว',      color:'var(--success)'   },
    syncing:   { text:'🔄 กำลังซิงค์...',   color:'var(--warning)'   },
    offline:   { text:'📵 Offline',          color:'var(--text-muted)'},
    error:     { text:'⚠️ ซิงค์ไม่ได้',     color:'var(--danger)'    },
  };
  const s = map[status] || map.offline;
  el.textContent   = s.text;
  el.style.color   = s.color;
  el.style.display = 'block';
}

function serializeForFB(obj) {
  return JSON.parse(JSON.stringify(obj, (k,v) => v instanceof Date ? v.toISOString() : v));
}
function deserializeDates(arr, dateFields=['time']) {
  return (arr||[]).map(item => {
    const out = {...item};
    dateFields.forEach(f => { if(out[f]) out[f] = new Date(out[f]); });
    return out;
  });
}

async function pushAllToFirebase() {
  if (!isFirebaseReady()) return;
  updateSyncStatus('syncing');
  try {
    await _fbDb.ref('pos').set(serializeForFB({
      products:      DB.products,
      accounts:      DB.accounts.map(a => ({...a, online:false})),
      sales:         DB.sales,
      withdrawals:   DB.withdrawals,
      notifications: DB.notifications,
      stockLogs:     DB.stockLogs,
      customers:     DB.customers,
      shifts:        DB.shifts,
      comments:      DB.comments,
      reviews:       DB.reviews,
      _lastPush:     Date.now(),
    }));
    updateSyncStatus('connected');
    showToast('☁️ อัปโหลดข้อมูลสำเร็จ!', 'ok');
  } catch(e) {
    console.warn('pushAllToFirebase error:', e);
    updateSyncStatus('error');
  }
}

function listenFirebase() {
  if (!isFirebaseReady()) return;

  _fbDb.ref('pos/products').on('value', snap => {
    const data = snap.val(); if (!data) return;
    DB.products = (Array.isArray(data) ? data : Object.values(data)).map(p => ({ reviews:[], ...p }));
    saveLocalOnly();
    const pg = document.querySelector('.nav-item.active')?.dataset.page;
    if (pg==='pos')      applyPosFilter?.();
    if (pg==='products') renderProducts?.();
    if (pg==='stock')    renderStockOverview?.();
  });

  _fbDb.ref('pos/sales').on('value', snap => {
    const data = snap.val(); if (data===null) return;
    DB.sales = deserializeDates(Array.isArray(data) ? data : Object.values(data));
    saveLocalOnly();
    const pg = document.querySelector('.nav-item.active')?.dataset.page;
    if (pg==='hist') renderHistory?.();
    if (pg==='dash') renderDashboard?.();
    updateSyncStatus('connected');
  });

  _fbDb.ref('pos/withdrawals').on('value', snap => {
    const data = snap.val(); if (data===null) return;
    DB.withdrawals = deserializeDates(Array.isArray(data) ? data : Object.values(data));
    saveLocalOnly();
    updateWithdrawBadge?.();
    const pg = document.querySelector('.nav-item.active')?.dataset.page;
    if (pg==='withdraw') renderWithdraw?.();
  });

  _fbDb.ref('pos/customers').on('value', snap => {
    const data = snap.val(); if (data===null) return;
    DB.customers = (Array.isArray(data) ? data : Object.values(data))
      .map(c => ({...c, lastVisit: c.lastVisit ? new Date(c.lastVisit) : null}));
    saveLocalOnly();
    const pg = document.querySelector('.nav-item.active')?.dataset.page;
    if (pg==='customers') renderCustomers?.();
  });

  _fbDb.ref('pos/notifications').on('value', snap => {
    const data = snap.val(); if (data===null) return;
    DB.notifications = deserializeDates(Array.isArray(data) ? data : Object.values(data));
    saveLocalOnly();
    updateNotifications?.();
  });

  _fbDb.ref('pos/accounts').on('value', snap => {
    const data = snap.val(); if (!data) return;
    const remote = Array.isArray(data) ? data : Object.values(data);
    remote.forEach(fa => {
      const local = DB.accounts.find(a => a.id === fa.id);
      if (local) {
        local.name   = fa.name   || local.name;
        local.branch = fa.branch || local.branch;
        local.role   = ['owner','manager','staff'].includes(fa.role) ? fa.role : local.role;
        local.email  = fa.email  || local.email;
        local.avatar = fa.avatar || local.avatar;
      } else if (fa.id && fa.username) {
        DB.accounts.push({ ...fa, password:'', online:false });
      }
    });
    saveLocalOnly();
    const pg = document.querySelector('.nav-item.active')?.dataset.page;
    if (pg==='accounts') renderAccounts?.();
    buildBranchStep?.();
  });

  updateSyncStatus('connected');
}

function setupPresence(userId) {
  if (!isFirebaseReady()) return;
  const userRef = _fbDb.ref(`presence/${userId}`);
  const connRef = _fbDb.ref('.info/connected');
  const u       = DB.accounts.find(a => a.id === userId);

  connRef.on('value', snap => {
    if (!snap.val()) return;
    userRef.onDisconnect().set({
      online:false, userId,
      name:   u?.name   || '',
      branch: u?.branch || '',
      lastSeen: firebase.database.ServerValue.TIMESTAMP,
    });
    userRef.set({
      online:true, userId,
      name:   u?.name   || '',
      branch: u?.branch || '',
      lastSeen: firebase.database.ServerValue.TIMESTAMP,
    });
  });
}

function listenPresence() {
  if (!isFirebaseReady()) return;
  _fbDb.ref('presence').on('value', snap => {
    const data = snap.val() || {};
    DB.accounts.forEach(a => {
      const p    = data[a.id];
      a.online   = p?.online === true;
      a.lastSeen = p?.lastSeen ? new Date(p.lastSeen) : a.lastSeen;
    });
    saveLocalOnly();
    if (getCurrentUser?.()?.role === 'owner') {
      updateOnlineBanner?.();
      const pg = document.querySelector('.nav-item.active')?.dataset.page;
      if (pg==='accounts') renderAccounts?.();
    }
    buildBranchStep?.();
  });
}

function fbWrite(path, data) {
  if (!isFirebaseReady()) return Promise.resolve();
  updateSyncStatus('syncing');
  return _fbDb.ref(path).set(serializeForFB(data))
    .then(()  => updateSyncStatus('connected'))
    .catch(e  => { console.warn('fbWrite error:', e); updateSyncStatus('error'); });
}

function syncSales()         { return fbWrite('pos/sales',         DB.sales); }
function syncProducts()      { return fbWrite('pos/products',      DB.products); }
function syncWithdrawals()   { return fbWrite('pos/withdrawals',   DB.withdrawals); }
function syncCustomers()     { return fbWrite('pos/customers',     DB.customers); }
function syncNotifications() { return fbWrite('pos/notifications', DB.notifications); }
function syncAccounts()      { return fbWrite('pos/accounts',      DB.accounts.map(a=>({...a,online:false}))); }
function syncStockLogs()     { return fbWrite('pos/stockLogs',     DB.stockLogs.slice(0,200)); }

function saveLocalOnly() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
  catch(e) { console.warn('saveLocalOnly error:', e); }
}

window._fbSyncQueue = new Set();

function fbSaveDB(collections=['sales']) {
  if (!isFirebaseReady()) return;
  (collections||[]).forEach(c => window._fbSyncQueue.add(c));
  clearTimeout(window._fbDebounce);
  window._fbDebounce = setTimeout(() => {
    updateSyncStatus('syncing');
    const promises = [];
    if (window._fbSyncQueue.has('sales'))         promises.push(syncSales());
    if (window._fbSyncQueue.has('products'))      promises.push(syncProducts());
    if (window._fbSyncQueue.has('withdrawals'))   promises.push(syncWithdrawals());
    if (window._fbSyncQueue.has('customers'))     promises.push(syncCustomers());
    if (window._fbSyncQueue.has('notifications')) promises.push(syncNotifications());
    if (window._fbSyncQueue.has('accounts'))      promises.push(syncAccounts());
    if (window._fbSyncQueue.has('stockLogs'))     promises.push(syncStockLogs());
    window._fbSyncQueue.clear();
    Promise.all(promises).then(() => updateSyncStatus('connected'));
  }, 600);
}

/* ── fbQueueSync (called from saveDB in data.js) ── */
window.fbQueueSync = function(collections) {
  fbSaveDB(collections || ['sales','products','withdrawals','customers','notifications','stockLogs']);
};