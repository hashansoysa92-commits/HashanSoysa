(() => {
  const cfg = window.HASHAN_CMS;
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  window.hashanAdminClient = client;
  const byId = id => document.getElementById(id);
  const status = (text, type='') => { const n=byId('loginStatus'); if(!n) return; n.textContent=text; n.className='status '+type; };

  async function authorized(user){
    if(!user) return false;
    const a = await client.rpc('is_admin',{uid:user.id});
    const b = await client.rpc('is_super_admin',{uid:user.id});
    return a.data === true || b.data === true;
  }

  async function refresh(){
    const {data:{session}} = await client.auth.getSession();
    if(!session){ byId('loginView')?.classList.remove('off'); byId('dashboard')?.classList.remove('on'); return; }
    if(!(await authorized(session.user))){ await client.auth.signOut(); status('This account is not authorized.','error'); return; }
    byId('loginView')?.classList.add('off'); byId('dashboard')?.classList.add('on');
    if(byId('sessionText')) byId('sessionText').textContent='Signed in as '+(session.user.email||'Administrator');
    window.dispatchEvent(new CustomEvent('hashan-admin-ready'));
  }

  byId('loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = byId('adminEmail')?.value.trim();
    const password = byId('adminPassword')?.value || '';
    if(!email || !password){ status('Enter your email and password.','error'); return; }
    const button = byId('loginBtn'); if(button) button.disabled=true;
    status('Signing in…');
    const {error} = await client.auth.signInWithPassword({email,password});
    if(button) button.disabled=false;
    if(error){ status('Login failed. Check your email and password.','error'); return; }
    if(byId('adminPassword')) byId('adminPassword').value='';
    await refresh();
  });

  byId('forgotBtn')?.addEventListener('click', async () => {
    const email = byId('adminEmail')?.value.trim();
    if(!email){ status('Enter your admin email first.','error'); return; }
    status('Sending password reset email…');
    const redirectTo = location.origin + location.pathname;
    const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo});
    status(error ? error.message : 'Password reset email sent. Check your inbox.', error ? 'error' : 'ok');
  });

  byId('logoutBtn')?.addEventListener('click', async()=>{await client.auth.signOut();location.reload();});

  client.auth.onAuthStateChange(async (event) => {
    if(event === 'PASSWORD_RECOVERY'){
      const next = window.prompt('Enter a new admin password (minimum 8 characters)');
      if(next && next.length >= 8){
        const {error} = await client.auth.updateUser({password:next});
        status(error ? error.message : 'Password updated. You can now sign in with the new password.', error ? 'error' : 'ok');
      }
    }
    setTimeout(refresh,0);
  });
  refresh();
})();
