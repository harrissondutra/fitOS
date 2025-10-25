/**
 * Email Worker - FitOS
 * 
 * Processador de jobs de email usando Bull Queue
 */

import { Job } from 'bull';
import { queueService } from '../services/queue.service';
import { logger } from '../utils/logger';
// import { emailService } from '../services/email.service'; // Assumindo que você tem um serviço de e-mail

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  context?: any;
  attachments?: any[];
  tenantId?: string;
}

export class EmailWorker {
  private queue = queueService.getQueue('email');

  constructor() {
    this.setupProcessors();
  }

  /**
   * Configurar processadores de jobs
   */
  private setupProcessors(): void {
    if (!this.queue) {
      logger.error('Email queue not found');
      return;
    }

    // Processar envio de email
    this.queue.process('send-email', 5, async (job: Job<EmailJobData>) => {
      return this.processSendEmail(job);
    });

    // Processar email em lote
    this.queue.process('send-bulk-email', 2, async (job: Job<EmailJobData[]>) => {
      return this.processBulkEmail(job);
    });

    // Processar email agendado
    this.queue.process('send-scheduled-email', 1, async (job: Job<EmailJobData & { scheduledFor: Date }>) => {
      return this.processScheduledEmail(job);
    });

    logger.info('✅ Email worker processors configured');
  }

  /**
   * Processar envio de email individual
   */
  private async processSendEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context, attachments, tenantId } = job.data;

    try {
      logger.debug(`Processing email job ${job.id}: ${subject}`);

      // Enviar email usando o serviço de email
      // Simular envio de email
      logger.info(`📧 Email sent to ${to} with subject "${subject}" (Job ID: ${job.id})`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info(`Email sent successfully: ${subject} to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (error) {
      logger.error(`Failed to send email ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Processar envio de email em lote
   */
  private async processBulkEmail(job: Job<EmailJobData[]>): Promise<void> {
    const emails = job.data;

    try {
      logger.debug(`Processing bulk email job ${job.id}: ${emails.length} emails`);

      const results = await Promise.allSettled(
        emails.map(async emailData => {
          // Simular envio de email
          logger.info(`📧 Bulk email sent to ${emailData.to} with subject "${emailData.subject}"`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, messageId: `bulk_${Date.now()}` };
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);

      if (failed > 0) {
        throw new Error(`${failed} emails failed to send`);
      }
    } catch (error) {
      logger.error(`Failed to process bulk email ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Processar email agendado
   */
  private async processScheduledEmail(job: Job<EmailJobData & { scheduledFor: Date }>): Promise<void> {
    const { scheduledFor, ...emailData } = job.data;

    try {
      logger.debug(`Processing scheduled email job ${job.id}: ${emailData.subject}`);

      // Verificar se é hora de enviar
      const now = new Date();
      if (now < scheduledFor) {
        // Reagendar para o horário correto
        const delay = scheduledFor.getTime() - now.getTime();
        // Simular delay de envio
        await new Promise(resolve => setTimeout(resolve, delay));
        return;
      }

      // Enviar email
      await this.processSendEmail(job as Job<EmailJobData>);
    } catch (error) {
      logger.error(`Failed to process scheduled email ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Adicionar job de email individual
   */
  async addEmailJob(data: EmailJobData, options?: any): Promise<Job<EmailJobData>> {
    return queueService.addEmailJob(data, options);
  }

  /**
   * Adicionar job de email em lote
   */
  async addBulkEmailJob(emails: EmailJobData[], options?: any): Promise<Job<EmailJobData[]>> {
    return queueService.addJob('email', 'send-bulk-email', emails, options);
  }

  /**
   * Adicionar job de email agendado
   */
  async addScheduledEmailJob(data: EmailJobData & { scheduledFor: Date }, options?: any): Promise<Job<EmailJobData & { scheduledFor: Date }>> {
    return queueService.addJob('email', 'send-scheduled-email', data, options);
  }

  /**
   * Obter estatísticas da fila de email
   */
  async getStats(): Promise<any> {
    if (!this.queue) return null;

    const counts = await this.queue.getJobCounts();
    const isPaused = await this.queue.isPaused();

    return {
      ...counts,
      paused: isPaused
    };
  }

  /**
   * Pausar processamento de emails
   */
  async pause(): Promise<void> {
    await queueService.pauseQueue('email');
  }

  /**
   * Retomar processamento de emails
   */
  async resume(): Promise<void> {
    await queueService.resumeQueue('email');
  }

  /**
   * Limpar fila de emails
   */
  async clean(grace: number = 0): Promise<void> {
    await queueService.cleanQueue('email', grace);
  }
}

// Instância singleton
export const emailWorker = new EmailWorker();
