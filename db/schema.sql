-- ============================================================
--  Tourism Promotion Website — Database Schema
--  Run this file once in MySQL to set up all tables + seed data
-- ============================================================

CREATE DATABASE IF NOT EXISTS tourism_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourism_db;

-- ─────────────────────────────────────────────
--  DESTINATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destinations (
    id          VARCHAR(60)   PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    location    VARCHAR(120)  NOT NULL,
    category    VARCHAR(60)   NOT NULL,
    price       INT           NOT NULL DEFAULT 0,
    rating      DECIMAL(3,1)  NOT NULL DEFAULT 4.5,
    image       TEXT,
    description TEXT,
    highlights  TEXT,          -- JSON array stored as text
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
--  SERVICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
    id          VARCHAR(60)   PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    type        VARCHAR(60)   NOT NULL,
    location    VARCHAR(120)  NOT NULL,
    price       INT           NOT NULL DEFAULT 0,
    price_unit  ENUM('fixed','per_km') DEFAULT 'fixed',
    icon        VARCHAR(60)   DEFAULT 'bi-shop',
    description TEXT,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
--  PACKAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
    id             VARCHAR(60)  PRIMARY KEY,
    title          VARCHAR(120) NOT NULL,
    destination_id VARCHAR(60),
    days           INT          NOT NULL DEFAULT 1,
    price          INT          NOT NULL DEFAULT 0,
    image          TEXT,
    description    TEXT,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
--  EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(120)  NOT NULL,
    location    VARCHAR(120)  NOT NULL,
    event_date  DATE          NOT NULL,
    description TEXT,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
--  BOOKINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(120)  NOT NULL,
    contact        VARCHAR(120)  NOT NULL,
    destination    VARCHAR(120)  NOT NULL,
    package_name   VARCHAR(120)  DEFAULT 'Custom request',
    travel_date    DATE          NOT NULL,
    guests         INT           NOT NULL DEFAULT 1,
    distance_km    DECIMAL(10,2) DEFAULT 0,
    notes          TEXT,
    status         ENUM('Pending','Confirmed','Cancelled') DEFAULT 'Pending',
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
--  REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    destination_id  VARCHAR(60)   NOT NULL,
    reviewer_name   VARCHAR(120)  NOT NULL,
    rating          TINYINT       NOT NULL DEFAULT 5,
    comment         TEXT,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SEED DATA
-- ============================================================

INSERT IGNORE INTO destinations (id, name, location, category, price, rating, image, description, highlights) VALUES
('munnar',   'Munnar Hills',            'Kerala, India',         'Hill Station', 7500,  4.8, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=85', 'Tea gardens, cool weather, viewpoints, waterfalls, and peaceful nature trails for family tourism.', '["Tea estate walk","Waterfall viewpoints","Local food experience","Homestay support"]'),
('goa',      'Goa Beaches',             'Goa, India',            'Beach',        6500,  4.7, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=85', 'Coastal destination known for beaches, seafood, water sports, music, and heritage streets.',         '["Beach route planning","Seafood restaurants","Water sports","Heritage walk"]'),
('mysore',   'Mysore Palace',           'Karnataka, India',      'Heritage',     5200,  4.6, 'https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1000&q=85', 'Historical palace destination with royal architecture, cultural exhibitions, lights, and markets.',    '["Palace visit","Museum tour","Traditional market","Cultural evening"]'),
('corbett',  'Jim Corbett National Park','Uttarakhand, India',   'Wildlife',     9800,  4.5, 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1000&q=85', 'Wildlife tourism with safari experiences, forest stays, and nature education.',                      '["Safari assistance","Forest stay","Nature guide","Transport support"]'),
('varanasi', 'Varanasi Ghats',          'Uttar Pradesh, India',  'Pilgrimage',   5800,  4.9, 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1000&q=85', 'Spiritual and cultural tourism with riverfront rituals, temples, music, and traditional crafts.',     '["Ghat walk","Temple visit","Boat ride","Craft market"]'),
('jaipur',   'Jaipur Heritage Trail',   'Rajasthan, India',      'Heritage',     8400,  4.7, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=85', 'Forts, markets, local art, food trails, and architectural heritage in the Pink City.',               '["Fort visit","Textile market","Food walk","Local guide"]');

INSERT IGNORE INTO services (id, name, type, location, price, price_unit, icon, description) VALUES
('hotel-1',     'Green Valley Homestay',   'Hotel',      'Munnar',  2400, 'fixed',  'bi-house-heart', 'Comfortable rooms near tea gardens with breakfast and sightseeing support.'),
('guide-1',     'Heritage Walk Guide',     'Guide',      'Mysore',  1200, 'fixed',  'bi-person-walking','Certified local guide for palace, museum, and market visits.'),
('transport-1', 'Coastal Cab Service',     'Taxi',       'Goa',     18,   'per_km', 'bi-taxi-front',  'Airport pickup, beach route travel, and day trip transportation. Rate: ₹18/km.'),
('food-1',      'Spice Trail Restaurant',  'Restaurant', 'Kerala',   1000, 'fixed',  'bi-cup-hot',     'Local food experience with vegetarian and non-vegetarian meal options.'),
('craft-1',     'Craft Market Collective', 'Handicraft', 'Varanasi', 350,  'fixed',  'bi-bag-heart',   'Handmade textiles, souvenirs, and artisan products.'),
('guide-2',     'Jaipur Local Expert',     'Guide',      'Jaipur',  1500, 'fixed',  'bi-map',         'Curated fort, bazaar, and food tours with flexible timing.');

INSERT IGNORE INTO packages (id, title, destination_id, days, price, image, description) VALUES
('pkg-munnar',  'Munnar Nature Escape',  'munnar',  3, 7500, '/assets/munnar_package.png', 'Tea garden visit, waterfall sightseeing, local food, and homestay support.'),
('pkg-goa',     'Goa Coastal Weekend',   'goa',     2, 6500, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=85', 'Beach visits, transport support, seafood restaurants, and cultural walk.'),
('pkg-mysore',  'Mysore Heritage Tour',  'mysore',  2, 5200, 'https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1400&q=85', 'Palace visit, museum, local guide, market walk, and cultural evening.'),
('pkg-corbett', 'Wildlife Safari Plan',  'corbett', 3, 9800, 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=85', 'Forest stay, safari assistance, transport coordination, and nature guide support.');

INSERT IGNORE INTO events (title, location, event_date, description) VALUES
('Local Food Festival',       'Goa',     '2026-07-12', 'A weekend event promoting local cuisine and small food businesses.'),
('Handicraft Exhibition',     'Varanasi','2026-08-05', 'An exhibition for local artisans, textiles, and handmade souvenirs.'),
('Tea Garden Cultural Walk',  'Munnar',  '2026-09-18', 'A guided community walk through tea estates and local culture.'),
('Mysore Heritage Evening',   'Mysore',  '2026-10-03', 'Traditional music, palace lighting, and cultural performances.');

INSERT IGNORE INTO bookings (name, contact, destination, package_name, travel_date, guests, notes, status) VALUES
('Demo User', 'demo@email.com', 'Munnar Hills', 'Munnar Nature Escape', '2026-07-20', 2, 'Would like a window room with garden view.', 'Pending');

INSERT IGNORE INTO reviews (destination_id, reviewer_name, rating, comment) VALUES
('munnar',  'Tourist User', 5, 'Beautiful destination with excellent local hospitality.'),
('mysore',  'Tourist User', 4, 'Great heritage experience and useful guide support.');

-- ---------------------------------------------
--  USERS
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(120)  UNIQUE NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    role        ENUM('user','admin','provider') DEFAULT 'user',
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Seed an admin user (password is 'admin123')
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '\\\/yDk597F5M3A.W5/L03HukO5q6t1o9y28vFfC0460Z5L1W79l2eG', 'admin');
