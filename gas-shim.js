/* Lớp kết nối Google Apps Script: giữ nguyên giao diện window.claude.use('db'|'user'|'downloads') cho app */
(function(){
"use strict";
const TK='viba.token';
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}},del:k=>{try{sessionStorage.removeItem(k)}catch(e){}}};
const delTok=()=>{ls.del(TK);ss.del(TK)};
let token=ls.get(TK)||ss.get(TK),me=null;
/* Google đôi khi trả 404 ở bước chuyển hướng (script.googleusercontent.com/macros/echo) dù máy chủ đã chạy xong: thử lại tối đa 4 lần */
async function fetchApi(op,a){let last;const N=op==='sync'?2:4;for(let i=0;i<N;i++){let ac=null,tm=null;try{if(op==='sync'&&window.AbortController){ac=new AbortController();tm=setTimeout(()=>ac.abort(),30000)}const r=await fetch(window.VIBA_API,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({api:1,tok:token,op,a:a||{}}),signal:ac?ac.signal:undefined});clearTimeout(tm);const t=await r.text();if(r.ok&&t.charAt(0)==='{'){const o=JSON.parse(t);
      if(i>0&&op==='signup'&&/đã có tài khoản/.test(o.error||''))return fetchApi('login',a); /* lần trước đã tạo xong nhưng mất phản hồi */
      return o}last=new Error('HTTP '+r.status)}catch(e){clearTimeout(tm);last=e}if(i<N-1)await new Promise(r=>setTimeout(r,800*(i+1)+Math.random()*900))}
  throw Object.assign(new Error(navigator.onLine===false?'Mất kết nối mạng':'Máy chủ dữ liệu chưa phản hồi, thử lại sau ít phút'),{code:'unavailable',cause:last})}
function call(op,a){if(window.VIBA_API)return fetchApi(op,a).then(o=>{if(o.ok)return o.r;if(/^AUTH:/.test(o.error||'')){delTok();location.reload();return new Promise(()=>{})}throw Object.assign(new Error(o.error),{code:o.code||'unavailable'})});
  return new Promise((res,rej)=>{google.script.run.withSuccessHandler(s=>{let o;try{o=JSON.parse(s)}catch(e){return rej(Object.assign(new Error('Phản hồi lỗi'),{code:'unavailable'}))}
    if(o.ok)return res(o.r);if(/^AUTH:/.test(o.error||'')){delTok();location.reload();return}rej(Object.assign(new Error(o.error),{code:o.code||'unavailable'}))})
  .withFailureHandler(e=>rej(Object.assign(new Error(String(e&&e.message||e)),{code:'unavailable'}))).api(token,op,a||{})})}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- kho dữ liệu cục bộ, đồng bộ định kỳ ---------- */
const store=new Map();let since=0;const listeners=new Set();let syncing=false;
const split=p=>{const s=p.split('/');return {coll:s.slice(0,-1).join('/'),id:s[s.length-1]}};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const snapDoc=(id,d)=>({id,exists:d!=null,data:()=>d==null?undefined:clone(d),metadata:{fromCache:false,hasPendingWrites:false}});
const qsnap=l=>({docs:l,size:l.length,empty:!l.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}});
function applyRows(rows){const touched=new Set();for(const r of rows){let d=null;if(r.j){try{d=JSON.parse(r.j)}catch(e){d=null}}if(d==null)store.delete(r.p);else store.set(r.p,d);dirty.add(r.p);touched.add(split(r.p).coll);touched.add('#'+r.p)}return touched}
function notify(touched){listeners.forEach(l=>{if(touched===true||touched.has(l.key))l.fire()})}
/* v43: lưu dữ liệu trên máy (IndexedDB) để mở lại app chỉ tải phần thay đổi, đỡ tải máy chủ khi nhiều người cùng vào */
const IDB={d:null,open(){return this.d||(this.d=new Promise(res=>{try{const q=indexedDB.open('viba',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>res(null);setTimeout(()=>res(null),12000)}catch(e){res(null)}}))},
  async get(k){const d=await this.open();if(!d)return null;return new Promise(res=>{try{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})},
  async put(k,v){const d=await this.open();if(!d)return;try{d.transaction('kv','readwrite').objectStore('kv').put(v,k)}catch(e){}},
  async del(k){const d=await this.open();if(!d)return;try{d.transaction('kv','readwrite').objectStore('kv').delete(k)}catch(e){}}};
const CK=()=>me&&me.uid?'c2:'+me.uid:null;let saveT=null;
/* v69: mỗi dòng dữ liệu 1 khoá ('c3:<uid>|<path>'), chỉ ghi các dòng vừa đổi + 1 dòng mốc 'c3m:<uid>' – trước đây mỗi lần đồng bộ ghi lại cả ~2 MB làm máy khựng */
const dirty=new Set();let wipe=false;const K3=()=>me&&me.uid?'c3:'+me.uid+'|':null,KM=()=>me&&me.uid?'c3m:'+me.uid:null;
function saveCache(){clearTimeout(saveT);saveT=setTimeout(flushCache,2500)}
async function flushCache(){const pre=K3();if(!pre)return;const d=await IDB.open();if(!d)return;const ps=[...dirty];dirty.clear();const w=wipe;wipe=false;
  try{const tx=d.transaction('kv','readwrite'),os=tx.objectStore('kv');if(w)os.delete(IDBKeyRange.bound(pre,pre+'\uffff'));for(const p of ps){const v=store.get(p);if(v==null)os.delete(pre+p);else os.put({p,d:v},pre+p)}os.put({since,perm,at:Date.now(),n:store.size},KM());tx.onerror=()=>{ps.forEach(p=>dirty.add(p))}}catch(e){ps.forEach(p=>dirty.add(p))}}
async function loadCache(){const pre=K3();if(!pre)return;const d=await IDB.open();if(!d)return;
  const m=await IDB.get(KM());
  if(m&&Date.now()-(m.at||0)<=20*864e5){const all=await new Promise(res=>{try{const q=d.transaction('kv').objectStore('kv').getAll(IDBKeyRange.bound(pre,pre+'\uffff'));q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])}catch(e){res([])}});
    if(all.length){for(const x of all)if(x&&x.p)store.set(x.p,x.d);since=m.since||0;perm=m.perm==null?null:m.perm;return}}
  /* chuyển dữ liệu đã lưu kiểu cũ (1 khối) sang kiểu mới */
  const k=CK();const c=await IDB.get(k);if(!c||!Array.isArray(c.rows)||Date.now()-(c.at||0)>20*864e5)return;for(const [p,v] of c.rows){store.set(p,v);dirty.add(p)}since=c.since||0;perm=c.perm==null?null:c.perm;wipe=true;await flushCache();IDB.del(k)}
const loadBar=n=>{let b=document.getElementById('vibaLoadBar');if(n===false){if(b)b.remove();return}if(!b){b=document.createElement('div');b.id='vibaLoadBar';b.style.cssText='position:fixed;left:0;right:0;top:0;z-index:9999;background:#1b6aa5;color:#fff;font:600 13px system-ui,sans-serif;text-align:center;padding:4px 8px';document.body.appendChild(b)}b.textContent='⏳ Đang tải dữ liệu lần đầu… phần '+n+' (app vẫn dùng được, danh sách sẽ đủ dần)'};
let perm=null;async function syncNow(onFirst){if(syncing)return;syncing=true;let big=false;try{let r=await call('sync',{since});const pk=(r.owner?'o':'')+(r.staff?'s':'');if(perm!==null&&pk!==perm){/* vừa được giao/thu quyền: tải lại toàn bộ */store.clear();wipe=true;since=0;r=await call('sync',{since:0})}const changed=r.rows.length>0||perm!==pk;perm=pk;since=r.now;notify(r.rows.length?applyRows(r.rows):new Set());if(changed)saveCache();
  /* v69: lần đầu chưa có dữ liệu → mở app ngay sau phần đầu, phần còn lại tải nền */if(onFirst){onFirst();onFirst=null}
  /* v66: máy chủ chia dữ liệu thành nhiều phần nhỏ (more=true) → tải tiếp từng phần, phần nào xong lưu phần đó */for(let k=0;k<60&&r.more;k++){if(k>=1){big=true;loadBar(k+1)}r=await call('sync',{since});since=r.now;if(r.rows.length){notify(applyRows(r.rows));saveCache()}}}catch(e){}finally{syncing=false;if(big)loadBar(false);if(onFirst)onFirst()}}
let firstLoad=null;
function startSync(){firstLoad=(async()=>{try{await loadCache()}catch(e){}if(store.size){syncNow();return}await new Promise(res=>syncNow(res))})();
  const tick=()=>setTimeout(async()=>{try{if(document.visibilityState!=='hidden')await syncNow()}finally{tick()}},15000+Math.random()*5000);tick();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow()})}
function pass(d,filters){for(const [f,op,v] of filters){const x=d?d[f]:undefined;const s=x==null?'':String(x);
  if(op==='>='&&!(s>=v))return false;if(op==='<='&&!(s<=v))return false;if(op==='>'&&!(s>v))return false;if(op==='<'&&!(s<v))return false;if(op==='=='&&s!==String(v))return false;if(op==='!='&&s===String(v))return false}return true}
function listColl(coll,filters){const out=[];const pre=coll+'/';for(const [p,d] of store){if(!p.startsWith(pre))continue;const rest=p.slice(pre.length);if(rest.includes('/'))continue;if(pass(d,filters))out.push(snapDoc(rest,d))}return out.sort((a,b)=>a.id<b.id?-1:1)}
function localWrite(path,d){if(d==null)store.delete(path);else store.set(path,clone(d));notify(new Set([split(path).coll,'#'+path]))}
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function merge(a,b){const o=Object.assign({},a);for(const k in b){const v=b[k];if(v&&v.__delete__){delete o[k];continue}o[k]=isObj(v)&&isObj(a[k])?merge(a[k],v):v}return o}
const photoCache=new Map();
function doc(path){const {coll,id}=split(path);
  if(coll==='photos')return {id,path,
    set:async d=>{await call('photoPut',{id,data:d.data,orderId:d.orderId,kind:d.kind});photoCache.set(id,d.data)},
    get:async()=>{if(photoCache.has(id))return snapDoc(id,{data:photoCache.get(id)});const r=await call('photoGet',{id});if(r.data)photoCache.set(id,r.data);return snapDoc(id,r.data?{data:r.data}:null)},
    delete:async()=>{},update:async()=>{},onSnapshot:()=>()=>{}};
  const r={id,path,
    get:async()=>{const x=await call('get',{path});const d=x.j?JSON.parse(x.j):null;if(d==null)store.delete(path);else store.set(path,d);return snapDoc(id,d)},
    set:async d=>{const prev=store.get(path);localWrite(path,d);try{await call('set',{path,data:clone(d)})}catch(e){localWrite(path,prev);throw e}},
    update:async d=>{/* dùng bản đang có trên máy (đồng bộ 15s) để khỏi gọi máy chủ thêm 1 lần */let cur=store.get(path);if(cur==null){const g=await r.get();if(!g.exists)throw Object.assign(new Error('Không tìm thấy dữ liệu'),{code:'invalid_argument'});cur=g.data()}await r.set(merge(clone(cur),d))},
    create:async d=>{const prev=store.get(path);localWrite(path,d);let x;try{x=await call('create',{path,data:clone(d)})}catch(e){localWrite(path,prev);throw e}if(x&&x.exists){localWrite(path,prev);throw Object.assign(new Error('Số đơn đã có'),{code:'exists'})}},
    delete:async()=>{const prev=store.get(path);localWrite(path,null);try{await call('del',{path})}catch(e){localWrite(path,prev);throw e}},
    acquire:async()=>({acquired:true}),
    onSnapshot:(next)=>{const l={key:'#'+path,fire:()=>next(snapDoc(id,store.get(path)))};listeners.add(l);Promise.resolve(firstLoad).then(l.fire);return ()=>listeners.delete(l)},
    collection:p=>collection(path+'/'+p)};
  return r}
function collection(path,filters){filters=filters||[];
  const q={path,where:(f,op,v)=>collection(path,filters.concat([[f,op,v]])),orderBy:()=>q,limit:()=>q,
    get:async()=>{await firstLoad;return qsnap(listColl(path,filters))},
    onSnapshot:(next)=>{let t=null;const l={key:path,fire:()=>{clearTimeout(t);t=setTimeout(()=>next(qsnap(listColl(path,filters))),30)}};listeners.add(l);Promise.resolve(firstLoad).then(l.fire);return ()=>listeners.delete(l)},
    doc:id=>doc(path+'/'+(id||Date.now().toString(36)+Math.random().toString(36).slice(2,7))),
    add:async d=>{const x=doc(path+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));await x.set(d);return x}};
  return q}
const db={doc,collection:p=>collection(p)};

/* ---------- người dùng ---------- */
const user={id:async()=>me&&me.uid,isOwner:async()=>!!(me&&me.owner),canEdit:async()=>!!(me&&me.owner),can:async()=>true,
  me:async()=>({id:me.uid,name:me.name||me.email}),name:async()=>me.name||me.email,
  profiles:async ids=>{const o={};ids.forEach(i=>{const p=store.get('profiles/'+i);o[i]={id:i,name:p?(p.name||p.email||''):''}});return o},search:async()=>[]};
/* ---------- tải file ---------- */
function toB64(buf){let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
const downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);
  try{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},3000)}catch(e){}
  /* trình duyệt trong khung Google đôi khi chặn tải trực tiếp: lưu thêm 1 bản vào Drive nếu là quản lý */
  if(me&&me.owner){try{const r=await call('saveFile',{name:filename,b64:toB64(await blob.arrayBuffer())});window.__lastDriveFile=r.url}catch(e){}}
  return {status:'saved'}}};

/* ---------- đăng nhập ---------- */
/* v31: đăng nhập bằng số điện thoại (hoặc email cho quản lý). SĐT gửi lên máy chủ dạng <sđt>@sdt.viba */
const normPhone=v=>{let d=String(v||'').replace(/\D/g,'');if(d.startsWith('84')&&d.length===11)d='0'+d.slice(2);return d};
const toLogin=v=>{v=String(v||'').trim();if(v.includes('@'))return v.toLowerCase();const d=normPhone(v);return d?d+'@sdt.viba':''};
function loginUI(){return new Promise(resolve=>{const box=document.createElement('div');box.id='loginBox';document.body.appendChild(box);let mode='in';const $=s=>box.querySelector(s);
  const head=`<img class="lg-logo" src="logo2.png" alt="VIBA FOOD"><h1 class="big" style="margin:4px 0 2px">${esc(document.title)}</h1>`;
  const msg=(t,c)=>$('#lgMsg').innerHTML=t?`<div class="alert ${c||'r'}">${esc(t)}</div>`:'';
  const keep=(t,rem)=>{token=t;delTok();(rem?ls:ss).set(TK,t)};
  const draw=()=>{if(mode==='in'){box.innerHTML=`<div class="lg-card">${head}<div class="muted small">Đăng nhập bằng số điện thoại công ty đã đăng ký cho bạn.</div>
    <form class="stack" style="margin-top:14px" onsubmit="return false"><label class="f">Số điện thoại<input id="lgId" type="text" inputmode="tel" autocomplete="username" placeholder="VD: 0964343226"></label>
    <label class="f">Mật khẩu<input id="lgPass" type="password" autocomplete="current-password"></label>
    <label style="display:flex;gap:8px;align-items:center;font-size:15px"><input type="checkbox" id="lgRem" checked style="width:20px;height:20px;min-height:0;flex:none"> Ghi nhớ đăng nhập trên máy này</label>
    <div id="lgMsg"></div><button class="btn block pri" id="lgGo" type="submit">Đăng nhập</button>
    <button class="btn block" id="lgNew" type="button">Lần đầu dùng app? Tạo mật khẩu</button>
    <div class="tiny muted">Quên mật khẩu: nhờ quản lý cấp mật khẩu tạm. Quản lý vẫn đăng nhập bằng email như cũ.</div></form></div>`;
    $('#lgNew').onclick=()=>{mode='up';draw()};
    $('#lgGo').onclick=async()=>{const email=toLogin($('#lgId').value),password=$('#lgPass').value;if(!email||!password)return msg('Nhập số điện thoại và mật khẩu.');
      $('#lgGo').disabled=true;try{const r=await call('login',{email,password});keep(r.token,$('#lgRem').checked);box.remove();resolve()}catch(e){$('#lgGo').disabled=false;msg(e.message)}};
    $('#lgPass').onkeydown=e=>{if(e.key==='Enter')$('#lgGo').click()}}
   else{box.innerHTML=`<div class="lg-card">${head}<div class="muted small">Lần đầu đăng nhập – nhập đầy đủ thông tin.</div>
    <form class="stack" style="margin-top:14px" onsubmit="return false"><label class="f">Họ và tên<input id="lgName" autocomplete="name" placeholder="Đúng họ tên quản lý đã đăng ký"></label>
    <label class="f">Số điện thoại<input id="lgId" type="text" inputmode="tel" autocomplete="username"></label>
    <label class="f">Tạo mật khẩu (ít nhất 6 ký tự)<input id="lgPass" type="password" autocomplete="new-password"></label>
    <label class="f">Nhập lại mật khẩu<input id="lgPass2" type="password" autocomplete="new-password"></label>
    <div id="lgMsg"></div><button class="btn block pri" id="lgGo" type="submit">Tạo mật khẩu và vào app</button>
    <button class="btn block" id="lgBack" type="button">← Quay lại đăng nhập</button>
    <div class="tiny muted">Số điện thoại không có trong danh sách của quản lý sẽ không tạo được tài khoản.</div></form></div>`;
    $('#lgBack').onclick=()=>{mode='in';draw()};
    $('#lgGo').onclick=async()=>{const name=$('#lgName').value.trim().replace(/\s+/g,' '),p=normPhone($('#lgId').value),pw=$('#lgPass').value;
      if(!name)return msg('Nhập họ và tên.');if(!/^0\d{9}$/.test(p))return msg('Số điện thoại phải có 10 số, bắt đầu bằng 0.');if(pw.length<6)return msg('Mật khẩu ít nhất 6 ký tự.');if(pw!==$('#lgPass2').value)return msg('Hai lần nhập mật khẩu không giống nhau.');
      $('#lgGo').disabled=true;try{const r=await call('signup',{email:p+'@sdt.viba',password:pw,name});keep(r.token,true);msg('Xin chào '+r.name+'! Đang vào app…','g');setTimeout(()=>{box.remove();resolve()},700)}
      catch(e){$('#lgGo').disabled=false;msg(/đã có tài khoản/.test(e.message)?'Số này đã tạo mật khẩu rồi – quay lại Đăng nhập. Quên mật khẩu thì nhờ quản lý cấp mật khẩu tạm.':e.message)}}}};
  draw()})}
if(window.VIBA_API&&!/^https:\/\/script\.google\.com\//.test(window.VIBA_API))window.VIBA_API='';
const ready=(async()=>{if(!window.VIBA_API&&!(window.google&&google.script)){document.body.insertAdjacentHTML('afterbegin','<div class="alert w" style="margin:16px">App chưa được nối với máy chủ dữ liệu Google Drive. Quản lý cần triển khai Code.gs và cập nhật config.js.</div>');throw new Error('noapi')}if(!token)await loginUI();
  /* v69: đã đăng nhập trên máy này → dùng thông tin đã nhớ, mở app ngay (đỡ chờ ~2 giây gọi máy chủ); kiểm tra lại ở nền */
  const fp=t=>String(t||'').slice(-12);let mc=null;try{mc=JSON.parse(ls.get('viba.me')||'null')}catch(e){}
  if(mc&&mc.uid&&mc.fp===fp(token)){me={uid:mc.uid,email:mc.email,owner:mc.owner};call('me').then(m=>{if(m&&m.uid){ls.set('viba.me',JSON.stringify({fp:fp(token),uid:m.uid,email:m.email,owner:m.owner}));if(m.uid!==me.uid)location.reload();me.owner=m.owner;me.email=m.email}}).catch(()=>{})}
  else{try{me=await call('me')}catch(e){delTok();token=null;await loginUI();me=await call('me')}ls.set('viba.me',JSON.stringify({fp:fp(token),uid:me.uid,email:me.email,owner:me.owner}))}
  const p=null;startSync();await firstLoad;const pr=store.get('profiles/'+me.uid);me.name=pr&&pr.name})();
window.vibaLogout=async()=>{const k=CK(),pre=K3(),km=KM();delTok();ls.del('viba.me');if(k)await IDB.del(k);if(km)await IDB.del(km);try{const d=await IDB.open();if(d&&pre)d.transaction('kv','readwrite').objectStore('kv').delete(IDBKeyRange.bound(pre,pre+'\uffff'))}catch(e){}setTimeout(()=>location.reload(),300)};
window.vibaAdmin={resetPassword:uid=>call('resetPassword',{uid})};window.vibaAI={slipRead:a=>call('slipRead',a),slipUsage:()=>call('slipUsage',{})};
window.vibaChangePw=()=>{if(document.getElementById('loginBox'))return;const box=document.createElement('div');box.id='loginBox';
  box.innerHTML=`<div class="lg-card"><img class="lg-logo" src="logo2.png" alt="VIBA FOOD"><h1 class="big" style="margin:4px 0 10px">Đổi mật khẩu</h1>
   <div class="stack"><label class="f">Mật khẩu hiện tại<input id="cpOld" type="password" autocomplete="current-password"></label>
   <label class="f">Mật khẩu mới (ít nhất 6 ký tự)<input id="cpNew" type="password" autocomplete="new-password"></label>
   <label class="f">Nhập lại mật khẩu mới<input id="cpNew2" type="password" autocomplete="new-password"></label>
   <div id="cpMsg"></div><button class="btn block pri" id="cpGo">Đổi mật khẩu</button><button class="btn block" id="cpX">Huỷ</button></div></div>`;
  document.body.appendChild(box);const $=s=>box.querySelector(s);const msg=(t,c)=>$('#cpMsg').innerHTML=t?`<div class="alert ${c||'r'}">${esc(t)}</div>`:'';
  $('#cpX').onclick=()=>box.remove();
  $('#cpGo').onclick=async()=>{const o=$('#cpOld').value,n=$('#cpNew').value;if(!o||!n)return msg('Nhập đủ mật khẩu.');if(n.length<6)return msg('Mật khẩu mới ít nhất 6 ký tự.');if(n!==$('#cpNew2').value)return msg('Hai lần nhập mật khẩu mới không giống nhau.');
    $('#cpGo').disabled=true;try{await call('changePassword2',{old:o,pw:n});msg('Đã đổi mật khẩu.','g');setTimeout(()=>box.remove(),1200)}catch(e){$('#cpGo').disabled=false;msg(e.message)}}};
window.claude={use:async n=>{try{await ready}catch(e){return null}return ({db,user,downloads})[n]||null}};
})();
