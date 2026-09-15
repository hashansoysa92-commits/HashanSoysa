(() => {
  const cfg=window.HASHAN_CMS;if(!cfg)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const one=s=>document.querySelector(s), all=s=>document.querySelectorAll(s);
  const setText=(s,v)=>{const n=one(s);if(n&&v!=null)n.textContent=v};
  const meta=(name,v,prop=false)=>{if(!v)return;let n=document.querySelector(`meta[${prop?'property':'name'}="${name}"]`);if(!n){n=document.createElement('meta');n.setAttribute(prop?'property':'name',name);document.head.append(n)}n.setAttribute('content',v)};

  function normalize(c){
    if(c?.brand) return c;
    return {
      brand:{name:c?.site?.name||'Hashan Soysa',tagline:c?.site?.subheadline||'Creative · Digital · Technical',eyebrow:c?.site?.eyebrow||'Creative Media · Digital · Technical Services'},
      hero:{title:c?.site?.headline||'',lead:c?.site?.subheadline||'',primaryButton:c?.site?.primaryCtaLabel||'Explore Services',secondaryButton:c?.site?.secondaryCtaLabel||'Start a Project'},
      about:{title:c?.site?.aboutTitle||'',paragraph1:c?.site?.about?.[0]||'',paragraph2:c?.site?.about?.[1]||''},
      contact:{heading:c?.contact?.heading||'',text:c?.contact?.text||'',email:c?.contact?.email||'',phone:c?.contact?.phone||'',whatsapp:c?.contact?.whatsapp||'',location:c?.site?.location||''},
      seo:c?.seo||{},theme:{accent:'#d6b56d',background:'#080808',surface:'#111112',text:'#f4efe7'},
      services:(c?.services||[]).map((s,i)=>({number:String(i+1).padStart(2,'0'),title:s.title||'',description:s.description||'',items:s.items||[]}))
    };
  }

  function apply(c){
    c=normalize(c);
    if(c.theme){const r=document.documentElement.style;if(c.theme.background)r.setProperty('--bg',c.theme.background);if(c.theme.surface)r.setProperty('--panel',c.theme.surface);if(c.theme.text)r.setProperty('--text',c.theme.text);if(c.theme.accent){r.setProperty('--gold',c.theme.accent);r.setProperty('--gold-soft',c.theme.accent)}}
    all('.brand-copy strong').forEach(n=>{if(c.brand?.name)n.textContent=c.brand.name});
    all('.brand-copy small').forEach(n=>{if(c.brand?.tagline)n.textContent=c.brand.tagline});
    const eye=one('.hero .eyebrow');if(eye&&c.brand?.eyebrow)eye.innerHTML='<span></span>'+esc(c.brand.eyebrow);
    if(c.hero?.title)setText('.hero h1',c.hero.title); if(c.hero?.lead)setText('.hero-lead',c.hero.lead);
    const heroBtns=document.querySelectorAll('.hero-actions .btn');if(heroBtns[0]&&c.hero?.primaryButton)heroBtns[0].childNodes[0].nodeValue=c.hero.primaryButton+' ';if(heroBtns[1]&&c.hero?.secondaryButton)heroBtns[1].textContent=c.hero.secondaryButton;
    if(c.about?.title)setText('.about-copy h2',c.about.title);const ap=document.querySelectorAll('.about-copy>p');if(ap[0]&&c.about?.paragraph1)ap[0].textContent=c.about.paragraph1;if(ap[1]&&c.about?.paragraph2)ap[1].textContent=c.about.paragraph2;
    if(c.contact?.heading)setText('.contact-card h2',c.contact.heading);const cp=one('.contact-card>div>p:not(.eyebrow)');if(cp&&c.contact?.text)cp.textContent=c.contact.text;
    if(c.services?.length){const host=one('.service-grid');if(host){host.innerHTML='';c.services.forEach((s,i)=>{const a=document.createElement('article');a.className='service-card reveal visible';a.dataset.service=s.number||String(i+1).padStart(2,'0');const items=(s.items||[]).map(x=>`<li>${esc(x)}</li>`).join('');a.innerHTML=`<div class="service-top"><span class="service-no">${esc(s.number||String(i+1).padStart(2,'0'))}</span><span class="service-icon" aria-hidden="true">✦</span></div><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p><details><summary>View all services <span>+</span></summary><ul>${items}</ul></details>`;host.append(a)})}}
    if(c.seo?.title)document.title=c.seo.title;meta('description',c.seo?.description);meta('keywords',c.seo?.keywords);meta('og:title',c.seo?.title,true);meta('og:description',c.seo?.description,true);meta('og:image',c.seo?.ogImage,true);meta('twitter:title',c.seo?.title);meta('twitter:description',c.seo?.description);meta('twitter:image',c.seo?.ogImage);
  }

  fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.table}?id=eq.${encodeURIComponent(cfg.rowId)}&select=content`,{headers:{apikey:cfg.supabaseKey,Authorization:`Bearer ${cfg.supabaseKey}`}}).then(r=>r.ok?r.json():Promise.reject()).then(rows=>{if(rows?.[0]?.content)apply(rows[0].content)}).catch(()=>{});
})();
