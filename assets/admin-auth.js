(() => {
  const cfg = window.HASHAN_CMS;
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  window.hashanAdminClient = client;

  const $ = id => document.getElementById(id);
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const directToken = query.get('token_hash') || query.get('token');
  const directType = query.get('type');
  const supportedDirectType = directType === 'recovery' || directType === 'magiclink';
  // Supabase can return recovery credentials in either the query string (OTP),
  // a PKCE code, or the URL fragment (implicit flow). Treat all three as a
  // recovery callback before checking ordinary administrator access.
  const callbackType = hash.get('type') || directType;
  const hasRecoveryCallback = callbackType === 'recovery' && Boolean(
    directToken || query.get('code') || hash.get('access_token')
  );
  let resetMode = Boolean((directToken && supportedDirectType) || hasRecoveryCallback);

  const setStatus = (text, type = '') => {
    const n = $('loginStatus');
    if (!n) return;
    n.textContent = text;
    n.className = 'status ' + type;
  };

  async function isAuthorized(user) {
    if (!user) return false;
    const calls = [
      () => client.rpc('is_admin', { uid: user.id }),
      () => client.rpc('is_super_admin', { uid: user.id }),
      () => client.rpc('is_admin'),
      () => client.rpc('is_super_admin')
    ];
    for (const call of calls) {
      try {
        const r = await call();
        if (!r.error && r.data === true) return true;
      } catch (_) {}
    }
    try {
      const { data, error } = await client.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
      if (!error && data) {
        const role = String(data.role || '').toLowerCase();
        return data.is_active !== false && (role === 'admin' || role === 'super_admin');
      }
    } catch (_) {}
    return false;
  }

  function showResetForm() {
    const login = $('loginView');
    const dashboard = $('dashboard');
    if (!login) return;
    login.classList.remove('off');
    dashboard?.classList.remove('on');

    const card = login.querySelector('.card');
    if (!card || card.dataset.resetReady === '1') return;
    card.dataset.resetReady = '1';
    card.replaceChildren();

    const eyebrow = document.createElement('p');
    eyebrow.className = 'muted';
    eyebrow.textContent = 'SECURE PASSWORD SETUP';

    const title = document.createElement('h1');
    title.textContent = 'Set New Admin Password';

    const intro = document.createElement('p');
    intro.className = 'muted';
    intro.textContent = 'Enter a new password for your administrator account.';

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

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'btn primary';
    button.textContent = 'Update Password';

    const result = document.createElement('div');
    result.className = 'status';

    form.append(
      makeField('New Password', 'newAdminPassword'),
      makeField('Confirm Password', 'confirmAdminPassword'),
      button
    );
    card.append(eyebrow, title, intro, form, result);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const password = $('newAdminPassword')?.value || '';
      const confirm = $('confirmAdminPassword')?.value || '';
      if (password.length < 8) {
        result.textContent = 'Password must be at least 8 characters.';
        result.className = 'status error';
        return;
      }
      if (password !== confirm) {
        result.textContent = 'Passwords do not match.';
        result.className = 'status error';
        return;
      }

      button.disabled = true;
      result.textContent = 'Updating password…';
      result.className = 'status';
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        button.disabled = false;
        result.textContent = 'Password update failed: ' + error.message;
        result.className = 'status error';
        return;
      }

      await client.auth.signOut();
      result.textContent = 'Password updated successfully. Returning to login…';
      result.className = 'status ok';
      setTimeout(() => location.replace('admin.html?reset=success'), 900);
    });
  }

  async function verifyToken(token, type) {
    resetMode = true;
    setStatus('Verifying secure sign-in link…');
    const { data, error } = await client.auth.verifyOtp({ token_hash: token, type });
    if (error) {
      resetMode = false;
      history.replaceState({}, document.title, location.pathname);
      setStatus('Secure link failed: ' + error.message, 'error');
      return false;
    }
    if (!data?.session) {
      resetMode = false;
      setStatus('Secure link was accepted, but no authenticated session was created.', 'error');
      return false;
    }
    history.replaceState({}, document.title, location.pathname);
    showResetForm();
    return true;
  }

  function addPasteLinkBox() {
    if ($('recoveryLinkBox')) return;
    const card = $('loginView')?.querySelector('.card');
    if (!card) return;

    const wrap = document.createElement('div');
    wrap.id = 'recoveryLinkBox';
    wrap.className = 'field';
    const label = document.createElement('label');
    label.htmlFor = 'recoveryLinkInput';
    label.textContent = 'Paste Supabase Reset / Sign-in Link';
    const input = document.createElement('input');
    input.id = 'recoveryLinkInput';
    input.type = 'url';
    input.placeholder = 'Paste the full Supabase email link';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = 'Verify Link';
    button.addEventListener('click', async () => {
      try {
        const url = new URL(input.value.trim());
        const token = url.searchParams.get('token_hash') || url.searchParams.get('token');
        const type = url.searchParams.get('type');
        if (!token || (type !== 'recovery' && type !== 'magiclink')) {
          setStatus('That is not a supported Supabase recovery/sign-in link.', 'error');
          return;
        }
        await verifyToken(token, type);
      } catch (_) {
        setStatus('Paste the complete Supabase link from the email.', 'error');
      }
    });
    wrap.append(label, input, button);
    card.append(wrap);
  }

  async function refresh() {
    const { data: { session } } = await client.auth.getSession();
    if (resetMode) {
      if (!session) {
        setStatus('The password-reset link is invalid, expired, or has already been used. Request a new reset email.', 'error');
        resetMode = false;
        return;
      }
      // Remove the one-time credentials from the address bar before showing the form.
      history.replaceState({}, document.title, location.pathname);
      showResetForm();
      return;
    }
    if (!session) {
      $('loginView')?.classList.remove('off');
      $('dashboard')?.classList.remove('on');
      if (query.get('reset') === 'success') setStatus('Password updated. Sign in with your new password.', 'ok');
      return;
    }

    if (!(await isAuthorized(session.user))) {
      const email = session.user.email || 'this account';
      await client.auth.signOut();
      setStatus('Authentication succeeded for ' + email + ', but this account is not authorized as an administrator.', 'error');
      return;
    }

    $('loginView')?.classList.add('off');
    $('dashboard')?.classList.add('on');
    if ($('sessionText')) $('sessionText').textContent = 'Signed in as ' + (session.user.email || 'Administrator');
    window.dispatchEvent(new CustomEvent('hashan-admin-ready'));
  }

  $('loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('adminEmail')?.value.trim();
    const password = $('adminPassword')?.value || '';
    if (!email || !password) {
      setStatus('Enter your email and password.', 'error');
      return;
    }

    const button = $('loginBtn');
    if (button) button.disabled = true;
    setStatus('Signing in…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (button) button.disabled = false;

    if (error) {
      setStatus('Login failed: ' + error.message, 'error');
      return;
    }
    if (!data?.session) {
      setStatus('Login failed: authenticated session was not created.', 'error');
      return;
    }

    if ($('adminPassword')) $('adminPassword').value = '';
    setStatus('Authentication successful. Checking administrator access…');
    await refresh();
  });

  $('forgotBtn')?.addEventListener('click', async () => {
    const email = $('adminEmail')?.value.trim();
    if (!email) {
      setStatus('Enter your admin email first.', 'error');
      return;
    }

    setStatus('Sending password reset email…');
    const redirectTo = location.origin + location.pathname;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('rate limit')) {
        setStatus('Supabase email rate limit is active. You can paste an existing unused Reset or Sign-in link below.', 'error');
        addPasteLinkBox();
      } else {
        setStatus('Reset failed: ' + msg, 'error');
      }
      return;
    }
    setStatus('Reset email sent. Copy the newest Supabase link and paste it below.', 'ok');
    addPasteLinkBox();
  });

  $('logoutBtn')?.addEventListener('click', async () => {
    await client.auth.signOut();
    location.reload();
  });

  client.auth.onAuthStateChange(event => {
    if (!resetMode && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) setTimeout(refresh, 0);
  });

  if (directToken && supportedDirectType) {
    verifyToken(directToken, directType);
  } else {
    refresh();
  }
})();
