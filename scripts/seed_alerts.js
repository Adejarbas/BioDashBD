const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const user = await pool.query('SELECT id FROM users LIMIT 1');
    if (!user.rows[0]) {
      console.log('Nenhum usuário encontrado.');
      return;
    }
    const uid = user.rows[0].id;
    console.log('Inserindo alertas para usuário:', uid);

    const past = (h) => new Date(Date.now() - h * 3600000).toISOString();
    await pool.query('DELETE FROM sensor_alerts WHERE user_id = $1', [uid]);

    // Busca biodigestor do usuário
    const bd = await pool.query('SELECT id, address FROM biodigestor_maps WHERE user_id = $1 LIMIT 1', [uid]);
    const bdId = bd.rows[0]?.id ? Number(bd.rows[0].id) : null;
    const bdName = bd.rows[0]?.address?.title || 'Biodigestor Principal';

    const items = [
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SN-TMP-01',
        sensor_type: 'temperatura',
        reading_value: 41.2,
        threshold_value: 40.0,
        unit: '°C',
        alert_level: 'critical',
        status: 'active',
        message: 'Temperatura atingiu 41.2°C - Risco Crítico de superaquecimento.',
        created_at: past(2),
      },
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SN-PRS-02',
        sensor_type: 'pressao',
        reading_value: 1.82,
        threshold_value: 1.75,
        unit: 'bar',
        alert_level: 'medium',
        status: 'active',
        message: 'Pressão elevada de biogás (1.82 bar). Ação preventiva recomendada.',
        created_at: past(8),
      },
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SN-PH-01',
        sensor_type: 'ph',
        reading_value: 6.6,
        threshold_value: 6.8,
        unit: 'pH',
        alert_level: 'low',
        status: 'acknowledged',
        message: 'pH levemente ácido (6.6 pH). Monitore a composição da carga orgânica.',
        created_at: past(20),
      },
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SN-H2S-01',
        sensor_type: 'h2s',
        reading_value: 430,
        threshold_value: 400,
        unit: 'ppm',
        alert_level: 'medium',
        status: 'resolved',
        resolved_at: past(22),
        resolution_notes: 'Filtro de carvão regenerado com sucesso.',
        message: 'Concentração de H2S atingiu 430 ppm. Filtro de carvão exigiu limpeza.',
        created_at: past(26),
      },
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SN-TMP-01',
        sensor_type: 'temperatura',
        reading_value: 36.8,
        threshold_value: 37.0,
        unit: '°C',
        alert_level: 'info',
        status: 'resolved',
        resolved_at: past(46),
        resolution_notes: 'Normalização automática após ativação do chiller.',
        message: 'Temperatura normalizada após resfriamento automático (36.8°C).',
        created_at: past(48),
      },
      {
        user_id: uid,
        biodigester_id: bdId,
        biodigester_name: bdName,
        sensor_id: 'SYS-MAIN',
        sensor_type: 'sistema',
        reading_value: 100,
        threshold_value: 100,
        unit: '%',
        alert_level: 'info',
        status: 'resolved',
        message: 'Sistema inicializado com sucesso. Sensores de telemetria operantes.',
        created_at: past(72),
      },
    ];

    for (const a of items) {
      await pool.query(
        `INSERT INTO sensor_alerts (
          user_id, biodigester_id, biodigester_name, sensor_id, sensor_type,
          reading_value, threshold_value, unit, alert_level, status,
          resolved_at, resolution_notes, message, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          a.user_id, a.biodigester_id, a.biodigester_name, a.sensor_id, a.sensor_type,
          a.reading_value, a.threshold_value, a.unit, a.alert_level, a.status,
          a.resolved_at || null, a.resolution_notes || null, a.message, a.created_at
        ]
      );
    }

    console.log(`✅ ${items.length} alertas de teste inseridos com sucesso!`);
  } catch (e) {
    console.error('Erro ao inserir:', e);
  } finally {
    await pool.end();
  }
}

run();
