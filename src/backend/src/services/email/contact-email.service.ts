/**
 * Contact Email Service
 * 
 * Serviço para envio de emails de contato (Vendas, Suporte, etc.)
 */

import nodemailer from 'nodemailer';

interface ContactSalesData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    size: string;
    message: string;
}

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    salesEmail: string;
}

export class ContactEmailService {
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
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
            salesEmail: process.env.CONTACT_SALES_EMAIL || 'sistudofitness@gmail.com'
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
            console.warn('⚠️  Email não configurado. Configure EMAIL_USER e EMAIL_PASS para enviar emails de contato.');
        }
    }

    /**
     * Enviar email de contato de vendas
     */
    async sendSalesContactEmail(data: ContactSalesData): Promise<void> {
        const subject = `🚀 Novo Lead Enterprise: ${data.company} (${data.firstName} ${data.lastName})`;

        // Conteúdo em texto
        const text = `
NOVO CONTATO DE VENDAS

Nome: ${data.firstName} ${data.lastName}
Empresa: ${data.company}
Tamanho da Rede: ${data.size}
Email: ${data.email}
Telefone: ${data.phone}

Mensagem:
${data.message}
-----------
Enviado via FitOS Website
    `;

        // Conteúdo HTML
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; color: white; text-align: center;">
          <h2 style="margin: 0;">Novo Lead Enterprise 🚀</h2>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Recebemos um novo contato através da página de Vendas Enterprise.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>👤 Nome:</strong> ${data.firstName} ${data.lastName}</p>
            <p style="margin: 10px 0;"><strong>🏢 Empresa:</strong> ${data.company}</p>
            <p style="margin: 10px 0;"><strong>👥 Tamanho da Rede:</strong> ${data.size}</p>
            <p style="margin: 10px 0;"><strong>📧 Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p style="margin: 10px 0;"><strong>📱 Telefone:</strong> ${data.phone}</p>
          </div>

          <p style="font-weight: bold; margin-bottom: 10px;">Mensagem:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 4px; border-left: 4px solid #10b981;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e5e5e5;">
          FitOS - Sistema Automático de Leads
        </div>
      </div>
    `;

        if (!this.isConfigured) {
            console.log('📧 [MOCK] Email de Vendas enviado para:', this.config.salesEmail);
            console.log('Conteúdo:', text);
            return;
        }

        try {
            await this.transporter.sendMail({
                from: this.config.from,
                to: this.config.salesEmail,
                replyTo: data.email,
                subject,
                html,
                text
            });

            console.log('✅ Email de vendas enviado para:', this.config.salesEmail);
        } catch (error) {
            console.error('❌ Erro ao enviar email de vendas:', error);
            throw new Error('Falha ao enviar email de vendas');
        }
    }
}
