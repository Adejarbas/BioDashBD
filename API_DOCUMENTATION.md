# Documentação da API - BioDashBD

## 📚 Sobre

Este documento descreve todos os endpoints disponíveis na API do BioDashBD, incluindo autenticação, gerenciamento de atividades, dados de biodigestores e integração com pagamentos.

## 🚀 Visualizando a Documentação Swagger

A documentação completa da API está disponível no formato OpenAPI 3.0 no arquivo `swagger.yaml`.

### Opção 1: Swagger Editor Online

1. Acesse [editor.swagger.io](https://editor.swagger.io/)
2. No menu **File**, clique em **Import file**
3. Selecione o arquivo `swagger.yaml` deste projeto
4. A documentação será carregada e você poderá visualizar e testar os endpoints

### Opção 2: Swagger UI Local (Recomendado)

Instale e execute o Swagger UI localmente:

```bash
# Instalar o swagger-ui-express (se ainda não tiver)
npm install swagger-ui-express yamljs --save-dev

# Ou use o npx para executar sem instalar
npx swagger-ui-watcher swagger.yaml
```

Depois acesse: `http://localhost:8080`

### Opção 3: VS Code Extension

1. Instale a extensão **Swagger Viewer** no VS Code
2. Abra o arquivo `swagger.yaml`
3. Pressione `Shift + Alt + P` (Windows/Linux) ou `Shift + Option + P` (Mac)
4. Selecione **Preview Swagger**

## 🔑 Autenticação

A API utiliza autenticação baseada em **cookies via Supabase**. 

### Como Funciona

1. Faça login através do endpoint `POST /api/auth/login`
2. Um cookie de sessão será automaticamente definido no seu navegador
3. Todas as requisições subsequentes para rotas protegidas devem incluir este cookie

### ⚠️ Importante para Frontend

Como o frontend (`http://localhost:3001`) e o backend (`http://localhost:3003`) estão em portas diferentes, você **deve** incluir a opção `credentials: 'include'` em todas as chamadas fetch:

```javascript
// Exemplo correto de chamada para rota protegida
const response = await fetch('http://localhost:3003/api/user', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // 👈 Essencial para enviar cookies
});
```

## 📋 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Realizar login
- `POST /api/auth/signup` - Criar nova conta
- `POST /api/auth/logout` - Realizar logout

### Usuário
- `GET /api/user` - Obter dados do usuário autenticado

### Atividades
- `GET /api/activities` - Listar atividades
- `POST /api/activities` - Criar nova atividade
- `POST /api/activities/demo` - Criar atividade demo (teste)

### Biodigestor
- `GET /api/biodigester/data` - Obter dados e estatísticas

### Dashboard
- `GET /api/dashboard/indicators` - Obter indicadores principais

### Pagamentos (Stripe)
- `POST /api/stripe` - Criar checkout simples (R$ 20,00)
- `POST /api/stripe/checkout-session` - Criar checkout personalizado

## 🧪 Testando a API

### Com cURL

```bash
# 1. Fazer login (isso salvará o cookie)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com","password":"senha123"}' \
  -c cookies.txt

# 2. Usar o cookie para acessar rota protegida
curl -X GET http://localhost:3003/api/user \
  -b cookies.txt
```

### Com Postman

1. Faça uma requisição `POST` para `/api/auth/login` com email e senha
2. O Postman salvará automaticamente os cookies
3. Requisições subsequentes incluirão automaticamente o cookie

### Com JavaScript (Frontend)

```javascript
// Login
async function login() {
  const response = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'usuario@exemplo.com',
      password: 'senha123'
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// Buscar dados do usuário (após login)
async function getUser() {
  const response = await fetch('http://localhost:3003/api/user', {
    credentials: 'include' // Importante!
  });
  
  const data = await response.json();
  console.log(data);
}
```

## 🔧 Variáveis de Ambiente Necessárias

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada

# URLs
API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3003

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx...
SECRET_STRIPE_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
```

## 📊 Estrutura de Resposta Padrão

### Sucesso

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Dados da resposta
  }
}
```

### Erro

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Erro de Validação

```json
{
  "success": false,
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters long"]
  }
}
```

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)

- Certifique-se de que você fez login primeiro
- Verifique se está enviando `credentials: 'include'` nas requisições
- Verifique se o cookie não expirou (faça login novamente)

### Erro 404 (Not Found)

- Confirme que a URL está correta
- Verifique se o servidor está rodando na porta correta (3003)

### Erro 500 (Internal Server Error)

- Verifique os logs do servidor no terminal
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique a conexão com o Supabase

### Erro CORS

- O middleware já está configurado para aceitar requisições de `http://localhost:3001`
- Certifique-se de que está usando `credentials: 'include'`

## 📝 Notas Adicionais

- Todos os endpoints (exceto `/api/auth/login` e `/api/auth/signup`) requerem autenticação
- Os timestamps são retornados em formato relativo em português (ex: "5 minutos atrás")
- Valores monetários para o Stripe devem ser enviados em reais (serão convertidos para centavos automaticamente)
- A API retorna códigos HTTP apropriados para cada tipo de resposta

## 🤝 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
