# 📋 INSTRUÇÕES PARA AGENTE - CORREÇÕES DE PRODUÇÃO

## 🎯 OBJETIVO

Corrigir problemas que impedem o backend de funcionar corretamente em produção:
1. Login não mantém sessão do usuário
2. Dashboard não reconhece usuário logado
3. Stripe checkout não funciona por erro de autenticação
4. CORS bloqueando requisições do frontend

## 📦 CONTEXTO

**Situação Atual:**
- ✅ Localmente tudo funciona (localhost:3001 → localhost:3003)
- ❌ Em produção falha (domínios diferentes, HTTPS, cookies cross-domain)

**Causa Raiz:**
- Cookies não funcionam entre domínios diferentes sem configuração especial
- CORS estava muito restritivo
- URLs com barras finais causando incompatibilidade

## 🔧 MUDANÇAS REALIZADAS

### 1. Arquivo: `lib/supabase/server.ts`

**Localização:** `c:\Users\tiago\Documents\GitHub\BioDashBD\lib\supabase\server.ts`

**O que foi mudado:**

A função `getCookieOptions` foi atualizada para detectar ambiente de produção e configurar cookies apropriadamente.

**ANTES:**
```typescript
export function getCookieOptions(options?: CookieOptions): CookieOptions {
  return {
    ...options,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: options?.httpOnly ?? false,
  };
}
```

**DEPOIS:**
```typescript
export function getCookieOptions(options?: CookieOptions): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith('https');
  
  return {
    ...options,
    path: "/",
    sameSite: isProduction ? "none" as const : "lax" as const,
    secure: isSecure,
    httpOnly: options?.httpOnly ?? false,
  };
}
```

**Por que?**
- `SameSite=None` é obrigatório para cookies entre domínios diferentes
- `Secure=true` é obrigatório quando `SameSite=None`
- Em desenvolvimento mantém `lax` para funcionar no localhost

---

### 2. Arquivo: `middleware.ts`

**Localização:** `c:\Users\tiago\Documents\GitHub\BioDashBD\middleware.ts`

**O que foi mudado:**

#### Mudança 2.1: Suporte a Múltiplas Origens

**ANTES:**
```typescript
// Remove barra final se existir na origem
function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}
const FRONTEND_ORIGIN = normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3001");
```

**DEPOIS:**
```typescript
// Remove barra final se existir na origem
function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

// Permitir múltiplas origens (dev e produção)
const ALLOWED_ORIGINS = [
  normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3001"),
  normalizeOrigin(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"),
].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicatas

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  return ALLOWED_ORIGINS.some(allowed => allowed === normalized);
}
```

**Por que?**
- Permite configurar diferentes URLs para dev e produção
- Remove duplicatas automaticamente
- Valida origem antes de adicionar headers

#### Mudança 2.2: CORS Preflight Melhorado

**ANTES:**
```typescript
// CORS Preflight para /api
if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
  const origin = req.headers.get("origin") || FRONTEND_ORIGIN;
  const normalizedOrigin = normalizeOrigin(origin);
  const resPre = new NextResponse(null, { status: 204 });
  resPre.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
  resPre.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  resPre.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  resPre.headers.set("Access-Control-Allow-Credentials", "true");
  return resPre;
}
```

**DEPOIS:**
```typescript
// CORS Preflight para /api
if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
  const origin = req.headers.get("origin");
  const resPre = new NextResponse(null, { status: 204 });
  
  if (origin && isAllowedOrigin(origin)) {
    const normalizedOrigin = normalizeOrigin(origin);
    resPre.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
    resPre.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    resPre.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    resPre.headers.set("Access-Control-Allow-Credentials", "true");
    resPre.headers.set("Vary", "Origin");
  }
  
  return resPre;
}
```

**Por que?**
- Valida se a origem é permitida antes de adicionar headers
- Permite header `Cookie` (necessário para autenticação)
- Adiciona `Vary: Origin` para cache correto

#### Mudança 2.3: CORS em Requisições Normais

**ANTES:**
```typescript
// CORS em rotas /api
if (req.nextUrl.pathname.startsWith("/api")) {
  const origin = req.headers.get("origin") || FRONTEND_ORIGIN;
  const normalizedOrigin = normalizeOrigin(origin);
  res.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
}
```

**DEPOIS:**
```typescript
// CORS em rotas /api
if (req.nextUrl.pathname.startsWith("/api")) {
  const origin = req.headers.get("origin");
  
  if (origin && isAllowedOrigin(origin)) {
    const normalizedOrigin = normalizeOrigin(origin);
    res.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
}
```

**Por que?**
- Valida origem antes de adicionar headers
- Adiciona `Vary: Origin` para consistência

---

### 3. Arquivo: `.env.local`

**Localização:** `c:\Users\tiago\Documents\GitHub\BioDashBD\.env.local`

**O que foi mudado:**

**ANTES:**
```env
#Endpoints / URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003/
FRONTEND_URL=http://localhost:3001/
NEXT_PUBLIC_SITE_URL=http://localhost:3001/
```

**DEPOIS:**
```env
#Endpoints / URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3003
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
```

**Por que?**
- Barras finais causam problemas de CORS (a origem `http://localhost:3001/` é diferente de `http://localhost:3001`)
- Adicionada variável `NEXT_PUBLIC_FRONTEND_URL` para flexibilidade
- Corrigido `NEXT_PUBLIC_SITE_URL` para apontar para o backend

---

## 📝 ARQUIVOS CRIADOS

### 4. Arquivo: `DEPLOY_PRODUCTION.md`

**Localização:** `c:\Users\tiago\Documents\GitHub\BioDashBD\DEPLOY_PRODUCTION.md`

**Conteúdo:** Guia completo de deploy com:
- Variáveis de ambiente para produção
- Configurações do Supabase
- Checklist de deploy
- Troubleshooting detalhado
- Comandos de teste

**Ação:** Apenas leitura, não requer mudanças no código.

---

## 🚀 INSTRUÇÕES PARA APLICAR EM PRODUÇÃO

### PASSO 1: Configurar Variáveis de Ambiente

**Onde:** Painel da Vercel/Railway/Render (onde o backend está hospedado)

**Adicionar/Atualizar estas variáveis:**

```env
# Supabase (copiar do .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://scsldapnrzpjkyqkeiop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs - SUBSTITUIR PELOS DOMÍNIOS REAIS DE PRODUÇÃO
NEXT_PUBLIC_API_BASE_URL=https://biodashbd-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://biodashbd-api.vercel.app
FRONTEND_URL=https://biodashbd-frontend.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://biodashbd-frontend.vercel.app

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx...  # ou sk_live_xxx em produção real
SECRET_STRIPE_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...

# Node
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- Substitua `biodashbd-api.vercel.app` pela URL real do backend
- Substitua `biodashbd-frontend.vercel.app` pela URL real do frontend
- NÃO inclua barras finais (`/`) nas URLs
- Use HTTPS em produção

### PASSO 2: Configurar Supabase

1. Acesse: https://app.supabase.com/project/scsldapnrzpjkyqkeiop/auth/url-configuration

2. Em **Site URL**, configure:
   ```
   https://biodashbd-frontend.vercel.app
   ```

3. Em **Redirect URLs**, adicione (uma por linha):
   ```
   https://biodashbd-frontend.vercel.app/dashboard
   https://biodashbd-frontend.vercel.app/auth/callback
   https://biodashbd-api.vercel.app/dashboard
   ```

4. Clique em **Save**

### PASSO 3: Fazer Redeploy

**Opção A - Vercel:**
```bash
# Via CLI
vercel --prod

# Ou no painel web:
# Deployments → ... → Redeploy
```

**Opção B - Railway/Render:**
- Faça um novo deploy ou force redeploy no painel

**⚠️ IMPORTANTE:** Não basta fazer um novo commit. Precisa fazer REDEPLOY após mudar variáveis de ambiente.

### PASSO 4: Testar

#### Teste 1: Login
```bash
curl -X POST https://biodashbd-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://biodashbd-frontend.vercel.app" \
  -d '{"email":"seu-email@exemplo.com","password":"sua-senha"}' \
  --cookie-jar cookies.txt \
  --include
```

**Resultado esperado:**
- Status: `200 OK`
- Headers: `Set-Cookie: sb-access-token=...; SameSite=None; Secure`
- Body: `{"success":true,"data":{"userId":"...","email":"..."}}`

#### Teste 2: Buscar Usuário
```bash
curl -X GET https://biodashbd-api.vercel.app/api/user \
  -H "Origin: https://biodashbd-frontend.vercel.app" \
  --cookie cookies.txt \
  --include
```

**Resultado esperado:**
- Status: `200 OK`
- Body: `{"success":true,"data":{"userId":"...","email":"..."}}`

#### Teste 3: Stripe Checkout
```bash
curl -X POST https://biodashbd-api.vercel.app/api/stripe/checkout-session \
  -H "Content-Type: application/json" \
  -H "Origin: https://biodashbd-frontend.vercel.app" \
  --cookie cookies.txt \
  -d '{"amount":50,"productName":"Teste"}' \
  --include
```

**Resultado esperado:**
- Status: `200 OK`
- Body: `{"success":true,"data":{"url":"https://checkout.stripe.com/..."}}`

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar todas as mudanças:

- [ ] Código foi atualizado nos 3 arquivos principais (`server.ts`, `middleware.ts`, `.env.local`)
- [ ] Variáveis de ambiente configuradas no painel de produção
- [ ] URLs de produção SEM barras finais
- [ ] Supabase configurado com URLs de redirect corretas
- [ ] Redeploy realizado (não apenas novo commit)
- [ ] Teste de login retorna `200 OK` e define cookies
- [ ] Cookies têm `SameSite=None` e `Secure=true` (verificar no DevTools)
- [ ] Teste `/api/user` retorna dados do usuário
- [ ] Teste Stripe checkout retorna URL do checkout
- [ ] No navegador: Login funciona e dashboard reconhece usuário
- [ ] No navegador: Stripe checkout funciona

---

## 🐛 TROUBLESHOOTING

### Erro: "Unauthorized" mesmo após login

**Diagnóstico:**
1. Abra DevTools → Application → Cookies
2. Verifique se existem cookies `sb-access-token` e `sb-refresh-token`

**Se NÃO houver cookies:**
- ❌ Problema no login ou configuração do Supabase
- ✅ Verifique `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Verifique logs do servidor durante o login

**Se HOUVER cookies mas ainda der erro:**
- ❌ Cookies não estão sendo enviados ou não têm configuração correta
- ✅ Verifique se cookies têm `SameSite=None` e `Secure=true`
- ✅ Verifique se o frontend usa `credentials: 'include'` nas requisições
- ✅ Verifique se CORS está permitindo a origem correta

### Erro: CORS policy

**Console mostra:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solução:**
1. Verifique se `FRONTEND_URL` e `NEXT_PUBLIC_FRONTEND_URL` estão corretas
2. Certifique-se de que NÃO têm barras finais
3. Faça redeploy do backend
4. Limpe cache do navegador (Ctrl+Shift+Delete)

### Erro: "Invalid redirect URL"

**Supabase retorna:**
```
redirect_to URL is not allowed
```

**Solução:**
1. Vá em Supabase → Authentication → URL Configuration
2. Adicione todas as URLs do frontend em "Redirect URLs"
3. Salve e aguarde 30 segundos
4. Tente novamente

---

## 📊 RESUMO DAS MUDANÇAS

| Arquivo | Linhas Mudadas | Impacto |
|---------|---------------|---------|
| `lib/supabase/server.ts` | ~15 | Crítico - Cookies funcionam em produção |
| `middleware.ts` | ~40 | Crítico - CORS e validação de origens |
| `.env.local` | ~4 | Importante - URLs corretas |
| `DEPLOY_PRODUCTION.md` | +300 | Documentação |

**Total de mudanças:** ~60 linhas de código + documentação

---

## 🎓 CONCEITOS IMPORTANTES

### SameSite Cookie Attribute

- `Lax`: Cookie só é enviado para requisições do mesmo domínio
- `None`: Cookie pode ser enviado entre domínios (requer `Secure=true`)
- `Strict`: Cookie NUNCA é enviado entre domínios

**Em produção com domínios diferentes, é obrigatório `SameSite=None`**

### Secure Cookie Attribute

- `true`: Cookie só é enviado via HTTPS
- `false`: Cookie pode ser enviado via HTTP

**Quando `SameSite=None`, o navegador EXIGE `Secure=true`**

### CORS (Cross-Origin Resource Sharing)

Permite que um domínio (frontend) acesse recursos de outro domínio (backend).

**Headers necessários:**
- `Access-Control-Allow-Origin`: Origem permitida
- `Access-Control-Allow-Credentials`: Permite envio de cookies
- `Access-Control-Allow-Headers`: Headers permitidos
- `Access-Control-Allow-Methods`: Métodos HTTP permitidos

---

## 📞 SUPORTE

Se após seguir todas as instruções ainda houver problemas:

1. **Compartilhe:**
   - Logs do servidor (remova informações sensíveis)
   - Headers da requisição (Network tab do DevTools)
   - Cookies atuais (Application tab do DevTools)
   - Variáveis de ambiente configuradas (sem valores sensíveis)

2. **Teste localmente:**
   - Configure `.env.local` com as URLs de produção
   - Teste se funciona localmente com essas URLs
   - Se funcionar local mas não em produção = problema de configuração de ambiente

3. **Verifique:**
   - Todas as variáveis de ambiente estão configuradas?
   - Fez redeploy após mudar variáveis?
   - Supabase está configurado com URLs corretas?
   - Frontend está usando `credentials: 'include'`?

---

**Data de criação:** 25 de novembro de 2025  
**Versão:** 1.0  
**Status:** Pronto para aplicação
