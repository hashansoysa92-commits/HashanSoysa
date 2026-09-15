(() => {
  const cfg=window.HASHAN_CMS;
  const $=id=>document.getElementById(id);
  const notice=(text,type='')=>{const n=$('saveStatus');n.textContent=text;n.className='status '+type;};

  function buildEditor(content){
    $('editorGrid').innerHTML='<div class="panel full"><h2>Complete Website Content</h2><p class="muted">Edit any text, service, contact detail, SEO value or theme setting below. This editor controls the full CMS JSON used by the public site.</p><div class="field"><textarea id="contentJson" class="json"></textarea></div><div class="actions"><button id="formatBtn" class="btn">Validate & Format</button><button id="defaultBtn" class="btn">Load Current Website Template</button><a class="btn" href="./" target="_blank">Preview Website</a></div></div>';
    $('contentJson').value=JSON.stringify(content||{},null,2);
    $('formatBtn').onclick=()=>{try{$('contentJson').value=JSON.stringify(JSON.parse($('contentJson').value),null,2);notice('JSON is valid.','ok')}catch(e){notice('Invalid JSON: '+e.message,'error')}};
    $('defaultBtn').onclick=async()=>{const r=await fetch('content-default.json',{cache:'no-store'});const c=await r.json();$('contentJson').value=JSON.stringify(c,null,2);notice('Current website template loaded. Click Save Changes to publish it to the CMS.','ok');};
  }

  async function currentTemplate(){const r=await fetch('content-default.json',{cache:'no-store'});return r.json();}

  async function load(){
    const db=window.hashanAdminClient;if(!db)return;
    notice('Loading content…');
    const {data,error}=await db.from(cfg.table).select('content').eq('id',cfg.rowId).maybeSingle();
    if(error){notice(error.message,'error');return;}
    let content=data?.content||{};
    if(!content.brand || Number(content?.meta?.schemaVersion||0)<3){content=await currentTemplate();notice('Current website template loaded. Save once to activate the new CMS schema.','ok');}
    else notice('Content loaded.','ok');
    buildEditor(content);
  }

  async function save(){
    const db=window.hashanAdminClient;if(!db)return;
    let content;try{content=JSON.parse($('contentJson').value)}catch(e){notice('Invalid JSON: '+e.message,'error');return;}
    content.meta={...(content.meta||{}),schemaVersion:3,contentSource:'Supabase CMS',lastUpdated:new Date().toISOString()};
    $('saveBtn').disabled=true;notice('Saving…');
    const {data,error}=await db.from(cfg.table).update({content,updated_at:new Date().toISOString()}).eq('id',cfg.rowId).select('id');
    $('saveBtn').disabled=false;
    if(error)notice(error.message,'error');else if(!data?.length)notice('No CMS row was updated. Check database permissions.','error');else notice('Saved successfully. Refresh the public site to see the changes.','ok');
  }

  window.addEventListener('hashan-admin-ready',load);
  $('reloadBtn').onclick=load;$('saveBtn').onclick=save;
})();
