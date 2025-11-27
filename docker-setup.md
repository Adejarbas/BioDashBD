# 🐳 Docker Setup - BioDash Backend

## Início Rápido

```bash
# 1. Clonar o repositório
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD

# 2. Configurar ambiente
cp .env.example .env.local
# Ajustar credenciais se necessário

# 3. Rodar projeto completo
docker-compose up --build

# 4. Acessar
# Frontend: http://localhost:3001
# Backend: http://localhost:3003
```

## Comandos Úteis

```bash
# Parar containers
docker-compose down

# Rebuild completo
docker-compose down
docker-compose up --build --force-recreate

# Ver logs
docker-compose logs -f

# Rodar só o backend
docker-compose up biodash-backend

# Remover tudo e recomeçar
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## Troubleshooting

### Port já em uso:
```bash
# Verificar o que está usando as portas
netstat -tulpn | grep :3001
netstat -tulpn | grep :3003

# Matar processos se necessário (Linux/Mac)
sudo kill -9 $(lsof -t -i:3001)
sudo kill -9 $(lsof -t -i:3003)

# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :3003
taskkill /PID <PID_NUMBER> /F
```

### Problemas de permissão:
```bash
# Dar permissões corretas (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Cache problems:
```bash
# Limpar cache Docker
docker builder prune -f
docker-compose build --no-cache
```

## Estrutura do Projeto

```
BioDashBD/
├── Dockerfile              # Configuração do container backend
├── docker-compose.yml      # Orquestração completa (front+back)
├── .env.example            # Exemplo de variáveis de ambiente
├── .env.local              # Variáveis de ambiente (não versionado)
├── docker-setup.md         # Esta documentação
└── BACKEND_INTEGRATION.md  # Documentação de integração
```

## Variáveis de Ambiente

O projeto usa `.env.local` para desenvolvimento. Copie de `.env.example` e ajuste conforme necessário:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe (se usado)

## 🔐 Credenciais de Teste (Professor)

> Observação: Esta seção contém **credenciais de teste** para facilitar validações locais e testes do professor. **NÃO** use esses dados em produção.

```env
# Supabase (test)
NEXT_PUBLIC_SUPABASE_URL=https://scsldapnrzpjkyqkeiop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc2xkYXBucnpwamt5cWtlaW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTYyMzksImV4cCI6MjA3MTEzMjIzOX0.TxRPb6uaLdCCBdjvjKOghvaD7EBPlA2rZqTfh8gPdBw

# Supabase (chave sensível — usar apenas server-side)
SUPABASE_SERVICE_ROLE_KEY=eeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc2xkYXBucnpwamt5cWtlaW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU1NjIzOSwiZXhwIjoyMDcxMTMyMjM5fQ.0ggKAdkhPLQMpLQEp3YzQZN0tR4DIEZeErvhvgxysFQ

# Endpoints / URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3003
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Stripe (chave sensível — server only)
STRIPE_SECRET_KEY=sk_test_51S09nyJQWiA5dculuMmTNQJWCsXYfZH8ldnj2fOn80rSpDcZJXRMFvXSqD4iawaFS12l6zFtIHjlo3WaEDz2BgrM008pgR9nmJ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S09nyJQWiA5dculSKoXDRPDgCQD6iBuRs2biQtmFAUgR8cUW6VLHeMVTdFmq8aAjeeY9DUyzOx17jwoVEHdsJCv003dkTBsvm
```

> AVISO: Estes valores foram adicionados para facilitar testes locais; remova ou substitua por variáveis reais ao publicar em produção.


## Desenvolvimento

### Com Docker:
```bash
docker-compose up --build
```

### Sem Docker (Local):
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

## Produção

Para produção, ajuste as variáveis de ambiente e use:

```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up --build
```

## Suporte

Em caso de problemas:

1. Verifique se as portas 3001 e 3003 estão livres
2. Confirme se as variáveis de ambiente estão corretas
3. Limpe o cache Docker se necessário
4. Verifique os logs: `docker-compose logs -f`