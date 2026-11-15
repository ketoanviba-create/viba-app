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
const nameOf=u=>u?((S.staff.get(u)||{}).name||u):'Văn phòng';
const key=(d,u)=>S.day+'_'+d.id+'_'+(u||'vp');
function rec(d,u){if(u)return S.done.get(key(d,u));for(const[k,v]of S.done)if(k.startsWith(S.day+'_'+d.id+'_'))return v;return null}
function status(d,u){const R=rec(d,u),day=S.day,E=S.erp;
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
details.vhd{margin-top:10px;grid-column:1/-1}details.vhd>summary{cursor:pointer;font-weight:700;color:#1b6aa5;padding:12px 4px;list-style:none;text-align:center}`;
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
  if(S.open&&L.length)h+=`<div class="vl">${L.map(x=>`<a class="vt" style="--c:${COL[x.s.s]}" href="viec.html"><div class="x"><b>${esc(x.d.title)}</b><span class="m">${esc(x.s.t)}</span></div><span class="ch" style="background:${COL[x.s.s]}">${x.s.s==='done'?'Xong':x.s.s==='wait'?'Chờ kiểm':x.d.rule==='ship_day'?'Hoàn thành ›':(x.d.mode==='manual'||String(x.d.rule).startsWith('pending'))?'Báo xong ›':LAB[x.s.s]}</span></a>`).join('')}</div>`;
  if(st.role==='kho'){const C=S.erp.filter(x=>x.type==='CKNB'&&x.wh2==='HN'&&x.date===S.day&&x.st!=='cancelled');if(C.length)h+=`<a class="ac" href="erp.html#list" style="margin-top:6px"><span class="i">🚚</span><div class="x"><b>Hàng Hòa Bình chuyển về</b><span>${C.map(x=>esc(x.no||'')).join(' · ')}</span></div><span class="n">${C.length}</span><span style="color:#97a3b1">›</span></a>`}
  const B=[];if(P.includes('Thủ kho Hòa Bình'))B.push(['PMUA','🛒','Mua nguyên liệu'],['DXVT','🧰','Mua vật tư'],['CKNB','🚚','Chuyển về Hà Nội'],['viec','🛻','Điều xe']);
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
function paint(){try{if(!S.ready||!S.me)return;let c=document.getElementById('vh');const v=document.getElementById('view');if(!v)return;
  if(!c){c=document.createElement('div');c.id='vh';v.parentNode.insertBefore(c,v);c.addEventListener('click',e=>{if(e.target.closest('[data-vh="t"]')){S.open=!S.open;last='';paint()}})}
  const show=firstTab();c.hidden=!show;if(show){const h=S.me.owner?htmlOwner():htmlStaff();if(h!==last){c.innerHTML=h;last=h}}slimDash()}catch(e){console.error('vh',e)}}
async function init(){let c=window.claude;for(let i=0;i<100&&!(c&&c.use&&window.vibaErp&&vibaErp.me());i++){await new Promise(r=>setTimeout(r,150));c=window.claude}
  if(!(c&&c.use&&window.vibaErp))return;S.me=vibaErp.me();if(!S.me)return;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const db=await c.use('db');const R=()=>{S.ready=1;last='';paint()};
  db.collection('taskdefs').onSnapshot(s=>{S.defs=s.docs.map(d=>d.data()).sort((a,b)=>a.order-b.order);R()});
  db.collection('taskdone').onSnapshot(s=>{S.done=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  db.collection('staff').onSnapshot(s=>{S.staff=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  try{db.collection('erpdocs').onSnapshot(s=>{S.erp=s.docs.map(d=>d.data());R()})}catch(e){}
  try{db.collection('orders').onSnapshot(s=>{S.orders=s.docs.map(d=>Object.assign({id:d.id},d.data()));R()})}catch(e){}
  setInterval(()=>{S.day=today();paint()},1000)}
init()})();
