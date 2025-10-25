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
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MessageCircle,
  Star,
  RefreshCw,
  Download,
  MapPin,
  CreditCard,
  Calendar,
  User
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const orders = [
  {
    id: 'ORD-001',
    orderNumber: '20240120001',
    date: '2024-01-20',
    status: 'delivered',
    total: 89.90,
    items: 1,
    seller: 'Suplementos Premium',
    sellerId: '1',
    products: [
      {
        id: '1',
        name: 'Whey Protein Premium',
        price: 89.90,
        quantity: 1,
        image: '/images/marketplace/whey-protein.jpg'
      }
    ],
    shippingAddress: {
      name: 'João Silva',
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    paymentMethod: 'Cartão de Crédito',
    trackingNumber: 'BR123456789',
    estimatedDelivery: '2024-01-25',
    actualDelivery: '2024-01-24'
  },
  {
    id: 'ORD-002',
    orderNumber: '20240119002',
    date: '2024-01-19',
    status: 'shipped',
    total: 145.80,
    items: 2,
    seller: 'Equipamentos Fitness',
    sellerId: '2',
    products: [
      {
        id: '2',
        name: 'Creatina Monohidratada',
        price: 45.90,
        quantity: 1,
        image: '/images/marketplace/creatine.jpg'
      },
      {
        id: '3',
        name: 'Halteres Ajustáveis',
        price: 99.90,
        quantity: 1,
        image: '/images/marketplace/dumbbells.jpg'
      }
    ],
    shippingAddress: {
      name: 'João Silva',
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    paymentMethod: 'PIX',
    trackingNumber: 'BR987654321',
    estimatedDelivery: '2024-01-26',
    actualDelivery: null
  },
  {
    id: 'ORD-003',
    orderNumber: '20240118003',
    date: '2024-01-18',
    status: 'processing',
    total: 67.90,
    items: 1,
    seller: 'Roupas Esportivas',
    sellerId: '3',
    products: [
      {
        id: '4',
        name: 'Camiseta Dry Fit',
        price: 67.90,
        quantity: 1,
        image: '/images/marketplace/dry-fit-shirt.jpg'
      }
    ],
    shippingAddress: {
      name: 'João Silva',
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    paymentMethod: 'Boleto',
    trackingNumber: null,
    estimatedDelivery: '2024-01-28',
    actualDelivery: null
  },
  {
    id: 'ORD-004',
    orderNumber: '20240117004',
    date: '2024-01-17',
    status: 'cancelled',
    total: 199.90,
    items: 1,
    seller: 'Livros e Cursos',
    sellerId: '4',
    products: [
      {
        id: '5',
        name: 'Curso Personal Training',
        price: 199.90,
        quantity: 1,
        image: '/images/marketplace/personal-training-course.jpg'
      }
    ],
    shippingAddress: {
      name: 'João Silva',
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    paymentMethod: 'Cartão de Crédito',
    trackingNumber: null,
    estimatedDelivery: null,
    actualDelivery: null,
    cancellationReason: 'Produto indisponível'
  }
];

const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'shipped':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><Truck className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Entregue</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meus Pedidos</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe seus pedidos e histórico de compras
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">
                Todos os tempos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processando</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('processing')}</div>
              <p className="text-xs text-muted-foreground">
                Em preparação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('shipped')}</div>
              <p className="text-xs text-muted-foreground">
                A caminho
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('delivered')}</div>
              <p className="text-xs text-muted-foreground">
                Concluídos
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
                  placeholder="Buscar pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.items} {order.items === 1 ? 'item' : 'itens'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(order.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{order.seller}</div>
                            <div className="text-sm text-muted-foreground">ID: {order.sellerId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.products.slice(0, 2).map((product, index) => (
                            <div key={index} className="text-sm">
                              {product.name}
                            </div>
                          ))}
                          {order.products.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{order.products.length - 2} mais
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">R$ {order.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'delivered' && (
                            <Button variant="ghost" size="sm">
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
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
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
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
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Informações completas sobre seu pedido
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">Status do Pedido</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.status === 'delivered' && 'Pedido entregue com sucesso!'}
                    {selectedOrder.status === 'shipped' && 'Seu pedido está a caminho!'}
                    {selectedOrder.status === 'processing' && 'Seu pedido está sendo processado.'}
                    {selectedOrder.status === 'pending' && 'Aguardando confirmação do vendedor.'}
                    {selectedOrder.status === 'cancelled' && 'Pedido cancelado.'}
                  </div>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Products */}
              <div>
                <h3 className="font-semibold mb-3">Produtos</h3>
                <div className="space-y-3">
                  {selectedOrder.products.map((product: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantidade: {product.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">R$ {product.price.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          Subtotal: R$ {(product.price * product.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3">Endereço de Entrega</h3>
                <div className="p-3 border border-border rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <div className="font-medium">{selectedOrder.shippingAddress.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedOrder.shippingAddress.street}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment and Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3">Pagamento</h3>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.trackingNumber && (
                  <div>
                    <h3 className="font-semibold mb-3">Rastreamento</h3>
                    <div className="p-3 border border-border rounded-lg">
                      <div className="font-medium">{selectedOrder.trackingNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedOrder.estimatedDelivery && 
                          `Previsão: ${new Date(selectedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}`
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total do Pedido</span>
                  <span>R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
