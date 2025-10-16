# 📧 Configuração de Email - Gmail

Este documento explica como configurar o serviço de email do FitOS para usar Gmail.

## 🔧 Configuração do Gmail

### 1. Habilitar Autenticação de 2 Fatores

1. Acesse sua conta do Google
2. Vá para **Segurança** > **Verificação em duas etapas**
3. Siga as instruções para habilitar a verificação em duas etapas

### 2. Gerar App Password

1. Acesse **Segurança** > **Senhas de app**
2. Selecione **Outro (nome personalizado)**
3. Digite "FitOS" como nome
4. Copie a senha gerada (16 caracteres)

### 3. Configurar Variáveis de Ambiente

Atualize o arquivo `.env` com suas credenciais:

```env
# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password-gerada
EMAIL_FROM=noreply@fitos.com
```

## 🚀 Testando o Serviço

### 1. Teste Básico

```bash
curl -X GET http://localhost:3001/api/email/test
```

### 2. Enviar Email Personalizado

```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Teste FitOS",
    "message": "Este é um email de teste do FitOS!"
  }'
```

### 3. Enviar Email com Template

```bash
# Email de boas-vindas
curl -X POST http://localhost:3001/api/email/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "template": "welcome",
    "data": {
      "userName": "João Silva",
      "loginUrl": "http://localhost:3000/login"
    }
  }'
```

## 📋 Templates Disponíveis

### 1. Welcome (Boas-vindas)
- **Template:** `welcome`
- **Dados necessários:**
  - `userName`: Nome do usuário
  - `loginUrl`: URL de login

### 2. Password Reset (Redefinir senha)
- **Template:** `password-reset`
- **Dados necessários:**
  - `userName`: Nome do usuário
  - `resetUrl`: URL de redefinição

### 3. Workout Reminder (Lembrete de treino)
- **Template:** `workout-reminder`
- **Dados necessários:**
  - `userName`: Nome do usuário
  - `workoutName`: Nome do treino
  - `workoutTime`: Horário do treino

## 🔍 Verificar Status

```bash
# Verificar se o serviço está funcionando
curl -X GET http://localhost:3001/api/email/templates
```

## ⚠️ Troubleshooting

### Erro: "Invalid login"
- Verifique se a App Password está correta
- Confirme se a verificação em duas etapas está habilitada

### Erro: "Connection timeout"
- Verifique sua conexão com a internet
- Confirme se o Gmail está acessível

### Erro: "Authentication failed"
- Gere uma nova App Password
- Verifique se o email está correto

## 📝 Exemplo de Uso no Código

```typescript
import { emailService } from '../services/email';

// Enviar email de boas-vindas
await emailService.sendWelcomeEmail(
  'usuario@example.com',
  'João Silva',
  'http://localhost:3000/login'
);

// Enviar email personalizado
await emailService.sendEmail({
  to: 'usuario@example.com',
  subject: 'Assunto do email',
  html: '<h1>Conteúdo HTML</h1>',
  text: 'Conteúdo em texto'
});
```

## 🔒 Segurança

- **Nunca** commite as credenciais do Gmail no código
- Use sempre App Passwords, nunca a senha principal
- Mantenha as credenciais em variáveis de ambiente
- Considere usar um serviço de email dedicado para produção
