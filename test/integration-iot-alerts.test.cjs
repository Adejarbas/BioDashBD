const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createNextRequest, mockPoolQuery } = require('./setup-ts.cjs');

const { signToken } = require('@/lib/auth/jwt');
const alertsRoute = require('@/app/api/alerts/route');
const alertByIdRoute = require('@/app/api/alerts/[id]/route');
const biodigesterDataRoute = require('@/app/api/biodigester/data/route');
const indicatorsRoute = require('@/app/api/indicators/route');
const dashboardIndicatorsRoute = require('@/app/api/dashboard/indicators/route');
const markersRoute = require('@/app/api/markers/route');
const markerByIdRoute = require('@/app/api/markers/[id]/route');

const TEST_USER = { id: 'user-iot-01', email: 'iot@biodash.com' };
const AUTH_TOKEN = signToken(TEST_USER);
const AUTH_HEADER = { authorization: `Bearer ${AUTH_TOKEN}` };
const COOKIE_HEADER = { cookie: `biodash_token=${AUTH_TOKEN}` };
const BIODIGESTER_UUID = '11111111-2222-3333-4444-555555555555';
const MAINT_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('Integration: Ingestão IoT, Classificação de Sensores e Alertas (/api/alerts)', () => {
  test('POST /api/alerts integra leitura IoT com anomaly-classifier, biodigestor_maps e persiste alerta crítico', async () => {
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('SELECT address FROM biodigestor_maps')) {
        assert.equal(params[0], BIODIGESTER_UUID);
        assert.equal(params[1], TEST_USER.id);
        return { rows: [{ address: { title: 'Biodigestor Fazenda Norte' } }] };
      }
      if (sql.includes('INSERT INTO sensor_alerts')) {
        return {
          rows: [
            {
              id: 'alert-001',
              user_id: params[0],
              biodigester_id: params[1],
              biodigester_name: params[2],
              sensor_id: params[3],
              sensor_type: params[4],
              reading_value: params[5],
              threshold_value: params[6],
              unit: params[7],
              alert_level: params[8],
              message: params[9],
              status: params[10],
              maintenance_id: params[11],
            },
          ],
        };
      }
      return { rows: [] };
    });

    try {
      const req = createNextRequest('http://localhost:3003/api/alerts', {
        method: 'POST',
        headers: AUTH_HEADER,
        body: {
          biodigesterId: BIODIGESTER_UUID,
          sensorId: 'SENS-TEMP-01',
          sensorType: 'temperatura',
          readingValue: 43.2,
          maintenanceId: MAINT_UUID,
        },
      });

      const res = await alertsRoute.POST(req);
      assert.equal(res.status, 201);
      const payload = await res.json();
      assert.equal(payload.success, true);
      assert.equal(payload.data.biodigester_name, 'Biodigestor Fazenda Norte');
      assert.equal(payload.data.alert_level, 'critical');
      assert.equal(payload.data.threshold_value, 40.0);
      assert.equal(payload.data.unit, '°C');
      assert.match(payload.data.message, /43\.2°C/);
    } finally {
      dbMock.restore();
    }
  });

  test('GET /api/alerts filtra por sensorType, alertLevel, biodigesterId e retorna paginação estruturada', async () => {
    const dbMock = mockPoolQuery(async (sql) => {
      if (sql.includes('SELECT COUNT(*) AS total')) {
        return { rows: [{ total: '2' }] };
      }
      return {
        rows: [
          {
            id: 'alert-1',
            sensor_type: 'pressao',
            reading_value: 2.01,
            threshold_value: 1.9,
            unit: 'bar',
            alert_level: 'critical',
            status: 'active',
          },
          {
            id: 'alert-2',
            sensor_type: 'h2s',
            reading_value: 750,
            threshold_value: 700,
            unit: 'ppm',
            alert_level: 'critical',
            status: 'active',
          },
        ],
      };
    });

    try {
      const req = createNextRequest(
        `http://localhost:3003/api/alerts?biodigesterId=${BIODIGESTER_UUID}&sensorType=pressao&level=critico&status=active&page=1&limit=10`,
        { headers: AUTH_HEADER }
      );
      const res = await alertsRoute.GET(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.alerts.length, 2);
      assert.equal(json.data.pagination.total, 2);
      assert.equal(json.data.pagination.page, 1);
    } finally {
      dbMock.restore();
    }
  });

  test('GET, PATCH e DELETE /api/alerts/[id] validam ciclo de vida completo do alerta IoT e cenários de erro', async () => {
    // 1. Não autenticado -> 401
    const unauthRes = await alertsRoute.GET(createNextRequest('http://localhost:3003/api/alerts'));
    assert.equal(unauthRes.status, 401);

    // 2. JSON malformado no POST -> 400
    const badJsonReq = createNextRequest('http://localhost:3003/api/alerts', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'content-type': 'application/json' },
      body: '{invalid-json',
    });
    const badJsonRes = await alertsRoute.POST(badJsonReq);
    assert.equal(badJsonRes.status, 400);

    // 3. PATCH sem campos -> 400
    const emptyPatchReq = createNextRequest('http://localhost:3003/api/alerts/alert-1', {
      method: 'PATCH',
      headers: AUTH_HEADER,
      body: {},
    });
    const emptyPatchRes = await alertByIdRoute.PATCH(emptyPatchReq, { params: Promise.resolve({ id: 'alert-1' }) });
    assert.equal(emptyPatchRes.status, 400);

    // 4. PATCH resolvendo alerta + GET + DELETE + 404
    let exists = true;
    const dbMock = mockPoolQuery(async (sql) => {
      if (sql.includes('UPDATE sensor_alerts')) {
        return {
          rows: exists
            ? [{ id: 'alert-1', status: 'resolved', resolution_notes: 'Válvula ajustada', maintenance_id: MAINT_UUID }]
            : [],
        };
      }
      if (sql.includes('SELECT sa.*')) {
        return { rows: exists ? [{ id: 'alert-1', status: 'resolved' }] : [] };
      }
      if (sql.includes('DELETE FROM sensor_alerts')) {
        return { rowCount: exists ? 1 : 0 };
      }
      return { rows: [] };
    });

    try {
      const patchReq = createNextRequest('http://localhost:3003/api/alerts/alert-1', {
        method: 'PATCH',
        headers: AUTH_HEADER,
        body: { status: 'resolved', resolutionNotes: 'Válvula ajustada', maintenanceId: MAINT_UUID },
      });
      const patchRes = await alertByIdRoute.PATCH(patchReq, { params: Promise.resolve({ id: 'alert-1' }) });
      assert.equal(patchRes.status, 200);
      const patchJson = await patchRes.json();
      assert.equal(patchJson.data.status, 'resolved');

      const getRes = await alertByIdRoute.GET(
        createNextRequest('http://localhost:3003/api/alerts/alert-1', { headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'alert-1' }) }
      );
      assert.equal(getRes.status, 200);

      const delRes = await alertByIdRoute.DELETE(
        createNextRequest('http://localhost:3003/api/alerts/alert-1', { method: 'DELETE', headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'alert-1' }) }
      );
      assert.equal(delRes.status, 200);

      // Simulando registro não encontrado -> 404
      exists = false;
      const notFoundGet = await alertByIdRoute.GET(
        createNextRequest('http://localhost:3003/api/alerts/alert-404', { headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'alert-404' }) }
      );
      assert.equal(notFoundGet.status, 404);

      const notFoundDel = await alertByIdRoute.DELETE(
        createNextRequest('http://localhost:3003/api/alerts/alert-404', { method: 'DELETE', headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'alert-404' }) }
      );
      assert.equal(notFoundDel.status, 404);
    } finally {
      dbMock.restore();
    }
  });
});

describe('Integration: Telemetria do Biodigestor, Indicadores e Marcadores IoT', () => {
  test('GET /api/biodigester/data e /api/dashboard/indicators agregam séries temporais e métricas de produção', async () => {
    const dbMock = mockPoolQuery(async (sql) => {
      if (sql.includes('SUM(energy_generated)')) {
        return {
          rows: [{ energy_generated: '1450.5', waste_processed: '3200', tax_savings: '890.25' }],
        };
      }
      return {
        rows: [
          {
            waste_processed: 520,
            energy_generated: 210,
            tax_savings: 150,
            measured_at: '2026-11-15T12:00:00Z',
          },
          {
            waste_processed: 480,
            energy_generated: 195,
            tax_savings: 130,
            measured_at: '2026-10-15T12:00:00Z',
          },
        ],
      };
    });

    try {
      const seriesReq = createNextRequest('http://localhost:3003/api/biodigester/data', {
        headers: COOKIE_HEADER,
      });
      const seriesRes = await biodigesterDataRoute.GET(seriesReq);
      assert.equal(seriesRes.status, 200);
      const seriesJson = await seriesRes.json();
      assert.equal(seriesJson.success, true);
      assert.equal(seriesJson.data.wasteProcessed.length, 2);
      assert.equal(seriesJson.data.stats.wasteProcessed.value, '520');
      assert.equal(seriesJson.data.stats.energyGenerated.value, '210');

      const dashReq = createNextRequest('http://localhost:3003/api/dashboard/indicators', {
        headers: COOKIE_HEADER,
      });
      const dashRes = await dashboardIndicatorsRoute.GET(dashReq);
      assert.equal(dashRes.status, 200);
      const dashJson = await dashRes.json();
      assert.deepEqual(dashJson.data, {
        energyGenerated: 1450.5,
        wasteProcessed: 3200,
        taxSavings: 890.25,
      });
    } finally {
      dbMock.restore();
    }
  });

  test('POST e GET /api/indicators criam, atualizam e validam indicadores mensais do biodigestor', async () => {
    // Validação de mês/ano inválido -> 400
    const badMonthReq = createNextRequest('http://localhost:3003/api/indicators', {
      method: 'POST',
      headers: AUTH_HEADER,
      body: { month: 13, year: 2026, wasteProcessed: 100, energyGenerated: 50, taxSavings: 20 },
    });
    const badMonthRes = await indicatorsRoute.POST(badMonthReq);
    assert.equal(badMonthRes.status, 400);

    let hasExisting = false;
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('SELECT id FROM biodigester_indicators')) {
        return hasExisting ? { rowCount: 1, rows: [{ id: 'ind-existing' }] } : { rowCount: 0, rows: [] };
      }
      if (sql.includes('INSERT INTO biodigester_indicators')) {
        return {
          rows: [
            {
              id: 'ind-new',
              user_id: params[0],
              waste_processed: params[1],
              energy_generated: params[2],
              tax_savings: params[3],
              measured_at: params[4],
            },
          ],
        };
      }
      if (sql.includes('UPDATE biodigester_indicators')) {
        return {
          rows: [
            {
              id: 'ind-existing',
              user_id: params[5],
              waste_processed: params[0],
              energy_generated: params[1],
              tax_savings: params[2],
              measured_at: params[3],
            },
          ],
        };
      }
      return { rows: [] };
    });

    try {
      // Criação (201)
      const createReq = createNextRequest('http://localhost:3003/api/indicators', {
        method: 'POST',
        headers: AUTH_HEADER,
        body: { month: 10, year: 2026, wasteProcessed: 600, energyGenerated: 240, taxSavings: 180 },
      });
      const createRes = await indicatorsRoute.POST(createReq);
      assert.equal(createRes.status, 201);

      // Atualização no mesmo mês (200)
      hasExisting = true;
      const updateRes = await indicatorsRoute.POST(
        createNextRequest('http://localhost:3003/api/indicators', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { month: 10, year: 2026, wasteProcessed: 650, energyGenerated: 260, taxSavings: 195 },
        })
      );
      assert.equal(updateRes.status, 200);
      const updateJson = await updateRes.json();
      assert.equal(updateJson.data.waste_processed, 650);
    } finally {
      dbMock.restore();
    }
  });

  test('GET, POST e DELETE /api/markers gerenciam geolocalização das unidades de biodigestão e erros', async () => {
    // Validação de coordenadas ausentes -> 400
    const invalidCoordsReq = createNextRequest('http://localhost:3003/api/markers', {
      method: 'POST',
      headers: AUTH_HEADER,
      body: { title: 'Biodigestor Inválido', latitude: 'nao-numero', longitude: -46.6 },
    });
    const invalidCoordsRes = await markersRoute.POST(invalidCoordsReq);
    assert.equal(invalidCoordsRes.status, 400);

    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('INSERT INTO biodigestor_maps')) {
        return {
          rows: [{ id: 'mk-1', user_id: params[0], address: params[1], created_at: '2026-11-20T00:00:00Z' }],
        };
      }
      if (sql.includes('DELETE FROM biodigestor_maps')) {
        return { rowCount: params[0] === 'mk-1' ? 1 : 0 };
      }
      return {
        rows: [
          {
            id: 'mk-1',
            user_id: TEST_USER.id,
            address: { title: 'Unidade Central', latitude: -23.5, longitude: -46.6 },
          },
        ],
      };
    });

    try {
      const createRes = await markersRoute.POST(
        createNextRequest('http://localhost:3003/api/markers', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { title: 'Unidade Central', latitude: -23.5, longitude: -46.6, description: 'Reator 500m3' },
        })
      );
      assert.equal(createRes.status, 201);

      const listRes = await markersRoute.GET(
        createNextRequest('http://localhost:3003/api/markers', { headers: AUTH_HEADER })
      );
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.equal(listJson.data.length, 1);

      const delRes = await markerByIdRoute.DELETE(
        createNextRequest('http://localhost:3003/api/markers/mk-1', { method: 'DELETE', headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'mk-1' }) }
      );
      assert.equal(delRes.status, 200);

      const notFoundDel = await markerByIdRoute.DELETE(
        createNextRequest('http://localhost:3003/api/markers/mk-404', { method: 'DELETE', headers: AUTH_HEADER }),
        { params: Promise.resolve({ id: 'mk-404' }) }
      );
      assert.equal(notFoundDel.status, 404);
    } finally {
      dbMock.restore();
    }
  });
});
