(function(){
  const PASS_HASH = 'REPLACE_WITH_SHA256_HEX'; // replace with your SHA-256 hex

  const $ = s => document.querySelector(s);
  const toast = (msg) => { alert(msg); };

  async function sha256Hex(str){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function gate(){
    const stored = sessionStorage.getItem('gp_admin_ok');
    if(stored === '1') return true;
    const pass = prompt('Enter admin password');
    if(!pass) return false;
    const hex = await sha256Hex(pass);
    if(hex === PASS_HASH){ sessionStorage.setItem('gp_admin_ok','1'); return true; }
    toast('Wrong password');
    return false;
  }

  async function load(){
    if(!(await gate())){ location.href = 'index.html'; return; }
    const res = await fetch('content.json', { cache: 'no-store' });
    const json = await res.json();
    document.getElementById('editor').value = JSON.stringify(json, null, 2);
  }

  function download(filename, text){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type:'application/json'}));
    a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }

  function insertTemplate(type){
    try{
      const editor = document.getElementById('editor');
      const data = JSON.parse(editor.value);
      const id = 'post-' + Math.random().toString(36).slice(2,8);
      const now = new Date().toISOString().slice(0,10);
      const template = {
        id, type,
        date: now,
        tags: [],
        title: { en: type==='event'?'New event title':'New post title', es: type==='event'?'Título de evento':'Título de nota' },
        body: { en: 'Write here', es: 'Escribe aquí' }
      };
      data.posts = Array.isArray(data.posts) ? [template, ...data.posts] : [template];
      editor.value = JSON.stringify(data, null, 2);
    }catch(e){ alert('Fix JSON first'); }
  }

  document.getElementById('pretty').addEventListener('click', () => {
    try{ const o = JSON.parse(document.getElementById('editor').value); document.getElementById('editor').value = JSON.stringify(o, null, 2); }catch(e){ alert('Invalid JSON'); }
  });
  document.getElementById('validate').addEventListener('click', () => {
    try{ JSON.parse(document.getElementById('editor').value); alert('Valid JSON'); }catch(e){ alert('Invalid JSON'); }
  });
  document.getElementById('download').addEventListener('click', () => {
    try{ JSON.parse(document.getElementById('editor').value); download('content.json', document.getElementById('editor').value); }catch(e){ alert('Invalid JSON'); }
  });
  document.getElementById('addNews').addEventListener('click', () => insertTemplate('news'));
  document.getElementById('addEvent').addEventListener('click', () => insertTemplate('event'));
  document.getElementById('logout').addEventListener('click', () => { sessionStorage.removeItem('gp_admin_ok'); location.reload(); });

  window.addEventListener('DOMContentLoaded', load);
})();