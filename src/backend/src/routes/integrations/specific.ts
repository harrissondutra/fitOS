import { Router } from 'express';
import { IntegrationService } from '../../services/integration.service';
import { EncryptionService } from '../../services/encryption.service';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const integrationService = new IntegrationService();

// Middleware para todas as rotas
// TODO: Implementar middleware de autenticação

// OpenAI specific routes
export const openaiRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { apiKey, organizationId, timeout = 60000 } = config;
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(organizationId && { 'OpenAI-Organization': organizationId })
        },
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(), // Placeholder
        accountInfo: {
          organizationId: organizationId || 'default',
          modelsAvailable: data.data?.length || 0,
          apiVersion: 'v1'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getModels(config: any): Promise<any[]> {
    try {
      const { apiKey, organizationId } = config;
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(organizationId && { 'OpenAI-Organization': organizationId })
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getUsage(config: any, period: string = '30d'): Promise<any> {
    try {
      const { apiKey, organizationId } = config;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period.replace('d', '')));

      const response = await fetch(`https://api.openai.com/v1/usage?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(organizationId && { 'OpenAI-Organization': organizationId })
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        totalTokens: data.total_usage || 0,
        totalCost: data.total_cost || 0,
        period,
        dailyUsage: data.daily_costs || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Anthropic specific routes
export const anthropicRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { apiKey, timeout = 60000 } = config;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        }),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(),
        accountInfo: {
          apiVersion: '2023-06-01',
          model: 'claude-3-haiku-20240307'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getModels(config: any): Promise<any[]> {
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ];
  },

  async getUsage(config: any, period: string = '30d'): Promise<any> {
    // Anthropic doesn't provide usage API, return mock data
    return {
      totalTokens: 0,
      totalCost: 0,
      period,
      dailyUsage: []
    };
  }
};

// Groq specific routes
export const groqRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { apiKey, model = 'llama3-70b-8192', timeout = 30000 } = config;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(),
        accountInfo: {
          model,
          provider: 'groq'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getModels(config: any): Promise<any[]> {
    return [
      { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
      { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma-7b-it', name: 'Gemma 7B' }
    ];
  },

  async getUsage(config: any, period: string = '30d'): Promise<any> {
    // Groq doesn't provide usage API, return mock data
    return {
      totalTokens: 0,
      totalCost: 0,
      period,
      dailyUsage: []
    };
  }
};

// DeepSeek specific routes
export const deepseekRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { apiKey, baseUrl = 'https://api.deepseek.com', timeout = 60000 } = config;
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(timeout)
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
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(),
        accountInfo: {
          provider: 'deepseek',
          baseUrl,
          model: data.model,
          finishReason: data.choices?.[0]?.finish_reason
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getModels(config: any): Promise<any[]> {
    try {
      // Tentar buscar modelos da API (se disponível)
      const { apiKey, baseUrl = 'https://api.deepseek.com' } = config;
      
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.map((model: any) => ({
          id: model.id,
          name: model.id.replace('deepseek-', 'DeepSeek ').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: model.description || '',
          capabilities: model.capabilities || {}
        })) || [];
      }
    } catch (error) {
      console.warn('Failed to fetch models from API, using static list:', error);
    }

    // Fallback para lista estática de modelos conhecidos
    return [
      { 
        id: 'deepseek-chat', 
        name: 'DeepSeek Chat',
        description: 'Modelo de conversação geral otimizado para diálogos',
        capabilities: { chat: true, streaming: true }
      },
      { 
        id: 'deepseek-coder', 
        name: 'DeepSeek Coder',
        description: 'Modelo especializado em análise e geração de código',
        capabilities: { chat: true, code: true, streaming: true }
      },
      { 
        id: 'deepseek-reasoner', 
        name: 'DeepSeek Reasoner',
        description: 'Modelo avançado para raciocínio matemático e lógico',
        capabilities: { chat: true, reasoning: true, streaming: true }
      },
      { 
        id: 'deepseek-vl', 
        name: 'DeepSeek VL',
        description: 'Modelo multimodal com capacidades de visão computacional',
        capabilities: { chat: true, vision: true, streaming: true }
      }
    ];
  },

  async getUsage(config: any, period: string = '30d'): Promise<any> {
    // DeepSeek doesn't provide usage API, return mock data
    // Em produção, você poderia implementar tracking interno
    return {
      totalTokens: 0,
      totalCost: 0,
      period,
      dailyUsage: [],
      note: 'DeepSeek não fornece API de uso. Considere implementar tracking interno.'
    };
  }
};

// Stripe specific routes
export const stripeRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { secretKey, environment = 'test' } = config;
      
      const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(),
        accountInfo: {
          environment,
          customersCount: data.data?.length || 0,
          apiVersion: '2023-10-16'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getAccountInfo(config: any): Promise<any> {
    try {
      const { secretKey } = config;
      
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getPaymentStats(config: any, period: string = '30d'): Promise<any> {
    try {
      const { secretKey } = config;
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (parseInt(period.replace('d', '')) * 24 * 60 * 60);

      const response = await fetch(`https://api.stripe.com/v1/charges?created[gte]=${startDate}&created[lte]=${endDate}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        totalTransactions: data.data?.length || 0,
        totalAmount: data.data?.reduce((sum: number, charge: any) => sum + charge.amount, 0) || 0,
        successRate: data.data?.filter((charge: any) => charge.status === 'succeeded').length / (data.data?.length || 1) * 100,
        period
      };
    } catch (error) {
      throw new Error(`Failed to fetch payment stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// WhatsApp (Evolution API) specific routes
export const whatsappRoutes = {
  async testConnection(config: any): Promise<any> {
    try {
      const { apiUrl, apiKey, instanceName } = config;
      
      const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: Date.now() - Date.now(),
        sessionInfo: {
          instanceName,
          status: data.instance?.state || 'unknown',
          phoneNumber: data.instance?.phone || 'unknown'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  },

  async getSessionStatus(config: any): Promise<any> {
    try {
      const { apiUrl, apiKey, instanceName } = config;
      
      const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch session status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getMessageStats(config: any, period: string = '30d'): Promise<any> {
    // Mock data for WhatsApp message stats
    return {
      totalMessages: 5420,
      sentMessages: 3200,
      receivedMessages: 2220,
      deliveredMessages: 3150,
      failedMessages: 50,
      period
    };
  }
};

// Generic integration handler
const handleIntegrationSpecificRoute = async (req: any, res: any, integration: string, action: string) => {
  try {
    const integrationConfig = await integrationService.getConfig(integration);
    if (!integrationConfig) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    const config = integrationConfig.config;
    
    let result;
    
    switch (integration) {
      case 'openai':
        if (action === 'test') result = await openaiRoutes.testConnection(config);
        else if (action === 'models') result = await openaiRoutes.getModels(config);
        else if (action === 'usage') result = await openaiRoutes.getUsage(config, req.query.period);
        break;
        
      case 'anthropic':
        if (action === 'test') result = await anthropicRoutes.testConnection(config);
        else if (action === 'models') result = await anthropicRoutes.getModels(config);
        else if (action === 'usage') result = await anthropicRoutes.getUsage(config, req.query.period);
        break;
        
      case 'groq':
        if (action === 'test') result = await groqRoutes.testConnection(config);
        else if (action === 'models') result = await groqRoutes.getModels(config);
        else if (action === 'usage') result = await groqRoutes.getUsage(config, req.query.period);
        break;
        
      case 'deepseek':
        if (action === 'test') result = await deepseekRoutes.testConnection(config);
        else if (action === 'models') result = await deepseekRoutes.getModels(config);
        else if (action === 'usage') result = await deepseekRoutes.getUsage(config, req.query.period);
        break;
        
      case 'stripe':
        if (action === 'test') result = await stripeRoutes.testConnection(config);
        else if (action === 'account') result = await stripeRoutes.getAccountInfo(config);
        else if (action === 'stats') result = await stripeRoutes.getPaymentStats(config, req.query.period);
        break;
        
      case 'whatsapp':
        if (action === 'test') result = await whatsappRoutes.testConnection(config);
        else if (action === 'status') result = await whatsappRoutes.getSessionStatus(config);
        else if (action === 'stats') result = await whatsappRoutes.getMessageStats(config, req.query.period);
        break;
        
      default:
        return res.status(400).json({ message: 'Unsupported integration' });
    }

    res.json(result);
  } catch (error) {
    console.error(`Error in ${integration} ${action}:`, error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Routes for specific integrations
router.get('/openai/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'openai', 'test');
});

router.get('/openai/models', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'openai', 'models');
});

router.get('/openai/usage', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'openai', 'usage');
});

router.get('/anthropic/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'anthropic', 'test');
});

router.get('/anthropic/models', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'anthropic', 'models');
});

router.get('/anthropic/usage', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'anthropic', 'usage');
});

router.get('/groq/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'groq', 'test');
});

router.get('/groq/models', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'groq', 'models');
});

router.get('/groq/usage', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'groq', 'usage');
});

router.get('/deepseek/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'deepseek', 'test');
});

router.get('/deepseek/models', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'deepseek', 'models');
});

router.get('/deepseek/usage', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'deepseek', 'usage');
});

router.get('/stripe/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'stripe', 'test');
});

router.get('/stripe/account', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'stripe', 'account');
});

router.get('/stripe/stats', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'stripe', 'stats');
});

router.get('/whatsapp/test', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'whatsapp', 'test');
});

router.get('/whatsapp/status', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'whatsapp', 'status');
});

router.get('/whatsapp/stats', async (req, res) => {
  await handleIntegrationSpecificRoute(req, res, 'whatsapp', 'stats');
});

export default router;

