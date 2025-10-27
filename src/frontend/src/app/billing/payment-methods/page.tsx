'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Plus, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentMethodsPage() {
  const { paymentMethods, isLoading, error, mutate } = usePaymentMethods();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  // Verificar permissões
  if (!hasPermission(['SUPER_ADMIN', 'OWNER', 'ADMIN'])) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddCard = async () => {
    // TODO: Implementar fluxo de adicionar cartão
    toast({
      title: 'Adicionar Cartão',
      description: 'Funcionalidade em desenvolvimento'
    });
  };

  const handleSetDefault = async (methodId: string) => {
    // TODO: Implementar definição de método padrão
    toast({
      title: 'Cartão Padrão',
      description: 'Método de pagamento definido como padrão'
    });
    mutate();
  };

  const handleRemove = async (methodId: string) => {
    // TODO: Implementar remoção de método
    toast({
      title: 'Método Removido',
      description: 'Método de pagamento removido com sucesso'
    });
    mutate();
  };

  return (
    <div className="container mx-auto py-12 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie suas formas de pagamento</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cartão</DialogTitle>
              <DialogDescription>
                Adicione um novo cartão de crédito para sua assinatura
              </DialogDescription>
            </DialogHeader>
            {/* TODO: Implementar formulário de adicionar cartão */}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar métodos de pagamento: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && paymentMethods && paymentMethods.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhum método de pagamento</p>
            <p className="text-muted-foreground mb-4">
              Adicione um cartão para continuar sua assinatura
            </p>
            <Button onClick={handleAddCard}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cartão
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && paymentMethods && paymentMethods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {method.brand ? `${method.brand.toUpperCase()} ` : ''}
                      ****{method.last4}
                    </CardTitle>
                    <CardDescription>
                      Expira {method.expiryMonth}/{method.expiryYear}
                    </CardDescription>
                  </div>
                  {method.isDefault && (
                    <Badge variant="default">
                      <Check className="mr-1 h-3 w-3" />
                      Padrão
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Definir como Padrão
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(method.id)}
                  >
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

