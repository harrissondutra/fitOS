import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  CreditCard,
  Mail,
  Phone,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface OrderDetails {
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  estimatedDelivery: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}

// Mock order data
const mockOrder: OrderDetails = {
  orderNumber: 'ORD-123456',
  status: 'confirmed',
  total: 789.70,
  paymentMethod: 'Cartão de Crédito',
  estimatedDelivery: '2023-11-25',
  items: [
    {
      id: '1',
      name: 'Whey Protein Isolado 900g - Sabor Chocolate',
      quantity: 2,
      price: 129.90,
      imageUrl: 'https://via.placeholder.com/80x80/FFD700/FFFFFF?text=WP'
    },
    {
      id: '2',
      name: 'Creatina Monohidratada 300g',
      quantity: 1,
      price: 89.90,
      imageUrl: 'https://via.placeholder.com/80x80/FFD700/FFFFFF?text=CR'
    },
    {
      id: '3',
      name: 'Kit Halteres Ajustáveis 20kg',
      quantity: 1,
      price: 499.00,
      imageUrl: 'https://via.placeholder.com/80x80/FFD700/FFFFFF?text=KH'
    }
  ],
  customer: {
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999'
  },
  shippingAddress: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01234-567'
  }
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pedido Confirmado!
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Obrigado pela sua compra. Seu pedido foi processado com sucesso.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              Número do Pedido: {mockOrder.orderNumber}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Itens do Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          R$ {item.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Informações de Entrega</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Endereço de Entrega</h4>
                    <p className="text-gray-600">
                      {mockOrder.shippingAddress.street}, {mockOrder.shippingAddress.number}<br />
                      {mockOrder.shippingAddress.neighborhood}, {mockOrder.shippingAddress.city} - {mockOrder.shippingAddress.state}<br />
                      CEP: {mockOrder.shippingAddress.cep}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Previsão de Entrega</h4>
                    <p className="text-gray-600">
                      {new Date(mockOrder.estimatedDelivery).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Informações de Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Pagamento</span>
                    <span className="font-medium">{mockOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total</span>
                    <span className="font-bold text-lg">R$ {mockOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✅ Pagamento aprovado e processado com sucesso
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Confirmação por E-mail</p>
                    <p className="text-sm text-gray-600">
                      Você receberá um e-mail com todos os detalhes do pedido
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Preparação do Pedido</p>
                    <p className="text-sm text-gray-600">
                      O vendedor preparará seus itens para envio
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Envio e Rastreamento</p>
                    <p className="text-sm text-gray-600">
                      Você receberá o código de rastreamento
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Entrega</p>
                    <p className="text-sm text-gray-600">
                      Seu pedido será entregue no endereço informado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Comprovante
                </Button>
                
                <Button className="w-full" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Pedido
                </Button>
                
                <Link href="/marketplace/orders">
                  <Button className="w-full">
                    Acompanhar Pedidos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">E-mail</p>
                    <p className="text-sm text-gray-600">suporte@fitOS.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Telefone</p>
                    <p className="text-sm text-gray-600">(11) 3000-0000</p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Central de Ajuda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Continue Descobrindo
          </h2>
          <p className="text-gray-600 mb-6">
            Explore mais produtos incríveis no fitOS Marketplace
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/marketplace">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Continuar Comprando
              </Button>
            </Link>
            <Link href="/marketplace/seller/onboarding">
              <Button variant="outline">
                Começar a Vender
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

