window.__UIF=window.__UIF||[];
/* VIBA – lớp giao diện v34: icon màu cho các mục */
(()=>{
const S=(p,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.9}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I={
 wallet:S('<path d="M4 7a2 2 0 0 1 2-2h11v4"/><path d="M4 7v11a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2z"/><circle cx="16" cy="14" r="1.3"/>'),
 box:S('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'),
 truck:S('<path d="M2 6h11v10H2z"/><path d="M13 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
 cash:S('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>'),
 swap:S('<path d="M4 9h13l-3-3"/><path d="M20 15H7l3 3"/>'),
 trend:S('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
 debt:S('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
 clip:S('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 11h6M9 15h4"/>'),
 cal:S('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
 cam:S('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
 users:S('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>'),
 user:S('<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
 gear:S('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
 pin:S('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
 lock:S('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
 key:S('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>'),
 tag:S('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.3"/>'),
 gift:S('<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10 4 6.5 5 7.5 7.5c.6 1 4.5 1 4.5 1zM12 8.5c2-4.5 5.5-3.5 4.5-1-.6 1-4.5 1-4.5 1z"/>'),
 route:S('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>'),
 photo:S('<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.7"/><path d="M21 16l-5-5-9 8.5"/>'),
 alert:S('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
 doc:S('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'),
 star:S('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>'),
 pay:S('<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
 printer:S('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
 money:S('<circle cx="12" cy="12" r="9"/><path d="M15 9.2c-.6-1-1.7-1.4-3-1.4-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.4 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.5-3.2-1.6M12 6v1.8M12 16.7v1.8"/>'),
};
const COL={g:['#1e9a5c','#e3f5ec'],b:['#1b6aa5','#e4f0fa'],o:['#c27a00','#fdf1dc'],r:['#d64545','#fce8e8'],p:['#7a4fc4','#efe8fb'],t:['#0f8c8c','#dff4f3'],y:['#a08200','#fbf5d6']};
const RULES=[
 [/thu nhập|lương|hoa hồng/i,'wallet','g'],
 [/số lượng (giao|sản phẩm)|tổng xuất|hàng hóa|sản phẩm/i,'box','p'],
 [/đơn giao|người giao|giao hàng|ship/i,'truck','b'],
 [/tiền mặt/i,'cash','g'],
 [/đổi trả|đổi/i,'swap','o'],
 [/doanh số|đối chiếu bán/i,'trend','b'],
 [/nợ/i,'debt','r'],
 [/số đơn|đơn hàng|đơn của tôi|đơn chưa|đơn chờ/i,'clip','t'],
 [/chấm công/i,'cal','b'],
 [/ảnh/i,'photo','p'],
 [/nhân viên|phân quyền/i,'users','t'],
 [/mật khẩu/i,'key','y'],
 [/khóa sổ/i,'lock','r'],
 [/bảng giá|giá/i,'tag','o'],
 [/tuyến/i,'route','b'],
 [/thanh toán/i,'pay','g'],
 [/in phiếu/i,'printer','b'],
 [/phân loại khách|khách/i,'user','t'],
 [/hóa đơn/i,'doc','b'],
 [/kết quả/i,'star','y'],
];
const pick=t=>{for(const [re,ic,c] of RULES)if(re.test(t))return [ic,c];return ['star','b']};
const css=`
.dk-b{flex:0 0 auto;width:44px;height:44px;border-radius:14px;display:grid;place-items:center}
.dk-b svg{width:24px;height:24px}
.dk-s{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:8px;vertical-align:-7px;margin-right:8px}
.dk-s svg{width:15px;height:15px}
.sec.dk{display:flex;align-items:center;text-transform:none;letter-spacing:0;font-size:15px;font-weight:700;color:var(--fg)}
#tabs button.on{position:relative}
#tabs button.on svg{background:#e4f0fa;border-radius:12px;padding:3px 12px;box-sizing:content-box}
.alert.dk{position:relative;padding-left:40px!important}
.alert.dk .dk-a{position:absolute;left:12px;top:9px;width:20px;height:20px}
.dk-h{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:12px;margin-right:10px;vertical-align:-4px}
.dk-h svg{width:22px;height:22px}
.dk-row{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center}
.dk-row svg{width:18px;height:18px}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const badge=(cls,ic,c)=>{const [f,bg]=COL[c];return `<span class="${cls}" style="color:${f};background:${bg}">${I[ic]}</span>`};
const HEAD={'Báo cáo':['trend','b'],'Chấm công':['cal','b'],'Lên đơn':['clip','t'],'Đơn của tôi':['clip','t'],'Tổng quan':['trend','b'],'Cài đặt':['gear','p'],'Cần giao':['truck','b'],'Đã giao':['truck','g']};
function deco(){
 document.querySelectorAll('[data-acc]:not(.dk)').forEach(a=>{a.classList.add('dk');const l=a.querySelector('.muted');const [ic,c]=pick(l?l.textContent:'');a.insertAdjacentHTML('afterbegin',badge('dk-b',ic,c))});
 document.querySelectorAll('.sec:not(.dk)').forEach(s=>{s.classList.add('dk');const [ic,c]=pick(s.textContent);s.insertAdjacentHTML('afterbegin',badge('dk-s',ic,c))});
 document.querySelectorAll('h1.big:not(.dk)').forEach(h=>{h.classList.add('dk');const k=Object.keys(HEAD).find(k=>h.textContent.trim().startsWith(k));if(k){const [ic,c]=HEAD[k];h.insertAdjacentHTML('afterbegin',badge('dk-h',ic,c))}});
 document.querySelectorAll('#view .alert:not(.dk)').forEach(a=>{a.classList.add('dk');a.insertAdjacentHTML('afterbegin',`<span class="dk-a">${I.alert}</span>`)});
 document.querySelectorAll('#view .group:not(.pick)>.row:not(.dk)').forEach(r=>{r.classList.add('dk');if(r.querySelector('input,select'))return;const t=r.textContent;let ic,c;if(r.id==='oCust')[ic,c]=['user','t'];else if(/DH-|đơn/i.test(t))[ic,c]=['clip','t'];else{const k=pick(t);if(k[0]==='star')return;[ic,c]=k}r.insertAdjacentHTML('afterbegin',badge('dk-row',ic,c))});
}
window.__UIF.push(deco);
})();

/* Bố cục: đầu trang gọn, lưới báo cáo, thanh gửi đơn, bảng → thẻ */
(()=>{
const css=`
/* 1. Đầu trang gọn 1 dòng */
.brandbar{padding-top:8px!important;gap:10px}
.brandbar img{height:38px!important}
.brandbar .tag{margin-left:0!important;white-space:nowrap;font-size:16px!important;letter-spacing:0!important;text-transform:none!important;color:var(--fg)!important;font-weight:800!important}
.ux-av{margin-left:auto;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 10px 4px 4px;font-size:13px;font-weight:700;color:var(--fg)}
.ux-av b{width:30px;height:30px;border-radius:50%;background:#1b6aa5;color:#fff;display:grid;place-items:center;font-size:13px}
.ux-av i{font-style:normal;color:var(--muted);font-size:11px;font-weight:600;display:block;line-height:1.1}
header.top .who{display:none!important}
header.top{padding-block:4px 0!important}
.ux-menu{position:fixed;right:12px;top:calc(56px + env(safe-area-inset-top,0px));background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.15);z-index:50;min-width:200px;overflow:hidden}
.ux-mi{display:flex;width:100%;gap:10px;align-items:center;padding:14px 16px;font:inherit;font-weight:600;border:0;border-bottom:1px solid var(--line);background:none;color:var(--fg);text-align:left;cursor:pointer}
.ux-menu .ux-mi:last-child{border-bottom:0}
button.ux-av{font:inherit;cursor:pointer}
/* 2. Tiêu đề nhỏ gọn */
h1.big{font-size:24px!important;margin:6px 0 10px!important;display:flex;align-items:center}
.dk-h{width:34px!important;height:34px!important}
/* 3. Chọn kỳ vừa màn hình */
.seg button{padding:8px 4px!important}
/* 4. Báo cáo: lưới 2 cột */
.ux-grid{display:grid!important;grid-template-columns:1fr 1fr;gap:10px!important}
.ux-grid>*{grid-column:1/-1}
.ux-grid>.ux-tile{grid-column:auto}
.ux-tile [data-acc]{flex-direction:column;align-items:flex-start!important;gap:8px!important;padding:12px!important;position:relative}
.ux-tile [data-acc]>div:last-child{position:absolute;right:10px;top:12px;font-size:18px!important}
.ux-tile [data-acc] .dk-b{width:36px;height:36px;border-radius:11px}
.ux-tile [data-acc] .dk-b svg{width:20px;height:20px}
.ux-tile [data-acc] div[style*="font-size:24px"]{font-size:19px!important}
.ux-tile .muted{font-size:12px!important}
/* 5. Tab bar: số đếm thành chấm đỏ */
.ux-bdg{position:absolute;top:4px;left:calc(50% + 6px);background:#d64545;color:#fff;font-size:11px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:grid;place-items:center;padding:0 5px}
#tabs button{position:relative;font-size:12px!important}
/* 6. Thanh tóm tắt cần giao */
.ux-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 6px}
.ux-sum>div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
.ux-sum b{display:block;font-size:20px}
.ux-sum span{font-size:12px;color:var(--muted);font-weight:600}
/* 7. Lên đơn: thanh gửi đơn cố định */
.ux-bar{position:fixed;left:0;right:0;bottom:calc(var(--tabh) + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line);box-shadow:0 -6px 18px rgba(0,0,0,.06);display:flex;align-items:center;gap:12px;padding:10px 16px;z-index:29}
.ux-bar .t{flex:1;min-width:0}
.ux-bar .t b{display:block;font-size:20px;color:#1b6aa5}
.ux-bar .t span{font-size:12px;color:var(--muted)}
.ux-bar button{background:#1b6aa5;color:#fff;border:0;border-radius:12px;font:inherit;font-weight:800;font-size:16px;padding:13px 18px}
body.ux-hasbar #view{padding-bottom:80px}
body:has(#view input:focus,#view textarea:focus) .ux-bar{display:none}
#oVoice,#vVoice{background:linear-gradient(180deg,#2d8ad0,#1b6aa5)!important;color:#fff!important;font-weight:800!important;min-height:58px}
/* 8. Bảng rộng thành thẻ */
.ux-cards{display:flex;flex-direction:column;gap:8px}
.ux-cards .c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
.ux-cards .c .h{font-weight:800;margin-bottom:6px}
.ux-cards .c .kv{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:13px}
.ux-cards .c .kv span{color:var(--muted)}
.ux-cards .c .kv b{text-align:right}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function uxMenu(av){let m=document.querySelector('.ux-menu');if(m){m.remove();return}
  document.body.insertAdjacentHTML('beforeend',`<div class="ux-menu"><div class="ux-mi" style="font-weight:700">${esc(av.dataset.full||'')}</div>${window.vibaChangePw?'<button type="button" class="ux-mi" data-m="pw">🔑 Đổi mật khẩu</button>':''}<button type="button" class="ux-mi" data-m="out" style="color:#d64545">↪ Đăng xuất</button></div>`);
  m=document.querySelector('.ux-menu');m.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;m.remove();if(b.dataset.m==='pw')window.vibaChangePw();else window.vibaLogout()};
  setTimeout(()=>document.addEventListener('click',function f(e){if(!e.target.closest('.ux-menu')){const x=document.querySelector('.ux-menu');if(x)x.remove();document.removeEventListener('click',f)}}),0)}
const vnd=n=>Math.round(n).toLocaleString('vi-VN')+'đ';
function ux(){
 // header
 const bb=document.querySelector('.brandbar');const who=document.querySelector('#who');const rc=who&&who.querySelector('.chip.g');
 const av0=bb&&bb.querySelector('.ux-av');if(!rc&&av0)av0.remove();
 if(bb&&rc){const name=((rc.nextElementSibling||{}).textContent||'').trim();const role=rc.textContent.trim();let av=av0;
   if(!av){bb.insertAdjacentHTML('beforeend','<button type="button" class="ux-av" aria-label="Tài khoản"></button>');av=bb.querySelector('.ux-av');av.onclick=e=>{e.stopPropagation();uxMenu(av)}}
   const w=name.split(/\s+/);const ini=(w[w.length-1]||'?').slice(0,1).toUpperCase();const short=w.slice(-2).join(' ');
   const h=`<b>${esc(ini)}</b><div>${esc(short)}<i>${esc(role)}</i></div><span style="color:var(--muted)">▾</span>`;if(av.innerHTML!==h)av.innerHTML=h;av.dataset.full=name+' · '+role}
 // seg labels
 document.querySelectorAll('.seg button').forEach(b=>{const m={'Tuần này':'Tuần','Tháng này':'Tháng'};if(m[b.textContent.trim()])b.textContent=m[b.textContent.trim()]});
 // report grid
 const accs=[...document.querySelectorAll('[data-acc]')];if(accs.length>2){const cards=accs.map(a=>a.parentElement);const par=cards[0].parentElement;
   if(cards.every(c=>c.parentElement===par)&&!par.classList.contains('ux-grid')){par.classList.add('ux-grid');
     cards.forEach((c,i)=>{const open=c.children.length>1;if(i>0&&!open)c.classList.add('ux-tile')});
     // tile lẻ cuối: cho tràn 2 cột
     const tiles=cards.filter(c=>c.classList.contains('ux-tile'));if(tiles.length%2)tiles[tiles.length-1].classList.remove('ux-tile');}}
 // tab badge
 document.querySelectorAll('#tabs button span').forEach(s=>{const m=s.textContent.match(/^(.*) \((\d+)\)$/);if(m){s.textContent=m[1];if(+m[2])s.parentElement.insertAdjacentHTML('beforeend',`<em class="ux-bdg">${m[2]}</em>`)}});
 // cần giao summary
 const h=document.querySelector('h1.big');
 if(h&&/Cần giao/.test(h.textContent)&&!document.querySelector('.ux-sum')){const secs=[...document.querySelectorAll('#view .sec')].map(x=>x.textContent);const n=re=>{const t=secs.find(x=>re.test(x));const m=t&&t.match(/\((\d+)\)/);return m?+m[1]:0};
   let tot=0;document.querySelectorAll('#view .oc .money').forEach(m=>{tot+=+(m.textContent.replace(/[^\d]/g,''))||0});
   h.insertAdjacentHTML('afterend',`<div class="ux-sum"><div><span>Đơn của tôi</span><b>${n(/Đơn của tôi/)} đơn</b></div><div><span>Chờ người nhận</span><b style="color:#c27a00">${n(/chờ người giao/i)} đơn</b></div><div style="grid-column:1/-1"><span>Tổng tiền các đơn trên</span><b style="color:#1e9a5c">${vnd(tot)}</b></div></div>`)}
 // lên đơn sticky
 const vs=document.querySelector('#vSave');
 if(vs){const hh=document.querySelector('#view h1.big');const isN=!!document.querySelector('[data-vt="N"].on');const dt=new Date();const lab=hh&&/^Sửa phiếu/.test(hh.textContent.trim())?hh.textContent.trim():(isN?'Phiếu nhập':'Phiếu xuất')+' · hôm nay '+String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0');
   let bar=document.querySelector('.ux-bar');if(!bar){document.body.insertAdjacentHTML('beforeend','<div class="ux-bar"><div class="t"></div><button type="button"></button></div>');bar=document.querySelector('.ux-bar');document.body.classList.add('ux-hasbar')}
   bar.querySelector('button').onclick=()=>{const b=document.querySelector('#vSave');if(b&&!b.disabled)b.click()};
   const t=`<b style="font-size:16px;color:var(--fg)">${esc(lab)}</b>`;const T=bar.querySelector('.t');if(T.innerHTML!==t)T.innerHTML=t;const B=bar.querySelector('button');if(B.textContent!=='Lưu phiếu')B.textContent='Lưu phiếu';B.disabled=vs.disabled}
 const sv=document.querySelector('#oSave');const tb=document.querySelector('.totalbar');
 if(!(sv&&tb)&&!vs){const ob=document.querySelector('.ux-bar');if(ob){ob.remove();document.body.classList.remove('ux-hasbar')}}
 if(sv&&tb){let bar=document.querySelector('.ux-bar');if(!bar){document.body.insertAdjacentHTML('beforeend','<div class="ux-bar"><div class="t"></div><button type="button"></button></div>');bar=document.querySelector('.ux-bar');document.body.classList.add('ux-hasbar')}bar.querySelector('button').onclick=()=>{const b=document.querySelector('#oSave');if(b&&!b.disabled)b.click()};
   const sp=tb.querySelectorAll('span');const t=`<b>${esc(sp[1]?sp[1].textContent:'')}</b><span>${esc(sp[0]?sp[0].textContent:'')}</span>`;const T=bar.querySelector('.t');if(T.innerHTML!==t)T.innerHTML=t;const B=bar.querySelector('button');if(B.textContent!==sv.textContent)B.textContent=sv.textContent;B.disabled=sv.disabled}
 // bảng rộng → thẻ
 /* v69: đo hết các bảng trước rồi mới sửa (tránh trình duyệt tính lại bố cục cho từng bảng) */const TB=[...document.querySelectorAll('#view table:not(.ux-done)')].map(t=>{t.classList.add('ux-done');const hs=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());if(hs.length<4||/data-|onclick/.test(t.innerHTML))return null;const box=t.closest('.tbl,.card,div');return t.scrollWidth>(box?box.clientWidth:390)+4?[t,hs]:null}).filter(Boolean);
 TB.forEach(([t,hs])=>{
   const rows=[...t.querySelectorAll('tbody tr,tfoot tr')].map(r=>[...r.children].map((td,i)=>esc((i?td.textContent:td.innerText).trim())));
   const html=`<div class="ux-cards">${rows.map(r=>`<div class="c"><div class="h">${r[0].replace(/\n/g,' · ')}</div><div class="kv">${r.slice(1).map((v,i)=>`<span>${hs[i+1]||''}</span><b>${v}</b>`).join('')}</div></div>`).join('')}</div>`;
   const wrap=t.parentElement;wrap.style.display='none';wrap.insertAdjacentHTML('afterend',html)});
}
window.__UIF.push(ux);
})();

/* Giao diện tối giản */
(()=>{
const css=`
.brandbar .tag{display:none!important}
.ux-av i{display:none!important}
.ux-av{padding:3px 10px 3px 3px!important}
.ux-sum{grid-template-columns:1fr 1fr 1fr!important;gap:8px!important;margin-top:6px!important}
.ux-sum>div{grid-column:auto!important;padding:8px 10px!important}
.ux-sum b{font-size:17px!important}
.ux-tile [data-acc] .dk-b{display:none}
.ux-tile [data-acc]{padding:12px 12px 14px!important;gap:4px!important}
.mn-hide{display:none!important}
.sec.dk{margin:14px 2px 6px!important;font-size:14px!important}
.dk-s{width:20px!important;height:20px!important}
#view .card{padding:12px 14px}
.ux-bar .t span{display:none}
.seg .ux-d{font-weight:800;color:var(--accent)}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const hide=e=>e&&e.classList.add('mn-hide');
const HIDE=/^(Xanh = có ảnh chấm công|Bắt buộc bật vị trí|Chọn khách hàng trước|Danh sách số điện thoại được phép|Bấm một dòng để sửa|App tự xếp đơn vào tuyến|Khách xếp theo đơn nợ cũ nhất|Giao theo đơn = |Phiếu xuất lấy SL|Bấm vào mặt hàng để xem thẻ kho|Hiển thị đơn 3 tháng gần nhất|Dùng khi nhân viên quên mật khẩu|Tích thêm tuyến|Mỗi ngày sale chụp 1 ảnh|Nhóm chuỗi \(app tự nhận)/;
const TABN=/^(Lập phiếu kho|Phiếu kho|Lên đơn|Đơn của tôi|Chấm công|Báo cáo|Cần giao|Đã giao|Tổng quan|Đơn hàng|Kho|Danh mục|Cài đặt|Lập phiếu|Phiếu|Tồn kho|Theo đơn)$/;
function mn(){
 const V=document.querySelector('#view');if(!V)return;
 // nhãn ngắn
 V.querySelectorAll('[data-acc] .muted').forEach(m=>{if(m.classList.contains('tiny'))return;let t=m.textContent;const n=t.replace(/^Tổng thu nhập tháng /,'Thu nhập ').replace(/^Tổng số lượng sản phẩm/,'Số lượng SP').replace(/^Tổng /,'').replace(/^số /,'Số ').replace(/^(\S)/,c=>c.toUpperCase());if(n!==t)m.textContent=n});
 document.querySelectorAll('.ux-sum span').forEach(x=>{const m={'Đơn của tôi':'Của tôi','Chờ người nhận':'Chờ nhận','Tổng tiền các đơn trên':'Tổng tiền'};if(m[x.textContent])x.textContent=m[x.textContent]});
 V.querySelectorAll('label.f').forEach(l=>{if(/^Địa chỉ giao hàng/.test(l.textContent.trim())){for(const n of [...l.childNodes])if(n.nodeType===3||n.tagName==='SPAN')n.textContent=''}});
 // câu giải thích không cần thiết
 V.querySelectorAll('.tiny,.muted').forEach(e=>{if(HIDE.test(e.textContent.trim()))hide(e)});
 // tiêu đề to: trùng tên tab
 V.querySelectorAll('h1.big').forEach(h=>{if(TABN.test(h.textContent.trim()))hide(h)});
 // phụ đề thẻ báo cáo
 V.querySelectorAll('[data-acc] .tiny.muted').forEach(hide);
 // dòng khoảng ngày dưới thanh kỳ
 V.querySelectorAll('div,span').forEach(e=>{if(e.children.length===0&&/^\d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}$/.test(e.textContent.trim()))hide(e)});
 // Cần giao: ẩn mục trống "Đơn của tôi (0)", chip Chờ giao
 if(V.querySelector('.ux-sum'))V.querySelectorAll('.sec').forEach(s=>{if(/^Đơn của tôi \(0\)$/.test(s.textContent.trim())){hide(s);const n=s.nextElementSibling;if(n&&/^Bạn chưa nhận đơn nào/.test(n.textContent.trim()))hide(n)}});
 V.querySelectorAll('.chip').forEach(c=>{if(/^Chờ giao$/.test(c.textContent.trim()))hide(c)});
 // Lên đơn
 const oc=V.querySelector('#oCust');if(oc){const s=oc.querySelector('.s');if(s&&(/Bấm để tìm/.test(s.textContent)||V.querySelector('#oAddr')))hide(s)}
 V.querySelectorAll('.card').forEach(c=>{const f=c.firstElementChild;if(f&&/Ngày giao hàng/.test(f.textContent)&&f.children.length===0){hide(f)}
   if(c.querySelector('.totalbar')&&document.querySelector('.ux-bar'))hide(c)});
 V.querySelectorAll('.card .tiny,.card div').forEach(e=>{const m=e.children.length<=1&&e.parentElement&&e.parentElement.querySelector('[data-dd]')&&e.textContent.trim().match(/^Giao (Thứ|Chủ)[^,]*, (\d{2}\/\d{2})/);if(m){hide(e);const on=e.parentElement&&e.parentElement.querySelector('.seg button.on, .seg button[aria-pressed="true"]');const sg=e.parentElement&&e.parentElement.querySelector('.seg');
   if(sg){const b=on||sg.querySelector('[data-dd="x"]');if(b&&!b.querySelector('.ux-d'))b.insertAdjacentHTML('beforeend',` <span class="ux-d">${m[2]}</span>`);sg.querySelectorAll('.ux-d').forEach(x=>{if(x.parentElement!==b)x.remove()})}}});
 const sv=V.querySelector('#oSave');if(sv&&document.querySelector('.ux-bar'))hide(sv);
 const vsv=V.querySelector('#vSave');if(vsv&&document.querySelector('.ux-bar'))hide(vsv);
 const rs=V.querySelector('#oReset');if(rs){rs.classList.add('sm');rs.style.cssText='background:none;color:var(--muted);min-height:0;font-weight:600'}
 const pd=V.querySelector('#oPaid');if(pd){const g=pd.closest('.toggle');if(g){const t=g.querySelector('.tiny');hide(t)}}
 V.querySelectorAll('.sec').forEach(s=>{if(/^(Thanh toán|Sản phẩm)$/.test(s.textContent.trim()))hide(s)});
 V.querySelectorAll('label.f').forEach(l=>{if(/^Ghi chú cho đơn/.test(l.textContent.trim())&&l.firstChild&&l.firstChild.nodeType===3)l.firstChild.textContent=''});
 // Chấm công
 V.querySelectorAll('.sec').forEach(s=>{if(/Chấm công hôm nay/.test(s.textContent))hide(s)});
 // Báo cáo admin: bỏ ghi chú cuối bảng, nút xuất excel gom lại
 V.querySelectorAll('button.btn.block').forEach(b=>{if(/^Xuất /.test(b.textContent.trim())){b.style.minHeight='40px';b.style.fontSize='14px'}});
 // alert gọn
 V.querySelectorAll('.alert').forEach(a=>{a.style.padding='8px 12px';a.style.fontSize='14px'});
}
window.__UIF.push(mn);
})();

/* chạy sau mỗi lần app vẽ lại màn hình (trước khi trình duyệt hiển thị) */
(()=>{let busy=false;const run=()=>{if(busy)return;busy=true;try{for(const f of window.__UIF)try{f()}catch(e){console.warn('ui',e)}}finally{busy=false}};
const obs=new MutationObserver(()=>{obs.disconnect();try{run()}finally{obs.observe(document.body,{childList:true,subtree:true})}});
obs.observe(document.body,{childList:true,subtree:true});run()})();
