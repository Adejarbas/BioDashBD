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