import { PrismaClient } from '@prisma/client';
import { 
  AiServiceType, 
  AiProviderType,
  AiCompletionOptions,
  AiCompletionResponse 
} from '../../../shared/types/ai.types';
import { aiProviderService } from '../services/ai-provider.service';
import { aiClientFactory } from '../services/ai-client.factory';

const prisma = new PrismaClient();

export interface JobQueueItem {
  id: string;
  serviceType: AiServiceType;
  providerId: string;
  tenantId: string;
  input: any;
  options?: AiCompletionOptions;
  userId?: string;
  metadata?: Record<string, any>;
  priority?: number;
  maxRetries?: number;
}

export interface JobResult {
  success: boolean;
  output?: any;
  error?: string;
  responseTime?: number;
  usage?: any;
}

export class JobQueueService {
  private isProcessing = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly BATCH_SIZE = 5;
  private readonly PROCESSING_INTERVAL = 5000; // 5 segundos

  constructor() {
    this.startProcessing();
  }

  /**
   * Adiciona job à fila
   */
  async enqueueJob(jobData: JobQueueItem): Promise<string> {
    const job = await prisma.aiJob.create({
      data: {
        serviceType: jobData.serviceType,
        providerId: jobData.providerId,
        tenantId: jobData.tenantId,
        status: 'pending',
        input: JSON.stringify(jobData.input),
        attempts: 0,
        userId: jobData.userId,
        metadata: jobData.metadata ? JSON.stringify(jobData.metadata) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return job.id;
  }

  /**
   * Processa jobs pendentes
   */
  async processJobs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingJobs = await prisma.aiJob.findMany({
        where: {
          status: 'pending',
          attempts: { lt: 3 } // Máximo 3 tentativas
        },
        take: this.BATCH_SIZE,
        orderBy: [
          { createdAt: 'asc' }
        ]
      });

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Error processing jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa job individual
   */
  private async processJob(job: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Marcar como processando
      await prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          startedAt: new Date(),
          attempts: job.attempts + 1,
          updatedAt: new Date()
        }
      });

      // Buscar provedor
      const provider = await aiProviderService.getProviderById(job.providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Processar baseado no tipo de serviço
      const result = await this.executeJob(job, provider);

      // Marcar como concluído
      await prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: JSON.stringify(result.output),
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Job ${job.id} completed successfully`);

    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error.message);

      // Marcar como falhou
      await prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 2 ? 'failed' : 'pending',
          error: error.message,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Executa job baseado no tipo de serviço
   */
  private async executeJob(job: any, provider: any): Promise<JobResult> {
    const input = JSON.parse(job.input);
    const metadata = job.metadata ? JSON.parse(job.metadata) : {};

    switch (job.serviceType) {
      case AiServiceType.CHAT:
        return await this.executeChatJob(input, provider, metadata);
      
      case AiServiceType.WORKOUT:
        return await this.executeWorkoutJob(input, provider, metadata);
      
      case AiServiceType.NUTRITION:
        return await this.executeNutritionJob(input, provider, metadata);
      
      case AiServiceType.TRANSCRIPTION:
        return await this.executeTranscriptionJob(input, provider, metadata);
      
      case AiServiceType.IMAGE_ANALYSIS:
        return await this.executeImageAnalysisJob(input, provider, metadata);
      
      case AiServiceType.ANALYTICS:
        return await this.executeAnalyticsJob(input, provider, metadata);
      
      case AiServiceType.CHURN:
        return await this.executeChurnJob(input, provider, metadata);
      
      default:
        return await this.executeGenericJob(input, provider, metadata);
    }
  }

  /**
   * Executa job de chat
   */
  private async executeChatJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.CHAT,
      input.messages || input.prompt,
      {
        temperature: input.temperature || 0.7,
        maxTokens: input.maxTokens || 2000,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        content: response.content,
        model: response.model,
        usage: response.usage
      },
      responseTime: Date.now() - Date.now(),
      usage: response.usage
    };
  }

  /**
   * Executa job de geração de treino
   */
  private async executeWorkoutJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const prompt = this.buildWorkoutPrompt(input);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.WORKOUT,
      prompt,
      {
        temperature: 0.8,
        maxTokens: 3000,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        workout: this.parseWorkoutResponse(response.content),
        metadata: {
          userLevel: input.level,
          goals: input.goals,
          equipment: input.equipment
        }
      },
      usage: response.usage
    };
  }

  /**
   * Executa job de análise nutricional
   */
  private async executeNutritionJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const prompt = this.buildNutritionPrompt(input);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.NUTRITION,
      prompt,
      {
        temperature: 0.6,
        maxTokens: 2500,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        analysis: this.parseNutritionResponse(response.content),
        recommendations: this.extractRecommendations(response.content)
      },
      usage: response.usage
    };
  }

  /**
   * Executa job de transcrição
   */
  private async executeTranscriptionJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    // Para transcrição, geralmente é síncrono, mas pode ser assíncrono para arquivos grandes
    const client = aiClientFactory.createClient(provider);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.TRANSCRIPTION,
      input.audioData || input.audioUrl,
      {
        model: input.model || 'whisper-1'
      }
    );

    return {
      success: true,
      output: {
        transcription: response.content,
        language: input.language || 'pt-BR',
        confidence: metadata.confidence || 0.95
      },
      usage: response.usage
    };
  }

  /**
   * Executa job de análise de imagem
   */
  private async executeImageAnalysisJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.IMAGE_ANALYSIS,
      {
        image: input.imageData || input.imageUrl,
        prompt: input.prompt || 'Analyze this image and provide detailed insights'
      },
      {
        model: input.model || 'gpt-4-vision-preview',
        maxTokens: 2000
      }
    );

    return {
      success: true,
      output: {
        analysis: response.content,
        detectedObjects: this.extractObjects(response.content),
        confidence: metadata.confidence || 0.9
      },
      usage: response.usage
    };
  }

  /**
   * Executa job de analytics
   */
  private async executeAnalyticsJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const prompt = this.buildAnalyticsPrompt(input);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.ANALYTICS,
      prompt,
      {
        temperature: 0.3,
        maxTokens: 4000,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        insights: this.parseAnalyticsResponse(response.content),
        recommendations: this.extractAnalyticsRecommendations(response.content),
        metrics: input.metrics
      },
      usage: response.usage
    };
  }

  /**
   * Executa job de predição de churn
   */
  private async executeChurnJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const prompt = this.buildChurnPrompt(input);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.CHURN,
      prompt,
      {
        temperature: 0.2,
        maxTokens: 2000,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        churnProbability: this.extractChurnProbability(response.content),
        riskFactors: this.extractRiskFactors(response.content),
        recommendations: this.extractChurnRecommendations(response.content)
      },
      usage: response.usage
    };
  }

  /**
   * Executa job genérico
   */
  private async executeGenericJob(input: any, provider: any, metadata: any): Promise<JobResult> {
    const client = aiClientFactory.createClient(provider);
    
    const response = await client.executeCompletion(
      provider,
      AiServiceType.CUSTOM,
      input,
      {
        temperature: 0.7,
        maxTokens: 2000,
        model: input.model
      }
    );

    return {
      success: true,
      output: {
        result: response.content,
        metadata: metadata
      },
      usage: response.usage
    };
  }

  /**
   * Inicia processamento automático
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, this.PROCESSING_INTERVAL);
  }

  /**
   * Para processamento automático
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Métodos auxiliares para construir prompts e parsear respostas

  private buildWorkoutPrompt(input: any): string {
    return `Generate a personalized workout plan for a ${input.level} level user with the following goals: ${input.goals.join(', ')}. Available equipment: ${input.equipment.join(', ')}. Include warm-up, main exercises, and cool-down.`;
  }

  private buildNutritionPrompt(input: any): string {
    return `Analyze the nutritional content of this meal: ${input.mealDescription}. Provide detailed macronutrient breakdown, micronutrient highlights, and health recommendations.`;
  }

  private buildAnalyticsPrompt(input: any): string {
    return `Analyze the following fitness data and provide business insights: ${JSON.stringify(input.metrics)}. Focus on user engagement, retention patterns, and growth opportunities.`;
  }

  private buildChurnPrompt(input: any): string {
    return `Analyze the following user data to predict churn probability: ${JSON.stringify(input.userData)}. Identify risk factors and provide retention recommendations.`;
  }

  private parseWorkoutResponse(content: string): any {
    // Parse workout response - implementar conforme formato esperado
    return { exercises: [], duration: 0, difficulty: 'medium' };
  }

  private parseNutritionResponse(content: string): any {
    // Parse nutrition response
    return { macros: {}, micros: {}, score: 0 };
  }

  private parseAnalyticsResponse(content: string): any {
    // Parse analytics response
    return { insights: [], trends: [], opportunities: [] };
  }

  private extractRecommendations(content: string): string[] {
    // Extract recommendations from content
    return [];
  }

  private extractObjects(content: string): string[] {
    // Extract detected objects from image analysis
    return [];
  }

  private extractAnalyticsRecommendations(content: string): string[] {
    // Extract analytics recommendations
    return [];
  }

  private extractChurnProbability(content: string): number {
    // Extract churn probability from content
    return 0.5;
  }

  private extractRiskFactors(content: string): string[] {
    // Extract risk factors
    return [];
  }

  private extractChurnRecommendations(content: string): string[] {
    // Extract churn recommendations
    return [];
  }
}

// Instância singleton
export const jobQueueService = new JobQueueService();

// Graceful shutdown
process.on('SIGINT', () => {
  jobQueueService.stopProcessing();
  process.exit(0);
});

process.on('SIGTERM', () => {
  jobQueueService.stopProcessing();
  process.exit(0);
});
