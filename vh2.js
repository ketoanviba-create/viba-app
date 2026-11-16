/* VIBA – "Việc hôm nay" ở đầu màn hình đầu tiên (v1, 15/11/2026). Chạy độc lập: lỗi ở đây không ảnh hưởng app.
   Quản lý/CEO/Kế toán (owner): khối ở đầu Tổng quan + gọn Tổng quan (phần chi tiết gom vào "Xem chi tiết khác").
   Vị trí khác: 1 dòng, bấm để mở danh sách việc. Sản xuất: nút lập phiếu kho ERP theo vị trí. */
(function(){'use strict';
if(window.__vh)return;window.__vh=1;
const OFFICE=['Giám đốc','Kế toán trưởng','Admin','Kế toán'],HB={NM:1,XC:1,TT:1},LIM={PMUA:1e7,DXVT:1e7,PCHI:1e6};
const vn=()=>new Date(Date.now()+7*36e5),today=()=>vn().toISOString().slice(0,10),hour=()=>vn().getUTCHours();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={defs:[],done:new Map(),erp:[],orders:[],staff:new Map(),me:null,day:today(),open:false,ready:0};
function applies(d,day){const dt=new Date(day+'T00:00:00Z'),wd=dt.getUTCDay(),dm=dt.getUTCDate(),last=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).getUTCDate();
  return d.when==='daily'||d.when==='event'||(d.when==='mon'&&wd===1)||(d.when==='fri'&&wd===5)||(d.when==='monthEnd'&&dm===last)||(d.when==='month5'&&dm>=5&&dm<=8)}
function posOf(uid){const s=S.staff.get(uid)||{};if(s.taskPos)return s.taskPos;if(s.role==='admin')return OFFICE;if(s.role==='sale')return['Sale'];if(s.role==='ship')return['Ship'];if(s.role==='kho')return['Thủ kho Hà Nội'];if(s.role==='sx')return[s.erpKho?'Thủ kho Hòa Bình':'Tổ trưởng sản xuất'];return[]}
function people(pos){if(OFFICE.includes(pos))return[null];return[...S.staff.entries()].filter(([u,s])=>s.active!==false&&posOf(u).includes(pos)).map(([u])=>u)}
const mgr=()=>S.me.owner||!!(S.staff.get(S.me.uid)||{}).taskAdmin;
const KTP=['Kế toán trưởng','Kế toán siêu thị & ngân hàng','Kế toán công nợ','Kế toán bán lẻ & thủ quỹ','Kế toán mua vào & kho'],myRl=()=>(S.staff.get(S.me.uid)||{}).role||'',isKT=()=>!S.me.owner&&/^ketoan/.test(myRl()),isKTT=()=>!S.me.owner&&myRl()==='ketoantt';
const nameOf=u=>u?((S.staff.get(u)||{}).name||u):'Văn phòng';
const key=(d,u)=>S.day+'_'+d.id+'_'+(u||'vp');
function rec(d,u){if(u)return S.done.get(key(d,u));for(const[k,v]of S.done)if(k.startsWith(S.day+'_'+d.id+'_'))return v;return null}
function status(d,u){if(d.id==='sh2'&&u)return cashSt(d,u);const R=rec(d,u),day=S.day,E=S.erp;
  const man=()=>!R?{s:'todo',t:'Chưa báo xong'}:R.st==='checked'?{s:'done',t:'Đạt · '+nameOf(R.checkBy)}:R.st==='returned'?{s:'todo',t:'Trả lại: '+(R.why||'')}:{s:'wait',t:'Chờ kiểm'};
  if(d.mode==='manual'||d.rule==='pending'||d.rule==='pending_misa')return man();
  const cnt=f=>E.filter(f).length;
  if(d.rule==='erp_over'){const n=cnt(x=>x.st==='submitted'&&LIM[x.type]&&x.total>LIM[x.type]);return n?{s:'todo',t:'Còn '+n+' phiếu vượt hạn mức'}:{s:'done',t:'Không còn phiếu chờ'}}
  if(d.rule==='erp_pending'){const n=cnt(x=>x.st==='submitted');return n?{s:'todo',t:'Còn '+n+' phiếu chờ duyệt'}:{s:'done',t:'Mục Chờ duyệt = 0'}}
  if(d.rule==='erp_acct'){const n=cnt(x=>x.st==='approved'&&!x.acctOk);return n?{s:'todo',t:'Còn '+n+' phiếu chưa kiểm'}:{s:'done',t:'Đã kiểm hết'}}
  if(d.rule.startsWith('erp:')||d.rule==='erp_in_HN'){const RW=d.rule.slice(4).split('@'),W1=RW[1]||'',T=d.rule==='erp_in_HN'?['CKNB']:RW[0].split(',');
    const L=E.filter(x=>x.date===day&&T.includes(x.type)&&x.st!=='cancelled'&&(d.rule==='erp_in_HN'?x.wh2==='HN':W1?x.wh===W1:HB[x.wh]));
    if(!L.length)return{s:'none',t:'Không phát sinh'};const p=L.filter(x=>x.st==='draft'||x.st==='submitted').length;return p?{s:'todo',t:p+'/'+L.length+' phiếu chưa duyệt'}:{s:'done',t:L.length+' phiếu đã duyệt'}}
  if(d.rule==='orders_created'){const n=S.orders.filter(o=>o.date===day&&o.status!=='cancel').length;return n?{s:'done',t:n+' đơn lên trong ngày'}:{s:hour()>=22?'late':'todo',t:'Chưa có đơn'}}
  if(d.rule==='sale_shift')return hour()>=17?{s:'done',t:'App đã tự chốt ca 17:00'}:{s:'todo',t:'App tự chốt lúc 17:00'};
  if(d.rule==='ship_day'){const L=S.orders.filter(o=>o.shipId===u&&(o.dlvDate||o.date)===day&&o.status!=='cancel');
    if(R&&R.closed)return{s:'done',t:'Đã bấm hoàn thành'+(R.undel&&R.undel.length?' · '+R.undel.length+' đơn chưa giao có lý do':'')};
    if(!L.length)return{s:'none',t:'Không có đơn'};const n=L.filter(o=>o.status!=='done').length;return n?{s:'todo',t:'Còn '+n+'/'+L.length+' đơn chưa giao'}:{s:'done',t:'Đã giao hết '+L.length+' đơn'}}
  return man()}
/*v3 nop tien*/
const recC=(d,u)=>{const R=rec(d,u);return R&&R.cash!=null?R:null};
const fm=v=>Math.round(+v||0).toLocaleString('vi-VN')+' đ';
function cashOf(u){let A=null;try{A=window.__vibaApp&&window.__vibaApp()}catch(e){}if(!A||!A.R)return{v:0,n:0};const L=A.R.orders.filter(o=>o.shipId===u&&o.status!=='cancel'&&o.paid&&o.payMethod==='cash'&&A.payDay(o)===S.day);return{v:L.reduce((x,o)=>{const t=A.orderTotal(o);return x+Math.min(t,(+o.paidAmount)||t)},0),n:L.length}}
function cashSt(d,u){const R=recC(d,u),c=cashOf(u),ex=c.v-((R&&R.cash)||0);
  if(!R)return c.v?{s:'todo',t:'Tiền mặt '+fm(c.v)+' chưa nộp'}:{s:'none',t:'Chưa thu tiền mặt'};
  if(R.st==='done')return{s:'wait',t:'Đã nộp '+fm(R.cash)+' · chờ kế toán nhận'+(ex>0?' · thu thêm '+fm(ex)+' chưa nộp':'')};
  const rv=R.recv!=null?R.recv:R.cash,sh=(R.cash||0)-rv;if(ex>0)return{s:'todo',t:'Thu thêm '+fm(ex)+' chưa nộp'};
  return{s:'done',t:'Kế toán đã nhận '+fm(rv)+(sh>0?' · thiếu '+fm(sh):'')+(R.checkBy?' · '+nameOf(R.checkBy):'')}}
function cashCard(d){const u=S.me.uid,st=status(d,u),R=recC(d,u),c=cashOf(u),ex=c.v-((R&&R.cash)||0),can=(!R&&c.v>0)||(R&&ex>0);
  return '<div class="vt" style="--c:'+COL[st.s]+';display:block"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>Nộp tiền thu trong ngày</b><span class="ch" style="background:'+COL[st.s]+'">'+(st.s==='wait'?'Chờ kế toán nhận':st.s==='done'?'Kế toán đã nhận':LAB[st.s])+'</span></div><div class="m" style="margin:4px 0">💵 Tiền mặt hôm nay: <b style="font-size:15px;color:var(--fg,#0f1b29)">'+fm(c.v)+'</b> · '+c.n+' đơn</div><div class="m">'+esc(st.t)+'</div>'+(can?'<button class="btn block pri" data-cash="1" style="margin-top:8px">✓ Đã nộp tiền'+(R?' thêm '+fm(ex):'')+'</button>':'')+'</div>'}
async function payCash(){const u=S.me.uid,d=S.defs.find(x=>x.id==='sh2');if(!d)return;const R=recC(d,u),c=cashOf(u),amt=c.v-((R&&R.cash)||0);if(amt<=0)return;
  if(!confirm('Xác nhận đã nộp '+fm(amt)+' tiền mặt cho kế toán?'))return;const k=key(d,u),prev=R?(R.st==='checked'?(R.recv!=null?R.recv:R.cash):(R.recvPrev||0)):0;
  const r={day:S.day,def:'sh2',uid:u,st:'done',cash:c.v,n:c.n,recvPrev:prev,note:'Nộp '+fm(c.v)+' · '+c.n+' đơn',at:Date.now(),by:u};await S.db.doc('taskdone/'+k).set(r);S.done.set(k,r)}
const canRecv=()=>isKTT()||myPos().some(p=>p==='Kế toán bán lẻ & thủ quỹ'||p==='Kế toán siêu thị & ngân hàng');
function cashBlock(){if(!canRecv())return'';const all=[...S.done.entries()].filter(([k,r])=>r.def==='sh2'&&r.day===S.day&&r.cash!=null),P=all.filter(([k,r])=>r.st==='done'),D=all.filter(([k,r])=>r.st==='checked');
  let h='<div class="blk" style="margin-bottom:10px"><div class="hd"><b>💵 Tiền ship chờ nhận</b><span class="m">Hôm nay</span></div>';
  h+=P.map(([k,r])=>{const due=(r.cash||0)-(r.recvPrev||0);return '<div style="border-top:1px solid #e6ecf2;padding:9px 0"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><b>'+esc(nameOf(r.uid))+'</b><div class="m">'+(r.n||0)+' đơn · nộp '+new Date((+r.at||0)+7*36e5).toISOString().slice(11,16)+'</div></div><b style="font-size:17px">'+fm(due)+'</b></div><div style="display:flex;gap:8px;margin-top:7px"><button class="btn sm pri" data-crec="'+esc(k)+'" style="flex:2">✓ Đã nhận tiền</button><button class="btn sm" data-cshort="'+esc(k)+'" style="flex:1">Chưa đủ</button></div></div>'}).join('')||'<div class="m" style="padding:6px 0">Chưa có ship nộp tiền.</div>';
  if(D.length)h+='<div class="sec2">Đã nhận hôm nay</div>'+D.map(([k,r])=>{const rv=r.recv!=null?r.recv:r.cash,sh=(r.cash||0)-rv;return '<div style="display:flex;justify-content:space-between;font-size:13.5px;padding:4px 0"><span>'+esc(nameOf(r.uid))+'</span><b style="color:'+(sh>0?COL.late:COL.done)+'">'+fm(rv)+(sh>0?' · thiếu '+fm(sh):'')+'</b></div>'}).join('');
  return h+'</div>'}
async function recvCash(k,short){const r=S.done.get(k);if(!r)return;const due=(r.cash||0)-(r.recvPrev||0);let got=due;
  if(short){const t=prompt('Số tiền thực nhận (đ) – phải nhận '+fm(due)+':','');if(t===null)return;got=+String(t).replace(/\D/g,'');if(!(got>=0)||got>=due)return alert('Nhập số tiền nhỏ hơn '+fm(due))}
  const n=Object.assign({},r,{st:'checked',recv:(r.recvPrev||0)+got,short:due-got,checkBy:S.me.uid,checkAt:Date.now()});await S.db.doc('taskdone/'+k).set(n);S.done.set(k,n)}
function cashTable(){const sh=[...S.staff.entries()].filter(([u,s])=>s.role==='ship'&&s.active!==false),d=S.defs.find(x=>x.id==='sh2');if(!d)return'';let T=0,rows='';
  sh.forEach(([u])=>{const c=cashOf(u),R=recC(d,u);if(!c.v&&!R)return;T+=c.v;const st=cashSt(d,u),lb=st.s==='done'?(/thiếu/.test(st.t)?['Thiếu',COL.late]:['Đã nhận',COL.done]):st.s==='wait'?['Chờ nhận',COL.wait]:['Chưa nộp',COL.todo];
    rows+='<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #e6ecf2;font-size:13.5px"><span style="flex:1">'+esc(nameOf(u))+'</span><b>'+fm(c.v)+'</b><span class="ch" style="background:'+lb[1]+'">'+lb[0]+'</span></div>'});
  return rows?'<div class="blk" style="margin-top:8px;border-width:1px"><b>💵 Tiền mặt ship nộp hôm nay</b>'+rows+'<div style="display:flex;justify-content:space-between;padding-top:7px;border-top:2px solid #e6ecf2"><b>Tổng</b><b>'+fm(T)+'</b></div></div>':''}
const CH={done:['Xong','#1F8A52'],todo:['Chưa xong','#B26A00'],late:['Trễ','#C0392B'],wait:['Chờ kiểm','#1B69A3'],none:['Không phát sinh','#8a96a3']};

const COL={done:'#1f8a52',todo:'#c77700',late:'#d63b2f',wait:'#1b6aa5',none:'#8a96a3'},LAB={done:'Xong',todo:'Chưa xong',late:'Trễ',wait:'Chờ kiểm',none:'Không phát sinh'};
function myPos(){const st=S.staff.get(S.me.uid)||{};return st.taskPos||(S.me.owner?OFFICE:posOf(S.me.uid))}
function myTasks(){const P=myPos(),L=[];S.defs.filter(d=>d.active!==false&&applies(d,S.day)&&P.includes(d.pos)).forEach(d=>{const u=OFFICE.includes(d.pos)?null:S.me.uid;L.push({d,s:status(d,u)})});return L}
function firstTab(){const b=document.querySelector('#tabs button');return !b||b.classList.contains('on')}
const css=`#vh{margin:8px 0 10px}#vh .vs{display:flex;align-items:center;gap:10px;background:var(--card,#fff);border:2px solid #1b6aa5;border-radius:14px;padding:11px 14px;cursor:pointer}
#vh .vs.ok{background:#e3f4ea;border-color:#e3f4ea;color:#1f8a52;font-weight:700}#vh .vs b{font-size:15px}#vh .vs .m{font-size:12.5px;color:var(--muted,#5f6d7d)}
#vh .vl{margin-top:6px}#vh .vt{display:flex;align-items:center;gap:10px;background:var(--card,#fff);border:1px solid var(--line,#dbe3ec);border-left:5px solid var(--c);border-radius:12px;padding:10px 12px;margin-bottom:6px;text-decoration:none;color:inherit}
#vh .vt .x{flex:1}#vh .vt b{display:block;font-size:14.5px;line-height:1.3}#vh .vt span.m{font-size:12px;color:var(--muted,#5f6d7d)}#vh .ch{font-size:11px;font-weight:800;color:#fff;border-radius:999px;padding:3px 9px;white-space:nowrap}
#vh .blk{background:var(--card,#fff);border:2px solid #1b6aa5;border-radius:16px;padding:12px}#vh .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}#vh .hd b{font-size:17px}#vh .hd a{font-size:13px;font-weight:700;color:#1b6aa5;text-decoration:none}
#vh .ac{display:flex;align-items:center;gap:12px;border:1px solid var(--line,#dbe3ec);border-radius:12px;padding:10px 12px;margin-bottom:6px;text-decoration:none;color:inherit;background:var(--card,#fff)}#vh .ac .i{font-size:20px;width:26px;text-align:center}#vh .ac .x{flex:1}#vh .ac b{display:block;font-size:14.5px}#vh .ac span{font-size:12px;color:var(--muted,#5f6d7d)}#vh .ac .n{font-size:19px;font-weight:800;color:#d63b2f}#vh .ac .n.g{color:#1f8a52}
#vh .g4{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}#vh .g4 a{border:1.5px solid var(--line,#dbe3ec);background:var(--card,#fff);border-radius:14px;padding:12px 8px;font-weight:700;font-size:14px;color:var(--fg,#0f1b29);text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:4px}#vh .g4 a i{font-style:normal;font-size:26px}
#vh .sec2{font-size:12px;font-weight:700;color:var(--muted,#5f6d7d);text-transform:uppercase;letter-spacing:.05em;margin:12px 4px 4px}
details.vhd{margin-top:10px;grid-column:1/-1}#vh .kg2{display:grid;grid-template-columns:1fr 1fr;gap:8px}#vh .kt{background:var(--card,#fff);border:1px solid var(--line,#dbe3ec);border-radius:14px;padding:11px 12px}#vh .kt .l{font-size:12.5px;color:var(--muted,#5f6d7d);font-weight:600}#vh .kt .v{font-size:21px;font-weight:800;margin:2px 0}#vh .kt .s{font-size:11.5px;color:var(--muted,#5f6d7d)}#vh .tg{font-size:9.5px;font-weight:800;color:#8a5a00;background:#fff4d6;border-radius:6px;padding:1px 5px}#vh .m{font-size:12.5px;color:var(--muted,#5f6d7d)}#vh .seg{display:flex}details.vhd>summary{cursor:pointer;font-weight:700;color:#1b6aa5;padding:12px 4px;list-style:none;text-align:center}`;
function ac(href,i,t,s,n,g){return `<a class="ac" href="${href}"><span class="i">${i}</span><div class="x"><b>${t}</b><span>${s}</span></div><span class="n ${g?'g':''}">${n}</span><span style="color:#97a3b1">›</span></a>`}
function htmlOwner(){const E=S.erp,sub=E.filter(x=>x.st==='submitted'),over=sub.filter(x=>LIM[x.type]&&x.total>LIM[x.type]).length,acct=E.filter(x=>x.st==='approved'&&!x.acctOk).length;
  const chk=[...S.done.values()].filter(r=>r.day===S.day&&r.st==='done').length;const M=myTasks().filter(x=>x.s.s!=='none'),mOk=M.filter(x=>x.s.s==='done').length;
  let tot=0,ok=0;const P=[...new Set(S.defs.map(d=>d.pos))];P.forEach(p=>{S.defs.filter(d=>d.active!==false&&applies(d,S.day)&&d.pos===p).forEach(d=>people(p).forEach(u=>{const s=status(d,u).s;if(s!=='none'){tot++;if(s==='done')ok++}}))});
  return `<div class="blk"><div class="hd"><b>📋 Việc hôm nay</b><a href="viec.html#all">Toàn công ty ›</a></div>
  ${ac('erp.html#wait','📦','Phiếu ERP chờ duyệt',over?over+' phiếu vượt hạn mức':'Trong và ngoài hạn mức',sub.length,!sub.length)}
  ${ac('erp.html#acct','🔍','Phiếu chờ kế toán kiểm','Kiểm xong mới được sang MISA',acct,!acct)}
  ${ac('viec.html#chk','✅','Việc nhân viên chờ kiểm','Bấm Đạt / Trả lại',chk,!chk)}
  ${ac('viec.html','🙋','Việc của tôi',M.filter(x=>x.s.s!=='done').map(x=>x.d.title).slice(0,2).join(' · ')||'Đã xong hết',mOk+'/'+M.length,mOk===M.length)}
  <div style="font-size:12.5px;color:var(--muted,#5f6d7d);margin-top:2px">Toàn công ty hôm nay: <b style="color:var(--fg,#0f1b29)">${ok}/${tot} việc xong (${tot?Math.round(ok/tot*100):0}%)</b></div></div>`}
function htmlStaff(){const L=myTasks().filter(x=>x.s.s!=='none'),n=L.filter(x=>x.s.s==='done').length,rest=L.filter(x=>x.s.s!=='done');
  const st=S.staff.get(S.me.uid)||{},P=myPos();let h='';
  if(!L.length)h=`<div class="vs ok">✓ Hôm nay chưa có việc cho vị trí của bạn</div>`;
  else if(!rest.length)h=`<div class="vs ok" data-vh="t">✓ Xong việc hôm nay (${n}/${L.length})<span style="margin-left:auto">${S.open?'⌃':'›'}</span></div>`;
  else h=`<div class="vs" data-vh="t"><span style="font-size:20px">📋</span><div style="flex:1"><b>Việc hôm nay ${n}/${L.length}</b><div class="m">còn: ${esc(rest.map(x=>x.d.title).join(' · '))}</div></div><span style="color:#1b6aa5;font-weight:800">${S.open?'⌃':'›'}</span></div>`;
  if(S.open&&L.length)h+=`<div class="vl">${L.map(x=>x.d.id==='sh2'?cashCard(x.d):`<a class="vt" style="--c:${COL[x.s.s]}" href="viec.html"><div class="x"><b>${esc(x.d.title)}</b><span class="m">${esc(x.s.t)}</span></div><span class="ch" style="background:${COL[x.s.s]}">${x.s.s==='done'?'Xong':x.s.s==='wait'?'Chờ kiểm':x.d.rule==='ship_day'?'Hoàn thành ›':(x.d.mode==='manual'||String(x.d.rule).startsWith('pending'))?'Báo xong ›':LAB[x.s.s]}</span></a>`).join('')}</div>`;
  if(st.role==='kho'){const C=S.erp.filter(x=>x.type==='CKNB'&&x.wh2==='HN'&&x.date===S.day&&x.st!=='cancelled');if(C.length)h+=`<a class="ac" href="erp.html#list" style="margin-top:6px"><span class="i">🚚</span><div class="x"><b>Hàng Hòa Bình chuyển về</b><span>${C.map(x=>esc(x.no||'')).join(' · ')}</span></div><span class="n">${C.length}</span><span style="color:#97a3b1">›</span></a>`}
  const B=[];if(P.includes('Thủ kho Hòa Bình')||P.includes('Kế toán mua vào & kho'))B.push(['PMUA','🛒','Mua nguyên liệu'],['DXVT','🧰','Mua vật tư'],['CKNB','🚚','Điều xe, chuyển về HN']);
  if(P.some(p=>/^Tổ trưởng/.test(p)))B.push(['PXSX','🏭','Xuất NL vào sản xuất'],['NKTP','📦','Nhập thành phẩm']);
  if(B.length)h+=`<div class="sec2">Phiếu kho ERP</div><div class="g4">${B.map(([k,i,t])=>`<a href="${k==='viec'?'viec.html':'erp.html#'+k}"><i>${i}</i>${t}</a>`).join('')}</div>`;
  return h}
function slimDash(){if(!S.me||!S.me.owner)return;const v=document.getElementById('view');if(!v)return;const h=v.querySelector('h1.big');if(!h||h.textContent.trim()!=='Tổng quan')return;
  let st=h.nextElementSibling;const pre=[];while(st&&!st.classList.contains('stack')){pre.push(st);st=st.nextElementSibling}if(!st||st.dataset.vh)return;st.dataset.vh='1';
  const keep=new Set(['mr','mt','md','mo']),kids=[...st.children];if(kids.length<3)return;const det=document.createElement('details');det.className='vhd';det.innerHTML='<summary>Xem chi tiết khác ›</summary>';
  const box=document.createElement('div');box.className='stack';det.appendChild(box);
  kids.forEach((el,i)=>{if(i===0)return;const a=el.querySelector&&el.querySelector('[data-acc]');if(a&&keep.has(a.dataset.acc))return;if(el.querySelector&&el.querySelector('.alert')&&!a)return;box.appendChild(el)});
  pre.forEach(el=>box.appendChild(el));if(box.children.length)st.appendChild(det)}
let last='';
const isQL=()=>window.APP_MODE==='admin';
function activeTab(){const b=[...document.querySelectorAll('#tabs button')];const i=b.findIndex(x=>x.classList.contains('on'));return {i,t:i>=0?b[i].textContent.trim():''}}
const DAY=d=>{const x=new Date(Date.now()+7*36e5-d*864e5);return x.toISOString().slice(0,10)};
const fmtM=v=>{v=+v||0;return v>=1e9?(v/1e9).toFixed(2).replace('.',',')+' tỷ':v>=1e6?(v/1e6).toFixed(1).replace('.',',')+' tr':Math.round(v).toLocaleString('vi-VN')+' đ'};
function cvView(){const tab=S.cvTab||'all',chkL=[...S.done.entries()].filter(([k,r])=>r.day===S.day&&r.st==='done');
  let h=htmlOwner()+`<div class="seg" style="margin-top:10px">${[['mine','Việc của tôi'],['all','Toàn công ty'],['chk','Chờ kiểm'+(chkL.length?' ('+chkL.length+')':'')]].map(([k,l])=>`<button data-cvt="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div>`;
  const row=(d,u)=>{const x=status(d,u);return `<a class="vt" style="--c:${COL[x.s]}" href="viec.html"><div class="x"><b>${esc(d.title)}</b><span class="m">${u?esc(nameOf(u))+' · ':''}${esc(x.t)}</span></div><span class="ch" style="background:${COL[x.s]}">${LAB[x.s]}</span></a>`};
  if(tab==='mine'){const M=myTasks();h+=`<div class="vl" style="margin-top:8px">${M.map(x=>row(x.d,OFFICE.includes(x.d.pos)?null:S.me.uid)).join('')||'<div class="m">Chưa có việc.</div>'}</div>`}
  if(tab==='all'){const P=[];S.defs.forEach(d=>{if(d.active!==false&&!P.includes(d.pos))P.push(d.pos)});h+='<div class="sec2">Theo vị trí · bấm để xem</div>';
    P.forEach(p=>{let tot=0,ok=0;const D=S.defs.filter(d=>d.active!==false&&applies(d,S.day)&&d.pos===p),U=people(p);D.forEach(d=>U.forEach(u=>{const st=status(d,u).s;if(st!=='none'){tot++;if(st==='done')ok++}}));if(!D.length)return;const w=tot?Math.round(ok/tot*100):100,c=w===100?COL.done:w<40?COL.late:COL.todo,op=S.cvOpen===p;
      h+=`<div class="ac" data-cvp="${esc(p)}" style="cursor:pointer"><div class="x"><b>${esc(p)}${U[0]&&U.length>1?' ('+U.length+')':''}</b></div><span style="width:70px;height:7px;background:#e6ecf2;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${w}%;background:${c}"></i></span><span style="font-weight:800;width:38px;text-align:right">${ok}/${tot}</span><span style="color:#97a3b1">${op?'⌄':'›'}</span></div>`;
      if(op)h+=`<div style="padding-left:10px">${D.map(d=>U.map(u=>row(d,u)).join('')).join('')}</div>`})}
  if(tab==='chk'){h+=`<div class="vl" style="margin-top:8px">${chkL.map(([k,r])=>{const d=S.defs.find(x=>x.id===r.def)||{title:r.def};return `<a class="vt" style="--c:${COL.wait}" href="viec.html#chk"><div class="x"><b>${esc(d.title)}</b><span class="m">${esc(nameOf(r.uid==='vp'?null:r.uid))} · ${esc(r.note||'')}</span></div><span class="ch" style="background:${COL.wait}">Kiểm ›</span></a>`}).join('')||'<div class="m" style="padding:8px">Không có việc chờ kiểm.</div>'}</div>`}
  return h}
function kpiView(){const A=window.__vibaApp&&(()=>{try{return window.__vibaApp()}catch(e){return null}})();const p=S.kp||'today';
  let h=`<div class="seg">${[['today','Hôm nay'],['7','7 ngày'],['30','30 ngày']].map(([k,l])=>`<button data-kp="${k}" class="${p===k?'on':''}">${l}</button>`).join('')}</div><div class="sec2">8 chỉ số điều hành</div>`;
  const T=(n,l,v,sub,c,tag,k)=>`<div class="kt"${k?` data-kd="${k}" style="cursor:pointer"`:''}><div class="l"><b style="color:#1b6aa5">${n}</b> · ${l}${tag?` <span class="tg">${tag}</span>`:''}</div><div class="v" style="color:${c}">${v}</div><div class="s">${sub}</div></div>`;
  if(!A||!A.R){return h+'<div class="m">Đang tải dữ liệu…</div>'}
  const inR=(a,b)=>A.R.orders.filter(o=>o.date>=a&&o.date<=b);const n=p==='today'?1:+p,f=DAY(n-1),t=DAY(0),L=inR(f,t),Lp=inR(DAY(2*n-1),DAY(n)),L30=inR(DAY(29),t);
  if(!L||!L30)return h+'<div class="m">Đang tải dữ liệu…</div>';
  const s=A.stats(L),rev=s.revenue,pr=Lp?A.stats(Lp).revenue:0,ch=pr?Math.round((rev-pr)/pr*100):null;
  const O=A.R.orders,pay=O.filter(o=>o.status!=='cancel'&&o.paid&&(d=>d>=f&&d<=t)(A.payDay(o))).reduce((x,o)=>{const tt=A.orderTotal(o);return x+Math.min(tt,(+o.paidAmount)||tt)},0);
  const debt=O.reduce((x,o)=>x+A.owedOf(o),0),r30=A.stats(L30).revenue,dso=r30?Math.round(debt/(r30/30)):0;
  const dd=o=>o.doneAt?new Date(+o.doneAt+7*36e5).toISOString().slice(0,10):'';const G=L.filter(o=>o.status!=='cancel'&&(o.dlvDate||o.date)<=t),onT=G.filter(o=>o.status==='done'&&dd(o)&&dd(o)<=(o.dlvDate||o.date)).length,otif=G.length?Math.round(onT/G.length*100):null;
  const rr=s.qty?(s.ret+s.swap)/s.qty*100:0;let tot=0,ok=0;[...new Set(S.defs.map(d=>d.pos))].forEach(p2=>S.defs.filter(d=>d.active!==false&&applies(d,S.day)&&d.pos===p2).forEach(d=>people(p2).forEach(u=>{const x=status(d,u).s;if(x!=='none'){tot++;if(x==='done')ok++}})));const job=tot?Math.round(ok/tot*100):null;
  const G_='#1f8a52',O_='#c77700',R_='#d63b2f',B_='#1b6aa5',N_='#8a96a3';
  h+=`<div class="kg2">${T(1,'Doanh thu thuần',fmtM(rev),ch==null?s.orders+' đơn · đã trừ hàng trả':(ch>=0?'▲ ':'▼ ')+Math.abs(ch)+'% so kỳ trước',B_,'','rev')}${T(2,'Biên LN gộp','—','Cần giá vốn theo lô',N_,'Bước 2')}
  ${T(3,'Tiền thu',fmtM(pay),'Quỹ + NH: bước 2',B_)}${T(4,'Số ngày thu nợ',dso+' ngày','Nợ '+fmtM(debt)+' · đỏ > 45',dso>45?R_:G_,'','debt')}
  ${T(5,'Ngày tồn kho','—','Cần giá trị tồn kho',N_,'Bước 2')}${T(6,'Hao hụt SX','—','Đang nối dữ liệu sản xuất',N_,'Bước 2')}
  ${T(7,'Giao đúng hẹn',otif==null?'—':otif+'%',G.length?onT+'/'+G.length+' đơn · cam < 90%':'Chưa có đơn',otif==null?N_:otif<90?O_:G_,'','otif')}${T(8,'Việc đúng hạn',job==null?'—':job+'%',ok+'/'+tot+' việc · cam < 90%',job==null?N_:job<90?O_:G_)}
  ${T('7b','Đổi trả',rr.toFixed(1).replace('.',',')+'%','đổi '+Math.round(s.swap)+' · trả '+Math.round(s.ret)+' · cam > 5%',rr>5?O_:G_)}<div class="kt" style="display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;color:var(--muted,#5f6d7d)">Xanh = đạt · Cam = chú ý · Đỏ = vượt ngưỡng</div></div>`;
  if(S.kd==='debt'){const by=new Map(),now=Date.now();O.forEach(o=>{const d=A.owedOf(o);if(!d)return;const k=o.custName||o.cust||'?';const e=by.get(k)||{v:0,old:o.date};e.v+=d;if(o.date<e.old)e.old=o.date;by.set(k,e)});const top=[...by.entries()].sort((a,b)=>b[1].v-a[1].v).slice(0,8);
    h+=`<div class="blk" style="margin-top:8px;border-width:1px"><b>Khách nợ nhiều nhất</b>${top.map(([k,e])=>{const dy=Math.round((new Date(t)-new Date(e.old))/864e5);return `<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #e6ecf2;font-size:13.5px"><span>${esc(k.slice(0,42))}</span><b style="white-space:nowrap;color:${dy>45?R_:'inherit'}">${fmtM(e.v)} · ${dy} ngày</b></div>`}).join('')}<div class="m" style="margin-top:4px">Số ngày = tính từ đơn còn nợ cũ nhất.</div></div>`}
  if(S.kd==='rev'){const days=[...Array(14)].map((_,i)=>DAY(13-i)),vals=days.map(d=>A.stats(inR(d,d)).revenue),mx=Math.max(1,...vals);
    h+=`<div class="blk" style="margin-top:8px;border-width:1px"><b>Doanh thu 14 ngày</b><div style="display:flex;align-items:flex-end;gap:4px;height:110px;margin-top:8px">${vals.map(v=>`<div title="${fmtM(v)}" style="flex:1;background:${B_};height:${Math.max(2,v/mx*100)}%;border-radius:3px 3px 0 0"></div>`).join('')}</div><div class="m" style="display:flex;justify-content:space-between"><span>${days[0].slice(8)}/${days[0].slice(5,7)}</span><span>${days[13].slice(8)}/${days[13].slice(5,7)}</span></div></div>`}
  if(S.kd==='otif'){const late=G.filter(o=>!(o.status==='done'&&dd(o)&&dd(o)<=(o.dlvDate||o.date))).slice(0,10);h+=`<div class="blk" style="margin-top:8px;border-width:1px"><b>Đơn chưa giao đúng hẹn</b>${late.map(o=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #e6ecf2;font-size:13px"><span>${esc(o.no||'')} · ${esc((o.custName||'').slice(0,34))}</span><span>${o.status==='done'?'giao '+dd(o).slice(8)+'/'+dd(o).slice(5,7):'chưa giao'}</span></div>`).join('')||'<div class="m">Không có.</div>'}</div>`}
  h+=cashTable();h+=`<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" data-vdet="1" style="flex:1">${S.det?'Ẩn báo cáo chi tiết ⌃':'Báo cáo chi tiết ›'}</button>${isKT()?'':'<button class="btn" data-vold="1" style="flex:1">Tổng quan bán hàng ›</button>'}</div>`;
  return h}
function ktView(){const tg=document.querySelector('.brandbar .tag');if(tg)tg.textContent=isKTT()?'Kế toán trưởng':'Kế toán';
 if(!isKTT()){const o=S.open;S.open=true;const h='<h1 class="big">Công việc</h1>'+cashBlock()+htmlStaff();S.open=o;return h}
 const E=S.erp,inL=x=>!(LIM[x.type]&&x.total>LIM[x.type]),sub=E.filter(x=>x.st==='submitted'&&inL(x)).length,acct=E.filter(x=>x.st==='approved'&&!x.acctOk).length;
 const TP=KTP.slice(1),inT=r=>{const d=S.defs.find(x=>x.id===r.def);return d&&KTP.includes(d.pos)},chkL=[...S.done.entries()].filter(([k,r])=>r.day===S.day&&r.st==='done'&&inT(r)),tab=S.ktTab||'mine';
 const row=(d,u)=>{const x=status(d,u);return '<a class="vt" style="--c:'+COL[x.s]+'" href="viec.html"><div class="x"><b>'+esc(d.title)+'</b><span class="m">'+(u?esc(nameOf(u))+' · ':'')+esc(x.t)+'</span></div><span class="ch" style="background:'+COL[x.s]+'">'+LAB[x.s]+'</span></a>'};
 let h='<h1 class="big">Công việc</h1>'+cashBlock()+'<div class="blk">'+ac('erp.html#wait','📦','Phiếu ERP chờ duyệt (trong hạn mức)','Vượt hạn mức do Quản lý duyệt',sub,!sub)+ac('erp.html#acct','🔍','Phiếu chờ kế toán kiểm','Kiểm xong mới được sang MISA',acct,!acct)+ac('viec.html#chk','✅','Việc kế toán chờ chị kiểm','Bấm Đạt / Trả lại',chkL.length,!chkL.length)+'</div>';
 h+='<div class="seg" style="margin-top:10px">'+[['mine','Việc của tôi'],['team','Nhóm kế toán'],['chk','Chờ kiểm'+(chkL.length?' ('+chkL.length+')':'')]].map(([k,l])=>'<button data-ktt="'+k+'" class="'+(tab===k?'on':'')+'">'+l+'</button>').join('')+'</div>';
 if(tab==='mine'){const M=myTasks();h+='<div class="vl" style="margin-top:8px">'+(M.map(x=>row(x.d,OFFICE.includes(x.d.pos)?null:S.me.uid)).join('')||'<div class="m">Chưa có việc.</div>')+'</div>'}
 if(tab==='team'){h+='<div class="sec2">Theo người · bấm để xem</div>';TP.forEach(p=>{const D=S.defs.filter(d=>d.active!==false&&applies(d,S.day)&&d.pos===p);people(p).forEach(u=>{let tot=0,ok=0;D.forEach(d=>{const st=status(d,u).s;if(st!=='none'){tot++;if(st==='done')ok++}});const w=tot?Math.round(ok/tot*100):100,c=w===100?COL.done:w<40?COL.late:COL.todo,k=p+'|'+u,op=S.cvOpen===k;
   h+='<div class="ac" data-cvp="'+esc(k)+'" style="cursor:pointer"><div class="x"><b>'+esc(nameOf(u))+'</b><span>'+esc(p.replace('Kế toán ',''))+'</span></div><span style="width:70px;height:7px;background:#e6ecf2;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:'+w+'%;background:'+c+'"></i></span><span style="font-weight:800;width:38px;text-align:right">'+ok+'/'+tot+'</span><span style="color:#97a3b1">'+(op?'⌄':'›')+'</span></div>';
   if(op)h+='<div style="padding-left:10px">'+D.map(d=>row(d,u)).join('')+'</div>'})});h+='<div class="m" style="margin:6px 4px">Chỉ hiện việc của nhóm kế toán.</div>'}
 if(tab==='chk'){h+='<div class="vl" style="margin-top:8px">'+(chkL.map(([k,r])=>{const d=S.defs.find(x=>x.id===r.def)||{title:r.def};return '<a class="vt" style="--c:'+COL.wait+'" href="viec.html#chk"><div class="x"><b>'+esc(d.title)+'</b><span class="m">'+esc(nameOf(r.uid==='vp'?null:r.uid))+' · '+esc(r.note||'')+'</span></div><span class="ch" style="background:'+COL.wait+'">Kiểm ›</span></a>'}).join('')||'<div class="m" style="padding:8px">Không có việc chờ kiểm.</div>')+'</div>'}
 return h}
function paint(){try{if(!S.ready||!S.me)return;let c=document.getElementById('vh');const v=document.getElementById('view');if(!v)return;
  if(!c){c=document.createElement('div');c.id='vh';v.parentNode.insertBefore(c,v);c.addEventListener('click',e=>{const g=x=>e.target.closest(x);let el;
    if(g('[data-cash]')){payCash().then(()=>{last='';paint()}).catch(x=>alert('Lỗi: '+x.message));return}else if(el=g('[data-crec]')){recvCash(el.dataset.crec,false).then(()=>{last='';paint()}).catch(x=>alert('Lỗi: '+x.message));return}else if(el=g('[data-cshort]')){recvCash(el.dataset.cshort,true).then(()=>{last='';paint()}).catch(x=>alert('Lỗi: '+x.message));return}else if(g('[data-vh="t"]')){S.open=!S.open}else if(el=g('[data-cvt]')){S.cvTab=el.dataset.cvt}else if(el=g('[data-cvp]')){S.cvOpen=S.cvOpen===el.dataset.cvp?null:el.dataset.cvp}
    else if(el=g('[data-ktt]')){S.ktTab=el.dataset.ktt}else if(el=g('[data-kp]')){S.kp=el.dataset.kp}else if(el=g('[data-kd]')){S.kd=S.kd===el.dataset.kd?null:el.dataset.kd}else if(g('[data-vdet]')){S.det=!S.det}
    else if(g('[data-vold]')){S.old=true;const b=document.querySelector('#tabs button');b&&b.click();setTimeout(()=>window.scrollTo(0,0),50)}
    else if(g('[data-vback]')){S.old=false}else return;last='';S.kat=0;paint()})}
  const kt=isQL()&&isKT(),ql=isQL()&&(S.me.owner||kt),at=activeTab(),md=(ql?at.i+'|'+at.t+'|'+!!S.old:'s'+firstTab());if(md!==S.mode){S.mode=md;last='';S.kat=0}
  if(ql){const fb=document.querySelector('#tabs button span:last-child')||document.querySelector('#tabs button');if(fb&&fb.textContent.trim()==='Tổng quan')fb.textContent='Công việc'}
  if(ql&&at.i===0){if(S.old){c.hidden=false;const h0=`<div class="ac" data-vback="1" style="cursor:pointer;border-color:#1b6aa5"><b style="flex:1">‹ Về Công việc</b><span class="m">Đang xem Tổng quan bán hàng</span></div>`;if(h0!==last){c.innerHTML=h0;last=h0}v.style.display=''}
    else{c.hidden=false;v.style.display='none';const h=kt?ktView():cvView();if(h!==last){c.innerHTML=h;last=h}}return}
  if(ql&&at.t==='Báo cáo'){S.old=false;c.hidden=false;v.style.display=S.det?'':'none';if(last&&Date.now()-(S.kat||0)<4000)return;S.kat=Date.now();const h=kpiView();if(h!==last){c.innerHTML=h;last=h}return}
  if(ql){S.old=false;c.hidden=true;v.style.display='';return}
  const show=firstTab();c.hidden=!show;if(show){const h=S.me.owner?htmlOwner():htmlStaff();if(h!==last){c.innerHTML=h;last=h}}}catch(e){console.error('vh',e)}}
async function init(){let c=window.claude;for(let i=0;i<100&&!(c&&c.use&&window.vibaErp&&vibaErp.me());i++){await new Promise(r=>setTimeout(r,150));c=window.claude}
  if(!(c&&c.use&&window.vibaErp))return;S.me=vibaErp.me();if(!S.me)return;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const db=await c.use('db');S.db=db;const R=()=>{S.ready=1;last='';S.kat=0;paint()};
  db.collection('taskdefs').onSnapshot(s=>{S.defs=s.docs.map(d=>d.data()).sort((a,b)=>a.order-b.order);R()});
  db.collection('taskdone').onSnapshot(s=>{S.done=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  db.collection('staff').onSnapshot(s=>{S.staff=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  try{db.collection('erpdocs').onSnapshot(s=>{S.erp=s.docs.map(d=>d.data());R()})}catch(e){}
  try{db.collection('orders').onSnapshot(s=>{S.orders=s.docs.map(d=>Object.assign({id:d.id},d.data()));R()})}catch(e){}
  setInterval(()=>{S.day=today();paint()},1000)}
init()})();
