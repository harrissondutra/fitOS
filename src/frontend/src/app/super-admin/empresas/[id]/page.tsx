'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  Users, 
  Settings,
  Calendar,
  Mail,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toastUtils } from '@/lib/toast-utils';

interface Empresa {
  id: string;
  name: string;
  tenantType: 'individual' | 'business';
  subdomain?: string;
  customDomain?: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  billingEmail: string;
  createdAt: string;
  updatedAt: string;
  _count: { 
    users: number; 
    members: number; 
  };
  stats?: {
    userCounts: Record<string, number>;
    limits: Record<string, number>;
    features: Record<string, boolean>;
    isCustomPlan: boolean;
  };
}

interface PaymentDetails {
  subscription: any;
  realTimeData?: {
    subscription?: any;
    customer?: any;
    invoices?: any[];
    upcomingInvoice?: any;
    mercadoPagoPayments?: any[];
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function EmpresaDetailsPage() {
  const params = useParams();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [payments, setPayments] = useState<PaymentDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const fetchEmpresaDetails = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${params.id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmpresa(data.data);
      }
    } catch (error) {
      console.error('Error fetching empresa details:', error);
    }
  }, [params?.id]);

  const fetchPayments = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      setPaymentsLoading(true);
      const response = await fetch(`/api/super-admin/tenants/${params.id}/payments`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [params?.id]);

  const fetchUsers = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${params.id}/users`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (params?.id) {
      fetchEmpresaDetails();
      fetchPayments();
      fetchUsers();
    }
  }, [params?.id, fetchEmpresaDetails, fetchPayments, fetchUsers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Inativo
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed':
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Empresa não encontrada</h2>
        <p className="text-muted-foreground mb-4">
          A empresa que você está procurando não existe ou foi removida.
        </p>
        <Button asChild>
          <Link href="/super-admin/empresas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Empresas
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/empresas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{empresa.name}</h1>
            <p className="text-muted-foreground">{empresa.billingEmail}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(empresa.status)}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/tenants/${empresa.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários</p>
                <p className="text-2xl font-bold">{empresa._count.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Membros</p>
                <p className="text-2xl font-bold">{empresa._count.members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-sm font-bold">
                  {empresa.tenantType === 'individual' ? 'Pessoa Física' : 'Empresa'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                <p className="text-sm font-bold">
                  {new Date(empresa.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Nome:</span>
                  <span>{empresa.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span>{empresa.billingEmail}</span>
                </div>
                {empresa.subdomain && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Subdomain:</span>
                    <span>{empresa.subdomain}.fitos.com</span>
                  </div>
                )}
                {empresa.customDomain && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Domínio:</span>
                    <span>{empresa.customDomain}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                {empresa.stats?.userCounts ? (
                  <div className="space-y-2">
                    {Object.entries(empresa.stats.userCounts).map(([role, count]) => {
                      const limit = empresa.stats?.limits?.[role] || -1;
                      const percentage = limit === -1 ? 0 : Math.round((count / limit) * 100);
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{role}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{count}</span>
                            {limit !== -1 && (
                              <>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">{limit}</span>
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      percentage >= 90 ? 'bg-red-500' : 
                                      percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma estatística disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários da Empresa</CardTitle>
              <CardDescription>
                Lista de todos os usuários cadastrados nesta empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Dados de pagamentos integrados com Stripe e Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stripe Subscription */}
                  {payments?.realTimeData?.subscription && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Assinatura Stripe
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="ml-2">
                            {payments.realTimeData.subscription.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(payments.realTimeData.subscription.plan.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Período:</span>
                          <span className="ml-2">
                            {payments.realTimeData.subscription.plan.interval}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Próxima cobrança:</span>
                          <span className="ml-2">
                            {payments.realTimeData.upcomingInvoice?.due_date 
                              ? new Date(payments.realTimeData.upcomingInvoice.due_date).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stripe Invoices */}
                  {payments?.realTimeData?.invoices && payments.realTimeData.invoices.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Faturas Stripe</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.realTimeData.invoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono text-xs">
                                {invoice.id.substring(0, 20)}...
                              </TableCell>
                              <TableCell>{formatCurrency(invoice.amount_paid)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                {new Date(invoice.created).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Mercado Pago Payments */}
                  {payments?.realTimeData?.mercadoPagoPayments && payments.realTimeData.mercadoPagoPayments.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Pagamentos Mercado Pago</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.realTimeData.mercadoPagoPayments.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-mono text-xs">
                                {payment.id}
                              </TableCell>
                              <TableCell>
                                R$ {payment.transaction_amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.payment_method_id}
                                </Badge>
                              </TableCell>
                              <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                              <TableCell>
                                {new Date(payment.date_created).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Banco de dados invoices */}
                  {payments?.subscription?.invoices && payments.subscription.invoices.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Faturas do Banco de Dados</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.subscription.invoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono text-xs">
                                {invoice.id.substring(0, 20)}...
                              </TableCell>
                              <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {!payments?.realTimeData && !payments?.subscription?.invoices?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum pagamento encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Plano</CardTitle>
              <CardDescription>
                Detalhes do plano atual e limites de uso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Plano Atual</h4>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {empresa.stats?.isCustomPlan ? 'Plano Customizado' : empresa.plan}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  {getStatusBadge(empresa.status)}
                </div>
              </div>

              {empresa.stats?.features && (
                <div>
                  <h4 className="font-medium mb-2">Recursos Habilitados</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(empresa.stats.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        {enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm capitalize">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
