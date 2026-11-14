/**
 * BioDash - Seeder de Usuário de Demonstração
 * Usuário: biogen@gmail.com
 *
 * Cria o usuário, perfil, 12 meses de indicadores,
 * manutenções, incidente ativo e alertas de sensor.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

// ==========================================
// Configurações do Usuário Demo
// ==========================================
const DEMO_EMAIL    = 'biogen@gmail.com';
const DEMO_PASSWORD = 'Biogen123!';

// ==========================================
// Dados de Perfil
// ==========================================
const DEMO_PROFILE = {
    name: 'Administrador BioDash',
    company: 'BioDash Demo',
    razao_social: 'Biogen Energia Renovável Ltda.',
    cnpj: '12345678000190',
    address: 'Rua das Bioenergias',
    numero: 42,
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310100',
    phone: '(11) 91234-5678',
    email: DEMO_EMAIL,
};

// ==========================================
// Indicadores — 12 meses retroativos
// ==========================================
function generateIndicators(userId) {
    const now = new Date();
    const rows = [];

    // Simula crescimento progressivo ao longo do ano
    const base = {
        waste:  4200,
        energy: 1900,
        tax:    3100,
    };
    const growth = { waste: 120, energy: 55, tax: 90 };
    const noise  = () => (Math.random() - 0.5) * 200;

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
        const step = 11 - i;
        rows.push({
            user_id:          userId,
            waste_processed:  +(base.waste  + step * growth.waste  + noise()).toFixed(2),
            energy_generated: +(base.energy + step * growth.energy + noise()).toFixed(2),
            tax_savings:      +(base.tax    + step * growth.tax    + noise()).toFixed(2),
            measured_at:      d.toISOString(),
        });
    }
    return rows;
}

// ==========================================
// Manutenções
// ==========================================
function generateMaintenances(userId) {
    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 86400000).toISOString();
    const past   = (days) => new Date(now.getTime() - days * 86400000).toISOString();

    return [
        { user_id: userId, name: 'Inspeção do sistema de filtragem de biogás', priority: 'high',   status: 'pending', scheduled_date: future(3)  },
        { user_id: userId, name: 'Troca de manta filtrante do reator',          priority: 'medium', status: 'pending', scheduled_date: future(10) },
        { user_id: userId, name: 'Calibração dos sensores de temperatura',       priority: 'low',    status: 'pending', scheduled_date: future(18) },
        { user_id: userId, name: 'Verificação das válvulas de segurança',        priority: 'urgent', status: 'pending', scheduled_date: future(1)  },
        { user_id: userId, name: 'Limpeza do biodigestor principal',             priority: 'medium', status: 'done',    scheduled_date: past(5)    },
    ];
}

// ==========================================
// Alertas de Sensor
// ==========================================
function generateAlerts(userId, biodigesterId, biodigesterName) {
    const past = (h) => new Date(Date.now() - h * 3600000).toISOString();
    return [
        {
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
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
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
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
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
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
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
            sensor_id: 'SN-H2S-01',
            sensor_type: 'h2s',
            reading_value: 430,
            threshold_value: 400,
            unit: 'ppm',
            alert_level: 'medium',
            status: 'resolved',
            resolved_at: past(22),
            resolution_notes: 'Filtro de carvão ativado inspecionado e regenerado.',
            message: 'Concentração de H2S atingiu 430 ppm. Filtro de carvão exigiu limpeza.',
            created_at: past(26),
        },
        {
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
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
            user_id: userId,
            biodigester_id: biodigesterId || null,
            biodigester_name: biodigesterName || 'Biodigestor Principal',
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
}

// ==========================================
// Marcadores de Mapa (MongoDB)
// ==========================================
const markerSchema = new mongoose.Schema({
    title: String, latitude: Number, longitude: Number,
    description: String, address: Object, createdAt: { type: Date, default: Date.now },
});
const Marker = mongoose.model('Marker', markerSchema);

const DEMO_MARKERS = [
    { title: 'Biodigestor Principal',   latitude: -23.5505, longitude: -46.6333, description: 'Unidade principal de tratamento - capacidade 50t/dia',        address: { cep: '01310100', street: 'Rua das Bioenergias', number: '42', complement: 'Galpão A' } },
    { title: 'Biodigestor Secundário',  latitude: -23.5530, longitude: -46.6290, description: 'Unidade secundária - em expansão',                           address: { cep: '01310100', street: 'Rua das Bioenergias', number: '55', complement: 'Galpão B' } },
    { title: 'Ponto de Coleta Leste',   latitude: -23.5480, longitude: -46.6200, description: 'Centro de coleta de resíduos orgânicos - Zona Leste',        address: { cep: '03001000', street: 'Av. Radial Leste',    number: '800', complement: '' } },
    { title: 'Ponto de Coleta Oeste',   latitude: -23.5580, longitude: -46.6500, description: 'Centro de coleta de resíduos orgânicos - Zona Oeste',        address: { cep: '05001000', street: 'Av. Brigadeiro Faria Lima', number: '1500', complement: '' } },
    { title: 'Estação de Distribuição', latitude: -23.5460, longitude: -46.6400, description: 'Distribuição de biogás processado para a rede local',        address: { cep: '01222010', street: 'Av. Paulista',        number: '900', complement: 'Sala 12' } },
];

// ==========================================
// Execução Principal
// ==========================================
async function seed() {
    console.log('\n🌱 Iniciando seeder de demonstração — BioDash\n');

    // --- 1. Criar / atualizar usuário ---
    const existing = await pgPool.query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
    let userId;

    if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        console.log(`⚠️  Usuário ${DEMO_EMAIL} já existe. Reutilizando ID: ${userId}`);
        // Atualiza senha para garantir acesso
        const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
        await pgPool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
        console.log('🔑 Senha redefinida para:', DEMO_PASSWORD);
    } else {
        const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
        const res = await pgPool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [DEMO_EMAIL, hash]
        );
        userId = res.rows[0].id;
        console.log(`✅ Usuário criado: ${DEMO_EMAIL} (ID: ${userId})`);
    }

    // --- 2. Perfil ---
    await pgPool.query(
        `INSERT INTO user_profiles (user_id, name, company, razao_social, cnpj, address, numero, city, state, zip_code, phone, email, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           name=$2, company=$3, razao_social=$4, cnpj=$5, address=$6, numero=$7,
           city=$8, state=$9, zip_code=$10, phone=$11, email=$12, updated_at=NOW()`,
        [userId, DEMO_PROFILE.name, DEMO_PROFILE.company, DEMO_PROFILE.razao_social,
         DEMO_PROFILE.cnpj, DEMO_PROFILE.address, DEMO_PROFILE.numero,
         DEMO_PROFILE.city, DEMO_PROFILE.state, DEMO_PROFILE.zip_code,
         DEMO_PROFILE.phone, DEMO_PROFILE.email]
    );
    console.log('✅ Perfil criado/atualizado.');

    // --- 3. Indicadores — limpa os antigos e insere 12 meses ---
    await pgPool.query('DELETE FROM biodigester_indicators WHERE user_id = $1', [userId]);
    const indicators = generateIndicators(userId);
    for (const ind of indicators) {
        await pgPool.query(
            'INSERT INTO biodigester_indicators (user_id, waste_processed, energy_generated, tax_savings, measured_at) VALUES ($1,$2,$3,$4,$5)',
            [ind.user_id, ind.waste_processed, ind.energy_generated, ind.tax_savings, ind.measured_at]
        );
    }
    console.log(`✅ ${indicators.length} meses de indicadores inseridos.`);

    // --- 4. Manutenções ---
    await pgPool.query('DELETE FROM maintenance_schedules WHERE user_id = $1', [userId]);
    const maintenances = generateMaintenances(userId);
    for (const m of maintenances) {
        await pgPool.query(
            'INSERT INTO maintenance_schedules (user_id, name, priority, status, scheduled_date) VALUES ($1,$2,$3,$4,$5)',
            [m.user_id, m.name, m.priority, m.status, m.scheduled_date]
        );
    }
    console.log(`✅ ${maintenances.length} manutenções inseridas.`);

    // --- 5. Incidente ativo (últimas 24h) ---
    await pgPool.query('DELETE FROM maintenance_incidents WHERE user_id = $1', [userId]);
    await pgPool.query(
        'INSERT INTO maintenance_incidents (user_id, description, last_notification_at) VALUES ($1,$2,$3)',
        [userId, 'Pico de temperatura detectado no reator principal — aguardando normalização.', new Date(Date.now() - 3 * 3600000).toISOString()]
    );
    console.log('✅ Incidente de manutenção ativo inserido.');

    // --- 6. Alertas de Sensor ---
    await pgPool.query('DELETE FROM sensor_alerts WHERE user_id = $1', [userId]);

    // Busca biodigestor do usuário caso exista
    const userBd = await pgPool.query('SELECT id, address FROM biodigestor_maps WHERE user_id = $1 LIMIT 1', [userId]);
    const bdId = userBd.rows[0]?.id ? Number(userBd.rows[0].id) : null;
    const bdTitle = userBd.rows[0]?.address?.title || 'Biodigestor Principal';

    const alerts = generateAlerts(userId, bdId, bdTitle);
    for (const a of alerts) {
        await pgPool.query(
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
    console.log(`✅ ${alerts.length} alertas de sensor estruturados inseridos.`);

    // --- 7. Marcadores no MongoDB ---
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🟢 Conectado ao MongoDB.');
        await Marker.deleteMany({});
        await Marker.insertMany(DEMO_MARKERS);
        console.log(`✅ ${DEMO_MARKERS.length} marcadores de mapa inseridos.`);
        await mongoose.disconnect();
    } catch (err) {
        console.warn('⚠️  Não foi possível inserir marcadores no MongoDB:', err.message);
    }

    await pgPool.end();

    console.log('\n🎉 Seeder concluído com sucesso!');
    console.log('━'.repeat(45));
    console.log(`   Email:  ${DEMO_EMAIL}`);
    console.log(`   Senha:  ${DEMO_PASSWORD}`);
    console.log('━'.repeat(45));
    console.log('');
}

seed().catch((err) => {
    console.error('\n❌ Erro no seeder:', err.message);
    process.exit(1);
});
