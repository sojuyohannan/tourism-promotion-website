/* ── Provider Dashboard JS (Marketplace) ───────────────────── */
'use strict';
if (!Auth.requireRole('provider')) throw new Error('redirect');

const API = '/api';
let myServices = [], bookings = [], destinations = [], profile = null;
const user = Auth.getUser();

function isServicePerPerson(type) {
  if (!type) return false;
  const t = type.toLowerCase().trim();
  return ['restaurant', 'food', 'adventure activities', 'trekking', 'cultural experience'].includes(t);
}

document.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('tp_theme') || 'light';
  document.documentElement.dataset.theme = saved;
  document.getElementById('themeToggleBtn').querySelector('i').className = saved==='dark'?'bi bi-sun-fill':'bi bi-moon-stars';
  
  const initials = (user?.name||'P')[0].toUpperCase();
  document.getElementById('sUserName').textContent  = user?.name||'Provider';
  document.getElementById('sAvatar').textContent    = initials;
  document.getElementById('topbarAvatar').textContent = initials;
  document.getElementById('profileAvatarBig').textContent = initials;
  
  setupSidebar();
  setupTheme();
  setupForms();
  setupUploadHandling();
  await loadAll();
  const initType = document.getElementById('svcTypeSelect')?.value;
  if (initType) onSvcTypeChange(initType);
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
  
  const titles = {overview:'Overview',services:'My Services',requests:'Booking Requests',profile:'Business Profile'};
  document.getElementById('topbarTitle').textContent = titles[name]||name;
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
  const c={pending:'bg-warning text-dark',approved:'bg-success',rejected:'bg-danger'};
  return `<span class="badge ${c[s.toLowerCase()]||'bg-secondary'}">${s}</span>`;
}
function statBadge(s){
  const c={Pending:'status-pending',Confirmed:'status-confirmed',Completed:'status-confirmed',Cancelled:'status-cancelled'};
  return `<span class="${c[s]||'status-pending'}">${s}</span>`;
}

async function loadAll() {
  try {
    const [prof, d, s, b] = await Promise.all([
      Auth.authFetch(`${API}/providers/profile`).then(r=>r.json()),
      fetch(`${API}/destinations`).then(r=>r.json()),
      Auth.authFetch(`${API}/services/mine`).then(r=>r.json()),
      Auth.authFetch(`${API}/bookings`).then(r=>r.json()),
    ]);
    profile = prof; destinations = d; myServices = s; bookings = b;
  } catch(e) { console.error('Failed to load data', e); }
  
  checkProfileStatus();
  renderOverview();
  renderProfile();
  renderServices();
  renderRequests();
  
  // Populate destinations dropdown for Add Service
  const sel = document.getElementById('destSelect');
  if(sel) sel.innerHTML = destinations.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
}

function checkProfileStatus() {
  const alert = document.getElementById('profileAlert');
  const alertMsg = document.getElementById('profileAlertMsg');
  const btn = document.getElementById('addSvcBtn');
  
  if (btn) btn.disabled = false;

  if (!profile || profile.status === 'pending') {
    alert.classList.add('d-none');
  } else if (profile.status === 'rejected') {
    alert.classList.remove('d-none', 'alert-warning');
    alert.classList.add('alert-danger');
    alertMsg.textContent = 'Your profile was rejected. Please update your details.';
  } else {
    alert.classList.add('d-none');
  }
}

// ── OVERVIEW ─────────────────────────────────────────────────────────────
function renderOverview() {
  const pend = bookings.filter(b=>b.status==='Pending').length;
  document.getElementById('stServices').textContent  = myServices.length;
  document.getElementById('stRequests').textContent  = bookings.length;
  document.getElementById('stPending').textContent   = pend;
  
  // Calc net earnings for THIS provider (only their share of services minus commission)
  let rev = 0;
  bookings.filter(b=>b.payment_status==='paid').forEach(b => {
    b.services.forEach(svc => {
      if(svc.provider_id === user.id) {
        const amt = Number(svc.service_amount || svc.price || 0);
        const comm = Number(svc.commission_amount || (amt * 0.10));
        const net = Number(svc.provider_amount || (amt - comm));
        rev += net;
      }
    });
  });
  document.getElementById('stRevenue').textContent = fmt(rev);

  const tbody = document.getElementById('recentRequestsBody');
  tbody.innerHTML = bookings.slice(0,5).map(b=>{
    const svcs = b.services.filter(s=>s.provider_id===user.id).map(s=>s.service_name).join(', ');
    return `<tr><td><strong>${b.name}</strong></td><td>${b.dest_name}</td><td><small>${svcs}</small></td><td>${new Date(b.travel_date).toLocaleDateString()}</td><td>${statBadge(b.status)}</td></tr>`;
  }).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">No bookings yet.</td></tr>';
}

// ── PROFILE ──────────────────────────────────────────────────────────────
function renderProfile() {
  if (profile) {
    document.getElementById('dispBizName').textContent = profile.business_name;
    document.getElementById('dispOwner').textContent = profile.owner_name;
    document.getElementById('profStatusBadge').innerHTML = badge(profile.status);
    
    const form = document.getElementById('profileForm');
    form.business_name.value = profile.business_name;
    form.owner_name.value = profile.owner_name;
    form.phone.value = profile.phone;
    form.license_no.value = profile.license_no || '';
    form.address.value = profile.address || '';
    form.description.value = profile.description || '';
  }
}

function onSvcTypeChange(type) {
  const priceLabel = document.getElementById('priceLabel');
  const priceInput = document.getElementById('priceInput');
  const capacityLabel = document.getElementById('capacityLabel');
  const capacityInput = document.getElementById('capacityInput');

  let pLabel = 'Base Price (₹) *';
  let pPlaceholder = 'e.g. 1000';
  let cLabel = 'Max Capacity';
  let cPlaceholder = 'e.g. 4';

  switch (type) {
    case 'Taxi':
    case 'Transportation':
    case 'Transport':
      pLabel = 'Rate per KM (₹/km) *';
      pPlaceholder = 'e.g. 18';
      cLabel = 'Vehicle Capacity (Max Passengers)';
      cPlaceholder = 'e.g. 4';
      break;
    case 'Hotel':
    case 'Resort':
    case 'Homestay':
      pLabel = 'Room Rate per Night (₹) *';
      pPlaceholder = 'e.g. 2400';
      cLabel = 'Room Capacity (Max Guests)';
      cPlaceholder = 'e.g. 2';
      break;
    case 'Tour Guide':
      pLabel = 'Guide Fee per Day / Tour (₹) *';
      pPlaceholder = 'e.g. 1200';
      cLabel = 'Max Tour Group Size';
      cPlaceholder = 'e.g. 10';
      break;
    case 'Restaurant':
    case 'Food':
      pLabel = 'Avg Meal Price per Person (₹) *';
      pPlaceholder = 'e.g. 500';
      cLabel = 'Dining Seating Capacity (Seats)';
      cPlaceholder = 'e.g. 30';
      break;
    case 'Adventure Activities':
    case 'Trekking':
    case 'Cultural Experience':
      pLabel = 'Activity Fee per Person (₹) *';
      pPlaceholder = 'e.g. 1000';
      cLabel = 'Max Participant Limit per Group';
      cPlaceholder = 'e.g. 20';
      break;
  }

  if (priceLabel) priceLabel.textContent = pLabel;
  if (priceInput) priceInput.placeholder = pPlaceholder;
  if (capacityLabel) capacityLabel.textContent = cLabel;
  if (capacityInput) capacityInput.placeholder = cPlaceholder;
}

function getServiceDisplayPrice(s) {
  const type = s.type;
  if (s.price_unit === 'per_km' || ['Taxi', 'Transportation', 'Transport'].includes(type)) {
    return `${fmt(s.price)} / km`;
  }
  if (['Hotel', 'Resort', 'Homestay'].includes(type)) {
    return `${fmt(s.price)} / night`;
  }
  if (type === 'Tour Guide') {
    return `${fmt(s.price)} / day`;
  }
  if (['Restaurant', 'Food', 'Adventure Activities', 'Trekking', 'Cultural Experience'].includes(type)) {
    return `${fmt(s.price)} / person`;
  }
  return fmt(s.price);
}

// ── MY SERVICES ──────────────────────────────────────────────────────────
const typeIcons = { Hotel:'bi-house-heart', 'Tour Guide':'bi-person-walking', Taxi:'bi-car-front', Transportation:'bi-bus-front', Restaurant:'bi-cup-hot', Resort:'bi-house-door', Homestay:'bi-house' };

function renderServices() {
  document.getElementById('svcBadge').textContent = myServices.length;
  document.getElementById('providerSvcList').innerHTML = myServices.map(s => {
    const priceDisplay = getServiceDisplayPrice(s);
    return `
    <div class="admin-record">
      <div class="d-flex align-items-start gap-3">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#e8833a,#f4c842);display:grid;place-items:center;color:#fff;font-size:1.2rem;flex-shrink:0">
          <i class="bi ${typeIcons[s.type]||'bi-shop'}"></i>
        </div>
        <div>
          <strong>${s.name}</strong>
          <p>${s.type} · ${s.destination_name || s.location || 'Marketplace'} · <span class="fw-bold text-brand">${priceDisplay}</span></p>
          <p class="text-muted small mb-2">${s.description||''}</p>
          ${badge(s.status)}
          ${s.rejection_reason ? `<p class="text-danger small mt-1 mb-0">Reason: ${s.rejection_reason}</p>` : ''}
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger flex-shrink-0" onclick="deleteSvc('${s.id}')"><i class="bi bi-trash"></i></button>
    </div>
  `}).join('') || '<div class="empty-box"><i class="bi bi-shop-window"></i><h5>No services yet</h5><p>Submit your first service for approval.</p></div>';
}

async function deleteSvc(id) {
  if(!confirm('Remove this service?')) return;
  try {
    await Auth.authFetch(`${API}/services/${id}`,{method:'DELETE'});
    await loadAll();
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:'Removed',timer:1500,showConfirmButton:false});
  } catch(e){ Swal.fire({icon:'error',text:e.message}); }
}

// ── BOOKING REQUESTS ───────────────────────────────────────────────────
function renderRequests() {
  document.getElementById('reqBadge').textContent = bookings.length;
  const tbody = document.getElementById('requestsBody');
  
  const rows = [];
  bookings.forEach(b => {
    const mySvcs = b.services.filter(s => s.provider_id === user.id);
    mySvcs.forEach(s => {
      const gross = Number(s.service_amount || s.price || 0);
      const commPct = Number(s.commission_percentage || 10);
      const comm = Number(s.commission_amount || (gross * (commPct / 100)));
      const net = Number(s.provider_amount || (gross - comm));
      const payBadge = b.payment_status === 'paid' 
        ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Paid</span>'
        : '<span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i>Unpaid</span>';

      rows.push(`
        <tr>
          <td><strong>B${String(b.id).padStart(3, '0')}</strong></td>
          <td><strong>${b.name}</strong><br><small class="text-muted">${b.phone || b.contact}</small></td>
          <td>
            <strong>${s.service_name || s.name}</strong> 
            <span class="badge bg-light text-dark border ms-1">${s.service_type || s.type}</span><br>
            <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${b.dest_name}</small>
          </td>
          <td><strong>${fmt(gross)}</strong></td>
          <td><span class="text-danger">-${fmt(comm)}</span> <small class="text-muted">(${commPct}%)</small></td>
          <td><strong class="text-brand fs-6">${fmt(net)}</strong></td>
          <td>${payBadge}</td>
          <td>${statBadge(b.status)}</td>
          <td>
            <div class="d-flex flex-column gap-1">
              ${b.status === 'Pending' ? `
                <button class="btn btn-sm btn-success px-2 py-1" onclick="updateBookingStatus(${b.id},'Confirmed')"><i class="bi bi-check-circle me-1"></i>Approve</button>
                <button class="btn btn-sm btn-outline-danger px-2 py-1" onclick="updateBookingStatus(${b.id},'Cancelled')"><i class="bi bi-x-circle me-1"></i>Reject</button>
              ` : b.status === 'Confirmed' ? `
                <button class="btn btn-sm btn-primary px-2 py-1" onclick="updateBookingStatus(${b.id},'Completed')"><i class="bi bi-check2-all me-1"></i>Complete</button>
                <button class="btn btn-sm btn-outline-danger px-2 py-1" onclick="updateBookingStatus(${b.id},'Cancelled')"><i class="bi bi-x-circle me-1"></i>Cancel</button>
              ` : `
                <select class="form-select form-select-sm" onchange="updateBookingStatus(${b.id},this.value)">
                  <option ${b.status==='Pending'?'selected':''}>Pending</option>
                  <option ${b.status==='Confirmed'?'selected':''}>Confirmed</option>
                  <option ${b.status==='Completed'?'selected':''}>Completed</option>
                  <option ${b.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
              `}
            </div>
          </td>
        </tr>
      `);
    });
  });

  tbody.innerHTML = rows.join('') || '<tr><td colspan="9" class="text-center text-muted py-4">No booking requests found.</td></tr>';
}

async function updateBookingStatus(id, status) {
  try {
    await Auth.authFetch(`${API}/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});
    await loadAll();
    Swal.fire({toast:true,position:'bottom-end',icon:'success',title:`Status → ${status}`,timer:1500,showConfirmButton:false});
  } catch(e){ Swal.fire({icon:'error',text:e.message}); }
}

// ── FORMS & UPLOADS ────────────────────────────────────────────────────
function setupUploadHandling() {
  document.getElementById('svcImageFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const fd = new FormData(); fd.append('image', file);
    try {
      const res = await fetch(`${API}/upload`, {method:'POST', body:fd});
      const data = await res.json();
      if(data.url) document.getElementById('svcImageUrl').value = data.url;
      else alert(data.error);
    } catch(err) { alert('Upload failed'); }
  });
}

function setupForms() {
  // Save Profile
  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      await Auth.authFetch(`${API}/providers/profile`, {method:'POST', body:JSON.stringify(payload)});
      await loadAll();
      Swal.fire({ icon:'success', title:'Profile Saved!', text:'Sent for admin review.', timer:2000, showConfirmButton:false });
    } catch(err){ Swal.fire({icon:'error',title:'Error',text:err.message}); }
  });

  // Add Service
  document.getElementById('addServiceForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const btn = document.getElementById('addSvcBtn');
    btn.disabled=true; btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
    try {
      await Auth.authFetch(`${API}/services`,{method:'POST',body:JSON.stringify(payload)});
      await loadAll();
      e.target.reset();
      Swal.fire({ icon:'success', title:'Service Submitted!', text:'Pending Admin approval.', timer:2000, showConfirmButton:false });
    } catch(err){ Swal.fire({icon:'error',title:'Error',text:err.message}); }
    finally { btn.disabled=false; btn.innerHTML='<i class="bi bi-check2 me-2"></i>Submit for Approval'; }
  });
}
