CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS biodigestor_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biodigester_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waste_processed NUMERIC NOT NULL DEFAULT 0,
  energy_generated NUMERIC NOT NULL DEFAULT 0,
  tax_savings NUMERIC NOT NULL DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'low',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  scheduled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biodigestor_maps_user_created
  ON biodigestor_maps(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicators_user_measured
  ON biodigester_indicators(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_user_scheduled
  ON maintenance_schedules(user_id, scheduled_date DESC);
