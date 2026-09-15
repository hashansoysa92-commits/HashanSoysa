(() => {
  const cfg = window.HASHAN_CMS;
  const query = new URLSearchParams(location.search);
  const directRecoveryToken = query.get('token_hash') || query.get('token');
  const directRecoveryType = query.get('type');
  const recoveryFromUrl = (() => {
    const hash = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    return hash.get('type') === 'recovery';
  })();

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  window.hashanAdminClient = client;
  const byId = id => document.getElementById(id);
  let recoveryMode = recoveryFromUrl || (Boolean(directRecoveryToken) && directRecoveryType === 'recovery');

  const status = (text, type='') => {
    const n = byId('loginStatus');
    if (!n) return;
    n.textContent = text;
    n.className = 'status ' + type;
  };

  async function authorized(user) {
    if (!user) return false;

    try {
      const a = await client.rpc('is_admin', { uid: user.id });
      if (!a.error && a.data === true) return true;
    } catch (_) {}

    try {
      const b = await client.rpc('is_super_admin', { uid: user.id });
      if (!b.error && b.data === true) return true;
    } catch (_) {}

    try {
      const c = await client.rpc('is_admin');
      if (!c.error && c.data === true) return true;
    } catch (_) {}

    try {
      const d = await client.rpc('is_super_admin');
      if (!d.error && d.data === true) return true;
    } catch (_) {}

    try {
      const { data, error } = await client
        .from('profiles')
        .select('role,is_active')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        const role = String(data.role || '').toLowerCase();
        return data.is_active !== false && (role === 'admin' || role === 'super_admin');
      }
    } catch (_) {}

    return false;
  }

  function showRecoveryForm() {
    const login = byId('loginView');
    const dashboard = byId('dashboard');
    if (!login) return;
    login.classList.remove('off');
    dashboard?.classList.remove('on');

    const card = login.querySelector('.card');
    if (!card || card.dataset.recoveryReady === '1') return;
    card.dataset.recoveryReady = '1';
    while (card.firstChild) card.removeChild(card.firstChild);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'muted';
    eyebrow.textContent = 'PASSWORD RECOVERY';
    const title = document.createElement('h1');
    title.textContent = 'Set New Password';
    const intro = document.createElement('p');
    intro.className = 'muted';
    intro.textContent = 'Enter and confirm your new administrator password.';
    const form = document.createElement('form');

    const makeField = (labelText, id) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = labelText;
      const input = document.createElement('input');
      input.id = id;
      input.type = 'password';
      input.autocomplete = 'new-password';
      input.required = true;
      input.minLength = 8;
      wrap.append(label, input);
      return wrap;
    };

    const passwordField = makeField('New Password', 'newAdminPassword');
    const confirmField = makeField('Confirm Password', 'confirmAdminPassword');
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'btn primary';
    button.textContent = 'Update Password';
    const recoveryStatus = document.createElement('div');
    recoveryStatus.className = 'status';
    form.append(passwordField, confirmField, button);
    card.append(eyebrow, title, intro, form, recoveryStatus);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const password = byId('newAdminPassword')?.value || '';
      const confirm = byId('confirmAdminPassword')?.value || '';
      if (password.length < 8) {
        recoveryStatus.textContent = 'Password must be at least 8 characters.';
        recoveryStatus.className = 'status error';
        return;
      }
      if (password !== confirm) {
        recoveryStatus.textContent = 'Passwords do not match.';
        recoveryStatus.className = 'status error';
        return;
      }

      button.disabled = true;
      recoveryStatus.textContent = 'Updating password…';
      recoveryStatus.className = 'status';
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        button.disabled = false;
        recoveryStatus.textContent = 'Password update failed: ' + error.message;
        recoveryStatus.className = 'status error';
        return;
      }

      recoveryStatus.textContent = 'Password updated successfully. Returning to Admin Login…';
      recoveryStatus.className = 'status ok';
      recoveryMode = false;
      await client.auth.signOut();
      history.replaceState({}, document.title, location.pathname);
      setTimeout(() => location.reload(), 1200);
    });
  }

  async function refresh() {
    const { data: { session } } = await client.auth.getSession();

    if (recoveryMode) {
      if (session) showRecoveryForm();
      else {
        byId('loginView')?.classList.remove('off');
        byId('dashboard')?.classList.remove('on');
        status('Opening secure password reset session…');
      }
      return;
    }

    if (!session) {
      byId('loginView')?.classList.remove('off');
      byId('dashboard')?.classList.remove('on');
      return;
    }

    if (!(await authorized(session.user))) {
      const email = session.user.email || 'this account';
      await client.auth.signOut();
      status('Authentication succeeded for ' + email + ', but this account is not authorized as an administrator.', 'error');
      return;
    }

    byId('loginView')?.classList.add('off');
    byId('dashboard')?.classList.add('on');
    if (byId('sessionText')) byId('sessionText').textContent = 'Signed in as ' + (session.user.email || 'Administrator');
    window.dispatchEvent(new CustomEvent('hashan-admin-ready'));
  }

  async function verifyDirectRecovery() {
    if (!directRecoveryToken || directRecoveryType !== 'recovery') {
      await refresh();
      return;
    }
    status('Verifying password recovery link…');
    const { error } = await client.auth.verifyOtp({
      token_hash: directRecoveryToken,
      type: 'recovery'
    });
    if (error) {
      recoveryMode = false;
      status('Recovery link failed: ' + error.message + '. Request a new reset email.', 'error');
      history.replaceState({}, document.title, location.pathname);
      return;
    }
    recoveryMode = true;
    history.replaceState({}, document.title, location.pathname);
    await refresh();
  }

  byId('loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = byId('adminEmail')?.value.trim();
    const password = byId('adminPassword')?.value || '';
    if (!email || !password) {
      status('Enter your email and password.', 'error');
      return;
    }

    const button = byId('loginBtn');
    if (button) button.disabled = true;
    status('Signing in…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (button) button.disabled = false;
    if (error) {
      status('Login failed: ' + error.message, 'error');
      return;
    }
    if (!data?.session) {
      status('Login failed: authenticated session was not created.', 'error');
      return;
    }

    if (byId('adminPassword')) byId('adminPassword').value = '';
    status('Authentication successful. Checking administrator access…');
    await refresh();
  });

  byId('forgotBtn')?.addEventListener('click', async () => {
    const email = byId('adminEmail')?.value.trim();
    if (!email) {
      status('Enter your admin email first.', 'error');
      return;
    }

    status('Sending password reset email…');
    const redirectTo = location.origin + location.pathname;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    status(error ? 'Reset failed: ' + error.message : 'Password reset email sent. Use only the newest reset link.', error ? 'error' : 'ok');
  });

  byId('logoutBtn')?.addEventListener('click', async () => {
    await client.auth.signOut();
    location.reload();
  });

  client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') recoveryMode = true;
    if (!directRecoveryToken) setTimeout(refresh, 0);
  });

  verifyDirectRecovery();
})();
