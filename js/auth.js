/* ═══════════════════════════════════════════
   js/auth.js — Authentication & Session
═══════════════════════════════════════════ */

const STATE = {
  currentUser: null,
  selectedAccId: null,
  cart: [],
  payMethod: 'cash',
  dashPeriod: 'day',
  editProductId: null,
  tempImg: null,
  pendingApproveId: null,
  posCategory: 'all',
  posSearch: '',
  nextProductId: 20,
  nextAccId: 10,
  nextWithdrawId: 100,
};

function buildLoginChips() {
  const el = $('acc-chips');
  if (!el) return;
  el.innerHTML = DB.accounts.map(a => `
    <div class="acc-chip" id="chip-${a.id}" onclick="selectAccount(${a.id})">
      <div class="acc-avatar ${a.role}">${a.avatar}</div>
      <div>
        <div class="acc-name">${a.name}</div>
        <div class="acc-branch">${a.branch}</div>
      </div>
      <div class="acc-role-badge badge-${a.role}">
        ${a.role === 'owner' ? 'เจ้าของร้าน' : 'ผู้จัดการสาขา'}
      </div>
    </div>`).join('');
}

function selectAccount(id) {
  STATE.selectedAccId = id;
  document.querySelectorAll('.acc-chip').forEach(c => c.classList.remove('selected'));
  const chip = $('chip-' + id);
  if (chip) chip.classList.add('selected');
  $('login-pw').focus();
}

function doLogin() {
  if (!STATE.selectedAccId) { showToast('⚠️ กรุณาเลือกบัญชีก่อน', 'warn'); return; }
  const pw  = $('login-pw').value;
  const acc = DB.accounts.find(a => a.id === STATE.selectedAccId);
  const err = $('login-error');
  if (!acc || acc.password !== pw) {
    err.style.display = 'block';
    $('login-pw').value = '';
    return;
  }
  err.style.display = 'none';
  STATE.currentUser = acc;
  $('login-screen').style.display = 'none';
  $('app').classList.add('visible');
  initApp();
}

function doLogout() {
  STATE.currentUser = null;
  STATE.cart = [];
  $('app').classList.remove('visible');
  $('login-screen').style.display = 'flex';
  $('login-pw').value = '';
  document.querySelectorAll('.acc-chip').forEach(c => c.classList.remove('selected'));
  STATE.selectedAccId = null;
}