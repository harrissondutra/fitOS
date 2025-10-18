import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

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

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      // Desabilitar verificação de email temporariamente para desenvolvimento
      if (!config.email.host || !config.email.auth?.user || !config.email.auth?.pass || 
          config.email.auth.pass === 'sua-app-password-do-gmail') {
        logger.warn('Email configuration incomplete or using default values. Email service will not be available.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure, // true for 465, false for other ports
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass, // App Password do Gmail
        },
        tls: {
          rejectUnauthorized: false, // Para desenvolvimento
        },
      });

      // Verificar conexão
      this.transporter?.verify((error: any, success: any) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('✅ Email service ready');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
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
      logger.info('Email sent successfully', { messageId: result.messageId });
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
}

export const emailService = new EmailService();
