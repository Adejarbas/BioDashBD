const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { createNextRequest, mockPoolQuery, mockGlobalFetch } = require('./setup-ts.cjs');

const { signToken } = require('@/lib/auth/jwt');
const loginRoute = require('@/app/api/auth/login/route');
const signupRoute = require('@/app/api/auth/signup/route');
const logoutRoute = require('@/app/api/auth/logout/route');
const passwordRoute = require('@/app/api/auth/password/route');
const userRoute = require('@/app/api/user/route');
const profileRoute = require('@/app/api/profile/route');
const healthRoute = require('@/app/api/health/route');
const activitiesRoute = require('@/app/api/activities/route');
const schedulesRoute = require('@/app/api/maintenance/schedules/route');
const scheduleByIdRoute = require('@/app/api/maintenance/schedules/[id]/route');
const incidentsRoute = require('@/app/api/maintenance/incidents/route');
const activeIncidentsRoute = require('@/app/api/maintenance/incidents/active/route');
const chatbotRoute = require('@/app/api/chatbot/route');
const transcribeRoute = require('@/app/api/chatbot/transcribe/route');
const semanticSearchRoute = require('@/app/api/semantic-search/route');
const uploadUrlRoute = require('@/app/api/storage/upload-url/route');
const downloadUrlRoute = require('@/app/api/storage/download-url/route');
const localUploadRoute = require('@/app/api/storage/local-upload/route');
const localFileRoute = require('@/app/api/storage/local-file/route');

const TEST_USER = { id: 'user-api-99', email: 'operador@biodash.com' };
const TOKEN = signToken(TEST_USER);
const AUTH_HEADER = { authorization: `Bearer ${TOKEN}` };
const COOKIE_HEADER = { cookie: `biodash_token=${TOKEN}` };

describe('Integration: Autenticação, Sessão, Usuário e Perfil (/api/auth/*, /api/user, /api/profile)', () => {
  test('POST /api/auth/signup registra novo usuário + perfil e rejeita duplicidade ou senha fraca', async () => {
    // Senha fraca -> 400
    const weakRes = await signupRoute.POST(
      createNextRequest('http://localhost:3003/api/auth/signup', {
        method: 'POST',
        body: { email: 'novo@biodash.com', password: '123', full_name: 'Operador Bio' },
      })
    );
    assert.equal(weakRes.status, 400);

    let emailExists = false;
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('SELECT id FROM users WHERE email')) {
        return { rows: emailExists ? [{ id: 'u-1' }] : [] };
      }
      if (sql.includes('INSERT INTO users')) {
        return { rows: [{ id: 'u-new', email: params[0] }] };
      }
      if (sql.includes('INSERT INTO user_profiles')) {
        return { rowCount: 1, rows: [] };
      }
      return { rows: [] };
    });

    try {
      const okRes = await signupRoute.POST(
        createNextRequest('http://localhost:3003/api/auth/signup', {
          method: 'POST',
          body: {
            email: 'Novo@BioDash.com',
            password: 'Password123',
            full_name: 'Operador Bio',
            company_name: 'BioGen Energia',
          },
        })
      );
      assert.equal(okRes.status, 200);
      const okJson = await okRes.json();
      assert.equal(okJson.success, true);
      assert.equal(okJson.data.email, 'novo@biodash.com');
      assert.ok(okJson.data.token);

      // Email já existente -> 409
      emailExists = true;
      const conflictRes = await signupRoute.POST(
        createNextRequest('http://localhost:3003/api/auth/signup', {
          method: 'POST',
          body: {
            email: 'novo@biodash.com',
            password: 'Password123',
            full_name: 'Operador Bio',
          },
        })
      );
      assert.equal(conflictRes.status, 409);
    } finally {
      dbMock.restore();
    }
  });

  test('POST /api/auth/login, /api/auth/logout, PUT /api/auth/password, GET /api/user e /api/profile', async () => {
    const hash = await bcrypt.hash('SenhaForte123', 4);
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('SELECT id, email, password_hash FROM users')) {
        if (params[0] === 'operador@biodash.com') {
          return { rows: [{ id: TEST_USER.id, email: TEST_USER.email, password_hash: hash }] };
        }
        return { rows: [] };
      }
      if (sql.includes('SELECT id, email, created_at FROM users')) {
        return { rows: [{ id: TEST_USER.id, email: TEST_USER.email, created_at: '2026-01-01T00:00:00Z' }] };
      }
      if (sql.includes('UPDATE users SET password_hash')) {
        return { rowCount: 1, rows: [] };
      }
      if (sql.includes('SELECT * FROM user_profiles')) {
        return { rows: [{ user_id: TEST_USER.id, name: 'Operador Chefe', company: 'BioGen' }] };
      }
      if (sql.includes('INSERT INTO user_profiles')) {
        return {
          rows: [{ user_id: params[0], name: params[1], company: params[2], city: params[7] }],
        };
      }
      return { rows: [] };
    });

    try {
      // Login com sucesso
      const loginRes = await loginRoute.POST(
        createNextRequest('http://localhost:3003/api/auth/login', {
          method: 'POST',
          body: { email: 'operador@biodash.com', password: 'SenhaForte123' },
        })
      );
      assert.equal(loginRes.status, 200);
      const loginJson = await loginRes.json();
      assert.equal(loginJson.success, true);
      assert.ok(loginJson.data.token);

      // Login com senha incorreta -> 401
      const wrongPassRes = await loginRoute.POST(
        createNextRequest('http://localhost:3003/api/auth/login', {
          method: 'POST',
          body: { email: 'operador@biodash.com', password: 'wrong' },
        })
      );
      assert.equal(wrongPassRes.status, 401);

      // Troca de senha válida e inválida
      const shortPassRes = await passwordRoute.PUT(
        createNextRequest('http://localhost:3003/api/auth/password', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { newPassword: '123' },
        })
      );
      assert.equal(shortPassRes.status, 400);

      const okPassRes = await passwordRoute.PUT(
        createNextRequest('http://localhost:3003/api/auth/password', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { newPassword: 'NovaSenha123' },
        })
      );
      assert.equal(okPassRes.status, 200);

      // GET /api/user
      const userRes = await userRoute.GET(
        createNextRequest('http://localhost:3003/api/user', { headers: COOKIE_HEADER })
      );
      assert.equal(userRes.status, 200);
      const userJson = await userRes.json();
      assert.equal(userJson.data.email, TEST_USER.email);

      // GET e PUT /api/profile
      const getProfRes = await profileRoute.GET(
        createNextRequest('http://localhost:3003/api/profile', { headers: AUTH_HEADER })
      );
      assert.equal(getProfRes.status, 200);

      const putProfRes = await profileRoute.PUT(
        createNextRequest('http://localhost:3003/api/profile', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { name: 'Operador Atualizado', razaoSocial: 'BioGen S.A.', city: 'Campinas', numero: '150' },
        })
      );
      assert.equal(putProfRes.status, 200);
      const putProfJson = await putProfRes.json();
      assert.equal(putProfJson.data.company, 'BioGen S.A.');

      // Logout
      const logoutRes = await logoutRoute.POST(
        createNextRequest('http://localhost:3003/api/auth/logout', { method: 'POST', headers: AUTH_HEADER })
      );
      assert.equal(logoutRes.status, 200);
    } finally {
      dbMock.restore();
    }
  });
});

describe('Integration: Manutenções, Incidentes, Atividades e Health Check', () => {
  test('GET /api/health retorna status ok e metadados do serviço', async () => {
    const res = await healthRoute.GET(createNextRequest('http://localhost:3003/api/health?verbose=true'));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'ok');
    assert.equal(json.service, 'biodash-backend');
  });

  test('Fluxo integrado de agendamentos (/api/maintenance/schedules) e incidentes (/api/maintenance/incidents)', async () => {
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('INSERT INTO maintenance_schedules')) {
        return {
          rows: [{ id: 'sch-1', user_id: params[0], name: params[1], priority: params[2], status: 'pending' }],
        };
      }
      if (sql.includes('SELECT * FROM maintenance_schedules')) {
        return { rows: [{ id: 'sch-1', name: 'Limpeza de Filtro H2S', priority: 'high', status: 'pending' }] };
      }
      if (sql.includes('UPDATE maintenance_schedules')) {
        return { rows: params[1] === 'sch-1' ? [{ id: 'sch-1', status: params[0] }] : [] };
      }
      if (sql.includes('DELETE FROM maintenance_schedules')) {
        return { rowCount: params[0] === 'sch-1' ? 1 : 0 };
      }
      if (sql.includes('INSERT INTO maintenance_incidents')) {
        return { rows: [{ id: 'inc-1', user_id: params[0], description: params[1], status: 'pending' }] };
      }
      if (sql.includes('SELECT * FROM maintenance_incidents')) {
        return { rows: [{ id: 'inc-1', description: 'Vazamento na válvula 2', status: 'pending' }] };
      }
      if (sql.includes('UPDATE maintenance_incidents')) {
        return { rowCount: 1 };
      }
      return { rows: [] };
    });

    try {
      // Criação de agendamento inválido (sem nome) -> 400
      const invalidSch = await schedulesRoute.POST(
        createNextRequest('http://localhost:3003/api/maintenance/schedules', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { name: '  ', scheduledDate: '2026-12-01T10:00:00Z' },
        })
      );
      assert.equal(invalidSch.status, 400);

      // Criação de agendamento válido -> 201
      const createSch = await schedulesRoute.POST(
        createNextRequest('http://localhost:3003/api/maintenance/schedules', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { name: 'Limpeza de Filtro H2S', priority: 'high', scheduledDate: '2026-12-01T10:00:00Z' },
        })
      );
      assert.equal(createSch.status, 201);

      // Listagem -> 200
      const listSch = await schedulesRoute.GET(
        createNextRequest('http://localhost:3003/api/maintenance/schedules', { headers: AUTH_HEADER })
      );
      assert.equal(listSch.status, 200);

      // Atualização de status inválido -> 400 e válido -> 200
      const badStatus = await scheduleByIdRoute.PUT(
        createNextRequest('http://localhost:3003/api/maintenance/schedules/sch-1', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { status: 'unknown' },
        }),
        { params: Promise.resolve({ id: 'sch-1' }) }
      );
      assert.equal(badStatus.status, 400);

      const okStatus = await scheduleByIdRoute.PUT(
        createNextRequest('http://localhost:3003/api/maintenance/schedules/sch-1', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { status: 'completed' },
        }),
        { params: Promise.resolve({ id: 'sch-1' }) }
      );
      assert.equal(okStatus.status, 200);

      // Remoção -> 200
      const delSch = await scheduleByIdRoute.DELETE(
        createNextRequest('http://localhost:3003/api/maintenance/schedules/sch-1', {
          method: 'DELETE',
          headers: AUTH_HEADER,
        }),
        { params: Promise.resolve({ id: 'sch-1' }) }
      );
      assert.equal(delSch.status, 200);

      // Incidentes: criar, buscar ativo e resolver
      const createInc = await incidentsRoute.POST(
        createNextRequest('http://localhost:3003/api/maintenance/incidents', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { description: 'Vazamento na válvula 2' },
        })
      );
      assert.equal(createInc.status, 201);

      const getInc = await incidentsRoute.GET(
        createNextRequest('http://localhost:3003/api/maintenance/incidents', { headers: AUTH_HEADER })
      );
      assert.equal(getInc.status, 200);

      const resolveInc = await activeIncidentsRoute.PUT(
        createNextRequest('http://localhost:3003/api/maintenance/incidents/active', {
          method: 'PUT',
          headers: AUTH_HEADER,
          body: { resolutionMessage: 'Vedação substituída' },
        })
      );
      assert.equal(resolveInc.status, 200);
    } finally {
      dbMock.restore();
    }
  });

  test('GET e POST /api/activities validam parâmetros e formatam timestamps relativos', async () => {
    const dbMock = mockPoolQuery(async (sql, params) => {
      if (sql.includes('INSERT INTO activities')) {
        return {
          rows: [
            {
              id: 'act-1',
              user_id: params[0],
              type: params[1],
              description: params[2],
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        rows: [
          {
            id: 'act-1',
            type: 'info',
            description: 'Leitura IoT sincronizada',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });

    try {
      // Limit fora da faixa -> 400
      const badLimit = await activitiesRoute.GET(
        createNextRequest('http://localhost:3003/api/activities?limit=500', { headers: COOKIE_HEADER })
      );
      assert.equal(badLimit.status, 400);

      const okList = await activitiesRoute.GET(
        createNextRequest('http://localhost:3003/api/activities?limit=5', { headers: COOKIE_HEADER })
      );
      assert.equal(okList.status, 200);
      const listJson = await okList.json();
      assert.equal(listJson.data.activities[0].timestamp, 'Agora mesmo');

      const postAct = await activitiesRoute.POST(
        createNextRequest('http://localhost:3003/api/activities', {
          method: 'POST',
          headers: COOKIE_HEADER,
          body: { type: 'success', description: 'Purga de condensado concluída' },
        })
      );
      assert.equal(postAct.status, 200);
    } finally {
      dbMock.restore();
    }
  });
});

describe('Integration: Comunicação entre Componentes (PostgreSQL + AI Service + Storage Pipeline)', () => {
  test('POST /api/chatbot, /api/semantic-search e /api/chatbot/transcribe integram banco e AI Service com tratamento de erros', async () => {
    const dbMock = mockPoolQuery(async (sql) => {
      if (sql.includes('FROM biodigestor_maps')) {
        return {
          rows: [{ id: 'm1', user_id: TEST_USER.id, address: { title: 'Reator Principal', latitude: -23, longitude: -46 } }],
        };
      }
      return {
        rows: [{ id: 'i1', user_id: TEST_USER.id, waste_processed: 500, energy_generated: 200, tax_savings: 100 }],
      };
    });

    let aiMode = 'ok';
    const fetchMock = mockGlobalFetch(async (url, init) => {
      if (aiMode === 'down') {
        return new Response(JSON.stringify({ detail: 'AI Service offline' }), { status: 503 });
      }
      if (url.endsWith('/chatbot')) {
        const sent = JSON.parse(init.body);
        assert.equal(sent.markers.length, 1);
        assert.equal(sent.indicators.length, 1);
        return new Response(
          JSON.stringify({ reply: 'O Reator Principal gerou 200 kWh.', intent: 'status_check', confidence: 0.96 }),
          { status: 200 }
        );
      }
      if (url.endsWith('/semantic-search')) {
        return new Response(
          JSON.stringify({ results: [{ id: 'm1', title: 'Reator Principal', score: 0.91 }] }),
          { status: 200 }
        );
      }
      if (url.endsWith('/transcribe')) {
        if (aiMode === 'silence') {
          return new Response(JSON.stringify({ text: '   ', duration: 3.2 }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ text: 'Qual a pressão do biodigestor?', language: 'pt', duration: 4.5 }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 200 });
    });

    try {
      // 1. Chatbot integra indicadores + marcadores do banco e envia ao AI Service
      const chatRes = await chatbotRoute.POST(
        createNextRequest('http://localhost:3003/api/chatbot', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { message: 'Como está a produção hoje?' },
        })
      );
      assert.equal(chatRes.status, 200);
      const chatJson = await chatRes.json();
      assert.equal(chatJson.data.intent, 'status_check');

      // 2. Semantic Search
      const searchRes = await semanticSearchRoute.POST(
        createNextRequest('http://localhost:3003/api/semantic-search', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { query: 'reator principal' },
        })
      );
      assert.equal(searchRes.status, 200);
      const searchJson = await searchRes.json();
      assert.equal(searchJson.data.results.length, 1);

      // 3. Transcrição de voz com sucesso e com silêncio (no-recognized)
      const form = new FormData();
      form.append('audio', new File([Buffer.from('fake-webm-audio-data')], 'voice.webm', { type: 'audio/webm' }));
      form.append('durationSeconds', '4.5');

      const transRes = await transcribeRoute.POST(
        createNextRequest('http://localhost:3003/api/chatbot/transcribe', {
          method: 'POST',
          headers: AUTH_HEADER,
          formData: form,
        })
      );
      assert.equal(transRes.status, 200);
      const transJson = await transRes.json();
      assert.equal(transJson.data.status, 'success');
      assert.equal(transJson.data.text, 'Qual a pressão do biodigestor?');

      // Áudio excedendo duração máxima (12s + 1.5s tolerância) -> 413
      const longForm = new FormData();
      longForm.append('audio', new File([Buffer.from('audio')], 'long.webm', { type: 'audio/webm' }));
      longForm.append('durationSeconds', '18');
      const longRes = await transcribeRoute.POST(
        createNextRequest('http://localhost:3003/api/chatbot/transcribe', {
          method: 'POST',
          headers: AUTH_HEADER,
          formData: longForm,
        })
      );
      assert.equal(longRes.status, 413);

      // Silêncio -> status no-recognized
      aiMode = 'silence';
      const silenceForm = new FormData();
      silenceForm.append('audio', new File([Buffer.from('silence')], 'silence.webm', { type: 'audio/webm' }));
      const silenceRes = await transcribeRoute.POST(
        createNextRequest('http://localhost:3003/api/chatbot/transcribe', {
          method: 'POST',
          headers: AUTH_HEADER,
          formData: silenceForm,
        })
      );
      assert.equal(silenceRes.status, 200);
      const silenceJson = await silenceRes.json();
      assert.equal(silenceJson.data.status, 'no-recognized');

      // Falha do AI Service -> 503 propagado corretamente
      aiMode = 'down';
      const downRes = await chatbotRoute.POST(
        createNextRequest('http://localhost:3003/api/chatbot', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { message: 'Status?' },
        })
      );
      assert.equal(downRes.status, 503);
    } finally {
      fetchMock.restore();
      dbMock.restore();
    }
  });

  test('Pipeline completo de Storage: upload-url -> local-upload -> download-url -> local-file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biodash-int-storage-'));
    process.env.LOCAL_STORAGE_DIR = tmpDir;

    try {
      // 1. Solicita URL assinada de upload
      const upUrlRes = await uploadUrlRoute.POST(
        createNextRequest('http://localhost:3003/api/storage/upload-url', {
          method: 'POST',
          headers: AUTH_HEADER,
          body: { fileName: 'relatorio.txt', contentType: 'text/plain' },
        })
      );
      assert.equal(upUrlRes.status, 200);
      const upUrlJson = await upUrlRes.json();
      assert.ok(upUrlJson.data.uploadUrl);
      assert.equal(upUrlJson.data.key, `${TEST_USER.id}/relatorio.txt`);

      // 2. Realiza upload usando a URL assinada gerada
      const fileContent = 'Relatorio operacional do biodigestor - 2026';
      const doUploadRes = await localUploadRoute.PUT(
        createNextRequest(upUrlJson.data.uploadUrl, {
          method: 'PUT',
          headers: { 'content-type': 'text/plain' },
          body: fileContent,
        })
      );
      assert.equal(doUploadRes.status, 200);

      // 3. Solicita URL de download
      const downUrlRes = await downloadUrlRoute.GET(
        createNextRequest(
          `http://localhost:3003/api/storage/download-url?key=${encodeURIComponent(upUrlJson.data.key)}`,
          { headers: AUTH_HEADER }
        )
      );
      assert.equal(downUrlRes.status, 200);
      const downUrlJson = await downUrlRes.json();

      // 4. Baixa o arquivo pelo endpoint local-file
      const serveRes = await localFileRoute.GET(createNextRequest(downUrlJson.data.downloadUrl));
      assert.equal(serveRes.status, 200);
      assert.equal(serveRes.headers.get('content-type'), 'text/plain');
      assert.equal(await serveRes.text(), fileContent);

      // 5. Cenário de erro: token inválido no local-upload -> 401
      const badTokenRes = await localUploadRoute.PUT(
        createNextRequest('http://localhost:3003/api/storage/local-upload?key=teste.txt&token=invalido', {
          method: 'PUT',
          body: 'dados',
        })
      );
      assert.equal(badTokenRes.status, 401);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
