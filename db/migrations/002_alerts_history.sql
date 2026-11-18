-- ============================================================
-- Migration: 002_alerts_history.sql
-- Histórico de Alertas e Classificação de Criticidade de Sensores
-- ============================================================

-- Adiciona campos para armazenar dados completos do sensor, biodigestor, telemetria e ciclo de vida
ALTER TABLE sensor_alerts 
  ADD COLUMN IF NOT EXISTS biodigester_id UUID REFERENCES biodigestor_maps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS biodigester_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sensor_type VARCHAR(50) DEFAULT 'temperatura',
  ADD COLUMN IF NOT EXISTS reading_value NUMERIC,
  ADD COLUMN IF NOT EXISTS threshold_value NUMERIC,
  ADD COLUMN IF NOT EXISTS unit VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_id UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Índices de performance para otimização de consulta ao histórico
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_user_created 
  ON sensor_alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_alerts_user_biodigester 
  ON sensor_alerts(user_id, biodigester_id);

CREATE INDEX IF NOT EXISTS idx_sensor_alerts_user_sensor 
  ON sensor_alerts(user_id, sensor_type);

CREATE INDEX IF NOT EXISTS idx_sensor_alerts_user_level 
  ON sensor_alerts(user_id, alert_level);

CREATE INDEX IF NOT EXISTS idx_sensor_alerts_user_status 
  ON sensor_alerts(user_id, status);
