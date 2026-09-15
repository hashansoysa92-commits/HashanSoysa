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

  // Keep the hero service chips moving around the monogram while their icon
  // and label rotate through the main service disciplines.
  if (!reducedMotion) {
    const chips = [...document.querySelectorAll('.orbit-label')];
    const highlights = [
      ['◉', 'Photography'], ['◇', 'Video Editing'], ['↗', 'Digital Marketing'],
      ['⌘', 'Web Development'], ['≋', 'Audio & Live Sound'], ['✦', 'Training']
    ];
    let highlightIndex = 0;
    const refreshHighlights = () => chips.forEach((chip, offset) => {
      const current = highlights[(highlightIndex + offset * 2) % highlights.length];
      const icon = chip.querySelector('.orbit-label-icon');
      const text = chip.querySelector('.orbit-label-text');
      if (icon) icon.textContent = current[0];
      if (text) text.textContent = current[1];
    });
    refreshHighlights();
    window.setInterval(() => { highlightIndex = (highlightIndex + 1) % highlights.length; refreshHighlights(); }, 3200);
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
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  const loadScript = src => new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
  loadScript('assets/supabase-config.js').then(()=>loadScript('assets/cms.js')).catch(()=>{});
})();
