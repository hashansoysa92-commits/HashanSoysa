(() => {
  const cfg=window.HASHAN_CMS;
  const $=id=>document.getElementById(id);
  const notice=(text,type='')=>{const n=$('saveStatus');n.textContent=text;n.className='status '+type;};

  function buildEditor(content){
    $('editorGrid').innerHTML='<div class="panel full"><h2>Complete Website Content</h2><p class="muted">Edit any text, service, contact detail, SEO value or setting in the JSON below. Keep the JSON format valid.</p><div class="field"><textarea id="contentJson" class="json"></textarea></div><div class="actions"><button id="formatBtn" class="btn">Format JSON</button><a class="btn" href="./" target="_blank">Preview Website</a></div></div>';
    $('contentJson').value=JSON.stringify(content||{},null,2);
    $('formatBtn').onclick=()=>{try{$('contentJson').value=JSON.stringify(JSON.parse($('contentJson').value),null,2);notice('JSON is valid.','ok')}catch(e){notice('Invalid JSON: '+e.message,'error')}};
  }

  async function load(){
    const db=window.hashanAdminClient;if(!db)return;
    notice('Loading content…');
    const {data,error}=await db.from(cfg.table).select('content').eq('id',cfg.rowId).maybeSingle();
    if(error){notice(error.message,'error');return;}
    buildEditor(data?.content||{});notice('Content loaded.','ok');
  }

  async function save(){
    const db=window.hashanAdminClient;if(!db)return;
    let content;try{content=JSON.parse($('contentJson').value)}catch(e){notice('Invalid JSON: '+e.message,'error');return;}
    $('saveBtn').disabled=true;notice('Saving…');
    const {error}=await db.from(cfg.table).update({content,updated_at:new Date().toISOString()}).eq('id',cfg.rowId);
    $('saveBtn').disabled=false;
    if(error)notice(error.message,'error');else notice('Saved successfully.','ok');
  }

  window.addEventListener('hashan-admin-ready',load);
  $('reloadBtn').onclick=load;$('saveBtn').onclick=save;
})();
