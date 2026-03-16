/* ═══════════════════════════════
   data.js  v6
   เพิ่ม: costPrice, promotions, loginLogs, pushNotif
═══════════════════════════════ */
const STORAGE_KEY = 'posPro_db_v6';

const DB = {
  products: [
    { id:1, name:'น้ำดื่ม 600ml', cat:'เครื่องดื่ม', price:10, costPrice:4,  sku:'WTR001', img:null, centralStock:200, branchStock:{2:30,3:20}, reviews:[] },
    { id:2, name:'กาแฟเย็น',      cat:'เครื่องดื่ม', price:45, costPrice:18, sku:'COF001', img:null, centralStock:80,  branchStock:{2:15,3:10}, reviews:[] },
    { id:3, name:'ขนมปังปิ้ง',    cat:'อาหาร',      price:35, costPrice:12, sku:'BRD001', img:null, centralStock:60,  branchStock:{2:8, 3:5},  reviews:[] },
    { id:4, name:'มาม่า',         cat:'อาหาร',      price:7,  costPrice:3,  sku:'NDL001', img:null, centralStock:150, branchStock:{2:20,3:15}, reviews:[] },
    { id:5, name:'ลูกอม',         cat:'ขนม',        price:5,  costPrice:2,  sku:'CDY001', img:null, centralStock:500, branchStock:{2:50,3:30}, reviews:[] },
    { id:6, name:'ไอศกรีม',       cat:'ขนม',        price:20, costPrice:8,  sku:'ICE001', img:null, centralStock:60,  branchStock:{2:4, 3:6},  reviews:[] },
    { id:7, name:'ยาสีฟัน',       cat:'ของใช้',     price:55, costPrice:22, sku:'TPT001', img:null, centralStock:40,  branchStock:{2:5, 3:3},  reviews:[] },
    { id:8, name:'สบู่',          cat:'ของใช้',     price:30, costPrice:11, sku:'SOP001', img:null, centralStock:35,  branchStock:{2:2, 3:4},  reviews:[] },
  ],
  accounts: [
    { id:1, name:'PUN (เจ้าของ)',   username:'owner',   email:'owner@punkanomkeaw.com', password:'1234', role:'owner',   branch:'เจ้าของร้าน',  avatar:'🌿', avatarImg:null, online:false, lastSeen:null },
    { id:2, name:'TAO (ผู้จัดการ)', username:'manager', email:'tao@punkanomkeaw.com',   password:'1234', role:'manager', branch:'สาขา ทองหล่อ', avatar:'👤', avatarImg:null, online:false, lastSeen:null },
    { id:3, name:'NUI (พนักงาน)',   username:'staff1',  email:'nui@punkanomkeaw.com',   password:'1234', role:'staff',   branch:'สาขา ทองหล่อ', avatar:'🧑', avatarImg:null, online:false, lastSeen:null },
  ],
  sales:[], withdrawals:[], notifications:[], comments:[], reviews:[], shifts:[], stockLogs:[], customers:[],
  promotions:[], loginLogs:[],
};

/* migrate old keys */
['posPro_db','posPro_db_v2','posPro_db_v3','posPro_db_v4','posPro_db_v5'].forEach(k=>{
  if(!localStorage.getItem(STORAGE_KEY)&&localStorage.getItem(k)) localStorage.removeItem(k);
});

function saveDB(){
  try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(DB)); }
  catch(e){ console.warn('saveDB:',e); }
  if(typeof window.fbQueueSync==='function') window.fbQueueSync();
}

function loadDB(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return false;
    const s=JSON.parse(raw);
    const toDate=arr=>(arr||[]).map(x=>({...x,time:new Date(x.time)}));
    s.sales=toDate(s.sales); s.notifications=toDate(s.notifications);
    s.withdrawals=toDate(s.withdrawals); s.comments=toDate(s.comments); s.reviews=toDate(s.reviews);
    s.stockLogs=toDate(s.stockLogs||[]);
    s.loginLogs=toDate(s.loginLogs||[]);
    s.customers=(s.customers||[]).map(c=>({...c,lastVisit:c.lastVisit?new Date(c.lastVisit):null}));
    s.shifts=(s.shifts||[]).map(sh=>({...sh,startTime:new Date(sh.startTime),endTime:sh.endTime?new Date(sh.endTime):null}));
    s.products=(s.products||[]).map(p=>({reviews:[],costPrice:0,...p}));
    s.promotions=(s.promotions||[]).map(p=>({...p,startDate:p.startDate?new Date(p.startDate):null,endDate:p.endDate?new Date(p.endDate):null}));
    s.accounts=(s.accounts||[]).map(a=>({
      online:false,email:'',lastSeen:null,avatarImg:null,...a,
      role:['owner','manager','staff'].includes(a.role)?a.role:'staff'
    }));
    s.accounts.forEach(a=>{ if(a.id===1||a.username==='owner') a.role='owner'; });
    Object.assign(DB,s); return true;
  }catch(e){ console.warn('loadDB:',e); return false; }
}

function clearDB(){
  showConfirm('ล้างข้อมูลทั้งหมดและเริ่มใหม่?',()=>{ localStorage.removeItem(STORAGE_KEY); location.reload(); });
}

const _hasData=loadDB();
if(!_hasData){
  const its=['น้ำดื่ม 600ml','กาแฟเย็น','ขนมปังปิ้ง','มาม่า','ลูกอม'],ps=[10,45,35,7,5],cs=[4,18,12,3,2];
  const now=new Date();
  for(let d=0;d<30;d++){
    const cnt=Math.floor(Math.random()*7)+2;
    for(let s=0;s<cnt;s++){
      const i=Math.floor(Math.random()*its.length),qty=Math.floor(Math.random()*3)+1;
      const dt=new Date(now); dt.setDate(dt.getDate()-d);
      dt.setHours(8+Math.floor(Math.random()*12),Math.floor(Math.random()*60));
      DB.sales.push({id:DB.sales.length+1,items:[{name:its[i],qty,price:ps[i],costPrice:cs[i]}],
        total:ps[i]*qty,cost:cs[i]*qty,profit:(ps[i]-cs[i])*qty,
        method:Math.random()>.5?'cash':'transfer',discount:0,promotionId:null,
        time:new Date(dt),seller:'TAO',sellerId:2,branch:'สาขา ทองหล่อ',voided:false,customerId:null});
    }
  }
  saveDB();
}

/* ── ID helpers ── */
const nextId=arr=>arr.length?Math.max(...arr.map(x=>x.id))+1:1;
const getNextProductId=()=>nextId(DB.products);
const getNextAccId=()=>nextId(DB.accounts);
const getNextWithdrawId=()=>nextId(DB.withdrawals);
const getNextCommentId=()=>nextId(DB.comments);
const getNextReviewId=()=>nextId(DB.reviews);
const getNextShiftId=()=>nextId(DB.shifts);
const getNextStockLogId=()=>nextId(DB.stockLogs);
const getNextCustomerId=()=>nextId(DB.customers);
const getNextPromoId=()=>nextId(DB.promotions);
const getNextLoginLogId=()=>nextId(DB.loginLogs);

function addStockLog(productId,type,qty,before,after,note=''){
  const p=DB.products.find(x=>x.id===productId);
  DB.stockLogs.unshift({id:getNextStockLogId(),productId,productName:p?.name||'',
    type,qty,before,after,userId:STATE?.currentUser?.id||0,
    userName:STATE?.currentUser?.name||'ระบบ',note,time:new Date()});
  if(DB.stockLogs.length>500) DB.stockLogs=DB.stockLogs.slice(0,500);
}

function addLoginLog(userId,userName,branch,device){
  DB.loginLogs.unshift({id:getNextLoginLogId(),userId,userName,branch,device,time:new Date()});
  if(DB.loginLogs.length>200) DB.loginLogs=DB.loginLogs.slice(0,200);
}

/* ── Promotion helpers ── */
function getActivePromotions(){
  const now=new Date();
  return DB.promotions.filter(p=>p.active&&(!p.startDate||new Date(p.startDate)<=now)&&(!p.endDate||new Date(p.endDate)>=now));
}
function calcDiscount(total, promoId){
  if(!promoId) return 0;
  const promo=DB.promotions.find(p=>p.id===promoId); if(!promo) return 0;
  if(promo.type==='percent') return Math.round(total*promo.value/100);
  if(promo.type==='fixed') return Math.min(promo.value,total);
  if(promo.type==='minspend'&&total>=promo.minSpend) return Math.min(promo.discount,total);
  return 0;
}

/* ── Helpers ── */
const CAT_EMOJI={เครื่องดื่ม:'🥤',อาหาร:'🍜',ขนม:'🍭',ของใช้:'🧴',อื่นๆ:'📦'};
const catIcon=c=>CAT_EMOJI[c]||'📦';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('th-TH');
const fmtDate=d=>new Date(d).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

const ROLE_LABEL={owner:'เจ้าของร้าน',manager:'ผู้จัดการสาขา',staff:'พนักงาน'};
const ROLE_BADGE_CLASS={owner:'tag-pandan',manager:'tag-success',staff:'tag-info'};
const canSeeFinance=r=>r==='owner';
const canManageProducts=r=>r==='owner';
const canAdjustStock=r=>r==='owner';
const canManageAccounts=r=>r==='owner';
const canApproveWithdraw=r=>r==='owner';

function getCurrentUser(){
  if(!STATE?._currentUserId) return null;
  return DB.accounts.find(a=>a.id===STATE._currentUserId)||null;
}

/* ── THEME ── */
const THEME_KEY='posPro_theme';
function initTheme(){
  const saved=localStorage.getItem(THEME_KEY)||'light';
  applyTheme(saved);
}
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem(THEME_KEY,t);
  const btn=$('btn-theme'); if(btn) btn.textContent=t==='dark'?'☀️':'🌙';
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||'light';
  applyTheme(cur==='dark'?'light':'dark');
}

/* ── SOUND ── */
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let _audioCtx=null;
function getAC(){ if(!_audioCtx) _audioCtx=new AudioCtx(); return _audioCtx; }
function playSound(type){
  try{
    const ctx=getAC(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(type==='add'){
      osc.frequency.setValueAtTime(880,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200,ctx.currentTime+0.08);
      gain.gain.setValueAtTime(0.08,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
      osc.start(); osc.stop(ctx.currentTime+0.15);
    } else if(type==='pay'){
      [523,659,784].forEach((f,i)=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.frequency.value=f; o.type='sine';
        const t=ctx.currentTime+i*0.12;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.12,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.25); o.start(t); o.stop(t+0.25);
      });
    } else if(type==='error'){
      osc.type='sawtooth'; osc.frequency.setValueAtTime(220,ctx.currentTime);
      gain.gain.setValueAtTime(0.06,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);
      osc.start(); osc.stop(ctx.currentTime+0.2);
    }
  }catch(e){}
}

/* ── HAPTIC ── */
function haptic(pattern=[30]){
  if(navigator.vibrate) navigator.vibrate(pattern);
}

/* ── TOAST STACK ── */
const _toasts=[];
function showToast(msg,type='ok',duration=3200){
  haptic(type==='err'?[50,30,50]:[20]);
  const id='toast_'+Date.now();
  const el=document.createElement('div');
  el.id=id; el.className=`toast-item show ${type}`;
  el.innerHTML=`<span>${msg}</span><button onclick="dismissToast('${id}')" style="background:none;border:none;cursor:pointer;margin-left:8px;color:inherit;opacity:.6;font-size:14px">✕</button>`;
  const container=$('toast-container'); if(!container) return;
  container.appendChild(el);
  _toasts.push(id);
  setTimeout(()=>dismissToast(id),duration);
}
function dismissToast(id){
  const el=$(id); if(!el) return;
  el.style.animation='toastOut 0.3s ease forwards';
  setTimeout(()=>{ el.remove(); const i=_toasts.indexOf(id); if(i>-1)_toasts.splice(i,1); },300);
}

/* ── CUSTOM CONFIRM / PROMPT ── */
function showConfirm(msg,onOk,onCancel){
  $('confirm-msg').textContent=msg;
  $('confirm-ok').onclick=()=>{ closeModal('modal-confirm'); onOk?.(); };
  $('confirm-cancel').onclick=()=>{ closeModal('modal-confirm'); onCancel?.(); };
  openModal('modal-confirm');
}
function showPromptModal(label,placeholder,onOk){
  $('prompt-label').textContent=label;
  const inp=$('prompt-input'); inp.value=''; inp.placeholder=placeholder||'';
  $('prompt-ok').onclick=()=>{
    const val=inp.value.trim(); if(!val){showToast('❌ กรอกข้อมูลก่อน','err');return;}
    closeModal('modal-prompt'); onOk?.(val);
  };
  openModal('modal-prompt');
  setTimeout(()=>inp.focus(),100);
}

function openModal(id){ $(id)?.classList.add('open'); }
function closeModal(id){ $(id)?.classList.remove('open'); }

/* ── SKELETON ── */
function skeletonGrid(n=6){
  return Array(n).fill(0).map(()=>`<div class="skeleton-card"><div class="skeleton-img skeleton"></div><div class="skeleton-line skeleton" style="width:70%;margin:8px 0 4px"></div><div class="skeleton-line skeleton" style="width:45%"></div></div>`).join('');
}
function skeletonTable(rows=5){
  return `<div class="glass-card" style="padding:16px">${Array(rows).fill(0).map(()=>`<div class="skeleton-row skeleton" style="margin-bottom:10px"></div>`).join('')}</div>`;
}

/* ── COUNTER ANIMATION ── */
function animateCount(el,target,duration=800,prefix='',suffix=''){
  if(!el) return;
  const start=performance.now();
  const step=now=>{
    const p=Math.min((now-start)/duration,1);
    const ease=1-Math.pow(1-p,3);
    const val=Math.round(target*ease);
    el.textContent=prefix+fmt(val)+suffix;
    if(p<1) requestAnimationFrame(step);
    else el.textContent=prefix+fmt(target)+suffix;
  };
  requestAnimationFrame(step);
}

/* ── PUSH NOTIFICATION ── */
async function requestPushPermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission==='granted') return true;
  const result=await Notification.requestPermission();
  return result==='granted';
}
function sendPushNotif(title,body,icon='🧸'){
  if(Notification.permission!=='granted') return;
  try{ new Notification(title,{body,icon:'/icon-192.png'}); }catch(e){}
}
function checkAndPushLowStock(){
  const low=DB.products.filter(p=>p.centralStock>0&&p.centralStock<=5);
  if(low.length>0){
    sendPushNotif('⚠️ สต็อกใกล้หมด',low.map(p=>p.name).join(', '));
  }
}
function checkAndPushWithdraw(wName){
  sendPushNotif('📤 คำขอเบิกใหม่',`${wName} ส่งคำขอเบิกสินค้า`);
}

/* ─── Firebase sync hook ─── */
function fbQueueSync(collections){
  if(typeof fbSaveDB==='function'&&typeof isFirebaseReady==='function'&&isFirebaseReady()){
    fbSaveDB(collections||['sales','products','withdrawals','customers','notifications','stockLogs','promotions','loginLogs']);
  }
}