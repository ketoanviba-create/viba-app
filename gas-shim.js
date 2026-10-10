/* Lớp kết nối Google Apps Script: giữ nguyên giao diện window.claude.use('db'|'user'|'downloads') cho app */
(function(){
"use strict";
const TK='viba.token';
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let token=ls.get(TK),me=null;
/* Google đôi khi trả 404 ở bước chuyển hướng (script.googleusercontent.com/macros/echo) dù máy chủ đã chạy xong: thử lại tối đa 4 lần */
async function fetchApi(op,a){let last;for(let i=0;i<4;i++){try{const r=await fetch(window.VIBA_API,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({api:1,tok:token,op,a:a||{}})});const t=await r.text();if(r.ok&&t.charAt(0)==='{'){const o=JSON.parse(t);
      if(i>0&&op==='signup'&&/đã có tài khoản/.test(o.error||''))return fetchApi('login',a); /* lần trước đã tạo xong nhưng mất phản hồi */
      return o}last=new Error('HTTP '+r.status)}catch(e){last=e}await new Promise(r=>setTimeout(r,600*(i+1)))}
  throw Object.assign(new Error(navigator.onLine===false?'Mất kết nối mạng':'Máy chủ dữ liệu chưa phản hồi, thử lại sau ít phút'),{code:'unavailable',cause:last})}
function call(op,a){if(window.VIBA_API)return fetchApi(op,a).then(o=>{if(o.ok)return o.r;if(/^AUTH:/.test(o.error||'')){ls.del(TK);location.reload();return new Promise(()=>{})}throw Object.assign(new Error(o.error),{code:o.code||'unavailable'})});
  return new Promise((res,rej)=>{google.script.run.withSuccessHandler(s=>{let o;try{o=JSON.parse(s)}catch(e){return rej(Object.assign(new Error('Phản hồi lỗi'),{code:'unavailable'}))}
    if(o.ok)return res(o.r);if(/^AUTH:/.test(o.error||'')){ls.del(TK);location.reload();return}rej(Object.assign(new Error(o.error),{code:o.code||'unavailable'}))})
  .withFailureHandler(e=>rej(Object.assign(new Error(String(e&&e.message||e)),{code:'unavailable'}))).api(token,op,a||{})})}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- kho dữ liệu cục bộ, đồng bộ định kỳ ---------- */
const store=new Map();let since=0;const listeners=new Set();let syncing=false;
const split=p=>{const s=p.split('/');return {coll:s.slice(0,-1).join('/'),id:s[s.length-1]}};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const snapDoc=(id,d)=>({id,exists:d!=null,data:()=>d==null?undefined:clone(d),metadata:{fromCache:false,hasPendingWrites:false}});
const qsnap=l=>({docs:l,size:l.length,empty:!l.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}});
function applyRows(rows){const touched=new Set();for(const r of rows){let d=null;if(r.j){try{d=JSON.parse(r.j)}catch(e){d=null}}if(d==null)store.delete(r.p);else store.set(r.p,d);touched.add(split(r.p).coll);touched.add('#'+r.p)}return touched}
function notify(touched){listeners.forEach(l=>{if(touched===true||touched.has(l.key))l.fire()})}
let perm=null;async function syncNow(){if(syncing)return;syncing=true;try{let r=await call('sync',{since});const pk=(r.owner?'o':'')+(r.staff?'s':'');if(perm!==null&&pk!==perm){/* vừa được giao/thu quyền: tải lại toàn bộ */store.clear();since=0;r=await call('sync',{since:0})}perm=pk;since=r.now;notify(r.rows.length?applyRows(r.rows):new Set());if(pk!==perm)notify(true)}catch(e){}finally{syncing=false}}
let firstLoad=null;
function startSync(){firstLoad=syncNow();setInterval(()=>{if(document.visibilityState!=='hidden')syncNow()},15000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow()})}
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
function loginUI(){return new Promise(resolve=>{const box=document.createElement('div');box.id='loginBox';
  box.innerHTML=`<div class="lg-card"><img class="lg-logo" src="logo.png" alt="VIBA FOOD"><h1 class="big" style="margin:4px 0 2px">${esc(document.title)}</h1><div class="muted small">Đăng nhập bằng email công ty cấp cho bạn.</div>
   <div class="seg" style="margin:14px 0"><button data-m="in" class="on">Đăng nhập</button><button data-m="up">Tạo tài khoản</button></div>
   <div class="stack"><label class="f" id="lgNameW" hidden>Họ và tên<input id="lgName" autocomplete="name"></label>
   <label class="f">Email<input id="lgEmail" type="email" autocomplete="username" inputmode="email"></label>
   <label class="f">Mật khẩu<input id="lgPass" type="password" autocomplete="current-password"></label>
   <div id="lgMsg"></div><button class="btn block pri" id="lgGo">Đăng nhập</button><div class="tiny muted">Quên mật khẩu: nhờ quản lý đặt lại.</div></div></div>`;
  document.body.appendChild(box);let mode='in';const $=s=>box.querySelector(s);const msg=(t,c)=>$('#lgMsg').innerHTML=t?`<div class="alert ${c||'r'}">${esc(t)}</div>`:'';
  box.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;box.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b));$('#lgNameW').hidden=mode!=='up';$('#lgGo').textContent=mode==='up'?'Tạo tài khoản':'Đăng nhập';msg('')});
  $('#lgGo').onclick=async()=>{const email=$('#lgEmail').value.trim(),password=$('#lgPass').value,name=$('#lgName').value.trim();if(!email||!password)return msg('Nhập email và mật khẩu.');if(mode==='up'&&!name)return msg('Nhập họ và tên.');
    $('#lgGo').disabled=true;try{const r=await call(mode==='up'?'signup':'login',{email,password,name});token=r.token;ls.set(TK,token);box.remove();resolve()}catch(e){$('#lgGo').disabled=false;msg(e.message)}};
  $('#lgPass').onkeydown=e=>{if(e.key==='Enter')$('#lgGo').click()}})}
if(window.VIBA_API&&!/^https:\/\/script\.google\.com\//.test(window.VIBA_API))window.VIBA_API='';
const ready=(async()=>{if(!window.VIBA_API&&!(window.google&&google.script)){document.body.insertAdjacentHTML('afterbegin','<div class="alert w" style="margin:16px">App chưa được nối với máy chủ dữ liệu Google Drive. Quản lý cần triển khai Code.gs và cập nhật config.js.</div>');throw new Error('noapi')}if(!token)await loginUI();try{me=await call('me')}catch(e){ls.del(TK);token=null;await loginUI();me=await call('me')}
  const p=null;startSync();await firstLoad;const pr=store.get('profiles/'+me.uid);me.name=pr&&pr.name})();
window.vibaLogout=()=>{ls.del(TK);location.reload()};
window.vibaAdmin={resetPassword:uid=>call('resetPassword',{uid})};
window.vibaChangePw=()=>{if(document.getElementById('loginBox'))return;const box=document.createElement('div');box.id='loginBox';
  box.innerHTML=`<div class="lg-card"><img class="lg-logo" src="logo.png" alt="VIBA FOOD"><h1 class="big" style="margin:4px 0 10px">Đổi mật khẩu</h1>
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
