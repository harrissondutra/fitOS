'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Key, Server, Shield, Upload, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const connectionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  provider: z.enum(['oracle_cloud', 'railway', 'supabase', 'neon', 'aws_rds', 'custom']),
  host: z.string().min(1, 'Host é obrigatório'),
  port: z.number().min(1).max(65535),
  databaseName: z.string().min(1, 'Nome do banco é obrigatório'),
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  sshEnabled: z.boolean().default(false),
  sshHost: z.string().optional(),
  sshPort: z.number().optional(),
  sshUsername: z.string().optional(),
  sshKeyPath: z.string().optional(),
  sslEnabled: z.boolean().default(false),
  connectionPoolSize: z.number().min(1).max(100).default(10),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
  organizationId?: string;
  connectionId?: string;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onTest?: (data: ConnectionFormData) => Promise<void>;
  defaultValues?: Partial<ConnectionFormData>;
}

export function ConnectionForm({
  organizationId,
  connectionId,
  onSubmit,
  onTest,
  defaultValues,
}: ConnectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sshKeyFile, setSshKeyFile] = useState<File | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      port: 5432,
      sshPort: 22,
      sshEnabled: false,
      sslEnabled: false,
      connectionPoolSize: 10,
      ...defaultValues,
    },
  });

  const sshEnabled = watch('sshEnabled');
  const provider = watch('provider');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSshKeyFile(file);
      // Ler conteúdo do arquivo
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setValue('sshKeyPath', content);
      };
      reader.readAsText(file);
    }
  };

  const onFormSubmit = async (data: ConnectionFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: 'Sucesso',
        description: connectionId ? 'Conexão atualizada com sucesso' : 'Conexão criada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar conexão',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async (data: ConnectionFormData) => {
    if (!onTest) return;

    setIsTesting(true);
    try {
      await onTest(data);
      toast({
        title: 'Sucesso',
        description: 'Conexão testada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao testar conexão',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {connectionId ? 'Editar Conexão' : 'Nova Conexão'}
        </CardTitle>
        <CardDescription>
          Configure uma nova conexão de banco de dados para organização
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conexão *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Minha Conexão PostgreSQL"
                />
                {errors.name && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.name.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => setValue('provider', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oracle_cloud">Oracle Cloud</SelectItem>
                    <SelectItem value="railway">Railway</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="aws_rds">AWS RDS</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {errors.provider && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.provider.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  {...register('host')}
                  placeholder="db.example.com"
                />
                {errors.host && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.host.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Porta *</Label>
                <Input
                  id="port"
                  type="number"
                  {...register('port', { valueAsNumber: true })}
                  placeholder="5432"
                />
                {errors.port && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.port.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="databaseName">Nome do Banco *</Label>
                <Input
                  id="databaseName"
                  {...register('databaseName')}
                  placeholder="mydb"
                />
                {errors.databaseName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.databaseName.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="postgres"
                />
                {errors.username && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.username.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
              />
              {errors.password && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.password.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* SSH Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-4 w-4" />
                Configuração SSH
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="sshEnabled">Habilitar SSH</Label>
                <Switch
                  id="sshEnabled"
                  checked={sshEnabled}
                  onCheckedChange={(checked) => setValue('sshEnabled', checked)}
                />
              </div>
            </div>

            {sshEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="sshHost">SSH Host</Label>
                  <Input
                    id="sshHost"
                    {...register('sshHost')}
                    placeholder="ssh.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sshPort">SSH Porta</Label>
                  <Input
                    id="sshPort"
                    type="number"
                    {...register('sshPort', { valueAsNumber: true })}
                    placeholder="22"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sshUsername">SSH Username</Label>
                  <Input
                    id="sshUsername"
                    {...register('sshUsername')}
                    placeholder="ubuntu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sshKeyPath">Chave SSH</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sshKeyPath"
                      {...register('sshKeyPath')}
                      placeholder="Caminho da chave ou upload"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('sshKeyFile')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      id="sshKeyFile"
                      type="file"
                      accept=".key,.pem"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {sshKeyFile && (
                    <p className="text-sm text-muted-foreground">
                      Arquivo selecionado: {sshKeyFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SSL & Pool Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança e Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sslEnabled">Habilitar SSL</Label>
                <Switch
                  id="sslEnabled"
                  checked={watch('sslEnabled')}
                  onCheckedChange={(checked) => setValue('sslEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectionPoolSize">Tamanho do Pool</Label>
                <Input
                  id="connectionPoolSize"
                  type="number"
                  {...register('connectionPoolSize', { valueAsNumber: true })}
                  placeholder="10"
                />
                {errors.connectionPoolSize && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.connectionPoolSize.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t pt-4">
            {onTest && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(handleTestConnection)}
                disabled={isTesting || isSubmitting}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isTesting}>
              {isSubmitting ? 'Salvando...' : connectionId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

