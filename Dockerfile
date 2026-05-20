FROM node:20-alpine

WORKDIR /app

# Instala curl para health check
RUN apk add --no-cache curl

# Copia manifesto de dependências
COPY package*.json ./

# Instala todas as dependências (inclui devDeps para o build TypeScript)
RUN npm install --legacy-peer-deps

# Copia código fonte
COPY . .

# Cria diretório .next e define permissões
RUN mkdir -p .next && chown -R node:node .next

# Switch para usuário não-root
USER node

# Build da aplicação Next.js
RUN npm run build

# Expõe a porta interna do Next.js (docker-compose mapeia 80:3003)
EXPOSE 3003

# Health check — testa a porta interna do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3003/api/health || exit 1

# Inicia em modo produção
CMD ["npm", "run", "start"]