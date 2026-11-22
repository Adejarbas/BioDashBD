const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT_DIR = path.resolve(__dirname, '..');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.LOGGER_PROVIDER = process.env.LOGGER_PROVIDER || 'console';
process.env.TELEMETRY_PROVIDER = process.env.TELEMETRY_PROVIDER || 'local';
process.env.STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// Suporte a aliases @/ e resolução de .ts/.tsx sem precisar subir o servidor Next.js
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  let target = request;
  if (typeof target === 'string' && target.startsWith('@/')) {
    target = path.join(ROOT_DIR, target.slice(2));
  }

  if (typeof target === 'string' && (target.startsWith(ROOT_DIR) || target.startsWith('.'))) {
    const base = target.startsWith('.') && parent?.filename
      ? path.resolve(path.dirname(parent.filename), target)
      : target;

    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.cjs`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.js'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }

  return originalResolveFilename.call(this, target, parent, isMain, options);
};

// Transpila arquivos TypeScript em memória sob demanda
const compileTs = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });
  module._compile(transpiled.outputText, filename);
};

require.extensions['.ts'] = compileTs;
require.extensions['.tsx'] = compileTs;

const { NextRequest } = require('next/server');
const pool = require('@/lib/postgres/client').default;

/**
 * Cria uma instância real de NextRequest compatível com os Route Handlers do App Router
 */
function createNextRequest(url, options = {}) {
  const { method = 'GET', headers = {}, body, formData } = options;
  const init = {
    method,
    headers: new Headers(headers),
  };

  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    if (typeof body === 'string' || Buffer.isBuffer(body) || body instanceof ArrayBuffer) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      if (!init.headers.has('content-type')) {
        init.headers.set('content-type', 'application/json');
      }
    }
  }

  return new NextRequest(url, init);
}

/**
 * Intercepta pool.query durante um teste e garante restauração automática
 */
function mockPoolQuery(handler) {
  const originalQuery = pool.query;
  const calls = [];
  pool.query = async (sql, params) => {
    calls.push({ sql: String(sql).trim(), params });
    return handler(String(sql), params, calls);
  };
  return {
    calls,
    restore() {
      pool.query = originalQuery;
    },
  };
}

/**
 * Intercepta global.fetch durante um teste e garante restauração automática
 */
function mockGlobalFetch(handler) {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init, calls);
  };
  return {
    calls,
    restore() {
      global.fetch = originalFetch;
    },
  };
}

module.exports = {
  ROOT_DIR,
  createNextRequest,
  mockPoolQuery,
  mockGlobalFetch,
  pool,
};
