/**
 * Onboarding Email Service
 * 
 * Serviço para envio de emails durante o processo de onboarding:
 * - Email de boas-vindas
 * - Credenciais de acesso
 * - Guia de primeiros passos
 */

import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  to: string;
  ownerName: string;
  gymName: string;
  subdomain: string;
  loginUrl: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export class OnboardingEmailService {
  private transporter!: nodemailer.Transporter;
  private config: EmailConfig;
  private isConfigured: boolean;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASS || '',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || ''
    };

    this.isConfigured = !!(this.config.user && this.config.password);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        }
      });
    } else {
      console.warn('⚠️  Email não configurado. Configure EMAIL_USER e EMAIL_PASS para enviar emails.');
    }
  }

  /**
   * Enviar email de boas-vindas
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    if (!this.isConfigured) {
      console.log('📧 [MOCK] Email de boas-vindas enviado para:', data.to);
      return;
    }

    try {
      const html = this.generateWelcomeEmailHTML(data);
      const text = this.generateWelcomeEmailText(data);

      await this.transporter.sendMail({
        from: this.config.from,
        to: data.to,
        subject: `🎉 Bem-vindo ao FitOS, ${data.ownerName}!`,
        html,
        text
      });

      console.log('✅ Email de boas-vindas enviado para:', data.to);
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      throw new Error('Falha ao enviar email de boas-vindas');
    }
  }

  /**
   * Gerar HTML do email de boas-vindas
   */
  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao FitOS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
        }
        .info-item {
            margin: 8px 0;
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }
        .cta-button:hover {
            background: #2563eb;
        }
        .steps {
            margin: 30px 0;
        }
        .step {
            margin: 15px 0;
            padding: 15px;
            border-left: 4px solid #3b82f6;
            background: #f8fafc;
        }
        .step-number {
            font-weight: bold;
            color: #3b82f6;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .support {
            background: #ecfdf5;
            border: 1px solid #d1fae5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .support-title {
            color: #065f46;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏋️ FitOS</div>
            <h1 class="title">Bem-vindo ao FitOS!</h1>
        </div>

        <div class="content">
            <p>Olá <strong>${data.ownerName}</strong>,</p>
            
            <p>Parabéns! Sua academia <strong>${data.gymName}</strong> foi configurada com sucesso no FitOS. 
            Agora você tem acesso a uma plataforma completa para gerenciar seus clientes, treinos e muito mais.</p>

            <div class="info-box">
                <div class="info-title">📋 Informações da sua conta:</div>
                <div class="info-item"><strong>Academia:</strong> ${data.gymName}</div>
                <div class="info-item"><strong>Subdomain:</strong> ${data.subdomain}</div>
                <div class="info-item"><strong>URL de acesso:</strong> https://${data.subdomain}.${process.env.DEFAULT_DOMAIN}</div>
                <div class="info-item"><strong>Email:</strong> ${data.to}</div>
            </div>

            <div class="steps">
                <h3>🚀 Próximos passos:</h3>
                
                <div class="step">
                    <div class="step-number">1. Acesse sua conta</div>
                    <p>Faça login usando seu email e comece a explorar a plataforma.</p>
                </div>

                <div class="step">
                    <div class="step-number">2. Configure seu perfil</div>
                    <p>Complete as informações da sua academia e personalize as configurações.</p>
                </div>

                <div class="step">
                    <div class="step-number">3. Adicione seus clientes</div>
                    <p>Importe ou cadastre seus clientes para começar a usar o sistema.</p>
                </div>

                <div class="step">
                    <div class="step-number">4. Explore os recursos</div>
                    <p>Descubra todas as funcionalidades disponíveis no seu plano.</p>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${data.loginUrl}" class="cta-button">🚀 Acessar Minha Conta</a>
            </div>

            <div class="support">
                <div class="support-title">💬 Precisa de ajuda?</div>
                <p>Nossa equipe de suporte está pronta para ajudar você a aproveitar ao máximo o FitOS:</p>
                <ul>
                    <li>📧 Email: suporte@sistudo.com</li>
                    <li>📱 WhatsApp: (11) 99999-9999</li>
                    <li>📚 Central de ajuda: https://ajuda.fitOS.com</li>
                </ul>
            </div>

            <p>Mais uma vez, seja bem-vindo ao FitOS! Estamos animados para ver como você vai transformar 
            a gestão da sua academia.</p>

            <p>Abraços,<br>
            <strong>Equipe FitOS</strong></p>
        </div>

        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema FitOS.</p>
            <p>Se você não solicitou esta conta, entre em contato conosco.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Gerar versão texto do email de boas-vindas
   */
  private generateWelcomeEmailText(data: WelcomeEmailData): string {
    return `
🏋️ FitOS - Bem-vindo!

Olá ${data.ownerName},

Parabéns! Sua academia ${data.gymName} foi configurada com sucesso no FitOS.

📋 Informações da sua conta:
- Academia: ${data.gymName}
- Subdomain: ${data.subdomain}
- URL de acesso: https://${data.subdomain}.${process.env.DEFAULT_DOMAIN}
- Email: ${data.to}

🚀 Próximos passos:

1. Acesse sua conta
   Faça login usando seu email e comece a explorar a plataforma.
   Link: ${data.loginUrl}

2. Configure seu perfil
   Complete as informações da sua academia e personalize as configurações.

3. Adicione seus clientes
   Importe ou cadastre seus clientes para começar a usar o sistema.

4. Explore os recursos
   Descubra todas as funcionalidades disponíveis no seu plano.

💬 Precisa de ajuda?
- Email: suporte@sistudo.com
- WhatsApp: (11) 99999-9999
- Central de ajuda: https://ajuda.fitOS.com

Mais uma vez, seja bem-vindo ao FitOS!

Abraços,
Equipe FitOS

---
Este email foi enviado automaticamente pelo sistema FitOS.
Se você não solicitou esta conta, entre em contato conosco.
`;
  }

  /**
   * Enviar email de credenciais de acesso
   */
  async sendCredentialsEmail(data: {
    to: string;
    ownerName: string;
    gymName: string;
    subdomain: string;
    temporaryPassword?: string;
    loginUrl: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      console.log('📧 [MOCK] Email de credenciais enviado para:', data.to);
      return;
    }

    try {
      const html = this.generateCredentialsEmailHTML(data);
      const text = this.generateCredentialsEmailText(data);

      await this.transporter.sendMail({
        from: this.config.from,
        to: data.to,
        subject: `🔐 Credenciais de acesso - ${data.gymName}`,
        html,
        text
      });

      console.log('✅ Email de credenciais enviado para:', data.to);
    } catch (error) {
      console.error('❌ Erro ao enviar email de credenciais:', error);
      throw new Error('Falha ao enviar email de credenciais');
    }
  }

  /**
   * Gerar HTML do email de credenciais
   */
  private generateCredentialsEmailHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciais de Acesso - FitOS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .credentials-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .credentials-title {
            color: #92400e;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .credential-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .credential-label {
            font-weight: bold;
            color: #374151;
        }
        .credential-value {
            font-family: monospace;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            color: #1f2937;
        }
        .security-warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
        }
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 FitOS</div>
            <h1>Credenciais de Acesso</h1>
        </div>

        <p>Olá <strong>${data.ownerName}</strong>,</p>
        
        <p>Suas credenciais de acesso para a academia <strong>${data.gymName}</strong> foram criadas com sucesso.</p>

        <div class="credentials-box">
            <div class="credentials-title">🔑 Suas Credenciais</div>
            <div class="credential-item">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${data.to}</div>
            </div>
            ${data.temporaryPassword ? `
            <div class="credential-item">
                <div class="credential-label">Senha temporária:</div>
                <div class="credential-value">${data.temporaryPassword}</div>
            </div>
            ` : ''}
            <div class="credential-item">
                <div class="credential-label">URL de acesso:</div>
                <div class="credential-value">https://${data.subdomain}.${process.env.DEFAULT_DOMAIN}</div>
            </div>
        </div>

        ${data.temporaryPassword ? `
        <div class="security-warning">
            <strong>⚠️ Importante:</strong> Esta é uma senha temporária. 
            Recomendamos que você altere sua senha no primeiro acesso por questões de segurança.
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${data.loginUrl}" class="cta-button">🚀 Fazer Login</a>
        </div>

        <p>Se você tiver alguma dúvida ou precisar de ajuda, entre em contato conosco.</p>

        <p>Abraços,<br>
        <strong>Equipe FitOS</strong></p>
    </div>
</body>
</html>`;
  }

  /**
   * Gerar versão texto do email de credenciais
   */
  private generateCredentialsEmailText(data: any): string {
    return `
🔐 FitOS - Credenciais de Acesso

Olá ${data.ownerName},

Suas credenciais de acesso para a academia ${data.gymName} foram criadas com sucesso.

🔑 Suas Credenciais:
- Email: ${data.to}
${data.temporaryPassword ? `- Senha temporária: ${data.temporaryPassword}` : ''}
- URL de acesso: https://${data.subdomain}.${process.env.DEFAULT_DOMAIN}

${data.temporaryPassword ? `
⚠️ Importante: Esta é uma senha temporária. 
Recomendamos que você altere sua senha no primeiro acesso por questões de segurança.
` : ''}

Link para login: ${data.loginUrl}

Se você tiver alguma dúvida ou precisar de ajuda, entre em contato conosco.

Abraços,
Equipe FitOS
`;
  }
}
