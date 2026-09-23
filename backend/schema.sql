-- GBPS (puja-seva) self-hosted schema for cPanel MySQL / MariaDB
-- Import via phpMyAdmin (cPanel > Databases > phpMyAdmin) or:
--   mysql -u DBUSER -p DBNAME < schema.sql
-- Engine InnoDB + utf8mb4. No Supabase / Firebase dependency.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(190) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_otp_email (email),
  KEY ix_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY ix_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  name VARCHAR(190) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  gotra VARCHAR(120) NOT NULL DEFAULT '',
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user (user_id),
  KEY ix_profiles_email (email),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purohits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  full_name VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL,
  aadhaar VARCHAR(40) NOT NULL DEFAULT '',
  address TEXT,
  experience_years INT NOT NULL DEFAULT 0,
  specialization VARCHAR(190) NOT NULL DEFAULT '',
  certification VARCHAR(190) NOT NULL DEFAULT '',
  about TEXT,
  pricing JSON NULL,
  photos JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
  completed_pujas INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_purohits_email (email),
  KEY ix_purohits_status (status),
  KEY ix_purohits_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pujas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  description TEXT,
  duration VARCHAR(80) NOT NULL DEFAULT '',
  category VARCHAR(80) NOT NULL DEFAULT 'Sanskar',
  image_url TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_pujas_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS packages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  puja_id INT UNSIGNED NOT NULL,
  description TEXT,
  includes_purohit TINYINT(1) NOT NULL DEFAULT 1,
  purohit_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  items_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tier VARCHAR(40) NOT NULL DEFAULT 'Standard',
  image_url TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_packages_puja (puja_id),
  CONSTRAINT fk_packages_puja FOREIGN KEY (puja_id) REFERENCES pujas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS puja_lists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  puja_id INT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  description TEXT,
  tier VARCHAR(40) NOT NULL DEFAULT 'Standard',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  items JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_puja_lists_puja (puja_id),
  CONSTRAINT fk_puja_lists_puja FOREIGN KEY (puja_id) REFERENCES pujas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashakarma_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  name_hindi VARCHAR(190) NOT NULL DEFAULT '',
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'pc',
  category VARCHAR(80) NOT NULL DEFAULT 'Essentials',
  image_url TEXT,
  used_in_pujas JSON NULL,
  in_stock TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS upcoming_pujas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  description TEXT,
  puja_id INT UNSIGNED NULL,
  event_date DATETIME NOT NULL,
  venue VARCHAR(190) NOT NULL DEFAULT '',
  address TEXT,
  purohit_id INT UNSIGNED NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  seats_total INT NOT NULL DEFAULT 50,
  seats_booked INT NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_upcoming_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  customer_name VARCHAR(190) NOT NULL,
  gotra VARCHAR(120) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL,
  puja_location VARCHAR(255) NOT NULL DEFAULT '',
  package_id INT UNSIGNED NULL,
  puja_id INT UNSIGNED NULL,
  purohit_id INT UNSIGNED NULL,
  upcoming_puja_id INT UNSIGNED NULL,
  booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_bookings_user (user_id),
  KEY ix_bookings_purohit (purohit_id),
  KEY ix_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  customer_name VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  delivery_address TEXT NOT NULL,
  items JSON NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_orders_user (user_id),
  KEY ix_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
