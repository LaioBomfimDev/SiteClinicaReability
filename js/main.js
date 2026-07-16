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
      let particles=[],nodes=[],links=[];
      const rand=()=>{
        seed=(seed*1664525+1013904223)>>>0;
        return seed/4294967296;
      };

      function rebuild(){
        seed=(Math.round(w)*73856093 ^ Math.round(h)*19349663)>>>0;
        const mobile=w<700;
        const fieldCount=mobile?180:420;
        const nodeCount=mobile?68:118;
        particles=Array.from({length:fieldCount},()=>({
          x:rand()*w,
          y:rand()*h,
          r:.45+rand()*1.45,
          a:.08+rand()*.22,
          p:rand()*Math.PI*2,
          z:.35+rand()*1.25
        }));
        nodes=[];
        const cx=w*.5, cy=h*.47;
        const rx=Math.min(w*.26, 280), ry=Math.min(h*.20, 175);
        for(let i=0;i<nodeCount;i++){
          let x=0,y=0;
          do{
            x=rand()*2-1;
            y=rand()*2-1;
          }while(x*x+y*y>1);
          const lobe=(i%2?1:-1)*Math.min(w*.08, 74);
          nodes.push({
            x:cx+lobe+x*rx,
            y:cy+y*ry,
            r:1.4+rand()*2.4,
            p:rand()*Math.PI*2
          });
        }
        links=[];
        const seen=new Set();
        nodes.forEach((node,i)=>{
          const near=nodes.map((other,j)=>({
            j,
            d:(node.x-other.x)*(node.x-other.x)+(node.y-other.y)*(node.y-other.y)
          })).filter(item=>item.j!==i).sort((a,b)=>a.d-b.d);
          near.slice(0,2).forEach(item=>{
            const key=Math.min(i,item.j)+'_'+Math.max(i,item.j);
            if(!seen.has(key) && item.d<Math.pow(Math.min(w,h)*.22,2)){
              seen.add(key);
              links.push([i,item.j]);
            }
          });
        });
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

        ctx.lineWidth=.75;
        links.forEach(([a,b],i)=>{
          const na=nodes[a], nb=nodes[b];
          const pulse=animate ? .5+.5*Math.sin(t*.9+i*.37) : .72;
          ctx.strokeStyle=`rgba(228,210,154,${.10+.12*pulse})`;
          ctx.beginPath();
          ctx.moveTo(na.x+driftX, na.y+driftY);
          ctx.lineTo(nb.x+driftX, nb.y+driftY);
          ctx.stroke();
        });

        nodes.forEach(n=>{
          const pulse=animate ? .75+.25*Math.sin(t*1.1+n.p) : .9;
          glow(n.x+driftX, n.y+driftY, n.r*8, `rgba(255,243,208,${.25*pulse})`);
          ctx.fillStyle=`rgba(255,243,208,${.65*pulse})`;
          ctx.beginPath();
          ctx.arc(n.x+driftX, n.y+driftY, n.r, 0, Math.PI*2);
          ctx.fill();
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

    // ===== Hero: campo neural dourado =====
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

      // sprite radial: transforma os pontos quadrados do PointsMaterial em brilhos redondos
      const spriteCanvas=document.createElement('canvas');
      spriteCanvas.width=spriteCanvas.height=64;
      const sctx=spriteCanvas.getContext('2d');
      const grad=sctx.createRadialGradient(32,32,0,32,32,32);
      grad.addColorStop(0,'rgba(255,255,255,1)');
      grad.addColorStop(.4,'rgba(255,255,255,.5)');
      grad.addColorStop(1,'rgba(255,255,255,0)');
      sctx.fillStyle=grad; sctx.fillRect(0,0,64,64);
      const glowTex=new THREE.CanvasTexture(spriteCanvas);

      const pointsGeo=new THREE.BufferGeometry();
      const pointsMat=new THREE.PointsMaterial({
        color:0xC9A84C, size:.06, map:glowTex, transparent:true, opacity:.75,
        depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
      });
      const points=new THREE.Points(pointsGeo, pointsMat);
      scene.add(points);
      // Rede sináptica: nós em dois lobos elipsoidais, ligados aos vizinhos mais próximos
      const net=new THREE.Group();
      scene.add(net);
      const nodesMat=new THREE.PointsMaterial({
        color:0xE4D29A, size:.2, map:glowTex, transparent:true, opacity:.95,
        depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
      });
      const linksMat=new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:.25, depthWrite:false});
      const pulseMat=new THREE.PointsMaterial({
        color:0xFFF3D0, size:.34, map:glowTex, transparent:true, opacity:.95,
        depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
      });
      let nodePos=null, edges=[], pulses=[], pulseGeo=null, builtNodes=0;

      function buildNetwork(count){
        if(count===builtNodes) return;
        builtNodes=count;
        while(net.children.length){ net.children.pop().geometry.dispose(); }
        nodePos=new Float32Array(count*3);
        for(let i=0;i<count;i++){
          let x,y,z;
          do{ x=Math.random()*2-1; y=Math.random()*2-1; z=Math.random()*2-1; }while(x*x+y*y+z*z>1);
          const lobe=(i%2?1:-1)*1.05;
          nodePos[i*3]=x*2.5+lobe;
          nodePos[i*3+1]=y*1.8;
          nodePos[i*3+2]=z*2.1;
        }
        edges=[];
        const seen=new Set();
        for(let i=0;i<count;i++){
          const near=[];
          for(let j=0;j<count;j++){
            if(j===i) continue;
            const dx=nodePos[i*3]-nodePos[j*3], dy=nodePos[i*3+1]-nodePos[j*3+1], dz=nodePos[i*3+2]-nodePos[j*3+2];
            near.push([dx*dx+dy*dy+dz*dz, j]);
          }
          near.sort((a,b)=>a[0]-b[0]);
          for(let n=0;n<2;n++){
            const j=near[n][1], key=Math.min(i,j)+'_'+Math.max(i,j);
            if(!seen.has(key)){ seen.add(key); edges.push([i,j]); }
          }
        }
        const linePos=new Float32Array(edges.length*6);
        edges.forEach(([a,b],k)=>{
          linePos.set(nodePos.subarray(a*3,a*3+3), k*6);
          linePos.set(nodePos.subarray(b*3,b*3+3), k*6+3);
        });
        const nodesGeo=new THREE.BufferGeometry();
        nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePos,3));
        const linksGeo=new THREE.BufferGeometry();
        linksGeo.setAttribute('position', new THREE.BufferAttribute(linePos,3));
        net.add(new THREE.Points(nodesGeo,nodesMat));
        net.add(new THREE.LineSegments(linksGeo,linksMat));
        // pulsos "sinápticos" viajando pelas conexões
        const pulseCount=count<100?6:10;
        pulses=Array.from({length:pulseCount},()=>({e:(Math.random()*edges.length)|0, t:Math.random(), v:.35+Math.random()*.5}));
        pulseGeo=new THREE.BufferGeometry();
        pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pulseCount*3),3));
        net.add(new THREE.Points(pulseGeo,pulseMat));
      }

      let raf=null, active=false, tx=0, ty=0, mx=0, my=0, lastT=0;
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
        buildNetwork(isMobile?80:140);
        net.scale.setScalar(isMobile?.7:1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile?1.5:1.75));
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect=rect.width/Math.max(1, rect.height);
        camera.updateProjectionMatrix();
      }

      function drawHeroNeuro(){
        if(!active){raf=null; return}
        const t=clock.getElapsedTime();
        const dt=Math.min(t-lastT,.1); lastT=t;
        mx+=(tx-mx)*.04; my+=(ty-my)*.04;
        points.rotation.y=t*.03+mx*.4;
        points.rotation.x=t*.008+my*.25;
        net.rotation.y=t*.06+mx*.4;
        net.rotation.x=Math.sin(t*.12)*.08+my*.25;
        if(pulseGeo){
          const arr=pulseGeo.attributes.position.array;
          pulses.forEach((p,k)=>{
            p.t+=p.v*dt;
            if(p.t>1){ p.t=0; p.e=(Math.random()*edges.length)|0; }
            const a=edges[p.e][0], b=edges[p.e][1];
            arr[k*3]  =nodePos[a*3]  +(nodePos[b*3]  -nodePos[a*3])*p.t;
            arr[k*3+1]=nodePos[a*3+1]+(nodePos[b*3+1]-nodePos[a*3+1])*p.t;
            arr[k*3+2]=nodePos[a*3+2]+(nodePos[b*3+2]-nodePos[a*3+2])*p.t;
          });
          pulseGeo.attributes.position.needsUpdate=true;
        }
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
            // O usuário entra na seção vendo o notebook FECHADO; a abertura só dispara
            // quando o CENTRO do notebook chega perto do centro da viewport, e roda uma
            // única vez com duração própria — visível mesmo em scroll rápido.
            const tl=gsap.timeline({paused:true})
              .to(laptop,{yPercent:0, ease:'power2.out', duration:1.4}, 0)
              // cross-dissolve simultâneo: soma das opacidades ~1 (sem "dois notebooks", sem sumiço)
              .to(closed,{opacity:0, ease:'power1.inOut', duration:1.15}, .12)
              .to(open,{opacity:1, ease:'power1.inOut', duration:1.15}, .12);
            // Mede a posição real a cada scroll (imune ao cálculo de posição do
            // ScrollTrigger, que ficava errado com o splash e disparava cedo demais)
            const check=()=>{
              const r=laptop.getBoundingClientRect();
              if(r.width===0) return;                      // layout ainda não assentou
              const center=r.top + r.height/2;
              if(r.bottom < 0){                            // já passou direto (ex.: reload no meio da página)
                tl.progress(1);
              }else if(center > innerHeight*0.68){         // ainda está na parte de baixo da tela
                return;
              }else{
                tl.play();                                 // chegou à zona central: abre
              }
              window.removeEventListener('scroll', check);
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
        elEyebrow.textContent='especialidade';
        elTitle.textContent=s.name;
        elQuote.textContent=s.quote;
        elDesc.textContent=s.desc;
        elExamples.innerHTML=s.examples.map(e=>`<li>${e}</li>`).join('');
        const msg=encodeURIComponent(`Oi! Vi a especialidade "${s.name}" no site da Reability e gostaria de entender qual atendimento faz sentido para o meu caso.`);
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
