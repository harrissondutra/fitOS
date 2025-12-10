/**
 * Script de teste para bulk update de serviços de conversação
 * 
 * Testa a funcionalidade de alterar múltiplos serviços para diferentes providers
 * Monitora erros e logs de cada operação
 */

import { AiServiceType } from '@/shared/types/ai.types';

export interface TestResult {
  success: boolean;
  providerName: string;
  servicesUpdated: number;
  errors: string[];
  duration: number;
  details: {
    serviceIds: string[];
    serviceNames: string[];
    providerId: string;
    model?: string;
  };
}

export interface ConversationService {
  id: string;
  serviceName: string;
  serviceType: AiServiceType;
  providerId: string;
  model: string;
}

/**
 * Tipos de serviços de conversação
 */
const CONVERSATION_SERVICE_TYPES = [
  AiServiceType.CHAT,
  AiServiceType.MULTIAGENT_CHAT,
  AiServiceType.VOICE_WORKOUT_COACH,
  AiServiceType.VIRTUAL_WORKOUT_BUDDY,
  AiServiceType.FORM_FILLING_ASSISTANT,
];

/**
 * Busca todos os serviços de conversação
 */
export async function fetchConversationServices(): Promise<ConversationService[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs?pageSize=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const allServices = data.data || [];

    // Filtrar apenas serviços de conversação
    const conversationServices = allServices.filter((service: any) =>
      CONVERSATION_SERVICE_TYPES.includes(service.serviceType)
    );
    
    // Log para debug
    console.log(`📊 Total de serviços retornados: ${allServices.length}`);
    console.log(`📊 Serviços de conversação filtrados: ${conversationServices.length}`);
    if (conversationServices.length > 0) {
      console.log(`📊 IDs dos serviços:`, conversationServices.map((s: any) => s.id));
    }
    
    return conversationServices;
  } catch (error) {
    console.error('❌ Erro ao buscar serviços de conversação:', error);
    throw error;
  }
}

/**
 * Busca providers disponíveis
 */
export async function fetchProviders(): Promise<Array<{ id: string; name: string; provider: string; displayName: string }>> {
  try {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/super-admin/ai/providers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar providers:', error);
    throw error;
  }
}

/**
 * Encontra provider por tipo (GEMINI ou GROQ)
 */
export function findProviderByType(
  providers: Array<{ id: string; provider: string; displayName: string }>,
  providerType: 'GEMINI' | 'GROQ'
): { id: string; displayName: string; model?: string } | null {
  const provider = providers.find(p => p.provider === providerType);
  if (!provider) return null;

  // Modelos padrão por provider
  const defaultModels: Record<string, string> = {
    GEMINI: 'gemini-pro',
    GROQ: 'llama3-70b-8192'
  };

  return {
    id: provider.id,
    displayName: provider.displayName,
    model: defaultModels[providerType]
  };
}

/**
 * Aplica provider a múltiplos serviços
 */
export async function applyProviderToServices(
  serviceIds: string[],
  providerId: string,
  model?: string
): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const partial: any = { providerId };
    if (model) partial.model = model;

    console.log(`🔄 Aplicando provider ${providerId}${model ? ` com modelo ${model}` : ''} a ${serviceIds.length} serviços...`);

    const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs/bulk-update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: serviceIds, data: partial })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        errorDetails = errorJson;
        
        // Log detalhes do erro para debug
        console.error('❌ Erro detalhado do backend:', {
          status: response.status,
          error: errorMessage,
          code: errorJson.code,
          missingIds: errorJson.missingIds,
          foundIds: errorJson.foundIds,
          requestedCount: errorJson.requestedCount,
          foundCount: errorJson.foundCount,
          serviceIds
        });
      } catch {
        if (errorText) errorMessage = errorText;
      }

      errors.push(errorMessage);
      
      return {
        success: false,
        providerName: providerId,
        servicesUpdated: 0,
        errors,
        duration,
        details: {
          serviceIds,
          serviceNames: [],
          providerId,
          model,
          errorDetails
        }
      };
    }

    const result = await response.json();
    const updatedServices = result.data || [];

    console.log(`✅ ${updatedServices.length} serviços atualizados com sucesso em ${duration}ms`);

    return {
      success: true,
      providerName: providerId,
      servicesUpdated: updatedServices.length,
      errors,
      duration,
      details: {
        serviceIds,
        serviceNames: updatedServices.map((s: any) => s.serviceName),
        providerId,
        model
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(errorMessage);

    console.error('❌ Erro ao aplicar provider:', error);

    return {
      success: false,
      providerName: providerId,
      servicesUpdated: 0,
      errors,
      duration,
      details: {
        serviceIds,
        serviceNames: [],
        providerId,
        model
      }
    };
  }
}

/**
 * Teste completo: alterar todos os serviços de conversação para Gemini e depois Groq
 */
export async function testBulkUpdateConversationServices(): Promise<{
  geminiResult: TestResult;
  groqResult: TestResult;
  conversationServices: ConversationService[];
}> {
  console.log('🧪 Iniciando teste de bulk update de serviços de conversação...\n');

  try {
    // 1. Buscar serviços de conversação
    console.log('📋 Buscando serviços de conversação...');
    const conversationServices = await fetchConversationServices();
    console.log(`✅ Encontrados ${conversationServices.length} serviços de conversação:`);
    conversationServices.forEach(s => {
      console.log(`   - ${s.serviceName} (${s.serviceType}) - ID: ${s.id} - Provider atual: ${s.providerId}`);
    });
    console.log('');

    if (conversationServices.length === 0) {
      throw new Error('Nenhum serviço de conversação encontrado');
    }

    // 2. Buscar providers
    console.log('🔍 Buscando providers disponíveis...');
    const providers = await fetchProviders();
    console.log(`✅ Encontrados ${providers.length} providers`);
    console.log('');

    // 3. Encontrar Gemini e Groq
    const geminiProvider = findProviderByType(providers, 'GEMINI');
    const groqProvider = findProviderByType(providers, 'GROQ');

    if (!geminiProvider) {
      throw new Error('Provider Gemini não encontrado');
    }
    if (!groqProvider) {
      throw new Error('Provider Groq não encontrado');
    }

    console.log(`✅ Provider Gemini encontrado: ${geminiProvider.displayName} (ID: ${geminiProvider.id})`);
    console.log(`✅ Provider Groq encontrado: ${groqProvider.displayName} (ID: ${groqProvider.id})`);
    console.log('');

    const serviceIds = conversationServices.map(s => s.id);
    console.log(`📋 IDs dos serviços a serem atualizados (${serviceIds.length}):`, serviceIds);
    console.log('');

    // 4. Aplicar Gemini
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟢 TESTE 1: Aplicando Gemini a todos os serviços de conversação');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const geminiResult = await applyProviderToServices(
      serviceIds,
      geminiProvider.id,
      geminiProvider.model
    );

    console.log('');
    console.log('📊 Resultado Gemini:');
    console.log(`   ✅ Sucesso: ${geminiResult.success}`);
    console.log(`   📦 Serviços atualizados: ${geminiResult.servicesUpdated}/${serviceIds.length}`);
    console.log(`   ⏱️  Duração: ${geminiResult.duration}ms`);
    if (geminiResult.errors.length > 0) {
      console.log(`   ❌ Erros: ${geminiResult.errors.join(', ')}`);
    }
    console.log('');

    // Aguardar 2 segundos antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Aplicar Groq
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟣 TESTE 2: Aplicando Groq a todos os serviços de conversação');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const groqResult = await applyProviderToServices(
      serviceIds,
      groqProvider.id,
      groqProvider.model
    );

    console.log('');
    console.log('📊 Resultado Groq:');
    console.log(`   ✅ Sucesso: ${groqResult.success}`);
    console.log(`   📦 Serviços atualizados: ${groqResult.servicesUpdated}/${serviceIds.length}`);
    console.log(`   ⏱️  Duração: ${groqResult.duration}ms`);
    if (groqResult.errors.length > 0) {
      console.log(`   ❌ Erros: ${groqResult.errors.join(', ')}`);
    }
    console.log('');

    // 6. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMO DO TESTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total de serviços testados: ${conversationServices.length}`);
    console.log(`Gemini: ${geminiResult.success ? '✅ Sucesso' : '❌ Falhou'} - ${geminiResult.servicesUpdated} atualizados`);
    console.log(`Groq: ${groqResult.success ? '✅ Sucesso' : '❌ Falhou'} - ${groqResult.servicesUpdated} atualizados`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      geminiResult,
      groqResult,
      conversationServices
    };
  } catch (error) {
    console.error('❌ Erro fatal no teste:', error);
    throw error;
  }
}

/**
 * Função para executar no console do browser
 * 
 * Uso:
 * 1. Abra o DevTools (F12)
 * 2. Vá para a aba Console
 * 3. Importe e execute: testBulkUpdateConversationServices()
 */
export { testBulkUpdateConversationServices as default };

