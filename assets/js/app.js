const destinations = [
    {
        id: 'munnar',
        name: 'Munnar Hills',
        location: 'Kerala, India',
        category: 'Hill Station',
        price: 7500,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1000&q=85',
        description: 'Tea gardens, cool weather, viewpoints, waterfalls, and peaceful nature trails for family tourism.',
        highlights: ['Tea estate walk', 'Waterfall viewpoints', 'Local food experience', 'Homestay support']
    },
    {
        id: 'goa',
        name: 'Goa Beaches',
        location: 'Goa, India',
        category: 'Beach',
        price: 6500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=85',
        description: 'Coastal destination known for beaches, seafood, water sports, music, and heritage streets.',
        highlights: ['Beach route planning', 'Seafood restaurants', 'Water sports', 'Heritage walk']
    },
    {
        id: 'mysore',
        name: 'Mysore Palace',
        location: 'Karnataka, India',
        category: 'Heritage',
        price: 5200,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1000&q=85',
        description: 'Historical palace destination with royal architecture, cultural exhibitions, lights, and markets.',
        highlights: ['Palace visit', 'Museum tour', 'Traditional market', 'Cultural evening']
    },
    {
        id: 'corbett',
        name: 'Jim Corbett National Park',
        location: 'Uttarakhand, India',
        category: 'Wildlife',
        price: 9800,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1000&q=85',
        description: 'Wildlife tourism with safari experiences, forest stays, and nature education.',
        highlights: ['Safari assistance', 'Forest stay', 'Nature guide', 'Transport support']
    },
    {
        id: 'varanasi',
        name: 'Varanasi Ghats',
        location: 'Uttar Pradesh, India',
        category: 'Pilgrimage',
        price: 5800,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1000&q=85',
        description: 'Spiritual and cultural tourism with riverfront rituals, temples, music, and traditional crafts.',
        highlights: ['Ghat walk', 'Temple visit', 'Boat ride', 'Craft market']
    },
    {
        id: 'jaipur',
        name: 'Jaipur Heritage Trail',
        location: 'Rajasthan, India',
        category: 'Heritage',
        price: 8400,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=85',
        description: 'Forts, markets, local art, food trails, and architectural heritage in the Pink City.',
        highlights: ['Fort visit', 'Textile market', 'Food walk', 'Local guide']
    }
];

const services = [
    { id: 'hotel-1', name: 'Green Valley Homestay', type: 'Hotel', location: 'Munnar', price: 2400, icon: 'bi-house-heart', description: 'Comfortable rooms near tea gardens with breakfast and sightseeing support.' },
    { id: 'guide-1', name: 'Heritage Walk Guide', type: 'Guide', location: 'Mysore', price: 1200, icon: 'bi-person-walking', description: 'Certified local guide for palace, museum, and market visits.' },
    { id: 'transport-1', name: 'Coastal Cab Service', type: 'Transport', location: 'Goa', price: 1800, icon: 'bi-taxi-front', description: 'Airport pickup, beach route travel, and day trip transportation.' },
    { id: 'food-1', name: 'Spice Trail Restaurant', type: 'Restaurant', location: 'Kerala', price: 600, icon: 'bi-cup-hot', description: 'Local food experience with vegetarian and non-vegetarian meal options.' },
    { id: 'craft-1', name: 'Craft Market Collective', type: 'Handicraft', location: 'Varanasi', price: 350, icon: 'bi-bag-heart', description: 'Handmade textiles, souvenirs, and artisan products.' },
    { id: 'guide-2', name: 'Jaipur Local Expert', type: 'Guide', location: 'Jaipur', price: 1500, icon: 'bi-map', description: 'Curated fort, bazaar, and food tours with flexible timing.' }
];

const packages = [
    { id: 'pkg-munnar', title: 'Munnar Nature Escape', destination: 'munnar', days: 3, price: 7500, image: 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1400&q=85', description: 'Tea garden visit, waterfall sightseeing, local food, and homestay support.' },
    { id: 'pkg-goa', title: 'Goa Coastal Weekend', destination: 'goa', days: 2, price: 6500, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=85', description: 'Beach visits, transport support, seafood restaurants, and cultural walk.' },
    { id: 'pkg-mysore', title: 'Mysore Heritage Tour', destination: 'mysore', days: 2, price: 5200, image: 'https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1400&q=85', description: 'Palace visit, museum, local guide, market walk, and cultural evening.' },
    { id: 'pkg-corbett', title: 'Wildlife Safari Plan', destination: 'corbett', days: 3, price: 9800, image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=85', description: 'Forest stay, safari assistance, transport coordination, and nature guide support.' }
];

const events = [
    { title: 'Local Food Festival', location: 'Goa', date: '2026-07-12', description: 'A weekend event promoting local cuisine and small food businesses.' },
    { title: 'Handicraft Exhibition', location: 'Varanasi', date: '2026-08-05', description: 'An exhibition for local artisans, textiles, and handmade souvenirs.' },
    { title: 'Tea Garden Cultural Walk', location: 'Munnar', date: '2026-09-18', description: 'A guided community walk through tea estates and local culture.' },
    { title: 'Mysore Heritage Evening', location: 'Mysore', date: '2026-10-03', description: 'Traditional music, palace lighting, and cultural performances.' }
];

const store = {
    get(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

const appState = {
    category: 'all',
    search: '',
    sort: 'featured',
    budget: 'all',
    customDestinations: store.get('tp_custom_destinations', []),
    customServices: store.get('tp_custom_services', []),
    bookings: store.get('tp_bookings', [
        { destination: 'Munnar Hills', package: 'Munnar Nature Escape', date: '2026-07-20', guests: 2, status: 'Pending' }
    ]),
    reviews: store.get('tp_reviews', [
        { destination: 'munnar', name: 'Tourist User', rating: 5, comment: 'Beautiful destination with excellent local hospitality.' },
        { destination: 'mysore', name: 'Tourist User', rating: 4, comment: 'Great heritage experience and useful guide support.' }
    ])
};

const elements = {
    nav: document.querySelector('.glass-nav'),
    categoryFilters: document.querySelector('#categoryFilters'),
    destinationGrid: document.querySelector('#destinationGrid'),
    destinationSearch: document.querySelector('#destinationSearch'),
    sortSelect: document.querySelector('#sortSelect'),
    heroSearch: document.querySelector('#heroSearch'),
    heroCategory: document.querySelector('#heroCategory'),
    heroBudget: document.querySelector('#heroBudget'),
    serviceGrid: document.querySelector('#serviceGrid'),
    packageCarouselInner: document.querySelector('#packageCarouselInner'),
    eventList: document.querySelector('#eventList'),
    emptyState: document.querySelector('#emptyState'),
    bookingDestination: document.querySelector('#bookingDestination'),
    bookingPackage: document.querySelector('#bookingPackage'),
    bookingForm: document.querySelector('#bookingForm'),
    bookingTable: document.querySelector('#bookingTable'),
    adminDestinationForm: document.querySelector('#adminDestinationForm'),
    adminDestinationList: document.querySelector('#adminDestinationList'),
    providerServiceForm: document.querySelector('#providerServiceForm'),
    providerServiceList: document.querySelector('#providerServiceList'),
    destinationModalBody: document.querySelector('#destinationModalBody'),
    reviewForm: document.querySelector('#reviewForm'),
    themeToggle: document.querySelector('#themeToggle'),
    toastMessage: document.querySelector('#toastMessage')
};

let destinationModal;
let bookingModal;
let reviewModal;
let appToast;

function allDestinations() {
    return [...destinations, ...appState.customDestinations];
}

function allServices() {
    return [...services, ...appState.customServices];
}

function formatMoney(value) {
    return `Rs. ${Number(value).toLocaleString('en-IN')}`;
}

function showToast(message) {
    elements.toastMessage.textContent = message;
    appToast.show();
}

function renderCategories() {
    const categories = ['all', ...new Set(allDestinations().map((item) => item.category))];
    elements.categoryFilters.innerHTML = categories.map((category) => `
        <button class="filter-chip ${appState.category === category ? 'active' : ''}" type="button" data-category="${category}">
            ${category === 'all' ? 'All' : category}
        </button>
    `).join('');
}

function matchesBudget(destination) {
    if (appState.budget === 'budget') {
        return destination.price < 7000;
    }
    if (appState.budget === 'mid') {
        return destination.price >= 7000 && destination.price <= 10000;
    }
    if (appState.budget === 'premium') {
        return destination.price > 10000;
    }
    return true;
}

function filteredDestinations() {
    const query = appState.search.toLowerCase();
    const filtered = allDestinations().filter((destination) => {
        const text = `${destination.name} ${destination.location} ${destination.category} ${destination.description}`.toLowerCase();
        const matchesCategory = appState.category === 'all' || destination.category === appState.category;
        return text.includes(query) && matchesCategory && matchesBudget(destination);
    });

    return filtered.sort((a, b) => {
        if (appState.sort === 'rating') {
            return b.rating - a.rating;
        }
        if (appState.sort === 'priceLow') {
            return a.price - b.price;
        }
        if (appState.sort === 'priceHigh') {
            return b.price - a.price;
        }
        return 0;
    });
}

function renderDestinations() {
    const items = filteredDestinations();
    elements.emptyState.classList.toggle('d-none', items.length > 0);
    elements.destinationGrid.innerHTML = items.map((destination) => `
        <div class="col-md-6 col-xl-4 reveal is-visible">
            <article class="destination-card">
                <div class="destination-image">
                    <img src="${destination.image}" alt="${destination.name}">
                    <span class="destination-badge">${destination.category}</span>
                </div>
                <div class="p-4">
                    <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
                        <h3 class="h5 fw-bold mb-0">${destination.name}</h3>
                        <span class="rating-pill"><i class="bi bi-star-fill text-warning"></i>${destination.rating}</span>
                    </div>
                    <p class="text-muted mb-3">${destination.description}</p>
                    <div class="card-meta mb-4">
                        <span><i class="bi bi-geo-alt me-1"></i>${destination.location}</span>
                        <span><i class="bi bi-wallet2 me-1"></i>${formatMoney(destination.price)}</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-brand flex-fill" data-action="details" data-id="${destination.id}">Details</button>
                        <button class="btn btn-brand flex-fill" data-action="book" data-id="${destination.id}">Book</button>
                    </div>
                </div>
            </article>
        </div>
    `).join('');
}

function renderServices() {
    elements.serviceGrid.innerHTML = allServices().map((service) => `
        <div class="col-md-6 col-xl-4 reveal is-visible">
            <article class="service-card">
                <div class="d-flex align-items-start gap-3 mb-3">
                    <div class="service-icon"><i class="bi ${service.icon || 'bi-shop'}"></i></div>
                    <div>
                        <span class="eyebrow">${service.type}</span>
                        <h3 class="h5 fw-bold mb-0">${service.name}</h3>
                    </div>
                </div>
                <p class="text-muted">${service.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-geo-alt me-1"></i>${service.location}</span>
                    <strong>${formatMoney(service.price)}</strong>
                </div>
            </article>
        </div>
    `).join('');
}

function renderPackages() {
    elements.packageCarouselInner.innerHTML = packages.map((item, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <article class="package-slide" style="--package-image: url('${item.image}')">
                <span class="eyebrow text-warning">Package</span>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="package-metrics">
                    <span><i class="bi bi-calendar3"></i>${item.days} days</span>
                    <span><i class="bi bi-cash-coin"></i>${formatMoney(item.price)}</span>
                    <span><i class="bi bi-people"></i>Local partners</span>
                </div>
                <button class="btn btn-light" data-action="book-package" data-id="${item.id}">
                    <i class="bi bi-send me-2"></i>Book Package
                </button>
            </article>
        </div>
    `).join('');
}

function renderEvents() {
    elements.eventList.innerHTML = events.map((eventItem) => {
        const date = new Date(eventItem.date);
        return `
            <article class="event-card">
                <div class="event-date">
                    <div>${date.toLocaleString('en-IN', { month: 'short' })}<br>${date.getDate()}</div>
                </div>
                <div>
                    <h3 class="h5 fw-bold">${eventItem.title}</h3>
                    <p class="mb-1 text-muted">${eventItem.description}</p>
                    <span><i class="bi bi-geo-alt me-1"></i>${eventItem.location}</span>
                </div>
            </article>
        `;
    }).join('');
}

function renderBookingOptions() {
    elements.bookingDestination.innerHTML = allDestinations().map((destination) => `
        <option value="${destination.id}">${destination.name}</option>
    `).join('');

    elements.bookingPackage.innerHTML = '<option value="custom">Custom travel request</option>' + packages.map((item) => `
        <option value="${item.id}">${item.title} - ${formatMoney(item.price)}</option>
    `).join('');
}

function renderBookings() {
    elements.bookingTable.innerHTML = appState.bookings.map((booking) => `
        <tr>
            <td>${booking.destination}</td>
            <td>${booking.package}</td>
            <td>${booking.date}</td>
            <td>${booking.guests}</td>
            <td><span class="badge text-bg-warning">${booking.status}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-muted">No bookings yet. Submit a booking request to see it here.</td></tr>';
}

function renderAdminDestinations() {
    elements.adminDestinationList.innerHTML = allDestinations().map((destination) => `
        <article class="admin-record">
            <div>
                <strong>${destination.name}</strong>
                <p class="mb-0 text-muted">${destination.category} | ${destination.location}</p>
            </div>
            <span class="badge text-bg-success">${formatMoney(destination.price)}</span>
        </article>
    `).join('');
}

function renderProviderServices() {
    elements.providerServiceList.innerHTML = allServices().map((service) => `
        <article class="admin-record">
            <div>
                <strong>${service.name}</strong>
                <p class="mb-0 text-muted">${service.type} | ${service.location}</p>
            </div>
            <span class="badge text-bg-success">${formatMoney(service.price)}</span>
        </article>
    `).join('');
}

function openDestination(id) {
    const destination = allDestinations().find((item) => item.id === id);
    if (!destination) {
        return;
    }

    const reviews = appState.reviews.filter((review) => review.destination === id);
    elements.destinationModalBody.innerHTML = `
        <div class="destination-modal-grid">
            <img src="${destination.image}" alt="${destination.name}">
            <div class="destination-modal-content">
                <span class="eyebrow">${destination.category}</span>
                <h2 class="display-6 fw-bold">${destination.name}</h2>
                <p class="text-muted"><i class="bi bi-geo-alt me-1"></i>${destination.location}</p>
                <p>${destination.description}</p>
                <ul class="highlight-list">
                    ${destination.highlights.map((highlight) => `<li><i class="bi bi-check-circle-fill"></i><span>${highlight}</span></li>`).join('')}
                </ul>
                <div class="d-flex flex-wrap gap-2 mb-4">
                    <span class="badge text-bg-success">Rating ${destination.rating}/5</span>
                    <span class="badge text-bg-light">${formatMoney(destination.price)} starting price</span>
                    <span class="badge text-bg-light">${reviews.length} reviews</span>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-brand" data-action="book" data-id="${destination.id}">Book this destination</button>
                    <button class="btn btn-outline-brand" data-action="review" data-id="${destination.id}">Add review</button>
                </div>
                <hr>
                <h3 class="h5 fw-bold">Recent reviews</h3>
                ${reviews.length ? reviews.map((review) => `
                    <div class="border-bottom py-2">
                        <strong>${review.name} - ${review.rating}/5</strong>
                        <p class="mb-0 text-muted">${review.comment}</p>
                    </div>
                `).join('') : '<p class="text-muted">No reviews yet. Be the first to add one.</p>'}
            </div>
        </div>
    `;
    destinationModal.show();
}

function prepareBooking(destinationId, packageId = 'custom') {
    if (destinationId) {
        elements.bookingDestination.value = destinationId;
    }
    if (packageId) {
        elements.bookingPackage.value = packageId;
    }
    bookingModal.show();
}

function addBooking(form) {
    const data = new FormData(form);
    const destination = allDestinations().find((item) => item.id === data.get('destination'));
    const selectedPackage = packages.find((item) => item.id === data.get('package'));
    const booking = {
        destination: destination ? destination.name : 'Custom destination',
        package: selectedPackage ? selectedPackage.title : 'Custom request',
        date: data.get('date'),
        guests: data.get('guests'),
        status: 'Pending'
    };

    appState.bookings.unshift(booking);
    store.set('tp_bookings', appState.bookings);
    renderBookings();
    form.reset();
    bookingModal.hide();
    showToast('Booking request submitted successfully.');
}

function addDestination(form) {
    const data = new FormData(form);
    const destination = {
        id: `custom-${Date.now()}`,
        name: data.get('name'),
        location: data.get('location'),
        category: data.get('category'),
        price: Number(data.get('price')),
        rating: 4.5,
        image: data.get('image'),
        description: data.get('description'),
        highlights: ['Admin added destination', 'Travel support available', 'Local provider visibility']
    };

    appState.customDestinations.unshift(destination);
    store.set('tp_custom_destinations', appState.customDestinations);
    form.reset();
    renderAll();
    showToast('Destination added to the website.');
}

function addService(form) {
    const data = new FormData(form);
    const service = {
        id: `service-${Date.now()}`,
        name: data.get('name'),
        type: data.get('type'),
        location: data.get('location'),
        price: Number(data.get('price')),
        description: data.get('description'),
        icon: 'bi-shop'
    };

    appState.customServices.unshift(service);
    store.set('tp_custom_services', appState.customServices);
    form.reset();
    renderAll();
    showToast('Service added to provider module.');
}

function addReview(form) {
    const data = new FormData(form);
    appState.reviews.unshift({
        destination: data.get('destination'),
        name: data.get('name'),
        rating: Number(data.get('rating')),
        comment: data.get('comment')
    });

    store.set('tp_reviews', appState.reviews);
    form.reset();
    reviewModal.hide();
    destinationModal.hide();
    showToast('Review saved successfully.');
}

function renderAll() {
    renderCategories();
    renderDestinations();
    renderServices();
    renderPackages();
    renderEvents();
    renderBookingOptions();
    renderBookings();
    renderAdminDestinations();
    renderProviderServices();
}

function animateCounters() {
    document.querySelectorAll('.counter').forEach((counter) => {
        const end = Number(counter.dataset.count);
        let current = 0;
        const step = Math.max(1, Math.ceil(end / 32));
        const timer = setInterval(() => {
            current += step;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            counter.textContent = `${current}+`;
        }, 28);
    });
}

function setTheme(mode) {
    document.documentElement.dataset.theme = mode;
    store.set('tp_theme', mode);
    elements.themeToggle.innerHTML = mode === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
}

function setupEvents() {
    document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.action;
        const id = actionButton.dataset.id;

        if (action === 'details') {
            openDestination(id);
        }
        if (action === 'book') {
            prepareBooking(id);
        }
        if (action === 'book-package') {
            const selectedPackage = packages.find((item) => item.id === id);
            prepareBooking(selectedPackage.destination, id);
        }
        if (action === 'review') {
            document.querySelector('#reviewDestination').value = id;
            reviewModal.show();
        }
    });

    elements.categoryFilters.addEventListener('click', (event) => {
        const chip = event.target.closest('[data-category]');
        if (!chip) {
            return;
        }
        appState.category = chip.dataset.category;
        renderCategories();
        renderDestinations();
    });

    elements.destinationSearch.addEventListener('input', (event) => {
        appState.search = event.target.value;
        renderDestinations();
    });

    elements.sortSelect.addEventListener('change', (event) => {
        appState.sort = event.target.value;
        renderDestinations();
    });

    document.querySelector('#heroSearchBtn').addEventListener('click', () => {
        appState.search = elements.heroSearch.value;
        appState.category = elements.heroCategory.value;
        appState.budget = elements.heroBudget.value;
        elements.destinationSearch.value = appState.search;
        renderCategories();
        renderDestinations();
        document.querySelector('#destinations').scrollIntoView({ behavior: 'smooth' });
    });

    elements.bookingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addBooking(event.currentTarget);
    });

    elements.adminDestinationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addDestination(event.currentTarget);
    });

    elements.providerServiceForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addService(event.currentTarget);
    });

    elements.reviewForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addReview(event.currentTarget);
    });

    elements.themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    window.addEventListener('scroll', () => {
        elements.nav.classList.toggle('is-scrolled', window.scrollY > 20);
    });
}

function setupObservers() {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

    const counterObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            animateCounters();
            counterObserver.disconnect();
        }
    }, { threshold: 0.3 });

    counterObserver.observe(document.querySelector('.impact-strip'));
}

document.addEventListener('DOMContentLoaded', () => {
    destinationModal = new bootstrap.Modal('#destinationModal');
    bookingModal = new bootstrap.Modal('#bookingModal');
    reviewModal = new bootstrap.Modal('#reviewModal');
    appToast = new bootstrap.Toast('#appToast');

    setTheme(store.get('tp_theme', 'light'));
    renderAll();
    setupEvents();
    setupObservers();
});
