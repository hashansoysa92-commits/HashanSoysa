(() => {
  const status = document.getElementById('loginStatus');
  const card = document.querySelector('#loginView .card');
  if (!status || !card) return;

  function setStatus(text, type = '') {
    status.textContent = text;
    status.className = 'status ' + type;
  }

  function showFallback() {
    if (document.getElementById('rateLimitRecovery')) return;
    const box = document.createElement('div');
    box.id = 'rateLimitRecovery';
    box.className = 'field';

    const help = document.createElement('p');
    help.className = 'muted';
    help.textContent = 'If you already have a fresh unused reset email, copy its Reset password link and paste it here.';

    const input = document.createElement('input');
    input.id = 'rateLimitRecoveryLink';
    input.type = 'url';
    input.placeholder = 'Paste full Reset password link';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = 'Verify Reset Link';

    button.addEventListener('click', async () => {
      const client = window.hashanAdminClient;
      if (!client) return setStatus('Admin authentication module is not ready.', 'error');
      try {
        const parsed = new URL(input.value.trim());
        const token = parsed.searchParams.get('token_hash') || parsed.searchParams.get('token');
        if (!token || parsed.searchParams.get('type') !== 'recovery') {
          return setStatus('That is not a valid password recovery link.', 'error');
        }
        button.disabled = true;
        setStatus('Verifying reset link…');
        const { error } = await client.auth.verifyOtp({ token_hash: token, type: 'recovery' });
        button.disabled = false;
        if (error) return setStatus('Reset link could not be verified: ' + error.message, 'error');
        showNewPasswordForm(client, box);
      } catch (_) {
        button.disabled = false;
        setStatus('Paste the complete Reset password link from the email.', 'error');
      }
    });

    box.append(help, input, button);
    card.append(box);
  }

  function showNewPasswordForm(client, box) {
    while (box.firstChild) box.removeChild(box.firstChild);
    const title = document.createElement('p');
    title.className = 'muted';
    title.textContent = 'SET NEW PASSWORD';
    const password = document.createElement('input');
    password.type = 'password';
    password.placeholder = 'New password';
    password.minLength = 8;
    const confirm = document.createElement('input');
    confirm.type = 'password';
    confirm.placeholder = 'Confirm new password';
    confirm.minLength = 8;
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn primary';
    save.textContent = 'Update Password';
    save.addEventListener('click', async () => {
      if (password.value.length < 8) return setStatus('Password must be at least 8 characters.', 'error');
      if (password.value !== confirm.value) return setStatus('Passwords do not match.', 'error');
      save.disabled = true;
      const { error } = await client.auth.updateUser({ password: password.value });
      if (error) {
        save.disabled = false;
        return setStatus('Password update failed: ' + error.message, 'error');
      }
      await client.auth.signOut();
      setStatus('Password updated successfully. You can now sign in with the new password.', 'ok');
      box.remove();
    });
    box.append(title, password, confirm, save);
    setStatus('Reset link verified. Choose a new password.', 'ok');
  }

  const observer = new MutationObserver(() => {
    const text = status.textContent.toLowerCase();
    if (text.includes('email rate limit exceeded') || text.includes('rate limit')) {
      setStatus('Password reset email limit reached. Please wait for the email quota to reset before requesting another email. If you already have a fresh unused reset link, you can paste it below.', 'error');
      showFallback();
    }
  });
  observer.observe(status, { childList: true, characterData: true, subtree: true });
})();
