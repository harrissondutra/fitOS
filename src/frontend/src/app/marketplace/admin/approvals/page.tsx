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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  User,
  Store,
  Package,
  Calendar,
  MessageCircle,
  AlertTriangle,
  Shield,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const pendingApprovals = [
  {
    id: '1',
    type: 'seller',
    name: 'Academia Fitness Pro',
    owner: 'Carlos Mendes',
    email: 'carlos@academiafitness.com',
    phone: '(11) 99999-9999',
    category: 'Equipamentos',
    description: 'Academia especializada em equipamentos profissionais para academias e treinos em casa.',
    location: 'São Paulo, SP',
    submittedAt: '2024-01-20T10:30:00Z',
    documents: [
      { name: 'CNPJ', status: 'verified' },
      { name: 'RG', status: 'verified' },
      { name: 'Comprovante de Endereço', status: 'pending' }
    ],
    products: 15,
    estimatedRevenue: 50000,
    experience: '5 anos no mercado',
    socialMedia: {
      instagram: '@academiafitnesspro',
      website: 'www.academiafitness.com.br'
    }
  },
  {
    id: '2',
    type: 'product',
    name: 'Whey Protein Isolado',
    seller: 'Suplementos Premium',
    sellerId: '1',
    category: 'Suplementos',
    price: 129.90,
    description: 'Proteína isolada de alta qualidade, 90% de proteína por dose.',
    submittedAt: '2024-01-19T14:20:00Z',
    images: ['/images/marketplace/whey-isolate-1.jpg', '/images/marketplace/whey-isolate-2.jpg'],
    specifications: {
      weight: '1kg',
      protein: '90%',
      flavor: 'Chocolate',
      brand: 'Premium Nutrition'
    },
    certifications: ['ANVISA', 'FDA'],
    ingredients: 'Proteína isolada de soro do leite, cacau em pó, edulcorante natural'
  },
  {
    id: '3',
    type: 'seller',
    name: 'Roupas Esportivas Elite',
    owner: 'Ana Beatriz Silva',
    email: 'ana@roupaselite.com',
    phone: '(21) 88888-8888',
    category: 'Roupas',
    description: 'Roupas esportivas de alta qualidade para atletas profissionais.',
    location: 'Rio de Janeiro, RJ',
    submittedAt: '2024-01-18T09:15:00Z',
    documents: [
      { name: 'CNPJ', status: 'verified' },
      { name: 'RG', status: 'verified' },
      { name: 'Comprovante de Endereço', status: 'verified' }
    ],
    products: 8,
    estimatedRevenue: 25000,
    experience: '3 anos no mercado',
    socialMedia: {
      instagram: '@roupaselite',
      website: 'www.roupaselite.com.br'
    }
  }
];

const approvedItems = [
  {
    id: '4',
    type: 'seller',
    name: 'Equipamentos Fitness Brasil',
    owner: 'Roberto Santos',
    approvedAt: '2024-01-15T16:45:00Z',
    approvedBy: 'Admin Sistema',
    status: 'active'
  },
  {
    id: '5',
    type: 'product',
    name: 'Creatina Monohidratada Premium',
    seller: 'Suplementos Premium',
    approvedAt: '2024-01-14T11:30:00Z',
    approvedBy: 'Admin Sistema',
    status: 'active'
  }
];

const rejectedItems = [
  {
    id: '6',
    type: 'seller',
    name: 'Loja Sem Documentos',
    owner: 'João Silva',
    rejectedAt: '2024-01-12T13:20:00Z',
    rejectedBy: 'Admin Sistema',
    reason: 'Documentação incompleta - CNPJ inválido'
  }
];

const categories = [
  'Todos',
  'Vendedores',
  'Produtos',
  'Equipamentos',
  'Suplementos',
  'Roupas',
  'Acessórios'
];

export default function ApprovalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const getFilteredItems = (items: any[]) => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.seller?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || 
                             item.category === selectedCategory ||
                             (selectedCategory === 'Vendedores' && item.type === 'seller') ||
                             (selectedCategory === 'Produtos' && item.type === 'product');
      
      return matchesSearch && matchesCategory;
    });
  };

  const pendingItems = getFilteredItems(pendingApprovals);
  const approvedItemsFiltered = getFilteredItems(approvedItems);
  const rejectedItemsFiltered = getFilteredItems(rejectedItems);

  const itemsPerPage = 10;
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'pending':
        return pendingItems;
      case 'approved':
        return approvedItemsFiltered;
      case 'rejected':
        return rejectedItemsFiltered;
      default:
        return pendingItems;
    }
  };

  const currentItems = getCurrentItems();
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = currentItems.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

  const handleApprove = (itemId: string) => {
    console.log('Aprovar item:', itemId);
    // Implementar lógica de aprovação
  };

  const handleReject = (itemId: string, reason: string) => {
    console.log('Rejeitar item:', itemId, 'Motivo:', reason);
    // Implementar lógica de rejeição
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Aprovações</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie aprovações de vendedores e produtos
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
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((approvedItems.length / (approvedItems.length + rejectedItems.length)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aprovações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
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
            <TabsTrigger value="pending">Pendentes ({pendingItems.length})</TabsTrigger>
            <TabsTrigger value="approved">Aprovados ({approvedItemsFiltered.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados ({rejectedItemsFiltered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'pending' && 'Itens Pendentes de Aprovação'}
                  {activeTab === 'approved' && 'Itens Aprovados'}
                  {activeTab === 'rejected' && 'Itens Rejeitados'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'pending' && 'Revise e aprove ou rejeite os itens pendentes'}
                  {activeTab === 'approved' && 'Histórico de itens aprovados'}
                  {activeTab === 'rejected' && 'Histórico de itens rejeitados'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {item.type === 'seller' ? (
                                <Store className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="capitalize">{item.type === 'seller' ? 'Vendedor' : 'Produto'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.owner && (
                                <div className="text-sm text-muted-foreground">por {item.owner}</div>
                              )}
                              {item.seller && (
                                <div className="text-sm text-muted-foreground">Vendedor: {item.seller}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(item.submittedAt || item.approvedAt || item.rejectedAt).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(item.submittedAt || item.approvedAt || item.rejectedAt).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status || 'pending')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDetails(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {activeTab === 'pending' && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Aprovar Item</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja aprovar este item? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleApprove(item.id)}>
                                          Aprovar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Rejeitar Item</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja rejeitar este item? Informe o motivo da rejeição.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="py-4">
                                        <Input placeholder="Motivo da rejeição..." />
                                      </div>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleReject(item.id, 'Motivo não informado')}>
                                          Rejeitar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
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
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, currentItems.length)} de {currentItems.length} itens
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Aprovação</DialogTitle>
            <DialogDescription>
              Informações completas sobre o item em análise
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedItem.name}
                    </div>
                    {selectedItem.owner && (
                      <div>
                        <span className="font-medium">Proprietário:</span> {selectedItem.owner}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Categoria:</span> {selectedItem.category}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {selectedItem.type === 'seller' ? 'Vendedor' : 'Produto'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Contato</h3>
                  <div className="space-y-2">
                    {selectedItem.email && (
                      <div>
                        <span className="font-medium">Email:</span> {selectedItem.email}
                      </div>
                    )}
                    {selectedItem.phone && (
                      <div>
                        <span className="font-medium">Telefone:</span> {selectedItem.phone}
                      </div>
                    )}
                    {selectedItem.location && (
                      <div>
                        <span className="font-medium">Localização:</span> {selectedItem.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-3">Descrição</h3>
                <p className="text-muted-foreground">{selectedItem.description}</p>
              </div>

              {/* Documents (for sellers) */}
              {selectedItem.type === 'seller' && selectedItem.documents && (
                <div>
                  <h3 className="font-semibold mb-3">Documentos</h3>
                  <div className="space-y-2">
                    {selectedItem.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                        </div>
                        {getDocumentStatus(doc.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Details (for products) */}
              {selectedItem.type === 'product' && (
                <div>
                  <h3 className="font-semibold mb-3">Detalhes do Produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedItem.price && (
                      <div>
                        <span className="font-medium">Preço:</span> R$ {selectedItem.price.toFixed(2)}
                      </div>
                    )}
                    {selectedItem.specifications && Object.entries(selectedItem.specifications).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">{key}:</span> {value as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images (for products) */}
              {selectedItem.type === 'product' && selectedItem.images && (
                <div>
                  <h3 className="font-semibold mb-3">Imagens</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedItem.images.map((image: string, index: number) => (
                      <div key={index} className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeTab === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rejeitar Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Informe o motivo da rejeição para o solicitante.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Input placeholder="Motivo da rejeição..." />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleReject(selectedItem.id, 'Motivo não informado')}>
                          Rejeitar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button onClick={() => handleApprove(selectedItem.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
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
