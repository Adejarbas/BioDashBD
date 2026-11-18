# Regras e Diretrizes para IA (Agent Guidelines)

## 🚨 REGRA CRÍTICA: Conventional Commits e Versionamento SemVer

Este repositório utiliza automação de CI/CD baseada em **Conventional Commits** para cálculo automático de versão SemVer e publicação de tags/releases Docker.

### 1. NUNCA faça commits fora do padrão
Qualquer commit criado DEVE seguir rigorosamente a convenção:
`<tipo>(<escopo opcional>): <descrição no imperativo>`

### 2. Mapeamento de Tipos e Impacto no SemVer
- `feat: ...` -> **MINOR** (ex: `1.0.0` -> `1.1.0`). Use para novas funcionalidades, novas rotas/endpoints, schemas, integrações.
- `fix: ...` -> **PATCH** (ex: `1.0.0` -> `1.0.1`). Use para correções de bugs em queries, rotas, auth.
- `feat!: ...` ou corpo com `BREAKING CHANGE:` -> **MAJOR** (ex: `1.0.0` -> `2.0.0`). Use para quebras de API ou migrações destrutivas de banco.
- `chore: ...` -> Tarefas de manutenção, dependências, scripts (NÃO gera bump de versão).
- `docs: ...` -> Documentação apenas (NÃO gera bump de versão).
- `refactor: ...` -> Refatoração interna sem alterar regra de negócio.
- `test: ...` -> Adição ou alteração de testes unitários ou de integração.
- `ci: ...` -> Mudanças no GitHub Actions ou scripts de deploy.
- `style: ...` -> Formatação de código.

> ⚠️ **Atenção:** Se um commit de nova feature ou bugfix for feito com outro prefixo (ou sem prefixo), o pipeline de CI **NÃO gerará a tag SemVer**, causando falha na release.

### 3. Exemplos Práticos
- ✅ `feat(api): add sensor readings telemetry endpoint`
- ✅ `fix(db): resolve connection pool leak on high concurrency`
- ✅ `feat(auth): support api key validation middleware`
- ✅ `chore(deps): bump pg to latest release`
- ❌ `ajuste no banco` (Inválido - commit será bloqueado pelo git hook)
- ❌ `update routes` (Inválido)
- ❌ `corrigindo endpoint` (Inválido)

### 4. Git Hooks
Existe um hook local em `.githooks/commit-msg` e um workflow no GitHub (`.github/workflows/commitlint.yml`). Qualquer mensagem fora desse padrão será rejeitada no terminal e na CI.

