# 🐳 Integração Docker - Backend BioDash

## 📋 Resumo da Situação

O **frontend** foi dockerizado e agora possui CI/CD automático. O **backend** permanece funcionando normalmente, **SEM NECESSIDADE DE MUDANÇAS**.

## 🔄 Arquitetura Atual

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Supabase     │
│  (Container)    │◄──►│   (Local)       │◄──►│   (Database)    │
│   Port 3001     │    │   Port 3003     │    │     Cloud       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✅ O que NÃO precisa mudar no Backend

- ❌ **Código**: Mantém tudo igual
- ❌ **Porta**: Continua rodando na 3003
- ❌ **APIs**: Todas as rotas funcionam igual
- ❌ **Banco**: Continua usando Supabase
- ❌ **Variáveis**: Mesmo `.env`

## 🌐 Como a Comunicação Funciona

### **Desenvolvimento Local:**
```
Frontend Container → http://localhost:3003/api/... → Backend Local
```

### **Produção:**
```
Frontend Container → Backend URL Produção → Backend Container/Server
```

## 🚀 Se Quiser Dockerizar o Backend (OPCIONAL)

### 1. Criar branch no backend:
```bash
git checkout -b feature/docker-integration
```

### 2. Criar `Dockerfile` no backend:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3003

# Start the application
CMD ["pnpm", "start"]
```

### 3. Criar `docker-compose.yml` no backend:
```yaml
version: '3.8'

services:
  biodash-backend:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    networks:
      - biodash-network

networks:
  biodash-network:
    external: true
```

### 4. Modificar variáveis de ambiente do frontend:
```env
# No frontend .env.local
NEXT_PUBLIC_API_BASE_URL=http://biodash-backend:3003
```

## 📦 Para Desenvolvimento com ambos em Docker

### Docker Compose Completo:
```yaml
version: '3.8'

services:
  # Frontend
  biodash-frontend:
    build:
      context: ../BioDashFront
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DOCKER_ENV=true
      - NEXT_PUBLIC_API_BASE_URL=http://biodash-backend:3003
    depends_on:
      - biodash-backend
    networks:
      - biodash-network

  # Backend
  biodash-backend:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
    networks:
      - biodash-network

networks:
  biodash-network:
    driver: bridge
```

## 🎯 Quando Dockerizar o Backend?

### **Agora (RECOMENDADO):**
- ✅ Manter backend local funcionando
- ✅ Frontend em Docker já está funcionando
- ✅ CI/CD configurado e testado

### **Depois (OPCIONAL):**
- 🔄 Backend em Docker para:
  - Produção em containers
  - Desenvolvimento em equipe
  - Deploy automatizado

## 📋 Checklist para Backend

### **Se mantiver local:**
- [ ] Nenhuma ação necessária
- [ ] Backend continua funcionando normal
- [ ] Frontend acessa via `localhost:3003`

### **Se dockerizar (opcional):**
- [ ] Criar `Dockerfile`
- [ ] Criar `docker-compose.yml`
- [ ] Configurar variáveis de ambiente
- [ ] Testar comunicação entre containers
- [ ] Configurar CI/CD (se necessário)

## 🔍 Verificação de Funcionamento

### **Teste 1 - Backend Local + Frontend Docker:**
```bash
# Terminal 1: Backend local
cd BioDashBack
npm run dev

# Terminal 2: Frontend docker
cd BioDashFront
docker-compose up
```

### **Teste 2 - Ambos em Docker:**
```bash
# Com docker-compose completo
docker-compose up --build
```

## ⚠️ Pontos de Atenção

1. **Network**: Se ambos em Docker, devem estar na mesma rede (`biodash-network`)
2. **URLs**: Usar nome do container em vez de `localhost`
3. **Variáveis**: Ajustar `NEXT_PUBLIC_API_BASE_URL` conforme ambiente
4. **Ports**: Manter 3001 (frontend) e 3003 (backend)

## 📞 Comunicação Frontend ↔ Backend

### **Current (Backend Local):**
```typescript
// Frontend chama:
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"
```

### **Future (Backend Docker):**
```typescript
// Frontend chama:
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://biodash-backend:3003"
```

---

## 🏁 Conclusão

**Status Atual**: ✅ **Funcionando perfeitamente**
- Frontend dockerizado ✅
- Backend local ✅  
- Comunicação funcionando ✅
- CI/CD configurado ✅

**Próximos Passos**: 🔄 **Totalmente opcional**
- Dockerizar backend se necessário
- Configurar produção completa
- Deploy automatizado de ambos

**Recomendação**: 🎯 **Manter como está** até precisar de mudanças no backend.