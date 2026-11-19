'use strict';
const GROUPS=['L2 Coin & Package','Inventory & Storage','Premium & Battle Pass','Agathion','Rune & Growth Boost'];
const COLORS=['#d3ae67','#9eaebe','#a889bd','#75a393','#b6795b'];
const SIGNS=['◈','▣','♛','✧','ᛟ'];
const key='szymon-shopping-v1';
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
const bounded=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
const maxQty=i=>i.limit??Math.floor(Number.MAX_SAFE_INTEGER/(ITEMS.length*Math.max(i.price,8000)));
const fresh=()=>({version:1,preset:'full',budget:'',rate:'',items:Object.fromEntries(ITEMS.map(i=>[i.id,{on:true,q:i.qty,b:0}]))});
function normalize(raw){
 if(raw?.version!==1||!raw.items||typeof raw.items!=='object')throw Error('invalid');
 const s=fresh();
 for(const i of ITEMS){const r=raw.items[i.id];if(!r)continue;s.items[i.id]={on:r.on===true,q:bounded(r.q,maxQty(i)),b:bounded(r.b,maxQty(i))};}
 for(const k of ['budget','rate'])if(raw[k]!==''&&Number.isFinite(+raw[k])&&+raw[k]>=0)s[k]=String(+raw[k]);
 s.preset=['full','empty','custom'].includes(raw.preset)?raw.preset:'custom';return s;
}
let state=fresh(),preview=false,timer;
try{const saved=localStorage.getItem(key);if(saved)state=normalize(JSON.parse(saved));}catch{}
function say(msg){clearTimeout(timer);$('toast').textContent=msg;timer=setTimeout(()=>$('toast').textContent='',3200);}
function save(){if(!preview)try{localStorage.setItem(key,JSON.stringify(state));}catch{say('เบราว์เซอร์บันทึกแผนไม่ได้ กรุณาส่งออกแผนไว้');}}
function totals(){
 const a={total:0,spent:0,remaining:0,count:0,coins:0,groups:GROUPS.map(()=>0)};
 for(const i of ITEMS){const r=state.items[i.id];a.spent+=r.b*i.price;if(!r.on||!r.q)continue;
 a.count++;a.total+=r.q*i.price;a.groups[i.category]+=r.q*i.price;a.remaining+=Math.max(0,r.q-r.b)*i.price;if(i.id==='01')a.coins=r.q*8000;}
 a.pct=a.total?Math.round((a.total-a.remaining)*100/a.total):0;return a;
}
const line=(label,val,cls='')=>'<div class="line"><span>'+label+'</span><b class="'+cls+'">'+val+'</b></div>';
function dashboard(){
 const a=totals(),balance=state.budget===''?null:Number(state.budget)-a.spent-a.remaining;
 const cards=[['งบตามแผน',fmt(a.total),'SG',state.rate?'≈ '+fmt(a.total*state.rate)+' บาท':'เลือกแล้ว '+a.count+' ประเภท','◈'],['ซื้อไปแล้ว',fmt(a.spent),'SG','ความคืบหน้า '+a.pct+'%','▣'],['ยังต้องใช้',fmt(a.remaining),'SG',balance===null?'ยังไม่ได้ตั้งงบประมาณ':(balance<0?'ขาดอีก ':'งบเหลือหลังซื้อ ')+fmt(Math.abs(balance))+' SG','◷'],['L2 Coin ตามแผน',fmt(a.coins),'','จากแพ็ก 8,000 L2 Coin','✧']];
 $('stats').innerHTML=cards.map(([title,v,unit,sub,sign],j)=>'<div class="stat"><span class="sig">'+sign+'</span><strong>'+title+'</strong><div><b>'+v+' <span>'+unit+'</span></b></div><small class="'+(j===2&&balance<0?'red':'')+'">'+sub+'</small></div>').join('');
 let start=0;const stops=a.groups.map((v,j)=>{const end=start+(a.total?v/a.total*100:0);const s=COLORS[j]+' '+start+'% '+end+'%';start=end;return s;});
 $('chart').style.background=a.total?'conic-gradient('+stops.join(',')+')':'#393938';$('charttotal').textContent=fmt(a.total);
 $('legend').innerHTML=GROUPS.map((g,j)=>'<div class="leg"><i class="dot" style="background:'+COLORS[j]+'"></i>'+g+'<b>'+fmt(a.groups[j])+' SG</b><small>'+fmt(a.total?a.groups[j]*100/a.total:0)+'%</small></div>').join('');
 $('progress').innerHTML=line('ซื้อแล้วตามมูลค่าแผน',a.pct+'%')+'<div class="track"><i style="width:'+a.pct+'%"></i></div>'+line('งบส่วนตัว',state.budget===''?'ยังไม่ระบุ':fmt(+state.budget)+' SG')+line('งบคงเหลือหลังหักที่ซื้อแล้ว',state.budget===''?'—':fmt(+state.budget-a.spent)+' SG',state.budget!==''&&+state.budget<a.spent?'red':'')+line('ประเภทที่เลือก',a.count+' / '+ITEMS.length);
 $('preset').value=state.preset;$('quick').textContent='ตามแผน '+fmt(a.total)+' SG  ↑';
}
function row(i){
 const r=state.items[i.id],icon=ICONS[Number(i.id)],status=r.b===0?'ยังไม่ได้ซื้อ':r.on&&r.b<r.q?'ซื้อบางส่วน':'ซื้อแล้ว';
 return '<div class="row" data-id="'+i.id+'"><input data-field="on" aria-label="เลือก '+i.name+'" type="checkbox" '+(r.on?'checked':'')+'>'+(icon?'<img class="icon" alt="" src="'+icon+'">':'<span class="icon" title="ไอคอนชั่วคราว">'+SIGNS[i.category]+'</span>')+'<div class="item">'+i.name+'<small>'+fmt(i.price)+' SG/หน่วย · แนะนำ '+i.qty+' · '+(i.rule==='ไม่ระบุ'?'ข้อจำกัดไม่ระบุ':i.rule)+'</small></div><div class="counter"><button data-delta="-1" aria-label="ลดจำนวน '+i.name+'">−</button><input type="number" min="0" step="1" data-field="q" aria-label="จำนวนตามแผน '+i.name+'" value="'+r.q+'"><button data-delta="1" aria-label="เพิ่มจำนวน '+i.name+'">+</button></div><div class="cost">'+fmt(r.on?r.q*i.price:0)+' SG</div><label class="bought">ซื้อแล้ว <input type="number" min="0" step="1" data-field="b" aria-label="ซื้อแล้ว '+i.name+'" value="'+r.b+'"><small>'+status+'</small></label></div>';
}
function render(){
 const search=$('search').value.trim().toLowerCase(),c=$('cat').value,a=totals();
 $('rows').innerHTML=GROUPS.map((name,j)=>{const list=ITEMS.filter(i=>i.category===j&&(c===''||Number(c)===j)&&i.name.toLowerCase().includes(search));return list.length?'<div class="group" data-category="'+j+'"><span>'+SIGNS[j]+' &nbsp; '+name.toUpperCase()+'</span><span>'+fmt(a.groups[j])+' SG</span></div>'+list.map(row).join(''):'';}).join('')||'<p style="padding:12px 20px">ไม่พบไอเทมที่ค้นหา</p>';
 dashboard();
}
function updateRow(el,editing=false){const node=el.closest('.row'),i=ITEMS.find(i=>i.id===node.dataset.id),r=state.items[i.id],field=el.dataset.field;
 if(field==='on'){r.on=el.checked;if(r.on&&!r.q)r.q=i.qty;}
 else if(field==='b'){r.b=bounded(el.value,maxQty(i)); }
 else{r.q=bounded(el.dataset.delta? r.q+Number(el.dataset.delta):el.value,maxQty(i));r.on=r.q>0;}
 if(field!=='b')state.preset='custom';
 save();
 if(!editing){render();return;}
 if(el.value!=='' && Number(el.value)!==r[field])el.value=r[field];
 node.querySelector('.cost').textContent=fmt(r.on?r.q*i.price:0)+' SG';
 node.querySelector('[data-field=on]').checked=r.on;
 node.querySelector('.bought small').textContent=r.b===0?'ยังไม่ได้ซื้อ':r.on&&r.b<r.q?'ซื้อบางส่วน':'ซื้อแล้ว';
 const groups=totals().groups;
 for(const g of document.querySelectorAll('.group'))g.lastElementChild.textContent=fmt(groups[g.dataset.category])+' SG';
 dashboard();
}
$('rows').onclick=e=>{if(e.target.dataset.delta)updateRow(e.target)};
$('rows').oninput=e=>{if(e.target.type==='number')updateRow(e.target,true)};
$('rows').onchange=e=>{if(e.target.type==='checkbox')updateRow(e.target)};
$('rows').onfocusout=e=>{if(e.target.type==='number'&&e.target.value==='')e.target.value='0'};
$('cat').insertAdjacentHTML('beforeend',GROUPS.map((v,j)=>'<option value="'+j+'">'+v+'</option>').join(''));
$('cat').onchange=render;$('search').oninput=render;
function setBuild(mode){
 state.preset=mode;for(const i of ITEMS){const r=state.items[i.id];if(mode==='full'){r.on=true;r.q=i.qty;}else if(mode==='empty'){r.on=false;r.q=0;}}
 save();render();
}
$('preset').onchange=e=>setBuild(e.target.value);
function modal(html){$('dialogBody').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
$('close').onclick=()=>$('modal').close();
function download(blob,name){const u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
async function copy(value){try{await navigator.clipboard.writeText(value);say('คัดลอกแล้ว');}catch{modal('<h2>คัดลอกข้อความ</h2><textarea id="copyText" rows="6"></textarea>');$('copyText').value=value;$('copyText').select();}}
function exportPng(){
 const a=totals(),list=ITEMS.filter(i=>state.items[i.id].on||state.items[i.id].b),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=290+list.length*48;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#161719';ctx.fillRect(0,0,1024,canvas.height);ctx.strokeStyle='#a68a55';ctx.strokeRect(14,14,996,canvas.height-28);
 function label(value,x,y,size,color,font='sans-serif'){ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.fillText(value,x,y);}
 label('SZYMON GUILD',44,64,34,'#edce91','Georgia');label('DAY ONE SHOPPING PLANNER',44,95,17,'#bcb5a5');label(fmt(a.total)+' SG',44,151,42,'#edce91','Georgia');label('ซื้อแล้ว '+fmt(a.spent)+' SG    •    ยังต้องใช้ '+fmt(a.remaining)+' SG    •    '+fmt(a.coins)+' L2 Coin',44,192,19,'#f4efe6');
 label('ไอเทม',44,240,18,'#c9b78c');label('แผน / ซื้อแล้ว',685,240,18,'#c9b78c');label('รวม SG',880,240,18,'#c9b78c');list.forEach((i,j)=>{const r=state.items[i.id],y=279+j*48;label(i.name,44,y,20,'#eee');label((r.on?r.q:0)+' / '+r.b,685,y,19,'#eee');label(fmt(r.on?r.q*i.price:0),880,y,20,'#edce91');});canvas.toBlob(blob=>{if(blob)download(blob,'szymon-plan.png');},'image/png');
}
document.addEventListener('click',async e=>{
 const action=e.target.closest('[data-act]')?.dataset.act;if(!action)return;
 if(action==='recommended')setBuild('full');
 if(action==='all'){for(const i of ITEMS){const r=state.items[i.id];r.on=true;if(!r.q)r.q=i.qty;}state.preset=ITEMS.every(i=>state.items[i.id].q===i.qty)?'full':'custom';save();render();}
 if(action==='clear')setBuild('empty');
 if(action==='reset'){modal('<h2>ล้างข้อมูลทั้งหมด?</h2><p>รายการตามแผน ประวัติซื้อ งบ และอัตราแลกเปลี่ยนในเบราว์เซอร์นี้จะถูกล้าง</p><button data-act="cancel">ยกเลิก</button><button data-act="confirmreset">ยืนยันล้างข้อมูล</button>');}
 if(action==='confirmreset'){state=fresh();setBuild('empty');$('modal').close();}
 if(action==='cancel')$('modal').close();
 if(action==='budget'){modal('<h2>ตั้งค่างบประมาณ</h2><form id="budgetForm"><label>งบส่วนตัว (SG)<input name="budget" type="number" min="0" step="1" placeholder="ระบุงบประมาณ" value="'+state.budget+'"></label><label>อัตราแลกเปลี่ยน (บาทต่อ 1 SG)<input name="rate" type="number" min="0" step="any" placeholder="ระบุเมื่อต้องการคำนวณเงินบาท" value="'+state.rate+'"></label><button>บันทึก</button></form>');$('budgetForm').onsubmit=ev=>{ev.preventDefault();state.budget=ev.target.budget.value;state.rate=ev.target.rate.value;save();dashboard();$('modal').close();};}
 if(action==='share'){const link=new URL(location.href);link.hash='plan='+btoa(JSON.stringify(state));await copy(link.href);}
 const a=totals();
 if(action==='discord'){await copy(['**SZYMON GUILD | Day One Shopping Planner**',...ITEMS.filter(i=>state.items[i.id].on||state.items[i.id].b).map(i=>{const r=state.items[i.id];return '• '+i.name+' × '+(r.on?r.q:0)+' | ซื้อแล้ว '+r.b;}),'**รวม '+fmt(a.total)+' SG** · ซื้อแล้ว '+fmt(a.spent)+' SG · ยังต้องใช้ '+fmt(a.remaining)+' SG',fmt(a.coins)+' L2 Coin'].join('\n'));}
 if(action==='csv'){const csv=[['ID','ไอเทม','หมวด','SG/หน่วย','จำนวนแนะนำ','เงื่อนไข','เลือก','จำนวนตามแผน','ซื้อแล้ว','รวม SG','ใช้แล้ว SG'],...ITEMS.map(i=>{const r=state.items[i.id];return [i.id,i.name,GROUPS[i.category],i.price,i.qty,i.rule,r.on?1:0,r.on?r.q:0,r.b,r.on?r.q*i.price:0,r.b*i.price];})].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');download(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),'szymon-plan.csv');}
 if(action==='png')exportPng();
 if(action==='adopt'||action==='leave'){if(action==='adopt'&&!confirm('ยืนยันใช้แผนนี้แทนแผนเดิมในเครื่อง?'))return;preview=false;history.replaceState(null,'',location.pathname+location.search);if(action==='adopt')save();location.reload();}
});
if(location.hash.startsWith('#plan=')){try{const raw=location.hash.slice(6);if(raw.length>50000)throw Error();state=normalize(JSON.parse(atob(raw)));preview=true;
 $('top').insertAdjacentHTML('afterbegin','<div class="summaryhead"><strong>กำลังดูสำเนาแผนที่แชร์</strong><div><button data-act="leave">กลับแผนเดิม</button> <button data-act="adopt">นำแผนนี้ไปใช้</button></div></div>');}catch{say('ลิงก์แผนไม่ถูกต้อง');}}
render();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#plan=')||preview)location.reload();});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.onclick=e=>{if(preview){e.preventDefault();document.querySelector(link.getAttribute('href')).scrollIntoView();}});
