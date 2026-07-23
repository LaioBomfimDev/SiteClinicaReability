/* Script leve para as páginas internas (sem splash e sem hero animada).
   O js/main.js é específico do index e não deve ser carregado aqui. */
(function(){
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover:hover)').matches;

  // ===== Campo neural dourado do site principal (usado no rodapé e no hero) =====
  function initNeuroField(sectionId, canvasId, glowId, options){
    const opts=options || {};
    const footer=document.getElementById(sectionId);
    const canvas=document.getElementById(canvasId);
    const footerGlow=glowId ? document.getElementById(glowId) : null;
    const bleed=opts.bleed===undefined ? 118 : opts.bleed;   // rodapé "sangra" para fora; o hero não
    if(!footer || !canvas || reduceMotion || !window.THREE){
      if(footerGlow) footerGlow.style.display='none';
      return;
    }
    let renderer;
    try{
      renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
    }catch(_){
      renderer=null;
    }
    if(!renderer){
      if(footerGlow) footerGlow.style.display='none';
      return;
    }

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(60, 1, .1, 100);
    camera.position.z=8;
    const pointsGeo=new THREE.BufferGeometry();
    const pointsMat=new THREE.PointsMaterial({
      color:0xC9A84C, size:.045, transparent:true, opacity:.65,
      depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
    });
    const points=new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);
    const ico=new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(3.2,1)),
      new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:.07})
    );
    scene.add(ico);

    let raf=null, active=false, tx=0, ty=0, mx=0, my=0;
    const clock=new THREE.Clock();

    function resizeFooterNeuro(){
      const rect=footer.getBoundingClientRect();
      const isMobile=rect.width<700;
      const count=isMobile?320:850;
      const pos=new Float32Array(count*3);
      for(let i=0;i<count;i++){
        pos[i*3]=(Math.random()-.5)*22;
        pos[i*3+1]=(Math.random()-.5)*14;
        pos[i*3+2]=(Math.random()-.5)*14;
      }
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      pointsMat.size=isMobile?.055:.045;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.75));
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height+bleed), false);
      camera.aspect=rect.width/Math.max(1, rect.height+bleed);
      camera.updateProjectionMatrix();
    }

    function drawFooterNeuro(){
      if(!active){raf=null; return}
      const t=clock.getElapsedTime();
      const rect=footer.getBoundingClientRect();
      const progress=Math.max(0, Math.min(1, (innerHeight-rect.top)/(innerHeight+rect.height)));
      mx+=(tx-mx)*.04; my+=(ty-my)*.04;
      points.rotation.y=t*.03+mx*.5+progress*1.2;
      points.rotation.x=my*.3+progress*.4;
      ico.rotation.y=-t*.05+progress*2;
      ico.rotation.x=t*.02;
      camera.position.z=8-progress*1.2;
      renderer.render(scene,camera);
      raf=requestAnimationFrame(drawFooterNeuro);
    }

    function startFooterNeuro(){ if(active) return; active=true; if(!raf) raf=requestAnimationFrame(drawFooterNeuro); }
    function stopFooterNeuro(){ active=false; }

    resizeFooterNeuro();
    if(window.ResizeObserver) new ResizeObserver(resizeFooterNeuro).observe(footer);
    else window.addEventListener('resize', resizeFooterNeuro);

    const footerIO=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.isIntersecting ? startFooterNeuro() : stopFooterNeuro());
    },{threshold:.08});
    footerIO.observe(footer);

    if(canHover){
      window.addEventListener('pointermove',e=>{
        const r=footer.getBoundingClientRect();
        const inside=e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
        footer.classList.toggle('fx-active', inside);
        if(!inside) return;
        tx=e.clientX/innerWidth-.5;
        ty=e.clientY/innerHeight-.5;
        footer.style.setProperty('--fx', (e.clientX-r.left)+'px');
        footer.style.setProperty('--fy', (e.clientY-r.top)+'px');
      },{passive:true});
    }
  }

  // ===== Dicas em sanfona (sem JS os painéis ficam abertos) =====
  function initTipsAccordion(){
    const accordion=document.getElementById('tipsAccordion');
    if(!accordion) return;
    const items=[...accordion.querySelectorAll('.tip-item')];
    if(!items.length) return;

    // recolhe tudo sem animar, para não "piscar" aberto no carregamento
    accordion.classList.add('js','no-anim');
    items.forEach(item=>{
      item.classList.remove('open');
      item.querySelector('.tip-head')?.setAttribute('aria-expanded','false');
    });
    requestAnimationFrame(()=>requestAnimationFrame(()=>accordion.classList.remove('no-anim')));
    setTimeout(()=>accordion.classList.remove('no-anim'), 150);

    accordion.addEventListener('click', e=>{
      const head=e.target.closest('.tip-head');
      if(!head) return;
      const item=head.closest('.tip-item');
      const open=!item.classList.contains('open');
      item.classList.toggle('open', open);
      head.setAttribute('aria-expanded', String(open));
    });
  }

  function lockScroll(){
    document.body.style.position='fixed';
    document.body.style.top='0';
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.width='100%';
  }
  function unlockScroll(){
    document.body.style.position='';
    document.body.style.top='';
    document.body.style.left='';
    document.body.style.right='';
    document.body.style.width='';
  }

  // ===== Menu mobile: toque na logo do topbar abre o painel lateral =====
  function initMobileNav(topbar){
    const backdrop=document.getElementById('mobileNavBackdrop');
    const panel=document.getElementById('mobileNavPanel');
    const trigger=topbar?.querySelector('.brand-mini');
    if(!backdrop || !panel || !trigger) return;
    let navOpen=false, lastFocused=null;

    function openNav(){
      navOpen=true;
      panel.classList.add('open'); backdrop.classList.add('open');
      panel.setAttribute('aria-hidden','false');
      trigger.setAttribute('aria-expanded','true');
      lastFocused=document.activeElement;
      lockScroll();
      panel.querySelector('.mobile-nav-close')?.focus();
    }
    function closeNav(){
      if(!navOpen) return;
      navOpen=false;
      panel.classList.remove('open'); backdrop.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      trigger.setAttribute('aria-expanded','false');
      unlockScroll();
      if(lastFocused) lastFocused.focus();
    }

    trigger.setAttribute('aria-haspopup','true');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-controls','mobileNavPanel');

    trigger.addEventListener('click', e=>{
      if(window.innerWidth>920) return;
      e.preventDefault();
      navOpen ? closeNav() : openNav();
    });
    panel.querySelectorAll('[data-close-nav], .mobile-nav-links a, .mobile-nav-cta').forEach(el=>{
      el.addEventListener('click', closeNav);
    });
    backdrop.addEventListener('click', closeNav);
    document.addEventListener('keydown', e=>{ if(navOpen && e.key==='Escape') closeNav(); });
    window.addEventListener('resize', ()=>{ if(navOpen && window.innerWidth>920) closeNav(); }, {passive:true});
  }

  document.addEventListener('DOMContentLoaded', function(){
    initNeuroField('rodape', 'footerNeuroCanvas', 'footerMouseGlow');
    initTipsAccordion();
    // hero das páginas internas: mesmo campo, sem sangrar altura extra
    document.querySelectorAll('.inner-hero').forEach(hero=>{
      if(!hero.id) hero.id='innerHero';
      initNeuroField(hero.id, 'innerHeroNeuro', 'innerHeroGlow', {bleed:0});
    });
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
    initMobileNav(topbar);

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
