/* VIBA – Phân hệ Sản xuất (v115; v120–130 thêm Xưởng chuối – ủ rấm, kế hoạch, loại A/B, nhập theo thùng). Trang riêng sanxuat.html, dùng chung gas-shim (đăng nhập, đồng bộ).
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
/* v125: hộp xác nhận trong trang (thay confirm – một số trình duyệt/khung app chặn confirm nên không lưu được) */
function ask(m){return new Promise(res=>{const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px';
  o.innerHTML=`<div style="background:var(--card,#fff);color:var(--fg,#111);border-radius:16px;padding:18px;max-width:420px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.3)"><div style="font-size:16px;font-weight:600;line-height:1.45;margin-bottom:14px;white-space:pre-wrap">${esc(m)}</div><div style="display:flex;gap:10px"><button class="btn block" data-a="0" style="flex:1">Hủy</button><button class="btn block pri" data-a="1" style="flex:1">Đồng ý</button></div></div>`;
  const done=v=>{o.remove();res(v)};o.querySelector('[data-a="0"]').onclick=()=>done(false);o.querySelector('[data-a="1"]').onclick=()=>done(true);document.body.appendChild(o)})}
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}

const KIND={
  nvl:{n:'Nhập nguyên liệu',s:'Mía, dứa, khoai… mua về',c:'#1f8a52'},
  sx:{n:'Sản xuất',s:'Nguyên liệu → bán thành phẩm',c:'#1b6aa5'},
  dg:{n:'Đóng gói',s:'Ra túi / hộp thành phẩm',c:'#0e7c86'},
  xuat:{n:'Xuất hàng',s:'Đi kho đông / ra Hà Nội',c:'#b85a12'},
  dgl:{n:'Đóng gói lại',s:'Lấy từ kho đông về đóng',c:'#6b4fa3'}};
const KORDER=['nvl','sx','dg','xuat','dgl'];
/* v120: Xưởng chuối – 4 công đoạn ủ rấm */
Object.assign(KIND,{
  cnx:{n:'Nhập chuối xanh',s:'Vào kho 1 · NCC, loại chuối, thùng, giá',c:'#1f8a52'},
  cvu:{n:'Vào phòng ủ',s:'Lô xanh (kho 1) → kho ủ 2/4/5/6',c:'#1b6aa5'},
  cloc:{n:'Lọc lựa – ra ủ (Kho 3)',s:'Lấy từ các kho ủ về kho 3 · 1 phiếu chung Winmart + khách khác',c:'#0e7c86'},
  cxuat:{n:'Xuất hàng',s:'Chọn xe → tích hàng đi theo xe',c:'#b85a12'}});
const CORDER=['cnx','cvu','cloc','cxuat'];
const kOrd=k=>CORDER.includes(k)?CORDER.indexOf(k)+1:KORDER.indexOf(k)+1;
const isCh=l=>CORDER.includes(l.kind);
const DEST={hn:'Kho Hà Nội',dong:'Kho đông thuê',mau:'Hàng mẫu'};

/* Định mức ban đầu: tính từ file "GIÁ THÀNH CHUNG NĂM 2026.xlsx" ngày 11/11/2026 (Quản lý sửa ở tab Định mức) */
const DM0={tl:0,cong100:0,rate:180000,baoBi:0,dienGa:0,kh:0,thung:0,guiKho:0};
const DEFAULT_CFG={v:3,gioCong:8,
  /* Nguyên liệu (gộp): mọi loại dứa đều là "Dứa" */
  nvls:[{id:'mia',name:'Mía'},{id:'dua',name:'Dứa'},{id:'sau',name:'Sấu'},{id:'ksq',name:'Khoai sọ'},{id:'kmo',name:'Khoai môn'},{id:'docm',name:'Dọc mùng'},{id:'bo',name:'Bơ'},{id:'xoai',name:'Xoài'},{id:'mcau',name:'Mãng cầu'},{id:'cleo',name:'Chanh leo'},{id:'daut',name:'Dâu tây'},{id:'ot',name:'Ớt'},{id:'san',name:'Sắn'},{id:'chuoi',name:'Chuối tây'},{id:'csen',name:'Củ sen'},{id:'ctu',name:'Củ từ'}],
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
    {id:'daut',name:'Dâu tây',nvl:'daut',bich:true,packs:[[900,'g'],[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'ot',name:'Ớt',nvl:'ot',bich:true,packs:[[100,'g'],[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'san',name:'Sắn',nvl:'san',bich:true,packs:[[250,'g'],[400,'g'],[1,'kg']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'csen',name:'Củ sen',nvl:'csen',packs:[[200,'g']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'ctu',name:'Củ từ',nvl:'ctu',packs:[[250,'g']],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'},
    {id:'chuoit',name:'Chuối tây đông lạnh',nvl:'chuoi',bich:true,packs:[],dm:Object.assign({},DM0),src:'chưa có định mức – Quản lý nhập'}],
  /* Nhà cung cấp: file "Danh sách nhà cung cấp" (11/11/2026). code = mã MISA; lot = 3 chữ dùng sinh số lô */
  ncc:[['001082047648','Lê Bá Quỳnh'],['001087041827','Trần văn Đặng'],['001161024959','Phùng Thị Dung'],['001168041185','Lê Thị Thu Hường'],['010086006385','Lý Seo Vư'],['014181006674','Phạm Thị Thúy'],['017093005472','Nguyễn Văn Chung','NVC'],['033182003306','Trần Thị Xoa'],['033191012442','Nguyễn Thị Mơ'],['035078011048','Trần Văn Hùng'],['037301001464','Đinh Thị Nhật Lệ','NLE'],['NCC00001','Dương Chi Chi'],['NCC 0010','Nguyễn Văn Ca'],['NCC 002','E Thoa Daklak'],['NCC 003','E Định Daklak'],['NCC 008','E Thiêm'],['NCC 014','A Châu'],['NCC 015','Trần Văn Ninh']].map(x=>({code:x[0],name:x[1],lot:x[2]||''})),
  xe:['28A-30735','28H-00259','30B-80630']};
/* v120: cấu hình xưởng chuối (lưu ở mcfg/main.ch). marks: ngày thứ mấy lọc cho đâu */
const CH0={rooms:6,rl:[2,4,5,6],caps:{2:5000,4:5000,5:5000,6:5000},users:['Nguyễn Thị Như Nhung','Phan Xuân Tùng'],approvers:['Phan Xuân Tùng'],
  types:{tieu:{name:'Chuối tiêu',days:4,ram:3,thung:16,yield:88,marks:{3:'Win',4:'Khách khác'},cong100:0},tay:{name:'Chuối tây',days:3,ram:3,thung:15,yield:88,marks:{3:'Khách khác'},cong100:0}},
  dm:{rate:180000,khac:0},
  prods:[
    {id:'tkg',t:'tieu',gr:'B',name:'Chuối tiêu kg',u:'kg',kg:1},
    {id:'tplus',t:'tieu',gr:'A',name:'Chuối tiêu Plus',u:'gói',kg:0.842},
    {id:'tmini',t:'tieu',gr:'A',name:'Chuối tiêu Mini',u:'gói',kg:0.64},
    {id:'t350',t:'tieu',gr:'A',name:'Chuối tiêu Pack 350g',u:'gói',kg:0.38},
    {id:'tck',t:'tieu',gr:'A',name:'Quả Circle K',u:'quả',kg:0.17},
    {id:'twin',t:'tieu',gr:'A',name:'Winmart',u:'kg',kg:1,g:'win'},
    {id:'tgop',t:'tieu',gr:'A',name:'GO Plus',u:'gói',kg:0.842},
    {id:'tgom',t:'tieu',gr:'A',name:'GO Mini',u:'gói',kg:0.64},
    {id:'tbep',t:'tieu',gr:'B',name:'Quả bếp trường (kg)',u:'kg',kg:1},
    {id:'tbepq',t:'tieu',gr:'B',name:'Quả bếp trường (quả)',u:'quả',kg:0.11},
    {id:'ykg',t:'tay',name:'Chuối tây kg',u:'kg',kg:1},
    {id:'yplus',t:'tay',name:'Chuối tây Plus',u:'gói',kg:0.762},
    {id:'ymini',t:'tay',name:'Chuối tây Mini',u:'gói',kg:0.593},
    {id:'ybep',t:'tay',name:'Quả loại bếp bánh',u:'kg',kg:1}]};
const CDEST={all:'Winmart + khách khác',win:'Winmart',khac:'Khách khác',wg:'Win / GO',hn:'Hà Nội'};
const CDEST_NEW=[['win','Winmart'],['khac','Khách khác']];
const CXD={win:'Winmart',go:'GO',hn:'Hà Nội',ck:'Circle K',bep:'Bếp trường / bếp bánh',khac:'Khách khác',multi:'Nhiều nhóm'};
/* v136: xuất hàng theo xe – chọn xe trước, tích nhóm hàng đi theo xe */
const XG=[['win','🛒 Winmart'],['go','🟦 GO'],['ck','🏪 Circle K'],['bep','🍳 Bếp trường'],['hn','🏙️ Hà Nội / khách khác']];
const XGN={win:'Winmart',go:'GO',ck:'Circle K',bep:'Bếp trường',hn:'Hà Nội / khách khác'};

const S={db:null,user:null,uid:null,owner:false,staff:null,cfg:null,logs:[],plans:{},reqs:[],tab:'home',form:null,names:{},ui:{lp:'7',gtFrom:null,gtTo:null,ncDate:null,dmItem:'mia',xw:null},ready:false};
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
const chc=()=>{const c=(S.cfg&&S.cfg.ch)||{};return Object.assign({},CH0,c,c.v132?{}:{rooms:CH0.rooms,rl:CH0.rl,caps:CH0.caps},{types:(()=>{const T=Object.assign({},CH0.types,c.types||{});if(!c.v125)for(const k of Object.keys(CH0.types))T[k]=Object.assign({},T[k],{marks:CH0.types[k].marks,thung:CH0.types[k].thung,days:CH0.types[k].days});return T})(),dm:Object.assign({},CH0.dm,c.dm||{})},c.v134?{}:{prods:migP134(c.prods||CH0.prods)})};
/* v134: Circle K tính theo quả 0,17 kg/quả; quả bếp trường 2 định mức: theo kg và theo quả 0,11 kg/quả */
function migP134(P){const o=P.map(p=>p.id==='tck'?Object.assign({},p,{u:'quả',kg:0.17,note:''}):p.id==='tbep'?Object.assign({},p,{name:/\(kg\)/.test(p.name)?p.name:p.name+' (kg)',note:''}):p);if(!o.some(p=>p.id==='tbepq')){const i=o.findIndex(p=>p.id==='tbep');o.splice(i<0?o.length:i+1,0,{id:'tbepq',t:'tieu',gr:'B',name:'Quả bếp trường (quả)',u:'quả',kg:0.11})}return o}
function chUser(){const me=noAcc(S.names[S.uid]||'').trim();return !!me&&(chc().users||[]).some(u=>noAcc(u).trim()===me)}
/* v122: nhân viên Sản xuất khoá theo xưởng (tên trong ch.users → Xưởng chuối, còn lại → Nhà máy); chỉ Quản lý chuyển qua lại */
function xw(){if(!isAdmin())return chUser()?'ch':'nm';if(S.ui.xw)return S.ui.xw;let v=null;try{v=new URLSearchParams(location.search).get('x')||localStorage.getItem('sxXw')}catch(e){}
  return v==='ch'||v==='nm'?v:'nm'}
function setXw(v){S.ui.xw=v;try{localStorage.setItem('sxXw',v)}catch(e){}}
const modeLogs=L=>L.filter(l=>xw()==='ch'?isCh(l):!isCh(l));
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
/* v129: định mức vật tư theo sản phẩm – nguồn sheet "Định mức VT theo SP" (file Theo dõi NXT vật tư). Quản lý sửa → lưu mcfg/main.vt */
const VT0={"cat":{"VT001":{"n":"Tem sấu 500g ( 44 *190 )","u":"Cái","g":"Nhãn mác"},"VT002":{"n":"Tem bơ 1kg ( 10 *15 )","u":"Cái","g":"Nhãn mác"},"VT003":{"n":"Tem xoài 1kg ( 10 * 15 )","u":"Cái","g":"Nhãn mác"},"VT004":{"n":"Tem mãng cầu 1kg ( 10 * 15 )","u":"Cái","g":"Nhãn mác"},"VT005":{"n":"Tem chanh leo 400g ( 8 *12 )","u":"Cái","g":"Nhãn mác"},"VT006":{"n":"Tem chanh leo 600g ( 8*12 )","u":"Cái","g":"Nhãn mác"},"VT007":{"n":"Tem khoai sọ 1kg ( 10* 6,5)","u":"Cái","g":"Nhãn mác"},"VT008":{"n":"Tem Dâu tây 900g (10*15 )","u":"Cái","g":"Nhãn mác"},"VT009":{"n":"Tem mía 300g (15*3 )","u":"Cái","g":"Nhãn mác"},"VT010":{"n":"Tem dứa 250g ( 6 * 6 )","u":"Cái","g":"Nhãn mác"},"VT011":{"n":"Tem sắn 250g ( 7,5*7,5)","u":"Cái","g":"Nhãn mác"},"VT012":{"n":"Tem củ sen 200g ( 15 * 3)","u":"Cái","g":"Nhãn mác"},"VT013":{"n":"Tem ớt 100g ( 5,5*5,5)","u":"Cái","g":"Nhãn mác"},"VT014":{"n":"Tem dọc mùng 1 kg ( 10*15 )","u":"Cái","g":"Nhãn mác"},"VT015":{"n":"Tem dứa nguyên chất 1kg ( 10*15 )","u":"Cái","g":"Nhãn mác"},"VT034":{"n":"Tem khoai môn 250g ( 6,5*10)","u":"Cái","g":"Nhãn mác"},"VT016":{"n":"Túi dọc mùng 200g ( 16*25)","u":"Kg","g":"Bao bì","pk":166},"VT017":{"n":"Túi khoai sọ 300g ( 16 *23 )","u":"Kg","g":"Bao bì","pk":166},"VT018":{"n":"Túi sấu 300g ( 16*13 )","u":"Kg","g":"Bao bì","pk":166},"VT019":{"n":"Túi HCK 20 * 25","u":"Kg","g":"Bao bì","pk":105},"VT020":{"n":"Túi HCK 22 * 32","u":"Kg","g":"Bao bì","pk":75},"VT021":{"n":"Túi HCK 12 *17","u":"Kg","g":"Bao bì","pk":255},"VT022":{"n":"Túi HCK 10 * 15","u":"Kg","g":"Bao bì","pk":350},"VT023":{"n":"Túi HCK 25 * 35","u":"Kg","g":"Bao bì","pk":62},"VT024":{"n":"Túi HCK 16 * 23","u":"Kg","g":"Bao bì","pk":136},"VT025":{"n":"Hộp sắn 250g","u":"Hộp","g":"Bao bì"},"VT026":{"n":"Hộp dứa 250g","u":"Hộp","g":"Bao bì"},"VT027":{"n":"Túi zip đóng muối dứa","u":"Kg","g":"Bao bì","pk":1580},"VT028":{"n":"Túi zip đóng cốt dừa","u":"Kg","g":"Bao bì"},"VT029":{"n":"Acid Ascorbic (Vitamin C) (E300)","u":"Kg","g":"Hoá chất"},"VT030":{"n":"Acid citric (E330)","u":"Kg","g":"Hoá chất"},"VT031":{"n":"Kali sorbate (E202)","u":"Kg","g":"Hoá chất"},"VT032":{"n":"Sodium erythorbate (E316 - hay C )","u":"Kg","g":"Hoá chất"},"VT033":{"n":"Natri metabisulfite (E223 - hay SMB)","u":"Kg","g":"Hoá chất"},"VT035":{"n":"Baking soda","u":"Kg","g":"Hoá chất"},"VT036":{"n":"Thùng giấy 13kg","u":"Cái","g":"Vật tư"},"VT037":{"n":"Thùng xốp","u":"Cái","g":"Vật tư"},"VT038":{"n":"Băng dính","u":"Cuộn","g":"Vật tư"},"VT039":{"n":"Túi HCK 90 -90 25mic ( 27 túi/ 1kg ) - Nhà Máy","u":"Kg","g":"Vật tư","pk":27},"VT053":{"n":"Tem ớt 1kg (6,5 * 10 )","u":"Cái","g":"tem nhãn"},"VT054":{"n":"Tem khoai môn 1 kg ( 6,5*10)","u":"Cái","g":"tem nhãn"},"VT055":{"n":"Muối","u":"Kg","g":"Hoá chất"},"VT056":{"n":"Túi HCK 14 * 20","u":"Kg","g":"Bao bì","pk":179},"VT057":{"n":"Tem củ từ 250g","u":"Cái","g":"tem nhãn"},"VT058":{"n":"Tem sắn 1kg ( 10*15 )","u":"Cái","g":"tem nhãn"}},"sp":{"mia|300":{"c":"TP01","n":"Mía mát túi 300g","b":null,"m":[["VT019",1.0],["VT009",1.0]]},"duam|250":{"c":"TP02","n":"Dứa mát hộp 250g","b":null,"m":[["VT027",1.0],["VT026",1.0],["VT010",1.0]]},"duanc|1500":{"c":"TP03","n":"Dứa nguyên chất túi 1,5kg","b":10,"m":[["VT021",1.0],["VT023",1.0],["VT027",1.0],["VT015",1.0]]},"sau|300":{"c":"TP04","n":"Sấu 300g","b":45,"m":[["VT018",1.0],["VT019",1.0]]},"sau|500":{"c":"TP05","n":"Sấu 500g","b":24,"m":[["VT020",1.0],["VT001",1.0]]},"ksq|300":{"c":"TP07","n":"Khoai sọ túi 300g","b":45,"m":[["VT017",1.0]]},"ksq|1000":{"c":"TP08","n":"Khoai sọ túi 1kg","b":13,"m":[["VT020",1.0],["VT007",1.0]]},"kmo|250":{"c":"TP09","n":"Khoai môn túi 250g","b":45,"m":[["VT024",1.0],["VT034",1.0]]},"kmo|1000":{"c":"TP10","n":"Khoai môn túi 1kg","b":null,"m":[["VT023",1.0],["VT054",1.0]]},"docm|200":{"c":"TP11","n":"Dọc mùng túi 200g","b":50,"m":[["VT016",1.0]]},"docm|1000":{"c":"TP12","n":"Dọc mùng túi 1kg","b":13,"m":[["VT023",1.0],["VT014",1.0]]},"bo|1000":{"c":"TP13","n":"Bơ túi 1kg","b":12,"m":[["VT022",1.0],["VT020",1.0],["VT002",1.0]]},"xoai|1000":{"c":"TP14","n":"Xoài túi 1kg","b":12,"m":[["VT022",1.0],["VT020",1.0],["VT003",1.0]]},"mcau|1000":{"c":"TP15","n":"Mãng cầu túi 1kg","b":12,"m":[["VT022",1.0],["VT020",1.0],["VT004",1.0]]},"cleo|400":{"c":"TP16","n":"Chanh leo không hạt 400g","b":20,"m":[["VT022",1.0],["VT019",1.0],["VT005",1.0]]},"cleo|600":{"c":"TP17","n":"Chanh leo hạt 600g","b":20,"m":[["VT022",1.0],["VT019",1.0],["VT006",1.0]]},"daut|900":{"c":"TP18","n":"Dâu tây 900g","b":10,"m":[["VT021",1.0],["VT023",1.0],["VT008",1.0]]},"ot|100":{"c":"TP19","n":"Ớt túi 100g","b":null,"m":[["VT021",1.0],["VT013",1.0]]},"ot|1000":{"c":"TP20","n":"Ớt túi 1kg","b":null,"m":[["VT023",1.0],["VT053",1.0]]},"san|250":{"c":"TP21","n":"Sắn hộp 250g","b":30,"m":[["VT025",1.0],["VT011",1.0]]},"csen|200":{"c":"TP23","n":"Củ sen 200g","b":null,"m":[["VT056",1.0],["VT012",1.0]]},"san|1000":{"c":"TP25","n":"Sắn túi 1kg","b":null,"m":[["VT023",1.0],["VT058",1.0]]},"ctu|250":{"c":"TP26","n":"Củ từ 250g","b":null,"m":[["VT019",1.0],["VT057",1.0]]},"daut|1000":{"c":"TP27","n":"Dâu tây đông lạnh 1kg","b":null,"m":[["VT023",1.0]]}},"thung":[["VT039",1.0],["VT037",1.0]]};
const vtc=()=>cfg().vt||VT0;
const vtName=ma=>{const c=vtc().cat[ma];return c?c.n:ma};
function vtNeed(it,rows){const V=vtc(),need=new Map(),add=(ma,q)=>need.set(ma,(need.get(ma)||0)+q);let box=0;
  for(const r of rows){if(!r.g)continue;const k=it.id+'|'+r.g,sp=V.sp[k];if(!sp)continue;for(const [ma,dm] of sp.m)add(ma,r.q*dm);const b=sp.b||PERBOX[k];if(b)box+=Math.ceil(r.q/b)}
  if(box)for(const [ma,dm] of V.thung||[])add(ma,box*dm);return {need,box}}
/* v122: thành phẩm dự tính (nhiều quy cách) → đề xuất NVL, nhân công, vật tư */
const tpPacks=it=>(it.packs||[]).map(p=>gOf(p[0],p[1])).filter(g=>g>0);
function ensurePl(f){const it=itemOf(f.item),P=tpPacks(it);if(!Array.isArray(f.pl)||!f.pl.length||f.pl.some(r=>r.g&&!P.includes(+r.g)))f.pl=[{g:P[0]||0,q:''}];return f.pl}
const plRows=f=>(f.pl||[]).filter(r=>num(r.q)>0).map(r=>({g:+r.g||0,q:num(r.q)}));
const plKg=rows=>rows.reduce((s,r)=>s+(r.g?r.q*r.g/1000:r.q),0);
const plTxt=rows=>rows.map(r=>r.g?packLabel(r.g)+' × '+fm(r.q)+' gói':fm(r.q)+' kg').join(', ');
function planBox(f){const it=itemOf(f.item);if(!it||!it.id)return '';const P=tpPacks(it);ensurePl(f);
  return `<div class="sec">Thành phẩm dự tính sản xuất</div>${f.pl.map((r,i)=>`<div class="qc"><div class="qcr" style="grid-template-columns:1.2fr 1fr"><label><span class="lb">Quy cách</span><select data-pl="${i}" data-plk="g">${P.map(g=>`<option value="${g}"${+r.g===g?' selected':''}>Gói ${packLabel(g)}</option>`).join('')}<option value="0"${!+r.g?' selected':''}>Hàng rời (kg)</option></select></label>
   <label><span class="lb">${+r.g?'Số gói':'Số kg'}</span><input data-pl="${i}" data-plk="q" value="${esc(r.q)}" inputmode="${+r.g?'numeric':'decimal'}" placeholder="0"></label></div>${f.pl.length>1?`<div class="qck"><span></span><button class="lnk" data-plrm="${i}">✕ Bỏ dòng</button></div>`:''}</div>`).join('')}
   <button class="addb" id="plAdd">＋ Thêm quy cách</button>`}
function sugHTML(f){const it=itemOf(f.item);if(!it||!it.id)return '';const dm=it.dm||{},a=num(f.kgIn),rows=plRows(f),gc=cfg().gioCong||8;
  const H='<div class="sec">Đề xuất vật tư, nhân công</div>';
  let tp=plKg(rows),src='dt';
  if(!tp){if(!a)return H+`<div class="auto">Gõ thành phẩm dự tính (số gói) hoặc số kg nguyên liệu – app đề xuất nguyên liệu, nhân công, vật tư cần chuẩn bị.</div>`;
    if(!dm.tl)return H+`<div class="auto">${esc(it.name)} chưa có định mức tỷ lệ thành phẩm – gõ thành phẩm dự tính, hoặc Quản lý nhập tỷ lệ ở tab Định mức.</div>`;
    tp=a*dm.tl/100;src='nvl';const g=tpPacks(it)[0];if(g)rows.push({g,q:Math.floor(tp*1000/g)})}
  const cong=dm.cong100?tp*dm.cong100/100:0,ng=cong?Math.ceil(cong-0.05):0;
  let t=`<tr><td>Thành phẩm ${src==='dt'?'dự tính':'dự kiến'}</td><td><b>${fm(tp)} kg</b>${src==='nvl'?` <span class="muted">(tỷ lệ ${fm(dm.tl,1)}%)</span>`:''}</td></tr>`;
  if(src==='dt'){if(dm.tl){const need=tp/(dm.tl/100);t+=`<tr><td>Nguyên liệu cần</td><td><b>${fm(Math.ceil(need))} kg</b> <span class="muted">(tỷ lệ ${fm(dm.tl,1)}%)</span>${a?`<br>${a+0.5>=need?'<span style="color:var(--good)">đủ – đưa vào '+fm(a)+' kg</span>':'<span style="color:var(--bad)">thiếu '+fm(Math.ceil(need-a))+' kg so với '+fm(a)+' kg đưa vào</span>'}`:''}</td></tr>`}
}
  t+=cong?`<tr><td>Nhân công</td><td><b>${fm(cong,1)} công</b> ≈ ${ng} người × ${gc} giờ</td></tr>`:'';
  const V=vtNeed(it,rows);for(const [ma,q] of V.need){const c=vtc().cat[ma]||{},u=(c.u||'').trim();const isKg=/^kg$/i.test(u)&&c.pk;
    t+=`<tr><td>${esc(vtName(ma))}<div class="tiny muted">${ma}</div></td><td><b>${fm(Math.ceil(q))}</b> ${isKg?'cái':esc(u.toLowerCase()||'cái')}${isKg?`<br><span class="muted">≈ ${fm(q/c.pk,1)} kg</span>`:''}</td></tr>`}
  if(V.box)t+=`<tr><td>Số thùng đóng</td><td><b>${fm(V.box)}</b> thùng</td></tr>`;
  return H+`<div class="card sug"><table class="gt">${t}</table><div class="tiny muted" style="margin-top:6px">Theo định mức · thêm 3–5% dự phòng hỏng túi, tem.</div></div>`}

/* ---------------- TỒN KHO (tính lại từ toàn bộ phiếu) ---------------- */
function calc(upto){const L=liveLogs().filter(l=>!upto||l.date<=upto).slice().sort((a,b)=>(a.date+String(a.at).padStart(15,'0')).localeCompare(b.date+String(b.at).padStart(15,'0')));
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
function tabsDef(){const t=[['home','Làm việc','🏠'],['stock','Tồn kho','📦'],['list','Đã nhập','🕘']];if(isAdmin())t.push(['nc','Nhân công','👷'],['dm','Định mức','📐'],['gt','Giá thành','💰']);else if(xw()==='ch'&&isApprover())t.push(['dm','Định mức','📐']);return t}
function render(){const v=$('#view');
  if(!S.ready){v.innerHTML='<div class="empty">Đang tải…</div>';return}
  const r=role();try{document.title=xw()==='ch'?'VIBA Xưởng chuối':'VIBA Nhà máy'}catch(e){}
  $('#who').innerHTML=`<span class="chip g">${r==='admin'?'Quản lý':r==='sx'?'Sản xuất':'Chưa phân quyền'}</span><span>${esc(nameOf(S.uid))}</span>${window.vibaChangePw?'<button class="btn sm" onclick="vibaChangePw()">Đổi MK</button>':''}<button class="btn sm" onclick="vibaLogout()">Đăng xuất</button>`;
  if(!canUse()){$('#tabbar').hidden=true;v.innerHTML=`<h1 class="big">Xin chào</h1><div class="card stack"><div style="font-weight:700">Tài khoản chưa có quyền Sản xuất</div><div class="muted">Nhờ Quản lý gán vai trò <b>Sản xuất</b> trong Cài đặt › Nhân viên.${r&&r!=='sx'?' Bạn đang dùng app bán hàng – <a href="index.html">mở app bán hàng</a>.':''}</div></div>`;return}
  const T=tabsDef();if(!T.some(t=>t[0]===S.tab))S.tab='home';
  $('#tabs').innerHTML=T.map(([k,l,i])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}"><span style="font-size:20px;line-height:1">${i}</span><span>${l}</span></button>`).join('');$('#tabbar').hidden=false;
  $$('#tabs [data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;S.form=null;S.post=null;render();scrollTo(0,0)});
  if(isAdmin())$('#modeSw').innerHTML='<a class="btn sm" href="quanly.html">↩ App bán hàng</a>';
  if(S.form)return S.form.kind==='ckh'?viewPlan(v):CORDER.includes(S.form.kind)?viewFormCh(v):viewForm(v);
  if(S.post&&S.tab==='home')return viewPost(v);
  const ch=xw()==='ch';({home:ch?viewHomeCh:viewHome,stock:ch?viewStockCh:viewStock,list:viewList,nc:viewNC,dm:ch?viewDMCh:viewDM,gt:ch?viewGTCh:viewGT})[S.tab](v);
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
  const td=liveLogs().filter(l=>!isCh(l)&&l.date===today());
  v.innerHTML=`${xwSeg()}<h1 class="big" style="margin-bottom:10px">Hôm nay ${dmy(today())}</h1>${KORDER.map(btn).join('')}
   <div class="sec">Hàng đang có</div><div class="group">${rows.join('')||'<div class="empty">Chưa có hàng tồn.</div>'}</div>
   <div class="sec">Đã nhập hôm nay (${td.length})</div><div class="group">${td.slice().sort((a,b)=>b.at-a.at).map(logRow).join('')||'<div class="empty">Chưa có phiếu nào hôm nay.</div>'}</div>`;
  $$('.sxbig').forEach(b=>b.onclick=()=>openForm(b.dataset.k));bindLogRows();bindXw()}
function xwSeg(){if(!isAdmin())return `<div class="auto" style="margin-bottom:8px">${xw()==='ch'?'🍌 App Xưởng chuối':'🏭 App Nhà máy'}</div>`;return `<div class="opt" style="margin-bottom:12px">${[['nm','🏭 Nhà máy'],['ch','🍌 Xưởng chuối']].map(([k,l])=>`<button data-xw="${k}" class="${xw()===k?'on':''}">${l}</button>`).join('')}</div>`}
function bindXw(){$$('[data-xw]').forEach(b=>b.onclick=()=>{setXw(b.dataset.xw);S.form=null;render();scrollTo(0,0)})}
function logSum(l){if(isCh(l))return logSumCh(l);const it=itemOf(l.item).name;
  if(l.kind==='nvl')return `${esc(nvlOf(nvlId(l)).name)} · ${esc(l.ncc||'')} · ${fm(l.kg)} kg${l.price?' × '+fm(l.price)+' đ':''} · lô ${esc(l.lot||'')}`;
  if(l.kind==='sx')return `${esc(nvlOf(nvlId(l)).name)} → ${it} · ${fm(l.kgIn)} kg vào${(l.plan||[]).length?' · dự tính '+plTxt(l.plan):''}${l.bags?' → '+fm(l.bags)+' bịch × '+fm(l.bagW)+' kg':''}`;
  if(l.kind==='dg'||l.kind==='dgl')return `${it} · ${(l.packs||[]).map(p=>fm(p.q)+' × '+packLabel(p.g)).join(', ')} = ${fm(l.kgTP)} kg TP`;
  if(l.kind==='xuat')return `→ ${DEST[l.dest]||l.dest} · ${(l.lines||[]).map(x=>x.t==='tp'?itemOf(x.item).name+' '+packLabel(x.g)+' × '+fm(x.q):itemOf(x.item).name+' '+fm(x.kg)+' kg'+(x.bags?' ('+fm(x.bags)+' bịch)':'')).join(', ')}`;
  return ''}
function logRow(l){return `<div class="row tap" data-lid="${esc(l.id)}"><div class="grow"><div class="t"><span class="chip" style="background:${KIND[l.kind].c};color:#fff">${KIND[l.kind].n}</span>${isCh(l)?' 🍌':''} ${dmy(l.date)}${l.deleted?' <span class="chip r">Đã xoá</span>':''}</div><div class="s ell">${logSum(l)}</div><div class="tiny muted">👷 ${hTxt(l)} · ${esc(nameOf(l.by))}</div></div><span class="chev">›</span></div>`}
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
     ${inp(f,'kgIn','Nguyên liệu đưa vào (kg)','0')}${it.bich?`<div class="grid2">${inp(f,'bags','Số bịch lớn (nếu có)','0','numeric')}${inp(f,'bagW','Trọng lượng 1 bịch (kg)','VD: 25')}</div>`:''}<div class="auto" id="calcBox"></div>${planBox(f)}<div id="sugBox">${sugHTML(f)}</div>`}
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
  $$('[data-f]').forEach(el=>{const k=el.dataset.f;const h=()=>{f[k]=el.type==='checkbox'?el.checked:el.value;if(k==='item'){f.packs=packsDefault(el.value);f.q={};f.pl=null;render()}else if(k==='nvl'){const t=tpsOfNvl(el.value)[0];f.item=t?t.id:'';f.ncc='';f.nccQ='';f.packs=packsDefault(f.item);f.pl=null;render()}else if(k==='ncc'||k==='date'||k==='xe')render();else upd()};el.oninput=h;el.onchange=h});
  $$('[data-p]').forEach(el=>{const h=()=>{f.packs[+el.dataset.p][el.dataset.pk]=el.value;upd()};el.oninput=h;el.onchange=h});
  $$('[data-pl]').forEach(el=>{const k=el.dataset.plk;if(k==='g')el.onchange=()=>{f.pl[+el.dataset.pl].g=+el.value;render()};else{const h=()=>{f.pl[+el.dataset.pl].q=el.value;upd()};el.oninput=h;el.onchange=h}});
  $$('[data-plrm]').forEach(b=>b.onclick=()=>{f.pl.splice(+b.dataset.plrm,1);render()});
  const pla=$('#plAdd');if(pla)pla.onclick=()=>{const P=tpPacks(itemOf(f.item)),used=new Set(f.pl.map(r=>+r.g));f.pl.push({g:P.find(g=>!used.has(g))||0,q:''});render()};
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
function upd(){if(S.form&&CORDER.includes(S.form.kind))return updCh();const f=S.form,C=calc(),it=itemOf(f.item);const lt=$('#lbTot');if(lt){const t=num(f.hours),o=num(f.ot),gc=cfg().gioCong||8;lt.innerHTML=t||o?'Chính thức: <b>'+fm(num(f.people))+' người · '+fm(t)+' giờ</b> ('+fm(t/gc,2)+' công)'+(o||num(f.pot)?'<br>Tăng ca: <b>'+fm(num(f.pot))+' người · '+fm(o)+' giờ</b> ('+fm(o/gc,2)+' công)':''):'Tổng số giờ = cộng giờ của cả nhóm (VD 5 người × 8 giờ = 40). Tăng ca ghi riêng số người và tổng giờ tăng ca.'}
  f.packs.forEach((p,i)=>{const e=$('#pk'+i);if(e){const g=gOf(p.w,p.u),q=num(p.q);e.textContent=g&&q?'= '+fm(g*q/1000)+' kg':''}});
  const sb=$('#sugBox');if(sb&&f.kind==='sx')sb.innerHTML=sugHTML(f);
  const cb=$('#calcBox');if(!cb)return;
  if(f.kind==='nvl'){const n=nccPick(f),kg=num(f.kg),p=num(f.price),sh=num(f.ship);cb.innerHTML=(kg&&p?`Tiền hàng ${fm(kg)} × ${fm(p)} = ${fm(kg*p)}${sh?'<br>+ Vận chuyển '+fm(sh):''}<br>Giá lô: <b>${fm((kg*p+sh)/kg)} đ/kg</b> · `:'Gõ kg và giá nhập để tính giá lô · ')+`Số lô <b>${esc(lotCode(n.lot||n.code,f.date))}</b>`}
  else if(f.kind==='sx'){const a=num(f.kgIn),bw=num(f.bags)*num(f.bagW),av=nvlLeft(C,f.nvl);cb.innerHTML=`Nguyên liệu còn tồn: <b>${fm(av)} kg</b>${a>av+0.001?' <span style="color:var(--bad)">(đưa vào nhiều hơn tồn)</span>':''}<br>Không cần cân bán thành phẩm – tỷ lệ thành phẩm app tính từ kg đóng gói ở bước ③ / ⑤.`+(bw?`<br>Bịch: ${fm(num(f.bags))} × ${fm(num(f.bagW))} kg = <b>${fm(bw)} kg</b>`:'')}
  else{const kg=packsKg(f),src=f.kind==='dg'?C.btp.get(f.item):C.kd.get(f.item);const use=useKg(f,src);
    cb.innerHTML=kg?`Thành phẩm <b>${fm(kg)} kg</b>${use?' · từ '+fm(use)+' kg ('+fm(kg/use*100,1)+'%)':''}${it.dm&&it.dm.baoBi?'<br>Túi, tem: tự trừ theo số gói':''}`:'Gõ trọng lượng, chọn g/kg và số gói.'}}
function nccPick(f){if(f.ncc==='__new'){const n=String(f.nccNew||'').trim();return {name:n,code:'',lot:autoCode(n),fresh:true}}const nm=f.ncc||String(f.nccQ||'').trim();const x=(cfg().ncc||[]).find(n=>n.name===nm);return x?{name:x.name,code:x.code||'',lot:x.lot||autoCode(x.name)}:{name:nm,code:'',lot:autoCode(nm),fresh:!!nm}}
function autoCode(n){const w=noAcc(n).toUpperCase().replace(/[^A-Z ]/g,'').split(/\s+/).filter(Boolean);if(!w.length)return 'NCC';return (w.length>=3?w.slice(-3).map(x=>x[0]).join(''):w.length===2?w[0][0]+w[1].slice(0,2):w[0].slice(0,3)).padEnd(3,'X')}
function lotCode(code,date){const base=(code||'NCC')+date.slice(8,10)+date.slice(5,7);const used=new Set(liveLogs().filter(l=>l.kind==='nvl'||l.kind==='cnx').map(l=>l.lot));if(!used.has(base))return base;for(let i=2;i<50;i++)if(!used.has(base+'-'+i))return base+'-'+i;return base+'-'+Date.now()%1000}
function newId(date){return 'P'+date.replace(/-/g,'').slice(2)+'-'+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)}
async function save(){const f=S.form,C=calc(),it=itemOf(f.item),msg=t=>$('#fMsg').innerHTML='<div class="alert r">'+esc(t)+'</div>';
  const people=num(f.people),hours=num(f.hours),ot=num(f.ot),pot=num(f.pot);
  if(!f.date)return msg('Chọn ngày.');if(f.date>today())return msg('Ngày không được sau hôm nay.');
  const d={kind:f.kind,date:f.date,people,hours,pot,ot,hv:2,note:String(f.note||'').trim(),by:S.uid,at:Date.now()};
  if(f.kind==='nvl'){if(!f.nvl)return msg('Chọn nguyên liệu.');d.nvl=f.nvl}
  else if(f.kind!=='xuat'){if(!f.item)return msg('Chọn mặt hàng.');d.item=f.item;if(f.kind==='sx')d.nvl=f.nvl}
  if(f.kind==='nvl'){const n=nccPick(f);if(!n.name)return msg('Chọn nhà cung cấp.');const kg=num(f.kg);if(kg<=0)return msg('Gõ số kg nhận.');const price=num(f.price),ship=num(f.ship);if(price<=0&&!await ask('Chưa gõ giá nhập. Vẫn lưu (kế toán điền sau)?'))return;Object.assign(d,{ncc:n.name,nccCode:n.code,kg,price,ship,lot:lotCode(n.lot,f.date)});
    if(n.fresh){const c=JSON.parse(JSON.stringify(cfg()));c.ncc.push({name:n.name,code:'',lot:n.lot,fresh:true,by:S.uid});try{await S.db.doc('mcfg/main').set(c)}catch(e){}}}
  else if(f.kind==='sx'){const a=num(f.kgIn);if(a<=0)return msg('Gõ số kg nguyên liệu đưa vào.');const bg=num(f.bags),bw=num(f.bagW);if(bg&&!bw)return msg('Gõ trọng lượng 1 bịch.');Object.assign(d,{kgIn:a,kgOut:r3(bg*bw),bags:bg,bagW:bw,plan:plRows(f)})}
  else if(f.kind==='dg'||f.kind==='dgl'){const packs=[];for(const p of f.packs){const g=gOf(p.w,p.u),q=num(p.q);if(!g&&!q)continue;if(!g)return msg('Có dòng chưa gõ trọng lượng.');if(!q)return msg('Có dòng chưa gõ số gói.');packs.push({g,q})}
    if(!packs.length)return msg('Gõ ít nhất 1 quy cách và số gói.');const kgTP=r3(packs.reduce((s,p)=>s+p.g*p.q/1000,0));const src=f.kind==='dg'?C.btp.get(f.item):C.kd.get(f.item);
    const bu=num(f.bagsUse);if(it.bich&&bu&&!num(f.bagW)&&!(src&&src.bags>0))return msg('Gõ trọng lượng 1 bịch.');let use=useKg(f,src);if(!use)use=kgTP;
    if(src&&!(f.kind==='dg'&&src.kg<=0.001)&&use>src.kg+0.5&&!await ask(`Dùng ${fm(use)} kg nhưng ${f.kind==='dg'?'nhà máy':'kho đông'} chỉ còn ${fm(src.kg)} kg. Vẫn lưu?`))return;
    if(use<kgTP*0.95&&!await ask(`Thành phẩm ${fm(kgTP)} kg lớn hơn số dùng ${fm(use)} kg. Vẫn lưu?`))return;
    Object.assign(d,{packs,kgTP,kgUse:use,bagsUse:bu,bagW:num(f.bagW)||(bu?r3(use/bu):0)});if(f.kind==='dgl')d.xe=xeVal(f);
    const known=new Set((it.packs||[]).map(p=>gOf(p[0],p[1])));const fresh=packs.filter(p=>!known.has(p.g));if(fresh.length){const c=JSON.parse(JSON.stringify(cfg()));const ci=c.items.find(i=>i.id===f.item);if(ci){ci.packs=(ci.packs||[]).concat(fresh.map(p=>p.g>=1000?[r3(p.g/1000),'kg']:[p.g,'g']));try{await S.db.doc('mcfg/main').set(c)}catch(e){}}}}
  else if(f.kind==='xuat'){const lines=[];
    if(f.xt==='tp'){for(const [k,q0] of C.tp.entries()){const q=num(f.q[k]);if(!q)continue;if(q>q0+1e-9&&!await ask(`${itemOf(k.split('|')[0]).name} ${packLabel(+k.split('|')[1])}: xuất ${fm(q)} nhưng chỉ có ${fm(q0)}. Vẫn lưu?`))return;const [id,g]=k.split('|');lines.push({t:'tp',item:id,g:+g,q})}}
    else{for(const i of items()){const kg=num(f.q['k|'+i.id]),bags=num(f.q['b|'+i.id]);if(!kg&&!bags)continue;const b=C.btp.get(i.id);let k2=kg;if(!k2&&bags&&b&&b.bags>0)k2=r3(bags*b.kg/b.bags);if(!k2)return msg('Gõ số kg '+i.name+'.');lines.push({t:'btp',item:i.id,kg:k2,bags})}}
    if(!lines.length)return msg('Gõ số lượng xuất.');Object.assign(d,{dest:f.dest,lines,xe:xeVal(f)});
    if(f.xt==='tp'&&f.dest==='hn'&&f.mau){const rest=[],its=new Set(lines.map(x=>x.item));for(const [k,q0] of C.tp.entries()){if(!its.has(k.split('|')[0]))continue;const q=q0-num(f.q[k]);if(q>0){const [id,g]=k.split('|');rest.push({t:'tp',item:id,g:+g,q})}}if(rest.length)d.mauLines=rest}}
  if(ot&&!pot)return msg('Gõ số người tăng ca.');if(!people||!(hours||ot)){if(!await ask('Chưa ghi số người / tổng số giờ làm. Vẫn lưu?'))return}
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
  if(isCh(l))det+=detCh(l);
  if(l.kind==='sx'){const u=C.use.get(l.id)||[];det+=`<div class="tiny muted" style="margin-top:4px">Lô đã dùng: ${u.map(x=>esc(x.lot)+' '+fm(x.kg)+' kg').join(' · ')||'—'}</div>`}
  if(l.xe)det+=`<div class="tiny muted">Xe: ${esc(l.xe)}</div>`;if(l.note)det+=`<div class="tiny">📝 ${esc(l.note)}</div>`;
  if(l.edits&&l.edits.length)det+=`<div class="tiny muted" style="margin-top:4px">Đã sửa: ${l.edits.map(e=>esc(nameOf(e.by))+' '+new Date(e.at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})+' ('+esc(e.what)+')').join('; ')}</div>`;
  let ed='';if(canEdit&&!l.deleted){ed=`<div class="sec">Nhân công</div><div class="grid2"><label class="f"><span class="lab">Số người</span><input id="eP" value="${fm(l.people)}" inputmode="numeric"></label></div><div class="grid2"><label class="f"><span class="lab">Tổng số giờ làm</span><input id="eH" value="${String(HW(l)||'').replace('.',',')}" inputmode="decimal"></label></div><div class="grid2"><label class="f"><span class="lab">Số người tăng ca</span><input id="ePo" value="${num(l.pot)?fm(l.pot):''}" inputmode="numeric"></label><label class="f"><span class="lab">Tổng giờ tăng ca</span><input id="eO" value="${String(HO(l)||'').replace('.',',')}" inputmode="decimal"></label></div>`;
    if((l.kind==='nvl'||l.kind==='cnx')&&adm)ed+=`<div class="sec">Giá mua (kế toán điền theo phiếu MISA)</div><div class="grid2"><label class="f"><span class="lab">Đơn giá (đ/kg)</span><input id="ePr" value="${l.price?fm(l.price):''}" inputmode="decimal"></label><label class="f"><span class="lab">Vận chuyển (đ)</span><input id="eSh" value="${l.ship?fm(l.ship):''}" inputmode="decimal"></label></div><label class="f"><span class="lab">Chi phí khác (đ)</span><input id="eEx" value="${l.extra?fm(l.extra):''}" inputmode="decimal"></label><label class="f"><span class="lab">Số phiếu MISA</span><input id="eMs" value="${esc(l.misa||'')}"></label>`;
    ed+=`<div id="eMsg"></div><button class="btn block pri" id="eSave">Lưu thay đổi</button><button class="btn block" id="eDel" style="color:var(--bad)">Xoá phiếu</button>`}
  const close=sheet(`${KIND[l.kind].n} · ${dmy(l.date)}`,`${det}<div class="tiny muted" style="margin-top:6px">Người nhập: ${esc(nameOf(l.by))} · ${new Date(l.at).toLocaleString('vi-VN')}</div>${ed}`);
  if(!ed)return;
  $('#eSave').onclick=async()=>{const p={people:num($('#eP').value),hours:num($('#eH').value),ot:num($('#eO').value),pot:num($('#ePo').value),hv:2};const what=[];if(p.people!==num(l.people)||p.hours!==HW(l)||p.ot!==HO(l)||p.pot!==num(l.pot))what.push('công '+hTxt(l)+' → '+hTxt(p));
    if($('#ePr')){p.price=num($('#ePr').value);p.extra=num($('#eEx').value);p.ship=num($('#eSh').value);p.misa=$('#eMs').value.trim();if(p.price!==num(l.price)||p.extra!==num(l.extra)||p.ship!==num(l.ship))what.push('giá')}
    if(what.length)p.edits=(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:what.join(', ')}]);
    try{await S.db.doc('mlog/'+l.id).update(p);toast('✓ Đã lưu');close()}catch(e){$('#eMsg').innerHTML='<div class="alert r">Chưa lưu được.</div>'}};
  $('#eDel').onclick=async()=>{if(!await ask('Xoá phiếu này? (Phiếu được đánh dấu đã xoá, Quản lý vẫn xem lại được.)'))return;try{await S.db.doc('mlog/'+l.id).update({deleted:true,edits:(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:'xoá'}])});toast('Đã xoá phiếu');close()}catch(e){toast('Chưa xoá được')}}}

/* ---------------- TỒN KHO ---------------- */
function viewStock(v){const C=calc();let h='<h1 class="big">Tồn kho</h1>';
  const nv=nvls().map(i=>{const L=(C.lots.get(i.id)||[]).filter(x=>x.left>0.001);return L.length?`<div class="row"><div class="grow"><div class="t">${esc(i.name)} · ${fm(nvlLeft(C,i.id))} kg</div><div class="s">${L.map(x=>esc(x.lot)+' ('+dmy(x.date)+') '+(x.th?fm(x.thLeft)+' thùng · ':'')+fm(x.left)+' kg').join(' · ')}</div></div></div>`:''}).join('');
  const bt=items().map(i=>{const b=C.btp.get(i.id);return b&&b.kg>0.001?`<div class="row"><div class="grow t">${esc(i.name)}</div><div class="num">${fm(b.kg)} kg${b.bags?' · '+fm(b.bags)+' bịch':''}</div></div>`:''}).join('');
  const kd=items().map(i=>{const b=C.kd.get(i.id);return b&&Math.abs(b.kg)>0.001?`<div class="row"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">${b.since?'gửi từ '+dmy(b.since)+' · '+Math.round((new Date(today())-new Date(b.since))/864e5)+' ngày':''}</div></div><div class="num">${fm(b.kg)} kg${b.bags?' · '+fm(b.bags)+' bịch':''}</div></div>`:''}).join('');
  const tp=[...C.tp.entries()].filter(([k,q])=>Math.abs(q)>1e-9).sort().map(([k,q])=>{const [id,g]=k.split('|');return `<div class="row"><div class="grow t">${esc(itemOf(id).name)} ${packLabel(+g)}</div><div class="num" style="${q<0?'color:var(--bad)':''}">${fm(q)} gói</div></div>`}).join('');
  h+=`<div class="sec">Nguyên liệu (theo lô)</div><div class="group">${nv||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">Bán thành phẩm ở nhà máy</div><div class="group">${bt||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">❄️ Kho đông thuê</div><div class="group">${kd||'<div class="empty">Không có.</div>'}</div>
   <div class="sec">Thành phẩm ở nhà máy</div><div class="group">${tp||'<div class="empty">Không có.</div>'}</div>`;
  v.innerHTML=h}

/* ---------------- ĐÃ NHẬP ---------------- */
function viewList(v){const n=S.ui.lp;const from=n==='all'?'0000':addDays(today(),-(+n-1));const L=modeLogs(S.logs).filter(l=>l.date>=from&&(isAdmin()||!l.deleted)).sort((a,b)=>(b.date+String(b.at)).localeCompare(a.date+String(a.at)));
  v.innerHTML=`<h1 class="big">Đã nhập${xw()==='ch'?' · Xưởng chuối':''}</h1>${xw()==='ch'?'':`<div class="card" style="margin-bottom:12px"><div class="t" style="margin-bottom:8px">📄 Báo cáo sản xuất thực tế</div><div class="grid2"><label class="f"><span class="lab">Từ ngày</span><input type="date" id="rpF" value="${S.ui.rpF||today()}" max="${today()}"></label><label class="f"><span class="lab">Đến ngày</span><input type="date" id="rpT" value="${S.ui.rpT||today()}" max="${today()}"></label></div><button class="btn block pri" id="rpGo">Xem báo cáo</button></div>`}<div class="opt" style="margin-bottom:10px">${[['1','Hôm nay'],['7','7 ngày'],['31','31 ngày'],['all','Tất cả']].map(([k,l])=>`<button data-lp="${k}" class="${n===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="group">${L.map(logRow).join('')||'<div class="empty">Không có phiếu.</div>'}</div>`;
  $$('[data-lp]').forEach(b=>b.onclick=()=>{S.ui.lp=b.dataset.lp;render()});bindLogRows();
  if($('#rpGo'))$('#rpGo').onclick=()=>{const f=$('#rpF').value,t=$('#rpT').value;if(!f||!t||f>t)return toast('Chọn lại khoảng ngày');S.ui.rpF=f;S.ui.rpT=t;openReport(f,t)}}

/* ---------------- v120: BÁO CÁO SẢN XUẤT THỰC TẾ ---------------- */
const dmyY=d=>d?d.split('-').reverse().join('/'):'';
function reportData(from,to){const L=liveLogs().filter(l=>!isCh(l)&&l.date>=from&&l.date<=to).sort((a,b)=>(a.date+String(a.at).padStart(15,'0')).localeCompare(b.date+String(b.at).padStart(15,'0')));
  const gc=cfg().gioCong||8,adm=isAdmin();
  const nvl=L.filter(l=>l.kind==='nvl').map(l=>{const kg=num(l.kg),tien=kg*num(l.price)+num(l.ship)+num(l.extra);return {date:l.date,nvl:nvlOf(nvlId(l)).name,ncc:l.ncc||'',lot:l.lot||'',kg,price:num(l.price),ship:num(l.ship)+num(l.extra),tien:num(l.price)?tien:null}});
  const P=new Map(),Pg=id=>{if(!P.has(id))P.set(id,{id,kgIn:0,kgTP:0,packs:new Map(),h:0,ho:0,pp:0,po:0,days:new Set()});return P.get(id)};
  const S5=new Map(KORDER.map(k=>[k,{n:0,people:0,h:0,pot:0,ho:0}]));
  for(const l of L){const st=S5.get(l.kind);if(st){st.n++;st.people+=num(l.people);st.h+=HW(l);st.pot+=num(l.pot);st.ho+=HO(l)}
    if(l.kind==='nvl'||l.kind==='xuat')continue;const x=Pg(tpId(l.item));x.h+=HW(l);x.ho+=HO(l);x.days.add(l.date);
    if(l.kind==='sx'){x.kgIn+=num(l.kgIn);x.kgPlan=(x.kgPlan||0)+plKg(l.plan||[])}
    if(l.kind==='dg'||l.kind==='dgl'){x.kgTP+=num(l.kgTP);for(const p of l.packs||[])x.packs.set(p.g,(x.packs.get(p.g)||0)+num(p.q))}}
  const prod=[...P.values()].filter(x=>x.kgIn||x.kgTP||x.h||x.ho).map(x=>{const it=itemOf(x.id),dm=it.dm||{};const cong=(x.h+x.ho)/gc;
    return {...x,name:it.name,tl:x.kgIn&&x.kgTP?x.kgTP/x.kgIn*100:null,tlDm:dm.tl||null,cong,c100:x.kgTP?cong/x.kgTP*100:null,c100Dm:dm.cong100||null,packTxt:[...x.packs.entries()].sort((a,b)=>a[0]-b[0]).map(([g,q])=>packLabel(g)+': '+fm(q)+' gói').join('; ')}});
  const xuat=[];for(const l of L.filter(l=>l.kind==='xuat'))for(const x of l.lines||[])xuat.push({date:l.date,dest:DEST[l.dest]||l.dest,xe:l.xe||'',name:itemOf(x.item).name,qc:x.t==='tp'?packLabel(x.g):'Bán thành phẩm',q:x.t==='tp'?num(x.q):null,kg:x.t==='tp'?r3(num(x.q)*x.g/1000):num(x.kg),bags:num(x.bags)});
  const C=calc(to);
  const tonNvl=[];for(const n of nvls())for(const lt of (C.lots.get(n.id)||[]).filter(z=>z.left>0.001))tonNvl.push({name:n.name,lot:lt.lot,kg:lt.left});
  const tonKd=items().map(i=>({name:i.name,b:C.kd.get(i.id)})).filter(z=>z.b&&z.b.kg>0.001).map(z=>({name:z.name,kg:z.b.kg,bags:z.b.bags,since:z.b.since}));
  const tonTp=[...C.tp.entries()].filter(([k,q])=>q).map(([k,q])=>{const [id,g]=k.split('|');return {name:itemOf(id).name,qc:packLabel(+g),q,kg:r3(q*g/1000)}});
  return {from,to,adm,gc,nvl,prod,S5,xuat,tonNvl,tonKd,tonTp,gt:adm?costs(from,to):null}}
function reportHTML(D){const T=(h,rows,tot,cls)=>`<table${cls?' class="'+cls+'"':''}><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${h.length}" class="em">Không phát sinh trong kỳ</td></tr>`}</tbody>${tot?`<tfoot>${tot}</tfoot>`:''}</table>`;
  const td=(v,n)=>`<td${n?' class="n"':''}>${v==null||v===''?'':v}</td>`,N=(v,d)=>v==null?'':fm(v,d||0);
  const kp=(a,b)=>a==null?'':b?`<span class="${a>=b*0.97?'ok':'bd'}">${fm(a,1)}%</span>`:fm(a,1)+'%';
  const kc=(a,b)=>a==null?'':b?`<span class="${a<=b*1.05?'ok':'bd'}">${fm(a,2)}</span>`:fm(a,2);
  const per=D.from===D.to?'Ngày '+dmyY(D.from):'Từ '+dmyY(D.from)+' đến '+dmyY(D.to);
  // I
  const nv=D.nvl.map((x,i)=>`<tr>${td(i+1)}${td(dmyY(x.date))}${td(esc(x.nvl))}${td(esc(x.ncc))}${td(esc(x.lot))}${td(N(x.kg,1),1)}${D.adm?td(N(x.price),1)+td(N(x.ship),1)+td(x.tien==null?'<i>chưa có giá</i>':N(x.tien),1):''}</tr>`);
  const nvT=D.nvl.length?`<tr><td colspan="5">TỔNG CỘNG</td>${td(N(D.nvl.reduce((s,x)=>s+x.kg,0),1),1)}${D.adm?td('')+td(N(D.nvl.reduce((s,x)=>s+x.ship,0)),1)+td(N(D.nvl.reduce((s,x)=>s+(x.tien||0),0)),1):''}</tr>`:'';
  // II
  const pr=D.prod.map((x,i)=>`<tr>${td(i+1)}${td(esc(x.name))}${td(N(x.kgIn,1),1)}${td(x.kgPlan?N(x.kgPlan,1):'',1)}${td(N(x.kgTP,1),1)}${td(x.kgPlan?`<span class="${x.kgTP>=x.kgPlan*0.97?'ok':'bd'}">${fm(x.kgTP/x.kgPlan*100,1)}%</span>`:'',1)}${td(kp(x.tl,x.tlDm),1)}${td(x.tlDm?fm(x.tlDm,1)+'%':'',1)}${td(esc(x.packTxt))}</tr>`);
  const prT=D.prod.length?`<tr><td colspan="2">TỔNG CỘNG</td>${td(N(D.prod.reduce((s,x)=>s+x.kgIn,0),1),1)}${td(N(D.prod.reduce((s,x)=>s+(x.kgPlan||0),0),1),1)}${td(N(D.prod.reduce((s,x)=>s+x.kgTP,0),1),1)}<td></td><td></td><td></td><td></td></tr>`:'';
  // III
  const nc=D.prod.map((x,i)=>`<tr>${td(i+1)}${td(esc(x.name))}${td(N(x.h,1),1)}${td(N(x.ho,1),1)}${td(N(x.cong,2),1)}${td(kc(x.c100,x.c100Dm),1)}${td(x.c100Dm?fm(x.c100Dm,2):'',1)}</tr>`);
  const st=[...D.S5.entries()].filter(([k,v])=>v.n).map(([k,v])=>`<tr>${td(KORDER.indexOf(k)+1)}${td(KIND[k].n)}${td(v.n,1)}${td(N(v.people),1)}${td(N(v.h,1),1)}${td(N(v.pot),1)}${td(N(v.ho,1),1)}${td(N((v.h+v.ho)/D.gc,2),1)}</tr>`);
  const sv=[...D.S5.values()];const stT=st.length?`<tr><td colspan="2">TỔNG CỘNG</td>${td(sv.reduce((s,v)=>s+v.n,0),1)}${td(N(sv.reduce((s,v)=>s+v.people,0)),1)}${td(N(sv.reduce((s,v)=>s+v.h,0),1),1)}${td(N(sv.reduce((s,v)=>s+v.pot,0)),1)}${td(N(sv.reduce((s,v)=>s+v.ho,0),1),1)}${td(N(sv.reduce((s,v)=>s+v.h+v.ho,0)/D.gc,2),1)}</tr>`:'';
  // IV
  const xu=D.xuat.map((x,i)=>`<tr>${td(i+1)}${td(dmyY(x.date))}${td(esc(x.dest))}${td(esc(x.xe))}${td(esc(x.name))}${td(esc(x.qc))}${td(x.q==null?'':N(x.q),1)}${td(N(x.kg,1),1)}</tr>`);
  const xuT=D.xuat.length?`<tr><td colspan="6">TỔNG CỘNG</td>${td(N(D.xuat.reduce((s,x)=>s+(x.q||0),0)),1)}${td(N(D.xuat.reduce((s,x)=>s+x.kg,0),1),1)}</tr>`:'';
  // V
  const tn=D.tonNvl.map(x=>`<tr>${td('Nguyên liệu')}${td(esc(x.name))}${td(esc(x.lot))}${td('',1)}${td(N(x.kg,1),1)}</tr>`).concat(D.tonKd.map(x=>`<tr>${td('Kho đông thuê')}${td(esc(x.name))}${td(x.since?'gửi từ '+dmyY(x.since):'')}${td(x.bags?N(x.bags)+' bịch':'',1)}${td(N(x.kg,1),1)}</tr>`)).concat(D.tonTp.map(x=>`<tr>${td('Thành phẩm')}${td(esc(x.name))}${td(esc(x.qc))}${td(N(x.q)+' gói',1)}${td(N(x.kg,1),1)}</tr>`));
  // VI giá thành (Quản lý)
  let gt='';if(D.gt){const g=D.gt.filter(x=>x.kgTP);gt=`<h2>VI. GIÁ THÀNH THỰC TẾ <small>(chỉ Quản lý xem) · Đơn vị tính: đồng</small></h2>`+T(['STT','Sản phẩm','Kg TP','Nguyên liệu','Nhân công','Túi, tem, hộp','Chi phí khác','Tổng chi phí','Giá/kg TP*'],
    g.map((x,i)=>`<tr>${td(i+1)}${td(esc(itemOf(x.id).name))}${td(N(x.kgTP,1),1)}${td(N(x.nvl),1)}${td(N(x.lab),1)}${td(N(x.bb),1)}${td(N(x.oth),1)}${td('<b>'+N(x.tot)+'</b>',1)}${td(N(x.perKg),1)}</tr>`),
    g.length?`<tr><td colspan="2">TỔNG CỘNG</td>${td(N(g.reduce((s,x)=>s+x.kgTP,0),1),1)}${['nvl','lab','bb','oth','tot'].map(k=>td(N(g.reduce((s,x)=>s+x[k],0)),1)).join('')}<td></td></tr>`:'')+`<p class="nt">* Giá/kg TP chưa gồm túi, tem, hộp. Nhân công tính giờ tăng ca × ${fm(otK(),2)}; chi phí khác (điện ga, khấu hao, thùng, gửi kho) theo định mức. Lô nguyên liệu chưa có giá thì giá thành còn thiếu.</p>`}
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Báo cáo sản xuất ${D.from} – ${D.to}</title>
<style>@page{size:A4 landscape;margin:12mm}body{font-family:"Times New Roman",Times,serif;color:#0F1B29;margin:0;padding:16px;font-size:12.5pt;background:#fff}
.hd{display:flex;align-items:center;gap:16px;border-bottom:3px solid #1B69A3;padding-bottom:10px;margin-bottom:12px}.hd img{height:54px}.hd .co{font-size:10.5pt;color:#5F6D7D}.hd h1{margin:0;color:#1B69A3;font-size:16pt;letter-spacing:.3px}.hd .per{color:#5F6D7D;font-size:11pt}
h2{color:#1B69A3;font-size:13pt;margin:16px 0 6px}h2 small{color:#5F6D7D;font-weight:400;font-size:10.5pt}
table{border-collapse:collapse;width:100%;margin-bottom:4px;font-variant-numeric:tabular-nums}th{background:#1B69A3;color:#fff;font-weight:700;padding:5px 6px;border:1px solid #1B69A3;text-align:center;font-size:11.5pt}
td{border:1px solid #DBE3EC;padding:4px 6px;vertical-align:top}tbody tr:nth-child(even) td{background:#EAF2F9}tfoot td{background:#DCEAF5;font-weight:700}td.n{text-align:right;white-space:nowrap}td.em{text-align:center;color:#5F6D7D;font-style:italic}
.ok{color:#1F8A52;font-weight:700}.bd{color:#C0392B;font-weight:700}.nt{font-size:10.5pt;color:#5F6D7D;margin:2px 0 0}
.sig{display:flex;justify-content:space-around;margin-top:26px;text-align:center}.sig b{display:block}.sig i{color:#5F6D7D;font-size:10.5pt}.dt{text-align:right;font-style:italic;margin-top:18px}
.bar{position:sticky;top:0;background:#F1F4F8;padding:8px;margin:-16px -16px 12px;display:flex;gap:8px;font-family:"Be Vietnam Pro",system-ui,sans-serif}.bar button{border:0;border-radius:10px;padding:10px 14px;font-weight:700;font-size:14px;background:#1B69A3;color:#fff}.bar button.s{background:#fff;color:#1B69A3;border:2px solid #1B69A3}
@media print{.bar{display:none}body{padding:0}}</style></head><body>
<div class="bar"><button onclick="print()">In / Lưu PDF</button><button class="s" id="xl">Tải Excel</button><button class="s" onclick="close()">Đóng</button></div>
<div class="hd"><img src="${D.logo||'logo2.png'}" alt="VIBA FOOD"><div><div class="co">CÔNG TY TNHH NÔNG NGHIỆP VIBA – NHÀ MÁY</div><h1>BÁO CÁO SẢN XUẤT THỰC TẾ</h1><div class="per">${per} · Đơn vị tính: kg (trừ ghi chú khác)</div></div></div>
<h2>I. NHẬP NGUYÊN LIỆU${D.adm?' <small>· tiền: đồng</small>':''}</h2>${T(['STT','Ngày','Nguyên liệu','Nhà cung cấp','Số lô','Số kg'].concat(D.adm?['Giá nhập (đ/kg)','Vận chuyển + khác','Thành tiền']:[]),nv,nvT)}
<h2>II. SẢN XUẤT – ĐÓNG GÓI THEO SẢN PHẨM</h2>${T(['STT','Sản phẩm','Nguyên liệu đưa vào','Thành phẩm dự tính','Thành phẩm đóng gói','Đạt so với dự tính','Tỷ lệ TP thực tế','Tỷ lệ định mức','Số gói theo quy cách'],pr,prT)}<p class="nt">Thành phẩm = kg đóng gói ở bước ③ và ⑤. Tỷ lệ xanh: đạt từ 97% định mức trở lên; đỏ: thấp hơn. Nguyên liệu vào và thành phẩm đóng ra có thể khác ngày nên tỷ lệ chính xác hơn khi xem cả tuần/tháng.</p>
<h2>III. NHÂN CÔNG</h2>${T(['STT','Sản phẩm','Giờ chính thức','Giờ tăng ca','Tổng công','Công/100 kg TP thực tế','Công/100 kg định mức'],nc,'')}<p class="nt">1 công = ${D.gc} giờ. Nhập nguyên liệu và xuất hàng là công chung, xem bảng theo công đoạn. Công/100 kg xanh: không vượt 5% định mức; đỏ: vượt.</p>
${T(['STT','Công đoạn','Số phiếu','Số người chính thức','Giờ chính thức','Số người tăng ca','Giờ tăng ca','Tổng công'],st,stT)}<p class="nt">Số người là cộng theo từng phiếu (một người làm nhiều công đoạn được đếm nhiều lần).</p>
<h2>IV. XUẤT HÀNG</h2>${T(['STT','Ngày','Nơi nhận','Xe','Sản phẩm','Quy cách','Số gói','Số kg'],xu,xuT)}
<h2>V. TỒN CUỐI NGÀY ${dmyY(D.to)}</h2>${T(['Loại','Tên','Lô / quy cách','Số lượng','Số kg'],tn,'')}
${gt}
<div class="dt">………, ngày …… tháng …… năm ……</div>
<div class="sig"><div><b>Người lập biểu</b><i>(Ký, họ tên)</i></div><div><b>Quản lý nhà máy</b><i>(Ký, họ tên)</i></div><div><b>Kế toán</b><i>(Ký, họ tên)</i></div></div>
</body></html>`}
function reportXlsx(D){if(!window.XLSX)return toast('Chưa tải được thư viện Excel – thử lại');const wb=XLSX.utils.book_new();const per=D.from===D.to?'Ngày '+dmyY(D.from):'Từ '+dmyY(D.from)+' đến '+dmyY(D.to);
  const sh=(name,head,rows)=>{const a=[['BÁO CÁO SẢN XUẤT THỰC TẾ – '+name.toUpperCase()],[per],[],head].concat(rows);const ws=XLSX.utils.aoa_to_sheet(a);ws['!cols']=head.map(h=>({wch:Math.max(10,String(h).length+2)}));XLSX.utils.book_append_sheet(wb,ws,name)};
  sh('Nhập NVL',['Ngày','Nguyên liệu','Nhà cung cấp','Số lô','Số kg'].concat(D.adm?['Giá nhập','Vận chuyển + khác','Thành tiền']:[]),D.nvl.map(x=>[dmyY(x.date),x.nvl,x.ncc,x.lot,x.kg].concat(D.adm?[x.price,x.ship,x.tien]:[])));
  sh('Sản xuất',['Sản phẩm','NVL đưa vào (kg)','TP dự tính (kg)','TP đóng gói (kg)','Tỷ lệ TP thực tế (%)','Tỷ lệ định mức (%)','Số gói theo quy cách'],D.prod.map(x=>[x.name,r3(x.kgIn),x.kgPlan?r3(x.kgPlan):'',r3(x.kgTP),x.tl==null?'':Math.round(x.tl*10)/10,x.tlDm||'',x.packTxt]));
  sh('Nhân công',['Sản phẩm','Giờ chính thức','Giờ tăng ca','Tổng công','Công/100kg thực tế','Công/100kg định mức'],D.prod.map(x=>[x.name,x.h,x.ho,Math.round(x.cong*100)/100,x.c100==null?'':Math.round(x.c100*100)/100,x.c100Dm||'']).concat([[],['Theo công đoạn','Số phiếu','Số người chính thức','Giờ chính thức','Số người tăng ca','Giờ tăng ca','Tổng công']]).concat([...D.S5.entries()].filter(([k,v])=>v.n).map(([k,v])=>[KIND[k].n,v.n,v.people,v.h,v.pot,v.ho,Math.round((v.h+v.ho)/D.gc*100)/100])));
  sh('Xuất hàng',['Ngày','Nơi nhận','Xe','Sản phẩm','Quy cách','Số gói','Số kg'],D.xuat.map(x=>[dmyY(x.date),x.dest,x.xe,x.name,x.qc,x.q==null?'':x.q,x.kg]));
  sh('Tồn cuối',['Loại','Tên','Lô / quy cách','Số lượng','Số kg'],D.tonNvl.map(x=>['Nguyên liệu',x.name,x.lot,'',x.kg]).concat(D.tonKd.map(x=>['Kho đông thuê',x.name,x.since?'gửi từ '+dmyY(x.since):'',x.bags?x.bags+' bịch':'',x.kg])).concat(D.tonTp.map(x=>['Thành phẩm',x.name,x.qc,x.q+' gói',x.kg])));
  if(D.gt)sh('Giá thành',['Sản phẩm','Kg TP','Nguyên liệu','Nhân công','Túi tem hộp','Chi phí khác','Tổng chi phí','Giá/kg TP (chưa gồm túi tem)'],D.gt.filter(x=>x.kgTP).map(x=>[itemOf(x.id).name,r3(x.kgTP),Math.round(x.nvl),Math.round(x.lab),Math.round(x.bb),Math.round(x.oth),Math.round(x.tot),Math.round(x.perKg)]));
  XLSX.writeFile(wb,`Bao cao san xuat ${D.from} den ${D.to}.xlsx`)}
let LOGO64='';
async function logo64(){if(LOGO64)return LOGO64;try{const b=await (await fetch('logo2.png')).blob();LOGO64=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}catch(e){}return LOGO64}
async function openReport(from,to){const D=reportData(from,to);const w=window.open('','_blank');if(!w)return toast('Trình duyệt chặn cửa sổ mới – cho phép bật cửa sổ rồi thử lại');D.logo=await logo64();window.__lastReport=D;w.document.open();w.document.write(reportHTML(D));w.document.close();
  const b=w.document.getElementById('xl');if(b)b.onclick=()=>reportXlsx(D)}

/* ---------------- QUẢN LÝ: NHÂN CÔNG ---------------- */
function viewNC(v){const d=S.ui.ncDate||today();const ch=xw()==='ch';const L=modeLogs(liveLogs()).filter(l=>l.date===d).sort((a,b)=>kOrd(a.kind)-kOrd(b.kind)||String(a.item||a.loai).localeCompare(String(b.item||b.loai)));const gc=cfg().gioCong||8;
  const by=new Map();for(const l of L){const k=ch?(l.kind==='cnx'||l.kind==='cxuat'?'_chung':'c|'+l.loai):(l.kind==='nvl'||l.kind==='xuat'?'_chung':tpId(l.item));const x=by.get(k)||{h:0,kg:0};x.h+=HW(l)+HO(l);if(l.kind==='dg'||l.kind==='dgl')x.kg+=num(l.kgTP);if(l.kind==='cloc')x.kg+=num(l.kgOk);by.set(k,x)}
  const sum=[...by.entries()].map(([k,x])=>{if(k==='_chung')return `<div class="row"><div class="grow t">${ch?'Nhập chuối xanh + Xuất hàng (chung)':'Nhập NVL + Xuất hàng (chung)'}</div><div class="num">${fm(x.h)} giờ · ${fm(x.h/gc,2)} công</div></div>`;const it=k.startsWith('c|')?{name:(chc().types[k.slice(2)]||{}).name||k,dm:{cong100:(chc().types[k.slice(2)]||{}).cong100}}:itemOf(k),dm=it.dm||{};const c100=x.kg?x.h/gc/x.kg*100:null;const ok=c100!=null&&dm.cong100?c100<=dm.cong100*1.05:null;
    return `<div class="row"><div class="grow"><div class="t">${esc(it.name)}</div><div class="s">${fm(x.h)} giờ = ${fm(x.h/gc,2)} công${x.kg?' · '+fm(x.kg)+' kg TP':''}</div></div>${c100!=null?`<span class="chip ${ok?'g':'r'}">${fm(c100,2)} công/100kg · ĐM ${fm(dm.cong100,2)}</span>`:''}</div>`}).join('');
  v.innerHTML=`<h1 class="big">Nhân công${ch?' · Xưởng chuối':''}</h1><label class="f"><span class="lab">Ngày</span><input type="date" id="ncD" value="${d}" max="${today()}"></label>
   <div class="tiny muted" style="margin:4px 0 8px">Số người, tổng giờ chính thức và tăng ca lấy từ phiếu tổ trưởng. Sửa trực tiếp rồi bấm Lưu – app ghi lại ai sửa. Quy đổi ${gc} giờ = 1 công.</div>
   ${L.length?'<div class="nchd"><span>Người</span><span>Giờ</span><span>Người TC</span><span>Giờ TC</span></div>':''}<div class="group">${L.map(l=>`<div class="row"><div class="grow"><div class="t">${esc(isCh(l)?(chc().types[l.loai]||{}).name||'Chuối':l.kind==='nvl'?nvlOf(nvlId(l)).name+' (NVL)':l.item?itemOf(l.item).name:'Chung')}</div><div class="s">${kOrd(l.kind)}. ${KIND[l.kind].n} · ${esc(nameOf(l.by))}</div></div><input class="ncin" data-nid="${l.id}" data-nk="people" value="${fm(l.people)}" inputmode="numeric"><input class="ncin" data-nid="${l.id}" data-nk="hours" value="${String(HW(l)||0).replace('.',',')}" inputmode="decimal"><input class="ncin" data-nid="${l.id}" data-nk="pot" value="${fm(num(l.pot))}" inputmode="numeric"><input class="ncin" data-nid="${l.id}" data-nk="ot" value="${String(HO(l)||0).replace('.',',')}" inputmode="decimal"></div>`).join('')||'<div class="empty">Không có phiếu ngày này.</div>'}</div>
   ${L.length?'<button class="btn block pri" id="ncSave">Lưu</button>':''}
   <div class="sec">Tổng theo mặt hàng</div><div class="group">${sum||'<div class="empty">—</div>'}</div>`;
  $('#ncD').onchange=e=>{S.ui.ncDate=e.target.value;render()};
  const sv=$('#ncSave');if(sv)sv.onclick=async()=>{let n=0;for(const l of L){const p=num($(`[data-nid="${l.id}"][data-nk="people"]`).value),h=num($(`[data-nid="${l.id}"][data-nk="hours"]`).value),o=num($(`[data-nid="${l.id}"][data-nk="ot"]`).value),po=num($(`[data-nid="${l.id}"][data-nk="pot"]`).value);if(p!==num(l.people)||h!==HW(l)||o!==HO(l)||po!==num(l.pot)){n++;const nw={people:p,hours:h,pot:po,ot:o,hv:2};await S.db.doc('mlog/'+l.id).update({...nw,edits:(l.edits||[]).concat([{by:S.uid,at:Date.now(),what:'công '+hTxt(l)+' → '+hTxt(nw)}])})}}toast(n?'✓ Đã lưu '+n+' dòng':'Không có thay đổi')}}

/* ---------------- QUẢN LÝ: ĐỊNH MỨC ---------------- */
const DMF=[['tl','Tỷ lệ thành phẩm (%)','kg TP / kg nguyên liệu'],['cong100','Nhân công (công / 100 kg TP)',''],['rate','Đơn giá 1 công (đ)',''],['baoBi','Túi + tem + hộp… (đ / gói)','tính theo số gói'],['dienGa','Điện, ga (đ / kg TP)',''],['kh','Khấu hao TSCĐ (đ / kg TP)',''],['thung','Thùng xốp, vận chuyển (đ / kg TP)',''],['guiKho','Gửi kho đông (đ / kg TP)','định mức như file giá thành']];
function vtDMHTML(it){const V=vtc(),P=(it.packs||[]).map(p=>gOf(p[0],p[1])).filter(g=>V.sp[it.id+'|'+g]);if(!P.length)return '';
  const opts=Object.entries(V.cat).map(([k,c])=>`<option value="${k}">${k} · ${esc(c.n)}</option>`).join('');
  return `<div class="sec">Định mức vật tư / 1 gói (theo sheet Định mức VT theo SP)</div>`+P.map(g=>{const k=it.id+'|'+g,sp=V.sp[k];return `<div class="group"><div class="row"><div class="grow"><div class="t">Gói ${packLabel(g)} <span class="chip">${esc(sp.c||'')}</span></div><div class="s">Số gói / thùng</div></div><input class="dmin" data-vb="${k}" value="${sp.b||PERBOX[k]||''}" inputmode="numeric"></div>
   ${sp.m.map(([ma,dm],i)=>`<div class="row"><div class="grow"><div class="t">${esc(vtName(ma))}</div><div class="s">${ma} · ${esc((V.cat[ma]||{}).u||'')} <label style="margin-left:10px;white-space:nowrap"><input type="checkbox" data-vdel="${k}#${i}" style="width:15px;height:15px;min-height:0;padding:0;margin:0 3px 0 0;vertical-align:-2px"> bỏ</label></div></div><input class="dmin" data-vk="${k}" data-vi="${i}" value="${String(dm).replace('.',',')}" inputmode="decimal"></div>`).join('')}
   <div class="row"><select data-vadd="${k}" style="width:100%;min-height:0;padding:6px"><option value="">＋ Thêm vật tư…</option>${opts}</select></div></div>`}).join('')+
   `<div class="row" style="padding:0 4px 8px"><div class="grow tiny muted">Đóng thùng (dùng chung mọi sản phẩm): ${(V.thung||[]).map(([ma,dm])=>esc(vtName(ma))+' × '+fm(dm)).join(' · ')} / thùng</div></div><button class="btn block pri" id="vtSave">Lưu định mức vật tư</button>`}
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
   ${vtDMHTML(it)}
   <div class="sec">Cài đặt chung</div><div class="group"><div class="row"><div class="grow t">Số giờ = 1 công</div><input class="dmin" id="dmG" value="${c.gioCong||8}" inputmode="decimal"></div><div class="row"><div class="grow"><div class="t">Hệ số giờ tăng ca</div><div class="s">1 giờ tăng ca = ? giờ thường khi tính tiền công</div></div><input class="dmin" id="dmOt" value="${String(c.otK||1.5).replace('.',',')}" inputmode="decimal"></div></div>
   <label class="f"><span class="lab">Biển số xe công ty (cách nhau dấu phẩy)</span><input id="dmX" value="${esc((c.xe||[]).join(', '))}"></label>
   <div class="sec">Nhà cung cấp (${(c.ncc||[]).length})</div><div class="group">${(c.ncc||[]).map((n,i)=>`<div class="row"><div class="grow"><div class="t">${esc(n.name)}${n.fresh?' <span class="chip w">mới thêm từ phiếu</span>':''}</div><div class="s">${esc(n.code||'chưa có mã MISA')}</div></div><button class="lnk" data-nrm="${i}">✕</button></div>`).join('')||'<div class="empty">Chưa có.</div>'}</div>
   <div class="grid2"><input id="nN" placeholder="Tên nhà cung cấp"><input id="nC" placeholder="Mã NCC (MISA)"></div><button class="btn block" id="nAdd" style="margin-top:6px">＋ Thêm nhà cung cấp</button>
   <div class="sec">Thêm mặt hàng (thành phẩm) mới</div><div class="grid2"><input id="iN" placeholder="Tên mặt hàng"><button class="btn" id="iAdd">＋ Thêm</button></div><div class="tiny muted" style="margin:4px">Mặt hàng mới gắn với nguyên liệu đang chọn ở ô "Làm từ nguyên liệu".</div>
   <div class="sec">Nguyên liệu (${(c.nvls||[]).length})</div><div class="tiny muted" style="margin:0 4px 6px">${(c.nvls||[]).map(n=>esc(n.name)).join(' · ')}</div>
   <div class="grid2"><input id="vN" placeholder="Tên nguyên liệu mới"><button class="btn" id="vAdd">＋ Thêm nguyên liệu</button></div>`;
  $('#dmI').onchange=e=>{S.ui.dmItem=e.target.value;render()};
  const vs=$('#vtSave');if(vs)vs.onclick=()=>{const c2=JSON.parse(JSON.stringify(c));c2.vt=JSON.parse(JSON.stringify(vtc()));
    $$('[data-vk]').forEach(el=>{const sp=c2.vt.sp[el.dataset.vk];if(sp)sp.m[+el.dataset.vi][1]=num(el.value)});
    $$('[data-vb]').forEach(el=>{const sp=c2.vt.sp[el.dataset.vb];if(sp)sp.b=num(el.value)||null});
    $$('[data-vadd]').forEach(el=>{const ma=el.value;if(!ma)return;const sp=c2.vt.sp[el.dataset.vadd];if(sp&&!sp.m.some(m=>m[0]===ma))sp.m.push([ma,1])});
    $$('[data-vdel]:checked').forEach(el=>{const [k,i]=el.dataset.vdel.split('#');const sp=c2.vt.sp[k];if(sp)sp.m[+i]=null});
    for(const k in c2.vt.sp)c2.vt.sp[k].m=c2.vt.sp[k].m.filter(Boolean);saveCfg(c2,'✓ Đã lưu định mức vật tư')};
  const saveCfg=async(c2,m)=>{try{await S.db.doc('mcfg/main').set(c2);S.cfg=c2;toast(m||'✓ Đã lưu');render()}catch(e){toast('Chưa lưu được')}};
  $('#dmSave').onclick=()=>{const c2=JSON.parse(JSON.stringify(c));const i2=c2.items.find(i=>i.id===id);i2.dm=i2.dm||{};$$('[data-dk]').forEach(el=>i2.dm[el.dataset.dk]=num(el.value));i2.bich=$('#dmB').value==='1';i2.nvl=$('#dmV').value;i2.name=$('#dmN').value.trim()||i2.name;i2.active=$('#dmA').checked;c2.gioCong=num($('#dmG').value)||8;c2.otK=num($('#dmOt').value)||1.5;c2.xe=$('#dmX').value.split(',').map(s=>s.trim()).filter(Boolean);i2.dmBy=S.uid;i2.dmAt=Date.now();saveCfg(c2)};
  $$('[data-nrm]').forEach(b=>b.onclick=async()=>{if(!await ask('Bỏ nhà cung cấp này khỏi danh sách chọn?'))return;const c2=JSON.parse(JSON.stringify(c));c2.ncc.splice(+b.dataset.nrm,1);saveCfg(c2)});
  $('#nAdd').onclick=()=>{const n=$('#nN').value.trim();if(!n)return toast('Gõ tên nhà cung cấp');const c2=JSON.parse(JSON.stringify(c));c2.ncc.push({name:n,code:$('#nC').value.trim(),lot:autoCode(n)});saveCfg(c2,'✓ Đã thêm nhà cung cấp')};
  $('#vAdd').onclick=()=>{const n=$('#vN').value.trim();if(!n)return toast('Gõ tên nguyên liệu');const c2=JSON.parse(JSON.stringify(c));c2.nvls=c2.nvls||[];const nid='v'+noAcc(n).replace(/[^a-z0-9]/g,'').slice(0,8)+Date.now().toString(36).slice(-3);c2.nvls.push({id:nid,name:n});saveCfg(c2,'✓ Đã thêm nguyên liệu '+n)};
  $('#iAdd').onclick=()=>{const n=$('#iN').value.trim();if(!n)return toast('Gõ tên mặt hàng');const c2=JSON.parse(JSON.stringify(c));const nid=noAcc(n).replace(/[^a-z0-9]/g,'').slice(0,8)+Date.now().toString(36).slice(-3);c2.items.push({id:nid,name:n,nvl:$('#dmV').value,bich:false,packs:[],dm:{tl:0,cong100:0,rate:180000,baoBi:0,dienGa:0,kh:0,thung:0,guiKho:0},src:'thêm mới'});S.ui.dmItem=nid;saveCfg(c2,'✓ Đã thêm '+n)}}

/* ---------------- QUẢN LÝ: GIÁ THÀNH ---------------- */
function costs(from,to){const C=calc(),gc=cfg().gioCong||8;const L=liveLogs().filter(l=>!isCh(l)&&l.date>=from&&l.date<=to);const R=new Map();
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
  for(const l of liveLogs().filter(l=>!isCh(l)&&l.date>=from&&l.date<=to).sort((p,q)=>p.date.localeCompare(q.date)))b.push([l.date,KIND[l.kind].n,l.item?itemOf(l.item).name:'',logSum(l).replace(/<[^>]+>/g,''),num(l.people),r3(HW(l)),num(l.pot),r3(HO(l)),nameOf(l.by),l.note||'']);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(b),'Phiếu');
  XLSX.writeFile(wb,`Gia thanh san xuat ${from} den ${to}.xlsx`)}

/* ================= v120: XƯỞNG CHUỐI (ủ rấm) =================
   cnx  {loai,ncc,nccCode,kg,price,ship,lot}
   cvu  {loai,room,gio,code,takes:[{id(lô cnx),lot,kg}],kg}
   cloc {loai,dest,takes:[{b(mẻ cvu),kg}],kgIn,outs:[{p,q,kg}],kgOk,hong}
   cxuat{dest,lines:[{p,q}],xe} */
const tName=t=>(chc().types[t]||{}).name||t||'?';
const prods=t=>(chc().prods||[]).filter(p=>p.active!==false&&(!t||p.t===t));
const prodOf=id=>(chc().prods||[]).find(p=>p.id===id)||{id,name:id,u:'kg',kg:1};
const qU=(p,q)=>fm(q)+' '+(p.u||'kg');
/* v124: chuối tiêu chia loại A/B (lô xanh, mẻ, sản phẩm, giá thành, kế hoạch) */
const AB=t=>t==='tieu';
const grOf=p=>AB(p.t)?(p.gr||(['tkg','tbep'].includes(p.id)?'B':'A')):'';
const lotGr=l=>AB(l.loai)?(l.grade||'A'):'';
const thungOf=t=>num((chc().types[t]||{}).thung)||(t==='tay'?15:16);
/* v125: chuối xanh nhập theo thùng → kg */
function thKg(f){const k=thungOf(f.loai);if(AB(f.loai)){f.kgA=num(f.kgAm)||num(f.thA)*k;f.kgB=num(f.kgBm)||num(f.thB)*k}else f.kg=num(f.kgm)||num(f.th)*k}
const lotKgTh=x=>x&&x.th>0?x.kg/x.th:0; /* kg/thùng thực tế của lô */
const dowVN=d=>d?['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][new Date(d+'T00:00:00Z').getUTCDay()]:'';
const dayN=(d,ref)=>Math.round((new Date((ref||today())+'T00:00:00Z')-new Date(d+'T00:00:00Z'))/864e5);/* v128: ngày vào = ngày 0; ngày giao = ngày vào + số ngày ủ (tiêu +4, tây +3) */
function calcCh(){const L=liveLogs().filter(isCh).sort((a,b)=>(a.date+String(a.at).padStart(15,'0')).localeCompare(b.date+String(b.at).padStart(15,'0')));
  const lots=new Map(),lotById=new Map(),bat=new Map(),tp=new Map();
  for(const l of L){
    if(l.kind==='cnx'){const x={id:l.id,lot:l.lot,date:l.date,kg:num(l.kg),left:num(l.kg),price:lotPrice(l),ncc:l.ncc,loai:l.loai,gr:lotGr(l),th:num(l.thung),thLeft:num(l.thung)};if(!lots.has(l.loai))lots.set(l.loai,[]);lots.get(l.loai).push(x);lotById.set(l.id,x)}
    else if(l.kind==='cvu'){const b={id:l.id,code:l.code,room:+l.room,loai:l.loai,date:l.date,gio:l.gio||'',kg:0,left:0,cost:0,kgP:0,miss:0,took:0,ok:0,hong:0,src:[],outs:[],kgA:0,kgB:0,cA:0,pA:0,cB:0,pB:0,uA:0,uB:0,sug:num(l.sug)};
      b.th=0;for(const t of l.takes||[]){const x=lotById.get(t.id),kg=num(t.kg);if(x){x.left=r3(x.left-kg);x.thLeft=r3(x.thLeft-num(t.th))}b.kg=r3(b.kg+kg);b.th=r3(b.th+num(t.th));const g=x?x.gr:(AB(l.loai)?'A':'');if(g==='B')b.kgB=r3(b.kgB+kg);else if(g)b.kgA=r3(b.kgA+kg);b.src.push({lot:t.lot||(x&&x.lot)||'?',kg,ncc:x&&x.ncc,gr:g});if(x&&x.price!=null){b.cost+=kg*x.price;b.kgP+=kg;if(g==='B'){b.cB+=kg*x.price;b.pB+=kg}else if(g){b.cA+=kg*x.price;b.pA+=kg}}else b.miss+=kg}
      b.left=b.kg;bat.set(l.id,b)}
    else if(l.kind==='cloc'){const kin=num(l.kgIn)||(l.takes||[]).reduce((s,t)=>s+num(t.kg),0);
      const fa=fracA(l);for(const t of l.takes||[]){const b=bat.get(t.b);if(!b)continue;const kg=num(t.kg),sh=kin?kg/kin:0;b.left=r3(b.left-kg);if(AB(b.loai)){const f=fa==null?(b.kg?b.kgA/b.kg:1):fa;b.uA=r3(b.uA+kg*f);b.uB=r3(b.uB+kg*(1-f))}b.took=r3(b.took+kg);b.ok+=num(l.kgOk)*sh;b.hong+=num(l.hong)*sh;b.outs.push({log:l.id,date:l.date,kg});b.last=l.date}
      for(const o of l.outs||[])tp.set(o.p,(tp.get(o.p)||0)+num(o.q))}
    else if(l.kind==='cxuat'){for(const x of l.lines||[])tp.set(x.p,(tp.get(x.p)||0)-num(x.q))}}
  return {lots,lotById,bat,tp}}
function fracA(l){if(!AB(l.loai))return null;let a=0,b=0;for(const o of l.outs||[]){const p=prodOf(o.p),k=num(o.kg)||num(o.q)*(p.kg||1);if(grOf(p)==='B')b+=k;else a+=k}return a+b>0?a/(a+b):null}
const ucGr=(b,g)=>g==='B'?(b.pB?b.cB/b.pB:unitCost(b)):g==='A'?(b.pA?b.cA/b.pA:unitCost(b)):unitCost(b);
const abTxt=b=>AB(b.loai)&&(b.kgA||b.kgB)?` · A ${fm(b.kgA)} / B ${fm(b.kgB)}`:'';
const openBats=(C,t)=>[...C.bat.values()].filter(b=>b.left>0.05&&(!t||b.loai===t)).sort((a,b)=>(a.date+a.gio).localeCompare(b.date+b.gio));
const unitCost=b=>b.kgP?b.cost/b.kgP:null;
function batStat(b){const T=chc().types[b.loai]||{days:4,marks:{}},n=dayN(b.date);const m=(T.marks||{})[n];
  if(n>T.days)return {n,tag:`<span class="chip r">Quá hạn ${n-T.days} ngày</span>`,lv:3};
  if(m)return {n,tag:`<span class="chip ${n===T.days?'g':'w'}">Ngày ${n} – lọc ${esc(m)}</span>`,lv:n===T.days?2:1};
  return {n,tag:`<span class="chip">${n<=0?'Mới vào':'Ngày '+n}</span>`,lv:0}}
function dayBar(b){const T=chc().types[b.loai]||{days:4,marks:{}},n=dayN(b.date);let h='';
  for(let i=1;i<=T.days;i++){const m=(T.marks||{})[i];const st=i<n?'background:var(--accent);color:#fff':i===n?(m?(i===T.days?'background:#2E8B57;color:#fff':'background:#F2A900;color:#fff'):'background:var(--accent);color:#fff'):'background:var(--sunk);color:var(--muted)';
    h+=`<span style="flex:1;text-align:center;font-size:11.5px;font-weight:700;padding:3px 0;border-radius:6px;${st}">N${i}${m?' '+esc(m):''}${i===n?' •':''}</span>`}
  return `<div style="display:flex;gap:3px;margin-top:5px">${h}</div>`}
function batRow(b){const s=batStat(b);return `<div class="row tap" data-bid="${esc(b.id)}" style="${s.lv===3?'background:rgba(220,50,50,.07)':''}"><div class="grow"><div class="t">${esc(b.code)} · ${esc(tName(b.loai))} ${s.tag}</div><div class="s">vào ${dmy(b.date)}${b.gio?' '+esc(b.gio):''} · ${b.th?fm(b.th)+' thùng · ':''}${fm(b.kg)} kg${abTxt(b)} · <b>còn ${fm(b.left)} kg</b>${b.took?' · đã lấy '+fm(b.took):''}</div>${dayBar(b)}</div><span class="chev">›</span></div>`}
function roomsHTML(C,tpH){let h='';const ALL=openBats(C),TP=ALL.filter(b=>atTP(b)),OB=ALL.filter(b=>!atTP(b));const RL=[...new Set([...roomList(),...OB.map(b=>+b.room).filter(Boolean)])].sort((a,b)=>a-b);for(const r of RL){const B=OB.filter(b=>b.room===r);
  h+=`<div class="sec">Kho ${r}${roomList().includes(r)?'':' (ngoài kho ủ)'} <span style="font-weight:400">(${fm(capOf(r)/1000)} tấn)</span>${B.length?' · '+fm(B.reduce((s,b)=>s+b.left,0))+' kg':' · trống'}</div><div class="group">${B.map(batRow).join('')||'<div class="empty">Phòng trống.</div>'}</div>`}h+=`<div class="sec">Kho ${KHO_TP} – lọc lựa ra ủ &amp; thành phẩm tồn</div><div class="group"><div class="row" style="background:var(--sunk)"><div class="grow t" style="color:var(--accent)">Chuối ra ủ từ các kho (rấm đủ ${ramOf('tieu')} ngày)</div><div class="num" style="font-weight:800">${fm(TP.reduce((s,b)=>s+b.left,0))} kg</div></div>${TP.map(batRow).join('')||'<div class="empty">Chưa có mẻ ra ủ.</div>'}${tpH!=null?`<div class="row" style="background:var(--sunk)"><div class="grow t" style="color:var(--accent)">Thành phẩm sau lọc (chưa xuất)</div></div>${tpH||'<div class="empty">Không có.</div>'}`:''}</div>`;return h}
function bindBats(){$$('[data-bid]').forEach(r=>r.onclick=()=>batDetail(r.dataset.bid))}
function batDetail(id){const C=calcCh(),b=C.bat.get(id);if(!b)return;const s=batStat(b),uc=unitCost(b);
  const html=`<div class="s">${esc(tName(b.loai))} · ${atTP(b)?'Kho '+KHO_TP+' (từ kho '+b.room+')':'Kho '+b.room} · vào ${dmy(b.date)} ${esc(b.gio)} · ${s.tag}</div>${dayBar(b)}
   <table class="gt"><tr><td>Kg vào phòng</td><td><b>${fm(b.kg)}</b></td></tr>${AB(b.loai)?`<tr><td>Loại A / B vào</td><td>${fm(b.kgA)} / ${fm(b.kgB)}</td></tr><tr><td>Còn ước tính A / B</td><td>${fm(Math.max(0,b.kgA-b.uA))} / ${fm(Math.max(0,b.kgB-b.uB))}</td></tr>`:''}<tr><td>Đã lấy ra lọc</td><td>${fm(b.took)}</td></tr><tr><td>Còn trong phòng</td><td><b>${fm(b.left)}</b></td></tr>
   <tr><td>Kg đạt (chia theo tỷ lệ)</td><td>${fm(b.ok)}${b.took?' ('+fm(b.ok/b.took*100,1)+'%)':''}</td></tr><tr><td>Loại / hỏng</td><td>${fm(b.hong)}</td></tr>${isAdmin()&&uc!=null?`<tr><td>Giá chuối xanh bình quân</td><td>${fm(uc)} đ/kg</td></tr>`:''}</table>
   <div class="tiny muted" style="margin-top:6px">Lô xanh: ${b.src.map(x=>esc(x.lot)+(x.gr?' ('+x.gr+')':'')+' '+fm(x.kg)+' kg').join(' · ')||'—'}</div>
   <div class="tiny muted">Các lần lấy: ${b.outs.map(o=>dmy(o.date)+' '+fm(o.kg)+' kg').join(' · ')||'chưa lấy'}</div>
   ${b.left>0.05?`<button class="btn block pri" id="bLoc" style="margin-top:12px">Lọc lựa mẻ này</button><button class="btn block" id="bClose" style="color:var(--bad)">Đóng mẻ – ghi ${fm(b.left)} kg còn lại là hỏng</button>`:''}`;
  const close=sheet('Mẻ '+esc(b.code),html);
  const lb=$('#bLoc');if(lb)lb.onclick=()=>{close();const q={};q[b.id]=String(b.left).replace('.',',');openFormCh('cloc',{loai:b.loai,tk:q})};
  const bc=$('#bClose');if(bc)bc.onclick=async()=>{if(!await ask(`Đóng mẻ ${b.code}: ghi ${fm(b.left)} kg còn lại là loại/hỏng?`))return;
    const d={kind:'cloc',date:today(),loai:b.loai,dest:'khac',takes:[{b:b.id,kg:b.left}],kgIn:b.left,outs:[],kgOk:0,hong:b.left,people:0,hours:0,hv:2,note:'Đóng mẻ – phần còn lại ghi hỏng',by:S.uid,at:Date.now()};
    try{await S.db.doc('mlog/'+newId(d.date)).set(d);toast('✓ Đã đóng mẻ');close()}catch(e){if(e&&e.code==='queued'){toast('⏳ Đã giữ trên máy, tự gửi lại');close()}else toast('Chưa lưu được')}}}
function logSumCh(l){
  if(l.kind==='cnx')return `${esc(tName(l.loai))} xanh${l.grade?' loại '+esc(l.grade):''} · ${esc(l.ncc||'')} · ${l.thung?fm(l.thung)+' thùng = ':''}${fm(l.kg)} kg${l.price?' × '+fm(l.price)+' đ':''} · lô ${esc(l.lot||'')}`;
  if(l.kind==='cvu')return `${esc(l.code||'')} · Kho ${esc(l.room)} · ${esc(tName(l.loai))} · ${l.th?fm(l.th)+' thùng · ':''}${fm(l.kg)} kg vào ủ`;
  if(l.kind==='cloc'){const C=calcCh();return `${esc(tName(l.loai))} → ${CDEST[l.dest]||l.dest} · lấy ${fm(l.kgIn)} kg (${(l.takes||[]).map(t=>{const b=C.bat.get(t.b);return esc(b?b.code:'?')+' '+fm(t.kg)}).join(', ')}) · đạt ${fm(l.kgOk)} kg · hỏng ${fm(l.hong)} kg`}
  if(l.kind==='cxuat')return `→ ${l.xe?'🚚 '+esc(l.xe)+(l.gio?' '+esc(l.gio):'')+' · ':''}${esc([...new Set((l.lines||[]).map(x=>XGN[x.g||xgOf(prodOf(x.p))]))].join(', ')||CXD[l.dest]||l.dest)} · ${(l.lines||[]).map(x=>{const p=prodOf(x.p);return esc(p.name)+' '+(x.th?fm(x.th)+' thùng · ':'')+qU(p,x.q)}).join(', ')}`;
  return ''}
function detCh(l){if(l.kind==='cloc'&&(l.outs||[]).length)return `<table class="gt">${l.outs.map(o=>{const p=prodOf(o.p);return `<tr><td>${esc(p.name)}</td><td>${qU(p,o.q)}${p.u!=='kg'?' = '+fm(o.kg)+' kg':''}</td></tr>`}).join('')}<tr><td>Loại / hỏng</td><td>${fm(l.hong)} kg</td></tr></table>`;return ''}

/* ---- Màn chính xưởng chuối ---- */
function viewHomeCh(v){const C=calcCh();
  const btn=k=>`<button class="sxbig" data-k="${k}" style="background:${KIND[k].c}"><span class="n">${kOrd(k)}</span><span><b>${KIND[k].n}</b><small>${KIND[k].s}</small></span></button>`;
  const ob=openBats(C),rem=ob.map(b=>({b,s:batStat(b)})).filter(x=>x.s.lv>0).sort((a,b)=>b.s.lv-a.s.lv);
  const green=Object.keys(chc().types).map(t=>{const a=r3((C.lots.get(t)||[]).reduce((s,x)=>s+Math.max(0,x.left),0));return a>0.05?tName(t)+' '+fm(a)+' kg':''}).filter(Boolean);
  const td=liveLogs().filter(l=>isCh(l)&&l.date===today());
  v.innerHTML=`${xwSeg()}<h1 class="big" style="margin-bottom:10px">Xưởng chuối · ${dmy(today())}</h1><button class="sxbig" id="kh" style="background:#6b4fa3"><span class="n">0</span><span><b>Kế hoạch</b><small>Số xuất xưởng từng ngày → vào kho ủ, mua chuối xanh</small></span></button>${CORDER.map(btn).join('')}
   ${reqsHTML()}<div class="sec">Kế hoạch hôm nay</div><div class="group">${todayPlanHTML()}</div>
   <div class="sec">Việc hôm nay</div><div class="group">${rem.map(x=>`<div class="row tap" data-bid="${esc(x.b.id)}"><div class="grow"><div class="t">P${x.b.room} · ${esc(x.b.code)} ${x.s.tag}</div><div class="s">${esc(tName(x.b.loai))} · còn ${fm(x.b.left)} kg</div></div><span class="chev">›</span></div>`).join('')||'<div class="empty">Không có mẻ đến ngày lọc.</div>'}
    <div class="row"><div class="grow"><div class="t">Chuối xanh chưa ủ</div><div class="s">${green.join(' · ')||'0 kg'}</div></div></div></div>
   ${roomsHTML(C)}
   <div class="sec">Đã nhập hôm nay (${td.length})</div><div class="group">${td.slice().sort((a,b)=>b.at-a.at).map(logRow).join('')||'<div class="empty">Chưa có phiếu nào hôm nay.</div>'}</div>`;
  bindReqs();$$('.sxbig[data-k]').forEach(b=>b.onclick=()=>openFormCh(b.dataset.k));$('#kh').onclick=openPlan;const k0=$('#kh0');if(k0)k0.onclick=openPlan;bindLogRows();bindBats();bindXw()}
function viewStockCh(v){const C=calcCh();
  const gl=Object.keys(chc().types).map(t=>{const L=(C.lots.get(t)||[]).filter(x=>x.left>0.05);return L.length?`<div class="row"><div class="grow"><div class="t">${esc(tName(t))} · ${fm(L.reduce((s,x)=>s+x.left,0))} kg</div><div class="s">${L.map(x=>esc(x.lot)+' ('+dmy(x.date)+') '+(x.th?fm(x.thLeft)+' thùng · ':'')+fm(x.left)+' kg').join(' · ')}</div></div></div>`:''}).join('');
  const tp=prods().map(p=>{const q=C.tp.get(p.id)||0;return Math.abs(q)>1e-9?`<div class="row"><div class="grow t">${esc(p.name)}</div><div class="num" style="${q<0?'color:var(--bad)':''}">${qU(p,q)}</div></div>`:''}).join('');
  v.innerHTML=`<h1 class="big">Tồn kho xưởng chuối</h1><div class="sec">Kho 1 – chuối xanh nguyên liệu (theo lô)</div><div class="group">${gl||'<div class="empty">Không có.</div>'}</div>
   <div class="sec" style="font-size:14px;color:var(--fg)">Kho ủ rấm</div>${roomsHTML(C,tp)}`;
  bindBats()}

/* ---- Phiếu xưởng chuối ---- */
function openFormCh(kind,pre){const t0=Object.keys(chc().types)[0];S.form={kind,date:today(),loai:t0,room:'1',gio:new Date(Date.now()+7*36e5).toISOString().slice(11,16),people:'',hours:'',pot:'',ot:'',packs:[],tk:{},o:{},q:{},dest:kind==='cloc'?'all':'win',xe:'',xeO:'',ncc:'',nccQ:'',note:'',hong:''};
  if(pre)Object.assign(S.form,pre);S.post=null;render();scrollTo(0,0)}
const optB=(f,k,L)=>`<div class="opt" style="flex-wrap:wrap">${L.map(([v,l])=>`<button data-o="${k}" data-ov="${esc(v)}" class="${String(f[k])===String(v)?'on':''}" style="min-width:64px">${l}</button>`).join('')}</div>`;
function viewFormCh(v){const f=S.form,K=KIND[f.kind],C=calcCh(),T=chc().types;let body='';
  const loaiSel=`<label class="f"><span class="lab">Loại chuối</span>${optB(f,'loai',Object.keys(T).map(t=>[t,esc(T[t].name)]))}</label>`;
  if(f.kind==='cnx'){
    body=`${loaiSel}<label class="f"><span class="lab">Nhà cung cấp – gõ tìm</span><input id="nccQ" value="${esc(f.ncc&&f.ncc!=='__new'?f.ncc:f.nccQ)}" placeholder="Gõ tên nhà cung cấp…" class="sxin" autocomplete="off"></label><div id="nccL" class="nccl" hidden></div>
     ${f.ncc==='__new'?inp(f,'nccNew','Tên nhà cung cấp mới','','text'):''}<div class="auto">Quy cách: <b>${fm(thungOf(f.loai))} kg/thùng</b> – nhập số thùng; ô kg để trống thì app tự tính = thùng × quy cách, có cân thực tế thì gõ số kg.</div>${AB(f.loai)?`<div class="sec">Loại A</div><div class="grid2">${inp(f,'thA','Số thùng A','0','numeric')}${inp(f,'kgAm','Số kg A (cân)','= thùng × '+fm(thungOf(f.loai)))}</div>${inp(f,'priceA','Giá A (đ/kg)','0')}<div class="sec">Loại B</div><div class="grid2">${inp(f,'thB','Số thùng B','0','numeric')}${inp(f,'kgBm','Số kg B (cân)','= thùng × '+fm(thungOf(f.loai)))}</div>${inp(f,'priceB','Giá B (đ/kg)','0')}${inp(f,'ship','Chi phí vận chuyển cả xe (đ)','0')}`:`<div class="grid2">${inp(f,'th','Số thùng','0','numeric')}${inp(f,'kgm','Số kg (cân)','= thùng × '+fm(thungOf(f.loai)))}</div><div class="grid2">${inp(f,'price','Giá nhập (đ/kg)','0')}${inp(f,'ship','Chi phí vận chuyển (đ)','0')}</div>`}${xeSel(f)}<div class="auto" id="calcBox"></div>`}
  else if(f.kind==='cvu'){const L=(C.lots.get(f.loai)||[]).filter(x=>x.left>0.05&&x.date<=f.date),Td=T[f.loai]||{days:4,marks:{}};const sg=sugFor(f.date,f.loai);
    const sgBox=`<div class="card" style="margin-bottom:12px;border:2px solid #6b4fa3"><div style="font-weight:800;color:#6b4fa3">⓪ Đề xuất theo kế hoạch</div>${sg?`<div style="font-size:15px;margin-top:4px">Cần vào phòng: <b style="font-size:18px">${fm(sg.need)} kg</b>${sg.nA!=null?` <span class="muted">(A ${fm(sg.nA)} · B ${fm(sg.nB)})</span>`:''}${sg.room?` · gợi ý <b>Kho ${sg.room}</b>`:''}</div>${(()=>{const av=greenAv(f.date,f.loai);if(av.all+0.05<sg.need)return `<div class="alert r" style="margin-top:6px">⚠️ Thiếu nguyên liệu: cần ${fm(sg.need)} kg, chuối xanh đã về đến ${dmy(f.date)} chỉ còn ${fm(av.all)} kg${sg.nA!=null?' (A '+fm(av.A)+' · B '+fm(av.B)+')':''} – thiếu <b>${fm(sg.need-av.all)} kg</b>.</div>`;if(sg.nA!=null&&(av.A+0.05<sg.nA||av.B+0.05<sg.nB))return `<div class="auto" style="margin-top:6px;color:#9a6b00">Loại ${av.A<sg.nA?'A':'B'} không đủ (còn A ${fm(av.A)} · B ${fm(av.B)}) – app sẽ lấy bù bằng loại ${av.A<sg.nA?'B':'A'}.</div>`;return ''})()}<div class="tiny muted">cho hàng xuất xưởng ${dmy(sg.giao)}: ${fm(sg.kgTP,1)} kg thành phẩm ÷ tỷ lệ thành phẩm ${fm(sg.y*100,1)}%${sg.carry?` · <b style="color:${sg.carry>0?'var(--bad)':'#1f7a45'}">${sg.carry>0?'+':''}${fm(sg.carry)} kg nợ chuyển tiếp (lệnh ${sg.carry>0?'rút':'siết'} đã duyệt)</b>`:''}</div><button class="btn block" id="sgFill" style="margin-top:8px">Điền theo đề xuất (lấy lô cũ trước)</button>`:`<div class="tiny muted" style="margin-top:4px">Chưa có kế hoạch xuất xưởng ngày ${dmy(addDays(f.date,Td.days||4))} – nhập ở ⓪ Kế hoạch để có số đề xuất.</div>`}</div>`;
    const ms=Object.entries(Td.marks||{}).map(([n,m])=>'Ngày '+n+' ('+dmy(addDays(f.date,+n))+'): lọc '+esc(m)).join(' · ');
    body=`${sgBox}<label class="f"><span class="lab">Kho ủ rấm</span>${optB(f,'room',roomList().map(r=>{const bz=inRoom(C,r,f.date).length>0;return [String(r),'Kho '+r+'<br><small style="font-weight:400">'+fm(capOf(r)/1000)+' t'+(bz?' · có mẻ':'')+'</small>']}))}</label>${loaiSel}
     <div class="sec">Lấy từ lô chuối xanh (lô cũ trước)</div><div class="group">${L.map(x=>`<div class="row"><div class="grow"><div class="t">${esc(x.lot)}${x.gr?' <span class="chip '+(x.gr==='A'?'g':'w')+'">Loại '+x.gr+'</span>':''}</div><div class="s">${esc(x.ncc||'')} · ${dmy(x.date)} · còn ${x.th?fm(x.thLeft)+' thùng · ':''}${fm(x.left)} kg</div><button class="lnk" style="color:var(--accent);padding:0" data-all="${esc(x.id)}" data-v="${x.left}" data-vt="${x.th?x.thLeft:''}">Lấy hết</button></div><input class="xq" style="width:68px" data-tth="${esc(x.id)}" value="${esc((f.tt||{})[x.id]??'')}" inputmode="numeric" placeholder="thùng"><input class="xq" style="width:76px;margin-left:4px" data-tk="${esc(x.id)}" value="${esc(f.tk[x.id]??'')}" inputmode="decimal" placeholder="kg"></div>`).join('')||'<div class="empty">Không còn chuối xanh '+esc(tName(f.loai))+' – nhập ở bước ① trước.</div>'}${L.length?'<div class="row" style="background:var(--sunk)"><div class="grow t">Tổng vào phòng</div><div class="num" id="tkSum" style="font-weight:800;font-size:17px">0 kg</div></div>':''}</div>
     <div class="grid2"><label class="f"><span class="lab">Giờ vào</span><input type="time" data-f="gio" value="${esc(f.gio)}" class="sxin"></label><div class="auto" style="margin:22px 0 12px">Ủ ${Td.days} ngày</div></div><div class="auto">${ms}</div><div class="auto" id="calcBox"></div>`}
  else if(f.kind==='cloc'){const B=openBats(C,f.loai).filter(b=>b.date<=f.date),P=prods(f.loai);const sl=sugLoc(f.date,f.loai,f.dest);
    if(f.dest!=='all')f.dest='all';const slG=(g,lab,x)=>x.rows.length?`<tr><td colspan="2" style="background:var(--sunk);font-weight:800;color:#6b4fa3">${lab} – xuất xưởng ${dowVN(x.giao)} ${dmy(x.giao)} <span class="tiny muted">(${fm(x.kg,1)} kg TP)</span></td></tr>`+x.rows.map(r=>`<tr><td>${esc(r.p.name)}</td><td>${qU(r.p,r.q)}${r.p.u!=='kg'?' = '+fm(r.kg,1)+' kg':''}</td></tr>`).join(''):'';
    const slBox=`<div class="card" style="margin-bottom:12px;border:2px solid #6b4fa3"><div style="font-weight:800;color:#6b4fa3">⓪ Đề xuất lọc theo kế hoạch – lọc tại kho 3 ngày ${dmy(f.date)}</div>${sl.rows.length?`<table class="gt">${slG('win','Winmart (lọc chiều, xuất xưởng sáng mai)',sl.w)}${slG('khac','Khách khác (lọc + xuất xưởng trong ngày)',sl.k)}<tr><td><b>Thành phẩm cần</b></td><td><b>${fm(sl.kg,1)} kg</b></td></tr><tr><td><b>Chuối cần lấy ra lọc</b> <span class="tiny muted">÷ ${fm(sl.y*100,1)}%</span></td><td><b style="font-size:17px">${fm(sl.need)} kg</b></td></tr></table><button class="btn block" id="slFill" style="margin-top:8px">Điền theo đề xuất (mẻ cũ trước)</button>`:`<div class="tiny muted" style="margin-top:4px">Chưa có kế hoạch Winmart xuất xưởng ${dmy(addDays(f.date,1))} hay khách khác xuất xưởng ${dmy(f.date)} – nhập ở ⓪ Kế hoạch.</div>`}</div>`;
    const lp=locPlan(f.date,f.loai,f.dest);
    body=`${loaiSel}${slBox}${reqBox(f,lp)}
     <div class="sec">Lấy từ các mẻ (kho 3 và kho ủ) – gõ kg lấy ra (lấy lẫn nhiều mẻ được)</div><div class="group">${B.map(b=>{const s=batStat(b);return `<div class="row"><div class="grow"><div class="t">${esc(b.code)} · kho ${khoOf(b,f.date)} ${s.tag}</div><div class="s">vào ${dmy(b.date)} · còn ${fm(b.left)} kg</div></div><button class="lnk" style="color:var(--accent)" data-all="${esc(b.id)}" data-v="${b.left}">Hết</button><input class="xq" data-tk="${esc(b.id)}" value="${esc(f.tk[b.id]??'')}" inputmode="decimal" placeholder="kg"></div>`}).join('')||'<div class="empty">Không có mẻ '+esc(tName(f.loai))+' đang ủ.</div>'}${B.length?'<div class="row" style="background:var(--sunk)"><div class="grow t">Tổng lấy ra lọc</div><div class="num" id="tkSum" style="font-weight:800;font-size:17px">0 kg</div></div>':''}</div>
     <div class="sec">Kết quả lọc – ${esc(tName(f.loai))}</div><div class="group">${(AB(f.loai)?[...P].sort((a,b)=>grOf(a).localeCompare(grOf(b))):P).map((p,i,arr)=>(AB(f.loai)&&(i===0||grOf(arr[i-1])!==grOf(p))?`<div class="row" style="background:var(--sunk)"><div class="grow t" style="color:var(--accent)">Loại ${grOf(p)}</div><div class="num" data-grs="${grOf(p)}" style="font-weight:800"></div></div>`:'')+`<div class="row"><div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${p.u==='kg'?'theo kg':'theo '+esc(p.u)+' · '+String(p.kg).replace('.',',')+' kg/'+esc(p.u)}${p.note?' · <b>'+esc(p.note)+'</b>':''}</div><div class="s" data-kgo="${esc(p.id)}" style="color:var(--accent);font-weight:700"></div></div><input class="xq" data-oo="${esc(p.id)}" value="${esc(f.o[p.id]??'')}" inputmode="decimal" placeholder="${esc(p.u)}"></div>`).join('')}
      <div class="row"><div class="grow"><div class="t" style="color:var(--bad)">Loại / hỏng (kg)</div></div><input class="xq" data-f="hong" value="${esc(f.hong)}" inputmode="decimal" placeholder="kg"></div>
      <div class="row" style="background:var(--sunk)"><div class="grow t">Tổng thành phẩm (quy đổi kg)</div><div class="num" id="okSum" style="font-weight:800;font-size:17px">0 kg</div></div>
      <div class="row" style="background:var(--sunk)"><div class="grow t">Tổng thành phẩm + hỏng</div><div class="num" id="allSum" style="font-weight:800;font-size:17px">0 kg</div></div></div><div class="auto" id="calcBox"></div>`}
  else if(f.kind==='cxuat'){const P=prods().filter(p=>Math.abs(C.tp.get(p.id)||0)>1e-9||f.q[p.id]);if(!f.gs){f.gs={};for(const p of P)if(num(f.q[p.id]))f.gs[xgOf(p)]=true}
    const XL=cfg().xe||[],xv=xeVal(f),sent={};for(const l of liveLogs())if(l.kind==='cxuat'&&l.date===f.date)for(const x of l.lines||[]){const g=x.g||xgOf(prodOf(x.p));(sent[g]=sent[g]||new Set()).add((l.xe||'?')+(l.gio?' lúc '+l.gio:''))}
    const row=p=>`<div class="row"><div class="grow"><div class="t">${esc(p.name)}</div><div class="s">đang có ${qU(p,C.tp.get(p.id)||0)}</div></div><input class="xq" style="width:68px" data-xth="${esc(p.id)}" value="${esc((f.xt2||{})[p.id]??'')}" inputmode="numeric" placeholder="thùng"><input class="xq" style="width:76px;margin-left:4px" data-xq="${esc(p.id)}" value="${esc(f.q[p.id]??'')}" inputmode="decimal" placeholder="${esc(p.u)}"></div>`;
    const grps=XG.map(([g,lab])=>{const G=P.filter(p=>xgOf(p)===g);if(!G.length)return sent[g]?`<div class="row" style="opacity:.55"><span style="width:22px;height:22px;border:2px solid #9fb3c6;border-radius:6px;display:inline-block;margin-right:8px"></span><div class="grow"><div class="t">${lab}</div><div class="s">đã đi xe ${esc([...sent[g]].join(', '))} · hết hàng ở kho 3</div></div></div>`:'';const on=!!f.gs[g],kg=r3(G.reduce((s,p)=>s+num(f.q[p.id])*(p.kg||1),0)),left=G.map(p=>qU(p,C.tp.get(p.id)||0)).join(' + ');
      return `<div class="row tap" data-xg="${g}" style="${on?'':'opacity:.85'}"><span style="width:22px;height:22px;border:2px solid ${on?'var(--accent)':'#9fb3c6'};background:${on?'var(--accent)':'transparent'};border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;margin-right:8px">${on?'✓':''}</span><div class="grow"><div class="t">${lab}</div><div class="s">${sent[g]?'đã đi xe '+esc([...sent[g]].join(', '))+' · ':''}${on&&kg?'<b>'+fm(kg,1)+' kg</b>':'còn '+left}</div></div></div>${on?G.map(row).join(''):''}`}).join('');
    body=`${f.saved?`<div class="alert g">✓ Đã lưu phiếu xe <b>${esc(f.saved)}</b> – chọn xe khác để xuất tiếp, hoặc bấm ✕ Đóng.</div>`:''}<div class="card" style="border:2px solid var(--accent);margin-bottom:10px"><div style="font-weight:800;color:var(--accent)">🚚 Bước 1 – Chọn xe</div>${optB(f,'xe',[...XL.map(x=>[x,esc(x)]),['__o','Xe ngoài']])}${f.xe==='__o'?inp(f,'xeO','Biển số xe ngoài','VD: 29C-12345','text'):''}<div class="grid2">${inp(f,'xgio','Giờ xe chạy','VD 06:00','text')}${inp(f,'lai','Lái xe','','text')}</div></div>
     <div class="sec">✅ Bước 2 – Tích loại hàng đi ${xv?'xe '+esc(xv):'theo xe'}</div><div class="group">${grps||'<div class="empty">Chưa có thành phẩm sau lọc – lập phiếu ③ trước.</div>'}${grps?`<div class="row" style="background:var(--sunk)"><div class="grow t">${xv?'Xe '+esc(xv)+' chở':'Tổng xe này'}</div><div class="num" id="xSum" style="font-weight:800"></div></div>`:''}</div>${xeDayHTML(f.date)}`}
  v.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><h1 class="big" style="margin:0"><span class="kn" style="background:${K.c}">${kOrd(f.kind)}</span> ${K.n}</h1><button class="btn sm" id="fX">✕ Đóng</button></div>
   <label class="f" style="margin-top:10px"><span class="lab">Ngày · <b style="color:var(--accent)">${dowVN(f.date)}</b></span><input type="date" data-f="date" value="${esc(f.date)}" max="${today()}" class="sxin"></label>
   ${body}${laborBox(f)}${inp(f,'note','Ghi chú (nếu có)','','text')}<div id="fMsg"></div><button class="btn block pri sxsave" id="fSave">Lưu</button>`;
  bindFormCh()}
function bindFormCh(){const f=S.form;$('#fX').onclick=()=>{S.form=null;render()};
  $$('[data-f]').forEach(el=>{const k=el.dataset.f;const h=()=>{f[k]=el.value;if(k==='date'||k==='xe'||k==='dest')render();else updCh()};el.oninput=h;el.onchange=h});
  $$('[data-o]').forEach(b=>b.onclick=()=>{const k=b.dataset.o;if(f[k]===b.dataset.ov)return;f[k]=b.dataset.ov;if(k==='loai'){f.tk={};f.o={};f.ncc='';f.nccQ=''}render()});
  $$('[data-tk]').forEach(el=>el.oninput=()=>{f.tk[el.dataset.tk]=el.value;updCh()});
  $$('[data-all]').forEach(b=>b.onclick=()=>{const e=$(`[data-tk="${b.dataset.all}"]`);const v=String(r3(+b.dataset.v)).replace('.',',');f.tk[b.dataset.all]=v;if(e)e.value=v;if(b.dataset.vt){f.tt=f.tt||{};f.tt[b.dataset.all]=b.dataset.vt;const t=$(`[data-tth="${b.dataset.all}"]`);if(t)t.value=b.dataset.vt}updCh()});
  $$('[data-tth]').forEach(el=>el.oninput=()=>{f.tt=f.tt||{};const id=el.dataset.tth;f.tt[id]=el.value;const x=calcCh().lotById.get(id),k=lotKgTh(x)||thungOf(f.loai),kg=r3(num(el.value)*k);f.tk[id]=kg?String(kg).replace('.',','):'';const e=$(`[data-tk="${id}"]`);if(e)e.value=f.tk[id];updCh()});
  $$('[data-oo]').forEach(el=>el.oninput=()=>{f.o[el.dataset.oo]=el.value;updCh()});
  $$('[data-xq]').forEach(el=>el.oninput=()=>{f.q[el.dataset.xq]=el.value;updCh()});
  $$('[data-xg]').forEach(r=>r.onclick=()=>{f.gs=f.gs||{};f.gs[r.dataset.xg]=!f.gs[r.dataset.xg];render()});
  $$('[data-xth]').forEach(el=>el.oninput=()=>{f.xt2=f.xt2||{};f.xt2[el.dataset.xth]=el.value;updCh()});
  if(f.kind==='cnx'){f.nvl='__chuoi';bindNcc()}
  const lf=$('#slFill');if(lf)lf.onclick=()=>{const sl=sugLoc(f.date,f.loai,f.dest),lp=locPlan(f.date,f.loai,f.dest);f.o={};for(const x of sl.rows)f.o[x.p.id]=String(x.q).replace('.',',');f.tk={};let need=sl.need;
    const put=(arr,lim)=>{for(const b of arr){if(need<=0.05||lim<=0.05)break;const t=Math.min(b.left,need,lim);f.tk[b.id]=String(r3(num(f.tk[b.id])+t)).replace('.',',');need=r3(need-t);lim=r3(lim-t)}};
    if(lp.due.length){put(lp.due,Infinity);const rq=reqFor(f.date,f.loai,f.dest,'rut');if(need>0.05&&rq&&rq.status==='ok')put(lp.nxt,num(rq.kg))}else put(openBats(calcCh(),f.loai).filter(b=>b.date<=f.date),Infinity);
    render();if(need>0.05){const rq=reqFor(f.date,f.loai,f.dest,'rut');ask('⚠️ THIẾU CHUỐI Ở MẺ ĐẾN HẠN\nCần lấy ra '+fm(sl.need)+' kg, đã điền '+fm(sl.need-need)+' kg – thiếu '+fm(need)+' kg.\n'+(lp.canRut?(rq&&rq.status==='pending'?'Lệnh rút đang chờ duyệt.':rq&&rq.status==='no'?'Lệnh rút đã bị từ chối.':'Gửi lệnh RÚT hàng mẻ kế để được duyệt.'):'Không có mẻ kế đủ ngày để rút.'))}else toast('Đã điền theo đề xuất – sửa lại theo thực tế lọc được')};
  const rs=$('#rqSend')||$('#rqSend2');if(rs)rs.onclick=()=>sendReq(f,locPlan(f.date,f.loai,f.dest));
  const sf=$('#sgFill');if(sf)sf.onclick=async()=>{const sg=sugFor(f.date,f.loai);if(!sg)return;const L=greenAv(f.date,f.loai).L.map(x=>Object.assign({},x,{rem:x.left}));f.tk={};f.tt={};
    const fill=(arr,need)=>{for(const x of arr){if(need<=0.05)break;const t=Math.min(x.rem,need);if(t<=0.05)continue;x.rem=r3(x.rem-t);const cur=num(f.tk[x.id])+t;f.tk[x.id]=String(r3(cur)).replace('.',',');const k=lotKgTh(x);if(k)f.tt[x.id]=String(Math.round(cur/k));need=r3(need-t)}return need};
    let miss=0,sub='';if(sg.nA!=null){const LA=L.filter(x=>x.gr!=='B'),LB=L.filter(x=>x.gr==='B');let mA=fill(LA,sg.nA),mB=fill(LB,sg.nB);
      if(mA>0.05){const r=fill(LB,mA);if(mA-r>0.05)sub+='lấy '+fm(mA-r)+' kg loại B bù cho A. ';mA=r}if(mB>0.05){const r=fill(LA,mB);if(mB-r>0.05)sub+='lấy '+fm(mB-r)+' kg loại A bù cho B. ';mB=r}miss=r3(mA+mB)}else miss=fill(L,sg.need);
    if(sg.room)f.room=String(sg.room);render();
    if(miss>0.05)await ask('⚠️ THIẾU NGUYÊN LIỆU\nCần '+fm(sg.need)+' kg nhưng chuối xanh đã về đến '+dmy(f.date)+' chỉ đủ '+fm(sg.need-miss)+' kg – thiếu '+fm(miss)+' kg.\n'+(sub?'Đã '+sub:'')+'Hãy nhập thêm chuối xanh ở bước ① hoặc giảm số vào phòng.');
    else toast(sub?'Đã điền – '+sub:'Đã điền theo đề xuất – sửa lại theo thực tế')};
  $('#fSave').onclick=saveCh;updCh()}
const sumTk=f=>r3(Object.values(f.tk||{}).reduce((s,v)=>s+num(v),0));
const sumOk=f=>r3(Object.entries(f.o||{}).reduce((s,[id,q])=>s+num(q)*(prodOf(id).kg||1),0));
function updCh(){const f=S.form;if(!f)return;const lt=$('#lbTot');if(lt){const t=num(f.hours),o=num(f.ot),gc=cfg().gioCong||8;lt.innerHTML=t||o?'Chính thức: <b>'+fm(num(f.people))+' người · '+fm(t)+' giờ</b> ('+fm(t/gc,2)+' công)'+(o||num(f.pot)?'<br>Tăng ca: <b>'+fm(num(f.pot))+' người · '+fm(o)+' giờ</b>':''):'Tổng số giờ = cộng giờ của cả nhóm (VD 5 người × 8 giờ = 40).'}
  const ts=$('#tkSum');if(ts){const th=r3(Object.values(f.tt||{}).reduce((s,v)=>s+num(v),0));ts.textContent=(f.kind==='cvu'&&th?fm(th)+' thùng · ':'')+fm(sumTk(f),1)+' kg'}
  $$('[data-kgo]').forEach(e=>{const p=prodOf(e.dataset.kgo),q=num(f.o[p.id]);e.textContent=q?(p.u==='kg'?'= '+fm(q)+' kg':fm(q)+' '+p.u+' × '+String(p.kg).replace('.',',')+' = '+fm(r3(q*(p.kg||1)),1)+' kg'):''});
  $$('[data-grs]').forEach(e=>{const g=e.dataset.grs;const k=r3(Object.entries(f.o||{}).reduce((s,[id,q])=>{const p=prodOf(id);return s+(grOf(p)===g?num(q)*(p.kg||1):0)},0));e.textContent=k?fm(k,1)+' kg':''});
  const os=$('#okSum');if(os){os.textContent=fm(sumOk(f),1)+' kg';$('#allSum').textContent=fm(r3(sumOk(f)+num(f.hong)),1)+' kg'}
  const xs=$('#xSum');if(xs){const th=Object.entries(f.xt2||{}).reduce((s,[id,v])=>s+(xqOn(f,id)?num(v):0),0),kg=Object.entries(f.q||{}).reduce((s,[id,q])=>s+(xqOn(f,id)?num(q)*(prodOf(id).kg||1):0),0);xs.textContent=(th?fm(th)+' thùng · ':'')+fm(r3(kg),1)+' kg'}
  const cb=$('#calcBox');if(!cb)return;
  if(f.kind==='cnx')thKg(f);
  if(f.kind==='cnx'&&AB(f.loai)){const n=nccPick(f),a=num(f.kgA),b=num(f.kgB),pa=num(f.priceA),pb=num(f.priceB),sh=num(f.ship),T=a+b,base=lotCode('CX'+(n.lot||'NCC'),f.date);cb.innerHTML=T?`Tổng <b>${fm(num(f.thA)+num(f.thB))} thùng · ${fm(T)} kg</b> (A ${fm(num(f.thA))} thùng = ${fm(a)} kg · B ${fm(num(f.thB))} thùng = ${fm(b)} kg)${sh?' · vận chuyển chia theo kg '+fm(sh/T)+' đ/kg':''}<br>${a&&pa?'Giá lô A <b>'+fm(pa+(sh/T))+' đ/kg</b> · ':''}${b&&pb?'Giá lô B <b>'+fm(pb+(sh/T))+' đ/kg</b>':''}<br>Số lô <b>${esc(base)}-A</b>, <b>${esc(base)}-B</b>`:'Gõ số thùng và giá loại A, loại B.'}
  else if(f.kind==='cnx'){const n=nccPick(f),kg=num(f.kg),p=num(f.price),sh=num(f.ship);cb.innerHTML=(kg?`<b>${fm(num(f.th))} thùng · ${fm(kg)} kg</b><br>`:'')+(kg&&p?`Tiền hàng ${fm(kg)} × ${fm(p)} = ${fm(kg*p)}${sh?' + vận chuyển '+fm(sh):''} · Giá lô <b>${fm((kg*p+sh)/kg)} đ/kg</b><br>`:'')+`Số lô <b>${esc(lotCode('CX'+(n.lot||'NCC'),f.date))}</b>`}
  else if(f.kind==='cvu'){const sg=sugFor(f.date,f.loai),a=sumTk(f);let cmp='';if(sg){const d=a-sg.need;{const av=greenAv(f.date,f.loai);if(av.all+0.05<sg.need)cmp+=`<br><b style="color:var(--bad)">⚠️ Thiếu nguyên liệu ${fm(sg.need-av.all)} kg so với đề xuất (chuối xanh đã về chỉ còn ${fm(av.all)} kg)</b>`}cmp+=`<br>Thực tế ${fm(a)} kg so với đề xuất ${fm(sg.need)} kg: <b style="color:${Math.abs(d)<=sg.need*0.03?'#1f7a45':'var(--bad)'}">${d>0?'+':''}${fm(d)} kg</b>`;if(sg.nA!=null){const C2=calcCh();let ta=0,tb=0;for(const [id,v] of Object.entries(f.tk||{})){const x=C2.lotById.get(id);if(x&&x.gr==='B')tb+=num(v);else ta+=num(v)}cmp+=` <span class="muted">(A ${fm(ta)}/${fm(sg.nA)} · B ${fm(tb)}/${fm(sg.nB)})</span>`}}cb.innerHTML=`Tổng vào kho ${esc(f.room)}: <b>${fm(a)} kg</b> · Số mẻ <b>${esc(batCode(f.date))}</b>${cmp}`}
  else if(f.kind==='cloc'){const a=sumTk(f),ok=sumOk(f),h=num(f.hong),d=r3(a-ok-h),sl=sugLoc(f.date,f.loai,f.dest);const kh=sl.rows.length?`<br>So kế hoạch: thành phẩm ${fm(ok,1)} / ${fm(sl.kg,1)} kg <b style="color:${ok>=sl.kg*0.98?'#1f7a45':'var(--bad)'}">(${ok-sl.kg>0?'+':''}${fm(ok-sl.kg,1)})</b> · lấy ra ${fm(a)} / ${fm(sl.need)} kg`:'';
    cb.innerHTML=a?kh.slice(4)+'<br>'+`Đưa ra lọc <b>${fm(a)} kg</b> · Đạt <b>${fm(ok,1)} kg</b> (${fm(ok/a*100,1)}%) · Hỏng ${fm(h)} kg (${fm(h/a*100,1)}%)<br>${Math.abs(d)>0.05?'Chênh (hao, quy đổi gói) <b style="color:'+(Math.abs(d)>a*0.03?'var(--bad)':'inherit')+'">'+fm(d,1)+' kg</b>':'Khớp kg'}`:'Gõ kg lấy từ từng mẻ, rồi gõ kết quả lọc.'+kh}}
function batCode(date){const ym=date.slice(2,4)+date.slice(5,7);const used=new Set(liveLogs().filter(l=>l.kind==='cvu').map(l=>l.code));let i=1;while(used.has('M'+ym+'-'+String(i).padStart(2,'0')))i++;return 'M'+ym+'-'+String(i).padStart(2,'0')}
async function saveCh(){const f=S.form,C=calcCh(),msg=t=>$('#fMsg').innerHTML='<div class="alert r">'+esc(t)+'</div>';
  const people=num(f.people),hours=num(f.hours),ot=num(f.ot),pot=num(f.pot);
  if(!f.date)return msg('Chọn ngày.');if(f.date>today())return msg('Ngày không được sau hôm nay.');
  const d={kind:f.kind,date:f.date,people,hours,pot,ot,hv:2,note:String(f.note||'').trim(),by:S.uid,at:Date.now()};
  if(f.kind!=='cxuat')d.loai=f.loai;
  if(f.kind==='cnx')thKg(f);
  if(f.kind==='cnx'&&AB(f.loai)){const n=nccPick(f);if(!n.name)return msg('Chọn nhà cung cấp.');const a=num(f.kgA),b=num(f.kgB),T=a+b;if(T<=0)return msg('Gõ số thùng loại A hoặc loại B.');if(((a&&!num(f.priceA))||(b&&!num(f.priceB)))&&!await ask('Chưa gõ đủ giá A/B. Vẫn lưu (kế toán điền sau)?'))return;
    if(ot&&!pot)return msg('Gõ số người tăng ca.');if(!people||!(hours||ot)){if(!await ask('Chưa ghi số người / tổng số giờ làm. Vẫn lưu?'))return}
    const base=lotCode('CX'+(n.lot||'NCC'),f.date),sh=num(f.ship),btn=$('#fSave');btn.disabled=true;btn.textContent='Đang lưu…';let first=true;
    try{for(const [g,kg,pr] of [['A',a,num(f.priceA)],['B',b,num(f.priceB)]]){if(!kg)continue;const d2=Object.assign({},d,{grade:g,thung:num(g==='A'?f.thA:f.thB),kgThung:thungOf(f.loai),ncc:n.name,nccCode:n.code,kg,price:pr,ship:Math.round(sh*kg/T),lot:base+'-'+g,xe:xeVal(f),at:Date.now()+(g==='B'?1:0)});if(!first){d2.people=0;d2.hours=0;d2.pot=0;d2.ot=0}first=false;await S.db.doc('mlog/'+newId(f.date)).set(d2)}
      if(n.fresh){const c=JSON.parse(JSON.stringify(cfg()));c.ncc.push({name:n.name,code:'',lot:n.lot,fresh:true,by:S.uid});try{await S.db.doc('mcfg/main').set(c)}catch(e){}}
      toast('✓ Đã lưu nhập chuối xanh A/B');S.form=null;S.tab='home';render();scrollTo(0,0)}
    catch(e){if(e&&e.code==='queued'){toast('⏳ Mạng yếu: đã giữ phiếu trên máy, app tự gửi lại');S.form=null;S.tab='home';render();return}btn.disabled=false;btn.textContent='Lưu';msg('Chưa lưu được: '+(e.message||'lỗi mạng')+'. Thử lại.')}return}
  if(f.kind==='cnx'){const n=nccPick(f);if(!n.name)return msg('Chọn nhà cung cấp.');const kg=num(f.kg);if(kg<=0)return msg('Gõ số thùng chuối xanh.');d.thung=num(f.th);d.kgThung=thungOf(f.loai);const price=num(f.price);if(price<=0&&!await ask('Chưa gõ giá nhập. Vẫn lưu (kế toán điền sau)?'))return;
    Object.assign(d,{ncc:n.name,nccCode:n.code,kg,price,ship:num(f.ship),lot:lotCode('CX'+(n.lot||'NCC'),f.date),xe:xeVal(f)});
    if(n.fresh){const c=JSON.parse(JSON.stringify(cfg()));c.ncc.push({name:n.name,code:'',lot:n.lot,fresh:true,by:S.uid});try{await S.db.doc('mcfg/main').set(c)}catch(e){}}}
  else if(f.kind==='cvu'){const takes=[];for(const [id,v] of Object.entries(f.tk)){const kg=num(v);if(!kg)continue;const x=C.lotById.get(id);if(x&&x.date>f.date)return msg('Lô '+x.lot+' về ngày '+dmy(x.date)+' – sau ngày vào phòng '+dmy(f.date)+', không lấy được.');if(x&&kg>x.left+0.5&&!await ask(`Lô ${x.lot}: lấy ${fm(kg)} kg nhưng chỉ còn ${fm(x.left)} kg. Vẫn lưu?`))return;takes.push({id,lot:x?x.lot:'',kg,th:num((f.tt||{})[id])})}
    if(!takes.length)return msg('Gõ số kg lấy từ lô chuối xanh.');{const r=+f.room,bz=inRoom(C,r,f.date),tk=takes.reduce((s,t)=>s+t.kg,0);if(bz.length&&!await ask(`Kho ${r} đang có mẻ ${bz.map(b=>b.code).join(', ')} (còn ${fm(bz.reduce((s,b)=>s+b.left,0))} kg). Vẫn cho vào?`))return;if(tk>capOf(r)&&!await ask(`${fm(tk)} kg vượt sức chứa kho ${r} (${fm(capOf(r))} kg). Vẫn lưu?`))return}{const sg=sugFor(f.date,f.loai);if(sg){d.sug=sg.need;if(sg.carry)d.carry=sg.carry;if(sg.nA!=null){d.sugA=sg.nA;d.sugB=sg.nB}}}Object.assign(d,{room:+f.room,gio:f.gio||'',code:batCode(f.date),takes,kg:r3(takes.reduce((s,t)=>s+t.kg,0)),th:r3(takes.reduce((s,t)=>s+t.th,0))})}
  else if(f.kind==='cloc'){const takes=[];for(const [b,v] of Object.entries(f.tk)){const kg=num(v);if(!kg)continue;const x=C.bat.get(b);if(x&&kg>x.left+0.5&&!await ask(`Mẻ ${x.code}: lấy ${fm(kg)} kg nhưng chỉ còn ${fm(x.left)} kg. Vẫn lưu?`))return;takes.push({b,kg})}
    if(!takes.length)return msg('Gõ số kg lấy từ ít nhất 1 mẻ.');const outs=[];for(const [p,v] of Object.entries(f.o)){const q=num(v);if(!q)continue;outs.push({p,q,kg:r3(q*(prodOf(p).kg||1))})}
    const kgIn=r3(takes.reduce((s,t)=>s+t.kg,0)),kgOk=r3(outs.reduce((s,o)=>s+o.kg,0)),hong=num(f.hong);
    if(!outs.length&&!hong)return msg('Gõ kết quả lọc (số lượng từng sản phẩm, hỏng).');
    if(kgOk+hong>kgIn*1.05&&!await ask(`Đạt + hỏng = ${fm(kgOk+hong)} kg lớn hơn số lấy ra ${fm(kgIn)} kg. Vẫn lưu?`))return;
    {const sl=sugLoc(f.date,f.loai,f.dest);if(sl.rows.length){d.sugKg=sl.kg;d.sugIn=sl.need}}Object.assign(d,{dest:f.dest,takes,kgIn,outs,kgOk,hong})}
  else if(f.kind==='cxuat'){if(!xeVal(f))return msg('Chọn xe ở Bước 1.');const lines=[];for(const [p,v] of Object.entries(f.q)){const q=num(v);if(!q||!xqOn(f,p))continue;const have=C.tp.get(p)||0;if(q>have+1e-9&&!await ask(`${prodOf(p).name}: xuất ${fm(q)} nhưng chỉ có ${fm(have)}. Vẫn lưu?`))return;lines.push({p,q,th:num((f.xt2||{})[p]),g:xgOf(prodOf(p))})}
    if(!lines.length)return msg('Tích loại hàng và gõ số lượng đi xe này.');const gs=[...new Set(lines.map(x=>x.g))];Object.assign(d,{dest:gs.length===1?gs[0]:'multi',lines,xe:xeVal(f),gio:String(f.xgio||'').trim(),lai:String(f.lai||'').trim()})}
  if(ot&&!pot)return msg('Gõ số người tăng ca.');if(!people||!(hours||ot)){if(!await ask('Chưa ghi số người / tổng số giờ làm. Vẫn lưu?'))return}
  const btn=$('#fSave');btn.disabled=true;btn.textContent='Đang lưu…';
  try{await S.db.doc('mlog/'+newId(f.date)).set(d);toast('✓ Đã lưu '+KIND[f.kind].n.toLowerCase());const nx=f.kind==='cloc'&&d.outs.length?{lines:d.outs}:null;S.form=null;S.tab='home';if(f.kind==='cxuat')return openFormCh('cxuat',{date:f.date,saved:d.xe});
    if(nx){const q={};for(const o of nx.lines)q[o.p]=String(o.q).replace('.',',');const dest=f.dest==='win'?'win':'hn';if(await ask('Đã lưu lọc lựa. Mở luôn phiếu ④ Xuất hàng với số vừa lọc?'))return openFormCh('cxuat',{q,dest})}
    render();scrollTo(0,0)}
  catch(e){if(e&&e.code==='queued'){toast('⏳ Mạng yếu: đã giữ phiếu trên máy, app tự gửi lại');S.form=null;S.tab='home';render();return}btn.disabled=false;btn.textContent='Lưu';msg('Chưa lưu được: '+(e.message||'lỗi mạng')+'. Thử lại.')}}

/* ---- v122: ⓪ Kế hoạch theo ngày xuất xưởng (tổ trưởng nhập) ----
   mlog/KH<yyyy-mm-dd> {kind:'cplan',date:<ngày giao>,q:{pid:sl}}. Thực tế = phiếu ③ lọc ngày giao−1.
   Vào phòng ngày D phục vụ: mỗi mốc n trong marks → lọc D+n−1, giao D+n. */
/* v125: nhóm giao – Winmart lọc chiều ngày 3, giao sáng ngày 4; khách khác lọc + xuất trong ngày 4 (ngày cuối). Kế hoạch theo ngày giao = ngày cuối của mẻ */
const grpOf=p=>(p.g==='win'||p.id==='twin')?'win':'khac';
const xgOf=p=>p.xg||(grpOf(p)==='win'?'win':['tgop','tgom'].includes(p.id)?'go':p.id==='tck'?'ck':['tbep','tbepq'].includes(p.id)?'bep':'hn');
const xqOn=(f,id)=>!!(f.gs||{})[xgOf(prodOf(id))];
function xeDayHTML(date){const L=liveLogs().filter(l=>l.kind==='cxuat'&&l.date===date).sort((a,b)=>(a.gio||'').localeCompare(b.gio||'')||a.at-b.at);if(!L.length)return '';const M=new Map();for(const l of L){const k=l.xe||'(chưa ghi xe)';if(!M.has(k))M.set(k,{gio:l.gio,lai:l.lai,rows:[]});const m=M.get(k);for(const x of l.lines||[]){const p=prodOf(x.p);m.rows.push({g:XGN[x.g||xgOf(p)]||'',p,q:num(x.q),th:num(x.th),kg:r3(num(x.q)*(p.kg||1))})}}
  let tot=0;const h=[...M.entries()].map(([xe,m])=>{const s2=r3(m.rows.reduce((s,r)=>s+r.kg,0));tot+=s2;return `<div class="card" style="margin-top:8px"><b>🚚 ${esc(xe)}</b>${m.gio?' · '+esc(m.gio):''}${m.lai?' · '+esc(m.lai):''}<table class="gt"><tr><th>Nhóm</th><th>Sản phẩm</th><th>SL</th><th>Kg</th></tr>${m.rows.map(r=>`<tr><td>${esc(r.g)}</td><td>${esc(r.p.name)}</td><td>${r.th?fm(r.th)+' thùng · ':''}${qU(r.p,r.q)}</td><td>${fm(r.kg,1)}</td></tr>`).join('')}<tr><td colspan="3"><b>Cộng xe</b></td><td><b>${fm(s2,1)}</b></td></tr></table></div>`}).join('');
  return `<div class="sec">Bảng kê xuất theo xe ${dmy(date)}</div>${h}<div class="row" style="background:var(--sunk);border-radius:10px;margin-top:6px"><div class="grow t">Tổng ${M.size} xe</div><div class="num" style="font-weight:800">${fm(r3(tot),1)} kg</div></div>`}
const lagOf=p=>grpOf(p)==='win'?1:0; /* số ngày lọc trước ngày giao */
const capOf=r=>{const c=chc().caps||{};return num(c[r])||5000};
/* v133: kho 1 = nguyên liệu chuối xanh, kho 3 = thành phẩm, kho ủ rấm = 2,4,5,6 (cấu hình rl) */
const roomList=()=>{const l=(chc().rl||[]).map(Number).filter(x=>x>0);return l.length?l:[2,4,5,6]};
/* v134: rấm 3 ngày trong kho ủ (ngày vào = ngày 0 → ngày 0,1,2); ngày thứ 4 (ngày vào + 3) toàn bộ mẻ chuyển về kho 3 – kho lọc lựa, thành phẩm tồn */
const KHO_TP=3;
const ramOf=t=>{const n=Math.round(num((chc().types[t]||{}).ram));return n>0?n:3};
const atTP=(b,ref)=>dayN(b.date,ref)>=ramOf(b.loai);
const khoOf=(b,ref)=>atTP(b,ref)?KHO_TP:b.room;
const inRoom=(C,r,ref)=>openBats(C).filter(b=>b.room===r&&b.date<=(ref||today())&&!atTP(b,ref));
function planKg(date,t,g,gr){const P=S.plans[date];if(!P)return 0;let s=0;for(const p of prods(t))if((!g||grpOf(p)===g)&&(!gr||grOf(p)===gr))s+=num((P.q||{})[p.id])*(p.kg||1);return r3(s)}
function actualOuts(giao){const m={};for(const l of liveLogs())if(l.kind==='cloc')for(const o of l.outs||[]){const p=prodOf(o.p);if(l.date===addDays(giao,-lagOf(p)))m[o.p]=(m[o.p]||0)+num(o.q)}return m}
/* v128: tỷ lệ thành phẩm (chuối xanh → thành phẩm) cố định theo Cài đặt, mặc định 88% */
function yieldOf(t){const T=chc().types[t]||{};const y=num(T.yield);return y>0?y/100:0.88}
function yieldAct(t){let a=0,b=0;const from=addDays(today(),-14);for(const l of liveLogs())if(l.kind==='cloc'&&l.loai===t&&l.date>=from&&num(l.kgOk)>0){a+=num(l.kgIn);b+=num(l.kgOk)}return a>50?b/a:null}
/* v126: đề xuất vào phòng ngày D theo kế hoạch (kg kế hoạch ngày giao D+days−1 ÷ tỷ lệ đạt) */
function greenAv(d,t){const L=(calcCh().lots.get(t)||[]).filter(x=>x.left>0.05&&x.date<=d);const A=r3(L.filter(x=>x.gr!=='B').reduce((s,x)=>s+x.left,0)),B=r3(L.filter(x=>x.gr==='B').reduce((s,x)=>s+x.left,0));return {A,B,all:r3(A+B),L}}
/* v130: lệnh RÚT (tăng đơn, lấy từ mẻ kế) / SIẾT (giảm đơn, giữ lại trong phòng) – tổ trưởng đề xuất, quản lý xưởng duyệt.
   Nợ chuyển tiếp = Σ rút đã duyệt − Σ siết đã duyệt − phần đã cộng vào các phiếu vào phòng (cvu.carry) → cộng vào đề xuất ủ đến khi khớp */
const meName=()=>noAcc(S.names[S.uid]||'').trim();
const isApprover=()=>isAdmin()||(chc().approvers||[]).some(u=>noAcc(u).trim()===meName());
const liveReqs=()=>(S.reqs||[]).filter(r=>!r.deleted);
function carryOf(t,D){let c=0;for(const r of liveReqs())if(r.status==='ok'&&r.loai===t&&r.date<=D)c+=r.type==='rut'?num(r.kg):-num(r.kg);for(const l of liveLogs())if(l.kind==='cvu'&&l.loai===t&&l.date<=D)c-=num(l.carry);return Math.round(c)}
function locPlan(d,t,dest){const T=chc().types[t]||{days:4},sl=sugLoc(d,t,dest),C=calcCh(),dueDay=dest==='win'||(dest==='all'&&sl.w.rows.length)?T.days-1:T.days;
  const B=openBats(C,t).filter(b=>b.date<=d),due=B.filter(b=>dayN(b.date,d)>=dueDay),nxt=B.filter(b=>{const n=dayN(b.date,d);return n<dueDay&&n>=3});
  const avDue=r3(due.reduce((s,b)=>s+b.left,0)),orig=r3(due.reduce((s,b)=>s+num(b.sug||0),0));
  const r={sl,due,nxt,avDue,orig,short:0,sur:0};if(!sl.rows.length||!due.length)return r;
  if(sl.need>avDue+0.5)r.short=Math.round(sl.need-avDue);else if(avDue>sl.need+0.5)r.sur=Math.round(avDue-sl.need);
  r.canRut=r.short?Math.round(Math.min(r.short,nxt.reduce((s,b)=>s+b.left,0))):0;return r}
const reqFor=(d,t,dest,type)=>liveReqs().filter(r=>r.date===d&&r.loai===t&&r.dest===dest&&r.type===type).sort((a,b)=>b.at-a.at)[0];
const ST={pending:['w','⏳ Chờ duyệt'],ok:['g','✓ Đã duyệt'],no:['r','✕ Từ chối']};
function reqBox(f,lp){const t=f.loai;if(!lp.short&&!lp.sur)return '';const type=lp.short?'rut':'siet',rq=reqFor(f.date,t,f.dest,type);
  const what=type==='rut'?(lp.canRut?`Rút <b>${fm(lp.canRut)} kg</b> từ mẻ kế ${lp.nxt.map(b=>esc(b.code)+' · kho '+khoOf(b,f.date)).join(', ')}<div class="tiny muted">Kế hoạch các ngày sau giữ nguyên · ghi nợ chuyển tiếp ${fm(lp.canRut)} kg, cộng vào đề xuất ủ đến khi khớp.</div>`:`<span style="color:var(--bad)">Không có mẻ kế đủ ngày 3 để rút</span> – giao thiếu ${fm(lp.short)} kg chuối.`)
    :`Giữ lại <b>${fm(lp.sur)} kg</b> trong ${lp.due.map(b=>esc(b.code)+' · kho '+khoOf(b,f.date)).join(', ')} ở kho 3 – lần lọc sau lấy trước<div class="tiny muted">Trừ ${fm(lp.sur)} kg (≈ ${fm(Math.round(lp.sur/thungOf(t)))} thùng) vào đề xuất ủ và đặt chuối xanh các ngày tới.</div>`;
  const head=type==='rut'?`<div class="alert w" style="background:#FFF4E0;border:1px solid #F2A900;color:#5a3f00">⚠️ Mẻ đến hạn còn ${fm(lp.avDue)} kg, kế hoạch cần lấy ra ${fm(lp.sl.need)} kg → <b>thiếu ${fm(lp.short)} kg</b>.</div>`:`<div class="alert g">✅ Mẻ đến hạn còn ${fm(lp.avDue)} kg, kế hoạch chỉ cần ${fm(lp.sl.need)} kg → <b>dư ${fm(lp.sur)} kg</b> → đề xuất siết tồn.</div>`;
  let act;if(!rq)act=(type==='rut'&&!lp.canRut)?'':`<label class="f" style="margin-top:8px"><span class="lab">Lý do / ghi chú</span><input id="rqNote" class="sxin" style="font-size:15px!important" placeholder="VD: Win tăng đơn…"></label><button class="btn block pri" id="rqSend">📨 Gửi ${esc((chc().approvers||[])[0]||'quản lý xưởng')} duyệt lệnh ${type==='rut'?'RÚT':'SIẾT'}</button>`;
  else act=`<div class="row" style="margin-top:8px"><div class="grow"><span class="chip ${ST[rq.status][0]}">${ST[rq.status][1]}</span> Lệnh ${type==='rut'?'rút':'siết'} ${fm(rq.kg)} kg · gửi ${new Date(rq.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})} bởi ${esc(nameOf(rq.by))}${rq.apBy?`<div class="tiny muted">${esc(nameOf(rq.apBy))} ${rq.status==='ok'?'duyệt':'từ chối'} lúc ${new Date(rq.apAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}${rq.apNote?' · “'+esc(rq.apNote)+'”':''}</div>`:''}${rq.status==='pending'?'<div class="tiny muted">Trong lúc chờ: điền được phần có sẵn ở mẻ đến hạn; phần '+(type==='rut'?'rút':'siết')+' chỉ áp dụng sau khi duyệt.</div>':''}</div></div>${rq.status==='no'?'<button class="btn block" id="rqSend2">Gửi lại đề xuất</button>':''}`;
  return `<div class="card" style="margin-bottom:12px;border:2px solid ${type==='rut'?'#F2A900':'#2E8B57'}"><div style="font-weight:800">${type==='rut'?'Lệnh RÚT hàng mẻ kế':'Lệnh SIẾT tồn'}${lp.orig?` <span class="tiny muted">· kế hoạch lúc vào phòng ${fm(lp.orig*lp.sl.y,1)} kg TP → hiện tại ${fm(lp.sl.kg,1)} kg TP</span>`:''}</div>${head}<div style="margin-top:6px">${what}</div>${act}</div>`}
async function sendReq(f,lp){const type=lp.short?'rut':'siet',kg=type==='rut'?lp.canRut:lp.sur;if(!kg)return;
  const d={kind:'creq',type,date:f.date,loai:f.loai,dest:f.dest,giao:lp.sl.giao,kg,need:lp.sl.need,avDue:lp.avDue,due:lp.due.map(b=>b.id),src:type==='rut'?lp.nxt.map(b=>b.id):[],note:String(($('#rqNote')||{}).value||'').trim(),status:'pending',by:S.uid,at:Date.now()};
  try{await S.db.doc('mlog/RQ'+f.date+'-'+type+'-'+Date.now().toString(36)).set(d);S.reqs=(S.reqs||[]).concat([d]);toast('📨 Đã gửi đề xuất – chờ duyệt');render()}catch(e){if(e&&e.code==='queued'){toast('⏳ Mạng yếu: đã giữ, tự gửi lại');render()}else toast('Chưa gửi được')}}
async function decideReq(r,ok,note){try{await S.db.doc('mlog/'+r.id).update({status:ok?'ok':'no',apBy:S.uid,apAt:Date.now(),apNote:note||''});toast(ok?'✓ Đã duyệt':'Đã từ chối')}catch(e){toast('Chưa lưu được')}}
function reqsHTML(){if(!isApprover())return '';const P=liveReqs().filter(r=>r.status==='pending').sort((a,b)=>a.at-b.at);if(!P.length)return '';
  return `<div class="sec" style="color:var(--bad)">Lệnh chờ duyệt (${P.length})</div><div class="group">${P.map(r=>`<div class="row" style="flex-direction:column;align-items:stretch"><div><span class="chip ${r.type==='rut'?'r':'g'}">${r.type==='rut'?'RÚT':'SIẾT'}</span> <b>${esc(tName(r.loai))} · lọc ${dmy(r.date)} cho ${r.dest==='win'?'Winmart':r.dest==='all'?'Winmart + khách khác':'khách khác'} xuất xưởng ${dmy(r.giao)}</b></div>
    <div class="s">Cần lấy ra ${fm(r.need)} kg · mẻ đến hạn còn ${fm(r.avDue)} kg → ${r.type==='rut'?'rút <b>'+fm(r.kg)+' kg</b> từ mẻ kế (nợ chuyển tiếp)':'giữ lại <b>'+fm(r.kg)+' kg</b> trong phòng'} · gửi bởi ${esc(nameOf(r.by))} ${new Date(r.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}${r.note?' · “'+esc(r.note)+'”':''}</div>
    <input data-rqn="${esc(r.id)}" placeholder="Ý kiến duyệt (không bắt buộc)" style="margin-top:6px"><div class="grid2" style="margin-top:6px"><button class="btn pri" data-rqok="${esc(r.id)}" style="background:#2E8B57">✓ Duyệt</button><button class="btn" data-rqno="${esc(r.id)}" style="color:var(--bad)">✕ Từ chối</button></div></div>`).join('')}</div>`}
function bindReqs(){$$('[data-rqok]').forEach(b=>b.onclick=()=>{const r=liveReqs().find(x=>x.id===b.dataset.rqok);if(r)decideReq(r,true,($(`[data-rqn="${r.id}"]`)||{}).value)});
  $$('[data-rqno]').forEach(b=>b.onclick=()=>{const r=liveReqs().find(x=>x.id===b.dataset.rqno);if(r)decideReq(r,false,($(`[data-rqn="${r.id}"]`)||{}).value)})}
function reqHistHTML(){const L=liveReqs().slice().sort((a,b)=>b.at-a.at).slice(0,10);if(!L.length)return '';
  return `<div class="sec">Lịch sử lệnh rút / siết</div><div class="card"><table class="gt"><tr><th>Ngày lọc</th><th>Lệnh</th><th>Kg</th><th>Trạng thái</th></tr>${L.map(r=>`<tr><td>${dmy(r.date)}</td><td>${r.type==='rut'?'Rút':'Siết'} · ${esc(tName(r.loai))}</td><td>${fm(r.kg)}</td><td><span class="chip ${ST[r.status][0]}">${ST[r.status][1]}</span></td></tr>`).join('')}</table>${(()=>{const c=Object.keys(chc().types).map(t=>{const v=carryOf(t,today());return v?esc(tName(t))+' '+(v>0?'+':'')+fm(v)+' kg':''}).filter(Boolean);return c.length?`<div class="tiny muted" style="margin-top:6px">Nợ chuyển tiếp đang cộng vào đề xuất ủ: ${c.join(' · ')}</div>`:''})()}</div>`}
function sugFor(D,t){const T=chc().types[t]||{days:4};const giao=addDays(D,T.days),k=planKg(giao,t);if(!k)return null;const y=yieldOf(t);
  const r={giao,kgTP:k,y,need:Math.round(k/y)};if(AB(t)){r.nA=Math.round(planKg(giao,t,null,'A')/y);r.nB=Math.round(planKg(giao,t,null,'B')/y)}
  const cy=carryOf(t,D);if(cy){r.carry=Math.max(-r.need,cy);r.need=Math.max(0,r.need+cy);if(r.nA!=null){r.nA=Math.max(0,r.nA+cy)}}
  if(D>=today()){const x=schedule(Math.max(1,Math.round((new Date(D)-new Date(today()))/864e5)+1)).find(z=>z.D===D&&z.t===t);if(x)r.room=x.room}return r}
/* v128: đề xuất lọc ngày d: Winmart → kế hoạch giao d+1; khách khác → kế hoạch giao d */
function sugLoc(d,t,dest){if(dest==='all'){const w=sugLoc(d,t,'win'),k=sugLoc(d,t,'khac'),rows=[...w.rows.map(x=>Object.assign({g:'win',giao:w.giao},x)),...k.rows.map(x=>Object.assign({g:'khac',giao:k.giao},x))],kg=r3(w.kg+k.kg);return {giao:w.rows.length?w.giao:k.giao,rows,kg,y:w.y,need:Math.round(kg/w.y),w,k}}
  const g=dest==='win'?'win':'khac',giao=dest==='win'?addDays(d,1):d,P=S.plans[giao],y=yieldOf(t),rows=[];
  for(const p of prods(t))if(grpOf(p)===g){const q=num(((P||{}).q||{})[p.id]);if(q)rows.push({p,q,kg:r3(q*(p.kg||1))})}
  const kg=r3(rows.reduce((s,x)=>s+x.kg,0));return {giao,rows,kg,y,need:Math.round(kg/y)}}
function schedule(nDays){const C=calcCh(),c=chc(),out=[];const occ=[];
  for(const b of openBats(C))occ.push({room:b.room,to:addDays(b.date,ramOf(b.loai)-1)});
  const green={};for(const t of Object.keys(c.types)){green[t]=r3((C.lots.get(t)||[]).reduce((s,x)=>s+Math.max(0,x.left),0));if(AB(t))for(const g of ['A','B'])green[t+g]=r3((C.lots.get(t)||[]).filter(x=>x.gr===g).reduce((s,x)=>s+Math.max(0,x.left),0))}
  for(let i=0;i<nDays;i++){const D=addDays(today(),i);
    for(const [t,T] of Object.entries(c.types)){let kg=0;const serve=[];
      let kA=0,kB=0;{const giao=addDays(D,T.days),k=planKg(giao,t);if(k>0){kg=k;const w=planKg(giao,t,'win'),o=planKg(giao,t,'khac');if(w)serve.push('Win (lọc '+dmy(addDays(giao,-1))+')');if(o)serve.push('khách khác');serve.push('xuất xưởng '+dmy(giao));if(AB(t)){kA=planKg(giao,t,null,'A');kB=planKg(giao,t,null,'B')}}}
      if(kg<=0)continue;const y=yieldOf(t);const need=Math.round(kg/y);
      const busy=new Set(occ.filter(o=>o.to>=D).map(o=>o.room));const free=[];for(const r of roomList())if(!busy.has(r))free.push(r);
      const fit=free.filter(r=>capOf(r)>=need).sort((a,b)=>capOf(a)-capOf(b));const room=fit[0]||null;
      if(room)occ.push({room,to:addDays(D,ramOf(t)-1)});
      const have=green[t]||0,use=Math.min(have,need);green[t]=r3(have-use);const ab=AB(t)?{nA:Math.round(kA/y),nB:Math.round(kB/y)}:null;
      if(ab){for(const g of ['A','B']){const n2=ab['n'+g],h=green[t+g]||0;ab['h'+g]=h;ab['b'+g]=Math.max(0,n2-h);green[t+g]=r3(h-Math.min(h,n2))}}
      out.push({D,t,kgTP:kg,y,need,room,free:free.length,serve,have,buy:ab?ab.bA+ab.bB:Math.max(0,need-have),ab})}}
  return out}
function viewPlan(v){const f=S.form,t=f.loai,P=S.plans[f.date],q=f.q,act=actualOuts(f.date),PR=prods(t);
  const grp=g=>PR.filter(p=>grpOf(p)===g);const G=[['win','Winmart – lọc chiều hôm trước, xuất xưởng sáng'],['khac','Khách khác – lọc + xuất xưởng cùng ngày']].filter(([g])=>grp(g).length);
  const kgP=p=>num(q[p.id])*(p.kg||1),kgA=p=>num(act[p.id])*(p.kg||1);
  const totP=r3(PR.reduce((s,p)=>s+kgP(p),0)),totA=r3(PR.reduce((s,p)=>s+kgA(p),0));
  const rows=G.map(([g,lab])=>`<div class="row" style="background:var(--sunk)"><div class="grow t" style="color:var(--accent)">${lab}</div></div>`+grp(g).map(p=>`<div class="row"><div class="grow"><div class="t">${esc(p.name)}${grOf(p)?' <span class="chip '+(grOf(p)==='A'?'g':'w')+'">'+grOf(p)+'</span>':''}</div><div class="s">${esc(p.u)}${p.u!=='kg'?' · '+String(p.kg).replace('.',',')+' kg':''}${p.note?' · '+esc(p.note):''}</div></div><input class="xq" data-pq="${esc(p.id)}" value="${esc(q[p.id]??'')}" inputmode="decimal" placeholder="KH"><div class="num" data-pk="${esc(p.id)}" style="width:72px;color:var(--accent);font-weight:700">${kgP(p)?fm(r3(kgP(p)),1):'—'}</div></div>`).join('')).join('');
  const S7=schedule(8);
  const sch=S7.map(x=>`<tr><td>${dmy(x.D)}${x.D===today()?' <b>(nay)</b>':''}<br><span class="tiny muted">${esc(tName(x.t))}</span></td><td class="tiny">${x.serve.map(esc).join('<br>')}</td><td><b>${fm(x.need)}</b>${x.ab?'<br><span class="tiny muted">A '+fm(x.ab.nA)+' · B '+fm(x.ab.nB)+'</span>':''}</td><td>${x.room?'P'+x.room+' <span class="tiny muted">('+fm(capOf(x.room)/1000)+' t)</span>':'<span class="chip r">'+(x.free?'vượt sức chứa':'hết phòng')+'</span>'}</td></tr>`).join('');
  const buy=S7.flatMap(x=>x.ab?['A','B'].map(g=>`<tr><td>${dmy(x.D)}</td><td>${esc(tName(x.t))} ${g}</td><td>${fm(x.ab['n'+g])}</td><td>${fm(x.ab['h'+g])}</td><td style="${x.ab['b'+g]?'color:var(--bad);font-weight:700':''}">${fm(x.ab['b'+g])}</td></tr>`):[`<tr><td>${dmy(x.D)}</td><td>${esc(tName(x.t))}</td><td>${fm(x.need)}</td><td>${fm(x.have)}</td><td style="${x.buy?'color:var(--bad);font-weight:700':''}">${fm(x.buy)}</td></tr>`]).join('');
  const hist=[];for(let i=-6;i<=0;i++){const g=addDays(today(),i),kp=planKg(g,t),a=actualOuts(g);const ka=r3(prods(t).reduce((s,p)=>s+num(a[p.id])*(p.kg||1),0));if(kp||ka)hist.push(`<tr><td>${dmy(g)}</td><td>${fm(kp,1)}</td><td>${fm(ka,1)}</td><td style="color:${ka-kp<0?'var(--bad)':'#1f7a45'};font-weight:700">${(ka-kp>0?'+':'')+fm(ka-kp,1)}</td></tr>`)}
  v.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><h1 class="big" style="margin:0"><span class="kn" style="background:#6b4fa3">0</span> Kế hoạch</h1><button class="btn sm" id="fX">✕ Đóng</button></div>
   <div class="opt" style="margin:10px 0 6px"><button id="dP">‹</button><button class="on" style="flex:3">Xuất xưởng ${['CN','T2','T3','T4','T5','T6','T7'][new Date(f.date+'T00:00:00Z').getUTCDay()]} ${dmy(f.date)}</button><button id="dN">›</button></div>
   <div class="auto">Xuất xưởng ngày ${dmy(f.date)}: Winmart lọc chiều <b>${dmy(addDays(f.date,-1))}</b>, khách khác lọc + xuất trong ngày <b>${dmy(f.date)}</b>. ${P?'Đã lưu kế hoạch lúc '+new Date(P.at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):'Chưa có kế hoạch ngày này.'}</div>
   <label class="f"><span class="lab">Loại chuối</span>${optB(f,'loai',Object.keys(chc().types).map(x=>[x,esc(tName(x))]))}</label>
   <div class="nchd" style="margin-right:12px;gap:22px"><span style="width:84px">Kế hoạch</span><span style="width:72px">Kg quy đổi</span></div>
   <div class="group">${rows}<div class="row" style="background:var(--sunk)"><div class="grow t">Cộng kg (quy đổi)</div><div class="num" style="width:84px"></div><div class="num" id="pTot" style="width:72px;font-weight:800;color:var(--accent)">${fm(totP,1)}</div></div>${AB(t)?['A','B'].map(g=>`<div class="row"><div class="grow t">trong đó loại ${g}</div><div class="num" style="width:84px"></div><div class="num" id="pT${g}" style="width:72px;font-weight:700">${fm(r3(PR.filter(p=>grOf(p)===g).reduce((s,p)=>s+kgP(p),0)),1)}</div></div>`).join(''):''}</div>
   <div class="grid2"><button class="btn" id="pCopy">Chép ngày trước</button><button class="btn pri" id="pSave">Lưu kế hoạch</button></div><div id="fMsg"></div>
   <div class="sec">Lịch vào phòng (theo kế hoạch đã lưu)</div><div class="card"><table class="gt"><tr><th>Vào ngày</th><th>Phục vụ</th><th>Kg vào</th><th>Kho ủ</th></tr>${sch||'<tr><td colspan="4" class="muted">Chưa có kế hoạch các ngày tới.</td></tr>'}</table><div class="tiny muted" style="margin-top:6px">Vào phòng ngày D phục vụ xuất xưởng ngày D + số ngày ủ (tiêu +4, tây +3). Kg vào = kg kế hoạch ÷ tỷ lệ thành phẩm (${Object.keys(chc().types).map(x=>{const a=yieldAct(x);return tName(x)+' '+fm(yieldOf(x)*100,1)+'%'+(a?' – thực tế 14 ngày '+fm(a*100,1)+'%':'')}).join(' · ')}). Kho ủ gợi ý (kho 2, 4, 5, 6): kho trống nhỏ nhất đủ chứa.</div></div>
   <div class="sec">Chuối xanh cần về</div><div class="card"><table class="gt"><tr><th>Ngày</th><th>Loại</th><th>Cần</th><th>Tồn dự kiến</th><th>Đặt NCC</th></tr>${buy||'<tr><td colspan="5" class="muted">—</td></tr>'}</table></div>
   ${reqHistHTML()}<div class="sec">Vào phòng: đề xuất – thực tế 7 ngày (${esc(tName(t))})</div><div class="card"><table class="gt"><tr><th>Ngày vào</th><th>Đề xuất</th><th>Thực tế</th><th>Lệch</th></tr>${(()=>{const r=[];for(let i=-6;i<=0;i++){const D=addDays(today(),i),V=liveLogs().filter(l=>l.kind==='cvu'&&l.date===D&&l.loai===t);const tt=V.reduce((s,l)=>s+num(l.kg),0);const sgv=V.length?V.reduce((s,l)=>s+num(l.sug),0):((sugFor(D,t)||{}).need||0);if(tt||sgv)r.push(`<tr><td>${dmy(D)}</td><td>${fm(sgv)}</td><td>${fm(tt)}</td><td style="font-weight:700;color:${tt-sgv<0?'var(--bad)':'#1f7a45'}">${(tt-sgv>0?'+':'')+fm(tt-sgv)}</td></tr>`)}return r.join('')||'<tr><td colspan="4" class="muted">Chưa có số liệu.</td></tr>'})()}</table></div>
   <div class="sec">Thành phẩm: kế hoạch – thực tế lọc 7 ngày (${esc(tName(t))})</div><div class="card"><table class="gt"><tr><th>Ngày xuất xưởng</th><th>KH kg</th><th>TT kg</th><th>Lệch</th></tr>${hist.join('')||'<tr><td colspan="4" class="muted">Chưa có số liệu.</td></tr>'}</table></div>`;
  $('#fX').onclick=()=>{S.form=null;render()};
  const go=n=>{S.form=Object.assign({},f,{date:addDays(f.date,n),q:Object.assign({},(S.plans[addDays(f.date,n)]||{}).q||{})});render()};$('#dP').onclick=()=>go(-1);$('#dN').onclick=()=>go(1);
  $$('[data-o]').forEach(b=>b.onclick=()=>{f[b.dataset.o]=b.dataset.ov;render()});
  $$('[data-pq]').forEach(el=>el.oninput=()=>{q[el.dataset.pq]=el.value;{const p=prodOf(el.dataset.pq),k=r3(num(el.value)*(p.kg||1)),c=$(`[data-pk="${el.dataset.pq}"]`);if(c)c.textContent=k?fm(k,1):'—'}$('#pTot').textContent=fm(r3(prods(f.loai).reduce((s,p)=>s+num(q[p.id])*(p.kg||1),0)),1);for(const g of ['A','B']){const e=$('#pT'+g);if(e)e.textContent=fm(r3(prods(f.loai).filter(p=>grOf(p)===g).reduce((s,p)=>s+num(q[p.id])*(p.kg||1),0)),1)}});
  $('#pCopy').onclick=()=>{let d=addDays(f.date,-1),i=0;while(!S.plans[d]&&i<14){d=addDays(d,-1);i++}const src=S.plans[d];if(!src)return toast('Chưa có kế hoạch ngày trước');Object.assign(q,src.q||{});toast('Đã chép kế hoạch ngày '+dmy(d)+' – sửa rồi bấm Lưu');render()};
  $('#pSave').onclick=async()=>{const qq={};for(const [k,v] of Object.entries(q)){const n=num(v);if(n)qq[k]=n}const d={kind:'cplan',date:f.date,q:qq,by:S.uid,at:Date.now()};const b=$('#pSave');b.disabled=true;b.textContent='Đang lưu…';
    try{await S.db.doc('mlog/KH'+f.date).set(d);S.plans[f.date]=d;toast('✓ Đã lưu kế hoạch xuất xưởng '+dmy(f.date));render()}catch(e){if(e&&e.code==='queued'){S.plans[f.date]=d;toast('⏳ Mạng yếu: đã giữ trên máy, tự gửi lại');render()}else{b.disabled=false;b.textContent='Lưu kế hoạch';$('#fMsg').innerHTML='<div class="alert r">Chưa lưu được – thử lại.</div>'}}}}
function openPlan(){const d=addDays(today(),1);S.form={kind:'ckh',date:d,loai:Object.keys(chc().types)[0],q:Object.assign({},(S.plans[d]||{}).q||{})};S.post=null;render();scrollTo(0,0)}
function todayPlanHTML(){const S2=schedule(1).filter(x=>x.D===today()),tm=addDays(today(),1);const c=chc();
  const td=today(),lo=Object.keys(c.types).map(t=>{const w=planKg(tm,t,'win'),o=planKg(td,t,'khac');return w||o?esc(tName(t))+': '+(w?'chiều lọc Win '+fm(w,1)+' kg (xuất xưởng sáng '+dmy(tm)+') ':'')+(o?'· lọc + xuất khách khác '+fm(o,1)+' kg':''):''}).filter(Boolean);
  if(!S2.length&&!lo.length)return `<div class="row tap" id="kh0"><div class="grow"><div class="t">Chưa có kế hoạch</div><div class="s">Bấm ⓪ Kế hoạch để nhập số giao các ngày tới</div></div><span class="chev">›</span></div>`;
  return S2.map(x=>`<div class="row"><div class="grow"><div class="t">🍌 Vào ${x.room?'<b>Kho '+x.room+'</b>':'<span class="chip r">hết phòng</span>'}: ${esc(tName(x.t))} <b>${fm(x.need)} kg</b>${x.ab?' (A '+fm(x.ab.nA)+' · B '+fm(x.ab.nB)+')':''}</div><div class="s">phục vụ ${x.serve.map(esc).join(' · ')}${x.buy?' · <b style="color:var(--bad)">thiếu chuối xanh '+fm(x.buy)+' kg</b>':''}</div></div></div>`).join('')+
    (lo.length?`<div class="row"><div class="grow"><div class="t">✂️ Lọc hôm nay</div><div class="s">${lo.join(' · ')}</div></div></div>`:'')}

/* ---- Quản lý: cài đặt xưởng chuối ---- */
function viewDMCh(v){const c=chc();
  v.innerHTML=`<h1 class="big">Cài đặt xưởng chuối</h1>
   <div class="group"><div class="row"><div class="grow"><div class="t">Các kho ủ rấm</div><div class="s">Kho 1 = nguyên liệu, kho 3 = thành phẩm</div></div><input id="cR" value="${roomList().join(', ')}" style="width:120px"></div>
    <div class="row"><div class="grow"><div class="t">Sức chứa từng kho ủ (kg)</div><div class="s">theo thứ tự các kho ủ, cách nhau dấu phẩy</div></div><input id="cCap" value="${roomList().map(capOf).join(', ')}" style="width:170px"></div>
    <div class="row"><div class="grow"><div class="t">Đơn giá 1 công (đ)</div></div><input class="dmin" id="cRate" value="${fm(c.dm.rate)}" inputmode="decimal"></div>
    <div class="row"><div class="grow"><div class="t">Chi phí khác (đ / kg đạt)</div><div class="s">điện phòng lạnh, Ethylene, khấu hao… theo định mức</div></div><input class="dmin" id="cKh" value="${fm(c.dm.khac)}" inputmode="decimal"></div></div>
   ${Object.entries(c.types).map(([t,T])=>`<div class="sec">${esc(T.name)}</div><div class="group"><div class="row"><div class="grow t">Số ngày ủ</div><input class="dmin" data-td="${t}" value="${T.days}" inputmode="numeric"></div>
    <div class="row"><div class="grow"><div class="t">Số ngày rấm trong kho ủ</div><div class="s">hết số ngày này mẻ chuyển về kho 3 lọc lựa</div></div><input class="dmin" data-tr="${t}" value="${ramOf(t)}" inputmode="numeric"></div>
    <div class="row"><div class="grow t">Kg / thùng chuối xanh</div><input class="dmin" data-tt="${t}" value="${fm(thungOf(t))}" inputmode="decimal"></div>
    <div class="row"><div class="grow"><div class="t">Ngày lọc</div><div class="s">ngày lọc, dạng 3:Win, 4:Khách khác</div></div><input data-tm="${t}" value="${esc(Object.entries(T.marks||{}).map(([n,m])=>n+':'+m).join(', '))}" style="width:150px"></div>
    <div class="row"><div class="grow"><div class="t">Tỷ lệ thành phẩm (%)</div><div class="s">chuối xanh → thành phẩm, dùng tính đề xuất ủ và lọc${yieldAct(t)?' · thực tế 14 ngày '+fm(yieldAct(t)*100,1)+'%':''}</div></div><input class="dmin" data-ty="${t}" value="${String(Math.round(yieldOf(t)*1000)/10).replace('.',',')}" inputmode="decimal"></div>
    <div class="row"><div class="grow t">Định mức công / 100 kg đạt</div><input class="dmin" data-tc="${t}" value="${String(T.cong100||0).replace('.',',')}" inputmode="decimal"></div></div>`).join('')}
   <div class="sec">Danh mục sản phẩm sau lọc</div><div class="tiny muted" style="margin:0 4px 6px">ĐVT kg, gói hoặc quả · nhóm xuất hàng (Winmart, GO, Circle K, Bếp trường, Hà Nội) · kg/ĐVT dùng quy đổi ra kg (VD Circle K 0,17 kg/quả, bếp trường 0,11 kg/quả) · túi tem (đ/ĐVT) cộng vào giá thành.</div>
   <div class="group">${(c.prods||[]).map((p,i)=>`<div class="row" style="flex-wrap:wrap;gap:4px"><select data-pi="${i}" data-pk="t" style="width:62px;min-height:0;padding:4px">${Object.keys(c.types).map(t=>`<option value="${t}" ${p.t===t?'selected':''}>${t==='tieu'?'Tiêu':t==='tay'?'Tây':esc(t)}</option>`).join('')}</select><input data-pi="${i}" data-pk="name" value="${esc(p.name)}" style="flex:1;min-width:120px">${p.t==='tieu'?`<select data-pi="${i}" data-pk="gr" style="width:52px;min-height:0;padding:4px"><option ${grOf(p)==='A'?'selected':''}>A</option><option ${grOf(p)==='B'?'selected':''}>B</option></select>`:''}<select data-pi="${i}" data-pk="u" style="width:62px;min-height:0;padding:4px"><option ${p.u==='kg'?'selected':''}>kg</option><option ${p.u==='gói'?'selected':''}>gói</option><option ${p.u==='quả'?'selected':''}>quả</option></select><select data-pi="${i}" data-pk="xg" title="Nhóm xuất hàng" style="width:96px;min-height:0;padding:4px">${XG.map(([g])=>`<option value="${g}" ${xgOf(p)===g?'selected':''}>${esc(XGN[g])}</option>`).join('')}</select><input data-pi="${i}" data-pk="kg" value="${String(p.kg).replace('.',',')}" style="width:58px" title="kg/ĐVT" inputmode="decimal"><input data-pi="${i}" data-pk="bb" value="${p.bb?fm(p.bb):''}" placeholder="túi tem" style="width:64px" inputmode="decimal"><input data-pi="${i}" data-pk="note" value="${esc(p.note||'')}" placeholder="ghi chú quy cách" style="width:120px"><label class="tiny"><input type="checkbox" data-pi="${i}" data-pk="active" ${p.active!==false?'checked':''} style="width:16px;height:16px;min-height:0"> dùng</label></div>`).join('')}</div>
   <div class="grid2"><input id="pN" placeholder="Tên sản phẩm mới"><button class="btn" id="pAdd2">＋ Thêm</button></div>
   ${isAdmin()?`<label class="f" style="margin-top:12px"><span class="lab">Tài khoản mở thẳng Xưởng chuối (họ tên, cách nhau dấu phẩy)</span><input id="cU" value="${esc((c.users||[]).join(', '))}"></label>
   <label class="f"><span class="lab">Người duyệt lệnh rút / siết (họ tên, cách nhau dấu phẩy)</span><input id="cAp" value="${esc((c.approvers||[]).join(', '))}"></label>`:''}
   <button class="btn block pri" id="cSave">Lưu cài đặt</button>`;
  const collect=()=>{const c2=JSON.parse(JSON.stringify(c));c2.rl=[...new Set($('#cR').value.split(/[,; ]+/).map(x=>Math.round(num(x))).filter(x=>x>0))];if(!c2.rl.length)c2.rl=[2,4,5,6];c2.rooms=Math.max(...c2.rl);c2.v132=1;c2.dm={rate:num($('#cRate').value),khac:num($('#cKh').value)};if($('#cU')){c2.users=$('#cU').value.split(',').map(s=>s.trim()).filter(Boolean);c2.approvers=$('#cAp').value.split(',').map(s=>s.trim()).filter(Boolean)}c2.v122=1;c2.v125=1;c2.v134=1;c2.prods=JSON.parse(JSON.stringify(c.prods||[]));const cp=$('#cCap').value.split(',').map(x=>num(x));c2.caps={};c2.rl.forEach((r,i)=>{c2.caps[r]=cp[i]||5000});
    for(const t of Object.keys(c2.types)){c2.types[t].days=Math.max(1,Math.round(num($(`[data-td="${t}"]`).value))||c2.types[t].days);c2.types[t].cong100=num($(`[data-tc="${t}"]`).value);c2.types[t].yield=num($(`[data-ty="${t}"]`).value);c2.types[t].thung=num($(`[data-tt="${t}"]`).value)||thungOf(t);c2.types[t].ram=Math.max(1,Math.round(num($(`[data-tr="${t}"]`).value))||3);const mk={};$(`[data-tm="${t}"]`).value.split(',').forEach(x=>{const m=x.split(':');const n=Math.round(num(m[0]));if(n&&m[1])mk[n]=m.slice(1).join(':').trim()});c2.types[t].marks=mk}
    $$('[data-pi]').forEach(el=>{const p=c2.prods[+el.dataset.pi],k=el.dataset.pk;if(k==='active')p.active=el.checked;else if(k==='kg')p.kg=num(el.value)||1;else if(k==='bb')p.bb=num(el.value);else p[k]=el.value});return c2};
  const save=async(c2,m)=>{const all=JSON.parse(JSON.stringify(cfg()));all.ch=c2;try{await S.db.doc('mcfg/main').set(all);S.cfg=all;toast(m||'✓ Đã lưu');render()}catch(e){toast('Chưa lưu được')}};
  $('#cSave').onclick=()=>save(collect());
  $('#pAdd2').onclick=()=>{const n=$('#pN').value.trim();if(!n)return toast('Gõ tên sản phẩm');const c2=collect();c2.prods.push({id:'p'+Date.now().toString(36),t:Object.keys(c2.types)[0],name:n,u:'kg',kg:1});save(c2,'✓ Đã thêm '+n)}}

/* ---- Quản lý: giá thành xưởng chuối ---- */
function costsCh(from,to){const C=calcCh(),c=chc(),gc=cfg().gioCong||8;const L=liveLogs().filter(l=>isCh(l)&&l.date>=from&&l.date<=to);const R={};
  const G=(t,g)=>{const k=t+(g?'|'+g:'');return R[k]||(R[k]={t,g:g||'',kgIn:0,kgOk:0,hong:0,nvl:0,miss:0,h:0,outs:new Map(),bb:0})};let hc=0;
  for(const l of L){if(l.kind==='cnx'||l.kind==='cxuat'){hc+=HC(l);continue}
    if(!AB(l.loai)){const x=G(l.loai);x.h+=HC(l);
      if(l.kind==='cloc'){x.kgIn+=num(l.kgIn);x.kgOk+=num(l.kgOk);x.hong+=num(l.hong);for(const t of l.takes||[]){const b=C.bat.get(t.b),uc=b&&unitCost(b);if(uc==null)x.miss+=num(t.kg);else x.nvl+=num(t.kg)*uc}for(const o of l.outs||[])x.outs.set(o.p,(x.outs.get(o.p)||0)+num(o.q))}continue}
    const XA=G(l.loai,'A'),XB=G(l.loai,'B');
    if(l.kind==='cvu'){const b=C.bat.get(l.id),fa=b&&b.kg?b.kgA/b.kg:1;XA.h+=HC(l)*fa;XB.h+=HC(l)*(1-fa);continue}
    if(l.kind==='cloc'){let fa=fracA(l);const kin=num(l.kgIn);
      for(const t of l.takes||[]){const b=C.bat.get(t.b),kg=num(t.kg),f=fa==null?(b&&b.kg?b.kgA/b.kg:1):fa;
        for(const [X,g,w] of [[XA,'A',f],[XB,'B',1-f]]){if(!w)continue;const uc=b&&ucGr(b,g);if(uc==null)X.miss+=kg*w;else X.nvl+=kg*w*uc}}
      const f0=fa==null?1:fa;XA.kgIn+=kin*f0;XB.kgIn+=kin*(1-f0);XA.hong+=num(l.hong)*f0;XB.hong+=num(l.hong)*(1-f0);XA.h+=HC(l)*f0;XB.h+=HC(l)*(1-f0);
      for(const o of l.outs||[]){const p=prodOf(o.p),X=grOf(p)==='B'?XB:XA;X.kgOk+=num(o.kg)||num(o.q)*(p.kg||1);X.outs.set(o.p,(X.outs.get(o.p)||0)+num(o.q))}}}
  const tot=Object.values(R).reduce((s,x)=>s+x.kgOk,0);
  for(const x of Object.values(R)){x.h+=tot?hc*x.kgOk/tot:0;x.cong=x.h/gc;x.lab=x.cong*(c.dm.rate||0);x.oth=x.kgOk*(c.dm.khac||0);x.outs.forEach((q,p)=>x.bb+=q*(prodOf(p).bb||0));x.tot=x.nvl+x.lab+x.oth+x.bb;x.perKg=x.kgOk?(x.nvl+x.lab+x.oth)/x.kgOk:0;
    const c1=(c.types[x.t]||{}).cong100;x.dmCong=c1?x.kgOk*c1/100:null}
  const bats=[...C.bat.values()].filter(b=>b.outs.some(o=>o.date>=from&&o.date<=to)||(b.date>=from&&b.date<=to)).sort((a,b)=>a.date.localeCompare(b.date));
  return {rows:Object.values(R).filter(x=>x.kgIn||x.kgOk||x.nvl),bats}}
function viewGTCh(v){const to=S.ui.gtTo||today(),from=S.ui.gtFrom||today().slice(0,8)+'01';const X=costsCh(from,to);
  const card=x=>`<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><b style="font-size:17px">${esc(tName(x.t))}${x.g?' – loại '+x.g:''}</b><span class="tiny muted">lấy ${fm(x.kgIn)} kg → đạt ${fm(x.kgOk)} kg</span></div>
    <table class="gt"><tr><td>Tỷ lệ đạt / hỏng</td><td>${x.kgIn?fm(x.kgOk/x.kgIn*100,1)+'% / '+fm(x.hong/x.kgIn*100,1)+'%':'—'}</td></tr><tr><td>Nhân công (công)</td><td>${fm(x.cong,1)}${x.dmCong!=null?' · ĐM '+fm(x.dmCong,1):''}</td></tr></table>
    <table class="gt"><tr><td>Chuối xanh${x.miss?` <span class="chip r">${fm(x.miss)} kg chưa có giá</span>`:''}</td><td>${fm(x.nvl)}</td></tr><tr><td>Nhân công ${fm(x.h)} giờ</td><td>${fm(x.lab)}</td></tr><tr><td>Chi phí khác (định mức)</td><td>${fm(x.oth)}</td></tr><tr><td>Túi, tem</td><td>${fm(x.bb)}</td></tr><tr><td><b>Tổng</b></td><td><b>${fm(x.tot)}</b></td></tr><tr><td><b>Giá / kg đạt (chưa túi tem)</b></td><td><b>${x.kgOk?fm(x.perKg):'—'}</b></td></tr>
    ${[...x.outs.entries()].map(([p,q])=>{const P=prodOf(p);return `<tr><td>${esc(P.name)} · ${qU(P,q)}</td><td><b>${fm(x.perKg*(P.kg||1)+(P.bb||0))}</b> đ/${esc(P.u)}</td></tr>`}).join('')}</table></div>`;
  const bt=X.bats.map(b=>`<tr><td>${esc(b.code)} P${b.room}<br><span class="tiny muted">${esc(tName(b.loai))} · ${dmy(b.date)}${AB(b.loai)?' · A '+fm(b.kgA)+'/B '+fm(b.kgB):''}</span></td><td>${fm(b.kg)}</td><td>${fm(b.took)}</td><td>${fm(b.ok)}</td><td>${fm(b.hong)}</td><td>${b.took?fm(b.ok/b.took*100,1)+'%':'—'}</td></tr>`).join('');
  v.innerHTML=`<h1 class="big">Giá thành xưởng chuối</h1><div class="grid2"><label class="f"><span class="lab">Từ ngày</span><input type="date" id="gF" value="${from}"></label><label class="f"><span class="lab">Đến ngày</span><input type="date" id="gT" value="${to}"></label></div>
   <div class="tiny muted" style="margin:4px 0 10px">Chuối xanh tính theo kg lấy ra lọc × giá lô xanh trong mẻ. Chuối tiêu tách loại A/B: phần lấy ra chia A/B theo kg hàng đạt từng loại, hàng A tính giá xanh A, hàng B tính giá xanh B. Công theo giờ thực tế (tăng ca × ${fm(otK(),2)}); công nhập + xuất chia theo kg đạt. Kết quả lọc chung nhiều mẻ được chia về từng mẻ theo kg lấy ra.</div>
   ${X.rows.map(card).join('')||'<div class="empty">Không có phiếu lọc trong kỳ.</div>'}
   ${bt?`<div class="sec">Theo mẻ ủ</div><div class="card"><table class="gt"><tr><th>Mẻ</th><th>Vào</th><th>Lấy</th><th>Đạt</th><th>Hỏng</th><th>TL đạt</th></tr>${bt}</table></div>`:''}
   ${X.rows.length||bt?'<button class="btn block" id="gX" style="margin-top:10px">⬇ Xuất Excel</button>':''}`;
  $('#gF').onchange=e=>{S.ui.gtFrom=e.target.value;render()};$('#gT').onchange=e=>{S.ui.gtTo=e.target.value;render()};
  const gx=$('#gX');if(gx)gx.onclick=()=>{if(!window.XLSX)return toast('Chưa tải được thư viện Excel – thử lại');const wb=XLSX.utils.book_new();
    const a=[['Loại chuối','Kg lấy ra lọc','Kg đạt','Kg hỏng','Tỷ lệ đạt %','Giờ công','Công','ĐM công','CP chuối xanh','Kg chưa có giá','CP nhân công','CP khác','Túi tem','Tổng CP','Giá/kg đạt']];
    for(const x of X.rows)a.push([tName(x.t)+(x.g?' loại '+x.g:''),r3(x.kgIn),r3(x.kgOk),r3(x.hong),x.kgIn?r3(x.kgOk/x.kgIn*100):'',r3(x.h),r3(x.cong),x.dmCong!=null?r3(x.dmCong):'',Math.round(x.nvl),r3(x.miss),Math.round(x.lab),Math.round(x.oth),Math.round(x.bb),Math.round(x.tot),Math.round(x.perKg)]);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),'Giá thành chuối');
    const b=[['Mẻ','Kho ủ','Loại','Ngày vào','Kg vào','Đã lấy','Còn','Kg đạt (chia)','Kg hỏng (chia)','TL đạt %','Lô xanh']];
    for(const x of X.bats)b.push([x.code,x.room,tName(x.loai),x.date,r3(x.kg),r3(x.took),r3(x.left),r3(x.ok),r3(x.hong),x.took?r3(x.ok/x.took*100):'',x.src.map(s=>s.lot+' '+s.kg).join('; ')]);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(b),'Mẻ ủ');
    const c=[['Ngày','Công đoạn','Chi tiết','Số người','Tổng giờ','Người TC','Giờ TC','Người nhập','Ghi chú']];
    for(const l of liveLogs().filter(l=>isCh(l)&&l.date>=from&&l.date<=to).sort((p,q)=>p.date.localeCompare(q.date)))c.push([l.date,KIND[l.kind].n,logSumCh(l).replace(/<[^>]+>/g,''),num(l.people),r3(HW(l)),num(l.pot),r3(HO(l)),nameOf(l.by),l.note||'']);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(c),'Phiếu');XLSX.writeFile(wb,`Gia thanh xuong chuoi ${from} den ${to}.xlsx`)}}

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
  db.collection('mlog').onSnapshot(q=>{const L=[],P={},Q=[];for(const d of q.docs){const x=Object.assign({id:d.id},d.data());if(x.kind==='cplan')P[x.date]=x;else if(x.kind==='creq')Q.push(x);else L.push(x)}S.logs=L;S.plans=P;S.reqs=Q;loadNames();soon()});
  try{const p=await user.profiles([S.uid]);S.names[S.uid]=p[S.uid]&&p[S.uid].name||''}catch(e){}
  setTimeout(()=>{S.ready=true;render();if(isAdmin()&&(!S.cfg||!(S.cfg.v>=2))){const c=upgradeCfg(S.cfg);db.doc('mcfg/main').set(c).then(()=>{S.cfg=c;render()}).catch(()=>{})}else if(isAdmin()&&S.cfg&&S.cfg.v===2){const u=upgrade3(S.cfg);db.doc('mcfg/main').update(u).then(()=>{Object.assign(S.cfg,u);render()}).catch(()=>{})}},300);
  window.addEventListener('viba-sync',()=>{if(!S.form)soon()})}
/* v116: nâng cấu hình v1 → v2 (nguyên liệu gộp, 15 thành phẩm, NCC theo file, 3 xe); giữ định mức Quản lý đã sửa */
/* v129: thêm Củ sen, Củ từ, quy cách Ớt 100g/1kg, Sắn 1kg, Dâu tây 1kg – giữ nguyên dữ liệu đã sửa */
function upgrade3(c){const nv=JSON.parse(JSON.stringify(c.nvls||[])),its=JSON.parse(JSON.stringify(c.items||[]));
  for(const n of DEFAULT_CFG.nvls)if(!nv.some(x=>x.id===n.id))nv.push(JSON.parse(JSON.stringify(n)));
  for(const d of DEFAULT_CFG.items){const x=its.find(i=>i.id===d.id);if(!x){its.push(JSON.parse(JSON.stringify(d)));continue}
    const have=new Set((x.packs||[]).map(p=>gOf(p[0],p[1])));x.packs=x.packs||[];for(const p of d.packs)if(!have.has(gOf(p[0],p[1])))x.packs.push(p)}
  return {v:3,nvls:nv,items:its}}
function upgradeCfg(old){const c=JSON.parse(JSON.stringify(DEFAULT_CFG));if(!old)return c;
  const map={mia:'mia',dua:'duam',ksq:'ksq',kmo:'kmo',sau:'sau'};
  for(const o of old.items||[]){const n=c.items.find(i=>i.id===map[o.id]);if(n&&o.dmAt){n.dm=Object.assign({},n.dm,o.dm);n.dmAt=o.dmAt;n.dmBy=o.dmBy}}
  if(old.gioCong)c.gioCong=old.gioCong;
  for(const x of old.xe||[])if(!c.xe.includes(x))c.xe.push(x);
  return c}
window.__sx={S,calc,costs,num,gOf,packLabel,DEFAULT_CFG,calcCh,costsCh,CH0,schedule,planKg,grOf,locPlan,carryOf,sugFor};
init();
})();
