# Better Auth Setup - Social Providers

Este documento explica como configurar o Better Auth com os social providers (Google, Microsoft e Facebook) no FitOS.

## Configuração dos Social Providers

### 1. Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Navegue até "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure as URIs de redirecionamento:
   - Desenvolvimento: `http://localhost:3001/api/auth/callback/google`
   - Produção: `https://seu-dominio.com/api/auth/callback/google`
6. Copie o Client ID e Client Secret
7. Adicione as variáveis no arquivo `.env`:
   ```
   GOOGLE_CLIENT_ID=seu_client_id_aqui
   GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
   ```

### 2. Microsoft OAuth

1. Acesse o [Azure Portal](https://portal.azure.com/)
2. Navegue até "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure as URIs de redirecionamento:
   - Desenvolvimento: `http://localhost:3001/api/auth/callback/microsoft`
   - Produção: `https://seu-dominio.com/api/auth/callback/microsoft`
5. Copie o Application (client) ID e crie um client secret
6. Adicione as variáveis no arquivo `.env`:
   ```
   MICROSOFT_CLIENT_ID=seu_client_id_aqui
   MICROSOFT_CLIENT_SECRET=seu_client_secret_aqui
   ```

### 3. Facebook OAuth

1. Acesse o [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo aplicativo
3. Adicione o produto "Facebook Login"
4. Configure as URIs de redirecionamento:
   - Desenvolvimento: `http://localhost:3001/api/auth/callback/facebook`
   - Produção: `https://seu-dominio.com/api/auth/callback/facebook`
5. Copie o App ID e App Secret
6. Adicione as variáveis no arquivo `.env`:
   ```
   FACEBOOK_CLIENT_ID=seu_app_id_aqui
   FACEBOOK_CLIENT_SECRET=seu_app_secret_aqui
   ```

## Configuração do Backend

O Better Auth está configurado no arquivo `src/backend/src/config/auth.ts` com os seguintes social providers:

```typescript
export const auth = betterAuth({
  database: PrismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: 'common',
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
  // ... outras configurações
});
```

## Configuração do Frontend

O cliente do Better Auth está configurado no arquivo `src/frontend/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});
```

## Uso nos Componentes

### Login com Email e Senha

```typescript
const { data, error } = await authClient.signIn.email({
  email: formData.email,
  password: formData.password,
});
```

### Login Social

```typescript
const { data, error } = await authClient.signIn.social({
  provider: "google", // ou "microsoft", "facebook"
  callbackURL: "/dashboard",
});
```

### Registro

```typescript
const { data, error } = await authClient.signUp.email({
  email: formData.email,
  password: formData.password,
  name: formData.name,
});
```

## Rotas do Better Auth

As rotas do Better Auth são automaticamente expostas em:
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/sign-out`
- `/api/auth/session`
- `/api/auth/callback/google`
- `/api/auth/callback/microsoft`
- `/api/auth/callback/facebook`

## Testando a Integração

1. Configure as variáveis de ambiente com as credenciais dos social providers
2. Inicie o backend: `npm run dev` (na pasta backend)
3. Inicie o frontend: `npm run dev` (na pasta frontend)
4. Acesse `http://localhost:3000/auth/login`
5. Teste os botões de login social

## Troubleshooting

### Erro de CORS
Certifique-se de que as URIs de redirecionamento estão configuradas corretamente nos painéis dos provedores.

### Erro de Credenciais
Verifique se as variáveis de ambiente estão configuradas corretamente e se as credenciais são válidas.

### Erro de Callback
Verifique se as rotas do Better Auth estão sendo expostas corretamente no backend.
