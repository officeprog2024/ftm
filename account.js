'use strict';
(()=>{
 const key='ftm-fatoom-pending-events-v1';let queue=[];try{queue=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(queue))queue=[];}catch{}let bank=null,last=Date.now();
 const status=document.createElement('span');status.textContent='محفوظ';
 const read=()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(saved)?saved:[];}catch{return [];}};
 const persist=(remove=[])=>{try{const merged=new Map([...read(),...queue].map(e=>[e.id,e]));remove.forEach(id=>merged.delete(id));queue=[...merged.values()];localStorage.setItem(key,JSON.stringify(queue));}catch{status.textContent='تعذر الحفظ';status.className='sync-failed';}};
 let inFlight=null;
 async function flush(){if(inFlight){await inFlight;return;}persist();if(!queue.length)return;inFlight=(async()=>{status.textContent='جارٍ الحفظ';try{while(queue.length){const batch=queue.slice(0,60),r=await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),keepalive:true});if(r.status===401){location.href='/login.html?next='+encodeURIComponent(location.pathname);return;}if(!r.ok)throw Error('sync');persist(batch.map(e=>e.id));}status.textContent='محفوظ';status.className='';}catch{status.textContent='بانتظار المزامنة';status.className='sync-failed';}})();try{await inFlight;}finally{inFlight=null;}}
 window.addEventListener('storage',e=>{if(e.key===key)queue=read();});
 function event(e){queue.push(e);persist();flush();}
 function tick(){const now=Date.now(),seconds=Math.floor((now-last)/1000);if(document.visibilityState==='visible'&&seconds>0){event({id:crypto.randomUUID(),type:'time',bank,seconds:Math.min(seconds,30),at:now});}last=now;}
 const tracked=new WeakSet();let observer;
 if('IntersectionObserver'in window)observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&document.visibilityState==='visible'){const card=e.target,id=Number(card.dataset.ftmQuestion);event({id:card.dataset.ftmView,type:'view',bank:card.dataset.ftmBank,ids:[id]});observer.unobserve(card);}},{threshold:0});
 function observe(card,qid,context,bankId){if(tracked.has(card))return;tracked.add(card);card.dataset.ftmQuestion=qid;card.dataset.ftmBank=bankId;card.dataset.ftmView='view:'+context+':'+qid;if(observer)observer.observe(card);}
 window.FtmAccount={setBank(id){bank=id;},observe,complete(id,bankId,ids,answers){event({id:'test:'+id,type:'test',bank:bankId,ids,answers});},flush};
 function mount(){const bar=document.createElement('aside');bar.className='ftm-account-tools';bar.setAttribute('aria-label','حساب المستخدم');const link=document.createElement('a');link.href='stats.html';link.textContent='إحصائياتي وأخطائي';const logout=document.createElement('button');logout.textContent='خروج';logout.onclick=async()=>{tick();await flush();if(queue.length&&!confirm('هناك بيانات لم تُزامن بعد. هل تريدين تسجيل الخروج الآن؟ ستبقى محفوظة في هذا المتصفح.'))return;const r=await fetch('/api/logout',{method:'POST'});if(r.ok)location.href='/login.html';};bar.append(link,status,logout);document.body.append(bar);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
 setInterval(tick,20000);setInterval(flush,15000);window.addEventListener('online',flush);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){const now=Date.now(),seconds=Math.floor((now-last)/1000);if(seconds>0)event({id:crypto.randomUUID(),type:'time',bank,seconds:Math.min(seconds,30),at:now});last=now;}else last=Date.now();});
 window.addEventListener('pagehide',()=>{if(document.visibilityState==='visible')tick();});flush();
})();
