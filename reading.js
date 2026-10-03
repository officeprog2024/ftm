'use strict';
(() => {
  const labels=['أ','ب','ج','د'];
  const accountBank=typeof quizConfig==='undefined'?'balbaid':quizConfig.id,readingId=crypto.randomUUID();
  FtmAccount.setBank(accountBank);
  document.title=document.getElementById('reading-title').textContent+' | الملازم والأسئلة للقراءة';
  document.getElementById('reading-count').textContent=`${questionsDatabase.length} سؤالًا، بالترتيب الأصلي، مع الخيارات والإجابات الصحيحة${questionsDatabase.some(q=>q.notes)?' والتوضيحات المرفقة':''}.`;
  const root=document.getElementById('reading-questions'),fragment=document.createDocumentFragment();
  const text=(tag,content,className)=>{const el=document.createElement(tag);el.textContent=content;if(className)el.className=className;return el;};
  for(const q of questionsDatabase){
    const card=document.createElement('article');card.className='reading-question';card.setAttribute('aria-labelledby',`q-${q.id}`);
    const header=document.createElement('div');header.className='question-meta';header.append(text('span',`السؤال ${q.id}`,'question-number'),text('span',sectionNames[q.sec]||q.sec,'section-badge'));card.append(header);
    const heading=text('h2',q.q,'question-text');heading.id=`q-${q.id}`;card.append(heading);
    const options=document.createElement('ul');options.className='reading-options';q.opts.forEach((option,i)=>{const item=text('li',`${labels[i]}. ${option}`,i===q.ans?'correct-option':'');options.append(item);});card.append(options);
    card.append(text('p',`الإجابة الصحيحة: ${labels[q.ans]}. ${q.opts[q.ans]}`,'answer-text'));
    if(q.notes){const note=document.createElement('div');note.className='reading-note';note.append(text('strong','توضيح'),text('p',q.notes));card.append(note);}
    fragment.append(card);
    FtmAccount.observe(card,q.id,readingId,accountBank);
  }
  root.append(fragment);
})();
