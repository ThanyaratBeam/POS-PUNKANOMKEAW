/* ═══════════════════════════════════════════
   js/data.js — ข้อมูลและ DB หลัก
═══════════════════════════════════════════ */

const DB = {
  products: [
    { id:1, name:'น้ำดื่ม 600ml',  cat:'เครื่องดื่ม', price:10, sku:'WTR001', img:null, centralStock:200, branchStock:{2:30} },
    { id:2, name:'กาแฟเย็น',       cat:'เครื่องดื่ม', price:45, sku:'COF001', img:null, centralStock:80,  branchStock:{2:15} },
    { id:3, name:'ขนมปังปิ้ง',     cat:'อาหาร',      price:35, sku:'BRD001', img:null, centralStock:60,  branchStock:{2:8}  },
    { id:4, name:'มาม่า',          cat:'อาหาร',      price:7,  sku:'NDL001', img:null, centralStock:150, branchStock:{2:20} },
    { id:5, name:'ลูกอม',          cat:'ขนม',        price:5,  sku:'CDY001', img:null, centralStock:500, branchStock:{2:50} },
    { id:6, name:'ไอศกรีม',        cat:'ขนม',        price:20, sku:'ICE001', img:null, centralStock:60,  branchStock:{2:4}  },
    { id:7, name:'ยาสีฟัน',        cat:'ของใช้',     price:55, sku:'TPT001', img:null, centralStock:40,  branchStock:{2:5}  },
    { id:8, name:'สบู่',           cat:'ของใช้',     price:30, sku:'SOP001', img:null, centralStock:35,  branchStock:{2:2}  },
  ],

  accounts: [
    { id:1, name:'PUN (เจ้าของ)',   username:'owner',   password:'1234', role:'owner',   branch:'เจ้าของร้าน', avatar:'1' },
    { id:2, name:'TAO (ผู้จัดการ)', username:'manager', password:'1234', role:'manager', branch:'สาขา ทองหล่อ',   avatar:'2' },
  ],

  sales: [],
  withdrawals: [],
  notifications: [],
};

// Generate sample sales (30 days)
(function generateSampleSales() {
  const now = new Date();
  const items = ['น้ำดื่ม 600ml','กาแฟเย็น','ขนมปังปิ้ง','มาม่า','ลูกอม'];
  const prices = [10, 45, 35, 7, 5];
  for (let d = 0; d < 30; d++) {
    const count = Math.floor(Math.random() * 7) + 2;
    for (let s = 0; s < count; s++) {
      const i   = Math.floor(Math.random() * items.length);
      const qty = Math.floor(Math.random() * 3) + 1;
      const dt  = new Date(now);
      dt.setDate(dt.getDate() - d);
      dt.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      DB.sales.push({
        id: DB.sales.length + 1,
        items: [{ name: items[i], qty, price: prices[i] }],
        total: prices[i] * qty,
        method: Math.random() > 0.5 ? 'cash' : 'transfer',
        time: new Date(dt),
        seller: 'Title',
        sellerId: 2,
      });
    }
  }
})();

// Helpers
const CAT_EMOJI = { เครื่องดื่ม:'🥤', อาหาร:'🍜', ขนม:'🍭', ของใช้:'🧴', อื่นๆ:'📦' };
const catIcon   = (c) => CAT_EMOJI[c] || '📦';
const $         = (id) => document.getElementById(id);
const fmt       = (n) => Number(n).toLocaleString('th-TH');

function showToast(msg, type = 'ok') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }