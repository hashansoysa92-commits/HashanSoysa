(() => {
  const cfg = window.HASHAN_CMS;
  const $ = id => document.getElementById(id);
  let editorContent = null;
  const notice = (text, type = '') => { const node = $('saveStatus'); node.textContent = text; node.className = 'status ' + type; };
  const clone = value => JSON.parse(JSON.stringify(value || {}));
  const value = (id, fallback = '') => $(id)?.value?.trim() ?? fallback;

  function makePanel(title, intro = '') {
    const panel = document.createElement('section'); panel.className = 'panel';
    const heading = document.createElement('h2'); heading.textContent = title; panel.append(heading);
    if (intro) { const text = document.createElement('p'); text.className = 'muted panel-intro'; text.textContent = intro; panel.append(text); }
    return panel;
  }
  function addField(parent, { id, label, fieldValue = '', type = 'text', help = '' }) {
    const wrap = document.createElement('div'); wrap.className = 'field';
    const lab = document.createElement('label'); lab.htmlFor = id; lab.textContent = label;
    const input = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    input.id = id; if (type !== 'textarea') input.type = type; input.value = fieldValue || '';
    wrap.append(lab, input);
    if (help) { const hint = document.createElement('small'); hint.textContent = help; wrap.append(hint); }
    parent.append(wrap); return input;
  }
  function addTwoFields(parent, first, second) { const row = document.createElement('div'); row.className = 'field-row'; addField(row, first); addField(row, second); parent.append(row); }
  function serviceEditor(service, index) {
    const details = document.createElement('details'); details.className = 'service'; details.open = index === 0;
    const summary = document.createElement('summary'); summary.textContent = `${service.number || String(index + 1).padStart(2, '0')} — ${service.title || 'New service'}`; details.append(summary);
    const body = document.createElement('div'); body.className = 'service-body';
    addTwoFields(body, { id: `service-number-${index}`, label: 'Service number', fieldValue: service.number || String(index + 1).padStart(2, '0') }, { id: `service-title-${index}`, label: 'Service title', fieldValue: service.title || '' });
    addField(body, { id: `service-description-${index}`, label: 'Short description', fieldValue: service.description || '', type: 'textarea' });
    addField(body, { id: `service-items-${index}`, label: 'Services in this category', fieldValue: (service.items || []).join('\n'), type: 'textarea', help: 'Enter one service per line.' });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'mini danger'; remove.textContent = 'Remove this service';
    remove.addEventListener('click', () => { if (editorContent.services.length <= 1) { notice('At least one service category is required.', 'error'); return; } editorContent = collectContent(); editorContent.services.splice(index, 1); buildEditor(editorContent); notice('Service removed. Click Save Changes to publish.', 'ok'); });
    body.append(remove); details.append(body); return details;
  }
  function buildEditor(content) {
    editorContent = clone(content); const grid = $('editorGrid'); grid.replaceChildren();
    const welcome = makePanel('Edit Your Website', 'Change the text you need, then click Save Changes at the top. Every field is safe to edit.'); welcome.classList.add('full', 'editor-welcome'); grid.append(welcome);
    const brand = makePanel('Brand & Main Introduction');
    addField(brand, { id: 'brand-name', label: 'Your name / brand', fieldValue: content.brand?.name }); addField(brand, { id: 'brand-tagline', label: 'Small tagline', fieldValue: content.brand?.tagline }); addField(brand, { id: 'brand-eyebrow', label: 'Top small heading', fieldValue: content.brand?.eyebrow }); addField(brand, { id: 'hero-title', label: 'Main website heading', fieldValue: content.hero?.title, type: 'textarea' }); addField(brand, { id: 'hero-lead', label: 'Main introduction', fieldValue: content.hero?.lead, type: 'textarea' }); addTwoFields(brand, { id: 'hero-primary', label: 'First button text', fieldValue: content.hero?.primaryButton }, { id: 'hero-secondary', label: 'Second button text', fieldValue: content.hero?.secondaryButton }); grid.append(brand);
    const about = makePanel('About You'); addField(about, { id: 'about-title', label: 'About heading', fieldValue: content.about?.title, type: 'textarea' }); addField(about, { id: 'about-first', label: 'First paragraph', fieldValue: content.about?.paragraph1, type: 'textarea' }); addField(about, { id: 'about-second', label: 'Second paragraph', fieldValue: content.about?.paragraph2, type: 'textarea' }); grid.append(about);
    const servicesIntro = makePanel('Services Section Heading'); addField(servicesIntro, { id: 'services-title', label: 'Services heading', fieldValue: content.servicesIntro?.title, type: 'textarea' }); addField(servicesIntro, { id: 'services-intro', label: 'Services introduction', fieldValue: content.servicesIntro?.text, type: 'textarea' }); grid.append(servicesIntro);
    const services = makePanel('Your Service Categories', 'Open a category to edit its name, description and the services listed inside it.'); services.classList.add('full'); const serviceList = document.createElement('div'); serviceList.id = 'serviceList'; (content.services || []).forEach((service, index) => serviceList.append(serviceEditor(service, index)));
    const addService = document.createElement('button'); addService.type = 'button'; addService.className = 'btn'; addService.textContent = '+ Add a service category'; addService.addEventListener('click', () => { editorContent = collectContent(); editorContent.services.push({ number: String(editorContent.services.length + 1).padStart(2, '0'), title: 'New Service Category', description: 'Describe this service category here.', items: ['New service'] }); buildEditor(editorContent); notice('New service category added. Open it below and edit the details.', 'ok'); }); services.append(serviceList, addService); grid.append(services);
    const contact = makePanel('Contact & Project Section'); addField(contact, { id: 'contact-eyebrow', label: 'Small contact heading', fieldValue: content.contact?.eyebrow }); addField(contact, { id: 'contact-heading', label: 'Contact heading', fieldValue: content.contact?.heading, type: 'textarea' }); addField(contact, { id: 'contact-text', label: 'Contact introduction', fieldValue: content.contact?.text, type: 'textarea' }); addField(contact, { id: 'contact-github', label: 'Main button link', fieldValue: content.contact?.github, type: 'url', help: 'Example: https://github.com/yourname' }); grid.append(contact);
    const seo = makePanel('Google & Social Media SEO'); addField(seo, { id: 'seo-title', label: 'Google page title', fieldValue: content.seo?.title }); addField(seo, { id: 'seo-description', label: 'Google description', fieldValue: content.seo?.description, type: 'textarea' }); addField(seo, { id: 'seo-keywords', label: 'Keywords', fieldValue: content.seo?.keywords, type: 'textarea', help: 'Separate keywords with commas.' }); addField(seo, { id: 'seo-image', label: 'Social sharing image URL', fieldValue: content.seo?.ogImage, type: 'url' }); grid.append(seo);
    const style = makePanel('Website Colours'); addTwoFields(style, { id: 'theme-background', label: 'Background colour', fieldValue: content.theme?.background, type: 'color' }, { id: 'theme-surface', label: 'Panel colour', fieldValue: content.theme?.surface, type: 'color' }); addTwoFields(style, { id: 'theme-text', label: 'Text colour', fieldValue: content.theme?.text, type: 'color' }, { id: 'theme-accent', label: 'Accent / gold colour', fieldValue: content.theme?.accent, type: 'color' }); grid.append(style);
  }
  function collectContent() {
    const base = clone(editorContent);
    base.brand = { ...(base.brand || {}), name: value('brand-name'), tagline: value('brand-tagline'), eyebrow: value('brand-eyebrow') };
    base.hero = { ...(base.hero || {}), title: value('hero-title'), lead: value('hero-lead'), primaryButton: value('hero-primary'), secondaryButton: value('hero-secondary') };
    base.about = { ...(base.about || {}), title: value('about-title'), paragraph1: value('about-first'), paragraph2: value('about-second') };
    base.servicesIntro = { ...(base.servicesIntro || {}), title: value('services-title'), text: value('services-intro') };
    base.services = (base.services || []).map((service, index) => ({ ...service, number: value(`service-number-${index}`, String(index + 1).padStart(2, '0')), title: value(`service-title-${index}`), description: value(`service-description-${index}`), items: value(`service-items-${index}`).split('\n').map(item => item.trim()).filter(Boolean) }));
    base.contact = { ...(base.contact || {}), eyebrow: value('contact-eyebrow'), heading: value('contact-heading'), text: value('contact-text'), github: value('contact-github') };
    base.seo = { ...(base.seo || {}), title: value('seo-title'), description: value('seo-description'), keywords: value('seo-keywords'), ogImage: value('seo-image') };
    base.theme = { ...(base.theme || {}), background: value('theme-background'), surface: value('theme-surface'), text: value('theme-text'), accent: value('theme-accent') }; return base;
  }
  function validateContent(content) { if (!content.brand?.name || !content.hero?.title) return 'Enter your brand name and main website heading.'; if (!Array.isArray(content.services) || !content.services.length) return 'Add at least one service category.'; for (const [index, service] of content.services.entries()) if (!service.title || !service.description || !service.items.length) return `Complete the name, description and list for service category ${index + 1}.`; return ''; }
  async function currentTemplate() { const response = await fetch('content-default.json', { cache: 'no-store' }); return response.json(); }
  async function load() { const db = window.hashanAdminClient; if (!db) return; notice('Loading your website content…'); const { data, error } = await db.from(cfg.table).select('content').eq('id', cfg.rowId).maybeSingle(); if (error) { notice(error.message, 'error'); return; } let content = data?.content || {}; if (!content.brand || Number(content?.meta?.schemaVersion || 0) < 3) { content = await currentTemplate(); notice('Your current website content is ready. Click Save Changes once to activate editing.', 'ok'); } else notice('Your saved website content is ready to edit.', 'ok'); buildEditor(content); }
  async function save() { const db = window.hashanAdminClient; if (!db || !editorContent) return; const content = collectContent(); const validationError = validateContent(content); if (validationError) { notice(validationError, 'error'); return; } content.meta = { ...(content.meta || {}), schemaVersion: 3, contentSource: 'Supabase CMS', lastUpdated: new Date().toISOString() }; $('saveBtn').disabled = true; notice('Saving your changes…'); const { data, error } = await db.from(cfg.table).upsert({ id: cfg.rowId, content, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('id'); $('saveBtn').disabled = false; if (error) notice(error.message, 'error'); else if (!data?.length) notice('Nothing was saved. Please sign in again and retry.', 'error'); else { editorContent = content; notice('Saved successfully. Refresh the public website to see your changes.', 'ok'); } }
  window.addEventListener('hashan-admin-ready', load); $('reloadBtn').onclick = load; $('saveBtn').onclick = save;
})();
