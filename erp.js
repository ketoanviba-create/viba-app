/* VIBA ERP – trang làm việc (G1 chứng từ + duyệt, G3 sổ kho theo lô). Mọi ghi đều qua vibaErp.call → máy chủ kiểm quyền. */
(function(){'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fm=v=>(+v||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
const today=()=>new Date(Date.now()+7*36e5).toISOString().slice(0,10),dmy=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')}else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=parseFloat(s);return isFinite(n)?n:0}
const TY={PMUA:'Phiếu nhập mua nguyên liệu',PNVT:'Phiếu nhập mua vật tư',LCHI:'Lệnh chi chuyển khoản',DXVT:'Đề xuất mua vật tư',PCHI:'Phiếu chi tiền mặt',PXSX:'Xuất NL vào sản xuất',NKTP:'Nhập kho thành phẩm',CKNB:'Chuyển kho nội bộ'};
const STK={PMUA:'in',PNVT:'in',PXSX:'out',NKTP:'in',CKNB:'move'},PRICE={PMUA:1,PNVT:1,LCHI:1,DXVT:1,PCHI:1,NKTP:0,PXSX:0,CKNB:0};
/* v6: lệnh chi chuyển khoản + VietQR (EMVCo, thư viện qr.js chạy tại máy) */
const BANKS={Agribank:'970405',Vietcombank:'970436',VietinBank:'970415',BIDV:'970418','MB Bank':'970422',Techcombank:'970407',ACB:'970416',VPBank:'970432',Sacombank:'970403',TPBank:'970423',VIB:'970441',SHB:'970443',HDBank:'970437',OCB:'970448',SeABank:'970440',MSB:'970426',LPBank:'970449',Eximbank:'970431'};
const LIM=10000000,PAYFROM='Agribank 3001999926666';
function crc16(s){let c=0xFFFF;for(const b of new TextEncoder().encode(s)){c^=b<<8;for(let i=0;i<8;i++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,'0')}
const tlv=(id,v)=>id+String(v.length).padStart(2,'0')+v;
const noAcc=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^A-Za-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
function vietqr(bin,acc,amt,msg){const m=tlv('00','A000000727')+tlv('01',tlv('00',bin)+tlv('01',String(acc).replace(/\s/g,'')))+tlv('02','QRIBFTTA');
  let p=tlv('00','01')+tlv('01','12')+tlv('38',m)+tlv('53','704')+(amt?tlv('54',String(Math.round(amt))):'')+tlv('58','VN')+(msg?tlv('62',tlv('08',noAcc(msg).slice(0,50))):'')+'6304';return p+crc16(p)}
const isPay=d=>d.type==='LCHI';
const lastPay=name=>{const k=String(name||'').trim().toLowerCase();if(!k)return null;return [...S.D.values()].filter(d=>isPay(d)&&d.party&&String(d.party.name||'').trim().toLowerCase()===k&&d.party.acc).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0]||null};
const WH={NM:'Nhà máy Hòa Bình',XC:'Xưởng chuối Hòa Bình',TT:'Trang trại Hòa Bình',HN:'Kho Hà Nội'};
const ST={draft:['Nháp','#6b7280'],submitted:['Chờ duyệt','#b26a00'],approved:['Đã duyệt','#1f8a52'],synced:['Đã sang MISA','#1B69A3'],locked:['Khóa kỳ','#374151'],cancelled:['Đã hủy','#c0392b']};
const S={whs:Object.keys(WH),tab:'new',D:new Map(),M:[],P:new Map(),f:'all',form:null,open:null,me:null};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3200)}
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
async function api(op,a,ok){try{const r=await vibaErp.call(op,a);if(ok)toast(ok);return r}catch(e){toast('⚠ '+(e.message||'lỗi mạng').replace(/^invalid_argument:\s*/,''));throw e}}
function newForm(t){S.form={type:t||S.form?.type||'PMUA',date:today(),wh:S.whs[0],wh2:S.whs[0]==='HN'?'NM':'HN',party:'',note:'',pay:'ck',bank:'Agribank',acc:'',accName:'',payMsg:'',lines:[{item:'',qty:'',price:''}]}}
function tabs(){const n=[...S.D.values()].filter(d=>d.st==='submitted').length,a=[...S.D.values()].filter(d=>d.st==='approved'&&!d.acctOk).length;
  const np=[...S.D.values()].filter(d=>isPay(d)&&d.st==='approved'&&!d.paidAt).length;
  const T=[['new','＋ Lập phiếu'],['pay','💳 Lệnh chi'+(np?' ('+np+' chờ chi)':'')],['list','Chứng từ'],['wait','Chờ duyệt'+(n?' ('+n+')':'')],['acct','Kế toán kiểm'+(a?' ('+a+')':'')],['stock','Tồn kho theo lô']].concat(S.me.owner?[['lock','Khóa kỳ']]:[]);
  return `<div class="tb">${T.map(([k,t])=>`<button class="${S.tab===k?'on':''}" data-t="${k}">${t}</button>`).join('')}</div>`}
function render(){if(!S.me)return;let h=banner()+tabs();
  if(S.tab==='new')h+=formHTML();else if(S.tab==='stock')h+=stockHTML();else if(S.tab==='lock')h+=lockHTML();else h+=listHTML();
  $('#view').innerHTML=h;bind()}
function myWait(){return [...S.D.values()].filter(d=>isPay(d)&&d.st==='submitted'&&d.createdBy!==S.me.uid&&S.me.owner)}
function banner(){const W=myWait();if(!W.length)return '';const t=W.reduce((a,d)=>a+(+d.total||0),0);return `<div class="card" style="background:#fff7e0;border-color:#f1d27a;cursor:pointer" data-t="wait"><b>🔔 ${W.length} lệnh chi chờ anh duyệt · ${fm(t)} đ</b><div class="mut">Chỉ anh Thuận hoặc anh Đức duyệt · bấm để xem</div></div>`}
function payHTML(f,withAmt){const lp=lastPay(f.party);return `<div class="sec">Thanh toán</div>
  ${withAmt?'':`<div class="tb sm">${[['ck','🏦 Chuyển khoản – lập lệnh chi'],['no','Ghi nợ / trả sau']].map(([k,t])=>`<button class="${f.pay===k?'on':''}" data-pay="${k}">${t}</button>`).join('')}</div>`}
  ${withAmt||f.pay==='ck'?`<div class="g2"><label>Ngân hàng người nhận<select id="fB">${Object.keys(BANKS).map(k=>`<option ${f.bank===k?'selected':''}>${k}</option>`).join('')}</select></label><label>Số tài khoản<input id="fA" inputmode="numeric" value="${esc(f.acc)}"></label></div>
  <label>Tên chủ tài khoản (không dấu)<input id="fAN" value="${esc(f.accName)}" placeholder="NGUYEN VAN A"></label>
  <label>Nội dung chuyển khoản<input id="fM" value="${esc(f.payMsg)}" placeholder="${withAmt?'VIBA TT ...':'Tự điền: VIBA TT <số phiếu>'}"></label>
  ${lp&&!f.acc?`<button class="add" id="fLP">↺ Dùng tài khoản lần trước: ${esc(lp.party.bank)} · ${esc(lp.party.acc)}</button>`:''}
  <p class="mut">Trả từ: ${PAYFROM}. Lệnh chi gửi duyệt: ≤ 10 triệu kế toán trưởng, trên 10 triệu Giám đốc. Người lập không tự duyệt.</p>`:''}`}
function steps(d){const s=d.st,ok=['approved','synced','locked'].includes(s);const it=[['Lập',d.createdBy?nm(d.createdBy):'',1],['Duyệt',ok?nm(d.approvedBy):'Anh Thuận / anh Đức',ok?1:s==='submitted'?2:0],['Chi QR',d.paidAt?nm(d.paidBy):'',d.paidAt?1:ok?2:0]];
  return `<div class="stp">${it.map(([t,w,k],i)=>`<div><span class="dot ${k===1?'':k===2?'a':'n'}">${k===1?'✓':i+1}</span><b>${t}</b><span class="mut">${esc(w||'')}</span></div>`).join('')}</div>`}
const nm=u=>u?(S.names[u]||(u===S.me.uid?'tôi':'')):'';
function checks(d){const C=[],ref=d.ref&&d.ref.id?S.D.get(d.ref.id):null;
  if(d.ref&&d.ref.id){if(!ref)C.push(['y','Chứng từ gốc','chưa thấy '+esc(d.ref.no||'')]);else{C.push([ref.total===d.total?'g':'o','Chứng từ gốc',`${esc(ref.no)} · ${esc(TY[ref.type]||ref.type)} · ${(ST[ref.st]||[ref.st])[0]} · ${fm(ref.total)} đ${ref.total===d.total?'':' ≠ số chi'}`]);
    for(const l of ref.lines||[]){const pv=[...S.D.values()].filter(x=>x!==ref&&x.type===ref.type&&['approved','synced','locked'].includes(x.st)&&(x.date||'')<=(ref.date||'')&&(x.lines||[]).some(y=>y.item===l.item)).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
      if(pv){const pl=pv.lines.find(y=>y.item===l.item),ch=pl.price?(l.price-pl.price)/pl.price*100:0;C.push([Math.abs(ch)>=10?'o':'g','Giá '+esc(l.item),`${fm(l.price)} đ, lần trước ${fm(pl.price)} đ (${dmy(pv.date)})${ch?` · ${ch>0?'+':''}${fm(Math.round(ch))}%`:''}`])}}}
    const dup=[...S.D.values()].filter(x=>x.no!==d.no&&isPay(x)&&x.st!=='cancelled'&&x.ref&&x.ref.id===d.ref.id);C.push([dup.length?'r':'g','Chi trùng',dup.length?'đã có '+dup.map(x=>esc(x.no)).join(', '):'chưa có lệnh chi khác cho chứng từ này'])}
  else C.push(['y','Chứng từ gốc','chi không kèm phiếu nhập – xem kỹ nội dung']);
  const lp=[...S.D.values()].filter(x=>x.no!==d.no&&isPay(x)&&x.paidAt&&x.party&&String(x.party.name||'').toLowerCase()===String((d.party||{}).name||'').toLowerCase()).sort((a,b)=>b.paidAt-a.paidAt)[0];
  if(lp)C.push([lp.party.acc===(d.party||{}).acc?'g':'r','Tài khoản nhận',lp.party.acc===(d.party||{}).acc?'trùng tài khoản đã chi lần trước':'KHÁC tài khoản lần trước ('+esc(lp.party.bank)+' '+esc(lp.party.acc)+') – gọi xác nhận']);
  const col={g:['#e2f4ea','#1f8a52','✓'],o:['#fdf0e3','#b85a12','⚠'],y:['#fdf6dc','#8a6400','!'],r:['#fde8e6','#c0362c','⚠']};
  return C.map(([k,t,v])=>`<div style="margin:3px 0"><span style="background:${col[k][0]};color:${col[k][1]};font-weight:700;font-size:12px;border-radius:7px;padding:1px 6px">${col[k][2]} ${t}</span> ${v}</div>`).join('')}
function payCard(d){const p=d.party||{},ok=['approved','synced','locked'].includes(d.st),a=canAct(d);const bin=p.bin||BANKS[p.bank];
  const qr=ok&&!d.paidAt&&bin&&p.acc&&window.vibaQR?vibaQR(vietqr(bin,p.acc,d.total,d.note),210):'';
  return `<div class="card doc" style="border-left:5px solid ${d.total>LIM?'#c0362c':'#1B69A3'}"><div class="dh" data-o="${d.id}"><b>${esc(d.no)}</b> <span class="chip" style="background:${(ST[d.st]||['','#666'])[1]}">${d.paidAt?'Đã chi':(ST[d.st]||[d.st])[0]}</span> <b style="float:right;color:#c0362c">${fm(d.total)} đ</b>
   <div class="mut">${esc(p.name||'')} · ${esc(p.bank||'')} ${esc(p.acc||'')}${d.ref&&d.ref.no?' · '+esc(d.ref.no):''}</div></div>
   ${S.open===d.id||S.tab==='wait'||(ok&&!d.paidAt)?`${steps(d)}<table class="lt"><tr><td class="mut">Người nhận</td><td><b>${esc(p.accName||p.name||'')}</b></td></tr><tr><td class="mut">Ngân hàng · STK</td><td><b>${esc(p.bank||'')} · ${esc(p.acc||'')}</b></td></tr><tr><td class="mut">Số tiền</td><td><b style="color:#c0362c">${fm(d.total)} đ</b></td></tr><tr><td class="mut">Nội dung CK</td><td><b>${esc(noAcc(d.note))}</b></td></tr><tr><td class="mut">Trả từ</td><td>${esc((d.ref&&d.ref.from)||PAYFROM)}</td></tr>${d.paidAt?`<tr><td class="mut">Đã chi</td><td>${new Date(d.paidAt).toLocaleString('vi-VN')} · ${esc(nm(d.paidBy))}${d.payRef?' · '+esc(d.payRef):''}</td></tr>`:''}</table>
   ${d.st==='submitted'?`<div class="sec">App kiểm giúp</div><div style="font-size:13.5px">${checks(d)}</div>`:''}
   ${qr?`<div style="text-align:center;margin-top:8px"><div style="display:inline-block;padding:6px;border:1px solid var(--line);border-radius:12px">${qr}</div><div style="font-weight:700">Quét bằng app ngân hàng</div><div class="mut">Kiểm tra tên người nhận trước khi xác nhận OTP. App không tự chuyển tiền.</div></div>`:''}`:''}
   <div class="acts">${a.send?`<button data-a="send" data-id="${d.id}">Gửi duyệt</button>`:''}${a.appr&&d.createdBy!==S.me.uid&&S.me.owner?`<button class="ok" data-a="appr" data-id="${d.id}">✓ Duyệt chi</button>`:''}${a.back&&(S.me.owner||d.createdBy===S.me.uid)?`<button data-a="back" data-id="${d.id}">↩ Trả lại</button>`:''}${ok&&!d.paidAt&&(S.me.owner||S.kt||S.role==='ketoan')?`<button class="ok" data-a="paid" data-id="${d.id}">✓ Đã chuyển khoản</button>`:''}${a.cancel?`<button class="dg" data-a="cancel" data-id="${d.id}">Hủy</button>`:''}</div></div>`}
function formHTML(){if(S.form.type==='LCHI')return lchiForm();const f=S.form,st=STK[f.type],pr=PRICE[f.type];const tot=f.lines.reduce((s,l)=>s+Math.round(num(l.qty)*num(l.price)),0);
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
  ${f.type==='PMUA'||f.type==='PNVT'?payHTML(f,false):''}
  <div class="g2"><button class="b2 g" id="fSave">Lưu nháp</button><button class="b2" id="fSend">Lưu & gửi duyệt${(f.type==='PMUA'||f.type==='PNVT')&&f.pay==='ck'?' + lập lệnh chi':''}</button></div></div>`}
function lchiForm(){const f=S.form;return `<div class="card"><label>Loại chứng từ<select id="fT">${Object.keys(TY).map(k=>`<option value="${k}" ${f.type===k?'selected':''}>${TY[k]}</option>`).join('')}</select></label>
  <div class="g2"><label>Ngày<input type="date" id="fD" value="${f.date}"></label><label>Số tiền<input id="fAmt" inputmode="numeric" value="${esc(f.amt||'')}"></label></div>
  <label>Chi cho (người / đơn vị nhận)<input id="fP" value="${esc(f.party)}" placeholder="VD: Kho lạnh GHL"></label>
  <label>Diễn giải (chi cho việc gì)<input id="fN" value="${esc(f.note)}"></label>${payHTML(f,true)}
  <div class="g2"><button class="b2 g" id="fSave">Lưu nháp</button><button class="b2" id="fSend">Lưu & gửi duyệt</button></div></div>`}
function canAct(d){const own=d.createdBy===S.me.uid;return{send:d.st==='draft'&&(own||S.me.owner),cancel:(d.st==='draft'||d.st==='submitted')&&(own||S.me.owner),
  appr:d.st==='submitted',back:d.st==='submitted',rev:['approved','synced','locked'].includes(d.st)&&!d.revOf,acct:d.st==='approved'&&(S.me.owner||S.kt)}}
function listHTML(){let L=[...S.D.entries()].map(([id,d])=>({id,...d}));if(S.tab==='pay'){L=L.filter(isPay).sort((a,b)=>(!!a.paidAt-!!b.paidAt)||((b.createdAt||0)-(a.createdAt||0)));return `<div class="tb sm"><button data-newpay>＋ Lệnh chi khác (không kèm phiếu nhập)</button></div>`+(L.map(payCard).join('')||'<p class="mut">Chưa có lệnh chi.</p>')}
  if(S.tab==='wait')L=L.filter(d=>d.st==='submitted');else if(S.tab==='acct')L=L.filter(d=>d.st==='approved');else if(S.f!=='all')L=L.filter(d=>d.st===S.f);
  L.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const fl=S.tab==='list'?`<div class="tb sm">${[['all','Tất cả']].concat(Object.entries(ST).map(([k,v])=>[k,v[0]])).map(([k,t])=>`<button class="${S.f===k?'on':''}" data-f="${k}">${t}</button>`).join('')}</div>`:'';
  const note=S.tab==='acct'?'<p class="mut">Bước 2 trước khi đẩy sang MISA: Kế toán kiểm tra chứng từ Quản lý đã duyệt. Người duyệt không tự kiểm.</p>':'';
  return fl+note+(L.map(d=>{if(isPay(d))return payCard(d);const a=canAct(d),s=ST[d.st]||[d.st,'#666'];return `<div class="card doc"><div class="dh" data-o="${d.id}"><b>${esc(d.no)}</b> <span class="chip" style="background:${s[1]}">${s[0]}</span>${d.acctOk?' <span class="chip" style="background:#1B69A3">KT đã kiểm</span>':''}
    <div class="mut">${esc(TY[d.type]||d.type)}${d.revOf?' · Ngược '+esc(d.revNo):''} · ${dmy(d.date)}${d.wh?' · '+esc(WH[d.wh]||d.wh)+(d.wh2?' → '+esc(WH[d.wh2]):''):''}${d.party?' · '+esc(d.party.name||d.party.code||d.party):''}</div>
    ${d.total?`<div>Tổng: <b>${fm(d.total)} đ</b>${d.overApproved?' · GĐ duyệt vượt hạn mức':''}</div>`:''}</div>
    ${S.open===d.id?`<table class="lt"><tr><th>Mã/ nội dung</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>${(d.lines||[]).map(l=>`<tr><td>${esc(l.item||l.code)}</td><td>${fm(l.qty)}</td><td>${fm(l.price)}</td><td>${fm(l.amount??Math.round(num(l.qty)*num(l.price)))}</td></tr>`).join('')}</table>${d.note?`<div class="mut">${esc(d.note)}</div>`:''}`:''}
    <div class="acts">${a.send?`<button data-a="send" data-id="${d.id}">Gửi duyệt</button>`:''}${a.appr&&(S.me.owner||(S.role==='kho'&&['PXSX','NKTP'].includes(d.type)))?`<button class="ok" data-a="appr" data-id="${d.id}">Duyệt</button>`:''}${a.back&&(S.me.owner||d.createdBy===S.me.uid)?`<button data-a="back" data-id="${d.id}">Trả lại</button>`:''}
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
  const np=document.querySelector('[data-newpay]');if(np)np.onclick=()=>{newForm('LCHI');S.tab='new';render()};
  if(S.tab==='new'){const f=S.form;$('#fT').onchange=e=>{f.type=e.target.value;render()};
    const sv=(id,k)=>{const e=$(id);if(e)e.oninput=e.onchange=()=>f[k]=e.value};sv('#fD','date');sv('#fW','wh');sv('#fW2','wh2');sv('#fP','party');sv('#fN','note');sv('#fB','bank');sv('#fA','acc');sv('#fAN','accName');sv('#fM','payMsg');sv('#fAmt','amt');
    const pe=$('#fP');if(pe)pe.addEventListener('change',()=>{if(!f.acc&&lastPay(f.party))render()});
    document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>{f.pay=b.dataset.pay;render()});
    const lpb=$('#fLP');if(lpb)lpb.onclick=()=>{const p=lastPay(f.party).party;f.bank=p.bank;f.acc=p.acc;f.accName=p.accName||'';render()};
    document.querySelectorAll('.ln input').forEach(i=>i.onchange=()=>{f.lines[+i.dataset.i][i.dataset.k]=i.value;if(i.dataset.k!=='item')render()});
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{f.lines.splice(+b.dataset.del,1);if(!f.lines.length)f.lines.push({item:'',qty:'',price:''});render()});
    const ad=$('#fAdd');if(ad)ad.onclick=()=>{f.lines.push({item:'',qty:'',price:''});render()};$('#fSave').onclick=()=>save(false);$('#fSend').onclick=()=>save(true)}
  if(S.tab==='lock')$('#lkGo').onclick=async()=>{const d=$('#lkD').value;if(!d)return toast('Chọn ngày');if(!confirm('Khóa sổ đến hết ngày '+dmy(d)+'?'))return;await api('periodLock',{lockDate:d},'✓ Đã khóa kỳ đến '+dmy(d))}}
function payParty(f){return {code:String(f.party||'').trim().split(/[\s–-]/)[0],name:String(f.party||'').trim(),bank:f.bank,bin:BANKS[f.bank],acc:String(f.acc||'').replace(/\s/g,''),accName:noAcc(f.accName)}}
function payOk(f){if(!String(f.party||'').trim())return 'Chưa nhập người nhận';if(!BANKS[f.bank])return 'Chưa chọn ngân hàng';if(!/^\d{6,19}$/.test(String(f.acc||'').replace(/\s/g,'')))return 'Số tài khoản 6–19 chữ số';if(!noAcc(f.accName))return 'Chưa nhập tên chủ tài khoản';return ''}
async function save(send){const f=S.form,pr=PRICE[f.type];
  if(f.type==='LCHI'){const e=payOk(f);if(e)return toast(e);const amt=Math.round(num(f.amt));if(!(amt>0))return toast('Chưa nhập số tiền');const id=f.id||(f.id=rid());const msg=f.payMsg||('VIBA TT '+(f.note||f.party));
    $('#fSave').disabled=$('#fSend').disabled=true;try{const r=await api('docCreate',{type:'LCHI',id,date:f.date,note:msg,lines:[{item:f.note||'Chi tiền',qty:1,price:amt,amount:amt}],party:payParty(f),ref:{from:PAYFROM,desc:f.note||''}});if(send)await api('transition',{id,to:'submitted',ver:r.doc.ver});toast('✓ Đã lập '+r.doc.no+(send?' và gửi duyệt':''));newForm('PMUA');S.tab='pay';render();try{vibaSync.full()}catch(_){}}catch(e){$('#fSave').disabled=$('#fSend').disabled=false}return}
  if((f.type==='PMUA'||f.type==='PNVT')&&f.pay==='ck'&&send){const e=payOk(f);if(e)return toast(e)}const lines=f.lines.filter(l=>String(l.item).trim()||num(l.qty)).map(l=>{const q=num(l.qty),p=pr?num(l.price):0;const o={item:String(l.item).trim(),qty:q};if(pr){o.price=p;o.amount=Math.round(q*p)}return o});
  if(!lines.length)return toast('Chưa có dòng hàng');const id=f.id||(f.id=rid());const pt=String(f.party||'').trim();
  const a={type:f.type,id,date:f.date,note:f.note,lines,wh:STK[f.type]?f.wh:undefined,wh2:STK[f.type]==='move'?f.wh2:undefined,party:pt?{code:pt.split(/[\s–-]/)[0],name:pt}:null};
  $('#fSave').disabled=$('#fSend').disabled=true;
  try{const r=await api('docCreate',a);if(send)await api('transition',{id,to:'submitted',ver:r.doc.ver});let pno='';
    if(send&&(f.type==='PMUA'||f.type==='PNVT')&&f.pay==='ck'&&r.doc.total>0){const pid=f.pid||(f.pid=rid());const msg=f.payMsg||('VIBA TT '+r.doc.no+' '+(lines[0]&&lines[0].item||''));const q=await api('docCreate',{type:'LCHI',id:pid,date:f.date,note:msg,lines:[{item:'Thanh toán '+r.doc.no,qty:1,price:r.doc.total,amount:r.doc.total}],party:payParty(f),ref:{id,no:r.doc.no,type:f.type,from:PAYFROM}});await api('transition',{id:pid,to:'submitted',ver:q.doc.ver});pno=q.doc.no}
    toast('✓ Đã lưu '+r.doc.no+(send?' và gửi duyệt':'')+(pno?' · lệnh chi '+pno:''));newForm(f.type);S.tab=pno?'pay':'list';render();try{vibaSync.full()}catch(_){}}catch(e){$('#fSave').disabled=$('#fSend').disabled=false}}
async function act(a,id,btn){const d=S.D.get(id);if(!d)return;btn.disabled=true;
  try{if(a==='send')await api('transition',{id,to:'submitted',ver:d.ver},'✓ Đã gửi duyệt');
    else if(a==='back')await api('transition',{id,to:'draft',ver:d.ver},'Đã trả lại người lập');
    else if(a==='cancel'){if(!confirm('Hủy chứng từ '+d.no+'?'))return btn.disabled=false;await api('transition',{id,to:'cancelled',ver:d.ver},'Đã hủy')}
    else if(a==='appr'){let r=await api('transition',{id,to:'approved',ver:d.ver});if(r.needOver){if(!confirm(`Vượt hạn mức ${fm(r.limit)} đ (tổng ${fm(r.total)} đ). Duyệt vượt hạn mức?`))return btn.disabled=false;r=await api('transition',{id,to:'approved',ver:d.ver,overOk:true})}toast('✓ Đã duyệt '+d.no)}
    else if(a==='paid'){const r=prompt('Đã chuyển khoản '+d.no+' – '+fm(d.total)+' đ.\nGhi mã giao dịch / ghi chú (không bắt buộc):','');if(r===null)return btn.disabled=false;await api('payMark',{id,ver:d.ver,payRef:r},'✓ Đã ghi nhận chi '+d.no)}
    else if(a==='acct'||a==='unacct')await api('acctCheck',{id,ver:d.ver,undo:a==='unacct'},a==='acct'?'✓ Kế toán đã kiểm '+d.no:'Đã bỏ kiểm');
    else if(a==='rev'){const n=prompt('Lý do lập chứng từ ngược cho '+d.no+':');if(n===null)return btn.disabled=false;const r=await api('reverse',{id,ver:d.ver,newId:rid(),note:n});toast('✓ Đã lập '+r.doc.no+' – gửi duyệt để có hiệu lực')}
    try{vibaSync.full()}catch(_){}}catch(e){btn.disabled=false}}
let nmT=0;async function loadNames(c){const U=[...new Set([...S.D.values()].flatMap(d=>[d.createdBy,d.approvedBy,d.paidBy]).filter(u=>u&&!(u in S.names)))];if(!U.length||Date.now()-nmT<3000)return;nmT=Date.now();try{const u=await c.use('user');const p=await u.profiles(U);for(const k of U)S.names[k]=(p[k]&&p[k].name)||'';if(S.tab!=='new')render()}catch(e){}}
async function init(){let c=window.claude;for(let i=0;i<60&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use))return $('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ dữ liệu.</div>';
  const db=await c.use('db');S.names={};S.me=window.vibaErp&&vibaErp.me();if(!S.me)return $('#view').innerHTML='<div class="alert r">Chưa đăng nhập.</div>';
  if(!S.me.owner){let st={};try{st=(await db.doc('staff/'+S.me.uid).get()).data()||{}}catch(e){}if(!['kho','sx','ketoan','ketoantt'].includes(st.role)||st.active===false)return $('#view').innerHTML='<div class="alert r">Tài khoản của bạn không có quyền vào ERP.</div><p><a class="btn" href="index.html">← Về app</a></p>';S.kt=st.role==='ketoantt';S.role=st.role;S.whs=st.erpWh||(st.role==='kho'?['HN']:/^ketoan/.test(st.role)?['NM','XC','TT','HN']:['NM','XC','TT'])}newForm('PMUA');
  db.collection('products').onSnapshot(s=>{S.P=new Map(s.docs.map(d=>[String(d.data().code||d.id).toLowerCase(),d.data()]));if(S.tab==='stock')render()});
  db.collection('erpdocs').onSnapshot(s=>{S.D=new Map(s.docs.map(d=>[d.id,d.data()]));loadNames(c);if(S.tab!=='new')render();else{const t=$('.tb');if(t)t.outerHTML=tabs();document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.f='all';render()})}});
  db.collection('stockmoves').onSnapshot(s=>{S.M=s.docs.map(d=>d.data());if(S.tab==='stock')render()});const H=location.hash.slice(1);if(TY[H]){newForm(H);S.tab='new'}else if(['list','wait','acct','stock','lock','pay'].includes(H))S.tab=H;render()}
init()})();
