'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, AlertCircle, Key, RefreshCw, Copy, CheckCircle2, ExternalLink, Database, Plug, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Server {
  id: string;
  name: string;
  host: string;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

interface ExternalDatabase {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  connectionString?: string;
  databaseType: 'postgresql' | 'mysql' | 'redis';
  status?: 'active' | 'inactive';
  projectName?: string;
}

interface CreateDatabaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDatabaseForm({ open, onOpenChange, onSuccess }: CreateDatabaseFormProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState<
    'vps_ssh' | 'railway' | 'supabase' | 'neon' | 'aiven' | 'render' | 'clever' | 'aws' | 'gcp' | 'redis_cloud' | 'upstash' | 'other'
  >('vps_ssh');
  const [formData, setFormData] = useState({
    serverId: '',
    tenantId: '',
    databaseType: 'postgresql' as 'postgresql' | 'mysql' | 'redis',
    databaseName: '',
    containerName: '',
    port: '',
    username: '',
    password: '',
    schemaName: '',
    // Campos para provedores externos
    externalHost: '',
    externalPort: '',
    externalUsername: '',
    externalPassword: '',
    connectionString: '' // Para alguns provedores que fornecem connection string completa
  });

  const [selectedTypes, setSelectedTypes] = useState({
    postgresql: true,
    mysql: false,
    redis: false
  });

  const [images, setImages] = useState({
    postgresql: '',
    mysql: '',
    redis: ''
  });
  
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string; portInUse?: number }>({
    open: false,
    title: '',
    message: ''
  });
  const [copiedConnections, setCopiedConnections] = useState<Record<string, boolean>>({});
  
  // Estados para integração com provedores
  const [providerAuthConfigured, setProviderAuthConfigured] = useState(false);
  const [loadingProviderDatabases, setLoadingProviderDatabases] = useState(false);
  const [providerDatabases, setProviderDatabases] = useState<ExternalDatabase[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [configuringAuth, setConfiguringAuth] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [hasVpsServers, setHasVpsServers] = useState(false);

  const selectedServer = servers.find(s => s.id === formData.serverId);

  useEffect(() => {
    if (open) {
      fetchServers();
      fetchTenants();
      fetchConnectedProviders();
      // Resetar provisão para vps_ssh quando abrir modal
      setProvisionTarget('vps_ssh');
    }
  }, [open]);

  // Verificar autenticação quando provisionTarget mudar
  useEffect(() => {
    if (open && provisionTarget !== 'vps_ssh') {
      checkProviderAuth();
    }
  }, [open, provisionTarget]);

  // Ajustar provisionTarget inicial baseado em disponibilidade
  useEffect(() => {
    if (provisionTarget === 'vps_ssh' && !hasVpsServers) {
      // Se VPS não está disponível, selecionar primeiro provedor conectado
      if (connectedProviders.length > 0) {
        setProvisionTarget(connectedProviders[0] as any);
      } else if (connectedProviders.length === 0 && !hasVpsServers) {
        setProvisionTarget('other');
      }
    }
  }, [hasVpsServers, connectedProviders]);

  // Auto-preencher schema com slug da tenant quando PostgreSQL for selecionado
  useEffect(() => {
    if (formData.tenantId && formData.databaseType === 'postgresql' && provisionTarget === 'vps_ssh') {
      const tenant = tenants.find(t => t.id === formData.tenantId);
      if (tenant && !formData.schemaName) {
        const slug = slugify(tenant.name);
        setFormData(prev => ({ ...prev, schemaName: slug }));
      }
    }
  }, [formData.tenantId, formData.databaseType, provisionTarget, tenants]);

  // Verificar se a autenticação do provedor está configurada
  const checkProviderAuth = async () => {
    try {
      // Não verificar auth para 'other' ou 'vps_ssh' pois não são provedores externos
      if (provisionTarget === 'other' || provisionTarget === 'vps_ssh') {
        setProviderAuthConfigured(false);
        return;
      }

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) return;

      const res = await fetch(`/api/super-admin/provider-auth/${provisionTarget}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const isConfigured = res.ok;
      setProviderAuthConfigured(isConfigured);
      
      // Se já estiver autenticado, listar bancos automaticamente
      if (isConfigured) {
        await fetchProviderDatabases(true); // Skip auth check pois já verificamos acima
      }
    } catch (error) {
      setProviderAuthConfigured(false);
    }
  };

  // Listar bancos de dados do provedor
  const fetchProviderDatabases = async (skipAuthCheck = false) => {
    if (!skipAuthCheck && !providerAuthConfigured) {
      setShowAuthDialog(true);
      return;
    }

    try {
      setLoadingProviderDatabases(true);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const res = await fetch(`/api/super-admin/provider-auth/${provisionTarget}/databases`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          setShowAuthDialog(true);
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao listar bancos de dados');
      }

      const data = await res.json();
      setProviderDatabases(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar bancos de dados');
    } finally {
      setLoadingProviderDatabases(false);
    }
  };

  // Configurar autenticação do provedor
  const configureProviderAuth = async () => {
    if (!apiKey.trim()) {
      toast.error('API Key é obrigatória');
      return;
    }

    try {
      setConfiguringAuth(true);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const res = await fetch(`/api/super-admin/provider-auth/${provisionTarget}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: apiKey,
          authType: 'api_key'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro ao configurar autenticação' }));
        throw new Error(errorData.error || 'Erro ao configurar autenticação');
      }

      toast.success('Autenticação configurada com sucesso!');
      setShowAuthDialog(false);
      setApiKey('');
      setProviderAuthConfigured(true);
      await fetchProviderDatabases(true); // Skip auth check pois acabamos de configurar
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao configurar autenticação');
    } finally {
      setConfiguringAuth(false);
    }
  };

  // Selecionar banco da lista
  const selectDatabase = (db: ExternalDatabase) => {
    setFormData({
      ...formData,
      externalHost: db.host,
      externalPort: db.port.toString(),
      externalUsername: db.username,
      externalPassword: db.password || '',
      connectionString: db.connectionString || '',
      databaseName: db.database,
      databaseType: db.databaseType
    });
    toast.success('Banco de dados selecionado!');
  };

  // Ativar branch do Neon
  const activateNeonBranch = async (projectId: string, branchId: string) => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const res = await fetch(`/api/super-admin/provider-auth/neon/${projectId}/${branchId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao ativar branch');
      }

      const data = await res.json();
      toast.success(data.message || 'Branch ativada com sucesso!');
      
      // Recarregar lista de bancos após ativação
      setTimeout(() => {
        fetchProviderDatabases(true);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ativar branch');
    }
  };

  const fetchServers = async () => {
    try {
      setLoadingServers(true);
      
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/admin/database/servers', {
        headers,
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Failed to fetch servers';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível'
            : `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch servers');
      }

      const serverList = data.data?.items || data.data || [];
      setServers(serverList);
      setHasVpsServers(serverList.length > 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar servidores';
      toast.error(errorMessage);
    } finally {
      setLoadingServers(false);
    }
  };

  const fetchConnectedProviders = async () => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) return;

      const res = await fetch('/api/super-admin/provider-auth', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      const connected = (data.data || [])
        .filter((auth: any) => auth.isActive)
        .map((auth: any) => auth.provider);
      setConnectedProviders(connected);
    } catch (error) {
      // Silenciar erro
    }
  };

  const fetchTenants = async () => {
    try {
      setLoadingTenants(true);
      
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/super-admin/database/tenants', {
        headers,
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Failed to fetch tenants';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível'
            : `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }

      setTenants(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tenants';
      toast.error(errorMessage);
    } finally {
      setLoadingTenants(false);
    }
  };

  const generatePassword = () => {
    const length = 24;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const slugify = (s: string) => s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 32);

  const generateContainerName = () => {
    if (formData.tenantId) {
      const tenant = tenants.find(t => t.id === formData.tenantId);
      const tenantSlug = slugify(tenant?.name || 'tenant');
      setFormData({ ...formData, containerName: `db-${tenantSlug}` });
    }
  };

  useEffect(() => {
    if (formData.tenantId && !formData.containerName) {
      generateContainerName();
    }
    // Preencher nome do banco e schema com nome da tenant
    if (formData.tenantId) {
      const tenant = tenants.find(t => t.id === formData.tenantId);
      const tenantSlug = slugify(tenant?.name || '');
      if (tenantSlug) {
        setFormData(prev => ({
          ...prev,
          databaseName: prev.databaseName || tenantSlug,
          schemaName: prev.schemaName || tenantSlug
        }));
      }
    }
  }, [formData.tenantId]);

  const getDefaultPort = (type: string) => {
    switch (type) {
      case 'postgresql': return '5432';
      case 'mysql': return '3306';
      case 'redis': return '6379';
      default: return '5432';
    }
  };

  const getDefaultUsername = (type: string) => {
    switch (type) {
      case 'postgresql': return 'postgres';
      case 'mysql': return 'root';
      case 'redis': return '';
      default: return 'postgres';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (provisionTarget !== 'vps_ssh') {
      // Validação para provedores externos
      if (!formData.tenantId || !formData.databaseName) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!formData.connectionString && (!formData.externalHost || !formData.externalPort || !formData.externalUsername || !formData.externalPassword)) {
        toast.error('Preencha as informações de conexão ou forneça uma connection string');
        return;
      }

      // Criar conexão externa
      try {
        setLoading(true);
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const payload: any = {
          tenantId: formData.tenantId,
          databaseType: formData.databaseType,
          databaseName: formData.databaseName,
          provisionTarget,
          externalHost: formData.externalHost,
          externalPort: parseInt(formData.externalPort || getDefaultPort(formData.databaseType)),
          externalUsername: formData.externalUsername,
          externalPassword: formData.externalPassword,
          connectionString: formData.connectionString || undefined
        };

        if (formData.schemaName && formData.databaseType === 'postgresql') {
          payload.schemaName = formData.schemaName;
        }

        const res = await fetch('/api/super-admin/database', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = 'Falha ao registrar conexão externa';
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = res.status === 503 || res.status === 502
              ? 'Servidor backend não está disponível'
              : `Erro ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) {
          throw new Error('Resposta inválida do servidor');
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Falha ao registrar conexão externa');
        }

        toast.success('Conexão externa registrada com sucesso!');
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar conexão externa';
        setErrorDialog({
          open: true,
          title: 'Erro ao registrar conexão externa',
          message: errorMessage
        });
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!formData.serverId || !formData.tenantId || !formData.databaseName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const typesToCreate = (['postgresql','mysql','redis'] as const).filter(t => (selectedTypes as any)[t]);
      if (typesToCreate.length === 0) {
        toast.error('Selecione pelo menos um tipo de banco');
        setLoading(false);
        return;
      }

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      for (const type of typesToCreate) {
        const tenant = tenants.find(t => t.id === formData.tenantId);
        const tenantSlug = slugify(tenant?.name || formData.databaseName);
        const container = formData.containerName
          ? `${formData.containerName}-${type}`
          : `db-${type}-${tenantSlug}`;
        const payload: any = {
          serverId: formData.serverId,
          tenantId: formData.tenantId,
          databaseType: type,
          databaseName: tenantSlug,
          containerName: container,
          port: parseInt(formData.port || getDefaultPort(type)),
          username: formData.username || getDefaultUsername(type),
          password: formData.password,
          image: (images as any)[type] || ''
        };
        if (type === 'postgresql') {
          payload.schemaName = formData.schemaName || tenantSlug;
        }

        const res = await fetch('/api/super-admin/database', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text();
          let errorMessage = `Falha ao criar ${type}`;
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
            
            // Tratar erro de porta ocupada
            if (res.status === 409 && errorMessage.includes('Porta')) {
              const portMatch = errorMessage.match(/Porta (\d+)/);
              const port = portMatch ? parseInt(portMatch[1]) : parseInt(formData.port || getDefaultPort(type));
              setErrorDialog({
                open: true,
                title: `Porta ${port} já está em uso`,
                message: `A porta ${port} já está sendo utilizada no servidor ${selectedServer?.name || 'selecionado'} para o banco ${type.toUpperCase()}. Por favor, escolha outra porta antes de continuar.`,
                portInUse: port
              });
              setLoading(false);
              return;
            }
          } catch {
            errorMessage = res.status === 503 || res.status === 502
              ? 'Servidor backend não está disponível'
              : `Erro ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMessage);
        }
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) throw new Error('Resposta inválida do servidor');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || `Falha ao criar ${type}`);
      }

      toast.success('Banco(s) criado(s) com sucesso!');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar banco de dados';
      
      // Verificar se já não foi tratado pelo erro de porta
      if (!errorMessage.includes('Porta')) {
        setErrorDialog({
          open: true,
          title: 'Erro ao criar banco de dados',
          message: errorMessage
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedConnections({ ...copiedConnections, [key]: true });
      toast.success('String de conexão copiada!');
      setTimeout(() => {
        setCopiedConnections(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Falha ao copiar para a área de transferência');
    }
  };

  const resetForm = () => {
    setFormData({
      serverId: '',
      tenantId: '',
      databaseType: 'postgresql',
      databaseName: '',
      containerName: '',
      port: '',
      username: '',
      password: '',
      schemaName: '',
      externalHost: '',
      externalPort: '',
      externalUsername: '',
      externalPassword: '',
      connectionString: ''
    });
    setSelectedTypes({ postgresql: true, mysql: false, redis: false });
    setImages({ postgresql: '', mysql: '', redis: '' });
    setProvisionTarget('vps_ssh');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Banco de Dados Docker</DialogTitle>
          <DialogDescription>
            Configure um novo banco de dados Docker em um servidor conectado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Destino</Label>
            <Select value={provisionTarget} onValueChange={(v: any) => setProvisionTarget(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                {hasVpsServers && (
                  <SelectItem value="vps_ssh">VPS conectado (SSH) - Docker</SelectItem>
                )}
                {connectedProviders.includes('railway') && (
                  <SelectItem value="railway">Railway (Postgres/MySQL/Redis)</SelectItem>
                )}
                {connectedProviders.includes('supabase') && (
                  <SelectItem value="supabase">Supabase (Postgres)</SelectItem>
                )}
                {connectedProviders.includes('neon') && (
                  <SelectItem value="neon">Neon (Postgres)</SelectItem>
                )}
                {connectedProviders.includes('aiven') && (
                  <SelectItem value="aiven">Aiven (Postgres/MySQL/Redis)</SelectItem>
                )}
                {connectedProviders.includes('render') && (
                  <SelectItem value="render">Render (Postgres/Redis)</SelectItem>
                )}
                {connectedProviders.includes('clever') && (
                  <SelectItem value="clever">Clever Cloud (Postgres/MySQL/Redis)</SelectItem>
                )}
                {connectedProviders.includes('redis_cloud') && (
                  <SelectItem value="redis_cloud">Redis Cloud (Redis)</SelectItem>
                )}
                {connectedProviders.includes('upstash') && (
                  <SelectItem value="upstash">Upstash (Redis/Vector/QStash)</SelectItem>
                )}
                {connectedProviders.includes('aws') && (
                  <SelectItem value="aws">AWS (RDS/ElastiCache)</SelectItem>
                )}
                {connectedProviders.includes('gcp') && (
                  <SelectItem value="gcp">Google Cloud (Cloud SQL/Memorystore)</SelectItem>
                )}
                {!hasVpsServers && connectedProviders.length === 0 && (
                  <SelectItem value="other">Outro provedor</SelectItem>
                )}
              </SelectContent>
            </Select>
            {provisionTarget !== 'vps_ssh' && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="text-xs font-medium">
                      Para provedores externos, você pode conectar sua conta para listar bancos de dados automaticamente ou preencher manualmente.
                    </p>
                    <p className="text-xs">
                      Documentação oficial:
                      {' '}<a className="underline" href="https://docs.railway.com" target="_blank" rel="noreferrer">Railway</a>,
                      {' '}<a className="underline" href="https://supabase.com/docs" target="_blank" rel="noreferrer">Supabase</a>,
                      {' '}<a className="underline" href="https://neon.com/docs/" target="_blank" rel="noreferrer">Neon</a>,
                      {' '}<a className="underline" href="https://aiven.io/docs" target="_blank" rel="noreferrer">Aiven</a>,
                      {' '}<a className="underline" href="https://render.com/docs" target="_blank" rel="noreferrer">Render</a>,
                      {' '}<a className="underline" href="https://www.clever.cloud/developers/doc" target="_blank" rel="noreferrer">Clever Cloud</a>,
                      {' '}<a className="underline" href="https://redis.io/docs/latest/operate/rc" target="_blank" rel="noreferrer">Redis Cloud</a>,
                      {' '}<a className="underline" href="https://upstash.com/docs/introduction" target="_blank" rel="noreferrer">Upstash</a>.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Botão para conectar e listar bancos */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchProviderDatabases}
                    disabled={loadingProviderDatabases}
                    className="flex items-center gap-2"
                  >
                    {loadingProviderDatabases ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : providerAuthConfigured ? (
                      <>
                        <Database className="h-4 w-4" />
                        Listar Bancos de Dados
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4" />
                        Conectar e Listar Bancos
                      </>
                    )}
                  </Button>
                  {providerAuthConfigured && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Conectado
                    </span>
                  )}
                </div>

                {/* Lista de bancos disponíveis */}
                {providerDatabases.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Bancos Disponíveis ({providerDatabases.length})</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {providerDatabases.map((db) => (
                        <div
                          key={db.id}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => selectDatabase(db)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{db.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {db.host}:{db.port} • {db.database} • {db.databaseType}
                              </div>
                              {db.status && (
                                <div className="mt-2 space-y-1">
                                  <span className={`text-xs inline-block px-2 py-0.5 rounded ${
                                    db.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {db.status === 'active' ? 'Ativo' : 'Inativo'}
                                  </span>
                                  {db.status === 'inactive' && provisionTarget === 'neon' && (db as any).region && (
                                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="font-medium">Branch suspensa</div>
                                          <div className="text-amber-700 dark:text-amber-300 text-xs mb-2">
                                            Esta branch precisa ser ativada.
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              activateNeonBranch((db as any).region, db.id);
                                            }}
                                            className="text-xs h-7"
                                          >
                                            <Power className="h-3 w-3 mr-1" />
                                            Ativar Agora
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectDatabase(db);
                              }}
                            >
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campos para conexão externa - apenas se não tiver selecionado banco da lista */}
                {provisionTarget !== 'vps_ssh' && !formData.connectionString && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Informações de Conexão Externa *</Label>
                    <p className="text-xs text-muted-foreground">
                      Preencha as informações de conexão do banco criado no provedor externo
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="externalHost">Host/Endpoint *</Label>
                      <Input
                        id="externalHost"
                        placeholder="Ex: db.example.com ou endpoint.railway.app"
                        value={formData.externalHost}
                        onChange={(e) => setFormData({ ...formData, externalHost: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="externalPort">Porta *</Label>
                      <Input
                        id="externalPort"
                        type="number"
                        placeholder={getDefaultPort(formData.databaseType)}
                        value={formData.externalPort}
                        onChange={(e) => setFormData({ ...formData, externalPort: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="externalUsername">Usuário *</Label>
                      <Input
                        id="externalUsername"
                        placeholder="Usuário do banco"
                        value={formData.externalUsername}
                        onChange={(e) => setFormData({ ...formData, externalUsername: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="externalPassword">Senha *</Label>
                      <Input
                        id="externalPassword"
                        type="password"
                        placeholder="Senha do banco"
                        value={formData.externalPassword}
                        onChange={(e) => setFormData({ ...formData, externalPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connectionString">Connection String (Opcional)</Label>
                    <Input
                      id="connectionString"
                      type="password"
                      placeholder="postgresql://user:pass@host:port/db ou redis://:pass@host:port"
                      value={formData.connectionString}
                      onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Alguns provedores fornecem uma connection string completa. Se fornecer, os campos acima serão ignorados.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="databaseNameExt">Nome do Banco de Dados *</Label>
                    <Input
                      id="databaseNameExt"
                      placeholder="Ex: nome-da-tenant"
                      value={formData.databaseName}
                      onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="databaseTypeExt">Tipo de Banco *</Label>
                    <Select
                      value={formData.databaseType}
                      onValueChange={(value: 'postgresql' | 'mysql' | 'redis') => setFormData({ ...formData, databaseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="redis">Redis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverId">Servidor *</Label>
              <Select
                value={formData.serverId}
                onValueChange={(value) => setFormData({ ...formData, serverId: value })}
                disabled={loadingServers || provisionTarget !== 'vps_ssh'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={provisionTarget !== 'vps_ssh' ? 'Indisponível para provedores externos' : (loadingServers ? "Carregando..." : "Selecione o servidor")} />
                </SelectTrigger>
                <SelectContent>
                  {servers.length === 0 ? (
                    <SelectItem value="no-servers" disabled>Nenhum servidor disponível</SelectItem>
                  ) : (
                    servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name} ({server.host})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {provisionTarget === 'vps_ssh' && servers.length === 0 && !loadingServers && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum servidor SSH configurado. Configure servidores em /super-admin/servers primeiro.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                disabled={loadingTenants}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTenants ? "Carregando..." : "Selecione o tenant"} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.length === 0 ? (
                    <SelectItem value="no-tenants" disabled>Nenhum tenant Enterprise/Custom disponível</SelectItem>
                  ) : (
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.plan})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {tenants.length === 0 && !loadingTenants && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum tenant com plano Enterprise ou Custom encontrado.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {provisionTarget === 'vps_ssh' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipos de Banco *</Label>
                  <div className="flex gap-4">
                    {(['postgresql','mysql','redis'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <Checkbox
                          checked={(selectedTypes as any)[t]}
                          onCheckedChange={(checked) => setSelectedTypes(prev => ({ ...prev, [t]: !!checked }))}
                        />
                        <span className="capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="databaseName">Nome do Banco *</Label>
                  <Input
                    id="databaseName"
                    placeholder={'Ex: nome-da-tenant'}
                    value={formData.databaseName}
                    onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="containerName">Nome do Container</Label>
                  <Input
                    id="containerName"
                    placeholder="Auto-gerado se vazio"
                    value={formData.containerName}
                    onChange={(e) => setFormData({ ...formData, containerName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder={getDefaultPort(formData.databaseType)}
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
              </div>

              {selectedTypes.postgresql && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário</Label>
                      <Input
                        id="username"
                        placeholder={getDefaultUsername('postgresql')}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Auto-gerada se vazia"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generatePassword}
                          title="Gerar senha aleatória"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imagePg">Imagem Docker (PostgreSQL)</Label>
                    <Input
                      id="imagePg"
                      placeholder="postgres:latest"
                      value={images.postgresql}
                      onChange={(e) => setImages(prev => ({ ...prev, postgresql: e.target.value }))}
                    />
                  </div>

                  {selectedTypes.postgresql && (
                    <div className="space-y-2">
                      <Label htmlFor="schemaName">Schema PostgreSQL (Opcional)</Label>
                      <Input
                        id="schemaName"
                        placeholder="Ex: tenant_schema"
                        value={formData.schemaName}
                        onChange={(e) => setFormData({ ...formData, schemaName: e.target.value })}
                      />
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Se fornecido, um schema específico será criado para este tenant após a criação do banco.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </>
              )}

              {selectedTypes.mysql && (
                <div className="space-y-2">
                  <Label htmlFor="imageMy">Imagem Docker (MySQL)</Label>
                  <Input
                    id="imageMy"
                    placeholder="mysql:latest"
                    value={images.mysql}
                    onChange={(e) => setImages(prev => ({ ...prev, mysql: e.target.value }))}
                  />
                </div>
              )}

              {selectedTypes.redis && (
                <div className="space-y-2">
                  <Label htmlFor="redisPassword">Senha Redis</Label>
                  <div className="flex gap-2">
                    <Input
                      id="redisPassword"
                      type="password"
                      placeholder="Auto-gerada se vazia"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generatePassword}
                      title="Gerar senha aleatória"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="imageRd">Imagem Docker (Redis)</Label>
                    <Input
                      id="imageRd"
                      placeholder="redis:latest"
                      value={images.redis}
                      onChange={(e) => setImages(prev => ({ ...prev, redis: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pré-visualização das strings de conexão */}
          {formData.serverId && formData.tenantId && (
            <div className="space-y-3 border rounded-md p-4 bg-muted/50">
              <div className="text-sm font-medium mb-2">Strings de conexão</div>
              <p className="text-xs text-muted-foreground mb-3">
                Use essas informações para conectar via DBeaver, Redis client, MySQL Workbench ou outras ferramentas:
              </p>
              
              {selectedTypes.postgresql && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">PostgreSQL Connection String:</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        const connStr = `postgresql://${encodeURIComponent(formData.username || getDefaultUsername('postgresql'))}:${encodeURIComponent(formData.password || 'SUA_SENHA')}@${selectedServer?.host}:${formData.port || getDefaultPort('postgresql')}/${formData.databaseName || 'db'}${formData.schemaName ? `?schema=${formData.schemaName}` : ''}`;
                        copyToClipboard(connStr, 'postgresql');
                      }}
                    >
                      {copiedConnections.postgresql ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs font-mono break-all bg-background p-2 rounded border">
                    postgresql://{formData.username || getDefaultUsername('postgresql')}:{formData.password || 'SUA_SENHA'}@{selectedServer?.host}:{formData.port || getDefaultPort('postgresql')}/{formData.databaseName || 'db'}
                    {formData.schemaName ? `?schema=${formData.schemaName}` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>Host:</strong> {selectedServer?.host} | <strong>Porta:</strong> {formData.port || getDefaultPort('postgresql')} | <strong>Database:</strong> {formData.databaseName || 'db'} | <strong>User:</strong> {formData.username || getDefaultUsername('postgresql')}
                    {formData.schemaName && <> | <strong>Schema:</strong> {formData.schemaName}</>}
                  </div>
                </div>
              )}
              
              {selectedTypes.mysql && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">MySQL Connection String:</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        const connStr = `mysql://${encodeURIComponent(formData.username || getDefaultUsername('mysql'))}:${encodeURIComponent(formData.password || 'SUA_SENHA')}@${selectedServer?.host}:${formData.port || getDefaultPort('mysql')}/${formData.databaseName || 'db'}`;
                        copyToClipboard(connStr, 'mysql');
                      }}
                    >
                      {copiedConnections.mysql ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs font-mono break-all bg-background p-2 rounded border">
                    mysql://{formData.username || getDefaultUsername('mysql')}:{formData.password || 'SUA_SENHA'}@{selectedServer?.host}:{formData.port || getDefaultPort('mysql')}/{formData.databaseName || 'db'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>Host:</strong> {selectedServer?.host} | <strong>Porta:</strong> {formData.port || getDefaultPort('mysql')} | <strong>Database:</strong> {formData.databaseName || 'db'} | <strong>User:</strong> {formData.username || getDefaultUsername('mysql')}
                  </div>
                </div>
              )}
              
              {selectedTypes.redis && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Redis Connection String:</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        const connStr = `redis://:${encodeURIComponent(formData.password || 'SUA_SENHA')}@${selectedServer?.host}:${formData.port || getDefaultPort('redis')}`;
                        copyToClipboard(connStr, 'redis');
                      }}
                    >
                      {copiedConnections.redis ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs font-mono break-all bg-background p-2 rounded border">
                    redis://:{formData.password || 'SUA_SENHA'}@{selectedServer?.host}:{formData.port || getDefaultPort('redis')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>Host:</strong> {selectedServer?.host} | <strong>Porta:</strong> {formData.port || getDefaultPort('redis')} | <strong>Password:</strong> {formData.password ? '***' : 'Será gerada automaticamente'}
                  </div>
                </div>
              )}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Você pode alterar a porta caso já esteja em uso no servidor. Se a porta estiver ocupada, você receberá um aviso durante a criação.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Pré-visualização também disponível para provedores externos */}
          {provisionTarget !== 'vps_ssh' && formData.externalHost && formData.tenantId && formData.databaseName && (
            <div className="space-y-3 border rounded-md p-4 bg-muted/50">
              <div className="text-sm font-medium mb-2">String de conexão (provedor externo)</div>
              <div className="text-xs font-mono break-all bg-background p-2 rounded border">
                {formData.connectionString || 
                  (formData.databaseType === 'postgresql' 
                    ? `postgresql://${formData.externalUsername}:${formData.externalPassword ? '***' : ''}@${formData.externalHost}:${formData.externalPort}/${formData.databaseName}`
                    : formData.databaseType === 'mysql'
                    ? `mysql://${formData.externalUsername}:${formData.externalPassword ? '***' : ''}@${formData.externalHost}:${formData.externalPort}/${formData.databaseName}`
                    : `redis://:${formData.externalPassword ? '***' : ''}@${formData.externalHost}:${formData.externalPort}`
                  )
                }
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Banco
            </Button>
          </DialogFooter>
        </form>

        {/* Diálogo de autenticação do provedor */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar com {provisionTarget.charAt(0).toUpperCase() + provisionTarget.slice(1)}</DialogTitle>
              <DialogDescription>
                Configure sua API Key para listar bancos de dados automaticamente. As credenciais são criptografadas e armazenadas com segurança.
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
                  Para obter sua API key, consulte a documentação do provedor nos links acima.
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Sua API key será validada antes de ser salva. Ela é criptografada e usada apenas para listar seus bancos de dados.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAuthDialog(false);
                setApiKey('');
              }}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={configureProviderAuth}
                disabled={configuringAuth || !apiKey.trim()}
              >
                {configuringAuth && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
      
      {/* Alert Dialog para erros */}
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{errorDialog.message}</p>
              {errorDialog.portInUse && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Sugestão:</p>
                  <p className="text-xs text-muted-foreground">
                    Tente usar uma porta alternativa (ex: {errorDialog.portInUse + 1}, {errorDialog.portInUse + 100}). 
                    Você pode alterar a porta no campo "Porta" acima.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ ...errorDialog, open: false })}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

