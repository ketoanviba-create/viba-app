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
  circular:'(Kèm theo Thông tư số 99/2025/TT-BTC ngày 27/10/2025 của Bộ trưởng Bộ Tài chính)',lockDate:'',salePct:2,shipFee:20000,shipFeeOut:30000},R.settings);
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
function sortedProducts(){return [...R.products.values()].sort((a,b)=>(toNum(b.soldQty)-toNum(a.soldQty))||a.code.localeCompare(b.code,'vi'))}/* bán chạy nhất (SL bán 3 tháng gần nhất từ MISA, trừ trả lại) lên đầu */
function lastPrice(cust,code){let best=null;for(const o of R.orders){if(o.cust!==cust||o.status==='cancel')continue;for(const l of o.lines||[])if(l.code===code&&toNum(l.price)>0&&(!best||o.date>best.d))best={d:o.date,p:toNum(l.price)}}return best?best.p:null}
function defaultPrice(cust,code){const pr=R.prices.get(cust);if(pr&&pr.items&&pr.items[code]!=null)return {p:toNum(pr.items[code]),src:'Bảng giá khách'};
  {const cc=findCust(cust);const gs=[...new Set([...((cc&&cc.groups)||[]),...custPL(cc)])];for(const g of gs){const gp=R.prices.get('G:'+g);if(gp&&gp.items&&gp.items[code]!=null)return {p:toNum(gp.items[code]),src:'Giá nhóm '+g.replace(/^PL\s*/i,'')}}}
  const lp=lastPrice(cust,code);if(lp!=null)return {p:lp,src:'Giá bán lần trước'};const p=findProd(code);return {p:p?toNum(p.price):0,src:'Giá chung'}}

/* ================= ĐƠN HÀNG: TÍNH TOÁN ================= */
const lineAmt=l=>Math.round(Math.max(0,toNum(l.qty)-toNum(l.ret))*toNum(l.price));
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
  for(const o of list){if(o.status==='cancel'){s.cancel++;continue}s.orders++;const q=sumL(o,'qty');s.qty+=q;s.promo+=sumL(o,'promo');s.swap+=sumL(o,'swap');s.ret+=sumL(o,'ret');
    const t=orderTotal(o);s.revenue+=t;const pa=o.paid?Math.min(t,toNum(o.paidAmount)||t):0;s.paid+=pa;s.unpaid+=Math.max(0,t-pa);
    if((o.lines||[]).some(l=>l.listPrice!=null&&toNum(l.price)!==toNum(l.listPrice)))s.edited++;
    if(o.status==='done'){s.done++;s.doneQty+=q+sumL(o,'promo');if(o.paid&&o.paidBy==='ship')s.collected+=pa;if(o.outside)s.outside++;else s.normal++}}
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
    b.querySelector('#ppList').innerHTML=list.length?list.map(p=>{const dp=cust?defaultPrice(cust,p.code):{p:toNum(p.price)};const t=bal.get(p.code)||0;return `<div class="row tap" data-p="${esc(p.code)}"><div class="grow"><div class="t ell">${esc(p.name)}</div><div class="s">${esc(p.code)} · ${esc(p.unit)} · tồn ${fmt(t)}</div>${pAlias(p).length?`<div class="tiny" style="color:var(--accent)">${esc(pAlias(p).join(' · '))}</div>`:''}</div><div class="money">${dp.p?vnd(dp.p):''}</div></div>`}).join(''):`<div class="empty">${R.products.size?'Không tìm thấy sản phẩm.':'Chưa có sản phẩm. Quản lý cần thêm danh mục.'}</div>`;
    $$('[data-p]',b).forEach(r=>r.onclick=()=>{closeSheet();onPick(findProd(r.dataset.p))})};
  openSheet('Chọn sản phẩm',`<input id="ppQ" placeholder="Tìm tên hoặc mã sản phẩm" autocomplete="off"><div class="group pick" id="ppList"></div>`,b=>{draw(b);const i=b.querySelector('#ppQ');i.oninput=()=>{q=i.value;draw(b)};setTimeout(()=>i.focus(),50)})}

/* thêm / sửa khách */
function editCustomer(c,after,preName){const isNew=!c;c=c||{code:'',name:preName||'',address:'',phone:'',area:''};
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
function newOrderDraft(){return {id:null,cust:'',custName:'',address:'',phone:'',lines:[],paid:false,paidAmount:'',payPhotos:[],note:'',date:today(),showMore:{},delivered:true}}
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
         <div class="row" style="gap:8px;padding:0"><label class="f grow">SL<input data-vq="${i}" inputmode="decimal" class="num" value="${l.qty}"></label><label class="f grow">KM<input data-vk="${i}" inputmode="decimal" class="num" value="${l.promo||0}"></label></div></div>`).join('')}
       ${P.unknown.length?`<div class="alert w">Chưa hiểu: ${P.unknown.map(x=>'“'+esc(x)+'”').join(', ')} – thêm tay nếu cần.</div>`:''}
       ${P.paid?'<div class="tiny">✓ Đánh dấu khách <b>đã thanh toán</b>'+(P.pm?' – '+PM_NAME[P.pm]:' (chọn hình thức ở đơn)')+'</div>':''}${P.note?`<div class="tiny">Ghi chú: ${esc(P.note)}</div>`:''}
       <button class="btn block pri" id="vcOk" ${L||P.lines.length?'':'disabled'}>Điền vào đơn</button><div class="tiny muted" style="text-align:center">Điền xong vẫn phải xem lại và bấm Gửi đơn hàng.</div></div>`;
      const lq=Rb.querySelector('#vcLoc'),lqi=Rb.querySelector('#vcLocQ');let lT;if(lqi)lqi.oninput=()=>{clearTimeout(lT);lT=setTimeout(()=>{const nq=noAcc(lqi.value);if(!nq)return;locC=locIndex().filter(x=>x.loc&&wMatch(x.n,nq)).slice(0,30);lq.innerHTML=locOpts();const okb=Rb.querySelector('#vcOk');if(okb)okb.disabled=false},200)};
      const ok=Rb.querySelector('#vcOk');if(ok)ok.onclick=apply};
    const apply=()=>{const ls=Rb.querySelector('#vcLoc');if(ls&&+ls.value>=0&&locC[+ls.value]){const y=locC[+ls.value];d.cust=y.c.code;d.custName=y.c.name;d.address=y.loc||y.c.address||'';d.phone=y.c.phone||'';
        d.lines.forEach(l=>{const dp=defaultPrice(d.cust,l.code);l.listPrice=dp.p;l.price=dp.p;l.src=dp.src})}
      let n=0;P.lines.forEach((l,i)=>{const code=Rb.querySelector(`[data-vp="${i}"]`).value;if(!code)return;const p=findProd(code);if(!p)return;const q=toNum(Rb.querySelector(`[data-vq="${i}"]`).value),k=toNum(Rb.querySelector(`[data-vk="${i}"]`).value);if(!q&&!k)return;
        const ex=d.lines.find(x=>x.code===p.code);if(ex){ex.qty=r3(toNum(ex.qty)+q);ex.promo=r3(toNum(ex.promo)+k);ex.swap=r3(toNum(ex.swap)+toNum(l.swap));ex.ret=r3(toNum(ex.ret)+toNum(l.ret))}
        else{const dp=defaultPrice(d.cust,p.code);d.lines.push({code:p.code,name:p.name,unit:p.unit,qty:q,promo:k,swap:toNum(l.swap),ret:toNum(l.ret),price:dp.p,listPrice:dp.p,src:dp.src})}n++});
      if(P.paid){d.paid=true;if(P.pm)d.payMethod=P.pm}if(P.note)d.note=(d.note?d.note+'; ':'')+P.note;
      if(rec&&on)try{rec.abort()}catch(e){}closeSheet();render();toast('Đã điền '+n+' mặt hàng – kiểm tra rồi bấm Gửi đơn')};
    b.querySelector('#vcGo').onclick=show;
    if(mic){rec=new SR();rec.lang='vi-VN';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
      rec.onresult=e=>{let fin='',tmp='';for(let i=0;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript+' ';else tmp+=r[0].transcript}T.value=(base+' '+fin+tmp).trim()};
      rec.onend=()=>{on=false;mic.textContent='🎤 Nói lại';if(T.value.trim())show()};
      rec.onerror=e=>{on=false;mic.textContent='🎤 Nói lại';Rb.innerHTML=`<div class="alert r">${e.error==='not-allowed'||e.error==='service-not-allowed'?'Chưa cho phép dùng micro. Vào Cài đặt › Safari › Micro (hoặc bấm “Cho phép” khi được hỏi), hoặc bấm vào ô trên rồi dùng 🎤 của bàn phím.':e.error==='no-speech'?'Không nghe thấy tiếng nói, thử lại.':'Lỗi nhận giọng nói ('+esc(e.error)+'). Có thể dùng 🎤 của bàn phím.'}</div>`};
      mic.onclick=()=>{if(on){try{rec.stop()}catch(e){}return}base=T.value.trim();Rb.innerHTML='';try{rec.start();on=true;mic.textContent='🔴 Đang nghe… (bấm để dừng)'}catch(e){Rb.innerHTML='<div class="alert r">Không bật được micro.</div>'}};
      mic.onclick()/* tự bật micro ngay khi mở khung (vẫn trong lượt bấm của người dùng) */}
    else setTimeout(()=>T.focus(),50)},{onClose:()=>{if(rec&&on)try{rec.abort()}catch(e){}}})}

function viewSaleNew(v){if(!R.odraft)R.odraft=newOrderDraft();const d=R.odraft;const c=d.cust?findCust(d.cust):null;
  const total=orderTotal(d);const bal=stockMap();
  v.innerHTML=`<h1 class="big">${d.id?'Sửa đơn '+esc(d.no):R.mode==='ship'?'Đơn phát sinh':'Lên đơn'}</h1>${R.mode==='ship'&&!d.id?'<div class="alert" style="margin-bottom:10px">Đơn khách đặt thêm khi đang giao. Đơn ghi tên bạn là người tạo và người giao, đánh dấu <b>Phát sinh</b>.</div>':''}
  <div class="stack">
  <button class="btn block" id="oVoice" style="font-size:16px">🎤 Đọc đơn bằng giọng nói</button>
  <div class="group"><div class="row tap" id="oCust"><div class="grow">${c||d.custName?`<div class="t">${esc(c?c.name:d.custName)}</div><div class="s">${esc(d.address||'Chưa có địa chỉ giao')}${d.phone?' · '+esc(d.phone):''}</div>`:'<div class="t" style="color:var(--accent)">Chọn khách hàng</div><div class="s">Bấm để tìm hoặc thêm khách mới</div>'}</div><span class="chev">›</span></div></div>
  ${d.cust?`<label class="f">Địa chỉ giao hàng${(c&&c.alt)?' <span class="tiny">(bấm để chọn điểm giao khác)</span>':''}<input id="oAddr" list="dlAddr" value="${esc(d.address)}" placeholder="Địa chỉ giao"></label><datalist id="dlAddr">${[c&&c.address,c&&c.billAddr,...String((c&&c.alt)||'').split('|')].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i).map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist>`:''}
  <div class="sec" style="margin-bottom:0">Sản phẩm</div>
  <div class="list" id="oLines">${d.lines.map((l,i)=>lineCard(l,i,bal)).join('')}</div>
  <button class="btn" id="oAdd" ${d.cust?'':'disabled'}>${ICON.plus.replace('<svg','<svg width="18" height="18"')} Thêm sản phẩm</button>
  ${d.cust?'':'<div class="tiny muted" style="text-align:center">Chọn khách hàng trước để lấy đúng giá.</div>'}
  <div class="sec" style="margin-bottom:0">Thanh toán</div>
  <div class="group"><div class="toggle"><div><div style="font-weight:600">Khách đã thanh toán</div><div class="tiny muted">${d.paid?'Đã thu tiền':'Chưa thu, ship sẽ thu khi giao'}</div></div><input type="checkbox" class="sw" id="oPaid" ${d.paid?'checked':''} aria-label="Đã thanh toán"></div>
   ${d.paid?`<div class="row" style="flex-direction:column;align-items:stretch;gap:10px"><label class="f">Số tiền đã thu<input id="oPaidAmt" inputmode="numeric" class="num" value="${esc(d.paidAmount===''?total:d.paidAmount)}"></label>${pmSeg(d.payMethod)}${pmPhotos(d.payMethod,d.payPhotos,'pay')}</div>`:''}</div>
  <label class="f">Ghi chú cho đơn<textarea id="oNote" rows="2" placeholder="VD: giao trước 9h">${esc(d.note)}</textarea></label>
  <div class="card"><div class="totalbar"><span class="muted">${d.lines.length} sản phẩm · ${fmt(sumL(d,'qty'))} SL${sumL(d,'promo')?' · KM '+fmt(sumL(d,'promo')):''}</span><span class="money">${vnd(total)}</span></div></div>
  <div id="oMsg">${d._err||''}</div>
  ${R.mode==='ship'&&!d.id?`<div class="group"><div class="toggle"><div><div style="font-weight:600">Đã giao cho khách luôn</div><div class="tiny muted">${d.delivered!==false?'Đơn lưu ở trạng thái Đã giao':'Đơn vào mục Cần giao của bạn để giao sau'}</div></div><input type="checkbox" class="sw" id="oDeliv" ${d.delivered!==false?'checked':''} aria-label="Đã giao luôn"></div></div>`:''}
  <button class="btn block pri" id="oSave">${d.id?'Lưu thay đổi':R.mode==='ship'?'Lưu đơn phát sinh':'Gửi đơn hàng'}</button>
  ${d.id||d.lines.length||d.cust?'<button class="btn block" id="oReset">'+(d.id?'Hủy sửa':'Làm lại từ đầu')+'</button>':''}
  </div>`;
  $('#oVoice').onclick=()=>voiceOrder();
  $('#oCust').onclick=()=>pickCustomer((cu,addr)=>{if(!cu)return;d.cust=cu.code;d.custName=cu.name;d.address=addr||cu.address||'';d.phone=cu.phone||'';d.lines.forEach(l=>{const dp=defaultPrice(cu.code,l.code);l.listPrice=dp.p;l.price=dp.p;l.src=dp.src});render()});
  const a=$('#oAddr');if(a)a.oninput=()=>d.address=a.value;
  $('#oAdd').onclick=()=>pickProduct(d.cust,p=>{if(!p)return;const ex=d.lines.find(l=>l.code===p.code);if(ex){ex.qty=r3(toNum(ex.qty)+1)}else{const dp=defaultPrice(d.cust,p.code);d.lines.push({code:p.code,name:p.name,unit:p.unit,qty:1,promo:0,swap:0,ret:0,price:dp.p,listPrice:dp.p,src:dp.src})}render()});
  bindLineCards(v,d,()=>render());
  $('#oPaid').onchange=e=>{d.paid=e.target.checked;render()};$$('#view [data-pm]').forEach(x=>x.onclick=()=>{d.payMethod=x.dataset.pm;render()});
  const pa=$('#oPaidAmt');if(pa)pa.oninput=()=>d.paidAmount=pa.value;
  $('#oNote').oninput=e=>d.note=e.target.value;
  bindPhotos(v,()=>d.payPhotos,()=>render());
  const dlv=$('#oDeliv');if(dlv)dlv.onchange=e=>{d.delivered=e.target.checked;render()};
  $('#oSave').onclick=saveOrder;const rs=$('#oReset');if(rs)rs.onclick=()=>{R.odraft=newOrderDraft();render()}}
function lineCard(l,i,bal,opt){opt=opt||{};const edited=l.listPrice!=null&&toNum(l.price)!==toNum(l.listPrice);const more=opt.more||l._more||(toNum(l.promo)||toNum(l.swap)||toNum(l.ret));const t=bal?bal.get(l.code):null;
  return `<div class="line" data-li="${i}"><div class="top"><div class="nm">${esc(l.name)}<div class="tiny muted" style="font-weight:500">${esc(l.code)} · ${esc(l.unit)}${t!=null?' · tồn kho '+fmt(t):''}</div></div><button class="btn sm danger" data-ldel="${i}" aria-label="Bỏ sản phẩm">Bỏ</button></div>
   <div class="grid"><label class="f">${opt.qtyLabel||'Số lượng'}<div class="step"><button data-lstep="${i}:-1" aria-label="Giảm">−</button><input id="l${i}_qty" inputmode="decimal" value="${esc(l.qty)}"><button data-lstep="${i}:1" aria-label="Tăng">+</button></div></label>
   <label class="f"><span>Đơn giá ${edited?'<span class="edited">· đã sửa</span>':''}</span><input id="l${i}_price" inputmode="numeric" class="num" value="${esc(l.price)}"></label></div>
   ${l.listPrice!=null?`<div class="pricehint">${esc(l.src||'Giá mặc định')}: ${vnd(l.listPrice)}${edited?` · <a href="#" data-lreset="${i}" style="color:var(--accent)">Về giá mặc định</a>`:''}</div>`:''}
   ${more?`<div class="grid x3"><label class="f">Khuyến mại<input id="l${i}_promo" inputmode="decimal" class="num" value="${esc(fmt0(l.promo))}" placeholder="0"></label><label class="f">Đổi hàng<input id="l${i}_swap" inputmode="decimal" class="num" value="${esc(fmt0(l.swap))}" placeholder="0"></label><label class="f">Trả hàng<input id="l${i}_ret" inputmode="decimal" class="num" value="${esc(fmt0(l.ret))}" placeholder="0"></label></div>`
   :`<button class="btn sm" data-lmore="${i}" style="align-self:flex-start">+ Khuyến mại / Đổi trả</button>`}
   <div class="hrow"><span class="tiny muted">Thành tiền</span><span class="money right">${vnd(lineAmt(l))}</span></div></div>`}
function bindLineCards(root,d,rerender,moreKey){
  $$('[data-ldel]',root).forEach(b=>b.onclick=()=>{d.lines.splice(+b.dataset.ldel,1);rerender()});
  $$('[data-lstep]',root).forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.lstep.split(':');const l=d.lines[+i];l.qty=Math.max(0,r3(toNum(l.qty)+(+s)));rerender()});
  $$('[data-lmore]',root).forEach(b=>b.onclick=()=>{d.lines[+b.dataset.lmore]._more=1;rerender()});
  $$('[data-lreset]',root).forEach(b=>b.onclick=e=>{e.preventDefault();const l=d.lines[+b.dataset.lreset];l.price=l.listPrice;rerender()});
  d.lines.forEach((l,i)=>{['qty','price','promo','swap','ret'].forEach(k=>{const e=root.querySelector(`#l${i}_${k}`);if(!e)return;e.oninput=()=>{l[k]=k==='price'?Math.round(toNum(e.value)):e.value;};e.onchange=()=>{l[k]=k==='price'?Math.round(toNum(e.value)):r3(toNum(e.value));rerender()}})});
}
async function saveOrder(){const d=R.odraft,msg=$('#oMsg');d._err='';const err=t=>msg.innerHTML='<div class="alert r">'+t+'</div>';msg.innerHTML='';
  if(!d.cust)return err('Chưa chọn khách hàng.');
  const lines=d.lines.map(l=>({code:l.code,name:l.name,unit:l.unit,qty:r3(toNum(l.qty)),promo:r3(toNum(l.promo)),swap:r3(toNum(l.swap)),ret:r3(toNum(l.ret)),price:Math.round(toNum(l.price)),listPrice:l.listPrice==null?null:Math.round(toNum(l.listPrice))})).filter(l=>l.qty>0||l.promo>0||l.swap>0||l.ret>0);
  if(!lines.length)return err('Đơn chưa có sản phẩm nào có số lượng.');
  const bad=lines.find(l=>l.ret>l.qty+1e-9);if(bad)return err(`${esc(bad.name)}: số trả (${fmt(bad.ret)}) lớn hơn số bán (${fmt(bad.qty)}).`);
  const zero=lines.find(l=>l.qty>0&&!l.price);if(zero&&!d._zeroOk){d._zeroOk=true;return msg.innerHTML=`<div class="alert w">${esc(zero.name)} đang có đơn giá 0đ. Bấm Gửi lần nữa nếu đúng là hàng không tính tiền.</div>`}
  if(d.paid){const e2=pmCheck(d.payMethod,d.payPhotos);if(e2)return err(e2)}
  const btn=$('#oSave');btn.disabled=true;
  const total=lines.reduce((s,l)=>s+lineAmt(l),0);const base={cust:d.cust,custName:d.custName,address:d.address.trim(),phone:d.phone,lines,note:d.note.trim(),total,
      paid:!!d.paid,paidAmount:d.paid?Math.round(d.paidAmount===''?total:toNum(d.paidAmount)):0,paidBy:d.paid?(R.mode==='ship'?'ship':'sale'):null,payMethod:d.paid?d.payMethod:null};
  if(d.id){const o=R.orders.find(x=>x.id===d.id);if(!o||o.status!=='new'){btn.disabled=false;return err('Đơn đã được nhận giao, không sửa được nữa.')}}
  /* GỬI NỀN: màn hình chuyển ngay, đơn hiện ngay trong danh sách; máy chủ ghi phía sau. Lỗi mạng → trả lại đơn nháp để bấm Gửi lại. */
  const mode=R.mode,wasShip=mode==='ship',arise=wasShip&&!d.id,dv=arise&&d.delivered!==false;
  const jobs=[];const pre=(list,oid)=>list.map(p=>{if(p.id)return p.id;const id=oid+'-pay-'+uidShort();jobs.push(()=>R.db.doc('photos/'+id).set({data:p.data,orderId:oid,kind:'pay',by:R.uid,at:Date.now()}).then(()=>R.photoCache.set(id,p.data)));return id});
  R.odraft=newOrderDraft();R.tab=wasShip?(dv||d.id?'done':'todo'):'orders';render();toast(d.id?'Đang lưu đơn…':'Đang gửi đơn…');
  (async()=>{try{
    if(d.id){base.payPhotos=pre(d.payPhotos,d.id);await Promise.all(jobs.map(f=>f()));await R.db.doc('orders/'+d.id).update(Object.assign(base,{updatedAt:Date.now(),updatedBy:R.uid}));toast('✓ Đã lưu đơn '+(d.no||''))}
    else{let no=nextNo('DH',d.date,R.orders);base.payPhotos=pre(d.payPhotos,no);const now=Date.now();
      const mk=async()=>{for(let k=0;k<40;k++){while(R.orders.some(o=>o.id===no))no=bumpNo(no);
          try{await R.db.doc('orders/'+no).create(Object.assign({},base,{no,date:d.date,saleId:R.uid,status:arise?(dv?'done':'shipping'):'new',shipId:arise?R.uid:null,outside:false,retPhotos:[],createdAt:now},arise?{arising:true,saleLines:lines,shipAt:now}:{},dv?{doneAt:now}:{}));return}
          catch(e){if(e.code!=='exists')throw e;no=bumpNo(no)}}throw{message:'không cấp được số đơn'}};
      await Promise.all([mk(),...jobs.map(f=>f())]);toast((arise?'✓ Đã lưu đơn phát sinh ':'✓ Đã gửi đơn ')+no)}
  }catch(e){R.odraft=d;R.mode=mode;R.tab='new';render();d._err='<div class="alert r">'+(e.code==='invalid_argument'?'Bạn không có quyền ghi dữ liệu.':e.code==='quota_exceeded'?'Kho dữ liệu đầy, báo quản lý.':'Chưa gửi được (mạng yếu?): '+esc(e.message||e.code||'lỗi')+'. Đơn vẫn còn đây – bấm Gửi lại.')+'</div>';render();toast('⚠ Chưa gửi được đơn')}})()}

/* ================= DANH SÁCH ĐƠN (dùng chung) ================= */
function orderCard(o,opt){opt=opt||{};const items=(o.lines||[]).map(l=>esc(l.name)+' ×'+fmt(l.qty)).join(', ');
  return `<div class="oc" data-oid="${esc(o.id)}"><div class="h1"><span class="cn ell">${esc(o.custName)}</span><span class="money">${vnd(orderTotal(o))}</span></div>
   <div class="addr">${ICON.pin}<span>${esc(o.address||'Chưa có địa chỉ')}</span></div>
   <div class="tiny muted ell">${items}</div>
   <div class="hrow">${stChip(o)}${payChip(o)}${o.arising?'<span class="chip b">Phát sinh</span>':''}${o.outside?'<span class="chip b">Ship ngoài</span>':''}<span class="tiny muted right">${esc(o.no)} · ${dm(o.date)}${opt.who?' · '+esc(staffName(o[opt.who])):''}</span></div>${opt.actions||''}</div>`}
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
  const lines=(o.lines||[]).map(l=>`<div class="row"><div class="grow"><div class="t">${esc(l.name)}</div><div class="s">${fmt(l.qty)} ${esc(l.unit)} × ${vnd(l.price)}${l.listPrice!=null&&l.price!==l.listPrice?' <span class="edited">(giá gốc '+vnd(l.listPrice)+')</span>':''}${l.promo?' · KM '+fmt(l.promo):''}${l.swap?' · Đổi '+fmt(l.swap):''}${l.ret?' · Trả '+fmt(l.ret):''}</div></div><div class="money">${vnd(lineAmt(l))}</div></div>`).join('');
  const pay=(o.payPhotos||[]).map(id=>({id})),rp=(o.retPhotos||[]).map(id=>({id}));
  openSheet('Đơn '+o.no,`<div class="hrow">${stChip(o)}${payChip(o)}${o.arising?'<span class="chip b">Phát sinh</span>':''}${o.outside?'<span class="chip b">Ship ngoài</span>':''}${o.px?'<span class="chip">Đã xuất kho '+esc(o.px)+'</span>':''}</div>
   <div class="group"><div class="row"><div class="grow"><div class="t">${esc(o.custName)}</div><div class="s">${esc(o.address||'')}${o.phone?' · '+esc(o.phone):''}</div></div>${o.address?`<a class="mapl" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}" target="_blank" rel="noopener">Bản đồ</a>`:''}</div>
   <div class="row"><div class="grow s">Ngày ${dmy(o.date)} · Sale: ${esc(staffName(o.saleId))}${o.shipId?' · Ship: '+esc(staffName(o.shipId)):''}</div></div></div>
   <div class="group">${lines}<div class="row"><div class="grow t">Tổng cộng</div><div class="money" style="font-size:18px">${vnd(orderTotal(o))}</div></div>
   ${o.paid?`<div class="row"><div class="grow s">Đã thu ${vnd(o.paidAmount)} (${o.paidBy==='ship'?'ship thu':'sale thu'}${o.payMethod?' · '+PM_NAME[o.payMethod]:''})</div></div>`:''}</div>
   ${o.note?`<div class="card small">${esc(o.note)}</div>`:''}
   ${pay.length?'<div><div class="sec" style="margin-top:0">Ảnh thanh toán</div>'+photoStrip(pay,false,'p')+'</div>':''}
   ${rp.length?'<div><div class="sec" style="margin-top:0">Ảnh hàng đổi trả</div>'+photoStrip(rp,false,'r')+'</div>':''}
   ${canDeliver&&o.status==='new'&&role==='ship'?'<button class="btn block blue" data-a="take">Nhận giao đơn này</button>':''}
   ${canDeliver?'<button class="btn block pri" data-a="deliver">Xác nhận đã giao</button>':''}
   ${!o.paid&&o.status!=='cancel'?'<button class="btn block" data-a="pay">Cập nhật đã thanh toán</button>':''}
   ${canEdit?'<button class="btn block" data-a="edit">Sửa đơn</button><button class="btn block danger" data-a="cancel">Hủy đơn</button>':''}
   ${role==='admin'&&o.status==='done'&&!o.px?'<button class="btn block" data-a="reopen">Mở lại đơn (chưa giao)</button>':''}`,b=>{
    bindPhotos(b,k=>k==='p'?pay:rp,()=>{});
    const act=(k,f)=>{const x=b.querySelector(`[data-a="${k}"]`);if(x)x.onclick=f};
    act('take',async()=>{try{const s=await R.db.doc('orders/'+o.id).get();const cur=s.data();if(cur.shipId&&cur.shipId!==R.uid){toast('Đơn đã có người khác nhận.');return}
      await R.db.doc('orders/'+o.id).update({status:'shipping',shipId:R.uid,shipAt:Date.now()});toast('Đã nhận đơn '+o.no);closeSheet()}catch(e){toast('Lỗi: '+(e.code||''))}});
    act('deliver',()=>{closeSheet();deliverSheet(o)});
    act('pay',()=>{closeSheet();paySheet(o)});
    act('edit',()=>{R.odraft={id:o.id,no:o.no,cust:o.cust,custName:o.custName,address:o.address||'',phone:o.phone||'',lines:o.lines.map(l=>Object.assign({},l,{src:'Giá mặc định'})),paid:o.paid,payMethod:o.payMethod||'',paidAmount:o.paidAmount||'',payPhotos:(o.payPhotos||[]).map(id=>({id})),note:o.note||'',date:o.date};closeSheet();if(R.mode==='admin')R.mode='sale';R.tab='new';render()});
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
    b.querySelector('#dvSave').onclick=async e=>{const m=b.querySelector('#dvMsg');const lines=d.lines.map(l=>({code:l.code,name:l.name,unit:l.unit,qty:r3(toNum(l.qty)),promo:r3(toNum(l.promo)),swap:r3(toNum(l.swap)),ret:r3(toNum(l.ret)),price:Math.round(toNum(l.price)),listPrice:l.listPrice==null?null:Math.round(toNum(l.listPrice))}));
      if(lines.some(l=>l.ret>l.qty+1e-9)){m.innerHTML='<div class="alert r">Số trả không được lớn hơn số giao.</div>';return}
      if((lines.some(l=>l.ret||l.swap))&&!d.retPhotos.length&&!d._noPhotoOk){d._noPhotoOk=1;m.innerHTML='<div class="alert w">Có hàng đổi trả nhưng chưa chụp ảnh. Bấm xác nhận lần nữa nếu vẫn muốn lưu.</div>';return}
      if(!o.paid&&d.paid){const e2=pmCheck(d.payMethod,d.payPhotos);if(e2){m.innerHTML='<div class="alert r">'+e2+'</div>';return}}
      e.target.disabled=true;try{const pay=await savePhotos(d.payPhotos,o.id,'pay'),ret=await savePhotos(d.retPhotos,o.id,'ret');const total=lines.reduce((s,l)=>s+lineAmt(l),0);
        const up={lines,total,status:'done',shipId:o.shipId||R.uid,doneAt:Date.now(),outside:!!d.outside,retPhotos:(o.retPhotos||[]).concat(ret),updatedAt:Date.now(),updatedBy:R.uid};
        if(!o.saleLines)up.saleLines=o.lines;if(d.note)up.note=(o.note?o.note+' | ':'')+'Giao: '+d.note;
        if(!o.paid&&d.paid){up.paid=true;up.paidAmount=Math.round(d.paidAmount===''?total:toNum(d.paidAmount));up.paidBy='ship';up.payMethod=d.payMethod;up.payPhotos=(o.payPhotos||[]).concat(pay)}
        await R.db.doc('orders/'+o.id).update(up);toast('Đã giao đơn '+o.no);closeSheet()}catch(x){e.target.disabled=false;m.innerHTML='<div class="alert r">Không lưu được ('+esc(x.code||'lỗi')+').</div>'}}};
  openSheet('Giao đơn '+o.no,'',draw)}
function viewShipTodo(v){const L=R.orders.filter(o=>(o.status==='new'&&!o.shipId)||(o.status==='shipping'&&o.shipId===R.uid)||(o.status==='new'&&o.shipId===R.uid));
  const mine=L.filter(o=>o.shipId===R.uid),free=L.filter(o=>!o.shipId);const sortF=(a,b)=>(a.date+a.no).localeCompare(b.date+b.no);
  v.innerHTML=`<h1 class="big">Cần giao</h1><div class="stack">
   <div class="sec" style="margin-top:0">Đơn của tôi (${mine.length})</div><div class="list">${mine.sort(sortF).map(o=>orderCard(o,{actions:`<button class="btn pri" data-dv="${esc(o.id)}">Giao xong</button>`})).join('')||'<div class="empty">Bạn chưa nhận đơn nào. Chọn đơn ở dưới để nhận giao.</div>'}</div>
   <div class="sec">Đơn chờ người giao (${free.length})</div><div class="list">${free.sort(sortF).map(o=>orderCard(o,{who:'saleId',actions:`<button class="btn blue" data-take="${esc(o.id)}">Nhận giao</button>`})).join('')||'<div class="empty">Không còn đơn chờ.</div>'}</div></div>`;
  $$('[data-oid]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;orderDetail(R.orders.find(o=>o.id===c.dataset.oid))});
  $$('[data-dv]').forEach(b=>b.onclick=()=>deliverSheet(R.orders.find(o=>o.id===b.dataset.dv)));
  $$('[data-take]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const ref=R.db.doc('orders/'+b.dataset.take);const s=await ref.get();if(s.data().shipId&&s.data().shipId!==R.uid){toast('Đơn đã có người nhận.');return}await ref.update({status:'shipping',shipId:R.uid,shipAt:Date.now()});toast('Đã nhận đơn')}catch(e){b.disabled=false;toast('Lỗi '+(e.code||''))}})}

/* ================= BÁO CÁO SALE / SHIP ================= */
function viewSaleReport(v,uid){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Báo cáo</h1>'+periodBar()+'<div class="empty">Đang tải dữ liệu…</div>';bindPeriod();return}
  const L=all.filter(o=>o.saleId===uid);const s=stats(L);const st=R.staff.get(uid);const p=st&&st.pct!=null&&st.pct!==''?toNum(st.pct):toNum(ST().salePct);
  const prod=new Map();L.filter(o=>o.status!=='cancel').forEach(o=>o.lines.forEach(l=>{const r=prod.get(l.code)||{name:l.name,unit:l.unit,qty:0,promo:0,ret:0,swap:0,amt:0};r.qty+=toNum(l.qty);r.promo+=toNum(l.promo);r.ret+=toNum(l.ret);r.swap+=toNum(l.swap);r.amt+=lineAmt(l);prod.set(l.code,r)}));
  v.innerHTML=`<h1 class="big">Báo cáo bán hàng</h1><div class="stack">${periodBar()}
   <div class="kpis"><div class="kpi g"><div class="l">Tổng doanh số</div><div class="v">${vnd(s.revenue)}</div><div class="h">đã trừ hàng trả</div></div>
   <div class="kpi"><div class="l">Số đơn hàng</div><div class="v">${s.orders}</div><div class="h">${s.done} đã giao${s.cancel?' · '+s.cancel+' hủy':''}</div></div>
   <div class="kpi"><div class="l">Tổng số lượng</div><div class="v">${fmt(s.qty)}</div><div class="h">KM ${fmt(s.promo)}</div></div>
   <div class="kpi ${s.ret+s.swap?'w':''}"><div class="l">Tỷ lệ đổi trả</div><div class="v">${retRate(s)}</div><div class="h">đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}</div></div>
   <div class="kpi b"><div class="l">Thu nhập sale</div><div class="v">${vnd(s.revenue*p/100)}</div><div class="h">${fmt(p)}% doanh số</div></div>
   <div class="kpi ${s.unpaid?'r':''}"><div class="l">Khách còn nợ</div><div class="v">${vnd(s.unpaid)}</div><div class="h">đã thu ${vnd(s.paid)}</div></div></div>
   <div class="sec">Theo sản phẩm</div>${prodTable(prod)}</div>`;bindPeriod()}
function prodTable(prod){const rows=[...prod.entries()].sort((a,b)=>b[1].amt-a[1].amt);
  return rows.length?`<div class="tw"><table><thead><tr><th>Sản phẩm</th><th class="n">SL</th><th class="n">KM</th><th class="n">Đổi</th><th class="n">Trả</th><th class="n">Doanh số</th></tr></thead><tbody>${rows.map(([c,r])=>`<tr><td>${esc(r.name)}<div class="tiny muted">${esc(c)} · ${esc(r.unit)}</div></td><td class="n">${fmt(r.qty)}</td><td class="n">${fmt0(r.promo)}</td><td class="n">${fmt0(r.swap)}</td><td class="n">${fmt0(r.ret)}</td><td class="n">${vnd(r.amt)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có đơn trong kỳ này.</div>'}
function viewShipDone(v){const [f,t]=periodRange();const all=ordersIn(f,t);
  const L=(all||[]).filter(o=>o.shipId===R.uid&&o.status==='done').sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
  v.innerHTML=`<h1 class="big">Đã giao</h1><div class="stack">${periodBar()}<div class="list">${all?L.map(o=>orderCard(o)).join('')||'<div class="empty">Chưa giao đơn nào trong kỳ.</div>':'<div class="empty">Đang tải…</div>'}</div></div>`;bindPeriod();
  $$('[data-oid]').forEach(c=>c.onclick=()=>orderDetail(L.find(o=>o.id===c.dataset.oid)))}
function shipStats(L){const s=stats(L);const S=ST();s.income=s.normal*toNum(S.shipFee)+s.outside*toNum(S.shipFeeOut);s.incomeOut=s.outside*toNum(S.shipFeeOut);s.incomeMonth=s.normal*toNum(S.shipFee);return s}
function viewShipReport(v,uid){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Báo cáo</h1>'+periodBar()+'<div class="empty">Đang tải…</div>';bindPeriod();return}
  const L=all.filter(o=>o.shipId===uid&&o.status==='done');const s=shipStats(L);const S=ST();
  v.innerHTML=`<h1 class="big">Báo cáo giao hàng</h1><div class="stack">${periodBar()}
   <div class="kpis"><div class="kpi g"><div class="l">Tổng đơn giao</div><div class="v">${s.done}</div><div class="h">${s.outside} đơn ship ngoài</div></div>
   <div class="kpi"><div class="l">Tổng số lượng giao</div><div class="v">${fmt(s.doneQty)}</div><div class="h">gồm hàng KM</div></div>
   <div class="kpi ${s.ret+s.swap?'w':''}"><div class="l">Tỷ lệ đổi trả</div><div class="v">${retRate(s)}</div><div class="h">đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}</div></div>
   <div class="kpi b"><div class="l">Tiền hàng đã thu</div><div class="v">${vnd(s.collected)}</div><div class="h">ship thu khi giao</div></div>
   <div class="kpi g"><div class="l">Thu nhập ship</div><div class="v">${vnd(s.income)}</div><div class="h">trả ngay ${vnd(s.incomeOut)} · cuối tháng ${vnd(s.incomeMonth)}</div></div></div>
   <div class="tiny muted">Công đơn thường ${vnd(S.shipFee)}/đơn (tính lương cuối tháng) · Công đơn ship ngoài ${vnd(S.shipFeeOut)}/đơn (trả ngay).</div></div>`;bindPeriod()}

/* ================= KHO ================= */
function stockMap(asOf,excludeId){const m=new Map();for(const p of R.products.values())m.set(p.code,toNum(p.openingQty));
  for(const v of R.vouchers){if(v.id===excludeId||(asOf&&v.date>asOf))continue;const s=v.type==='N'?1:-1;for(const l of v.lines||[])m.set(l.code,r3((m.get(l.code)||0)+s*toNum(l.qty)))}return m}
function nxt(from,to){const rows=new Map();
  for(const p of R.products.values())rows.set(p.code,{code:p.code,name:p.name,unit:p.unit,group:p.group||'',min:toNum(p.minQty),dau:toNum(p.openingQty),n:0,x:0,known:true});
  for(const v of R.vouchers)for(const l of v.lines||[]){let r=rows.get(l.code);if(!r){r={code:l.code,name:l.name||'(không có trong danh mục)',unit:l.unit||'',group:'',min:0,dau:0,n:0,x:0,known:false};rows.set(l.code,r)}
    const q=toNum(l.qty),s=v.type==='N'?1:-1;if(v.date<from)r.dau+=s*q;else if(v.date<=to){if(s>0)r.n+=q;else r.x+=q}}
  for(const r of rows.values()){r.dau=r3(r.dau);r.n=r3(r.n);r.x=r3(r.x);r.cuoi=r3(r.dau+r.n-r.x)}
  return [...rows.values()].sort((a,b)=>a.code.localeCompare(b.code,'vi'))}
function stStatus(r){if(!r.known)return['r','Mã lạ'];if(r.cuoi<0)return['r','Tồn âm'];if(r.min>0&&r.cuoi<r.min)return['w','Sắp hết'];if(r.cuoi===0)return['','Hết hàng'];return['','']}
function newVoucher(type){return {id:null,type:type||'N',date:today(),no:'',person:'',partner:'',partnerCode:'',dept:'',reason:'',refDoc:'',refCount:'',warehouse:ST().whName,lines:[],orderIds:[],kind:'',allowNeg:false}}
function viewKhoNew(v){if(!R.vdraft)R.vdraft=newVoucher('N');const d=R.vdraft,N=d.type==='N';const lk=locked(d.date);const bal=stockMap(d.date,d.id);
  v.innerHTML=`<h1 class="big">${d.id?'Sửa phiếu '+esc(d.no):'Lập phiếu kho'}</h1><div class="stack">
   <div class="seg"><button data-vt="N" class="${N?'on':''}" ${d.id?'disabled':''}>Phiếu nhập kho</button><button data-vt="X" class="${!N?'on':''}" ${d.id?'disabled':''}>Phiếu xuất kho</button></div>
   ${d.orderIds.length?`<div class="alert b">${N?'Nhập hàng đổi trả':'Xuất kho'} theo ${d.orderIds.length} đơn: ${esc(d.orderIds.join(', '))}</div>`:''}
   ${lk?`<div class="alert r">Kỳ đến ${dmy(ST().lockDate)} đã khóa sổ.</div>`:''}
   <div class="card"><div class="fgrid">
    <label class="f">Số phiếu<input readonly value="${esc(d.id?d.no:nextNo(N?'PN':'PX',d.date||today(),R.vouchers))}"></label>
    <label class="f">Ngày *<input type="date" id="vd_date" value="${esc(d.date)}"></label>
    <label class="f">${N?'Người giao hàng':'Nhân viên giao hàng / người nhận'}<input id="vd_person" list="dlShip" value="${esc(d.person)}" placeholder="Họ và tên"></label>
    <label class="f">${N?'Nhà cung cấp':'Khách hàng / bộ phận'}<input id="vd_partner" value="${esc(d.partner)}"></label>
    <label class="f">${N?'Lý do nhập':'Lý do xuất'}<input id="vd_reason" value="${esc(d.reason)}"></label>
    <label class="f">Chứng từ kèm theo<input id="vd_refDoc" value="${esc(d.refDoc)}" placeholder="Số HĐ, biên bản…"></label>
   </div></div>
   <div class="sec" style="margin-bottom:0">Hàng hóa</div>
   <div class="list">${d.lines.map((l,i)=>{const t=bal.get(l.code)||0;const over=!N&&toNum(l.qty)>t;return `<div class="line"><div class="top"><div class="nm">${esc(l.name)}<div class="tiny muted" style="font-weight:500">${esc(l.code)} · ${esc(l.unit)} · tồn tại ngày <span class="${over||t<0?'neg':''}">${fmt(t)}</span></div></div><button class="btn sm danger" data-vdel="${i}">Bỏ</button></div>
     <div class="grid"><label class="f">${N?'SL theo chứng từ':'SL yêu cầu'}<input id="vl${i}_qtyDoc" inputmode="decimal" class="num" value="${esc(l.qtyDoc)}"></label><label class="f">${N?'SL thực nhập':'SL thực xuất'} *<div class="step"><button data-vstep="${i}:-1">−</button><input id="vl${i}_qty" inputmode="decimal" value="${esc(l.qty)}"><button data-vstep="${i}:1">+</button></div></label></div></div>`}).join('')}</div>
   <button class="btn" id="vAdd">${ICON.plus.replace('<svg','<svg width="18" height="18"')} Thêm hàng</button>
   <div id="vMsg"></div>
   <button class="btn block pri" id="vSave" ${lk?'disabled':''}>Lưu phiếu</button><button class="btn block" id="vSaveP" ${lk?'disabled':''}>Lưu và tải bản in</button>
   ${d.id||d.lines.length?'<button class="btn block" id="vReset">'+(d.id?'Hủy sửa':'Làm lại')+'</button>':''}</div>`;
  $$('[data-vt]').forEach(b=>b.onclick=()=>{if(d.id)return;d.type=b.dataset.vt;render()});
  $('#vd_date').onchange=e=>{d.date=e.target.value;render()};
  [['vd_person','person'],['vd_partner','partner'],['vd_reason','reason'],['vd_refDoc','refDoc']].forEach(([id,k])=>$('#'+id).oninput=e=>d[k]=e.target.value);
  $$('[data-vdel]').forEach(b=>b.onclick=()=>{d.lines.splice(+b.dataset.vdel,1);render()});
  $$('[data-vstep]').forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.vstep.split(':');const l=d.lines[+i];l.qty=Math.max(0,r3(toNum(l.qty)+(+s)));render()});
  d.lines.forEach((l,i)=>['qty','qtyDoc'].forEach(k=>{const e=$(`#vl${i}_${k}`);e.oninput=()=>l[k]=e.value;e.onchange=()=>{l[k]=e.value===''?'':r3(toNum(e.value));render()}}));
  $('#vAdd').onclick=()=>pickProduct(null,p=>{if(!p)return;const ex=d.lines.find(l=>l.code===p.code);if(ex)ex.qty=r3(toNum(ex.qty)+1);else d.lines.push({code:p.code,name:p.name,unit:p.unit,qtyDoc:'',qty:1,note:''});render()});
  $('#vSave').onclick=()=>saveVoucher(false);$('#vSaveP').onclick=()=>saveVoucher(true);const rs=$('#vReset');if(rs)rs.onclick=()=>{R.vdraft=newVoucher(d.type);render()}}
async function saveVoucher(andPrint){const d=R.vdraft,N=d.type==='N',m=$('#vMsg');const err=t=>m.innerHTML='<div class="alert r">'+t+'</div>';m.innerHTML='';
  if(!d.date)return err('Chưa chọn ngày.');if(locked(d.date))return err('Ngày nằm trong kỳ đã khóa sổ.');
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
function viewStock(v){const [f,t]=periodRange();let rows=nxt(f,t);const q=noAcc(R.ui.stockQ);if(q)rows=rows.filter(r=>noAcc(r.code+' '+r.name).includes(q));
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
function stockCard(code,f,t){const p=findProd(code);let bal=p?toNum(p.openingQty):0;const rows=[];
  for(const v of R.vouchers.slice().sort((a,b)=>(a.date+a.type+a.no).localeCompare(b.date+b.type+b.no)))for(const l of v.lines||[]){if(l.code!==code)continue;const q=toNum(l.qty),s=v.type==='N'?1:-1;if(v.date<f){bal+=s*q;continue}if(v.date>t)continue;rows.push({v,q,s})}
  let run=r3(bal);const dau=run;
  openSheet('Thẻ kho '+code,`<div class="tiny muted">${esc(p?p.name:'')} · ${esc(p?p.unit:'')} · ${dmy(f)} – ${dmy(t)}</div><div class="tw"><table><thead><tr><th>Ngày</th><th>Phiếu</th><th class="n">Nhập</th><th class="n">Xuất</th><th class="n">Tồn</th></tr></thead><tbody>
   <tr class="sum"><td colspan="4">Tồn đầu kỳ</td><td class="n">${fmt(dau)}</td></tr>${rows.map(r=>{run=r3(run+r.s*r.q);return `<tr><td>${dm(r.v.date)}</td><td>${esc(r.v.no)}<div class="tiny muted">${esc(r.v.person||r.v.reason||'')}</div></td><td class="n">${r.s>0?fmt(r.q):''}</td><td class="n">${r.s<0?fmt(r.q):''}</td><td class="n ${run<0?'neg':''}">${fmt(run)}</td></tr>`}).join('')}
   <tr class="sum"><td colspan="4">Tồn cuối kỳ</td><td class="n">${fmt(run)}</td></tr></tbody></table></div>`)}
function viewKhoByOrder(v){const S=R.ui;S.sel=S.sel||new Set();S.selR=S.selR||new Set();
  const out=R.orders.filter(o=>o.status!=='cancel'&&!o.px).sort((a,b)=>(a.date+a.no).localeCompare(b.date+b.no));
  const back=R.orders.filter(o=>o.status==='done'&&!o.pn&&(sumL(o,'ret')+sumL(o,'swap'))>0);
  const row=(o,set,k)=>`<label class="row tap" style="cursor:pointer"><input type="checkbox" data-${k}="${esc(o.id)}" ${set.has(o.id)?'checked':''} style="width:22px;min-height:0;flex:none"><div class="grow"><div class="t ell">${esc(o.custName)}</div><div class="s ell">${esc(o.no)} · ${dm(o.date)} · ${ST_NAME[o.status]}${o.shipId?' · '+esc(staffName(o.shipId)):''}</div><div class="s ell">${(o.lines||[]).map(l=>esc(l.name)+' '+fmt(k==='so'?toNum(l.qty)+toNum(l.promo)+toNum(l.swap):toNum(l.ret)+toNum(l.swap))).join(', ')}</div></div></label>`;
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
    os.forEach(o=>o.lines.forEach(l=>{const q=type==='X'?toNum(l.qty)+toNum(l.promo)+toNum(l.swap):toNum(l.ret)+toNum(l.swap);if(!q)return;const r=m.get(l.code)||{code:l.code,name:l.name,unit:l.unit,qtyDoc:0,qty:0,note:''};r.qtyDoc=r3(r.qtyDoc+q);r.qty=r3(r.qty+q);m.set(l.code,r)}));
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
function viewDash(v){const [f,t]=periodRange();const all=ordersIn(f,t);
  if(!all){v.innerHTML='<h1 class="big">Tổng quan</h1>'+periodBar()+'<div class="empty">Đang tải dữ liệu…</div>';bindPeriod();return}
  const s=stats(all);const S=ST();const waiting=R.orders.filter(o=>o.status==='new'||o.status==='shipping').length;
  const sales=new Map(),ships=new Map();all.forEach(o=>{if(o.saleId){if(!sales.has(o.saleId))sales.set(o.saleId,[]);sales.get(o.saleId).push(o)}if(o.shipId&&o.status==='done'){if(!ships.has(o.shipId))ships.set(o.shipId,[]);ships.get(o.shipId).push(o)}});
  for(const [id,st] of R.staff){if(st.role==='sale'&&!sales.has(id))sales.set(id,[]);if(st.role==='ship'&&!ships.has(id))ships.set(id,[])}
  const saleRows=[...sales.entries()].map(([id,L])=>{const x=stats(L);const st=R.staff.get(id);const p=st&&st.pct!=null&&st.pct!==''?toNum(st.pct):toNum(S.salePct);return {id,x,inc:x.revenue*p/100,p}}).sort((a,b)=>b.x.revenue-a.x.revenue);
  const shipRows=[...ships.entries()].map(([id,L])=>({id,x:shipStats(L)})).sort((a,b)=>b.x.done-a.x.done);
  /* đối chiếu kho */
  const rec=new Map();const get=(c,n,u)=>{if(!rec.has(c))rec.set(c,{name:n,unit:u,go:0,px:0,back:0,pn:0});return rec.get(c)};
  all.filter(o=>o.status==='done').forEach(o=>o.lines.forEach(l=>{const r=get(l.code,l.name,l.unit);r.go+=toNum(l.qty)+toNum(l.promo)+toNum(l.swap);r.back+=toNum(l.ret)+toNum(l.swap)}));
  R.vouchers.filter(x=>x.date>=f&&x.date<=t).forEach(x=>x.lines.forEach(l=>{const r=get(l.code,l.name,l.unit);if(x.type==='X')r.px+=toNum(l.qty);else if(x.kind==='return')r.pn+=toNum(l.qty)}));
  const recRows=[...rec.entries()].filter(([c,r])=>r.go||r.px||r.back||r.pn).sort((a,b)=>Math.abs(r3(b[1].go-b[1].px))-Math.abs(r3(a[1].go-a[1].px)));
  const noPx=R.orders.filter(o=>o.status==='done'&&!o.px).length,noPn=R.orders.filter(o=>o.status==='done'&&!o.pn&&(sumL(o,'ret')+sumL(o,'swap'))>0).length;
  const negStock=[...stockMap().values()].filter(x=>x<0).length;
  v.innerHTML=`<h1 class="big">Tổng quan</h1><div class="stack">${periodBar()}
   <div class="kpis"><div class="kpi g"><div class="l">Tổng doanh số</div><div class="v">${vnd(s.revenue)}</div><div class="h">${s.orders} đơn · ${s.cancel} hủy</div></div>
    <div class="kpi"><div class="l">Tổng số lượng bán</div><div class="v">${fmt(s.qty)}</div><div class="h">KM ${fmt(s.promo)}</div></div>
    <div class="kpi ${s.ret+s.swap?'w':''}"><div class="l">Tỷ lệ đổi trả</div><div class="v">${retRate(s)}</div><div class="h">đổi ${fmt(s.swap)} · trả ${fmt(s.ret)}</div></div>
    <div class="kpi b"><div class="l">Đã thu tiền</div><div class="v">${vnd(s.paid)}</div></div>
    <div class="kpi ${s.unpaid?'r':''}"><div class="l">Khách còn nợ</div><div class="v">${vnd(s.unpaid)}</div></div>
    <div class="kpi ${waiting?'w':''}"><div class="l">Đơn chưa giao</div><div class="v">${waiting}</div><div class="h">tất cả thời gian</div></div></div>
   ${noPx||noPn||negStock||s.edited?`<div class="stack" style="gap:8px">${noPx?`<div class="alert w">${noPx} đơn đã giao nhưng chưa có phiếu xuất kho.</div>`:''}${noPn?`<div class="alert w">${noPn} đơn có hàng đổi trả chưa nhập lại kho.</div>`:''}${negStock?`<div class="alert r">${negStock} mặt hàng đang tồn âm.</div>`:''}${s.edited?`<div class="alert b">${s.edited} đơn trong kỳ có sửa giá so với giá mặc định.</div>`:''}</div>`:''}
   <div class="sec">Theo nhân viên bán hàng</div>
   <div class="tw"><table><thead><tr><th>Sale</th><th class="n">Đơn</th><th class="n">SL</th><th class="n">Doanh số</th><th class="n">Đổi trả</th><th class="n">Còn nợ</th><th class="n">Thu nhập</th></tr></thead><tbody>
   ${saleRows.map(r=>`<tr><td>${esc(staffName(r.id))}</td><td class="n">${r.x.orders}</td><td class="n">${fmt(r.x.qty)}</td><td class="n">${vnd(r.x.revenue)}</td><td class="n">${retRate(r.x)}</td><td class="n">${vnd(r.x.unpaid)}</td><td class="n">${vnd(r.inc)}<div class="tiny muted">${fmt(r.p)}%</div></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Chưa có dữ liệu.</td></tr>'}</tbody></table></div>
   <div class="sec">Theo nhân viên giao hàng</div>
   <div class="tw"><table><thead><tr><th>Ship</th><th class="n">Đơn giao</th><th class="n">SL giao</th><th class="n">Đổi trả</th><th class="n">Tiền đã thu</th><th class="n">Ship ngoài</th><th class="n">Thu nhập</th></tr></thead><tbody>
   ${shipRows.map(r=>`<tr><td>${esc(staffName(r.id))}</td><td class="n">${r.x.done}</td><td class="n">${fmt(r.x.doneQty)}</td><td class="n">${retRate(r.x)}</td><td class="n">${vnd(r.x.collected)}</td><td class="n">${r.x.outside}<div class="tiny muted">${vnd(r.x.incomeOut)}</div></td><td class="n">${vnd(r.x.income)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">Chưa có dữ liệu.</td></tr>'}</tbody></table></div>
   <div class="sec">Đối chiếu bán hàng với kho</div>
   <div class="tw"><table><thead><tr><th>Mặt hàng</th><th class="n">Giao theo đơn</th><th class="n">Xuất kho</th><th class="n">Lệch</th><th class="n">Trả về theo đơn</th><th class="n">Nhập trả kho</th><th class="n">Lệch</th></tr></thead><tbody>
   ${recRows.map(([c,r])=>{const d1=r3(r.go-r.px),d2=r3(r.back-r.pn);return `<tr><td>${esc(r.name)}<div class="tiny muted">${esc(c)} · ${esc(r.unit)}</div></td><td class="n">${fmt(r.go)}</td><td class="n">${fmt(r.px)}</td><td class="n ${d1?'neg':''}">${d1?fmt(d1):'✓'}</td><td class="n">${fmt0(r.back)}</td><td class="n">${fmt0(r.pn)}</td><td class="n ${d2?'neg':''}">${d2?fmt(d2):r.back||r.pn?'✓':''}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">Chưa có phát sinh.</td></tr>'}</tbody></table></div>
   <div class="tiny muted">Giao theo đơn = SL bán + khuyến mại + hàng đổi của các đơn đã giao trong kỳ. Lệch khác 0 nghĩa là chưa lập phiếu xuất, hoặc phiếu xuất khác với số thực giao.</div>
   <button class="btn" id="dXls">Xuất Excel chi tiết đơn hàng trong kỳ</button></div>`;
  bindPeriod();$('#dXls').onclick=()=>exportOrders(all,f,t)}
function exportOrders(list,f,t){const rows=[['Ngày','Số đơn','Trạng thái','Sale','Ship','Mã KH','Khách hàng','Địa chỉ','Mã SP','Tên SP','ĐVT','SL','KM','Đổi','Trả','Đơn giá','Giá mặc định','Thành tiền','Tình trạng thanh toán','Số tiền đã thu','Người thu','Còn phải thu','Ship ngoài','Phiếu xuất','Phiếu nhập trả','Nguồn đơn','Hình thức TT']];
  const oTot=o=>(o.lines||[]).reduce((s,l)=>s+lineAmt(l),0),oPaid=o=>o.paid?toNum(o.paidAmount||oTot(o)):0,oPay=o=>{const t=oTot(o),p=oPaid(o);return p>=t&&p>0?'Đã thanh toán đủ':p>0?'Thanh toán một phần':'Chưa thanh toán'};
  list.slice().sort((a,b)=>(a.date+a.no).localeCompare(b.date+b.no)).forEach(o=>o.lines.forEach((l,i)=>rows.push([xDate(o.date),o.no,ST_NAME[o.status],staffName(o.saleId),o.shipId?staffName(o.shipId):'',o.cust,o.custName,o.address,l.code,l.name,l.unit,toNum(l.qty),toNum(l.promo),toNum(l.swap),toNum(l.ret),toNum(l.price),l.listPrice==null?'':toNum(l.listPrice),lineAmt(l),oPay(o),i===0&&o.paid?oPaid(o):'',o.paid?(o.paidBy==='ship'?'Ship':'Sale'):'',i===0?Math.max(0,oTot(o)-oPaid(o)):'',o.outside?'Có':'',o.px||'',o.pn||'',o.arising?'Ship phát sinh':'Sale',o.paid?(PM_NAME[o.payMethod]||''):'']))); 
  xlsxFile(`Don_hang_${f}_${t}.xlsx`,[{name:'Don hang',rows,cols:[11,13,10,16,16,10,28,30,10,28,7,7,6,6,6,11,11,12,18,12,8,12,8,12,12,14,13]}])}
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
        try{const r=await window.vibaAdmin.resetPassword(id);box.innerHTML=`<div class="card stack"><div class="tiny muted">Gửi cho nhân viên để đăng nhập:</div><div>Email: <b>${esc(r.email)}</b></div><div>Mật khẩu mới: <b style="font-size:22px;letter-spacing:2px" class="num">${esc(r.password)}</b></div><button class="btn sm" id="es_copy">Sao chép</button><div class="tiny muted">Nhân viên nên tự đổi mật khẩu sau khi đăng nhập (nút Đổi MK cạnh Đăng xuất).</div></div>`;
          const cp=box.querySelector('#es_copy');cp.onclick=()=>{const t='Email: '+r.email+'\nMật khẩu: '+r.password;try{navigator.clipboard.writeText(t).then(()=>toast('Đã sao chép'),()=>{})}catch(e){}}}
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
function viewSettings(v){const s=ST(),ro=!R.isOwner;const F=(k,l,t)=>`<label class="f">${l}<input id="s_${k}" ${t?'type="'+t+'"':''} value="${esc(s[k]??'')}" ${ro?'readonly':''} ${t==='number'?'class="num"':''}></label>`;
  v.innerHTML=`<h1 class="big">Cài đặt</h1><div class="stack">${ro?'<div class="alert w">Chỉ chủ tài khoản sửa được cài đặt.</div>':''}
   <div class="sec" style="margin-top:0">Lương & hoa hồng</div><div class="card"><div class="fgrid">${F('salePct','% hoa hồng sale (mặc định)','number')}${F('shipFee','Công ship đơn thường (đ/đơn)','number')}${F('shipFeeOut','Công đơn ship ngoài (đ/đơn)','number')}</div></div>
   <div class="sec">Thông tin in phiếu</div><div class="card"><div class="fgrid">${F('company','Tên công ty')}${F('address','Địa chỉ')}${F('taxCode','Mã số thuế')}${F('dept','Bộ phận')}${F('whName','Tên kho')}${F('whCode','Mã kho (MISA)')}${F('whPlace','Địa điểm kho')}${F('keeper','Thủ kho')}${F('chiefAcc','Kế toán trưởng')}${F('director','Giám đốc')}</div>
   <div style="margin-top:12px">${F('circular','Dòng ghi chú mẫu chứng từ')}</div></div>
   <div class="sec">Khóa sổ</div><div class="card">${F('lockDate','Khóa sổ đến hết ngày','date')}<div class="tiny muted" style="margin-top:6px">Phiếu kho có ngày trong kỳ khóa không lập, sửa, xóa được.</div></div>
   ${ro?'':'<button class="btn block pri" id="sSave">Lưu cài đặt</button>'}
   <div class="tiny muted">Dữ liệu: ${R.products.size} sản phẩm · ${R.customers.size} khách · ${R.orders.length} đơn (3 tháng) · ${R.vouchers.length} phiếu kho.</div></div>`;
  const b=$('#sSave');if(b)b.onclick=async()=>{const keys=['salePct','shipFee','shipFeeOut','company','address','taxCode','dept','whName','whCode','whPlace','keeper','chiefAcc','director','circular','lockDate'];const d={};
    keys.forEach(k=>{const v=$('#s_'+k).value.trim();d[k]=['salePct','shipFee','shipFeeOut'].includes(k)?toNum(v):v});try{await R.db.doc('config/main').set(d);R.settings=d;toast('Đã lưu cài đặt')}catch(e){toast('Không lưu được')}}}

/* ================= ĐIỀU HƯỚNG ================= */
const TABS={
  sale:[['new','Lên đơn','cart'],['orders','Đơn của tôi','list'],['report','Báo cáo','chart']],
  ship:[['todo','Cần giao','truck'],['new','Phát sinh','cart'],['done','Đã giao','check'],['report','Báo cáo','chart']],
  kho:[['vnew','Lập phiếu','doc'],['vlist','Phiếu','list'],['stock','Tồn kho','box'],['byorder','Theo đơn','truck']],
  admin:[['dash','Tổng quan','home'],['orders','Đơn hàng','list'],['stock','Kho','box'],['catalog','Danh mục','book'],['settings','Cài đặt','gear']]};
function views(){return{
  sale:{new:viewSaleNew,orders:v=>orderListView(v,R.orders.filter(o=>o.saleId===R.uid),{title:'Đơn của tôi',emptyHint:'Đơn bạn lên sẽ hiện ở đây.'}),report:v=>viewSaleReport(v,R.uid)},
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
  $('#tabs').innerHTML=tabs.map(([k,l,ic])=>`<button data-tab="${k}" class="${R.tab===k?'on':''}" aria-current="${R.tab===k?'page':'false'}">${ICON[ic]}<span>${l}${k==='catalog'&&pend&&R.isOwner?' •':''}${k==='todo'?' ('+R.orders.filter(o=>(o.status==='new'&&!o.shipId)||(o.status==='shipping'&&o.shipId===R.uid)).length+')':''}</span></button>`).join('');$('#tabbar').hidden=false;
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
  sub('config',s=>{const d=s.docs.find(x=>x.id==='prodAlias');const it=(d&&d.data()||{}).items||{};R.palias=Object.fromEntries(Object.entries(it).map(([k,v])=>[k,(Array.isArray(v)?v:String(v||'').split(/[;|\n]/)).map(x=>String(x).trim()).filter(Boolean)]))});
  sub('requests',s=>{R.requests=new Map(s.docs.map(d=>[d.id,d.data()]))});
  sub('products',s=>{R.products=new Map(s.docs.map(d=>[d.id,d.data()]).filter(x=>x[1]&&x[1].code&&/^(HH|TP)/i.test(String(x[1].code).trim())&&!PROD_HIDE.test(' '+noAcc(x[1].name).replace(/[^a-z0-9]+/g,' ')+' ')))});/* chỉ dùng mã hàng hoá HH và thành phẩm TP */
  sub('customers',s=>{R.custInd=new Map(s.docs.map(d=>[d.id,d.data()]).filter(x=>x[1]&&x[1].code));rebuildCustomers()});
  sub('custpack',s=>{R.custPacks=new Map(s.docs.map(d=>[d.id,(d.data()||{}).items||[]]));rebuildCustomers()});
  sub('prices',s=>{R.prices=new Map(s.docs.map(d=>{const x=d.data();return [x.cust,x]}))});
  sub('vouchers',s=>{R.vouchers=s.docs.map(d=>Object.assign({},d.data(),{id:d.id})).filter(v=>v.date&&v.type)});
  db.collection('orders').where('date','>=',windowStart()).onSnapshot(s=>{R.orders=s.docs.map(d=>Object.assign({},d.data(),{id:d.id}));soon();resolveNames()},e=>toast('Mất kết nối đơn hàng ('+e.code+')'));
  db.doc('config/main').onSnapshot(s=>{R.settings=s.exists?s.data():{};soon()},()=>{});
  setTimeout(async()=>{if(!myRole()&&!R.isOwner){try{const r=await db.doc('requests/'+R.uid).get();if(!r.exists)await db.doc('requests/'+R.uid).set({at:Date.now()})}catch(e){}}},2500);
  render()}
const _sheetObs=new MutationObserver(()=>{if($('#sheet').hidden)soon()});_sheetObs.observe($('#sheet'),{attributes:true,attributeFilter:['hidden']});
init();
})();
