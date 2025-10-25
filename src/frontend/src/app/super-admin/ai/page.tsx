"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AIPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para o dashboard de IA
    router.replace('/super-admin/ai/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Redirecionando para o dashboard de IA...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
