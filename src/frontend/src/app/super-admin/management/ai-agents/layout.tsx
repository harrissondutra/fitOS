"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ShieldX } from "lucide-react"
import { UserRoles } from '@/shared/types/auth.types';

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default function AIAgentsLayout({ children }: SuperAdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          router.push('/auth/login')
          return
        }

        // Verificar se o usuário é super admin
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          router.push('/auth/login')
          return
        }

        const result = await response.json()

        if (result.success && result.user?.role === UserRoles.SUPER_ADMIN) {
          setIsSuperAdmin(true)
        } else {
          setIsSuperAdmin(false)
        }
      } catch (error) {
        console.error('Error checking super admin access:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkSuperAdminAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Verificando permissões de acesso...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <ShieldX className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Acesso Negado</h2>
            <p className="text-sm text-muted-foreground text-center">
              Você não tem permissão para acessar esta área.
              Apenas super administradores podem gerenciar agentes de IA.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
