-- FitOS Database Backup - 2025-10-10T00:07:29.002Z
-- Generated before schema-level multi-tenancy migration

-- Table: tenants
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  billing_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tenants VALUES ('cmgk2xf6r0000h57b5ppivlxb', 'FitOS Default', 'default', NULL, 'premium', 'active', 'harrissondutra@gmail.com', NULL, NULL, '{}', 'Thu Oct 09 2025 23:59:29 GMT-0300 (Horário Padrão de Brasília)', 'Thu Oct 09 2025 23:59:29 GMT-0300 (Horário Padrão de Brasília)');

-- Tenant FitOS Default - Users
INSERT INTO users VALUES ('cmgk2xfp90002h57bxw8mgoey', 'cmgk2xf6r0000h57b5ppivlxb', 'harrissondutra@gmail.com', 'undefined', 'Harrison', 'Dutra', NULL, 'ADMIN', 'ACTIVE', '{"bio":"Administrador do sistema FitOS","avatar":null,"preferences":{"theme":"light","language":"pt-BR","notifications":true}}', NULL, 'Thu Oct 09 2025 23:59:30 GMT-0300 (Horário Padrão de Brasília)', 'Thu Oct 09 2025 23:59:30 GMT-0300 (Horário Padrão de Brasília)');

-- Tenant FitOS Default - Members
INSERT INTO members VALUES ('cmgk2xfu00004h57bc5alxv0f', 'cmgk2xf6r0000h57b5ppivlxb', 'cmgk2xfp90002h57bxw8mgoey', 'Harrison Dutra', 'harrissondutra@gmail.com', NULL, 'admin', 'active', '{}', '{"role":"admin","permissions":["all"]}', 'Thu Oct 09 2025 23:59:30 GMT-0300 (Horário Padrão de Brasília)', 'Thu Oct 09 2025 23:59:30 GMT-0300 (Horário Padrão de Brasília)');
