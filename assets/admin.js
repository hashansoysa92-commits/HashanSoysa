(() => {
  const load = src => new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
  load('assets/admin-auth.js').then(()=>load('assets/admin-editor.js')).catch(()=>{const n=document.getElementById('loginStatus');if(n)n.textContent='Admin module failed to load.';});
})();
