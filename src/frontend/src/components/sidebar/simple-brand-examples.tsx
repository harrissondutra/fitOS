// Exemplo de como customizar o SimpleBrand
// Este arquivo mostra diferentes formas de usar o componente SimpleBrand

import { SimpleBrand } from "@/components/sidebar/simple-brand"
import { Crown, Zap, Heart } from "lucide-react"

// Exemplo 1: Brand padrão para SUPER_ADMIN
export function SuperAdminBrand() {
  return (
    <SimpleBrand 
      userRole="SUPER_ADMIN"
      companyName="Academia Premium"
      companyPlan="Professional"
      showCompanyInfo={true}
    />
  )
}

// Exemplo 2: Brand customizado com ícone personalizado
export function CustomBrand() {
  return (
    <SimpleBrand 
      userRole="ADMIN"
      customIcon={Crown}
      customTitle="Meu Studio"
      customSubtitle="Administrador"
    />
  )
}

// Exemplo 3: Brand para personal trainer
export function PersonalTrainerBrand() {
  return (
    <SimpleBrand 
      userRole="TRAINER"
      customIcon={Zap}
      customTitle="João Personal"
      customSubtitle="Personal Trainer"
    />
  )
}

// Exemplo 4: Brand para academia com informações da empresa
export function GymBrand() {
  return (
    <SimpleBrand 
      userRole="ADMIN"
      companyName="Academia FitLife"
      companyPlan="Enterprise"
      showCompanyInfo={true}
      customIcon={Heart}
    />
  )
}

// Exemplo 5: Brand simples para membro
export function MemberBrand() {
  return (
    <SimpleBrand 
      userRole="MEMBER"
      customTitle="Minha Academia"
      customSubtitle="Membro"
    />
  )
}













