(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    menuButton.classList.toggle('active', !open);
    nav?.classList.toggle('open', !open);
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open menu');
    menuButton?.classList.remove('active');
    nav?.classList.remove('open');
  }));

  document.getElementById('year').textContent = new Date().getFullYear();

  const dustBreeze = document.querySelector('.gold-dust-breeze');
  if (dustBreeze && !reducedMotion) {
    const random = (min, max) => min + Math.random() * (max - min);
    const seedDust = (grain, initial = false) => {
      const angle = random(0, Math.PI * 2);
      const distance = random(90, 300);
      grain.style.setProperty('--dust-left', `${random(-8, 108).toFixed(1)}vw`);
      grain.style.setProperty('--dust-top', `${random(-5, 105).toFixed(1)}vh`);
      grain.style.setProperty('--dust-x', `${(Math.cos(angle) * distance).toFixed(0)}px`);
      grain.style.setProperty('--dust-y', `${(Math.sin(angle) * distance * .55).toFixed(0)}px`);
      grain.style.setProperty('--dust-size', `${random(2, 6.5).toFixed(1)}px`);
      grain.style.setProperty('--dust-opacity', random(.14, .46).toFixed(2));
      grain.style.setProperty('--dust-duration', `${random(8, 18).toFixed(2)}s`);
      if (initial) grain.style.setProperty('--dust-delay', `${random(-18, 0).toFixed(2)}s`);
    };
    const count = window.matchMedia('(max-width: 560px)').matches ? 18 : 34;
    for (let index = 0; index < count; index += 1) {
      const grain = document.createElement('span');
      seedDust(grain, true);
      grain.addEventListener('animationiteration', () => seedDust(grain));
      dustBreeze.append(grain);
    }
  }


  if (!reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    document.querySelectorAll('.reveal').forEach((el, index) => {
      el.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
      observer.observe(el);
    });

    const card = document.querySelector('.tilt-card');
    const heroArt = document.querySelector('.hero-art');
    if (card && heroArt && window.matchMedia('(pointer:fine)').matches) {
      heroArt.addEventListener('pointermove', (event) => {
        const rect = heroArt.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * -8}deg) translate3d(0,0,0)`;
      });
      heroArt.addEventListener('pointerleave', () => { card.style.transform = ''; });
    }

    document.querySelectorAll('.magnetic').forEach(button => {
      if (!window.matchMedia('(pointer:fine)').matches) return;
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });

    // Smoothly slow the hero motion while it is being inspected, then resume
    // from the same position when the pointer leaves.
    const heroMotion = document.querySelector('.hero-art');
    if (heroMotion) {
      heroMotion.querySelectorAll('.orbit-glyph').forEach((glyph, index) => {
        const random = (min, max) => min + Math.random() * (max - min);
        const direction = Math.random() > .5 ? 1 : -1;
        glyph.style.setProperty('--glyph-x', `${random(-5, 5).toFixed(1)}px`);
        glyph.style.setProperty('--glyph-y', `${random(-5, 5).toFixed(1)}px`);
        glyph.style.setProperty('--glyph-rotate', `${Math.round(random(55, 210) * direction)}deg`);
        glyph.style.setProperty('--glyph-scale', random(1.04, 1.16).toFixed(2));
        glyph.style.setProperty('--glyph-duration', `${random(2.4, 5.8).toFixed(2)}s`);
        glyph.style.setProperty('--glyph-delay', `${(-index * random(.14, .5)).toFixed(2)}s`);
      });
      if (window.matchMedia('(pointer:fine)').matches) {
      let motionFrame = 0;
      const animateMotion = paused => {
        cancelAnimationFrame(motionFrame);
        const animations = heroMotion.getAnimations({ subtree: true });
        if (!animations.length) return;
        if (!paused) animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
        const start = performance.now();
        const from = paused ? 1 : 0.02;
        const to = paused ? 0 : 1;
        const duration = paused ? 520 : 420;
        animations.forEach(animation => { animation.playbackRate = from; });
        const step = now => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = progress * (2 - progress);
          animations.forEach(animation => { animation.playbackRate = from + (to - from) * eased; });
          if (progress < 1) motionFrame = requestAnimationFrame(step);
          else if (paused) animations.forEach(animation => animation.pause());
        };
        motionFrame = requestAnimationFrame(step);
      };
      heroMotion.addEventListener('pointerenter', () => animateMotion(true));
      heroMotion.addEventListener('pointerleave', () => animateMotion(false));
      }
    }
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  const loadScript = src => new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
  loadScript('assets/supabase-config.js?v=20260926.3').then(()=>loadScript('assets/cms.js?v=20260926.3')).catch(()=>{});

  // Editorial intro and right-side reading progress.
  if (!reducedMotion) {
    const curtain = document.createElement('div');
    curtain.className = 'motion-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<span>HS</span>';
    document.body.prepend(curtain);
    requestAnimationFrame(() => setTimeout(() => curtain.classList.add('done'), 420));

    const index = document.createElement('div');
    index.className = 'scroll-index';
    index.setAttribute('aria-hidden', 'true');
    index.innerHTML = '<span></span><b>SCROLL</b>';
    document.body.append(index);
    const updateProgress = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const value = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      index.style.setProperty('--scroll-progress', `${value * .42}%`);
      index.querySelector('b').textContent = String(Math.round(value)).padStart(2, '0');
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, {passive:true});
  }

  // CMS can replace content after initial load; make newly-rendered reveal blocks observable too.
  if (!reducedMotion) {
    const revealFresh = () => document.querySelectorAll('.reveal:not(.visible)').forEach((el, index) => {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 1.08) {
        el.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
        requestAnimationFrame(() => el.classList.add('visible'));
      }
    });
    setTimeout(revealFresh, 900);
    const contentHost = document.querySelector('main');
    contentHost && new MutationObserver(() => requestAnimationFrame(revealFresh))
      .observe(contentHost, {childList:true, subtree:true});
    window.addEventListener('scroll', revealFresh, {passive:true});
  }

  // Scroll scenes: maintain the reference site's paced, editorial movement without a heavy animation library.
  if (!reducedMotion) {
    const sceneTargets = [
      ['about', '01'], ['services', '02'], ['packages', '03'],
      ['expertise', '04'], ['media', '05'], ['contact', '06']
    ].map(([id, label]) => {
      const node = document.getElementById(id);
      if (!node) return null;
      node.classList.add('scene-section');
      node.dataset.scene = label;
      return node;
    }).filter(Boolean);

    let sceneFrame = 0;
    const renderScenes = () => {
      sceneFrame = 0;
      const center = window.innerHeight * .54;
      sceneTargets.forEach(section => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * .42 - center);
        const range = Math.max(window.innerHeight * .78, rect.height * .52);
        const p = Math.max(0, Math.min(1, 1 - distance / range));
        section.style.setProperty('--scene-p', p.toFixed(3));
        section.style.setProperty('--scene-y', `${((1 - p) * 52).toFixed(1)}px`);
        section.style.setProperty('--scene-scale', (0.958 + p * .042).toFixed(3));
        section.classList.toggle('scene-current', p > .54);
      });
    };
    const queueScenes = () => { if (!sceneFrame) sceneFrame = requestAnimationFrame(renderScenes); };
    renderScenes();
    window.addEventListener('scroll', queueScenes, {passive:true});
    window.addEventListener('resize', queueScenes, {passive:true});
    new MutationObserver(queueScenes).observe(document.querySelector('main'), {childList:true, subtree:true});
  }

  // Rebind scroll scenes after CMS replaces live content.
  if (!reducedMotion) {
    const sceneIds = [['about','01'],['services','02'],['packages','03'],['expertise','04'],['media','05'],['contact','06']];
    const applySceneBindings = () => sceneIds.forEach(([id,label]) => {
      const node = document.getElementById(id);
      if (node) { node.classList.add('scene-section'); node.dataset.scene = label; }
    });
    applySceneBindings();
    setTimeout(applySceneBindings, 1200);
    const mainNode = document.querySelector('main');
    mainNode && new MutationObserver(() => {
      requestAnimationFrame(() => { applySceneBindings(); window.dispatchEvent(new Event('scroll')); });
    }).observe(mainNode,{childList:true,subtree:true});
  }

  // Motion replays smoothly in both directions as elements enter and leave the viewport.
  if (!reducedMotion) {
    const syncMotionTargets = () => {
      const selectors = '.section-head,.split-grid,.expertise-grid,.contact-card,.service-card,.package-card,.media-card,.process-item';
      document.querySelectorAll(selectors).forEach((node, index) => {
        if (!node.classList.contains('motion-flow')) {
          node.classList.add('motion-flow');
          node.style.setProperty('--motion-delay', `${Math.min((index % 5) * 55, 220)}ms`);
        }
      });
    };
    const bidirectionalObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('motion-in', entry.isIntersecting));
    }, {threshold:.12,rootMargin:'0px 0px -7% 0px'});
    const observeMotion = () => document.querySelectorAll('.motion-flow').forEach(node => bidirectionalObserver.observe(node));
    syncMotionTargets(); observeMotion();
    const mainContent = document.querySelector('main');
    mainContent && new MutationObserver(() => requestAnimationFrame(() => { syncMotionTargets(); observeMotion(); }))
      .observe(mainContent,{childList:true,subtree:true});
  }

  // Core-service details are presented in a dedicated dialog rather than expanding the card.
  let serviceDialog;
  const ensureServiceDialog = () => {
    if (serviceDialog?.isConnected) return serviceDialog;
    serviceDialog = document.createElement('dialog');
    serviceDialog.className = 'service-dialog';
    serviceDialog.setAttribute('aria-label', 'Service details');
    serviceDialog.innerHTML = '<div class="service-dialog-inner"><aside class="service-dialog-side"><span class="service-dialog-no"></span><p>Core services<br>Hashan Soysa</p></aside><section class="service-dialog-main"><button class="service-dialog-close" type="button" aria-label="Close service details">×</button><h2></h2><p></p><ul class="service-dialog-list"></ul></section></div>';
    serviceDialog.addEventListener('click', event => { if (event.target === serviceDialog) serviceDialog.close(); });
    serviceDialog.querySelector('.service-dialog-close').addEventListener('click', () => serviceDialog.close());
    document.body.append(serviceDialog);
    return serviceDialog;
  };
  document.addEventListener('click', event => {
    const summary = event.target.closest('.service-card summary');
    if (!summary) return;
    event.preventDefault();
    const card = summary.closest('.service-card');
    const dialog = ensureServiceDialog();
    const number = card.querySelector('.service-no')?.textContent.trim() || '';
    const title = card.querySelector('h3')?.textContent.trim() || 'Service details';
    const description = card.querySelector(':scope > p')?.textContent.trim() || '';
    dialog.querySelector('.service-dialog-no').textContent = number.padStart(2, '0');
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('.service-dialog-main > p').textContent = description;
    const list = dialog.querySelector('.service-dialog-list');
    list.replaceChildren(...Array.from(card.querySelectorAll('details li')).map(item => {
      const entry = document.createElement('li'); entry.textContent = item.textContent.trim(); return entry;
    }));
    if (!dialog.open) dialog.showModal();
  });
  document.addEventListener('click', event => {
    const target = event.target.closest('a,button');
    if (!target || target.closest('.service-dialog')) return;
    target.classList.remove('tap-feedback');
    requestAnimationFrame(() => target.classList.add('tap-feedback'));
  });

})();
