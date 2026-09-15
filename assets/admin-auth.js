(() => {
  const cfg = window.HASHAN_CMS;
  const recoveryFromUrl = (() => {
    const hash = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    return hash.get('type') === 'recovery';
  })();

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  window.hashanAdminClient = client;
  const byId = id => document.getElementById(id);
  let recoveryMode = recoveryFromUrl;

  const status = (text, type='') => {
    const n = byId('loginStatus');
    if (!n) return;
    n.textContent = text;
    n.className = 'status ' + type;
  };

  async function authorized(user) {
    if (!user) return false;
    const a = await client.rpc('is_admin', { uid: user.id });
    const b = await client.rpc('is_super_admin', { uid: user.id });
    return a.data === true || b.data === true;
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
        recoveryStatus.textContent = error.message;
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
      if (session) {
        showRecoveryForm();
      } else {
        byId('loginView')?.classList.remove('off');
        byId('dashboard')?.classList.remove('on');
        status('Opening secure password reset session…');
      }
      return;
    }

    if (!session) {
      byId('loginView')?.classList.remove('off');
      byId('dashboard')?.classList.remove('on');
      const params = new URLSearchParams(location.search);
      if (params.get('reset') === 'success') status('Password updated. Sign in with your new password.', 'ok');
      return;
    }

    if (!(await authorized(session.user))) {
      await client.auth.signOut();
      status('This account is not authorized.', 'error');
      return;
    }

    byId('loginView')?.classList.add('off');
    byId('dashboard')?.classList.add('on');
    if (byId('sessionText')) byId('sessionText').textContent = 'Signed in as ' + (session.user.email || 'Administrator');
    window.dispatchEvent(new CustomEvent('hashan-admin-ready'));
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
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (button) button.disabled = false;

    if (error) {
      status('Login failed. Check your email and password.', 'error');
      return;
    }

    if (byId('adminPassword')) byId('adminPassword').value = '';
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
    status(error ? error.message : 'Password reset email sent. Open the link in this browser and set your new password.', error ? 'error' : 'ok');
  });

  byId('logoutBtn')?.addEventListener('click', async () => {
    await client.auth.signOut();
    location.reload();
  });

  client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') recoveryMode = true;
    setTimeout(refresh, 0);
  });

  refresh();
})();
