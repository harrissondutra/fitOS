'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plug, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Database,
  Trash2,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ProviderAuth {
  id: string;
  provider: string;
  authType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  databasesCount?: number;
}


const PROVIDERS = [
  { id: 'railway', name: 'Railway', docs: 'https://docs.railway.com' },
  { id: 'supabase', name: 'Supabase', docs: 'https://supabase.com/docs' },
  { id: 'neon', name: 'Neon', docs: 'https://neon.com/docs/' },
  { id: 'aiven', name: 'Aiven', docs: 'https://aiven.io/docs' },
  { id: 'render', name: 'Render', docs: 'https://render.com/docs' },
  { id: 'clever_cloud', name: 'Clever Cloud', docs: 'https://www.clever.cloud/developers/doc' },
  { id: 'redis_cloud', name: 'Redis Cloud', docs: 'https://redis.io/docs/latest/operate/rc' },
  { id: 'upstash', name: 'Upstash', docs: 'https://upstash.com/docs/introduction' },
];

export default function IntegracoesPage() {
  const router = useRouter();
  const [auths, setAuths] = useState<ProviderAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [configuring, setConfiguring] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Sincronizar custos automaticamente (silenciosamente)
  const syncCostsSilently = async () => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) return;

      const res = await fetch('/api/super-admin/provider-auth/costs/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Custos sincronizados automaticamente - sem feedback ao usuário
        console.debug('Custos sincronizados automaticamente');
      }
    } catch (error) {
      // Silenciar erro na sincronização automática
      console.debug('Erro na sincronização automática de custos:', error);
    }
  };

  const fetchAuths = async () => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        router.push('/login');
        return;
      }

      const res = await fetch('/api/super-admin/provider-auth', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar integrações');
      }

      const data = await res.json();
      setAuths(data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuths();
  }, []);

  // Sincronizar custos automaticamente quando há integrações conectadas
  useEffect(() => {
    if (auths.length > 0 && !loading) {
      // Sincronizar após um pequeno delay para não bloquear a UI
      const timer = setTimeout(() => {
        syncCostsSilently();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [auths.length, loading]);

  const configureAuth = async () => {
    if (!apiKey.trim()) {
      toast.error('API Key é obrigatória');
      return;
    }

    try {
      setConfiguring(true);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Adicionar timeout para evitar travamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      try {
        const res = await fetch(`/api/super-admin/provider-auth/${selectedProvider}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: apiKey,
            authType: 'api_key'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData: any = { error: 'Erro ao configurar autenticação' };
          try {
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              errorData = await res.json();
            } else {
              const text = await res.text();
              errorData = { error: text || `Erro ${res.status}: ${res.statusText}` };
            }
          } catch (parseError) {
            // Usar erro padrão se não conseguir parsear
            errorData = { error: `Erro ${res.status}: ${res.statusText}` };
          }
          throw new Error(errorData.error || errorData.message || 'Erro ao configurar autenticação');
        }

        const data = await res.json();
        const dbCount = data.data?.databasesSynced || 0;
        
        toast.success(
          dbCount > 0 
            ? `Integração configurada! ${dbCount} banco(s) de dados sincronizado(s).`
            : (data.message || 'Integração configurada com sucesso!'),
          { duration: 5000 }
        );
        setShowAuthDialog(false);
        setApiKey('');
        setSelectedProvider('');
        await fetchAuths();
        
        // Notificar o dashboard para atualizar (via evento customizado)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('database-sync-completed'));
        }
        
        // Custos são sincronizados automaticamente pelo backend
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('A requisição demorou muito. O token pode ter sido salvo. Verifique na lista de integrações.');
        }
        throw fetchError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao configurar integração';
      toast.error(errorMessage, {
        duration: 5000
      });
      
      // Se o erro não for crítico, ainda tentar atualizar a lista
      // Pode ter sido salvo mesmo com erro na validação
      if (!errorMessage.includes('Invalid') && !errorMessage.includes('credenciais')) {
        setTimeout(() => {
          fetchAuths();
        }, 1000);
      }
    } finally {
      setConfiguring(false);
    }
  };

  const deleteAuth = async (provider: string) => {
    if (!confirm(`Tem certeza que deseja remover a integração com ${provider}?`)) {
      return;
    }

    try {
      setDeletingProvider(provider);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const res = await fetch(`/api/super-admin/provider-auth/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Erro ao remover integração');
      }

      toast.success('Integração removida com sucesso!');
      await fetchAuths();
      
      // Sincronizar custos após remover integração para atualizar sistema de custos
      await syncCostsSilently();
    } catch (error) {
      toast.error('Erro ao remover integração');
    } finally {
      setDeletingProvider(null);
    }
  };

  const openAuthDialog = (provider: string) => {
    setSelectedProvider(provider);
    setShowAuthDialog(true);
  };

  const syncProviderDatabases = async (provider: string) => {
    try {
      setSyncingProvider(provider);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Sincronizar bancos do provedor
      const syncRes = await fetch(`/api/super-admin/provider-auth/${provider}/databases/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!syncRes.ok) {
        const errorData = await syncRes.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao sincronizar bancos de dados');
      }

      const syncData = await syncRes.json();
      
      if (syncData.data.synced === 0) {
        toast.info(syncData.message || 'Nenhum banco encontrado para sincronizar');
      } else {
        toast.success(syncData.message || `${syncData.data.synced} banco(s) sincronizado(s) com sucesso`);
      }
      
      // Disparar evento para atualizar dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('database-sync-completed'));
      }
      
      await fetchAuths();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar bancos de dados');
    } finally {
      setSyncingProvider(null);
    }
  };

  const getProviderInfo = (providerId: string) => {
    return PROVIDERS.find(p => p.id === providerId);
  };

  const getProviderStatus = (providerId: string) => {
    const auth = auths.find(a => a.provider === providerId);
    return auth?.isActive ? 'connected' : 'disconnected';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações de Bancos de Dados</h1>
          <p className="text-muted-foreground mt-1">
            Conecte suas contas de provedores externos para gerenciar bancos de dados e monitorar custos
          </p>
        </div>
        <Button 
          onClick={() => router.push('/super-admin/management/costs/database')} 
          variant="default"
        >
          Ver Custos
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map((provider) => {
              const status = getProviderStatus(provider.id);
              const auth = auths.find(a => a.provider === provider.id);

              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {provider.name}
                          {status === 'connected' ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Conectado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Desconectado
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {status === 'connected' && auth && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bancos conectados:</span>
                          <Badge variant="secondary" className="font-semibold">
                            {auth.databasesCount || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Conectado em:</span>
                          <span>{new Date(auth.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <a
                        href={provider.docs}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Documentação
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex gap-2">
                      {status === 'connected' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/super-admin/database/dashboard?provider=${provider.id}`)}
                            className="flex-1"
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Ver Bancos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncProviderDatabases(provider.id)}
                            disabled={syncingProvider === provider.id}
                            title="Sincronizar bancos de dados"
                          >
                            {syncingProvider === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAuth(provider.id)}
                            disabled={deletingProvider === provider.id}
                          >
                            {deletingProvider === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => openAuthDialog(provider.id)}
                          className="flex-1"
                          size="sm"
                        >
                          <Plug className="h-4 w-4 mr-2" />
                          Conectar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
      </div>

      {/* Diálogo de autenticação */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Conectar com {PROVIDERS.find(p => p.id === selectedProvider)?.name}
            </DialogTitle>
            <DialogDescription>
              Configure sua API Key para conectar com o provedor. As credenciais são criptografadas e armazenadas com segurança.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Token *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Cole sua API key aqui"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Para obter sua API key, consulte a{' '}
                <a
                  href={PROVIDERS.find(p => p.id === selectedProvider)?.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  documentação oficial
                </a>
                .
              </p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Sua API key será validada antes de ser salva. Ela é criptografada e usada apenas para listar bancos de dados e monitorar custos.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAuthDialog(false);
                setApiKey('');
                setSelectedProvider('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={configureAuth}
              disabled={configuring || !apiKey.trim()}
            >
              {configuring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

