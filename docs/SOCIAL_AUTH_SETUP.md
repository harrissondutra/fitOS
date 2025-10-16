# Configuração de Autenticação Social - FitOS

Este documento explica como configurar os provedores de autenticação social (Google, Microsoft, Facebook) no FitOS.

## Pré-requisitos

- Conta de desenvolvedor nos provedores desejados
- Acesso ao painel de administração do projeto

## 1. Google OAuth

### Passo 1: Criar projeto no Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API" e "Google Identity"

### Passo 2: Configurar OAuth
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure:
   - Application type: Web application
   - Name: FitOS Authentication
   - Authorized JavaScript origins: `http://localhost:3000`, `https://seu-dominio.com`
   - Authorized redirect URIs: `http://localhost:3001/api/auth/callback/google`, `https://seu-dominio.com/api/auth/callback/google`

### Passo 3: Obter credenciais
1. Copie o Client ID e Client Secret
2. Adicione ao arquivo `.env`:
```env
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
```

## 2. Microsoft OAuth

### Passo 1: Registrar aplicação no Azure
1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá para "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure:
   - Name: FitOS Authentication
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: Web - `http://localhost:3001/api/auth/callback/microsoft`

### Passo 2: Configurar permissões
1. Vá para "API permissions"
2. Adicione as permissões:
   - Microsoft Graph > User.Read
   - Microsoft Graph > email
   - Microsoft Graph > profile

### Passo 3: Obter credenciais
1. Vá para "Certificates & secrets"
2. Crie um novo client secret
3. Copie o Application (client) ID e o secret
4. Adicione ao arquivo `.env`:
```env
MICROSOFT_CLIENT_ID=seu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=seu-microsoft-client-secret
```

## 3. Facebook OAuth

### Passo 1: Criar aplicação no Facebook
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Clique em "My Apps" > "Create App"
3. Selecione "Consumer" > "Next"
4. Configure:
   - App name: FitOS
   - App contact email: seu-email@exemplo.com

### Passo 2: Configurar Facebook Login
1. Adicione o produto "Facebook Login"
2. Vá para "Facebook Login" > "Settings"
3. Configure:
   - Valid OAuth Redirect URIs: `http://localhost:3001/api/auth/callback/facebook`
   - Client OAuth Login: Yes
   - Web OAuth Login: Yes

### Passo 3: Obter credenciais
1. Vá para "Settings" > "Basic"
2. Copie o App ID e App Secret
3. Adicione ao arquivo `.env`:
```env
FACEBOOK_CLIENT_ID=seu-facebook-client-id
FACEBOOK_CLIENT_SECRET=seu-facebook-client-secret
```

## 4. Configuração do Banco de Dados

O Better Auth criará automaticamente as tabelas necessárias. Certifique-se de que:

1. O banco de dados está acessível
2. As permissões de criação de tabelas estão configuradas
3. A string de conexão está correta no `.env`

## 5. Testando a Configuração

### Desenvolvimento Local
1. Inicie o backend: `npm run dev` (na pasta backend)
2. Inicie o frontend: `npm run dev` (na pasta frontend)
3. Acesse `http://localhost:3000/auth/login`
4. Teste os botões de login social

### Verificações
- [ ] Google login funciona
- [ ] Microsoft login funciona
- [ ] Facebook login funciona
- [ ] Redirecionamento após login funciona
- [ ] Dados do usuário são salvos corretamente

## 6. Produção

Para produção, certifique-se de:

1. Atualizar as URLs de callback para o domínio de produção
2. Configurar HTTPS
3. Usar variáveis de ambiente seguras
4. Configurar CORS adequadamente
5. Testar todos os fluxos de autenticação

## 7. Troubleshooting

### Erro: "Invalid redirect URI"
- Verifique se a URI de callback está configurada corretamente no provedor
- Certifique-se de que a URL está exatamente igual (incluindo http/https)

### Erro: "Client ID not found"
- Verifique se as variáveis de ambiente estão carregadas
- Reinicie o servidor após alterar o `.env`

### Erro: "Scope not authorized"
- Verifique se as permissões necessárias estão configuradas no provedor
- Para Microsoft, certifique-se de que o consentimento foi concedido

## 8. Segurança

- Nunca commite as credenciais no código
- Use variáveis de ambiente para todas as configurações sensíveis
- Configure HTTPS em produção
- Monitore logs de autenticação
- Implemente rate limiting adequado





