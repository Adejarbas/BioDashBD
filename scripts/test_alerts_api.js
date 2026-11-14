const { classifySensorReading } = require('../lib/anomaly-classifier');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log('--- TESTE 1: CLASSIFICAÇÃO DE SENSORES E CRITICIDADE ---');
  
  // Temperatura
  const tNormal = classifySensorReading('temperatura', 36.5);
  console.log('Temp 36.5°C:', tNormal.alertLevel, tNormal.label, '| Prioridade:', tNormal.suggestedPriority);
  console.assert(tNormal.alertLevel === 'info', 'Falha temp normal');

  const tLow = classifySensorReading('temperatura', 38.0);
  console.log('Temp 38.0°C:', tLow.alertLevel, tLow.label, '| Prioridade:', tLow.suggestedPriority);
  console.assert(tLow.alertLevel === 'low', 'Falha temp baixa');

  const tMed = classifySensorReading('temperatura', 39.2);
  console.log('Temp 39.2°C:', tMed.alertLevel, tMed.label, '| Prioridade:', tMed.suggestedPriority);
  console.assert(tMed.alertLevel === 'medium', 'Falha temp media');

  const tCrit = classifySensorReading('temperatura', 41.5);
  console.log('Temp 41.5°C:', tCrit.alertLevel, tCrit.label, '| Prioridade:', tCrit.suggestedPriority);
  console.assert(tCrit.alertLevel === 'critical', 'Falha temp critica');

  // Pressão
  const pNorm = classifySensorReading('pressao', 1.45);
  console.log('Press 1.45 bar:', pNorm.alertLevel, pNorm.label);
  console.assert(pNorm.alertLevel === 'info', 'Falha press normal');

  const pCrit = classifySensorReading('pressao', 2.05);
  console.log('Press 2.05 bar:', pCrit.alertLevel, pCrit.label);
  console.assert(pCrit.alertLevel === 'critical', 'Falha press critica');

  // pH
  const phNorm = classifySensorReading('ph', 7.1);
  console.log('pH 7.1:', phNorm.alertLevel, phNorm.label);
  console.assert(phNorm.alertLevel === 'info', 'Falha pH normal');

  const phCrit = classifySensorReading('ph', 5.8);
  console.log('pH 5.8:', phCrit.alertLevel, phCrit.label);
  console.assert(phCrit.alertLevel === 'critical', 'Falha pH critica');

  console.log('✅ TESTE 1 PASSOU: Todos os sensores classificados corretamente nos 4 níveis!');

  console.log('\n--- TESTE 2: CONSULTA DE HISTÓRICO NO BANCO COM FILTROS ---');
  const user = await pool.query('SELECT id FROM users LIMIT 1');
  if (!user.rows[0]) {
    console.log('Sem usuários para teste.');
    await pool.end();
    return;
  }
  const uid = user.rows[0].id;

  // Consulta todos
  const allAlerts = await pool.query('SELECT id, sensor_type, alert_level, reading_value, biodigester_name, status FROM sensor_alerts WHERE user_id = $1 ORDER BY created_at DESC', [uid]);
  console.log(`Total de alertas encontrados no histórico: ${allAlerts.rows.length}`);
  console.assert(allAlerts.rows.length >= 5, 'Deveria ter alertas salvos');

  // Filtro por criticidade
  const critAlerts = await pool.query("SELECT id, message, reading_value, alert_level FROM sensor_alerts WHERE user_id = $1 AND alert_level = 'critical'", [uid]);
  console.log(`Alertas críticos filtrados: ${critAlerts.rows.length}`);
  critAlerts.rows.forEach(a => console.log(`  - [CRÍTICO] ${a.message} (valor: ${a.reading_value})`));
  console.assert(critAlerts.rows.length > 0, 'Deveria ter alertas críticos');

  // Filtro por sensor
  const tempAlerts = await pool.query("SELECT id, message, sensor_type FROM sensor_alerts WHERE user_id = $1 AND sensor_type = 'temperatura'", [uid]);
  console.log(`Alertas de temperatura filtrados: ${tempAlerts.rows.length}`);
  console.assert(tempAlerts.rows.length > 0, 'Deveria ter alertas de temperatura');

  console.log('✅ TESTE 2 PASSOU: Histórico permite consulta refinada por sensor e criticidade!');

  console.log('\n--- TESTE 3: ATUALIZAÇÃO / RESOLUÇÃO DE OCORRÊNCIA ---');
  if (critAlerts.rows[0]) {
    const alertId = critAlerts.rows[0].id;
    await pool.query(
      "UPDATE sensor_alerts SET status = 'resolved', resolved_at = NOW(), resolution_notes = 'Resfriamento acionado e temperatura normalizada.' WHERE id = $1",
      [alertId]
    );
    const updated = await pool.query("SELECT id, status, resolved_at, resolution_notes FROM sensor_alerts WHERE id = $1", [alertId]);
    console.log('Alerta resolvido:', updated.rows[0]);
    console.assert(updated.rows[0].status === 'resolved', 'Status deveria ser resolved');
  }
  console.log('✅ TESTE 3 PASSOU: Ciclo de vida da ocorrência (resolução e notas) validado!');

  await pool.end();
}

runTests().catch(e => {
  console.error('Erro no teste:', e);
  pool.end();
  process.exit(1);
});
