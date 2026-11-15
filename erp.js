/* VIBA ERP – trang làm việc (G1 chứng từ + duyệt, G3 sổ kho theo lô). Mọi ghi đều qua vibaErp.call → máy chủ kiểm quyền. */
(function(){'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fm=v=>(+v||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
const today=()=>new Date(Date.now()+7*36e5).toISOString().slice(0,10),dmy=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')}else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=parseFloat(s);return isFinite(n)?n:0}
const TY={PMUA:'Phiếu mua nguyên liệu theo lô',DXVT:'Đề xuất mua vật tư',PCHI:'Phiếu chi tiền mặt',PXSX:'Xuất NL vào sản xuất',NKTP:'Nhập kho thành phẩm',CKNB:'Chuyển kho nội bộ'};
const STK={PMUA:'in',PXSX:'out',NKTP:'in',CKNB:'move'},PRICE={PMUA:1,DXVT:1,PCHI:1,NKTP:0,PXSX:0,CKNB:0};
const WH={NM:'Nhà máy Hòa Bình',XC:'Xưởng chuối Hòa Bình',TT:'Trang trại Hòa Bình',HN:'Kho Hà Nội'};
const ST={draft:['Nháp','#6b7280'],submitted:['Chờ duyệt','#b26a00'],approved:['Đã duyệt','#1f8a52'],synced:['Đã sang MISA','#1B69A3'],locked:['Khóa kỳ','#374151'],cancelled:['Đã hủy','#c0392b']};
const S={whs:Object.keys(WH),tab:'new',D:new Map(),M:[],P:new Map(),f:'all',form:null,open:null,me:null};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3200)}
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
async function api(op,a,ok){try{const r=await vibaErp.call(op,a);if(ok)toast(ok);return r}catch(e){toast('⚠ '+(e.message||'lỗi mạng').replace(/^invalid_argument:\s*/,''));throw e}}
function newForm(t){S.form={type:t||S.form?.type||'PMUA',date:today(),wh:S.whs[0],wh2:S.whs[0]==='HN'?'NM':'HN',party:'',note:'',lines:[{item:'',qty:'',price:''}]}}
function tabs(){const n=[...S.D.values()].filter(d=>d.st==='submitted').length,a=[...S.D.values()].filter(d=>d.st==='approved'&&!d.acctOk).length;
  const T=[['new','＋ Lập phiếu'],['list','Chứng từ'],['wait','Chờ duyệt'+(n?' ('+n+')':'')],['acct','Kế toán kiểm'+(a?' ('+a+')':'')],['stock','Tồn kho theo lô']].concat(S.me.owner?[['lock','Khóa kỳ']]:[]);
  return `<div class="tb">${T.map(([k,t])=>`<button class="${S.tab===k?'on':''}" data-t="${k}">${t}</button>`).join('')}</div>`}
function render(){if(!S.me)return;let h=tabs();
  if(S.tab==='new')h+=formHTML();else if(S.tab==='stock')h+=stockHTML();else if(S.tab==='lock')h+=lockHTML();else h+=listHTML();
  $('#view').innerHTML=h;bind()}
function formHTML(){const f=S.form,st=STK[f.type],pr=PRICE[f.type];const tot=f.lines.reduce((s,l)=>s+Math.round(num(l.qty)*num(l.price)),0);
  return `<div class="card"><label>Loại chứng từ<select id="fT">${Object.keys(TY).map(k=>`<option value="${k}" ${f.type===k?'selected':''}>${TY[k]}</option>`).join('')}</select></label>
  <div class="g2"><label>Ngày<input type="date" id="fD" value="${f.date}"></label>
  ${st?`<label>${st==='move'?'Kho xuất':'Kho'}<select id="fW">${S.whs.map(k=>`<option value="${k}" ${f.wh===k?'selected':''}>${WH[k]}</option>`).join('')}</select></label>`:'<span></span>'}</div>
  ${st==='move'?`<label>Kho nhận<select id="fW2">${Object.keys(WH).map(k=>`<option value="${k}" ${f.wh2===k?'selected':''}>${WH[k]}</option>`).join('')}</select></label>`:''}
  ${f.type==='PMUA'||f.type==='PCHI'||f.type==='DXVT'?`<label>${f.type==='PCHI'?'Người nhận tiền':'Nhà cung cấp'} (mã hoặc tên)<input id="fP" value="${esc(f.party)}" placeholder="VD: NCC01 – Anh Tuấn chuối"></label>`:''}
  <label>Diễn giải<input id="fN" value="${esc(f.note)}"></label>
  <div class="sec">Dòng hàng${pr?' · Thành tiền = SL × Đơn giá':''}</div>
  ${f.lines.map((l,i)=>`<div class="ln"><input list="pl" data-i="${i}" data-k="item" value="${esc(l.item)}" placeholder="${f.type==='PCHI'?'Nội dung chi':'Mã hàng'}">
   <input data-i="${i}" data-k="qty" inputmode="decimal" value="${esc(l.qty)}" placeholder="SL">
   ${pr?`<input data-i="${i}" data-k="price" inputmode="decimal" value="${esc(l.price)}" placeholder="Đơn giá"><b>${fm(Math.round(num(l.qty)*num(l.price)))}</b>`:''}
   <button class="x" data-del="${i}">✕</button></div>`).join('')}
  <datalist id="pl">${[...S.P.values()].filter(p=>p.active!==false).map(p=>`<option value="${esc(p.code)}">${esc(p.name)}</option>`).join('')}</datalist>
  <button class="add" id="fAdd">＋ Thêm dòng</button>${pr?`<div class="tot">Tổng tiền: <b>${fm(tot)} đ</b></div>`:''}
  <div class="g2"><button class="b2 g" id="fSave">Lưu nháp</button><button class="b2" id="fSend">Lưu & gửi duyệt</button></div></div>`}
function canAct(d){const own=d.createdBy===S.me.uid;return{send:d.st==='draft'&&(own||S.me.owner),cancel:(d.st==='draft'||d.st==='submitted')&&(own||S.me.owner),
  appr:d.st==='submitted',back:d.st==='submitted',rev:['approved','synced','locked'].includes(d.st)&&!d.revOf,acct:d.st==='approved'&&S.me.owner}}
function listHTML(){let L=[...S.D.entries()].map(([id,d])=>({id,...d}));
  if(S.tab==='wait')L=L.filter(d=>d.st==='submitted');else if(S.tab==='acct')L=L.filter(d=>d.st==='approved');else if(S.f!=='all')L=L.filter(d=>d.st===S.f);
  L.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const fl=S.tab==='list'?`<div class="tb sm">${[['all','Tất cả']].concat(Object.entries(ST).map(([k,v])=>[k,v[0]])).map(([k,t])=>`<button class="${S.f===k?'on':''}" data-f="${k}">${t}</button>`).join('')}</div>`:'';
  const note=S.tab==='acct'?'<p class="mut">Bước 2 trước khi đẩy sang MISA: Kế toán kiểm tra chứng từ Quản lý đã duyệt. Người duyệt không tự kiểm.</p>':'';
  return fl+note+(L.map(d=>{const a=canAct(d),s=ST[d.st]||[d.st,'#666'];return `<div class="card doc"><div class="dh" data-o="${d.id}"><b>${esc(d.no)}</b> <span class="chip" style="background:${s[1]}">${s[0]}</span>${d.acctOk?' <span class="chip" style="background:#1B69A3">KT đã kiểm</span>':''}
    <div class="mut">${esc(TY[d.type]||d.type)}${d.revOf?' · Ngược '+esc(d.revNo):''} · ${dmy(d.date)}${d.wh?' · '+esc(WH[d.wh]||d.wh)+(d.wh2?' → '+esc(WH[d.wh2]):''):''}${d.party?' · '+esc(d.party.name||d.party.code||d.party):''}</div>
    ${d.total?`<div>Tổng: <b>${fm(d.total)} đ</b>${d.overApproved?' · GĐ duyệt vượt hạn mức':''}</div>`:''}</div>
    ${S.open===d.id?`<table class="lt"><tr><th>Mã/ nội dung</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>${(d.lines||[]).map(l=>`<tr><td>${esc(l.item||l.code)}</td><td>${fm(l.qty)}</td><td>${fm(l.price)}</td><td>${fm(l.amount??Math.round(num(l.qty)*num(l.price)))}</td></tr>`).join('')}</table>${d.note?`<div class="mut">${esc(d.note)}</div>`:''}`:''}
    <div class="acts">${a.send?`<button data-a="send" data-id="${d.id}">Gửi duyệt</button>`:''}${a.appr?`<button class="ok" data-a="appr" data-id="${d.id}">Duyệt</button>`:''}${a.back?`<button data-a="back" data-id="${d.id}">Trả lại</button>`:''}
    ${a.acct&&S.tab!=='wait'?(d.acctOk?`<button data-a="unacct" data-id="${d.id}">Bỏ kiểm</button>`:`<button class="ok" data-a="acct" data-id="${d.id}">Kế toán đã kiểm</button>`):''}${a.rev&&S.tab==='list'?`<button data-a="rev" data-id="${d.id}">Chứng từ ngược</button>`:''}${a.cancel?`<button class="dg" data-a="cancel" data-id="${d.id}">Hủy</button>`:''}</div></div>`}).join('')||'<p class="mut">Không có chứng từ.</p>')}
function stockHTML(){const b={};for(const m of S.M){const k=m.wh+'|'+m.item+'|'+m.lot;if(!b[k])b[k]={wh:m.wh,item:m.item,lot:m.lot,q:0,cost:0,d:'9'};b[k].q+=+m.qty||0;if(+m.qty>0){b[k].cost=m.cost;if(m.date<b[k].d)b[k].d=m.date}}
  const R=Object.values(b).filter(x=>Math.abs(x.q)>1e-9&&(S.f==='all'||!WH[S.f]||x.wh===S.f)).sort((a,c)=>(a.wh+a.item+a.d).localeCompare(c.wh+c.item+c.d));
  return `<div class="tb sm">${[['all','Tất cả kho']].concat(Object.entries(WH)).map(([k,t])=>`<button class="${S.f===k?'on':''}" data-f="${k}">${t}</button>`).join('')}</div>
  <div class="card"><table class="lt"><tr><th>Kho</th><th>Mã hàng</th><th>Lô</th><th>Ngày nhập</th><th>Tồn</th></tr>${R.map(x=>`<tr><td>${esc(WH[x.wh]||x.wh)}</td><td>${esc(x.item)} <span class="mut">${esc((S.P.get(String(x.item).toLowerCase())||{}).name||'')}</span></td><td>${esc(x.lot)}</td><td>${dmy(x.d==='9'?'':x.d)}</td><td><b>${fm(x.q)}</b></td></tr>`).join('')||'<tr><td colspan="5">Chưa có tồn.</td></tr>'}</table>
  <p class="mut">Sổ kho chỉ ghi khi chứng từ được duyệt. Xuất theo FIFO (lô nhập trước xuất trước); không cho xuất quá tồn.</p></div>`}
function lockHTML(){return `<div class="card"><p>Khóa sổ đến hết ngày: mọi chứng từ có ngày ≤ ngày khóa không thêm, sửa, duyệt được nữa. Mở lại kỳ đã khóa: chỉ Giám đốc (tài khoản chủ).</p>
  <label>Khóa đến ngày<input type="date" id="lkD"></label><button class="b2" id="lkGo">Khóa kỳ</button></div>`}
function bind(){document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.f='all';render()});
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.f=b.dataset.f;render()});
  document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{S.open=S.open===b.dataset.o?null:b.dataset.o;render()});
  document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,b.dataset.id,b));
  if(S.tab==='new'){const f=S.form;$('#fT').onchange=e=>{f.type=e.target.value;render()};
    const sv=(id,k)=>{const e=$(id);if(e)e.oninput=e.onchange=()=>f[k]=e.value};sv('#fD','date');sv('#fW','wh');sv('#fW2','wh2');sv('#fP','party');sv('#fN','note');
    document.querySelectorAll('.ln input').forEach(i=>i.onchange=()=>{f.lines[+i.dataset.i][i.dataset.k]=i.value;if(i.dataset.k!=='item')render()});
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{f.lines.splice(+b.dataset.del,1);if(!f.lines.length)f.lines.push({item:'',qty:'',price:''});render()});
    $('#fAdd').onclick=()=>{f.lines.push({item:'',qty:'',price:''});render()};$('#fSave').onclick=()=>save(false);$('#fSend').onclick=()=>save(true)}
  if(S.tab==='lock')$('#lkGo').onclick=async()=>{const d=$('#lkD').value;if(!d)return toast('Chọn ngày');if(!confirm('Khóa sổ đến hết ngày '+dmy(d)+'?'))return;await api('periodLock',{lockDate:d},'✓ Đã khóa kỳ đến '+dmy(d))}}
async function save(send){const f=S.form,pr=PRICE[f.type];const lines=f.lines.filter(l=>String(l.item).trim()||num(l.qty)).map(l=>{const q=num(l.qty),p=pr?num(l.price):0;const o={item:String(l.item).trim(),qty:q};if(pr){o.price=p;o.amount=Math.round(q*p)}return o});
  if(!lines.length)return toast('Chưa có dòng hàng');const id=f.id||(f.id=rid());const pt=String(f.party||'').trim();
  const a={type:f.type,id,date:f.date,note:f.note,lines,wh:STK[f.type]?f.wh:undefined,wh2:STK[f.type]==='move'?f.wh2:undefined,party:pt?{code:pt.split(/[\s–-]/)[0],name:pt}:null};
  $('#fSave').disabled=$('#fSend').disabled=true;
  try{const r=await api('docCreate',a);if(send)await api('transition',{id,to:'submitted',ver:r.doc.ver});toast('✓ Đã lưu '+r.doc.no+(send?' và gửi duyệt':''));newForm(f.type);S.tab='list';render();try{vibaSync.full()}catch(_){}}catch(e){$('#fSave').disabled=$('#fSend').disabled=false}}
async function act(a,id,btn){const d=S.D.get(id);if(!d)return;btn.disabled=true;
  try{if(a==='send')await api('transition',{id,to:'submitted',ver:d.ver},'✓ Đã gửi duyệt');
    else if(a==='back')await api('transition',{id,to:'draft',ver:d.ver},'Đã trả lại người lập');
    else if(a==='cancel'){if(!confirm('Hủy chứng từ '+d.no+'?'))return btn.disabled=false;await api('transition',{id,to:'cancelled',ver:d.ver},'Đã hủy')}
    else if(a==='appr'){let r=await api('transition',{id,to:'approved',ver:d.ver});if(r.needOver){if(!confirm(`Vượt hạn mức ${fm(r.limit)} đ (tổng ${fm(r.total)} đ). Giám đốc duyệt vượt hạn mức?`))return btn.disabled=false;r=await api('transition',{id,to:'approved',ver:d.ver,overOk:true})}toast('✓ Đã duyệt '+d.no)}
    else if(a==='acct'||a==='unacct')await api('acctCheck',{id,ver:d.ver,undo:a==='unacct'},a==='acct'?'✓ Kế toán đã kiểm '+d.no:'Đã bỏ kiểm');
    else if(a==='rev'){const n=prompt('Lý do lập chứng từ ngược cho '+d.no+':');if(n===null)return btn.disabled=false;const r=await api('reverse',{id,ver:d.ver,newId:rid(),note:n});toast('✓ Đã lập '+r.doc.no+' – gửi duyệt để có hiệu lực')}
    try{vibaSync.full()}catch(_){}}catch(e){btn.disabled=false}}
async function init(){let c=window.claude;for(let i=0;i<60&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use))return $('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ dữ liệu.</div>';
  const db=await c.use('db');S.me=window.vibaErp&&vibaErp.me();if(!S.me)return $('#view').innerHTML='<div class="alert r">Chưa đăng nhập.</div>';
  if(!S.me.owner){try{const st=(await db.doc('staff/'+S.me.uid).get()).data()||{};S.whs=st.erpWh||(st.role==='kho'?['HN']:['NM','XC','TT'])}catch(e){}}newForm('PMUA');
  db.collection('products').onSnapshot(s=>{S.P=new Map(s.docs.map(d=>[String(d.data().code||d.id).toLowerCase(),d.data()]));if(S.tab==='stock')render()});
  db.collection('erpdocs').onSnapshot(s=>{S.D=new Map(s.docs.map(d=>[d.id,d.data()]));if(S.tab!=='new')render();else{const t=$('.tb');if(t)t.outerHTML=tabs();document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.f='all';render()})}});
  db.collection('stockmoves').onSnapshot(s=>{S.M=s.docs.map(d=>d.data());if(S.tab==='stock')render()});render()}
init()})();
