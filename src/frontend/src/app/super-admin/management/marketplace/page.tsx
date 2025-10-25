"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Plus, Package, DollarSign, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Gerencie produtos e serviços do marketplace
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.2K</div>
            <p className="text-xs text-muted-foreground">
              +8% desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +3 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.5K</div>
            <p className="text-xs text-muted-foreground">
              +15% desde o último mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos em Destaque</CardTitle>
            <CardDescription>
              Produtos com melhor performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">Whey Protein Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Suplemento de alta qualidade
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">R$ 89,90</Badge>
                <Badge variant="outline">156 vendas</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Creatina Monohidratada</h3>
                  <p className="text-sm text-muted-foreground">
                    Suplemento para ganho de massa
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">R$ 45,90</Badge>
                <Badge variant="outline">89 vendas</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-purple-500" />
                <div>
                  <h3 className="font-medium">BCAA 2:1:1</h3>
                  <p className="text-sm text-muted-foreground">
                    Aminoácidos essenciais
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">R$ 67,90</Badge>
                <Badge variant="outline">67 vendas</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações do Marketplace</CardTitle>
            <CardDescription>
              Gerencie as configurações gerais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comissão Padrão</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  defaultValue="10" 
                  className="w-full p-2 border rounded-md"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Taxa de Processamento</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  defaultValue="3.5" 
                  className="w-full p-2 border rounded-md"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frete Grátis a partir de</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  defaultValue="99" 
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <Button className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}