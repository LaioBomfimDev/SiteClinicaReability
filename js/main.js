const careSignals = [
      ["Depois de AVC, queda, cirurgia ou internação","Fraqueza, desequilíbrio, dor, cansaço, dificuldade para andar, usar as mãos ou voltar às atividades de antes.","Porque a recuperação precisa de metas claras, ritmo seguro e acompanhamento do que ainda limita a rotina.","Avalia função, autonomia e riscos para orientar um plano possível de reabilitação."],
      ["Memória, atenção ou comportamento mudaram","Esquecimentos frequentes, desorganização, irritabilidade, queda no rendimento, confusão ou dificuldade para manter conversas e tarefas.","Porque nem toda mudança é 'normal' ou passageira; entender o perfil ajuda a decidir o próximo passo.","Investiga cognição, emoções e rotina para dar clareza clínica à família e ao paciente."],
      ["Desenvolvimento infantil que preocupa","Atrasos em fala, marcha, coordenação, aprendizagem, interação, autonomia ou adaptação à escola e às tarefas do dia a dia.","Porque observar cedo permite orientar a família e criar estratégias antes que a dificuldade cresça.","Mapeia sinais do desenvolvimento e organiza as dúvidas em um plano de cuidado acompanhado."],
      ["Dor, tensão ou movimento limitado","Dor persistente, rigidez, formigamento, perda de força, medo de se movimentar ou dificuldade para executar movimentos simples.","Porque o corpo evita o que dói, e isso pode reduzir independência, sono, humor e participação.","Identifica limites funcionais e combina cuidado terapêutico com metas de retorno à rotina."],
      ["Ansiedade, humor ou sobrecarga familiar","Choro frequente, isolamento, crises, medo, irritação, exaustão de cuidadores ou sensação de que a família perdeu o eixo.","Porque reabilitação também envolve saúde mental, vínculo, rotina e sustentação emocional.","Inclui escuta clínica, orientação familiar e encaminhamento conforme a necessidade."],
      ["Autonomia ficou mais difícil","Tomar banho, vestir-se, estudar, trabalhar, comer, sair de casa ou organizar o dia passou a exigir muito mais ajuda.","Porque independência não é tudo ou nada; pequenos ajustes podem devolver participação e segurança.","Define prioridades reais e acompanha ganhos funcionais no cotidiano do paciente."]
    ];
    const accordion = document.getElementById('accordion');
    careSignals.forEach((s,i)=>{
      const item=document.createElement('div'); item.className='acc-item';
      item.innerHTML=`<button class="acc-head" aria-expanded="false"><span class="acc-icon">${String(i+1).padStart(2,'0')}</span><strong>${s[0]}</strong><span>+</span></button>
        <div class="acc-content"><div class="acc-content-inner">
          <div class="acc-box"><h4>O que pode aparecer</h4><p>${s[1]}</p></div>
          <div class="acc-box"><h4>Por que avaliar</h4><p>${s[2]}</p></div>
          <div class="acc-box"><h4>Como a Reability ajuda</h4><p>${s[3]}</p></div>
        </div></div>`;
      accordion.appendChild(item);
    });
    accordion.addEventListener('click', e=>{
      const head=e.target.closest('.acc-head'); if(!head) return;
      const item=head.parentElement, content=item.querySelector('.acc-content');
      const active=item.classList.contains('active');
      document.querySelectorAll('.acc-item').forEach(it=>{
        it.classList.remove('active'); it.querySelector('.acc-head').setAttribute('aria-expanded','false');
        it.querySelector('.acc-content').style.height='0px'; it.querySelector('.acc-content').style.opacity='0';
      });
      if(!active){
        item.classList.add('active'); head.setAttribute('aria-expanded','true');
        content.style.height=content.scrollHeight+'px'; content.style.opacity='1';
      }
    });
    document.querySelector('.acc-head')?.click();

    // ===== Fundadora: "ler mais" (recolhe via JS; sem JS, fica tudo aberto) =====
    const founderToggle=document.getElementById('founderToggle');
    if(founderToggle){
      const founderSec=document.getElementById('denise');
      const founderMore=document.getElementById('founderMore');
      const updateFounderClip=()=>{
        const secondParagraph=founderMore?.querySelector('p:nth-of-type(2)');
        if(!founderMore || !secondParagraph) return;
        const moreTop=founderMore.getBoundingClientRect().top;
        const secondTop=secondParagraph.getBoundingClientRect().top - moreTop;
        const styles=getComputedStyle(secondParagraph);
        const lineHeight=parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.75;
        founderSec.style.setProperty('--founder-fade-start', `${Math.max(0, Math.round(secondTop - 2))}px`);
        founderSec.style.setProperty('--founder-collapsed-height', `${Math.round(secondTop + lineHeight * 1.08)}px`);
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

    // ===== Hero: Vanta Clouds experimental =====
    function initHeroClouds(){
      const el=document.getElementById('heroClouds');
      if(!el || reduceMotion || !window.VANTA || !window.VANTA.CLOUDS) return;
      el.__vantaEffect=window.VANTA.CLOUDS({
        el,
        mouseControls:true,
        touchControls:true,
        gyroControls:false,
        minHeight:200,
        minWidth:200,
        backgroundColor:0xffffff,
        skyColor:0x68b8d7,
        cloudColor:0xadc1de,
        cloudShadowColor:0x183550,
        sunColor:0xff9919,
        sunGlareColor:0xff6633,
        sunlightColor:0xff9933,
        speed:1
      });
    }
    initHeroClouds();

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
    ['jornada','sinais','denise','faq','contato'].forEach(id=>{
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
        if(!laptop || !open) return;
        const canScrub = window.gsap && window.ScrollTrigger && !reduceMotion;
        if(canScrub){
          // estado inicial: notebook fechado, levemente deslocado (parallax)
          gsap.set(open,{opacity:0});
          gsap.set(laptop,{yPercent:7});
          gsap.timeline({
            scrollTrigger:{trigger:stage, start:'top top', end:'+=140%', pin:true, anticipatePin:1, scrub:1}
          })
          .to(laptop,{yPercent:0, ease:'none', duration:1}, 0)   // sobe suave enquanto rola
          .to(open,{opacity:1, ease:'none', duration:.8}, 0);     // crossfade fechado -> aberto (fim)
          ScrollTrigger.refresh();
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

    // ===== Modal de especialidades =====
    const specs = [
      {
        name:"Avaliação Neuropsicológica",
        quote:"“Esqueço nomes, perco o fio da conversa… será cansaço ou tem algo a mais?”",
        desc:"É um mapeamento detalhado de memória, atenção, linguagem, raciocínio e comportamento. Em vez de adivinhar, a avaliação descreve o que está acontecendo e orienta o próximo passo para crianças, adultos ou idosos.",
        examples:[
          "Suspeita de TDAH, dislexia ou dificuldade de aprendizagem na escola",
          "Mudanças de memória e atenção após AVC, TCE ou com o envelhecimento",
          "Necessidade de um laudo para orientar escola, trabalho ou tratamento"
        ]
      },
      {
        name:"Reabilitação Neurológica",
        quote:"“Depois do AVC, atividades simples viraram um desafio. Dá pra recuperar?”",
        desc:"Um plano de recuperação para quem teve o cérebro ou o sistema nervoso afetados. O foco é reconquistar movimento, autonomia e segurança, com metas realistas e acompanhamento de cada ganho.",
        examples:[
          "Recuperação após AVC, traumatismo craniano ou cirurgia neurológica",
          "Convivência com Parkinson, esclerose múltipla ou sequelas de paralisia",
          "Reaprender a andar, falar, usar as mãos e voltar à rotina"
        ]
      },
      {
        name:"Psicoterapia",
        quote:"“Não está fácil. Eu queria um espaço pra organizar o que estou sentindo.”",
        desc:"Um espaço de escuta clínica para entender emoções, vínculos e padrões de comportamento. O acompanhamento ajuda a nomear dificuldades e construir estratégias para lidar com a rotina.",
        examples:[
          "Ansiedade, tristeza persistente, luto ou momentos de crise",
          "Sobrecarga de quem cuida de alguém da família",
          "Vontade de se entender melhor e decidir com mais clareza"
        ]
      },
      {
        name:"Psiquiatria",
        quote:"“Já tentei de tudo, mas sinto que preciso de um acompanhamento mais de perto.”",
        desc:"O cuidado médico da saúde mental. O psiquiatra avalia, diagnostica e, quando necessário, ajusta a medicação com acompanhamento próximo e conduta individualizada.",
        examples:[
          "Depressão, ansiedade, transtorno bipolar ou insônia",
          "Revisão de uma medicação que não está fazendo efeito",
          "Quadros que misturam sintomas emocionais e neurológicos"
        ]
      },
      {
        name:"Fisioterapia Neurofuncional",
        quote:"“Meu corpo não responde como antes, falta força, equilíbrio e segurança.”",
        desc:"Fisioterapia especializada no sistema nervoso. Trabalha movimento, força, equilíbrio e coordenação para devolver autonomia ao corpo, passo a passo e dentro do que é possível para você.",
        examples:[
          "Dificuldade para caminhar, se equilibrar ou controlar movimentos",
          "Recuperação de força após AVC, lesão medular ou neurológica",
          "Crianças com atraso motor ou alterações no desenvolvimento"
        ]
      },
      {
        name:"Terapia Ocupacional",
        quote:"“As tarefas do dia a dia ficaram difíceis e eu dependo de ajuda pra quase tudo.”",
        desc:"Ajuda a reconquistar independência nas atividades que importam, do banho ao trabalho, da escola ao brincar. Também orienta adaptações de tarefas e ambientes.",
        examples:[
          "Voltar a se vestir, cozinhar, estudar ou trabalhar com autonomia",
          "Crianças com dificuldade de coordenação, foco ou independência",
          "Adaptações em casa e estratégias práticas para o cotidiano"
        ]
      },
      {
        name:"Nutrição",
        quote:"“Será que o que eu como ajuda ou atrapalha a minha recuperação?”",
        desc:"Alimentação pensada para apoiar o cérebro, o corpo e o tratamento. Nada de dieta genérica: um plano possível, ajustado à sua rotina, às suas metas e ao seu momento.",
        examples:[
          "Nutrição que apoia memória, energia e recuperação neurológica",
          "Dificuldades de mastigação, deglutição ou seletividade alimentar",
          "Reeducação alimentar com acompanhamento próximo"
        ]
      },
      {
        name:"Acupuntura",
        quote:"“A dor e a tensão não passam, e eu queria um alívio que não seja só remédio.”",
        desc:"Técnica que estimula pontos do corpo para auxiliar no controle de dor, tensão e estresse. Pode compor o plano terapêutico quando houver indicação.",
        examples:[
          "Dores crônicas, tensão muscular e enxaquecas",
          "Ansiedade, insônia e estresse do dia a dia",
          "Apoio complementar dentro do plano de reabilitação"
        ]
      },
      {
        name:"Laserterapia",
        quote:"“Queria acelerar a recuperação e sentir menos dor no processo.”",
        desc:"Uso de laser de baixa intensidade para reduzir dor, inflamação e acelerar a recuperação dos tecidos. Indolor e não invasivo, soma-se às outras terapias do seu plano.",
        examples:[
          "Dor e inflamação em músculos, articulações ou nervos",
          "Recuperação mais rápida após lesões ou cirurgias",
          "Complemento à fisioterapia e à reabilitação"
        ]
      },
      {
        name:"Neuromodulação",
        quote:"“Existe algo que ajude meu cérebro a funcionar melhor sem ser só medicação?”",
        desc:"Técnicas que estimulam o cérebro de forma segura para trabalhar funções como atenção, humor e movimento. Podem complementar terapias e acompanhamento médico quando indicadas.",
        examples:[
          "Apoio em quadros de depressão, ansiedade ou dor crônica",
          "Reabilitação cognitiva e motora após lesões neurológicas",
          "Complemento atual às terapias e ao acompanhamento clínico"
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

      const openSpec=(i)=>{
        const s=specs[i]; if(!s) return;
        elEyebrow.textContent='especialidade';
        elTitle.textContent=s.name;
        elQuote.textContent=s.quote;
        elDesc.textContent=s.desc;
        elExamples.innerHTML=s.examples.map(e=>`<li>${e}</li>`).join('');
        const msg=encodeURIComponent(`Oi! Gostaria de saber mais sobre ${s.name} na Reability.`);
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

      document.getElementById('services')?.addEventListener('click', e=>{
        const pill=e.target.closest('.service-pill'); if(!pill) return;
        openSpec(Number(pill.dataset.spec));
      });
      specModal.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) closeSpec(); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && specModal.classList.contains('open')) closeSpec(); });
    }
