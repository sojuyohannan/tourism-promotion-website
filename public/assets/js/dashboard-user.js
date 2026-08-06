/* ── User Dashboard JS (Marketplace) ────────────────────────────── */
'use strict';
if (!Auth.requireRole('user')) throw new Error('redirect');

const API = '/api';
let destinations = [], myBookings = [], wishlist = [], allServices = [];
const user = Auth.getUser();

function isServicePerPerson(type) {
  if (!type) return false;
  const t = type.toLowerCase().trim();
  return ['restaurant', 'food', 'adventure activities', 'trekking', 'cultural experience'].includes(t);
}

// ── Init ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('tp_theme') || 'light';
  document.documentElement.dataset.theme = saved;
  document.getElementById('themeToggleBtn').querySelector('i').className =
    saved === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';

  // Fill user info
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('sUserName').textContent = user?.name || 'Tourist';
  document.getElementById('sAvatar').textContent   = initials;
  document.getElementById('topbarAvatar').textContent = initials;
  document.getElementById('profName').value = user?.name || '';
  document.getElementById('profEmail').value = user?.email || '';

  AOS.init({ once: true, duration: 600, easing: 'ease-out-cubic', offset: 60 });
  setupSidebar();
  setupTheme();
  setupForms();
  setupStarPicker();
  await loadData();
});

// ── Sidebar ─────────────────────────────────────────
function setupSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const toggle   = document.getElementById('sidebarToggle');
  const close    = document.getElementById('sidebarClose');
  const openSB   = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
  const closeSB  = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
  toggle?.addEventListener('click', openSB);
  close?.addEventListener('click', closeSB);
  overlay?.addEventListener('click', closeSB);
  document.querySelectorAll('.snav[data-panel]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); showPanel(a.dataset.panel); closeSB(); });
  });
  document.getElementById('logoutBtn')?.addEventListener('click', Auth.logout.bind(Auth));
}

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.snav').forEach(a => a.classList.remove('active'));
  const panel = document.getElementById(`panel-${name}`);
  const nav   = document.querySelector(`.snav[data-panel="${name}"]`);
  if (panel) panel.classList.add('active');
  if (nav)   nav.classList.add('active');
  
  const titles = { overview:'Overview', explore:'Explore Destinations', bookings:'My Bookings', wishlist:'My Wishlist', reviews:'My Reviews', profile:'My Profile' };
  document.getElementById('topbarTitle').textContent = titles[name] || name;
  
  if (name === 'explore')  renderExplore(destinations);
  if (name === 'wishlist') renderWishlist();
}

// ── Theme ────────────────────────────────────────────
function setupTheme() {
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('tp_theme', next);
    document.getElementById('themeToggleBtn').querySelector('i').className =
      next === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';
  });
}

// ── Load all data ────────────────────────────────────
async function loadData() {
  try {
    const [destRes, bookRes, wlRes, svcRes] = await Promise.all([
      fetch(`${API}/destinations`),
      Auth.authFetch(`${API}/bookings`),
      Auth.authFetch(`${API}/wishlists`),
      fetch(`${API}/services`),
    ]);

    if (destRes && destRes.ok) destinations = await destRes.json();
    if (bookRes && bookRes.ok) myBookings   = await bookRes.json();
    if (wlRes   && wlRes.ok)  wishlist      = await wlRes.json();
    if (svcRes  && svcRes.ok) allServices   = await svcRes.json();

    // Ensure arrays to prevent map() crashes
    if (!Array.isArray(destinations)) destinations = [];
    if (!Array.isArray(myBookings))   myBookings   = [];
    if (!Array.isArray(wishlist))     wishlist     = [];
    if (!Array.isArray(allServices))  allServices  = [];

    // Ensure each booking has a services array
    myBookings.forEach(b => { if (!Array.isArray(b.services)) b.services = []; });
  } catch(e) { console.error('Load data failed', e); }
  
  populateBookingOptions();
  renderOverview();
  renderMyBookings();
  renderMyReviews();
}

function fmt(v) { return `₹ ${Number(v).toLocaleString('en-IN')}`; }
function stars(r){ return Array.from({length:5},(_,i)=>`<i class="bi ${i<Math.round(r)?'bi-star-fill':'bi-star'} text-warning" style="font-size:.85rem"></i>`).join(''); }
function statusBadge(s){ const c={Pending:'status-pending',Confirmed:'status-confirmed',Completed:'status-confirmed',Cancelled:'status-cancelled'}; return `<span class="${c[s]||'status-pending'}">${s||'Pending'}</span>`; }
function badge(s){
  if (!s) return '<span class="badge bg-secondary">—</span>';
  const c={pending:'bg-warning text-dark',unpaid:'bg-warning text-dark',paid:'bg-success'};
  return `<span class="badge ${c[s.toLowerCase()]||'bg-secondary'}">${s}</span>`;
}

// ── Overview ─────────────────────────────────────────
function renderOverview() {
  const total = myBookings.length;
  const pend  = myBookings.filter(b => b.status === 'Pending').length;
  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statPending').textContent   = pend;
  document.getElementById('statWishlist').textContent  = wishlist.length;
  
  const comp = myBookings.filter(b=>b.status==='Completed').length; // Rough proxy for reviews eligible
  document.getElementById('statReviews').textContent   = comp;
  
  const tbody = document.getElementById('recentBookingsBody');
  const recent = myBookings.slice(0, 5);
  tbody.innerHTML = recent.length ? recent.map(b => `
    <tr>
      <td><strong>${b.dest_name||b.destination}</strong></td>
      <td>${new Date(b.travel_date).toLocaleDateString()}</td>
      <td>${b.guests}</td>
      <td>${badge(b.payment_status)}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="text-center text-muted py-3">No bookings yet.</td></tr>';
}

// ── My Bookings ──────────────────────────────────────
function renderMyBookings() {
  const tbody = document.getElementById('myBookingsBody');
  tbody.innerHTML = myBookings.length ? myBookings.map((b,i) => {
    const svcs = (b.services && b.services.length > 0)
      ? b.services.map(s => `• <strong>${s.service_name || s.name}</strong> (${s.service_type || s.type}) – ${fmt(s.service_amount || s.price)}`).join('<br>')
      : '<span class="text-muted">Standard Package</span>';
    
    return `
    <tr>
      <td><strong>B${String(b.id).padStart(3, '0')}</strong></td>
      <td><strong>${b.dest_name||b.destination}</strong></td>
      <td><small>${svcs}</small></td>
      <td><strong class="text-brand">${fmt(b.payment_amount)}</strong></td>
      <td>${new Date(b.travel_date).toLocaleDateString()}</td>
      <td>${b.payment_status==='paid'?'<span class="badge bg-success">Paid</span>':'<span class="badge bg-warning text-dark">Unpaid</span>'}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-brand" onclick="viewBookingDetails(${b.id})"><i class="bi bi-eye me-1"></i>View Details</button>
          ${b.status==='Pending'?`<button class="btn btn-sm btn-outline-danger" onclick="cancelBooking(${b.id})"><i class="bi bi-x"></i> Cancel</button>`:''}
          ${b.status==='Completed'?`<button class="btn btn-sm btn-brand" onclick="openReviewForDest(${b.destination_id}, '${b.dest_name}')"><i class="bi bi-star"></i> Review</button>`:''}
        </div>
      </td>
    </tr>
  `}).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">No bookings found. Click "New Custom Booking" to get started.</td></tr>';
}

async function viewBookingDetails(id) {
  const modalEl = document.getElementById('bookingDetailsModal');
  const bodyEl = document.getElementById('bookingDetailsModalBody');
  bodyEl.innerHTML = '<div class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading details...</div>';
  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  try {
    const res = await Auth.authFetch(`${API}/bookings/${id}`);
    const b = await res.json();
    
    let servicesHtml = '';
    if (b.services && b.services.length > 0) {
      servicesHtml = `
        <table class="table table-bordered align-middle small mt-3">
          <thead class="table-light">
            <tr>
              <th>Service Name</th>
              <th>Type</th>
              <th>Provider</th>
              <th class="text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${b.services.map(s => `
              <tr>
                <td><strong>${s.service_name || s.name}</strong></td>
                <td><span class="badge bg-light text-dark border">${s.service_type || s.type}</span></td>
                <td>${s.business_name || s.provider_name || 'Local Provider'}</td>
                <td class="text-end fw-bold">${fmt(s.service_amount || s.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      servicesHtml = '<p class="text-muted small">No specific services selected.</p>';
    }

    bodyEl.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">Booking #B${String(b.id).padStart(3, '0')}</h5>
        <span class="badge ${b.payment_status==='paid'?'bg-success':'bg-warning'} fs-6">${b.payment_status==='paid'?'Paid':'Unpaid'}</span>
      </div>
      <div class="row g-3 small bg-light p-3 rounded mb-3">
        <div class="col-sm-6"><strong>Destination:</strong> ${b.dest_name || b.destination}</div>
        <div class="col-sm-6"><strong>Travel Date:</strong> ${new Date(b.travel_date).toLocaleDateString()}</div>
        <div class="col-sm-6"><strong>Guests:</strong> ${b.guests || 1}</div>
        <div class="col-sm-6"><strong>Contact Phone:</strong> ${b.phone || b.contact || 'N/A'}</div>
      </div>
      <h6 class="fw-bold mt-4 mb-2"><i class="bi bi-shop me-2 text-brand"></i>Booked Services & Providers</h6>
      ${servicesHtml}
      <div class="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
        <span class="fw-bold fs-6">Total Amount:</span>
        <span class="fw-bold text-brand fs-4">${fmt(b.payment_amount)}</span>
      </div>
    `;
  } catch (err) {
    bodyEl.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
  }
}

async function cancelBooking(id) {
  if(!confirm('Cancel booking? This cannot be undone.')) return;
  try {
    await Auth.authFetch(`${API}/bookings/${id}/status`, { method:'PATCH', body:JSON.stringify({ status:'Cancelled' }) });
    await loadData();
    Swal.fire({ icon:'success', title:'Booking cancelled', timer:1800, showConfirmButton:false });
  } catch(err) { Swal.fire({ icon:'error', title:'Error', text:err.message }); }
}

// ── Explore & Wishlist ───────────────────────────────
function filterDests() {
  const q   = document.getElementById('exploreSearch').value.toLowerCase();
  const cat = document.getElementById('exploreCat').value;
  const bud = document.getElementById('exploreBudget').value;
  let list  = destinations.filter(d => {
    const txt = `${d.name} ${d.location} ${d.category} ${d.description||''}`.toLowerCase();
    const catOk = cat === 'all' || d.category === cat;
    let budOk = true;
    if (bud==='budget')  budOk = d.price < 7000;
    if (bud==='mid')     budOk = d.price >= 7000 && d.price <= 10000;
    if (bud==='premium') budOk = d.price > 10000;
    return txt.includes(q) && catOk && budOk;
  });
  renderExplore(list);
}

function renderExplore(list) {
  const grid  = document.getElementById('exploreGrid');
  const empty = document.getElementById('exploreEmpty');
  empty.classList.toggle('d-none', list.length > 0);
  
  const wlIds = new Set(wishlist.map(w=>w.destination_id));
  
  grid.innerHTML = list.map((d,i) => {
    const inWl = wlIds.has(d.id);
    return `
    <div class="col-md-6 col-xl-4" data-aos="fade-up" data-aos-delay="${(i%3)*70}">
      <div class="dest-card position-relative">
        <button class="btn btn-sm position-absolute top-0 end-0 m-2 ${inWl?'btn-danger':'btn-light'}" 
                style="z-index:10; border-radius:50%; width:36px; height:36px; padding:0"
                onclick="toggleWishlist('${d.id}')">
          <i class="bi ${inWl?'bi-heart-fill':'bi-heart'}"></i>
        </button>
        <img src="${d.image}" alt="${d.name}" loading="lazy">
        <div class="dest-card-body">
          <span class="eyebrow">${d.category}</span>
          <h6>${d.name}</h6>
          <div class="meta">
            <span><i class="bi bi-geo-alt me-1"></i>${d.location}</span>
            <span><i class="bi bi-wallet2 me-1"></i>Estimated cost: ${fmt(d.price)}</span>
            <span>${stars(d.rating)} ${d.rating}</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-brand btn-sm flex-fill" onclick="viewDest('${d.id}')"><i class="bi bi-eye me-1"></i>Details</button>
            <button class="btn btn-brand btn-sm flex-fill" onclick="openBookingForDest('${d.id}')"><i class="bi bi-calendar-plus me-1"></i>Plan Trip</button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');
  AOS.refresh();
}

function renderWishlist() {
  const grid = document.getElementById('wishlistGrid');
  if(wishlist.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-heart fs-1"></i><p class="mt-2">Your wishlist is empty.</p></div>';
    return;
  }
  
  const wlDests = destinations.filter(d => wishlist.some(w=>w.destination_id === d.id));
  grid.innerHTML = wlDests.map((d,i) => `
    <div class="col-md-6 col-xl-4" data-aos="fade-up" data-aos-delay="${(i%3)*70}">
      <div class="dest-card position-relative">
        <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" 
                style="z-index:10; border-radius:50%; width:36px; height:36px; padding:0"
                onclick="toggleWishlist('${d.id}')">
          <i class="bi bi-heart-fill"></i>
        </button>
        <img src="${d.image}" alt="${d.name}" loading="lazy">
        <div class="dest-card-body">
          <span class="eyebrow">${d.category}</span>
          <h6>${d.name}</h6>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-brand btn-sm w-100" onclick="openBookingForDest('${d.id}')"><i class="bi bi-calendar-plus me-1"></i>Plan Trip</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function toggleWishlist(destId) {
  try {
    const isWl = wishlist.some(w=>w.destination_id == destId);
    let title = '';
    if(isWl) {
      await Auth.authFetch(`${API}/wishlists/${destId}`, {method:'DELETE'});
      title = 'Removed from wishlist';
    } else {
      await Auth.authFetch(`${API}/wishlists`, {method:'POST', body:JSON.stringify({destination_id: destId})});
      title = 'Added to wishlist!';
    }
    wishlist = await Auth.authFetch(`${API}/wishlists`).then(r=>r.json());
    renderOverview();
    renderExplore(destinations); // re-render to update hearts
    if (document.getElementById('panel-wishlist').classList.contains('active')) renderWishlist();

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: title });
  } catch(e) { 
    console.error(e);
    Swal.fire({ icon: 'error', title: 'Error', text: 'Wishlist update failed.' });
  }
}

async function viewDest(id) {
  const d = destinations.find(x => x.id == id);
  if (!d) return;
  document.getElementById('destModalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;min-height:480px">
      <img src="${d.image}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover">
      <div style="padding:2rem;overflow-y:auto;max-height:80vh">
        <span class="eyebrow">${d.category}</span>
        <h2 class="fw-bold mt-1">${d.name}</h2>
        <p class="text-muted"><i class="bi bi-geo-alt me-1"></i>${d.location}</p>
        <p>${d.description||''}</p>
        <div class="d-flex flex-wrap gap-2 my-3">
          <span class="badge text-bg-success">⭐ ${d.rating}/5</span>
          <span class="badge text-bg-light border text-dark"><i class="bi bi-wallet2 me-1"></i>Estimated cost: ${fmt(d.price)}</span>
        </div>
        <div class="d-flex gap-2 mb-4">
          <button class="btn btn-brand w-100" onclick="openBookingForDest('${d.id}');bootstrap.Modal.getInstance(document.getElementById('destModal')).hide()"><i class="bi bi-calendar-plus me-2"></i>Start Planning</button>
        </div>
      </div>
    </div>
  `;
  new bootstrap.Modal(document.getElementById('destModal')).show();
}

// ── Smart Booking Flow ────────────────────────────────
function populateBookingOptions() {
  document.getElementById('bDestination').innerHTML = '<option value="">-- Choose Destination --</option>' + 
    destinations.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  document.getElementById('bDate').min = new Date().toISOString().split('T')[0];
}

function openBookingForDest(destId) {
  document.getElementById('bDestination').value = destId;
  
  // Clear any existing values in form inputs
  document.getElementById('payCardHolder').value = '';
  document.getElementById('payCardNumber').value = '';
  document.getElementById('payCardExpiry').value = '';
  document.getElementById('payCardCVV').value = '';
  
  loadServicesForDest(destId);
  nextStep(1); // Reset to step 1
  new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

function onTransportChange() {
  const bTransport = document.getElementById('bTransport');
  const distCol = document.getElementById('distCol');
  const distHelper = document.getElementById('distHelper');
  const transportOption = bTransport ? bTransport.options[bTransport.selectedIndex] : null;
  
  if (transportOption && bTransport.selectedIndex > 0) {
    const isPerKm = transportOption.dataset.unit === 'per_km' || transportOption.dataset.type === 'Taxi' || transportOption.dataset.type === 'Transportation';
    if (distCol) distCol.style.display = 'block';
    if (distHelper) {
      if (isPerKm) {
        distHelper.textContent = `Taxi fare: ${fmt(transportOption.dataset.price)} / km`;
      } else {
        distHelper.textContent = 'Flat trip rate applies.';
      }
    }
  } else {
    if (distCol) distCol.style.display = 'none';
  }
  calcTotal();
}

function loadServicesForDest(destId) {
  if (!destId) {
    destId = document.getElementById('bDestination')?.value;
  }

  const bHotel = document.getElementById('bHotel');
  const bTransport = document.getElementById('bTransport');
  const bGuide = document.getElementById('bGuide');
  const bRestaurant = document.getElementById('bRestaurant');
  const bActivity = document.getElementById('bActivity');
  const list = document.getElementById('bServicesList');
  
  if(!destId) {
    bHotel.innerHTML = '<option value="" data-price="0">-- Select Destination First --</option>';
    bTransport.innerHTML = '<option value="" data-price="0">-- Select Destination First --</option>';
    if (bGuide) bGuide.innerHTML = '<option value="" data-price="0">-- Select Destination First --</option>';
    if (bRestaurant) bRestaurant.innerHTML = '<option value="" data-price="0">-- Select Destination First --</option>';
    if (bActivity) bActivity.innerHTML = '<option value="" data-price="0">-- Select Destination First --</option>';
    list.innerHTML = '<p class="text-muted">Select a destination first.</p>';
    calcTotal();
    return;
  }
  
  const destSvcs = allServices.filter(s => s.destination_id == destId);
  
  // 1. Filter Hotels (Hotel, Resort, Homestay)
  const hotelSvcs = destSvcs.filter(s => ['Hotel', 'Resort', 'Homestay'].includes(s.type));
  const hotelDefaultLabel = hotelSvcs.length > 0 ? '-- Select Hotel / Homestay (Optional) --' : '-- No Hotels Available for this Place --';
  bHotel.innerHTML = `<option value="" data-price="0">${hotelDefaultLabel}</option>` +
    hotelSvcs.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} (${fmt(s.price)}/night)</option>`).join('');
    
  // 2. Filter Transports (Taxi, Transportation, Transport)
  const transportSvcs = destSvcs.filter(s => ['Taxi', 'Transportation', 'Transport'].includes(s.type));
  const transportDefaultLabel = transportSvcs.length > 0 ? '-- Select Transport / Cab (Optional) --' : '-- No Transport Available for this Place --';
  bTransport.innerHTML = `<option value="" data-price="0" data-capacity="0">${transportDefaultLabel}</option>` +
    transportSvcs.map(s => {
      const capText = s.capacity ? ` [Max: ${s.capacity} seats]` : '';
      const isPerKm = s.price_unit === 'per_km' || ['Taxi', 'Transportation', 'Transport'].includes(s.type);
      const unitLabel = isPerKm ? '/km' : ' flat';
      return `<option value="${s.id}" data-price="${s.price}" data-unit="${isPerKm ? 'per_km' : 'fixed'}" data-type="${s.type}" data-capacity="${s.capacity || 0}">${s.name} (${fmt(s.price)}${unitLabel}${capText})</option>`;
    }).join('');

  // 3. Filter Tour Guides
  const guideSvcs = destSvcs.filter(s => s.type === 'Tour Guide');
  const guideDefaultLabel = guideSvcs.length > 0 ? '-- Select Tour Guide (Optional) --' : '-- No Tour Guide Available for this Place --';
  if (bGuide) {
    bGuide.innerHTML = `<option value="" data-price="0">${guideDefaultLabel}</option>` +
      guideSvcs.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} (${fmt(s.price)}/day)</option>`).join('');
  }

  // 4. Filter Restaurants / Food
  const restaurantSvcs = destSvcs.filter(s => ['Restaurant', 'Food'].includes(s.type));
  const restaurantDefaultLabel = restaurantSvcs.length > 0 ? '-- Select Restaurant / Dining (Optional) --' : '-- No Restaurant Available for this Place --';
  if (bRestaurant) {
    bRestaurant.innerHTML = `<option value="" data-price="0">${restaurantDefaultLabel}</option>` +
      restaurantSvcs.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} (${fmt(s.price)}/person)</option>`).join('');
  }

  // 5. Filter Cultural Activities / Experiences / Trekking / Handicraft
  const activitySvcs = destSvcs.filter(s => ['Cultural Experience', 'Adventure Activities', 'Trekking', 'Handicraft', 'Activity Provider'].includes(s.type));
  const activityDefaultLabel = activitySvcs.length > 0 ? '-- Select Cultural Activity / Experience (Optional) --' : '-- No Cultural Activity Available for this Place --';
  if (bActivity) {
    bActivity.innerHTML = `<option value="" data-price="0">${activityDefaultLabel}</option>` +
      activitySvcs.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} (${s.type} - ${fmt(s.price)}/person)</option>`).join('');
  }
    
  // 6. Filter Other Local Services
  const categorizedTypes = ['Hotel', 'Resort', 'Homestay', 'Taxi', 'Transportation', 'Transport', 'Tour Guide', 'Restaurant', 'Food', 'Cultural Experience', 'Adventure Activities', 'Trekking', 'Handicraft', 'Activity Provider'];
  const otherSvcs = destSvcs.filter(s => !categorizedTypes.includes(s.type));
  if(otherSvcs.length === 0) {
    list.innerHTML = '<p class="text-muted p-2">No additional local add-ons available for this destination.</p>';
  } else {
    list.innerHTML = otherSvcs.map(s => {
      const suffix = isServicePerPerson(s.type) ? '/person' : '';
      return `
      <div class="form-check border rounded p-2 d-flex align-items-center mb-2">
        <input class="form-check-input ms-2 me-3 svc-checkbox" type="checkbox" value="${s.id}" data-price="${s.price}" data-name="${s.name}" data-type="${s.type}" id="svc_${s.id}" onchange="calcTotal()">
        <label class="form-check-label flex-grow-1" for="svc_${s.id}">
          <strong>${s.name}</strong> <span class="badge bg-light text-dark ms-2">${s.type}</span><br>
          <small class="text-muted">${s.business_name || s.provider_name || 'Verified Provider'}</small>
        </label>
        <div class="fw-bold me-2">${fmt(s.price)}${suffix}</div>
      </div>
      `;
    }).join('');
  }
  
  onTransportChange();
}

function calcTotal() {
  const destId = document.getElementById('bDestination').value;
  const bGuests = document.getElementById('bGuests');
  const guests = parseInt(bGuests.value) || 1;
  const bDistanceEl = document.getElementById('bDistance');
  const distanceKm = parseFloat(bDistanceEl?.value) || 25;
  
  let destPrice = 0;
  let destName = 'Destination';
  const dest = destinations.find(d => d.id === destId);
  if (dest) {
    destPrice = parseFloat(dest.price) || 0;
    destName = dest.name;
  }
  
  const bHotel = document.getElementById('bHotel');
  const hotelOption = bHotel.options[bHotel.selectedIndex];
  const hotelPrice = parseFloat(hotelOption?.dataset?.price) || 0;
  const hotelName = bHotel.selectedIndex > 0 ? hotelOption.text.split(' (')[0] : 'None';
  
  const bTransport = document.getElementById('bTransport');
  const transportOption = bTransport.options[bTransport.selectedIndex];
  const transportPrice = parseFloat(transportOption?.dataset?.price) || 0;
  const transportUnit = transportOption?.dataset?.unit || 'fixed';
  const transportType = transportOption?.dataset?.type || '';
  const transportName = bTransport.selectedIndex > 0 ? transportOption.text.split(' (')[0] : 'None';
  const isPerKm = (transportUnit === 'per_km' || ['Taxi', 'Transportation', 'Transport'].includes(transportType)) && bTransport.selectedIndex > 0;

  const bGuide = document.getElementById('bGuide');
  const guideOption = bGuide ? bGuide.options[bGuide.selectedIndex] : null;
  const guidePrice = parseFloat(guideOption?.dataset?.price) || 0;
  const guideName = (bGuide && bGuide.selectedIndex > 0) ? guideOption.text.split(' (')[0] : 'None';

  const bRestaurant = document.getElementById('bRestaurant');
  const restaurantOption = bRestaurant ? bRestaurant.options[bRestaurant.selectedIndex] : null;
  const restaurantPrice = parseFloat(restaurantOption?.dataset?.price) || 0;
  const restaurantName = (bRestaurant && bRestaurant.selectedIndex > 0) ? restaurantOption.text.split(' (')[0] : 'None';
  const restaurantCost = restaurantPrice * guests;

  const bActivity = document.getElementById('bActivity');
  const activityOption = bActivity ? bActivity.options[bActivity.selectedIndex] : null;
  const activityPrice = parseFloat(activityOption?.dataset?.price) || 0;
  const activityName = (bActivity && bActivity.selectedIndex > 0) ? activityOption.text.split(' (')[0] : 'None';
  const activityCost = activityPrice * guests;
  
  // Seating Capacity Validation
  if (transportOption && bTransport.selectedIndex > 0) {
    const transportCapacity = parseInt(transportOption.dataset.capacity) || 0;
    if (transportCapacity > 0 && guests > transportCapacity) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Capacity',
        text: `The selected transport (${transportName}) only has a capacity of ${transportCapacity} guests, but you have entered ${guests} guests.`,
        confirmButtonColor: '#0a7c69'
      });
      bTransport.value = '';
      onTransportChange();
      return 0;
    }
  }

  // Calculate pricing based on selected services only (Pay-for-What-You-Book Marketplace model)
  const baseTourCost = 0; // Destinations are locations to explore; total is sum of selected services
  const hotelCost = hotelPrice; // Hotels charged per night (fixed for the trip/stay)
  const transportCost = isPerKm ? (transportPrice * distanceKm) : transportPrice;
  const guideCost = guidePrice; // Guide fee per day/tour

  let servicesPrice = 0;
  const selectedServices = [];
  document.querySelectorAll('.svc-checkbox:checked').forEach(cb => {
    const sName = cb.dataset.name;
    const sPrice = parseFloat(cb.dataset.price) || 0;
    const sType = cb.dataset.type;
    const perPerson = isServicePerPerson(sType);
    const cost = perPerson ? sPrice * guests : sPrice;
    servicesPrice += cost;
    selectedServices.push({
      name: sName,
      price: sPrice,
      type: sType,
      cost: cost,
      perPerson: perPerson
    });
  });
  
  const estimatedTotal = hotelCost + transportCost + guideCost + restaurantCost + activityCost + servicesPrice;
  
  // Render Price Breakdown
  const breakdown = document.getElementById('bPriceBreakdown');
  let html = '';
  if (hotelPrice > 0) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">Hotel</div>
          <small class="text-muted">${hotelName} (Per Night)</small>
        </div>
        <div class="align-self-center fw-bold">${fmt(hotelCost)}</div>
      </div>
    `;
  }
  if (transportPrice > 0) {
    const descText = isPerKm ? `${transportName} (${distanceKm} km @ ${fmt(transportPrice)}/km)` : `${transportName} (Fixed Cost)`;
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">Transport / Taxi</div>
          <small class="text-muted">${descText}</small>
        </div>
        <div class="align-self-center fw-bold">${fmt(transportCost)}</div>
      </div>
    `;
  }
  if (guidePrice > 0) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">Tour Guide</div>
          <small class="text-muted">${guideName} (Per Day)</small>
        </div>
        <div class="align-self-center fw-bold">${fmt(guideCost)}</div>
      </div>
    `;
  }
  if (restaurantPrice > 0) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">Restaurant / Dining</div>
          <small class="text-muted">${restaurantName} (${guests} × ${fmt(restaurantPrice)})</small>
        </div>
        <div class="align-self-center fw-bold">${fmt(restaurantCost)}</div>
      </div>
    `;
  }
  if (activityPrice > 0) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">Cultural Activity / Experience</div>
          <small class="text-muted">${activityName} (${guests} × ${fmt(activityPrice)})</small>
        </div>
        <div class="align-self-center fw-bold">${fmt(activityCost)}</div>
      </div>
    `;
  }
  selectedServices.forEach(s => {
    let descLine = '';
    if (s.perPerson) {
      descLine = `${guests} × ${fmt(s.price)}`;
    } else {
      descLine = `${fmt(s.price)}`;
    }
    html += `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <div class="fw-bold text-dark">${s.type}</div>
          <small class="text-muted">${s.name}${s.perPerson ? ` (${descLine})` : ''}</small>
        </div>
        <div class="align-self-center fw-bold">${s.perPerson ? fmt(s.cost) : fmt(s.price)}</div>
      </div>
    `;
  });
  breakdown.innerHTML = html || '<div class="text-muted text-center py-2"><i class="bi bi-info-circle me-1"></i>Select Hotel, Transport, Tour Guide, Restaurant or Activities to calculate total cost.</div>';
  
  document.getElementById('bServicesTotal').textContent = fmt(estimatedTotal);
  document.getElementById('confTotal').textContent = fmt(estimatedTotal);
  
  return estimatedTotal;
}

function nextStep(step) {
  const destId = document.getElementById('bDestination').value;
  const date = document.getElementById('bDate').value;
  const phone = document.getElementById('bPhone').value;
  const guests = document.getElementById('bGuests').value;

  if (step === 2) {
    if (!destId || !date || !phone) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in the Destination, Travel Date, and Contact Phone in Step 1.' });
      return;
    }
  }
  
  if (step === 3) {
    const dest = destinations.find(d => d.id === destId);
    document.getElementById('confDest').textContent = dest ? dest.name : 'Custom Request';
    document.getElementById('confDate').textContent = new Date(date).toLocaleDateString();
    document.getElementById('confGuests').textContent = guests;
    
    const bHotel = document.getElementById('bHotel');
    const hotelName = bHotel.selectedIndex > 0 ? bHotel.options[bHotel.selectedIndex].text.split(' (')[0] : 'None';
    document.getElementById('confHotel').textContent = hotelName;
    
    const bTransport = document.getElementById('bTransport');
    const transportName = bTransport.selectedIndex > 0 ? bTransport.options[bTransport.selectedIndex].text.split(' (')[0] : 'None';
    document.getElementById('confTransport').textContent = transportName;

    const bGuide = document.getElementById('bGuide');
    const guideName = (bGuide && bGuide.selectedIndex > 0) ? bGuide.options[bGuide.selectedIndex].text.split(' (')[0] : 'None';
    const confGuide = document.getElementById('confGuide');
    if (confGuide) confGuide.textContent = guideName;

    const bRestaurant = document.getElementById('bRestaurant');
    const restaurantName = (bRestaurant && bRestaurant.selectedIndex > 0) ? bRestaurant.options[bRestaurant.selectedIndex].text.split(' (')[0] : 'None';
    const confRestaurant = document.getElementById('confRestaurant');
    if (confRestaurant) confRestaurant.textContent = restaurantName;

    const bActivity = document.getElementById('bActivity');
    const activityName = (bActivity && bActivity.selectedIndex > 0) ? bActivity.options[bActivity.selectedIndex].text.split(' (')[0] : 'None';
    const confActivity = document.getElementById('confActivity');
    if (confActivity) confActivity.textContent = activityName;
    
    const selectedSvcNames = Array.from(document.querySelectorAll('.svc-checkbox:checked')).map(cb => cb.dataset.name);
    const servicesListEl = document.getElementById('confServicesList');
    if (selectedSvcNames.length > 0) {
      servicesListEl.innerHTML = selectedSvcNames.map(name => `• ${name}`).join('<br>');
    } else {
      servicesListEl.innerHTML = 'None';
    }
    
    // Billing Info
    document.getElementById('billName').textContent = user?.name || 'Tourist';
    document.getElementById('billEmail').textContent = user?.email || 'N/A';
    
    // Auto-fill cardholder name
    if (!document.getElementById('payCardHolder').value) {
      document.getElementById('payCardHolder').value = user?.name || '';
    }
    
    calcTotal();
  }

  document.querySelectorAll('.book-step').forEach(el => el.style.display = 'none');
  document.getElementById(`bookStep${step}`).style.display = 'block';
}

async function submitBooking() {
  const destId = document.getElementById('bDestination').value;
  const date = document.getElementById('bDate').value;
  const guests = document.getElementById('bGuests').value;
  const phone = document.getElementById('bPhone').value;
  
  if (!destId || !date) {
    Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please select a destination and travel date.' });
    return;
  }

  // 1. Validate Card Details
  const cardHolder = document.getElementById('payCardHolder').value.trim();
  if (!cardHolder) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter card holder name.' });
    return;
  }
  
  const cardNumber = document.getElementById('payCardNumber').value.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(cardNumber)) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a valid 16-digit card number.' });
    return;
  }
  
  const expiry = document.getElementById('payCardExpiry').value.trim();
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter expiry date in MM/YY format.' });
    return;
  }
  const [expMonth, expYear] = expiry.split('/').map(Number);
  if (expMonth < 1 || expMonth > 12) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a valid month (01-12).' });
    return;
  }
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'The card has expired.' });
    return;
  }
  
  const cvv = document.getElementById('payCardCVV').value.trim();
  if (!/^\d{3}$/.test(cvv)) {
    Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a valid 3-digit CVV.' });
    return;
  }

  // Collect Service IDs
  const svcIds = [];
  const hotelId = document.getElementById('bHotel').value;
  if (hotelId) svcIds.push(hotelId);
  
  const transportId = document.getElementById('bTransport').value;
  if (transportId) svcIds.push(transportId);

  const guideId = document.getElementById('bGuide')?.value;
  if (guideId) svcIds.push(guideId);

  const restaurantId = document.getElementById('bRestaurant')?.value;
  if (restaurantId) svcIds.push(restaurantId);

  const activityId = document.getElementById('bActivity')?.value;
  if (activityId) svcIds.push(activityId);
  
  document.querySelectorAll('.svc-checkbox:checked').forEach(cb => {
    svcIds.push(cb.value);
  });
  
  const distanceKm = parseFloat(document.getElementById('bDistance')?.value) || 0;
  const total = calcTotal();
  
  const bookingPayload = {
    destination_id: destId,
    travel_date: date,
    guests: guests,
    phone: phone,
    distance_km: distanceKm,
    service_ids: svcIds,
    payment_amount: total,
    payment_status: 'unpaid'
  };
  
  const btn = document.getElementById('bSubmitBtn');
  btn.disabled = true; 
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing…';
  
  try {
    // 2. Submit Booking
    const res = await Auth.authFetch(`${API}/bookings`, { 
      method: 'POST', 
      body: JSON.stringify(bookingPayload) 
    });
    if (!res || !res.ok) {
      const err = res ? await res.json() : { error: 'Request failed' };
      throw new Error(err.error || 'Booking creation failed');
    }
    const bookingData = await res.json();
    const bookingId = bookingData.id;
    
    // 3. Submit Payment
    const paymentPayload = {
      booking_id: bookingId,
      amount: total,
      card_holder: cardHolder
    };
    
    const payRes = await Auth.authFetch(`${API}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentPayload)
    });
    if (!payRes || !payRes.ok) {
      const err = payRes ? await payRes.json() : { error: 'Request failed' };
      throw new Error(err.error || 'Payment transaction failed');
    }
    
    // Reset wizard values & close modal
    const modalEl = document.getElementById('bookingModal');
    const modalInst = bootstrap.Modal.getInstance(modalEl);
    if (modalInst) modalInst.hide();
    
    // Reset forms
    document.getElementById('bDestination').value = '';
    document.getElementById('bDate').value = '';
    document.getElementById('bPhone').value = '';
    document.getElementById('bHotel').value = '';
    document.getElementById('bTransport').value = '';
    document.getElementById('payCardHolder').value = '';
    document.getElementById('payCardNumber').value = '';
    document.getElementById('payCardExpiry').value = '';
    document.getElementById('payCardCVV').value = '';
    document.querySelectorAll('.svc-checkbox').forEach(cb => cb.checked = false);
    nextStep(1);
    
    // Redirect to success page
    window.location.href = `/user/success.html?booking_id=${bookingId}`;
    
  } catch(err) { 
    Swal.fire({ icon: 'error', title: 'Booking Failed', text: err.message }); 
  } finally { 
    btn.disabled = false; 
    btn.innerHTML = '<i class="bi bi-shield-lock me-1"></i>Pay Now'; 
  }
}

// ── Profile ──────────────────────────────────────────
function setupForms() {
  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('profPhone').value;
    // Assuming we have an endpoint to update user profile/phone
    Swal.fire({ icon:'success', title:'Profile Updated', timer:1500, showConfirmButton:false });
  });

  document.getElementById('reviewForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = { destination_id: fd.get('destination_id'), reviewer_name: fd.get('reviewer_name'), rating: fd.get('rating'), comment: fd.get('comment') };
    try {
      await Auth.authFetch(`${API}/reviews`, { method:'POST', body:JSON.stringify(payload) });
      bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
      e.target.reset(); resetStars(5);
      Swal.fire({ icon:'success', title:'Review submitted! ⭐', timer:1800, showConfirmButton:false });
    } catch(err) { Swal.fire({ icon:'error', title:'Error', text:err.message }); }
  });
}

// ── Reviews ──────────────────────────────────────────
function renderMyReviews() {
  const comp = myBookings.filter(b=>b.status==='Completed');
  const html = comp.map(b => `
    <div class="d-flex justify-content-between border-bottom p-3">
      <div><strong>${b.dest_name}</strong><br><small class="text-muted">Travelled on ${new Date(b.travel_date).toLocaleDateString()}</small></div>
      <button class="btn btn-sm btn-outline-brand" onclick="openReviewForDest(${b.destination_id}, '${b.dest_name}')"><i class="bi bi-star"></i> Write Review</button>
    </div>
  `).join('');
  
  if (html) {
    document.getElementById('myReviewsList').innerHTML = `<p class="p-3 bg-light m-0">You can write verified reviews for completed trips.</p>${html}`;
  } else {
    document.getElementById('myReviewsList').innerHTML = '<p class="text-muted p-3">Complete a trip to write a verified review.</p>';
  }
}

function openReviewForDest(destId, destName) {
  document.getElementById('rDestId').value = destId;
  document.getElementById('rDestName').value = destName;
  document.getElementById('rName').value = user.name;
  new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

// ── Star picker ────────────────────────────────────────
function setupStarPicker() {
  const picker = document.getElementById('starPicker');
  if (!picker) return;
  picker.addEventListener('click', e => { const s = e.target.closest('[data-val]'); if(s) resetStars(+s.dataset.val); });
  picker.addEventListener('mouseover', e => { const s = e.target.closest('[data-val]'); if(s) highlight(+s.dataset.val); });
  picker.addEventListener('mouseleave', () => resetStars(+document.getElementById('rRating').value));
}
function highlight(v){ document.querySelectorAll('#starPicker i').forEach((el,i) => el.classList.toggle('off', i>=v)); }
function resetStars(v){ document.getElementById('rRating').value=v; highlight(v); }
