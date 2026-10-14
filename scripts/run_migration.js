const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const migrationSql = `
-- Adiciona colunas para identificação do biodigestor, sensor, métricas e ciclo de vida
ALTER TABLE sensor_alerts 
  ADD COLUMN IF NOT EXISTS biodigester_id BIGINT REFERENCES biodigestor_maps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS biodigester_name TEXT,
  ADD COLUMN IF NOT EXISTS sensor_id TEXT,
  ADD COLUMN IF NOT EXISTS reading_value NUMERIC,
  ADD COLUMN IF NOT EXISTS threshold_value NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_id UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL;

-- Índices de performance para consulta histórica e filtros
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
`;

async function main() {
  try {
    console.log('Executando migration 002...');
    await pool.query(migrationSql);
    console.log('✅ Migration 002 executada com sucesso!');

    const r = await pool.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'sensor_alerts'");
    console.log('sensor_alerts colunas atualizadas:', r.rows.map(c => `${c.column_name} (${c.udt_name})`));
  } catch (err) {
    console.error('❌ Erro na migration:', err);
  } finally {
    await pool.end();
  }
}

main();
