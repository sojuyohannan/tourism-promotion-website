-- ============================================================
--  Tourism Marketplace — Database Migration v2
--  Extends existing tables and adds new ones
--  Safe to run multiple times (uses IF NOT EXISTS / ALTER IGNORE)
-- ============================================================

USE tourism_db;

-- ─────────────────────────────────────────────
--  EXTEND: users table
-- ─────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone       VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status      ENUM('active','pending','suspended') DEFAULT 'active';

-- Providers registered via UI should start as 'pending' for admin approval
UPDATE users SET status = 'active' WHERE role IN ('admin','user') AND status IS NULL;
UPDATE users SET status = 'pending' WHERE role = 'provider' AND status IS NULL;

-- ─────────────────────────────────────────────
--  EXTEND: destinations table
-- ─────────────────────────────────────────────
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS district           VARCHAR(120) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS state              VARCHAR(120) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS season             VARCHAR(80)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget_min         INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_max         INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured           TINYINT(1)   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nearby_attractions TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gallery            TEXT         DEFAULT NULL;

-- ─────────────────────────────────────────────
--  EXTEND: services table
-- ─────────────────────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS destination_id       VARCHAR(60)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_id          INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status               ENUM('pending','approved','rejected') DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS capacity             INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS images               TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS operating_hours      VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_policy  TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason     TEXT         DEFAULT NULL;

-- ─────────────────────────────────────────────
--  EXTEND: bookings table
-- ─────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS destination_id   VARCHAR(60)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS package_id       VARCHAR(60)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS special_requests TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone            VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status   ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_amount   DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_ref      VARCHAR(80)  DEFAULT NULL;

-- Extend status to include Completed
ALTER TABLE bookings MODIFY COLUMN status ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending';

-- ─────────────────────────────────────────────
--  EXTEND: reviews table
-- ─────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS booking_id   INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS service_id   VARCHAR(60)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS package_id   VARCHAR(60)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_id      INT          DEFAULT NULL;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
--  NEW: provider_profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_profiles (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  user_id         INT           NOT NULL UNIQUE,
  business_name   VARCHAR(200)  NOT NULL,
  owner_name      VARCHAR(120)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL,
  address         TEXT          DEFAULT NULL,
  license_no      VARCHAR(100)  DEFAULT NULL,
  description     TEXT          DEFAULT NULL,
  profile_image   TEXT          DEFAULT NULL,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  NEW: booking_services (junction)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_services (
  id          INT  AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT  NOT NULL,
  service_id  VARCHAR(60) NOT NULL,
  provider_id INT  DEFAULT NULL,
  price       DECIMAL(10,2) DEFAULT 0,
  status      ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  NEW: notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  type        VARCHAR(60)   NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  message     TEXT          DEFAULT NULL,
  is_read     TINYINT(1)    DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  NEW: wishlists
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id              INT   AUTO_INCREMENT PRIMARY KEY,
  user_id         INT   NOT NULL,
  destination_id  VARCHAR(60) NOT NULL,
  created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, destination_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  NEW: payments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT           NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  card_holder  VARCHAR(120)  NOT NULL,
  payment_ref  VARCHAR(80)   NOT NULL UNIQUE,
  status       VARCHAR(40)   DEFAULT 'success',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_services_destination ON services(destination_id);
CREATE INDEX IF NOT EXISTS idx_services_provider    ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_status      ON services(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user        ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);

-- Mark existing seeded services as approved
UPDATE services SET status = 'approved' WHERE status IS NULL OR status = '';

SELECT 'Migration v2 complete!' AS result;
