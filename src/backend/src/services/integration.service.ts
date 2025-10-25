import { PrismaClient } from '@prisma/client';
import { 
  IntegrationConfig, 
  CreateIntegrationDTO, 
  UpdateIntegrationDTO, 
  ConnectionTestResult, 
  UsageLogDTO, 
  UsageStats,
  ValidationResult,
  TestInstructions,
  IntegrationUsageLog
} from '../../../shared/types/integrations.types';
import { encryptionService } from './encryption.service';
import integrationKnowledgeBase from '../data/integration-knowledge-base.json';

const prisma = new PrismaClient();

export class IntegrationService {
  /**
   * Create a new integration configuration
   */
  async create(data: CreateIntegrationDTO, createdBy: string): Promise<IntegrationConfig> {
    const knowledge = integrationKnowledgeBase[data.integration];
    if (!knowledge) {
      throw new Error(`Integration ${data.integration} not found in knowledge base`);
    }

    // Encrypt sensitive fields
    const encryptedConfig = encryptionService.encryptSensitiveFields(
      data.config || {}, 
      knowledge.configFields
    );

    const integration = await prisma.integrationConfig.create({
      data: {
        integration: data.integration,
        displayName: data.displayName,
        description: data.description,
        category: data.category,
        icon: data.icon,
        environment: data.environment || 'production',
        config: encryptedConfig,
        metadata: data.metadata || {},
        isActive: false,
        isConfigured: false,
        createdBy,
        documentationUrl: knowledge.documentationUrl,
        sdkVersion: knowledge.sdkVersion
      }
    });

    return integration as IntegrationConfig;
  }

  /**
   * Get all integrations
   */
  async findAll(): Promise<IntegrationConfig[]> {
    const integrations = await prisma.integrationConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return integrations as IntegrationConfig[];
  }

  /**
   * Get integration by name
   */
  async findOne(integration: string): Promise<IntegrationConfig | null> {
    const integrationConfig = await prisma.integrationConfig.findUnique({
      where: { integration }
    });

    return integrationConfig as IntegrationConfig | null;
  }

  /**
   * Update integration
   */
  async update(integration: string, data: UpdateIntegrationDTO): Promise<IntegrationConfig> {
    const knowledge = integrationKnowledgeBase[integration];
    if (!knowledge) {
      throw new Error(`Integration ${integration} not found in knowledge base`);
    }

    const updateData: any = {
      displayName: data.displayName,
      description: data.description,
      category: data.category,
      icon: data.icon,
      environment: data.environment,
      metadata: data.metadata,
      isActive: data.isActive
    };

    // Encrypt config if provided
    if (data.config) {
      updateData.config = encryptionService.encryptSensitiveFields(
        data.config, 
        knowledge.configFields
      );
      updateData.isConfigured = true;
    }

    const updatedIntegration = await prisma.integrationConfig.update({
      where: { integration },
      data: updateData
    });

    return updatedIntegration as IntegrationConfig;
  }

  /**
   * Delete integration
   */
  async delete(integration: string): Promise<void> {
    await prisma.integrationConfig.delete({
      where: { integration }
    });
  }

  /**
   * Get decrypted configuration
   */
  async getConfig(integration: string): Promise<any> {
    const integrationConfig = await this.findOne(integration);
    if (!integrationConfig) {
      throw new Error(`Integration ${integration} not found`);
    }

    const knowledge = integrationKnowledgeBase[integration];
    if (!knowledge) {
      throw new Error(`Integration ${integration} not found in knowledge base`);
    }

    return encryptionService.decryptSensitiveFields(
      integrationConfig.config, 
      knowledge.configFields
    );
  }

  /**
   * Update configuration
   */
  async updateConfig(integration: string, config: any): Promise<IntegrationConfig> {
    const knowledge = integrationKnowledgeBase[integration];
    if (!knowledge) {
      throw new Error(`Integration ${integration} not found in knowledge base`);
    }

    // Validate configuration
    const validation = await this.validateConfig(integration, config);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Encrypt sensitive fields
    const encryptedConfig = encryptionService.encryptSensitiveFields(config, knowledge.configFields);

    const updatedIntegration = await prisma.integrationConfig.update({
      where: { integration },
      data: {
        config: encryptedConfig,
        isConfigured: true
      }
    });

    return updatedIntegration as IntegrationConfig;
  }

  /**
   * Test connection for an integration
   */
  async testConnection(integration: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const config = await this.getConfig(integration);
      const knowledge = integrationKnowledgeBase[integration];
      
      if (!knowledge || !knowledge.testEndpoint) {
        throw new Error('No test endpoint configured for this integration');
      }

      // Call specific integration test logic
      const result = await this.executeConnectionTest(integration, config, knowledge);
      
      const responseTime = Date.now() - startTime;
      
      // Update last test result
      await prisma.integrationConfig.update({
        where: { integration },
        data: {
          lastTested: new Date(),
          lastTestStatus: result.success ? 'success' : 'failure',
          lastTestMessage: result.message
        }
      });

      // Log the test
      await this.logUsage(integration, {
        eventType: 'test',
        status: result.success ? 'success' : 'failure',
        metadata: { responseTime, testResult: result }
      });

      return {
        ...result,
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update last test result
      await prisma.integrationConfig.update({
        where: { integration },
        data: {
          lastTested: new Date(),
          lastTestStatus: 'failure',
          lastTestMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Log the test failure
      await this.logUsage(integration, {
        eventType: 'test',
        status: 'failure',
        metadata: { responseTime, error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Execute connection test based on integration type
   */
  private async executeConnectionTest(integration: string, config: any, knowledge: any): Promise<ConnectionTestResult> {
    const { testEndpoint, testMethod = 'GET' } = knowledge;
    
    switch (integration) {
      case 'openai':
        return await this.testOpenAI(config);
      case 'anthropic':
        return await this.testAnthropic(config);
      case 'groq':
        return await this.testGroq(config);
      case 'ollama':
        return await this.testOllama(config);
      case 'deepseek':
        return await this.testDeepSeek(config);
      case 'stripe':
        return await this.testStripe(config);
      case 'mercadopago':
        return await this.testMercadoPago(config);
      case 'evolutionapi':
        return await this.testEvolutionAPI(config);
      case 'whatsappweb':
        return await this.testWhatsAppWeb(config);
      case 'chatwoot':
        return await this.testChatwoot(config);
      case 'n8n':
        return await this.testN8N(config);
      case 'webhooks':
        return await this.testWebhooks(config);
      case 'googlecalendar':
        return await this.testGoogleCalendar(config);
      case 'smtp':
        return await this.testSMTP(config);
      case 'cloudinary':
        return await this.testCloudinary(config);
      case 'twilio':
        return await this.testTwilio(config);
      case 'sendgrid':
        return await this.testSendGrid(config);
      case 'googlefit':
        return await this.testGoogleFit(config);
      case 'applehealth':
        return await this.testAppleHealth(config);
      case 'strava':
        return await this.testStrava(config);
      case 'slack':
        return await this.testSlack(config);
      case 'discord':
        return await this.testDiscord(config);
      case 'telegram':
        return await this.testTelegram(config);
      case 'googlemaps':
        return await this.testGoogleMaps(config);
      case 'firebase':
        return await this.testFirebase(config);
      case 'supabase':
        return await this.testSupabase(config);
      case 'zapier':
        return await this.testZapier(config);
      case 'make':
        return await this.testMake(config);
      case 'googleanalytics':
        return await this.testGoogleAnalytics(config);
      case 'mixpanel':
        return await this.testMixpanel(config);
      case 'segment':
        return await this.testSegment(config);
      default:
        throw new Error(`No test implementation for integration: ${integration}`);
    }
  }

  /**
   * Test OpenAI connection
   */
  private async testOpenAI(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Found ${data.data.length} models.`,
      details: { modelsCount: data.data.length },
      timestamp: new Date()
    };
  }

  /**
   * Test Anthropic connection
   */
  private async testAnthropic(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Anthropic Claude API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Groq connection
   */
  private async testGroq(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'llama3-70b-8192',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Groq API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Ollama connection
   */
  private async testOllama(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Found ${data.models.length} models.`,
      details: { modelsCount: data.models.length },
      timestamp: new Date()
    };
  }

  /**
   * Test DeepSeek connection
   */
  private async testDeepSeek(config: any): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${config.baseUrl || 'https://api.deepseek.com'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }

        switch (response.status) {
          case 401:
            throw new Error('Chave API inválida ou expirada');
          case 403:
            throw new Error('Acesso negado. Verifique as permissões da sua chave API');
          case 429:
            throw new Error('Rate limit excedido. Tente novamente em alguns minutos');
          case 500:
            throw new Error('Erro interno do servidor DeepSeek');
          default:
            throw new Error(`DeepSeek API error: ${errorMessage}`);
        }
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Connected successfully to DeepSeek API.',
        details: {
          model: data.model,
          responseTime: Date.now() - Date.now(),
          provider: 'deepseek'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Test Stripe connection
   */
  private async testStripe(config: any): Promise<ConnectionTestResult> {
    const secretKey = config.environment === 'live' ? config.secretKeyLive : config.secretKeyTest;
    
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Stripe API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Mercado Pago connection
   */
  private async testMercadoPago(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Mercado Pago API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Evolution API connection
   */
  private async testEvolutionAPI(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`${config.apiUrl}/instance/connectionState/${config.instanceName}`, {
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Instance state: ${data.instance.state}`,
      details: { instanceState: data.instance.state },
      timestamp: new Date()
    };
  }

  /**
   * Test WhatsApp Web connection
   */
  private async testWhatsAppWeb(config: any): Promise<ConnectionTestResult> {
    // This would typically check if the WhatsApp Web session is active
    // For now, we'll return a success if the session name is provided
    if (!config.sessionName) {
      throw new Error('Session name is required');
    }

    return {
      success: true,
      message: 'WhatsApp Web session configured successfully.',
      timestamp: new Date()
    };
  }

  /**
   * Test Chatwoot connection
   */
  private async testChatwoot(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`${config.baseUrl}/api/v1/accounts/${config.accountId}/inboxes`, {
      headers: {
        'api_access_token': config.apiAccessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Chatwoot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Found ${data.payload.length} inboxes.`,
      details: { inboxesCount: data.payload.length },
      timestamp: new Date()
    };
  }

  /**
   * Test n8n connection
   */
  private async testN8N(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`${config.baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Found ${data.data.length} workflows.`,
      details: { workflowsCount: data.data.length },
      timestamp: new Date()
    };
  }

  /**
   * Test Webhooks connection
   */
  private async testWebhooks(config: any): Promise<ConnectionTestResult> {
    // For webhooks, we'll just validate the configuration
    if (!config.signingSecret && !config.allowedOrigins) {
      throw new Error('Either signing secret or allowed origins must be configured');
    }

    return {
      success: true,
      message: 'Webhooks configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Google Calendar connection
   */
  private async testGoogleCalendar(config: any): Promise<ConnectionTestResult> {
    // This would typically test OAuth connection
    if (!config.clientId || !config.clientSecret) {
      throw new Error('OAuth credentials are required');
    }

    return {
      success: true,
      message: 'Google Calendar OAuth configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test SMTP connection
   */
  private async testSMTP(config: any): Promise<ConnectionTestResult> {
    // This would typically test SMTP connection
    if (!config.host || !config.username || !config.password) {
      throw new Error('SMTP credentials are required');
    }

    return {
      success: true,
      message: 'SMTP configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Cloudinary connection
   */
  private async testCloudinary(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Cloudinary API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Twilio connection
   */
  private async testTwilio(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Twilio API.',
      timestamp: new Date()
    };
  }

  /**
   * Test SendGrid connection
   */
  private async testSendGrid(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'test@example.com' }] }],
        from: { email: 'test@example.com' },
        subject: 'Test',
        content: [{ type: 'text/plain', value: 'Test' }]
      })
    });

    // SendGrid returns 202 for successful test sends
    if (response.status !== 202) {
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to SendGrid API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Google Fit connection
   */
  private async testGoogleFit(config: any): Promise<ConnectionTestResult> {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('OAuth credentials are required');
    }

    return {
      success: true,
      message: 'Google Fit OAuth configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Apple Health connection
   */
  private async testAppleHealth(config: any): Promise<ConnectionTestResult> {
    if (!config.apiKey || !config.teamId) {
      throw new Error('Apple Health API credentials are required');
    }

    return {
      success: true,
      message: 'Apple Health API configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Strava connection
   */
  private async testStrava(config: any): Promise<ConnectionTestResult> {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('OAuth credentials are required');
    }

    return {
      success: true,
      message: 'Strava OAuth configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Slack connection
   */
  private async testSlack(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        'Authorization': `Bearer ${config.botToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      success: true,
      message: `Connected successfully. Bot: ${data.user}`,
      details: { botUser: data.user },
      timestamp: new Date()
    };
  }

  /**
   * Test Discord connection
   */
  private async testDiscord(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bot ${config.botToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully. Bot: ${data.username}`,
      details: { botUsername: data.username },
      timestamp: new Date()
    };
  }

  /**
   * Test Telegram connection
   */
  private async testTelegram(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return {
      success: true,
      message: `Connected successfully. Bot: ${data.result.first_name}`,
      details: { botName: data.result.first_name },
      timestamp: new Date()
    };
  }

  /**
   * Test Google Maps connection
   */
  private async testGoogleMaps(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${config.apiKey}`);

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Google Maps API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Firebase connection
   */
  private async testFirebase(config: any): Promise<ConnectionTestResult> {
    if (!config.projectId || !config.privateKey) {
      throw new Error('Firebase credentials are required');
    }

    return {
      success: true,
      message: 'Firebase configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Supabase connection
   */
  private async testSupabase(config: any): Promise<ConnectionTestResult> {
    const response = await fetch(`${config.projectUrl}/rest/v1/`, {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Supabase API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Zapier connection
   */
  private async testZapier(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.zapier.com/v1/zaps', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zapier API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Zapier API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Make connection
   */
  private async testMake(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://eu1.make.com/api/v2/scenarios', {
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Make API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Make API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Google Analytics connection
   */
  private async testGoogleAnalytics(config: any): Promise<ConnectionTestResult> {
    if (!config.measurementId || !config.apiSecret) {
      throw new Error('Google Analytics credentials are required');
    }

    return {
      success: true,
      message: 'Google Analytics configuration is valid.',
      timestamp: new Date()
    };
  }

  /**
   * Test Mixpanel connection
   */
  private async testMixpanel(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://mixpanel.com/api/2.0/events/top', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.projectToken}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'general',
        unit: 'day',
        interval: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Mixpanel API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Mixpanel API.',
      timestamp: new Date()
    };
  }

  /**
   * Test Segment connection
   */
  private async testSegment(config: any): Promise<ConnectionTestResult> {
    const response = await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.writeKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test',
        event: 'Test Event',
        properties: { test: true }
      })
    });

    if (!response.ok) {
      throw new Error(`Segment API error: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Connected successfully to Segment API.',
      timestamp: new Date()
    };
  }

  /**
   * Validate configuration against schema
   */
  async validateConfig(integration: string, config: any): Promise<ValidationResult> {
    const knowledge = integrationKnowledgeBase[integration];
    if (!knowledge) {
      return { valid: false, errors: [`Integration ${integration} not found in knowledge base`] };
    }

    const errors: string[] = [];

    for (const field of knowledge.configFields) {
      const value = config[field.name];

      // Check required fields
      if (field.required && (!value || value === '')) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value || value === '') continue;

      // Validate field type
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`Field '${field.name}' must be a number`);
          }
          break;
        case 'toggle':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${field.name}' must be a boolean`);
          }
          break;
        case 'select':
          if (field.options && !field.options.some(opt => opt.value === value)) {
            errors.push(`Field '${field.name}' must be one of: ${field.options.map(opt => opt.value).join(', ')}`);
          }
          break;
      }

      // Validate regex pattern
      if (field.validation && typeof value === 'string') {
        const regex = new RegExp(field.validation);
        if (!regex.test(value)) {
          errors.push(`Field '${field.name}' format is invalid`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get test instructions for an integration
   */
  async getTestInstructions(integration: string): Promise<TestInstructions> {
    const knowledge = integrationKnowledgeBase[integration];
    if (!knowledge) {
      throw new Error(`Integration ${integration} not found in knowledge base`);
    }

    return {
      description: `Test connection to ${knowledge.displayName}`,
      steps: [
        'Ensure all required configuration fields are filled',
        'Click the "Test Connection" button',
        'Wait for the test to complete',
        'Check the result status and message'
      ],
      expectedResult: 'Connection successful with valid credentials'
    };
  }

  /**
   * Log usage for an integration
   */
  async logUsage(integration: string, data: UsageLogDTO): Promise<void> {
    const integrationConfig = await this.findOne(integration);
    if (!integrationConfig) {
      throw new Error(`Integration ${integration} not found`);
    }

    await prisma.integrationUsageLog.create({
      data: {
        integrationId: integrationConfig.id,
        eventType: data.eventType,
        requestCount: data.requestCount || 1,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        status: data.status,
        metadata: data.metadata || {}
      }
    });
  }

  /**
   * Get usage statistics for an integration
   */
  async getUsageStats(integration: string, period: string = '30d'): Promise<UsageStats> {
    const integrationConfig = await this.findOne(integration);
    if (!integrationConfig) {
      throw new Error(`Integration ${integration} not found`);
    }

    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.integrationUsageLog.findMany({
      where: {
        integrationId: integrationConfig.id,
        timestamp: { gte: startDate }
      }
    });

    const totalRequests = logs.reduce((sum, log) => sum + log.requestCount, 0);
    const successfulRequests = logs.filter(log => log.status === 'success').reduce((sum, log) => sum + log.requestCount, 0);
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const avgResponseTime = logs.reduce((sum, log) => {
      const metadata = log.metadata as any;
      return sum + (metadata?.responseTime || 0);
    }, 0) / logs.length || 0;
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const tokensUsed = logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);

    return {
      totalRequests,
      successRate,
      avgResponseTime,
      totalCost,
      tokensUsed,
      period
    };
  }

  /**
   * Get usage logs for an integration
   */
  async getUsageLogs(integration: string, filters: any = {}): Promise<IntegrationUsageLog[]> {
    const integrationConfig = await this.findOne(integration);
    if (!integrationConfig) {
      throw new Error(`Integration ${integration} not found`);
    }

    const where: any = {
      integrationId: integrationConfig.id
    };

    if (filters.startDate) {
      where.timestamp = { ...where.timestamp, gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      where.timestamp = { ...where.timestamp, lte: new Date(filters.endDate) };
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const logs = await prisma.integrationUsageLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0
    });

    return logs as IntegrationUsageLog[];
  }

  /**
   * Get metadata for an integration
   */
  async getMetadata(integration: string): Promise<any> {
    const integrationConfig = await this.findOne(integration);
    if (!integrationConfig) {
      throw new Error(`Integration ${integration} not found`);
    }

    return integrationConfig.metadata;
  }

  /**
   * Update metadata for an integration
   */
  async updateMetadata(integration: string, metadata: any): Promise<void> {
    await prisma.integrationConfig.update({
      where: { integration },
      data: { metadata }
    });
  }
}

export const integrationService = new IntegrationService();

