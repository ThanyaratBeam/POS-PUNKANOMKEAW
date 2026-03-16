/* ════════════════════════════
   app.js  v6
   เพิ่ม: costPrice/กำไร, promotions, รายงาน, loginLog, avatarUpload, EN/TH
════════════════════════════ */

/* ── i18n ── */
const LANG={
  th:{
    pos:'หน้าขาย',dash:'แดชบอร์ด',hist:'ประวัติขาย',products:'สินค้า',stock:'สต็อก',
    withdraw:'เบิกสินค้า',stocklog:'ประวัติสต็อก',customers:'สมาชิก',accounts:'บัญชีผู้ใช้',
    report:'รายงาน',promotions:'โปรโมชั่น',loginlog:'ประวัติ Login',
    total:'ยอดขายรวม',profit:'กำไรรวม',bills:'จำนวนบิล',items:'ชิ้นที่ขาย',
    cash:'เงินสด',transfer:'โอนเงิน',avg:'เฉลี่ย/บิล',
    pay:'ชำระเงิน',cancel:'ยกเลิก',confirm:'ยืนยัน',save:'บันทึก',
    discount:'ส่วนลด',promo:'โปรโมชั่น',
  },
  en:{
    pos:'POS',dash:'Dashboard',hist:'Sales History',products:'Products',stock:'Stock',
    withdraw:'Withdraw',stocklog:'Stock Log',customers:'Members',accounts:'Accounts',
    report:'Reports',promotions:'Promotions',loginlog:'Login History',
    total:'Total Sales',profit:'Total Profit',bills:'Bills',items:'Items Sold',
    cash:'Cash',transfer:'Transfer',avg:'Avg/Bill',
    pay:'Pay',cancel:'Cancel',confirm:'Confirm',save:'Save',
    discount:'Discount',promo:'Promotion',
  }
};
const t=k=>LANG[STATE?.reportLang||'th'][k]||k;

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.modal-overlay').forEach(o=>
    o.addEventListener('click',e=>{ if(e.target===o) closeModal(o.id); }));
  initClock(); buildBranchStep(); initTheme(); initKeyboardShortcuts();
  initPullToRefresh(); initSwipeToDelete();
  spawnLoginParticles();
  // Request push permission
  setTimeout(()=>requestPushPermission(),3000);
});
document.addEventListener('click',e=>{
  if(!e.target.closest('#notif-panel')&&!e.target.closest('#notif-btn')) closeNotifPanel();
});

/* ── Clock ── */
function initClock(){
  const tick=()=>{
    const n=new Date(),clk=$('sb-clock'),dt=$('sb-date');
    if(clk) clk.textContent=n.toLocaleTimeString('th-TH');
    if(dt) dt.textContent=n.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  };
  tick(); setInterval(tick,1000);
}

/* ── Keyboard shortcuts ── */
function initKeyboardShortcuts(){
  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    const u=getCurrentUser(); if(!u) return;
    switch(e.key){
      case 'F2': e.preventDefault(); navigate('pos'); break;
      case 'F3': e.preventDefault(); navigate('dash'); break;
      case 'F4': e.preventDefault(); navigate('hist'); break;
      case 'F5': e.preventDefault(); navigate('stock'); break;
      case 'F8': e.preventDefault(); openPayment(); break;
      case 'Escape': document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id)); closeNotifPanel(); break;
      case '+': case '=': e.preventDefault(); $('pos-search-input')?.focus(); break;
    }
  });
}

function spawnLoginParticles(){
  const c=$('login-particles'); if(!c) return;
  c.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0';
  for(let i=0;i<20;i++){
    const p=document.createElement('div'), sz=[4,6,8,10,14][i%5];
    p.className='login-particle';
    p.style.cssText=`width:${sz}px;height:${sz}px;left:${5+(i*4.7)%90}%;animation-duration:${8+i%8}s;animation-delay:${i%12*1.5}s;opacity:${0.15+i%4*0.07}`;
    c.appendChild(p);
  }
}

function initPullToRefresh(){
  let startY=0,pulling=false;
  const main=document.querySelector('.main-content');
  if(!main) return;
  main.addEventListener('touchstart',e=>{ if(main.scrollTop===0){ startY=e.touches[0].clientY; pulling=true; }});
  main.addEventListener('touchmove',e=>{ if(!pulling) return; if(e.touches[0].clientY-startY>60){ const ind=$('pull-indicator'); if(ind) ind.style.display='flex'; } });
  main.addEventListener('touchend',e=>{
    if(!pulling) return; pulling=false;
    const ind=$('pull-indicator'); if(ind) ind.style.display='none';
    if(e.changedTouches[0].clientY-startY>80){ showToast('🔄 รีเฟรชแล้ว','ok'); navigate(getCurrentPage()); }
  });
}

function getCurrentPage(){ return document.querySelector('.nav-item.active')?.dataset.page||'pos'; }

function initSwipeToDelete(){
  document.addEventListener('touchstart',e=>{ const item=e.target.closest('.cart-item'); if(!item) return; item._swipeStartX=e.touches[0].clientX; });
  document.addEventListener('touchmove',e=>{ const item=e.target.closest('.cart-item'); if(!item||item._swipeStartX==null) return; const dx=e.touches[0].clientX-item._swipeStartX; if(dx<-40){ item.style.transform=`translateX(${Math.max(dx,-80)}px)`; item.style.background='rgba(224,60,82,.1)'; } });
  document.addEventListener('touchend',e=>{ const item=e.target.closest('.cart-item'); if(!item||item._swipeStartX==null) return; const dx=e.changedTouches[0].clientX-item._swipeStartX; item._swipeStartX=null; if(dx<-60){ const idx=parseInt(item.dataset.idx||'-1'); if(idx>=0){ STATE.cart.splice(idx,1); haptic([40]); renderCart(); return; } } item.style.transform=''; item.style.background=''; });
}

function launchConfetti(){
  const colors=['#1aaa5e','#3cc47a','#6dd9a0','#aaebc6','#0f8f4c','#f0a020','#e03c52'];
  const c=document.createElement('div'); c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden'; document.body.appendChild(c);
  for(let i=0;i<80;i++){ const el=document.createElement('div'),sz=Math.random()*8+4,col=colors[Math.floor(Math.random()*colors.length)]; el.style.cssText=`position:absolute;width:${sz}px;height:${sz}px;background:${col};border-radius:${Math.random()>.5?'50%':'2px'};left:${Math.random()*100}%;top:-10px;animation:confettiFall ${1.2+Math.random()*.8}s ${Math.random()*.6}s ease-in forwards;--drift:${(Math.random()-.5)*200}px;--rotate:${Math.random()*720-360}deg`; c.appendChild(el); }
  setTimeout(()=>c.remove(),2500);
}

function flyToCart(srcEl){
  if(!srcEl) return; const src=srcEl.getBoundingClientRect(),ct=document.querySelector('.cart-title'); if(!ct) return;
  const tgt=ct.getBoundingClientRect(),dot=document.createElement('div');
  dot.style.cssText=`position:fixed;z-index:9999;pointer-events:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#1aaa5e,#3cc47a);left:${src.left+src.width/2-10}px;top:${src.top+src.height/2-10}px;transition:all .55s cubic-bezier(.4,.05,.3,1);font-size:12px;display:flex;align-items:center;justify-content:center;color:#fff`;
  dot.textContent='🛒'; document.body.appendChild(dot);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ dot.style.left=`${tgt.left+tgt.width/2-10}px`; dot.style.top=`${tgt.top+tgt.height/2-10}px`; dot.style.transform='scale(0.3)'; dot.style.opacity='0'; }));
  setTimeout(()=>dot.remove(),600);
}

/* ── initApp ── */
function initApp(){
  const u=getCurrentUser(); if(!u){ doLogout(); return; }
  const isOwner=u.role==='owner';
  const avatarEl=$('user-avatar');
  if(u.avatarImg){ avatarEl.style.backgroundImage=`url('${u.avatarImg}')`; avatarEl.style.backgroundSize='cover'; avatarEl.style.backgroundPosition='center'; avatarEl.textContent=''; }
  else { avatarEl.textContent=u.avatar; avatarEl.style.backgroundImage=''; avatarEl.style.background=isOwner?'linear-gradient(135deg,#1aaa5e,#0f8f4c)':'linear-gradient(135deg,#3cc47a,#1aaa5e)'; }
  $('user-name').textContent=u.name;
  $('user-role').textContent=isOwner?'เจ้าของร้าน — คลังกลาง':`${ROLE_LABEL[u.role]} — ${u.branch}`;
  $('admin-nav').style.display=isOwner?'block':'none';
  const sb=$('btn-shift'); if(sb) sb.style.display=isOwner?'none':'inline-flex';
  // Lang toggle
  const lt=$('lang-toggle'); if(lt) lt.textContent=STATE.reportLang==='th'?'EN':'TH';
  navigate('pos'); updateWithdrawBadge(); checkLowStockAlert();
  showToast(`👋 สวัสดี ${u.name}!`,'ok');
  if(isOwner) startOnlinePoller();
  setTimeout(()=>{
    if(typeof initFirebase==='function'){
      const ok=initFirebase();
      if(ok){
        setupPresence(u.id);
        listenPresence();
        listenFirebase();
        if(u.role==='owner'){
          _fbDb.ref('pos/_lastPush').once('value',snap=>{
            if(!snap.val()){ showToast('☁️ กำลังอัปโหลดข้อมูลครั้งแรก...','ok'); pushAllToFirebase(); }
          });
        }
      }
    }
  },500);
}

function toggleLang(){
  STATE.reportLang=STATE.reportLang==='th'?'en':'th';
  const lt=$('lang-toggle'); if(lt) lt.textContent=STATE.reportLang==='th'?'EN':'TH';
  navigate(getCurrentPage());
}

/* ── Online status poller ── */
let _onlinePoller=null;
function startOnlinePoller(){ if(_onlinePoller) clearInterval(_onlinePoller); updateOnlineBanner(); _onlinePoller=setInterval(updateOnlineBanner,10000); }
function updateOnlineBanner(){
  const u=getCurrentUser(); if(!u||u.role!=='owner') return;
  const online=DB.accounts.filter(a=>a.online&&a.role!=='owner');
  const banner=$('online-banner'); if(!banner) return;
  const byBranch={};
  online.forEach(a=>{ if(!byBranch[a.branch]) byBranch[a.branch]=[]; byBranch[a.branch].push(a.name); });
  banner.style.display='flex';
  banner.innerHTML=online.length
    ?`<span style="margin-right:6px">🟢</span><strong>สาขาออนไลน์:</strong>&nbsp;`+Object.entries(byBranch).map(([b,names])=>`${b} (${names.join(', ')})`).join(' • ')+`<button onclick="this.parentElement.style.display='none'" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:14px;color:inherit">✕</button>`
    :`<span style="margin-right:6px">⚫</span>ไม่มีสาขาออนไลน์ขณะนี้<button onclick="this.parentElement.style.display='none'" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:14px;color:inherit">✕</button>`;
}

function checkLowStockAlert(){
  const u=getCurrentUser(); if(!u) return;
  const uid=u.id,isOwner=u.role==='owner';
  const low=DB.products.filter(p=>isOwner?(p.centralStock>0&&p.centralStock<=5):((p.branchStock[uid]||0)>0&&(p.branchStock[uid]||0)<=3));
  const el=$('low-stock-alert'); if(!el) return;
  if(low.length){ el.style.display='flex'; el.innerHTML=`⚠️ สต็อกใกล้หมด: <strong style="margin-left:4px">${low.map(p=>p.name).join(', ')}</strong><button onclick="this.parentElement.style.display='none'" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:var(--warning)">✕</button>`; }
  else el.style.display='none';
}

/* ── Navigation ── */
const PAGE_RENDER={pos:'renderPOS',dash:'renderDashboard',hist:'renderHistory',products:'renderProducts',stock:'renderStockOverview',withdraw:'renderWithdraw',accounts:'renderAccounts',stocklog:'renderStockLog',customers:'renderCustomers',report:'renderReport',promotions:'renderPromotions',loginlog:'renderLoginLog'};
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  $('page-'+page)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  closeNotifPanel();
  if(PAGE_RENDER[page]&&window[PAGE_RENDER[page]]) window[PAGE_RENDER[page]]();
}

/* ══════════════════════
   POS
══════════════════════ */
function renderPOS(){
  const cats=[...new Set(DB.products.map(p=>p.cat))];
  $('pos-cats').innerHTML=`<div class="cat-tab active" onclick="setPosCategory('all',this)">ทั้งหมด</div>`+cats.map(c=>`<div class="cat-tab" onclick="setPosCategory('${c}',this)">${catIcon(c)} ${c}</div>`).join('');
  $('pos-product-grid').innerHTML=skeletonGrid(8);
  setTimeout(()=>{ applyPosFilter(); checkLowStockAlert(); },200);
  renderCartCustomer(); renderPromoBar();
}
function setPosCategory(cat,el){ STATE.posCategory=cat; document.querySelectorAll('#pos-cats .cat-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); applyPosFilter(); }
function onPosSearch(q){ STATE.posSearch=q.toLowerCase(); applyPosFilter(); }

function applyPosFilter(){
  const u=getCurrentUser(); if(!u) return;
  const uid=u.id,isOwner=u.role==='owner';
  let list=DB.products;
  if(STATE.posCategory!=='all') list=list.filter(p=>p.cat===STATE.posCategory);
  if(STATE.posSearch) list=list.filter(p=>p.name.toLowerCase().includes(STATE.posSearch)||(p.sku&&p.sku.toLowerCase().includes(STATE.posSearch)));
  const el=$('pos-product-grid'); if(!el) return;
  if(!list.length){el.innerHTML='<div class="empty-state"><div class="ei">🔍</div><p>ไม่พบสินค้า</p></div>';return;}
  el.innerHTML=list.map(p=>{
    const stk=isOwner?p.centralStock:(p.branchStock[uid]||0);
    const low=stk>0&&stk<=5,out=stk===0;
    const revs=DB.reviews.filter(r=>r.productId===p.id);
    const avg=revs.length?(revs.reduce((s,r)=>s+r.rating,0)/revs.length).toFixed(1):null;
    return `<div class="product-card${out?' out-of-stock':''}" id="pc-${p.id}" onclick="addToCart(${p.id},event)">
      <div class="product-card-img">${p.img?`<img src="${p.img}">`:`<span>${catIcon(p.cat)}</span>`}</div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">฿${fmt(p.price)}</div>
        <div class="product-card-stock${out?' out':low?' low':''}">
          ${out?'❌ หมดสต็อก':low?`⚠️ เหลือ ${stk}`:`คงเหลือ ${stk}`}
        </div>
        ${avg?`<div class="product-card-rating">⭐ ${avg}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

/* ── Promo bar in POS ── */
function renderPromoBar(){
  const el=$('pos-promo-bar'); if(!el) return;
  const promos=getActivePromotions();
  if(!promos.length){ el.style.display='none'; return; }
  el.style.display='flex';
  el.innerHTML=`<span style="font-weight:800;margin-right:8px">🎁 โปรโมชั่น:</span>`+
    promos.map(p=>`<span class="promo-chip${STATE.selectedPromoId===p.id?' active':''}" onclick="selectPromo(${p.id})">${p.name}</span>`).join('')+
    (STATE.selectedPromoId?`<span class="promo-chip active" onclick="selectPromo(null)">✕ ยกเลิก</span>`:'');
}
function selectPromo(id){ STATE.selectedPromoId=id; renderPromoBar(); renderCart(); showToast(id?`🎁 เลือกโปรฯ แล้ว`:'ยกเลิกโปรฯ แล้ว','ok'); }

function addToCart(pid,event){
  const u=getCurrentUser(); if(!u) return;
  const uid=u.id,isOwner=u.role==='owner';
  const p=DB.products.find(x=>x.id===pid); if(!p) return;
  const stk=isOwner?p.centralStock:(p.branchStock[uid]||0);
  if(stk===0){ showToast('❌ ไม่มีสต็อก','err'); return; }
  const ci=STATE.cart.find(x=>x.id===pid);
  if(ci){ if(ci.qty<stk)ci.qty++; else{ showToast('⚠️ สต็อกไม่พอ','warn'); return; } }
  else STATE.cart.push({id:pid,name:p.name,price:p.price,costPrice:p.costPrice||0,qty:1});
  playSound('add'); haptic([20]);
  if(event) flyToCart(event.currentTarget);
  renderCart();
}

function renderCart(){
  const el=$('cart-body'); if(!el) return;
  if(!STATE.cart.length){
    el.innerHTML='<div class="cart-empty"><div class="ei">🛒</div><p>ยังไม่มีสินค้า</p></div>';
    $('cart-total-value').textContent='฿0'; return;
  }
  const subtotal=STATE.cart.reduce((s,c)=>s+c.price*c.qty,0);
  const discount=calcDiscount(subtotal,STATE.selectedPromoId);
  const total=subtotal-discount;
  el.innerHTML=STATE.cart.map((ci,i)=>`
    <div class="cart-item" data-idx="${i}" style="touch-action:pan-y">
      <div style="flex:1"><div class="cart-item-name">${ci.name}</div><div class="cart-item-sub">฿${fmt(ci.price)} / ชิ้น</div></div>
      <div style="display:flex;align-items:center;gap:5px">
        <button class="qty-btn" onclick="changeCartQty(${i},-1)">−</button>
        <span class="qty-num">${ci.qty}</span>
        <button class="qty-btn" onclick="changeCartQty(${i},1)">+</button>
      </div>
      <div class="cart-item-price">฿${fmt(ci.price*ci.qty)}</div>
    </div>`).join('')+
    (discount>0?`<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:12px;color:var(--danger);font-weight:700;border-top:1px dashed rgba(224,60,82,.3)"><span>🎁 ส่วนลด</span><span>-฿${fmt(discount)}</span></div>`:'');
  $('cart-total-value').textContent='฿'+fmt(total);
}

function changeCartQty(i,delta){
  const u=getCurrentUser(); if(!u) return;
  const ci=STATE.cart[i],p=DB.products.find(x=>x.id===ci.id);
  const stk=p?(u.role==='owner'?p.centralStock:(p.branchStock[u.id]||0)):0;
  ci.qty+=delta;
  if(ci.qty<=0) STATE.cart.splice(i,1);
  else if(ci.qty>stk){ ci.qty=stk; showToast('⚠️ สต็อกไม่พอ','warn'); }
  haptic([15]); renderCart();
}
function clearCart(){ STATE.cart=[]; STATE.selectedCustomerId=null; STATE.selectedPromoId=null; renderCart(); renderCartCustomer(); renderPromoBar(); }

function renderCartCustomer(){
  const el=$('cart-customer-badge'); if(!el) return;
  const cust=DB.customers.find(c=>c.id===STATE.selectedCustomerId);
  el.innerHTML=cust?`<div class="cart-cust-chip" onclick="openCustomerSelect()">👤 <strong>${cust.name}</strong> ⭐${cust.points}แต้ม<button onclick="event.stopPropagation();STATE.selectedCustomerId=null;renderCartCustomer()" style="background:none;border:none;cursor:pointer;margin-left:4px;color:var(--text-muted)">✕</button></div>`:
    `<button class="btn btn-secondary btn-xs" onclick="openCustomerSelect()" style="font-size:11px">👤 เลือกลูกค้า</button>`;
}

/* ── PAYMENT ── */
function openPayment(){
  if(!STATE.cart.length){ showToast('❌ ยังไม่มีสินค้า','err'); return; }
  const subtotal=STATE.cart.reduce((s,c)=>s+c.price*c.qty,0);
  const discount=calcDiscount(subtotal,STATE.selectedPromoId);
  const total=subtotal-discount;
  $('pay-item-count').textContent=STATE.cart.reduce((s,c)=>s+c.qty,0)+' รายการ';
  $('pay-subtotal-row').style.display=discount>0?'flex':'none';
  $('pay-subtotal-value').textContent='฿'+fmt(subtotal);
  $('pay-discount-row').style.display=discount>0?'flex':'none';
  $('pay-discount-value').textContent='-฿'+fmt(discount);
  $('pay-total-value').textContent='฿'+fmt(total);
  $('pay-qr-amount').textContent='฿'+fmt(total);
  $('pay-received').value=''; $('change-box').style.display='none';
  const cust=DB.customers.find(c=>c.id===STATE.selectedCustomerId);
  const le=$('pay-loyalty-info');
  if(le) le.innerHTML=cust?`<div class="loyalty-info">👤 ${cust.name} — แต้มปัจจุบัน: <strong>${cust.points}</strong> → จะได้รับ +${Math.floor(total/10)} แต้ม</div>`:'';
  selectPayMethod('cash'); openModal('modal-payment');
}
function selectPayMethod(m){ STATE.payMethod=m; $('pay-opt-cash').classList.toggle('selected',m==='cash'); $('pay-opt-transfer').classList.toggle('selected',m==='transfer'); $('pay-cash-section').style.display=m==='cash'?'block':'none'; $('pay-transfer-section').style.display=m==='transfer'?'block':'none'; }
function calcChange(){
  const subtotal=STATE.cart.reduce((s,c)=>s+c.price*c.qty,0);
  const total=subtotal-calcDiscount(subtotal,STATE.selectedPromoId);
  const recv=parseFloat($('pay-received').value)||0,chg=recv-total,box=$('change-box');
  if(recv>0){ box.style.display='block'; $('change-value').textContent='฿'+fmt(Math.max(0,chg)); box.style.borderColor=chg>=0?'rgba(26,170,94,.3)':'rgba(224,60,82,.3)'; $('change-value').style.color=chg>=0?'var(--pandan-600)':'var(--danger)'; } else box.style.display='none';
}
function confirmPayment(){
  const u=getCurrentUser(); if(!u) return;
  const subtotal=STATE.cart.reduce((s,c)=>s+c.price*c.qty,0);
  const discount=calcDiscount(subtotal,STATE.selectedPromoId);
  const total=subtotal-discount;
  const cost=STATE.cart.reduce((s,c)=>s+(c.costPrice||0)*c.qty,0);
  const profit=total-cost;
  if(STATE.payMethod==='cash'){const recv=parseFloat($('pay-received').value)||0;if(recv<total){showToast('❌ รับเงินไม่พอ','err');return;}}
  const uid=u.id,isOwner=u.role==='owner';
  STATE.cart.forEach(ci=>{
    const p=DB.products.find(x=>x.id===ci.id); if(!p) return;
    if(isOwner){const b=p.centralStock;p.centralStock=Math.max(0,p.centralStock-ci.qty);addStockLog(p.id,'sale',ci.qty,b,p.centralStock);}
    else{if(!p.branchStock[uid])p.branchStock[uid]=0;const b=p.branchStock[uid];p.branchStock[uid]=Math.max(0,p.branchStock[uid]-ci.qty);addStockLog(p.id,'sale',ci.qty,b,p.branchStock[uid]);}
  });
  DB.sales.unshift({id:nextId(DB.sales),items:STATE.cart.map(c=>({...c})),total,subtotal,discount,cost,profit,method:STATE.payMethod,promotionId:STATE.selectedPromoId||null,time:new Date(),seller:u.name,sellerId:uid,branch:u.branch,voided:false,customerId:STATE.selectedCustomerId||null});
  if(STATE.selectedCustomerId){
    const cust=DB.customers.find(c=>c.id===STATE.selectedCustomerId);
    if(cust){const earned=Math.floor(total/10);cust.points+=earned;cust.totalSpend+=total;cust.visitCount=(cust.visitCount||0)+1;cust.lastVisit=new Date();showToast(`🎉 ${cust.name} +${earned} แต้ม!`,'ok');}
  }
  if(STATE.selectedPromoId){ const promo=DB.promotions.find(p=>p.id===STATE.selectedPromoId); if(promo) promo.usedCount=(promo.usedCount||0)+1; }
  STATE.cart=[]; STATE.selectedCustomerId=null; STATE.selectedPromoId=null;
  renderCart(); renderCartCustomer(); renderPromoBar();
  closeModal('modal-payment'); saveDB(); playSound('pay'); haptic([30,10,60]);
  launchConfetti(); showToast('✅ ชำระเงินสำเร็จ! 🎉','ok'); applyPosFilter(); checkLowStockAlert();
  checkAndPushLowStock();
}

/* ── Void / Print / Export ── */
function voidSale(saleId){
  const u=getCurrentUser(); if(!u) return;
  const sale=DB.sales.find(s=>s.id===saleId); if(!sale||sale.voided){showToast('❌ ไม่พบบิลหรือยกเลิกแล้ว','err');return;}
  showConfirm(`ยืนยันยกเลิกบิล #${saleId}?\nสต็อกจะถูกคืนกลับ`,()=>{
    const uid=sale.sellerId,isOwnerSale=DB.accounts.find(a=>a.id===uid)?.role==='owner';
    sale.items.forEach(ci=>{
      const p=DB.products.find(x=>x.id===ci.id); if(!p) return;
      if(isOwnerSale){const b=p.centralStock;p.centralStock+=ci.qty;addStockLog(p.id,'add',ci.qty,b,p.centralStock,`ยกเลิกบิล #${saleId}`);}
      else{if(!p.branchStock[uid])p.branchStock[uid]=0;const b=p.branchStock[uid];p.branchStock[uid]+=ci.qty;addStockLog(p.id,'add',ci.qty,b,p.branchStock[uid],`ยกเลิกบิล #${saleId}`);}
    });
    sale.voided=true; sale.voidedBy=u.name; sale.voidedAt=new Date();
    saveDB(); showToast(`🚫 ยกเลิกบิล #${saleId} แล้ว`,'warn'); renderHistory(); applyPosFilter();
  });
}

function printReceipt(saleId){
  const sale=DB.sales.find(s=>s.id===saleId); if(!sale) return;
  const cust=DB.customers.find(c=>c.id===sale.customerId);
  const promo=DB.promotions.find(p=>p.id===sale.promotionId);
  const w=window.open('','_blank','width=380,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:'Sarabun',sans-serif;padding:24px;max-width:300px;margin:0 auto;font-size:13px}
    h2{text-align:center;font-size:18px;margin-bottom:2px}.sub{text-align:center;color:#888;font-size:11px;margin-bottom:14px}
    hr{border:none;border-top:1px dashed #ccc;margin:10px 0}.row{display:flex;justify-content:space-between;padding:3px 0}
    .total{font-size:17px;font-weight:bold;border-top:2px solid #333;margin-top:6px;padding-top:6px}
    .footer{text-align:center;margin-top:16px;font-size:11px;color:#888;line-height:1.8}
    .voided{text-align:center;color:red;font-weight:bold;font-size:15px;margin:10px 0;border:2px solid red;padding:6px;border-radius:6px}
    .discount{color:#e03c52;font-weight:700}
    </style></head><body>
    <h2>🧸 PUNKANOMKEAW</h2>
    <div class="sub">${sale.branch||''}</div>
    <div class="sub">บิล #${sale.id} • ${fmtDate(sale.time)}</div>
    ${sale.voided?'<div class="voided">⚠️ บิลยกเลิกแล้ว</div>':''}
    <hr>${sale.items.map(i=>`<div class="row"><span>${i.name} ×${i.qty}</span><span>฿${fmt(i.price*i.qty)}</span></div>`).join('')}
    ${sale.discount>0?`<div class="row discount"><span>🎁 ${promo?.name||'ส่วนลด'}</span><span>-฿${fmt(sale.discount)}</span></div>`:''}
    <div class="row total"><span>รวม</span><span>฿${fmt(sale.total)}</span></div>
    <div class="row" style="color:#666;font-size:11px"><span>ช่องทาง</span><span>${sale.method==='cash'?'💵 เงินสด':'📱 โอนเงิน'}</span></div>
    <div class="row" style="color:#666;font-size:11px"><span>พนักงาน</span><span>${sale.seller}</span></div>
    ${cust?`<hr><div class="row" style="color:#0f8f4c;font-size:12px"><span>👤 ${cust.name}</span><span>แต้มสะสม: ${cust.points}</span></div>`:''}
    <hr><div class="footer">ขอบคุณที่ใช้บริการ 🙏<br>PUNKANOMKEAW</div>
    <script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
  w.document.close();
}

function exportSalesCSV(){
  const u=getCurrentUser(); if(!canSeeFinance(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;}
  const h=['บิล#','วันเวลา','สินค้า','จำนวน','ยอดรวม','ส่วนลด','ต้นทุน','กำไร','ช่องทาง','พนักงาน','สาขา','ลูกค้า','สถานะ'];
  const rows=DB.sales.map(s=>{const cust=DB.customers.find(c=>c.id===s.customerId);return[s.id,new Date(s.time).toLocaleString('th-TH'),s.items.map(i=>`${i.name}×${i.qty}`).join('|'),s.items.reduce((a,i)=>a+i.qty,0),s.total,s.discount||0,s.cost||0,s.profit||0,s.method==='cash'?'เงินสด':'โอน',s.seller,s.branch||'',cust?.name||'—',s.voided?'ยกเลิก':'ปกติ'];});
  const csv=[h,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download=`sales_${new Date().toISOString().slice(0,10)}.csv`; a.click(); showToast('📥 Export CSV แล้ว','ok');
}

/* ── Barcode scanner ── */
let _scannerStream=null;
async function openBarcodeScanner(){
  openModal('modal-scanner');
  const video=$('scanner-video'); if(!video) return;
  try{
    _scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    video.srcObject=_scannerStream; video.play(); scanFrame(video);
  }catch(e){ showToast('❌ ไม่สามารถเข้าถึงกล้องได้','err'); closeModal('modal-scanner'); }
}
function closeBarcodeScanner(){ if(_scannerStream){_scannerStream.getTracks().forEach(t=>t.stop());_scannerStream=null;} closeModal('modal-scanner'); }
async function scanFrame(video){
  if(!_scannerStream) return;
  if('BarcodeDetector' in window){
    const det=new BarcodeDetector({formats:['ean_13','ean_8','code_128','qr_code']});
    const loop=async()=>{
      if(!_scannerStream) return;
      try{ const bs=await det.detect(video); if(bs.length>0){ const code=bs[0].rawValue; closeBarcodeScanner(); const p=DB.products.find(x=>x.sku&&x.sku.toLowerCase()===code.toLowerCase()); if(p){addToCart(p.id);showToast(`✅ สแกน: ${p.name}`,'ok');}else{$('pos-search-input').value=code;onPosSearch(code);} return; } }catch(e){}
      requestAnimationFrame(loop);
    }; loop();
  } else { closeBarcodeScanner(); const code=prompt('กรอก SKU:'); if(code){const p=DB.products.find(x=>x.sku&&x.sku.toLowerCase()===code.toLowerCase());if(p){addToCart(p.id);}else{$('pos-search-input').value=code;onPosSearch(code);}} }
}

/* ════════════════════
   DASHBOARD
════════════════════ */
let _chartInst=null;
function setDashPeriod(p,el){ STATE.dashPeriod=p; document.querySelectorAll('.period-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); renderDashboard(); }
function setDashBranch(v){ STATE.dashBranch=v; renderDashboard(); }

function getFilteredSales(){
  const u=getCurrentUser(); if(!u) return[];
  const now=new Date();
  let s=DB.sales.filter(x=>!x.voided);
  if(u.role!=='owner') s=s.filter(x=>x.sellerId===u.id);
  if(u.role==='owner'&&STATE.dashBranch!=='all') s=s.filter(x=>x.sellerId===parseInt(STATE.dashBranch));
  return s.filter(x=>{ const d=new Date(x.time);
    if(STATE.dashPeriod==='day') return d.toDateString()===now.toDateString();
    if(STATE.dashPeriod==='week'){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w;}
    if(STATE.dashPeriod==='month') return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return d.getFullYear()===now.getFullYear();
  });
}

function renderDashboard(){
  const u=getCurrentUser(); if(!u) return;
  const isOwner=u.role==='owner';
  const sales=getFilteredSales();
  const total=sales.reduce((s,x)=>s+x.total,0);
  const cost=sales.reduce((s,x)=>s+(x.cost||0),0);
  const profit=sales.reduce((s,x)=>s+(x.profit||0),0);
  const cash=sales.filter(s=>s.method==='cash').reduce((s,x)=>s+x.total,0);
  const tran=sales.filter(s=>s.method==='transfer').reduce((s,x)=>s+x.total,0);
  const items=sales.reduce((s,x)=>s+x.items.reduce((a,i)=>a+i.qty,0),0);

  const bsel=$('dash-branch-selector');
  if(bsel&&isOwner){ bsel.style.display='flex'; const brs=DB.accounts.filter(a=>a.role!=='owner'); bsel.innerHTML=`<button class="period-tab ${STATE.dashBranch==='all'?'active':''}" onclick="setDashBranch('all')">ทุกสาขา</button>`+brs.map(b=>`<button class="period-tab ${STATE.dashBranch==b.id?'active':''}" onclick="setDashBranch(${b.id})">${b.branch}</button>`).join(''); }
  else if(bsel) bsel.style.display='none';

  const statsEl=$('dash-stats');
  if(isOwner){
    statsEl.innerHTML=`
      <div class="stat-card c-green"><span class="stat-icon">💰</span><div class="stat-label">${t('total')}</div><div class="stat-value v-green" id="sc-total">฿0</div></div>
      <div class="stat-card c-teal"><span class="stat-icon">📈</span><div class="stat-label">${t('profit')}</div><div class="stat-value v-teal" id="sc-profit">฿0</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px" id="sc-margin"></div></div>
      <div class="stat-card c-blue"><span class="stat-icon">🧾</span><div class="stat-label">${t('bills')}</div><div class="stat-value v-blue" id="sc-bills">0</div></div>
      <div class="stat-card c-orange"><span class="stat-icon">💳</span><div class="stat-label">${t('avg')}</div><div class="stat-value v-orange" id="sc-avg">฿0</div></div>`;
    setTimeout(()=>{
      animateCount($('sc-total'),total,800,'฿');
      animateCount($('sc-profit'),profit,800,'฿');
      if($('sc-margin')) $('sc-margin').textContent=total>0?`Margin ${Math.round(profit/total*100)}%`:'';
      animateCount($('sc-bills'),sales.length);
      animateCount($('sc-avg'),sales.length?Math.round(total/sales.length):0,800,'฿');
    },50);
  } else {
    statsEl.innerHTML=`
      <div class="stat-card c-blue"><span class="stat-icon">🧾</span><div class="stat-label">บิลของฉัน</div><div class="stat-value v-blue" id="sc-bills">0</div></div>
      <div class="stat-card c-teal"><span class="stat-icon">📦</span><div class="stat-label">ชิ้นที่ขาย</div><div class="stat-value v-teal" id="sc-items">0</div></div>`;
    setTimeout(()=>{ animateCount($('sc-bills'),sales.length); animateCount($('sc-items'),items); },50);
  }

  const now=new Date();
  const days=Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return d;});
  const labels=days.map(d=>d.toLocaleDateString('th-TH',{weekday:'short',day:'numeric'}));
  const dvals=days.map(d=>{ let ds=DB.sales.filter(s=>!s.voided&&new Date(s.time).toDateString()===d.toDateString()); if(!isOwner) ds=ds.filter(s=>s.sellerId===u.id); return ds.reduce((s,x)=>s+x.total,0); });
  const pvals=days.map(d=>{ let ds=DB.sales.filter(s=>!s.voided&&new Date(s.time).toDateString()===d.toDateString()); if(!isOwner) ds=ds.filter(s=>s.sellerId===u.id); return ds.reduce((s,x)=>s+(x.profit||0),0); });
  const cc=$('dash-chart-container');
  if(cc){ cc.innerHTML='<canvas id="dash-chart-canvas" style="max-height:150px"></canvas>'; const ctx=document.getElementById('dash-chart-canvas')?.getContext('2d');
    if(ctx&&window.Chart){ if(_chartInst){_chartInst.destroy();_chartInst=null;}
      _chartInst=new Chart(ctx,{type:'line',data:{labels,datasets:[
        {label:'ยอดขาย',data:dvals,borderColor:'#1aaa5e',backgroundColor:'rgba(26,170,94,0.08)',borderWidth:2.5,pointBackgroundColor:'#1aaa5e',pointRadius:4,tension:0.4,fill:true},
        ...(isOwner?[{label:'กำไร',data:pvals,borderColor:'#f0a020',backgroundColor:'rgba(240,160,32,0.06)',borderWidth:2,pointBackgroundColor:'#f0a020',pointRadius:3,tension:0.4,fill:false}]:[])
      ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:isOwner,position:'top',labels:{font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ฿${fmt(c.parsed.y)}`}}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{callback:v=>'฿'+fmt(v),font:{size:11}}}}}}); }
  }

  const pm={};
  DB.sales.filter(s=>!s.voided).forEach(s=>s.items.forEach(it=>{pm[it.name]=(pm[it.name]||0)+it.qty*it.price;}));
  const tops=Object.entries(pm).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('dash-top-products').innerHTML=tops.length?tops.map(([name,val],i)=>`<div class="mini-list-item"><div class="mini-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div><div class="mini-name">${name}</div>${isOwner?`<div class="mini-val">฿${fmt(val)}</div>`:'<div class="mini-val" style="color:var(--text-muted)">ขายดี</div>'}</div>`).join(''):'<div class="empty-state" style="padding:20px"><p>ยังไม่มีข้อมูล</p></div>';

  $('dash-pay-breakdown').innerHTML=isOwner?`<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
    <div><div class="flex-row mb-1"><span style="font-size:12px">💵 ${t('cash')}</span><div class="spacer"></div><span class="fw-bold text-green">฿${fmt(cash)}</span></div><div style="background:rgba(26,170,94,.1);border-radius:5px;height:7px;overflow:hidden"><div style="background:var(--pandan-500);height:100%;border-radius:5px;width:${total?Math.round(cash/total*100):0}%;transition:width .8s ease"></div></div></div>
    <div><div class="flex-row mb-1"><span style="font-size:12px">📱 ${t('transfer')}</span><div class="spacer"></div><span class="fw-bold" style="color:var(--info)">฿${fmt(tran)}</span></div><div style="background:rgba(33,150,168,.1);border-radius:5px;height:7px;overflow:hidden"><div style="background:var(--info);height:100%;border-radius:5px;width:${total?Math.round(tran/total*100):0}%;transition:width .8s ease"></div></div></div>
    <div class="flex-row mt-1"><span style="font-size:12px;color:var(--text-muted)">💸 ต้นทุนรวม</span><div class="spacer"></div><span class="fw-bold" style="color:var(--danger)">฿${fmt(cost)}</span></div>
    <button class="btn btn-secondary btn-sm" onclick="exportSalesCSV()" style="width:100%;justify-content:center;margin-top:4px">📥 Export CSV</button>
    </div>`:'<div class="empty-state" style="padding:20px"><p>🔒 เฉพาะเจ้าของร้าน</p></div>';

  const uid=u.id; const low=DB.products.filter(p=>p.centralStock<=10||(p.branchStock[uid]||0)<=5);
  $('dash-low-stock').innerHTML=low.length?low.slice(0,5).map(p=>{const bs=p.branchStock[uid]||0;return`<div class="mini-list-item"><span style="font-size:20px">${catIcon(p.cat)}</span><div class="mini-name">${p.name}</div><div style="text-align:right">${isOwner&&p.centralStock<=10?`<div style="font-size:10px;color:var(--warning)">คลัง: ${p.centralStock}</div>`:''}${bs<=5?`<div style="font-size:10px;color:var(--danger)">สาขา: ${bs}</div>`:''}</div></div>`;}).join(''):'<div class="empty-state" style="padding:20px"><p>✅ สต็อกปกติ</p></div>';
}

/* ════════════════════
   REPORT (ใหม่)
════════════════════ */
let _reportPeriod='month';
function setReportPeriod(p,el){ _reportPeriod=p; document.querySelectorAll('.rpt-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); renderReport(); }

function renderReport(){
  const u=getCurrentUser(); if(!u||!canSeeFinance(u.role)){$('page-report').innerHTML='<div class="denied-state"><div class="di">🔒</div><h3>เฉพาะเจ้าของร้าน</h3></div>';return;}
  const now=new Date();
  let sales=DB.sales.filter(s=>!s.voided);
  if(_reportPeriod==='day') sales=sales.filter(s=>new Date(s.time).toDateString()===now.toDateString());
  else if(_reportPeriod==='week'){const w=new Date(now);w.setDate(w.getDate()-7);sales=sales.filter(s=>new Date(s.time)>=w);}
  else if(_reportPeriod==='month') sales=sales.filter(s=>{const d=new Date(s.time);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  else sales=sales.filter(s=>new Date(s.time).getFullYear()===now.getFullYear());

  const total=sales.reduce((s,x)=>s+x.total,0);
  const cost=sales.reduce((s,x)=>s+(x.cost||0),0);
  const profit=sales.reduce((s,x)=>s+(x.profit||0),0);
  const margin=total>0?Math.round(profit/total*100):0;
  const cash=sales.filter(s=>s.method==='cash').reduce((s,x)=>s+x.total,0);
  const tran=sales.filter(s=>s.method==='transfer').reduce((s,x)=>s+x.total,0);

  // by seller
  const bySeller={};
  sales.forEach(s=>{ if(!bySeller[s.seller]) bySeller[s.seller]={name:s.seller,branch:s.branch,total:0,profit:0,bills:0}; bySeller[s.seller].total+=s.total; bySeller[s.seller].profit+=s.profit||0; bySeller[s.seller].bills++; });
  const sellerRows=Object.values(bySeller).sort((a,b)=>b.total-a.total);

  // by product
  const byProd={};
  sales.forEach(s=>s.items.forEach(i=>{ if(!byProd[i.name]) byProd[i.name]={name:i.name,qty:0,revenue:0,cost:0}; byProd[i.name].qty+=i.qty; byProd[i.name].revenue+=i.price*i.qty; byProd[i.name].cost+=(i.costPrice||0)*i.qty; }));
  const prodRows=Object.values(byProd).sort((a,b)=>b.revenue-a.revenue).slice(0,10);

  const el=$('report-content'); if(!el) return;
  el.innerHTML=`
  <div class="grid-4 mb-3">
    <div class="stat-card c-green"><span class="stat-icon">💰</span><div class="stat-label">ยอดขาย</div><div class="stat-value v-green">฿${fmt(total)}</div></div>
    <div class="stat-card c-teal"><span class="stat-icon">📈</span><div class="stat-label">กำไรสุทธิ</div><div class="stat-value v-teal">฿${fmt(profit)}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Margin ${margin}%</div></div>
    <div class="stat-card c-orange"><span class="stat-icon">💸</span><div class="stat-label">ต้นทุนรวม</div><div class="stat-value v-orange">฿${fmt(cost)}</div></div>
    <div class="stat-card c-blue"><span class="stat-icon">🧾</span><div class="stat-label">บิลทั้งหมด</div><div class="stat-value v-blue">${sales.length}</div></div>
  </div>
  <div class="grid-2 mb-3">
    <div class="glass-card"><div class="card-header"><span class="card-header-title">👤 ยอดขายแยกพนักงาน</span></div>
      <div class="glass-card-pad" style="padding:12px 16px">
        ${sellerRows.map(s=>`<div class="mini-list-item"><div style="flex:1"><div style="font-size:13px;font-weight:700">${s.name}</div><div style="font-size:10px;color:var(--text-muted)">${s.branch} • ${s.bills} บิล</div></div><div style="text-align:right"><div class="mini-val">฿${fmt(s.total)}</div><div style="font-size:10px;color:var(--success)">กำไร ฿${fmt(s.profit)}</div></div></div>`).join('') || '<div class="empty-state" style="padding:16px"><p>ไม่มีข้อมูล</p></div>'}
      </div>
    </div>
    <div class="glass-card"><div class="card-header"><span class="card-header-title">📦 สินค้าขายดี (Top 10)</span></div>
      <div class="glass-card-pad" style="padding:12px 16px">
        ${prodRows.map((p,i)=>`<div class="mini-list-item"><div class="mini-rank">${i+1}</div><div style="flex:1"><div style="font-size:12px;font-weight:700">${p.name}</div><div style="font-size:10px;color:var(--text-muted)">${p.qty} ชิ้น</div></div><div style="text-align:right"><div class="mini-val">฿${fmt(p.revenue)}</div><div style="font-size:10px;color:var(--success)">กำไร ฿${fmt(p.revenue-p.cost)}</div></div></div>`).join('') || '<div class="empty-state" style="padding:16px"><p>ไม่มีข้อมูล</p></div>'}
      </div>
    </div>
  </div>
  <div class="flex-row mb-2" style="gap:10px">
    <button class="btn btn-primary" onclick="exportSalesCSV()">📥 Export CSV</button>
    <button class="btn btn-secondary" onclick="printReport()">🖨️ พิมพ์รายงาน</button>
  </div>`;
}

function printReport(){
  const u=getCurrentUser(); if(!u) return;
  const now=new Date();
  let sales=DB.sales.filter(s=>!s.voided);
  if(_reportPeriod==='month') sales=sales.filter(s=>{const d=new Date(s.time);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const total=sales.reduce((s,x)=>s+x.total,0);
  const profit=sales.reduce((s,x)=>s+(x.profit||0),0);
  const cost=sales.reduce((s,x)=>s+(x.cost||0),0);
  const w=window.open('','_blank','width=800,height:600');
  const periodLabel={day:'วันนี้',week:'7 วันที่ผ่านมา',month:'เดือนนี้',year:'ปีนี้'}[_reportPeriod];
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#222}
    h1{font-size:22px;font-weight:900;color:#0f8f4c;margin-bottom:4px}
    .sub{color:#888;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#e8f8ef;padding:8px 12px;text-align:left;font-size:11px;font-weight:800;color:#3a6b4e;text-transform:uppercase}
    td{padding:8px 12px;border-top:1px solid #e0ece6;font-size:12px}
    .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .sum-card{background:#f0faf4;border:1px solid #aaebc6;border-radius:8px;padding:12px 16px}
    .sum-label{font-size:10px;color:#7aab8c;font-weight:800;text-transform:uppercase}
    .sum-val{font-size:20px;font-weight:900;color:#0f8f4c;margin-top:4px}
    </style></head><body>
    <h1>🧸 PUNKANOMKEAW — รายงานยอดขาย</h1>
    <div class="sub">ช่วง: ${periodLabel} • พิมพ์วันที่ ${fmtDate(new Date())}</div>
    <div class="summary">
      <div class="sum-card"><div class="sum-label">ยอดขายรวม</div><div class="sum-val">฿${fmt(total)}</div></div>
      <div class="sum-card"><div class="sum-label">กำไรสุทธิ</div><div class="sum-val">฿${fmt(profit)}</div></div>
      <div class="sum-card"><div class="sum-label">ต้นทุน</div><div class="sum-val">฿${fmt(cost)}</div></div>
      <div class="sum-card"><div class="sum-label">จำนวนบิล</div><div class="sum-val">${sales.length}</div></div>
    </div>
    <table><thead><tr><th>#</th><th>วันเวลา</th><th>พนักงาน</th><th>สินค้า</th><th>ยอด</th><th>กำไร</th><th>ช่องทาง</th></tr></thead>
    <tbody>${sales.slice(0,100).map(s=>`<tr><td>${s.id}</td><td>${fmtDate(s.time)}</td><td>${s.seller}</td><td>${s.items.map(i=>`${i.name}×${i.qty}`).join(', ')}</td><td>฿${fmt(s.total)}</td><td>฿${fmt(s.profit||0)}</td><td>${s.method==='cash'?'💵':'📱'}</td></tr>`).join('')}</tbody></table>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}

/* ════════════════════
   HISTORY
════════════════════ */
let _histQ='',_histFrom='',_histTo='';
function renderHistory(q){
  const u=getCurrentUser(); if(!u) return;
  if(q!==undefined) _histQ=q||'';
  const isOwner=u.role==='owner',uid=u.id;
  let list=DB.sales;
  if(!isOwner) list=list.filter(s=>s.sellerId===uid);
  if(_histQ) list=list.filter(s=>s.items.some(i=>i.name.toLowerCase().includes(_histQ.toLowerCase()))||s.seller.includes(_histQ)||String(s.id).includes(_histQ));
  if(_histFrom) list=list.filter(s=>new Date(s.time)>=new Date(_histFrom));
  if(_histTo)   list=list.filter(s=>new Date(s.time)<=new Date(_histTo+' 23:59:59'));
  const el=$('history-content'); if(!el) return;
  el.innerHTML=skeletonTable(5);
  setTimeout(()=>{
    if(!list.length){el.innerHTML='<div class="empty-state"><div class="ei">📋</div><p>ไม่พบรายการ</p></div>';return;}
    const active=list.filter(s=>!s.voided);
    const total=active.reduce((s,x)=>s+x.total,0),profit=active.reduce((s,x)=>s+(x.profit||0),0);
    const cash=active.filter(s=>s.method==='cash').reduce((s,x)=>s+x.total,0),tran=active.filter(s=>s.method==='transfer').reduce((s,x)=>s+x.total,0);
    let stats=isOwner?`<div class="grid-4 mb-3">
      <div class="stat-card c-green"><div class="stat-label">ยอดขายรวม</div><div class="stat-value v-green">฿${fmt(total)}</div></div>
      <div class="stat-card c-teal"><div class="stat-label">กำไร</div><div class="stat-value v-teal">฿${fmt(profit)}</div></div>
      <div class="stat-card c-blue"><div class="stat-label">เงินสด</div><div class="stat-value v-blue">฿${fmt(cash)}</div></div>
      <div class="stat-card c-orange"><div class="stat-label">โอนเงิน</div><div class="stat-value v-orange">฿${fmt(tran)}</div></div>
    </div>`:`<div class="grid-2 mb-3"><div class="stat-card c-blue"><div class="stat-label">บิลของฉัน</div><div class="stat-value v-blue">${active.length}</div></div><div class="stat-card c-teal"><div class="stat-label">ชิ้นที่ขาย</div><div class="stat-value v-teal">${fmt(active.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0))}</div></div></div>`;
    const rows=list.slice(0,200).map(s=>{const cmt=DB.comments.filter(c=>c.saleId===s.id).length;const cust=DB.customers.find(c=>c.id===s.customerId);const promo=DB.promotions.find(p=>p.id===s.promotionId);return`<tr class="${s.voided?'voided-row':''}"><td style="color:var(--text-faint);font-size:11px">${s.id}</td><td>${s.items.map(i=>`${i.name} ×${i.qty}`).join(', ')}${s.voided?'<br><span class="tag tag-danger" style="font-size:9px">ยกเลิก</span>':''}${promo?`<br><span class="tag tag-warning" style="font-size:9px">🎁 ${promo.name}</span>`:''}</td><td><span class="tag ${s.method==='cash'?'tag-success':'tag-info'}">${s.method==='cash'?'💵':'📱'}</span></td><td style="font-size:12px;color:var(--text-muted)">${s.seller}</td>${cust?`<td style="font-size:11px;color:var(--pandan-600)">👤 ${cust.name}</td>`:'<td style="color:var(--text-faint)">—</td>'}<td style="font-size:11px;color:var(--text-muted)">${fmtDate(s.time)}</td>${isOwner?`<td class="fw-bold font-prompt ${s.voided?'text-muted':'text-green'}">${s.voided?'—':'฿'+fmt(s.total)}</td><td style="font-size:11px;color:var(--success)">${s.voided?'—':'฿'+fmt(s.profit||0)}</td>`:'<td>—</td><td>—</td>'}<td><div style="display:flex;gap:3px"><button class="btn btn-secondary btn-xs" onclick="openCommentModal(${s.id})">💬${cmt?` ${cmt}`:''}</button><button class="btn btn-secondary btn-xs" onclick="printReceipt(${s.id})">🖨️</button>${!s.voided&&(isOwner||s.sellerId===uid)?`<button class="btn btn-danger btn-xs" onclick="voidSale(${s.id})">🚫</button>`:''}</div></td></tr>`;}).join('');
    el.innerHTML=stats+`<div class="flex-row mb-2" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)">📅<input type="date" class="form-input" style="width:140px;padding:6px 10px;font-size:12px" value="${_histFrom}" onchange="_histFrom=this.value;renderHistory()"> ถึง <input type="date" class="form-input" style="width:140px;padding:6px 10px;font-size:12px" value="${_histTo}" onchange="_histTo=this.value;renderHistory()"><button class="btn btn-secondary btn-xs" onclick="_histFrom='';_histTo='';renderHistory()">ล้าง</button></div>${isOwner?`<button class="btn btn-secondary btn-sm" onclick="exportSalesCSV()" style="margin-left:auto">📥 CSV</button>`:''}</div><div class="glass-card table-wrap"><table><thead><tr><th>#</th><th>สินค้า</th><th>ช่องทาง</th><th>พนักงาน</th><th>ลูกค้า</th><th>เวลา</th><th>ยอด</th><th>กำไร</th><th>จัดการ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },250);
}

/* ── Comment ── */
let _commentSaleId=null;
function openCommentModal(saleId){
  _commentSaleId=saleId; const sale=DB.sales.find(s=>s.id===saleId); const cmts=DB.comments.filter(c=>c.saleId===saleId);
  $('comment-modal-body').innerHTML=`<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">บิล #${saleId} — ${sale?sale.items.map(i=>i.name).join(', '):''}</div><div style="margin-bottom:14px">${cmts.length?cmts.map(c=>`<div class="comment-item"><div class="comment-meta">${c.userName} • ${fmtDate(c.time)}</div><div class="comment-text">${c.text}</div></div>`).join(''):'<div style="font-size:12px;color:var(--text-faint);text-align:center;padding:10px">ยังไม่มีคอมเมนต์</div>'}</div><div class="form-group"><label class="form-label">เพิ่มคอมเมนต์</label><textarea class="form-input" id="comment-input" rows="3" placeholder="พิมพ์คอมเมนต์..."></textarea></div>`;
  openModal('modal-comment');
}
function submitComment(){ const text=$('comment-input')?.value.trim(); if(!text){showToast('❌ กรอกก่อน','err');return;} const u=getCurrentUser(); DB.comments.push({id:getNextCommentId(),saleId:_commentSaleId,userId:u.id,userName:u.name,text,time:new Date()}); saveDB(); closeModal('modal-comment'); showToast('✅ เพิ่มคอมเมนต์แล้ว','ok'); renderHistory(); }

/* ════════════════════
   PROMOTIONS (ใหม่)
════════════════════ */
function renderPromotions(){
  const u=getCurrentUser(); if(!u||!canManageProducts(u.role)){$('page-promotions').innerHTML='<div class="denied-state"><div class="di">🔒</div><h3>เฉพาะเจ้าของร้าน</h3></div>';return;}
  const el=$('promotions-content'); if(!el) return;
  if(!DB.promotions.length){ el.innerHTML=`<div class="empty-state"><div class="ei">🎁</div><p>ยังไม่มีโปรโมชั่น</p></div>`; return; }
  el.innerHTML=`<div class="glass-card">${DB.promotions.map(p=>`
    <div class="acc-row">
      <div style="font-size:28px;width:44px;text-align:center">${p.type==='percent'?'%':'฿'}</div>
      <div style="flex:1">
        <div class="fw-bold" style="font-size:14px">${p.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${promoDesc(p)} • ใช้แล้ว ${p.usedCount||0} ครั้ง</div>
      </div>
      <span class="tag ${p.active?'tag-success':'tag-danger'}">${p.active?'เปิดใช้':'ปิดอยู่'}</span>
      <button class="btn btn-secondary btn-xs" onclick="togglePromo(${p.id})">${p.active?'ปิด':'เปิด'}</button>
      <button class="btn btn-danger btn-xs" onclick="deletePromo(${p.id})">🗑️</button>
    </div>`).join('')}</div>`;
}
function promoDesc(p){
  if(p.type==='percent') return `ลด ${p.value}%`;
  if(p.type==='fixed') return `ลด ฿${p.value}`;
  if(p.type==='minspend') return `ซื้อครบ ฿${p.minSpend} ลด ฿${p.discount}`;
  return '';
}
function openAddPromo(){
  openModal('modal-promo');
  $('promo-name').value=''; $('promo-value').value=''; $('promo-minspend').value=''; $('promo-type').value='percent';
  togglePromoType();
}
function togglePromoType(){
  const t=$('promo-type').value;
  $('promo-value-group').style.display=t!=='minspend'?'block':'none';
  $('promo-minspend-group').style.display=t==='minspend'?'block':'none';
  $('promo-discount-group').style.display=t==='minspend'?'block':'none';
}
function savePromo(){
  const name=$('promo-name').value.trim(),type=$('promo-type').value;
  if(!name){showToast('❌ กรอกชื่อโปรฯ','err');return;}
  const promo={id:getNextPromoId(),name,type,active:true,usedCount:0,
    value:type!=='minspend'?parseFloat($('promo-value').value)||0:0,
    minSpend:type==='minspend'?parseFloat($('promo-minspend').value)||0:0,
    discount:type==='minspend'?parseFloat($('promo-discount').value)||0:0,
  };
  DB.promotions.push(promo); closeModal('modal-promo'); saveDB(); showToast('✅ เพิ่มโปรโมชั่นแล้ว','ok'); renderPromotions();
}
function togglePromo(id){ const p=DB.promotions.find(x=>x.id===id); if(p){ p.active=!p.active; saveDB(); renderPromotions(); showToast(p.active?'✅ เปิดโปรฯ แล้ว':'⏸️ ปิดโปรฯ แล้ว','ok'); } }
function deletePromo(id){ showConfirm('ลบโปรโมชั่นนี้?',()=>{ DB.promotions=DB.promotions.filter(p=>p.id!==id); saveDB(); showToast('🗑️ ลบแล้ว','ok'); renderPromotions(); }); }

/* ════════════════════
   PRODUCTS
════════════════════ */
function renderProducts(q){
  const u=getCurrentUser(); if(!u) return;
  if(!canManageProducts(u.role)){$('page-products').innerHTML='<div class="denied-state"><div class="di">🔒</div><h3>ไม่มีสิทธิ์เข้าถึง</h3><p>เฉพาะเจ้าของร้านเท่านั้น</p></div>';return;}
  $('product-grid-mgmt').innerHTML=skeletonGrid(6);
  setTimeout(()=>{
    const list=q?DB.products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())):DB.products;
    $('product-grid-mgmt').innerHTML=list.map(p=>{const revs=DB.reviews.filter(r=>r.productId===p.id);const avg=revs.length?(revs.reduce((s,r)=>s+r.rating,0)/revs.length).toFixed(1):null;const margin=p.costPrice>0?Math.round((p.price-p.costPrice)/p.price*100):null;return`<div class="product-card" style="cursor:default"><div class="product-card-img">${p.img?`<img src="${p.img}">`:`<span>${catIcon(p.cat)}</span>`}</div><div class="product-card-body"><div class="product-card-name">${p.name}</div><div class="product-card-price">฿${fmt(p.price)}</div>${p.costPrice>0?`<div style="font-size:10px;color:var(--text-muted)">ทุน ฿${fmt(p.costPrice)}${margin!==null?` • Margin ${margin}%`:''}</div>`:''}<div class="product-card-stock" style="color:var(--info)">คลัง: ${p.centralStock}</div>${avg?`<div class="product-card-rating">⭐ ${avg} (${revs.length})</div>`:'<div class="product-card-rating" style="color:var(--text-faint)">ยังไม่มีรีวิว</div>'}<div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-secondary btn-xs" onclick="openEditProduct(${p.id})" style="flex:1">✏️ แก้ไข</button><button class="btn btn-secondary btn-xs" onclick="openReviewModal(${p.id})">⭐</button><button class="btn btn-danger btn-xs btn-icon" onclick="deleteProduct(${p.id})">🗑️</button></div></div></div>`;}).join('');
  },200);
}
function openAddProduct(){ const u=getCurrentUser(); if(!canManageProducts(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;} STATE.editProductId=null;STATE.tempImg=null;$('modal-prod-title').textContent='➕ เพิ่มสินค้าใหม่';['fp-name','fp-cat','fp-sku','fp-cost'].forEach(id=>{const e=$(id);if(e)e.value='';});['fp-price','fp-stock'].forEach(id=>$(id).value='');$('img-dropzone').innerHTML='<span>📷</span><span>คลิกเพื่อเลือกรูป</span>';openModal('modal-product'); }
function openEditProduct(id){ const u=getCurrentUser(); if(!canManageProducts(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;} const p=DB.products.find(x=>x.id===id);STATE.editProductId=id;STATE.tempImg=p.img;$('modal-prod-title').textContent='✏️ แก้ไขสินค้า';$('fp-name').value=p.name;$('fp-cat').value=p.cat;$('fp-price').value=p.price;$('fp-cost').value=p.costPrice||0;$('fp-stock').value=p.centralStock;$('fp-sku').value=p.sku||'';$('img-dropzone').innerHTML=p.img?`<img src="${p.img}">`:'<span>📷</span><span>คลิกเพื่อเลือกรูป</span>';openModal('modal-product'); }
function handleImageUpload(input){ const file=input.files[0];if(!file)return;const r=new FileReader();r.onload=e=>{STATE.tempImg=e.target.result;$('img-dropzone').innerHTML=`<img src="${STATE.tempImg}">`};r.readAsDataURL(file); }
function saveProduct(){ const name=$('fp-name').value.trim(),cat=$('fp-cat').value.trim()||'อื่นๆ',price=parseFloat($('fp-price').value),costPrice=parseFloat($('fp-cost').value)||0,stock=parseInt($('fp-stock').value),sku=$('fp-sku').value.trim(); if(!name||isNaN(price)||isNaN(stock)){showToast('❌ กรอกข้อมูลให้ครบ','err');return;} if(STATE.editProductId){const p=DB.products.find(x=>x.id===STATE.editProductId);Object.assign(p,{name,cat,price,costPrice,centralStock:stock,sku,img:STATE.tempImg});}else DB.products.push({id:getNextProductId(),name,cat,price,costPrice,sku,img:STATE.tempImg,centralStock:stock,branchStock:{},reviews:[]}); closeModal('modal-product');saveDB();showToast(STATE.editProductId?'✅ แก้ไขสำเร็จ':'✅ เพิ่มสำเร็จ','ok');renderProducts(); }
function deleteProduct(id){ const u=getCurrentUser(); if(!canManageProducts(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;} showConfirm('ลบสินค้านี้?',()=>{DB.products=DB.products.filter(p=>p.id!==id);saveDB();showToast('🗑️ ลบสินค้าแล้ว','ok');renderProducts();}); }

/* ── Review ── */
let _reviewPid=null;
function openReviewModal(pid){ _reviewPid=pid; const p=DB.products.find(x=>x.id===pid); const revs=DB.reviews.filter(r=>r.productId===pid); $('review-modal-body').innerHTML=`<div style="font-size:13px;font-weight:700;margin-bottom:12px">📦 ${p?.name||''}</div><div style="margin-bottom:14px">${revs.length?revs.map(r=>`<div class="comment-item"><div class="comment-meta">${r.userName} • ${'⭐'.repeat(r.rating)} • ${fmtDate(r.time)}</div><div class="comment-text">${r.text}</div></div>`).join(''):'<div style="font-size:12px;color:var(--text-faint);text-align:center;padding:10px">ยังไม่มีรีวิว</div>'}</div><div class="form-group"><label class="form-label">คะแนน</label><div class="star-picker" id="star-picker">${[1,2,3,4,5].map(n=>`<span class="star" onclick="selectStar(${n})">☆</span>`).join('')}</div><input type="hidden" id="review-rating" value="0"></div><div class="form-group"><label class="form-label">รีวิว</label><textarea class="form-input" id="review-input" rows="3" placeholder="เขียนรีวิว..."></textarea></div>`; openModal('modal-review'); }
function selectStar(v){ $('review-rating').value=v; document.querySelectorAll('#star-picker .star').forEach((s,i)=>s.textContent=i<v?'⭐':'☆'); }
function submitReview(){ const rating=parseInt($('review-rating')?.value||0),text=$('review-input')?.value.trim(); if(!rating){showToast('❌ เลือกคะแนนก่อน','err');return;} if(!text){showToast('❌ กรอกรีวิวก่อน','err');return;} const u=getCurrentUser(); DB.reviews.push({id:getNextReviewId(),productId:_reviewPid,userId:u.id,userName:u.name,rating,text,time:new Date()}); saveDB();closeModal('modal-review');showToast('✅ เพิ่มรีวิวแล้ว','ok');renderProducts();applyPosFilter(); }

/* ════════════════════
   STOCK
════════════════════ */
function renderStockOverview(){
  const u=getCurrentUser(); if(!u) return;
  const uid=u.id,isOwner=u.role==='owner';
  const totC=DB.products.reduce((s,p)=>s+p.centralStock,0);
  const totB=DB.products.reduce((s,p)=>s+(isOwner?Object.values(p.branchStock).reduce((a,v)=>a+v,0):(p.branchStock[uid]||0)),0);
  $('stock-stats').innerHTML=`<div class="stat-card c-green"><span class="stat-icon">🏭</span><div class="stat-label">คลังกลาง</div><div class="stat-value v-green" id="ss-central">0 ชิ้น</div></div><div class="stat-card c-blue"><span class="stat-icon">🏪</span><div class="stat-label">สต็อก${isOwner?'รวมสาขา':u.branch}</div><div class="stat-value v-blue" id="ss-branch">0 ชิ้น</div></div><div class="stat-card c-teal"><span class="stat-icon">📦</span><div class="stat-label">สินค้า</div><div class="stat-value v-teal">${DB.products.length} รายการ</div></div><div class="stat-card c-red"><span class="stat-icon">⚠️</span><div class="stat-label">คลังต่ำ (≤10)</div><div class="stat-value v-red">${DB.products.filter(p=>p.centralStock<=10).length}</div></div>`;
  setTimeout(()=>{ animateCount($('ss-central'),totC,700,'','ชิ้น'); animateCount($('ss-branch'),totB,700,'','ชิ้น'); },50);
  const bf=$('stock-branch-filter');
  if(bf&&isOwner){ bf.style.display='flex'; const brs=DB.accounts.filter(a=>a.role!=='owner'); bf.innerHTML=`<span style="font-size:12px;color:var(--text-muted);font-weight:700">สาขา:</span><button class="period-tab ${!STATE._stockBranch||STATE._stockBranch==='all'?'active':''}" onclick="setStockBranch('all')">ทุกสาขา</button>`+brs.map(b=>`<button class="period-tab ${STATE._stockBranch==b.id?'active':''}" onclick="setStockBranch(${b.id})">${b.branch}</button>`).join(''); }
  else if(bf) bf.style.display='none';
  const viewUid=(isOwner&&STATE._stockBranch&&STATE._stockBranch!=='all')?parseInt(STATE._stockBranch):uid;
  const showAll=isOwner&&(!STATE._stockBranch||STATE._stockBranch==='all');
  $('stock-branch-col').textContent=showAll?'สต็อกรวมสาขา':'สต็อก'+(DB.accounts.find(a=>a.id===viewUid)?.branch||u.branch);
  $('stock-table-body').innerHTML=DB.products.map(p=>{const bs=showAll?Object.values(p.branchStock).reduce((s,v)=>s+v,0):(p.branchStock[viewUid]||0);const tot=p.centralStock+Object.values(p.branchStock).reduce((s,v)=>s+v,0);return`<div class="stock-row"><div class="flex-row" style="gap:10px"><div class="td-img">${p.img?`<img src="${p.img}">`:`<span>${catIcon(p.cat)}</span>`}</div><div><div class="fw-bold" style="font-size:13px">${p.name}</div><div style="font-size:10px;color:var(--text-muted)">${p.cat}${p.costPrice>0?` • ทุน ฿${fmt(p.costPrice)}`:''}</div></div></div><div><div class="stock-num" style="color:${p.centralStock<=10?'var(--warning)':'var(--text-primary)'}">${p.centralStock}</div><div class="stock-lbl">คลังกลาง</div></div><div><div class="stock-num" style="color:${bs<=5?'var(--danger)':'var(--text-primary)'}">${bs}</div><div class="stock-lbl">${showAll?'รวมสาขา':'ของสาขา'}</div></div><div><div class="stock-num" style="color:var(--text-muted)">${tot}</div><div class="stock-lbl">รวม</div></div><div><span class="tag ${p.centralStock===0?'tag-danger':p.centralStock<=10?'tag-warning':'tag-success'}">${p.centralStock===0?'หมด':p.centralStock<=10?'ต่ำ':'ปกติ'}</span></div><div class="flex-row" style="gap:5px">${isOwner?`<button class="btn btn-secondary btn-xs" onclick="openAdjustStock(${p.id})">ปรับ</button>`:''}${!isOwner?`<button class="btn btn-primary btn-xs" onclick="openQuickWithdraw(${p.id})">เบิก</button>`:''}</div></div>`;}).join('');
}
function setStockBranch(v){STATE._stockBranch=v;renderStockOverview();}
function openAdjustStock(preId){ const u=getCurrentUser(); if(!canAdjustStock(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;} const sel=$('adj-product-select'); sel.innerHTML='<option value="">-- เลือกสินค้า --</option>'+DB.products.map(p=>`<option value="${p.id}">${p.name} (คลัง: ${p.centralStock})</option>`).join(''); if(preId) sel.value=preId; $('adj-qty').value='';$('adj-note').value='';openModal('modal-adjust-stock'); }
function confirmAdjustStock(){ const id=parseInt($('adj-product-select').value),type=$('adj-type').value,qty=parseInt($('adj-qty').value),note=$('adj-note').value.trim(); if(!id||isNaN(qty)||qty<0){showToast('❌ กรอกข้อมูลให้ถูกต้อง','err');return;} const p=DB.products.find(x=>x.id===id),before=p.centralStock; if(type==='add')p.centralStock+=qty; else if(type==='remove'){if(qty>p.centralStock){showToast('❌ คลังกลางไม่พอ','err');return;}p.centralStock-=qty;}else p.centralStock=qty; addStockLog(id,type,qty,before,p.centralStock,note||'ปรับโดยเจ้าของร้าน'); closeModal('modal-adjust-stock');saveDB();showToast('✅ ปรับคลังกลางสำเร็จ','ok');renderStockOverview(); }

function renderStockLog(){ const u=getCurrentUser();if(!u)return; const logs=u.role==='owner'?DB.stockLogs:DB.stockLogs.filter(l=>l.userId===u.id); const el=$('stocklog-content');if(!el)return; if(!logs.length){el.innerHTML='<div class="empty-state"><div class="ei">📋</div><p>ยังไม่มีประวัติ</p></div>';return;} const tl={add:'➕ เพิ่ม',remove:'➖ ตัด',set:'🔄 กำหนด',sale:'🛒 ขาย',withdraw:'📤 เบิก'}; el.innerHTML=`<div class="glass-card table-wrap"><table><thead><tr><th>เวลา</th><th>สินค้า</th><th>ประเภท</th><th>จำนวน</th><th>ก่อน→หลัง</th><th>โดย</th><th>หมายเหตุ</th></tr></thead><tbody>${logs.slice(0,300).map(l=>`<tr><td style="font-size:11px;white-space:nowrap">${fmtDate(l.time)}</td><td style="font-size:12px">${l.productName}</td><td><span class="tag ${l.type==='sale'?'tag-info':l.type==='add'?'tag-success':l.type==='withdraw'?'tag-warning':'tag-danger'}">${tl[l.type]||l.type}</span></td><td class="fw-bold" style="text-align:center">${l.qty}</td><td style="font-size:12px;color:var(--text-muted)">${l.before}→<strong>${l.after}</strong></td><td style="font-size:11px">${l.userName}</td><td style="font-size:11px;color:var(--text-muted)">${l.note||'—'}</td></tr>`).join('')}</tbody></table></div>`; }

/* ════════════════════
   LOGIN LOG (ใหม่)
════════════════════ */
function renderLoginLog(){
  const u=getCurrentUser(); if(!u||!canManageAccounts(u.role)){$('page-loginlog').innerHTML='<div class="denied-state"><div class="di">🔒</div><h3>เฉพาะเจ้าของร้าน</h3></div>';return;}
  const el=$('loginlog-content'); if(!el) return;
  if(!DB.loginLogs.length){el.innerHTML='<div class="empty-state"><div class="ei">🔐</div><p>ยังไม่มีประวัติ Login</p></div>';return;}
  el.innerHTML=`<div class="glass-card table-wrap"><table><thead><tr><th>วันเวลา</th><th>ชื่อ</th><th>สาขา</th><th>บทบาท</th><th>อุปกรณ์</th></tr></thead><tbody>${DB.loginLogs.slice(0,100).map(l=>{const acc=DB.accounts.find(a=>a.id===l.userId);return`<tr><td style="font-size:11px;white-space:nowrap">${fmtDate(l.time)}</td><td style="font-size:13px;font-weight:700">${l.userName}</td><td style="font-size:12px;color:var(--text-muted)">${l.branch}</td><td><span class="tag ${ROLE_BADGE_CLASS[acc?.role||'staff']}">${ROLE_LABEL[acc?.role||'staff']}</span></td><td style="font-size:12px">${l.device||'—'}</td></tr>`;}).join('')}</tbody></table></div>`;
}

/* ════════════════════
   WITHDRAW
════════════════════ */
function renderWithdraw(){ const u=getCurrentUser();if(!u)return; const isOwner=canApproveWithdraw(u.role),uid=u.id; $('withdraw-subtitle').textContent=isOwner?'เมื่ออนุมัติ: คลังกลางจะลด → สต็อกสาขาจะเพิ่ม':'ส่งคำขอเบิก → เจ้าของอนุมัติ → สต็อกจะเพิ่ม'; $('btn-new-withdraw').style.display=isOwner?'none':'inline-flex'; const list=isOwner?DB.withdrawals:DB.withdrawals.filter(w=>w.userId===uid); const el=$('withdraw-content');if(!el)return; if(!list.length){el.innerHTML='<div class="empty-state"><div class="ei">📤</div><p>ยังไม่มีคำขอเบิก</p></div>';return;} const pending=list.filter(w=>w.status==='pending'),done=list.filter(w=>w.status!=='pending'); let html=''; if(pending.length){html+=`<div style="font-size:11px;font-weight:800;color:var(--warning);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">⏳ รอการอนุมัติ (${pending.length})</div>`+pending.map(w=>renderWithdrawCard(w,isOwner)).join('');} if(done.length){html+=`<div style="font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:18px 0 10px">📁 ดำเนินการแล้ว</div>`+done.map(w=>renderWithdrawCard(w,isOwner)).join('');} el.innerHTML=html;updateWithdrawBadge(); }
function renderWithdrawCard(w,isOwner){ const si=w.status==='pending'?'⏳':w.status==='approved'?'✅':'❌',tc=w.status==='pending'?'tag-warning':w.status==='approved'?'tag-success':'tag-danger',tt=w.status==='pending'?'รอการอนุมัติ':w.status==='approved'?'อนุมัติแล้ว':'ปฏิเสธแล้ว'; return`<div class="wr-card ${w.status}"><div class="wr-card-header"><div class="wr-icon">${si}</div><div style="flex:1"><div class="wr-title">คำขอ #${w.id} — ${w.userName}</div><div class="wr-meta">${w.branch} • ${fmtDate(w.time)}</div>${w.reason?`<div class="wr-meta mt-1">📝 ${w.reason}</div>`:''}</div><span class="tag ${tc}">${tt}</span></div>${w.status==='approved'?`<div class="approved-notice">✅ คลังกลางลดแล้ว → สต็อก${w.branch}เพิ่มแล้ว</div>`:''}<div class="wr-items">${w.items.map(i=>`<div class="wr-item-row"><span>${i.name}</span><span class="fw-bold">× ${i.qty}</span></div>`).join('')}</div>${w.status==='pending'&&isOwner?`<div class="wr-actions"><button class="btn btn-danger btn-sm" onclick="rejectWithdraw(${w.id})">❌ ปฏิเสธ</button><button class="btn btn-primary btn-sm" onclick="previewApprove(${w.id})">✅ อนุมัติ</button></div>`:''}</div>`; }
let withdrawRowCount=0;
function openNewWithdraw(){withdrawRowCount=0;$('wr-rows-container').innerHTML='';$('wr-reason').value='';addWithdrawRow();openModal('modal-withdraw');}
function openQuickWithdraw(pid){openNewWithdraw();setTimeout(()=>{const s=$('wr-rows-container').querySelector('select');if(s)s.value=pid;},50);}
function addWithdrawRow(){ withdrawRowCount++; const rowId='wr-row-'+withdrawRowCount,div=document.createElement('div'); div.id=rowId;div.style.cssText='display:grid;grid-template-columns:1fr 80px 34px;gap:8px;margin-bottom:8px;align-items:center'; div.innerHTML=`<select class="form-input" style="padding:9px 12px">${DB.products.map(p=>`<option value="${p.id}">${p.name} (คลัง:${p.centralStock})</option>`).join('')}</select><input class="form-input" type="number" min="1" value="1" style="padding:9px 10px;text-align:center"><button class="btn btn-secondary btn-xs btn-icon" onclick="document.getElementById('${rowId}').remove()" style="width:34px;height:34px;padding:0;justify-content:center">✕</button>`; $('wr-rows-container').appendChild(div); }
function submitWithdraw(){ const u=getCurrentUser();if(!u)return; const rows=$('wr-rows-container').querySelectorAll(':scope > div'); const items=[];let valid=true; rows.forEach(row=>{const sel=row.querySelector('select'),qty=parseInt(row.querySelector('input').value),p=DB.products.find(x=>x.id===parseInt(sel.value)); if(!p||!qty||qty<1){valid=false;return;} if(qty>p.centralStock){showToast(`❌ คลังกลางไม่พอ: ${p.name}`,'err');valid=false;return;} items.push({productId:p.id,name:p.name,qty});}); if(!valid||!items.length){if(valid)showToast('❌ เพิ่มรายการก่อน','err');return;} const wr={id:getNextWithdrawId(),userId:u.id,userName:u.name,branch:u.branch,items,reason:$('wr-reason').value.trim(),status:'pending',time:new Date()}; DB.withdrawals.unshift(wr); DB.notifications.unshift({id:Date.now(),text:`${u.name} ส่งคำขอเบิก #${wr.id}`,time:new Date(),read:false,page:'withdraw'}); closeModal('modal-withdraw');saveDB();showToast('📤 ส่งคำขอเบิกสำเร็จ','ok');renderWithdraw();updateNotifications();checkAndPushWithdraw(u.name); }
function previewApprove(wid){ const u=getCurrentUser();if(!canApproveWithdraw(u?.role)){showToast('⛔ เฉพาะเจ้าของร้าน','err');return;} const w=DB.withdrawals.find(x=>x.id===wid);if(!w)return; STATE.pendingApproveId=wid; $('approve-preview-body').innerHTML=`<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">การโอนสต็อกที่จะเกิดขึ้น:</div><div class="wr-items">${w.items.map(i=>{const p=DB.products.find(x=>x.id===i.productId);return`<div class="wr-item-row"><span>${i.name}</span><span style="display:flex;gap:12px"><span style="color:var(--danger)">คลัง −${i.qty}(${p?p.centralStock:0}→${p?Math.max(0,p.centralStock-i.qty):0})</span><span style="color:var(--success)">สาขา +${i.qty}</span></span></div>`;}).join('')}</div>`; openModal('modal-approve-preview'); }
function confirmApprove(){ const w=DB.withdrawals.find(x=>x.id===STATE.pendingApproveId);if(!w)return; for(const it of w.items){const p=DB.products.find(x=>x.id===it.productId);if(!p||p.centralStock<it.qty){showToast(`❌ คลังกลางไม่พอ: ${it.name}`,'err');return;}} w.items.forEach(it=>{const p=DB.products.find(x=>x.id===it.productId);if(!p)return;const b=p.centralStock;p.centralStock-=it.qty;addStockLog(p.id,'withdraw',it.qty,b,p.centralStock,`เบิก #${w.id}→${w.branch}`);if(!p.branchStock[w.userId])p.branchStock[w.userId]=0;p.branchStock[w.userId]+=it.qty;}); w.status='approved'; DB.notifications.unshift({id:Date.now(),text:`✅ อนุมัติ #${w.id}: สต็อก${w.branch}เพิ่มแล้ว`,time:new Date(),read:false,page:'withdraw'}); closeModal('modal-approve-preview');saveDB();showToast(`✅ อนุมัติสำเร็จ!`,'ok');renderWithdraw();updateNotifications(); }
function rejectWithdraw(wid){const w=DB.withdrawals.find(x=>x.id===wid);if(!w)return;w.status='rejected';saveDB();showToast('❌ ปฏิเสธแล้ว','warn');renderWithdraw();updateWithdrawBadge();}
function updateWithdrawBadge(){const cnt=DB.withdrawals.filter(w=>w.status==='pending').length;const b=$('withdraw-badge');if(b){b.style.display=cnt>0?'inline-block':'none';b.textContent=cnt;}}

/* ════════════════════
   SHIFT
════════════════════ */
function openShiftSummary(){ const u=getCurrentUser();if(!u||u.role==='owner')return; const active=DB.shifts.find(s=>s.userId===u.id&&!s.endTime); if(!active){showConfirm('เริ่มกะงานใหม่?',()=>{DB.shifts.unshift({id:getNextShiftId(),userId:u.id,userName:u.name,branch:u.branch,startTime:new Date(),endTime:null,salesIds:[],note:''});saveDB();showToast('⏱️ เริ่มกะงานแล้ว','ok');});return;} const ss=DB.sales.filter(s=>s.sellerId===u.id&&!s.voided&&new Date(s.time)>=new Date(active.startTime));const total=ss.reduce((a,s)=>a+s.total,0),cash=ss.filter(s=>s.method==='cash').reduce((a,s)=>a+s.total,0),trans=ss.filter(s=>s.method==='transfer').reduce((a,s)=>a+s.total,0),items=ss.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0); $('shift-summary-body').innerHTML=`<div class="shift-info-row"><span>👤 พนักงาน</span><strong>${u.name}</strong></div><div class="shift-info-row"><span>🏪 สาขา</span><strong>${u.branch}</strong></div><div class="shift-info-row"><span>⏱️ เริ่มกะ</span><strong>${fmtDate(active.startTime)}</strong></div><div class="shift-info-row"><span>🧾 จำนวนบิล</span><strong>${ss.length} บิล</strong></div><div class="shift-info-row"><span>📦 ชิ้นที่ขาย</span><strong>${fmt(items)} ชิ้น</strong></div><div style="background:rgba(26,170,94,.07);border-radius:10px;padding:14px;margin:12px 0"><div class="shift-info-row"><span>💵 เงินสด</span><strong style="color:var(--success)">฿${fmt(cash)}</strong></div><div class="shift-info-row"><span>📱 โอนเงิน</span><strong style="color:var(--info)">฿${fmt(trans)}</strong></div><div class="shift-info-row" style="border-top:1px solid rgba(26,170,94,.2);margin-top:8px;padding-top:8px"><span style="font-weight:800">💰 ยอดรวมกะ</span><strong style="font-size:20px;color:var(--pandan-600)">฿${fmt(total)}</strong></div></div><div class="form-group"><label class="form-label">หมายเหตุปิดกะ</label><input class="form-input" id="shift-note" placeholder="ไม่บังคับ"></div>`; STATE._activeShiftId=active.id;openModal('modal-shift'); }
function confirmCloseShift(){ const u=getCurrentUser();if(!u)return;const shift=DB.shifts.find(s=>s.id===STATE._activeShiftId);if(!shift)return;shift.endTime=new Date();shift.note=$('shift-note')?.value.trim()||'';const ss=DB.sales.filter(s=>s.sellerId===u.id&&!s.voided&&new Date(s.time)>=new Date(shift.startTime));shift.salesIds=ss.map(s=>s.id);shift.totalSales=ss.reduce((a,s)=>a+s.total,0);shift.totalItems=ss.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);closeModal('modal-shift');saveDB();showToast(`✅ ปิดกะแล้ว ยอด ฿${fmt(shift.totalSales)}`,'ok'); }

/* ════════════════════
   CUSTOMERS
════════════════════ */
function renderCustomers(){ const el=$('customers-content');if(!el)return; if(!DB.customers.length){el.innerHTML=`<div class="empty-state"><div class="ei">👤</div><p>ยังไม่มีลูกค้า</p><button class="btn btn-primary mt-2" onclick="openAddCustomer()">+ เพิ่มลูกค้า</button></div>`;return;} const sorted=[...DB.customers].sort((a,b)=>b.points-a.points); el.innerHTML=`<div class="glass-card">${sorted.map((c,i)=>`<div class="acc-row"><div class="acc-row-avatar" style="background:linear-gradient(135deg,${['#1aaa5e','#f0a020','#2196a8','#e03c52','#7b5ea7'][i%5]},${['#0f8f4c','#c87f10','#176e7a','#b02c3e','#5a3e87'][i%5]});color:#fff;font-size:16px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'👤'}</div><div style="flex:1"><div class="fw-bold" style="font-size:14px">${c.name}</div><div style="font-size:11px;color:var(--text-muted)">${c.phone||'ไม่มีเบอร์'} • มาแล้ว ${c.visitCount||0} ครั้ง${c.lastVisit?` • ${fmtDate(c.lastVisit)}`:''}</div></div><div style="text-align:right;margin-right:8px"><div style="font-family:'Prompt',sans-serif;font-size:18px;font-weight:800;color:var(--pandan-600)">${fmt(c.points)} แต้ม</div><div style="font-size:11px;color:var(--text-muted)">ยอดสะสม ฿${fmt(c.totalSpend||0)}</div></div><button class="btn btn-danger btn-xs" onclick="deleteCustomer(${c.id})">🗑️</button></div>`).join('')}</div>`; }
function openAddCustomer(){ showPromptModal('ชื่อลูกค้า','เช่น คุณสมชาย',name=>{ const phone=prompt('เบอร์โทร (ไม่บังคับ):')||''; DB.customers.push({id:getNextCustomerId(),name,phone:phone.trim(),points:0,totalSpend:0,visitCount:0,lastVisit:null,note:''}); saveDB();showToast(`✅ เพิ่มลูกค้า ${name} แล้ว`,'ok');renderCustomers();}); }
function deleteCustomer(id){ showConfirm('ลบลูกค้านี้?',()=>{DB.customers=DB.customers.filter(c=>c.id!==id);saveDB();showToast('🗑️ ลบลูกค้าแล้ว','ok');renderCustomers();}); }
function openCustomerSelect(){ const el=$('customer-select-list');if(!el)return; if(!DB.customers.length){el.innerHTML='<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px">ยังไม่มีลูกค้า<br><button class="btn btn-primary btn-xs mt-2" onclick="openAddCustomer()">+ เพิ่มลูกค้าใหม่</button></div>';}else{el.innerHTML=DB.customers.map(c=>`<div class="acc-row" style="cursor:pointer;padding:10px 14px" onclick="selectCustomer(${c.id})"><div class="acc-row-avatar" style="background:linear-gradient(135deg,#1aaa5e,#0f8f4c);color:#fff;font-size:14px;width:34px;height:34px">👤</div><div style="flex:1"><div style="font-size:13px;font-weight:700">${c.name}</div><div style="font-size:11px;color:var(--text-muted)">${c.phone||'ไม่มีเบอร์'} • ${fmt(c.points)} แต้ม</div></div>${STATE.selectedCustomerId===c.id?'<span class="tag tag-success">✓</span>':''}</div>`).join('');} openModal('modal-customer-select'); }
function selectCustomer(id){ STATE.selectedCustomerId=id;closeModal('modal-customer-select');renderCartCustomer();const c=DB.customers.find(x=>x.id===id);if(c)showToast(`👤 เลือก ${c.name} แล้ว`,'ok'); }

/* ════════════════════
   ACCOUNTS
════════════════════ */
function renderAccounts(){ const u=getCurrentUser();if(!u)return; if(!canManageAccounts(u.role)){$('page-accounts').innerHTML='<div class="denied-state"><div class="di">🔒</div><h3>ไม่มีสิทธิ์เข้าถึง</h3><p>เฉพาะเจ้าของร้านเท่านั้น</p></div>';return;} $('accounts-list').innerHTML=DB.accounts.map(a=>`<div class="acc-row"><div class="acc-row-avatar" style="${a.avatarImg?`background-image:url('${a.avatarImg}');background-size:cover;background-position:center;`:`background:${a.role==='owner'?'linear-gradient(135deg,#1aaa5e,#0f8f4c)':'linear-gradient(135deg,#3cc47a,#1aaa5e)'};`}">${a.avatarImg?'':a.avatar}</div><div style="flex:1"><div class="fw-bold" style="font-size:14px;display:flex;align-items:center;gap:6px">${a.name}${a.online?'<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;background:rgba(26,170,94,.12);color:var(--success);border-radius:20px;padding:2px 7px;font-weight:700">🟢 ออนไลน์</span>':'<span style="font-size:10px;color:var(--text-faint)">⚫ ออฟไลน์</span>'}</div><div style="font-size:11px;color:var(--text-muted)">@${a.username} • ${a.email||'—'} — ${a.branch}${a.lastSeen?` • เห็นล่าสุด ${fmtDate(a.lastSeen)}`:''}</div></div><span class="tag ${ROLE_BADGE_CLASS[a.role]}">${ROLE_LABEL[a.role]}</span>${a.id!==u.id?`<button class="btn btn-danger btn-xs" onclick="deleteAccount(${a.id})">🗑️</button>`:'<span class="tag tag-info" style="font-size:10px">คุณ</span>'}</div>`).join(''); }
function openAddAccount(){ ['acc-name','acc-username','acc-email','acc-password','acc-branch'].forEach(id=>{const el=$(id);if(el)el.value='';}); $('acc-pw-hint')&&($('acc-pw-hint').textContent='');openModal('modal-account'); }
function validatePassword(pw){ if(pw.length<6)return'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'; if(!/[0-9]/.test(pw))return'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'; return null; }
function onPasswordInput(val){ const hint=$('acc-pw-hint');if(!hint)return;const err=validatePassword(val);hint.textContent=err?`⚠️ ${err}`:(val.length>=6?'✅ รหัสผ่านโอเค':'');hint.style.color=err?'var(--warning)':'var(--success)'; }
function saveAccount(){ const u=getCurrentUser();if(!u)return;const name=$('acc-name').value.trim(),username=$('acc-username').value.trim(),email=$('acc-email')?.value.trim()||'',password=$('acc-password').value,role=$('acc-role').value,branch=$('acc-branch').value.trim()||'สาขา'; if(!name||!username||!password){showToast('❌ กรอกข้อมูลให้ครบ','err');return;} const pwErr=validatePassword(password);if(pwErr){showToast('❌ '+pwErr,'err');return;} if(DB.accounts.find(a=>a.username===username)){showToast('❌ ชื่อผู้ใช้นี้มีแล้ว','err');return;} const avatar=role==='owner'?'🌿':role==='manager'?'👤':'🧑'; DB.accounts.push({id:getNextAccId(),name,username,email,password,role,branch,avatar,avatarImg:null,online:false,lastSeen:null}); closeModal('modal-account');saveDB();showToast('✅ เพิ่มบัญชีสำเร็จ','ok');renderAccounts();buildBranchStep(); }
function deleteAccount(id){ showConfirm('ลบบัญชีนี้?',()=>{DB.accounts=DB.accounts.filter(a=>a.id!==id);saveDB();showToast('🗑️ ลบบัญชีแล้ว','ok');renderAccounts();buildBranchStep();}); }

/* ── Avatar Upload ── */
function openAvatarUpload(accId){
  const input=document.createElement('input'); input.type='file'; input.accept='image/*';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>{
      const acc=DB.accounts.find(a=>a.id===accId); if(!acc) return;
      acc.avatarImg=ev.target.result; saveDB();
      showToast('✅ อัปเดตรูปโปรไฟล์แล้ว','ok');
      renderAccounts(); buildBranchStep();
      // update topbar if it's current user
      if(accId===STATE._currentUserId){ const avatarEl=$('user-avatar'); if(avatarEl){ avatarEl.style.backgroundImage=`url('${acc.avatarImg}')`; avatarEl.style.backgroundSize='cover'; avatarEl.style.backgroundPosition='center'; avatarEl.textContent=''; } }
    };
    r.readAsDataURL(file);
  };
  input.click();
}

/* ════════════════════
   NOTIFICATIONS
════════════════════ */
function updateNotifications(){ updateWithdrawBadge(); const unread=DB.notifications.filter(n=>!n.read).length; const dot=$('notif-dot'); if(dot){dot.style.display=unread>0?'block':'none';dot.textContent=unread;} const list=$('notif-list');const u=getCurrentUser(); const rel=u?.role==='owner'?DB.notifications:[]; list.innerHTML=rel.length?rel.slice(0,10).map(n=>`<div class="notif-item" onclick="notifClick('${n.page}')"><div class="flex-row" style="align-items:flex-start;gap:8px">${!n.read?'<div class="notif-unread-dot"></div>':'<div style="width:7px"></div>'}<div><div class="notif-text">${n.text}</div><div class="notif-time">${fmtDate(n.time)}</div></div></div></div>`).join(''):'<div class="empty-state" style="padding:16px"><p>ไม่มีการแจ้งเตือน</p></div>'; }
function toggleNotifPanel(){ const p=$('notif-panel');p.classList.toggle('open');if(p.classList.contains('open')){DB.notifications.forEach(n=>n.read=true);updateNotifications();} }
function closeNotifPanel(){$('notif-panel')?.classList.remove('open');}
function notifClick(page){closeNotifPanel();if(page)navigate(page);}