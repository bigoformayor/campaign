(function(){
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  const state = {
    lang: localStorage.getItem('gp_lang') || 'en',
    content: null,
    carousel: { images: [], index: 0, autoplayMs: 3000, timer: null }
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
      li.innerHTML = `<span>✔</span><span>${text}</span>`;
      ul.appendChild(li);
    });
  }

  function renderPosts(){
    const list = $('#postList');
    const now = new Date();
    const items = [...(state.content?.posts || [])].sort((a,b) => new Date(b.date) - new Date(a.date));

    const query = ($('#searchInput')?.value || '').trim().toLowerCase();
    const filter = $('#filterSelect')?.value || 'all';

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

  // Header shrink
  function initHeaderShrink(){
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      document.querySelector('.site-header').style.transform = cur > last ? 'translateY(-6px)' : 'translateY(0)';
      last = cur;
    }, { passive: true });
  }

  // Carousel logic (3-at-a-time, autoplay 3s, swipe)
  async function initCarousel(){
    try{
      const res = await fetch('assets/carousel/manifest.json', { cache: 'no-store' });
      const { images } = await res.json();
      state.carousel.images = Array.isArray(images) ? images : [];
    } catch { state.carousel.images = []; }

    const track = document.getElementById('carTrack');
    const dots = document.getElementById('carDots');
    if(!track) return;

    // Build slides
    track.innerHTML = '';
    state.carousel.images.forEach(src => {
      const li = document.createElement('li');
      li.className = 'car-slide';
      li.innerHTML = `<img src="${src}" alt="">`;
      track.appendChild(li);
    });

    // Build dots (one per "page" = group of 3)
    const pages = Math.max(1, Math.ceil(state.carousel.images.length / 3));
    dots.innerHTML = '';
    for(let i=0;i<pages;i++){
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide '+(i+1));
      b.addEventListener('click', () => goToPage(i));
      dots.appendChild(b);
    }

    // Controls
    const prev = document.querySelector('.car-btn.prev');
    const next = document.querySelector('.car-btn.next');
    prev?.addEventListener('click', prevPage);
    next?.addEventListener('click', nextPage);

    // Swipe
    let startX = 0; let delta = 0; const viewport = document.querySelector('.car-viewport');
    viewport?.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
    viewport?.addEventListener('touchmove', e => { delta = e.touches[0].clientX - startX; }, {passive:true});
    viewport?.addEventListener('touchend', () => { if(delta<-30) nextPage(); else if(delta>30) prevPage(); startX=0; delta=0; }, {passive:true});

    // Start
    goToPage(0);
    startAutoplay();
  }

  function pagesCount(){
    return Math.max(1, Math.ceil(state.carousel.images.length / 3));
  }
  function goToPage(i){
    const track = document.getElementById('carTrack');
    const dots = document.getElementById('carDots');
    const pages = pagesCount();
    state.carousel.index = (i + pages) % pages;
    const pct = -(state.carousel.index * 100);
    if(track){ track.style.transform = `translateX(${pct}%)`; }
    if(dots){
      Array.from(dots.children).forEach((b, idx) => b.setAttribute('aria-selected', String(idx===state.carousel.index)));
    }
    restartAutoplay();
  }
  function nextPage(){ goToPage(state.carousel.index + 1); }
  function prevPage(){ goToPage(state.carousel.index - 1); }

  function startAutoplay(){
    stopAutoplay();
    state.carousel.timer = setInterval(nextPage, state.carousel.autoplayMs);
  }
  function stopAutoplay(){
    if(state.carousel.timer){ clearInterval(state.carousel.timer); state.carousel.timer = null; }
  }
  function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

  function init(){
    $('#year').textContent = new Date().getFullYear();
    applyI18n();

    // Language toggle
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        state.lang = state.lang === 'en' ? 'es' : 'en';
        localStorage.setItem('gp_lang', state.lang);
        applyI18n();
        renderAll();
      });
    }

    // Smooth-scroll
    $$('.main-nav a').forEach(a => a.addEventListener('click', e => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = $(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.setAttribute('tabindex','-1');
          target.focus({ preventScroll:true });
        }
      }
    }));

    // Filters
    $('#searchInput')?.addEventListener('input', renderPosts);
    $('#filterSelect')?.addEventListener('change', renderPosts);

    // Mobile menu toggle
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    if (nav && navToggle) {
      navToggle.addEventListener('click', () => {
        const open = nav.getAttribute('data-open') === 'true';
        nav.setAttribute('data-open', String(!open));
        navToggle.setAttribute('aria-expanded', String(!open));
      });
      Array.from(nav.querySelectorAll('a')).forEach(a => {
        a.addEventListener('click', () => {
          if (window.matchMedia('(max-width: 720px)').matches) {
            nav.setAttribute('data-open', 'false');
            navToggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }

    // Content + Carousel
    loadContent();
    initCarousel();

    // Header behavior
    initHeaderShrink();

    // SW
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