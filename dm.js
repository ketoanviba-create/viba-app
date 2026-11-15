/* VIBA ERP – G2 Danh mục gốc: ánh xạ mã sản phẩm App ↔ MISA ↔ Winmart/Aeon/Co.op.
   Đọc: products/* (danh mục app) + pcodes/<id> (mã đối tác, collection riêng – trình sửa sản phẩm cũ không ghi đè).
   Ghi: chỉ qua vibaErp.call('productCodes'|'productCodesMany') → máy chủ kiểm quyền, chặn trùng, ghi nhật ký. */
(function(){'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=[['misa','Mã MISA'],['winmart','Mã Winmart'],['aeon','Mã Aeon'],['coop','Mã Co.op']];
const S={P:new Map(),C:new Map(),q:'',f:'all',dirty:new Map()};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2800)}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim();
function rows(){const nameCnt=new Map();const out=[];
  for(const[id,p]of S.P){if(p.active===false)continue;const k=norm(p.name);nameCnt.set(k,(nameCnt.get(k)||0)+1)}
  for(const[id,p]of S.P){if(p.active===false)continue;const c=Object.assign({},S.C.get(id)||{},S.dirty.get(id)||{});
    const hasM=!!c.misa,nP=['winmart','aeon','coop'].filter(k=>c[k]).length;
    out.push({id,p,c,st:hasM?(nP?'ok':'part'):'miss',dupName:nameCnt.get(norm(p.name))>1})}
  return out.sort((a,b)=>String(a.p.code).localeCompare(String(b.p.code),'vi',{numeric:true}))}
function render(){const all=rows(),q=norm(S.q);
  const L=all.filter(r=>(S.f==='all'||(S.f==='miss'&&r.st==='miss')||(S.f==='part'&&r.st==='part')||(S.f==='dup'&&r.dupName))&&(!q||norm(r.p.code+' '+r.p.name+' '+Object.values(r.c).join(' ')).includes(q)));
  const n=k=>all.filter(r=>r.st===k).length;
  $('#view').innerHTML=`<div class="kpi"><div><b>${all.length}</b><small>Mặt hàng đang dùng</small></div><div><b style="color:#1f8a52">${n('ok')}</b><small>Đủ mã MISA + đối tác</small></div>
   <div><b style="color:#b26a00">${n('part')}</b><small>Có MISA, thiếu mã đối tác</small></div><div><b style="color:#c0392b">${n('miss')}</b><small>Chưa có mã MISA</small></div></div>
  <div class="bar"><input id="q" placeholder="Tìm mã / tên / mã đối tác…" value="${esc(S.q)}">
   ${[['all','Tất cả'],['miss','Thiếu MISA'],['part','Thiếu đối tác'],['dup','Trùng tên']].map(([k,t])=>`<button class="pill ${S.f===k?'on':''}" data-f="${k}">${t}</button>`).join('')}
   <button class="btn2 g" id="xOut">⬇ Xuất Excel</button><label class="btn2 g" style="cursor:pointer">⬆ Nhập Excel<input type="file" id="xIn" accept=".xlsx,.xls" hidden></label>
   <button class="btn2" id="sv" ${S.dirty.size?'':'disabled'}>Lưu ${S.dirty.size||''} thay đổi</button></div>
  <div class="wrapx"><table class="dm"><thead><tr><th>Mã app</th><th>Tên hàng</th><th>ĐVT</th>${F.map(f=>`<th>${f[1]}</th>`).join('')}<th>Trạng thái</th></tr></thead><tbody>
  ${L.map(r=>`<tr><td><b>${esc(r.p.code)}</b></td><td class="${r.dupName?'dup':''}">${esc(r.p.name)}${r.dupName?' ⚠':''}</td><td>${esc(r.p.unit)}</td>
   ${F.map(([k])=>`<td><input data-id="${esc(r.id)}" data-k="${k}" value="${esc(r.c[k]||'')}"></td>`).join('')}
   <td><span class="st ${r.st}">${r.st==='ok'?'Đủ':r.st==='part'?'Thiếu đối tác':'Thiếu MISA'}</span></td></tr>`).join('')||'<tr><td colspan="8">Không có dòng phù hợp.</td></tr>'}
  </tbody></table></div><p style="color:var(--muted);font-size:12px">Chỉ Quản lý/Giám đốc sửa được. Mỗi lần lưu được ghi nhật ký (ai, lúc nào, giá trị cũ → mới). Máy chủ chặn một mã MISA/đối tác gán cho 2 mặt hàng.</p>`;
  $('#q').oninput=e=>{S.q=e.target.value;const p=e.target.selectionStart;render();const i=$('#q');i.focus();i.setSelectionRange(p,p)};
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.f=b.dataset.f;render()});
  document.querySelectorAll('input[data-k]').forEach(i=>i.onchange=()=>{const id=i.dataset.id,d=S.dirty.get(id)||{};d[i.dataset.k]=i.value.trim();S.dirty.set(id,d);$('#sv').disabled=false;$('#sv').textContent='Lưu '+S.dirty.size+' thay đổi'});
  $('#sv').onclick=save;$('#xOut').onclick=xOut;$('#xIn').onchange=xIn}
async function save(){const items=[...S.dirty].map(([id,codes])=>({id,codes}));$('#sv').disabled=true;
  try{const r=await vibaErp.call('productCodesMany',{items,partial:true});for(const it of items){if(!(r.errors||[]).some(e=>e.id===it.id)){S.C.set(it.id,Object.assign({},S.C.get(it.id)||{},it.codes));S.dirty.delete(it.id)}}
    toast((r.errors&&r.errors.length)?`Lưu ${r.saved} dòng · ${r.errors.length} lỗi: ${r.errors[0].msg}`:`✓ Đã lưu ${r.saved} dòng`)}catch(e){toast('Chưa lưu được: '+(e.message||'lỗi mạng'))}render()}
function xOut(){if(!window.XLSX)return toast('Chưa tải được thư viện Excel');const a=[['Mã app','Tên hàng','ĐVT',...F.map(f=>f[1]),'id']];
  rows().forEach(r=>a.push([r.p.code,r.p.name,r.p.unit,...F.map(([k])=>r.c[k]||''),r.id]));const ws=XLSX.utils.aoa_to_sheet(a);ws['!cols']=[{wch:10},{wch:36},{wch:7},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Ma san pham');XLSX.writeFile(wb,'Danh_muc_ma_san_pham_VIBA.xlsx')}
async function xIn(e){const f=e.target.files[0];if(!f)return;const wb=XLSX.read(await f.arrayBuffer());const a=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
  const h=a[0].map(String),ix=n=>h.indexOf(n),byCode=new Map([...S.P].map(([id,p])=>[String(p.code).trim().toUpperCase(),id]));let n=0,miss=0;
  for(const row of a.slice(1)){const id=String(row[ix('id')]||'')||byCode.get(String(row[ix('Mã app')]).trim().toUpperCase());if(!id||!S.P.has(id)){if(row[ix('Mã app')])miss++;continue}
    const cur=S.C.get(id)||{},d={};F.forEach(([k,t])=>{const v=String(row[ix(t)]??'').trim();if(ix(t)>=0&&v!==(cur[k]||''))d[k]=v});if(Object.keys(d).length){S.dirty.set(id,Object.assign(S.dirty.get(id)||{},d));n++}}
  toast(`Đọc file: ${n} dòng thay đổi${miss?` · ${miss} mã app không có trong danh mục`:''} – kiểm tra rồi bấm Lưu`);e.target.value='';render()}
async function init(){let c=window.claude;for(let i=0;i<60&&!(c&&c.use);i++){await new Promise(r=>setTimeout(r,100));c=window.claude}
  if(!(c&&c.use))return $('#view').innerHTML='<div class="alert r">Không kết nối được máy chủ dữ liệu.</div>';
  const db=await c.use('db');const me=window.vibaErp&&vibaErp.me();if(!me||!me.owner)return $('#view').innerHTML='<div class="alert r">Trang này chỉ dành cho Quản lý / Giám đốc.</div>';
  db.collection('products').onSnapshot(s=>{S.P=new Map(s.docs.map(d=>[d.id,d.data()]));render()});
  db.collection('pcodes').onSnapshot(s=>{S.C=new Map(s.docs.map(d=>[d.id,d.data()]));render()})}
init()})();
