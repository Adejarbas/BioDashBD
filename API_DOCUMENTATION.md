## 🚀 Visualizando a Documentação Swagger

### Opção 1: Interface Web Integrada (Recomendado)

1. Certifique-se de que o backend está rodando:
   ```bash
   npm run dev
   ```

2. Acesse no navegador:
   ```
   http://localhost:3003/api-docs
   ```

3. Você poderá visualizar e **testar todos os endpoints diretamente** pela interface

### Para testar rotas protegidas:
1. Na interface Swagger, clique em `POST /api/auth/login`
2. Clique no botão **"Try it out"**
3. Preencha email e senha
4. Clique em **"Execute"**
5. Os cookies serão salvos automaticamente
6. Agora você pode testar outras rotas protegidas normalmente

### Para testar rotas Stripe (sem autenticação):
- Execute diretamente sem precisar de login
- Clique em **"Try it out"** e **"Execute"**

### Opção 2: Swagger Editor Online
<!-- ...existing code... -->

### Opção 3: VS Code Extension
<!-- ...existing code... -->