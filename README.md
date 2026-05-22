# 🌱 BioDashBD - Backend API

> Sistema de gerenciamento e monitoramento de biodigestores com análise de dados em tempo real, autenticação segura e integração com pagamentos.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?style=flat-square&logo=stripe)](https://stripe.com/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Documentação da API](#-documentação-da-api)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

BioDashBD é uma API REST moderna construída com Next.js 16 que fornece backend completo para aplicações de monitoramento de biodigestores. O sistema oferece:

- **Gestão de Usuários**: Autenticação segura via Supabase com sessões baseadas em cookies
- **Monitoramento em Tempo Real**: Coleta e análise de dados de biodigestores
- **Histórico de Atividades**: Rastreamento de eventos e ações do sistema
- **Indicadores de Performance**: Métricas e KPIs para dashboards
- **Processamento de Pagamentos**: Integração completa com Stripe para checkout

### Por que Next.js para Backend?

- ✅ App Router com suporte nativo a API Routes
- ✅ TypeScript first-class support
- ✅ Edge Runtime para performance otimizada
- ✅ Middleware para autenticação e CORS
- ✅ Deploy simplificado na Vercel
- ✅ Hot reload durante desenvolvimento

## ✨ Funcionalidades

### Autenticação e Autorização
- ✅ Registro de usuários com validação robusta
- ✅ Login/Logout com sessões seguras
- ✅ Autenticação baseada em cookies (HTTP-only)
- ✅ Middleware de proteção de rotas
- ✅ Integração com Supabase Auth

### Gerenciamento de Dados
- ✅ CRUD de atividades do usuário
- ✅ Dados históricos de biodigestores
- ✅ Indicadores de dashboard
- ✅ Filtros e paginação

### Pagamentos
- ✅ Criação de sessões de checkout Stripe (sem necessidade de login)
- ✅ Checkout personalizado com valores dinâmicos (sem necessidade de login)
- ✅ Webhooks para confirmação de pagamento (preparado)

### Segurança
- ✅ CORS configurado para frontend específico
- ✅ Validação de dados em todas as rotas
- ✅ Sanitização de inputs
- ✅ Rate limiting (preparado)
- ✅ Headers de segurança

## 🛠 Tecnologias

### Core
- **[Next.js 16](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Tipagem estática
- **[Node.js](https://nodejs.org/)** - Runtime JavaScript

### Banco de Dados e Autenticação
- **[Supabase](https://supabase.com/)** - PostgreSQL + Auth + Storage
- **[@supabase/ssr](https://www.npmjs.com/package/@supabase/ssr)** - SSR e cookies
- **[@supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js)** - Cliente JavaScript

### Pagamentos
- **[Stripe](https://stripe.com/)** - Processamento de pagamentos
- **[stripe](https://www.npmjs.com/package/stripe)** - SDK oficial do Stripe

### Utilidades
- **[clsx](https://www.npmjs.com/package/clsx)** - Utilitário para classes CSS
- **[tailwind-merge](https://www.npmjs.com/package/tailwind-merge)** - Merge de classes Tailwind
- **[cors](https://www.npmjs.com/package/cors)** - Middleware CORS

### Desenvolvimento
- **[@types/node](https://www.npmjs.com/package/@types/node)** - Tipos do Node.js
- **[@types/react](https://www.npmjs.com/package/@types/react)** - Tipos do React

## 📁 Estrutura do Projeto

```
BioDashBD/
├── 📂 app/
│   └── 📂 api/                    # API Routes (App Router)
│       ├── 📂 auth/               # Autenticação
│       │   ├── 📂 login/          # POST /api/auth/login
│       │   ├── 📂 logout/         # POST /api/auth/logout
│       │   └── 📂 signup/         # POST /api/auth/signup
│       ├── 📂 user/               # GET /api/user
│       ├── 📂 activities/         # Atividades do sistema
│       │   ├── route.ts           # GET/POST /api/activities
│       │   └── 📂 demo/           # POST /api/activities/demo
│       ├── 📂 biodigester/
│       │   └── 📂 data/           # GET /api/biodigester/data
│       ├── 📂 dashboard/
│       │   └── 📂 indicators/     # GET /api/dashboard/indicators
│       └── 📂 stripe/             # Integração Stripe
│           ├── route.ts           # POST /api/stripe
│           └── 📂 checkout-session/ # POST /api/stripe/checkout-session
│
├── 📂 lib/                        # Utilitários e helpers
│   ├── actions.ts                 # Server actions
│   ├── utils.ts                   # Funções utilitárias
│   ├── api-response.ts            # Helpers de resposta padronizada
│   └── 📂 supabase/               # Configuração Supabase
│       ├── client.ts              # Cliente browser
│       ├── server.ts              # Cliente server
│       └── middleware.ts          # Cliente middleware
│
├── 📂 public/                     # Arquivos estáticos
├── middleware.ts                  # Middleware global (CORS, Auth)
├── next.config.js                 # Configuração Next.js
├── tsconfig.json                  # Configuração TypeScript
├── package.json                   # Dependências e scripts
├── .env.local                     # Variáveis de ambiente (não versionado)
├── swagger.yaml                   # Documentação OpenAPI 3.0
├── API_DOCUMENTATION.md           # Guia de uso da API
└── README.md                      # Este arquivo
```

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.17 ou superior ([Download](https://nodejs.org/))
- **npm** 9+ ou **yarn** 1.22+ ou **pnpm** 8+
- **Git** ([Download](https://git-scm.com/))

### Contas Necessárias

1. **Supabase** - [Criar conta gratuita](https://supabase.com/)
2. **Stripe** (opcional) - [Criar conta](https://stripe.com/)

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/Adejarbas/BioDashBD.git
cd BioDashBD
```

### 2. Instale as Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
# ou crie manualmente
```

## ⚙️ Configuração

### Variáveis de Ambiente

Edite o arquivo `.env.local` com suas credenciais:

```env
# ==============================================
# SUPABASE - Obtenha em: https://app.supabase.com/project/_/settings/api
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================
# URLs DA APLICAÇÃO
# ==============================================
# Backend (este projeto)
API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_SITE_URL=http://localhost:3003

# Frontend
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3001/dashboard

# ==============================================
# STRIPE - Obtenha em: https://dashboard.stripe.com/apikeys
# ==============================================
STRIPE_SECRET_KEY=sk_test_xxx...
SECRET_STRIPE_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
```

### Configuração do Supabase

#### 1. Crie um Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha os dados e aguarde a criação

#### 2. Configure as Tabelas

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Tabela de atividades
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
  description TEXT NOT NULL CHECK (char_length(description) <= 500),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);

-- Tabela de dados do biodigestor
CREATE TABLE biodigester_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waste_processed NUMERIC,
  energy_generated NUMERIC,
  efficiency_rate NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biodigester_user_id ON biodigester_data(user_id);
CREATE INDEX idx_biodigester_timestamp ON biodigester_data(timestamp DESC);

-- Tabela de indicadores do dashboard
CREATE TABLE biodigester_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_value NUMERIC,
  unit TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS (Row Level Security)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodigester_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodigester_indicators ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own biodigester data"
  ON biodigester_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own indicators"
  ON biodigester_indicators FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
```

#### 3. Configure a URL de Redirecionamento

1. Vá em **Authentication** → **URL Configuration**
2. Adicione em **Redirect URLs**:
   - `http://localhost:3001/dashboard`
   - `http://localhost:3003/dashboard`

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em: **http://localhost:3003**

### Produção

```bash
# Build
npm run build

# Start
npm run start
```

### Verificando se está funcionando

Abra seu navegador ou use cURL:

```bash
# Health check (não requer autenticação)
curl http://localhost:3003/api/dashboard/indicators

# Resposta esperada:
# {"success":true,"message":"Dashboard indicators retrieved successfully","data":{...}}
```

## 📖 Documentação da API

### Swagger/OpenAPI

A documentação completa da API está disponível em formato OpenAPI 3.0:

- **Arquivo**: `swagger.yaml`
- **Guia de Uso**: `API_DOCUMENTATION.md`

#### Visualizar a Documentação

**Opção 1: Swagger Editor Online**
```bash
# Acesse https://editor.swagger.io/
# File → Import file → Selecione swagger.yaml
```

**Opção 2: Localmente**
```bash
npx swagger-ui-watcher swagger.yaml
# Acesse http://localhost:8080
```

**Opção 3: VS Code**
```bash
# Instale a extensão "Swagger Viewer"
# Abra swagger.yaml
# Pressione Shift + Alt + P → "Preview Swagger"
```

### Endpoints Principais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/login` | Login de usuário | ❌ |
| `POST` | `/api/auth/signup` | Registro de usuário | ❌ |
| `POST` | `/api/auth/logout` | Logout | ✅ |
| `GET` | `/api/user` | Dados do usuário | ✅ |
| `GET` | `/api/activities` | Listar atividades | ✅ |
| `POST` | `/api/activities` | Criar atividade | ✅ |
| `GET` | `/api/biodigester/data` | Dados do biodigestor | ✅ |
| `GET` | `/api/dashboard/indicators` | Indicadores | ✅ |
| `POST` | `/api/stripe` | Checkout simples (R$20) | ❌ |
| `POST` | `/api/stripe/checkout-session` | Criar checkout | ❌ |

### Exemplo de Uso

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Importante para cookies!
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});

// 2. Buscar dados do usuário (usando o cookie da sessão)
const userResponse = await fetch('http://localhost:3003/api/user', {
  credentials: 'include' // Envia o cookie de autenticação
});

const userData = await userResponse.json();
console.log(userData);

// 3. Criar checkout simples do Stripe (sem autenticação)
const simpleCheckout = await fetch('http://localhost:3003/api/stripe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
const simpleData = await simpleCheckout.json();
window.location.href = simpleData.data.url; // redireciona para o Stripe

// 4. Criar checkout personalizado do Stripe (sem autenticação)
const customCheckout = await fetch('http://localhost:3003/api/stripe/checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productName: 'Plano Premium', amount: 99.90 })
});
const customData = await customCheckout.json();
window.location.href = customData.data.url;
```

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test

# Executar com coverage
npm run test:coverage

# Executar testes em watch mode
npm run test:watch
```

## 🚢 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adejarbas/BioDashBD)

#### Passos Manuais

1. **Instale a CLI da Vercel**
   ```bash
   npm i -g vercel
   ```

2. **Configure o Projeto**
   ```bash
   vercel
   ```

3. **Configure as Variáveis de Ambiente**
   
   No dashboard da Vercel, adicione todas as variáveis do `.env.local`

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Outras Plataformas

- **Railway**: [Deploy Guide](https://railway.app/)
- **Render**: [Deploy Guide](https://render.com/)
- **Fly.io**: [Deploy Guide](https://fly.io/)

## 🐳 Docker

### Docker Hub

A imagem oficial do BioDashBD está disponível no Docker Hub:

```bash
docker pull thiagohmn93/biodash-backend:latest
```

**Tags disponíveis:**
- `latest` - Última versão estável
- `v1.x.x` - Versões específicas (ex: `v1.0.0`, `v1.1.0`)

### Executando com Docker

#### Opção 1: Usando Docker Compose (Recomendado) 

```bash
# Build e executar
docker-compose up biodash-backend --build

# Executar em background
docker-compose up biodash-backend -d

# Ver logs
docker-compose logs -f biodash-backend
```

#### Opção 2: Usando Docker diretamente

```bash
# Usando imagem do Docker Hub
docker run -p 3003:3003 \
  --env-file .env.local \
  thiagohmn93/biodash-backend:latest

# Ou fazer build local
docker build -t biodash-backend .
docker run -p 3003:3003 --env-file .env.local biodash-backend
```

### GitHub Actions - CI/CD

O projeto possui pipeline automatizado que:
- ✅ Calcula versão semântica automaticamente
- ✅ Faz build e push da imagem Docker para o Docker Hub
- ✅ Envia notificações por e-mail (sucesso/falha)

**Repositório Docker Hub**: `thiagohmn93/biodash-backend`

### Documentação Completa

Para mais detalhes sobre Docker, consulte:
- 📄 [DOCKER_USAGE.md](./DOCKER_USAGE.md) - Guia completo de uso
- 📄 [docker-setup.md](./docker-setup.md) - Setup rápido para iniciantes

## 🐛 Troubleshooting

### Erro: "Cannot read properties of undefined (reading 'getUser')"

**Solução**: Verifique se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas corretamente.

### Erro 401 (Unauthorized) ao acessar `/api/user`

**Solução**: 
- Certifique-se de que você fez login primeiro
- Verifique se está usando `credentials: 'include'` nas requisições do frontend
- Confirme que o frontend está na porta `3001` e o backend na `3003`

### Erro: "EADDRINUSE: address already in use :::3003"

**Solução**: A porta 3003 já está em uso. Opções:

```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3003
kill -9 <PID>

# Ou use outra porta
npm run dev -- -p 3004
```

### Erro: "Supabase not configured"

**Solução**: Verifique se todas as variáveis de ambiente do Supabase estão definidas e corretas.

### CORS Error

**Solução**: O middleware já está configurado. Certifique-se de que:
- O frontend está rodando em `http://localhost:3001`
- Você está usando `credentials: 'include'` nas requisições
- A variável `FRONTEND_URL` está correta

### Erros do Stripe

**Solução**:
- Verifique se `STRIPE_SECRET_KEY` está configurada
- Use chaves de teste (`sk_test_...`) durante desenvolvimento
- Verifique se o webhook está configurado (para eventos)

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork o projeto**
2. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/MinhaNovaFeature
   ```
3. **Commit suas mudanças**
   ```bash
   git commit -m 'Adiciona MinhaNovaFeature'
   ```
4. **Push para a branch**
   ```bash
   git push origin feature/MinhaNovaFeature
   ```
5. **Abra um Pull Request**

### Padrões de Código

- Use TypeScript para todo código novo
- Siga os padrões do ESLint/Prettier (quando configurados)
- Documente funções complexas com JSDoc
- Escreva testes para novas funcionalidades

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Equipe BioDashBD** - [Adejarbas](https://github.com/Adejarbas)

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) pela incrível framework
- [Supabase](https://supabase.com/) pelo backend-as-a-service
- [Stripe](https://stripe.com/) pela plataforma de pagamentos
- [Vercel](https://vercel.com/) pelo hosting gratuito

---

<div align="center">
  
**Feito com ❤️ pela equipe BioDashBD**

[Reportar Bug](https://github.com/Adejarbas/BioDashBD/issues) · [Solicitar Feature](https://github.com/Adejarbas/BioDashBD/issues) · [Documentação](./API_DOCUMENTATION.md)

</div>
