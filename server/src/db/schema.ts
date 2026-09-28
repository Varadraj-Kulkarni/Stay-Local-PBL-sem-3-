export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('TOURIST', 'HOST', 'ADMIN')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS host_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  approval_status TEXT NOT NULL CHECK(approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  verified_at TEXT,
  rejection_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL REFERENCES destinations(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_night REAL NOT NULL CHECK(price_per_night > 0),
  max_guests INTEGER NOT NULL CHECK(max_guests BETWEEN 1 AND 20),
  amenities TEXT NOT NULL, -- JSON array
  photos TEXT NOT NULL,    -- JSON array
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  status TEXT NOT NULL CHECK(status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'INACTIVE')),
  location_verified INTEGER NOT NULL DEFAULT 0,
  verification_json TEXT,  -- JSON object
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS property_photos (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  caption TEXT,
  is_verification_photo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tourist_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK(guests >= 1),
  night_count INTEGER NOT NULL CHECK(night_count >= 1),
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL CHECK(total >= 0),
  coupon_code TEXT,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI_QR', 'DEMO_CARD', 'PAY_AT_STAY')),
  created_at TEXT NOT NULL,
  confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'REDEEMED', 'EXPIRED')),
  issued_for_booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  redeemed_on_booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tourist_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  asset_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_dest ON properties(destination_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_bookings_prop_dates ON bookings(property_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tourist ON bookings(tourist_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rewards_code ON rewards(code);
`;

export const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK(role IN ('TOURIST', 'HOST', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS host_profiles (
  id VARCHAR(80) PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  bio TEXT,
  approval_status VARCHAR(20) NOT NULL CHECK(approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  verified_at TIMESTAMPTZ,
  rejection_note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS destinations (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  tagline VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(80) PRIMARY KEY,
  host_id VARCHAR(80) NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  destination_id VARCHAR(80) NOT NULL REFERENCES destinations(id),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  price_per_night NUMERIC(10,2) NOT NULL CHECK(price_per_night > 0),
  max_guests INTEGER NOT NULL CHECK(max_guests BETWEEN 1 AND 20),
  amenities JSONB NOT NULL,
  photos JSONB NOT NULL,
  latitude NUMERIC(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  status VARCHAR(20) NOT NULL CHECK(status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'INACTIVE')),
  location_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_json JSONB,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS property_photos (
  id VARCHAR(80) PRIMARY KEY,
  property_id VARCHAR(80) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_id VARCHAR(80) NOT NULL,
  asset_url TEXT NOT NULL,
  caption VARCHAR(200),
  is_verification_photo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(80) PRIMARY KEY,
  property_id VARCHAR(80) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL CHECK(guests >= 1),
  night_count INTEGER NOT NULL CHECK(night_count >= 1),
  subtotal NUMERIC(10,2) NOT NULL CHECK(subtotal >= 0),
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL CHECK(total >= 0),
  coupon_code VARCHAR(40),
  status VARCHAR(20) NOT NULL CHECK(status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  payment_method VARCHAR(20) NOT NULL CHECK(payment_method IN ('UPI_QR', 'DEMO_CARD', 'PAY_AT_STAY')),
  created_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR(80) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 100,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL CHECK(status IN ('AVAILABLE', 'REDEEMED', 'EXPIRED')),
  issued_for_booking_id VARCHAR(80) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  redeemed_on_booking_id VARCHAR(80) REFERENCES bookings(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(80) PRIMARY KEY,
  property_id VARCHAR(80) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id VARCHAR(80) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  asset_id VARCHAR(80) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_dest ON properties(destination_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_bookings_prop_dates ON bookings(property_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tourist ON bookings(tourist_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rewards_code ON rewards(code);
`;
