const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createNextRequest, mockGlobalFetch, mockPoolQuery } = require('./setup-ts.cjs');

const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} = require('@/lib/api-response');
const { signToken } = require('@/lib/auth/jwt');
const { normalizeMarker, getUserMarkers, getUserIndicators } = require('@/lib/chatbot-data');
const { AiServiceError, requestAi } = require('@/lib/ai-service');
const {
  getSafeFilePath,
  generateLocalToken,
  verifyLocalToken,
  LocalStorageAdapter,
} = require('@/lib/storage/adapters/local-storage.adapter');
const { ConsoleLoggerAdapter } = require('@/lib/logger/adapters/console-logger.adapter');
const { LocalTelemetryAdapter } = require('@/lib/telemetry/adapters/local-telemetry.adapter');
const { middleware } = require('@/middleware');

describe('Unit: Helpers de Resposta Padronizada (api-response)', () => {
  test('successResponse, validationErrorResponse, unauthorizedResponse e internalErrorResponse formatam payload corretamente', async () => {
    const okRes = successResponse({ items: [1, 2] }, 'Operação concluída', 201);
    assert.equal(okRes.status, 201);
    assert.deepEqual(await okRes.json(), {
      success: true,
      message: 'Operação concluída',
      data: { items: [1, 2] },
    });

    const valRes = validationErrorResponse({ email: ['Email inválido'] });
    assert.equal(valRes.status, 400);
    assert.deepEqual(await valRes.json(), {
      success: false,
      error: 'Validation failed',
      errors: { email: ['Email inválido'] },
    });

    const unauthRes = unauthorizedResponse('Token ausente');
    assert.equal(unauthRes.status, 401);
    assert.deepEqual(await unauthRes.json(), {
      success: false,
      error: 'Token ausente',
    });

    const internalRes = internalErrorResponse('Falha crítica');
    assert.equal(internalRes.status, 500);
    assert.deepEqual(await internalRes.json(), {
      success: false,
      error: 'Falha crítica',
    });

    const defaultErr = errorResponse('Bad request');
    assert.equal(defaultErr.status, 400);
  });
});

describe('Unit: Normalização e Dados de Contexto do Chatbot (chatbot-data)', () => {
  test('normalizeMarker aplica valores padrão seguros quando coordenadas ou endereço estão ausentes', () => {
    const raw = {
      id: 42,
      user_id: 'user-1',
      address: { title: 'Reator Sul', latitude: '-23.55', longitude: '-46.63', description: 'Unidade 1' },
      created_at: '2026-11-01T00:00:00Z',
    };
    const norm = normalizeMarker(raw);
    assert.equal(norm.id, '42');
    assert.equal(norm._id, '42');
    assert.equal(norm.title, 'Reator Sul');
    assert.equal(norm.latitude, -23.55);
    assert.equal(norm.longitude, -46.63);

    const fallback = normalizeMarker({ id: '99', user_id: 'user-1', address: null });
    assert.equal(fallback.title, 'Biodigestor');
    assert.equal(fallback.latitude, -14.235);
    assert.equal(fallback.longitude, -51.925);
    assert.equal(fallback.description, '');
  });

  test('getUserMarkers e getUserIndicators convertem tipos numéricos do banco', async () => {
    const dbMock = mockPoolQuery(async (sql) => {
      if (sql.includes('FROM biodigestor_maps')) {
        return {
          rows: [
            { id: 'm1', user_id: 'u1', address: { title: 'Bio A', latitude: -22.1, longitude: -47.2 } },
          ],
        };
      }
      return {
        rows: [
          {
            id: 'ind-1',
            user_id: 'u1',
            waste_processed: '1250.5',
            energy_generated: '480.25',
            tax_savings: '310.75',
          },
        ],
      };
    });

    try {
      const markers = await getUserMarkers('u1');
      assert.equal(markers.length, 1);
      assert.equal(markers[0].title, 'Bio A');

      const indicators = await getUserIndicators('u1', 10);
      assert.equal(indicators.length, 1);
      assert.equal(indicators[0].waste_processed, 1250.5);
      assert.equal(indicators[0].energy_generated, 480.25);
      assert.equal(indicators[0].tax_savings, 310.75);
    } finally {
      dbMock.restore();
    }
  });
});

describe('Unit: Cliente do Serviço de IA e Tratamento de Erros (ai-service)', () => {
  test('requestAi retorna payload JSON em caso de sucesso', async () => {
    const fetchMock = mockGlobalFetch(async () => new Response(JSON.stringify({ reply: 'Tudo normal' }), { status: 200 }));
    try {
      const res = await requestAi('/chatbot', { method: 'POST' });
      assert.deepEqual(res, { reply: 'Tudo normal' });
      assert.equal(fetchMock.calls.length, 1);
    } finally {
      fetchMock.restore();
    }
  });

  test('requestAi trata erros HTTP 502/503/504, 422, payload não-JSON e falha de rede', async () => {
    let mode = '503';
    const fetchMock = mockGlobalFetch(async () => {
      if (mode === '503') {
        return new Response(JSON.stringify({ detail: 'Service overloaded' }), { status: 503 });
      }
      if (mode === '422') {
        return new Response(JSON.stringify({ detail: 'No speech detected' }), { status: 422 });
      }
      if (mode === 'invalid-json') {
        return new Response('<html>Gateway Error</html>', { status: 200 });
      }
      if (mode === 'abort') {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        throw err;
      }
      throw new Error('ECONNREFUSED');
    });

    try {
      await assert.rejects(
        () => requestAi('/transcribe'),
        (err) => err instanceof AiServiceError && err.status === 503 && /indisponível ou sobrecarregado/.test(err.message)
      );

      mode = '422';
      await assert.rejects(
        () => requestAi('/transcribe'),
        (err) => err instanceof AiServiceError && err.status === 422 && err.message === 'No speech detected'
      );

      mode = 'invalid-json';
      await assert.rejects(
        () => requestAi('/chatbot'),
        (err) => err instanceof AiServiceError && /resposta inválida/.test(err.message)
      );

      mode = 'abort';
      await assert.rejects(
        () => requestAi('/chatbot'),
        (err) => err instanceof AiServiceError && err.status === 504 && /excedeu o tempo/.test(err.message)
      );

      mode = 'network';
      await assert.rejects(
        () => requestAi('/chatbot'),
        (err) => err instanceof AiServiceError && err.status === 503 && /indisponível/.test(err.message)
      );
    } finally {
      fetchMock.restore();
    }
  });
});

describe('Unit: Armazenamento Local, Tokens HMAC e Proteção contra Path Traversal', () => {
  test('generateLocalToken e verifyLocalToken validam assinatura e expiração', () => {
    const token = generateLocalToken('user-1/avatar.png', 60);
    assert.equal(verifyLocalToken('user-1/avatar.png', token), true);
    assert.equal(verifyLocalToken('user-2/avatar.png', token), false);
    assert.equal(verifyLocalToken('user-1/avatar.png', 'invalid.token'), false);
    assert.equal(verifyLocalToken('user-1/avatar.png', ''), false);

    const expiredToken = generateLocalToken('user-1/avatar.png', -10);
    assert.equal(verifyLocalToken('user-1/avatar.png', expiredToken), false);
  });

  test('getSafeFilePath resolve caminhos seguros e LocalStorageAdapter gera URLs e remove arquivos', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biodash-unit-storage-'));
    process.env.LOCAL_STORAGE_DIR = tmpDir;

    try {
      const safePath = getSafeFilePath(tmpDir, 'user-1/foto.png');
      assert.equal(safePath.startsWith(path.resolve(tmpDir)), true);

      const adapter = new LocalStorageAdapter();
      const upload = await adapter.generateUploadUrl('meu avatar!.png', 'image/png', 'user-123', 'http://localhost:3003');
      assert.equal(upload.key, 'user-123/meu_avatar_.png');
      assert.match(upload.uploadUrl, /\/api\/storage\/local-upload\?key=user-123%2Fmeu_avatar_\.png&token=/);

      const download = await adapter.generateDownloadUrl('/user-123/meu_avatar_.png', 1800, 'http://localhost:3003');
      assert.equal(download.key, 'user-123/meu_avatar_.png');
      assert.equal(download.expiresInSeconds, 1800);

      const targetFile = getSafeFilePath(tmpDir, upload.key);
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, 'conteudo-teste');
      assert.equal(fs.existsSync(targetFile), true);

      const deleted = await adapter.deleteFile(upload.key);
      assert.equal(deleted, true);
      assert.equal(fs.existsSync(targetFile), false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('Unit: Adapters de Logger, Telemetria e Middleware CORS/Auth', () => {
  test('ConsoleLoggerAdapter e LocalTelemetryAdapter executam sem falhas', () => {
    const logger = new ConsoleLoggerAdapter();
    assert.equal(logger.providerName, 'console');
    logger.info('Teste info', { module: 'unit' });
    logger.warn('Teste warn');
    logger.error('Teste error');

    const telemetry = new LocalTelemetryAdapter();
    assert.equal(telemetry.isInitialized(), false);
    telemetry.init();
    assert.equal(telemetry.isInitialized(), true);
    telemetry.init(); // idempotente
    assert.equal(telemetry.isInitialized(), true);
  });

  test('middleware gerencia preflight CORS e protege rotas /dashboard exigindo JWT válido', async () => {
    const preflightAllowed = createNextRequest('http://localhost:3003/api/alerts', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:8081' },
    });
    const preflightRes = await middleware(preflightAllowed);
    assert.equal(preflightRes.status, 204);
    assert.equal(preflightRes.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8081');
    assert.equal(preflightRes.headers.get('Access-Control-Allow-Credentials'), 'true');

    const preflightBlocked = createNextRequest('http://localhost:3003/api/alerts', {
      method: 'OPTIONS',
      headers: { origin: 'https://malicious-site.example.com' },
    });
    const blockedRes = await middleware(preflightBlocked);
    assert.equal(blockedRes.status, 204);
    assert.equal(blockedRes.headers.get('Access-Control-Allow-Origin'), null);

    // Acesso sem token ao /dashboard redireciona para /login
    const unauthDash = createNextRequest('http://localhost:3003/dashboard/metrics');
    const redirectRes = await middleware(unauthDash);
    assert.equal(redirectRes.status, 307);
    assert.match(redirectRes.headers.get('location') || '', /\/login\?next=%2Fdashboard%2Fmetrics/);

    // Acesso com token válido permite prosseguir
    const validToken = signToken({ id: 'u-1', email: 'admin@biodash.com' });
    const authDash = createNextRequest('http://localhost:3003/dashboard', {
      headers: { cookie: `biodash_token=${validToken}` },
    });
    const allowedDashRes = await middleware(authDash);
    assert.equal(allowedDashRes.status, 200);
  });
});
