"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AIServicesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a aba de serviços da página de AI Agents
    router.replace('/super-admin/management/ai-agents?tab=services')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Redirecionando para gerenciamento de serviços...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
