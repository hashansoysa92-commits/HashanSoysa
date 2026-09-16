(() => {
  const version = '20260916.4';
  const load = src => new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
  load(`assets/admin-auth.js?v=${version}`).then(()=>load(`assets/admin-editor.js?v=${version}`)).catch(()=>{const n=document.getElementById('loginStatus');if(n)n.textContent='Admin module failed to load.';});
})();
