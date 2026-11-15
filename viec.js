/* VIBA – Công việc (v1). Danh mục: taskdefs/*. Kết quả: taskdone/<ngày>_<mãviệc>_<uid>.
   Việc "Tự động" tự tính trạng thái từ dữ liệu app/ERP; việc "Báo xong" cần người kiểm bấm Đạt. */
(function(){'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vn=()=>new Date(Date.now()+7*36e5),today=()=>vn().toISOString().slice(0,10),hour=()=>vn().getUTCHours();
const OFFICE=['Giám đốc','Kế toán trưởng','Admin','Kế toán'],HB={NM:1,XC:1,TT:1},LIM={PMUA:1e7,DXVT:1e7,PCHI:1e6};
const REASONS=['Khách hẹn giao lại','Không liên lạc được khách','Khách hủy / trả hàng','Thiếu hàng','Không kịp giờ','Khác'];
const S={tab:'mine',defs:[],done:new Map(),erp:[],orders:[],staff:new Map(),me:null,st:{},db:null,open:null,day:today()};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3000)}
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
  if(d.rule.startsWith('erp:')||d.rule==='erp_in_HN'){const T=d.rule==='erp_in_HN'?['CKNB']:d.rule.slice(4).split(',');
    const L=E.filter(x=>x.date===day&&T.includes(x.type)&&x.st!=='cancelled'&&(d.rule==='erp_in_HN'?x.wh2==='HN':HB[x.wh]));
    if(!L.length)return{s:'none',t:'Không phát sinh'};const p=L.filter(x=>x.st==='draft'||x.st==='submitted').length;return p?{s:'todo',t:p+'/'+L.length+' phiếu chưa duyệt'}:{s:'done',t:L.length+' phiếu đã duyệt'}}
  if(d.rule==='orders_created'){const n=S.orders.filter(o=>o.date===day&&o.status!=='cancel').length;return n?{s:'done',t:n+' đơn lên trong ngày'}:{s:hour()>=22?'late':'todo',t:'Chưa có đơn'}}
  if(d.rule==='sale_shift')return hour()>=17?{s:'done',t:'App đã tự chốt ca 17:00'}:{s:'todo',t:'App tự chốt lúc 17:00'};
  if(d.rule==='ship_day'){const L=S.orders.filter(o=>o.shipId===u&&(o.dlvDate||o.date)===day&&o.status!=='cancel');
    if(R&&R.closed)return{s:'done',t:'Đã bấm hoàn thành'+(R.undel&&R.undel.length?' · '+R.undel.length+' đơn chưa giao có lý do':'')};
    if(!L.length)return{s:'none',t:'Không có đơn'};const n=L.filter(o=>o.status!=='done').length;return n?{s:'todo',t:'Còn '+n+'/'+L.length+' đơn chưa giao'}:{s:'done',t:'Đã giao hết '+L.length+' đơn'}}
  return man()}
const CH={done:['Xong','#1F8A52'],todo:['Chưa xong','#B26A00'],late:['Trễ','#C0392B'],wait:['Chờ kiểm','#1B69A3'],none:['Không phát sinh','#8a96a3']};
function card(d,u,canAct){const s=status(d,u),c=CH[s.s],R=rec(d,u),man=d.mode==='manual'||d.rule.startsWith('pending'),k=key(d,u);
  let a='';if(canAct){if(d.rule==='ship_day'&&s.s==='todo')a=`<button class="ok" data-ship="${k}">Hoàn thành ngày giao hàng</button>`;else if(man&&(!R||R.st==='returned'))a=`<button class="ok" data-rep="${k}">Báo xong</button>`}
  if(mgr()&&man&&R&&R.st==='done')a+=`<button class="ok" data-chk="${k}">Đạt</button><button data-ret="${k}">Trả lại</button>`;
  const undel=R&&R.undel&&R.undel.length&&S.open===k?`<table class="lt">${R.undel.map(x=>`<tr><td>${esc(x.cust)}</td><td>${esc(x.reason)}</td></tr>`).join('')}</table>`:'';
  return `<div class="t" style="border-left:5px solid ${c[1]}"><div class="th" data-o="${k}"><b>${esc(d.title)}</b> <span class="chip" style="background:${c[1]}">${c[0]}</span>
  <div class="mut">${esc(d.freq)} · ${man&&d.mode!=='manual'?'Tạm báo xong tay (tự động sẽ nối sau)':d.mode==='auto'?'Tự động':'Báo xong + kiểm'}${u!==undefined&&u?' · '+esc(nameOf(u)):''}</div>
  <div class="mut">${esc(s.t)}${R&&R.note?' · '+esc(R.note):''}${d.output&&man?' · Nộp: '+esc(d.output):''}</div></div>${undel}<div class="acts">${a}</div></div>`}
function render(){const me=S.me.uid,my=S.me.owner?OFFICE:posOf(me),defs=S.defs.filter(d=>d.active!==false&&applies(d,S.day));
  const tabs=[['mine','Việc của tôi']].concat(mgr()?[['all','Toàn công ty'],['chk','Chờ kiểm ('+[...S.done.values()].filter(r=>r.day===S.day&&r.st==='done').length+')']]:[]);
  let h=`<div class="tb">${tabs.map(([k,t])=>`<button class="${S.tab===k?'on':''}" data-t="${k}">${t}</button>`).join('')}<input type="date" id="dd" value="${S.day}"></div>`;
  if(S.tab==='mine'){const L=defs.filter(d=>my.includes(d.pos));h+=L.length?my.map(p=>{const X=L.filter(d=>d.pos===p);return X.length?`<div class="sec">${esc(p)}</div>`+X.map(d=>card(d,OFFICE.includes(p)?null:me,true)).join(''):''}).join(''):'<p class="mut">Hôm nay chưa có việc cho vị trí của bạn.</p>'}
  else if(S.tab==='all'){const P=[...new Set(S.defs.map(d=>d.pos))];let tot=0,ok=0;const body=P.map(p=>{const X=defs.filter(d=>d.pos===p);if(!X.length)return'';const U=people(p);
      return `<div class="sec">${esc(p)}</div>`+X.map(d=>U.map(u=>{const s=status(d,u).s;if(s!=='none'){tot++;if(s==='done')ok++}return card(d,u,OFFICE.includes(p))}).join('')).join('')}).join('');
    h+=`<div class="kp"><div><b>${ok}/${tot}</b>Việc xong hôm nay</div><div><b>${tot?Math.round(ok/tot*100):0}%</b>Tỷ lệ hoàn thành</div></div>`+body}
  else{const L=[...S.done.entries()].filter(([k,r])=>r.day===S.day&&r.st==='done');h+=L.length?L.map(([k,r])=>{const d=S.defs.find(x=>x.id===r.def);return d?card(d,r.uid==='vp'?null:r.uid,false):''}).join(''):'<p class="mut">Không có việc chờ kiểm.</p>'}
  $('#view').innerHTML=h;
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;render()});$('#dd').onchange=e=>{S.day=e.target.value||today();render()};
  document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{S.open=S.open===b.dataset.o?null:b.dataset.o;render()});
  document.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>report(b.dataset.rep));document.querySelectorAll('[data-chk]').forEach(b=>b.onclick=()=>check(b.dataset.chk,true));
  document.querySelectorAll('[data-ret]').forEach(b=>b.onclick=()=>check(b.dataset.ret,false));document.querySelectorAll('[data-ship]').forEach(b=>b.onclick=()=>shipClose(b.dataset.ship))}
const parse=k=>{const[day,def,uid]=k.split('_');return{day,def,uid}};
async function put(k,data){const p=parse(k);await S.db.doc('taskdone/'+k).set(Object.assign({day:p.day,def:p.def,uid:p.uid},data,{at:Date.now(),by:S.me.uid}));S.done.set(k,Object.assign({day:p.day,def:p.def,uid:p.uid},data));render()}
async function report(k){const n=prompt('Kết quả (ghi chú, link file, số chứng từ…):');if(n===null)return;if(!n.trim())return toast('Cần ghi kết quả');await put(k,{st:'done',note:n.trim()});toast('✓ Đã báo xong – chờ kiểm')}
async function check(k,ok){const r=S.done.get(k)||{};let why='';if(!ok){why=prompt('Lý do trả lại:');if(!why)return}await put(k,Object.assign({},r,{st:ok?'checked':'returned',why,checkBy:S.me.uid}));toast(ok?'✓ Đạt':'Đã trả lại')}
function shipClose(k){const p=parse(k),L=S.orders.filter(o=>o.shipId===p.uid&&(o.dlvDate||o.date)===p.day&&o.status!=='cancel'&&o.status!=='done');
  $('#view').innerHTML=`<div class="card"><h3>Hoàn thành ngày giao ${p.day.split('-').reverse().join('/')}</h3><p class="mut">${L.length} đơn chưa giao. Chọn lý do cho từng đơn:</p>
  ${L.map((o,i)=>`<div class="t"><b>${esc(o.custName||o.cust||o.code||o.id)}</b><select data-i="${i}">${REASONS.map(r=>`<option>${r}</option>`).join('')}</select><input data-n="${i}" placeholder="Ghi thêm (nếu có)"></div>`).join('')}
  <div class="acts"><button class="ok" id="go">Xác nhận hoàn thành</button><button id="cx">Quay lại</button></div></div>`;
  $('#cx').onclick=render;$('#go').onclick=async()=>{const undel=L.map((o,i)=>({id:o.id||'',cust:o.custName||o.cust||o.code||'',reason:$(`[data-i="${i}"]`).value+($(`[data-n="${i}"]`).value?': '+$(`[data-n="${i}"]`).value:'')}));
    await put(k,{st:'checked',closed:true,undel});toast('✓ Đã hoàn thành ngày giao hàng')}}
async function init(){let c=window.claude;for(let i=0;i<60&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use))return $('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ.</div>';
  const db=S.db=await c.use('db');S.me=window.vibaErp&&vibaErp.me();if(!S.me)return $('#view').innerHTML='<div class="alert r">Chưa đăng nhập.</div>';
  const R=()=>{try{render()}catch(e){console.error(e)}};
  db.collection('taskdefs').onSnapshot(s=>{S.defs=s.docs.map(d=>d.data()).sort((a,b)=>a.order-b.order);R()});
  db.collection('taskdone').onSnapshot(s=>{S.done=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  db.collection('staff').onSnapshot(s=>{S.staff=new Map(s.docs.map(d=>[d.id,d.data()]));R()});
  db.collection('erpdocs').onSnapshot(s=>{S.erp=s.docs.map(d=>d.data());R()});
  try{db.collection('orders').onSnapshot(s=>{S.orders=s.docs.map(d=>Object.assign({id:d.id},d.data()));R()})}catch(e){}}
init()})();
