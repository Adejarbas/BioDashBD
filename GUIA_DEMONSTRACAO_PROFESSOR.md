# 📋 GUIA DE DEMONSTRAÇÃO - BACKEND BioDash
## Para apresentação ao professor (Computador sem ferramentas instaladas)

---

## 🎯 OBJETIVO
Este guia mostra **PASSO A PASSO** como demonstrar cada item da planilha do professor no computador da faculdade, **mesmo sem ter Node.js, Docker, Git instalados**.

---

## ✅ CHECKLIST DE DEMONSTRAÇÃO

### **1. REPOSITÓRIO BACKEND**
**O que mostrar:** Repositório GitHub do backend

**Como demonstrar:**
1. Abrir navegador
2. Acessar: https://github.com/Adejarbas/BioDashBD
3. Mostrar:
   - ✅ Nome do repositório
   - ✅ Descrição
   - ✅ Arquivos principais (Dockerfile, docker-compose.yml, README.md)

---

### **2. BRANCHES**
**O que mostrar:** Múltiplas branches de desenvolvimento

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD
2. Clicar no dropdown de branches (onde está escrito "main")
3. Mostrar:
   - ✅ `main` (branch principal)
   - ✅ `feature/docker-integration-clean` (branch de feature)
   - ✅ Outras branches se houver

---

### **3. COMMITS**
**O que mostrar:** Commits seguindo padrão (feat/fix/docs)

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/commits/main
2. Mostrar commits com padrões:
   - ✅ `feat: add Docker support...`
   - ✅ `fix: update Dockerfile...`
   - ✅ `docs: update README`
3. Clicar em um commit para mostrar as mudanças

---

### **4. ACTIONS - PIPELINE**
**O que mostrar:** GitHub Actions funcionando

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/actions
2. Mostrar:
   - ✅ Pipeline "CI / CD" com execuções bem-sucedidas (check verde)
   - ✅ Clicar em uma execução para mostrar steps:
     - Set up job
     - Checkout code
     - Dependências
     - Calcular nova versão
     - Build and push Docker image
     - Enviar email de sucesso

---

### **5. ACTIONS - GERAÇÃO DE TAGS**
**O que mostrar:** Tags semânticas criadas automaticamente

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/tags
2. Mostrar tags:
   - ✅ `v0.1.0`
   - ✅ `v0.2.0`
   - ✅ Outras tags semânticas
3. Clicar em uma tag para mostrar o commit associado

**OU:**

1. No GitHub Actions: Clicar em uma execução bem-sucedida
2. Expandir o step "Calcular nova versão"
3. Mostrar no log:
   ```
   Versões (atual / nova): 0.0.0 -> 0.1.0
   should_deploy=true
   new_version=0.1.0
   ```

---

### **6. ACTIONS - ENVIO DE E-MAIL**
**O que mostrar:** E-mails automáticos de sucesso/falha

**Como demonstrar:**

**Opção A - No GitHub Actions:**
1. Acessar: https://github.com/Adejarbas/BioDashBD/actions
2. Clicar em execução bem-sucedida
3. Expandir step "Enviar email de sucesso"
4. Mostrar no log: `Email sent successfully`

**Opção B - No e-mail (MELHOR):**
1. Abrir navegador
2. Acessar: https://mail.google.com
3. Login: grupobiogen.equipe@gmail.com
4. Buscar: "Pipeline Actions"
5. Mostrar e-mails recebidos:
   - ✅ "✅ Pipeline Actions executado com sucesso"
   - ✅ Mostrar corpo do e-mail com detalhes (repositório, commit, versão)

---

### **7. DOCUMENTAÇÃO**
**O que mostrar:** Documentação completa do projeto

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD
2. Mostrar arquivos:
   - ✅ `README.md` - Documentação principal
   - ✅ `DOCKER_USAGE.md` - Instruções Docker
   - ✅ `docker-setup.md` - Setup Docker
   - ✅ `BACKEND_INTEGRATION.md` - Integração backend
3. Clicar em cada arquivo para mostrar conteúdo

---

### **8. DOCKER - DOCKERFILE**
**O que mostrar:** Arquivo Dockerfile configurado

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/blob/main/Dockerfile
2. Mostrar:
   - ✅ `FROM node:20-alpine`
   - ✅ `RUN npm install --legacy-peer-deps --frozen-lockfile --production=false`
   - ✅ `CMD ["npm", "run", "dev"]`

---

### **9. DOCKER - CONTAINER RODANDO**
**O que mostrar:** Container Docker funcionando

**Como demonstrar:**

**OPÇÃO 1 - Rodar via Docker Hub (sem código):**
```bash
# Baixar imagem do Docker Hub
docker pull danielrodriguesadejarbas/biodash-backend:latest

# Rodar container
docker run -p 3003:3003 -e NEXT_PUBLIC_SUPABASE_URL="https://scsldapnrzpjkyqkeiop.supabase.co" -e NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc2xkYXBucnpwamt5cWtlaW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTYyMzksImV4cCI6MjA3MTEzMjIzOX0.TxRPb6uaLdCCBdjvjKOghvaD7EBPlA2rZqTfh8gPdBw" -e SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc2xkYXBucnpwamt5cWtlaW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU1NjIzOSwiZXhwIjoyMDcxMTMyMjM5fQ.0ggKAdkhPLQMpLQEp3YzQZN0tR4DIEZeErvhvgxysFQ" -e NEXT_PUBLIC_API_BASE_URL="http://localhost:3003" -e FRONTEND_URL="http://localhost:3001" -e NEXT_PUBLIC_SITE_URL="http://localhost:3003" -e NEXT_PUBLIC_FRONTEND_URL="http://localhost:3001" -e STRIPE_SECRET_KEY="sk_test_51S09nyJQWiA5dculuMmTNQJWCsXYfZH8ldnj2fOn80rSpDcZJXRMFvXSqD4iawaFS12l6zFtIHjlo3WaEDz2BgrM008pgR9nmJ" -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51S09nyJQWiA5dculSKoXDRPDgCQD6iBuRs2biQtmFAUgR8cUW6VLHeMVTdFmq8aAjeeY9DUyzOx17jwoVEHdsJCv003dkTBsvm" -e LOGTAIL_TOKEN="cZZcxPA7ApX4UgaHu4FdBqNj" -e LOGTAIL_URL="https://s1611462.eu-nbg-2.betterstackdata.com" danielrodriguesadejarbas/biodash-backend:latest
```

**OPÇÃO 2 - Rodar localmente com código (precisa clonar repo):**
```bash
# Clonar repositório
git clone https://github.com/Adejarbas/BioDashBD.git
cd BioDashBD

# Criar arquivo .env.local
copy .env.example .env.local
# Editar .env.local com as credenciais reais

# Rodar com docker-compose
docker-compose up biodash-backend --build

# OU buildar imagem local
docker build -t biodash-backend .
docker run -p 3003:3003 --env-file .env.local biodash-backend
```

**Resultado esperado (ambas opções):**
```
▲ Next.js 16.0.1 (Turbopack)
- Local:        http://localhost:3003
✓ Ready in 2.8s
```

**SE NÃO TIVER DOCKER (Alternativa):**
1. Mostrar vídeo/screenshot do container rodando no seu computador
2. OU acessar deploy no Render (ver item 18)

---

### **10. DOCKER - REPOSITÓRIO DOCKER HUB**
**O que mostrar:** Repositório público no Docker Hub

**Como demonstrar:**
1. Abrir navegador
2. Acessar: https://hub.docker.com/r/danielrodriguesadejarbas/biodash-backend
3. Mostrar:
   - ✅ Nome do repositório
   - ✅ Descrição
   - ✅ Tags disponíveis (`latest`, `v0.1.0`)
   - ✅ Data de atualização
   - ✅ Número de pulls

---

### **11. DOCKER - IMAGEM NO DOCKER HUB**
**O que mostrar:** Imagem publicada com tags

**Como demonstrar:**
1. No Docker Hub: https://hub.docker.com/r/danielrodriguesadejarbas/biodash-backend/tags
2. Mostrar:
   - ✅ Tag `latest`
   - ✅ Tag `v0.1.0` (ou versão atual)
   - ✅ Tamanho da imagem
   - ✅ Data de push
   - ✅ Digest (SHA256)

---

### **12. ACTIONS - GERAÇÃO DE IMAGEM DOCKER**
**O que mostrar:** Pipeline gerando imagem automaticamente

**Como demonstrar:**
1. No GitHub Actions: https://github.com/Adejarbas/BioDashBD/actions
2. Clicar em execução bem-sucedida
3. Expandir step "Build and push Docker image (backend)"
4. Mostrar no log:
   ```
   Building image...
   Pushing to danielrodriguesadejarbas/biodash-backend:latest
   Pushing to danielrodriguesadejarbas/biodash-backend:v0.1.0
   Push successful
   ```

---

### **13. ACTIONS - PUSH DOCKER HUB**
**O que mostrar:** Imagem sendo enviada ao Docker Hub

**Como demonstrar:**
1. Mesmo que item 12
2. Mostrar correlação entre:
   - Hora do commit no GitHub
   - Hora da execução do Actions
   - Hora do push no Docker Hub (tags page)

---

### **14. BRANCH MAIN ATUALIZADA**
**O que mostrar:** Branch main com últimas mudanças

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD
2. Verificar que está na branch `main`
3. Mostrar commit mais recente:
   - ✅ Data recente
   - ✅ Mensagem: "feat: add Docker support..."
4. Mostrar arquivos presentes:
   - ✅ Dockerfile
   - ✅ docker-compose.yml
   - ✅ lib/logger-winston.js

---

### **15. LOGS (BETTERSTACK)**
**O que mostrar:** Sistema de logs funcionando

**Como demonstrar:**

**Opção A - No BetterStack:**
1. Abrir navegador
2. Acessar: https://logs.betterstack.com
3. Login com conta BetterStack
4. Mostrar logs recentes:
   - ✅ `[INFO] Stripe checkout session request`
   - ✅ `[INFO] Stripe checkout session created successfully`
   - ✅ `[INFO] Login attempt`
   - ✅ Timestamps, níveis (INFO/WARN/ERROR)

**Opção B - No terminal (se Docker rodando):**
Mostrar logs aparecendo em tempo real:
```
[2025-12-03T16:07:27.051Z] INFO: Stripe checkout session request
[2025-12-03T16:07:28.090Z] INFO: Stripe checkout session created successfully
```

---

### **16. DOCKER COMPOSE**
**O que mostrar:** Arquivo docker-compose.yml configurado

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/blob/main/docker-compose.yml
2. Mostrar configuração:
   - ✅ Serviço `biodash-backend`
   - ✅ Porta `3003:3003`
   - ✅ Variáveis de ambiente
   - ✅ Comando build

**SE TIVER DOCKER:**
```bash
cd C:\Users\danii\OneDrive\Documentos\MeusProjetos\BioDashBD
docker-compose up biodash-backend
```

---

### **17. COLABORADOR ADICIONADO**
**O que mostrar:** Professor como colaborador do repositório

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/settings/access
2. Mostrar na lista de colaboradores:
   - ✅ Nome/usuário do professor
   - ✅ Permissões (Write/Admin)

**OU (se não for owner):**
1. Pedir ao owner (Adejarbas) para mostrar
2. Settings → Collaborators

---

### **18. DEPLOY RENDER/NUVEM**
**O que mostrar:** Backend rodando em produção

**Como demonstrar:**
1. Abrir navegador
2. Acessar URL do Render (exemplo): https://seu-backend.onrender.com/api/health
3. Mostrar resposta JSON:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-03T...",
     "service": "biodash-backend",
     "version": "1.0.0"
   }
   ```

**OU mostrar Dashboard Render:**
1. Acessar: https://dashboard.render.com
2. Login
3. Mostrar serviço "BioDash Backend":
   - ✅ Status: Active (verde)
   - ✅ Last deploy: data recente
   - ✅ Logs do servidor

---

### **19. BANCO DE DADOS**
**O que mostrar:** Supabase configurado e funcionando

**Como demonstrar:**
1. Abrir navegador
2. Acessar: https://supabase.com/dashboard
3. Login
4. Mostrar projeto "BioDash":
   - ✅ Database schema (tables)
   - ✅ Authentication (usuários cadastrados)
   - ✅ API Settings (URLs e Keys)

**OU testar endpoint:**
1. Acessar: https://seu-backend.onrender.com/api/user (com autenticação)
2. Mostrar dados retornados do Supabase

---

### **20. SECRETS NO GITHUB ACTIONS**
**O que mostrar:** Secrets configurados no repositório

**Como demonstrar:**
1. No GitHub: https://github.com/Adejarbas/BioDashBD/settings/secrets/actions
2. Mostrar lista de secrets (nomes apenas, valores são ocultos):
   - ✅ `DOCKERHUB_USERNAME`
   - ✅ `DOCKER_PASSWORD`
   - ✅ `EMAIL_USERNAME`
   - ✅ `EMAIL_PASSWORD`
   - ✅ `NEXT_PUBLIC_API_BASE_URL`

**Nota:** Valores não aparecem, apenas nomes (segurança)

---

## 🎥 FLUXO COMPLETO DE DEMONSTRAÇÃO

### **ORDEM SUGERIDA:**

1. **Mostrar repositório** (1-2 min)
   - GitHub → Estrutura → Arquivos

2. **Mostrar desenvolvimento** (2-3 min)
   - Branches → Commits → Padrão de mensagens

3. **Mostrar automação** (3-5 min)
   - GitHub Actions → Pipeline → Tags → E-mails

4. **Mostrar Docker** (5-7 min)
   - Dockerfile → Docker Hub → Imagem publicada → Container rodando

5. **Mostrar logs** (2-3 min)
   - BetterStack → Logs em tempo real

6. **Mostrar produção** (2-3 min)
   - Render → Backend rodando → Health check

7. **Mostrar integração** (2-3 min)
   - Supabase → Dados → API funcionando

**TOTAL: ~20-30 minutos**

---

## 🚨 PLANO B - SE NÃO TIVER INTERNET/FERRAMENTAS

### **Levar preparado:**

1. **Screenshots/Prints:**
   - GitHub (repositório, Actions, tags)
   - Docker Hub (repositório, imagens)
   - BetterStack (logs)
   - Render (deploy)
   - E-mails recebidos

2. **Vídeo gravado:**
   - Docker pull + docker run
   - Container iniciando
   - Logs aparecendo
   - API respondendo

3. **PDF com documentação:**
   - README.md exportado
   - DOCKER_USAGE.md exportado
   - Prints organizados

---

## 📱 CHECKLIST PRÉ-APRESENTAÇÃO

```
[ ] Notebook carregado + carregador
[ ] Conta GitHub logada (navegador)
[ ] Conta Docker Hub logada (navegador)
[ ] Conta BetterStack logada (navegador)
[ ] Conta Gmail logada (navegador)
[ ] Conta Render logada (navegador)
[ ] Conta Supabase logada (navegador)
[ ] Docker Desktop instalado (se possível)
[ ] Git instalado (se possível)
[ ] Screenshots de backup
[ ] Vídeo de backup
[ ] Este guia impresso ou aberto
```

---

## 🎯 DICAS FINAIS

1. **Teste tudo antes** no computador da faculdade (se possível)
2. **Tenha backup de tudo** (prints, vídeos, PDFs)
3. **Navegue com calma** - não precisa correr
4. **Explique enquanto mostra** - professor quer entender o processo
5. **Se algo falhar** - mostre o backup (screenshots/vídeo)

---

## 📞 CONTATOS DE EMERGÊNCIA

- **GitHub:** https://github.com/Adejarbas/BioDashBD
- **Docker Hub:** https://hub.docker.com/r/danielrodriguesadejarbas/biodash-backend
- **Render:** https://dashboard.render.com
- **BetterStack:** https://logs.betterstack.com

---

**BOA SORTE NA APRESENTAÇÃO! 🚀**
