-- GBPS migrate-002: customer registration fields on users.
-- Run once on existing installs (fresh installs already have these via schema.sql):
--   mysql -u reddevil_gbps -p reddevil_gbps < migrate-002.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(40) NOT NULL DEFAULT '' AFTER name;
ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone;
