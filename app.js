(function(){
"use strict";
/* ================= TIỆN ÍCH ================= */
let ROOT=null;/* khi vẽ lại màn hình lúc đang gõ ô tìm kiếm: vẽ vào khung tạm rồi ghép, giữ nguyên ô đang gõ */
const $=s=>(ROOT&&ROOT.querySelector(s))||document.querySelector(s);
const $$=(s,r)=>{if(!r&&ROOT){const x=[...ROOT.querySelectorAll(s)];if(x.length)return x}return [...(r||document).querySelectorAll(s)]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toNum=v=>{if(typeof v==='number')return isFinite(v)?v:0;v=String(v??'').trim().replace(/\s/g,'');if(!v)return 0;
  if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(v))v=v.replace(/\./g,'').replace(',','.');else if(/^-?\d+,\d+$/.test(v))v=v.replace(',','.');else v=v.replace(/,/g,'');
  const n=parseFloat(v);return isFinite(n)?n:0};
const r3=n=>Math.round((Number(n)||0)*1000)/1000;
const fmt=n=>(Number(n)||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
const fmt0=n=>(Number(n)||0)===0?'':fmt(n);
const vnd=n=>Math.round(Number(n)||0).toLocaleString('vi-VN')+'đ';
const pct=(a,b)=>b?(Math.round(a/b*1000)/10).toLocaleString('vi-VN')+'%':'0%';
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>isoOf(new Date());
const dmy=iso=>iso?iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):'';
const dm=iso=>iso?iso.slice(8,10)+'/'+iso.slice(5,7):'';
const noAcc=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
/* tìm theo nhiều từ (không dấu, không cần đúng thứ tự): "marie my dinh" khớp "Trường Marie Curie … Mỹ Đình" */
const qMatch=(text,nq)=>{if(!nq)return true;const t=noAcc(text);return nq.split(/\s+/).every(w=>t.includes(w))};
const custAddrs=c=>[c.address,c.billAddr,...String(c.alt||'').split('|')].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);
const custText=c=>[c.code,c.name,c.phone,c.taxCode,...(c.groups||[]),...custAddrs(c)].join(' ');
/* chuỗi tìm kiếm không dấu của mỗi khách được tính sẵn 1 lần (3.000+ khách, gõ trên điện thoại không bị khựng) */
const _ctN=new WeakMap();const custNorm=c=>{let t=_ctN.get(c);if(t==null){t=noAcc(custText(c));_ctN.set(c,t)}return t};
/* chuỗi VM: gõ/nói vm, wm, winmart, vinmart, "vin mát", "uyn mát", "vê em", "đáp liu em"… (kể cả VM+/plus) đều quy về "vm" */
const VM_RE=/(^|\s)(vin ?mart|win ?mart|vin ?mat|win ?mat|uyn ?mat|quyn ?mat|vin ?mac|win ?mac|wm|ve em|vi em|ve mo|vi mo|dap ?(bo )?(liu|lu) ?em|dup ?(bo )?(liu|lu) ?em|double ?u ?em|w m|v m)(?=\s|$)/g;
const vmQ=nq=>(' '+nq+' ').replace(VM_RE,'$1vm').replace(VM_RE,'$1vm').replace(/(^|\s)vm\s*(\+|plus|cong|pl)(?=\s|$)/g,'$1vm').replace(/\s+/g,' ').trim();
const VM_ALT=['vm','winmart','vinmart','wm'];
const wMatch=(t,nq)=>!nq||vmQ(nq).split(/\s+/).every(w=>w==='vm'?VM_ALT.some(a=>t.includes(a)):t.includes(w));
const idFor=code=>/^[A-Za-z0-9_\-.~:@+]{1,180}$/.test(code)&&code!=='.'&&code!=='..'?code:'x'+[...new TextEncoder().encode(code)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,190);
const uidShort=()=>Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase();
const ICON={
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.8"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-1 .2"/><path d="M20 4v14h-7"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
};

let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2800)}

/* ================= TRẠNG THÁI ================= */
const R={db:null,user:null,dl:null,uid:null,isOwner:false,checked:false,
  staff:new Map(),requests:new Map(),products:new Map(),customers:new Map(),custByCode:new Map(),custPacks:new Map(),custInd:new Map(),prices:new Map(),orders:[],vouchers:[],settings:{},names:{},
  ready:{},mode:null,tab:null,odraft:null,vdraft:null,photoCache:new Map(),
  per:{p:'month',from:'',to:''},extra:{key:'',list:null},
  ui:{q:'',ordQ:'',ordStatus:'',catTab:'products',catQ:'',stockQ:'',vType:'',vQ:''}};
window.__R=R;
const ST=()=>Object.assign({company:'VIBA FOOD',address:'',taxCode:'',dept:'',whName:'Kho chính',whCode:'KHO',whPlace:'',keeper:'',chiefAcc:'',director:'',
  circular:'(Kèm theo Thông tư số 99/2025/TT-BTC ngày 27/10/2025 của Bộ trưởng Bộ Tài chính)',lockDate:'',salePct:2,shipFee:20000,shipFeeOut:30000,shipFeeFar:50000,shipFarCodes:'07.LB, 16.GL',saleBase:6000000,saleAllow:2500000,saleStd:26,saleComm:2.4,coLoc:'',shipCC:300000,shipCCOff:100000,shipKg:1350,shipPct:3.6,shipSwapStd:5.5,shipSwapPrice:18000},R.settings);
const ROLE_NAME={admin:'Quản lý',sale:'Bán hàng',ship:'Giao hàng',kho:'Thủ kho'};
function myRole(){if(R.isOwner)return'admin';const s=R.staff.get(R.uid);return s&&s.active!==false?s.role:null}
function staffName(id){if(!id)return'—';const s=R.staff.get(id);return (s&&s.name)||R.names[id]||(id===R.uid?'Bạn':'Nhân viên')}
function locked(date){const L=ST().lockDate;return !!(L&&date&&date<=L)}

/* ================= SẢN PHẨM / GIÁ / KHÁCH ================= */
function findProd(code){code=String(code||'').trim();if(!code)return null;for(const p of R.products.values())if(p.code===code)return p;const u=code.toUpperCase();for(const p of R.products.values())if(p.code.toUpperCase()===u)return p;return null}
function findCust(code){if(!code)return null;return R.custByCode.get(code)||null}
function custPL(c){return c&&Array.isArray(c.pl)?c.pl:[]}
function rebuildCustomers(){const m=new Map(),bc=new Map();const packs=[...R.custPacks.entries()].sort((a,b)=>a[0].localeCompare(b[0]));for(const [,arr] of packs)for(const c of arr||[])if(c&&c.code){m.set(idFor(c.code),c)}for(const [id,c] of R.custInd)m.set(id,c);for(const c of m.values())bc.set(c.code,c);R.customers=m;R.custByCode=bc}
/* ẩn mã hàng hỗ trợ / khuyến mại / đổi trả (tên có chữ dt, đt, đổi trả, km, khuyến mại, ht, hỗ trợ) */
const PROD_HIDE=/ (dt|doi tra|km|khuyen mai|ht|ho tro) /;
const pAlias=p=>((R.palias||{})[p.code])||[];/* tên gọi khác (config/prodAlias) */
const pHay=p=>noAcc(p.code+' '+p.name+' '+(p.group||'')+' '+pAlias(p).join(' '));
const wAll=(hay,nq)=>!nq||nq.split(/\s+/).filter(Boolean).every(w=>hay.includes(w));
/* ================= TUYẾN GIAO (config/routes) ================= */
const isoAdd=(iso,n)=>{const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const WD=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];const wdName=iso=>iso?WD[new Date(iso+'T00:00:00').getDay()]:'';
const rN=x=>noAcc(x).toUpperCase().replace(/[^A-Z0-9.]/g,'');
const addrCode=a=>{const m=String(a||'').match(/^\s*\(([^)]*)\)/);return m?rN(m[1].split(/\s*-\s/)[0]):''};
const shipByName=n=>{const k=noAcc(n||'');if(!k)return '';for(const [i,st] of R.staff.entries())if(st.role==='ship'&&st.active!==false&&noAcc(st.name||'')===k)return i;return ''};
const RT=()=>(((R.routes||{}).list)||[]).map(r=>r.ship||!r.shipHint?r:Object.assign({},r,{ship:shipByName(r.shipHint)}));const routeById=id=>RT().find(r=>r.id===id);
function routeOf(o){const a=(o&&o.address)||'';const m2=String(a).match(/^\s*\(\s*20[^)]*\)\s*\(([^)]*)\)/);if(m2){const c2=rN(m2[1]);const r2=RT().find(r=>(r.codes||[]).some(x=>rN(x)===c2));if(r2)return r2.id}const c=addrCode(a);if(c){const r=RT().find(r=>(r.codes||[]).some(x=>rN(x)===c));if(r)return r.id}
  return tinhMap()[tKey(a)]||''}
const tKey=a=>noAcc(a).replace(/\s+/g,' ').replace(/^\(\s*20[^)]*\)\s*/,'').slice(0,24);
function tinhMap(){const g=(R.routes||{}).tinhG;if(!g)return {};if(R._tm&&R._tmSrc===g)return R._tm;const m={};for(const k in g)for(const x of String(g[k]).split('|'))if(x)m[x]=k;R._tmSrc=g;return R._tm=m}
const rtLabel=id=>id==='none'||!id?'Chưa có tuyến':((routeById(id)||{}).name||id);
const myRoutes=()=>RT().filter(r=>r.ship===R.uid).map(r=>r.id);
function shipRtSel(){if(R.ui.rtSel)return R.ui.rtSel;if(!R.routes)return {mode:'all',ids:[]};const m=myRoutes();return R.ui.rtSel=m.length?{mode:'mine',ids:m}:{mode:'all',ids:[]}}
const inRt=o=>{const s=shipRtSel();return s.mode==='all'||s.ids.includes(routeOf(o)||'none')};
const inDay=o=>!R.ui.shipDay||(o.dlvDate||o.date)===R.ui.shipDay;
const shipTodoCount=()=>R.orders.filter(o=>(o.status==='new'&&!o.shipId&&inRt(o)&&inDay(o))||(o.shipId===R.uid&&(o.status==='shipping'||o.status==='new'))).length;
function sortedProducts(){return [...R.products.values()].sort((a,b)=>(toNum(b.soldQty)-toNum(a.soldQty))||a.code.localeCompare(b.code,'vi'))}/* bán chạy nhất (SL bán 3 tháng gần nhất từ MISA, trừ trả lại) lên đầu */
function lastPrice(cust,code){let best=null;for(const o of R.orders){if(o.cust!==cust||o.status==='cancel')continue;for(const l of o.lines||[])if(l.code===code&&toNum(l.price)>0&&(!best||o.date>best.d))best={d:o.date,p:l.g?toNum(l.price):grossP(code,l.price)}}return best?best.p:null}
function defaultPrice(cust,code){const pr=R.prices.get(cust);if(pr&&pr.items&&pr.items[code]!=null)return {p:grossP(code,pr.items[code]),src:'Bảng giá khách'};
  {const cc=findCust(cust);const gs=[...new Set([...((cc&&cc.groups)||[]),...custPL(cc)])];for(const g of gs){const gp=R.prices.get('G:'+g);if(gp&&gp.items&&gp.items[code]!=null)return {p:grossP(code,gp.items[code]),src:'Giá nhóm '+g.replace(/^PL\s*/i,'')}}}
  const lp=lastPrice(cust,code);if(lp!=null)return {p:lp,src:'Giá bán lần trước'};const p=findProd(code);return {p:p?grossP(code,p.price):0,src:'Giá chung'}}

/* ================= ĐƠN HÀNG: TÍNH TOÁN ================= */
const unitNet=l=>{const p=toNum(l.price),d=Math.min(100,Math.max(0,toNum(l.disc)));return d?Math.round(p*(1-d/100)):p};
const lineAmt=l=>Math.round(Math.max(0,toNum(l.qty)-toNum(l.ret))*unitNet(l));
const lineDisc=l=>Math.round(Math.max(0,toNum(l.qty)-toNum(l.ret))*toNum(l.price))-lineAmt(l);
const giftQ=l=>toNum(l.promo)+toNum(l.gift);
const discBlock=(o,total)=>{const dc=(o.lines||[]).reduce((s,l)=>s+lineDisc(l),0);return dc?`<div style="margin-top:8px;border-top:1px solid var(--line,#e3e8ef);padding-top:8px;font-size:14px;line-height:1.8"><div style="display:flex;justify-content:space-between"><span class="muted">Khuyến mại đã trừ</span><span>${vnd(dc)}</span></div><div style="display:flex;justify-content:space-between"><b>Tổng thanh toán</b><b>${vnd(total)}</b></div></div>`:''};
/* v24: giá trên app là giá SAU THUẾ (như khách lẻ). Giá MISA số lẻ = chưa thuế → cộng thuế; giá tròn (bội 500) coi như đã gồm thuế. */
function vatHH(code){const pr=findProd(code);const nm=pr?pr.name:'';if(R.vat){const v=vatOf(nm,false);return typeof v==='number'?v:0}
  const n=noAcc(nm);return /^(san|nem|bo |xoai|mang cau|chanh leo|nuoc dua|dua dong lanh)/.test(n)?0.08:/^(chuoi|sau|khoai|doc mung|mia|dua tuoi|dau tay)/.test(n)?0.05:0}
function grossP(code,p){p=toNum(p);if(!p||p%500===0)return p;const r=vatHH(code);if(!r)return p;const c=p*(1+r),n=Math.round(c/100)*100;return Math.abs(c-n)<=3?n:Math.round(c)}
const orderTotal=o=>(o.lines||[]).reduce((s,l)=>s+lineAmt(l),0);
const sumL=(o,k)=>r3((o.lines||[]).reduce((s,l)=>s+toNum(l[k]),0));
const ST_NAME={new:'Chờ giao',shipping:'Đang giao',done:'Đã giao',cancel:'Đã hủy'};
const ST_CHIP={new:'w',shipping:'b',done:'g',cancel:'r'};
function stChip(o){return `<span class="chip ${ST_CHIP[o.status]||''}">${ST_NAME[o.status]||o.status}</span>`}
function payChip(o){return o.status==='cancel'?'':o.paid?`<span class="chip g">Đã thanh toán${o.payMethod==='cash'?' · TM':o.payMethod==='transfer'?' · CK':''}</span>`:`<span class="chip o">Chưa thanh toán</span>`}
function nextNo(prefix,date,list){const p=prefix+date.slice(2,4)+date.slice(5,7)+'-';let max=0;for(const v of list)if(v.no&&v.no.startsWith(p)){const k=parseInt(v.no.slice(p.length),10);if(k>max)max=k}return p+String(max+1).padStart(3,'0')}
const bumpNo=no=>{const i=no.lastIndexOf('-');return no.slice(0,i+1)+String(parseInt(no.slice(i+1),10)+1).padStart(3,'0')};
function periodRange(){const P=R.per,d=new Date(),y=d.getFullYear(),m=d.getMonth();
  if(P.p==='today')return[today(),today()];
  if(P.p==='week'){const wd=(d.getDay()+6)%7;const s=new Date(y,m,d.getDate()-wd);return[isoOf(s),isoOf(new Date(s.getFullYear(),s.getMonth(),s.getDate()+6))]}
  if(P.p==='last')return[isoOf(new Date(y,m-1,1)),isoOf(new Date(y,m,0))];
  if(P.p==='custom'&&P.from&&P.to)return[P.from,P.to];
  return[isoOf(new Date(y,m,1)),isoOf(new Date(y,m+1,0))]}
const windowStart=()=>{const d=new Date();return isoOf(new Date(d.getFullYear(),d.getMonth()-2,1))};
/* đơn trong khoảng ngày: dữ liệu sống chỉ giữ 3 tháng gần nhất, kỳ cũ hơn tải riêng */
function ordersIn(from,to){if(from>=windowStart())return R.orders.filter(o=>o.date>=from&&o.date<=to);
  const key=from+'|'+to;if(R.extra.key===key)return R.extra.list;R.extra={key,list:null};
  R.db.collection('orders').where('date','>=',from).where('date','<=',to).get().then(s=>{if(R.extra.key!==key)return;R.extra.list=s.docs.map(d=>Object.assign({},d.data(),{id:d.id}));render()}).catch(()=>{toast('Không tải được dữ liệu kỳ cũ');});
  return null}
function periodBar(){const P=R.per;const [f,t]=periodRange();
  return `<div class="stack" style="gap:8px"><div class="seg" id="perSeg">${[['today','Hôm nay'],['week','Tuần này'],['month','Tháng này'],['last','Tháng trước'],['custom','Tùy chọn']].map(([k,l])=>`<button data-per="${k}" class="${P.p===k?'on':''}">${l}</button>`).join('')}</div>
  ${P.p==='custom'?`<div class="hrow"><input type="date" id="perFrom" value="${f}" style="flex:1"><span class="muted">→</span><input type="date" id="perTo" value="${t}" style="flex:1"></div>`:`<div class="tiny muted" style="padding-left:4px">${dmy(f)} – ${dmy(t)}</div>`}</div>`}
function bindPeriod(){$$('[data-per]').forEach(b=>b.onclick=()=>{R.per.p=b.dataset.per;if(R.per.p==='custom'&&!R.per.from){const [f,t]=[isoOf(new Date(new Date().getFullYear(),new Date().getMonth(),1)),today()];R.per.from=f;R.per.to=t}render()});
  const f=$('#perFrom'),t=$('#perTo');if(f)f.onchange=()=>{R.per.from=f.value;render()};if(t)t.onchange=()=>{R.per.to=t.value;render()}}

/* thống kê một tập đơn */
function stats(list){const s={orders:0,qty:0,promo:0,swap:0,ret:0,revenue:0,paid:0,unpaid:0,done:0,doneQty:0,collected:0,outside:0,normal:0,cancel:0,edited:0};
  for(const o of list){if(o.status==='cancel'){s.cancel++;continue}s.orders++;const q=sumL(o,'qty');s.qty+=q;s.promo+=sumL(o,'promo')+sumL(o,'gift');s.swap+=sumL(o,'swap');s.ret+=sumL(o,'ret');
    const t=orderTotal(o);s.revenue+=t;const pa=o.paid?Math.min(t,toNum(o.paidAmount)||t):0;s.paid+=pa;s.unpaid+=Math.max(0,t-pa);
    if((o.lines||[]).some(l=>l.listPrice!=null&&toNum(l.price)!==toNum(l.listPrice)))s.edited++;
    if(o.status==='done'){s.done++;s.doneQty+=q+sumL(o,'promo')+sumL(o,'gift');if(o.paid&&o.paidBy==='ship')s.collected+=pa;if(o.outside)s.outside++;else s.normal++}}
  for(const k of['qty','promo','swap','ret','doneQty'])s[k]=r3(s[k]);return s}
const retRate=s=>pct(s.ret+s.swap,s.qty);

/* ================= ẢNH ================= */
function pickPhoto(){return new Promise(res=>{const inp=$('#fileCam');inp.value='';inp.onchange=async()=>{const f=inp.files[0];if(!f)return res(null);try{res(await compress(f))}catch(e){toast('Không đọc được ảnh này');res(null)}};inp.click()})}
async function compress(file){const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url});
  let max=1280,out='';for(let t=0;t<4;t++){const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const w=Math.round(img.naturalWidth*k),h=Math.round(img.naturalHeight*k);
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let q=.72;out=c.toDataURL('image/jpeg',q);while(out.length>170000&&q>.35){q-=.1;out=c.toDataURL('image/jpeg',q)}if(out.length<=170000)break;max=Math.round(max*.7)}
  return out}finally{URL.revokeObjectURL(url)}}
async function savePhotos(list,orderId,kind){/* tải ảnh song song */return Promise.all(list.map(async p=>{if(p.id)return p.id;const id=orderId+'-'+kind+'-'+uidShort();await R.db.doc('photos/'+id).set({data:p.data,orderId,kind,by:R.uid,at:Date.now()});R.photoCache.set(id,p.data);return id}))}
async function loadPhoto(id){if(R.photoCache.has(id))return R.photoCache.get(id);try{const s=await R.db.doc('photos/'+id).get();const d=s.exists?s.data().data:'';R.photoCache.set(id,d);return d}catch(e){return ''}}
function photoStrip(list,editable,key){return `<div class="photos">${list.map((p,i)=>`<div class="ph" data-ph="${esc(key)}:${i}" ${p.data?`style="background-image:url('${p.data}')"`:`data-pid="${esc(p.id)}"`} role="button" aria-label="Xem ảnh">${editable?`<button class="x" data-phx="${esc(key)}:${i}" aria-label="Xóa ảnh">×</button>`:''}</div>`).join('')}
  ${editable?`<button class="phadd" data-phadd="${esc(key)}">${ICON.cam}<span>Chụp ảnh</span></button>`:''}</div>`}
function hydratePhotos(root){$$('[data-pid]',root).forEach(async el=>{const d=await loadPhoto(el.dataset.pid);if(d){el.style.backgroundImage=`url('${d}')`;el.dataset.src='1'}})}
function bindPhotos(root,getList,onChange){$$('[data-phadd]',root).forEach(b=>b.onclick=async e=>{e.stopPropagation();const d=await pickPhoto();if(d){getList(b.dataset.phadd).push({data:d});onChange()}});
  $$('[data-phx]',root).forEach(b=>b.onclick=e=>{e.stopPropagation();const [k,i]=b.dataset.phx.split(':');getList(k).splice(+i,1);onChange()});
  $$('[data-ph]',root).forEach(el=>el.onclick=async()=>{const [k,i]=el.dataset.ph.split(':');const p=getList(k)[+i];const d=p.data||await loadPhoto(p.id);if(d)showImg(d)});hydratePhotos(root)}
function showImg(d){const v=$('#viewer');v.innerHTML=`<img src="${d}" alt="Ảnh chứng từ">`;v.hidden=false;v.onclick=()=>{v.hidden=true;v.innerHTML=''}}

/* ================= SHEET ================= */
let sheetClose=null;
function openSheet(title,html,bind,opts){const s=$('#sheet');opts=opts||{};
  s.innerHTML=`<div class="pane" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="bar"><button class="btn ghost" data-close>${opts.cancel||'Đóng'}</button><h3>${esc(title)}</h3>${opts.action?`<button class="btn ghost" data-act style="font-weight:700">${esc(opts.action)}</button>`:'<span style="width:64px"></span>'}</div><div class="body">${html}</div></div>`;
  s.hidden=false;document.body.style.overflow='hidden';sheetClose=opts.onClose||null;
  s.onclick=e=>{if(e.target===s&&!s.querySelector('input:not([type=checkbox]),textarea,select'))closeSheet()};s.querySelector('[data-close]').onclick=closeSheet;
  const a=s.querySelector('[data-act]');if(a&&opts.onAction)a.onclick=opts.onAction;bind&&bind(s.querySelector('.body'),s)}
function closeSheet(){const s=$('#sheet');s.hidden=true;s.innerHTML='';document.body.style.overflow='';const f=sheetClose;sheetClose=null;f&&f()}
function confirmSheet(title,text,ok,danger){return new Promise(res=>{openSheet(title,`<p style="margin:0">${text}</p><button class="btn block ${danger?'danger':'pri'}" data-ok>${esc(ok)}</button><button class="btn block" data-no>Thôi</button>`,b=>{
  b.querySelector('[data-ok]').onclick=()=>{sheetClose=null;closeSheet();res(true)};b.querySelector('[data-no]').onclick=()=>{sheetClose=null;closeSheet();res(false)}},{onClose:()=>res(false)})})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#viewer').hidden){$('#viewer').hidden=true;return}if(!$('#sheet').hidden)closeSheet()}});

/* chọn khách hàng */
/* Danh sách tìm kiếm = các ĐỊA ĐIỂM GIAO HÀNG (mỗi địa điểm 1 dòng, kèm tên khách bên dưới); tính sẵn 1 lần */
let _locIdx=null,_locSrc=null;
function locIndex(){if(_locSrc===R.customers&&_locIdx)return _locIdx;const out=[];
  for(const c of R.customers.values()){if(c.stopped)continue;const ls=[c.address,...String(c.alt||'').split('|')].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);
    if(!ls.length)ls.push('');for(const l of ls)out.push({c,loc:l,n:noAcc(l||c.name)})}
  out.sort((x,y)=>(x.loc||x.c.name).localeCompare(y.loc||y.c.name,'vi'));_locSrc=R.customers;_locIdx=out;return out}
function pickCustomer(onPick){let q='';let shown=[];const draw=b=>{const nq=noAcc(q);
  shown=locIndex().filter(x=>wMatch(x.n,nq)).slice(0,80);
    b.querySelector('#pcList').innerHTML=shown.length?shown.map((x,i)=>`<div class="row tap" data-i="${i}"><div class="grow"><div class="t ell">📍 ${esc(x.loc||'(chưa có địa điểm giao)')}</div><div class="s ell">${esc(x.c.name)}${x.c.phone?' · '+esc(x.c.phone):''}</div>${custPL(x.c).length?`<div class="tiny" style="color:var(--accent)">${esc(custPL(x.c).join(', '))}</div>`:''}</div><span class="chev">›</span></div>`).join(''):`<div class="empty">${R.customers.size?'Không tìm thấy địa điểm giao phù hợp.':'Chưa có khách hàng nào.'}</div>`;
    $$('[data-i]',b).forEach(r=>r.onclick=()=>{const x=shown[+r.dataset.i];closeSheet();onPick(x.c,x.loc||'')})};
  openSheet('Chọn địa điểm giao',`<input id="pcQ" placeholder="Tìm địa điểm giao hàng (vd: vm ha dong)" autocomplete="off"><button class="btn" id="pcNew">${ICON.plus.replace('<svg','<svg width="18" height="18"')} Thêm khách mới</button><div class="group pick" id="pcList"></div>`,b=>{
    draw(b);const i=b.querySelector('#pcQ');let dT;i.oninput=()=>{clearTimeout(dT);dT=setTimeout(()=>{q=i.value;draw(b)},150)};setTimeout(()=>i.focus(),50);
    b.querySelector('#pcNew').onclick=()=>{closeSheet();editCustomer(null,c=>onPick(c),q)}})}
/* chọn sản phẩm */
function pickProduct(cust,onPick){let q='';const bal=stockMap();const draw=b=>{const nq=noAcc(q);const list=sortedProducts().filter(p=>p.active!==false&&wAll(pHay(p),nq)).slice(0,80);
    b.querySelector('#ppList').innerHTML=list.length?list.map(p=>{const dp=cust?defaultPrice(cust,p.code):{p:grossP(p.code,p.price)};const t=bal.get(p.code)||0;return `<div class="row tap" data-p="${esc(p.code)}"><div class="grow"><div class="t ell">${esc(p.name)}</div><div class="s">${esc(p.code)} · ${esc(p.unit)} · tồn ${fmt(t)}</div>${pAlias(p).length?`<div class="tiny" style="color:var(--accent)">${esc(pAlias(p).join(' · '))}</div>`:''}</div><div class="money">${dp.p?vnd(dp.p):''}</div></div>`}).join(''):`<div class="empty">${R.products.size?'Không tìm thấy sản phẩm.':'Chưa có sản phẩm. Quản lý cần thêm danh mục.'}</div>`;
    $$('[data-p]',b).forEach(r=>r.onclick=()=>{closeSheet();onPick(findProd(r.dataset.p))})};
  openSheet('Chọn sản phẩm',`<input id="ppQ" placeholder="Tìm tên hoặc mã sản phẩm" autocomplete="off"><div class="group pick" id="ppList"></div>`,b=>{draw(b);const i=b.querySelector('#ppQ');i.oninput=()=>{q=i.value;draw(b)};setTimeout(()=>i.focus(),50)})}

/* thêm / sửa khách */
/* ================= KHÁCH HÀNG MỚI – tạo mã theo quy tắc (file "TẠO MÃ KHÁCH MỚI") =================
   Đầu mã: Công nợ → KH ; Thanh toán luôn + khách tỉnh → NLT ; Thanh toán luôn Hà Nội → TTL
   Có hóa đơn: đầu mã + MST ; Không hóa đơn: đầu mã + năm + tháng + STT (2 số), Tên khách = địa điểm giao */
const KH_PL=['PL Nhóm CVS','PL Nhóm Horeca','PL Nhóm khách coffee','PL Nhóm khách lẻ','PL Nhóm khách sỉ','PL Nhóm khách tỉnh','PL Nhóm kho','PL Nhóm NPP','PL Nhóm siêu thị','PL Nhóm suất ăn','PL Nhóm xuất khẩu'];
const KH_RT=[['01.HK','Hoàn Kiếm'],['02.ĐĐ','Đống Đa'],['03.BĐ','Ba Đình'],['04.HBT','Hai Bà Trưng'],['05.HM','Hoàng Mai'],['06.TX','Thanh Xuân'],['07.LB','Long Biên'],['08.NTL','Nam Từ Liêm'],['09.BTL','Bắc Từ Liêm'],['10.TH','Tây Hồ'],['11.CG 2','Cầu Giấy 2'],['12.HĐ','Hà Đông'],['13.HĐ','Hoài Đức'],['14.TT','Thanh Trì'],['16.GL','Gia Lâm'],['19.Time','Times City'],['20.TỈNH','Khách tỉnh']];
const CG_GENERIC=new Set(['chi','cho','the','tam','khach','nhom','gia','cong','viba','mini','home','fresh','green','smart','food','mart','coffee','ho','hop','ky','nong']);
function autoGroup(text){const L=((R.cgroups||{}).list)||[];const t=' '+noAcc(text).replace(/[^a-z0-9+]+/g,' ')+' ';const tw=t.trim().split(/[^a-z0-9]+/).filter(Boolean);let best=null,amb=false;
  if(/ (vm|vinmart|winmart|wm|vm\+) /.test(t)||/ vm\+/.test(t)){const g=L.find(g=>noAcc(g.name)==='vinmart');if(g)return g}
  for(const g of L){const n=noAcc(g.name.replace(/^\d+\.\s*/,''));if(/^pl /.test(n)||/^(nhom|khach|gia|kh0|cong ty|ct )/.test(n))continue;const nc=n.replace(/[^a-z0-9]/g,'');const first=(n.split(/[^a-z0-9]+/).filter(Boolean)[0])||'';
    let sc=0;if(nc.length>=5&&tw.some((w,i)=>{if(w.length<2||(i>0&&tw[i-1].length<2))return false;let c='';for(let j=i;j<tw.length&&c.length<nc.length;j++)c+=tw[j];return c===nc}))sc=100+nc.length;else if(nc.length>=4&&t.includes(' '+n+' '))sc=90+nc.length;else if(first.length>=4&&!CG_GENERIC.has(first)&&t.includes(' '+first+' '))sc=first.length;
    if(!sc)continue;if(!best||sc>best.sc){amb=best&&best.sc===sc&&sc<90;best={g,sc}}else if(sc===best.sc&&sc<90)amb=true}
  return best&&!amb?best.g:null}
function nextCustNo(prefix,ym){const re=new RegExp('^'+prefix+ym+'(\\d{2,})$','i');let mx=0;for(const c of R.customers.values()){const m=String(c.code||'').match(re);if(m)mx=Math.max(mx,+m[1])}return prefix+ym+String(mx+1).padStart(2,'0')}
function newCustomer(after,preName){const S={pl:'',pay:'tt',rt:'',rt2:'',inv:false,mst:'',name:'',bill:'',email:'',loc:preName||'',phone:'',grp:undefined,mstMsg:'',busy:false};
  const prefix=()=>S.pay==='cn'?'KH':(S.rt==='20.TỈNH'?'NLT':'TTL');const ym=()=>{const d=today();return d.slice(0,4)+d.slice(5,7)};
  const locFull=()=>{const l=S.loc.trim();if(!l)return'';if(/^\s*\(\s*\d{2}\./.test(l)||!S.rt)return l;if(S.rt==='20.TỈNH')return '(20.TỈNH)'+(S.rt2?'('+S.rt2+')':'')+' '+l;return '('+S.rt+') '+l};
  const code=()=>S.inv?(S.mst.trim()?prefix()+S.mst.trim().replace(/\s+/g,''):''):nextCustNo(prefix(),ym());
  const auto=()=>S.grp===undefined?autoGroup((S.inv?S.name+' ':'')+S.loc):S.grp;
  const draw=b=>{const g=auto(),c=code(),ex=c&&findCust(c);
    b.innerHTML=`<div class="stack">
     <div class="sec" style="margin:0">1. Phân loại khách</div>
     <div class="card stack" style="gap:10px">
      <label class="f"><span>Nhóm khách hàng (nhóm giá MISA) <span style="color:var(--bad)">*</span></span><select id="nc_pl"><option value="">— Chọn nhóm —</option>${KH_PL.map(x=>`<option ${S.pl===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <div><div class="tiny muted" style="margin-bottom:6px">Nhóm chuỗi (app tự nhận theo tên khách / địa điểm giao)</div>${g?`<span class="chip b" style="font-size:14px;padding:6px 12px">${esc(g.name)} <span id="nc_grpx" style="margin-left:6px;cursor:pointer">✕</span></span>`:`<span class="tiny muted">${S.grp===null?'Đã bỏ nhóm chuỗi':'Chưa nhận ra chuỗi nào'}</span>${S.grp===null?' <a href="#" id="nc_grpr" class="tiny">Tự nhận lại</a>':''}`}</div>
      <div><div class="tiny muted" style="margin-bottom:6px">Loại thanh toán <span style="color:var(--bad)">*</span></div><div class="seg"><button data-pay="tt" class="${S.pay==='tt'?'on':''}">Thanh toán luôn</button><button data-pay="cn" class="${S.pay==='cn'?'on':''}">Công nợ</button></div></div>
      <label class="f"><span>Tuyến / khu vực giao <span style="color:var(--bad)">*</span></span><select id="nc_rt"><option value="">— Chọn tuyến —</option>${KH_RT.map(([k,n])=>`<option value="${esc(k)}" ${S.rt===k?'selected':''}>${esc(k)} – ${esc(n)}</option>`).join('')}</select></label>
      ${S.rt==='20.TỈNH'?`<label class="f"><span>Tuyến giao trong Hà Nội (ship mang hàng đi) <span style="color:var(--bad)">*</span></span><select id="nc_rt2"><option value="">— Chọn tuyến —</option>${KH_RT.filter(([k])=>k!=='20.TỈNH').map(([k,n])=>`<option value="${esc(k)}" ${S.rt2===k?'selected':''}>${esc(k)} – ${esc(n)}</option>`).join('')}</select></label>`:''}
     </div>
     <div class="sec" style="margin:0">2. Thông tin xuất hóa đơn</div>
     <div class="card stack" style="gap:10px">
      <div class="toggle" style="padding:0"><div><div style="font-weight:600">Khách lấy hóa đơn</div><div class="tiny muted">${S.inv?'Gõ MST rồi bấm Lấy thông tin – app tự điền Tên, Địa chỉ':'Không xuất hóa đơn: Tên khách = Địa điểm giao hàng'}</div></div><input type="checkbox" class="sw" id="nc_inv" ${S.inv?'checked':''}></div>
      ${S.inv?`<label class="f"><span>Mã số thuế <span style="color:var(--bad)">*</span></span><div style="display:flex;gap:8px"><input id="nc_mst" value="${esc(S.mst)}" inputmode="numeric" style="flex:1" placeholder="VD: 0109801255"><button class="btn sm" id="nc_lookup" ${S.busy?'disabled':''}>${S.busy?'Đang lấy…':'Lấy thông tin'}</button></div></label>${S.mstMsg}
      <label class="f"><span>Tên khách hàng (theo hóa đơn) <span style="color:var(--bad)">*</span></span><input id="nc_name" value="${esc(S.name)}"></label>
      <label class="f"><span>Địa chỉ (theo hóa đơn) <span style="color:var(--bad)">*</span></span><textarea id="nc_bill" rows="2">${esc(S.bill)}</textarea></label>
      <label class="f">Email nhận hóa đơn<input id="nc_email" value="${esc(S.email)}" inputmode="email"></label>`:''}
     </div>
     <div class="sec" style="margin:0">3. Giao hàng</div>
     <div class="card stack" style="gap:10px">
      <label class="f"><span>Địa điểm giao hàng <span style="color:var(--bad)">*</span></span><textarea id="nc_loc" rows="2" placeholder="VD: Easy Mart tòa Diamond, Xuân La">${esc(S.loc)}</textarea></label>
      <div class="tiny muted" style="margin-top:-6px">${S.rt?'Lưu thành: <b>'+esc(locFull()||(S.rt==='20.TỈNH'?'(20.TỈNH)'+(S.rt2?'('+S.rt2+')':'(mã tuyến)'):'('+S.rt+')')+' …')+'</b>':'Chọn tuyến để app thêm mã tuyến ở đầu.'}</div>
      <label class="f">Số điện thoại<input id="nc_phone" value="${esc(S.phone)}" inputmode="tel"></label>
     </div>
     <div style="background:var(--blue-soft,#e7f0fa);border:1.5px solid #1b6aa5;border-radius:12px;padding:12px 14px"><div class="tiny muted">Mã khách hàng (app tự tạo)</div><div style="font-size:24px;font-weight:800;color:#1b6aa5;letter-spacing:.5px">${esc(c||'—')}</div>
      <div class="tiny" style="margin-top:4px">${S.pay==='cn'?'Khách công nợ → đầu mã <b>KH</b>':S.rt==='20.TỈNH'?'Khách tỉnh, thanh toán luôn → đầu mã <b>NLT</b>':'Khách Hà Nội, thanh toán luôn → đầu mã <b>TTL</b>'}${S.inv?' + MST':' + năm '+ym().slice(0,4)+' + tháng '+ym().slice(4)+' + STT'}</div>
      ${!S.inv&&locFull()?`<div class="tiny muted" style="margin-top:4px">Tên khách hàng: <b style="color:var(--fg)">${esc(locFull())}</b></div>`:''}
      ${ex?`<div class="alert r" style="margin-top:8px">Mã ${esc(c)} đã có: ${esc(ex.name)}. Khách này đã có trong danh mục – đóng lại và chọn khách có sẵn.</div>`:''}</div>
     <div id="nc_msg"></div><button class="btn block pri" id="nc_save">Lưu khách hàng</button></div>`;
    const v=id=>b.querySelector('#'+id);const keep=(id,k)=>{const x=v(id);if(x)x.oninput=()=>{S[k]=x.value;if(k==='loc'||k==='name'){clearTimeout(S._t);S._t=setTimeout(()=>{const p=document.activeElement&&document.activeElement.id,ss=document.activeElement&&document.activeElement.selectionStart;draw(b);const n=p&&v(p);if(n){n.focus();try{n.setSelectionRange(ss,ss)}catch(e){}}},500)}}};
    keep('nc_mst','mst');keep('nc_name','name');keep('nc_bill','bill');keep('nc_email','email');keep('nc_loc','loc');keep('nc_phone','phone');
    v('nc_pl').onchange=e=>{S.pl=e.target.value;draw(b)};v('nc_rt').onchange=e=>{S.rt=e.target.value;if(S.rt==='20.TỈNH'&&!S.pl)S.pl='PL Nhóm khách tỉnh';draw(b)};const r2=v('nc_rt2');if(r2)r2.onchange=e=>{S.rt2=e.target.value;draw(b)};
    $$('[data-pay]',b).forEach(x=>x.onclick=()=>{S.pay=x.dataset.pay;draw(b)});v('nc_inv').onchange=e=>{S.inv=e.target.checked;draw(b)};
    const gx=v('nc_grpx');if(gx)gx.onclick=()=>{S.grp=null;draw(b)};const gr=v('nc_grpr');if(gr)gr.onclick=e=>{e.preventDefault();S.grp=undefined;draw(b)};
    const lk=v('nc_lookup');if(lk)lk.onclick=async()=>{const m=S.mst.trim().replace(/\s+/g,'');if(!/^\d{10}(-\d{3})?$/.test(m)){S.mstMsg='<div class="alert r">MST phải có 10 số (chi nhánh: 10 số-3 số).</div>';return draw(b)}
      S.busy=true;draw(b);try{const r=await fetch('https://api.vietqr.io/v2/business/'+encodeURIComponent(m)).then(r=>r.json());
        if(r&&r.code==='00'&&r.data){S.name=r.data.name||'';S.bill=r.data.address||'';S.mst=m;S.mstMsg=`<div class="alert g" style="margin:0">✓ Đã tự điền từ dữ liệu Tổng cục Thuế · <b>${esc(r.data.status||'')}</b><br><a href="https://masothue.com/Search/?q=${encodeURIComponent(m)}&type=auto" target="_blank" rel="noopener">Xem trên masothue.com ↗</a></div>`;if(!/hoạt động/i.test(r.data.status||''))S.mstMsg=S.mstMsg.replace('alert g','alert w')}
        else S.mstMsg='<div class="alert w">Không tìm thấy MST này – kiểm tra lại hoặc nhập tay Tên, Địa chỉ.</div>'}catch(e){S.mstMsg='<div class="alert w">Chưa lấy được thông tin (mạng?) – nhập tay Tên, Địa chỉ.</div>'}
      S.busy=false;draw(b)};
    v('nc_save').onclick=async()=>{const err=t=>v('nc_msg').innerHTML='<div class="alert r">'+t+'</div>';
      if(!S.pl)return err('Chọn nhóm khách hàng.');if(!S.rt)return err('Chọn tuyến / khu vực giao.');if(S.rt==='20.TỈNH'&&!S.rt2&&!/^\s*\(\s*\d{2}\./.test(S.loc))return err('Khách tỉnh: chọn thêm tuyến giao trong Hà Nội.');if(!S.loc.trim())return err('Nhập địa điểm giao hàng.');
      if(S.inv&&(!/^\d{10}(-\d{3})?$/.test(S.mst.trim())||!S.name.trim()||!S.bill.trim()))return err('Khách lấy hóa đơn cần đủ MST (10 số), Tên và Địa chỉ.');
      const cd=code();if(findCust(cd))return err('Mã '+esc(cd)+' đã có trong danh mục.');const g=auto();
      const d={code:cd,name:S.inv?S.name.trim():locFull(),address:locFull(),billAddr:S.inv?S.bill.trim():'',taxCode:S.inv?S.mst.trim():'',email:S.inv?S.email.trim():'',phone:S.phone.trim(),area:S.rt,
        pl:[S.pl],groups:g?[g.name]:[],payType:S.pay==='cn'?'Công nợ':'Thanh toán luôn',isNew:true,createdAt:Date.now(),createdBy:R.uid,updatedAt:Date.now(),updatedBy:R.uid};
      v('nc_save').disabled=true;try{await R.db.doc('customers/'+idFor(cd)).set(d);R.custInd.set(idFor(cd),d);rebuildCustomers();toast('Đã tạo khách '+cd);closeSheet();after&&after(d);render()}catch(e){v('nc_save').disabled=false;err('Không lưu được ('+esc(e.code||'lỗi')+').')}}};
  openSheet('Khách hàng mới','',draw)}
function editCustomer(c,after,preName){if(!c)return newCustomer(after,preName);const isNew=!c;c=c||{code:'',name:preName||'',address:'',phone:'',area:''};
  openSheet(isNew?'Khách hàng mới':'Sửa khách hàng',`<label class="f">Tên khách hàng *<input id="ec_name" value="${esc(c.name)}"></label>
   <label class="f">Địa chỉ giao hàng<textarea id="ec_addr" rows="2">${esc(c.address||'')}</textarea></label>
   <div class="fgrid"><label class="f">Số điện thoại<input id="ec_phone" inputmode="tel" value="${esc(c.phone||'')}"></label><label class="f">Khu vực / tuyến<input id="ec_area" value="${esc(c.area||'')}"></label>
   <label class="f">Mã khách (MISA)<input id="ec_code" value="${esc(c.code)}" ${isNew?'placeholder="Để trống sẽ tự tạo"':'readonly'}></label></div>
   <div id="ec_msg"></div><button class="btn block pri" id="ec_save">Lưu khách hàng</button>`,b=>{
    b.querySelector('#ec_save').onclick=async()=>{const name=$('#ec_name').value.trim();if(!name){$('#ec_msg').innerHTML='<div class="alert r">Cần nhập tên khách hàng.</div>';return}
      let code=$('#ec_code').value.trim()||('KH'+uidShort());if(isNew&&findCust(code)){$('#ec_msg').innerHTML='<div class="alert r">Mã khách đã tồn tại.</div>';return}
      let d={code,name,address:$('#ec_addr').value.trim(),phone:$('#ec_phone').value.trim(),area:$('#ec_area').value.trim(),updatedAt:Date.now(),updatedBy:R.uid};
      const old=findCust(code)||{};const dd=Object.assign({},old,d);try{await R.db.doc('customers/'+idFor(code)).set(dd);R.custInd.set(idFor(code),dd);rebuildCustomers();d=dd;toast('Đã lưu khách '+name);closeSheet();after&&after(d);render()}catch(e){$('#ec_msg').innerHTML='<div class="alert r">Không lưu được ('+esc(e.code||'lỗi')+').</div>'}}})}

/* ================= SALE: LÊN ĐƠN ================= */
function newOrderDraft(){return {id:null,cust:'',custName:'',address:'',phone:'',lines:[],paid:false,paidAmount:'',payPhotos:[],note:'',date:today(),dlvDate:isoAdd(today(),1),showMore:{},delivered:true}}
/* ===== ĐỌC ĐƠN BẰNG GIỌNG NÓI =====
   Sale đọc 1 câu, vd: "Giao VM Hà Đông, chuối tiêu 170 gam 20 quả, nem bùi 10 gói khuyến mại 1 gói, đã chuyển khoản, ghi chú giao trước 9 giờ"
   → app tách địa điểm giao + mặt hàng + số lượng, cho xem lại, bấm "Điền vào đơn". KHÔNG tự gửi đơn. */
/* ---- bộ phân tích câu đọc đơn (v2): giữ DẤU để phân biệt bơ/bổ/bó, năm/nam; hiểu cả "10 gói bơ" lẫn "bơ 10 gói" ---- */
const vLow=s=>String(s??'').normalize('NFC').toLowerCase();
const vHasAcc=s=>/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/.test(vLow(s));
/* đơn vị (dạng có dấu) → mã đơn vị chuẩn */
const VU={kg:'kg',ký:'kg',kí:'kg',ki:'kg',ky:'kg',kilo:'kg',cân:'kg',gói:'goi',goi:'goi',hộp:'hop',hop:'hop',quả:'qua',qua:'qua',trái:'qua',khay:'khay',thùng:'thung',thung:'thung',túi:'tui',tui:'tui',bịch:'tui',chai:'chai',lọ:'lo',hũ:'hu',nải:'nai',buồng:'nai',bó:'bo',cái:'cai',chiếc:'cai',kiện:'kien',bao:'bao',củ:'cu',mẹt:'me',bát:'bat',cây:'cay',lon:'lon',set:'set',vỉ:'vi',hủ:'hu',miếng:'mieng',cốc:'coc',ly:'coc'};
const vUnit=u=>{const t=vLow(u).replace(/[^\p{L}\p{N}]/gu,'');return VU[t]||VU[noAcc(t)]||noAcc(t)};
const VNUM={không:0,linh:0,lẻ:0,một:1,mốt:1,hai:2,ba:3,bốn:4,tư:4,năm:5,lăm:5,nhăm:5,sáu:6,bảy:7,bẩy:7,tám:8,chín:9};
const VNUMX={mười:'m',mươi:'m',chục:'m',trăm:'t',nghìn:'n',ngàn:'n'};
function vWordsToNum(ws){let tot=0,h=0,p=null,aft=false;
  for(const w of ws){if(w in VNUM){if(aft){h+=VNUM[w];aft=false;p=null}else p=VNUM[w]}
    else if(VNUMX[w]==='m'){h+=(p==null?1:p)*10;p=null;aft=true}
    else if(VNUMX[w]==='t'){h+=(p==null?1:p)*100;p=null;aft=false}
    else if(VNUMX[w]==='n'){tot+=((h+(p||0))||1)*1000;h=0;p=null;aft=false}else return null}
  return tot+h+(p||0)}
const isNumW=w=>w in VNUM||w in VNUMX;
/* chữ → token; quy cách "170 gam" → "170g" */
function vTokens(text){let s=' '+vLow(text)+' ';
  s=s.replace(/[,;!?\n]+/g,' | ').replace(/\.(?!\d)/g,' | ');
  s=s.replace(/(\d+)\s*(gam|gram|gờ ram|gr|g)(?=[\s|])/g,'$1g').replace(/(\d+)\s*(mi li lít|mililít|ml)(?=[\s|])/g,'$1ml');
  s=s.replace(/\b(ki lô gam|ki lô|kilôgam|kilogram|kilô|kí lô|ký lô)\b/g,'kg');
  s=s.replace(/(^|\s)(vin ?mart|win ?mart|vin ?mát|win ?mát|uyn ?mát|quyn ?mát|vin ?mác|win ?mác|wm|vê em|vi em|vê mờ|vi mờ|đáp ?(bờ )?(liu|lu) ?em|đắp ?(bờ )?(liu|lu) ?em|đúp ?(bờ )?(liu|lu) ?em|double ?u ?em|w m|v m)(?=\s|$)/g,'$1vm').replace(/(^|\s)vm\s*(\+|plus|cộng)(?=\s|$)/g,'$1vm');
  s=vAliasNorm(s);
  return s.split(/\s+/).filter(Boolean).map(t=>t==='|'?t:t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.,]+$/gu,'')).filter(Boolean)}
/* cách đọc quy cách chuối: pack (péc/pắc…), plus (plớt…), mini, 1F (một ép…), pack 3 quả → 1 từ */
function vAliasNorm(s){const B='(?=\\s|\\|$)';const r=(a,b)=>{s=s.replace(new RegExp('(^|\\s)(?:'+a+')'+B,'g'),(m,p)=>p+b)};
  r('pack|páck|péc|pếch|pẹc|pắc|pặc|pác|pạc|pách|pẹt|bẹc','pack');r('plus|plớt|plút|plu|plợt|pờ lớt|pờ lút|pơ lớt|pơ lút|pờ lu','plus');r('mini|mi ni|mi-ni|min ni|mí ni','mini');
  r('1f|1 f|một f|1 ép|một ép|1 ép phờ|một ép phờ|wan ép|oan ép|uăn ép|one f|1 phờ|một phờ','1f');r('pack (?:3|ba) (?:quả|trái)|pack3 (?:quả|trái)','pack3qua');return s}
/* so khớp 1 từ nói với tên: đúng dấu = 1; khác dấu chỉ chấp nhận với từ ≥3 chữ hoặc khi câu gõ không dấu */
function vWordHit(w,acc,flat,flatStr,noAccMode){if(acc.includes(w))return 1;const f=noAcc(w);
  if(noAccMode||f.length>=3||/\d/.test(f)){if(flat.includes(f))return noAccMode?1:.8;if(f.length>=4&&flatStr.includes(f))return .5}return 0}
let _vP=null,_vPsrc=null,_vPa=null;
function vProdIdx(){if(_vPsrc===R.products&&_vPa===R.palias&&_vP)return _vP;_vP=[];const mk=(p,txt,al)=>{const src=vAliasNorm(' '+vLow(txt).replace(/(\d+)\s*(gam|gram|gr|g)\b/g,'$1g')+' ');const acc=src.split(/[^\p{L}\p{N}]+/u).filter(Boolean);const flat=acc.map(noAcc);_vP.push({p,acc,flat,str:flat.join(' '),u:vUnit(p.unit||''),al})};
  for(const p of R.products.values()){if(p.active===false)continue;mk(p,p.name+' '+p.code,0);for(const a of pAlias(p))mk(p,a,1)}_vPsrc=R.products;_vPa=R.palias;return _vP}
const V_FILL=/^(lấy|cho|thêm|sản|phẩm|mặt|hàng|loại|của|là|thì|nữa|với|và|em|anh|chị|ơi|nhé|nha|ạ|à)$/;
function vMatchProd(words,unit,noAccMode){const q=words.filter(w=>!V_FILL.test(w));if(!q.length)return {list:[],q,sc:0};
  const L=vProdIdx().map(x=>{let m=0;for(const w of q)m+=vWordHit(w,x.acc,x.flat,x.str,noAccMode);let cov=0;for(const t of x.flat)if(q.some(w=>noAcc(w)===t))cov++;
    return {p:x.p,sc:m/q.length,ub:unit&&x.u===unit?1:0,cov:cov/Math.max(1,x.flat.length-1),sold:toNum(x.p.soldQty)}}).filter(x=>x.sc>=.5)
   .sort((a,b)=>b.sc-a.sc||b.ub-a.ub||(b.cov>=.99)-(a.cov>=.99)||b.sold-a.sold||b.cov-a.cov).filter((x,i,a)=>a.findIndex(y=>y.p===x.p)===i);
  const top=L[0],sec=L[1];const sure=!!top&&top.sc>=.99&&(!sec||sec.sc<top.sc-.01||sec.ub<top.ub||(top.cov>=.99&&sec.cov<top.cov));
  return {list:L.slice(0,6),q,sure,sc:top?top.sc:0}}
/* địa điểm giao: chỉ so với tên ĐỊA ĐIỂM (không so tên khách) */
const VSYN={vm:['vm','vinmart','winmart','wm','vmplus']};
const V_LFILL=/^(plus|cộng|giao|cho|đến|den|tới|toi|tại|tai|địa|dia|điểm|diem|khách|khach|ở|o|về|nhà|siêu|thị|cửa|hàng|chi|nhánh)$/;
function vMatchLoc(words){const qa=words.filter(w=>!V_LFILL.test(w));const q=qa.map(noAcc);if(!q.length)return {list:[],sc:0};
  const L=[];for(const x of locIndex()){if(!x.loc)continue;const lt=x._lt||(x._lt=x.n.split(/[^a-z0-9]+/).filter(Boolean));let m=0;
    for(let i=0;i<q.length;i++){const w=q[i];if(qa[i]&&isNumW(qa[i])){const la=x._la||(x._la=vLow(x.loc).split(/[^\p{L}\p{N}]+/u));if(la.includes(qa[i]))m++;continue}const ws=VSYN[w]||[w];if(ws.some(y=>lt.includes(y)||(y.length>=4&&x.n.includes(y))))m++}
    if(m)L.push({x,sc:m/q.length,len:x.n.length})}
  L.sort((a,b)=>b.sc-a.sc||a.len-b.len);const top=L[0],sec=L[1];
  return {list:L.slice(0,6),sc:top?top.sc:0,sure:!!top&&top.sc===1&&(!sec||sec.sc<1)}}
const V_LK=['giao hàng cho','giao hàng đến','giao hàng tới','giao hàng tại','giao cho','giao đến','giao tới','giao tại','giao','địa điểm','điểm giao','khách hàng','khách','cửa hàng','siêu thị'];
function vParse(text){const out={loc:null,lines:[],unknown:[],note:'',paid:false};let t=String(text||'');
  const nm=t.match(/(ghi chú|ghi chu|lưu ý|luu y)\s*[:,]?\s*(.*)$/i);if(nm){out.note=nm[2].trim();t=t.slice(0,nm.index)}
  const PAID=/(^|[\s,.])(đã|da)\s+(thanh toán|thanh toan|chuyển khoản|chuyen khoan|ck|trả tiền|tra tien)(\s+rồi)?(?=$|[\s,.])|(^|[\s,.])(thanh toán|chuyển khoản) rồi(?=$|[\s,.])/i;
  if(/tiền mặt|tien mat/i.test(t)){out.paid=true;out.pm='cash';t=t.replace(/(đã\s+)?(thanh toán\s+|trả\s+|thu\s+)?(bằng\s+)?(tiền mặt|tien mat)/gi,' , ')}
  if(PAID.test(t)){out.paid=true;if(/chuyển khoản|chuyen khoan|\bck\b/i.test(t.match(PAID)[0]))out.pm='transfer';t=t.replace(new RegExp(PAID.source,'gi'),' , ')}
  const noAccMode=!vHasAcc(t);let T=vTokens(t);
  /* 1) ĐỊA ĐIỂM: sau từ khoá "giao/khách/…" hoặc ở đầu câu; lấy đoạn dài nhất khớp đủ mọi từ với 1 địa điểm */
  const starts=[];for(let i=0;i<T.length;i++){for(const k of V_LK){const kw=k.split(' ');if(kw.every((x,j)=>T[i+j]===x)){starts.push({s:i+kw.length,k:i,kw:true});break}}}
  if(!starts.some(x=>x.k===0))starts.push({s:0,k:0,kw:false});
  let best=null;for(const st of starts){for(let e=st.s+1;e<=Math.min(T.length,st.s+8);e++){const seg=T.slice(st.s,e);if(seg.some(w=>w==='|'||/^\d+([.,]\d+)?$/.test(w)))break;
      const m=vMatchLoc(seg);if(m.sc<1)continue;const words=seg.filter(w=>!V_LFILL.test(w)).length;const sc=words*10+(m.sure?5:0)+(st.kw?3:0)-m.list.length*.1;if(!best||sc>best.sc)best={st,e,m,sc,seg}}}
  if(best&&(best.st.kw||best.seg.filter(w=>!V_LFILL.test(w)).length>=2)){out.loc={said:best.seg.join(' '),...best.m};T=T.slice(0,best.st.k).concat(['|'],T.slice(best.e))}
  else{const k=starts.find(x=>x.kw);if(k){let e=k.s;while(e<T.length&&T[e]!=='|'&&!/^\d+([.,]\d+)?$/.test(T[e])&&!isNumW(T[e]))e++;const seg=T.slice(k.s,e);if(seg.length){const m=vMatchLoc(seg);out.loc={said:seg.join(' '),...m};T=T.slice(0,k.k).concat(['|'],T.slice(e))}}}
  /* 2) số đọc bằng chữ → số ("năm" ≠ "nam") */
  const T2=[];for(let i=0;i<T.length;){if(isNumW(T[i])){let j=i;while(j<T.length&&isNumW(T[j]))j++;const n=vWordsToNum(T.slice(i,j));if(n!=null){T2.push(String(n));i=j;continue}}T2.push(T[i]);i++}
  /* 3) khuyến mại / đổi / trả N → gắn vào dòng trước */
  const isN=w=>/^\d+([.,]\d+)?$/.test(w),num=w=>parseFloat(w.replace(',','.'));
  const KW=[['khuyến mại','promo'],['khuyến mãi','promo'],['tặng thêm','promo'],['tặng','promo'],['km','promo'],['biếu','promo'],['đổi hàng','swap'],['đổi','swap'],['trả lại','ret'],['hàng trả','ret'],['trả','ret']];
  const items=[];let chunk=[];const chunks=[];for(const w of T2){if(w==='|'){chunks.push(chunk);chunk=[]}else chunk.push(w)}chunks.push(chunk);
  const kwAt=(C,i)=>{for(const [k,f] of KW){const kk=k.split(' ');if(kk.every((x,j)=>C[i+j]===x)&&isN(C[i+kk.length]||''))return {f,n:kk.length}}return null};
  for(const C of chunks){if(!C.length)continue;let mode=null,cur=null;const push=it=>{if(it)items.push(it)};
    for(let i=0;i<C.length;i++){const w=C[i];const kw=kwAt(C,i);
      if(kw){const j=i+kw.n;const tgt=(mode==='qf'&&cur&&cur.w.length)?cur:(items[items.length-1]||cur);if(tgt){tgt[kw.f]=num(C[j]);i=j;if(C[i+1]&&VU[C[i+1]])i++;continue}}
      if(isN(w)){let q=num(w),u='';if(C[i+1]&&VU[C[i+1]]){u=VU[C[i+1]];i++}if(C[i+1]==='rưỡi'||C[i+1]==='ruoi'){q+=.5;i++}
        if(mode!=='qf'&&cur&&cur.w.length&&cur.qty==null){cur.qty=q;cur.unit=u;push(cur);cur=null;mode='nf';
          /* sau 1 dòng "tên + số", nếu ngay sau lại là số → phần còn lại đọc kiểu "số + tên" */
          if(isN(C[i+1]||''))mode='qf';continue}
        if(mode==='qf'&&cur)push(cur);cur={w:[],qty:q,unit:u};mode='qf';continue}
      if(!cur)cur={w:[],qty:null,unit:''};cur.w.push(w)}
    if(cur)push(cur)}
  for(const it of items){if(it.qty==null||!it.w.length){if(it.w.length||it.qty!=null)out.unknown.push((it.w.join(' ')+(it.qty!=null?' '+it.qty:'')).trim());continue}
    const m=vMatchProd(it.w,it.unit,noAccMode);if(!m.list.length){out.unknown.push((it.qty+' '+(it.unit||'')+' '+it.w.join(' ')).replace(/\s+/g,' ').trim());continue}
    out.lines.push({said:(it.qty+' '+(it.unit?it.unit+' ':'')+it.w.join(' ')),qty:it.qty,unit:it.unit,promo:it.promo||0,swap:it.swap||0,ret:it.ret||0,...m})}
  return out}

function voiceOrder(){const d=R.odraft||(R.odraft=newOrderDraft());const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,on=false,P=null,base='',locC=[];const locOpts=()=>locC.map((x,i)=>`<option value="${i}">📍 ${esc(x.loc||'(chưa có địa điểm)')} — ${esc(x.c.name)}</option>`).join('')+'<option value="-1">— Không đổi khách —</option>';
  openSheet('🎤 Đọc đơn',`<div class="tiny muted">Đọc <b>địa điểm giao</b> trước, rồi từng mặt hàng, ví dụ: “Giao VM Hà Đông, 10 gói bơ, 5 gói xoài, 20 quả chuối tiêu 170 gam, nem bùi 10 gói khuyến mại 1 gói, đã chuyển khoản, ghi chú giao trước 9 giờ”. Đọc “số + đơn vị + tên” hay “tên + số + đơn vị” đều được; nói rõ quy cách (300 gam, 1 ký…) nếu cùng loại có nhiều gói.</div>
   ${SR?'<button class="btn block" id="vcMic" style="font-size:16px;padding:14px">🔴 Đang nghe… (bấm để dừng)</button>':'<div class="alert w">Trình duyệt này chưa cho nhận giọng nói trực tiếp. Bấm vào ô dưới rồi bấm 🎤 trên bàn phím điện thoại để đọc.</div>'}
   <textarea id="vcT" rows="3" placeholder="Nội dung đọc sẽ hiện ở đây (có thể sửa hoặc gõ tay)"></textarea>
   <button class="btn block" id="vcGo">Phân tích</button><div id="vcR"></div>`,b=>{
    const T=b.querySelector('#vcT'),Rb=b.querySelector('#vcR'),mic=b.querySelector('#vcMic');
    const show=()=>{P=vParse(T.value);const L=P.loc;
      locC=L?L.list.map(y=>y.x):[];const locSel=`<select id="vcLoc">${locOpts()}</select><input id="vcLocQ" placeholder="🔍 Gõ tìm địa điểm giao khác…" autocomplete="off" style="margin-top:6px">`;
      Rb.innerHTML=`<div class="sec">Kết quả – kiểm tra trước khi điền</div><div class="stack">
       <label class="f">${L?(L.sure?'':'⚠️ ')+'Địa điểm giao <span class="tiny muted">(nghe: “'+esc(L.said)+'”)</span>':'Địa điểm giao <span class="tiny muted">(không nghe thấy – giữ khách đang chọn, hoặc gõ tìm)</span>'}${locSel}</label>${L&&!L.list.length?'<div class="alert w">Không tìm thấy địa điểm “'+esc(L.said)+'” – gõ tìm ở ô trên.</div>':''}
       ${P.lines.map((l,i)=>`<div class="card stack" style="gap:6px"><div class="tiny muted">${l.sure?'':'⚠️ Chưa chắc – kiểm tra · '}nghe: “${esc(l.said)}”${l.ret||l.swap?' · <b>'+(l.swap?'đổi '+l.swap+' ':'')+(l.ret?'trả '+l.ret:'')+'</b>':''}</div>
         <select data-vp="${i}">${l.list.map(y=>`<option value="${esc(y.p.code)}">${esc(y.p.name)} (${esc(y.p.code)} · ${esc(y.p.unit||'')})</option>`).join('')}<option value="">— Bỏ dòng này —</option></select>
         <div class="row" style="gap:8px;padding:0"><label class="f grow">SL<input data-vq="${i}" inputmode="decimal" class="num" value="${l.qty}"></label><label class="f grow">Tặng<input data-vk="${i}" inputmode="decimal" class="num" value="${l.promo||0}"></label></div></div>`).join('')}
       ${P.unknown.length?`<div class="alert w">Chưa hiểu: ${P.unknown.map(x=>'“'+esc(x)+'”').join(', ')} – thêm tay nếu cần.</div>`:''}
       ${P.paid?'<div class="tiny">✓ Đánh dấu khách <b>đã thanh toán</b>'+(P.pm?' – '+PM_NAME[P.pm]:' (chọn hình thức ở đơn)')+'</div>':''}${P.note?`<div class="tiny">Ghi chú: ${esc(P.note)}</div>`:''}
       <button class="btn block pri" id="vcOk" ${L||P.lines.length?'':'disabled'}>Điền vào đơn</button><div class="tiny muted" style="text-align:center">Điền xong vẫn phải xem lại và bấm Gửi đơn hàng.</div></div>`;
      const lq=Rb.querySelector('#vcLoc'),lqi=Rb.querySelector('#vcLocQ');let lT;if(lqi)lqi.oninput=()=>{clearTimeout(lT);lT=setTimeout(()=>{const nq=noAcc(lqi.value);if(!nq)return;locC=locIndex().filter(x=>x.loc&&wMatch(x.n,nq)).slice(0,30);lq.innerHTML=locOpts();const okb=Rb.querySelector('#vcOk');if(okb)okb.disabled=false},200)};
      const ok=Rb.querySelector('#vcOk');if(ok)ok.onclick=apply};
    const apply=()=>{const ls=Rb.querySelector('#vcLoc');if(ls&&+ls.value>=0&&locC[+ls.value]){const y=locC[+ls.value];d.cust=y.c.code;d.custName=y.c.name;d.address=y.loc||y.c.address||'';d.phone=y.c.phone||'';
        d.lines.forEach(l=>{const dp=defaultPrice(d.cust,l.code);l.listPrice=dp.p;l.price=dp.p;l.src=dp.src;l.g=1})}
      let n=0;P.lines.forEach((l,i)=>{const code=Rb.querySelector(`[data-vp="${i}"]`).value;if(!code)return;const p=findProd(code);if(!p)return;const q=toNum(Rb.querySelector(`[data-vq="${i}"]`).value),k=toNum(Rb.querySelector(`[data-vk="${i}"]`).value);if(!q&&!k)return;
        const ex=d.lines.find(x=>x.code===p.code);if(ex){ex.qty=r3(toNum(ex.qty)+q);ex.gift=r3(toNum(ex.gift)+k);ex.swap=r3(toNum(ex.swap)+toNum(l.swap));ex.ret=r3(toNum(ex.ret)+toNum(l.ret))}
        else{const dp=defaultPrice(d.cust,p.code);d.lines.push({code:p.code,name:p.name,unit:p.unit,qty:q,promo:0,gift:k,swap:toNum(l.swap),ret:toNum(l.ret),price:dp.p,listPrice:dp.p,src:dp.src,g:1})}n++});
      if(P.paid){d.paid=true;if(P.pm)d.payMethod=P.pm}if(P.note)d.note=(d.note?d.note+'; ':'')+P.note;
      if(rec&&on)try{rec.abort()}catch(e){}closeSheet();render();toast('Đã điền '+n+' mặt hàng – kiểm tra rồi bấm Gửi đơn')};
    b.querySelector('#vcGo').onclick=show;
    if(mic){rec=new SR();rec.lang='vi-VN';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
      rec.onresult=e=>{let fin='',tmp='';for(let i=0;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript+' ';else tmp+=r[0].transcript}T.value=(base+' '+fin+tmp).trim()};
      rec.onend=()=>{on=false;mic.textContent='🎤 Nói lại';if(T.value.trim())show()};
      rec.onerror=e=>{on=false;mic.textContent='🎤 Nói lại';if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){Rb.innerHTML=permHTML('mic')+'<button class="btn block pri" id="vcRetry" style="margin-top:8px">Thử lại</button><div class="tiny muted" style="margin-top:6px">Trong lúc chưa bật được: bấm vào ô trên rồi dùng 🎤 của bàn phím điện thoại.</div>';const r=Rb.querySelector('#vcRetry');if(r)r.onclick=()=>mic.onclick();return}
        Rb.innerHTML=`<div class="alert r">${e.error==='no-speech'?'Không nghe thấy tiếng nói, thử lại.':'Lỗi nhận giọng nói ('+esc(e.error)+'). Có thể dùng 🎤 của bàn phím.'}</div>`};
      permState('microphone').then(st=>{if(st==='denied'&&!on){Rb.innerHTML=permHTML('mic')+'<button class="btn block pri" id="vcRetry" style="margin-top:8px">Thử lại</button>';const r=Rb.querySelector('#vcRetry');if(r)r.onclick=()=>mic.onclick()}});
      mic.onclick=()=>{if(on){try{rec.stop()}catch(e){}return}base=T.value.trim();Rb.innerHTML='';try{rec.start();on=true;mic.textContent='🔴 Đang nghe… (bấm để dừng)'}catch(e){Rb.innerHTML='<div class="alert r">Không bật được micro.</div>'}};
      mic.onclick()/* tự bật micro ngay khi mở khung (vẫn trong lượt bấm của người dùng) */}
    else setTimeout(()=>T.focus(),50)},{onClose:()=>{if(rec&&on)try{rec.abort()}catch(e){}}})}

/* v40: phí ship thu của khách = dòng hàng VT00003 "Phí Ship" (1 chuyến), không tính hoa hồng sale / lương ship */
const FEE_CODE='VT00003';const isFee=l=>!!l&&(l.fee||l.code===FEE_CODE||l.code==='CPVC 01');const feeOf=d=>Math.max(0,Math.round(toNum(d.shipFee)));
function viewSaleNew(v){if(!R.odraft)R.odraft=newOrderDraft();const d=R.odraft;const c=d.cust?findCust(d.cust):null;
  const fee=feeOf(d);const total=orderTotal(d)+fee;const bal=stockMap();
  v.innerHTML=`<h1 class="big">${d.id?'Sửa đơn '+esc(d.no):R.mode==='ship'?'Đơn phát sinh':'Lên đơn'}</h1>${R.mode==='ship'&&!d.id?'<div class="alert" style="margin-bottom:10px">Đơn khách đặt thêm khi đang giao. Đơn ghi tên bạn là người tạo và người giao, đánh dấu <b>Phát sinh</b>.</div>':''}
  <div class="stack">
  ${R.mode==='ship'&&!d.id?`<button class="btn block pri" id="oSlip" style="font-size:16px">📷 Chụp phiếu giao hàng</button>${d.slipPhotos&&d.slipPhotos.length?`<div><img id="oSlipImg" src="${d.slipPhotos[0].data}" style="width:100%;max-height:220px;object-fit:contain;border-radius:12px;background:#fff;border:1px solid var(--line,#e3e8ef)"><div class="tiny muted" style="margin-top:4px">Ảnh phiếu lưu kèm đơn · bấm để xem to · <a href="#" id="oSlipX">bỏ ảnh</a></div><div class="tiny" style="margin-top:4px">🚚 Ship: <b>${esc(staffName(R.uid))}</b> · Ngày giao: <b>${dmy(d.slipDate||today())}</b> (ngày chụp phiếu)</div></div>${slipReadHtml(d)}`:''}`:''}
  <button class="btn block" id="oVoice" style="font-size:16px">🎤 Đọc đơn bằng giọng nói</button>
  <div class="group"><div class="row tap" id="oCust"><div class="grow">${c||d.custName?`<div class="t">${esc(c?c.name:d.custName)}</div><div class="s">${esc(d.address||'Chưa có địa chỉ giao')}${d.phone?' · '+esc(d.phone):''}</div>`:'<div class="t" style="color:var(--accent)">Chọn khách hàng</div><div class="s">Bấm để tìm hoặc thêm khách mới</div>'}</div><span class="chev">›</span></div></div>
  ${d.cust?`<label class="f">Địa chỉ giao hàng${(c&&c.alt)?' <span class="tiny">(bấm để chọn điểm giao khác)</span>':''}<input id="oAddr" list="dlAddr" value="${esc(d.address)}" placeholder="Địa chỉ giao"></label><datalist id="dlAddr">${[c&&c.address,c&&c.billAddr,...String((c&&c.alt)||'').split('|')].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i).map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist>`:''}
  ${d.cust&&RT().length?(()=>{const rid=routeOf(d),r=routeById(rid);return `<div class="tiny" style="color:var(--accent);margin-top:-4px">🛣️ ${r?'Tuyến: '+esc(r.name)+(r.ship?' — Ship '+esc(staffName(r.ship)):''):'Chưa xác định tuyến giao cho địa điểm này'}</div>`})():''}
  ${R.mode==='ship'&&!d.id?'':(()=>{const t0=today(),t1=isoAdd(t0,1),dv=d.dlvDate||t1,cu=d._dlvPick||(dv!==t0&&dv!==t1);return `<div class="card stack" style="gap:10px"><div style="font-weight:700">📅 Ngày giao hàng</div><div class="seg"><button data-dd="0" class="${!cu&&dv===t0?'on':''}">Hôm nay</button><button data-dd="1" class="${!cu&&dv===t1?'on':''}">Ngày mai</button><button data-dd="x" class="${cu?'on':''}">Chọn ngày</button></div>${cu?`<input type="date" id="oDlv" value="${esc(dv)}">`:''}<div class="tiny muted">Giao <b style="color:var(--fg)">${wdName(dv)}, ${dmy(dv)}</b></div></div>`})()}
  <div class="sec" style="margin-bottom:0">Sản phẩm</div>
  <div class="list" id="oLines">${d.lines.map((l,i)=>lineCard(l,i,bal)).join('')}</div>
  <button class="btn" id="oAdd" ${d.cust?'':'disabled'}>${ICON.plus.replace('<svg','<svg width="18" height="18"')} Thêm sản phẩm</button>
  ${d.cust?'':'<div class="tiny muted" style="text-align:center">Chọn khách hàng trước để lấy đúng giá.</div>'}
  <div class="group"><div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-weight:600">🚚 Phí ship</div><div class="tiny muted">Thu thêm của khách, cộng vào tổng đơn</div></div><input id="oFee" inputmode="numeric" class="num" style="width:120px;text-align:right" value="${fee?fee:''}" placeholder="0"></div><div class="seg">${[0,20000,30000,50000].map(x=>`<button data-fee="${x}" class="${fee===x?'on':''}">${x?fmt(x/1000)+'k':'Không'}</button>`).join('')}</div></div></div>
  <div class="sec" style="margin-bottom:0">Thanh toán</div>
  <div class="group"><div class="toggle"><div><div style="font-weight:600">Khách đã thanh toán</div><div class="tiny muted">${d.paid?'Đã thu tiền':'Chưa thu, ship sẽ thu khi giao'}</div></div><input type="checkbox" class="sw" id="oPaid" ${d.paid?'checked':''} aria-label="Đã thanh toán"></div>
   ${d.paid?`<div class="row" style="flex-direction:column;align-items:stretch;gap:10px"><label class="f">Số tiền đã thu<input id="oPaidAmt" inputmode="numeric" class="num" value="${esc(d.paidAmount===''?total:d.paidAmount)}"></label>${pmSeg(d.payMethod)}${pmPhotos(d.payMethod,d.payPhotos,'pay')}</div>`:''}</div>
  <label class="f">Ghi chú cho đơn<textarea id="oNote" rows="2" placeholder="VD: giao trước 9h">${esc(d.note)}</textarea></label>
  <div class="card"><div class="totalbar"><span class="muted">${d.lines.length} sản phẩm · ${fmt(sumL(d,'qty'))} SL${sumL(d,'gift')+sumL(d,'promo')?' · Tặng '+fmt(sumL(d,'gift')+sumL(d,'promo')):''}</span><span class="money">${vnd(total)}</span></div>${discBlock(d,total)}</div>
  <div id="oMsg">${d._err||''}</div>
  ${R.mode==='ship'&&!d.id?`<div class="group"><div class="toggle"><div><div style="font-weight:600">Đã giao cho khách luôn</div><div class="tiny muted">${d.delivered!==false?'Đơn lưu ở trạng thái Đã giao':'Đơn vào mục Cần giao của bạn để giao sau'}</div></div><input type="checkbox" class="sw" id="oDeliv" ${d.delivered!==false?'checked':''} aria-label="Đã giao luôn"></div></div>`:''}
  <button class="btn block pri" id="oSave">${d.id?'Lưu thay đổi':R.mode==='ship'?'Lưu đơn phát sinh':'Gửi đơn hàng'}</button>
  ${d.id||d.lines.length||d.cust?'<button class="btn block" id="oReset">'+(d.id?'Hủy sửa':'Làm lại từ đầu')+'</button>':''}
  </div>`;
  $('#oVoice').onclick=()=>voiceOrder();const slb=$('#oSlip');if(slb)slb.onclick=()=>slipFlow(d);const sli=$('#oSlipImg');if(sli)sli.onclick=()=>openSheet('Ảnh phiếu',`<img src="${sli.src}" style="width:100%">`);const slx=$('#oSlipX');if(slx)slx.onclick=e=>{e.preventDefault();d.slipPhotos=[];d._slipGeo=null;d.slipRead=null;d.slipDate=null;render()};$$('#view [data-sro]').forEach(el=>el.onchange=()=>{d.slipRead.rows[+el.dataset.sro].on=el.checked});$$('#view [data-srq]').forEach(el=>el.oninput=()=>{d.slipRead.rows[+el.dataset.srq].qty=el.value});const sla=$('#oSlipAdd');if(sla)sla.onclick=()=>slipAdd(d);
  $$('#view [data-dd]').forEach(x=>x.onclick=()=>{const t0=today();if(x.dataset.dd==='x'){d._dlvPick=true}else{d._dlvPick=false;d.dlvDate=isoAdd(t0,+x.dataset.dd)}render()});
  const dlv0=$('#oDlv');if(dlv0)dlv0.onchange=()=>{if(dlv0.value){d.dlvDate=dlv0.value;render()}};
  $('#oCust').onclick=()=>pickCustomer((cu,addr)=>{if(!cu)return;d.cust=cu.code;d.custName=cu.name;d.address=addr||cu.address||'';d.phone=cu.phone||'';d.lines.forEach(l=>{const dp=defaultPrice(cu.code,l.code);l.listPrice=dp.p;l.price=dp.p;l.src=dp.src;l.g=1});render()});
  const a=$('#oAddr');if(a)a.oninput=()=>d.address=a.value;
  $('#oAdd').onclick=()=>pickProduct(d.cust,p=>{if(!p)return;const ex=d.lines.find(l=>l.code===p.code);if(ex){ex.qty=r3(toNum(ex.qty)+1)}else{const dp=defaultPrice(d.cust,p.code);d.lines.push({code:p.code,name:p.name,unit:p.unit,qty:1,promo:0,swap:0,ret:0,price:dp.p,listPrice:dp.p,src:dp.src,g:1})}render()});
  bindLineCards(v,d,()=>render());
  $('#oPaid').onchange=e=>{d.paid=e.target.checked;render()};$$('#view [data-fee]').forEach(x=>x.onclick=()=>{d.shipFee=+x.dataset.fee;render()});const fe=$('#oFee');if(fe){fe.oninput=()=>{d.shipFee=fe.value};fe.onchange=()=>{d.shipFee=feeOf(d);render()}}$$('#view [data-pm]').forEach(x=>x.onclick=()=>{d.payMethod=x.dataset.pm;render()});
  const pa=$('#oPaidAmt');if(pa)pa.oninput=()=>d.paidAmount=pa.value;
  $('#oNote').oninput=e=>d.note=e.target.value;
  bindPhotos(v,()=>d.payPhotos,()=>render());
  const dlv=$('#oDeliv');if(dlv)dlv.onchange=e=>{d.delivered=e.target.checked;render()};
  $('#oSave').onclick=saveOrder;const rs=$('#oReset');if(rs)rs.onclick=()=>{R.odraft=newOrderDraft();render()}}
function lineCard(l,i,bal,opt){opt=opt||{};const edited=l.listPrice!=null&&toNum(l.price)!==toNum(l.listPrice);const more=opt.more||l._more||(toNum(l.promo)||toNum(l.swap)||toNum(l.ret)||toNum(l.disc)||toNum(l.gift));const dsc=toNum(l.disc),gf=toNum(l.gift),nq=Math.max(0,toNum(l.qty)-toNum(l.ret));const t=bal?bal.get(l.code):null;
  return `<div class="line" data-li="${i}"><div class="top"><div class="nm">${esc(l.name)}<div class="tiny muted" style="font-weight:500">${esc(l.code)} · ${esc(l.unit)}${t!=null?' · tồn kho '+fmt(t):''}</div></div><button class="btn sm danger" data-ldel="${i}" aria-label="Bỏ sản phẩm">Bỏ</button></div>
   <div class="grid"><label class="f">${opt.qtyLabel||'Số lượng'}<div class="step"><button data-lstep="${i}:-1" aria-label="Giảm">−</button><input id="l${i}_qty" inputmode="decimal" value="${esc(l.qty)}"><button data-lstep="${i}:1" aria-label="Tăng">+</button></div></label>
   <label class="f"><span>Đơn giá ${edited?'<span class="edited">· đã sửa</span>':''}</span><input id="l${i}_price" inputmode="numeric" class="num" value="${esc(l.price)}"></label></div>
   ${l.listPrice!=null?`<div class="pricehint">${esc(l.src||'Giá mặc định')}: ${vnd(l.listPrice)}${edited?` · <a href="#" data-lreset="${i}" style="color:var(--accent)">Về giá mặc định</a>`:''}</div>`:''}
   ${more?`<div class="grid"><label class="f">Khuyến mại (%)<input id="l${i}_disc" inputmode="decimal" class="num" value="${esc(fmt0(l.disc))}" placeholder="0"></label><label class="f">Hàng tặng<input id="l${i}_gift" inputmode="decimal" class="num" value="${esc(fmt0(l.gift))}" placeholder="0"></label></div>
   ${toNum(l.promo)?`<label class="f">Khuyến mại theo số lượng (đơn cũ)<input id="l${i}_promo" inputmode="decimal" class="num" value="${esc(fmt0(l.promo))}"></label>`:''}
   <div class="grid"><label class="f">Đổi hàng<input id="l${i}_swap" inputmode="decimal" class="num" value="${esc(fmt0(l.swap))}" placeholder="0"></label><label class="f">Trả hàng<input id="l${i}_ret" inputmode="decimal" class="num" value="${esc(fmt0(l.ret))}" placeholder="0"></label></div>
   ${dsc||gf?`<div class="pricehint" style="background:rgba(47,134,200,.10);padding:8px 10px;border-radius:10px;line-height:1.5">${dsc?`Giá sau khuyến mại: ${fmt(toNum(l.price))} × (1 − ${fmt(dsc)}%) = <b>${vnd(unitNet(l))}</b>`:''}${dsc&&gf?'<br>':''}${gf?`Hàng tặng ${fmt(gf)} ${esc(l.unit||'')}: giá 0đ, không tính tiền`:''}</div>`:''}`
   :`<button class="btn sm" data-lmore="${i}" style="align-self:flex-start">+ Khuyến mại % / Hàng tặng / Đổi trả</button>`}
   <div class="hrow"><span class="tiny muted">Thành tiền${dsc&&nq?' · '+fmt(nq)+' × '+fmt(unitNet(l)):''}</span><span class="money right">${vnd(lineAmt(l))}</span></div></div>`}
function slipReadHtml(d){const S=d.slipRead;if(!S||S.st==='added')return '';
  if(S.st==='run')return S.ai?'<div class="alert">🤖 AI đang đọc phiếu…</div>':'<div class="alert">🔎 Đang đọc số lượng trên phiếu…</div>';
  if(S.st==='fail')return `<div class="alert w">Chưa đọc được số trên phiếu${S.msg?' ('+esc(S.msg)+')':''}. Chụp lại thẳng, đủ sáng, thấy hết bảng – hoặc nhập tay.</div>`;
  const skipN=S.aiSkip?`<div class="tiny muted">AI tạm không dùng (${esc(S.aiSkip)}) – app tự đọc số lượng, dễ sai: so từng số với ảnh, sửa rồi tick chọn dòng đúng.</div>`:'';
  if(!S.rows.length)return skipN+'<div class="alert w">Không thấy số lượng nào trên phiếu. Kiểm tra lại ảnh hoặc nhập tay.</div>';
  const pay=S.pay?`<div class="row"><div class="grow"><div class="s">Thanh toán trên phiếu</div><div class="t" style="font-size:15px">${S.pay.paid==='paid'?'✅ Đã thanh toán'+(S.pay.amount?' · '+vnd(S.pay.amount):''):S.pay.paid==='unpaid'?'Chưa thanh toán':'Không rõ'}${S.pay.total?' · Tổng phiếu '+vnd(S.pay.total):''}</div></div></div>`:'';
  return skipN+`<div class="group"><div class="row"><div class="grow"><div class="t">${S.ai?'🤖 AI đọc từ phiếu':'Số lượng đọc từ phiếu'}</div><div class="s">So với ảnh, sửa nếu sai · ô vàng = chưa chắc${S.slipNo?' · Phiếu '+esc(S.slipNo):''}</div></div></div>${S.unsure?`<div class="row"><div class="grow s" style="color:#8a5a00">⚠ Chưa chắc: ${esc(S.unsure)}</div></div>`:''}
  ${S.rows.map((x,i)=>`<div class="row" style="gap:8px"><input type="checkbox" data-sro="${i}" ${x.on?'checked':''} style="width:22px;height:22px">${x.img?`<img src="${x.img}" style="height:44px;max-width:110px;border-radius:6px;border:1px solid var(--line,#e3e8ef)">`:''}<div class="grow"><div class="t" style="font-size:14px">${esc(x.name)}</div><div class="s">Phiếu: ${esc(x.form)}${x.code?'':' · chưa gắn mã hàng'}${x.price&&x.code?(()=>{const dp=defaultPrice(d.cust,x.code).p;return ' · giá phiếu '+vnd(x.price)+(dp&&Math.abs(dp-x.price)>=500?' ≠ app '+vnd(dp):'')})():''}</div></div><input inputmode="decimal" data-srq="${i}" value="${esc(String(x.qty))}" style="width:64px;font-size:17px;font-weight:700;text-align:center;border-radius:10px;padding:6px;border:1.5px solid ${x.conf<0.8?'#e0a100;background:#fff8e1':'var(--line,#cfd8e3)'}"></div>`).join('')}
  ${pay}<div class="row"><button class="btn block pri" id="oSlipAdd" style="margin:0">➕ Thêm vào đơn</button></div></div>`}
function bindLineCards(root,d,rerender,moreKey){
  $$('[data-ldel]',root).forEach(b=>b.onclick=()=>{d.lines.splice(+b.dataset.ldel,1);rerender()});
  $$('[data-lstep]',root).forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.lstep.split(':');const l=d.lines[+i];l.qty=Math.max(0,r3(toNum(l.qty)+(+s)));rerender()});
  $$('[data-lmore]',root).forEach(b=>b.onclick=()=>{d.lines[+b.dataset.lmore]._more=1;rerender()});
  $$('[data-lreset]',root).forEach(b=>b.onclick=e=>{e.preventDefault();const l=d.lines[+b.dataset.lreset];l.price=l.listPrice;rerender()});
  d.lines.forEach((l,i)=>{['qty','price','promo','swap','ret','disc','gift'].forEach(k=>{const e=root.querySelector(`#l${i}_${k}`);if(!e)return;e.oninput=()=>{l[k]=k==='price'?Math.round(toNum(e.value)):e.value;};e.onchange=()=>{l[k]=k==='price'?Math.round(toNum(e.value)):r3(toNum(e.value));rerender()}})});
}
async function saveOrder(){const d=R.odraft,msg=$('#oMsg');d._err='';const err=t=>msg.innerHTML='<div class="alert r">'+t+'</div>';msg.innerHTML='';
  if(!d.cust)return err('Chưa chọn khách hàng.');
  const lines=d.lines.map(l=>({code:l.code,name:l.name,unit:l.unit,qty:r3(toNum(l.qty)),promo:r3(toNum(l.promo)),gift:r3(toNum(l.gift)),disc:Math.min(100,Math.max(0,r3(toNum(l.disc)))),g:l.g?1:0,swap:r3(toNum(l.swap)),ret:r3(toNum(l.ret)),price:Math.round(toNum(l.price)),listPrice:l.listPrice==null?null:Math.round(toNum(l.listPrice))})).filter(l=>l.qty>0||l.promo>0||l.gift>0||l.swap>0||l.ret>0);
  if(!lines.length)return err('Đơn chưa có sản phẩm nào có số lượng.');
  {const fee=feeOf(d);if(fee>0){const fp=findProd(FEE_CODE);lines.push({code:FEE_CODE,name:fp?fp.name:'Phí Ship',unit:fp?fp.unit:'chuyến',qty:1,promo:0,gift:0,disc:0,g:1,swap:0,ret:0,price:fee,listPrice:fee,fee:1})}}
  const bad=lines.find(l=>l.ret>l.qty+1e-9);if(bad)return err(`${esc(bad.name)}: số trả (${fmt(bad.ret)}) lớn hơn số bán (${fmt(bad.qty)}).`);
  const zero=lines.find(l=>l.qty>0&&!l.price);if(zero&&!d._zeroOk){d._zeroOk=true;return msg.innerHTML=`<div class="alert w">${esc(zero.name)} đang có đơn giá 0đ. Bấm Gửi lần nữa nếu đúng là hàng không tính tiền.</div>`}
  if(d.paid){const e2=pmCheck(d.payMethod,d.payPhotos);if(e2)return err(e2)}
  if(!d.id&&R.mode!=='ship'&&(d.dlvDate||'')<today())return err('Ngày giao không được trước hôm nay.');
  const btn=$('#oSave');btn.disabled=true;
  const total=lines.reduce((s,l)=>s+lineAmt(l),0);const base={cust:d.cust,custName:d.custName,address:d.address.trim(),phone:d.phone,lines,note:d.note.trim(),total,
      paid:!!d.paid,paidAmount:d.paid?Math.round(d.paidAmount===''?total:toNum(d.paidAmount)):0,paidBy:d.paid?(R.mode==='ship'?'ship':'sale'):null,payMethod:d.paid?d.payMethod:null,dlvDate:(R.mode==='ship'&&!d.id)?(d.slipDate||today()):(d.dlvDate||isoAdd(today(),1))};
  if(d.id){const o=R.orders.find(x=>x.id===d.id);if(!o||o.status!=='new'){btn.disabled=false;return err('Đơn đã được nhận giao, không sửa được nữa.')}}
  /* GỬI NỀN: màn hình chuyển ngay, đơn hiện ngay trong danh sách; máy chủ ghi phía sau. Lỗi mạng → trả lại đơn nháp để bấm Gửi lại. */
  const mode=R.mode,wasShip=mode==='ship',arise=wasShip&&!d.id,dv=arise&&d.delivered!==false;
  const jobs=[];const pre=(list,oid)=>list.map(p=>{if(p.id)return p.id;const id=oid+'-pay-'+uidShort();jobs.push(()=>R.db.doc('photos/'+id).set({data:p.data,orderId:oid,kind:'pay',by:R.uid,at:Date.now()}).then(()=>R.photoCache.set(id,p.data)));return id});
  R.odraft=newOrderDraft();R.tab=wasShip?(dv||d.id?'done':'todo'):'orders';render();toast(d.id?'Đang lưu đơn…':'Đang gửi đơn…');
  (async()=>{try{
    if(d.id){base.payPhotos=pre(d.payPhotos,d.id);await Promise.all(jobs.map(f=>f()));await R.db.doc('orders/'+d.id).update(Object.assign(base,{updatedAt:Date.now(),updatedBy:R.uid}));toast('✓ Đã lưu đơn '+(d.no||''))}
    else{let no=nextNo('DH',d.date,R.orders);base.payPhotos=pre(d.payPhotos,no);if(d.slipPhotos&&d.slipPhotos.length)base.slipPhotos=pre(d.slipPhotos,no);const now=Date.now();
      const mk=async()=>{for(let k=0;k<40;k++){while(R.orders.some(o=>o.id===no))no=bumpNo(no);
          try{await R.db.doc('orders/'+no).create(Object.assign({},base,{no,date:d.date,saleId:R.uid,status:arise?(dv?'done':'shipping'):'new',shipId:arise?R.uid:null,outside:false,retPhotos:[],createdAt:now},arise?{arising:true,saleLines:lines,shipAt:now}:{},dv?{doneAt:now}:{}));return}
          catch(e){if(e.code!=='exists')throw e;no=bumpNo(no)}}throw{message:'không cấp được số đơn'}};
      await Promise.all([mk(),...jobs.map(f=>f())]);if(dv){(d._slipGeo?Promise.resolve(d._slipGeo):geoSoft()).then(c=>learnLoc(base,c)).catch(()=>{})}toast((arise?'✓ Đã lưu đơn phát sinh ':'✓ Đã gửi đơn ')+no)}
  }catch(e){R.odraft=d;R.mode=mode;R.tab='new';render();d._err='<div class="alert r">'+(e.code==='invalid_argument'?'Bạn không có quyền ghi dữ liệu.':e.code==='quota_exceeded'?'Kho dữ liệu đầy, báo quản lý.':'Chưa gửi được (mạng yếu?): '+esc(e.message||e.code||'lỗi')+'. Đơn vẫn còn đây – bấm Gửi lại.')+'</div>';render();toast('⚠ Chưa gửi được đơn')}})()}

/* ================= DANH SÁCH ĐƠN (dùng chung) ================= */
function orderCard(o,opt){opt=opt||{};const items=(o.lines||[]).map(l=>esc(l.name)+' ×'+fmt(l.qty)).join(', ');
  return `<div class="oc" data-oid="${esc(o.id)}"><div class="h1"><span class="cn ell">${esc(o.custName)}</span><span class="money">${vnd(orderTotal(o))}</span></div>
   <div class="addr">${ICON.pin}<span>${esc(o.address||'Chưa có địa chỉ')}</span></div>
   <div class="tiny muted ell">${items}</div>
   <div class="hrow">${stChip(o)}${payChip(o)}${o.dlvDate&&o.status!=='done'&&o.status!=='cancel'?'<span class="chip" style="background:#e7f0fa;color:#1b6aa5">🚚 Giao '+dm(o.dlvDate)+'</span>':''}${o.arising?'<span class="chip b">Phát sinh</span>':''}${o.outside?'<span class="chip b">Ship ngoài</span>':''}<span class="tiny muted right">${esc(o.no)} · ${dm(o.date)}${opt.who?' · '+esc(staffName(o[opt.who])):''}</span></div>${opt.actions||''}</div>`}
function orderListView(v,list,opt){const q=noAcc(R.ui.ordQ);const st=R.ui.ordStatus;
  let L=list.filter(o=>(!st||o.status===st)&&qMatch(o.no+' '+o.custName+' '+o.address+' '+(o.lines||[]).map(l=>l.name).join(' '),q));
  L.sort((a,b)=>(b.date+b.no).localeCompare(a.date+a.no));
  v.innerHTML=`<h1 class="big">${opt.title}</h1><div class="stack"><input id="olQ" placeholder="Tìm khách, mã đơn, sản phẩm" value="${esc(R.ui.ordQ)}">
   <div class="seg">${[['','Tất cả'],['new','Chờ giao'],['shipping','Đang giao'],['done','Đã giao'],['cancel','Đã hủy']].map(([k,l])=>`<button data-ost="${k}" class="${st===k?'on':''}">${l}</button>`).join('')}</div>
   ${opt.extra||''}<div class="list">${L.slice(0,150).map(o=>orderCard(o,opt)).join('')||'<div class="empty"><b>Chưa có đơn nào</b>'+(opt.emptyHint||'')+'</div>'}</div>
   ${L.length>150?'<div class="tiny muted">Đang hiện 150/'+L.length+' đơn mới nhất. Dùng ô tìm để lọc.</div>':''}</div>`;
  const qi=$('#olQ');qi.oninput=()=>{R.ui.ordQ=qi.value;render()};
  $$('[data-ost]').forEach(b=>b.onclick=()=>{R.ui.ordStatus=b.dataset.ost;render()});
  $$('[data-oid]').forEach(c=>c.onclick=()=>orderDetail(R.orders.find(o=>o.id===c.dataset.oid)))}
function orderDetail(o){if(!o)return;const role=R.mode;const mine=o.saleId===R.uid;
  const canEdit=(role==='sale'&&mine||role==='admin')&&o.status==='new';
  const canDeliver=(role==='ship'&&(o.shipId===R.uid||!o.shipId)||role==='admin')&&(o.status==='new'||o.status==='shipping');
  const lines=(o.lines||[]).map(l=>`<div class="row"><div class="grow"><div class="t">${esc(l.name)}</div><div class="s">${fmt(l.qty)} ${esc(l.unit)} × ${vnd(l.price)}${l.listPrice!=null&&l.price!==l.listPrice?' <span class="edited">(giá gốc '+vnd(l.listPrice)+')</span>':''}${toNum(l.disc)?' · <b>KM '+fmt(l.disc)+'% → '+vnd(unitNet(l))+'</b>':''}${toNum(l.gift)?' · <b>Tặng '+fmt(l.gift)+'</b>':''}${l.promo?' · KM '+fmt(l.promo):''}${l.swap?' · Đổi '+fmt(l.swap):''}${l.ret?' · Trả '+fmt(l.ret):''}</div></div><div class="money">${vnd(lineAmt(l))}</div></div>`).join('');
  const pay=(o.payPhotos||[]).map(id=>({id})),rp=(o.retPhotos||[]).map(id=>({id})),slp=(o.slipPhotos||[]).map(id=>({id}));
  openSheet('Đơn '+o.no,`<div class="hrow">${stChip(o)}${payChip(o)}${o.arising?'<span class="chip b">Phát sinh</span>':''}${o.outside?'<span class="chip b">Ship ngoài</span>':''}${o.px?'<span class="chip">Đã xuất kho '+esc(o.px)+'</span>':''}</div>
   <div class="group"><div class="row"><div class="grow"><div class="t">${esc(o.custName)}</div><div class="s">${esc(o.address||'')}${o.phone?' · '+esc(o.phone):''}</div></div>${o.address?`<a class="mapl" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}" target="_blank" rel="noopener">Bản đồ</a>`:''}</div>
   <div class="row"><div class="grow s">Ngày ${dmy(o.date)} · Sale: ${esc(staffName(o.saleId))}${o.shipId?' · Ship: '+esc(staffName(o.shipId)):''}</div></div></div>
   <div class="group">${lines}${(o.lines||[]).some(l=>lineDisc(l))?`<div class="row"><div class="grow s">Khuyến mại đã trừ</div><div>${vnd((o.lines||[]).reduce((s,l)=>s+lineDisc(l),0))}</div></div>`:''}<div class="row"><div class="grow t">Tổng cộng</div><div class="money" style="font-size:18px">${vnd(orderTotal(o))}</div></div>
   ${o.paid?`<div class="row"><div class="grow s">Đã thu ${vnd(o.paidAmount)} (${o.paidBy==='ship'?'ship thu':'sale thu'}${o.payMethod?' · '+PM_NAME[o.payMethod]:''})</div></div>`:''}</div>
   ${o.note?`<div class="card small">${esc(o.note)}</div>`:''}
   ${pay.length?'<div><div class="sec" style="margin-top:0">Ảnh thanh toán</div>'+photoStrip(pay,false,'p')+'</div>':''}
   ${rp.length?'<div><div class="sec" style="margin-top:0">Ảnh hàng đổi trả</div>'+photoStrip(rp,false,'r')+'</div>':''}${slp.length?'<div><div class="sec" style="margin-top:0">Ảnh phiếu giao hàng</div>'+photoStrip(slp,false,'s')+'</div>':''}
   ${canDeliver&&o.status==='new'&&role==='ship'?'<button class="btn block blue" data-a="take">Nhận giao đơn này</button>':''}
   ${canDeliver?'<button class="btn block pri" data-a="deliver">Xác nhận đã giao</button>':''}
   ${!o.paid&&o.status!=='cancel'?'<button class="btn block" data-a="pay">Cập nhật đã thanh toán</button>':''}
   ${canEdit?'<button class="btn block" data-a="edit">Sửa đơn</button><button class="btn block danger" data-a="cancel">Hủy đơn</button>':''}
   ${role==='admin'&&o.status==='done'&&!o.px?'<button class="btn block" data-a="reopen">Mở lại đơn (chưa giao)</button>':''}`,b=>{
    bindPhotos(b,k=>k==='p'?pay:k==='s'?slp:rp,()=>{});
    const act=(k,f)=>{const x=b.querySelector(`[data-a="${k}"]`);if(x)x.onclick=f};
    act('take',async()=>{try{const s=await R.db.doc('orders/'+o.id).get();const cur=s.data();if(cur.shipId&&cur.shipId!==R.uid){toast('Đơn đã có người khác nhận.');return}
      await R.db.doc('orders/'+o.id).update({status:'shipping',shipId:R.uid,shipAt:Date.now()});toast('Đã nhận đơn '+o.no);closeSheet()}catch(e){toast('Lỗi: '+(e.code||''))}});
    act('deliver',()=>{closeSheet();deliverSheet(o)});
    act('pay',()=>{closeSheet();paySheet(o)});
    act('edit',()=>{R.odraft={id:o.id,no:o.no,cust:o.cust,custName:o.custName,address:o.address||'',phone:o.phone||'',lines:o.lines.filter(l=>!isFee(l)).map(l=>Object.assign({},l,{src:'Giá mặc định'})),shipFee:(o.lines||[]).filter(isFee).reduce((a,l)=>a+lineAmt(l),0)||'',paid:o.paid,payMethod:o.payMethod||'',paidAmount:o.paidAmount||'',payPhotos:(o.payPhotos||[]).map(id=>({id})),note:o.note||'',date:o.date,dlvDate:o.dlvDate||o.date};closeSheet();if(R.mode==='admin')R.mode='sale';R.tab='new';render()});
    act('cancel',async()=>{closeSheet();if(await confirmSheet('Hủy đơn '+o.no+'?','Đơn của '+esc(o.custName)+' sẽ chuyển sang trạng thái Đã hủy và không tính vào doanh số.','Hủy đơn',true)){await R.db.doc('orders/'+o.id).update({status:'cancel',updatedAt:Date.now(),updatedBy:R.uid});toast('Đã hủy đơn')}});
    act('reopen',async()=>{closeSheet();if(await confirmSheet('Mở lại đơn?','Đơn sẽ về trạng thái Đang giao để ship xác nhận lại.','Mở lại')){await R.db.doc('orders/'+o.id).update({status:'shipping',updatedAt:Date.now(),updatedBy:R.uid});toast('Đã mở lại')}});
  })}
/* hình thức thanh toán: tiền mặt / chuyển khoản (CK bắt buộc ảnh giao dịch) */
const PM_NAME={cash:'Tiền mặt',transfer:'Chuyển khoản'};
function pmSeg(m){return `<div><div class="tiny muted" style="margin-bottom:6px;font-weight:600">Hình thức thanh toán</div><div class="seg">${['cash','transfer'].map(k=>`<button type="button" data-pm="${k}" class="${m===k?'on':''}">${k==='cash'?'💵 Tiền mặt':'🏦 Chuyển khoản'}</button>`).join('')}</div></div>`}
function pmPhotos(m,list,key){return m==='transfer'?`<div><div class="tiny muted" style="margin-bottom:6px;font-weight:600">Ảnh giao dịch chuyển khoản <span style="color:#d33">(bắt buộc)</span></div>${photoStrip(list,true,key)}</div>`:''}
function pmCheck(m,photos){if(m!=='cash'&&m!=='transfer')return 'Chọn hình thức thanh toán: Tiền mặt hoặc Chuyển khoản.';if(m==='transfer'&&!(photos||[]).length)return 'Thanh toán chuyển khoản bắt buộc chụp ảnh giao dịch.';return ''}
function paySheet(o){const st={amt:orderTotal(o),photos:[],pm:''};const draw=b=>{b.innerHTML=`<div class="card"><div class="totalbar"><span class="muted">Tiền hàng</span><span class="money">${vnd(orderTotal(o))}</span></div></div>
   <label class="f">Số tiền đã thu<input id="pyAmt" inputmode="numeric" class="num" value="${esc(st.amt)}"></label>
   ${pmSeg(st.pm)}${pmPhotos(st.pm,st.photos,'p')}<div id="pyMsg"></div>
   <button class="btn block pri" id="pySave">Lưu đã thanh toán</button>`;b.querySelectorAll('[data-pm]').forEach(x=>x.onclick=()=>{st.pm=x.dataset.pm;draw(b)});
   bindPhotos(b,()=>st.photos,()=>draw(b));b.querySelector('#pyAmt').oninput=e=>st.amt=e.target.value;
   b.querySelector('#pySave').onclick=async e=>{const e2=pmCheck(st.pm,st.photos);if(e2){b.querySelector('#pyMsg').innerHTML='<div class="alert r">'+e2+'</div>';return}e.target.disabled=true;try{const ids=await savePhotos(st.photos,o.id,'pay');await R.db.doc('orders/'+o.id).update({paid:true,paidAmount:Math.round(toNum(st.amt)),paidBy:R.mode==='ship'?'ship':'sale',payMethod:st.pm,payPhotos:(o.payPhotos||[]).concat(ids),updatedAt:Date.now(),updatedBy:R.uid});toast('Đã cập nhật thanh toán');closeSheet()}catch(x){e.target.disabled=false;toast('Không lưu được ('+(x.code||'lỗi')+')')}}};
  openSheet('Thanh toán '+o.no,'',draw)}

/* ================= SHIP: GIAO HÀNG ================= */
function deliverSheet(o){const d={lines:o.lines.map(l=>Object.assign({},l,{src:'Giá trên đơn',listPrice:l.listPrice!=null?l.listPrice:l.price})),paid:!!o.paid,paidAmount:'',payPhotos:[],retPhotos:[],outside:!!o.outside,note:''};
  const draw=b=>{const total=orderTotal(d);const hasRet=d.lines.some(l=>toNum(l.ret)||toNum(l.swap));
    b.innerHTML=`<div class="group"><div class="row"><div class="grow"><div class="t">${esc(o.custName)}</div><div class="s">${esc(o.address||'')}</div></div></div></div>
    <div class="tiny muted">Sửa lại số lượng thực giao, đổi/trả hoặc giá nếu khác đơn.</div>
    <div class="list">${d.lines.map((l,i)=>lineCard(l,i,null,{qtyLabel:'SL thực giao'})).join('')}</div>
    <div class="group"><div class="toggle"><div><div style="font-weight:600">Khách đã thanh toán</div><div class="tiny muted">${o.paid?'Sale đã ghi nhận thu '+vnd(o.paidAmount):'Bật nếu bạn thu tiền khi giao'}</div></div><input type="checkbox" class="sw" id="dvPaid" ${d.paid?'checked':''} ${o.paid?'disabled':''} aria-label="Đã thanh toán"></div>
     ${d.paid&&!o.paid?`<div class="row" style="flex-direction:column;align-items:stretch;gap:10px"><label class="f">Số tiền đã thu<input id="dvAmt" inputmode="numeric" class="num" value="${esc(d.paidAmount===''?total:d.paidAmount)}"></label>${pmSeg(d.payMethod)}${pmPhotos(d.payMethod,d.payPhotos,'pay')}</div>`:''}
     ${hasRet?`<div class="row" style="flex-direction:column;align-items:stretch;gap:6px"><div class="tiny muted" style="font-weight:600">Ảnh hàng đổi trả</div>${photoStrip(d.retPhotos,true,'ret')}</div>`:''}
     <div class="toggle"><div><div style="font-weight:600">Đơn ship ngoài</div><div class="tiny muted">Tính công riêng, trả ngay (${vnd(ST().shipFeeOut)}/đơn)</div></div><input type="checkbox" class="sw" id="dvOut" ${d.outside?'checked':''} aria-label="Đơn ship ngoài"></div></div>
    <label class="f">Ghi chú giao hàng<input id="dvNote" value="${esc(d.note)}" placeholder="VD: khách hẹn chuyển khoản tối"></label>
    <div class="card"><div class="totalbar"><span class="muted">Tổng tiền hàng</span><span class="money">${vnd(total)}</span></div></div>
    <div id="dvMsg"></div><button class="btn block pri" id="dvSave">Xác nhận đã giao</button>`;
    bindLineCards(b,d,()=>draw(b));bindPhotos(b,k=>k==='pay'?d.payPhotos:d.retPhotos,()=>draw(b));
    const p=b.querySelector('#dvPaid');p.onchange=()=>{d.paid=p.checked;draw(b)};b.querySelectorAll('[data-pm]').forEach(x=>x.onclick=()=>{d.payMethod=x.dataset.pm;draw(b)});const a=b.querySelector('#dvAmt');if(a)a.oninput=()=>d.paidAmount=a.value;
    b.querySelector('#dvOut').onchange=e=>d.outside=e.target.checked;b.querySelector('#dvNote').oninput=e=>d.note=e.target.value;
    b.querySelector('#dvSave').onclick=async e=>{const m=b.querySelector('#dvMsg');const lines=d.lines.map(l=>({code:l.code,name:l.name,unit:l.unit,qty:r3(toNum(l.qty)),promo:r3(toNum(l.promo)),gift:r3(toNum(l.gift)),disc:Math.min(100,Math.max(0,r3(toNum(l.disc)))),g:l.g?1:0,swap:r3(toNum(l.swap)),ret:r3(toNum(l.ret)),price:Math.round(toNum(l.price)),listPrice:l.listPrice==null?null:Math.round(toNum(l.listPrice))}));
      if(lines.some(l=>l.ret>l.qty+1e-9)){m.innerHTML='<div class="alert r">Số trả không được lớn hơn số giao.</div>';return}
      if((lines.some(l=>l.ret||l.swap))&&!d.retPhotos.length&&!d._noPhotoOk){d._noPhotoOk=1;m.innerHTML='<div class="alert w">Có hàng đổi trả nhưng chưa chụp ảnh. Bấm xác nhận lần nữa nếu vẫn muốn lưu.</div>';return}
      if(!o.paid&&d.paid){const e2=pmCheck(d.payMethod,d.payPhotos);if(e2){m.innerHTML='<div class="alert r">'+e2+'</div>';return}}
      e.target.disabled=true;const gpL=geoSoft();gpL.catch(()=>{});try{const pay=await savePhotos(d.payPhotos,o.id,'pay'),ret=await savePhotos(d.retPhotos,o.id,'ret');const total=lines.reduce((s,l)=>s+lineAmt(l),0);
        const up={lines,total,status:'done',shipId:o.shipId||R.uid,doneAt:Date.now(),outside:!!d.outside,retPhotos:(o.retPhotos||[]).concat(ret),updatedAt:Date.now(),updatedBy:R.uid};
        if(!o.saleLines)up.saleLines=o.lines;if(d.note)up.note=(o.note?o.note+' | ':'')+'Giao: '+d.note;
        if(!o.paid&&d.paid){up.paid=true;up.paidAmount=Math.round(d.paidAmount===''?total:toNum(d.paidAmount));up.paidBy='ship';up.payMethod=d.payMethod;up.payPhotos=(o.payPhotos||[]).concat(pay)}
        await R.db.doc('orders/'+o.id).update(up);gpL.then(c=>learnLoc(o,c)).catch(()=>{});toast('Đã giao đơn '+o.no);closeSheet()}catch(x){e.target.disabled=false;m.innerHTML='<div class="alert r">Không lưu được ('+esc(x.code||'lỗi')+').</div>'}}};
  openSheet('Giao đơn '+o.no,'',draw)}
function viewShipTodo(v){const L=R.orders.filter(o=>(o.status==='new'&&!o.shipId)||(o.status==='shipping'&&o.shipId===R.uid)||(o.status==='new'&&o.shipId===R.uid));
  const mine=L.filter(o=>o.shipId===R.uid),free0=L.filter(o=>!o.shipId),free=free0.filter(o=>inRt(o)&&inDay(o));const sortF=(a,b)=>((a.dlvDate||a.date)+a.no).localeCompare((b.dlvDate||b.date)+b.no);
  const sel=shipRtSel(),mr=myRoutes(),fd=free0.filter(inDay),nMine=fd.filter(o=>mr.includes(routeOf(o)||'none')).length;
  const rtNames=sel.mode==='all'?'Tất cả tuyến':sel.ids.map(rtLabel).join(' + '),rtCodes=sel.mode==='all'?'':sel.ids.map(id=>((routeById(id)||{}).codes||[]).join(' · ')).filter(Boolean).join(' · ');
  const dayTxt=!R.ui.shipDay?'Tất cả ngày':(R.ui.shipDay===today()?'Hôm nay · ':R.ui.shipDay===isoAdd(today(),1)?'Ngày mai · ':'')+wdName(R.ui.shipDay)+' '+dmy(R.ui.shipDay);
  const rtBox=RT().length?`<div class="card stack" style="gap:10px"><div class="row tap" id="rtPick" style="padding:0;border:0;min-height:0"><span style="font-size:20px">🛣️</span><div class="grow"><div class="tiny muted">Tuyến giao đang xem</div><div style="font-weight:700">${esc(rtNames)}</div><div class="tiny" style="color:var(--accent)">${sel.mode==='mine'?'Tuyến của tôi':sel.mode==='all'?'Đơn chờ của mọi tuyến':'Đang xem thêm tuyến khác'}${rtCodes?' · '+esc(rtCodes):''}</div></div><span class="chev">›</span></div>
   <div class="seg"><button data-rs="mine" class="${sel.mode==='mine'?'on':''}" ${mr.length?'':'disabled'}>Của tôi (${nMine})</button><button data-rs="pick" class="${sel.mode==='custom'?'on':''}">Tuyến khác</button><button data-rs="all" class="${sel.mode==='all'?'on':''}">Tất cả (${fd.length})</button></div>
   <div class="row tap" id="dayPick" style="padding:0;border:0;min-height:0"><span style="font-size:20px">📅</span><div class="grow"><div class="tiny muted">Ngày giao</div><div style="font-weight:700">${esc(dayTxt)}</div></div><span class="chev">›</span></div></div>`:'';
  v.innerHTML=`<h1 class="big">Cần giao</h1><div class="stack">${rtBox}
   <div class="sec" style="margin-top:0">Đơn của tôi (${mine.length})</div><div class="list">${mine.sort(sortF).map(o=>orderCard(o,{actions:`<button class="btn pri" data-dv="${esc(o.id)}">Giao xong</button>`})).join('')||'<div class="empty">Bạn chưa nhận đơn nào. Chọn đơn ở dưới để nhận giao.</div>'}</div>
   <div class="sec">Đơn chờ người giao (${free.length})</div><div class="list">${free.sort(sortF).map(o=>orderCard(o,{who:'saleId',actions:`<button class="btn blue" data-take="${esc(o.id)}">Nhận giao</button>`})).join('')||'<div class="empty">Không còn đơn chờ.</div>'}</div></div>`;
  $$('[data-oid]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;orderDetail(R.orders.find(o=>o.id===c.dataset.oid))});
  $$('[data-dv]').forEach(b=>b.onclick=()=>deliverSheet(R.orders.find(o=>o.id===b.dataset.dv)));
  $$('[data-rs]').forEach(b=>b.onclick=()=>{const k=b.dataset.rs;if(k==='pick')return pickRoutes(free0.filter(inDay));R.ui.rtSel=k==='mine'?{mode:'mine',ids:mr}:{mode:'all',ids:[]};render()});
  const rp=$('#rtPick');if(rp)rp.onclick=()=>pickRoutes(free0.filter(inDay));const dp=$('#dayPick');if(dp)dp.onclick=()=>pickShipDay();
  $$('[data-take]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const ref=R.db.doc('orders/'+b.dataset.take);const s=await ref.get();if(s.data().shipId&&s.data().shipId!==R.uid){toast('Đơn đã có người nhận.');return}await ref.update({status:'shipping',shipId:R.uid,shipAt:Date.now()});toast('Đã nhận đơn')}catch(e){b.disabled=false;toast('Lỗi '+(e.code||''))}})}

/* ================= BÁO CÁO SALE / SHIP ================= */
function viewSaleReport(v,uid){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Báo cáo</h1>'+periodBar()+'<div class="empty">Đang tải dữ liệu…</div>';bindPeriod();return}
  const L=all.filter(o=>o.saleId===uid);const s=stats(L);const prod=prodAgg(L);
  const ym=payYm(),PL=saleOrdersDone(ym),pay=PL?salePay(uid,ym,PL):null;
  const debt=R.orders.filter(o=>o.saleId===uid&&owedOf(o)>0);const dSum=debt.reduce((x,o)=>x+owedOf(o),0);const dCust=new Set(debt.map(o=>o.cust||o.custName)).size;
  v.innerHTML=`<h1 class="big">Báo cáo</h1><div class="stack">${periodBar()}
   ${accCard('ai','Tổng thu nhập tháng '+ym.slice(5)+'/'+ym.slice(0,4),pay?vnd(pay.total):'…',pay?pay.cong+' công · bấm để xem chi tiết':'',C_G,()=>salePayBlock(uid))}
   ${accCard('ar','Tổng doanh số',vnd(s.revenue),`${s.orders} đơn · ${fmt(s.qty)} SL · đã trừ hàng trả`,C_B,()=>prodTable(prod))}
   ${accCard('ad','Tổng nợ phải thu',vnd(dSum),`${debt.length} đơn · ${dCust} khách`,C_R,()=>debtBlock(debt))}
   ${accCard('ax','Tỷ lệ đổi trả',retRate(s),`đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}`,C_O,()=>retTable(prod))}
   </div>`;bindPeriod();bindAcc();bindPayMonth();bindOids(R.orders)}
function prodTable(prod){const rows=[...prod.entries()].sort((a,b)=>b[1].amt-a[1].amt);
  return rows.length?`<div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">SL</th><th class="n">Tặng</th><th class="n">Đổi</th><th class="n">Trả</th><th class="n">Doanh số</th></tr></thead><tbody>${rows.map(([c,r])=>`<tr><td>${esc(r.name)}<div class="tiny muted">${esc(c)} · ${esc(r.unit)}</div></td><td class="n">${fmt(r.qty)}</td><td class="n">${fmt0(r.promo)}</td><td class="n">${fmt0(r.swap)}</td><td class="n">${fmt0(r.ret)}</td><td class="n">${vnd(r.amt)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có đơn trong kỳ này.</div>'}
function viewShipDone(v){const [f,t]=periodRange();const all=ordersIn(f,t);
  const L=(all||[]).filter(o=>o.shipId===R.uid&&o.status==='done').sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
  v.innerHTML=`<h1 class="big">Đã giao</h1><div class="stack">${periodBar()}<div class="list">${all?L.map(o=>orderCard(o)).join('')||'<div class="empty">Chưa giao đơn nào trong kỳ.</div>':'<div class="empty">Đang tải…</div>'}</div></div>`;bindPeriod();
  $$('[data-oid]').forEach(c=>c.onclick=()=>orderDetail(L.find(o=>o.id===c.dataset.oid)))}

/* ================= LƯƠNG SHIP (v26) =================
   Ngày công = ngày có ≥1 đơn ship xác nhận Đã giao (theo doneAt). Chuyên cần = max(0, shipCC − ngày nghỉ × shipCCOff), ngày nghỉ tính trên mọi ngày trong tháng (tháng đang chạy: tới hôm nay).
   Hoa hồng chuối + dứa quả: kg bán (SL − trả) × shipKg; gói/quả quy kg theo trọng lượng trên tên; dứa quả tính SL như kg.
   Hoa hồng SP khác: shipPct% × tiền hàng trước thuế (giá sau KM, trừ hàng trả; dòng giá sau thuế g=1 tách thuế theo bảng thuế suất).
   Thưởng đổi chuối: nếu tỷ lệ đổi (kg đổi ÷ kg chuối giao) < shipSwapStd% → (chuẩn − thực tế) × kg chuối giao × shipSwapPrice. */
function payKg(l){const p=findProd(l.code);const nm=noAcc(l.name||(p&&p.name)||''),un=noAcc(l.unit||(p&&p.unit)||'');
  const ch=/^chuoi/.test(nm),du=/^dua/.test(nm)&&!/dong lanh|bo mieng|nuoc|^dua.*\d+\s*g\b/.test(nm)&&(un==='kg'||/^dua (chin|tuoi vip)/.test(nm));
  if(!ch&&!du)return null;if(du||un==='kg')return{k:1,ch};const m=nm.match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/);if(!m)return{k:0,ch};const v=parseFloat(m[1].replace(',','.'));return{k:m[2]==='kg'?v:v/1000,ch}}
function ymRange(ym){const [y,m]=ym.split('-').map(Number);const n=new Date(y,m,0).getDate();return[isoOf(new Date(y,m-1,1)),isoOf(new Date(y,m-1,n)),n]}
const payYm=()=>R.ui.payYm||today().slice(0,7);
function payOrders(ym){const [f,t]=ymRange(ym);const pf=isoOf(new Date(+f.slice(0,4),+f.slice(5,7)-1,-30));const all=ordersIn(pf<windowStart()&&f>=windowStart()?windowStart():pf,t);if(!all)return null;
  return all.filter(o=>o.status==='done'&&o.shipId&&o.doneAt&&(d=>d>=f&&d<=t)(isoOf(new Date(o.doneAt))))}
function shipPay(uid,ym,L){const S=ST(),[f,t,n]=ymRange(ym);const td=today();const upto=t<td?n:(f>td?0:+td.slice(8,10));
  const days=new Set(),kgRows=new Map();let kg=0,kgS=0,kgW=0,kgG=0,chKg=0,swKg=0,pre=0,preS=0,preW=0,preG=0,noKg=[],outN=0,outF=0;
  const far=String(S.shipFarCodes||'').split(/[,;\s]+/).map(x=>noAcc(x)).filter(Boolean);
  for(const o of L){if(o.shipId!==uid)continue;days.add(isoOf(new Date(o.doneAt)));const ck=custKind(o);
    if(o.outside){const m=noAcc(o.address||'').match(/^\(([^)]*)\)/);const code=m?m[1].replace(/\s*-.*$/,'').trim():'';if(far.some(x=>code===x))outF++;else outN++}
    for(const l of o.lines||[]){if(isFee(l))continue;const q0=toNum(l.qty),rt=toNum(l.ret),sw0=toNum(l.swap),gq=giftQ(l);const net=Math.max(0,q0-rt);const base=q0+sw0+gq;if(!base)continue;const pk=payKg(l);
      if(pk){if(!pk.k){noKg.push(l.name);continue}kg+=base*pk.k;kgS+=q0*pk.k;kgW+=sw0*pk.k;kgG+=gq*pk.k;if(pk.ch){chKg+=net*pk.k;swKg+=sw0*pk.k}
        const r=kgRows.get(l.code)||{name:l.name,qty:0,kg:0,sw:0,ch:pk.ch};r.qty+=base;r.kg+=base*pk.k;r.sw+=pk.ch?sw0*pk.k:0;kgRows.set(l.code,r)}
      else{let up,gross;if(toNum(l.price)){up=toNum(l.price);gross=!!l.g}else{up=toNum(defaultPrice(o.cust,l.code).p);gross=true}if(!up)continue;
        const v=gross?vatOf(l.name,ck.co):0;const u=typeof v==='number'?up/(1+v):up;pre+=base*u;preS+=q0*u;preW+=sw0*u;preG+=gq*u}}}
  const worked=[...days].filter(d=>d>=f&&d<=t).length;const off=Math.max(0,upto-[...days].filter(d=>+d.slice(8,10)<=upto).length);
  const cc=Math.max(0,toNum(S.shipCC)-off*toNum(S.shipCCOff));const hhKg=Math.round(kg*toNum(S.shipKg));const hhPct=Math.round(pre*toNum(S.shipPct)/100);
  const rate=chKg?swKg/chKg:0,std=toNum(S.shipSwapStd)/100;const bonus=chKg&&rate<std?Math.round((std-rate)*chKg*toNum(S.shipSwapPrice)):0;
  const outFee=outN*toNum(S.shipFeeOut)+outF*toNum(S.shipFeeFar);
  return{uid,ym,n,upto,days,worked,off,cc,kg:r3(kg),kgS:r3(kgS),kgW:r3(kgW),kgG:r3(kgG),chKg:r3(chKg),swKg:r3(swKg),rate,pre:Math.round(pre),preS:Math.round(preS),preW:Math.round(preW),preG:Math.round(preG),hhKg,hhPct,bonus,total:cc+hhKg+hhPct+bonus,outN,outF,outFee,kgRows,noKg:[...new Set(noKg)]}}
const pctS=x=>(Math.round(x*10000)/100).toLocaleString('vi-VN')+'%';
function payMonthBar(){const ym=payYm(),d=new Date(),c=isoOf(d).slice(0,7),p=isoOf(new Date(d.getFullYear(),d.getMonth()-1,1)).slice(0,7);
  return `<div class="seg"><button data-pym="${c}" class="${ym===c?'on':''}">Tháng này</button><button data-pym="${p}" class="${ym===p?'on':''}">Tháng trước</button></div><input type="month" id="pymIn" value="${ym}" max="${c}">`}
function bindPayMonth(){$$('[data-pym]').forEach(b=>b.onclick=()=>{R.ui.payYm=b.dataset.pym;render()});const i=$('#pymIn');if(i)i.onchange=()=>{if(i.value){R.ui.payYm=i.value;render()}}}
/* tổng hợp giao trong ngày của 1 ship (theo ngày xác nhận đã giao) */
function dayBlock(uid){const d=R.ui.dayRep||today();const L=R.orders.filter(o=>o.status==='done'&&o.shipId===uid&&o.doneAt&&isoOf(new Date(o.doneAt))===d);
  const m=new Map();L.forEach(o=>(o.lines||[]).forEach(l=>{const r=m.get(l.code)||{name:l.name,unit:l.unit,q:0,g:0,w:0,r:0};r.q+=toNum(l.qty);r.g+=giftQ(l);r.w+=toNum(l.swap);r.r+=toNum(l.ret);m.set(l.code,r)}));
  const rows=[...m.values()].sort((a,b)=>(b.q+b.g+b.w)-(a.q+a.g+a.w));const dd=new Date(d+'T00:00:00');
  return `<div class="sec">Tổng hợp giao trong ngày</div><div style="display:flex;gap:8px;align-items:center"><button class="btn sm" data-dstep="-1" aria-label="Ngày trước">‹</button><input type="date" id="dayIn" value="${d}" max="${today()}" style="flex:1"><button class="btn sm" data-dstep="1" aria-label="Ngày sau" ${d>=today()?'disabled':''}>›</button></div>
   <div class="tiny muted">${wdName(d)}, ${dmy(d)} · ${L.length} đơn đã giao${L.filter(o=>o.outside).length?' · '+L.filter(o=>o.outside).length+' đơn ship ngoài':''}</div>
   ${rows.length?`<div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">SL bán</th><th class="n">Tặng</th><th class="n">Đổi</th><th class="n">Trả</th><th class="n">Tổng xuất</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}<div class="tiny muted">${esc(r.unit||'')}</div></td><td class="n">${fmt(r3(r.q))}</td><td class="n">${fmt0(r3(r.g))}</td><td class="n">${fmt0(r3(r.w))}</td><td class="n">${fmt0(r3(r.r))}</td><td class="n"><b>${fmt(r3(r.q+r.g+r.w))}</b></td></tr>`).join('')}</tbody></table></div>
   <div class="tiny muted">Tổng xuất = SL bán + tặng + đổi (hàng khách trả lại ghi riêng ở cột Trả).</div>`:'<div class="empty">Không có đơn giao trong ngày này.</div>'}`}
function bindDay(uid){const i=$('#dayIn');if(!i)return;i.onchange=()=>{if(i.value){R.ui.dayRep=i.value;render()}};
  $$('[data-dstep]').forEach(b=>b.onclick=()=>{const d=R.ui.dayRep||today();const nd=isoAdd(d,+b.dataset.dstep);if(nd<=today()){R.ui.dayRep=nd;render()}});
  const x=$('#dayXls');if(x)x.onclick=()=>{const d=R.ui.dayRep||today();const L=R.orders.filter(o=>o.status==='done'&&o.shipId===uid&&o.doneAt&&isoOf(new Date(o.doneAt))===d);const m=new Map();
    L.forEach(o=>(o.lines||[]).forEach(l=>{const r=m.get(l.code)||[l.code,l.name,l.unit,0,0,0,0];r[3]+=toNum(l.qty);r[4]+=giftQ(l);r[5]+=toNum(l.swap);r[6]+=toNum(l.ret);m.set(l.code,r)}));
    const rows=[['Mã','Sản phẩm','ĐVT','SL bán','Tặng','Đổi','Trả','Tổng xuất']].concat([...m.values()].map(r=>r.concat([r[3]+r[4]+r[5]])));
    xlsxFile('Tong_hop_giao_'+staffName(uid).replace(/\s+/g,'_')+'_'+d+'.xlsx',[{name:'Tong hop ngay',rows,cols:[10,34,7,10,8,8,8,10]}])}}
function payBlock(uid){const ym=payYm();const L=payOrders(ym);const head=`<div class="sec">Lương tháng ${ym.slice(5)}/${ym.slice(0,4)}</div>${payMonthBar()}`;
  if(!L)return head+'<div class="empty">Đang tải…</div>';const s=shipPay(uid,ym,L),S=ST();const [f]=ymRange(ym);const pc=x=>String(x).replace('.',',');
  const row=(a,b,x)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)"><div><div style="font-weight:600">${a}</div>${x?`<div class="tiny muted" style="margin-top:2px">${x}</div>`:''}</div><div style="font-weight:700;white-space:nowrap">${b}</div></div>`;
  const w0=(new Date(+f.slice(0,4),+f.slice(5,7)-1,1).getDay()+6)%7;let cal='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;margin-top:8px">'+['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class="muted">${d}</div>`).join('')+'<div></div>'.repeat(w0);
  for(let d=1;d<=s.n;d++){const iso=f.slice(0,8)+pad(d);const w=s.days.has(iso),fut=d>s.upto;cal+=`<div style="padding:6px 0;border-radius:8px;${w?'background:rgba(30,150,90,.15);color:#1e9a5c':fut?'opacity:.4':'background:rgba(220,60,60,.15);color:#d64545;font-weight:700'}">${d}</div>`}cal+='</div>';
  const rows=[...s.kgRows.values()].sort((a,b)=>b.kg-a.kg);
  return head+`<div class="card"><div class="totalbar"><span class="muted">Tổng thu nhập tháng${s.upto<s.n?' (tạm tính)':''}</span><span class="money">${vnd(s.total)}</span></div></div>
   <div class="card"><div style="font-weight:700">📅 Ngày công: ${s.worked}/${s.n} ngày</div><div class="tiny muted">Xanh = có đơn giao thành công · Đỏ = nghỉ${s.upto<s.n?' · mờ = chưa tới':''}</div>${cal}</div>
   <div class="card">${row('Thưởng chuyên cần',vnd(s.cc),`${fmt(toNum(S.shipCC))} − nghỉ ${s.off} ngày × ${fmt(toNum(S.shipCCOff))}`)}
    ${row('Hoa hồng chuối, dứa quả',vnd(s.hhKg),`${fmt(s.kg)} kg × ${fmt(toNum(S.shipKg))}đ<br>= bán ${fmt(s.kgS)} + đổi ${fmt(s.kgW)} + tặng ${fmt(s.kgG)} kg`)}
    ${row('Hoa hồng sản phẩm khác',vnd(s.hhPct),`${pc(S.shipPct)}% × ${vnd(s.pre)} (giá trước khuyến mại, trước thuế)<br>= bán ${fmt(s.preS)} + đổi ${fmt(s.preW)} + tặng ${fmt(s.preG)}`)}
    ${row('Thưởng đổi trả chuối',vnd(s.bonus),s.chKg?`Tỷ lệ đổi chuối ${pctS(s.rate)} (${fmt(s.swKg)} / ${fmt(s.chKg)} kg) ${s.rate<toNum(S.shipSwapStd)/100?'&lt;':'≥'} ${pc(S.shipSwapStd)}%${s.bonus?`<br>(${pc(S.shipSwapStd)}% − ${pctS(s.rate)}) × ${fmt(s.chKg)} kg × ${fmt(toNum(S.shipSwapPrice))}đ`:' → không có thưởng'}`:'Chưa giao chuối')}
    <div style="display:flex;justify-content:space-between;padding:12px 0 2px;border-top:2px solid var(--line)"><b>Tổng lương tháng</b><b>${vnd(s.total)}</b></div></div>
   <div class="card">${row('Công đơn ship ngoài (trả ngay)',vnd(s.outFee),s.outN+s.outF?`${s.outN} đơn nội thành × ${fmt(toNum(S.shipFeeOut))}${s.outF?` + ${s.outF} đơn ngoại thành × ${fmt(toNum(S.shipFeeFar))}`:''}`:'Chưa có đơn ship ngoài')}<div class="tiny muted">Đã trả ngay khi giao, không cộng vào lương tháng.</div></div>
   ${s.noKg.length?`<div class="alert w">Chưa quy được kg (tên không ghi trọng lượng): ${s.noKg.map(esc).join(', ')}</div>`:''}
   ${rows.length?`<div class="card"><div style="font-weight:700;margin-bottom:6px">Chi tiết chuối, dứa quả giao</div><div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">SL tính công</th><th class="n">kg</th><th class="n">Đổi (kg)</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="n">${fmt(r3(r.qty))}</td><td class="n">${fmt(r3(r.kg))}</td><td class="n">${r.ch?fmt0(r3(r.sw)):'—'}</td></tr>`).join('')}<tr><td><b>Cộng</b></td><td></td><td class="n"><b>${fmt(s.kg)}</b></td><td class="n"><b>${fmt0(s.swKg)}</b></td></tr></tbody></table></div><div class="tiny muted" style="margin-top:6px">SL tính công = SL bán (gồm cả hàng khách trả) + đổi + tặng. Tỷ lệ đổi chỉ tính trên chuối, chia cho kg chuối bán (đã trừ hàng trả).</div></div>`:''}`}
function shipIds(L){const ids=new Set([...R.staff.entries()].filter(([u,x])=>x&&x.role==='ship'&&x.active!==false).map(([u])=>u));L.forEach(o=>ids.add(o.shipId));return [...ids]}
function payAdmin(){const ym=payYm();const L=payOrders(ym);const head=`<div class="sec">Lương ship tháng ${ym.slice(5)}/${ym.slice(0,4)}</div>${payMonthBar()}`;
  if(!L)return head+'<div class="empty">Đang tải…</div>';const P=shipIds(L).map(u=>shipPay(u,ym,L)).sort((a,b)=>b.total-a.total);
  if(!P.length)return head+'<div class="empty">Chưa có tài khoản ship.</div>';
  return head+`<div class="tw"><table><thead><tr><th>Ship</th><th class="n">Công</th><th class="n">Chuyên cần</th><th class="n">HH chuối, dứa</th><th class="n">HH SP khác</th><th class="n">Thưởng đổi trả</th><th class="n">Tổng lương</th><th class="n">Ship ngoài (trả ngay)</th></tr></thead><tbody>${P.map(p=>`<tr><td>${esc(staffName(p.uid))}</td><td class="n">${p.worked}/${p.n}</td><td class="n">${fmt0(p.cc)}</td><td class="n">${fmt0(p.hhKg)}</td><td class="n">${fmt0(p.hhPct)}</td><td class="n">${fmt0(p.bonus)}</td><td class="n"><b>${fmt0(p.total)}</b></td><td class="n">${fmt0(p.outFee)}</td></tr>`).join('')}</tbody></table></div>
   <button class="btn" id="payXls">Xuất Excel bảng lương ship</button>`}
function bindPayAdmin(){bindPayMonth();const b=$('#payXls');if(!b)return;b.onclick=()=>{const ym=payYm();const L=payOrders(ym)||[];const S=ST();const P=shipIds(L).map(u=>shipPay(u,ym,L));
  const rows=[['Ship','Ngày công','Số ngày tháng','Ngày nghỉ','Thưởng chuyên cần','Kg tính công (bán+đổi+tặng)','HH chuối, dứa (đ)','Giá trị trước thuế SP khác (bán+đổi+tặng)','HH SP khác (đ)','Kg chuối bán','Kg chuối đổi','Tỷ lệ đổi chuối','Thưởng đổi trả (đ)','Tổng lương tháng (đ)','Đơn ship ngoài nội thành','Đơn ship ngoài ngoại thành','Công ship ngoài – trả ngay (đ)']];
  P.forEach(p=>rows.push([staffName(p.uid),p.worked,p.n,p.off,p.cc,p.kg,p.hhKg,p.pre,p.hhPct,p.chKg,p.swKg,Math.round(p.rate*10000)/100+'%',p.bonus,p.total,p.outN,p.outF,p.outFee]));
  rows.push([],['Thông số: chuyên cần '+S.shipCC+'đ, trừ '+S.shipCCOff+'đ/ngày nghỉ; HH chuối, dứa quả '+S.shipKg+'đ/kg; HH SP khác '+S.shipPct+'% giá trước KM, trước thuế; tỷ lệ đổi chuối chuẩn '+S.shipSwapStd+'%, giá '+S.shipSwapPrice+'đ/kg; ship ngoài '+S.shipFeeOut+'đ nội thành, '+S.shipFeeFar+'đ ngoại thành ('+S.shipFarCodes+'), trả ngay, không cộng lương tháng']);
  xlsxFile('Luong_ship_'+ym+'.xlsx',[{name:'Luong ship',rows,cols:[22,10,10,10,14,14,14,18,14,12,12,12,14,14,12,12,14]}])}}

/* ================= CHẤM CÔNG + LƯƠNG SALE (v29) =================
   Mỗi ngày 1 ảnh chụp từ camera + vị trí GPS bắt buộc → 1 công (attend/{uid}_{ngày}). Quản lý có thể bỏ công (void).
   Lương cứng = saleBase × công / saleStd; phụ cấp = saleAllow × công / saleStd (vượt chuẩn trả thêm).
   Hoa hồng = saleComm% × doanh số đơn sale lên đã giao trong tháng (theo ngày giao), giá sau KM, trước thuế, trừ hàng trả. */

/* ===== v30: hướng dẫn bật lại quyền micro / vị trí khi lỡ bấm "Không cho phép" =====
   Trang web không tự bật lại được quyền đã bị chặn; app phát hiện, chỉ đúng chỗ bật theo loại máy và cho "Thử lại". */
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||!!navigator.standalone}catch(e){return false}};
function permSteps(kind,off){const n=kind==='mic'?'Micro':'Vị trí',site=location.host;const S=[];
  if(isIOS){if(off&&kind==='geo')S.push('Bật định vị: <b>Cài đặt</b> › <b>Quyền riêng tư & Bảo mật</b> › <b>Dịch vụ định vị</b> › Bật; kéo xuống <b>Trang web Safari</b> › chọn <b>Khi dùng ứng dụng</b>.');
    if(!isStandalone())S.push(`Trên Safari: bấm <b>aA</b> (hoặc biểu tượng ☰) ở thanh địa chỉ › <b>Cài đặt trang web</b> › <b>${n}</b> › chọn <b>Cho phép</b>.`);
    S.push(`Hoặc: <b>Cài đặt</b> iPhone › <b>Safari</b> (hoặc <b>Ứng dụng › Safari</b>) › mục <b>${n}</b> › chọn <b>Cho phép</b> (không chọn "Hỏi" để lần sau tự bật).`);
    if(kind==='geo'&&!off)S.push('Nếu vẫn lỗi: Cài đặt › Quyền riêng tư & Bảo mật › Dịch vụ định vị › <b>Trang web Safari</b> › <b>Khi dùng ứng dụng</b>.')}
  else{if(off&&kind==='geo')S.push('Bật <b>Vị trí / GPS</b>: vuốt thanh thông báo từ trên xuống › bấm biểu tượng <b>Vị trí</b>.');
    S.push(`Trên Chrome: bấm biểu tượng <b>ổ khóa / ⓘ / ⚙</b> bên trái địa chỉ trang › <b>Quyền</b> › <b>${n}</b> › <b>Cho phép</b>.`);
    S.push(`Hoặc: Chrome › <b>⋮</b> › <b>Cài đặt</b> › <b>Cài đặt trang web</b> › <b>${n}</b> › tìm <b>${esc(site)}</b> (mục Bị chặn) › <b>Cho phép</b>.`);
    S.push(`Nếu vẫn không được: <b>Cài đặt</b> điện thoại › <b>Ứng dụng</b> › <b>Chrome</b> › <b>Quyền</b> › <b>${n}</b> › <b>Cho phép</b>.`)}
  S.push('Quay lại app, <b>tải lại trang</b> rồi bấm <b>Thử lại</b>.');return S}
function permHTML(kind,off){const n=kind==='mic'?'micro':'vị trí';
  return `<div class="alert w">${off?'Điện thoại đang tắt định vị (GPS).':'Điện thoại đang <b>chặn '+n+'</b> cho app (lần trước đã bấm “Không cho phép”).'} App không tự bật lại được, bạn làm 1 lần theo các bước dưới, chọn <b>Cho phép</b> để các lần sau app tự dùng ${n}.</div>
   <ol style="margin:4px 0 0;padding-left:20px;line-height:1.55">${permSteps(kind,off).map(x=>`<li style="margin-bottom:6px">${x}</li>`).join('')}</ol>`}
function permSheet(kind,retry,off){openSheet(kind==='mic'?'Bật micro cho app':off?'Bật định vị (GPS)':'Bật vị trí cho app',`${permHTML(kind,off)}<button class="btn block pri" id="permRetry">Thử lại</button><button class="btn block" id="permReload">Tải lại trang</button>`,b=>{
  b.querySelector('#permRetry').onclick=()=>{closeSheet();retry&&retry()};b.querySelector('#permReload').onclick=()=>location.reload()})}
async function permState(name){try{if(!navigator.permissions)return '';return (await navigator.permissions.query({name})).state}catch(e){return ''}}
const attOf=(uid,ym)=>(R.attend||[]).filter(a=>a.uid===uid&&String(a.date||'').slice(0,7)===ym);
function geoTry(o){return new Promise((ok,no)=>{if(!navigator.geolocation)return no({code:'nogeo'});navigator.geolocation.getCurrentPosition(p=>ok(p.coords),e=>no(e),o)})}
function geoNow(){return geoTry({enableHighAccuracy:true,timeout:15000,maximumAge:60000}).catch(e=>{if(e&&e.code===1)throw e;return geoTry({enableHighAccuracy:false,timeout:20000,maximumAge:300000})})}
const inApp=()=>/Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger/i.test(navigator.userAgent||'');
function camPhoto(){return new Promise(res=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.setAttribute('capture','environment');inp.style.display='none';document.body.appendChild(inp);
  inp.onchange=async()=>{const f=inp.files[0];inp.remove();if(!f)return res(null);try{res(await compress(f))}catch(e){toast('Không đọc được ảnh này');res(null)}};inp.click()})}
function kmDist(a,b){const R6=6371,r=x=>x*Math.PI/180;const dl=r(b[0]-a[0]),dn=r(b[1]-a[1]);const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 2*R6*Math.asin(Math.sqrt(h))}
const coLoc=()=>{const m=String(ST().coLoc||'').match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);return m?[+m[1],+m[2]]:null};
const hash36=s=>{let a=7,b=13;for(const c of new TextEncoder().encode(String(s))){a=(Math.imul(a,31)+c)>>>0;b=(Math.imul(b,37)+c)>>>0}return a.toString(36)+b.toString(36)};
const locKey=(cust,addr)=>'L_'+hash36(String(cust)+'|'+noAcc(addr||'').replace(/\s+/g,' '));
const geoSoft=()=>(R._geoSt&&R._geoSt.state==='denied')?Promise.reject({code:1}):geoNow();
/* v38: học vị trí khách mỗi lần ship giao xong (trung bình tối đa 10 lần, bỏ điểm lệch > 400 m khi đã chắc) */
async function learnLoc(o,c){try{if(!c||!o||!o.cust||!R.db||!(c.accuracy<=150))return;const id=locKey(o.cust,o.address);const old=(R.custLoc||[]).find(x=>x._id===id);
  const p=[c.latitude,c.longitude];let n=0,lat=p[0],lng=p[1];
  if(old){const dk=kmDist([old.lat,old.lng],p);const on=Math.min(old.n||1,9);if(dk>0.4){if(on>=3)return}else{n=on;lat=(old.lat*n+p[0])/(n+1);lng=(old.lng*n+p[1])/(n+1)}}
  await R.db.doc('custLoc/'+id).set({cust:o.cust,custName:o.custName||'',address:o.address||'',lat:+lat.toFixed(6),lng:+lng.toFixed(6),n:n+1,acc:Math.round(c.accuracy),at:Date.now(),by:R.uid})}catch(e){}}
const SLIP_STOP=new Set(['cua','hang','sieu','thi','cong','ty','tnhh','co','phan','tp','so','ngo','ngach','duong','pho','phuong','quan','huyen','toa','kdt','khu','do','chung','cu','va','ha','noi','viet','nam','sdt','dt']);
const slipToks=t=>noAcc(t).split(/[^a-z0-9]+/).filter(w=>w.length>=2&&!SLIP_STOP.has(w));
function slipNameScore(qt,target){if(!qt.length)return 0;const T=slipToks(target);if(!T.length)return 0;let s=0;for(const w of qt){if(T.includes(w))s+=1;else if(w.length>=3&&T.some(x=>x.startsWith(w)||w.startsWith(x)&&x.length>=3))s+=0.7}return s/qt.length}
function slipCands(c,txt){const p=c?[c.latitude,c.longitude]:null;const m=new Map();const qt=txt?slipToks(txt):[];
  const add=(cust,address,name,dist,why,o)=>{const k=cust+'|'+noAcc(address||'');const x=m.get(k);if(x){if(dist!=null&&(x.dist==null||dist<x.dist))x.dist=dist;if(why&&!x.why.includes(why))x.why.push(why);if(o&&!x.o)x.o=o}else m.set(k,{cust,address:address||'',name:name||'',dist,why:why?[why]:[],o:o||null})};
  const dOf=(cust,address)=>{if(!p)return null;const L=(R.custLoc||[]).find(x=>x._id===locKey(cust,address));return L?kmDist([L.lat,L.lng],p):null};
  if(p)for(const L of R.custLoc||[]){const dk=kmDist([L.lat,L.lng],p);if(dk<=0.5)add(L.cust,L.address,L.custName,dk,'')}
  for(const o of R.orders)if((o.status==='new'||o.status==='shipping')&&(o.shipId===R.uid||(!o.shipId&&inRt(o)&&inDay(o))))add(o.cust,o.address,o.custName,dOf(o.cust,o.address),'Đơn '+o.no+' chờ giao',o);
  if(qt.length){const top=[];for(const cu of R.customers.values()){if(!cu||cu.stopped)continue;for(const loc of [cu.address,...String(cu.alt||'').split(' | ')]){if(!loc)continue;const sc=slipNameScore(qt,loc+' '+(cu.name||''));if(sc>=0.5)top.push([sc,cu,loc])}}
    top.sort((a,b)=>b[0]-a[0]);for(const [sc,cu,loc] of top.slice(0,6))add(cu.code,loc,cu.name,dOf(cu.code,loc),'Phiếu ghi “'+txt+'”')}
  const L=[...m.values()];for(const x of L){x.sc=qt.length?slipNameScore(qt,x.address+' '+x.name):0;x.rank=x.sc*2+(x.dist!=null?Math.max(0,1-x.dist/0.3):0)+(x.o?0.3:0)}
  return L.sort((a,b)=>(b.rank-a.rank)||((a.dist==null?99:a.dist)-(b.dist==null?99:b.dist))||String(a.address).localeCompare(String(b.address),'vi'))}
function setDraftCust(d,cu,addr){d.cust=cu.code;d.custName=cu.name;d.address=addr||cu.address||'';d.phone=cu.phone||'';d.lines.forEach(l=>{const dp=defaultPrice(cu.code,l.code);l.listPrice=dp.p;l.price=dp.p;l.src=dp.src;l.g=1})}
/* v38: chụp phiếu giao hàng → nhận khách theo vị trí */
const SLIP_MAP=['TP001','TP003','TP005','TP0065','TP0051','TP898','TP019','TP0035','TP014','TP069','TP087','TP088'];/* 12 dòng in sẵn trên phiếu → mã hàng */
const slipProd=i=>{const m=((R.settings||{}).slipMap||'').split(/[,;\s]+/).filter(Boolean);return findProd(m[i]||SLIP_MAP[i])};
const loadJS=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load '+src));document.head.appendChild(s)});
let _ocrP=null;const ocrLib=()=>_ocrP||(_ocrP=(window.VibaOCR?Promise.resolve():loadJS('ocr.js?v=39')).catch(e=>{_ocrP=null;throw e}));
/* v39: đọc cột "Số lượng" trên ảnh phiếu (chạy trên điện thoại, không gửi ảnh đi đâu) */
async function slipRead(d,ph){const S=d.slipRead={st:'run',rows:[]};render();
  try{await ocrLib();const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=ph});
    const W=1000,H=Math.round(img.naturalHeight*W/img.naturalWidth),cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d');cx.drawImage(img,0,0,W,H);
    const px=cx.getImageData(0,0,W,H).data,g=new Float32Array(W*H);for(let i=0;i<W*H;i++)g[i]=0.299*px[4*i]+0.587*px[4*i+1]+0.114*px[4*i+2];
    await new Promise(r=>setTimeout(r,30));const r=VibaOCR.readSlip(g,W,H,null,{cols:[4]});if(d.slipRead!==S)return;
    if(!r.ok){S.st='fail';S.msg=r.msg;render();return}
    const crop=b=>{const x0=Math.max(0,b.cx0-2),x1=Math.min(W,b.cx1+2),y0=Math.max(0,Math.min(b.y0,b.cy0)-2),y1=Math.min(H,Math.max(b.y1,b.cy1)+2),cw=x1-x0,ch=y1-y0;
      const c=document.createElement('canvas');c.width=cw;c.height=ch;const id=c.getContext('2d').createImageData(cw,ch);for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const v=r.gray[(y+y0)*W+x+x0],k=4*(y*cw+x);id.data[k]=id.data[k+1]=id.data[k+2]=v;id.data[k+3]=255}
      c.getContext('2d').putImageData(id,0,0);return c.toDataURL('image/jpeg',.7)};
    S.rows=r.rows.filter(x=>x.qty>0).map(x=>{const p=slipProd(x.row);return {row:x.row,form:x.name,code:p?p.code:'',name:p?p.name:x.name,unit:p?p.unit:'',read:x.text,qty:x.qty,conf:Math.min(x.conf,0.5),img:crop(x.box),on:false}});
    S.st='done';render()}catch(e){if(d.slipRead===S){S.st='fail';S.msg='Không đọc được ảnh ('+(e.message||e)+')';render()}}}
const SLIP_FORM=['chuoi tieu','chuoi tay','chuoi ngu','dua qua tuoi','dua hop','mia','nem bui','san','sau','khoai so','khoai mon','doc mung'];
function slipProdByName(name){const n=noAcc(name||'');if(!n)return null;for(let i=0;i<SLIP_FORM.length;i++)if(n.startsWith(SLIP_FORM[i]))return slipProd(i);
  const qt=slipToks(name);let best=null;for(const p of R.products.values()){if(!/^(HH|TP)/i.test(p.code)||PROD_HIDE.test(' '+noAcc(p.name)+' '))continue;const sc=slipNameScore(qt,p.name);if(sc>=0.6&&(!best||sc>best[0]))best=[sc,p]}return best&&best[1]}
async function slipAI(d,ph){if(!window.vibaAI)return null;const S=d.slipRead={st:'run',rows:[],ai:1};
  try{const prods=sortedProducts().filter(p=>/^(HH|TP)/i.test(p.code)&&!PROD_HIDE.test(' '+noAcc(p.name)+' ')).slice(0,90).map(p=>p.code+'|'+p.name).join('\n');
    const cs=[...new Set(R.orders.filter(o=>(o.status==='new'||o.status==='shipping')&&(o.shipId===R.uid||!o.shipId)).map(o=>o.address||o.custName))].slice(0,30).join('; ');
    const r=await Promise.race([window.vibaAI.slipRead({image:ph,products:prods,customers:cs}),new Promise(res=>setTimeout(()=>res({skip:'timeout'}),35000))]);
    if(d.slipRead!==S)return null;
    if(!r||!r.ok||!r.data){const why={nokey:'chưa cài mã AI',budget:'đã dùng hết hạn mức chi phí tháng',daily:'đã dùng hết hạn mức hôm nay',quota:'Google báo hết lượt',timeout:'mạng chậm',error:'AI báo lỗi'}[r&&r.skip]||'AI không đọc được';slipRead(d,ph);if(d.slipRead)d.slipRead.aiSkip=why;return null}
    const a=r.data;S.rows=(a.lines||[]).filter(x=>toNum(x.qty)>0).map(x=>{let p=x.code&&findProd(String(x.code).trim());if(!p)p=slipProdByName(x.name);return {row:-1,form:x.name,code:p?p.code:'',name:p?p.name:x.name,unit:p?p.unit:(x.unit||''),read:String(x.qty),qty:toNum(x.qty),price:Math.round(toNum(x.price)),conf:p?0.9:0.4,img:null,on:!!p}});
    S.pay={paid:a.paid||'unknown',amount:Math.round(toNum(a.paidAmount)),total:Math.round(toNum(a.total))};S.cust=a.customer||'';S.unsure=a.unsure||'';S.slipNo=a.slipNo||'';S.cost=r.vnd||0;S.st='done';render();return a}
  catch(e){if(d.slipRead===S){slipRead(d,ph);if(d.slipRead)d.slipRead.aiSkip='lỗi kết nối'}return null}}
function slipAdd(d){const S=d.slipRead;if(!S)return;let n=0;const train=[];
  for(const x of S.rows){const q=r3(toNum(x.qty));train.push({row:x.row,read:x.read,qty:q,conf:x.conf,img:x.img,on:!!x.on});if(!x.on||!(q>0)||!x.code)continue;const p=findProd(x.code);if(!p)continue;
    const ex=d.lines.find(l=>l.code===p.code);if(ex)ex.qty=q;else{const dp=defaultPrice(d.cust,p.code);d.lines.push({code:p.code,name:p.name,unit:p.unit,qty:q,promo:0,swap:0,ret:0,price:dp.p,listPrice:dp.p,src:dp.src,g:1})}n++}
  /* lưu mẫu đã duyệt để cải thiện việc đọc số sau này */
  if(R.db&&train.length)R.db.doc('slipTrain/'+uidShort()).set({at:Date.now(),by:R.uid,items:train}).catch(()=>{});
  if(S.pay&&S.pay.paid==='paid'){d.paid=true;d.paidAmount=S.pay.amount||'';if(!d.payMethod)d.payMethod='cash'}else if(S.pay&&S.pay.paid==='unpaid')d.paid=false;
  S.st='added';toast(n?'Đã thêm '+n+' sản phẩm từ phiếu':'Không có dòng nào được chọn');render()}
async function slipFlow(d){const gp=geoSoft();gp.catch(()=>{});const ph=await camPhoto();if(!ph)return;d.slipPhotos=[{data:ph}];d.slipDate=today();d.date=d.slipDate;const aiP=slipAI(d,ph);render();
  openSheet('Khách của phiếu này',`<div class="stack"><img src="${ph}" style="width:100%;max-height:190px;object-fit:contain;border-radius:12px;background:#fff;border:1px solid var(--line,#e3e8ef)"><div id="slR"><div class="alert">📍 Đang lấy vị trí và đọc phiếu…</div></div></div>`,b=>{
    const box=b.querySelector('#slR');
    const show=(c,err,ai)=>{d._slipGeo=c||null;const txt=ai&&ai.customer||'';const L=slipCands(c,txt);const L0=L[0],L1=L[1];const byLoc=L0&&L0.dist!=null&&L0.dist<=0.15,byName=L0&&L0.sc>=0.75&&(!L1||L1.sc<=L0.sc-0.2);const best=byLoc||byName?L0:null;
      const nm=x=>{const cu=findCust(x.cust);return esc(x.address||(cu&&cu.name)||x.name||x.cust)};
      const ds=x=>x.dist==null?'':(x.dist<1?Math.round(x.dist*1000)+' m':x.dist.toFixed(1)+' km');
      const row=(x,i)=>`<div class="row tap" data-sl="${i}"><div class="grow"><div class="t">${nm(x)}</div><div class="s">${esc(x.cust)}${x.why.length?' · '+esc(x.why.join(' · ')):''}</div></div>${ds(x)?`<b style="white-space:nowrap">${ds(x)}</b>`:''}<span class="chev">›</span></div>`;
      const head=(txt?`<div class="tiny" style="margin-bottom:6px">🤖 Phiếu ghi: <b>${esc(txt)}</b></div>`:'')+(best?`<div class="alert g">✓ Nhận khách ${byLoc&&byName?'theo tên trên phiếu và vị trí':byLoc?'theo vị trí (cách '+ds(best)+')':'theo tên trên phiếu'}. Bấm khách để xác nhận.</div>`:!c?`<div class="alert w">Chưa lấy được vị trí${err&&err.code===1?' (điện thoại đang chặn vị trí)':''}. Chọn khách trong danh sách dưới.</div>`:L.some(x=>x.dist!=null)?'<div class="alert w">Có khách ở gần nhưng chưa chắc chắn. Chọn đúng khách.</div>':'<div class="alert w">Vị trí này chưa có khách nào được ghi nhận (app sẽ tự học sau các lần giao). Chọn khách dưới hoặc tìm khách.</div>');
      box.innerHTML=head+(L.length?`<div class="group">${L.slice(0,8).map(row).join('')}</div>`:'')+'<button class="btn block" id="slFind">🔍 Tìm khách khác</button>';
      box.querySelectorAll('[data-sl]').forEach(el=>el.onclick=()=>{const x=L[+el.dataset.sl];const cu=findCust(x.cust)||{code:x.cust,name:x.name,address:x.address};
        const pick=()=>{setDraftCust(d,cu,x.address);closeSheet();render()};
        if(x.o){box.innerHTML=`<div class="alert w">Khách này đang có đơn <b>${esc(x.o.no)}</b> chờ giao (${esc((x.o.lines||[]).map(l=>l.name+' ×'+fmt(l.qty)).join(', '))}). Nếu phiếu này là đơn đó, giao đơn đó để không tạo trùng.</div><button class="btn block pri" id="slDv">Giao đơn ${esc(x.o.no)}</button><button class="btn block" id="slNew">Không, tạo đơn phát sinh mới</button>`;
          box.querySelector('#slDv').onclick=()=>{closeSheet();d.slipPhotos=[];d.slipRead=null;d.slipDate=null;render();deliverSheet(x.o)};box.querySelector('#slNew').onclick=pick}else pick()});
      box.querySelector('#slFind').onclick=()=>{closeSheet();pickCustomer((cu,addr)=>{if(!cu)return;setDraftCust(d,cu,addr);render()})}};
    Promise.all([gp.then(c=>[c,null],e=>[null,e]),aiP]).then(([[c,e],ai])=>show(c,e,ai))})}
async function doAttend(){const place=R.ui.attPlace||'cty';
  if(!navigator.geolocation){permSheet('geo',doAttend,true);return}
  if(R._geoSt&&R._geoSt.state==='denied'){permSheet('geo',doAttend);return}/* đã chặn vị trí: hướng dẫn bật trước khi chụp */
  const gp=geoNow();gp.catch(()=>{});/* lấy vị trí song song, không chặn camera */
  const d=await camPhoto();if(!d)return;R._attPend={d,place,gp};render();return attFinish()}
async function attFinish(){const P=R._attPend;if(!P)return;let c;toast('Đang lấy vị trí…');
  try{c=await (P.gp||geoNow())}catch(e){P.gp=null;render();if(e&&e.code===1)permSheet('geo',attFinish);else if(e&&e.code===3)permSheet('geo',attFinish,true);else permSheet('geo',attFinish,true);return}
  P.gp=null;const d=P.d,place=P.place;const day=today(),id=R.uid+'_'+day,pid='att-'+id+'-'+uidShort();
  try{toast('Đang gửi chấm công…');await R.db.doc('photos/'+pid).set({data:d,kind:'attend',by:R.uid,at:Date.now()});R.photoCache.set(pid,d);
    await R.db.doc('attend/'+id).set({uid:R.uid,date:day,at:Date.now(),place,lat:+c.latitude.toFixed(6),lng:+c.longitude.toFixed(6),acc:Math.round(c.accuracy||0),photo:pid,void:false});R._attPend=null;toast('✓ Đã chấm công');render()}
  catch(e){toast('Chưa gửi được chấm công ('+(e.code||'lỗi mạng')+'), thử lại.')}}
function attendBlock(uid){const day=today();const a=(R.attend||[]).find(x=>x.uid===uid&&x.date===day);const pl=R.ui.attPlace||'cty';
  return `<div class="sec" style="margin-top:0">Chấm công hôm nay</div>${inApp()?'<div class="alert w">Bạn đang mở app trong Zalo/Facebook nên camera và vị trí có thể không chạy. Bấm <b>⋯</b> (góc trên) › <b>Mở bằng trình duyệt</b> (Safari/Chrome) rồi chấm công.</div>':''}${R._attPend&&uid===R.uid?`<div class="alert b">Đã chụp ảnh, đang chờ vị trí… <button class="btn sm" id="attLoc" style="margin-left:6px">Lấy lại vị trí</button></div>`:''}<div class="card stack" style="gap:10px"><div style="font-weight:700">${wdName(day)}, ${dmy(day)}</div>
   ${a&&!a.void?`<div style="display:flex;gap:12px;align-items:center"><div class="ph" data-attph="${esc(a.photo)}" data-pid="${esc(a.photo)}" style="width:76px;height:76px;border-radius:12px;flex:none;background-size:cover;background-position:center" role="button" aria-label="Xem ảnh"></div><div><div style="font-weight:700;color:#1e9a5c">✓ Đã chấm công</div><div class="tiny muted" style="margin-top:4px">${new Date(a.at).toTimeString().slice(0,5)} · ${a.place==='tuyen'?'Trên tuyến':'Tại công ty'}<br>📍 ${a.lat}, ${a.lng} (±${a.acc} m) · <a href="https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}" target="_blank" rel="noopener" style="color:var(--accent)">Bản đồ</a></div></div></div>
    <button class="btn sm" id="attRe" style="align-self:flex-start">Chụp lại</button>`:
   `${a&&a.void?'<div class="alert w">Ảnh chấm công hôm nay đã bị quản lý bỏ công'+(a.voidNote?': '+esc(a.voidNote):'')+'. Chụp lại nếu cần.</div>':''}<div class="seg"><button data-attpl="cty" class="${pl==='cty'?'on':''}">🏢 Tại công ty</button><button data-attpl="tuyen" class="${pl==='tuyen'?'on':''}">🛣️ Trên tuyến</button></div>
    <button class="btn block pri" id="attGo" style="font-size:17px">📷 Chụp ảnh chấm công</button>
    <div class="tiny muted">Bắt buộc bật vị trí (GPS). App mở camera để chụp ảnh mới, tự ghi giờ chụp và vị trí.</div>`}</div>`}
function bindAttend(){$$('[data-attpl]').forEach(b=>b.onclick=()=>{R.ui.attPlace=b.dataset.attpl;render()});const g=$('#attGo');if(g)g.onclick=doAttend;const r=$('#attRe');if(r)r.onclick=doAttend;const lc=$('#attLoc');if(lc)lc.onclick=attFinish;if(!R._geoSt&&navigator.permissions&&navigator.permissions.query)navigator.permissions.query({name:'geolocation'}).then(st=>{R._geoSt=st}).catch(()=>{});
  $$('[data-attph]').forEach(el=>el.onclick=async()=>{const d=await loadPhoto(el.dataset.attph);if(d)showImg(d)});hydratePhotos(document)}
function saleOrdersDone(ym){const [f,t]=ymRange(ym);const pf=isoOf(new Date(+f.slice(0,4),+f.slice(5,7)-1,-30));const all=ordersIn(pf<windowStart()&&f>=windowStart()?windowStart():pf,t);if(!all)return null;
  return all.filter(o=>o.status==='done'&&(d=>d>=f&&d<=t)(o.doneAt?isoOf(new Date(o.doneAt)):o.date))}
function salePay(uid,ym,L){const S=ST();const A=attOf(uid,ym);const cong=A.filter(a=>!a.void).length;const std=toNum(S.saleStd)||26;
  let rev=0;for(const o of L){if(o.saleId!==uid)continue;const ck=custKind(o);for(const l of o.lines||[]){if(isFee(l))continue;const a=lineAmt(l);if(!a)continue;const v=l.g?vatOf(l.name,ck.co):0;rev+=typeof v==='number'?a/(1+v):a}}
  const base=Math.round(toNum(S.saleBase)*cong/std),allow=Math.round(toNum(S.saleAllow)*cong/std),comm=Math.round(rev*toNum(S.saleComm)/100);
  return{uid,ym,cong,std,A,rev:Math.round(rev),base,allow,comm,total:base+allow+comm}}
function salePayBlock(uid){const ym=payYm();const L=saleOrdersDone(ym);const head=`<div class="sec">Lương tháng ${ym.slice(5)}/${ym.slice(0,4)}</div>${payMonthBar()}`;
  if(!L)return head+'<div class="empty">Đang tải…</div>';const s=salePay(uid,ym,L),S=ST();const [f,,n]=ymRange(ym);const pc=x=>String(x).replace('.',',');
  const row=(a,b,x)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)"><div><div style="font-weight:600">${a}</div>${x?`<div class="tiny muted" style="margin-top:2px">${x}</div>`:''}</div><div style="font-weight:700;white-space:nowrap">${b}</div></div>`;
  const by=new Map(s.A.map(a=>[a.date,a]));const w0=(new Date(+f.slice(0,4),+f.slice(5,7)-1,1).getDay()+6)%7;let cal='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;margin-top:8px">'+['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class="muted">${d}</div>`).join('')+'<div></div>'.repeat(w0);
  for(let d=1;d<=n;d++){const a=by.get(f.slice(0,8)+pad(d));cal+=`<div style="padding:6px 0;border-radius:8px;${a?(a.void?'background:rgba(230,150,30,.18);color:#b36b00;font-weight:700;text-decoration:line-through':'background:rgba(30,150,90,.15);color:#1e9a5c'):'opacity:.45'}">${d}</div>`}cal+='</div>';
  const voids=s.A.filter(a=>a.void);
  return head+`<div class="card"><div class="totalbar"><span class="muted">Tổng thu nhập tháng</span><span class="money">${vnd(s.total)}</span></div></div>
   <div class="card"><div style="font-weight:700">📷 Ngày công: ${s.cong} công (chuẩn ${s.std})</div><div class="tiny muted">Xanh = có ảnh chấm công · Cam gạch = quản lý bỏ công · Mờ = không chấm</div>${cal}</div>
   <div class="card">${row('Lương cứng',vnd(s.base),`${fmt(toNum(S.saleBase))} × ${s.cong} / ${s.std} công`)}${row('Phụ cấp',vnd(s.allow),`${fmt(toNum(S.saleAllow))} × ${s.cong} / ${s.std} công`)}
    ${row('Hoa hồng',vnd(s.comm),`${pc(S.saleComm)}% × doanh số ${vnd(s.rev)}<br>(đơn đã giao trong tháng, giá sau khuyến mại, trước thuế, trừ hàng khách trả)`)}
    <div style="display:flex;justify-content:space-between;padding:12px 0 2px;border-top:2px solid var(--line)"><b>Tổng</b><b>${vnd(s.total)}</b></div></div>
   ${voids.length?`<div class="tiny muted">${voids.map(a=>`Ngày ${dmy(a.date).slice(0,5)}: quản lý bỏ công${a.voidNote?' – “'+esc(a.voidNote)+'”':''}.`).join('<br>')}</div>`:''}`}
function saleIds(){const ids=new Set([...R.staff.entries()].filter(([u,x])=>x&&x.role==='sale'&&x.active!==false).map(([u])=>u));(R.attend||[]).forEach(a=>ids.add(a.uid));return [...ids]}
function attAdmin(){const ym=payYm();const sales=saleIds();if(!sales.length)return '';const u=R.ui.attSale&&sales.includes(R.ui.attSale)?R.ui.attSale:sales[0];
  const A=attOf(u,ym).sort((a,b)=>a.date<b.date?-1:1);const co=coLoc();const sel=A.find(a=>a.id===R.ui.attSel);
  return `<div class="sec">Chấm công sale</div><div style="display:flex;gap:8px"><select id="attSaleSel" style="flex:1">${sales.map(x=>`<option value="${esc(x)}" ${x===u?'selected':''}>${esc(staffName(x))}</option>`).join('')}</select></div>
   <div class="tiny muted">${A.filter(a=>!a.void).length} công tháng ${ym.slice(5)}/${ym.slice(0,4)} · bấm ảnh để xem chi tiết, bỏ công</div>
   ${A.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${A.map(a=>`<div style="text-align:center" data-attsel="${esc(a.id)}" role="button"><div class="ph" data-pid="${esc(a.photo)}" style="width:100%;aspect-ratio:1;border-radius:10px;background-size:cover;background-position:center;${a.void?'opacity:.35':''}"></div><div class="tiny" style="font-weight:600;margin-top:3px;${a.void?'text-decoration:line-through':''}">${dmy(a.date).slice(0,5)}</div><div class="tiny muted">${new Date(a.at).toTimeString().slice(0,5)} · ${a.place==='tuyen'?'Tuyến':'CT'}</div></div>`).join('')}</div>`:'<div class="empty">Chưa có ảnh chấm công trong tháng.</div>'}
   ${sel?`<div class="card"><div style="display:flex;gap:12px"><div class="ph" data-pid="${esc(sel.photo)}" data-attph="${esc(sel.photo)}" role="button" style="width:110px;height:110px;flex:none;border-radius:12px;background-size:cover;background-position:center"></div><div class="stack" style="gap:6px"><div style="font-weight:700">${dmy(sel.date)} · ${new Date(sel.at).toTimeString().slice(0,5)}</div><div class="tiny muted">Khai: ${sel.place==='tuyen'?'Trên tuyến':'Tại công ty'}<br>📍 ${sel.lat}, ${sel.lng} (±${sel.acc} m)${co?' · cách công ty '+fmt(Math.round(kmDist(co,[sel.lat,sel.lng])*10)/10)+' km':''} · <a href="https://www.google.com/maps/search/?api=1&query=${sel.lat},${sel.lng}" target="_blank" rel="noopener" style="color:var(--accent)">Bản đồ</a>${sel.void?'<br><b style="color:#b36b00">Đã bỏ công'+(sel.voidNote?': '+esc(sel.voidNote):'')+'</b>':''}</div>
    ${sel.void?'<button class="btn sm" id="attUnvoid">Tính lại công ngày này</button>':'<input id="attNote" placeholder="Lý do bỏ công (nếu có)"><button class="btn sm danger" id="attVoid">Bỏ công ngày này</button>'}</div></div></div>`:''}`}
function salePayAdmin(){const ym=payYm();const L=saleOrdersDone(ym);const head=`<div class="sec">Lương sale tháng ${ym.slice(5)}/${ym.slice(0,4)}</div>`;if(!L)return head+'<div class="empty">Đang tải…</div>';
  const P=saleIds().map(u=>salePay(u,ym,L)).sort((a,b)=>b.total-a.total);if(!P.length)return head+'<div class="empty">Chưa có tài khoản sale.</div>';
  return head+`<div class="tw"><table><thead><tr><th>Sale</th><th class="n">Công</th><th class="n">Lương cứng</th><th class="n">Phụ cấp</th><th class="n">Doanh số</th><th class="n">Hoa hồng</th><th class="n">Tổng</th></tr></thead><tbody>${P.map(p=>`<tr><td>${esc(staffName(p.uid))}</td><td class="n">${p.cong}</td><td class="n">${fmt0(p.base)}</td><td class="n">${fmt0(p.allow)}</td><td class="n">${fmt0(p.rev)}</td><td class="n">${fmt0(p.comm)}</td><td class="n"><b>${fmt0(p.total)}</b></td></tr>`).join('')}</tbody></table></div>
   <button class="btn" id="salePayXls">Xuất Excel bảng lương sale</button>`}
function bindSaleAdmin(){const s=$('#attSaleSel');if(s)s.onchange=()=>{R.ui.attSale=s.value;R.ui.attSel=null;render()};
  $$('[data-attsel]').forEach(el=>el.onclick=()=>{R.ui.attSel=R.ui.attSel===el.dataset.attsel?null:el.dataset.attsel;render()});
  $$('[data-attph]').forEach(el=>el.onclick=async e=>{e.stopPropagation();const d=await loadPhoto(el.dataset.attph);if(d)showImg(d)});
  const v=$('#attVoid');if(v)v.onclick=async()=>{const n=($('#attNote')||{}).value||'';try{await R.db.doc('attend/'+R.ui.attSel).update({void:true,voidBy:R.uid,voidAt:Date.now(),voidNote:n.trim()});toast('Đã bỏ công')}catch(e){toast('Không lưu được')}};
  const uv=$('#attUnvoid');if(uv)uv.onclick=async()=>{try{await R.db.doc('attend/'+R.ui.attSel).update({void:false,voidNote:''});toast('Đã tính lại công')}catch(e){toast('Không lưu được')}};
  const x=$('#salePayXls');if(x)x.onclick=()=>{const ym=payYm();const L=saleOrdersDone(ym)||[];const S=ST();const P=saleIds().map(u=>salePay(u,ym,L));
    const rows=[['Sale','Công','Công chuẩn','Lương cứng','Phụ cấp','Doanh số (sau KM, trước thuế)','Hoa hồng','Tổng']];P.forEach(p=>rows.push([staffName(p.uid),p.cong,p.std,p.base,p.allow,p.rev,p.comm,p.total]));
    rows.push([],['Thông số: lương cứng '+S.saleBase+'đ, phụ cấp '+S.saleAllow+'đ / '+S.saleStd+' công; hoa hồng '+S.saleComm+'% doanh số đơn đã giao (sau KM, trước thuế, trừ hàng trả)']);
    const det=[['Sale','Ngày','Giờ','Nơi','Vĩ độ','Kinh độ','Sai số (m)','Bỏ công','Lý do']];saleIds().forEach(u=>attOf(u,ym).sort((a,b)=>a.date<b.date?-1:1).forEach(a=>det.push([staffName(u),a.date,new Date(a.at).toTimeString().slice(0,5),a.place==='tuyen'?'Trên tuyến':'Tại công ty',a.lat,a.lng,a.acc,a.void?'Có':'',a.voidNote||''])));
    xlsxFile('Luong_sale_'+ym+'.xlsx',[{name:'Luong sale',rows,cols:[24,8,10,14,14,18,14,14]},{name:'Cham cong',rows:det,cols:[24,12,8,12,11,11,10,8,30]}])}}
function shipStats(L){const s=stats(L);const S=ST();s.income=s.normal*toNum(S.shipFee)+s.outside*toNum(S.shipFeeOut);s.incomeOut=s.outside*toNum(S.shipFeeOut);s.incomeMonth=s.normal*toNum(S.shipFee);return s}

/* ================= v32: BÁO CÁO DẠNG THẺ (bấm để xem chi tiết) ================= */
const accOpen=k=>!!(R.ui.acc&&R.ui.acc[k]);
function accCard(k,lab,val,sub,color,body){const o=accOpen(k);return `<div class="card" style="padding:0;overflow:hidden"><div data-acc="${k}" role="button" aria-expanded="${o}" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer"><div style="flex:1;min-width:0"><div class="muted" style="font-size:13px;font-weight:600">${lab}</div><div style="font-size:24px;font-weight:800;color:${color||'var(--fg)'};overflow-wrap:anywhere">${val}</div>${sub?`<div class="tiny muted">${sub}</div>`:''}</div><div style="font-size:22px;color:var(--muted);transition:transform .15s;transform:rotate(${o?90:0}deg)">›</div></div>${o?`<div class="stack" style="border-top:1px solid var(--line);padding:12px 16px;gap:10px">${typeof body==='function'?body():body}</div>`:''}</div>`}
function bindAcc(){$$('[data-acc]').forEach(b=>b.onclick=()=>{R.ui.acc=R.ui.acc||{};R.ui.acc[b.dataset.acc]=!R.ui.acc[b.dataset.acc];render()})}
const C_G='#1e9a5c',C_B='var(--accent)',C_O='#c27a00',C_R='#d64545';
function owedOf(o){if(o.status==='cancel')return 0;const t=orderTotal(o);const pa=o.paid?Math.min(t,toNum(o.paidAmount)||t):0;return Math.max(0,t-pa)}
function debtBlock(list){const by=new Map();list.forEach(o=>{const d=owedOf(o);if(!d)return;const k=o.cust||o.custName;if(!by.has(k))by.set(k,{name:o.custName||k,addr:o.address||'',L:[]});by.get(k).L.push(o)});
  const G=[...by.values()].map(g=>{g.L.sort((a,b)=>(a.date+a.no).localeCompare(b.date+b.no));g.sum=g.L.reduce((s,o)=>s+owedOf(o),0);g.first=g.L[0].date;return g}).sort((a,b)=>a.first.localeCompare(b.first)||b.sum-a.sum);
  if(!G.length)return '<div class="empty">Không có đơn nợ.</div>';
  return G.map(g=>`<div><div style="display:flex;justify-content:space-between;gap:8px;font-weight:700"><span>${esc(g.name)}</span><span style="color:${C_R};white-space:nowrap">${vnd(g.sum)}</span></div><div class="tiny muted">${g.L.length} đơn nợ${g.addr&&g.addr!==g.name?' · '+esc(g.addr):''}</div>
   <div class="tw"><table><thead><tr><th>Ngày</th><th>Số đơn</th><th class="n">Còn nợ</th></tr></thead><tbody>${g.L.map(o=>`<tr data-oid="${esc(o.id)}" style="cursor:pointer"><td>${dmy(o.date).slice(0,5)}</td><td style="color:var(--accent)">${esc(o.no)}</td><td class="n">${fmt(owedOf(o))}</td></tr>`).join('')}</tbody></table></div></div>`).join('')+'<div class="tiny muted">Khách xếp theo đơn nợ cũ nhất trước; trong mỗi khách, đơn từ cũ đến mới. Bấm dòng để mở đơn. Tính trên đơn trong 3 tháng gần nhất, không gồm đơn đã hủy.</div>'}
function prodAgg(list,doneOnly){const m=new Map();list.filter(o=>o.status!=='cancel'&&(!doneOnly||o.status==='done')).forEach(o=>(o.lines||[]).forEach(l=>{const r=m.get(l.code)||{name:l.name,unit:l.unit,qty:0,promo:0,ret:0,swap:0,amt:0};r.qty+=toNum(l.qty);r.promo+=giftQ(l);r.ret+=toNum(l.ret);r.swap+=toNum(l.swap);r.amt+=lineAmt(l);m.set(l.code,r)}));return m}
function retTable(m){const rows=[...m.values()].filter(r=>r.ret||r.swap).sort((a,b)=>(b.ret+b.swap)/(b.qty||1)-(a.ret+a.swap)/(a.qty||1));
  return rows.length?`<div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">SL</th><th class="n">Đổi</th><th class="n">Trả</th><th class="n">Tỷ lệ</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}<div class="tiny muted">${esc(r.unit||'')}</div></td><td class="n">${fmt(r3(r.qty))}</td><td class="n">${fmt0(r3(r.swap))}</td><td class="n">${fmt0(r3(r.ret))}</td><td class="n">${pct(r.ret+r.swap,r.qty)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Không có hàng đổi trả trong kỳ.</div>'}
function goTable(m){const rows=[...m.values()].sort((a,b)=>(b.qty+b.promo+b.swap)-(a.qty+a.promo+a.swap));
  return rows.length?`<div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">Bán</th><th class="n">Tặng</th><th class="n">Đổi</th><th class="n">Trả</th><th class="n">Tổng xuất</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}<div class="tiny muted">${esc(r.unit||'')}</div></td><td class="n">${fmt(r3(r.qty))}</td><td class="n">${fmt0(r3(r.promo))}</td><td class="n">${fmt0(r3(r.swap))}</td><td class="n">${fmt0(r3(r.ret))}</td><td class="n"><b>${fmt(r3(r.qty+r.promo+r.swap))}</b></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có hàng giao trong kỳ.</div>'}
function bindOids(list){$$('[data-oid]').forEach(c=>c.onclick=e=>{e.stopPropagation();const o=list.find(x=>x.id===c.dataset.oid)||R.orders.find(x=>x.id===c.dataset.oid);if(o)orderDetail(o)})}
function attCal(uid){const ym=today().slice(0,7);const [f,,n]=ymRange(ym);const A=attOf(uid,ym);const by=new Map(A.map(a=>[a.date,a]));const w0=(new Date(+f.slice(0,4),+f.slice(5,7)-1,1).getDay()+6)%7;
  let cal='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;margin-top:8px">'+['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class="muted">${d}</div>`).join('')+'<div></div>'.repeat(w0);
  for(let d=1;d<=n;d++){const a=by.get(f.slice(0,8)+pad(d));cal+=`<div style="padding:6px 0;border-radius:8px;${a?(a.void?'background:rgba(230,150,30,.18);color:#b36b00;font-weight:700;text-decoration:line-through':'background:rgba(30,150,90,.15);color:#1e9a5c'):'opacity:.45'}">${d}</div>`}
  return `<div class="card"><div style="font-weight:700">📅 Tháng ${ym.slice(5)}/${ym.slice(0,4)}: ${A.filter(a=>!a.void).length} công</div><div class="tiny muted">Xanh = có ảnh chấm công · Cam gạch = quản lý bỏ công</div>${cal}</div>`}
function viewAttend(v){v.innerHTML=`<h1 class="big">Chấm công</h1><div class="stack">${attendBlock(R.uid)}${attCal(R.uid)}</div>`;bindAttend()}
function viewShipReport(v,uid){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Báo cáo</h1>'+periodBar()+'<div class="empty">Đang tải…</div>';bindPeriod();return}
  const L=all.filter(o=>o.shipId===uid&&o.status==='done');const s=shipStats(L);
  const ym=payYm(),PL=payOrders(ym),pay=PL?shipPay(uid,ym,PL):null;const m=prodAgg(L,true);
  const cash=L.filter(o=>o.paid&&o.paidBy==='ship'&&o.payMethod==='cash').sort((a,b)=>(a.doneAt||0)-(b.doneAt||0));const cashSum=cash.reduce((x,o)=>x+Math.min(orderTotal(o),toNum(o.paidAmount)||orderTotal(o)),0);
  const gq=[...m.values()].reduce((a,r)=>({q:a.q+r.qty,g:a.g+r.promo,w:a.w+r.swap}),{q:0,g:0,w:0});
  v.innerHTML=`<h1 class="big">Báo cáo</h1><div class="stack">${periodBar()}
   ${accCard('si','Tổng thu nhập tháng '+ym.slice(5)+'/'+ym.slice(0,4),pay?vnd(pay.total):'…',pay&&pay.upto<pay.n?'tạm tính · bấm để xem chi tiết':'bấm để xem chi tiết',C_G,()=>payBlock(uid))}
   ${accCard('sq','Tổng số lượng giao',fmt(r3(gq.q+gq.g+gq.w)),`bán ${fmt(r3(gq.q))} · tặng ${fmt(r3(gq.g))} · đổi ${fmt(r3(gq.w))}`,C_B,()=>goTable(m)+dayBlock(uid))}
   ${accCard('so','Tổng đơn giao',fmt(s.done),s.outside?s.outside+' đơn ship ngoài':'',null,()=>`<div class="list">${L.slice().sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).map(o=>orderCard(o)).join('')||'<div class="empty">Chưa giao đơn nào trong kỳ.</div>'}</div>`)}
   ${accCard('sc','Tổng tiền mặt đã thu',vnd(cashSum),cash.length+' đơn thu tiền mặt',C_G,()=>cash.length?`<div class="tw"><table><thead><tr><th>Ngày</th><th>Đơn · khách</th><th class="n">Tiền</th></tr></thead><tbody>${cash.map(o=>`<tr data-oid="${esc(o.id)}" style="cursor:pointer"><td>${dmy(isoOf(new Date(o.doneAt||Date.parse(o.date)))).slice(0,5)}</td><td>${esc(o.no)} · ${esc(o.custName)}</td><td class="n">${fmt(Math.min(orderTotal(o),toNum(o.paidAmount)||orderTotal(o)))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa thu tiền mặt đơn nào trong kỳ.</div>')}
   ${accCard('sr','Tỷ lệ đổi trả',retRate(s),`đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}`,C_O,()=>retTable(m))}
   </div>`;bindPeriod();bindAcc();bindPayMonth();bindDay(uid);bindOids(L)}

/* ================= KHO ================= */
function misaOn(p){return !!(p&&p.misaAt&&p.misaQty!=null&&p.misaQty!=='')}
function misaAfter(at,excludeId){const m=new Map();for(const v of R.vouchers){if(v.id===excludeId||!(toNum(v.createdAt)>at))continue;const s=v.type==='N'?1:-1;for(const l of v.lines||[]){const r=m.get(l.code)||{n:0,x:0};if(s>0)r.n=r3(r.n+toNum(l.qty));else r.x=r3(r.x+toNum(l.qty));m.set(l.code,r)}}return m}
function misaLast(){let t=0;for(const p of R.products.values())if(misaOn(p))t=Math.max(t,toNum(p.misaAt));return t}
function stockMap(asOf,excludeId){const m=new Map();for(const p of R.products.values())m.set(p.code,toNum(p.openingQty));
  for(const v of R.vouchers){if(v.id===excludeId||(asOf&&v.date>asOf))continue;const s=v.type==='N'?1:-1;for(const l of v.lines||[])m.set(l.code,r3((m.get(l.code)||0)+s*toNum(l.qty)))}
  if(!asOf||asOf>=today()){const cache=new Map();for(const p of R.products.values()){if(!misaOn(p))continue;const at=toNum(p.misaAt);if(!cache.has(at))cache.set(at,misaAfter(at,excludeId));const a=cache.get(at).get(p.code)||{n:0,x:0};m.set(p.code,r3(toNum(p.misaQty)+a.n-a.x))}}
  return m}
function nxt(from,to){const rows=new Map();
  for(const p of R.products.values())rows.set(p.code,{code:p.code,name:p.name,unit:p.unit,group:p.group||'',min:toNum(p.minQty),dau:toNum(p.openingQty),n:0,x:0,known:true});
  for(const v of R.vouchers)for(const l of v.lines||[]){let r=rows.get(l.code);if(!r){r={code:l.code,name:l.name||'(không có trong danh mục)',unit:l.unit||'',group:'',min:0,dau:0,n:0,x:0,known:false};rows.set(l.code,r)}
    const q=toNum(l.qty),s=v.type==='N'?1:-1;if(v.date<from)r.dau+=s*q;else if(v.date<=to){if(s>0)r.n+=q;else r.x+=q}}
  for(const r of rows.values()){r.dau=r3(r.dau);r.n=r3(r.n);r.x=r3(r.x);r.cuoi=r3(r.dau+r.n-r.x)}
  return [...rows.values()].sort((a,b)=>a.code.localeCompare(b.code,'vi'))}
function stStatus(r){if(!r.known)return['r','Mã lạ'];if(r.cuoi<0)return['r','Tồn âm'];if(r.min>0&&r.cuoi<r.min)return['w','Sắp hết'];if(r.cuoi===0)return['','Hết hàng'];return['','']}
const V_REASON={N:['Nhập hàng NCC','Nhập hàng trả lại'],X:['Xuất bán','Xuất huỷ']};
function shipNames(){const S=new Set();preList().forEach(x=>{if(x&&x.role==='ship'&&x.active!==false&&x.name)S.add(String(x.name).trim())});for(const [i,st] of R.staff.entries())if(st.role==='ship'&&st.active!==false)S.add(staffName(i));return [...S].filter(Boolean)}
function newVoucher(type){type=type||'N';return {id:null,type,date:today(),no:'',person:'',partner:'',partnerCode:'',dept:'',reason:V_REASON[type][0],refDoc:'',refCount:'',warehouse:ST().whName,lines:[],orderIds:[],kind:'',allowNeg:false}}
function viewKhoNew(v){if(!R.vdraft)R.vdraft=newVoucher('N');const d=R.vdraft,N=d.type==='N';const lk=locked(d.date);const bal=stockMap(d.date,d.id);
  v.innerHTML=`<h1 class="big">${d.id?'Sửa phiếu '+esc(d.no):'Lập phiếu kho'}</h1><div class="stack">
   <div class="seg"><button data-vt="N" class="${N?'on':''}" ${d.id?'disabled':''}>Phiếu nhập</button><button data-vt="X" class="${!N?'on':''}" ${d.id?'disabled':''}>Phiếu xuất</button></div>
   ${d.orderIds.length?`<div class="alert b">${N?'Nhập hàng đổi trả':'Xuất kho'} theo ${d.orderIds.length} đơn: ${esc(d.orderIds.join(', '))}</div>`:''}
   ${lk?`<div class="alert r">Kỳ đến ${dmy(ST().lockDate)} đã khóa sổ.</div>`:''}
   <button class="btn block" id="vVoice" style="font-size:16px">🎤 Đọc phiếu bằng giọng nói</button>
   <div class="card stack" style="gap:12px">
    <div><div class="tiny muted" style="font-weight:700;margin-bottom:6px">${N?'Lý do nhập':'Lý do xuất'}</div><div class="seg">${V_REASON[d.type].map(t=>`<button data-vr="${esc(t)}" class="${d.reason===t?'on':''}">${t}</button>`).join('')}</div>${d.reason&&!V_REASON[d.type].includes(d.reason)?`<div class="tiny muted" style="margin-top:4px">Lý do cũ: ${esc(d.reason)}</div>`:''}</div>
    <label class="f">${N?'Người giao hàng':'Nhân viên giao hàng / người nhận'}<input id="vd_person" list="dlShip" value="${esc(d.person)}" placeholder="Chọn hoặc gõ tên" autocomplete="off"></label>
    ${(d.reason==='Xuất bán'||d.reason==='Nhập hàng trả lại')&&shipNames().length?`<div class="hrow" style="gap:6px;flex-wrap:wrap;margin-top:-4px">${shipNames().map(n=>`<button class="chip ${d.person===n?'b':''}" data-vp="${esc(n)}" style="font-size:13px;padding:6px 12px;border:0;cursor:pointer">${esc(n.split(/\s+/).slice(-2).join(' '))}</button>`).join('')}</div>`:''}
    <label class="f">${N?(d.reason==='Nhập hàng trả lại'?'Khách trả hàng':'Nhà cung cấp'):(d.reason==='Xuất huỷ'?'Ghi chú huỷ':'Khách hàng / bộ phận')}<input id="vd_partner" value="${esc(d.partner)}" placeholder="${N?(d.reason==='Nhập hàng trả lại'?'Tên khách':'Tên nhà cung cấp'):(d.reason==='Xuất huỷ'?'VD: hàng hỏng, hết hạn':'Tên khách / bộ phận')}"></label>
   </div>
   <div class="sec" style="margin-bottom:0">Hàng hóa</div>
   <div class="list">${d.lines.map((l,i)=>{const t=bal.get(l.code)||0;const over=!N&&toNum(l.qty)>t;return `<div class="line"><div class="top"><div class="nm">${esc(l.name)}<div class="tiny muted" style="font-weight:500">${esc(l.code)} · ${esc(l.unit)} · tồn <span class="${over||t<0?'neg':''}">${fmt(t)}</span></div></div><button class="btn sm danger" data-vdel="${i}">Bỏ</button></div>
     <div class="grid"><label class="f">${N?'SL chứng từ':'SL yêu cầu'}<input id="vl${i}_qtyDoc" inputmode="decimal" class="num" value="${esc(l.qtyDoc)}"></label><label class="f">${N?'SL thực nhập':'SL thực xuất'} *<div class="step"><button data-vstep="${i}:-1">−</button><input id="vl${i}_qty" inputmode="decimal" value="${esc(l.qty)}"><button data-vstep="${i}:1">+</button></div></label></div></div>`}).join('')}</div>
   <button class="btn" id="vAdd">${ICON.plus.replace('<svg','<svg width="18" height="18"')} Thêm hàng</button>
   <div id="vMsg"></div>
   <button class="btn block pri" id="vSave" ${lk?'disabled':''}>Lưu phiếu</button><button class="btn block" id="vSaveP" ${lk?'disabled':''}>Lưu và tải bản in</button>
   ${d.id||d.lines.length?'<button class="btn block" id="vReset">'+(d.id?'Hủy sửa':'Làm lại')+'</button>':''}</div>`;
  $$('[data-vt]').forEach(b=>b.onclick=()=>{if(d.id)return;if(d.type!==b.dataset.vt){d.type=b.dataset.vt;d.reason=V_REASON[d.type][0]}render()});
  $$('[data-vr]').forEach(b=>b.onclick=()=>{d.reason=b.dataset.vr;render()});
  $$('[data-vp]').forEach(b=>b.onclick=()=>{d.person=b.dataset.vp;render()});
  $('#vVoice').onclick=voiceVoucher;
  [['vd_person','person'],['vd_partner','partner']].forEach(([id,k])=>{const e=$('#'+id);e.oninput=()=>d[k]=e.value;if(id==='vd_person')e.onchange=()=>{d.person=e.value;render()}});
  $$('[data-vdel]').forEach(b=>b.onclick=()=>{d.lines.splice(+b.dataset.vdel,1);render()});
  $$('[data-vstep]').forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.vstep.split(':');const l=d.lines[+i];l.qty=Math.max(0,r3(toNum(l.qty)+(+s)));render()});
  d.lines.forEach((l,i)=>['qty','qtyDoc'].forEach(k=>{const e=$(`#vl${i}_${k}`);e.oninput=()=>l[k]=e.value;e.onchange=()=>{l[k]=e.value===''?'':r3(toNum(e.value));render()}}));
  $('#vAdd').onclick=()=>pickProduct(null,p=>{if(!p)return;const ex=d.lines.find(l=>l.code===p.code);if(ex)ex.qty=r3(toNum(ex.qty)+1);else d.lines.push({code:p.code,name:p.name,unit:p.unit,qtyDoc:'',qty:1,note:''});render()});
  $('#vSave').onclick=()=>saveVoucher(false);$('#vSaveP').onclick=()=>saveVoucher(true);const rs=$('#vReset');if(rs)rs.onclick=()=>{R.vdraft=newVoucher(d.type);render()}}
function vvParse(text){let t=' '+String(text||'')+' ';const out={type:null,reason:null,person:'',lines:[],unknown:[],partner:''};const lo=t.toLowerCase(),na=noAcc(lo);
  if(/(^|\s)(nhập|nhap)(\s|$)/.test(lo))out.type='N';if(/(^|\s)(xuất|xuat)(\s|$)/.test(lo))out.type='X';
  if(/(^|\s)(hủy|huỷ)(\s|$)/.test(lo)){out.type='X';out.reason='Xuất huỷ'}
  else if(/trả lại|trả về|hàng trả|khách trả|tra lai/.test(lo)){out.type=out.type||'N';out.reason='Nhập hàng trả lại'}
  else if(/nhà cung cấp|ncc|nha cung cap/.test(lo)){out.type='N';out.reason='Nhập hàng NCC'}
  else if(/(^|\s)(bán|ban)(\s|$)/.test(lo)){out.type='X';out.reason='Xuất bán'}
  if(out.type&&!out.reason)out.reason=V_REASON[out.type][0];
  /* người nhận / người giao: khớp tên ship (2 chữ cuối, rồi tên) */
  const words=na.split(/[^a-z0-9]+/).filter(Boolean);const huyIdx=new Set();{let k=0;for(const w0 of lo.split(/\s+/)){const a0=noAcc(w0).replace(/[^a-z0-9]/g,'');if(!a0)continue;for(const q of noAcc(w0).split(/[^a-z0-9]+/).filter(Boolean)){if(/^(hủy|huỷ)$/.test(w0.normalize('NFC').replace(/[^\p{L}]/gu,'')))huyIdx.add(k);k++}}}let best=null;
  for(const n of shipNames()){const w=noAcc(n.toLowerCase()).split(/\s+/).filter(Boolean);for(const k of [3,2,1]){if(w.length<k)continue;const tail=w.slice(-k);for(let i=0;i+k<=words.length;i++)if(tail.every((x,j)=>words[i+j]===x&&!huyIdx.has(i+j))){if(!best||k>best.k)best={n,k,i};break}}}
  let rest=lo;if(best){out.person=best.n;const ws=lo.split(/\s+/);const idx=[];let c=0;for(let i=0;i<ws.length;i++){const a=noAcc(ws[i]).replace(/[^a-z0-9]/g,'');if(a)idx.push(i)}
    const s0=idx[best.i],s1=idx[best.i+best.k-1];if(s0!=null&&s1!=null){ws.splice(s0,s1-s0+1,',');rest=ws.join(' ')}}
  rest=rest.replace(/phiếu\s+(nhập|xuất)|(^|\s)(nhập|xuất)(\s+kho)?(?=\s)|xuất\s+(hủy|huỷ)|(hủy|huỷ)\s+hàng|hàng\s+(hủy|huỷ)|(^|\s)(hủy|huỷ)(?=\s)|trả lại|trả về|hàng trả|khách trả|nhà cung cấp|(^|\s)ncc(?=\s)|(^|\s)bán(?=\s)|người nhận|người giao|giao cho|(^|\s)cho(?=\s)|(^|\s)(anh|chị|em)(?=\s)/g,' , ');
  const P=vParse(', '+rest);out.lines=P.lines;out.unknown=P.unknown;if(P.loc&&P.loc.list&&P.loc.list[0]&&P.loc.sure)out.partner=P.loc.list[0].x.c.name;return out}
function voiceVoucher(){const d=R.vdraft||(R.vdraft=newVoucher('N'));const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,on=false,P=null,base='';
  openSheet('🎤 Đọc phiếu',`<div class="tiny muted">Ví dụ: “Xuất bán cho Huy, chuối tiêu 20 ký, nem bùi 10 gói” · “Nhập hàng nhà cung cấp, chuối tiêu 300 ký” · “Xuất huỷ chuối tiêu 5 ký”.</div>
   ${SR?'<button class="btn block" id="vvMic" style="font-size:16px;padding:14px">🔴 Đang nghe… (bấm để dừng)</button>':'<div class="alert w">Trình duyệt này chưa cho nhận giọng nói trực tiếp. Bấm vào ô dưới rồi bấm 🎤 trên bàn phím điện thoại để đọc.</div>'}
   <textarea id="vvT" rows="3" placeholder="Nội dung đọc sẽ hiện ở đây (có thể sửa hoặc gõ tay)"></textarea>
   <button class="btn block" id="vvGo">Phân tích</button><div id="vvR"></div>`,b=>{
    const T=b.querySelector('#vvT'),Rb=b.querySelector('#vvR'),mic=b.querySelector('#vvMic');
    const show=()=>{P=vvParse(T.value);const ty=d.id?d.type:(P.type||d.type);const rs=V_REASON[ty];const rsn=P.reason&&rs.includes(P.reason)?P.reason:(rs.includes(d.reason)?d.reason:rs[0]);
      Rb.innerHTML=`<div class="stack" style="margin-top:8px">
       <div class="group"><div class="row"><div class="grow"><div class="t">${ty==='N'?'Phiếu nhập':'Phiếu xuất'} · <select id="vvRs" style="width:auto;min-height:0;padding:4px 8px;display:inline-block">${rs.map(x=>`<option ${x===rsn?'selected':''}>${x}</option>`).join('')}</select></div>
        <div class="s">${ty==='N'?'Người giao':'Người nhận'}: <input id="vvPs" list="dlShip" value="${esc(P.person||d.person||'')}" style="min-height:0;padding:4px 8px;margin-top:4px"></div></div></div></div>
       ${P.lines.map((l,i)=>`<div class="card stack" style="gap:6px"><div class="tiny muted">${l.sure?'':'⚠️ Chưa chắc – kiểm tra · '}nghe: “${esc(l.said)}”</div>
         <select data-vvp="${i}">${l.list.map(y=>`<option value="${esc(y.p.code)}">${esc(y.p.name)} (${esc(y.p.code)} · ${esc(y.p.unit||'')})</option>`).join('')}<option value="">— Bỏ dòng này —</option></select>
         <label class="f">Số lượng<input data-vvq="${i}" inputmode="decimal" class="num" value="${l.qty}"></label></div>`).join('')}
       ${P.unknown.length?`<div class="alert w">Chưa hiểu: ${P.unknown.map(x=>'“'+esc(x)+'”').join(', ')} – thêm tay nếu cần.</div>`:''}
       <button class="btn block pri" id="vvOk" ${P.lines.length||P.person||P.type?'':'disabled'}>Điền vào phiếu</button></div>`;
      const ok=Rb.querySelector('#vvOk');ok.onclick=()=>{if(!d.id&&ty!==d.type){d.type=ty}d.reason=Rb.querySelector('#vvRs').value;const ps=Rb.querySelector('#vvPs').value.trim();if(ps)d.person=ps;if(P.partner&&!d.partner&&d.reason==='Xuất bán')d.partner=P.partner;
        let n=0;P.lines.forEach((l,i)=>{const code=Rb.querySelector(`[data-vvp="${i}"]`).value;if(!code)return;const p=findProd(code);if(!p)return;const q=toNum(Rb.querySelector(`[data-vvq="${i}"]`).value);if(!q)return;
          const ex=d.lines.find(x=>x.code===p.code);if(ex)ex.qty=r3(toNum(ex.qty)+q);else d.lines.push({code:p.code,name:p.name,unit:p.unit,qtyDoc:'',qty:q,note:''});n++});
        if(rec&&on)try{rec.abort()}catch(e){}closeSheet();render();toast('Đã điền '+n+' mặt hàng – kiểm tra rồi bấm Lưu phiếu')}};
    b.querySelector('#vvGo').onclick=show;
    if(mic){rec=new SR();rec.lang='vi-VN';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
      rec.onresult=e=>{let fin='',tmp='';for(let i=0;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript+' ';else tmp+=r[0].transcript}T.value=(base+' '+fin+tmp).trim()};
      rec.onend=()=>{on=false;mic.textContent='🎤 Nói lại';if(T.value.trim())show()};
      rec.onerror=e=>{on=false;mic.textContent='🎤 Nói lại';if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){Rb.innerHTML=permHTML('mic')+'<button class="btn block pri" id="vvRetry" style="margin-top:8px">Thử lại</button>';const r=Rb.querySelector('#vvRetry');if(r)r.onclick=()=>mic.onclick();return}
        Rb.innerHTML=`<div class="alert r">${e.error==='no-speech'?'Không nghe thấy tiếng nói, thử lại.':'Lỗi nhận giọng nói ('+esc(e.error)+'). Có thể dùng 🎤 của bàn phím.'}</div>`};
      permState('microphone').then(st=>{if(st==='denied'&&!on){Rb.innerHTML=permHTML('mic')+'<button class="btn block pri" id="vvRetry" style="margin-top:8px">Thử lại</button>';const r=Rb.querySelector('#vvRetry');if(r)r.onclick=()=>mic.onclick()}});
      mic.onclick=()=>{if(on){try{rec.stop()}catch(e){}return}base=T.value.trim();Rb.innerHTML='';try{rec.start();on=true;mic.textContent='🔴 Đang nghe… (bấm để dừng)'}catch(e){Rb.innerHTML='<div class="alert r">Không bật được micro.</div>'}};
      mic.onclick()}
    else setTimeout(()=>T.focus(),50)},{onClose:()=>{if(rec&&on)try{rec.abort()}catch(e){}}})}
async function saveVoucher(andPrint){const d=R.vdraft,N=d.type==='N',m=$('#vMsg');const err=t=>m.innerHTML='<div class="alert r">'+t+'</div>';m.innerHTML='';if(!d.id)d.date=today();
  if(!d.date)return err('Chưa chọn ngày.');if(locked(d.date))return err('Hôm nay nằm trong kỳ đã khóa sổ.');
  const lines=d.lines.map(l=>({code:l.code,name:l.name,unit:l.unit,qtyDoc:l.qtyDoc===''||l.qtyDoc==null?null:r3(toNum(l.qtyDoc)),qty:r3(toNum(l.qty)),note:l.note||''})).filter(l=>l.qty>0);
  if(!lines.length)return err('Phiếu chưa có hàng nào có số lượng.');
  if(!N&&!d.allowNeg){const need=new Map();lines.forEach(l=>need.set(l.code,(need.get(l.code)||0)+l.qty));const bal=stockMap(d.date,d.id);const short=[];
    for(const [c,q] of need){const b=bal.get(c)||0;if(q>b+1e-9)short.push(`${esc(c)}: xuất ${fmt(q)}, tồn chỉ còn ${fmt(b)}`)}
    if(short.length){m.innerHTML=`<div class="alert w"><b>Xuất vượt tồn kho</b><br>${short.join('<br>')}<label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-weight:600"><input type="checkbox" id="vNeg" style="width:22px;min-height:0"> Đã kiểm tra, vẫn lưu</label></div>`;$('#vNeg').onchange=e=>d.allowNeg=e.target.checked;return}}
  const base={type:d.type,date:d.date,person:d.person.trim(),partner:d.partner.trim(),partnerCode:d.partnerCode||'',dept:d.dept||'',reason:d.reason.trim(),refDoc:d.refDoc.trim(),refCount:d.refCount||'',warehouse:d.warehouse||ST().whName,lines,orderIds:d.orderIds||[],kind:d.kind||''};
  $('#vSave').disabled=$('#vSaveP').disabled=true;
  try{let saved;if(d.id){const o=R.vouchers.find(x=>x.id===d.id)||{};if(locked(o.date))throw{message:'Phiếu gốc thuộc kỳ đã khóa.'};saved=Object.assign({},base,{no:d.no,createdBy:o.createdBy||null,createdAt:o.createdAt||Date.now(),updatedBy:R.uid,updatedAt:Date.now()});await R.db.doc('vouchers/'+d.id).set(saved);saved.id=d.id}
    else{let no=nextNo(N?'PN':'PX',d.date,R.vouchers),ref;for(let k=0;k<40;k++){ref=R.db.doc('vouchers/'+no);const s=await ref.get();if(!s.exists)break;no=bumpNo(no)}
      saved=Object.assign({},base,{no,createdBy:R.uid,createdAt:Date.now()});await ref.set(saved);saved.id=no;
      for(const oid of base.orderIds){try{await R.db.doc('orders/'+oid).update(N?{pn:no}:{px:no})}catch(e){}}}
    toast('Đã lưu phiếu '+saved.no);R.vdraft=newVoucher(d.type);if(!R.vouchers.find(x=>x.id===saved.id))R.vouchers.push(saved);R.tab='vlist';render();if(andPrint)printVouchers([saved])}
  catch(e){$('#vSave').disabled=$('#vSaveP').disabled=false;err('Không lưu được: '+esc(e.message||e.code||'lỗi'))}}
function viewKhoList(v){const [f,t]=periodRange();const q=noAcc(R.ui.vQ),ty=R.ui.vType;
  const L=R.vouchers.filter(x=>x.date>=f&&x.date<=t&&(!ty||x.type===ty)&&(!q||noAcc([x.no,x.person,x.partner,x.reason,...(x.lines||[]).map(l=>l.code+' '+l.name)].join(' ')).includes(q))).sort((a,b)=>(b.date+b.no).localeCompare(a.date+a.no));
  v.innerHTML=`<h1 class="big">Phiếu kho</h1><div class="stack">${periodBar()}
   <div class="seg">${[['','Tất cả'],['N','Phiếu nhập'],['X','Phiếu xuất']].map(([k,l])=>`<button data-vty="${k}" class="${ty===k?'on':''}">${l}</button>`).join('')}</div>
   <input id="vlQ" placeholder="Tìm số phiếu, người giao, mặt hàng" value="${esc(R.ui.vQ)}">
   <div class="hrow"><button class="btn sm" id="vlPrint" ${L.length?'':'disabled'}>Tải bản in ${L.length} phiếu</button><button class="btn sm" id="vlMisa" ${L.length?'':'disabled'}>Xuất Excel cho MISA</button></div>
   <div class="group">${L.map(x=>`<div class="row tap" data-vid="${esc(x.id)}"><div class="grow"><div class="t">${esc(x.no)} <span class="chip ${x.type==='N'?'g':'o'}">${x.type==='N'?'Nhập':'Xuất'}</span>${x.orderIds&&x.orderIds.length?' <span class="chip b">'+x.orderIds.length+' đơn</span>':''}</div><div class="s ell">${dmy(x.date)} · ${esc(x.person||x.partner||'')} · ${(x.lines||[]).length} mặt hàng</div></div><span class="chev">›</span></div>`).join('')||'<div class="empty">Không có phiếu trong kỳ.</div>'}</div></div>`;
  bindPeriod();$$('[data-vty]').forEach(b=>b.onclick=()=>{R.ui.vType=b.dataset.vty;render()});$('#vlQ').oninput=e=>{R.ui.vQ=e.target.value;render()};
  $('#vlPrint').onclick=()=>printVouchers(L.slice().reverse());$('#vlMisa').onclick=()=>exportMisa(L.slice().reverse(),f,t);
  $$('[data-vid]').forEach(r=>r.onclick=()=>voucherDetail(R.vouchers.find(x=>x.id===r.dataset.vid)))}
function voucherDetail(x){if(!x)return;const lk=locked(x.date);
  openSheet((x.type==='N'?'Phiếu nhập ':'Phiếu xuất ')+x.no,`<div class="group"><div class="row"><div class="grow s">Ngày ${dmy(x.date)}${x.person?' · '+esc(x.person):''}${x.partner?' · '+esc(x.partner):''}<br>${esc(x.reason||'')}<br>Người lập: ${esc(staffName(x.createdBy))}</div></div>
   ${(x.lines||[]).map(l=>`<div class="row"><div class="grow"><div class="t">${esc(l.name)}</div><div class="s">${esc(l.code)} · ${esc(l.unit)}</div></div><div class="money">${fmt(l.qty)}</div></div>`).join('')}</div>
   <button class="btn block pri" data-a="print">Tải bản in (mẫu ${x.type==='N'?'01':'02'}-VT)</button>
   ${lk?'<div class="alert w">Kỳ đã khóa sổ, không sửa/xóa được.</div>':'<button class="btn block" data-a="edit">Sửa phiếu</button><button class="btn block danger" data-a="del">Xóa phiếu</button>'}`,b=>{
    b.querySelector('[data-a="print"]').onclick=()=>printVouchers([x]);
    const e=b.querySelector('[data-a="edit"]');if(e)e.onclick=()=>{R.vdraft={id:x.id,no:x.no,type:x.type,date:x.date,person:x.person||'',partner:x.partner||'',partnerCode:x.partnerCode||'',dept:x.dept||'',reason:x.reason||'',refDoc:x.refDoc||'',refCount:x.refCount||'',warehouse:x.warehouse||'',lines:x.lines.map(l=>Object.assign({},l,{qtyDoc:l.qtyDoc==null?'':l.qtyDoc})),orderIds:x.orderIds||[],kind:x.kind||'',allowNeg:false};closeSheet();R.tab='vnew';render()};
    const dl=b.querySelector('[data-a="del"]');if(dl)dl.onclick=async()=>{closeSheet();if(!await confirmSheet('Xóa phiếu '+x.no+'?','Tồn kho sẽ được tính lại.','Xóa phiếu',true))return;
      try{await R.db.doc('vouchers/'+x.id).delete();for(const oid of x.orderIds||[]){try{await R.db.doc('orders/'+oid).update(x.type==='N'?{pn:null}:{px:null})}catch(e){}}toast('Đã xóa phiếu')}catch(e){toast('Không xóa được')}}})}
function viewStock(v){const ML=misaLast();if(ML)return viewStockMisa(v,ML);const [f,t]=periodRange();let rows=nxt(f,t);const q=noAcc(R.ui.stockQ);if(q)rows=rows.filter(r=>noAcc(r.code+' '+r.name).includes(q));
  const neg=rows.filter(r=>r.cuoi<0||!r.known).length,low=rows.filter(r=>stStatus(r)[0]==='w').length;
  v.innerHTML=`<h1 class="big">Tồn kho</h1><div class="stack">${periodBar()}
   <div class="kpis"><div class="kpi"><div class="l">Mặt hàng</div><div class="v">${R.products.size}</div></div><div class="kpi ${neg?'r':''}"><div class="l">Tồn âm / mã lạ</div><div class="v">${neg}</div></div><div class="kpi ${low?'w':''}"><div class="l">Sắp hết</div><div class="v">${low}</div></div></div>
   <div class="hrow"><input id="stQ" class="grow" placeholder="Tìm mặt hàng" value="${esc(R.ui.stockQ)}" style="flex:1"><button class="btn sm" id="stXls">Xuất Excel</button></div>
   ${R.products.size?`<div class="tw"><table><thead><tr><th>Mặt hàng</th><th class="n">Đầu kỳ</th><th class="n">Nhập</th><th class="n">Xuất</th><th class="n">Cuối kỳ</th></tr></thead><tbody>
   ${rows.map(r=>{const [c,l]=stStatus(r);return `<tr class="tap" data-card="${esc(r.code)}"><td>${esc(r.name)}<div class="tiny muted">${esc(r.code)} · ${esc(r.unit)} ${l?`<span class="chip ${c}">${l}</span>`:''}</div></td><td class="n ${r.dau<0?'neg':''}">${fmt(r.dau)}</td><td class="n">${fmt0(r.n)}</td><td class="n">${fmt0(r.x)}</td><td class="n ${r.cuoi<0?'neg':''}"><b>${fmt(r.cuoi)}</b></td></tr>`}).join('')}</tbody></table></div>
   <div class="tiny muted">Bấm vào mặt hàng để xem thẻ kho. Không cộng tổng vì khác đơn vị tính.</div>`:'<div class="empty"><b>Chưa có danh mục hàng</b>Quản lý thêm sản phẩm ở mục Danh mục.</div>'}</div>`;
  bindPeriod();$('#stQ').oninput=e=>{R.ui.stockQ=e.target.value;render()};
  $$('[data-card]').forEach(r=>r.onclick=()=>stockCard(r.dataset.card,f,t));
  $('#stXls').onclick=()=>{const S=ST();xlsxFile(`NXT_${f}_${t}.xlsx`,[{name:'NXT',rows:[[S.company],['BÁO CÁO NHẬP – XUẤT – TỒN (SỐ LƯỢNG)'],['Từ '+dmy(f)+' đến '+dmy(t)],[],['Mã hàng','Tên hàng','Nhóm','ĐVT','Tồn đầu','Nhập','Xuất','Tồn cuối','Tồn tối thiểu','Ghi chú'],...nxt(f,t).map(r=>[r.code,r.name,r.group,r.unit,r.dau,r.n,r.x,r.cuoi,r.min||'',stStatus(r)[1]])],cols:[12,36,14,8,10,10,10,10,10,14]}])}}
function misaRows(){const rows=[];const cache=new Map();for(const p of R.products.values()){const on=misaOn(p);const at=on?toNum(p.misaAt):0;let a={n:0,x:0};if(on){if(!cache.has(at))cache.set(at,misaAfter(at));a=cache.get(at).get(p.code)||a}
    const base=on?toNum(p.misaQty):null;const cur=on?r3(base+a.n-a.x):(stockMap().get(p.code)||0);rows.push({code:p.code,name:p.name,unit:p.unit,group:p.group||'',min:toNum(p.minQty),misa:base,at,n:a.n,x:a.x,cuoi:cur,known:true,on})}
  return rows.sort((a,b)=>a.code.localeCompare(b.code,'vi'))}
function viewStockMisa(v,ML){let rows=misaRows();const q=noAcc(R.ui.stockQ);if(q)rows=rows.filter(r=>noAcc(r.code+' '+r.name).includes(q));
  const dt=new Date(ML);const hm=String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0')+' '+dmy(isoOf(dt)).slice(0,5);const old=Date.now()-ML>24*3600e3;
  const neg=rows.filter(r=>r.cuoi<0).length,low=rows.filter(r=>stStatus(r)[0]==='w').length;
  v.innerHTML=`<h1 class="big">Tồn kho</h1><div class="stack">
   <div class="alert ${old?'w':'b'}">Tồn MISA lúc <b>${hm}</b>${old?' – đã quá 24 giờ chưa đồng bộ lại':''}. Tồn hiện tại = tồn MISA + nhập − xuất trên app sau giờ đó. App tự lấy lại tồn MISA lúc 6h, 12h, 18h.</div>
   <div class="kpis"><div class="kpi"><div class="l">Mặt hàng</div><div class="v">${R.products.size}</div></div><div class="kpi ${neg?'r':''}"><div class="l">Tồn âm</div><div class="v">${neg}</div></div><div class="kpi ${low?'w':''}"><div class="l">Sắp hết</div><div class="v">${low}</div></div></div>
   <div class="hrow"><input id="stQ" class="grow" placeholder="Tìm mặt hàng" value="${esc(R.ui.stockQ)}" style="flex:1"><button class="btn sm" id="stXls">Xuất Excel</button></div>
   <div class="tw"><table><thead><tr><th>Mặt hàng</th><th class="n">Tồn MISA</th><th class="n">Nhập</th><th class="n">Xuất</th><th class="n">Hiện tại</th></tr></thead><tbody>
   ${rows.map(r=>{const [c,l]=stStatus(r);return `<tr><td>${esc(r.name)}<div class="tiny muted">${esc(r.code)} · ${esc(r.unit)} ${l?`<span class="chip ${c}">${l}</span>`:''}${r.on?'':' <span class="chip">chưa có tồn MISA</span>'}</div></td><td class="n">${r.on?fmt(r.misa):''}</td><td class="n">${fmt0(r.n)}</td><td class="n">${fmt0(r.x)}</td><td class="n ${r.cuoi<0?'neg':''}"><b>${fmt(r.cuoi)}</b></td></tr>`}).join('')}</tbody></table></div></div>`;
  $('#stQ').oninput=e=>{R.ui.stockQ=e.target.value;render()};
  $('#stXls').onclick=()=>{const S=ST();xlsxFile(`TonKho_${isoOf(new Date())}.xlsx`,[{name:'Tồn kho',rows:[[S.company],['TỒN KHO HIỆN TẠI (TỒN MISA + PHIẾU APP SAU ĐỒNG BỘ)'],['Tồn MISA lúc '+hm],[],['Mã hàng','Tên hàng','Nhóm','ĐVT','Tồn MISA','Nhập app','Xuất app','Tồn hiện tại','Tồn tối thiểu','Ghi chú'],...misaRows().map(r=>[r.code,r.name,r.group,r.unit,r.on?r.misa:'',r.n,r.x,r.cuoi,r.min||'',stStatus(r)[1]])],cols:[12,36,14,8,10,10,10,12,10,14]}])}}
function stockCard(code,f,t){const p=findProd(code);let bal=p?toNum(p.openingQty):0;const rows=[];
  for(const v of R.vouchers.slice().sort((a,b)=>(a.date+a.type+a.no).localeCompare(b.date+b.type+b.no)))for(const l of v.lines||[]){if(l.code!==code)continue;const q=toNum(l.qty),s=v.type==='N'?1:-1;if(v.date<f){bal+=s*q;continue}if(v.date>t)continue;rows.push({v,q,s})}
  let run=r3(bal);const dau=run;
  openSheet('Thẻ kho '+code,`<div class="tiny muted">${esc(p?p.name:'')} · ${esc(p?p.unit:'')} · ${dmy(f)} – ${dmy(t)}</div><div class="tw"><table><thead><tr><th>Ngày</th><th>Phiếu</th><th class="n">Nhập</th><th class="n">Xuất</th><th class="n">Tồn</th></tr></thead><tbody>
   <tr class="sum"><td colspan="4">Tồn đầu kỳ</td><td class="n">${fmt(dau)}</td></tr>${rows.map(r=>{run=r3(run+r.s*r.q);return `<tr><td>${dm(r.v.date)}</td><td>${esc(r.v.no)}<div class="tiny muted">${esc(r.v.person||r.v.reason||'')}</div></td><td class="n">${r.s>0?fmt(r.q):''}</td><td class="n">${r.s<0?fmt(r.q):''}</td><td class="n ${run<0?'neg':''}">${fmt(run)}</td></tr>`}).join('')}
   <tr class="sum"><td colspan="4">Tồn cuối kỳ</td><td class="n">${fmt(run)}</td></tr></tbody></table></div>`)}
function viewKhoByOrder(v){const S=R.ui;S.sel=S.sel||new Set();S.selR=S.selR||new Set();
  const out=R.orders.filter(o=>o.status!=='cancel'&&!o.px).sort((a,b)=>(a.date+a.no).localeCompare(b.date+b.no));
  const back=R.orders.filter(o=>o.status==='done'&&!o.pn&&(sumL(o,'ret')+sumL(o,'swap'))>0);
  const row=(o,set,k)=>`<label class="row tap" style="cursor:pointer"><input type="checkbox" data-${k}="${esc(o.id)}" ${set.has(o.id)?'checked':''} style="width:22px;min-height:0;flex:none"><div class="grow"><div class="t ell">${esc(o.custName)}</div><div class="s ell">${esc(o.no)} · ${dm(o.date)} · ${ST_NAME[o.status]}${o.shipId?' · '+esc(staffName(o.shipId)):''}</div><div class="s ell">${(o.lines||[]).map(l=>esc(l.name)+' '+fmt(k==='so'?toNum(l.qty)+giftQ(l)+toNum(l.swap):toNum(l.ret)+toNum(l.swap))).join(', ')}</div></div></label>`;
  v.innerHTML=`<h1 class="big">Theo đơn hàng</h1><div class="stack">
   <div class="sec" style="margin-top:0">Đơn chưa xuất kho (${out.length})</div>
   <div class="group">${out.map(o=>row(o,S.sel,'so')).join('')||'<div class="empty">Không có đơn chờ xuất.</div>'}</div>
   ${out.length?`<div class="hrow"><button class="btn sm" id="soAll">Chọn tất cả</button><button class="btn pri grow" id="soMake" ${S.sel.size?'':'disabled'}>Lập phiếu xuất cho ${S.sel.size} đơn</button></div>`:''}
   <div class="sec">Hàng đổi trả chưa nhập kho (${back.length})</div>
   <div class="group">${back.map(o=>row(o,S.selR,'sr')).join('')||'<div class="empty">Không có hàng trả về chờ nhập.</div>'}</div>
   ${back.length?`<button class="btn pri" id="srMake" ${S.selR.size?'':'disabled'}>Lập phiếu nhập hàng trả lại (${S.selR.size} đơn)</button>`:''}
   <div class="tiny muted">Phiếu xuất lấy SL bán + khuyến mại + hàng đổi. Phiếu nhập trả lại lấy SL trả + hàng đổi thu về.</div></div>`;
  $$('[data-so]').forEach(c=>c.onchange=()=>{c.checked?S.sel.add(c.dataset.so):S.sel.delete(c.dataset.so);render()});
  $$('[data-sr]').forEach(c=>c.onchange=()=>{c.checked?S.selR.add(c.dataset.sr):S.selR.delete(c.dataset.sr);render()});
  const a=$('#soAll');if(a)a.onclick=()=>{out.forEach(o=>S.sel.add(o.id));render()};
  const mk=(ids,type)=>{const os=R.orders.filter(o=>ids.has(o.id));const m=new Map();
    os.forEach(o=>o.lines.forEach(l=>{const q=type==='X'?toNum(l.qty)+giftQ(l)+toNum(l.swap):toNum(l.ret)+toNum(l.swap);if(!q)return;const r=m.get(l.code)||{code:l.code,name:l.name,unit:l.unit,qtyDoc:0,qty:0,note:''};r.qtyDoc=r3(r.qtyDoc+q);r.qty=r3(r.qty+q);m.set(l.code,r)}));
    const ships=[...new Set(os.map(o=>o.shipId).filter(Boolean).map(staffName))].join(', ');
    R.vdraft=Object.assign(newVoucher(type),{lines:[...m.values()],orderIds:os.map(o=>o.id),kind:type==='N'?'return':'order',person:ships,partner:os.length===1?os[0].custName:'Nhiều khách hàng',
      reason:(type==='X'?'Xuất bán theo đơn ':'Nhập hàng đổi trả theo đơn ')+os.map(o=>o.no).join(', ')});ids.clear();R.tab='vnew';render()};
  const b=$('#soMake');if(b)b.onclick=()=>mk(S.sel,'X');const c=$('#srMake');if(c)c.onclick=()=>mk(S.selR,'N')}

/* ================= IN PHIẾU & EXCEL ================= */
async function saveFile(filename,data){if(!R.dl){toast('Chế độ xem này không tải được file.');return}
  try{await R.dl.save({filename,data});toast('Đã tải '+filename)}catch(e){if(e&&e.code==='declined')return;toast('Không tải được ('+(e&&e.code||'lỗi')+')')}}
function xlsxFile(filename,sheets){if(!window.XLSX){toast('Thư viện Excel đang tải, thử lại sau.');return}const wb=XLSX.utils.book_new();
  for(const s of sheets){const ws=XLSX.utils.aoa_to_sheet(s.rows,{cellDates:true});if(s.cols)ws['!cols']=s.cols.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,s.name.slice(0,31))}
  saveFile(filename,new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array',cellDates:true})]))}
const xDate=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
function voucherHtml(x){const st=ST(),N=x.type==='N';const d=x.date.split('-');const lines=x.lines||[];
  const sumDoc=r3(lines.reduce((s,l)=>s+(l.qtyDoc==null?0:toNum(l.qtyDoc)),0)),sumQ=r3(lines.reduce((s,l)=>s+toNum(l.qty),0));const one=new Set(lines.map(l=>l.unit)).size===1;
  const rows=lines.map((l,i)=>`<tr><td class="c">${i+1}</td><td>${esc(l.name)}</td><td class="c">${esc(l.code)}</td><td class="c">${esc(l.unit)}</td><td class="r">${l.qtyDoc==null?'':fmt(l.qtyDoc)}</td><td class="r">${fmt(l.qty)}</td><td></td><td></td></tr>`).join('')+'<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'.repeat(Math.max(0,5-lines.length));
  const maker=staffName(x.createdBy);const mk=maker==='Bạn'||maker==='Nhân viên'||maker==='—'?'':maker;
  const sig=N?[['Người lập phiếu',mk],['Người giao hàng',x.person],['Thủ kho',st.keeper],['Kế toán trưởng<br>(Hoặc bộ phận có nhu cầu nhập)',st.chiefAcc]]:[['Người lập phiếu',mk],['Người nhận hàng',x.person],['Thủ kho',st.keeper],['Kế toán trưởng<br>(Hoặc bộ phận có nhu cầu nhập)',st.chiefAcc],['Giám đốc',st.director]];
  return `<section class="page"><table class="hd"><tr><td><b>Đơn vị:</b> ${esc(st.company)}<br><b>Bộ phận:</b> ${esc(st.dept)}${st.address?'<br><b>Địa chỉ:</b> '+esc(st.address):''}</td><td class="c" style="width:46%"><b>Mẫu số ${N?'01 - VT':'02 - VT'}</b><br><i>${esc(st.circular)}</i></td></tr></table>
  <h1>${N?'PHIẾU NHẬP KHO':'PHIẾU XUẤT KHO'}</h1><table class="hd"><tr><td style="width:25%"></td><td class="c"><i>Ngày ${d[2]} tháng ${d[1]} năm ${d[0]}</i><br>Số: <b>${esc(x.no)}</b></td><td style="width:25%">Nợ: ...............<br>Có: ...............</td></tr></table>
  <div class="info">${N?`<p>- Họ và tên người giao: <b>${esc(x.person)}</b>${x.partner?' — Đơn vị: '+esc(x.partner):''}</p><p>- Theo ${esc(x.refDoc||'..........................')} ngày ..... tháng ..... năm ...... của ${esc(x.partner||'..........................')}</p>${x.reason?'<p>- Diễn giải: '+esc(x.reason)+'</p>':''}<p>Nhập tại kho: <b>${esc(x.warehouse||st.whName)}</b> &nbsp; địa điểm: ${esc(st.whPlace||'..........................')}</p>`
   :`<p>- Họ và tên người nhận hàng: <b>${esc(x.person)}</b> &nbsp; Địa chỉ (bộ phận): ${esc(x.dept||x.partner||'..........................')}</p><p>- Lý do xuất kho: ${esc(x.reason||'....................................................')}</p><p>- Xuất tại kho (ngăn lô): <b>${esc(x.warehouse||st.whName)}</b> &nbsp; Địa điểm: ${esc(st.whPlace||'..........................')}</p>`}</div>
  <table class="bd"><thead><tr><th rowspan="2" style="width:6%">STT</th><th rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th><th rowspan="2" style="width:11%">Mã số</th><th rowspan="2" style="width:8%">Đơn vị tính</th><th colspan="2">Số lượng</th><th rowspan="2" style="width:10%">Đơn giá</th><th rowspan="2" style="width:12%">Thành tiền</th></tr>
  <tr><th style="width:10%">${N?'Theo chứng từ':'Yêu cầu'}</th><th style="width:10%">${N?'Thực nhập':'Thực xuất'}</th></tr><tr class="lt"><th>A</th><th>B</th><th>C</th><th>D</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead>
  <tbody>${rows}<tr><td></td><td class="c"><b>Cộng</b></td><td class="c">x</td><td class="c">x</td><td class="r"><b>${one&&sumDoc?fmt(sumDoc):'x'}</b></td><td class="r"><b>${one?fmt(sumQ):'x'}</b></td><td class="c">x</td><td></td></tr></tbody></table>
  <div class="info"><p>- Tổng số tiền (viết bằng chữ): ............................................................................................</p><p>- Số chứng từ gốc kèm theo: ${esc(x.refCount||'....................')}</p></div>
  <p class="r" style="margin:8px 0 2px"><i>Ngày ${d[2]} tháng ${d[1]} năm ${d[0]}</i></p><table class="sg"><tr>${sig.map(([a,b])=>`<td style="width:${100/sig.length}%"><b>${a}</b><br><i>(Ký, họ tên)</i><div class="sp"></div>${esc(b||'')}</td>`).join('')}</tr></table></section>`}
function printVouchers(list){list=(list||[]).filter(Boolean);if(!list.length)return;
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${list.length===1?esc(list[0].no):'Phieu kho'}</title><style>@page{size:A4;margin:12mm 14mm}body{font-family:"Times New Roman",Times,serif;font-size:13px;color:#000;margin:0}.page{page-break-after:always;padding:8px}.page:last-child{page-break-after:auto}h1{text-align:center;font-size:20px;margin:10px 0 2px}table{border-collapse:collapse;width:100%}.hd td{vertical-align:top;padding:2px}.c{text-align:center}.r{text-align:right}.info p{margin:4px 0}.bd th,.bd td{border:1px solid #000;padding:4px 5px}.bd th{text-align:center}.bd .lt th{font-weight:normal;font-style:italic}.sg td{text-align:center;vertical-align:top;padding:4px}.sp{height:70px}.tip{font-family:Arial,sans-serif;background:#fff6d6;border:1px solid #e0c060;padding:8px 12px;margin:8px}@media print{.tip{display:none}}</style></head><body><div class="tip">Nhấn Ctrl+P (Cmd+P trên Mac) để in, khổ A4.</div>${list.map(voucherHtml).join('')}<script>setTimeout(function(){try{window.print()}catch(e){}},400)<\/script></body></html>`;
  saveFile(list.length===1?list[0].no+'.html':'Phieu_kho_'+list.length+'_phieu.html',html)}
function exportMisa(list,f,t){const S=ST();const head=['Ngày hạch toán','Ngày chứng từ','Số chứng từ','Loại','Mã đối tượng','Tên đối tượng','Người giao/nhận','Diễn giải','Mã hàng','Tên hàng','Mã kho','ĐVT','Số lượng','Đơn giá','Thành tiền'];
  const mk=ty=>[head,...list.filter(v=>v.type===ty).flatMap(v=>(v.lines||[]).map(l=>[xDate(v.date),xDate(v.date),v.no,ty==='N'?'Nhập kho':'Xuất kho',v.partnerCode||'',v.partner||'',v.person||'',v.reason||'',l.code,l.name,S.whCode||'',l.unit,toNum(l.qty),'','']))];
  const sh=[];if(list.some(v=>v.type==='N'))sh.push({name:'Nhap kho',rows:mk('N')});if(list.some(v=>v.type==='X'))sh.push({name:'Xuat kho',rows:mk('X')});xlsxFile(`MISA_phieu_kho_${f}_${t}.xlsx`,sh)}

/* ================= QUẢN LÝ: TỔNG QUAN ================= */
/* v41: chi phí AI đọc phiếu trên Tổng quan (chỉ quản lý) */
function viewDash(v){viewDash0(v);try{if(window.vibaAI&&(!R._aiUseAt||Date.now()-R._aiUseAt>300000)){R._aiUseAt=Date.now();window.vibaAI.slipUsage().then(u=>{R._aiUse=u;soon()}).catch(()=>{})}
  const u=R._aiUse;if(!u)return;const ym=today().slice(0,7).replace('-',''),m=(u.months||[]).find(x=>x.month===ym)||{n:0,vnd:0};const pc=Math.min(100,Math.round((m.vnd||0)*100/u.cap));
  const h=v.querySelector('h1');const html=`<div class="card small" id="aiUse" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px"><b>🤖 AI đọc phiếu tháng ${ym.slice(4)}/${ym.slice(0,4)}</b><span>${m.n||0} phiếu · <b>${vnd(m.vnd||0)}</b> / ${vnd(u.cap)}</span></div><div style="height:6px;background:var(--line,#e3e8ef);border-radius:4px;margin-top:6px"><div style="height:6px;width:${pc}%;background:${pc>=90?'#d64545':'#1b6aa5'};border-radius:4px"></div></div><div class="tiny muted" style="margin-top:4px">${u.hasKey?'Model '+esc(u.model||'tự chọn')+' · tự dừng khi đạt '+vnd(u.stop)+' (ước tính theo tỷ giá '+fmt(u.fx)+'đ/USD)':'Chưa cài mã Gemini – app đang tự đọc phiếu'}</div></div>`;
  if(h)h.insertAdjacentHTML('afterend',html);else v.insertAdjacentHTML('afterbegin',html)}catch(e){}}
function viewDash0(v){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Tổng quan</h1>'+periodBar()+'<div class="empty">Đang tải dữ liệu…</div>';bindPeriod();return}
  const s=stats(all);const S=ST();const waiting=R.orders.filter(o=>o.status==='new'||o.status==='shipping').length;
  const sales=new Map(),ships=new Map();all.forEach(o=>{if(o.saleId){if(!sales.has(o.saleId))sales.set(o.saleId,[]);sales.get(o.saleId).push(o)}if(o.shipId&&o.status==='done'){if(!ships.has(o.shipId))ships.set(o.shipId,[]);ships.get(o.shipId).push(o)}});
  for(const [id,st] of R.staff){if(st.role==='sale'&&!sales.has(id))sales.set(id,[]);if(st.role==='ship'&&!ships.has(id))ships.set(id,[])}
  const saleRows=[...sales.entries()].map(([id,L])=>{const x=stats(L);const st=R.staff.get(id);const p=st&&st.pct!=null&&st.pct!==''?toNum(st.pct):toNum(S.salePct);return {id,x,inc:x.revenue*p/100,p}}).sort((a,b)=>b.x.revenue-a.x.revenue);
  const shipRows=[...ships.entries()].map(([id,L])=>({id,x:shipStats(L)})).sort((a,b)=>b.x.done-a.x.done);
  /* đối chiếu kho */
  const rec=new Map();const get=(c,n,u)=>{if(!rec.has(c))rec.set(c,{name:n,unit:u,go:0,px:0,back:0,pn:0});return rec.get(c)};
  all.filter(o=>o.status==='done').forEach(o=>o.lines.forEach(l=>{const r=get(l.code,l.name,l.unit);r.go+=toNum(l.qty)+giftQ(l)+toNum(l.swap);r.back+=toNum(l.ret)+toNum(l.swap)}));
  R.vouchers.filter(x=>x.date>=f&&x.date<=t).forEach(x=>x.lines.forEach(l=>{const r=get(l.code,l.name,l.unit);if(x.type==='X')r.px+=toNum(l.qty);else if(x.kind==='return')r.pn+=toNum(l.qty)}));
  const recRows=[...rec.entries()].filter(([c,r])=>r.go||r.px||r.back||r.pn).sort((a,b)=>Math.abs(r3(b[1].go-b[1].px))-Math.abs(r3(a[1].go-a[1].px)));
  const noPx=R.orders.filter(o=>o.status==='done'&&!o.px).length,noPn=R.orders.filter(o=>o.status==='done'&&!o.pn&&(sumL(o,'ret')+sumL(o,'swap'))>0).length;
  const negStock=[...stockMap().values()].filter(x=>x<0).length;
  v.innerHTML=`<h1 class="big">Tổng quan</h1><div class="stack">${periodBar()}
   ${(()=>{const prod=prodAgg(all);const debt=R.orders.filter(o=>owedOf(o)>0);const dSum=debt.reduce((x,o)=>x+owedOf(o),0);const st={};all.forEach(o=>st[o.status]=(st[o.status]||0)+1);
    return accCard('mr','Tổng doanh số',vnd(s.revenue),`đã trừ hàng trả · ${s.orders} đơn`,C_B,()=>`<div class="tiny muted">Theo nhân viên bán hàng</div><div class="tw"><table><thead><tr><th>Sale</th><th class="n">Đơn</th><th class="n">SL</th><th class="n">Doanh số</th><th class="n">Đổi trả</th><th class="n">Còn nợ</th></tr></thead><tbody>${saleRows.map(r=>`<tr><td>${esc(staffName(r.id))}</td><td class="n">${r.x.orders}</td><td class="n">${fmt(r.x.qty)}</td><td class="n">${vnd(r.x.revenue)}</td><td class="n">${retRate(r.x)}</td><td class="n">${vnd(r.x.unpaid)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Chưa có dữ liệu.</td></tr>'}</tbody></table></div><div class="tiny muted">Theo sản phẩm</div>${prodTable(prod)}`)
     +accCard('md','Tổng nợ phải thu',vnd(dSum),`${debt.length} đơn · ${new Set(debt.map(o=>o.cust||o.custName)).size} khách · đã thu trong kỳ ${vnd(s.paid)}`,C_R,()=>debtBlock(debt))
     +accCard('mx','Tỷ lệ đổi trả',retRate(s),`đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}`,C_O,()=>retTable(prod))
     +accCard('mo','Tổng số đơn hàng',fmt(s.orders+s.cancel),`${st.done||0} đã giao · ${(st.new||0)+(st.shipping||0)} chờ/đang giao · ${s.cancel} hủy · chưa giao (mọi lúc) ${waiting}`,null,()=>`<div class="tw"><table><thead><tr><th>Trạng thái</th><th class="n">Số đơn</th></tr></thead><tbody>${['new','shipping','done','cancel'].map(k=>`<tr><td>${ST_NAME[k]}</td><td class="n">${st[k]||0}</td></tr>`).join('')}</tbody></table></div>`)
     +accCard('mq','Tổng số lượng sản phẩm',fmt(s.qty),`tặng ${fmt(s.promo)}`,null,()=>goTable(prod))})()}
   ${negStock||s.edited?`<div class="stack" style="gap:8px">${negStock?`<div class="alert r">${negStock} mặt hàng đang tồn âm.</div>`:''}${s.edited?`<div class="alert b">${s.edited} đơn trong kỳ có sửa giá so với giá mặc định.</div>`:''}</div>`:''}
   <div class="sec">Theo nhân viên giao hàng</div>
   <div class="tw"><table><thead><tr><th>Ship</th><th class="n">Đơn giao</th><th class="n">SL giao</th><th class="n">Đổi trả</th><th class="n">Tiền đã thu</th><th class="n">Ship ngoài</th></tr></thead><tbody>
   ${shipRows.map(r=>`<tr><td>${esc(staffName(r.id))}</td><td class="n">${r.x.done}</td><td class="n">${fmt(r.x.doneQty)}</td><td class="n">${retRate(r.x)}</td><td class="n">${vnd(r.x.collected)}</td><td class="n">${r.x.outside}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Chưa có dữ liệu.</td></tr>'}</tbody></table></div>
   <div class="sec">Đối chiếu bán hàng với kho</div>
   <div class="tw"><table><thead><tr><th>Mặt hàng</th><th class="n">Giao theo đơn</th><th class="n">Xuất kho</th><th class="n">Lệch</th><th class="n">Trả về theo đơn</th><th class="n">Nhập trả kho</th><th class="n">Lệch</th></tr></thead><tbody>
   ${recRows.map(([c,r])=>{const d1=r3(r.go-r.px),d2=r3(r.back-r.pn);return `<tr><td>${esc(r.name)}<div class="tiny muted">${esc(c)} · ${esc(r.unit)}</div></td><td class="n">${fmt(r.go)}</td><td class="n">${fmt(r.px)}</td><td class="n ${d1?'neg':''}">${d1?fmt(d1):'✓'}</td><td class="n">${fmt0(r.back)}</td><td class="n">${fmt0(r.pn)}</td><td class="n ${d2?'neg':''}">${d2?fmt(d2):r.back||r.pn?'✓':''}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">Chưa có phát sinh.</td></tr>'}</tbody></table></div>
   <div class="tiny muted">Giao theo đơn = SL bán + khuyến mại + hàng đổi của các đơn đã giao trong kỳ. Lệch khác 0 nghĩa là chưa lập phiếu xuất, hoặc phiếu xuất khác với số thực giao.</div>
   <button class="btn" id="dXls">Xuất Excel chi tiết đơn hàng trong kỳ</button>
   <button class="btn" id="dMisa">Xuất file nhập MISA (đơn đã giao trong kỳ)</button>
   ${payAdmin()}${attAdmin()}${salePayAdmin()}</div>`;
  bindPeriod();$('#dXls').onclick=()=>exportOrders(all,f,t);$('#dMisa').onclick=()=>exportMisaSale(all,f,t);bindPayAdmin();bindSaleAdmin();hydratePhotos(document);bindAcc();bindOids(R.orders)}
/* ===== XUẤT FILE NHẬP MISA (đơn Đã giao) – mẫu "Nhập bán hàng hóa từ Excel" của MISA AMIS, tiêu đề dòng 1 =====
   Số CT: chưa thu → bh… ; tiền mặt → ct… ; chuyển khoản → ntn… (+ số đơn app, VD DH2610-004 → bh2610004)
   KM (tặng thêm hàng) trừ thẳng vào đơn giá; hàng đổi (xuất bù hỏng) → dòng mã hỗ trợ/đổi trả 0đ, TK 5112
   Thuế GTGT theo bảng thuế suất (config/vatRates): khách công ty/HTX ↔ khách cá nhân/hộ kinh doanh */
const MISA_H=["Phương thức thanh toán","Kiêm phiếu xuất kho","Lập kèm hóa đơn","Đã lập hóa đơn","Ngày hạch toán (*)","Ngày chứng từ (*)","Số chứng từ (*)","Số phiếu xuất","Mẫu số HĐ","Ký hiệu HĐ","Số hóa đơn","Ngày hóa đơn","Khách hàng","Địa chỉ","Mã số thuế","Nộp vào TK","Diễn giải/Lý do nộp","Lý do xuất","Loại tiền","Tỷ giá","Mã hàng (*)","Tên hàng","Hàng khuyến mại","Chiết khấu thương mại","TK Tiền/Chi phí/Nợ (*)","TK Doanh thu/Có (*)","ĐVT","Số lượng","Đơn giá","Thành tiền","Thành tiền quy đổi","Tỷ lệ CK (%)","Tiền chiết khấu","Tiền chiết khấu quy đổi","TK chiết khấu","% thuế GTGT","Tiền thuế GTGT","Tiền thuế GTGT quy đổi","TK thuế GTGT","Mã kho","TK giá vốn","TK Kho","Đơn giá vốn","Tiền vốn"];
const vN=s=>noAcc(String(s||'').replace(/\n/g,' ')).replace(/[.\s]+$/,'').replace(/\s+/g,' ');
function custKind(o){const c=findCust(o.cust)||{};const nm=noAcc((c.name||'')+' '+(o.custName||''));const tax=String(c.taxCode||'').replace(/\s/g,'');
  if(/(^| )(cong ty|cty|hop tac xa|htx|chi nhanh|doanh nghiep|tong cong ty)( |$)/.test(nm)||/^\d{10}(-\d{3})?$/.test(tax))return {co:true,why:''};
  if(/ho kinh doanh|hkd/.test(nm)||/^\d{12}$/.test(tax))return {co:false,why:''};return {co:false,why:'chưa rõ loại khách (không MST) – đang tính như cá nhân/hộ KD'}}
function vatOf(name,co){const L=((R.vat||{}).items)||[];const n=vN(name);const it=L.find(x=>x.names.some(y=>vN(y)===n))||L.find(x=>x.names.some(y=>n.startsWith(vN(y))||vN(y).startsWith(n)));if(!it)return null;const v=co?it.co:it.hh;return v}
function swapCode(code,name){const n=vN(name);let best=null;const all=R.allProducts||[];for(const p of all){const pn=vN(p.name);if(p.code===code||!pn.includes(n.replace(/ \d.*$/,'')))continue;const sc=/ho tro|dt|doi tra/.test(pn)&&pn.includes(n)?3:/ho tro|dt|doi tra/.test(pn)?2:/km|khuyen mai/.test(pn)&&pn.includes(n)?1:0;if(sc&&(!best||sc>best.sc))best={p,sc}}return best&&best.p}
function exportMisaSale(list,f,t){const done=list.filter(o=>o.status==='done').sort((a,b)=>((a.doneAt||0)-(b.doneAt||0))||a.no.localeCompare(b.no));if(!done.length)return toast('Không có đơn Đã giao trong kỳ.');
  const rows=[MISA_H],chk=[['Số đơn app','Số CT MISA','Ngày giao','Mã KH','Khách hàng','Loại khách (thuế)','Thanh toán','Tiền hàng','Thuế GTGT','Tổng thanh toán','Đã thu trên app','Ghi chú kiểm tra']];
  for(const o of done){const dd=new Date(o.doneAt||Date.parse(o.date));const day=xDate(dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0'));
    const pm=o.paid?(o.payMethod==='transfer'?'ck':'tm'):'no';const num=String(o.no||o.id).replace(/\D/g,'');const ref=(pm==='no'?'bh':pm==='tm'?'ct':'ntn')+num;
    const tkNo=pm==='no'?'131':pm==='tm'?'1111':'1121';const ck=custKind(o);const c=findCust(o.cust)||{};const nm=c.name||o.custName||'';
    const memo=(pm==='no'?'Bán hàng ':'Thu tiền bán hàng ')+nm;const notes=[];if(ck.why)notes.push(ck.why);if(pm==='ck')notes.push('Chuyển khoản: điền "Nộp vào TK" (tài khoản ngân hàng nhận).');
    let first=true,sum=0,vsum=0;const put=(code,name,unit,qty,price,amt,km,tkCo,vat,vx)=>{const vamt=vx!=null?vx:(typeof vat==='number'?Math.round(amt*vat):0);sum+=amt;vsum+=vamt;
      rows.push([first?(pm==='no'?'Chưa thu tiền':'Thu tiền ngay'):'',first?'Không':'',first?'Không':'',first?'Chưa lập':'',day,day,ref,'','','','','',first?o.cust:'','','','',first?memo:'','',first?'VND':'','',code,name,km?'Có':'Không','',tkNo,tkCo,unit,qty,price,amt,'','','','','',vat==null?'':(typeof vat==='number'?vat*100:vat),vamt||'',
        '',vat==null?'':'33311','','','','','']);first=false};
    for(const l of o.lines||[]){const q=toNum(l.qty),km=toNum(l.promo),sw=toNum(l.swap),rt=toNum(l.ret),pr=toNum(l.price);const net=Math.max(0,q-rt);const amt=Math.round(net*pr);
      const vat=vatOf(l.name,ck.co);if(vat==null)notes.push('Chưa có thuế suất cho '+l.name+'.');
      if(l.g){const G=lineAmt(l),dc=toNum(l.disc),gf=toNum(l.gift);const am=typeof vat==='number'?Math.round(G/(1+vat)):G;const up2=net?Math.round(am/net*100)/100:0;
        if(dc)notes.push(l.name+': khuyến mại '+dc+'% → giá sau KM '+unitNet(l)+' (đã gồm thuế), trừ thẳng vào giá.');if(gf)notes.push(l.name+': tặng '+gf+' '+(l.unit||'')+' → dòng hàng khuyến mại 0đ, TK 5112.');
        if(net)put(l.code,l.name,l.unit||'',net,up2,am,false,'5111',vat,G-am);if(gf)put(l.code,l.name,l.unit||'',gf,0,0,true,'5112',vat)}
      else{const tq=net+km;const up=km&&tq?Math.round(amt/tq*100)/100:pr;if(km)notes.push(l.name+': tặng '+km+' '+(l.unit||'')+' → gộp vào số lượng ('+tq+'), đơn giá '+up+' (trừ thẳng vào giá).');
      if(rt)notes.push(l.name+': khách trả lại '+rt+' khi giao → số lượng bán '+net+'.');if(!pr&&q)notes.push(l.name+': đơn giá 0đ.');
      if(tq)put(l.code,l.name,l.unit||'',tq,up,amt,false,'5111',vat)}
      if(sw){const sp=swapCode(l.code,l.name);notes.push(l.name+': đổi '+sw+' '+(l.unit||'')+' → '+(sp?sp.code+' '+sp.name:'(chưa có mã đổi riêng, dùng mã '+l.code+')')+', TK 5112, 0đ.');put(sp?sp.code:l.code,sp?sp.name:l.name,(sp&&sp.unit)||l.unit||'',sw,0,0,true,'5112',vatOf(l.name,ck.co))}}
    chk.push([o.no,ref,day,o.cust,nm,ck.co?'Công ty/HTX':'Cá nhân/Hộ KD',pm==='no'?'Chưa thu':pm==='tm'?'Tiền mặt':'Chuyển khoản',sum,vsum,sum+vsum,o.paid?toNum(o.paidAmount||sum):0,notes.join(' ')])}
  xlsxFile(`Nhap_MISA_ban_hang_${f}_${t}.xlsx`,[{name:'Ban hang trong nuoc',rows,cols:MISA_H.map((h,i)=>[16,10,10,10,12,12,13].concat([8,8,8,8,10,20,10,10,10,40,10,6,6,11,30,9,8,9,9,7,9,12,13])[i]||9)},{name:'Kiem tra',rows:chk,cols:[13,13,11,18,40,16,13,12,11,13,13,80]}])}
function exportOrders(list,f,t){const rows=[['Ngày','Số đơn','Trạng thái','Sale','Ship','Mã KH','Khách hàng','Địa chỉ','Mã SP','Tên SP','ĐVT','SL','KM','Đổi','Trả','Đơn giá','Giá mặc định','Thành tiền','Tình trạng thanh toán','Số tiền đã thu','Người thu','Còn phải thu','Ship ngoài','Phiếu xuất','Phiếu nhập trả','Nguồn đơn','Hình thức TT','Ngày giao','Tuyến giao','KM %','Hàng tặng','Giá sau KM']];
  const oTot=o=>(o.lines||[]).reduce((s,l)=>s+lineAmt(l),0),oPaid=o=>o.paid?toNum(o.paidAmount||oTot(o)):0,oPay=o=>{const t=oTot(o),p=oPaid(o);return p>=t&&p>0?'Đã thanh toán đủ':p>0?'Thanh toán một phần':'Chưa thanh toán'};
  list.slice().sort((a,b)=>(a.date+a.no).localeCompare(b.date+b.no)).forEach(o=>o.lines.forEach((l,i)=>rows.push([xDate(o.date),o.no,ST_NAME[o.status],staffName(o.saleId),o.shipId?staffName(o.shipId):'',o.cust,o.custName,o.address,l.code,l.name,l.unit,toNum(l.qty),toNum(l.promo),toNum(l.swap),toNum(l.ret),toNum(l.price),l.listPrice==null?'':toNum(l.listPrice),lineAmt(l),oPay(o),i===0&&o.paid?oPaid(o):'',o.paid?(o.paidBy==='ship'?'Ship':'Sale'):'',i===0?Math.max(0,oTot(o)-oPaid(o)):'',o.outside?'Có':'',o.px||'',o.pn||'',o.arising?'Ship phát sinh':'Sale',o.paid?(PM_NAME[o.payMethod]||''):'',xDate(o.dlvDate||o.date),RT().length?rtLabel(routeOf(o)):'',toNum(l.disc),toNum(l.gift),unitNet(l)]))); 
  xlsxFile(`Don_hang_${f}_${t}.xlsx`,[{name:'Don hang',rows,cols:[11,13,10,16,16,10,28,30,10,28,7,7,6,6,6,11,11,12,18,12,8,12,8,12,12,14,13,11,30]}])}
function viewAllOrders(v){orderListView(v,R.orders,{title:'Tất cả đơn hàng',who:'saleId',extra:'<div class="tiny muted">Hiển thị đơn 3 tháng gần nhất. Kỳ cũ hơn xem ở Tổng quan → Xuất Excel.</div>'})}

/* ================= QUẢN LÝ: DANH MỤC ================= */
function viewCatalog(v){const T=R.ui.catTab,q=noAcc(R.ui.catQ);
  let body='';
  if(T==='products'){const L=sortedProducts().filter(p=>wAll(pHay(p),q));
    body=`<div class="hrow"><button class="btn sm pri" id="cNew">+ Thêm sản phẩm</button><button class="btn sm" id="cImp">Nhập Excel</button><button class="btn sm" id="cTpl">File mẫu</button><button class="btn sm" id="cExp">Xuất Excel</button></div>
     <div class="group">${L.slice(0,300).map(p=>`<div class="row tap" data-ep="${esc(p.code)}"><div class="grow"><div class="t ell">${esc(p.name)}${p.active===false?' <span class="chip">Ngừng bán</span>':''}</div><div class="s">${esc(p.code)} · ${esc(p.unit)}${p.group?' · '+esc(p.group):''}</div></div><div class="money">${p.price?vnd(p.price):'<span class="chip w">Chưa có giá</span>'}</div></div>`).join('')||'<div class="empty">Chưa có sản phẩm.</div>'}</div>`}
  else if(T==='customers'){const L=[...R.customers.values()].filter(c=>wMatch(custNorm(c),q)).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
    body=`<div class="hrow"><button class="btn sm pri" id="cNew">+ Thêm khách</button><button class="btn sm" id="cImp">Nhập Excel (MISA)</button><button class="btn sm" id="cTpl">File mẫu</button></div>
     <div class="group">${L.slice(0,300).map(c=>`<div class="row tap" data-ec="${esc(c.code)}"><div class="grow"><div class="t ell">${esc(c.name)}</div><div class="s ell">${esc(c.code)} · ${esc(c.address||'Chưa có địa chỉ')}</div></div>${R.prices.has(c.code)?'<span class="chip g">Giá riêng</span>':custPL(c).length?`<span class="chip">${esc(custPL(c)[0].replace(/^PL\s*/i,''))}</span>`:''}</div>`).join('')||'<div class="empty">Chưa có khách hàng.</div>'}</div>${L.length>300?'<div class="tiny muted">Hiện 300/'+L.length+'. Dùng ô tìm.</div>':''}`}
  else if(T==='prices'){const L=[...R.prices.values()].filter(p=>!String(p.cust).startsWith('G:')).map(p=>({p,c:findCust(p.cust)})).filter(x=>!q||noAcc(x.p.cust+' '+(x.c?x.c.name:'')).includes(q));
    const gc=new Map();const priced=new Set([...R.prices.values()].filter(p=>String(p.cust).startsWith('G:')).map(p=>p.cust.slice(2)));for(const c of R.customers.values())for(const g of new Set([...(c.groups||[]),...custPL(c)]))if(priced.has(g)||/^PL\b/i.test(g))gc.set(g,(gc.get(g)||0)+1);for(const p of R.prices.values())if(String(p.cust).startsWith('G:')&&!gc.has(p.cust.slice(2)))gc.set(p.cust.slice(2),0);
    const groups=[...gc.entries()].sort((a,b)=>b[1]-a[1]);
    body=`<div class="alert b">Thứ tự lấy giá khi lên đơn: giá riêng của khách → giá theo nhóm khách hàng (chính sách giá MISA) → giá bán lần trước → giá chung của sản phẩm. Danh mục và giá được đồng bộ từ MISA mỗi sáng.</div>
     <div class="hrow"><button class="btn sm pri" id="cImp">Nhập bảng giá Excel</button><button class="btn sm" id="cTpl">File mẫu</button></div>
     <div class="sec" style="margin-top:4px">Bảng giá theo nhóm khách (${groups.length})</div>
     <div class="group">${groups.map(([g,n])=>{const P=R.prices.get('G:'+g);const k=P?Object.keys(P.items||{}).length:0;return `<div class="row tap" data-epr="${esc('G:'+g)}"><div class="grow"><div class="t ell">${esc(g)}</div><div class="s">${n} khách · ${k} sản phẩm có giá</div></div>${k?'<span class="chip g">Có giá</span>':'<span class="chip w">Chưa có giá</span>'}</div>`}).join('')||'<div class="empty">Chưa có nhóm giá.</div>'}</div>
     <div class="sec">Bảng giá riêng từng khách (${L.length})</div>
     <div class="group">${L.map(x=>`<div class="row tap" data-epr="${esc(x.p.cust)}"><div class="grow"><div class="t ell">${esc(x.c?x.c.name:x.p.cust)}</div><div class="s">${esc(x.p.cust)} · ${Object.keys(x.p.items||{}).length} sản phẩm</div></div><span class="chev">›</span></div>`).join('')||'<div class="empty">Chưa có giá riêng cho khách nào.</div>'}</div>`}
  else if(T==='staff'){const reqs=[...R.requests.keys()].filter(id=>!R.staff.has(id));const L=[...R.staff.entries()];
    body=`${R.isOwner?'':'<div class="alert w">Chỉ chủ tài khoản mới phân quyền được.</div>'}
     ${reqs.length?`<div class="sec" style="margin-top:0">Chờ phân quyền (${reqs.length})</div><div class="group">${reqs.map(id=>`<div class="row tap" data-es="${esc(id)}"><div class="grow"><div class="t">${esc(R.names[id]||'Người dùng mới')}</div><div class="s">Bấm để giao vai trò</div></div><span class="badge">Mới</span></div>`).join('')}</div>`:''}
     <div class="sec">Nhân viên (${L.length})</div><div class="group">${L.map(([id,s])=>`<div class="row tap" data-es="${esc(id)}"><div class="grow"><div class="t">${esc(staffName(id))}${s.active===false?' <span class="chip">Đã khóa</span>':''}</div><div class="s">${ROLE_NAME[s.role]||s.role}${s.role==='sale'?' · hoa hồng '+fmt(s.pct!=null&&s.pct!==''?s.pct:ST().salePct)+'%':''}</div></div><span class="chev">›</span></div>`).join('')||'<div class="empty">Chưa có nhân viên. Gửi link app cho nhân viên, họ tự tạo tài khoản và sẽ hiện ở mục Chờ phân quyền.</div>'}</div>`}
  v.innerHTML=`<h1 class="big">Danh mục</h1><div class="stack"><div class="seg">${[['products','Sản phẩm'],['customers','Khách hàng'],['prices','Bảng giá'],['staff','Nhân viên']].map(([k,l])=>`<button data-ct="${k}" class="${T===k?'on':''}">${l}${k==='staff'&&[...R.requests.keys()].some(id=>!R.staff.has(id))?' •':''}</button>`).join('')}</div>
   ${T!=='staff'?`<input id="cQ" placeholder="Tìm kiếm" value="${esc(R.ui.catQ)}">`:''}${body}</div>`;
  $$('[data-ct]').forEach(b=>b.onclick=()=>{R.ui.catTab=b.dataset.ct;R.ui.catQ='';render()});const qi=$('#cQ');if(qi)qi.oninput=()=>{R.ui.catQ=qi.value;render()};
  const on=(id,f)=>{const e=$('#'+id);if(e)e.onclick=f};
  on('cNew',()=>T==='products'?editProduct(null):editCustomer(null));
  on('cImp',()=>importXls(T));on('cTpl',()=>templateXls(T));
  on('cExp',()=>xlsxFile('San_pham.xlsx',[{name:'San pham',rows:[['Mã hàng','Tên hàng','ĐVT','Nhóm','Đơn giá','Tồn đầu kỳ','Tồn tối thiểu','Tồn hiện tại'],...sortedProducts().map(p=>[p.code,p.name,p.unit,p.group||'',toNum(p.price),toNum(p.openingQty),toNum(p.minQty)||'',stockMap().get(p.code)||0])]}]));
  $$('[data-ep]').forEach(r=>r.onclick=()=>editProduct(findProd(r.dataset.ep)));
  $$('[data-ec]').forEach(r=>r.onclick=()=>editCustomer(findCust(r.dataset.ec)));
  $$('[data-epr]').forEach(r=>r.onclick=()=>editPrices(r.dataset.epr));
  $$('[data-es]').forEach(r=>r.onclick=()=>editStaff(r.dataset.es))}
function editProduct(p){const isNew=!p;p=p||{code:'',name:'',unit:'',group:'',price:'',openingQty:0,minQty:0,active:true};
  openSheet(isNew?'Sản phẩm mới':'Sửa sản phẩm',`<label class="f">Mã hàng *<input id="ep_code" value="${esc(p.code)}" ${isNew?'':'readonly'}></label><label class="f">Tên hàng *<input id="ep_name" value="${esc(p.name)}"></label>
   <div class="fgrid"><label class="f">Đơn vị tính *<input id="ep_unit" value="${esc(p.unit)}"></label><label class="f">Nhóm<input id="ep_group" value="${esc(p.group||'')}"></label><label class="f">Giá bán chung<input id="ep_price" inputmode="numeric" class="num" value="${esc(p.price||'')}"></label>
   <label class="f">Tồn đầu kỳ<input id="ep_open" inputmode="decimal" class="num" value="${esc(p.openingQty||0)}"></label><label class="f">Tồn tối thiểu<input id="ep_min" inputmode="decimal" class="num" value="${esc(p.minQty||'')}"></label></div>
   <div class="group"><div class="toggle"><span style="font-weight:600">Đang bán</span><input type="checkbox" class="sw" id="ep_act" ${p.active!==false?'checked':''}></div></div><div id="ep_msg"></div><button class="btn block pri" id="ep_save">Lưu sản phẩm</button>`,b=>{
    b.querySelector('#ep_save').onclick=async()=>{const code=$('#ep_code').value.trim(),name=$('#ep_name').value.trim(),unit=$('#ep_unit').value.trim();const m=$('#ep_msg');
      if(!code||!name||!unit){m.innerHTML='<div class="alert r">Cần đủ mã, tên, đơn vị tính.</div>';return}if(isNew&&findProd(code)){m.innerHTML='<div class="alert r">Mã đã tồn tại.</div>';return}
      const d={code,name,unit,group:$('#ep_group').value.trim(),price:Math.round(toNum($('#ep_price').value)),openingQty:r3(toNum($('#ep_open').value)),minQty:r3(toNum($('#ep_min').value)),active:$('#ep_act').checked,updatedAt:Date.now(),updatedBy:R.uid};
      try{await R.db.doc('products/'+idFor(code)).set(d);toast('Đã lưu '+code);closeSheet()}catch(e){m.innerHTML='<div class="alert r">Không lưu được ('+esc(e.code||'')+').</div>'}}})}
function editPrices(cust){const P=R.prices.get(cust)||{cust,items:{}};const c=findCust(cust)||(String(cust).startsWith('G:')?{name:'Nhóm '+cust.slice(2)}:null);const items=Object.assign({},P.items);let q='';
  const draw=b=>{const nq=noAcc(q);const codes=Object.keys(items).sort();
    b.innerHTML=`<div class="tiny muted">${esc(c?c.name:cust)} · ${codes.length} sản phẩm có giá riêng</div><button class="btn" id="prAdd">+ Thêm sản phẩm vào bảng giá</button>
     <div class="group">${codes.filter(k=>{const p=findProd(k);return !nq||noAcc(k+' '+(p?p.name:'')).includes(nq)}).map(k=>{const p=findProd(k);return `<div class="row"><div class="grow"><div class="t ell">${esc(p?p.name:k)}</div><div class="s">${esc(k)}${p&&p.price?' · giá chung '+vnd(p.price):''}</div></div><input data-pr="${esc(k)}" inputmode="numeric" class="num" value="${esc(items[k])}" style="width:120px"><button class="btn sm danger" data-prx="${esc(k)}">×</button></div>`}).join('')||'<div class="empty">Chưa có giá riêng.</div>'}</div>
     <button class="btn block pri" id="prSave">Lưu bảng giá</button>`;
    $$('[data-pr]',b).forEach(i=>i.oninput=()=>items[i.dataset.pr]=Math.round(toNum(i.value)));$$('[data-prx]',b).forEach(x=>x.onclick=()=>{delete items[x.dataset.prx];draw(b)});
    b.querySelector('#prAdd').onclick=()=>{const keep=items;pickProduct(null,p=>{if(p){keep[p.code]=keep[p.code]??toNum(p.price)}editPricesReopen(cust,keep)})};
    b.querySelector('#prSave').onclick=async()=>{try{await R.db.doc('prices/'+idFor(cust)).set({cust,items,updatedAt:Date.now(),updatedBy:R.uid});toast('Đã lưu bảng giá');closeSheet()}catch(e){toast('Không lưu được')}}};
  openSheet('Bảng giá khách','',draw)}
function editPricesReopen(cust,items){R.prices.set(cust,Object.assign({},R.prices.get(cust)||{cust},{items,_dirty:1}));editPrices(cust)}
function editStaff(id){const s=R.staff.get(id)||{role:'sale',name:'',pct:'',active:true};const ro=!R.isOwner;
  openSheet('Phân quyền',`<div class="tiny muted">Tài khoản: ${esc(R.names[id]||id)}</div>
   <label class="f">Vai trò<select id="es_role" ${ro?'disabled':''}>${Object.entries(ROLE_NAME).map(([k,l])=>`<option value="${k}" ${s.role===k?'selected':''}>${l}</option>`).join('')}</select></label>
   <label class="f">Tên hiển thị<input id="es_name" value="${esc(s.name||R.names[id]||'')}" ${ro?'readonly':''}></label>
   <label class="f">% hoa hồng (cho sale, để trống dùng mức chung ${fmt(ST().salePct)}%)<input id="es_pct" inputmode="decimal" class="num" value="${esc(s.pct??'')}" ${ro?'readonly':''}></label>
   <div class="group"><div class="toggle"><span style="font-weight:600">Cho phép sử dụng</span><input type="checkbox" class="sw" id="es_act" ${s.active!==false?'checked':''} ${ro?'disabled':''}></div></div>
   ${ro?'':'<button class="btn block pri" id="es_save">Lưu</button>'}
   ${!ro&&window.vibaAdmin&&id!==R.uid?'<div class="sec">Mật khẩu</div><div id="es_pwBox" class="stack"><button class="btn block" id="es_reset">Cấp lại mật khẩu</button><div class="tiny muted">Dùng khi nhân viên quên mật khẩu. App tạo mật khẩu tạm 6 số, tài khoản và dữ liệu cũ giữ nguyên.</div></div>':''}`,b=>{const sv=b.querySelector('#es_save');
    const rs=b.querySelector('#es_reset');if(rs)rs.onclick=()=>{const box=b.querySelector('#es_pwBox');
      box.innerHTML=`<div class="alert w">Mật khẩu cũ của ${esc(staffName(id))} sẽ không dùng được nữa.</div><button class="btn block pri" id="es_resetOk">Xác nhận cấp mật khẩu mới</button>`;
      box.querySelector('#es_resetOk').onclick=async()=>{box.innerHTML='<div class="empty">Đang tạo mật khẩu…</div>';
        try{const r=await window.vibaAdmin.resetPassword(id);box.innerHTML=`<div class="card stack"><div class="tiny muted">Gửi cho nhân viên để đăng nhập:</div><div>${loginLabel(r.email)}</div><div>Mật khẩu mới: <b style="font-size:22px;letter-spacing:2px" class="num">${esc(r.password)}</b></div><button class="btn sm" id="es_copy">Sao chép</button><div class="tiny muted">Nhân viên nên tự đổi mật khẩu sau khi đăng nhập (nút Đổi MK cạnh Đăng xuất).</div></div>`;
          const cp=box.querySelector('#es_copy');cp.onclick=()=>{const t=(/@sdt\.viba$/.test(r.email)?'Số điện thoại: '+r.email.split('@')[0]:'Email: '+r.email)+'\nMật khẩu: '+r.password;try{navigator.clipboard.writeText(t).then(()=>toast('Đã sao chép'),()=>{})}catch(e){}}}
        catch(e){box.innerHTML=`<div class="alert r">Không cấp được: ${esc(e.message||'')}</div>`}}};
    if(sv)sv.onclick=async()=>{
    const d={role:$('#es_role').value,name:$('#es_name').value.trim(),pct:$('#es_pct').value===''?null:toNum($('#es_pct').value),active:$('#es_act').checked,updatedAt:Date.now()};
    try{await R.db.doc('staff/'+id).set(d);toast('Đã phân quyền');closeSheet()}catch(e){toast('Không lưu được ('+(e.code||'')+')')}}})}

/* ===== nhập Excel ===== */
async function readRows(file){const wb=XLSX.read(await file.arrayBuffer());return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''})}
function findHeader(rows,test){for(let i=0;i<Math.min(20,rows.length);i++){const n=rows[i].map(noAcc);if(test(n))return i}return -1}
async function writeMany(coll,docs,label){let ok=0,fail=0,i=0;const prog=t=>toast(label+': '+t);
  const worker=async()=>{while(i<docs.length){const d=docs[i++];for(let a=0;a<4;a++){try{await R.db.doc(coll+'/'+d.id).set(d.data);ok++;break}catch(e){if((e.code==='resource_exhausted'||e.code==='unavailable')&&a<3){await new Promise(r=>setTimeout(r,800*(a+1)));continue}fail++;break}}if((ok+fail)%25===0)prog(`${ok+fail}/${docs.length}`)}};
  await Promise.all([1,2,3,4,5].map(worker));toast(`${label}: đã ghi ${ok}${fail?', lỗi '+fail:''}`);return ok}
function importXls(T){const inp=$('#fileXls');inp.value='';inp.onchange=async()=>{const f=inp.files[0];if(!f)return;if(!window.XLSX)return toast('Thư viện Excel đang tải');let rows;try{rows=await readRows(f)}catch(e){return toast('Không đọc được file')}
  if(T==='products'){const h=findHeader(rows,n=>n.some(c=>c.startsWith('ma'))&&n.some(c=>c.startsWith('ten')));if(h<0)return toast('Không thấy cột Mã và Tên');const H=rows[h].map(noAcc);const col=fn=>H.findIndex(fn);
    const c={code:col(x=>x.startsWith('ma')&&!x.includes('nhom')&&!x.includes('kho')),name:col(x=>x.startsWith('ten')),unit:col(x=>x==='dvt'||x.startsWith('don vi')),group:col(x=>x.includes('nhom')),price:col(x=>x.includes('gia')),open:col(x=>x.includes('ton dau')),min:col(x=>x.includes('toi thieu'))};
    const docs=[];for(let i=h+1;i<rows.length;i++){const r=rows[i];const code=String(r[c.code]??'').trim(),name=String(r[c.name]??'').trim();if(!code||!name)continue;const ex=findProd(code)||{};
      docs.push({id:idFor(code),data:{code,name,unit:c.unit>=0?String(r[c.unit]).trim():(ex.unit||''),group:c.group>=0?String(r[c.group]).trim():(ex.group||''),price:c.price>=0?Math.round(toNum(r[c.price])):toNum(ex.price),openingQty:c.open>=0?r3(toNum(r[c.open])):toNum(ex.openingQty),minQty:c.min>=0?r3(toNum(r[c.min])):toNum(ex.minQty),active:ex.active!==false,updatedAt:Date.now(),updatedBy:R.uid}})}
    if(await confirmSheet('Nhập '+docs.length+' sản phẩm?',`Từ file ${esc(f.name)}. Mã đã có sẽ được cập nhật.${c.price<0?' File không có cột giá.':''}`,'Nhập'))writeMany('products',docs,'Sản phẩm')}
  else if(T==='customers'){const list=parseCustomers(rows);if(!list)return toast('Không thấy cột Mã và Tên khách');
    if(!await confirmSheet('Nhập '+list.length+' khách hàng?','Từ file '+esc(f.name)+'. Khách trùng mã sẽ được cập nhật theo file.','Nhập'))return;
    if(list.length>150){const ts=Date.now().toString(36);const docs=[];for(let i=0;i<list.length;i+=200)docs.push({id:'imp-'+ts+'-'+String(i/200).padStart(3,'0'),data:{items:list.slice(i,i+200),at:Date.now(),by:R.uid}});await writeMany('custpack',docs,'Khách hàng')}
    else writeMany('customers',list.map(c=>({id:idFor(c.code),data:Object.assign(c,{updatedAt:Date.now(),updatedBy:R.uid})})),'Khách hàng')}
  else if(T==='prices'){importPrices(rows,f.name)}};inp.click()}
function parseCustomers(rows){const h=findHeader(rows,n=>n.some(c=>c.startsWith('ma'))&&n.some(c=>c.startsWith('ten')));if(h<0)return null;const H=rows[h].map(noAcc);const col=fn=>H.findIndex(fn);
  const c={code:col(x=>x==='ma khach hang'||x==='ma doi tuong'),name:col(x=>x==='ten khach hang'||x==='ten doi tuong'||x.startsWith('ten')),addr:col(x=>x==='dia chi'),ship:col(x=>x==='dia diem giao hang'),alt:col(x=>x.includes('dia diem giao hang khac')),
    tel:col(x=>x==='dien thoai'),mob:col(x=>x==='di dong'||x==='sdt'),prov:col(x=>x.startsWith('tinh')),grp:col(x=>x.includes('nhom khach')),tax:col(x=>x==='ma so thue'),stop:col(x=>x.includes('ngung theo doi'))};
  if(c.code<0)c.code=col(x=>x.startsWith('ma'));const S=(r,i)=>i>=0?String(r[i]??'').trim():'';const out=[];
  for(let i=h+1;i<rows.length;i++){const r=rows[i];const code=S(r,c.code),name=S(r,c.name);if(!code||!name)continue;const groups=S(r,c.grp).split(';').map(x=>x.trim()).filter(Boolean);
    out.push({code,name,address:S(r,c.ship)||S(r,c.addr),billAddr:S(r,c.addr),alt:S(r,c.alt),phone:S(r,c.tel)||S(r,c.mob),area:S(r,c.prov),taxCode:S(r,c.tax),groups,pl:groups.filter(g=>/^PL\b/i.test(g)),stopped:/^c/i.test(S(r,c.stop))})}
  return out}
async function importPrices(rows,fname){
  const allG=new Set();for(const c of R.customers.values())for(const g of (c.groups||[]).concat(custPL(c)))allG.add(g);
  const custOf=v=>{v=String(v??'').trim();if(!v)return null;const nv=noAcc(v);for(const g of allG)if(noAcc(g)===nv||noAcc(g.replace(/^PL\s*/i,''))===nv)return 'G:'+g;const c=findCust(v);if(c)return c.code;const n=noAcc(v);for(const x of R.customers.values())if(noAcc(x.name)===n)return x.code;return null};
  const prodOf=v=>{v=String(v??'').trim();if(!v)return null;const p=findProd(v);if(p)return p.code;const n=noAcc(v);for(const x of R.products.values())if(noAcc(x.name)===n)return x.code;return null};
  const map=new Map();let skipped=0;
  let h=findHeader(rows,n=>n.some(c=>c.includes('khach')||c.includes('doi tuong')||c.includes('nhom'))&&n.some(c=>c.startsWith('ma hang')||c.startsWith('ma sp')||c.startsWith('ma vt')||c.includes('san pham')||c.startsWith('ten hang'))&&n.some(c=>c.includes('gia')));
  if(h>=0){const H=rows[h].map(noAcc);const ci=H.findIndex(x=>x.includes('khach')||x.includes('doi tuong')||x.includes('nhom'));const pi=H.findIndex(x=>x.startsWith('ma hang')||x.startsWith('ma sp')||x.startsWith('ma vt'))>=0?H.findIndex(x=>x.startsWith('ma hang')||x.startsWith('ma sp')||x.startsWith('ma vt')):H.findIndex(x=>x.includes('san pham')||x.startsWith('ten hang'));const gi=H.findIndex(x=>x.includes('gia'));
    for(let i=h+1;i<rows.length;i++){const r=rows[i];const c=custOf(r[ci]),p=prodOf(r[pi]),g=toNum(r[gi]);if(!r[ci]&&!r[pi])continue;if(!c||!p||!g){skipped++;continue}if(!map.has(c))map.set(c,{});map.get(c)[p]=Math.round(g)}}
  else{/* dạng ma trận: cột đầu là khách, các cột sau là mã/tên sản phẩm */h=findHeader(rows,n=>n.filter(Boolean).length>=2);if(h<0)return toast('Không nhận ra cấu trúc bảng giá');const H=rows[h];const pc=H.map((x,j)=>j===0?null:prodOf(x));
    for(let i=h+1;i<rows.length;i++){const r=rows[i];if(!r[0])continue;const c=custOf(r[0]);if(!c){skipped++;continue}for(let j=1;j<r.length;j++){if(!pc[j])continue;const g=toNum(r[j]);if(g>0){if(!map.has(c))map.set(c,{});map.get(c)[pc[j]]=Math.round(g)}}}}
  const n=[...map.values()].reduce((s,x)=>s+Object.keys(x).length,0);
  if(!map.size)return toast('Không khớp được khách/sản phẩm nào. Kiểm tra mã trong file.');
  if(!await confirmSheet('Nhập bảng giá?',`${fname}: ${[...map.keys()].filter(k=>k.startsWith('G:')).length} nhóm giá + ${[...map.keys()].filter(k=>!k.startsWith('G:')).length} khách, ${n} mức giá.${skipped?' '+skipped+' dòng không khớp mã khách hoặc sản phẩm bị bỏ qua.':''} Giá mới sẽ ghi đè giá cũ cùng sản phẩm.`,'Nhập bảng giá'))return;
  const docs=[...map.entries()].map(([c,items])=>({id:idFor(c),data:{cust:c,items:Object.assign({},(R.prices.get(c)||{}).items||{},items),updatedAt:Date.now(),updatedBy:R.uid}}));writeMany('prices',docs,'Bảng giá')}
function templateXls(T){if(T==='products')xlsxFile('Mau_san_pham.xlsx',[{name:'San pham',rows:[['Mã hàng','Tên hàng','ĐVT','Nhóm','Đơn giá','Tồn đầu kỳ','Tồn tối thiểu'],['VD-01','Ví dụ: Cam Cao Phong','kg','Trái cây',45000,100,10]]}]);
  else if(T==='customers')xlsxFile('Mau_khach_hang.xlsx',[{name:'Khach hang',rows:[['Mã khách hàng','Tên khách hàng','Địa chỉ','Điện thoại','Khu vực'],['KH-VD','Ví dụ: Cửa hàng Minh An','12 Lê Lợi, Q.1','0900000000','Tuyến 1']]}]);
  else xlsxFile('Mau_bang_gia.xlsx',[{name:'Bang gia',rows:[['Mã khách hàng hoặc Nhóm khách','Mã hàng','Đơn giá'],['PL Nhóm khách sỉ','VD-01',42000],['KH-VD','VD-01',41000]]}])}

/* ================= CÀI ĐẶT ================= */

/* ================= v31: NHÂN VIÊN DÙNG APP (đăng nhập bằng SĐT) =================
   config/staffPre = {list:[{name,phone,role:'sale'|'ship'|'kho',email,active}]}. Máy chủ chỉ cho tạo tài khoản <sđt>@sdt.viba nếu SĐT có trong danh sách và tự gán staff/{uid}. */
const PRE_ROLE={ship:'Giao hàng',sale:'Bán hàng',kho:'Thủ kho',admin:'Quản lý'};
const normPhone=v=>{let d=String(v||'').replace(/\D/g,'');if(d.startsWith('84')&&d.length===11)d='0'+d.slice(2);return d};
const fmtPhone=p=>String(p||'').replace(/^(\d{4})(\d{3})(\d+)$/,'$1 $2 $3');
const loginLabel=e=>{const m=String(e||'').match(/^(\d+)@sdt\.viba$/);return m?'Số điện thoại: <b>'+esc(fmtPhone(m[1]))+'</b>':'Email: <b>'+esc(e)+'</b>'};
function preList(){return ((R.staffPre&&R.staffPre.list)||[]).slice()}
function preActive(p){const f=[...R.staff.entries()].find(([u,s])=>s&&normPhone(s.phone)===normPhone(p));return f?f[0]:null}
function staffPreEditor(box,ro){const draw=()=>{const L=preList();
  box.innerHTML=`<div class="tiny muted">Danh sách số điện thoại được phép dùng app. Nhân viên đăng nhập lần đầu bằng số điện thoại → tự tạo mật khẩu → app tự gán đúng quyền.</div>
   ${L.length?`<div class="tw"><table><thead><tr><th>Họ tên</th><th>SĐT</th><th>App</th><th>Trạng thái</th></tr></thead><tbody>${L.map((x,i)=>{const u=preActive(x.phone);return `<tr data-sp="${i}" style="cursor:pointer"><td>${esc(x.name)}</td><td class="num">${esc(fmtPhone(x.phone))}</td><td>${esc(PRE_ROLE[x.role]||x.role)}</td><td>${x.active===false?'<span class="chip r">Đã khóa</span>':u?'<span class="chip g">Đã kích hoạt</span>':'<span class="chip">Chưa đăng nhập</span>'}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Chưa có nhân viên nào.</div>'}
   ${ro?'':'<button class="btn" id="spAdd">+ Thêm nhân viên</button><div class="tiny muted">Bấm một dòng để sửa tên, SĐT, quyền app, khóa hoặc cấp mật khẩu tạm.</div>'}`;
  if(ro)return;box.querySelector('#spAdd').onclick=()=>edit(-1);box.querySelectorAll('[data-sp]').forEach(r=>r.onclick=()=>edit(+r.dataset.sp))};
 const save=async L=>{await R.db.doc('config/staffPre').set({list:L,updatedAt:Date.now()});R.staffPre={list:L}};
 const edit=i=>{const L=preList();const x=i>=0?Object.assign({},L[i]):{name:'',phone:'',role:'sale',active:true};const uid=i>=0?preActive(x.phone):null;
  openSheet(i>=0?'Sửa nhân viên':'Thêm nhân viên',`<div class="stack"><label class="f">Họ và tên<input id="sp_n" value="${esc(x.name)}"></label>
   <label class="f">Số điện thoại<input id="sp_p" type="tel" inputmode="tel" value="${esc(x.phone)}" ${uid?'readonly':''}></label>${uid?'<div class="tiny muted">Đã kích hoạt nên không đổi được số. Muốn đổi số: khóa dòng này và thêm dòng mới.</div>':''}
   <label class="f">Dùng app<select id="sp_r">${Object.entries(PRE_ROLE).map(([k,l])=>`<option value="${k}" ${x.role===k?'selected':''}>${l}</option>`).join('')}</select></label>
   <label class="f">Gmail (không bắt buộc)<input id="sp_e" value="${esc(x.email||'')}"></label>
   <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="sp_a" ${x.active!==false?'checked':''} style="width:20px;height:20px;min-height:0"> Cho phép dùng app</label>
   <div id="sp_m"></div><button class="btn block pri" id="sp_s">Lưu</button>
   ${uid?'<button class="btn block" id="sp_pw">Cấp mật khẩu tạm</button><div id="sp_pwb"></div>':''}${i>=0&&!uid?'<button class="btn block danger" id="sp_d">Xóa khỏi danh sách</button>':''}</div>`,b=>{
   const m=t=>b.querySelector('#sp_m').innerHTML=t?`<div class="alert r">${esc(t)}</div>`:'';
   b.querySelector('#sp_s').onclick=async()=>{const n=b.querySelector('#sp_n').value.trim().replace(/\s+/g,' '),p=normPhone(b.querySelector('#sp_p').value);
     if(!n)return m('Nhập họ và tên.');if(!/^0\d{9}$/.test(p))return m('Số điện thoại phải có 10 số, bắt đầu bằng 0.');
     if(L.some((y,j)=>j!==i&&normPhone(y.phone)===p))return m('Số '+fmtPhone(p)+' đã có trong danh sách.');
     const nx={name:n,phone:p,role:b.querySelector('#sp_r').value,email:b.querySelector('#sp_e').value.trim(),active:b.querySelector('#sp_a').checked};if(i>=0)L[i]=nx;else L.push(nx);
     try{await save(L);if(uid){const st=R.staff.get(uid)||{};await R.db.doc('staff/'+uid).set(Object.assign({},st,{name:n,role:nx.role,phone:p,active:nx.active}))}closeSheet();toast('Đã lưu');draw()}catch(e){m('Không lưu được: '+(e.message||e.code||''))}};
   const d=b.querySelector('#sp_d');if(d)d.onclick=async()=>{L.splice(i,1);try{await save(L);closeSheet();draw()}catch(e){m('Không xóa được')}};
   const pw=b.querySelector('#sp_pw');if(pw)pw.onclick=async()=>{const pb=b.querySelector('#sp_pwb');pb.innerHTML='<div class="empty">Đang tạo mật khẩu…</div>';
     try{const r=await window.vibaAdmin.resetPassword(uid);pb.innerHTML=`<div class="card stack"><div class="tiny muted">Gửi cho nhân viên để đăng nhập:</div><div>${loginLabel(r.email)}</div><div>Mật khẩu tạm: <b style="font-size:22px;letter-spacing:2px" class="num">${esc(r.password)}</b></div><div class="tiny muted">Nhân viên nên tự đổi mật khẩu sau khi đăng nhập (nút Đổi MK).</div></div>`}catch(e){pb.innerHTML=`<div class="alert r">Không cấp được: ${esc(e.message||'')}</div>`}}})};
 draw()}
function viewSettings(v){const s=ST(),ro=!R.isOwner;const F=(k,l,t)=>`<label class="f">${l}<input id="s_${k}" ${t?'type="'+t+'"':''} value="${esc(s[k]??'')}" ${ro?'readonly':''} ${t==='number'?'class="num"':''}></label>`;
  v.innerHTML=`<h1 class="big">Cài đặt</h1><div class="stack">${ro?'<div class="alert w">Chỉ chủ tài khoản sửa được cài đặt.</div>':''}
   <div class="sec" style="margin-top:0">Nhân viên dùng app</div><div id="spEd" class="stack"></div>
   <div class="sec">Tuyến giao</div><div id="rtEd" class="stack"></div>
   <div class="sec">Lương & hoa hồng</div><div class="card"><div class="fgrid">${F('saleBase','Lương cứng sale (đ/tháng)','number')}${F('saleAllow','Phụ cấp sale (đ/tháng)','number')}${F('saleStd','Công chuẩn (công/tháng)','number')}${F('saleComm','Hoa hồng sale (% doanh số)','number')}${F('coLoc','Vị trí công ty (vĩ độ, kinh độ)')}</div><div class="tiny muted" style="margin-top:8px">Mỗi ngày sale chụp 1 ảnh chấm công kèm vị trí = 1 công. Đi quá công chuẩn trả theo công thực tế. Hoa hồng tính trên đơn đã giao, giá sau khuyến mại, trước thuế, trừ hàng khách trả.</div></div>
   <div class="sec">Lương ship</div><div class="card"><div class="fgrid">${F('shipCC','Thưởng chuyên cần (đ/tháng)','number')}${F('shipCCOff','Trừ mỗi ngày nghỉ (đ)','number')}${F('shipKg','Hoa hồng chuối, dứa quả (đ/kg)','number')}${F('shipPct','Hoa hồng SP khác (% doanh số trước thuế)','number')}${F('shipSwapStd','Tỷ lệ đổi chuối công ty cho phép (%)','number')}${F('shipSwapPrice','Giá tính thưởng đổi trả (đ/kg)','number')}${F('shipFeeOut','Công đơn ship ngoài nội thành (đ/đơn, trả ngay)','number')}${F('shipFeeFar','Công đơn ship ngoài ngoại thành (đ/đơn, trả ngay)','number')}${F('shipFarCodes','Mã khu vực ngoại thành')}</div><div class="tiny muted" style="margin-top:8px">Ngày công = ngày có đơn giao thành công. Hoa hồng tính trên hàng bán (gồm hàng khách trả) + đổi + tặng, theo giá trước khuyến mại, trước thuế. Chuối gói/quả quy kg theo trọng lượng trên tên (gói 600g = 0,6 kg); dứa quả tính theo kg. Ngoại thành nhận theo mã đầu địa chỉ giao, VD (07.LB) Long Biên, (16.GL) Gia Lâm.</div></div>
   <div class="sec">Thông tin in phiếu</div><div class="card"><div class="fgrid">${F('company','Tên công ty')}${F('address','Địa chỉ')}${F('taxCode','Mã số thuế')}${F('dept','Bộ phận')}${F('whName','Tên kho')}${F('whCode','Mã kho (MISA)')}${F('whPlace','Địa điểm kho')}${F('keeper','Thủ kho')}${F('chiefAcc','Kế toán trưởng')}${F('director','Giám đốc')}</div>
   <div style="margin-top:12px">${F('circular','Dòng ghi chú mẫu chứng từ')}</div></div>
   <div class="sec">Khóa sổ</div><div class="card">${F('lockDate','Khóa sổ đến hết ngày','date')}<div class="tiny muted" style="margin-top:6px">Phiếu kho có ngày trong kỳ khóa không lập, sửa, xóa được.</div></div>
   ${ro?'':'<button class="btn block pri" id="sSave">Lưu cài đặt</button>'}
   <div class="tiny muted">Dữ liệu: ${R.products.size} sản phẩm · ${R.customers.size} khách · ${R.orders.length} đơn (3 tháng) · ${R.vouchers.length} phiếu kho.</div></div>`;
  staffPreEditor($('#spEd'),ro);routeEditor($('#rtEd'),ro);
  const b=$('#sSave');if(b)b.onclick=async()=>{const NUMK=['saleBase','saleAllow','saleStd','saleComm','salePct','shipFee','shipFeeOut','shipFeeFar','shipCC','shipCCOff','shipKg','shipPct','shipSwapStd','shipSwapPrice'];const keys=['saleBase','saleAllow','saleStd','saleComm','coLoc','salePct','shipFee','shipFeeOut','shipFeeFar','shipFarCodes','shipCC','shipCCOff','shipKg','shipPct','shipSwapStd','shipSwapPrice','company','address','taxCode','dept','whName','whCode','whPlace','keeper','chiefAcc','director','circular','lockDate'];const d={};
    keys.forEach(k=>{const el=$('#s_'+k);const v=el?el.value.trim():String(s[k]??'');d[k]=NUMK.includes(k)?toNum(v):v});try{await R.db.doc('config/main').set(d);R.settings=d;toast('Đã lưu cài đặt')}catch(e){toast('Không lưu được')}}}

function routeEditor(box,ro){const L=R.ui.rtEdit||(R.ui.rtEdit=JSON.parse(JSON.stringify(RT())));const ships=[...R.staff.entries()].filter(([i,s])=>s.role==='ship'&&s.active!==false);
  L.forEach(r=>{if(!r.ship&&r.shipHint){const f=ships.find(([i,s])=>noAcc(s.name||staffName(i))===noAcc(r.shipHint));if(f)r.ship=f[0]}});
  const draw=()=>{box.innerHTML=`<div class="tiny muted">App tự xếp đơn vào tuyến theo mã đầu địa điểm giao, ví dụ “(09.BTL)…”. Khách tỉnh “(20.TỈNH)” xếp theo cột Tuyến giao của danh mục khách (${Object.keys(tinhMap()).length} địa điểm đã gán).</div>
   ${L.map((r,i)=>`<div class="card stack" style="gap:8px"><label class="f">Tên tuyến<input data-rn="${i}" value="${esc(r.name||'')}" ${ro?'readonly':''}></label>
    <label class="f">Mã tuyến (cách nhau bởi dấu phẩy)<input data-rc="${i}" value="${esc((r.codes||[]).join(', '))}" placeholder="VD: 09.BTL, 10.TH" ${ro?'readonly':''}></label>
    <label class="f">Tài khoản ship<select data-rsh="${i}" ${ro?'disabled':''}><option value="">— Chưa gán —</option>${ships.map(([id,s])=>`<option value="${esc(id)}" ${r.ship===id?'selected':''}>${esc(s.name||staffName(id))}</option>`).join('')}</select></label>
    ${r.shipHint&&!r.ship?`<div class="tiny" style="color:var(--warn)">Theo bảng tuyến: <b>${esc(r.shipHint)}</b> – chưa có tài khoản ship này. Ship tạo tài khoản, Quản lý duyệt vai trò Giao hàng rồi chọn ở đây.</div>`:''}
    ${ro?'':`<button class="btn sm" data-rdel="${i}" style="align-self:flex-start">Xóa tuyến</button>`}</div>`).join('')||'<div class="empty">Chưa có tuyến giao.</div>'}
   ${ro?'':'<button class="btn block" id="rtAdd">+ Thêm tuyến</button><button class="btn block pri" id="rtSave">Lưu tuyến giao</button>'}`;
   const sync=()=>{$$('[data-rn]',box).forEach(x=>L[+x.dataset.rn].name=x.value.trim());$$('[data-rc]',box).forEach(x=>L[+x.dataset.rc].codes=x.value.split(/[,;·]+/).map(y=>y.trim()).filter(Boolean));$$('[data-rsh]',box).forEach(x=>L[+x.dataset.rsh].ship=x.value)};
   $$('[data-rdel]',box).forEach(x=>x.onclick=()=>{sync();L.splice(+x.dataset.rdel,1);draw()});
   const a=$('#rtAdd');if(a)a.onclick=()=>{sync();L.push({id:'r'+Date.now().toString(36),name:'',codes:[],ship:''});draw()};
   const sv=$('#rtSave');if(sv)sv.onclick=async()=>{sync();if(L.some(r=>!r.name))return toast('Tuyến nào cũng cần có tên');sv.disabled=true;
     try{await R.db.doc('config/routes').set(Object.assign({},R.routes||{},{list:L,updatedAt:Date.now()}));R.ui.rtEdit=null;toast('Đã lưu tuyến giao')}catch(e){sv.disabled=false;toast('Không lưu được ('+(e.code||'lỗi')+')')}}};
  draw()}
function pickRoutes(list){const sel=shipRtSel();const on=new Set(sel.mode==='all'?[...RT().map(r=>r.id),'none']:sel.ids);const mr=myRoutes();
  const items=[...mr,...RT().map(r=>r.id).filter(id=>!mr.includes(id)),'none'];const cnt=id=>list.filter(o=>(routeOf(o)||'none')===id).length;
  const draw=b=>{b.innerHTML=`<div class="tiny muted">Tích thêm tuyến để xem đơn của tuyến khác (giao hộ / tăng cường).</div><div class="group">${items.map(id=>{const r=routeById(id);return `<div class="row tap" data-ri="${esc(id)}"><span style="width:22px;height:22px;border-radius:6px;border:2px solid ${on.has(id)?'var(--accent)':'var(--line)'};background:${on.has(id)?'var(--accent)':'transparent'};color:#fff;display:inline-grid;place-items:center;font-weight:800;flex:none">${on.has(id)?'✓':''}</span><div class="grow"><div class="t">${mr.includes(id)?'Tuyến của tôi <span class="chip g">mặc định</span>':esc(rtLabel(id))}</div>${mr.includes(id)?`<div class="tiny muted ell">${esc(rtLabel(id))}</div>`:''}<div class="tiny" style="color:var(--accent)">${r?'Ship: '+esc(r.ship?staffName(r.ship):'—'):'Khách chưa gán tuyến'}</div></div><span class="tiny muted" style="font-weight:700">${cnt(id)} đơn</span></div>`}).join('')}</div>`;
    $$('[data-ri]',b).forEach(x=>x.onclick=()=>{const id=x.dataset.ri;on.has(id)?on.delete(id):on.add(id);draw(b)})};
  openSheet('Chọn tuyến giao','',draw,{action:'Xem',onAction:()=>{const ids=[...on];R.ui.rtSel=ids.length>=items.length?{mode:'all',ids:[]}:(ids.length===mr.length&&ids.every(x=>mr.includes(x)))?{mode:'mine',ids:mr}:{mode:'custom',ids};closeSheet();render()}})}
function pickShipDay(){const t0=today(),t1=isoAdd(t0,1);const opt=[['','Tất cả ngày'],[t0,'Hôm nay · '+dmy(t0)],[t1,'Ngày mai · '+dmy(t1)]];
  openSheet('Ngày giao',`<div class="group">${opt.map(([k,l])=>`<div class="row tap" data-dy="${k}"><div class="grow t">${l}</div>${(R.ui.shipDay||'')===k?'<span style="color:var(--accent);font-weight:800">✓</span>':''}</div>`).join('')}</div><label class="f">Hoặc chọn ngày<input type="date" id="dyPick" value="${esc(R.ui.shipDay||'')}"></label>`,b=>{
    $$('[data-dy]',b).forEach(x=>x.onclick=()=>{R.ui.shipDay=x.dataset.dy;closeSheet();render()});const i=b.querySelector('#dyPick');i.onchange=()=>{if(i.value){R.ui.shipDay=i.value;closeSheet();render()}}})}

/* ================= ĐIỀU HƯỚNG ================= */
const TABS={
  sale:[['new','Lên đơn','cart'],['orders','Đơn của tôi','list'],['att','Chấm công','cam'],['report','Báo cáo','chart']],
  ship:[['todo','Cần giao','truck'],['new','Phát sinh','cart'],['done','Đã giao','check'],['report','Báo cáo','chart']],
  kho:[['vnew','Lập phiếu','doc'],['vlist','Phiếu','list'],['stock','Tồn kho','box']],
  admin:[['dash','Tổng quan','home'],['orders','Đơn hàng','list'],['stock','Kho','box'],['catalog','Danh mục','book'],['settings','Cài đặt','gear']]};
function views(){return{
  sale:{new:viewSaleNew,orders:v=>orderListView(v,R.orders.filter(o=>o.saleId===R.uid),{title:'Đơn của tôi',emptyHint:'Đơn bạn lên sẽ hiện ở đây.'}),att:viewAttend,report:v=>viewSaleReport(v,R.uid)},
  ship:{todo:viewShipTodo,new:viewSaleNew,done:viewShipDone,report:v=>viewShipReport(v,R.uid)},
  kho:{vnew:viewKhoNew,vlist:viewKhoList,stock:viewStock,byorder:viewKhoByOrder},
  admin:{dash:viewDash,orders:viewAllOrders,stock:viewStock,catalog:viewCatalog,settings:viewSettings}}}
function go(tab){R.tab=tab;try{localStorage.setItem('viba.tab',R.mode+':'+tab)}catch(e){}render();window.scrollTo({top:0})}
/* ghép cây mới (nf) vào cây cũ (oldP) mà KHÔNG gỡ ô đang gõ (focus) khỏi trang: iPhone không đóng bàn phím, gõ tiếng Việt không bị mất chữ */
function graft(oldP,newP,focus){const nf=newP.querySelector('#'+CSS.escape(focus.id));if(!nf)return false;
  const step=(op,np)=>{if(op!==focus&&op!==oldP){for(const at of [...op.attributes])if(!np.hasAttribute(at.name))op.removeAttribute(at.name);for(const at of [...np.attributes])if(op.getAttribute(at.name)!==at.value)op.setAttribute(at.name,at.value)}
    if(op===focus){for(const k of ['oninput','onkeydown','onkeyup','onchange','onfocus','onblur','onclick'])op[k]=np[k];return}
    const oc=[...op.children].find(c=>c===focus||c.contains(focus)),nc=[...np.childNodes].find(c=>c===nf||(c.contains&&c.contains(nf)));if(!oc||!nc)return;
    for(const c of [...op.childNodes])if(c!==oc)c.remove();let before=true;for(const c of [...np.childNodes]){if(c===nc){before=false;continue}if(before)op.insertBefore(c,oc);else op.appendChild(c)}
    step(oc,nc)};
  step(oldP,newP);return true}
function render(){const role=myRole();const who=$('#who');
  if(!R.db){who.innerHTML=R.checked?'<span class="chip r">Chưa kết nối</span>':'<span class="chip">Đang kết nối…</span>';
    $('#view').innerHTML=R.checked?'<h1 class="big">VIBA FOOD</h1><div class="alert r">Không kết nối được máy chủ dữ liệu. Kiểm tra mạng rồi tải lại trang.</div>':'<div class="empty">Đang tải…</div>';$('#tabbar').hidden=true;return}
  if(!role){who.innerHTML=`<span class="chip">${esc(R.names[R.uid]||'Tài khoản mới')}</span>${window.vibaChangePw?'<button class="btn sm" onclick="vibaChangePw()">Đổi MK</button>':''}<button class="btn sm" onclick="vibaLogout()">Đăng xuất</button>`;$('#tabbar').hidden=true;$('#modeSw').innerHTML='';
    $('#view').innerHTML=`<h1 class="big">Xin chào</h1><div class="card stack"><div style="font-weight:700;font-size:17px">Tài khoản chưa được phân quyền</div><div class="muted">App đã gửi yêu cầu tới quản lý. Khi được giao vai trò (Bán hàng, Giao hàng hoặc Thủ kho), màn hình làm việc sẽ tự hiện ra.</div>${R.staff.get(R.uid)&&R.staff.get(R.uid).active===false?'<div class="alert r">Tài khoản đang bị khóa.</div>':''}</div>`;return}
  if(role!=='admin')R.mode=role;else if(!R.mode)R.mode='admin';
  const tabs=TABS[R.mode];if(!tabs.some(t=>t[0]===R.tab))R.tab=tabs[0][0];
  who.innerHTML=`<span class="chip g">${ROLE_NAME[role]}</span><span>${esc(staffName(R.uid))}</span>${window.vibaChangePw?'<button class="btn sm" onclick="vibaChangePw()">Đổi MK</button>':''}<button class="btn sm" onclick="vibaLogout()">Đăng xuất</button>`;
  $('#modeSw').innerHTML=role==='admin'?`<select id="modeSel" aria-label="Chế độ xem" style="min-height:36px;padding:6px 10px;font-size:14px;width:auto">${Object.entries(ROLE_NAME).map(([k,l])=>`<option value="${k}" ${R.mode===k?'selected':''}>${k==='admin'?'Xem: Quản lý':'Xem như '+l}</option>`).join('')}</select>`:'';
  const ms=$('#modeSel');if(ms)ms.onchange=()=>{R.mode=ms.value;R.tab=TABS[R.mode][0][0];try{localStorage.setItem('viba.tab',R.mode+':'+R.tab)}catch(e){}render()};
  const pend=[...R.requests.keys()].filter(id=>!R.staff.has(id)).length;
  $('#tabs').innerHTML=tabs.map(([k,l,ic])=>`<button data-tab="${k}" class="${R.tab===k?'on':''}" aria-current="${R.tab===k?'page':'false'}">${ICON[ic]}<span>${l}${k==='catalog'&&pend&&R.isOwner?' •':''}${k==='todo'?' ('+shipTodoCount()+')':''}</span></button>`).join('');$('#tabbar').hidden=false;
  $$('#tabs [data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
  $('#wrap').classList.toggle('wide',R.mode==='admin'||R.mode==='kho');
  const v=$('#view');const a=document.activeElement;const keep=a&&a.id&&v.contains(a)?{id:a.id,s:a.selectionStart,e:a.selectionEnd}:null;
  if(keep&&(a.tagName==='INPUT'&&!/^(checkbox|radio|file)$/.test(a.type)||a.tagName==='TEXTAREA')){const tmp=document.createElement('div');ROOT=tmp;try{views()[R.mode][R.tab](tmp)}finally{ROOT=null}
    if(graft(v,tmp,a))return finishRender()}
  views()[R.mode][R.tab](v);
  if(keep){const el=document.getElementById(keep.id);if(el){el.focus();try{if(keep.s!=null)el.setSelectionRange(keep.s,keep.e)}catch(e){}}}
  finishRender()}
function finishRender(){$('#dlShip').innerHTML=[...R.staff.entries()].filter(([i,s])=>s.role==='ship').map(([i])=>`<option value="${esc(staffName(i))}"></option>`).join('')}

/* ================= KẾT NỐI ================= */
let rT;const soon=()=>{clearTimeout(rT);rT=setTimeout(()=>{if(!$('#sheet').hidden){R._pending=true;return}const a=document.activeElement;if(a&&a.closest&&a.closest('#view')&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')&&(R.tab==='new'||R.tab==='vnew')){R._pending=true;return}render()},80)};
document.addEventListener('focusout',()=>setTimeout(()=>{if($('#sheet').hidden&&R._pending){R._pending=false;render()}},50));
let nameBusy=false;async function resolveNames(){if(!R.user||nameBusy)return;const ids=new Set([...R.staff.keys(),...R.requests.keys(),R.uid]);R.orders.forEach(o=>{o.saleId&&ids.add(o.saleId);o.shipId&&ids.add(o.shipId)});R.vouchers.forEach(v=>v.createdBy&&ids.add(v.createdBy));
  const need=[...ids].filter(i=>i&&!(i in R.names)).slice(0,64);if(!need.length)return;nameBusy=true;try{const ps=await R.user.profiles(need);need.forEach(i=>R.names[i]=(ps[i]&&ps[i].name)||'');soon()}catch(e){}finally{nameBusy=false}}
async function init(){render();let c=window.claude;for(let i=0;i<40&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use)){R.checked=true;render();return}
  const [db,user,dl]=await Promise.all([c.use('db'),c.use('user'),c.use('downloads')]);R.db=db;R.user=user;R.dl=dl;R.checked=true;
  if(user){try{R.uid=await user.id()}catch(e){}try{R.isOwner=await user.isOwner()}catch(e){}}
  if(!db||!R.uid){R.db=db;if(!R.uid)R.db=null;render();return}
  try{const t=localStorage.getItem('viba.tab');if(t){const [m,k]=t.split(':');R.mode=m;R.tab=k}}catch(e){}
  const hm=window.APP_MODE||(location.hash||'').replace('#','');if(['sale','ship','kho','admin'].includes(hm)){R.mode=hm;R.tab=null}
  const sub=(coll,fn)=>db.collection(coll).onSnapshot(s=>{fn(s);soon();resolveNames()},e=>toast('Mất kết nối '+coll+' ('+e.code+')'));
  sub('staff',s=>{R.staff=new Map(s.docs.map(d=>[d.id,d.data()]))});
  sub('config',s=>{const d=s.docs.find(x=>x.id==='custGroups');R.cgroups=d?d.data():null;const sp=s.docs.find(x=>x.id==='staffPre');R.staffPre=sp?sp.data():null;const v=s.docs.find(x=>x.id==='vatRates');R.vat=v?v.data():null});
  sub('config',s=>{const rt=s.docs.find(x=>x.id==='routes');const nr=rt?rt.data():null;if(JSON.stringify(nr)!==JSON.stringify(R.routes)){R.routes=nr;R.ui.rtSel=null}const d=s.docs.find(x=>x.id==='prodAlias');const it=(d&&d.data()||{}).items||{};R.palias=Object.fromEntries(Object.entries(it).map(([k,v])=>[k,(Array.isArray(v)?v:String(v||'').split(/[;|\n]/)).map(x=>String(x).trim()).filter(Boolean)]))});
  sub('requests',s=>{R.requests=new Map(s.docs.map(d=>[d.id,d.data()]))});
  sub('attend',s=>{R.attend=s.docs.map(d=>Object.assign({},d.data(),{id:d.id}))});
  sub('products',s=>{R.allProducts=s.docs.map(d=>d.data()).filter(p=>p&&p.code);R.products=new Map(s.docs.map(d=>[d.id,d.data()]).filter(x=>x[1]&&x[1].code&&/^(HH|TP)/i.test(String(x[1].code).trim())&&!PROD_HIDE.test(' '+noAcc(x[1].name).replace(/[^a-z0-9]+/g,' ')+' ')))});/* chỉ dùng mã hàng hoá HH và thành phẩm TP */
  sub('customers',s=>{R.custInd=new Map(s.docs.map(d=>[d.id,d.data()]).filter(x=>x[1]&&x[1].code));rebuildCustomers()});
  sub('custpack',s=>{R.custPacks=new Map(s.docs.map(d=>[d.id,(d.data()||{}).items||[]]));rebuildCustomers()});
  sub('custLoc',s=>{R.custLoc=s.docs.map(d=>Object.assign({},d.data(),{_id:d.id})).filter(x=>x&&x.cust&&isFinite(x.lat)&&isFinite(x.lng))});
  sub('prices',s=>{R.prices=new Map(s.docs.map(d=>{const x=d.data();return [x.cust,x]}))});
  sub('vouchers',s=>{R.vouchers=s.docs.map(d=>Object.assign({},d.data(),{id:d.id})).filter(v=>v.date&&v.type)});
  db.collection('orders').where('date','>=',windowStart()).onSnapshot(s=>{R.orders=s.docs.map(d=>Object.assign({},d.data(),{id:d.id}));soon();resolveNames()},e=>toast('Mất kết nối đơn hàng ('+e.code+')'));
  db.doc('config/main').onSnapshot(s=>{R.settings=s.exists?s.data():{};soon()},()=>{});
  setTimeout(async()=>{if(!myRole()&&!R.isOwner){try{const r=await db.doc('requests/'+R.uid).get();if(!r.exists)await db.doc('requests/'+R.uid).set({at:Date.now()})}catch(e){}}},2500);
  render()}
const _sheetObs=new MutationObserver(()=>{if($('#sheet').hidden)soon()});_sheetObs.observe($('#sheet'),{attributes:true,attributeFilter:['hidden']});
init();
})();
