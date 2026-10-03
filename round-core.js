/* Shared round state operations; question IDs remain stable across both modes. */
(function(scope){
'use strict';
const bankId=typeof quizConfig==='undefined'?'balbaid':quizConfig.id;
const bank=new Map(questionsDatabase.map(q=>[q.id,q]));
const pool=r=>questionsDatabase.filter(q=>r.section==='all'||q.sec===r.section);
const available=r=>pool(r).filter(q=>!r.exclude||!r.correct.includes(q.id));
function create(section,count,exclude){
 if(section!=='all'&&!Object.hasOwn(sectionNames,section))throw Error('القسم غير صالح');
 if(!Number.isInteger(count)||count<1||count>questionsDatabase.length)throw Error(`اختر عددًا صحيحًا من 1 إلى ${questionsDatabase.length}`);
 return {id:crypto.randomUUID(),createdAt:new Date().toISOString(),section,count,exclude:!!exclude,status:'active',correct:[],tests:[],active:null};
}
function start(r,random=Math.random){
 if(r.status!=='active'||r.active)throw Error('لا يمكن بدء اختبار الآن');
 const list=available(r).map(q=>q.id);
 for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 if(!list.length)return false;
 r.active={ids:list.slice(0,r.count),answers:{},startedAt:new Date().toISOString()};return true;
}
function finish(r){
 if(!r.active)return null;
 const t={...r.active,completedAt:new Date().toISOString()};r.tests.push(t);
 const correct=new Set(r.correct);for(const id of t.ids)if(t.answers[id]===bank.get(id).ans)correct.add(id);
 r.correct=[...correct];r.active=null;if(scope.FtmAccount)scope.FtmAccount.complete(r.id+':'+r.tests.length,bankId,t.ids,t.answers);return t;
}
function wrong(t){return t.ids.filter(id=>t.answers[id]!==undefined&&t.answers[id]!==bank.get(id).ans).map(id=>({q:bank.get(id),answer:t.answers[id]}));}
function mistakes(r){const all=new Map();for(const t of r.tests)for(const e of wrong(t))all.set(e.q.id,e);return [...all.values()];}
function score(t){const right=t.ids.filter(id=>t.answers[id]===bank.get(id).ans).length;const skipped=t.ids.filter(id=>t.answers[id]===undefined).length;return {right,skipped,wrong:t.ids.length-right-skipped};}
function validate(raw){
 if(!raw||raw.version!==1||!raw.round)throw Error('ملف الجولة غير صالح أو بإصدار غير مدعوم');
 if((raw.bankId||'balbaid')!==bankId)throw Error('ملف الجولة يخص نموذج أسئلة مختلف');
 const r=raw.round;create(r.section,r.count,r.exclude);
 if(typeof r.exclude!=='boolean'||!['active','ended'].includes(r.status)||typeof r.id!=='string'||r.id.length>100||typeof r.createdAt!=='string'||!Array.isArray(r.tests)||r.tests.length>10000)throw Error('بيانات الجولة غير صالحة');
 const allowed=new Set(pool(r).map(q=>q.id));
 function test(t){if(!t||!Array.isArray(t.ids)||!t.ids.length||t.ids.length>r.count||new Set(t.ids).size!==t.ids.length||t.ids.some(id=>!allowed.has(id))||!t.answers||typeof t.answers!=='object'||Array.isArray(t.answers))throw Error('بيانات الاختبار غير صالحة');
 const answers={};for(const [key,value]of Object.entries(t.answers)){const id=Number(key);if(!t.ids.includes(id)||!Number.isInteger(value)||value<0||value>=bank.get(id).opts.length)throw Error('إجابة غير صالحة');answers[id]=value;}
 if(typeof t.startedAt!=='string')throw Error('تاريخ غير صالح');return {ids:[...t.ids],answers,startedAt:t.startedAt,...(typeof t.completedAt==='string'?{completedAt:t.completedAt}:{})};}
 const tests=r.tests.map(test),correct=new Set();for(const t of tests)for(const id of t.ids)if(t.answers[id]===bank.get(id).ans)correct.add(id);
 const active=r.active?test(r.active):null;
 if(r.status==='ended'&&active)throw Error('جولة منتهية تحتوي على اختبار جاري');
 return {id:r.id,createdAt:r.createdAt,section:r.section,count:r.count,exclude:r.exclude,status:r.status,tests,correct:[...correct],active};
}
scope.RoundCore={bankId,bank,pool,available,create,start,finish,wrong,mistakes,score,validate};
})(globalThis);
