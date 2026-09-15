(() => {
  const cfg = window.HASHAN_CMS;
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  window.hashanAdminClient = client;
  const byId = id => document.getElementById(id);
  const status = (text, type='') => { const n=byId('loginStatus'); n.textContent=text; n.className='status '+type; };

  async function authorized(user){
    if(!user) return false;
    const a = await client.rpc('is_admin',{uid:user.id});
    const b = await client.rpc('is_super_admin',{uid:user.id});
    return a.data === true || b.data === true;
  }

  async function refresh(){
    const {data:{session}} = await client.auth.getSession();
    if(!session){ byId('loginView').classList.remove('off'); byId('dashboard').classList.remove('on'); return; }
    if(!(await authorized(session.user))){ await client.auth.signOut(); status('This account is not authorized.','error'); return; }
    byId('loginView').classList.add('off'); byId('dashboard').classList.add('on');
    byId('sessionText').textContent='Signed in as '+(session.user.email||'Administrator');
    window.dispatchEvent(new CustomEvent('hashan-admin-ready'));
  }

  byId('sendLinkBtn').textContent='Login with Email & Password';
  byId('sendLinkBtn').onclick=async()=>{
    const email=window.prompt('Enter your registered admin email');
    if(!email) return;
    const password=window.prompt('Enter your admin password');
    if(!password) return;
    status('Signing in…');
    const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
    if(error){ status('Login failed. Check your email and password.','error'); return; }
    await refresh();
  };

  byId('logoutBtn').onclick=async()=>{await client.auth.signOut();location.reload();};
  client.auth.onAuthStateChange(()=>setTimeout(refresh,0));
  refresh();
})();
