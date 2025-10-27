'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInvoices } from '@/hooks/use-invoices';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useState } from 'react';

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { invoices: data, isLoading, error } = useInvoices(page, 10);
  const { hasPermission } = usePermissions();

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

  const handleDownload = async (invoiceId: string) => {
    // TODO: Implementar download de fatura
    console.log('Download invoice:', invoiceId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Faturas</h1>
        <p className="text-muted-foreground">Visualize todas as suas faturas</p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar faturas: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && data && (
        <Card>
          <CardHeader>
            <CardTitle>Faturas</CardTitle>
            <CardDescription>
              {data.total} faturas no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.items && data.items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma fatura encontrada
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items?.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{invoice.description || 'Assinatura mensal'}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount || 0, 'BRL')}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data.hasMore && (
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {page}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!data.hasMore}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

