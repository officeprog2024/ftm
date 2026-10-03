'use strict';
const C=RoundCore,$=id=>document.getElementById(id),KEY=`ftm-${C.bankId}-rounds-v1`;
FtmAccount.setBank(C.bankId);
let data={version:1,rounds:[],selectedId:null},pdfUrl=null,busy=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>data.rounds.find(r=>r.id===data.selectedId);
function notice(message,error=false){$('notice').className='alert '+(error?'alert-danger':'alert-success');$('notice').textContent=message;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{notice('تعذر الحفظ في المتصفح. نزّل ملف حفظ الجولة قبل مغادرة الصفحة.',true);return false;}}
function hidePdf(){if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=null;$('pdfArea').classList.add('d-none');$('pdfPreview').removeAttribute('src');}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function title(r){return sectionNames[r.section]||'جميع الأقسام';}
function refreshSaved(){const el=$('saved');el.replaceChildren();if(!data.rounds.length){el.add(new Option('لا توجد جولات محفوظة',''));return;}
 data.rounds.forEach((r,i)=>el.add(new Option(`الجولة ${i+1} · ${title(r)} · ${r.status==='ended'?'منتهية':'قيد التقدم'} · ${r.tests.length} اختبار`,r.id)));el.value=data.selectedId;}
function render(){hidePdf();refreshSaved();const r=current();$('quizArea').replaceChildren();$('resultArea').replaceChildren();if(!r){$('roundArea').replaceChildren();return;}
 const left=C.available(r).length,miss=C.mistakes(r).length;
 $('roundArea').innerHTML=`<section class="panel"><h2 class="h5 fw-bold">الجولة الحالية: ${esc(title(r))}</h2><p>${r.status==='ended'?'الجولة منتهية':'الجولة قيد التقدم'} · ${r.count} سؤالًا لكل اختبار · ${r.exclude?'استبعاد الصحيح مفعّل':'استبعاد الصحيح غير مفعّل'}</p><div class="row text-center g-2 mb-3"><div class="col-6 col-sm-3"><strong>${r.tests.length}</strong><br>اختبارات مكتملة</div><div class="col-6 col-sm-3"><strong>${r.correct.length}</strong><br>أسئلة أتقنتها</div><div class="col-6 col-sm-3"><strong>${left}</strong><br>أسئلة متاحة</div><div class="col-6 col-sm-3"><strong>${miss}</strong><br>أسئلة أخطأت فيها</div></div>${!left&&r.exclude?'<p class="alert alert-success">أحسنت! أتقنت جميع أسئلة القسم. يمكنك إنهاء الجولة أو إعادتها.</p>':''}<div class="actions">${r.status==='active'&&!r.active&&left?'<button id="next" class="btn btn-success">بدء الاختبار التالي</button>':''}<button id="backup" class="btn btn-outline-primary">تنزيل ملف حفظ الجولة</button>${r.status==='active'?'<button id="end" class="btn btn-outline-danger">إنهاء الجولة</button>':''}<button id="restart" class="btn btn-outline-secondary">إعادة الجولة من البداية</button><button id="roundPdf" class="btn btn-outline-primary" ${miss?'':'disabled'}>PDF أخطاء الجولة</button></div><p class="small text-muted mt-3 mb-0">تقرير الجولة يجمع كل سؤال أُجيب عنه خطأ، حتى لو أُجيب عنه صحيحًا لاحقًا، دون تكرار. الأسئلة المتروكة تبقى متاحة ولا تُدرج في تقرير الأخطاء.</p></section>`;
 $('backup').onclick=()=>download(JSON.stringify({version:1,bankId:C.bankId,round:r},null,2),`${C.bankId}-round.json`,'application/json');
 if($('next'))$('next').onclick=()=>{C.start(r);save();render();$('quizArea').scrollIntoView({behavior:'smooth'});};
 if($('end'))$('end').onclick=()=>{if(!confirm(r.active?'سيُنهى الاختبار الجاري بإجاباتك الحالية وتُحفظ النتائج، ثم تنتهي الجولة. هل تريد المتابعة؟':'إنهاء الجولة مع الاحتفاظ بنتائجها؟'))return;C.finish(r);r.status='ended';save();render();};
 $('restart').onclick=()=>{if(!confirm('بدء جولة جديدة بالإعدادات نفسها وإتاحة جميع الأسئلة مجددًا؟ ستبقى الجولة السابقة محفوظة.'))return;C.finish(r);r.status='ended';const fresh=C.create(r.section,r.count,r.exclude);data.rounds.push(fresh);data.selectedId=fresh.id;C.start(fresh);save();render();};
 $('roundPdf').onclick=()=>makePdf(C.mistakes(r),'الأسئلة الخاطئة خلال الجولة',`${C.bankId}-round-mistakes.pdf`);
 if(r.active)renderQuiz(r);renderResults(r);
}
function renderQuiz(r){const t=r.active;
 $('quizArea').innerHTML=`<section class="panel"><h2 class="h5 fw-bold">الاختبار ${r.tests.length+1}</h2><p id="answered" aria-live="polite"></p><p class="small text-muted">تُحفظ اختياراتك تلقائيًا. يمكنك مغادرة الصفحة والعودة لإكمال الاختبار.</p></section>`;
 for(const [i,id]of t.ids.entries()){const q=C.bank.get(id),card=document.createElement('article');card.className='question';card.innerHTML=`<fieldset><legend class="fs-6 fw-bold">${i+1}. ${esc(q.q)}</legend><p class="small text-muted">${esc(sectionNames[q.sec])}</p>${q.opts.map((opt,j)=>`<label class="choice"><input type="radio" name="q-${id}" value="${j}" ${t.answers[id]===j?'checked':''}><span>${esc(opt)}</span></label>`).join('')}</fieldset>`;card.addEventListener('change',e=>{t.answers[id]=Number(e.target.value);save();progress();});$('quizArea').append(card);FtmAccount.observe(card,q.id,r.id+':'+t.startedAt,C.bankId);}
 const actions=document.createElement('div');actions.className='panel actions';actions.innerHTML='<button id="submit" class="btn btn-success">إنهاء الاختبار وعرض النتيجة</button><button id="pause" class="btn btn-outline-primary">حفظ ومتابعة لاحقًا</button>';$('quizArea').append(actions);
 function progress(){$('answered').textContent=`أجبت عن ${Object.keys(t.answers).length} من ${t.ids.length} سؤالًا`;}
 progress();$('pause').onclick=()=>{if(save())notice('حُفظ الاختبار الجاري. يمكنك العودة إلى هذه الصفحة في المتصفح نفسه لإكماله.');};
 $('submit').onclick=()=>{const skipped=t.ids.length-Object.keys(t.answers).length;if(skipped&&!confirm(`بقي ${skipped} سؤالًا دون إجابة. إنهاء الاختبار؟`))return;C.finish(r);save();render();$('resultArea').scrollIntoView({behavior:'smooth'});};
}
function renderResults(r){if(!r.tests.length)return;
 $('resultArea').innerHTML='<section class="panel"><h2 class="h5 fw-bold">نتائج اختبارات الجولة</h2><label class="form-label" for="testHistory">اختر اختبارًا للمراجعة</label><select id="testHistory" class="form-select mb-3"></select><div id="testResult"></div></section>';
 r.tests.forEach((t,i)=>$('testHistory').add(new Option(`الاختبار ${i+1} · ${C.score(t).right} صحيح من ${t.ids.length}`,String(i))));$('testHistory').value=String(r.tests.length-1);
 function review(){hidePdf();const t=r.tests[Number($('testHistory').value)],s=C.score(t),wrong=C.wrong(t);
 $('testResult').innerHTML=`<p><strong>${s.right} صحيحة</strong> · ${s.wrong} خاطئة · ${s.skipped} متروكة · النتيجة ${Math.round(s.right/t.ids.length*100)}%</p><button id="testPdf" class="btn btn-outline-primary mb-3" ${wrong.length?'':'disabled'}>PDF أخطاء هذا الاختبار</button>${!wrong.length?'<p class="text-success">لا توجد إجابات خاطئة في هذا الاختبار.</p>':''}<details><summary class="mb-3">مراجعة جميع الأسئلة والإجابات</summary>${t.ids.map(id=>{const q=C.bank.get(id),a=t.answers[id];return `<article class="question"><p class="fw-bold">${esc(q.q)}</p><p class="${a===q.ans?'correct':'wrong'}">إجابتك: ${a===undefined?'لم تجب':esc(q.opts[a])}</p><p class="correct">الإجابة الصحيحة: ${esc(q.opts[q.ans])}</p></article>`;}).join('')}</details>`;
 $('testPdf').onclick=()=>makePdf(wrong,`أخطاء الاختبار ${Number($('testHistory').value)+1}`,`${C.bankId}-test-mistakes.pdf`);}
 $('testHistory').onchange=review;review();
}
async function makePdf(entries,label,filename){
 if(busy||!entries.length)return;if(!window.html2canvas||!window.jspdf){notice('تعذر تحميل أدوات PDF. تحقق من اتصال الإنترنت ثم أعد المحاولة.',true);return;}
 busy=true;const sectionTitle=title(current());notice('جارٍ إنشاء ملف PDF…');let host;
 try{
  await document.fonts.ready;hidePdf();const pdf=new jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
  host=document.createElement('div');host.style.cssText='position:absolute;left:-10000px;top:0;width:794px';document.body.append(host);
  const pages=[];let page,body;
  function newPage(){page=document.createElement('section');page.className='pdf-page';page.innerHTML=`<h1>${esc(label)}</h1><p>${typeof quizConfig==='undefined'?'ملزمة بالبيد':quizConfig.name} · ${esc(sectionTitle)} · ${entries.length} سؤالًا</p><div class="pdf-body"></div><div class="pdf-footer"></div>`;host.append(page);body=page.querySelector('.pdf-body');pages.push(page);}
  newPage();for(const [i,e]of entries.entries()){
   const card=document.createElement('article');card.className='pdf-question';card.innerHTML=`<p><strong>${i+1}. ${esc(e.q.q)}</strong></p><p>${esc(sectionNames[e.q.sec])}</p>${e.q.opts.map((o,j)=>`<p>${j+1}. ${esc(o)}</p>`).join('')}<p class="wrong">إجابتك: ${esc(e.q.opts[e.answer])}</p><p class="correct">الإجابة الصحيحة: ${esc(e.q.opts[e.q.ans])}</p>`;body.append(card);
   if(body.getBoundingClientRect().bottom-page.getBoundingClientRect().top>1000&&body.children.length>1){card.remove();newPage();body.append(card);}
  }
  for(const [i,p]of pages.entries()){p.querySelector('.pdf-footer').textContent=`صفحة ${i+1} من ${pages.length} · ${new Date().toLocaleDateString('ar-SA')}`;const canvas=await html2canvas(p,{scale:1.7,backgroundColor:'#ffffff',useCORS:true,windowWidth:1000});if(i)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);canvas.width=canvas.height=0;}
  pdfUrl=URL.createObjectURL(pdf.output('blob'));$('pdfOpen').href=pdfUrl;$('pdfDownload').href=pdfUrl;$('pdfDownload').download=filename;$('pdfPreview').src=pdfUrl;$('pdfArea').classList.remove('d-none');notice('ملف PDF جاهز للعرض والتحميل.');$('pdfArea').scrollIntoView({behavior:'smooth'});
 }catch(e){console.error(e);notice('تعذر إنشاء PDF. حاول مرة أخرى.',true);}finally{host?.remove();busy=false;}
}
for(const [key,name]of Object.entries(sectionNames))$('section').add(new Option(name,key));
$('create').onclick=()=>{try{const r=C.create($('section').value,Number($('count').value),$('exclude').checked);data.rounds.push(r);data.selectedId=r.id;C.start(r);save();render();$('quizArea').scrollIntoView({behavior:'smooth'});}catch(e){notice(e.message,true);}};
$('saved').onchange=()=>{data.selectedId=$('saved').value;save();render();};
$('importButton').onclick=()=>$('import').click();
$('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024)throw Error('حجم الملف أكبر من الحد المسموح (5 ميجابايت)');const r=C.validate(JSON.parse(await file.text()));if(data.rounds.some(x=>x.id===r.id)){if(!confirm('هذه الجولة موجودة. استبدال النسخة المحلية بالملف المستورد؟'))return;data.rounds=data.rounds.filter(x=>x.id!==r.id);}data.rounds.push(r);data.selectedId=r.id;save();render();notice('تم استيراد الجولة.');}catch(e){notice(e.message,true);}finally{e.target.value='';}};
try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version!==1||!Array.isArray(parsed.rounds))throw Error();data={version:1,rounds:parsed.rounds.map(r=>C.validate({version:1,bankId:C.bankId,round:r})),selectedId:parsed.selectedId};if(!current())data.selectedId=data.rounds.at(-1)?.id||null;}}catch{notice('تعذر قراءة الحفظ السابق. استورد نسخة الجولة إن توفرت؛ لن يُستبدل الحفظ حتى تبدأ جولة أو تستورد ملفًا.',true);}
render();
