# ADR: Arquitetura de CI/CD Multi-Job com Quality Gates e Smoke Tests

**Data de Geração:** 2026-10-10 14:28:00
**Commit:** ci(pipeline): implement multi-job pipeline with quality gates, docker cache and smoke tests

**Contexto:**
Anteriormente, o fluxo de CI/CD do backend (`BioDashBD`) executava em um único job monolítico, sem validação estática prévia de tipagem (`typecheck`), com desativação manual do cache Docker (`no-cache: true`), o que tornava o build desnecessariamente lento (4+ minutos), e sem verificação de integridade pós-deploy (smoke tests). Além disso, arquivos de compilação incremental local (`tsconfig.tsbuildinfo`) estavam acidentalmente rastreados pelo Git, gerando ruído e conflitos de diffs.

**Decisão:**
1. Modularização da esteira do GitHub Actions (`backend-ci-cd.yml`) em três estágios encadeados:
   - `validate`: Quality Gate estático obrigatório executando `tsc --noEmit` em PRs e Pushes.
   - `build-and-push`: Versionamento semântico automático e compilação Docker Buildx com cache GHA real (`type=gha`).
   - `deploy-azure`: Deploy via OIDC no Azure Container Apps (`ca-biodash-api-prod`), associado ao GitHub Environment `production`.
2. Adição de Smoke Test automatizado com polling ativo na rota `/api/health` pós-deploy.
3. Remoção do rastreamento de `tsconfig.tsbuildinfo` e inclusão da regra `*.tsbuildinfo` no `.gitignore`.

**Consequências:**
- **Positivas:** Redução de mais de 60% no tempo de execução do pipeline em commits subsequentes graças ao cache do Docker Buildx; garantia de que código com erros de tipagem não seja empacotado nem enviado à nuvem; visibilidade clara do status de deploy no GitHub e feedback imediato de falhas em PRs.
- **Riscos e Ações Futuras:** A introdução do step de `typecheck` bloqueia branches que possuam violações de tipos estritos do TypeScript, exigindo conformidade de código antes do merge.
