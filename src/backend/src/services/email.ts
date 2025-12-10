import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config/config-simple';
import { logger } from '../utils/logger';
import { costTrackerService } from './cost-tracker.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    try {
      // Prioridade: Resend API (HTTP, não bloqueia em cloud)
      if (config.email.resendApiKey) {
        this.resend = new Resend(config.email.resendApiKey);
        logger.info('📧 Email service initialized via Resend API (HTTP)');
        return;
      }

      // Fallback: SMTP (Nodemailer)
      // Verificar se as credenciais de email estão configuradas
      if (!config.email.host || !config.email.auth?.user || !config.email.auth?.pass) {
        logger.warn('Email configuration incomplete. Email service will not be available.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        // service: 'gmail', // Removido para respeitar host/port explicitamente
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        // Configurações para reduzir chance de SPAM em envios simples
        headers: {
          'X-Priority': '3', // Normal
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
        },
        pool: true,
        maxConnections: 1,
        maxMessages: 3,
        rateDelta: 20000,
        rateLimit: 5,
        family: 4
      } as any);

      // Verificar conexão apenas em produção
      if (config.isProduction) {
        this.transporter?.verify((error: any, success: any) => {
          if (error) {
            logger.error('Email transporter verification failed:', error);
          } else {
            logger.info('✅ Email service (SMTP) ready');
          }
        });
      } else {
        logger.info('📧 Email service (SMTP) initialized (verification skipped in development)');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // 1. Tentar via Resend API se disponível
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: config.email.from || 'onboarding@resend.dev',
          to: options.to,
          subject: options.subject,
          html: options.html || options.text || '',
          text: options.text,
          attachments: options.attachments?.map(att => ({
            filename: att.filename,
            content: att.content // Resend supports Buffer
          }))
        });

        if (error) {
          logger.error('Resend API Error:', error);
          return false;
        }

        logger.info('Email sent successfully via Resend API', { id: data?.id });
        return true;
      } catch (err) {
        logger.error('Failed to send email via Resend API:', err);
        return false;
      }
    }

    // 2. Fallback para SMTP
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully via SMTP', { messageId: result.messageId });

      // Rastrear custo do email (mantido)
      try {
        const recipientCount = Array.isArray(options.to) ? options.to.length : 1;
        await costTrackerService.trackEmailUsage({
          recipientCount,
          metadata: {
            subject: options.subject,
            messageId: result.messageId,
            hasAttachments: options.attachments && options.attachments.length > 0,
            attachmentCount: options.attachments?.length || 0,
          },
        });
      } catch (error) {
        logger.warn('Failed to track email usage:', error);
      }

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  // Templates de email
  getWelcomeEmailTemplate(userName: string, loginUrl: string): EmailTemplate {
    return {
      subject: 'Bem-vindo ao FitOS! 🏋️‍♂️',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao FitOS</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️‍♂️ FitOS</h1>
              <p>Sistema Operacional de Fitness</p>
            </div>
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              <p>Seja bem-vindo ao FitOS, sua plataforma completa de gestão fitness!</p>
              <p>Com o FitOS, você terá acesso a:</p>
              <ul>
                <li>🤖 Personal trainer alimentado por IA</li>
                <li>📊 Acompanhamento de treinos e progresso</li>
                <li>💪 Planos de exercícios personalizados</li>
                <li>📱 Interface moderna e intuitiva</li>
              </ul>
              <p>Clique no botão abaixo para começar sua jornada fitness:</p>
              <a href="${loginUrl}" class="button">Começar Agora</a>
              <p>Se você não criou esta conta, pode ignorar este email.</p>
            </div>
            <div class="footer">
              <p>© 2024 FitOS. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bem-vindo ao FitOS! 🏋️‍♂️
        
        Olá, ${userName}!
        
        Seja bem-vindo ao FitOS, sua plataforma completa de gestão fitness!
        
        Com o FitOS, você terá acesso a:
        - Personal trainer alimentado por IA
        - Acompanhamento de treinos e progresso
        - Planos de exercícios personalizados
        - Interface moderna e intuitiva
        
        Acesse sua conta: ${loginUrl}
        
        Se você não criou esta conta, pode ignorar este email.
        
        © 2024 FitOS. Todos os direitos reservados.
      `,
    };
  }

  getPasswordResetEmailTemplate(userName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Redefinir Senha - FitOS 🔐',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha - FitOS</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 FitOS</h1>
              <p>Redefinir Senha</p>
            </div>
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta FitOS.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este link expira em 1 hora</li>
                  <li>Se você não solicitou esta redefinição, ignore este email</li>
                  <li>Nunca compartilhe este link com outras pessoas</li>
                </ul>
              </div>
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>© 2024 FitOS. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Redefinir Senha - FitOS 🔐
        
        Olá, ${userName}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta FitOS.
        
        Acesse este link para criar uma nova senha: ${resetUrl}
        
        ⚠️ IMPORTANTE:
        - Este link expira em 1 hora
        - Se você não solicitou esta redefinição, ignore este email
        - Nunca compartilhe este link com outras pessoas
        
        © 2024 FitOS. Todos os direitos reservados.
      `,
    };
  }

  getWorkoutReminderEmailTemplate(userName: string, workoutName: string, workoutTime: string): EmailTemplate {
    return {
      subject: 'Lembrete de Treino - FitOS 💪',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Treino - FitOS</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4ecdc4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .workout-info { background: #e8f5e8; border: 1px solid #4ecdc4; padding: 20px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💪 FitOS</h1>
              <p>Lembrete de Treino</p>
            </div>
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              <p>É hora do seu treino! 💪</p>
              <div class="workout-info">
                <h3>📅 Treino Agendado</h3>
                <p><strong>Nome:</strong> ${workoutName}</p>
                <p><strong>Horário:</strong> ${workoutTime}</p>
              </div>
              <p>Lembre-se de:</p>
              <ul>
                <li>🏃‍♂️ Fazer um bom aquecimento</li>
                <li>💧 Manter-se hidratado</li>
                <li>📱 Registrar seu progresso no app</li>
                <li>🎯 Focar na execução correta dos exercícios</li>
              </ul>
              <a href="http://localhost:3000/workouts" class="button">Ver Treino</a>
              <p>Boa sorte e bons treinos! 🚀</p>
            </div>
            <div class="footer">
              <p>© 2024 FitOS. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Lembrete de Treino - FitOS 💪
        
        Olá, ${userName}!
        
        É hora do seu treino! 💪
        
        📅 Treino Agendado:
        Nome: ${workoutName}
        Horário: ${workoutTime}
        
        Lembre-se de:
        - Fazer um bom aquecimento
        - Manter-se hidratado
        - Registrar seu progresso no app
        - Focar na execução correta dos exercícios
        
        Acesse: http://localhost:3000/workouts
        
        Boa sorte e bons treinos! 🚀
        
        © 2024 FitOS. Todos os direitos reservados.
      `,
    };
  }

  // Métodos de conveniência
  async sendWelcomeEmail(to: string, userName: string, loginUrl: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(userName, loginUrl);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(to: string, userName: string, resetUrl: string): Promise<boolean> {
    const template = this.getPasswordResetEmailTemplate(userName, resetUrl);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWorkoutReminderEmail(to: string, userName: string, workoutName: string, workoutTime: string): Promise<boolean> {
    const template = this.getWorkoutReminderEmailTemplate(userName, workoutName, workoutTime);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
  getVerificationEmailTemplate(userName: string, verifyUrl: string): EmailTemplate {
    return {
      subject: 'Confirme seu email - FitOS ✅',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu email - FitOS</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; text-align: center; }
            .content h2 { color: #1f2937; margin-top: 0; }
            .content p { color: #4b5563; font-size: 16px; margin-bottom: 25px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); }
            .button:hover { background: #059669; }
            .features { background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; text-align: left; }
            .feature-item { display: flex; align-items: start; margin-bottom: 15px; }
            .feature-icon { color: #10b981; margin-right: 15px; font-size: 20px; }
            .feature-text h3 { margin: 0 0 5px; font-size: 16px; color: #1f2937; }
            .feature-text p { margin: 0; font-size: 14px; color: #6b7280; }
            .footer { background-color: #ececec; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .social-links { margin-bottom: 15px; }
            .social-links a { margin: 0 10px; color: #6b7280; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FitOS</h1>
              <p>O Sistema Operacional do seu Fitness</p>
            </div>
            
            <div class="content">
              <h2>Quase lá, ${userName}! 👋</h2>
              <p>Estamos muito felizes em ter você conosco! Para garantir a segurança da sua conta e liberar seu acesso completo, precisamos apenas que você confirme seu email.</p>
              
              <a href="${verifyUrl}" class="button">Confirmar meu Email e Escolher Plano</a>
              
              <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">Ou copie e cole o link abaixo no seu navegador:<br>${verifyUrl}</p>
            </div>

            <div class="features">
              <div class="feature-item">
                <span class="feature-icon">🚀</span>
                <div class="feature-text">
                  <h3>Comece Grátis</h3>
                  <p>Explore nossa plataforma com o plano gratuito para sempre.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🧠</span>
                <div class="feature-text">
                  <h3>IA Inteligente</h3>
                  <p>Treinos e dietas personalizados pela nossa inteligência artificial.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div class="feature-text">
                  <h3>Gestão Completa</h3>
                  <p>Tudo o que você precisa para gerenciar sua saúde ou negócio fitness.</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Enviado com ❤️ pela equipe FitOS</p>
              <p>© 2024 FitOS. Todos os direitos reservados.</p>
              <p>Se você não criou esta conta, nenhuma ação é necessária.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Confirme seu email - FitOS ✅
        
        Olá, ${userName}! 👋
        
        Estamos muito felizes em ter você conosco! Para garantir a segurança da sua conta, confirme seu email clicando no link abaixo:
        
        ${verifyUrl}
        
        Ao confirmar, você será redirecionado para escolher seu plano (inclusive o plano Gratuito!).
        
        Se você não criou esta conta, pode ignorar este email.
        
        © 2024 FitOS_Team
      `,
    };
  }

  async sendVerificationEmail(to: string, userName: string, verifyUrl: string): Promise<boolean> {
    const template = this.getVerificationEmailTemplate(userName, verifyUrl);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();
