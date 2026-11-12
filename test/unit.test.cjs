const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Transpila os módulos do projeto para executar os testes sem iniciar o Next.js.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
};
process.env.JWT_SECRET = 'unit-test-secret';
const jwt = require('jsonwebtoken');
const { signToken, verifyToken, getTokenFromCookieHeader, getTokenFromRequest } = require('../lib/auth/jwt.ts');
const { isValidEmail, validatePassword, validateRequiredFields, errorResponse } = require('../lib/api-response.ts');

test('token assinado preserva a identidade e expira em 30 dias', () => {
  const payload = verifyToken(signToken({ id: '1', email: 'a@example.com' }));
  assert.equal(payload.id, '1');
  assert.equal(payload.email, 'a@example.com');
  assert.equal(payload.exp - payload.iat, 30 * 24 * 60 * 60);
});

test('rejeita token adulterado e expirado', () => {
  assert.throws(() => verifyToken(jwt.sign({ id: '1' }, 'wrong-secret')));
  assert.throws(() => verifyToken(jwt.sign({ id: '1' }, process.env.JWT_SECRET, { expiresIn: -1 })));
  assert.equal(getTokenFromCookieHeader('biodash_token=invalido'), null);
  assert.equal(getTokenFromCookieHeader(null), null);
});

test('autentica por Bearer ou cookie e rejeita Bearer inválido', () => {
  const token = signToken({ id: '1', email: 'a@example.com' });
  assert.equal(getTokenFromRequest(new Request('http://localhost', { headers: { authorization: `Bearer ${token}` } })).id, '1');
  assert.equal(getTokenFromRequest(new Request('http://localhost', { headers: { cookie: `other=x; biodash_token=${token}` } })).id, '1');
  assert.equal(getTokenFromRequest(new Request('http://localhost', { headers: { authorization: 'Bearer invalido', cookie: `biodash_token=${token}` } })), null);
});

test('valida email e requisitos de senha', () => {
  assert.equal(isValidEmail('ana@example.com'), true);
  assert.equal(isValidEmail('ana@exemplo'), false);
  assert.deepEqual(validatePassword('Senha123'), { valid: true, errors: [] });
  const invalid = validatePassword('abc');
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 3);
});

test('campos obrigatórios identificam valores ausentes e espaços', () => {
  const result = validateRequiredFields({ email: 'a@example.com', name: '  ' }, ['email', 'name', 'password']);
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors), ['name', 'password']);
});

test('resposta de erro mantém status e detalhes de validação', async () => {
  const response = errorResponse('Dados inválidos', 422, { email: ['Obrigatório'] });
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { success: false, error: 'Dados inválidos', errors: { email: ['Obrigatório'] } });
});
