"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  MessageCircle,
  User,
  Store,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Shield,
  XCircle,
  Gavel
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const disputes = [
  {
    id: '1',
    disputeNumber: 'DISP-001',
    type: 'product_quality',
    status: 'open',
    priority: 'high',
    title: 'Produto não conforme com a descrição',
    description: 'O whey protein recebido não possui a quantidade de proteína informada na descrição. Análise laboratorial mostra apenas 70% de proteína ao invés dos 90% anunciados.',
    customer: {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999'
    },
    seller: {
      id: '1',
      name: 'Suplementos Premium',
      email: 'contato@suplementospremium.com'
    },
    order: {
      id: 'ORD-001',
      date: '2024-01-15',
      total: 89.90,
      product: 'Whey Protein Premium'
    },
    submittedAt: '2024-01-20T10:30:00Z',
    lastUpdate: '2024-01-22T14:20:00Z',
    evidence: [
      { type: 'image', url: '/images/disputes/evidence1.jpg', description: 'Foto do produto recebido' },
      { type: 'document', url: '/documents/disputes/lab-report.pdf', description: 'Relatório laboratorial' }
    ],
    resolution: null,
    assignedTo: 'Admin Sistema',
    messages: [
      {
        id: '1',
        sender: 'customer',
        senderName: 'João Silva',
        message: 'Recebi o produto mas não está conforme descrito. Gostaria de devolução ou troca.',
        timestamp: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        sender: 'seller',
        senderName: 'Suplementos Premium',
        message: 'Verificamos o lote e confirmamos que está dentro das especificações. Pode enviar fotos do produto?',
        timestamp: '2024-01-20T15:45:00Z'
      },
      {
        id: '3',
        sender: 'customer',
        senderName: 'João Silva',
        message: 'Enviei as fotos e o relatório do laboratório. O produto realmente não está conforme.',
        timestamp: '2024-01-21T09:15:00Z'
      }
    ]
  },
  {
    id: '2',
    disputeNumber: 'DISP-002',
    type: 'shipping',
    status: 'in_progress',
    priority: 'medium',
    title: 'Produto não entregue',
    description: 'Pedido realizado há 15 dias e ainda não foi entregue. Código de rastreamento não funciona.',
    customer: {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(21) 88888-8888'
    },
    seller: {
      id: '2',
      name: 'Equipamentos Fitness',
      email: 'vendas@equipamentosfitness.com'
    },
    order: {
      id: 'ORD-002',
      date: '2024-01-10',
      total: 299.90,
      product: 'Halteres Ajustáveis'
    },
    submittedAt: '2024-01-25T08:15:00Z',
    lastUpdate: '2024-01-26T11:30:00Z',
    evidence: [
      { type: 'image', url: '/images/disputes/tracking-error.jpg', description: 'Erro no rastreamento' }
    ],
    resolution: null,
    assignedTo: 'Admin Sistema',
    messages: [
      {
        id: '1',
        sender: 'customer',
        senderName: 'Maria Santos',
        message: 'Meu pedido não chegou e o código de rastreamento não funciona. Preciso de ajuda.',
        timestamp: '2024-01-25T08:15:00Z'
      },
      {
        id: '2',
        sender: 'admin',
        senderName: 'Admin Sistema',
        message: 'Vamos verificar com o vendedor e a transportadora. Retornaremos em até 24h.',
        timestamp: '2024-01-25T10:20:00Z'
      }
    ]
  },
  {
    id: '3',
    disputeNumber: 'DISP-003',
    type: 'refund',
    status: 'resolved',
    priority: 'low',
    title: 'Solicitação de reembolso',
    description: 'Produto chegou danificado. Cliente solicita reembolso total.',
    customer: {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      phone: '(31) 77777-7777'
    },
    seller: {
      id: '3',
      name: 'Roupas Esportivas',
      email: 'atendimento@roupasesportivas.com'
    },
    order: {
      id: 'ORD-003',
      date: '2024-01-12',
      total: 67.90,
      product: 'Camiseta Dry Fit'
    },
    submittedAt: '2024-01-18T16:45:00Z',
    lastUpdate: '2024-01-20T09:30:00Z',
    evidence: [
      { type: 'image', url: '/images/disputes/damaged-product.jpg', description: 'Produto danificado' }
    ],
    resolution: {
      type: 'refund',
      amount: 67.90,
      reason: 'Produto danificado durante o transporte',
      resolvedAt: '2024-01-20T09:30:00Z',
      resolvedBy: 'Admin Sistema'
    },
    assignedTo: 'Admin Sistema',
    messages: [
      {
        id: '1',
        sender: 'customer',
        senderName: 'Pedro Costa',
        message: 'A camiseta chegou com um rasgo. Quero reembolso.',
        timestamp: '2024-01-18T16:45:00Z'
      },
      {
        id: '2',
        sender: 'seller',
        senderName: 'Roupas Esportivas',
        message: 'Lamentamos o ocorrido. Vamos processar o reembolso imediatamente.',
        timestamp: '2024-01-19T10:20:00Z'
      },
      {
        id: '3',
        sender: 'admin',
        senderName: 'Admin Sistema',
        message: 'Reembolso processado com sucesso. Valor será creditado em até 5 dias úteis.',
        timestamp: '2024-01-20T09:30:00Z'
      }
    ]
  }
];

const disputeTypes = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'product_quality', label: 'Qualidade do Produto' },
  { value: 'shipping', label: 'Problemas de Entrega' },
  { value: 'refund', label: 'Reembolso' },
  { value: 'payment', label: 'Problemas de Pagamento' },
  { value: 'other', label: 'Outros' }
];

const priorityOptions = [
  { value: 'all', label: 'Todas as Prioridades' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' }
];

export default function DisputesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const [newMessage, setNewMessage] = useState('');

  const getFilteredDisputes = (disputes: any[]) => {
    return disputes.filter(dispute => {
      const matchesSearch = dispute.disputeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           dispute.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           dispute.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || dispute.type === selectedType;
      const matchesPriority = selectedPriority === 'all' || dispute.priority === selectedPriority;
      
      return matchesSearch && matchesType && matchesPriority;
    });
  };

  const openDisputes = getFilteredDisputes(disputes.filter(d => d.status === 'open'));
  const inProgressDisputes = getFilteredDisputes(disputes.filter(d => d.status === 'in_progress'));
  const resolvedDisputes = getFilteredDisputes(disputes.filter(d => d.status === 'resolved'));

  const getCurrentDisputes = () => {
    switch (activeTab) {
      case 'open':
        return openDisputes;
      case 'in_progress':
        return inProgressDisputes;
      case 'resolved':
        return resolvedDisputes;
      default:
        return openDisputes;
    }
  };

  const currentDisputes = getCurrentDisputes();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(currentDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDisputes = currentDisputes.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Aberto</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Em Andamento</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Média</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-500">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product_quality':
        return 'Qualidade do Produto';
      case 'shipping':
        return 'Problemas de Entrega';
      case 'refund':
        return 'Reembolso';
      case 'payment':
        return 'Problemas de Pagamento';
      default:
        return 'Outros';
    }
  };

  const handleViewDetails = (dispute: any) => {
    setSelectedDispute(dispute);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedDispute) {
      console.log('Enviar mensagem:', newMessage);
      setNewMessage('');
    }
  };

  const handleResolveDispute = (disputeId: string, resolution: any) => {
    console.log('Resolver disputa:', disputeId, resolution);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Disputas</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie disputas entre clientes e vendedores
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openDisputes.length}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando resolução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressDisputes.length}</div>
              <p className="text-xs text-muted-foreground">
                Sendo analisadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedDisputes.length}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5 dias</div>
              <p className="text-xs text-muted-foreground">
                Para resolução
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar disputas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {disputeTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Mais Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="open">Abertas ({openDisputes.length})</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento ({inProgressDisputes.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolvidas ({resolvedDisputes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'open' && 'Disputas Abertas'}
                  {activeTab === 'in_progress' && 'Disputas em Andamento'}
                  {activeTab === 'resolved' && 'Disputas Resolvidas'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'open' && 'Disputas que precisam de atenção imediata'}
                  {activeTab === 'in_progress' && 'Disputas sendo analisadas e processadas'}
                  {activeTab === 'resolved' && 'Histórico de disputas resolvidas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disputa</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDisputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{dispute.disputeNumber}</div>
                              <div className="text-sm text-muted-foreground">{dispute.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTypeLabel(dispute.type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{dispute.customer.name}</div>
                              <div className="text-sm text-muted-foreground">{dispute.customer.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{dispute.seller.name}</div>
                              <div className="text-sm text-muted-foreground">{dispute.seller.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(dispute.priority)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(dispute.status)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(dispute.lastUpdate).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(dispute.lastUpdate).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDetails(dispute)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {dispute.status !== 'resolved' && (
                                <Button variant="ghost" size="sm">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, currentDisputes.length)} de {currentDisputes.length} disputas
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dispute Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Disputa {selectedDispute?.disputeNumber}</DialogTitle>
            <DialogDescription>
              {selectedDispute?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Informações da Disputa</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Número:</span> {selectedDispute.disputeNumber}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {getTypeLabel(selectedDispute.type)}
                    </div>
                    <div>
                      <span className="font-medium">Prioridade:</span> {getPriorityBadge(selectedDispute.priority)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedDispute.status)}
                    </div>
                    <div>
                      <span className="font-medium">Atribuído a:</span> {selectedDispute.assignedTo}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Informações do Pedido</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Pedido:</span> {selectedDispute.order.id}
                    </div>
                    <div>
                      <span className="font-medium">Data:</span> {new Date(selectedDispute.order.date).toLocaleDateString('pt-BR')}
                    </div>
                    <div>
                      <span className="font-medium">Produto:</span> {selectedDispute.order.product}
                    </div>
                    <div>
                      <span className="font-medium">Valor:</span> R$ {selectedDispute.order.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Cliente</h3>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="font-medium">{selectedDispute.customer.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedDispute.customer.email}</div>
                    <div className="text-sm text-muted-foreground">{selectedDispute.customer.phone}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Vendedor</h3>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="font-medium">{selectedDispute.seller.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedDispute.seller.email}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-3">Descrição da Disputa</h3>
                <p className="text-muted-foreground">{selectedDispute.description}</p>
              </div>

              {/* Evidence */}
              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Evidências</h3>
                  <div className="space-y-2">
                    {selectedDispute.evidence.map((evidence: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border border-border rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{evidence.description}</div>
                          <div className="text-sm text-muted-foreground">{evidence.url}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                <h3 className="font-semibold mb-3">Conversa</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {selectedDispute.messages.map((message: any) => (
                    <div key={message.id} className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${
                        message.sender === 'customer' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="font-medium text-sm">{message.senderName}</div>
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedDispute.status !== 'resolved' && (
                  <div className="flex space-x-2 mt-4">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div>
                  <h3 className="font-semibold mb-3">Resolução</h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      {selectedDispute.resolution.type === 'refund' ? 'Reembolso Aprovado' : 'Disputa Resolvida'}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {selectedDispute.resolution.reason}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Resolvido por {selectedDispute.resolution.resolvedBy} em {new Date(selectedDispute.resolution.resolvedAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedDispute.status !== 'resolved' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                  <Button>
                    <Shield className="h-4 w-4 mr-2" />
                    Resolver Disputa
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


