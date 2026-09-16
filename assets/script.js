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
  loadScript('assets/supabase-config.js?v=20260916.12').then(()=>loadScript('assets/cms.js?v=20260916.12')).catch(()=>{});
})();
