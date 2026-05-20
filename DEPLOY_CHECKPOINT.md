# 📦 BioDashBD — Checkpoint de Deploy AWS
> Última atualização: 2026-05-20 | Gerado por Antigravity AI
> **Leia também o arquivo `DEPLOY_CHECKPOINT.md` no repositório `BioDash_mobile` — ele contém o guia completo.**

---

## Este repositório no contexto do deploy

O `BioDashBD` é o **Next.js Dashboard** que roda na EC2 do backend.

| Item | Valor |
|---|---|
| **EC2** | `98.92.12.89` |
| **Porta (host)** | `80` |
| **Porta (container interno)** | `3003` |
| **Mapeamento Docker** | `80:3003` |
| **URL de acesso** | `http://98.92.12.89` |
| **Imagem Docker** | `danielrodriguesadejarbas/biodash-backend:latest` |

---

## ✅ Alterações já feitas neste repositório

| Arquivo | O que mudou |
|---|---|
| `middleware.ts` | CORS atualizado com IPs novos (`54.85.37.127` e `98.92.12.89`) |
| `next.config.js` | IPs de CORS atualizados |
| `docker-compose.yml` | Porta `3003:3003` → `80:3003`; `NEXT_PUBLIC_SITE_URL` sem porta |
| `Dockerfile` | `EXPOSE 3003` (interna); healthcheck corrigido |

---

## ⏳ O Que Falta Fazer

### 1. Criar Secrets no GitHub

Acesse: `github.com/Adejarbas/BioDashBD` → **Settings** → **Secrets and variables** → **Actions**

| Secret | Valor |
|---|---|
| `DOCKERHUB_USERNAME` | `thiagohmn93` |
| `DOCKERHUB_TOKEN` | *(gerar em hub.docker.com → Account Settings → Security)* |
| `POSTGRES_URL` | `postgresql://postgres:Biogen123!@database-1.cej6asnixj7d.us-east-1.rds.amazonaws.com:5432/postgres` |
| `JWT_SECRET` | `biodash_jwt_secret_2024_change_in_production` |
| `FRONTEND_URL` | `http://54.85.37.127` |
| `NEXT_PUBLIC_API_BASE_URL` | `http://98.92.12.89:3003` |

### 2. Fazer push para main (gera a imagem Docker automaticamente)

```bash
git add .
git commit -m "feat: configuração AWS deploy"
git push origin main
```

### 3. Deploy na EC2 (após a imagem estar no Docker Hub)

```bash
ssh -i sua-chave.pem ec2-user@98.92.12.89

docker pull danielrodriguesadejarbas/biodash-backend:latest

docker run -d \
  --name biodash_nextjs \
  --restart unless-stopped \
  -p 80:3003 \
  -e NODE_ENV=production \
  -e POSTGRES_URL="postgresql://postgres:Biogen123!@database-1.cej6asnixj7d.us-east-1.rds.amazonaws.com:5432/postgres" \
  -e JWT_SECRET="biodash_jwt_secret_2024_change_in_production" \
  -e FRONTEND_URL="http://54.85.37.127" \
  -e NEXT_PUBLIC_FRONTEND_URL="http://54.85.37.127" \
  -e NEXT_PUBLIC_API_BASE_URL="http://98.92.12.89:3003" \
  -e NEXT_PUBLIC_SITE_URL="http://98.92.12.89" \
  danielrodriguesadejarbas/biodash-backend:latest
```

---

> Para o guia completo (IAM Role, Express backend, Frontend), veja:
> `BioDash_mobile/DEPLOY_CHECKPOINT.md`

*Documento gerado automaticamente — Antigravity AI | BioDash Deploy Checkpoint*
