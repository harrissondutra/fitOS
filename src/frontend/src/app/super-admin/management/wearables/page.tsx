"use client"

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Watch, Plus, Activity, Heart, Zap } from "lucide-react"

export default function WearablesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wearables</h1>
          <p className="text-muted-foreground">
            Gerencie integrações com dispositivos vestíveis
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Integração
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
            <Watch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +89 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dados Sincronizados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-muted-foreground">
              +12% desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência Cardíaca</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78 bpm</div>
            <p className="text-xs text-muted-foreground">
              Média dos usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calorias Queimadas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1M</div>
            <p className="text-xs text-muted-foreground">
              Total do mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos Suportados</CardTitle>
            <CardDescription>
              Integrações disponíveis no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Watch className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">Apple Watch</h3>
                  <p className="text-sm text-muted-foreground">
                    Integração completa com HealthKit
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Ativo</Badge>
                <Badge variant="outline">1,234 usuários</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Watch className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Samsung Galaxy Watch</h3>
                  <p className="text-sm text-muted-foreground">
                    Sincronização via Samsung Health
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Ativo</Badge>
                <Badge variant="outline">567 usuários</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Watch className="h-5 w-5 text-purple-500" />
                <div>
                  <h3 className="font-medium">Fitbit</h3>
                  <p className="text-sm text-muted-foreground">
                    API oficial do Fitbit
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Ativo</Badge>
                <Badge variant="outline">345 usuários</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Watch className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="font-medium">Garmin</h3>
                  <p className="text-sm text-muted-foreground">
                    Conectividade via Garmin Connect
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Em Desenvolvimento</Badge>
                <Badge variant="outline">0 usuários</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Sincronização</CardTitle>
            <CardDescription>
              Gerencie como os dados são coletados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequência de Sincronização</label>
              <select className="w-full p-2 border rounded-md">
                <option>Em tempo real</option>
                <option>A cada 5 minutos</option>
                <option>A cada 15 minutos</option>
                <option>A cada hora</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Dados Coletados</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Frequência cardíaca</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Passos</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Calorias</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Sono</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">GPS</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Retenção de Dados</label>
              <select className="w-full p-2 border rounded-md">
                <option>30 dias</option>
                <option>90 dias</option>
                <option>1 ano</option>
                <option>Indefinido</option>
              </select>
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
