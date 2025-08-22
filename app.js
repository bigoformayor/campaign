(function(){
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  const state = {
    lang: localStorage.getItem('gp_lang') || 'en',
    content: null
  };

  const i18n = {
    en: {
      nav: { about: 'About Us', news: 'News & Events', contact: 'Get in Touch' },
      hero: { help: "We're here to help!", subtitle: 'Neighbors first. Galena Park first.', ctaHelp: 'Get help', ctaNews: 'See the latest' },
      about: { title: 'About Galena Park 1st', driversTitle: 'Drivers and goals', note: 'This site is a community forum. It is not a campaign site.' },
      news: { title: 'News & Events', filters: { all: 'All', news: 'News', events: 'Events', upcoming: 'Upcoming events', past: 'Past events' } },
      contact: { title: 'Get in Touch', phoneLabel: 'Phone', desc: 'Use the form and we will reply as soon as possible.', email: 'Your email:', message: 'Your message:', send: 'Send', note: 'Powered by Formspree. No account needed to message us.', visit: 'Visit', hours: 'Community hours vary by event. Check News & Events.' }
    },
    es: {
      nav: { about: 'Quiénes somos', news: 'Noticias y eventos', contact: 'Contacto' },
      hero: { help: '¡Estamos aquí para ayudarte!', subtitle: 'Vecinos primero. Galena Park primero.', ctaHelp: 'Pedir apoyo', ctaNews: 'Ver lo más reciente' },
      about: { title: 'Acerca de Galena Park 1st', driversTitle: 'Motores y metas', note: 'Este sitio es un foro comunitario. No es un sitio de campaña.' },
      news: { title: 'Noticias y eventos', filters: { all: 'Todo', news: 'Noticias', events: 'Eventos', upcoming: 'Próximos eventos', past: 'Eventos pasados' } },
      contact: { title: 'Contacto', phoneLabel: 'Teléfono', desc: 'Usa el formulario y te responderemos lo antes posible.', email: 'Tu correo:', message: 'Tu mensaje:', send: 'Enviar', note: 'Con tecnología de Formspree. No necesitas cuenta.', visit: 'Visítanos', hours: 'Los horarios comunitarios varían por evento. Revisa Noticias y eventos.' }
    }
  };

  function applyI18n(){
    const dict = i18n[state.lang];
    $$('[data-i18n]').forEach(el => {
      const path = el.getAttribute('data-i18n').split('.');
      let cur = dict;
      for(const p of path){ cur = cur?.[p]; }
      if(typeof cur === 'string') el.textContent = cur;
    });
    $('#langToggle').textContent = state.lang === 'en' ? 'ES' : 'EN';
    document.documentElement.lang = state.lang;
  }

  async function loadContent(){
    const res = await fetch('content.json', { cache: 'no-store' });
    state.content = await res.json();
    renderAll();
  }

  function renderAbout(){
    const about = state.content?.about?.[state.lang] || '';
    $('#aboutContent').innerHTML = markdownToHTML(about);

    const drivers = state.content?.drivers?.[state.lang] || [];
    const ul = $('#driversList');
    ul.innerHTML = '';
    drivers.forEach(text => {
      const li = document.createElement('li');
      li.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5" fill="none" stroke="var(--navy)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${text}</span>`;
      ul.appendChild(li);
    });
  }

  function renderPosts(){
    const list = $('#postList');
    const now = new Date();

    const items = [...(state.content?.posts || [])].sort((a,b) => new Date(b.date) - new Date(a.date));

    const query = $('#searchInput').value.trim().toLowerCase();
    const filter = $('#filterSelect').value;

    const filtered = items.filter(p => {
      const type = p.type || 'news';
      let ok = true;
      if(filter === 'news') ok = type === 'news';
      else if(filter === 'event') ok = type === 'event';
      else if(filter === 'upcoming') ok = type === 'event' && new Date(p.date) >= now;
      else if(filter === 'past') ok = type === 'event' && new Date(p.date) < now;
      if(!ok) return false;

      if(query){
        const title = (p.title?.[state.lang] || '').toLowerCase();
        const body = (p.body?.[state.lang] || '').toLowerCase();
        return title.includes(query) || body.includes(query) || (p.tags||[]).join(' ').toLowerCase().includes(query);
      }
      return true;
    });

    list.innerHTML = '';
    filtered.forEach(p => list.appendChild(renderPostCard(p)));

    const newest = items[0];
    const bar = $('#announceBar');
    if(newest){
      const label = newest.type === 'event' ? (state.lang==='en'?'Upcoming: ':'Próximo: ') : (state.lang==='en'?'Latest: ':'Nuevo: ');
      bar.textContent = label + (newest.title?.[state.lang] || '');
      bar.hidden = false;
    }
  }

  function renderPostCard(p){
    const card = document.createElement('article');
    card.className = 'card post';
    const d = new Date(p.date);
    const dateStr = d.toLocaleDateString(state.lang === 'en' ? 'en-US' : 'es-MX', { year:'numeric', month:'short', day:'numeric' });
    const typeTag = p.type === 'event' ? (state.lang==='en'?'Event':'Evento') : (state.lang==='en'?'News':'Noticia');
    const link = p.link ? `<p><a href="${p.link}" target="_blank" rel="noopener">${p.linkText || 'Read more'}</a></p>` : '';
    card.innerHTML = `
      <div class="meta">${dateStr}<span class="tag">${typeTag}</span></div>
      <h3>${escapeHTML(p.title?.[state.lang] || '')}</h3>
      <div class="prose">${markdownToHTML(p.body?.[state.lang] || '')}</div>
      ${link}
    `;
    return card;
  }

  function markdownToHTML(md){
    return (md||'')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br/>');
  }
  function escapeHTML(s){ return (s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  function initHeaderShrink(){
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      document.querySelector('.site-header').style.transform = cur > last ? 'translateY(-6px)' : 'translateY(0)';
      last = cur;
    }, { passive: true });
  }

  function init(){
    $('#year').textContent = new Date().getFullYear();

    const savedTheme = localStorage.getItem('gp_theme');
    if(savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    $('#themeToggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('gp_theme', cur);
    });

    applyI18n();
    $('#langToggle').addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'es' : 'en';
      localStorage.setItem('gp_lang', state.lang);
      applyI18n();
      renderAll();
    });

    $$('.main-nav a').forEach(a => a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if(href.startsWith('#')){
        e.preventDefault();
        const target = $(href);
        if(target){ target.scrollIntoView({ behavior: 'smooth', block: 'start' }); target.setAttribute('tabindex','-1'); target.focus({ preventScroll:true }); }
      }
    }));

    $('#searchInput').addEventListener('input', renderPosts);
    $('#filterSelect').addEventListener('change', renderPosts);

    loadContent();
    initHeaderShrink();

    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  }

  function renderAll(){
    applyI18n();
    renderAbout();
    renderPosts();
  }

  document.addEventListener('DOMContentLoaded', init);
})();