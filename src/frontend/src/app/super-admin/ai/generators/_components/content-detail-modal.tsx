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
import { Copy, Check, Calendar, User, Sparkles, Star, Server } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AiServiceType, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"

interface GeneratedContent {
  id: string
  serviceType: string
  tenantId: string
  userId?: string
  providerId?: string
  model?: string
  input: Record<string, any>
  output: any
  metadata: Record<string, any>
  quality?: number
  feedback?: any
  createdAt: string
  updatedAt: string
  provider?: {
    id: string
    displayName: string
    provider: string
  }
}

interface ContentDetailModalProps {
  content: GeneratedContent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContentDetailModal({ content, open, onOpenChange }: ContentDetailModalProps) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!content) return null

  const handleCopy = async (text: string, id: string) => {
    try {
      const textToCopy = typeof text === 'string' ? text : JSON.stringify(text, null, 2)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(id)
      toast.success("Copiado!")
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      toast.error("Erro ao copiar")
    }
  }

  const outputText = typeof content.output === 'string' 
    ? content.output 
    : JSON.stringify(content.output, null, 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Detalhes do Conteúdo Gerado
          </DialogTitle>
          <DialogDescription>
            ID: {content.id}
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
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tipo de Serviço:</span>
                  </div>
                  <Badge variant="outline">
                    {AI_SERVICE_DISPLAY_NAMES[content.serviceType as AiServiceType] || content.serviceType}
                  </Badge>
                </div>
                
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Modelo:</span>
                  </div>
                  <span className="text-sm">{content.model || "N/A"}</span>
                </div>

                {content.provider && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Provedor:</span>
                      </div>
                      <span className="text-sm">{content.provider.displayName}</span>
                    </div>
                  </>
                )}

                {content.quality !== null && content.quality !== undefined && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Qualidade:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < content.quality!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">({content.quality.toFixed(1)})</span>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Criado em:</span>
                  </div>
                  <span className="text-sm">{new Date(content.createdAt).toLocaleString('pt-BR')}</span>
                </div>

                {content.userId && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Usuário:</span>
                      </div>
                      <span className="text-sm font-mono">{content.userId}</span>
                    </div>
                  </>
                )}

                {content.metadata?.responseTime && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tempo de Resposta:</span>
                      <span className="text-sm">{content.metadata.responseTime}ms</span>
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
                  onClick={() => handleCopy(content.input, 'input')}
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
                  {JSON.stringify(content.input, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Conteúdo Gerado */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Conteúdo Gerado</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(content.output, 'output')}
                >
                  {copied === 'output' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {typeof content.output === 'string' ? (
                  <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                    {content.output}
                  </div>
                ) : (
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
                    {JSON.stringify(content.output, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Feedback (se disponível) */}
            {content.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
                    {JSON.stringify(content.feedback, null, 2)}
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



