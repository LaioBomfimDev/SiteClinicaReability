/* Script leve para as páginas internas (sem splash e sem hero animada).
   O js/main.js é específico do index e não deve ser carregado aqui. */
(function(){
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function(){
    document.body.classList.add('wa-ready');

    // Reveals ao entrar na tela
    if(reduceMotion){
      document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
    }else{
      const io = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      },{threshold:.15});
      document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
    }

    // Topbar: nas páginas internas aparece já no topo
    const topbar = document.getElementById('topbar');
    if(topbar) topbar.classList.add('visible');

    // Balão do WhatsApp
    const bubble = document.getElementById('waBubble');
    const close = document.getElementById('waBubbleClose');
    if(bubble && close){
      close.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        bubble.style.display='none';
      });
    }
  });
})();
