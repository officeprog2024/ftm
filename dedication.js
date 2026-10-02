'use strict';
(() => {
  const button=document.getElementById('dedication-toggle'),content=document.getElementById('dedication-text');
  if(!button||!content)return;
  let hidden=false;try{hidden=localStorage.getItem('ftm-dedication-hidden')==='true';}catch{}
  function render(){content.hidden=hidden;button.textContent=hidden?'+':'−';button.setAttribute('aria-expanded',String(!hidden));const label=hidden?'فتح الإهداء':'إخفاء الإهداء';button.setAttribute('aria-label',label);button.title=label;}
  button.addEventListener('click',()=>{hidden=!hidden;render();try{localStorage.setItem('ftm-dedication-hidden',String(hidden));}catch{}});
  render();
})();
