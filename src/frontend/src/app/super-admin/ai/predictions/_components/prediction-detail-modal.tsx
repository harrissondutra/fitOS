"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Copy, Check, Calendar, User, Brain, Target, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AiServiceType, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"

interface PredictionExecution {
  id: string
  modelId: string
  tenantId: string
  userId?: string
  inputData: Record<string, any>
  prediction: any
  confidence?: number
  actualResult?: any
  accuracy?: number
  executedAt: string
  model?: {
    id: string
    serviceType: string
    modelName: string
    version: string
  }
}

interface PredictionDetailModalProps {
  execution: PredictionExecution | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PredictionDetailModal({ execution, open, onOpenChange }: PredictionDetailModalProps) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!execution) return null

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      toast.success("Copiado!")
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      toast.error("Erro ao copiar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Detalhes da Predição
          </DialogTitle>
          <DialogDescription>
            ID: {execution.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-4">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tipo de Serviço:</span>
                  </div>
                  <Badge variant="outline">
                    {AI_SERVICE_DISPLAY_NAMES[execution.model?.serviceType as AiServiceType] || execution.model?.serviceType}
                  </Badge>
                </div>
                
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Modelo:</span>
                  </div>
                  <span className="text-sm">{execution.model?.modelName || "N/A"}</span>
                </div>

                {execution.confidence !== null && execution.confidence !== undefined && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Confiança:</span>
                      </div>
                      <Badge variant={execution.confidence > 0.8 ? "default" : execution.confidence > 0.5 ? "secondary" : "destructive"}>
                        {(execution.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </>
                )}

                {execution.accuracy !== null && execution.accuracy !== undefined && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Acurácia:</span>
                      </div>
                      <Badge variant={execution.accuracy > 0.8 ? "default" : execution.accuracy > 0.5 ? "secondary" : "destructive"}>
                        {(execution.accuracy * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Executado em:</span>
                  </div>
                  <span className="text-sm">{new Date(execution.executedAt).toLocaleString('pt-BR')}</span>
                </div>

                {execution.userId && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Usuário:</span>
                      </div>
                      <span className="text-sm font-mono">{execution.userId}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dados de Entrada */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Dados de Entrada</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(execution.inputData, null, 2), 'input')}
                >
                  {copied === 'input' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify(execution.inputData, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Predição */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Resultado da Predição</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(execution.prediction, null, 2), 'prediction')}
                >
                  {copied === 'prediction' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify(execution.prediction, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Resultado Real (se disponível) */}
            {execution.actualResult && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Resultado Real</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(execution.actualResult, null, 2), 'actual')}
                  >
                    {copied === 'actual' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
                    {JSON.stringify(execution.actualResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}



