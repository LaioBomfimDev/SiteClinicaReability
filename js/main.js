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

    // ===== Hero: campo neural dourado =====
    (function initHeroNeuro(){
      const hero=document.getElementById('hero');
      const canvas=document.getElementById('heroNeuro');
      if(!hero || !canvas || reduceMotion || !window.THREE) return;

      const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(60, 1, .1, 100);
      camera.position.z=8;
      const pointsGeo=new THREE.BufferGeometry();
      const pointsMat=new THREE.PointsMaterial({
        color:0xC9A84C, size:.055, transparent:true, opacity:.85,
        depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
      });
      const points=new THREE.Points(pointsGeo, pointsMat);
      scene.add(points);
      const ico=new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(4.2,1)),
        new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:.15})
      );
      scene.add(ico);
      const icoInner=new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.4,0)),
        new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:.09})
      );
      scene.add(icoInner);

      let raf=null, active=false, tx=0, ty=0, mx=0, my=0;
      const clock=new THREE.Clock();

      function resizeHeroNeuro(){
        const rect=hero.getBoundingClientRect();
        const isMobile=rect.width<700;
        const count=isMobile?460:1200;
        const pos=new Float32Array(count*3);
        for(let i=0;i<count;i++){
          pos[i*3]=(Math.random()-.5)*22;
          pos[i*3+1]=(Math.random()-.5)*16;
          pos[i*3+2]=(Math.random()-.5)*14;
        }
        pointsGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
        pointsMat.size=isMobile?.07:.055;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile?1.5:1.75));
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect=rect.width/Math.max(1, rect.height);
        camera.updateProjectionMatrix();
      }

      function drawHeroNeuro(){
        if(!active){raf=null; return}
        const t=clock.getElapsedTime();
        mx+=(tx-mx)*.04; my+=(ty-my)*.04;
        points.rotation.y=t*.03+mx*.4;
        points.rotation.x=t*.008+my*.25;
        ico.rotation.y=-t*.05+mx*.2;
        ico.rotation.x=t*.02;
        icoInner.rotation.y=t*.04;
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

    const splitObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{ if(entry.isIntersecting) entry.target.classList.add('in')})
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
    ['jornada','direcao','denise','faq','contato'].forEach(id=>{
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
      if(!footer || !canvas || reduceMotion || !window.THREE){
        if(footerGlow) footerGlow.style.display='none';
        return;
      }

      const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
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
        const canScrub = window.gsap && window.ScrollTrigger && !reduceMotion;
        if(canScrub){
          // estado inicial: só o fechado visível, levemente deslocado (parallax)
          gsap.set(open,{opacity:0});
          gsap.set(closed,{opacity:1});
          gsap.set(laptop,{yPercent:6});
          const build=()=>{
            // Sem pin: o notebook abre enquanto sobe pela viewport (seção fica compacta)
            gsap.timeline({
              scrollTrigger:{trigger:laptop, start:'center 76%', end:'center 44%', scrub:1, invalidateOnRefresh:true}
            })
            .to(laptop,{yPercent:0, ease:'none', duration:1}, 0)      // sobe suave enquanto rola
            // cross-dissolve linear simultâneo: soma das opacidades ~1 (sem "dois notebooks", sem sumiço)
            .to(closed,{opacity:0, ease:'none', duration:1}, 0)
            .to(open,{opacity:1, ease:'none', duration:1}, 0);
            // recalcula as posições depois que fontes/imagens acima assentam (senão o trigger fica no lugar errado)
            ScrollTrigger.refresh();
            if(document.readyState!=='complete') window.addEventListener('load', ()=>ScrollTrigger.refresh(), {once:true});
            if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>ScrollTrigger.refresh());
            setTimeout(()=>ScrollTrigger.refresh(), 1600);
          };
          // liga o efeito assim que a imagem aberta estiver pronta (fetchpriority=high garante cedo)
          if(open.complete && open.naturalWidth){ build(); }
          else { open.addEventListener('load', build, {once:true}); open.addEventListener('error', build, {once:true}); }
        }else{
          // sem libs / movimento reduzido: mostra a tela aberta direto
          open.style.opacity='1';
        }
      })();

      if(window.THREE && !reduceMotion) initThree();
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
      const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
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

    // ===== Modal de casos comuns =====
    const caseScenarios = [
      {
        name:"Depois de AVC ou internação",
        quote:"“A alta veio, mas a rotina ainda não voltou.”",
        desc:"Aqui a família quer saber o que é recuperável, o que exige cuidado e por onde começar sem aumentar risco de queda, dor ou frustração. A avaliação observa movimento, cognição, autonomia e segurança.",
        examples:[
          "Pode envolver fisioterapia neurofuncional, terapia ocupacional, neuropsicologia e orientação familiar",
          "O plano começa por metas pequenas: levantar, caminhar, usar as mãos, organizar rotina e prevenir quedas",
          "Quando precisa ser presencial, a equipe explica com clareza; quando pode ser online, também orienta"
        ]
      },
      {
        name:"Memória e atenção falhando",
        quote:"“Não sei se é cansaço, idade, ansiedade ou algo neurológico.”",
        desc:"A ideia é sair da dúvida. A avaliação neuropsicológica mede memória, atenção, linguagem, raciocínio e comportamento para diferenciar sinais esperados de algo que precisa de acompanhamento.",
        examples:[
          "Ajuda quando há esquecimentos, confusão, queda no rendimento ou mudança de comportamento",
          "Pode orientar laudo, escola, trabalho, família e outros profissionais",
          "O resultado vira direção prática, não apenas uma lista de testes"
        ]
      },
      {
        name:"Criança com atraso ou dificuldade",
        quote:"“Algo no desenvolvimento, na escola ou na fala está preocupando.”",
        desc:"A pergunta central é simples: esperar ou investigar? A equipe olha desenvolvimento, aprendizagem, comportamento, autonomia e rotina escolar para orientar a família cedo, sem alarmismo.",
        examples:[
          "Fala, marcha, coordenação, foco, interação, leitura, escrita ou adaptação escolar podem ser avaliados",
          "A família entende quais sinais observar e quais estímulos fazem sentido",
          "Quando necessário, o plano integra neuropsicologia, terapia ocupacional e orientação aos cuidadores"
        ]
      },
      {
        name:"Dor, tensão ou movimento limitado",
        quote:"“A dor prende o corpo e começa a prender a vida.”",
        desc:"O foco é entender se a dor vem de tensão, limitação funcional, sequela neurológica, inflamação ou sobrecarga. A conduta pode combinar cuidado físico, estratégias de rotina e recursos complementares.",
        examples:[
          "Laserterapia pode ser indicada para dor e inflamação; é indolor e não invasiva",
          "Acupuntura pode ajudar em tensão, estresse e dores persistentes quando houver indicação",
          "A meta é voltar a se mover com mais segurança, não apenas “aguentar a dor”"
        ]
      },
      {
        name:"Autonomia ficando difícil",
        quote:"“Coisas simples passaram a exigir ajuda o tempo todo.”",
        desc:"Banho, roupa, alimentação, escola, trabalho e deslocamento mostram onde a vida travou. A avaliação transforma essas dificuldades em prioridades funcionais, com adaptações e treino realista.",
        examples:[
          "Terapia ocupacional ajuda a recuperar independência nas tarefas que importam",
          "Fisioterapia neurofuncional trabalha equilíbrio, força, marcha e controle do movimento",
          "A família recebe orientações para reduzir risco e facilitar a rotina em casa"
        ]
      },
      {
        name:"Tratamento travado",
        quote:"“Já tentei algumas coisas, mas parece que não sai do lugar.”",
        desc:"Antes de trocar tudo, vale entender por que a resposta ficou limitada. Quando há indicação, neuromodulação pode complementar o plano; é não invasiva, indolor e não substitui a avaliação clínica.",
        examples:[
          "Pode apoiar dor crônica, humor, atenção ou reabilitação cognitiva e motora",
          "A indicação depende do histórico, objetivos e segurança do paciente",
          "O WhatsApp ajuda a equipe a dizer se vale marcar uma avaliação para esse recurso"
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
      const elCta=document.getElementById('specCta');
      let lastFocused=null;

      const openCase=(i)=>{
        const s=caseScenarios[i]; if(!s) return;
        elEyebrow.textContent='caso comum';
        elTitle.textContent=s.name;
        elQuote.textContent=s.quote;
        elDesc.textContent=s.desc;
        elExamples.innerHTML=s.examples.map(e=>`<li>${e}</li>`).join('');
        const msg=encodeURIComponent(`Oi! Me identifiquei com este caso: ${s.name}. Gostaria de entender qual avaliação faz sentido na Reability.`);
        elCta.href=`https://wa.me/5571999703912?text=${msg}`;
        lastFocused=document.activeElement;
        specModal.classList.add('open');
        specModal.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        specModal.querySelector('.spec-close').focus();
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
      specModal.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) closeSpec(); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && specModal.classList.contains('open')) closeSpec(); });
    }
