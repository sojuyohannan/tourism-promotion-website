/* ── Admin Dashboard JS (Marketplace) ───────────────────── */
'use strict';
if (!Auth.requireRole('admin')) throw new Error('redirect');

const API = '/api';
let stats = null, destinations = [], packages = [], bookings = [], services = [], providers = [], users = [];

document.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('tp_theme') || 'light';
  document.documentElement.dataset.theme = saved;
  document.getElementById('themeToggleBtn').querySelector('i').className = saved==='dark'?'bi bi-sun-fill':'bi bi-moon-stars';
  
  const user = Auth.getUser();
  const initials = (user?.name||'A')[0].toUpperCase();
  document.getElementById('sUserName').textContent = user?.name||'Admin';
  document.getElementById('sAvatar').textContent   = initials;
  document.getElementById('topbarAvatar').textContent = initials;
  
  setupSidebar();
  setupTheme();
  setupForms();
  setupUploadHandling();
  await loadAll();
});

function setupSidebar() {
  const sidebar=document.getElementById('sidebar'), overlay=document.getElementById('sidebarOverlay');
  const open=()=>{sidebar.classList.add('open');overlay.classList.add('active');};
  const close=()=>{sidebar.classList.remove('open');overlay.classList.remove('active');};
  document.getElementById('sidebarToggle')?.addEventListener('click', open);
  document.getElementById('sidebarClose')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.querySelectorAll('.snav[data-panel]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); showPanel(a.dataset.panel); close(); });
  });
  document.getElementById('logoutBtn')?.addEventListener('click', Auth.logout.bind(Auth));
}

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.snav').forEach(a=>a.classList.remove('active'));
  const panel = document.getElementById(`panel-${name}`);
  const nav   = document.querySelector(`.snav[data-panel="${name}"]`);
  if(panel) panel.classList.add('active');
  if(nav)   nav.classList.add('active');
  
  const titles = {overview:'Overview',destinations:'Manage Destinations',packages:'Manage Packages',
    bookings:'All Bookings',services:'Service Approvals',providers:'Manage Providers',reviews:'User Reviews',users:'Registered Tourists'};
  document.getElementById('topbarTitle').textContent = titles[name]||name;
  
  if(name==='users') loadUsers();
  if(name==='reviews') loadReviews();
}

function setupTheme() {
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    localStorage.setItem('tp_theme',next);
    document.getElementById('themeToggleBtn').querySelector('i').className=next==='dark'?'bi bi-sun-fill':'bi bi-moon-stars';
  });
}

function fmt(v){ return `₹ ${Number(v).toLocaleString('en-IN')}`; }
function badge(s){ 
  const c={pending:'bg-warning text-dark',approved:'bg-success',rejected:'bg-danger',active:'bg-success',suspended:'bg-danger'};
  return `<span class="badge ${c[s.toLowerCase()]||'bg-secondary'}">${s}</span>`;
}
function statBadge(s){
  const c={Pending:'status-pending',Confirmed:'status-confirmed',Completed:'status-confirmed',Cancelled:'status-cancelled'};
  return `<span class="${c[s]||'status-pending'}">${s}</span>`;
}

async function loadAll() {
  try {
    const [st, d, p, b, s, prov] = await Promise.all([
      Auth.authFetch(`${API}/analytics/overview`).then(r=>r.json()),
      fetch(`${API}/destinations`).then(r=>r.json()),
      fetch(`${API}/packages`).then(r=>r.json()),
      Auth.authFetch(`${API}/bookings`).then(r=>r.json()),
      Auth.authFetch(`${API}/services/all`).then(r=>r.json()),
      Auth.authFetch(`${API}/providers`).then(r=>r.json()),
    ]);
    stats = st; destinations = d; packages = p; bookings = b; services = s; providers = prov;
  } catch(e) { console.error('Failed to load data', e); }
  
  updateBadges();
  renderOverview();
  renderDestinations();
  renderPackages();
  renderBookings();
  renderServices();
  renderProviders();
}

function updateBadges() {
  const pSvc = services.filter(s=>s.status==='pending').length;
  const pProv = providers.filter(p=>p.profile_status==='pending').length;
  const b1 = document.getElementById('navPendingServices');
  const b2 = document.getElementById('navPendingProviders');
  if(pSvc > 0){ b1.style.display='inline-block'; b1.textContent = pSvc; } else { b1.style.display='none'; }
  if(pProv > 0){ b2.style.display='inline-block'; b2.textContent = pProv; } else { b2.style.display='none'; }
}

// ── OVERVIEW ─────────────────────────────────────────────────────────────
function renderOverview() {
  if(!stats) return;
  document.getElementById('stDests').textContent    = stats.stats.destinations;
  document.getElementById('stBookings').textContent = stats.stats.total_bookings;
  document.getElementById('stUsers').textContent    = stats.stats.tourists;
  document.getElementById('stRevenue').textContent  = fmt(stats.stats.total_revenue);

  document.getElementById('healthProviders').textContent = stats.stats.providers;
  document.getElementById('healthServices').textContent  = stats.stats.approved_services;
  document.getElementById('healthPendingServices').textContent = stats.stats.pending_services;
  document.getElementById('healthPendingProviders').textContent = stats.stats.pending_providers;

  const tbody = document.getElementById('recentBookingsAdmin');
  tbody.innerHTML = stats.recent_bookings.map(b=>`
    <tr>
      <td><strong>${b.tourist_name||'Unknown'}</strong></td>
      <td>${b.destination}</td>
      <td>${new Date(b.travel_date).toLocaleDateString()}</td>
      <td>${badge(b.payment_status)}</td>
      <td>${statBadge(b.status)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted">No bookings yet.</td></tr>';
}

// ── SERVICES APPROVAL ──────────────────────────────────────────────────
function renderServices() {
  const filter = document.getElementById('serviceFilter').value;
  let filtered = services;
  if(filter !== 'all') filtered = services.filter(s=>s.status === filter);
  
  const tbody = document.getElementById('servicesBody');
  tbody.innerHTML = filtered.map(s=>`
    <tr>
      <td>
        <strong>${s.name}</strong><br>
        <small class="text-muted">${s.destination_name || 'No dest'}</small>
      </td>
      <td>${s.business_name || s.provider_name || 'N/A'}<br><small class="text-muted">${s.provider_email || ''}</small></td>
      <td>${s.type}</td>
      <td>${fmt(s.price)}</td>
      <td>${badge(s.status)}</td>
      <td>
        ${s.status==='pending' ? `
          <button class="btn btn-sm btn-success me-1" onclick="approveService('${s.id}')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="rejectService('${s.id}')">Reject</button>
        ` : ''}
        <button class="btn btn-sm btn-outline-secondary ms-1" onclick="deleteService('${s.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="text-center text-muted">No services found.</td></tr>`;
}

async function approveService(id) {
  try {
    await Auth.authFetch(`${API}/services/${id}/approve`, {method:'PATCH'});
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'Service approved',timer:2000,showConfirmButton:false});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function rejectService(id) {
  const { value: reason } = await Swal.fire({ title:'Reason for rejection', input:'text', showCancelButton:true });
  if(!reason) return;
  try {
    await Auth.authFetch(`${API}/services/${id}/reject`, {method:'PATCH',body:JSON.stringify({reason})});
    Swal.fire({toast:true,position:'bottom-end',icon:'info',title:'Service rejected',timer:2000,showConfirmButton:false});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function deleteService(id) {
  if(!confirm('Delete this service permanently?')) return;
  try {
    await Auth.authFetch(`${API}/services/${id}`, {method:'DELETE'});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}

// ── PROVIDERS APPROVAL ─────────────────────────────────────────────────
function renderProviders() {
  document.getElementById('provBadge').textContent = providers.length;
  const tbody = document.getElementById('providersBody');
  tbody.innerHTML = providers.map(p => {
    const isPending = (p.status === 'pending' || p.profile_status === 'pending' || !p.profile_status);
    const statusText = p.profile_status || p.status || 'pending';
    return `
    <tr>
      <td>
        <strong>${p.business_name || p.name || 'Provider Account'}</strong><br>
        <small class="text-muted">${p.email}</small>
      </td>
      <td>${p.owner_name || p.name}</td>
      <td>${p.biz_phone || p.phone || '—'}</td>
      <td>${badge(statusText)}</td>
      <td>
        <div class="d-flex flex-wrap gap-1">
          ${isPending ? `
            <button class="btn btn-sm btn-success me-1" onclick="approveProvider(${p.id})"><i class="bi bi-check-lg me-1"></i>Approve</button>
            <button class="btn btn-sm btn-danger me-1" onclick="rejectProvider(${p.id})"><i class="bi bi-x-lg me-1"></i>Reject</button>
          ` : ''}
          ${p.status === 'active' 
            ? `<button class="btn btn-sm btn-outline-warning" onclick="suspendProvider(${p.id})"><i class="bi bi-pause-circle me-1"></i>Suspend</button>` 
            : `<button class="btn btn-sm btn-outline-success" onclick="activateUser(${p.id})"><i class="bi bi-play-circle me-1"></i>Activate</button>`
          }
          <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${p.id})" title="Delete Provider Account"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>
  `}).join('') || `<tr><td colspan="5" class="text-center text-muted">No providers registered.</td></tr>`;
}

async function approveProvider(id) {
  try {
    await Auth.authFetch(`${API}/providers/${id}/approve`, {method:'PATCH'});
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'Provider approved',timer:2000,showConfirmButton:false});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function rejectProvider(id) {
  const { value: reason } = await Swal.fire({ title:'Reason for rejection', input:'text', showCancelButton:true });
  if(!reason) return;
  try {
    await Auth.authFetch(`${API}/providers/${id}/reject`, {method:'PATCH',body:JSON.stringify({reason})});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function suspendProvider(id) {
  if(!confirm('Suspend this provider? They will not be able to log in.')) return;
  try {
    await Auth.authFetch(`${API}/providers/${id}/suspend`, {method:'PATCH'});
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}

// ── USERS ───────────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    const res = await Auth.authFetch(`${API}/auth/users`);
    users = await res.json();
    const tourists = users.filter(u=>u.role==='user');
    document.getElementById('usersBadge').textContent = tourists.length;
    document.getElementById('usersBody').innerHTML = tourists.map((u)=>`
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone||'—'}</td>
        <td>${badge(u.status)}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          <div class="d-flex gap-1">
            ${u.status === 'active'
              ? `<button class="btn btn-sm btn-outline-warning" onclick="suspendUser(${u.id})"><i class="bi bi-pause-circle me-1"></i>Suspend</button>`
              : `<button class="btn btn-sm btn-outline-success" onclick="activateUser(${u.id})"><i class="bi bi-play-circle me-1"></i>Activate</button>`
            }
            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})" title="Delete Tourist Account"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center text-muted">No users found.</td></tr>';
  } catch(e) { console.error(e); }
}

async function suspendUser(id) {
  try {
    await Auth.authFetch(`${API}/auth/users/${id}/status`, {method:'PATCH',body:JSON.stringify({status:'suspended'})});
    Swal.fire({toast:true,position:'bottom-end',icon:'info',title:'User suspended',timer:2000,showConfirmButton:false});
    await loadUsers();
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function activateUser(id) {
  try {
    await Auth.authFetch(`${API}/auth/users/${id}/status`, {method:'PATCH',body:JSON.stringify({status:'active'})});
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'User activated',timer:2000,showConfirmButton:false});
    await loadUsers();
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}
async function deleteUser(id) {
  if (!confirm('Are you sure you want to permanently delete this account?')) return;
  try {
    await Auth.authFetch(`${API}/auth/users/${id}`, {method:'DELETE'});
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'Account deleted',timer:2000,showConfirmButton:false});
    await loadUsers();
    await loadAll();
  } catch(e) { Swal.fire({icon:'error',text:e.message}); }
}

// ── DESTINATIONS ────────────────────────────────────────────────────────
function renderDestinations() {
  document.getElementById('destBadge').textContent = destinations.length;
  document.getElementById('adminDestList').innerHTML = destinations.map(d=>`
    <div class="admin-record">
      <div>
        <strong>${d.name} ${d.featured?'<span class="badge bg-warning text-dark ms-2">Featured</span>':''}</strong>
        <p>${d.category} · ${d.location} · ${fmt(d.price)}</p>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDest('${d.id}')"><i class="bi bi-trash"></i></button>
      </div>
    </div>
  `).join('') || '<div class="empty-box"><i class="bi bi-geo-alt"></i><h5>No destinations</h5></div>';
  
  // Update package select
  const sel = document.getElementById('pkgDestSelect');
  if(sel) sel.innerHTML = destinations.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
}

async function deleteDest(id) {
  if(!confirm('Delete this destination?')) return;
  try {
    await Auth.authFetch(`${API}/destinations/${id}`,{method:'DELETE'});
    await loadAll();
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'Deleted',timer:1500,showConfirmButton:false});
  } catch(e){ Swal.fire({icon:'error',text:e.message}); }
}

// ── PACKAGES ───────────────────────────────────────────────────────────
function renderPackages() {
  document.getElementById('pkgBadge').textContent = packages.length;
  document.getElementById('adminPkgList').innerHTML = packages.map(p=>`
    <div class="admin-record">
      <div><strong>${p.title}</strong><p>${p.days} days · ${fmt(p.price)}</p></div>
    </div>
  `).join('') || '<div class="empty-box"><i class="bi bi-bag-heart"></i><h5>No packages</h5></div>';
}

// ── BOOKINGS ───────────────────────────────────────────────────────────
function renderBookings() {
  document.getElementById('bookBadge').textContent = bookings.length;
  const tbody = document.getElementById('adminBookingsBody');
  tbody.innerHTML = bookings.map(b=>`
    <tr>
      <td>${b.id}</td>
      <td><strong>${b.tourist_name||b.name}</strong><br><small>${b.phone||b.contact}</small></td>
      <td>${b.destination||b.dest_name}</td>
      <td><small>${(b.services||[]).map(s=>s.service_name).join(', ') || 'No extra services'}</small></td>
      <td>${fmt(b.payment_amount)}</td>
      <td>${new Date(b.travel_date).toLocaleDateString()}</td>
      <td>${badge(b.payment_status)}</td>
      <td>${statBadge(b.status)}</td>
      <td>
        <select class="form-select form-select-sm" onchange="updateBookingStatus(${b.id},this.value)" style="width:110px">
          <option ${b.status==='Pending'?'selected':''}>Pending</option>
          <option ${b.status==='Confirmed'?'selected':''}>Confirmed</option>
          <option ${b.status==='Completed'?'selected':''}>Completed</option>
          <option ${b.status==='Cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="9" class="text-center text-muted py-4">No bookings found.</td></tr>';
}

async function updateBookingStatus(id, status) {
  try {
    await Auth.authFetch(`${API}/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});
    await loadAll();
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:`Status → ${status}`,timer:1500,showConfirmButton:false});
  } catch(e){ Swal.fire({icon:'error',text:e.message}); }
}

// ── REVIEWS ────────────────────────────────────────────────────────────
async function loadReviews() {
  let all = [];
  try {
    const ids = destinations.map(d=>d.id);
    const results = await Promise.all(ids.map(id=>fetch(`${API}/reviews/${id}`).then(r=>r.json()).catch(()=>[])));
    results.forEach((r,i)=>{ r.forEach(rv=>{ rv._destName=destinations[i]?.name||''; }); all=[...all,...r]; });
  } catch {}
  document.getElementById('reviewBadge').textContent = all.length + ' reviews';
  document.getElementById('adminReviewsList').innerHTML = all.map(r=>`
    <div class="admin-record">
      <div>
        <strong>${r.reviewer_name}</strong>
        <p>${r._destName} · ${'⭐'.repeat(Math.round(r.rating))} ${r.rating}/5</p>
        <p class="text-muted small mb-0">${r.comment||''}</p>
      </div>
      <button class="btn btn-sm btn-outline-danger" onclick="deleteReview('${r.id}')"><i class="bi bi-trash"></i></button>
    </div>
  `).join('') || '<div class="empty-box"><i class="bi bi-star"></i><h5>No reviews yet</h5></div>';
}
async function deleteReview(id) {
  if(!confirm('Delete this review?')) return;
  try {
    await Auth.authFetch(`${API}/reviews/${id}`,{method:'DELETE'});
    loadReviews();
  } catch(e){ Swal.fire({icon:'error',text:e.message}); }
}

// ── FORMS & UPLOADS ────────────────────────────────────────────────────
function setupUploadHandling() {
  document.getElementById('destImageFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const fd = new FormData(); fd.append('image', file);
    try {
      const res = await fetch(`${API}/upload`, {method:'POST', body:fd});
      const data = await res.json();
      if(data.url) document.getElementById('destImageUrl').value = data.url;
      else alert(data.error);
    } catch(err) { alert('Upload failed'); }
  });
}

function setupForms() {
  // Add Destination
  document.getElementById('addDestForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    payload.featured = fd.get('featured') ? 1 : 0;
    
    const btn = document.getElementById('addDestBtn');
    btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
    try {
      await Auth.authFetch(`${API}/destinations`,{method:'POST',body:JSON.stringify(payload)});
      await loadAll();
      e.target.reset();
      Swal.fire({ icon:'success', title:'Destination Created!', timer:2000, showConfirmButton:false });
    } catch(err){ Swal.fire({icon:'error',title:'Error',text:err.message}); }
    finally { btn.disabled=false; btn.innerHTML='<i class="bi bi-check2 me-2"></i>Save Destination'; }
  });

  // Add Package
  document.getElementById('addPkgForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.id = `pkg-${Date.now()}`;
    try {
      await Auth.authFetch(`/api/packages`,{method:'POST',body:JSON.stringify(payload)});
      await loadAll();
      e.target.reset();
      Swal.fire({ icon:'success', title:'Package Created!', timer:2000, showConfirmButton:false });
    } catch(err){ Swal.fire({icon:'error',title:'Error',text:err.message}); }
  });
}
