import { 
  AiProvider, 
  AiProviderType, 
  AiServiceType,
  AiCompletionOptions,
  AiCompletionResponse,
  WebhookCallbackPayload,
  N8NWebhookPayload
} from '../../../shared/types/ai.types';
import { webhookValidator } from './webhook-validator.service';

/**
 * AiClientFactory - Factory para clientes de IA
 * 
 * Cria e gerencia clientes para diferentes provedores de IA,
 * incluindo suporte a webhooks N8N e APIs customizadas.
 */
export class AiClientFactory {
  private clients: Map<string, any> = new Map();

  /**
   * Cria cliente para um provedor específico
   * @param provider Provedor de IA
   * @returns Cliente configurado
   */
  createClient(provider: AiProvider): any {
    const clientKey = `${provider.id}-${provider.provider}`;
    
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey);
    }

    let client: any;

    switch (provider.provider) {
      case AiProviderType.OPENAI:
        client = this.createOpenAIClient(provider);
        break;
      case AiProviderType.GEMINI:
        client = this.createGeminiClient(provider);
        break;
      case AiProviderType.GROQ:
        client = this.createGroqClient(provider);
        break;
      case AiProviderType.CLAUDE:
        client = this.createClaudeClient(provider);
        break;
      case AiProviderType.MISTRAL:
        client = this.createMistralClient(provider);
        break;
      case AiProviderType.COHERE:
        client = this.createCohereClient(provider);
        break;
      case AiProviderType.OLLAMA:
        client = this.createOllamaClient(provider);
        break;
      case AiProviderType.HUGGINGFACE:
        client = this.createHuggingFaceClient(provider);
        break;
      case AiProviderType.DEEPSEEK:
        client = this.createDeepSeekClient(provider);
        break;
      case AiProviderType.CUSTOM_API:
        client = this.createCustomAPIClient(provider);
        break;
      case AiProviderType.N8N_WEBHOOK:
        client = this.createN8NWebhookClient(provider);
        break;
      case AiProviderType.CUSTOM_WEBHOOK:
        client = this.createCustomWebhookClient(provider);
        break;
      default:
        throw new Error(`Unsupported provider type: ${provider.provider}`);
    }

    this.clients.set(clientKey, client);
    return client;
  }

  /**
   * Executa completação de IA
   * @param provider Provedor de IA
   * @param serviceType Tipo do serviço
   * @param prompt Prompt ou dados de entrada
   * @param options Opções de completação
   * @returns Resposta da IA
   */
  async executeCompletion(
    provider: AiProvider,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions = {}
  ): Promise<AiCompletionResponse> {
    const client = this.createClient(provider);

    if (provider.isAsync) {
      return this.executeAsyncCompletion(provider, serviceType, prompt, options);
    }

    return this.executeSyncCompletion(client, provider, serviceType, prompt, options);
  }

  /**
   * Método simplificado para completação de IA
   * Este método busca automaticamente o provedor configurado para o serviço
   * @param serviceType Tipo do serviço
   * @param prompt Prompt ou dados de entrada
   * @param options Opções de completação
   * @returns Resposta da IA
   */
  async complete(
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions = {}
  ): Promise<AiCompletionResponse> {
    // Este método requer que seja chamado dentro de um contexto com tenantId
    // e que o provedor esteja configurado via AiProviderService
    // Por agora, lançamos erro se chamado diretamente
    throw new Error('The complete() method requires context. Use executeCompletion() with a provider instead.');
  }

  /**
   * Executa completação síncrona
   */
  private async executeSyncCompletion(
    client: any,
    provider: AiProvider,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<AiCompletionResponse> {
    const startTime = Date.now();

    try {
      let response: any;

      switch (provider.provider) {
        case AiProviderType.OPENAI:
          response = await this.executeOpenAICompletion(client, serviceType, prompt, options);
          break;
        case AiProviderType.GEMINI:
          response = await this.executeGeminiCompletion(client, serviceType, prompt, options);
          break;
        case AiProviderType.GROQ:
          response = await this.executeGroqCompletion(client, serviceType, prompt, options);
          break;
        case AiProviderType.DEEPSEEK:
          response = await this.executeDeepSeekCompletion(client, serviceType, prompt, options);
          break;
        default:
          throw new Error(`Sync completion not supported for ${provider.provider}`);
      }

      return {
        content: response.content,
        model: response.model,
        usage: response.usage,
        metadata: response.metadata,
        isAsync: false
      };
    } catch (error) {
      throw new Error(`Completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executa completação assíncrona via webhook
   */
  private async executeAsyncCompletion(
    provider: AiProvider,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<AiCompletionResponse> {
    if (!provider.webhookUrl) {
      throw new Error('Webhook URL not configured for async provider');
    }

    const payload: N8NWebhookPayload = {
      serviceType,
      input: prompt,
      metadata: {
        ...options.metadata,
        provider: provider.provider,
        model: options.model || provider.models[0],
        timestamp: Date.now()
      }
    };

    const response = await fetch(provider.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': webhookValidator.generateHmacSignature(JSON.stringify(payload)),
        'X-Webhook-Timestamp': webhookValidator.generateTimestamp(),
        ...provider.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return {
      content: result.content || '',
      model: result.model || 'unknown',
      usage: result.usage,
      metadata: result.metadata,
      isAsync: true,
      jobId: result.jobId
    };
  }

  /**
   * Cria cliente OpenAI
   */
  private createOpenAIClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.openai.com/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Gemini
   */
  private createGeminiClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://generativelanguage.googleapis.com/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Groq
   */
  private createGroqClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.groq.com/openai/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Claude
   */
  private createClaudeClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.anthropic.com/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Mistral
   */
  private createMistralClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.mistral.ai/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Cohere
   */
  private createCohereClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.cohere.ai/v1',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Ollama
   */
  private createOllamaClient(provider: AiProvider): any {
    return {
      baseURL: provider.baseUrl || 'http://localhost:11434',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente Hugging Face
   */
  private createHuggingFaceClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api-inference.huggingface.co',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente DeepSeek
   */
  private createDeepSeekClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl || 'https://api.deepseek.com',
      maxRetries: provider.maxRetries,
      headers: provider.headers
    };
  }

  /**
   * Cria cliente API customizada
   */
  private createCustomAPIClient(provider: AiProvider): any {
    return {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      maxRetries: provider.maxRetries,
      headers: provider.headers,
      config: provider.config
    };
  }

  /**
   * Cria cliente webhook N8N
   */
  private createN8NWebhookClient(provider: AiProvider): any {
    return {
      webhookUrl: provider.webhookUrl,
      webhookSecret: provider.webhookSecret,
      headers: provider.headers,
      config: provider.config
    };
  }

  /**
   * Cria cliente webhook customizado
   */
  private createCustomWebhookClient(provider: AiProvider): any {
    return {
      webhookUrl: provider.webhookUrl,
      webhookSecret: provider.webhookSecret,
      headers: provider.headers,
      config: provider.config
    };
  }

  /**
   * Executa completação OpenAI
   */
  private async executeOpenAICompletion(
    client: any,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<any> {
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2000;

    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.headers
      },
      body: JSON.stringify({
        model,
        messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP ?? 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
      metadata: {
        finishReason: data.choices[0]?.finish_reason,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };
  }

  /**
   * Executa completação Gemini
   */
  private async executeGeminiCompletion(
    client: any,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<any> {
    const model = options.model || 'gemini-pro';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2000;

    const response = await fetch(`${client.baseURL}/models/${model}:generateContent?key=${client.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...client.headers
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
          }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: options.topP ?? 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0]?.content?.parts[0]?.text || '',
      model: model,
      usage: data.usageMetadata,
      metadata: {
        finishReason: data.candidates[0]?.finishReason,
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount
      }
    };
  }

  /**
   * Executa completação Groq
   */
  private async executeGroqCompletion(
    client: any,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<any> {
    const model = options.model || 'llama3-70b-8192';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2000;

    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.headers
      },
      body: JSON.stringify({
        model,
        messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP ?? 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
      metadata: {
        finishReason: data.choices[0]?.finish_reason,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };
  }

  /**
   * Executa completação DeepSeek
   */
  private async executeDeepSeekCompletion(
    client: any,
    serviceType: AiServiceType,
    prompt: string | any,
    options: AiCompletionOptions
  ): Promise<any> {
    const model = options.model || 'deepseek-chat';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2000;

    // Validar modelo
    if (!this.validateDeepSeekModel(model)) {
      throw new Error(`Modelo inválido: ${model}. Modelos suportados: deepseek-chat, deepseek-coder, deepseek-reasoner, deepseek-vl`);
    }

    const response = await this.executeWithRetry(
      () => this.makeDeepSeekRequest(client, model, prompt, temperature, maxTokens, options),
      client.maxRetries || 3
    );

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: response.usage,
      metadata: {
        finishReason: response.choices[0]?.finish_reason,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      }
    };
  }

  /**
   * Valida se o modelo DeepSeek é suportado
   */
  private validateDeepSeekModel(model: string): boolean {
    const validModels = [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner',
      'deepseek-vl'
    ];
    return validModels.includes(model);
  }

  /**
   * Executa requisição com retry e backoff exponencial
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Se é o último attempt ou erro não é de rate limit, re-throw
        if (attempt === maxRetries || !this.isRetryableError(errorMessage)) {
          throw error;
        }
        
        // Calcular delay com backoff exponencial
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');
        const baseDelay = isRateLimit ? 2000 : 1000;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        console.warn(`DeepSeek API attempt ${attempt} failed, retrying in ${delay}ms:`, errorMessage);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Verifica se o erro é recuperável (pode tentar novamente)
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      '429', // Rate limit
      'rate limit',
      'timeout',
      'network',
      'connection',
      '500', // Internal server error
      '502', // Bad gateway
      '503', // Service unavailable
      '504'  // Gateway timeout
    ];
    
    return retryablePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Faz a requisição para a API DeepSeek
   */
  private async makeDeepSeekRequest(
    client: any,
    model: string,
    prompt: string | any,
    temperature: number,
    maxTokens: number,
    options: AiCompletionOptions
  ): Promise<any> {
    const isStreaming = options.stream || false;
    
    const response = await fetch(`${client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
        ...client.headers
      },
      body: JSON.stringify({
        model,
        messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP ?? 0.9,
        stream: isStreaming
      })
    });

    if (!response.ok) {
      await this.handleDeepSeekError(response);
    }

    if (isStreaming) {
      return await this.handleStreamingResponse(response);
    }

    return await response.json();
  }

  /**
   * Processa resposta streaming do DeepSeek
   */
  private async handleStreamingResponse(response: Response): Promise<any> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response not available');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let model = '';
    let usage: any = {};

    try {
      let done = false;
      while (!done) {
        const { done: readerDone, value } = await reader.read();
        done = readerDone;
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.model) model = parsed.model;
              if (parsed.usage) usage = parsed.usage;
              
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
              }
            } catch (e) {
              // Ignorar linhas que não são JSON válido
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      choices: [{
        message: { content: fullContent },
        finish_reason: 'stop'
      }],
      model,
      usage
    };
  }

  /**
   * Trata erros específicos da API DeepSeek
   */
  private async handleDeepSeekError(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // Se não conseguir fazer parse do JSON, usar dados básicos
    }

    const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
    const retryAfter = response.headers.get('Retry-After');

    switch (response.status) {
      case 400:
        throw new Error(`Parâmetros inválidos: ${errorMessage}`);
      case 401:
        throw new Error('Chave API inválida ou expirada. Verifique suas credenciais.');
      case 403:
        throw new Error('Acesso negado. Verifique as permissões da sua chave API.');
      case 429: {
        const retryMessage = retryAfter ? `Tente novamente em ${retryAfter} segundos` : 'Tente novamente em alguns minutos';
        throw new Error(`Rate limit excedido: ${errorMessage}. ${retryMessage}`);
      }
      case 500:
        throw new Error(`Erro interno do servidor DeepSeek: ${errorMessage}`);
      case 502:
        throw new Error('Bad Gateway: Servidor DeepSeek temporariamente indisponível');
      case 503:
        throw new Error('Serviço DeepSeek temporariamente indisponível');
      case 504:
        throw new Error('Gateway timeout: Timeout na comunicação com DeepSeek');
      default:
        throw new Error(`DeepSeek API error ${response.status}: ${response.statusText}. ${errorMessage}`);
    }
  }

  /**
   * Processa callback de webhook
   * @param payload Payload do callback
   * @param provider Provedor que enviou o callback
   * @returns Resultado processado
   */
  async processWebhookCallback(
    payload: WebhookCallbackPayload,
    provider: AiProvider
  ): Promise<any> {
    // Validar assinatura do callback se configurado
    if (provider.webhookSecret) {
      // Implementar validação de assinatura específica do provedor
    }

    return {
      jobId: payload.jobId,
      status: payload.status,
      output: payload.output,
      error: payload.error,
      metadata: payload.metadata
    };
  }

  /**
   * Limpa cache de clientes
   */
  clearCache(): void {
    this.clients.clear();
  }

  /**
   * Remove cliente específico do cache
   * @param providerId ID do provedor
   */
  removeClient(providerId: string): void {
    for (const [key, client] of this.clients.entries()) {
      if (key.startsWith(providerId)) {
        this.clients.delete(key);
      }
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const aiClientFactory = new AiClientFactory();