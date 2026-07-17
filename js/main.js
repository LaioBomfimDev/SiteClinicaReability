    // ===== Fundadora: "ler mais" (recolhe via JS; sem JS, fica tudo aberto) =====
    const founderToggle=document.getElementById('founderToggle');
    if(founderToggle){
      const founderSec=document.getElementById('denise');
      const founderMore=document.getElementById('founderMore');
      const updateFounderClip=()=>{
        const secondParagraph=founderMore?.querySelector('p:nth-of-type(1)');
        if(!founderMore || !secondParagraph) return;
        const moreTop=founderMore.getBoundingClientRect().top;
        const secondTop=secondParagraph.getBoundingClientRect().top - moreTop;
        const styles=getComputedStyle(secondParagraph);
        const lineHeight=parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.75;
        const visibleLines=1; // linhas cheias do parágrafo antes do fade começar
        founderSec.style.setProperty('--founder-fade-start', `${Math.max(0, Math.round(secondTop + lineHeight * visibleLines - 2))}px`);
        founderSec.style.setProperty('--founder-collapsed-height', `${Math.round(secondTop + lineHeight * (visibleLines + 1.08))}px`);
      };
      founderSec.classList.add('no-anim','collapsed');
      founderToggle.setAttribute('aria-expanded','false');
      updateFounderClip();
      if(document.fonts) document.fonts.ready.then(updateFounderClip);
      window.addEventListener('resize', updateFounderClip, {passive:true});
      // libera a transição só depois do recolhimento inicial (evita "fechar" no load)
      const enableAnim=()=>founderSec.classList.remove('no-anim');
      requestAnimationFrame(()=>requestAnimationFrame(enableAnim));
      setTimeout(enableAnim, 120);
      founderToggle.addEventListener('click', ()=>{
        const open=!founderSec.classList.toggle('collapsed');
        founderToggle.setAttribute('aria-expanded', String(open));
        founderToggle.querySelector('.lbl').textContent = open ? 'Mostrar menos' : 'Ler biografia completa';
        if(window.ScrollTrigger) setTimeout(()=>ScrollTrigger.refresh(), 750);
      });
    }

    // ===== Estado geral =====
    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover=matchMedia('(hover:hover)').matches;
    let cachedWebGLSupport=null;
    const hasThree=()=>Boolean(window.THREE && window.THREE.WebGLRenderer);
    function supportsWebGL(){
      if(cachedWebGLSupport!==null) return cachedWebGLSupport;
      try{
        const testCanvas=document.createElement('canvas');
        cachedWebGLSupport=Boolean(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
      }catch(_){
        cachedWebGLSupport=false;
      }
      document.documentElement.classList.toggle('no-webgl', !cachedWebGLSupport);
      return cachedWebGLSupport;
    }
    function createThreeRenderer(canvas, options){
      if(!hasThree()){
        document.documentElement.classList.add('no-three');
        return null;
      }
      if(!supportsWebGL()) return null;
      try{
        return new THREE.WebGLRenderer(Object.assign({canvas}, options));
      }catch(_){
        document.documentElement.classList.add('no-webgl');
        return null;
      }
    }

    function initHeroFallback(hero, canvas, animate){
      hero.classList.add('hero-fallback');
      if(!canvas?.getContext) return;
      const ctx=canvas.getContext('2d');
      if(!ctx) return;

      let w=0,h=0,dpr=1,seed=1,raf=null,active=false,tx=0,ty=0,mx=0,my=0;
      let particles=[];
      const rand=()=>{
        seed=(seed*1664525+1013904223)>>>0;
        return seed/4294967296;
      };

      function rebuild(){
        seed=(Math.round(w)*73856093 ^ Math.round(h)*19349663)>>>0;
        const mobile=w<700;
        const fieldCount=mobile?180:420;
        particles=Array.from({length:fieldCount},()=>({
          x:rand()*w,
          y:rand()*h,
          r:.45+rand()*1.45,
          a:.08+rand()*.22,
          p:rand()*Math.PI*2,
          z:.35+rand()*1.25
        }));
      }

      function resizeFallback(){
        const rect=hero.getBoundingClientRect();
        w=Math.max(1, rect.width);
        h=Math.max(1, rect.height);
        dpr=Math.min(window.devicePixelRatio || 1, 1.75);
        canvas.width=Math.round(w*dpr);
        canvas.height=Math.round(h*dpr);
        canvas.style.width='100%';
        canvas.style.height='100%';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        rebuild();
        drawFallback(performance.now());
      }

      function glow(x,y,r,color){
        const g=ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,color);
        g.addColorStop(1,'rgba(201,168,76,0)');
        ctx.fillStyle=g;
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fill();
      }

      function drawFallback(now){
        const t=now*.001;
        mx+=(tx-mx)*.05;
        my+=(ty-my)*.05;
        ctx.clearRect(0,0,w,h);
        ctx.globalCompositeOperation='lighter';
        const driftX=mx*28, driftY=my*18;

        particles.forEach(p=>{
          const pulse=animate ? .72+.28*Math.sin(t*.7+p.p) : .86;
          glow(p.x+driftX*p.z, p.y+driftY*p.z, p.r*7, `rgba(201,168,76,${p.a*pulse})`);
        });

        ctx.globalCompositeOperation='source-over';
        if(active && animate) raf=requestAnimationFrame(drawFallback);
        else raf=null;
      }

      function startFallback(){
        active=true;
        if(!raf) raf=requestAnimationFrame(drawFallback);
      }

      function stopFallback(){
        active=false;
      }

      resizeFallback();
      if(window.ResizeObserver) new ResizeObserver(resizeFallback).observe(hero);
      else window.addEventListener('resize', resizeFallback);

      if(animate && window.IntersectionObserver){
        const io=new IntersectionObserver(entries=>{
          entries.forEach(entry=>entry.isIntersecting ? startFallback() : stopFallback());
        },{threshold:.05});
        io.observe(hero);
      }else{
        drawFallback(performance.now());
      }

      if(animate && canHover){
        window.addEventListener('pointermove',e=>{
          tx=e.clientX/innerWidth-.5;
          ty=e.clientY/innerHeight-.5;
        },{passive:true});
      }
    }

    // ===== Hero: campo neural dourado (mesma composição do rodapé) =====
    (function initHeroNeuro(){
      const hero=document.getElementById('hero');
      const canvas=document.getElementById('heroNeuro');
      if(!hero || !canvas) return;
      if(reduceMotion){
        initHeroFallback(hero, canvas, false);
        return;
      }

      const renderer=createThreeRenderer(canvas, {alpha:true, antialias:false, powerPreference:'low-power'});
      if(!renderer){
        initHeroFallback(hero, canvas, true);
        return;
      }
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(60, 1, .1, 100);
      camera.position.z=8;

      // Mesma linguagem visual do rodapé: partículas douradas + poliedro de linhas finas
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

      function resizeHeroNeuro(){
        const rect=hero.getBoundingClientRect();
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile?1.5:1.75));
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect=rect.width/Math.max(1, rect.height);
        camera.updateProjectionMatrix();
      }

      function drawHeroNeuro(){
        if(!active){raf=null; return}
        const t=clock.getElapsedTime();
        // parallax de saída: o campo gira e aproxima conforme a hero sai da tela
        const sp=Math.min(1, window.scrollY/Math.max(1, innerHeight));
        mx+=(tx-mx)*.04; my+=(ty-my)*.04;
        points.rotation.y=t*.03+mx*.5+sp*1.2;
        points.rotation.x=my*.3+sp*.4;
        ico.rotation.y=-t*.05+sp*2;
        ico.rotation.x=t*.02;
        camera.position.z=8-sp*1.2;
        renderer.render(scene,camera);
        raf=requestAnimationFrame(drawHeroNeuro);
      }

      function startHeroNeuro(){
        if(active) return;
        active=true;
        if(!raf) raf=requestAnimationFrame(drawHeroNeuro);
      }

      function stopHeroNeuro(){
        active=false;
      }

      resizeHeroNeuro();
      if(window.ResizeObserver) new ResizeObserver(resizeHeroNeuro).observe(hero);
      else window.addEventListener('resize', resizeHeroNeuro);

      const heroIO=new IntersectionObserver(entries=>{
        entries.forEach(entry=>entry.isIntersecting ? startHeroNeuro() : stopHeroNeuro());
      },{threshold:.05});
      heroIO.observe(hero);

      if(canHover){
        window.addEventListener('pointermove',e=>{
          if(!active) return;
          tx=e.clientX/innerWidth-.5;
          ty=e.clientY/innerHeight-.5;
        },{passive:true});
      }
    })();

    // ===== Splash: espera o scroll para revelar a hero =====
    const splash=document.getElementById('splash');
    const heroReveals=[...document.querySelectorAll('#hero .reveal')];
    let splashDone=false;
    function revealWa(){
      document.body.classList.add('wa-ready');
      if(window.__waStart) window.__waStart();
    }
    function finishSplash(){
      if(splashDone) return; splashDone=true;
      document.body.style.overflow='';
      window.scrollTo({top:0,left:0,behavior:'auto'});
      const showHero=()=>heroReveals.forEach(el=>el.classList.add('in'));
      if(window.gsap){
        gsap.timeline({onComplete:()=>{splash.style.display='none'; revealWa();}})
          .to('.splash .phrase',{y:-46,opacity:0,filter:'blur(6px)',duration:.65,ease:'power2.in'},0)
          .to('.splash-logo,.splash .hint',{opacity:0,duration:.4,ease:'power1.in'},0)
          .to(splash,{yPercent:-100,duration:1.05,ease:'power4.inOut'},.15)
          .add(showHero,.55);
      }else{
        splash.classList.add('done'); showHero();
        setTimeout(()=>{splash.style.display='none'; revealWa();},900);
      }
    }
    if(reduceMotion){
      splashDone=true; splash.style.display='none';
      heroReveals.forEach(el=>el.classList.add('in'));
      revealWa();
    }else{
      document.body.style.overflow='hidden';
      ['wheel','touchmove','keydown'].forEach(ev=>window.addEventListener(ev, finishSplash, {once:true, passive:true}));
      splash.addEventListener('click', finishSplash, {once:true});
    }

    // ===== Reveals base (funcionam mesmo sem as libs) =====
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      })
    },{threshold:.15});
    document.querySelectorAll('.reveal').forEach(el=>{ if(!heroReveals.includes(el)) io.observe(el); });

    // O texto "se escrevendo" rearma ao sair da tela: sobe e desce de novo, anima de novo
    const splitObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.target.classList.toggle('in', entry.isIntersecting))
    },{threshold:.3});
    document.querySelectorAll('.splitText').forEach(el=>{
      const text=el.textContent.trim().replace(/\s+/g,' ');
      el.textContent='';
      el.setAttribute('aria-label', text);
      let charIndex=0;

      text.split(/(\s+)/).forEach(part=>{
        if(!part) return;
        if(/^\s+$/.test(part)){
          el.appendChild(document.createTextNode(' '));
          return;
        }

        const word=document.createElement('span');
        word.className='split-word';
        word.setAttribute('aria-hidden','true');
        [...part].forEach(ch=>{
          const span=document.createElement('span');
          span.className='split-char';
          span.textContent=ch;
          span.style.transitionDelay=(charIndex*18)+'ms';
          charIndex++;
          word.appendChild(span);
        });
        el.appendChild(word);
      });
      splitObserver.observe(el);
    });

    // ===== Topbar + link ativo =====
    const topbar=document.getElementById('topbar');
    function onScroll(){
      topbar.classList.toggle('visible', window.scrollY > window.innerHeight*.55);
    }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

    const navAnchors=[...document.querySelectorAll('.navlinks a')];
    const secIO=new IntersectionObserver(es=>{
      es.forEach(en=>{
        if(en.isIntersecting) navAnchors.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+en.target.id));
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    ['jornada','denise','situacoes','faq','contato'].forEach(id=>{
      const el=document.getElementById(id); if(el) secIO.observe(el);
    });

    // ===== Métricas =====
    const nums=document.querySelectorAll('.num'); const seen=new WeakSet();
    const metricObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting && !seen.has(entry.target)){
          seen.add(entry.target);
          const target=+entry.target.dataset.target, suffix=entry.target.dataset.suffix || '';
          const start=performance.now(), dur=1800;
          function tick(now){
            const p=Math.min(1,(now-start)/dur), eased=1-Math.pow(1-p,3);
            entry.target.textContent=Math.round(target*eased)+suffix;
            if(p<1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      })
    },{threshold:.5});
    nums.forEach(n=>metricObserver.observe(n));

    // ===== Cursor glow com inércia =====
    const glow=document.getElementById('cursorGlow');
    if(canHover && !reduceMotion){
      let mx=innerWidth/2,my=innerHeight*.4,gx=mx,gy=my;
      window.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY},{passive:true});
      (function glowLoop(){
        gx+=(mx-gx)*.10; gy+=(my-gy)*.10;
        glow.style.left=gx+'px'; glow.style.top=gy+'px';
        requestAnimationFrame(glowLoop);
      })();
    }else{
      glow.style.display='none';
    }

    // ===== Footer: campo neural dourado igual ao da hero =====
    (function initFooterFX(){
      const footer=document.getElementById('rodape');
      const canvas=document.getElementById('footerNeuroCanvas');
      const footerGlow=document.getElementById('footerMouseGlow');
      if(!footer || !canvas || reduceMotion){
        if(footerGlow) footerGlow.style.display='none';
        return;
      }

      const renderer=createThreeRenderer(canvas, {alpha:true, antialias:false, powerPreference:'low-power'});
      if(!renderer){
        footer.classList.add('footer-fallback');
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

      function resizeFooterFX(){
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
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height+118), false);
        camera.aspect=rect.width/Math.max(1, rect.height+118);
        camera.updateProjectionMatrix();
      }

      function drawFooterFX(){
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
        raf=requestAnimationFrame(drawFooterFX);
      }

      function startFooterFX(){
        if(active) return;
        active=true;
        if(!raf) raf=requestAnimationFrame(drawFooterFX);
      }

      function stopFooterFX(){
        active=false;
      }

      resizeFooterFX();
      if(window.ResizeObserver) new ResizeObserver(resizeFooterFX).observe(footer);
      else window.addEventListener('resize', resizeFooterFX);

      const footerIO=new IntersectionObserver(entries=>{
        entries.forEach(entry=>entry.isIntersecting ? startFooterFX() : stopFooterFX());
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
    })();


    // ===== GSAP: storytelling no scroll (carrega via defer -> DOMContentLoaded) =====
    window.addEventListener('DOMContentLoaded', ()=>{
      if(window.gsap && window.ScrollTrigger && !reduceMotion){
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray('.ch-no').forEach(el=>{
          gsap.fromTo(el,{yPercent:-28},{yPercent:-72,ease:'none',
            scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1}});
        });

        gsap.to('.hero-content',{yPercent:-14,opacity:.3,ease:'none',
          scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});

        gsap.fromTo('.ph-img',{scale:1.12,yPercent:-4},{scale:1.02,yPercent:4,ease:'none',
          scrollTrigger:{trigger:'.clinic-photo',start:'top bottom',end:'bottom top',scrub:1}});

        gsap.fromTo('.zenith h2',{yPercent:14},{yPercent:-14,ease:'none',
          scrollTrigger:{trigger:'.zenith',start:'top bottom',end:'bottom top',scrub:1}});

        const founderTimeline=document.querySelector('.timeline');
        if(founderTimeline){
          const founderMilestones=gsap.utils.toArray('.timeline .milestone');
          if(founderMilestones.length){
            founderTimeline.style.setProperty('--timeline-inset', `${100 / (founderMilestones.length * 2)}%`);
          }
          gsap.set(founderTimeline, {'--timeline-progress':0});
          gsap.set(founderMilestones, {opacity:.42, y:18, '--dot-active':0});
          gsap.timeline({
            scrollTrigger:{trigger:founderTimeline, start:'top 82%', end:'bottom 48%', scrub:1}
          })
          .to(founderTimeline, {'--timeline-progress':1, ease:'none', duration:1}, 0)
          .to(founderMilestones, {opacity:1, y:0, '--dot-active':1, ease:'none', stagger:{amount:.82}, duration:.18}, 0);
        }

      }

      // ===== Atendimento online: o scroll abre o notebook (fechado -> aberto), desktop e mobile =====
      (function(){
        const stage=document.getElementById('onlineStage');
        const laptop=document.getElementById('laptop');
        const open=laptop && laptop.querySelector('.lap-open');
        const closed=laptop && laptop.querySelector('.lap-closed');
        if(!laptop || !open || !closed) return;
        const canAnimate = window.gsap && !reduceMotion;
        if(canAnimate){
          // estado inicial: só o fechado visível, levemente deslocado (parallax)
          gsap.set(open,{opacity:0});
          gsap.set(closed,{opacity:1});
          gsap.set(laptop,{yPercent:6});
          const build=()=>{
            // O usuário entra na seção vendo o notebook FECHADO; a abertura dispara
            // quando o CENTRO do notebook chega perto do centro da viewport, com duração
            // própria (visível mesmo em scroll rápido) e rearma sempre que ele sai da tela.
            const tl=gsap.timeline({paused:true})
              .to(laptop,{yPercent:0, ease:'power2.out', duration:1.4}, 0)
              // cross-dissolve simultâneo: soma das opacidades ~1 (sem "dois notebooks", sem sumiço)
              .to(closed,{opacity:0, ease:'power1.inOut', duration:1.15}, .12)
              .to(open,{opacity:1, ease:'power1.inOut', duration:1.15}, .12);
            // Mede a posição real a cada scroll (imune ao cálculo de posição do
            // ScrollTrigger, que ficava errado com o splash e disparava cedo demais).
            // Rearma quando o notebook sai da tela: a cada retorno, abre de novo.
            let played=false;
            const check=()=>{
              const r=laptop.getBoundingClientRect();
              if(r.width===0) return;                      // layout ainda não assentou
              const outOfView = r.bottom < -40 || r.top > innerHeight + 40;
              if(outOfView){
                if(played){ tl.pause(0); played=false; }   // volta ao estado fechado, pronto pra repetir
                return;
              }
              const center=r.top + r.height/2;
              if(!played && center <= innerHeight*0.68){   // chegou à zona central: abre
                played=true;
                tl.play(0);
              }
            };
            window.addEventListener('scroll', check, {passive:true});
            check();
          };
          // liga o efeito assim que a imagem aberta estiver pronta (fetchpriority=high garante cedo)
          if(open.complete && open.naturalWidth){ build(); }
          else { open.addEventListener('load', build, {once:true}); open.addEventListener('error', build, {once:true}); }
        }else{
          // sem libs / movimento reduzido: mostra a tela aberta direto
          open.style.opacity='1';
        }
      })();

      if(!reduceMotion) initThree();
    });

    // ===== WhatsApp flutuante: balão recorrente a cada 20s =====
    (function(){
      const bubble=document.getElementById('waBubble');
      const closeBtn=document.getElementById('waBubbleClose');
      if(!bubble) return;
      let dismissed=false, started=false, timer=null, watching=false;
      const SHOW_MS=6000, EVERY_MS=20000;
      function showOnce(){
        if(dismissed || document.hidden || !document.body.classList.contains('wa-visible')) return;
        bubble.classList.add('show');
        setTimeout(()=>bubble.classList.remove('show'), SHOW_MS);
      }
      function start(){
        if(started || dismissed) return; started=true;
        setTimeout(showOnce, 3500);          // primeira aparição ~3,5s após o splash
        timer=setInterval(showOnce, EVERY_MS); // depois, a cada 20s
      }
      function updateVisibility(){
        const visible=window.scrollY > window.innerHeight*.72;
        document.body.classList.toggle('wa-visible', visible);
        if(visible) start();
        else bubble.classList.remove('show');
      }
      closeBtn?.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        dismissed=true; bubble.classList.remove('show');
        if(timer) clearInterval(timer);
      });
      // só monitora quando o splash terminar (revealWa adiciona body.wa-ready e chama __waStart)
      window.__waStart = ()=>{
        if(!watching){
          watching=true;
          window.addEventListener('scroll', updateVisibility, {passive:true});
          window.addEventListener('resize', updateVisibility, {passive:true});
        }
        updateVisibility();
      };
      if(document.body.classList.contains('wa-ready')) window.__waStart();
    })();

    // ===== Three.js: campo neural dourado reativo a mouse e scroll =====
    function initThree(){
      const canvas=document.getElementById('neuroCanvas');
      if(!canvas) return;
      const renderer=createThreeRenderer(canvas, {alpha:true, antialias:false, powerPreference:'low-power'});
      if(!renderer) return;
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 100);
      camera.position.z=8;
      const isMobile=innerWidth<700;
      const COUNT=isMobile?320:850;
      const pos=new Float32Array(COUNT*3);
      for(let i=0;i<COUNT;i++){
        pos[i*3]=(Math.random()-.5)*22; pos[i*3+1]=(Math.random()-.5)*14; pos[i*3+2]=(Math.random()-.5)*14;
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      const points=new THREE.Points(geo, new THREE.PointsMaterial({
        color:0xC9A84C, size:isMobile?.055:.045, transparent:true, opacity:.65,
        depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
      }));
      scene.add(points);
      const ico=new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(3.2,1)),
        new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:.07})
      );
      scene.add(ico);

      let tx=0,ty=0,mx=0,my=0;
      if(canHover) window.addEventListener('pointermove',e=>{
        tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5;
      },{passive:true});

      function resize3d(){
        renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
        renderer.setSize(innerWidth,innerHeight,false);
        camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', resize3d); resize3d();

      let raf=null; const clock=new THREE.Clock();
      function tick3d(){
        const t=clock.getElapsedTime();
        mx+=(tx-mx)*.04; my+=(ty-my)*.04;
        const sp=window.scrollY/Math.max(1, document.documentElement.scrollHeight-innerHeight);
        points.rotation.y=t*.03+mx*.5+sp*1.2;
        points.rotation.x=my*.3+sp*.4;
        ico.rotation.y=-t*.05+sp*2; ico.rotation.x=t*.02;
        camera.position.z=8-sp*1.6;
        renderer.render(scene,camera);
        raf=requestAnimationFrame(tick3d);
      }
      tick3d();
      document.addEventListener('visibilitychange',()=>{
        if(document.hidden){cancelAnimationFrame(raf); raf=null}
        else if(!raf) tick3d();
      });
    }

    // ===== Modal de especialidades =====
    const caseScenarios = [
      {
        name:"Neuropsicologia",
        quote:"“Preciso entender o que está acontecendo com a memória, a atenção ou o comportamento.”",
        desc:"Especialidade de Denise Neves, neuropsicóloga responsável pela clínica. Investiga como o cérebro está funcionando — memória, atenção, linguagem, raciocínio, comportamento — e transforma o resultado em direção prática de tratamento.",
        examples:[
          "Avaliação neuropsicológica com devolutiva e laudo completo",
          "Reabilitação cognitiva para recuperar funções no dia a dia",
          "Psicoterapia individual",
          "Neuromodulação não invasiva, quando há indicação clínica"
        ]
      },
      {
        name:"Fisioterapia",
        quote:"“O corpo não responde como antes: dor, fraqueza ou falta de ar limitam a rotina.”",
        desc:"Cuida do movimento, da força e da respiração — de sequelas neurológicas a dores ortopédicas e posturais. O plano parte da avaliação e trabalha com metas funcionais claras.",
        examples:[
          "Fisioterapia neurofuncional após AVC, Parkinson e outras condições",
          "Fisioterapia ortopédica para dores, lesões e pós-operatório",
          "Fisioterapia respiratória para quem tem dificuldade para respirar",
          "RPG para postura e dores crônicas"
        ]
      },
      {
        name:"Terapia ocupacional",
        quote:"“Coisas simples do dia a dia passaram a exigir ajuda o tempo todo.”",
        desc:"Devolve independência nas atividades que importam: comer, vestir-se, estudar, trabalhar, brincar. Trabalha com adaptações e treino realista, sempre junto com a família.",
        examples:[
          "Treino de atividades de vida diária e autonomia",
          "Estimulação no desenvolvimento infantil: TEA, atrasos e síndromes",
          "Adaptações de rotina e orientação a cuidadores"
        ]
      },
      {
        name:"Nutrição",
        quote:"“A alimentação virou motivo de preocupação — ou de briga à mesa.”",
        desc:"Do acompanhamento nutricional clássico à terapia alimentar para quem tem dificuldades reais com o comer. Atende adultos, crianças e pacientes com necessidades específicas.",
        examples:[
          "Nutrição adulto e infantil",
          "Terapia alimentar para seletividade e recusa alimentar",
          "Nutrição renal e de condições crônicas"
        ]
      },
      {
        name:"Psiquiatria",
        quote:"“Talvez seja hora de uma avaliação médica — ou de revisar a medicação.”",
        desc:"O psiquiatra avalia, diagnostica e conduz o tratamento medicamentoso quando necessário, em diálogo constante com o restante da equipe.",
        examples:[
          "Avaliação e diagnóstico psiquiátrico",
          "Acompanhamento medicamentoso de ansiedade, depressão, TDAH e outros",
          "Trabalho integrado com neuropsicologia e terapias"
        ]
      },
      {
        name:"Terapias integrativas",
        quote:"“A dor, a tensão ou o estresse não dão trégua.”",
        desc:"Recursos complementares aplicados por Denise, com formação específica: estimulam o corpo a responder melhor à dor, à inflamação e ao estresse — sempre dentro do plano terapêutico.",
        examples:[
          "Acupuntura para dor, tensão e ansiedade",
          "Laserpuntura: estímulo dos pontos com laser, sem agulhas",
          "Fotobiomodulação para dor, inflamação e recuperação — incluindo aplicação vascular"
        ]
      }
    ];

    // Conteúdo educativo e resumido. A conduta real é sempre definida após avaliação individual.
    const conditionScenarios = [
      {
        name:"AVC",
        about:"O acidente vascular cerebral acontece quando o fluxo de sangue para uma área do cérebro é interrompido ou quando há sangramento. Pode alterar movimento, fala, memória, atenção e independência, de formas diferentes em cada pessoa.",
        professionals:[
          ["Fisioterapia","Trabalha mobilidade, força, equilíbrio, marcha e uso funcional do corpo, com metas ligadas à rotina."],
          ["Neuropsicologia","Avalia atenção, memória, linguagem e comportamento e organiza estratégias de reabilitação cognitiva."],
          ["Terapia ocupacional","Treina atividades como vestir-se, alimentar-se e voltar às tarefas de casa ou trabalho, com adaptações quando necessárias."]
        ]
      },
      {
        name:"Parkinson",
        about:"É uma condição neurológica progressiva que pode afetar movimentos, equilíbrio, sono, humor e cognição. O acompanhamento busca preservar função, segurança e qualidade de vida.",
        professionals:[
          ["Fisioterapia","Treina amplitude de movimento, força, postura, equilíbrio e marcha para manter mobilidade e reduzir o risco de quedas."],
          ["Neuropsicologia","Acompanha mudanças de atenção, memória, planejamento e humor, propondo estratégias para o cotidiano."],
          ["Nutrição","Cuida de peso, hidratação, funcionamento intestinal e adequação das refeições às dificuldades e à rotina de medicamentos."]
        ]
      },
      {
        name:"Paralisia de Bell",
        about:"É uma fraqueza ou paralisia súbita de um lado do rosto, relacionada ao nervo facial. Precisa de avaliação médica rápida, especialmente nas primeiras horas, para confirmar a causa e proteger o olho.",
        professionals:[
          ["Fisioterapia","Avalia a função facial e orienta movimentos suaves, massagem e estratégias para simetria, tensão e movimentos involuntários."],
          ["Fotobiomodulação","Pode ser considerada como recurso complementar para dor e recuperação tecidual, quando houver indicação e acompanhamento profissional."]
        ]
      },
      {
        name:"Paralisia cerebral",
        about:"É um grupo de alterações permanentes do movimento e da postura causadas por uma lesão ou diferença no desenvolvimento do cérebro ainda imaturo. As necessidades variam muito de pessoa para pessoa.",
        professionals:[
          ["Fisioterapia","Estimula mobilidade, controle postural, força e prevenção de encurtamentos, além de orientar posicionamento e recursos de apoio."],
          ["Terapia ocupacional","Desenvolve autonomia para brincar, estudar, comer, vestir-se e participar da rotina, com adaptações de ambiente e tarefas."],
          ["Nutrição","Acompanha crescimento, ingestão, hidratação e necessidades nutricionais, articulando avaliação da deglutição quando preciso."]
        ]
      },
      {
        name:"TEA",
        about:"O transtorno do espectro autista é uma condição do neurodesenvolvimento que influencia comunicação, interação social, comportamento e processamento sensorial. Cada pessoa apresenta uma combinação própria de habilidades e necessidades.",
        professionals:[
          ["Neuropsicologia","Mapeia o perfil cognitivo, comportamental e adaptativo, identifica potencialidades e dificuldades e orienta família e escola."],
          ["Terapia ocupacional","Trabalha autonomia, participação nas rotinas e respostas sensoriais que interferem em brincar, estudar, dormir ou cuidar de si."],
          ["Terapia alimentar","Investiga fatores sensoriais, motores e comportamentais ligados à alimentação e amplia experiências com segurança e sem coerção."]
        ]
      },
      {
        name:"TDAH",
        about:"É uma condição do neurodesenvolvimento marcada por desatenção e/ou hiperatividade e impulsividade persistentes, com impacto em mais de um contexto da vida.",
        professionals:[
          ["Neuropsicologia","Investiga atenção, funções executivas, aprendizagem e condições associadas para esclarecer o perfil e orientar estratégias práticas."],
          ["Psiquiatria","Realiza avaliação médica, considera diagnósticos associados e acompanha medicação quando ela faz parte do plano terapêutico."]
        ]
      },
      {
        name:"Síndromes genéticas",
        about:"São condições relacionadas a alterações em genes ou cromossomos. Podem afetar desenvolvimento, cognição, movimento e autonomia de maneiras muito diversas.",
        professionals:[
          ["Neuropsicologia","Identifica o perfil de aprendizagem, comunicação e adaptação para definir apoios adequados em cada fase da vida."],
          ["Fisioterapia","Trabalha marcos motores, postura, força, equilíbrio e mobilidade conforme as características individuais."],
          ["Terapia ocupacional","Favorece participação e independência em casa, na escola e na comunidade, com treino e adaptações funcionais."]
        ]
      },
      {
        name:"Ansiedade",
        about:"Ansiedade clínica envolve medo, preocupação ou tensão intensos e persistentes que passam a limitar sono, relacionamentos, estudo, trabalho ou outras atividades.",
        professionals:[
          ["Psicoterapia","Ajuda a reconhecer gatilhos, pensamentos e respostas do corpo e a desenvolver formas mais seguras de enfrentar as situações."],
          ["Psiquiatria","Avalia gravidade e condições associadas e pode indicar e acompanhar medicação quando necessário."],
          ["Acupuntura","Pode entrar como recurso complementar para tensão e bem-estar, sem substituir psicoterapia ou tratamento médico indicado."]
        ]
      },
      {
        name:"Depressão",
        about:"É um transtorno que pode causar tristeza ou vazio persistentes, perda de interesse, alterações de sono e energia e dificuldade para funcionar no dia a dia.",
        professionals:[
          ["Psicoterapia","Trabalha emoções, pensamentos, comportamentos e retomada gradual de vínculos e atividades significativas."],
          ["Psiquiatria","Avalia o quadro, riscos e condições associadas e acompanha o tratamento medicamentoso quando indicado."],
          ["Neuromodulação","Pode ser considerada em situações específicas, após avaliação clínica, como parte de um plano integrado e não como recurso isolado."]
        ]
      },
      {
        name:"Seletividade alimentar",
        about:"É uma restrição importante da variedade de alimentos, que pode envolver sensibilidade a textura, cheiro ou sabor, medo, dificuldade motora ou experiências negativas com a alimentação.",
        professionals:[
          ["Terapia alimentar","Avalia o que mantém a recusa e constrói aproximações graduais com os alimentos, respeitando segurança, ritmo e sinais da pessoa."],
          ["Terapia ocupacional","Trabalha processamento sensorial, postura, utensílios e organização da rotina quando esses fatores dificultam as refeições."]
        ]
      },
      {
        name:"Dificuldade respiratória",
        about:"Falta de ar é um sintoma, não um diagnóstico, e pode ter diferentes causas. Quando aparece de forma súbita, intensa ou com dor no peito, confusão ou lábios arroxeados, exige atendimento de urgência.",
        professionals:[
          ["Fisioterapia respiratória","Após avaliação e liberação adequadas, trabalha padrão respiratório, expansão pulmonar, manejo de secreções e tolerância ao esforço conforme a causa."]
        ]
      },
      {
        name:"Demência",
        about:"É uma síndrome causada por diferentes doenças que comprometem memória, pensamento, comportamento e capacidade de realizar atividades diárias além do esperado no envelhecimento habitual.",
        professionals:[
          ["Neuropsicologia","Caracteriza funções preservadas e comprometidas e propõe estimulação e estratégias para rotina, comunicação e cuidadores."],
          ["Fisioterapia","Mantém mobilidade, força e equilíbrio e atua na prevenção de quedas e complicações da inatividade."],
          ["Nutrição","Monitora peso, hidratação e ingestão e adapta a rotina alimentar às mudanças de apetite, atenção e funcionalidade."]
        ]
      },
      {
        name:"Perda de autonomia",
        about:"Acontece quando tarefas antes simples — banho, alimentação, deslocamento, organização da casa ou trabalho — passam a exigir ajuda por alterações físicas, cognitivas ou emocionais.",
        professionals:[
          ["Terapia ocupacional","Identifica barreiras, treina atividades reais e adapta tarefas, utensílios e ambiente para ampliar independência e segurança."],
          ["Fisioterapia","Trabalha força, equilíbrio, transferências e marcha para tornar deslocamentos e cuidados pessoais mais seguros."]
        ]
      }
    ];

    const specModal = document.getElementById('specModal');
    if(specModal){
      const elTitle=document.getElementById('specTitle');
      const elEyebrow=document.getElementById('specEyebrow');
      const elQuote=document.getElementById('specQuote');
      const elDesc=document.getElementById('specDesc');
      const elExamples=document.getElementById('specExamples');
      const elIntroLabel=document.getElementById('specIntroLabel');
      const elListLabel=document.getElementById('specListLabel');
      const elCta=document.getElementById('specCta');
      let lastFocused=null;

      const showModal=(s, type)=>{
        const isCondition=type==='condition';
        elEyebrow.textContent=isCondition ? 'situação e sintomas' : 'especialidade';
        elTitle.textContent=s.name;
        elQuote.hidden=isCondition;
        elQuote.textContent=isCondition ? '' : s.quote;
        elIntroLabel.textContent=isCondition ? 'O que é' : 'Como ajuda';
        elDesc.textContent=isCondition ? s.about : s.desc;
        elListLabel.textContent=isCondition ? 'Como cada especialista atua' : 'O que inclui';
        elExamples.classList.toggle('professional-list', isCondition);
        elExamples.innerHTML=isCondition
          ? s.professionals.map(([name, role])=>`<li class="professional-item"><strong>${name}</strong><span>${role}</span></li>`).join('')
          : s.examples.map(e=>`<li>${e}</li>`).join('');
        const subject=isCondition ? `a situação "${s.name}"` : `a especialidade "${s.name}"`;
        const msg=encodeURIComponent(`Oi! Vi ${subject} no site da Reability e gostaria de entender qual atendimento faz sentido para o meu caso.`);
        elCta.href=`https://wa.me/5571999703912?text=${msg}`;
        lastFocused=document.activeElement;
        specModal.classList.add('open');
        specModal.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        specModal.querySelector('.spec-dialog').scrollTop=0;
        specModal.querySelector('.spec-close').focus();
      };
      const openCase=(i)=>{
        const s=caseScenarios[i]; if(!s) return;
        showModal(s, 'specialty');
      };
      const openCondition=(i)=>{
        const s=conditionScenarios[i]; if(!s) return;
        showModal(s, 'condition');
      };
      const closeSpec=()=>{
        specModal.classList.remove('open');
        specModal.setAttribute('aria-hidden','true');
        document.body.style.overflow='';
        if(lastFocused) lastFocused.focus();
      };

      document.getElementById('caseList')?.addEventListener('click', e=>{
        const pill=e.target.closest('.service-pill'); if(!pill) return;
        openCase(Number(pill.dataset.case));
      });
      document.getElementById('conditionsGrid')?.addEventListener('click', e=>{
        const condition=e.target.closest('.condition'); if(!condition) return;
        openCondition(Number(condition.dataset.condition));
      });
      specModal.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) closeSpec(); });
      document.addEventListener('keydown', e=>{
        if(!specModal.classList.contains('open')) return;
        if(e.key==='Escape') closeSpec();
        if(e.key==='Tab'){
          const focusable=[...specModal.querySelectorAll('button:not([disabled]), a[href]')];
          const first=focusable[0], last=focusable[focusable.length-1];
          if(e.shiftKey && document.activeElement===first){e.preventDefault(); last.focus();}
          else if(!e.shiftKey && document.activeElement===last){e.preventDefault(); first.focus();}
        }
      });
    }
