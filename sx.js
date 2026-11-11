/* VIBA – Phân hệ Sản xuất (v115). Trang riêng sanxuat.html, dùng chung gas-shim (đăng nhập, đồng bộ).
   Dữ liệu: mcfg/main (mặt hàng, NCC, định mức, đơn giá) · mlog/<id> (phiếu 5 công đoạn).
   Tổ trưởng chỉ nhập số lượng + nhân công/giờ làm; tiền do app tính theo định mức Quản lý cài. */
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* số kiểu Việt: "1.000" = nghìn, "6,5" = thập phân */
function num(v){if(typeof v==='number')return isFinite(v)?v:0;let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;
  if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')}else if(/^\d{1,3}(\.\d{3})+$/.test(s)){s=s.replace(/\./g,'')}const n=parseFloat(s);return isFinite(n)?n:0}
const r3=v=>Math.round(v*1000)/1000;
const fm=(v,d)=>{v=+v||0;return v.toLocaleString('vi-VN',{maximumFractionDigits:d==null?(Math.abs(v)<100?2:0):d})};
const today=()=>{const d=new Date(Date.now()+7*36e5);return d.toISOString().slice(0,10)};
const dmy=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+(s.slice(0,4)!==today().slice(0,4)?'/'+s.slice(0,4):''):'';
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const noAcc=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}

const KIND={
  nvl:{n:'Nhập nguyên liệu',s:'Mía, dứa, khoai… mua về',c:'#1f8a52'},
  sx:{n:'Sản xuất',s:'Nguyên liệu → bán thành phẩm',c:'#1b6aa5'},
  dg:{n:'Đóng gói',s:'Ra túi / hộp thành phẩm',c:'#0e7c86'},
  xuat:{n:'Xuất hàng',s:'Đi kho đông / ra Hà Nội',c:'#b85a12'},
  dgl:{n:'Đóng gói lại',s:'Lấy từ kho đông về đóng',c:'#6b4fa3'}};
const KORDER=['nvl','sx','dg','xuat','dgl'];
const DEST={hn:'Kho Hà Nội',dong:'Kho đông thuê',mau:'Hàng mẫu'};

/* Định mức ban đầu: tính từ file "GIÁ THÀNH CHUNG NĂM 2026.xlsx" ngày 11/11/2026 (Quản lý sửa ở tab Định mức) */
const DM0={tl:0,cong100:0,rate:180000,baoBi:0,dienGa:0,kh:0,thung:0,guiKho:0};
const DEFAULT_CFG={v:2,gioCong:8,
  /* Nguyên liệu (gộp): mọi loại dứa đều là "Dứa" */
  nvls:[{id:'mia',name:'Mía'},{id:'dua',name:'Dứa'},{id:'sau',name:'Sấu'},{id:'ksq',name:'Khoai sọ'},{id:'kmo',name:'Khoai môn'},{id:'docm',name:'Dọc mùng'},{id:'bo',name:'Bơ'},{id:'xoai',name:'Xoài'},{id:'mcau',name:'Mãng cầu'},{id:'cleo',name:'Chanh leo'},{id:'daut',name:'Dâu tây'},{id:'ot',name:'Ớt'},{id:'san',name:'Sắn'},{id:'chuoi',name:'Chuối tây'}],
  /* Thành phẩm: mỗi dòng gắn 1 nguyên liệu, định mức + quy cách riêng (theo file Giá thành chung) */
  items:[
    {id:'mia',name:'Mía',nvl:'mia',bich:false,packs:[[300,'g']],dm:{tl:34.6,cong100:6.21,rate:180000,baoBi:817,dienGa:1000,kh:200,thung:1500,guiKho:0},src:'41 mẻ 01/10–10/11/2026'},
    {id:'duam',name:'Dứa mát',nvl:'dua',bich:false,packs:[[250,'g']],dm:{tl:44.0,cong100:5.95,rate:180000,baoBi:915,dienGa:1136,kh:200,thung:1708,guiKho:0},src:'43 mẻ 01/10–02/11/2026'},
    {id:'duanc',name:'Dứa nguyên chất 1,5kg',nvl:'dua',bich:true,packs:[[1.5,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'sau',name:'Sấu',nvl:'sau',bich:true,packs:[[300,'g'],[500,'g'],[1,'kg']],dm:{tl:0,cong100:0.93,rate:180000,baoBi:0,dienGa:200,kh:500,thung:2000,guiKho:4440},src:'công khoán 1.667 đ/kg TP; chưa đủ số liệu tỷ lệ'},
    {id:'ksq',name:'Khoai sọ',nvl:'ksq',bich:true,packs:[[300,'g'],[1,'kg']],dm:{tl:57.5,cong100:3.58,rate:180000,baoBi:1482,dienGa:870,kh:200,thung:2000,guiKho:2700},src:'16 mẻ năm 2026'},
    {id:'kmo',name:'Khoai môn',nvl:'kmo',bich:true,packs:[[250,'g'],[1,'kg']],dm:{tl:72.4,cong100:2.53,rate:160000,baoBi:1482,dienGa:691,kh:500,thung:2000,guiKho:2700},src:'6 mẻ năm 2026'},
    {id:'docm',name:'Dọc mùng',nvl:'docm',bich:true,packs:[[200,'g'],[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'bo',name:'Bơ',nvl:'bo',bich:true,packs:[[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'xoai',name:'Xoài',nvl:'xoai',bich:true,packs:[[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'mcau',name:'Mãng cầu',nvl:'mcau',bich:true,packs:[[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'cleo',name:'Chanh leo',nvl:'cleo',bich:true,packs:[[400,'g'],[600,'g']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'daut',name:'Dâu tây',nvl:'daut',bich:true,packs:[[900,'g']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'ot',name:'Ớt',nvl:'ot',bich:true,packs:[],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'san',name:'Sắn',nvl:'san',bich:true,packs:[[250,'g'],[400,'g']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'chuoit',name:'Chuối tây đông lạnh',nvl:'chuoi',bich:true,packs:[],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'}],
  /* Nhà cung cấp: file "Danh sách nhà cung cấp" (11/11/2026). code = mã MISA; lot = 3 chữ dùng sinh số lô */
  ncc:[['001082047648','Lê Bá Quỳnh'],['001087041827','Trần văn Đặng'],['001161024959','Phùng Thị Dung'],['001168041185','Lê Thị Thu Hường'],['010086006385','Lý Seo Vư'],['014181006674','Phạm Thị Thúy'],['017093005472','Nguyễn Văn Chung','NVC'],['033182003306','Trần Thị Xoa'],['033191012442','Nguyễn Thị Mơ'],['035078011048','Trần Văn Hùng'],['037301001464','Đinh Thị Nhật Lệ','NLE'],['NCC00001','Dương Chi Chi'],['NCC 0010','Nguyễn Văn Ca'],['NCC 002','E Thoa Daklak'],['NCC 003','E Định Daklak'],['NCC 008','E Thiêm'],['NCC 014','A Châu'],['NCC 015','Trần Văn Ninh']].map(x=>({code:x[0],name:x[1],lot:x[2]||''})),
  xe:['28A-30735','28H-00259','30B-80630']};

const S={db:null,user:null,uid:null,owner:false,staff:null,cfg:null,logs:[],tab:'home',form:null,names:{},ui:{lp:'7',gtFrom:null,gtTo:null,ncDate:null,dmItem:'mia'},ready:false};
const cfg=()=>(S.cfg&&S.cfg.v>=2)?S.cfg:DEFAULT_CFG; /* cấu hình cũ v1 → dùng mặc định v2 tới khi Quản lý mở app (tự nâng) */
const items=()=>cfg().items.filter(i=>i.active!==false);
const tpId=id=>id==='dua'||id==='duaq'?'duam':id; /* phiếu cũ v115 */
const itemOf=id=>cfg().items.find(i=>i.id===tpId(id))||{id,name:id||'?',packs:[],dm:{}};
const nvls=()=>(cfg().nvls||[]).filter(n=>n.active!==false);
const nvlOf=id=>(cfg().nvls||[]).find(n=>n.id===id)||{id,name:id||'?'};
const nvlId=l=>l.nvl||(l.item==='duaq'?'dua':l.item); /* phiếu nhập NVL / sản xuất cũ dùng item */
const tpsOfNvl=n=>items().filter(i=>i.nvl===n);
const role=()=>S.owner?'admin':(S.staff&&S.staff.active!==false?S.staff.role:null);
const isAdmin=()=>role()==='admin';
const canUse=()=>role()==='admin'||role()==='sx';
const liveLogs=()=>S.logs.filter(l=>!l.deleted);
const nameOf=uid=>S.names[uid]||(uid===S.uid?'Tôi':'…');
/* quy cách: trọng lượng + đơn vị g/kg → gram */
const gOf=(w,u)=>r3(num(w)*(u==='kg'?1000:1));
const packLabel=g=>g>=1000?String(r3(g/1000)).replace('.',',')+' kg':String(r3(g)).replace('.',',')+' g';
const packKey=(item,g)=>item+'|'+g;
/* v118: phiếu mới (hv=2) ghi TỔNG giờ làm cả nhóm + tổng giờ tăng ca; phiếu cũ = số người × giờ mỗi người */
const HW=l=>l.hv===2?num(l.hours):num(l.people)*num(l.hours);
const HO=l=>num(l.ot);
const otK=()=>num(cfg().otK)||1.5;
const HC=l=>HW(l)+HO(l)*otK();
const hTxt=l=>`${fm(l.people)} người · ${fm(HW(l))} giờ${HO(l)||num(l.pot)?' | tăng ca '+fm(l.pot)+' người · '+fm(HO(l))+' giờ':''}`;
/* v117: số gói / thùng theo sheet "Quy cách đóng hàng" (GIÁ THÀNH CHUNG 2026); HOP = đóng hộp thay túi */
const PERBOX={'sau|300':45,'sau|500':24,'sau|1000':13,'ksq|300':45,'ksq|1000':13,'daut|900':10,'cleo|400':20,'cleo|600':20,'xoai|1000':12,'bo|1000':12,'mcau|1000':12,'san|400':24,'san|250':30,'docm|200':50,'docm|1000':13,'kmo|250':45,'duanc|1500':10};
const HOP={san:1};
function sugHTML(f){const it=itemOf(f.item);if(!it||!it.id)return '';const dm=it.dm||{},a=num(f.kgIn);
  if(!a)return `<div class="sec">Đề xuất vật tư, nhân công</div><div class="auto">Gõ số kg nguyên liệu đưa vào – app đề xuất vật tư và nhân công cần chuẩn bị.</div>`;
  if(!dm.tl)return `<div class="sec">Đề xuất vật tư, nhân công</div><div class="auto">${esc(it.name)} chưa có định mức tỷ lệ thành phẩm – Quản lý nhập ở tab Định mức để app đề xuất.</div>`;
  const tp=a*dm.tl/100,P=(it.packs||[]).map(p=>gOf(p[0],p[1])).filter(g=>g>0);
  let g=num(f.plan);if(!P.includes(g))g=P[0]||0;
  const cong=dm.cong100?tp*dm.cong100/100:0,gc=cfg().gioCong||8,ng=cong?Math.ceil(cong-0.05):0;
  let rows=`<tr><td>Thành phẩm dự kiến</td><td><b>${fm(tp)} kg</b> <span class="muted">(tỷ lệ ${fm(dm.tl,1)}%)</span></td></tr>`;
  if(cong)rows+=`<tr><td>Nhân công</td><td><b>${fm(cong,1)} công</b> ≈ ${ng} người × ${gc} giờ</td></tr>`;
  if(g){const n=Math.floor(tp*1000/g),pb=PERBOX[it.id+'|'+g];
    rows+=`<tr><td>${HOP[it.id]?'Hộp':'Túi'} ${packLabel(g)}</td><td><b>${fm(n)}</b> cái</td></tr><tr><td>Tem</td><td><b>${fm(n)}</b> cái</td></tr>`+
      `<tr><td>Thùng xốp</td><td>${pb?'<b>'+fm(Math.ceil(n/pb))+'</b> thùng <span class="muted">('+pb+' gói/thùng)</span>':'<span class="muted">chưa có số gói/thùng</span>'}</td></tr>`}
  return `<div class="sec">Đề xuất vật tư, nhân công</div>${P.length>1?`<label class="f"><span class="lab">Dự kiến đóng gói loại</span><select data-f="plan" class="sxin">${P.map(x=>`<option value="${x}"${x===g?' selected':''}>${packLabel(x)}</option>`).join('')}</select></label>`:''}<div class="card sug"><table class="gt">${rows}</table><div class="tiny muted" style="margin-top:6px">Theo định mức · thêm 3–5% dự phòng hỏng túi, tem.</div></div>`}

/* ---------------- TỒN KHO (tính lại từ toàn bộ phiếu) ---------------- */
function calc(){const L=liveLogs().slice().sort((a,b)=>(a.date+String(a.at).padStart(15,'0')).localeCompare(b.date+String(b.at).padStart(15,'0')));
  const lots=new Map(),btp=new Map(),kd=new Map(),tp=new Map(),use=new Map();
  const B=(m,k)=>{if(!m.has(k))m.set(k,{kg:0,bags:0,since:null});return m.get(k)};
  for(const l of L){
    if(l.kind==='nvl'){const n=nvlId(l);if(!lots.has(n))lots.set(n,[]);lots.get(n).push({id:l.id,lot:l.lot,date:l.date,kg:num(l.kg),left:num(l.kg),price:lotPrice(l),ncc:l.ncc})}
    else if(l.kind==='sx'){let need=num(l.kgIn);const used=[];for(const x of lots.get(nvlId(l))||[]){if(need<=1e-9)break;const t=Math.min(x.left,need);if(t>0){x.left=r3(x.left-t);need=r3(need-t);used.push({lot:x.lot,kg:t,price:x.price})}}
      if(need>1e-9)used.push({lot:'(thiếu tồn)',kg:need,price:null});use.set(l.id,used);const b=B(btp,tpId(l.item));b.kg=r3(b.kg+num(l.kgOut));b.bags+=num(l.bags);if(!b.last||l.date>b.last)b.last=l.date}
    else if(l.kind==='dg'){const b=B(btp,tpId(l.item));b.kg=r3(b.kg-num(l.kgUse));b.bags-=num(l.bagsUse);for(const p of l.packs||[]){const k=packKey(tpId(l.item),p.g);tp.set(k,(tp.get(k)||0)+num(p.q))}}
    else if(l.kind==='xuat'){for(const x of l.lines||[]){if(x.t==='tp'){const k=packKey(tpId(x.item),x.g);tp.set(k,(tp.get(k)||0)-num(x.q))}else{const b=B(btp,tpId(x.item));b.kg=r3(b.kg-num(x.kg));b.bags-=num(x.bags);if(l.dest==='dong'){const d=B(kd,tpId(x.item));d.kg=r3(d.kg+num(x.kg));d.bags+=num(x.bags);if(!d.since||l.date<d.since)d.since=l.date}}}}
    else if(l.kind==='dgl'){const d=B(kd,tpId(l.item));d.kg=r3(d.kg-num(l.kgUse));d.bags-=num(l.bagsUse);if(d.kg<=0.001)d.since=null;for(const p of l.packs||[]){const k=packKey(tpId(l.item),p.g);tp.set(k,(tp.get(k)||0)+num(p.q))}}}
  return {lots,btp,kd,tp,use}}
function lotPrice(l){const kg=num(l.kg),p=num(l.price);if(!kg||!p)return null;return (kg*p+num(l.ship)+num(l.extra))/kg}
const nvlLeft=(C,item)=>r3((C.lots.get(item)||[]).reduce((s,x)=>s+x.left,0));

/* ---------------- KHUNG MÀN HÌNH ---------------- */
function tabsDef(){const t=[['home','Làm việc','🏠'],['stock','Tồn kho','📦'],['list','Đã nhập','🕘']];if(isAdmin())t.push(['nc','Nhân công','👷'],['dm','Định mức','📐'],['gt','Giá thành','💰']);return t}
function render(){const v=$('#view');
  if(!S.ready){v.innerHTML='<div class="empty">Đang tải…</div>';return}
  const r=role();
  $('#who').innerHTML=`<span class="chip g">${r==='admin'?'Quản lý':r==='sx'?'Sản xuất':'Chưa phân quyền'}</span><span>${esc(nameOf(S.uid))}</span>${window.vibaChangePw?'<button class="btn sm" onclick="vibaChangePw()">Đổi MK</button>':''}<button class="btn sm" onclick="vibaLogout()">Đăng xuất</button>`;
  if(!canUse()){$('#tabbar').hidden=true;v.innerHTML=`<h1 class="big">Xin chào</h1><div class="card stack"><div style="font-weight:700">Tài khoản chưa có quyền Sản xuất</div><div class="muted">Nhờ Quản lý gán vai trò <b>Sản xuất</b> trong Cài đặt › Nhân viên.${r&&r!=='sx'?' Bạn đang dùng app bán hàng – <a href="index.html">mở app bán hàng</a>.':''}</div></div>`;return}
  const T=tabsDef();if(!T.some(t=>t[0]===S.tab))S.tab='home';
  $('#tabs').innerHTML=T.map(([k,l,i])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}"><span style="font-size:20px;line-height:1">${i}</span><span>${l}</span></button>`).join('');$('#tabbar').hidden=false;
  $$('#tabs [data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;S.form=null;S.post=null;render();scrollTo(0,0)});
  if(isAdmin())$('#modeSw').innerHTML='<a class="btn sm" href="quanly.html">↩ App bán hàng</a>';
  if(S.form)return viewForm(v);
  if(S.post&&S.tab==='home')return viewPost(v);
  ({home:viewHome,stock:viewStock,list:viewList,nc:viewNC,dm:viewDM,gt:viewGT})[S.tab](v);
  syncLine(v)}
function syncLine(v){const s=window.vibaSync;if(!s)return;const t=s.last?new Date(s.last).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'…';
  v.insertAdjacentHTML('afterbegin',`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="tiny muted" style="font-weight:600">${s.err?'⚠️ Mạng yếu – đang thử lại · dữ liệu lúc '+t:'🔄 Cập nhật lúc '+t}</span><button class="btn sm" id="sxRef" style="min-height:0;padding:4px 12px">↻ Làm mới</button></div>`);
  $('#sxRef').onclick=async()=>{toast('Đang tải lại…');try{await s.full();toast('✓ Đã tải lại')}catch(e){toast('Chưa tải được – kiểm tra mạng')}render()}}

/* ---------------- LÀM VIỆC ---------------- */
function viewHome(v){const C=calc();
  const btn=k=>`<button class="sxbig" data-k="${k}" style="background:${KIND[k].c}"><span class="n">${KORDER.indexOf(k)+1}</span><span><b>${KIND[k].n}</b><small>${KIND[k].s}</small></span></button>`;
  const rows=[];for(const n of nvls()){const a=nvlLeft(C,n.id);if(a>0.001)rows.push(`<div class="row"><div class="grow"><div class="t">${esc(n.name)} <span class="tiny muted">nguyên liệu</span></div><div class="s">${fm(a)} kg</div></div></div>`)}
  for(const it of items()){const a=0,b=C.btp.get(it.id),d=C.kd.get(it.id);const tps=[...C.tp.entries()].filter(([k,q])=>k.startsWith(it.id+'|')&&q).map(([k,q])=>fm(q)+' × '+packLabel(+k.split('|')[1]));
    const parts=[];if(a>0.001)parts.push('NVL '+fm(a)+' kg');if(b&&b.kg>0.001)parts.push('BTP '+fm(b.kg)+' kg'+(it.bich&&b.bags?' ('+fm(b.bags)+' bịch)':''));if(d&&d.kg>0.001)parts.push('❄️ '+fm(d.kg)+' kg'+(d.bags?' ('+fm(d.bags)+' bịch)':''));if(tps.length)parts.push('TP '+tps.join(', '));
    if(parts.length)rows.push(`<div class="row"><div class="grow"><div class="t">${esc(it.name)}</div><div class="s">${parts.join(' · ')}</div></div></div>`)}
  const td=liveLogs().filter(l=>l.date===today());
  v.innerHTML=`<h1 class="big" style="margin-bottom:10px">Hôm nay ${dmy(today())}</h1>${KORDER.map(btn).join('')}
   <div class="sec">Hàng đang có</div><div class="group">${rows.join('')||'<div class="empty">Chưa có hàng tồn.</div>'}</div>
   <div class="sec">Đã nhập hôm nay (${td.length})</div><div class="group">${td.slice().sort((a,b)=>b.at-a.at).map(logRow).join('')||'<div class="empty">Chưa có phiếu nào hôm nay.</div>'}</div>`;
  $$('.sxbig').forEach(b=>b.onclick=()=>openForm(b.dataset.k));bindLogRows()}
function logSum(l){const it=itemOf(l.item).name;
  if(l.kind==='nvl')return `${esc(nvlOf(nvlId(l)).name)} · ${esc(l.ncc||'')} · ${fm(l.kg)} kg${l.price?' × '+fm(l.price)+' đ':''} · lô ${esc(l.lot||'')}`;
  if(l.kind==='sx')return `${esc(nvlOf(nvlId(l)).name)} → ${it} · ${fm(l.kgIn)} kg vào${l.bags?' → '+fm(l.bags)+' bịch × '+fm(l.bagW)+' kg':''}`;
  if(l.kind==='dg'||l.kind==='dgl')return `${it} · ${(l.packs||[]).map(p=>fm(p.q)+' × '+packLabel(p.g)).join(', ')} = ${fm(l.kgTP)} kg TP`;
  if(l.kind==='xuat')return `→ ${DEST[l.dest]||l.dest} · ${(l.lines||[]).map(x=>x.t==='tp'?itemOf(x.item).name+' '+packLabel(x.g)+' × '+fm(x.q):itemOf(x.item).name+' '+fm(x.kg)+' kg'+(x.bags?' ('+fm(x.bags)+' bịch)':'')).join(', ')}`;
  return ''}
function logRow(l){return `<div class="row tap" data-lid="${esc(l.id)}"><div class="grow"><div class="t"><span class="chip" style="background:${KIND[l.kind].c};color:#fff">${KIND[l.kind].n}</span> ${dmy(l.date)}${l.deleted?' <span class="chip r">Đã xoá</span>':''}</div><div class="s ell">${logSum(l)}</div><div class="tiny muted">👷 ${hTxt(l)} · ${esc(nameOf(l.by))}</div></div><span class="chev">›</span></div>`}
function bindLogRows(){$$('[data-lid]').forEach(r=>r.onclick=()=>logDetail(S.logs.find(x=>x.id===r.dataset.lid)))}

/* ---------------- PHIẾU 5 CÔNG ĐOẠN ---------------- */
function openForm(kind,pre){const n0=nvls()[0],it=items()[0];S.form={kind,date:today(),nvl:n0?n0.id:'',item:it?it.id:'',people:'',hours:'',pot:'',ot:'',packs:[{w:'',u:'g',q:''}],dest:'hn',xt:'tp',q:{},xe:'',xeO:'',ncc:'',nccQ:'',note:''};
  if(kind==='sx'){const t=tpsOfNvl(S.form.nvl)[0];S.form.item=t?t.id:''}
  if(pre)Object.assign(S.form,pre);
  if(kind==='dg'||kind==='dgl')S.form.packs=packsDefault(S.form.item);S.post=null;
  render();scrollTo(0,0)}
function packsDefault(id){const it=itemOf(id);return (it.packs&&it.packs.length?it.packs.slice(0,1):[['','g']]).map(p=>({w:String(p[0]).replace('.',','),u:p[1],q:''}))}
function selNvl(f){return `<label class="f"><span class="lab">Nguyên liệu</span><select data-f="nvl" class="sxsel">${nvls().map(n=>`<option value="${n.id}" ${f.nvl===n.id?'selected':''}>${esc(n.name)}</option>`).join('')}</select></label>`}
function selItem(f,lab,list){return `<label class="f"><span class="lab">${lab||'Mặt hàng'}</span><select data-f="item" class="sxsel">${(list||items()).map(i=>`<option value="${i.id}" ${f.item===i.id?'selected':''}>${esc(i.name)}</option>`).join('')}</select></label>`}
const inp=(f,k,lab,ph,mode)=>`<label class="f"><span class="lab">${lab}</span><input data-f="${k}" value="${esc(f[k]??'')}" inputmode="${mode||'decimal'}" placeholder="${esc(ph||'')}" class="sxin" autocomplete="off"></label>`;
function packRows(f){return `<div class="sec">Quy cách đóng gói</div>${f.packs.map((p,i)=>`<div class="qc"><div class="qcr"><label><span class="lb">Trọng lượng</span><input data-p="${i}" data-pk="w" value="${esc(p.w)}" inputmode="decimal" placeholder="VD: 300"></label>
   <label><span class="lb">Đơn vị</span><select data-p="${i}" data-pk="u"><option value="g" ${p.u==='g'?'selected':''}>g</option><option value="kg" ${p.u==='kg'?'selected':''}>kg</option></select></label>
   <label><span class="lb">Số gói</span><input data-p="${i}" data-pk="q" value="${esc(p.q)}" inputmode="numeric" placeholder="0"></label></div>
   <div class="qck"><span id="pk${i}"></span>${f.packs.length>1?`<button class="lnk" data-prm="${i}">✕ Bỏ dòng</button>`:''}</div></div>`).join('')}
   <button class="addb" id="pAdd">＋ Thêm quy cách</button>`}
function laborBox(f){return `<div class="sec">Nhân công thực tế – giờ chính thức</div><div class="grid2">${inp(f,'people','Số người','0','numeric')}${inp(f,'hours','Tổng số giờ làm','0')}</div><div class="sec">Tăng ca (nếu có)</div><div class="grid2">${inp(f,'pot','Số người tăng ca','0','numeric')}${inp(f,'ot','Tổng giờ tăng ca','0')}</div><div class="auto" id="lbTot"></div>`}
function viewForm(v){const f=S.form,K=KIND[f.kind],C=calc(),it=itemOf(f.item);let body='';
  if(f.kind==='nvl'){
    body=`${selNvl(f)}<label class="f"><span class="lab">Nhà cung cấp – gõ tìm</span><input id="nccQ" value="${esc(f.ncc&&f.ncc!=='__new'?f.ncc:f.nccQ)}" placeholder="Gõ tên nhà cung cấp…" class="sxin" autocomplete="off"></label><div id="nccL" class="nccl" hidden></div>
     ${f.ncc==='__new'?inp(f,'nccNew','Tên nhà cung cấp mới','VD: Hợp tác xã Tân Lạc','text'):''}${inp(f,'kg','Số kg nhận (đã trừ hỏng)','0')}
     <div class="grid2">${inp(f,'price','Giá nhập (đ/kg)','0')}${inp(f,'ship','Chi phí vận chuyển (đ)','0')}</div><div class="auto" id="calcBox"></div>`}
  else if(f.kind==='sx'){const lots=(C.lots.get(f.nvl)||[]).filter(x=>x.left>0.001),nn=nvlOf(f.nvl).name,TL=tpsOfNvl(f.nvl);
    body=`${selNvl(f)}<div class="auto">${lots.length?esc(nn)+' đang có: '+lots.map(x=>'<b>'+esc(x.lot)+'</b> '+fm(x.left)+' kg').join(' · '):'Chưa có tồn nguyên liệu '+esc(nn)+' – vẫn lưu được, app ghi "thiếu tồn".'}</div>${TL.length?selItem(f,'Làm ra sản phẩm',TL):'<div class="alert r">Nguyên liệu này chưa gắn sản phẩm – Quản lý thêm ở tab Định mức.</div>'}
     ${inp(f,'kgIn','Nguyên liệu đưa vào (kg)','0')}${it.bich?`<div class="grid2">${inp(f,'bags','Số bịch lớn (nếu có)','0','numeric')}${inp(f,'bagW','Trọng lượng 1 bịch (kg)','VD: 25')}</div>`:''}<div class="auto" id="calcBox"></div><div id="sugBox">${sugHTML(f)}</div>`}
  else if(f.kind==='dg'||f.kind==='dgl'){const src=f.kind==='dg'?C.btp.get(f.item):C.kd.get(f.item);const kg=src?src.kg:0,bags=src?src.bags:0;
    body=`${selItem(f)}<div class="auto">${f.kind==='dg'?'Bán thành phẩm ở nhà máy':'Ở kho đông'}: <b>${kg>0.001?fm(kg)+' kg':(f.kind==='dg'?'không cân':'0 kg')}</b>${bags>0?' · '+fm(bags)+' bịch':''}${f.kind==='dgl'&&src&&src.since?' · gửi từ '+dmy(src.since):''}</div>
     ${it.bich?`<div class="grid2">${inp(f,'bagsUse',f.kind==='dg'?'Lấy ra bao nhiêu bịch':'Lấy về bao nhiêu bịch','0','numeric')}${inp(f,'bagW','Trọng lượng 1 bịch (kg)',bags>0?'TB '+String(r3(kg/bags)).replace('.',','):'VD: 25')}</div>`:inp(f,'kgUse',f.kind==='dg'?'Bán thành phẩm dùng (kg)':'Số kg lấy về','để trống = bằng kg thành phẩm')}
     ${f.kind==='dgl'?xeSel(f):''}${packRows(f)}<div class="auto" id="calcBox"></div>`}
  else if(f.kind==='xuat'){
    body=`<label class="f"><span class="lab">Đi đâu</span><div class="opt">${['hn','dong'].map(d=>`<button data-dest="${d}" class="${f.dest===d?'on':''}">${d==='hn'?'🏙️ Hà Nội':'❄️ Kho đông'}</button>`).join('')}</div></label>
     <label class="f"><span class="lab">Xuất cái gì</span><div class="opt">${[['tp','Thành phẩm'],['btp','Bán thành phẩm / bịch']].map(([k,l])=>`<button data-xt="${k}" class="${f.xt===k?'on':''}">${l}</button>`).join('')}</div></label>`;
    if(f.xt==='tp'){const L=[...C.tp.entries()].filter(([k,q])=>q>0).sort();
      body+=`<div class="sec">Số lượng xuất</div><div class="group">${L.map(([k,q])=>{const [id,g]=k.split('|');return `<div class="row"><div class="grow"><div class="t">${esc(itemOf(id).name)} ${packLabel(+g)}</div><div class="s">đang có ${fm(q)}</div></div><input class="xq" data-xk="${esc(k)}" value="${esc(f.q[k]??'')}" inputmode="numeric" placeholder="0"></div>`}).join('')||'<div class="empty">Không có thành phẩm tồn.</div>'}</div>
       ${f.dest==='hn'?`<label class="chk"><input type="checkbox" data-f="mau" ${f.mau?'checked':''}> Phần còn lại của các mặt hàng vừa xuất ghi vào <b>Hàng mẫu</b></label>`:''}`}
    else{const L=items().filter(i=>{const b=C.btp.get(i.id);return b&&(b.kg>0.001||b.bags>0||(b.last&&b.last>=addDays(today(),-30)))});
      body+=`<div class="sec">Bán thành phẩm ở nhà máy</div><div class="group">${L.map(i=>{const b=C.btp.get(i.id);return `<div class="row"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">${b.kg>0.001?'có '+fm(b.kg)+' kg':'không cân – gõ kg xuất'}${b.bags>0?' · '+fm(b.bags)+' bịch':''}</div></div><div style="display:flex;gap:6px">${i.bich?`<input class="xq" data-xb="${i.id}" value="${esc(f.q['b|'+i.id]??'')}" inputmode="numeric" placeholder="bịch" style="width:64px">`:''}<input class="xq" data-xg="${i.id}" value="${esc(f.q['k|'+i.id]??'')}" inputmode="decimal" placeholder="kg" style="width:76px"></div></div>`}).join('')||'<div class="empty">Không có bán thành phẩm tồn.</div>'}</div>`}
    body+=xeSel(f)}
  v.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><h1 class="big" style="margin:0"><span class="kn" style="background:${K.c}">${KORDER.indexOf(f.kind)+1}</span> ${K.n}</h1><button class="btn sm" id="fX">✕ Đóng</button></div>
   <label class="f" style="margin-top:10px"><span class="lab">Ngày</span><input type="date" data-f="date" value="${esc(f.date)}" max="${today()}" class="sxin"></label>
   ${body}${laborBox(f)}${inp(f,'note','Ghi chú (nếu có)','','text')}<div id="fMsg"></div><button class="btn block pri sxsave" id="fSave">Lưu</button>`;
  bindForm()}
function xeSel(f){const L=cfg().xe||[];return `<label class="f"><span class="lab">Xe</span><select data-f="xe" class="sxsel"><option value="">— Chọn xe —</option>${L.map(x=>`<option ${f.xe===x?'selected':''}>${esc(x)}</option>`).join('')}<option value="__o" ${f.xe==='__o'?'selected':''}>+ Xe khác… (gõ biển số)</option></select></label>${f.xe==='__o'?inp(f,'xeO','Biển số xe khác','VD: 29C-12345','text'):''}`}
const xeVal=f=>f.xe==='__o'?String(f.xeO||'').trim().toUpperCase():String(f.xe||'').trim();
function bindForm(){const f=S.form;
  $('#fX').onclick=()=>{S.form=null;render()};
  $$('[data-f]').forEach(el=>{const k=el.dataset.f;const h=()=>{f[k]=el.type==='checkbox'?el.checked:el.value;if(k==='item'){f.packs=packsDefault(el.value);f.q={};render()}else if(k==='nvl'){const t=tpsOfNvl(el.value)[0];f.item=t?t.id:'';f.ncc='';f.nccQ='';f.packs=packsDefault(f.item);render()}else if(k==='ncc'||k==='date'||k==='xe')render();else upd()};el.oninput=h;el.onchange=h});
  $$('[data-p]').forEach(el=>{const h=()=>{f.packs[+el.dataset.p][el.dataset.pk]=el.value;upd()};el.oninput=h;el.onchange=h});
  $$('[data-prm]').forEach(b=>b.onclick=()=>{f.packs.splice(+b.dataset.prm,1);render()});
  const pa=$('#pAdd');if(pa)pa.onclick=()=>{const used=new Set(f.packs.map(p=>gOf(p.w,p.u)));const nx=(itemOf(f.item).packs||[]).find(p=>!used.has(gOf(p[0],p[1])));f.packs.push(nx?{w:String(nx[0]).replace('.',','),u:nx[1],q:''}:{w:'',u:'g',q:''});render()};
  $$('[data-dest]').forEach(b=>b.onclick=()=>{f.dest=b.dataset.dest;if(f.dest==='dong')f.xt='btp';render()});
  $$('[data-xt]').forEach(b=>b.onclick=()=>{f.xt=b.dataset.xt;f.q={};render()});
  $$('[data-xk]').forEach(el=>el.oninput=()=>{f.q[el.dataset.xk]=el.value});
  $$('[data-xg]').forEach(el=>el.oninput=()=>{f.q['k|'+el.dataset.xg]=el.value});
  $$('[data-xb]').forEach(el=>el.oninput=()=>{f.q['b|'+el.dataset.xb]=el.value;const C=calc(),b=C.btp.get(el.dataset.xb);if(b&&b.bags>0){const kg=r3(num(el.value)*b.kg/b.bags);const g=$(`[data-xg="${el.dataset.xb}"]`);if(g&&!f.q['k|'+el.dataset.xb+'#t']){g.value=kg?String(kg).replace('.',','):'';f.q['k|'+el.dataset.xb]=g.value}}});
  bindNcc();$('#fSave').onclick=save;upd()}
function nccRank(f,q){const used=new Map();for(const l of liveLogs())if(l.kind==='nvl'&&nvlId(l)===f.nvl&&l.ncc)used.set(l.ncc,(used.get(l.ncc)||0)+1);
  const ws=noAcc(q).trim().split(/\s+/).filter(Boolean);const L=(cfg().ncc||[]).filter((n,i,a)=>a.findIndex(m=>m.name===n.name)===i).filter(n=>{const t=noAcc(n.name+' '+(n.code||''));return ws.every(w=>t.includes(w))});
  return L.sort((a,b)=>(used.get(b.name)||0)-(used.get(a.name)||0)||a.name.localeCompare(b.name,'vi')).slice(0,8)}
function bindNcc(){const f=S.form,q=$('#nccQ'),box=$('#nccL');if(!q)return;
  const show=()=>{const L=nccRank(f,q.value);box.innerHTML=L.map(n=>`<div data-nn="${esc(n.name)}"><b>${esc(n.name)}</b><small>${esc(n.code||'')}</small></div>`).join('')+`<div data-nn="__new" class="nnew">＋ Nhà cung cấp khác…</div>`;box.hidden=false;
    box.querySelectorAll('[data-nn]').forEach(d=>d.onmousedown=e=>{e.preventDefault();const v=d.dataset.nn;if(v==='__new'){f.ncc='__new';f.nccQ='';render();const x=$('[data-f=nccNew]');if(x)x.focus()}else{f.ncc=v;f.nccQ=v;q.value=v;box.hidden=true;upd()}})};
  q.onfocus=show;q.oninput=()=>{f.nccQ=q.value;if(f.ncc&&f.ncc!=='__new'&&q.value!==f.ncc)f.ncc='';show()};q.onblur=()=>setTimeout(()=>box.hidden=true,150)}
function useKg(f,src){const bu=num(f.bagsUse);if(bu){const w=num(f.bagW)||(src&&src.bags>0?src.kg/src.bags:0);return r3(bu*w)}return num(f.kgUse)}
function packsKg(f){let kg=0;for(const p of f.packs){const g=gOf(p.w,p.u),q=num(p.q);if(g>0&&q>0)kg+=g*q/1000}return r3(kg)}
function upd(){const f=S.form,C=calc(),it=itemOf(f.item);const lt=$('#lbTot');if(lt){const t=num(f.hours),o=num(f.ot),gc=cfg().gioCong||8;lt.innerHTML=t||o?'Chính thức: <b>'+fm(num(f.people))+' người · '+fm(t)+' giờ</b> ('+fm(t/gc,2)+' công)'+(o||num(f.pot)?'<br>Tăng ca: <b>'+fm(num(f.pot))+' người · '+fm(o)+' giờ</b> ('+fm(o/gc,2)+' công)':''):'Tổng số giờ = cộng giờ của cả nhóm (VD 5 người × 8 giờ = 40). Tăng ca ghi riêng số người và tổng giờ tăng ca.'}
  f.packs.forEach((p,i)=>{const e=$('#pk'+i);if(e){const g=gOf(p.w,p.u),q=num(p.q);e.textContent=g&&q?'= '+fm(g*q/1000)+' kg':''}});
  const sb=$('#sugBox');if(sb&&f.kind==='sx'){sb.innerHTML=sugHTML(f);$$('#sugBox [data-f]').forEach(el=>el.onchange=()=>{f.plan=el.value;upd()})}
  const cb=$('#calcBox');if(!cb)return;
  if(f.kind==='nvl'){const n=nccPick(f),kg=num(f.kg),p=num(f.price),sh=num(f.ship);cb.innerHTML=(kg&&p?`Tiền hàng ${fm(kg)} × ${fm(p)} = ${fm(kg*p)}${sh?'<br>+ Vận chuyển '+fm(sh):''}<br>Giá lô: <b>${fm((kg*p+sh)/kg)} đ/kg</b> · `:'Gõ kg và giá nhập để tính giá lô · ')+`Số lô <b>${esc(lotCode(n.lot||n.code,f.date))}</b>`}
  else if(f.kind==='sx'){const a=num(f.kgIn),bw=num(f.bags)*num(f.bagW),av=nvlLeft(C,f.nvl);cb.innerHTML=`Nguyên liệu còn tồn: <b>${fm(av)} kg</b>${a>av+0.001?' <span style="color:var(--bad)">(đưa vào nhiều hơn tồn)</span>':''}<br>Không cần cân bán thành phẩm – tỷ lệ thành phẩm app tính từ kg đóng gói ở bước ③ / ⑤.`+(bw?`<br>Bịch: ${fm(num(f.bags))} × ${fm(num(f.bagW))} kg = <b>${fm(bw)} kg</b>`:'')}
  else{const kg=packsKg(f),src=f.kind==='dg'?C.btp.get(f.item):C.kd.get(f.item);const use=useKg(f,src);
    cb.innerHTML=kg?`Thành phẩm <b>${fm(kg)} kg</b>${use?' · từ '+fm(use)+' kg ('+fm(kg/use*100,1)+'%)':''}${it.dm&&it.dm.baoBi?'<br>Túi, tem: tự trừ theo số gói':''}`:'Gõ trọng lượng, chọn g/kg và số gói.'}}
function nccPick(f){if(f.ncc==='__new'){const n=String(f.nccNew||'').trim();return {name:n,code:'',lot:autoCode(n),fresh:true}}const nm=f.ncc||String(f.nccQ||'').trim();const x=(cfg().ncc||[]).find(n=>n.name===nm);return x?{name:x.name,code:x.code||'',lot:x.lot||autoCode(x.name)}:{name:nm,code:'',lot:autoCode(nm),fresh:!!nm}}
function autoCode(n){const w=noAcc(n).toUpperCase().replace(/[^A-Z ]/g,'').split(/\s+/).filter(Boolean);if(!w.length)return 'NCC';return (w.length>=3?w.slice(-3).map(x=>x[0]).join(''):w.length===2?w[0][0]+w[1].slice(0,2):w[0].slice(0,3)).padEnd(3,'X')}
function lotCode(code,date){const base=(code||'NCC')+date.slice(8,10)+date.slice(5,7);const used=new Set(liveLogs().filter(l=>l.kind==='nvl').map(l=>l.lot));if(!used.has(base))return base;for(let i=2;i<50;i++)if(!used.has(base+'-'+i))return base+'-'+i;return base+'-'+Date.now()%1000}
function newId(date){return 'P'+date.replace(/-/g,'').slice(2)+'-'+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)}
async function save(){const f=S.form,C=calc(),it=itemOf(f.item),msg=t=>$('#fMsg').innerHTML='<div class="alert r">'+esc(t)+'</div>';
  const people=num(f.people),hours=num(f.hours),ot=num(f.ot),pot=num(f.pot);
  if(!f.date)return msg('Chọn ngày.');if(f.date>today())return msg('Ngày không được sau hôm nay.');
  const d={kind:f.kind,date:f.date,people,hours,pot,ot,hv:2,note:String(f.note||'').trim(),by:S.uid,at:Date.now()};
  if(f.kind==='nvl'){if(!f.nvl)return msg('Chọn nguyên liệu.');d.nvl=f.nvl}
  else if(f.kind!=='xuat'){if(!f.item)return msg('Chọn mặt hàng.');d.item=f.item;if(f.kind==='sx')d.nvl=f.nvl}
  if(f.kind==='nvl'){const n=nccPick(f);if(!n.name)return msg('Chọn nhà cung cấp.');const kg=num(f.kg);if(kg<=0)return msg('Gõ số kg nhận.');const price=num(f.price),ship=num(f.ship);if(price<=0&&!confirm('Chưa gõ giá nhập. Vẫn lưu (kế toán điền sau)?'))return;Object.assign(d,{ncc:n.name,nccCode:n.code,kg,price,ship,lot:lotCode(n.lot,f.date)});
    if(n.fresh){const c=JSON.parse(JSON.stringify(cfg()));c.ncc.push({name:n.name,code:'',lot:n.lot,fresh:true,by:S.uid});try{await S.db.doc('mcfg/main').set(c)}catch(e){}}}
  else if(f.kind==='sx'){const a=num(f.kgIn);if(a<=0)return msg('Gõ số kg nguyên liệu đưa vào.');const bg=num(f.bags),bw=num(f.bagW);if(bg&&!bw)return msg('Gõ trọng lượng 1 bịch.');Object.assign(d,{kgIn:a,kgOut:r3(bg*bw),bags:bg,bagW:bw})}
  else if(f.kind==='dg'||f.kind==='dgl'){const packs=[];for(const p of f.packs){const g=gOf(p.w,p.u),q=num(p.q);if(!g&&!q)continue;if(!g)return msg('Có dòng chưa gõ trọng lượng.');if(!q)return msg('Có dòng chưa gõ số gói.');packs.push({g,q})}
    if(!packs.length)return msg('Gõ ít nhất 1 quy cách và số gói.');const kgTP=r3(packs.reduce((s,p)=>s+p.g*p.q/1000,0));const src=f.kind==='dg'?C.btp.get(f.item):C.kd.get(f.item);
    const bu=num(f.bagsUse);if(it.bich&&bu&&!num(f.bagW)&&!(src&&src.bags>0))return msg('Gõ trọng lượng 1 bịch.');let use=useKg(f,src);if(!use)use=kgTP;
    if(src&&use>src.kg+0.5&&!confirm(`Dùng ${fm(use)} kg nhưng ${f.kind==='dg'?'nhà máy':'kho đông'} chỉ còn ${fm(src.kg)} kg. Vẫn lưu?`))return;
    if(use<kgTP*0.95&&!confirm(`Thành phẩm ${fm(kgTP)} kg lớn hơn số dùng ${fm(use)} kg. Vẫn lưu?`))return;
    Object.assign(d,{packs,kgTP,kgUse:use,bagsUse:bu,bagW:num(f.bagW)||(bu?r3(use/bu):0)});if(f.kind==='dgl')d.xe=xeVal(f);
    const known=new Set((it.packs||[]).map(p=>gOf(p[0],p[1])));const fresh=packs.filter(p=>!known.has(p.g));if(fresh.length){const c=JSON.parse(JSON.stringify(cfg()));const ci=c.items.find(i=>i.id===f.item);if(ci){ci.packs=(ci.packs||[]).concat(fresh.map(p=>p.g>=1000?[r3(p.g/1000),'kg']:[p.g,'g']));try{await S.db.doc('mcfg/main').set(c)}catch(e){}}}}
  else if(f.kind==='xuat'){const lines=[];
    if(f.xt==='tp'){for(const [k,q0] of C.tp.entries()){const q=num(f.q[k]);if(!q)continue;if(q>q0+1e-9&&!confirm(`${itemOf(k.split('|')[0]).name} ${packLabel(+k.split('|')[1])}: xuất ${fm(q)} nhưng chỉ có ${fm(q0)}. Vẫn lưu?`))return;const [id,g]=k.split('|');lines.push({t:'tp',item:id,g:+g,q})}}
    else{for(const i of items()){const kg=num(f.q['k|'+i.id]),bags=num(f.q['b|'+i.id]);if(!kg&&!bags)continue;const b=C.btp.get(i.id);let k2=kg;if(!k2&&bags&&b&&b.bags>0)k2=r3(bags*b.kg/b.bags);if(!k2)return msg('Gõ số kg '+i.name+'.');lines.push({t:'btp',item:i.id,kg:k2,bags})}}
    if(!lines.length)return msg('Gõ số lượng xuất.');Object.assign(d,{dest:f.dest,lines,xe:xeVal(f)});
    if(f.xt==='tp'&&f.dest==='hn'&&f.mau){const rest=[],its=new Set(lines.map(x=>x.item));for(const [k,q0] of C.tp.entries()){if(!its.has(k.split('|')[0]))continue;const q=q0-num(f.q[k]);if(q>0){const [id,g]=k.split('|');rest.push({t:'tp',item:id,g:+g,q})}}if(rest.length)d.mauLines=rest}}
  if(ot&&!pot)return msg('Gõ số người tăng ca.');if(!people||!(hours||ot)){if(!confirm('Chưa ghi số người / tổng số giờ làm. Vẫn lưu?'))return}
  const btn=$('#fSave');btn.disabled=true;btn.textContent='Đang lưu…';
  try{const id=newId(f.date);await S.db.doc('mlog/'+id).set(d);
    if(d.mauLines){const m={kind:'xuat',date:f.date,dest:'mau',lines:d.mauLines,people:0,hours:0,hv:2,note:'Phần còn lại sau xuất Hà Nội',by:S.uid,at:Date.now()+1};delete d.mauLines;await S.db.doc('mlog/'+newId(f.date)).set(m)}
    toast('✓ Đã lưu '+KIND[f.kind].n.toLowerCase());S.form=null;S.tab='home';if(f.kind==='dgl')S.post={item:tpId(d.item),packs:d.packs};render();scrollTo(0,0)}
  catch(e){if(e&&e.code==='queued'){toast('⏳ Mạng yếu: đã giữ phiếu trên máy, app tự gửi lại');S.form=null;S.tab='home';render();return}btn.disabled=false;btn.textContent='Lưu';msg('Chưa lưu được: '+(e.message||'lỗi mạng')+'. Thử lại.')}}

function viewPost(v){const p=S.post,it=itemOf(p.item);
  v.innerHTML=`<h1 class="big"><span class="kn" style="background:${KIND.dgl.c}">5</span> Đóng gói lại</h1><div class="alert g">✓ Đã lưu đóng gói lại<br>${esc(it.name)}: ${p.packs.map(x=>fm(x.q)+' × '+packLabel(x.g)).join(' + ')}</div>
   <div class="auto">Bước tiếp theo: <b>xuất hàng</b> đi Hà Nội hoặc gửi lại kho đông.</div>
   <button class="sxbig" id="pX" style="background:${KIND.xuat.c}"><span class="n">4</span><span><b>Xuất hàng ngay</b><small>Mở sẵn phiếu xuất với số túi vừa đóng</small></span></button><button class="btn block" id="pL">Để sau – về màn hình chính</button>`;
  $('#pX').onclick=()=>{const q={};for(const x of p.packs){const k=packKey(p.item,x.g);q[k]=String((+q[k]||0)+x.q)}S.post=null;openForm('xuat',{dest:'hn',xt:'tp',q})};
  $('#pL').onclick=()=>{S.post=null;render()}}

/* ---------------- CHI TIẾT / SỬA PHIẾU ---------------- */
function sheet(title,html){const s=$('#sheet');s.innerHTML=`<div class="pane"><div class="bar"><h3>${title}</h3><button class="btn sm" id="shX">✕</button></div><div style="overflow:auto;padding:14px 16px 22px">${html}</div></div>`;s.hidden=false;
  const close=()=>{s.hidden=true;s.innerHTML='';if(S._pend){S._pend=false;render()}};$('#shX').onclick=close;s.onclick=e=>{if(e.target===s)close()};return close}
function logDetail(l){if(!l)return;const C=calc();const mine=l.by===S.uid,adm=isAdmin();const canEdit=adm||(mine&&l.date===today()&&!l.deleted);
  let det=`<div class="s">${logSum(l)}</div>`;
  if(l.kind==='sx'){const u=C.use.get(l.id)||[];det+=`<div class="tiny muted" style="margin-top:4px">Lô đã dùng: ${u.map(x=>esc(x.lot)+' '+fm(x.kg)+' kg').join(' · ')||'—'}</div>`}
  if(l.xe)det+=`<div class="tiny muted">Xe: ${esc(l.xe)}</div>`;if(l.note)det+=`<div class="tiny">📝 ${esc(l.note)}</div>`;
  if(l.edits&&l.edits.length)det+=`<div class="tiny muted" style="margin-top:4px">Đã sửa: ${l.edits.map(e=>esc(nameOf(e.by))+' '+new Date(e.at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})+' ('+esc(e.what)+')').join('; ')}</div>`;
  let ed='';if(canEdit&&!l.deleted){ed=`<div class="sec">Nhân công</div><div class="grid2"><label class="f"><span class="lab">Số người</span><input id="eP" value="${fm(l.people)}" inputmode="numeric"></label></div><div class="grid2"><label class="f"><span class="lab">Tổng số giờ làm</span><input id="eH" value="${String(HW(l)||'').replace('.',',')}" inputmode="decimal"></label></div><div class="grid2"><label class="f"><span class="lab">Số người tăng ca</span><input id="ePo" value="${num(l.pot)?fm(l.pot):''}" inputmode="numeric"></label><label class="f"><span class="lab">Tổng giờ tăng ca</span><input id="eO" value="${String(HO(l)||'').replace('.',',')}" inputmode="decimal"></label></div>`;
    if(l.kind==='nvl'&&adm)ed+=`<div class="sec">Giá mua (kế toán điền theo phiếu MISA)</div><div class="grid2"><label class="f"><span class="lab">Đơn giá (đ/kg)</span><input id="ePr" value="${l.price?fm(l.price):''}" inputmode="decimal"></label><label class="f"><span class="lab">Vận chuyển (đ)</span><input id="eSh" value="${l.ship?fm(l.ship):''}" inputmode="decimal"></label></div><label class="f"><span class="lab">Chi phí khác (đ)</span><input id="eEx" value="${l.extra?fm(l.extra):''}" inputmode="decimal"></label><label class="f"><span class="lab">Số phiếu MISA</span><input id="eMs" value="${esc(l.misa||'')}"></label>`;
    ed+=`<div id="eMsg"></div><button class="btn block pri" id="eSave">Lưu thay đổi</button><button class="btn block" id="eDel" style="color:var(--bad)">Xoá phiếu</button>`}
  const close=sheet(`${KIND[l.kind].n} · ${dmy(l.date)}`,`${det}<div class="tiny muted" style="margin-top:6px">Người nhập: ${esc(nameOf(l.by))} · ${new Date(l.at).toLocaleString('vi-VN')}</div>${ed}`);
  if(!ed)return;
  $('#eSave').onclick=async()=>{const p={people:num($('#eP').value),hours:num($('#eH').value),ot:num($('#eO').value),pot:num($('#ePo').value),hv:2};const what=[];if(p.people!==num(l.people)||p.hours!==HW(l)||p.ot!==HO(l)||p.pot!==num(l.pot))what.push('công '+hTxt(l)+' → '+hTxt(p));
    if($('#ePr')){p.price=num($('#ePr').value);p.extra=num($('#eEx').value);p.ship=num($('#eSh').value);p.misa=$('#eMs').value.trim();if(p.price!==num(l.price)||p.extra!==num(l.extra)||p.ship!==num(l.ship))what.push('giá')}
    if(what.length)p.edits=(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:what.join(', ')}]);
    try{await S.db.doc('mlog/'+l.id).update(p);toast('✓ Đã lưu');close()}catch(e){$('#eMsg').innerHTML='<div class="alert r">Chưa lưu được.</div>'}};
  $('#eDel').onclick=async()=>{if(!confirm('Xoá phiếu này? (Phiếu được đánh dấu đã xoá, Quản lý vẫn xem lại được.)'))return;try{await S.db.doc('mlog/'+l.id).update({deleted:true,edits:(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:'xoá'}])});toast('Đã xoá phiếu');close()}catch(e){toast('Chưa xoá được')}}}

/* ---------------- TỒN KHO ---------------- */
function viewStock(v){const C=calc();let h='<h1 class="big">Tồn kho</h1>';
  const nv=nvls().map(i=>{const L=(C.lots.get(i.id)||[]).filter(x=>x.left>0.001);return L.length?`<div class="row"><div class="grow"><div class="t">${esc(i.name)} · ${fm(nvlLeft(C,i.id))} kg</div><div class="s">${L.map(x=>esc(x.lot)+' ('+dmy(x.date)+') '+fm(x.left)+' kg').join(' · ')}</div></div></div>`:''}).join('');
  const bt=items().map(i=>{const b=C.btp.get(i.id);return b&&b.kg>0.001?`<div class="row"><div class="grow t">${esc(i.name)}</div><div class="num">${fm(b.kg)} kg${b.bags?' · '+fm(b.bags)+' bịch':''}</div></div>`:''}).join('');
  const kd=items().map(i=>{const b=C.kd.get(i.id);return b&&Math.abs(b.kg)>0.001?`<div class="row"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">${b.since?'gửi từ '+dmy(b.since)+' · '+Math.round((new Date(today())-new Date(b.since))/864e5)+' ngày':''}</div></div><div class="num">${fm(b.kg)} kg${b.bags?' · '+fm(b.bags)+' bịch':''}</div></div>`:''}).join('');
  const tp=[...C.tp.entries()].filter(([k,q])=>Math.abs(q)>1e-9).sort().map(([k,q])=>{const [id,g]=k.split('|');return `<div class="row"><div class="grow t">${esc(itemOf(id).name)} ${packLabel(+g)}</div><div class="num" style="${q<0?'color:var(--bad)':''}">${fm(q)} gói</div></div>`}).join('');
  h+=`<div class="sec">Nguyên liệu (theo lô)</div><div class="group">${nv||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">Bán thành phẩm ở nhà máy</div><div class="group">${bt||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">❄️ Kho đông thuê</div><div class="group">${kd||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">Thành phẩm ở nhà máy</div><div class="group">${tp||'<div class="empty">Không có.</div>'}</div>`;
  v.innerHTML=h}

/* ---------------- ĐÃ NHẬP ---------------- */
function viewList(v){const n=S.ui.lp;const from=n==='all'?'0000':addDays(today(),-(+n-1));const L=S.logs.filter(l=>l.date>=from&&(isAdmin()||!l.deleted)).sort((a,b)=>(b.date+String(b.at)).localeCompare(a.date+String(a.at)));
  v.innerHTML=`<h1 class="big">Đã nhập</h1><div class="opt" style="margin-bottom:10px">${[['1','Hôm nay'],['7','7 ngày'],['31','31 ngày'],['all','Tất cả']].map(([k,l])=>`<button data-lp="${k}" class="${n===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="group">${L.map(logRow).join('')||'<div class="empty">Không có phiếu.</div>'}</div>`;
  $$('[data-lp]').forEach(b=>b.onclick=()=>{S.ui.lp=b.dataset.lp;render()});bindLogRows()}

/* ---------------- QUẢN LÝ: NHÂN CÔNG ---------------- */
function viewNC(v){const d=S.ui.ncDate||today();const L=liveLogs().filter(l=>l.date===d).sort((a,b)=>KORDER.indexOf(a.kind)-KORDER.indexOf(b.kind)||String(a.item).localeCompare(String(b.item)));const gc=cfg().gioCong||8;
  const by=new Map();for(const l of L){const k=l.kind==='nvl'||l.kind==='xuat'?'_chung':tpId(l.item);const x=by.get(k)||{h:0,kg:0};x.h+=HW(l)+HO(l);if(l.kind==='dg'||l.kind==='dgl')x.kg+=num(l.kgTP);by.set(k,x)}
  const sum=[...by.entries()].map(([k,x])=>{if(k==='_chung')return `<div class="row"><div class="grow t">Nhập NVL + Xuất hàng (chung)</div><div class="num">${fm(x.h)} giờ · ${fm(x.h/gc,2)} công</div></div>`;const it=itemOf(k),dm=it.dm||{};const c100=x.kg?x.h/gc/x.kg*100:null;const ok=c100!=null&&dm.cong100?c100<=dm.cong100*1.05:null;
    return `<div class="row"><div class="grow"><div class="t">${esc(it.name)}</div><div class="s">${fm(x.h)} giờ = ${fm(x.h/gc,2)} công${x.kg?' · '+fm(x.kg)+' kg TP':''}</div></div>${c100!=null?`<span class="chip ${ok?'g':'r'}">${fm(c100,2)} công/100kg · ĐM ${fm(dm.cong100,2)}</span>`:''}</div>`}).join('');
  v.innerHTML=`<h1 class="big">Nhân công</h1><label class="f"><span class="lab">Ngày</span><input type="date" id="ncD" value="${d}" max="${today()}"></label>
   <div class="tiny muted" style="margin:4px 0 8px">Số người, tổng giờ chính thức và tăng ca lấy từ phiếu tổ trưởng. Sửa trực tiếp rồi bấm Lưu – app ghi lại ai sửa. Quy đổi ${gc} giờ = 1 công.</div>
   ${L.length?'<div class="nchd"><span>Người</span><span>Giờ</span><span>Người TC</span><span>Giờ TC</span></div>':''}<div class="group">${L.map(l=>`<div class="row"><div class="grow"><div class="t">${esc(l.kind==='nvl'?nvlOf(nvlId(l)).name+' (NVL)':l.item?itemOf(l.item).name:'Chung')}</div><div class="s">${KORDER.indexOf(l.kind)+1}. ${KIND[l.kind].n} · ${esc(nameOf(l.by))}</div></div><input class="ncin" data-nid="${l.id}" data-nk="people" value="${fm(l.people)}" inputmode="numeric"><input class="ncin" data-nid="${l.id}" data-nk="hours" value="${String(HW(l)||0).replace('.',',')}" inputmode="decimal"><input class="ncin" data-nid="${l.id}" data-nk="pot" value="${fm(num(l.pot))}" inputmode="numeric"><input class="ncin" data-nid="${l.id}" data-nk="ot" value="${String(HO(l)||0).replace('.',',')}" inputmode="decimal"></div>`).join('')||'<div class="empty">Không có phiếu ngày này.</div>'}</div>
   ${L.length?'<button class="btn block pri" id="ncSave">Lưu</button>':''}
   <div class="sec">Tổng theo mặt hàng</div><div class="group">${sum||'<div class="empty">—</div>'}</div>`;
  $('#ncD').onchange=e=>{S.ui.ncDate=e.target.value;render()};
  const sv=$('#ncSave');if(sv)sv.onclick=async()=>{let n=0;for(const l of L){const p=num($(`[data-nid="${l.id}"][data-nk="people"]`).value),h=num($(`[data-nid="${l.id}"][data-nk="hours"]`).value),o=num($(`[data-nid="${l.id}"][data-nk="ot"]`).value),po=num($(`[data-nid="${l.id}"][data-nk="pot"]`).value);if(p!==num(l.people)||h!==HW(l)||o!==HO(l)||po!==num(l.pot)){n++;const nw={people:p,hours:h,pot:po,ot:o,hv:2};await S.db.doc('mlog/'+l.id).update({...nw,edits:(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:'công '+hTxt(l)+' → '+hTxt(nw)}])})}}toast(n?'✓ Đã lưu '+n+' dòng':'Không có thay đổi')}}

/* ---------------- QUẢN LÝ: ĐỊNH MỨC ---------------- */
const DMF=[['tl','Tỷ lệ thành phẩm (%)','kg TP / kg nguyên liệu'],['cong100','Nhân công (công / 100 kg TP)',''],['rate','Đơn giá 1 công (đ)',''],['baoBi','Túi + tem + hộp… (đ / gói)','tính theo số gói'],['dienGa','Điện, ga (đ / kg TP)',''],['kh','Khấu hao TSCĐ (đ / kg TP)',''],['thung','Thùng xốp, vận chuyển (đ / kg TP)',''],['guiKho','Gửi kho đông (đ / kg TP)','định mức như file giá thành']];
function viewDM(v){const c=cfg();const id=S.ui.dmItem&&c.items.some(i=>i.id===S.ui.dmItem)?S.ui.dmItem:c.items[0].id;const it=c.items.find(i=>i.id===id);const dm=it.dm||{};
  v.innerHTML=`<h1 class="big">Định mức 1 kg thành phẩm</h1>
   <label class="f"><span class="lab">Mặt hàng</span><select id="dmI" class="sxsel">${c.items.map(i=>`<option value="${i.id}" ${i.id===id?'selected':''}>${esc(i.name)}${i.active===false?' (ẩn)':''}</option>`).join('')}</select></label>
   <div class="group">${DMF.map(([k,l,s])=>`<div class="row"><div class="grow"><div class="t">${l}</div>${s?`<div class="s">${s}</div>`:''}</div><input class="dmin" data-dk="${k}" value="${dm[k]!=null?String(dm[k]).replace('.',','):''}" inputmode="decimal"></div>`).join('')}
    <div class="row"><div class="grow"><div class="t">→ Nguyên liệu cho 1 kg TP</div></div><div class="num">${dm.tl?fm(100/dm.tl,3)+' kg':'—'}</div></div>
    <div class="row"><div class="grow"><div class="t">→ Công cho 1 kg TP</div></div><div class="num">${dm.cong100?fm(dm.cong100/100,4)+' công ≈ '+fm(dm.cong100/100*(dm.rate||0))+' đ':'—'}</div></div></div>
   <div class="tiny muted" style="margin:4px 4px 10px">Nguồn số ban đầu: file Giá thành chung – ${esc(it.src||'')}</div>
   <label class="f"><span class="lab">Làm từ nguyên liệu</span><select id="dmV">${(c.nvls||[]).map(n=>`<option value="${n.id}" ${it.nvl===n.id?'selected':''}>${esc(n.name)}</option>`).join('')}</select></label>
   <label class="f"><span class="lab">Đóng bịch lớn (khoai, sấu…)</span><select id="dmB"><option value="0" ${!it.bich?'selected':''}>Không</option><option value="1" ${it.bich?'selected':''}>Có</option></select></label>
   <label class="f"><span class="lab">Tên mặt hàng</span><input id="dmN" value="${esc(it.name)}"></label>
   <label class="chk"><input type="checkbox" id="dmA" ${it.active!==false?'checked':''}> Đang dùng (bỏ chọn để ẩn khỏi ô chọn)</label>
   <button class="btn block pri" id="dmSave">Lưu định mức</button>
   <div class="sec">Cài đặt chung</div><div class="group"><div class="row"><div class="grow t">Số giờ = 1 công</div><input class="dmin" id="dmG" value="${c.gioCong||8}" inputmode="decimal"></div><div class="row"><div class="grow"><div class="t">Hệ số giờ tăng ca</div><div class="s">1 giờ tăng ca = ? giờ thường khi tính tiền công</div></div><input class="dmin" id="dmOt" value="${String(c.otK||1.5).replace('.',',')}" inputmode="decimal"></div></div>
   <label class="f"><span class="lab">Biển số xe công ty (cách nhau dấu phẩy)</span><input id="dmX" value="${esc((c.xe||[]).join(', '))}"></label>
   <div class="sec">Nhà cung cấp (${(c.ncc||[]).length})</div><div class="group">${(c.ncc||[]).map((n,i)=>`<div class="row"><div class="grow"><div class="t">${esc(n.name)}${n.fresh?' <span class="chip w">mới thêm từ phiếu</span>':''}</div><div class="s">${esc(n.code||'chưa có mã MISA')}</div></div><button class="lnk" data-nrm="${i}">✕</button></div>`).join('')||'<div class="empty">Chưa có.</div>'}</div>
   <div class="grid2"><input id="nN" placeholder="Tên nhà cung cấp"><input id="nC" placeholder="Mã NCC (MISA)"></div><button class="btn block" id="nAdd" style="margin-top:6px">＋ Thêm nhà cung cấp</button>
   <div class="sec">Thêm mặt hàng (thành phẩm) mới</div><div class="grid2"><input id="iN" placeholder="Tên mặt hàng"><button class="btn" id="iAdd">＋ Thêm</button></div><div class="tiny muted" style="margin:4px">Mặt hàng mới gắn với nguyên liệu đang chọn ở ô "Làm từ nguyên liệu".</div>
   <div class="sec">Nguyên liệu (${(c.nvls||[]).length})</div><div class="tiny muted" style="margin:0 4px 6px">${(c.nvls||[]).map(n=>esc(n.name)).join(' · ')}</div>
   <div class="grid2"><input id="vN" placeholder="Tên nguyên liệu mới"><button class="btn" id="vAdd">＋ Thêm nguyên liệu</button></div>`;
  $('#dmI').onchange=e=>{S.ui.dmItem=e.target.value;render()};
  const saveCfg=async(c2,m)=>{try{await S.db.doc('mcfg/main').set(c2);S.cfg=c2;toast(m||'✓ Đã lưu');render()}catch(e){toast('Chưa lưu được')}};
  $('#dmSave').onclick=()=>{const c2=JSON.parse(JSON.stringify(c));const i2=c2.items.find(i=>i.id===id);i2.dm=i2.dm||{};$$('[data-dk]').forEach(el=>i2.dm[el.dataset.dk]=num(el.value));i2.bich=$('#dmB').value==='1';i2.nvl=$('#dmV').value;i2.name=$('#dmN').value.trim()||i2.name;i2.active=$('#dmA').checked;c2.gioCong=num($('#dmG').value)||8;c2.otK=num($('#dmOt').value)||1.5;c2.xe=$('#dmX').value.split(',').map(s=>s.trim()).filter(Boolean);i2.dmBy=S.uid;i2.dmAt=Date.now();saveCfg(c2)};
  $$('[data-nrm]').forEach(b=>b.onclick=()=>{if(!confirm('Bỏ nhà cung cấp này khỏi danh sách chọn?'))return;const c2=JSON.parse(JSON.stringify(c));c2.ncc.splice(+b.dataset.nrm,1);saveCfg(c2)});
  $('#nAdd').onclick=()=>{const n=$('#nN').value.trim();if(!n)return toast('Gõ tên nhà cung cấp');const c2=JSON.parse(JSON.stringify(c));c2.ncc.push({name:n,code:$('#nC').value.trim(),lot:autoCode(n)});saveCfg(c2,'✓ Đã thêm nhà cung cấp')};
  $('#vAdd').onclick=()=>{const n=$('#vN').value.trim();if(!n)return toast('Gõ tên nguyên liệu');const c2=JSON.parse(JSON.stringify(c));c2.nvls=c2.nvls||[];const nid='v'+noAcc(n).replace(/[^a-z0-9]/g,'').slice(0,8)+Date.now().toString(36).slice(-3);c2.nvls.push({id:nid,name:n});saveCfg(c2,'✓ Đã thêm nguyên liệu '+n)};
  $('#iAdd').onclick=()=>{const n=$('#iN').value.trim();if(!n)return toast('Gõ tên mặt hàng');const c2=JSON.parse(JSON.stringify(c));const nid=noAcc(n).replace(/[^a-z0-9]/g,'').slice(0,8)+Date.now().toString(36).slice(-3);c2.items.push({id:nid,name:n,nvl:$('#dmV').value,bich:false,packs:[],dm:{tl:0,cong100:0,rate:180000,baoBi:0,dienGa:0,kh:0,thung:0,guiKho:0},src:'thêm mới'});S.ui.dmItem=nid;saveCfg(c2,'✓ Đã thêm '+n)}}

/* ---------------- QUẢN LÝ: GIÁ THÀNH ---------------- */
function costs(from,to){const C=calc(),gc=cfg().gioCong||8;const L=liveLogs().filter(l=>l.date>=from&&l.date<=to);const R=new Map();
  const G=id=>{if(!R.has(id))R.set(id,{id,kgIn:0,kgTP:0,nvl:0,nvlMiss:0,h:0,packs:new Map(),bb:0});return R.get(id)};
  let xh=0;
  for(const l of L){if(l.kind==='xuat'||l.kind==='nvl'){xh+=HC(l);continue}const x=G(tpId(l.item));x.h+=HC(l);
    if(l.kind==='sx'){x.kgIn+=num(l.kgIn);for(const u of C.use.get(l.id)||[]){if(u.price==null)x.nvlMiss+=u.kg;else x.nvl+=u.kg*u.price}}
    if(l.kind==='dg'||l.kind==='dgl'){x.kgTP+=num(l.kgTP);for(const p of l.packs||[])x.packs.set(p.g,(x.packs.get(p.g)||0)+num(p.q))}}
  const totKg=[...R.values()].reduce((s,x)=>s+x.kgTP,0);
  for(const x of R.values()){const dm=itemOf(x.id).dm||{};x.h+=totKg?xh*x.kgTP/totKg:0;x.cong=x.h/gc;x.lab=x.cong*(dm.rate||0);
    let nG=0;x.packs.forEach(q=>nG+=q);x.bb=nG*(dm.baoBi||0);x.oth=x.kgTP*((dm.dienGa||0)+(dm.kh||0)+(dm.thung||0)+(dm.guiKho||0));
    x.tot=x.nvl+x.lab+x.bb+x.oth;x.perKg=x.kgTP?(x.tot-x.bb)/x.kgTP:0;x.dmNvl=dm.tl?x.kgTP*100/dm.tl:null;x.dmCong=dm.cong100?x.kgTP*dm.cong100/100:null;x.dm=dm}
  return [...R.values()].filter(x=>x.kgIn||x.kgTP||x.h)}
function viewGT(v){const to=S.ui.gtTo||today(),from=S.ui.gtFrom||today().slice(0,8)+'01';const X=costs(from,to);
  const card=x=>{const it=itemOf(x.id);const pk=[...x.packs.entries()].sort((a,b)=>a[0]-b[0]).map(([g,q])=>`<tr><td>${packLabel(g)} · ${fm(q)} gói</td><td><b>${x.kgTP?fm(x.perKg*g/1000+(x.dm.baoBi||0)):'—'}</b> đ/gói</td></tr>`).join('');
    return `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><b style="font-size:17px">${esc(it.name)}</b><span class="tiny muted">${fm(x.kgIn)} kg NVL → ${fm(x.kgTP)} kg TP</span></div>
     <table class="gt"><tr><th></th><th>Thực tế</th><th>Định mức</th></tr>
      <tr><td>Nguyên liệu (kg)</td><td>${fm(x.kgIn)}</td><td>${x.dmNvl!=null?fm(x.dmNvl):'—'}</td></tr>
      <tr><td>Tỷ lệ TP</td><td>${x.kgIn?fm(x.kgTP/x.kgIn*100,1)+'%':'—'}</td><td>${x.dm.tl?fm(x.dm.tl,1)+'%':'—'}</td></tr>
      <tr><td>Nhân công (công)</td><td>${fm(x.cong,1)}</td><td>${x.dmCong!=null?fm(x.dmCong,1):'—'}</td></tr></table>
     <table class="gt"><tr><td>Nguyên liệu${x.nvlMiss?` <span class="chip r">${fm(x.nvlMiss)} kg chưa có giá</span>`:''}</td><td>${fm(x.nvl)}</td></tr><tr><td>Nhân công ${fm(x.h)} giờ</td><td>${fm(x.lab)}</td></tr><tr><td>Túi, tem, hộp</td><td>${fm(x.bb)}</td></tr><tr><td>Điện ga, khấu hao, thùng, gửi kho</td><td>${fm(x.oth)}</td></tr>
      <tr><td><b>Tổng</b></td><td><b>${fm(x.tot)}</b></td></tr><tr><td><b>Giá / kg TP (chưa gồm túi tem)</b></td><td><b>${x.kgTP?fm(x.perKg):'—'}</b></td></tr>${pk}</table></div>`};
  v.innerHTML=`<h1 class="big">Giá thành</h1><div class="grid2"><label class="f"><span class="lab">Từ ngày</span><input type="date" id="gF" value="${from}"></label><label class="f"><span class="lab">Đến ngày</span><input type="date" id="gT" value="${to}"></label></div>
   <div class="tiny muted" style="margin:4px 0 10px">Tính theo kỳ: nguyên liệu theo lô (FIFO, giá kế toán điền), công theo giờ thực tế (giờ tăng ca × ${fm(otK(),2)}), các khoản khác theo định mức. Công xuất hàng chia theo kg thành phẩm. Lô chưa có giá thì giá thành còn thiếu.</div>
   ${X.map(card).join('')||'<div class="empty">Không có phiếu trong kỳ.</div>'}${X.length?'<button class="btn block" id="gX">⬇ Xuất Excel</button>':''}`;
  $('#gF').onchange=e=>{S.ui.gtFrom=e.target.value;render()};$('#gT').onchange=e=>{S.ui.gtTo=e.target.value;render()};
  const gx=$('#gX');if(gx)gx.onclick=()=>exportXlsx(from,to,X)}
function exportXlsx(from,to,X){if(!window.XLSX)return toast('Chưa tải được thư viện Excel – thử lại');const wb=XLSX.utils.book_new();
  const a=[['Mặt hàng','Kg NVL','Kg TP','Tỷ lệ TP %','ĐM tỷ lệ %','Giờ công','Công','ĐM công','CP nguyên liệu','Kg NVL chưa có giá','CP nhân công','Túi tem hộp','Điện ga KH thùng gửi kho','Tổng CP','Giá/kg TP (chưa túi tem)']];
  for(const x of X)a.push([itemOf(x.id).name,r3(x.kgIn),r3(x.kgTP),x.kgIn?r3(x.kgTP/x.kgIn*100):'',x.dm.tl||'',r3(x.h),r3(x.cong),x.dmCong!=null?r3(x.dmCong):'',Math.round(x.nvl),r3(x.nvlMiss),Math.round(x.lab),Math.round(x.bb),Math.round(x.oth),Math.round(x.tot),Math.round(x.perKg)]);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),'Giá thành');
  const b=[['Ngày','Công đoạn','Mặt hàng','Chi tiết','Số người','Tổng giờ làm','Số người tăng ca','Giờ tăng ca','Người nhập','Ghi chú']];
  for(const l of liveLogs().filter(l=>l.date>=from&&l.date<=to).sort((p,q)=>p.date.localeCompare(q.date)))b.push([l.date,KIND[l.kind].n,l.item?itemOf(l.item).name:'',logSum(l).replace(/<[^>]+>/g,''),num(l.people),r3(HW(l)),num(l.pot),r3(HO(l)),nameOf(l.by),l.note||'']);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(b),'Phiếu');
  XLSX.writeFile(wb,`Gia thanh san xuat ${from} den ${to}.xlsx`)}

/* ---------------- KẾT NỐI ---------------- */
async function loadNames(){if(!S.user)return;const ids=[...new Set(S.logs.map(l=>l.by).concat(S.uid,...S.logs.flatMap(l=>(l.edits||[]).map(e=>e.by))))].filter(i=>i&&!(i in S.names));if(!ids.length)return;try{const ps=await S.user.profiles(ids);ids.forEach(i=>S.names[i]=(ps[i]&&ps[i].name)||'');soon()}catch(e){}}
let rT;const soon=()=>{clearTimeout(rT);rT=setTimeout(()=>{const a=document.activeElement;if(S.form||(a&&a.closest&&a.closest('#view')&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))||!$('#sheet').hidden){S._pend=true;return}render()},150)};
document.addEventListener('focusout',()=>setTimeout(()=>{if(S._pend&&!S.form&&$('#sheet').hidden){S._pend=false;render()}},60));
async function init(){render();let c=window.claude;for(let i=0;i<60&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use)){$('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ dữ liệu.</div>';return}
  const [db,user]=await Promise.all([c.use('db'),c.use('user')]);if(!db){$('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ dữ liệu. Kiểm tra mạng rồi tải lại.</div>';return}
  S.db=db;S.user=user;S.uid=await user.id();S.owner=await user.isOwner();
  db.doc('staff/'+S.uid).onSnapshot(s=>{S.staff=s.exists?s.data():null;soon()});
  db.doc('mcfg/main').onSnapshot(s=>{S.cfg=s.exists?s.data():null;soon()});
  db.collection('mlog').onSnapshot(q=>{S.logs=q.docs.map(d=>Object.assign({id:d.id},d.data()));loadNames();soon()});
  try{const p=await user.profiles([S.uid]);S.names[S.uid]=p[S.uid]&&p[S.uid].name||''}catch(e){}
  setTimeout(()=>{S.ready=true;render();if(isAdmin()&&(!S.cfg||!(S.cfg.v>=2))){const c=upgradeCfg(S.cfg);db.doc('mcfg/main').set(c).then(()=>{S.cfg=c;render()}).catch(()=>{})}},300);
  window.addEventListener('viba-sync',()=>{if(!S.form)soon()})}
/* v116: nâng cấu hình v1 → v2 (nguyên liệu gộp, 15 thành phẩm, NCC theo file, 3 xe); giữ định mức Quản lý đã sửa */
function upgradeCfg(old){const c=JSON.parse(JSON.stringify(DEFAULT_CFG));if(!old)return c;
  const map={mia:'mia',dua:'duam',ksq:'ksq',kmo:'kmo',sau:'sau'};
  for(const o of old.items||[]){const n=c.items.find(i=>i.id===map[o.id]);if(n&&o.dmAt){n.dm=Object.assign({},n.dm,o.dm);n.dmAt=o.dmAt;n.dmBy=o.dmBy}}
  if(old.gioCong)c.gioCong=old.gioCong;
  for(const x of old.xe||[])if(!c.xe.includes(x))c.xe.push(x);
  return c}
window.__sx={S,calc,costs,num,gOf,packLabel,DEFAULT_CFG};
init();
})();
