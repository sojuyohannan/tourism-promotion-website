/* ══════════════════════════════════════════════════════════
   TOURISM PROMOTION WEBSITE — Landing Page Logic
   ════════════════════════════════════════════════════════ */

'use strict';

const API = '/api';

const state = {
  destinations: [],
  packages: [],
  publicData: null,
  category: 'all',
  search: '',
  sort: 'featured',
  budget: 'all',
};

const formatMoney = v => `₹ ${Number(v).toLocaleString('en-IN')}`;
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function starHTML(rating, max = 5) {
  return Array.from({ length: max }, (_, i) => {
    if (i + 1 <= Math.floor(rating)) return '<i class="bi bi-star-fill text-warning"></i>';
    if (i < rating)                  return '<i class="bi bi-star-half text-warning"></i>';
    return '<i class="bi bi-star text-warning"></i>';
  }).join('');
}

async function GET(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('tp_theme') || 'light';
  document.documentElement.dataset.theme = savedTheme;
  const tBtn = $('themeToggle');
  if (tBtn) tBtn.querySelector('i').className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';

  if (window.AOS) AOS.init({ once: true, duration: 600, easing: 'ease-out-cubic', offset: 60 });
  initParticles();
  initTyped();
  setupEvents();
  
  // Auth awareness for Navbar
  const user = Auth.getUser();
  if (user) {
    $('navLoginBtn')?.classList.add('d-none');
    $('navRegBtn')?.classList.add('d-none');
    $('navUserMenu')?.classList.remove('d-none');
    $('navUserMenu')?.classList.add('d-flex');
    const link = $('navDashLink');
    if (link) {
      if (user.role === 'admin') link.href = '/admin/';
      else if (user.role === 'provider') link.href = '/provider/';
      else link.href = '/user/';
    }
  }

  await loadAll();
  
  const loader = $('pageLoader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 400);
  }
});

function initParticles() {
  const canvas = $('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = canvas.offsetWidth;
  let H = canvas.height = canvas.offsetHeight;
  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2 + .5,
    dx: (Math.random() - .5) * .45,
    dy: (Math.random() - .5) * .45,
    alpha: Math.random() * .5 + .2,
  }));
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  });
}

function initTyped() {
  if (!window.Typed || !$('typedText')) return;
  new Typed('#typedText', {
    strings: ['Iconic Destinations.', 'Rich Culture.', 'Local Experiences.', 'Heritage Trails.', 'Wildlife Wonders.'],
    typeSpeed: 55, backSpeed: 30, backDelay: 1800, loop: true,
  });
}

async function loadAll() {
  try {
    const [dests, pkgs, pub] = await Promise.all([
      GET(`${API}/destinations`),
      GET(`${API}/packages`),
      GET(`${API}/analytics/public`),
    ]);
    state.destinations = dests;
    state.packages     = pkgs;
    state.publicData   = pub;
  } catch (err) {
    console.warn('API fetch failed, UI will remain empty:', err.message);
  }
  
  if (state.publicData) {
    $('statDest').dataset.count = state.publicData.stats.destinations;
    $('statSvc').dataset.count = state.publicData.stats.services;
    $('statUsr').dataset.count = state.publicData.stats.tourists;
    $('statEvt').dataset.count = state.publicData.stats.events;
    animateCounters();
    
    console.log(state.publicData.providers);

renderProviders(state.publicData.providers);
renderTestimonials(state.publicData.testimonials);
  }

  renderChips();
  renderDestinations(); // Always show ALL destinations from state.destinations
  renderPackages();
}

function animateCounters() {
  $$('.counter').forEach(el => {
    const end  = +el.dataset.count;
    const dur  = 1800;
    const step = 16;
    const inc  = end / (dur / step);
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= end) { cur = end; clearInterval(timer); }
      el.textContent = Math.floor(cur) + '+';
    }, step);
  });
}

function renderChips() {
  const container = $('categoryFilters');
  if (!container) return;
  const cats = ['all', ...new Set(state.destinations.map(d => d.category))];
  container.innerHTML = cats.map(c => `
    <button class="filter-chip ${state.category === c ? 'active' : ''}" type="button" data-category="${c}">
      ${c === 'all' ? 'All' : c}
    </button>
  `).join('');
}

function filteredDests() {
  const q = state.search.toLowerCase();
  let list = state.destinations.filter(d => {
    const txt = `${d.name} ${d.location} ${d.category} ${d.description||''}`.toLowerCase();
    const catOk = state.category === 'all' || d.category === state.category;
    let budOk = true;
    if (state.budget === 'budget')  budOk = d.price < 7000;
    if (state.budget === 'mid')     budOk = d.price >= 7000 && d.price <= 10000;
    if (state.budget === 'premium') budOk = d.price > 10000;
    return txt.includes(q) && catOk && budOk;
  });
  if (state.sort === 'rating')     list.sort((a,b) => b.rating - a.rating);
  if (state.sort === 'priceLow')   list.sort((a,b) => a.price - b.price);
  if (state.sort === 'priceHigh')  list.sort((a,b) => b.price - a.price);
  return list;
}

function renderDestinations() {
  const grid = $('destinationGrid');
  const empty = $('emptyState');
  if (!grid) return;
  
  const list = filteredDests();
  
  // Remove skeletons
  $$('.skeleton-col').forEach(el => el.remove());
  
  if (empty) empty.classList.toggle('d-none', list.length > 0);
  
  grid.innerHTML = list.map((d, i) => `
    <div class="col-md-6 col-xl-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <article class="destination-card h-100 d-flex flex-column" style="background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden">
        <div class="destination-image" style="position:relative;width:100%;aspect-ratio:16/9">
          <img src="${d.image}" alt="${d.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover">
          <span class="destination-badge" style="position:absolute;top:1rem;left:1rem;background:rgba(0,0,0,.6);color:#fff;padding:.3rem .8rem;border-radius:999px;font-size:.8rem;backdrop-filter:blur(4px)">${d.category}</span>
          ${d.featured ? '<span class="destination-badge" style="position:absolute;top:1rem;right:1rem;background:#f59e0b;color:#000;padding:.3rem .8rem;border-radius:999px;font-size:.8rem;font-weight:bold"><i class="bi bi-star-fill me-1"></i>Featured</span>' : ''}
        </div>
        <div class="p-4 d-flex flex-column flex-grow-1">
          <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
            <h3 class="h5 fw-bold mb-0">${d.name}</h3>
            <span class="badge text-bg-warning">${starHTML(d.rating)} <span class="ms-1">${d.rating}</span></span>
          </div>
          <p class="text-muted small mb-3 flex-grow-1">${d.description || ''}</p>
          <div class="d-flex justify-content-between align-items-center mb-3 text-muted small">
            <span><i class="bi bi-geo-alt me-1"></i>${d.location}</span>
            <strong class="text-brand" style="font-size:1rem"><i class="bi bi-wallet2 me-1"></i>Estimated cost: ${formatMoney(d.price)}</strong>
          </div>
          <a href="/login.html" class="btn btn-brand w-100 mt-auto">
            <i class="bi bi-calendar2-check me-2"></i>Login to Book
          </a>
        </div>
      </article>
    </div>
  `).join('');
  if (window.AOS) AOS.refresh();
}

function renderProviders(providers) {
  const grid = $('providersGrid');
  if (!grid) return;
  
  if (!providers || providers.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted"><p>No service providers listed yet.</p></div>';
    return;
  }
  
  grid.innerHTML = providers.map((p, i) => `
    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <div class="text-center p-4 h-100 d-flex flex-column" style="background:var(--surface);border:1px solid var(--line);border-radius:16px;">
        <div class="s-avatar provider mx-auto mb-3" style="width:80px;height:80px;font-size:2rem">${p.business_name.charAt(0).toUpperCase()}</div>
        <h5 class="fw-bold">${p.business_name}</h5>
        <p class="text-muted small flex-grow-1">${p.description || 'A verified service provider.'}</p>
        <div><span class="badge bg-success-subtle text-success"><i class="bi bi-patch-check-fill me-1"></i>${p.service_count} Verified Services</span></div>
      </div>
    </div>
  `).join('');
}

function renderTestimonials(testimonials) {
  const grid = $('reviewsGrid');
  if (!grid) return;
  
  if (!testimonials || testimonials.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted"><p>No reviews available yet.</p></div>';
    return;
  }
  
  grid.innerHTML = testimonials.map((r, i) => `
    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <div class="p-4 h-100 d-flex flex-column" style="background:var(--surface);border:1px solid var(--line);border-radius:16px;">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="s-avatar user" style="width:40px;height:40px;font-size:1rem">${r.reviewer_name.charAt(0).toUpperCase()}</div>
            <div>
              <h6 class="mb-0 fw-bold">${r.reviewer_name}</h6>
              <small class="text-muted">Visited ${r.destination_name}</small>
            </div>
          </div>
        </div>
        <div class="mb-3">${starHTML(r.rating)}</div>
        <p class="text-muted small flex-grow-1 mb-0" style="font-style:italic">"${r.comment}"</p>
      </div>
    </div>
  `).join('');
}

let swiperInstance = null;
function renderPackages() {
  const wrap = $('swiperWrapper');
  if (!wrap) return;
  
  wrap.innerHTML = state.packages.map(pkg => `
    <div class="swiper-slide">
      <article class="p-5 d-flex flex-column justify-content-end" style="border-radius:24px;min-height:380px;background:linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url('${pkg.image}') center/cover;">
        <p class="text-warning mb-2" style="font-size:.85rem;font-weight:800;text-transform:uppercase;letter-spacing:1px">Travel Package</p>
        <h3 class="text-white fw-bold mb-2" style="font-size:2rem">${pkg.title}</h3>
        <p style="color:rgba(255,255,255,.8);max-width:600px">${pkg.description}</p>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <span style="background:rgba(255,255,255,.15);backdrop-filter:blur(4px);color:#fff;padding:.4rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700"><i class="bi bi-calendar3 me-2"></i>${pkg.days} Days</span>
          <span style="background:rgba(255,255,255,.15);backdrop-filter:blur(4px);color:#fff;padding:.4rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700"><i class="bi bi-cash-coin me-2"></i>${formatMoney(pkg.price)}</span>
        </div>
        <div>
          <a href="/login.html" class="btn btn-brand">
            <i class="bi bi-calendar-plus me-2"></i>Login to Book
          </a>
        </div>
      </article>
    </div>
  `).join('');

  if (swiperInstance) swiperInstance.destroy(true, true);
  if (window.Swiper) {
    swiperInstance = new Swiper('.packageSwiper', {
      slidesPerView: 1, spaceBetween: 24, loop: state.packages.length > 1,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      effect: 'slide',
    });
  }
}

function heroSearch() {
  state.search   = $('heroSearch').value;
  state.category = $('heroCategory').value;
  state.budget   = $('heroBudget').value;
  const destSearch = $('destinationSearch');
  if (destSearch) destSearch.value = state.search;
  renderChips(); renderDestinations();
  document.querySelector('#destinations')?.scrollIntoView({ behavior: 'smooth' });
}

function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem('tp_theme', mode);
  const icon = $('themeToggle')?.querySelector('i');
  if (icon) icon.className = mode === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';
}

function setupEvents() {
  $('categoryFilters')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    renderChips(); renderDestinations();
  });

  $('destinationSearch')?.addEventListener('input', e => {
    state.search = e.target.value;
    renderDestinations();
  });

  $('sortSelect')?.addEventListener('change', e => {
    state.sort = e.target.value;
    renderDestinations();
  });

  $('heroSearchBtn')?.addEventListener('click', heroSearch);
  $('heroSearch')?.addEventListener('keydown', e => { if (e.key === 'Enter') heroSearch(); });

  $('themeToggle')?.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  const nav = document.querySelector('.glass-nav');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
    const btt = $('backToTop');
    if (btt) btt.classList.toggle('visible', window.scrollY > 300);
  });

  $('backToTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
