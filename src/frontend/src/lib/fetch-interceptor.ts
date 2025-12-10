/**
 * Fetch Interceptor Global
 * 
 * Intercepta todas as requisições fetch para detectar tokens expirados
 * e redirecionar automaticamente para login
 */

// Flag para evitar múltiplos redirecionamentos simultâneos
let redirecting = false;

// Função para limpar autenticação e redirecionar
function handleAuthError() {
  // Evitar múltiplos redirecionamentos
  if (redirecting) {
    return;
  }

  // Verificar se já não estamos na página de login para evitar loop
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/auth/login') || currentPath.startsWith('/auth/register')) {
      return; // Já estamos na página de login, não redirecionar
    }
  }

  redirecting = true;

  // Limpar todos os dados de autenticação
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('fitos_tokens');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
  } catch (e) {
    // Ignorar erros ao limpar localStorage (pode estar bloqueado)
    console.warn('Erro ao limpar localStorage:', e);
  }

  // Redirecionar para login imediatamente
  if (typeof window !== 'undefined') {
    // Usar window.location.href para garantir redirecionamento imediato
    window.location.href = '/auth/login';
  }
}

// Salvar o fetch original
const originalFetch = globalThis.fetch;

// Substituir fetch global com interceptor
globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    // Verificar se a requisição é para a API (não para assets estáticos)
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isApiRequest = url.includes('/api/') || url.startsWith('/api/');

    // Se não for requisição de API, usar fetch original sem interceptação
    if (!isApiRequest) {
      return await originalFetch(input, init);
    }

    // Fazer a requisição original
    const response = await originalFetch(input, init);

    // Verificar se é erro de autenticação (401)
    if (response.status === 401) {
      // Não interceptar requisições de refresh ou login para evitar loops
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');
      
      // CRÍTICO: Não interceptar requisições de super-admin ou costs - deixar o frontend tratar o erro
      // Rotas de super-admin e costs podem ter 401 por falta de permissão ou token expirado,
      // mas o frontend deve tratar isso adequadamente sem logout automático
      const isSuperAdminEndpoint = 
        url.includes('/super-admin/') || 
        url.includes('/api/super-admin/') ||
        url.includes('/api/costs/');
      
      // Se for rota de super-admin ou costs, NUNCA fazer logout automático - apenas retornar a resposta
      if (isSuperAdminEndpoint) {
        console.warn('⚠️ 401 em rota protegida - deixando frontend tratar o erro');
        return response; // Retornar resposta sem interceptação
      }
      
      // Para outras rotas, verificar se é token expirado
      if (!isAuthEndpoint) {
        // Tentar ler o body para verificar se é TOKEN_EXPIRED
        let errorData: any = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const clonedResponse = response.clone();
            errorData = await clonedResponse.json();
          }
        } catch (e) {
          // Ignorar erro ao parsear JSON, mas continuar com verificação de status 401
        }

        // Verificar se o erro é explicitamente TOKEN_EXPIRED
        const isTokenExpired = 
          errorData?.error === 'TOKEN_EXPIRED' ||
          errorData?.message === 'TOKEN_EXPIRED' ||
          errorData?.error === 'INVALID_TOKEN' ||
          errorData?.error?.includes('TOKEN_EXPIRED') ||
          errorData?.message?.includes('Token de acesso expirado');

        // Fazer logout apenas se for explicitamente TOKEN_EXPIRED
        if (isTokenExpired) {
          console.warn('🔒 Token expirado detectado, redirecionando para login...');
          
          // Limpar autenticação e redirecionar (apenas uma vez)
          handleAuthError();
          
          // Rejeitar a promise com erro de autenticação
          return Promise.reject(new Error('TOKEN_EXPIRED'));
        }
      }
    }

    // Retornar resposta normal
    return response;
  } catch (error) {
    // Re-passar erros de rede
    throw error;
  }
};

// Exportar função para uso manual se necessário
export { handleAuthError };

