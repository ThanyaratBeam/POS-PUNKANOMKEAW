/* ═══════════════════════════════════════════
   js/app.js — Main App Logic
═══════════════════════════════════════════ */

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
  });
  initClock();
  buildLoginChips();
});

document.addEventListener('click', e => {
  if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) closeNotifPanel();
});

// ── Clock ──
function initClock() {
  const tick = () => {
    const n = new Date();
    const clk = $('sb-clock');
    const dt  = $('sb-date');
    if (clk) clk.textContent = n.toLocaleTimeString('th-TH');
    if (dt)  dt.textContent  = n.toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  };
  tick();
  setInterval(tick, 1000);
}

// ── App Init ──
function initApp() {
  const u = STATE.currentUser;
  const isOwner = u.role === 'owner';
  $('user-avatar').textContent = u.avatar;
  $('user-avatar').style.background = isOwner
    ? 'linear-gradient(135deg,#1aaa5e,#0f8f4c)'
    : 'linear-gradient(135deg,#3cc47a,#1aaa5e)';
  $('user-name').textContent = u.name;
  $('user-role').textContent = isOwner ? 'เจ้าของร้าน — คลังกลาง' : 'ผู้จัดการ — ' + u.branch;
  $('admin-nav').style.display = isOwner ? 'block' : 'none';
  navigate('pos');
  updateWithdrawBadge();
}

// ── Navigation ──
const PAGE_RENDER = {
  pos:      renderPOS,
  dash:     renderDashboard,
  hist:     renderHistory,
  products: renderProducts,
  stock:    renderStockOverview,
  withdraw: renderWithdraw,
  accounts: renderAccounts,
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = $('page-' + page);
  const ni = document.querySelector(`[data-page="${page}"]`);
  if (pg) pg.classList.add('active');
  if (ni) ni.classList.add('active');
  closeNotifPanel();
  PAGE_RENDER[page]?.();
}

// ══════════════════════════════════════════════
// POS
// ══════════════════════════════════════════════
function renderPOS() {
  const cats = [...new Set(DB.products.map(p => p.cat))];
  $('pos-cats').innerHTML =
    `<div class="cat-tab active" onclick="setPosCategory('all',this)">ทั้งหมด</div>` +
    cats.map(c => `<div class="cat-tab" onclick="setPosCategory('${c}',this)">${catIcon(c)} ${c}</div>`).join('');
  applyPosFilter();
}

function setPosCategory(cat, el) {
  STATE.posCategory = cat;
  document.querySelectorAll('#pos-cats .cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  applyPosFilter();
}

function onPosSearch(q) { STATE.posSearch = q.toLowerCase(); applyPosFilter(); }

function applyPosFilter() {
  const uid = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  let list = DB.products;
  if (STATE.posCategory !== 'all') list = list.filter(p => p.cat === STATE.posCategory);
  if (STATE.posSearch) list = list.filter(p => p.name.toLowerCase().includes(STATE.posSearch));
  const el = $('pos-product-grid');
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="ei">🔍</div><p>ไม่พบสินค้า</p></div>'; return; }
  el.innerHTML = list.map(p => {
    const stk = isOwner ? p.centralStock : (p.branchStock[uid] || 0);
    const low = stk > 0 && stk <= 5;
    const out = stk === 0;
    return `
      <div class="product-card${out ? ' out-of-stock' : ''}" onclick="addToCart(${p.id})">
        <div class="product-card-img">
          ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span>${catIcon(p.cat)}</span>`}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-price">฿${fmt(p.price)}</div>
          <div class="product-card-stock${out ? ' out' : low ? ' low' : ''}">
            ${out ? '❌ หมดสต็อก' : low ? `⚠️ เหลือ ${stk}` : `คงเหลือ ${stk}`}
          </div>
        </div>
      </div>`;
  }).join('');
}

function addToCart(productId) {
  const uid = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  const p = DB.products.find(x => x.id === productId);
  if (!p) return;
  const stk = isOwner ? p.centralStock : (p.branchStock[uid] || 0);
  if (stk === 0) { showToast('❌ ไม่มีสต็อก', 'err'); return; }
  const ci = STATE.cart.find(x => x.id === productId);
  if (ci) {
    if (ci.qty < stk) ci.qty++;
    else { showToast('⚠️ สต็อกไม่พอ', 'warn'); return; }
  } else {
    STATE.cart.push({ id: productId, name: p.name, price: p.price, qty: 1 });
  }
  renderCart();
}

function renderCart() {
  const el = $('cart-body');
  if (!STATE.cart.length) {
    el.innerHTML = '<div class="cart-empty"><div class="ei">🛒</div><p>ยังไม่มีสินค้า</p></div>';
    $('cart-total-value').textContent = '฿0';
    return;
  }
  el.innerHTML = STATE.cart.map((ci, i) => `
    <div class="cart-item">
      <div style="flex:1">
        <div class="cart-item-name">${ci.name}</div>
        <div class="cart-item-sub">฿${fmt(ci.price)} / ชิ้น</div>
      </div>
      <div style="display:flex;align-items:center;gap:5px">
        <button class="qty-btn" onclick="changeCartQty(${i},-1)">−</button>
        <span class="qty-num">${ci.qty}</span>
        <button class="qty-btn" onclick="changeCartQty(${i},1)">+</button>
      </div>
      <div class="cart-item-price">฿${fmt(ci.price * ci.qty)}</div>
    </div>`).join('');
  const total = STATE.cart.reduce((s, c) => s + c.price * c.qty, 0);
  $('cart-total-value').textContent = '฿' + fmt(total);
}

function changeCartQty(index, delta) {
  const uid = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  const ci = STATE.cart[index];
  const p  = DB.products.find(x => x.id === ci.id);
  const stk = p ? (isOwner ? p.centralStock : (p.branchStock[uid] || 0)) : 0;
  ci.qty += delta;
  if (ci.qty <= 0) STATE.cart.splice(index, 1);
  else if (ci.qty > stk) { ci.qty = stk; showToast('⚠️ สต็อกไม่พอ', 'warn'); }
  renderCart();
}

function clearCart() { STATE.cart = []; renderCart(); }

// ══════════════════════════════════════════════
// PAYMENT
// ══════════════════════════════════════════════
function openPayment() {
  if (!STATE.cart.length) { showToast('❌ ยังไม่มีสินค้าในตะกร้า', 'err'); return; }
  const total = STATE.cart.reduce((s, c) => s + c.price * c.qty, 0);
  $('pay-item-count').textContent = STATE.cart.reduce((s,c) => s + c.qty, 0) + ' รายการ';
  $('pay-total-value').textContent = '฿' + fmt(total);
  $('pay-qr-amount').textContent   = '฿' + fmt(total);
  $('pay-received').value = '';
  $('change-box').style.display = 'none';
  selectPayMethod('cash');
  openModal('modal-payment');
}

function selectPayMethod(method) {
  STATE.payMethod = method;
  $('pay-opt-cash').classList.toggle('selected', method === 'cash');
  $('pay-opt-transfer').classList.toggle('selected', method === 'transfer');
  $('pay-cash-section').style.display    = method === 'cash'     ? 'block' : 'none';
  $('pay-transfer-section').style.display = method === 'transfer' ? 'block' : 'none';
}

function calcChange() {
  const total = STATE.cart.reduce((s, c) => s + c.price * c.qty, 0);
  const recv  = parseFloat($('pay-received').value) || 0;
  const chg   = recv - total;
  const box   = $('change-box');
  if (recv > 0) {
    box.style.display = 'block';
    $('change-value').textContent = '฿' + fmt(Math.max(0, chg));
    box.style.borderColor = chg >= 0 ? 'rgba(26,170,94,.3)' : 'rgba(224,60,82,.3)';
    $('change-value').style.color = chg >= 0 ? 'var(--pandan-600)' : 'var(--danger)';
  } else { box.style.display = 'none'; }
}

function confirmPayment() {
  const total = STATE.cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (STATE.payMethod === 'cash') {
    const recv = parseFloat($('pay-received').value) || 0;
    if (recv < total) { showToast('❌ รับเงินไม่พอ', 'err'); return; }
  }
  const uid     = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  STATE.cart.forEach(ci => {
    const p = DB.products.find(x => x.id === ci.id);
    if (!p) return;
    if (isOwner) {
      p.centralStock = Math.max(0, p.centralStock - ci.qty);
    } else {
      if (!p.branchStock[uid]) p.branchStock[uid] = 0;
      p.branchStock[uid] = Math.max(0, p.branchStock[uid] - ci.qty);
    }
  });
  DB.sales.unshift({
    id: DB.sales.length + 1,
    items: [...STATE.cart],
    total,
    method: STATE.payMethod,
    time: new Date(),
    seller: STATE.currentUser.name,
    sellerId: uid,
  });
  STATE.cart = [];
  renderCart();
  closeModal('modal-payment');
  saveDB(); // ✅
  showToast('✅ ชำระเงินสำเร็จ!', 'ok');
  applyPosFilter();
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
function setDashPeriod(period, el) {
  STATE.dashPeriod = period;
  document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDashboard();
}

function getFilteredSales() {
  const now = new Date();
  return DB.sales.filter(s => {
    const d = new Date(s.time);
    if (STATE.dashPeriod === 'day')   return d.toDateString() === now.toDateString();
    if (STATE.dashPeriod === 'week')  { const w = new Date(now); w.setDate(w.getDate()-7); return d >= w; }
    if (STATE.dashPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });
}

function renderDashboard() {
  const sales    = getFilteredSales();
  const total    = sales.reduce((s,x) => s + x.total, 0);
  const cashTot  = sales.filter(s => s.method==='cash').reduce((s,x) => s + x.total, 0);
  const tranTot  = sales.filter(s => s.method==='transfer').reduce((s,x) => s + x.total, 0);
  const itemsSold = sales.reduce((s,x) => s + x.items.reduce((a,i) => a + i.qty, 0), 0);

  $('dash-stats').innerHTML = `
    <div class="stat-card c-green"><span class="stat-icon">💰</span><div class="stat-label">ยอดขายรวม</div><div class="stat-value v-green">฿${fmt(total)}</div></div>
    <div class="stat-card c-blue"><span class="stat-icon">🧾</span><div class="stat-label">จำนวนบิล</div><div class="stat-value v-blue">${sales.length}</div></div>
    <div class="stat-card c-teal"><span class="stat-icon">📦</span><div class="stat-label">ชิ้นที่ขาย</div><div class="stat-value v-teal">${fmt(itemsSold)}</div></div>
    <div class="stat-card c-orange"><span class="stat-icon">💳</span><div class="stat-label">เฉลี่ย/บิล</div><div class="stat-value v-orange">฿${sales.length ? fmt(Math.round(total / sales.length)) : 0}</div></div>`;

  const now  = new Date();
  const days = Array.from({length:7}, (_,i) => { const d = new Date(now); d.setDate(d.getDate()-(6-i)); return d; });
  const dvals = days.map(d => DB.sales.filter(s => new Date(s.time).toDateString() === d.toDateString()).reduce((s,x) => s+x.total, 0));
  const maxV = Math.max(...dvals, 1);

  $('dash-chart').innerHTML = dvals.map((v, i) => `
    <div class="bar-col">
      <div class="bar-val">${v ? '฿' + fmt(v) : ''}</div>
      <div class="bar-inner"><div class="bar" style="height:${Math.round(v/maxV*100)}%"></div></div>
      <div class="bar-lbl">${days[i].toLocaleDateString('th-TH',{weekday:'short'})}</div>
    </div>`).join('');

  const pm = {};
  DB.sales.forEach(s => s.items.forEach(it => { pm[it.name] = (pm[it.name]||0) + it.qty * it.price; }));
  const tops = Object.entries(pm).sort((a,b) => b[1]-a[1]).slice(0,5);
  $('dash-top-products').innerHTML = tops.length
    ? tops.map(([name,val],i) => `
        <div class="mini-list-item">
          <div class="mini-rank">${i+1}</div>
          <div class="mini-name">${name}</div>
          <div class="mini-val">฿${fmt(val)}</div>
        </div>`).join('')
    : '<div class="empty-state" style="padding:20px"><p>ยังไม่มีข้อมูล</p></div>';

  $('dash-pay-breakdown').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
      <div>
        <div class="flex-row mb-1"><span style="font-size:12px;color:var(--text-secondary)">💵 เงินสด</span><div class="spacer"></div><span class="fw-bold text-green">฿${fmt(cashTot)}</span></div>
        <div style="background:rgba(26,170,94,.1);border-radius:5px;height:7px;overflow:hidden">
          <div style="background:var(--pandan-500);height:100%;border-radius:5px;width:${total ? Math.round(cashTot/total*100) : 0}%;transition:width .6s"></div>
        </div>
        <div style="font-size:10px;color:var(--text-faint);margin-top:3px">${total ? Math.round(cashTot/total*100) : 0}%</div>
      </div>
      <div>
        <div class="flex-row mb-1"><span style="font-size:12px;color:var(--text-secondary)">📱 โอนเงิน</span><div class="spacer"></div><span class="fw-bold" style="color:var(--info)">฿${fmt(tranTot)}</span></div>
        <div style="background:rgba(33,150,168,.1);border-radius:5px;height:7px;overflow:hidden">
          <div style="background:var(--info);height:100%;border-radius:5px;width:${total ? Math.round(tranTot/total*100) : 0}%;transition:width .6s"></div>
        </div>
        <div style="font-size:10px;color:var(--text-faint);margin-top:3px">${total ? Math.round(tranTot/total*100) : 0}%</div>
      </div>
    </div>`;

  const uid = STATE.currentUser.id;
  const low = DB.products.filter(p => p.centralStock <= 10 || (p.branchStock[uid]||0) <= 5);
  $('dash-low-stock').innerHTML = low.length
    ? low.slice(0,5).map(p => {
        const bs = p.branchStock[uid]||0;
        return `<div class="mini-list-item">
          <span style="font-size:20px">${catIcon(p.cat)}</span>
          <div class="mini-name">${p.name}</div>
          <div style="text-align:right">
            ${p.centralStock<=10 ? `<div style="font-size:10px;color:var(--warning)">คลัง: ${p.centralStock}</div>` : ''}
            ${bs<=5 ? `<div style="font-size:10px;color:var(--danger)">สาขา: ${bs}</div>` : ''}
          </div>
        </div>`;}).join('')
    : '<div class="empty-state" style="padding:20px"><p>✅ สต็อกปกติทั้งหมด</p></div>';
}

// ══════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════
let historySearch = '';

function renderHistory(q) {
  q = q !== undefined ? q : historySearch;
  historySearch = q || '';
  const uid = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  let list = DB.sales;
  if (!isOwner) list = list.filter(s => s.sellerId === uid);
  if (q) list = list.filter(s => s.items.some(i => i.name.toLowerCase().includes(q.toLowerCase())) || s.seller.includes(q));
  const el = $('history-content');
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="ei">📋</div><p>ไม่พบรายการ</p></div>'; return; }
  const total   = list.reduce((s,x) => s+x.total, 0);
  const cashTot = list.filter(s=>s.method==='cash').reduce((s,x)=>s+x.total,0);
  const tranTot = list.filter(s=>s.method==='transfer').reduce((s,x)=>s+x.total,0);
  el.innerHTML = `
    <div class="grid-4 mb-3">
      <div class="stat-card c-green"><div class="stat-label">ยอดขายรวม</div><div class="stat-value v-green">฿${fmt(total)}</div></div>
      <div class="stat-card c-blue"><div class="stat-label">จำนวนบิล</div><div class="stat-value v-blue">${list.length}</div></div>
      <div class="stat-card c-teal"><div class="stat-label">เงินสด</div><div class="stat-value v-teal">฿${fmt(cashTot)}</div></div>
      <div class="stat-card c-orange"><div class="stat-label">โอนเงิน</div><div class="stat-value v-orange">฿${fmt(tranTot)}</div></div>
    </div>
    <div class="glass-card table-wrap">
      <table><thead><tr>
        <th>#</th><th>สินค้า</th><th>ช่องทาง</th><th>พนักงาน</th><th>วันเวลา</th><th>ยอด</th>
      </tr></thead><tbody>` +
    list.slice(0,150).map(s => `<tr>
      <td style="color:var(--text-faint);font-size:11px">${s.id}</td>
      <td>${s.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
      <td><span class="tag ${s.method==='cash'?'tag-success':'tag-info'}">${s.method==='cash'?'💵 เงินสด':'📱 โอน'}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${s.seller}</td>
      <td style="font-size:11px;color:var(--text-muted)">${new Date(s.time).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
      <td class="fw-bold font-prompt text-green">฿${fmt(s.total)}</td>
    </tr>`).join('') +
    '</tbody></table></div>';
}

// ══════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════
function renderProducts(q) {
  if (STATE.currentUser.role !== 'owner') {
    $('page-products').innerHTML = '<div class="denied-state"><div class="di">🔒</div><h3>ไม่มีสิทธิ์เข้าถึง</h3><p>เฉพาะเจ้าของร้านเท่านั้น</p></div>';
    return;
  }
  const list = q ? DB.products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : DB.products;
  $('product-grid-mgmt').innerHTML = list.map(p => `
    <div class="product-card" style="cursor:default">
      <div class="product-card-img">${p.img ? `<img src="${p.img}">` : `<span>${catIcon(p.cat)}</span>`}</div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">฿${fmt(p.price)}</div>
        <div class="product-card-stock" style="color:var(--info)">คลัง: ${p.centralStock}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-secondary btn-xs" onclick="openEditProduct(${p.id})" style="flex:1">✏️ แก้ไข</button>
          <button class="btn btn-danger btn-xs btn-icon" onclick="deleteProduct(${p.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function openAddProduct() {
  if (STATE.currentUser.role !== 'owner') { showToast('⛔ เฉพาะเจ้าของร้าน', 'err'); return; }
  STATE.editProductId = null; STATE.tempImg = null;
  $('modal-prod-title').textContent = '➕ เพิ่มสินค้าใหม่';
  ['fp-name','fp-cat','fp-sku'].forEach(id => $(id).value = '');
  ['fp-price','fp-stock'].forEach(id => $(id).value = '');
  $('img-dropzone').innerHTML = '<span>📷</span><span>คลิกเพื่อเลือกรูป</span>';
  openModal('modal-product');
}

function openEditProduct(id) {
  if (STATE.currentUser.role !== 'owner') { showToast('⛔ เฉพาะเจ้าของร้าน', 'err'); return; }
  const p = DB.products.find(x => x.id === id);
  STATE.editProductId = id; STATE.tempImg = p.img;
  $('modal-prod-title').textContent = '✏️ แก้ไขสินค้า';
  $('fp-name').value  = p.name;
  $('fp-cat').value   = p.cat;
  $('fp-price').value = p.price;
  $('fp-stock').value = p.centralStock;
  $('fp-sku').value   = p.sku || '';
  $('img-dropzone').innerHTML = p.img ? `<img src="${p.img}">` : '<span>📷</span><span>คลิกเพื่อเลือกรูป</span>';
  openModal('modal-product');
}

function handleImageUpload(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    STATE.tempImg = e.target.result;
    $('img-dropzone').innerHTML = `<img src="${STATE.tempImg}">`;
  };
  reader.readAsDataURL(file);
}

function saveProduct() {
  const name  = $('fp-name').value.trim();
  const cat   = $('fp-cat').value.trim() || 'อื่นๆ';
  const price = parseFloat($('fp-price').value);
  const stock = parseInt($('fp-stock').value);
  const sku   = $('fp-sku').value.trim();
  if (!name || isNaN(price) || isNaN(stock)) { showToast('❌ กรอกข้อมูลให้ครบ', 'err'); return; }
  if (STATE.editProductId) {
    const p = DB.products.find(x => x.id === STATE.editProductId);
    Object.assign(p, { name, cat, price, centralStock: stock, sku, img: STATE.tempImg });
  } else {
    DB.products.push({ id: STATE.nextProductId++, name, cat, price, sku, img: STATE.tempImg, centralStock: stock, branchStock: {} });
  }
  closeModal('modal-product');
  saveDB(); // ✅
  showToast(STATE.editProductId ? '✅ แก้ไขสำเร็จ' : '✅ เพิ่มสินค้าสำเร็จ', 'ok');
  renderProducts();
}

function deleteProduct(id) {
  if (STATE.currentUser.role !== 'owner') { showToast('⛔ เฉพาะเจ้าของร้าน', 'err'); return; }
  if (!confirm('ลบสินค้านี้?')) return;
  DB.products = DB.products.filter(p => p.id !== id);
  saveDB(); // ✅
  showToast('🗑️ ลบสินค้าแล้ว', 'ok');
  renderProducts();
}

// ══════════════════════════════════════════════
// STOCK OVERVIEW
// ══════════════════════════════════════════════
function renderStockOverview() {
  const uid     = STATE.currentUser.id;
  const isOwner = STATE.currentUser.role === 'owner';
  const totC    = DB.products.reduce((s,p) => s + p.centralStock, 0);
  const totB    = DB.products.reduce((s,p) => s + (p.branchStock[uid]||0), 0);
  $('stock-stats').innerHTML = `
    <div class="stat-card c-green"><span class="stat-icon">🏭</span><div class="stat-label">คลังกลาง</div><div class="stat-value v-green">${fmt(totC)} ชิ้น</div></div>
    <div class="stat-card c-blue"><span class="stat-icon">🏪</span><div class="stat-label">สต็อก${isOwner?'รวมสาขา':STATE.currentUser.branch}</div><div class="stat-value v-blue">${fmt(totB)} ชิ้น</div></div>
    <div class="stat-card c-teal"><span class="stat-icon">📦</span><div class="stat-label">สินค้าทั้งหมด</div><div class="stat-value v-teal">${DB.products.length} รายการ</div></div>
    <div class="stat-card c-red"><span class="stat-icon">⚠️</span><div class="stat-label">คลังต่ำ (≤10)</div><div class="stat-value v-red">${DB.products.filter(p=>p.centralStock<=10).length}</div></div>`;
  $('stock-branch-col').textContent = isOwner ? 'สต็อกสาขา' : 'สต็อก' + STATE.currentUser.branch;
  $('stock-table-body').innerHTML = DB.products.map(p => {
    const bs   = p.branchStock[uid] || 0;
    const tot2 = p.centralStock + Object.values(p.branchStock).reduce((s,v)=>s+v,0);
    const lowC = p.centralStock <= 10;
    const lowB = bs <= 5;
    return `<div class="stock-row">
      <div class="flex-row" style="gap:10px">
        <div class="td-img">${p.img?`<img src="${p.img}">`:`<span>${catIcon(p.cat)}</span>`}</div>
        <div><div class="fw-bold" style="font-size:13px">${p.name}</div><div style="font-size:10px;color:var(--text-muted)">${p.cat}</div></div>
      </div>
      <div><div class="stock-num" style="color:${lowC?'var(--warning)':'var(--text-primary)'}">${p.centralStock}</div><div class="stock-lbl">คลังกลาง</div></div>
      <div><div class="stock-num" style="color:${lowB?'var(--danger)':'var(--text-primary)'}">${bs}</div><div class="stock-lbl">${isOwner?'สาขา':'ของฉัน'}</div></div>
      <div><div class="stock-num" style="color:var(--text-muted)">${tot2}</div><div class="stock-lbl">รวม</div></div>
      <div><span class="tag ${p.centralStock===0?'tag-danger':p.centralStock<=10?'tag-warning':'tag-success'}">${p.centralStock===0?'หมด':p.centralStock<=10?'ต่ำ':'ปกติ'}</span></div>
      <div class="flex-row" style="gap:5px">
        ${isOwner ? `<button class="btn btn-secondary btn-xs" onclick="openAdjustStock(${p.id})">ปรับ</button>` : ''}
        ${!isOwner ? `<button class="btn btn-primary btn-xs" onclick="openQuickWithdraw(${p.id})">เบิก</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function openAdjustStock(preSelectId) {
  if (STATE.currentUser.role !== 'owner') { showToast('⛔ เฉพาะเจ้าของร้าน', 'err'); return; }
  const sel = $('adj-product-select');
  sel.innerHTML = '<option value="">-- เลือกสินค้า --</option>' +
    DB.products.map(p => `<option value="${p.id}">${p.name} (คลัง: ${p.centralStock})</option>`).join('');
  if (preSelectId) sel.value = preSelectId;
  $('adj-qty').value = '';
  $('adj-note').value = '';
  openModal('modal-adjust-stock');
}

function confirmAdjustStock() {
  const id   = parseInt($('adj-product-select').value);
  const type = $('adj-type').value;
  const qty  = parseInt($('adj-qty').value);
  if (!id || isNaN(qty) || qty < 0) { showToast('❌ กรอกข้อมูลให้ถูกต้อง', 'err'); return; }
  const p = DB.products.find(x => x.id === id);
  if (type === 'add') p.centralStock += qty;
  else if (type === 'remove') { if (qty > p.centralStock) { showToast('❌ คลังกลางไม่พอ','err'); return; } p.centralStock -= qty; }
  else p.centralStock = qty;
  closeModal('modal-adjust-stock');
  saveDB(); // ✅
  showToast('✅ ปรับคลังกลางสำเร็จ', 'ok');
  renderStockOverview();
}

// ══════════════════════════════════════════════
// WITHDRAW
// ══════════════════════════════════════════════
function renderWithdraw() {
  const isOwner = STATE.currentUser.role === 'owner';
  const uid     = STATE.currentUser.id;
  $('withdraw-subtitle').textContent = isOwner
    ? 'เมื่ออนุมัติ: คลังกลางจะลด → สต็อกสาขาของผู้เบิกจะเพิ่ม'
    : 'ส่งคำขอเบิก → เจ้าของอนุมัติ → สต็อกร้านสาขาคุณจะเพิ่ม';
  $('btn-new-withdraw').style.display = isOwner ? 'none' : 'inline-flex';
  const list = isOwner ? DB.withdrawals : DB.withdrawals.filter(w => w.userId === uid);
  const el   = $('withdraw-content');
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="ei">📤</div><p>ยังไม่มีคำขอเบิกสินค้า</p></div>'; return; }
  const pending = list.filter(w => w.status === 'pending');
  const done    = list.filter(w => w.status !== 'pending');
  let html = '';
  if (pending.length) {
    html += `<div style="font-size:11px;font-weight:800;color:var(--warning);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">⏳ รอการอนุมัติ (${pending.length})</div>`;
    html += pending.map(w => renderWithdrawCard(w, isOwner)).join('');
  }
  if (done.length) {
    html += `<div style="font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:18px 0 10px">📁 ดำเนินการแล้ว</div>`;
    html += done.map(w => renderWithdrawCard(w, isOwner)).join('');
  }
  el.innerHTML = html;
  updateWithdrawBadge();
}

function renderWithdrawCard(w, isOwner) {
  const statusIcon  = w.status==='pending' ? '⏳' : w.status==='approved' ? '✅' : '❌';
  const tagClass    = w.status==='pending' ? 'tag-warning' : w.status==='approved' ? 'tag-success' : 'tag-danger';
  const tagText     = w.status==='pending' ? 'รอการอนุมัติ' : w.status==='approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
  return `
    <div class="wr-card ${w.status}">
      <div class="wr-card-header">
        <div class="wr-icon">${statusIcon}</div>
        <div style="flex:1">
          <div class="wr-title">คำขอ #${w.id} — ${w.userName}</div>
          <div class="wr-meta">${w.branch} • ${new Date(w.time).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
          ${w.reason ? `<div class="wr-meta mt-1">📝 ${w.reason}</div>` : ''}
        </div>
        <span class="tag ${tagClass}">${tagText}</span>
      </div>
      ${w.status==='approved' ? `<div class="approved-notice">✅ คลังกลางลดแล้ว → สต็อกสาขา <strong>${w.branch}</strong> เพิ่มแล้ว</div>` : ''}
      <div class="wr-items">
        ${w.items.map(i=>`<div class="wr-item-row"><span>${i.name}</span><span class="fw-bold">× ${i.qty} ชิ้น</span></div>`).join('')}
      </div>
      ${w.status==='pending' && isOwner ? `
        <div class="wr-actions">
          <button class="btn btn-danger btn-sm" onclick="rejectWithdraw(${w.id})">❌ ปฏิเสธ</button>
          <button class="btn btn-primary btn-sm" onclick="previewApprove(${w.id})">✅ อนุมัติ</button>
        </div>` : ''}
    </div>`;
}

let withdrawRowCount = 0;

function openNewWithdraw() {
  withdrawRowCount = 0;
  $('wr-rows-container').innerHTML = '';
  $('wr-reason').value = '';
  addWithdrawRow();
  openModal('modal-withdraw');
}

function openQuickWithdraw(productId) {
  openNewWithdraw();
  setTimeout(() => {
    const firstSelect = $('wr-rows-container').querySelector('select');
    if (firstSelect) firstSelect.value = productId;
  }, 50);
}

function addWithdrawRow() {
  withdrawRowCount++;
  const rowId = 'wr-row-' + withdrawRowCount;
  const div = document.createElement('div');
  div.id = rowId;
  div.style.cssText = 'display:grid;grid-template-columns:1fr 80px 34px;gap:8px;margin-bottom:8px;align-items:center';
  div.innerHTML = `
    <select class="form-input" style="padding:9px 12px">
      ${DB.products.map(p => `<option value="${p.id}">${p.name} (คลัง:${p.centralStock})</option>`).join('')}
    </select>
    <input class="form-input" type="number" min="1" value="1" placeholder="จำนวน" style="padding:9px 10px;text-align:center">
    <button class="btn btn-secondary btn-xs btn-icon" onclick="document.getElementById('${rowId}').remove()" style="width:34px;height:34px;padding:0;justify-content:center">✕</button>`;
  $('wr-rows-container').appendChild(div);
}

function submitWithdraw() {
  const rows  = $('wr-rows-container').querySelectorAll(':scope > div');
  const items = [];
  let valid = true;
  rows.forEach(row => {
    const sel = row.querySelector('select');
    const qty = parseInt(row.querySelector('input').value);
    const p   = DB.products.find(x => x.id === parseInt(sel.value));
    if (!p || !qty || qty < 1) { valid = false; return; }
    if (qty > p.centralStock) { showToast(`❌ คลังกลางไม่พอ: ${p.name} (มีแค่ ${p.centralStock})`, 'err'); valid = false; return; }
    items.push({ productId: p.id, name: p.name, qty });
  });
  if (!valid || !items.length) { if (valid) showToast('❌ เพิ่มรายการก่อน', 'err'); return; }
  const reason = $('wr-reason').value.trim();
  const wr = { id: STATE.nextWithdrawId++, userId: STATE.currentUser.id, userName: STATE.currentUser.name, branch: STATE.currentUser.branch, items, reason, status: 'pending', time: new Date() };
  DB.withdrawals.unshift(wr);
  DB.notifications.unshift({ id: Date.now(), text: `${STATE.currentUser.name} ส่งคำขอเบิกสินค้า #${wr.id} (${items.length} รายการ)`, time: new Date(), read: false, page: 'withdraw' });
  closeModal('modal-withdraw');
  saveDB(); // ✅
  showToast('📤 ส่งคำขอเบิกสำเร็จ รอการอนุมัติ', 'ok');
  renderWithdraw();
  updateNotifications();
}

function previewApprove(withdrawId) {
  if (STATE.currentUser.role !== 'owner') { showToast('⛔ เฉพาะเจ้าของร้าน', 'err'); return; }
  const w = DB.withdrawals.find(x => x.id === withdrawId);
  if (!w) return;
  STATE.pendingApproveId = withdrawId;
  let html = `<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">การโอนสต็อกที่จะเกิดขึ้น เมื่ออนุมัติ:</div>
    <div class="tf-preview">
      <div class="tf-box"><div class="tf-box-title">🏭 คลังกลาง (ก่อน)</div>${w.items.map(i=>{const p=DB.products.find(x=>x.id===i.productId);return `<div style="font-size:12px;padding:2px 0">${i.name}: <b>${p?p.centralStock:0}</b></div>`;}).join('')}</div>
      <div class="tf-arrow">→</div>
      <div class="tf-box"><div class="tf-box-title">🏪 ${w.branch} (ก่อน)</div>${w.items.map(i=>{const p=DB.products.find(x=>x.id===i.productId);return `<div style="font-size:12px;padding:2px 0">${i.name}: <b>${p?(p.branchStock[w.userId]||0):0}</b></div>`;}).join('')}</div>
    </div>
    <div class="wr-items mb-2">${w.items.map(i=>`<div class="wr-item-row"><span>${i.name}</span><span style="display:flex;gap:12px"><span style="color:var(--danger)">คลัง −${i.qty}</span><span style="color:var(--success)">สาขา +${i.qty}</span></span></div>`).join('')}</div>
    <div class="tf-preview">
      <div class="tf-box"><div class="tf-box-title">🏭 คลังกลาง (หลัง)</div>${w.items.map(i=>{const p=DB.products.find(x=>x.id===i.productId);return `<div style="font-size:12px;padding:2px 0">${i.name}: <b style="color:var(--warning)">${p?Math.max(0,p.centralStock-i.qty):0}</b></div>`;}).join('')}</div>
      <div class="tf-arrow">→</div>
      <div class="tf-box"><div class="tf-box-title">🏪 ${w.branch} (หลัง)</div>${w.items.map(i=>{const p=DB.products.find(x=>x.id===i.productId);return `<div style="font-size:12px;padding:2px 0">${i.name}: <b style="color:var(--success)">${p?(p.branchStock[w.userId]||0)+i.qty:i.qty}</b></div>`;}).join('')}</div>
    </div>`;
  $('approve-preview-body').innerHTML = html;
  openModal('modal-approve-preview');
}

function confirmApprove() {
  const w = DB.withdrawals.find(x => x.id === STATE.pendingApproveId);
  if (!w) return;
  for (const it of w.items) {
    const p = DB.products.find(x => x.id === it.productId);
    if (!p || p.centralStock < it.qty) { showToast(`❌ คลังกลางไม่พอ: ${it.name}`, 'err'); return; }
  }
  w.items.forEach(it => {
    const p = DB.products.find(x => x.id === it.productId);
    if (!p) return;
    p.centralStock -= it.qty;
    if (!p.branchStock[w.userId]) p.branchStock[w.userId] = 0;
    p.branchStock[w.userId] += it.qty;
  });
  w.status = 'approved';
  DB.notifications.unshift({ id: Date.now(), text: `✅ อนุมัติ #${w.id}: สต็อกสาขา ${w.branch} เพิ่มแล้ว`, time: new Date(), read: false, page: 'withdraw' });
  closeModal('modal-approve-preview');
  saveDB(); // ✅
  showToast(`✅ อนุมัติสำเร็จ! สต็อกสาขา ${w.branch} เพิ่มแล้ว`, 'ok');
  renderWithdraw();
  updateNotifications();
}

function rejectWithdraw(withdrawId) {
  const w = DB.withdrawals.find(x => x.id === withdrawId);
  if (!w) return;
  w.status = 'rejected';
  saveDB(); // ✅
  showToast('❌ ปฏิเสธคำขอเบิกแล้ว', 'warn');
  renderWithdraw();
  updateWithdrawBadge();
}

function updateWithdrawBadge() {
  const cnt = DB.withdrawals.filter(w => w.status === 'pending').length;
  const badge = $('withdraw-badge');
  if (badge) { badge.style.display = cnt > 0 ? 'inline-block' : 'none'; badge.textContent = cnt; }
}

// ══════════════════════════════════════════════
// ACCOUNTS
// ══════════════════════════════════════════════
function renderAccounts() {
  if (STATE.currentUser.role !== 'owner') {
    $('page-accounts').innerHTML = '<div class="denied-state"><div class="di">🔒</div><h3>ไม่มีสิทธิ์เข้าถึง</h3><p>เฉพาะเจ้าของร้านเท่านั้น</p></div>';
    return;
  }
  $('accounts-list').innerHTML = DB.accounts.map(a => `
    <div class="acc-row">
      <div class="acc-row-avatar" style="background:${a.role==='owner'?'linear-gradient(135deg,#1aaa5e,#0f8f4c)':'linear-gradient(135deg,#3cc47a,#1aaa5e)'}">
        ${a.avatar}
      </div>
      <div style="flex:1">
        <div class="fw-bold" style="font-size:14px">${a.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">@${a.username} — ${a.branch}</div>
      </div>
      <span class="tag ${a.role==='owner'?'tag-pandan':'tag-success'}">${a.role==='owner'?'เจ้าของร้าน':'ผู้จัดการสาขา'}</span>
      ${a.id !== STATE.currentUser.id
        ? `<button class="btn btn-danger btn-xs" onclick="deleteAccount(${a.id})">🗑️</button>`
        : '<span class="tag tag-info" style="font-size:10px">บัญชีปัจจุบัน</span>'}
    </div>`).join('');
}

function openAddAccount() {
  ['acc-name','acc-username','acc-password','acc-branch'].forEach(id => $(id).value = '');
  openModal('modal-account');
}

function saveAccount() {
  const name     = $('acc-name').value.trim();
  const username = $('acc-username').value.trim();
  const password = $('acc-password').value;
  const role     = $('acc-role').value;
  const branch   = $('acc-branch').value.trim() || 'สาขา';
  if (!name || !username || !password) { showToast('❌ กรอกข้อมูลให้ครบ', 'err'); return; }
  if (DB.accounts.find(a => a.username === username)) { showToast('❌ ชื่อผู้ใช้นี้มีแล้ว', 'err'); return; }
  DB.accounts.push({ id: STATE.nextAccId++, name, username, password, role, branch, avatar: role==='owner'?'🌿':'👤' });
  closeModal('modal-account');
  saveDB(); // ✅
  showToast('✅ เพิ่มบัญชีสำเร็จ', 'ok');
  renderAccounts();
  buildLoginChips();
}

function deleteAccount(id) {
  if (!confirm('ลบบัญชีนี้?')) return;
  DB.accounts = DB.accounts.filter(a => a.id !== id);
  saveDB(); // ✅
  showToast('🗑️ ลบบัญชีแล้ว', 'ok');
  renderAccounts();
  buildLoginChips();
}

// ══════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════
function updateNotifications() {
  updateWithdrawBadge();
  const unread = DB.notifications.filter(n => !n.read).length;
  const dot = $('notif-dot');
  if (dot) { dot.style.display = unread > 0 ? 'block' : 'none'; dot.textContent = unread; }
  const list = $('notif-list');
  const relevant = STATE.currentUser?.role === 'owner' ? DB.notifications : [];
  list.innerHTML = relevant.length
    ? relevant.slice(0,10).map(n => `
        <div class="notif-item" onclick="notifClick('${n.page}')">
          <div class="flex-row" style="align-items:flex-start;gap:8px">
            ${!n.read ? '<div class="notif-unread-dot"></div>' : '<div style="width:7px"></div>'}
            <div>
              <div class="notif-text">${n.text}</div>
              <div class="notif-time">${new Date(n.time).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        </div>`).join('')
    : '<div class="empty-state" style="padding:16px"><p>ไม่มีการแจ้งเตือน</p></div>';
}

function toggleNotifPanel() {
  const panel = $('notif-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    DB.notifications.forEach(n => n.read = true);
    updateNotifications();
  }
}

function closeNotifPanel() { $('notif-panel')?.classList.remove('open'); }
function notifClick(page) { closeNotifPanel(); if (page) navigate(page); }