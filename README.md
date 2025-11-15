# BioDashBD
Backend - Sistema de Monitoramento de Biodigestores

## 📋 Descrição
API Backend para o sistema BioDash, desenvolvido em Next.js com integração ao Supabase.

## 🚀 Tecnologias
- Node.js 20+
- Next.js 16
- Supabase
- Stripe
- Docker

## 🔧 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env.local
# Ajuste as credenciais conforme necessário

# Execute
npm run dev
```

O servidor estará rodando em: http://localhost:3003

---

## 🐳 Docker Setup

### Rodar projeto completo (Frontend + Backend):

```bash
# Clone o repositório
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD

# Configure o ambiente
cp .env.example .env.local
# Edite .env.local se necessário

# Execute com Docker
docker-compose up --build
```

**Acesso:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3003

### Para desenvolvimento local (sem Docker):

```bash
# Backend
npm install
npm run dev  # porta 3003

# Frontend (em outro terminal/projeto)
# Clone: https://github.com/Adejarbas/BioDashFront
cd ../BioDashFront
npm install
npm run dev  # porta 3001
```

### Comandos úteis:
```bash
# Parar containers
docker-compose down

# Reconstruir tudo
docker-compose up --build --force-recreate

# Ver logs em tempo real
docker-compose logs -f
```

## 📁 Estrutura da API

```
/api
├── activities/          # Atividades do biodigestor
├── auth/               # Autenticação
├── biodigester/        # Dados do biodigestor
├── dashboard/          # Métricas do dashboard
├── health/            # Health check
├── stripe/            # Pagamentos
└── user/              # Usuários
```

## 🔒 Variáveis de Ambiente

Copie `.env.example` para `.env.local` e configure:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe

## 📖 Documentação

- [Docker Setup](./docker-setup.md) - Configuração Docker detalhada
- [Backend Integration](./BACKEND_INTEGRATION.md) - Guia de integração
