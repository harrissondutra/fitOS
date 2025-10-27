# SimpleBrand Component

O `SimpleBrand` é um componente simples e customizável para o cabeçalho da sidebar, substituindo o complexo `TeamSwitcher`.

## Características

- ✅ **Simples e limpo** - Sem dropdowns complexos
- ✅ **Totalmente customizável** - Ícone, título e subtítulo personalizáveis
- ✅ **Responsivo** - Funciona em mobile e desktop
- ✅ **Baseado em role** - Adapta-se automaticamente ao role do usuário
- ✅ **Informações da empresa** - Opcionalmente mostra dados da empresa

## Props

```typescript
interface SimpleBrandProps {
  userRole?: string                    // Role do usuário (SUPER_ADMIN, ADMIN, etc.)
  companyName?: string                 // Nome da empresa
  companyPlan?: string                 // Plano da empresa
  showCompanyInfo?: boolean           // Se deve mostrar informações da empresa
  customIcon?: React.ComponentType    // Ícone customizado
  customTitle?: string                // Título customizado
  customSubtitle?: string             // Subtítulo customizado
}
```

## Exemplos de Uso

### 1. Brand Padrão (Automático)
```tsx
<SimpleBrand userRole="SUPER_ADMIN" />
// Mostra: FitOS + Sistema + ícone Building
```

### 2. Com Informações da Empresa
```tsx
<SimpleBrand 
  userRole="SUPER_ADMIN"
  companyName="Academia Premium"
  companyPlan="Professional"
  showCompanyInfo={true}
/>
// Mostra: FitOS + Academia Premium + Professional + ícone Building
```

### 3. Totalmente Customizado
```tsx
<SimpleBrand 
  userRole="ADMIN"
  customIcon={Crown}
  customTitle="Meu Studio"
  customSubtitle="Administrador"
/>
// Mostra: Meu Studio + Administrador + ícone Crown
```

### 4. Para Personal Trainer
```tsx
<SimpleBrand 
  userRole="TRAINER"
  customIcon={Zap}
  customTitle="João Personal"
  customSubtitle="Personal Trainer"
/>
// Mostra: João Personal + Personal Trainer + ícone Zap
```

## Comportamento por Role

| Role | Ícone Padrão | Título Padrão | Subtítulo Padrão |
|------|--------------|---------------|------------------|
| SUPER_ADMIN | Building | FitOS | Sistema |
| ADMIN | Command | FitOS | Administrador |
| TRAINER | Command | FitOS | Personal Trainer |
| MEMBER | Command | FitOS | Membro |

## Integração com AppSidebar

O componente já está integrado no `AppSidebar` e funciona automaticamente:

```tsx
<SimpleBrand 
  userRole={userRole}
  companyName={displayCompanies?.[0]?.name}
  companyPlan={displayCompanies?.[0]?.plan}
  showCompanyInfo={userRole === 'SUPER_ADMIN' && displayCompanies?.length > 0}
/>
```

## Vantagens sobre TeamSwitcher

- **Simplicidade**: Sem dropdowns complexos
- **Performance**: Menos JavaScript e re-renders
- **Customização**: Fácil de personalizar para cada caso
- **Manutenção**: Código mais limpo e fácil de manter
- **UX**: Interface mais limpa e direta

## Migração

Para migrar do `TeamSwitcher` para o `SimpleBrand`:

1. **Remover** imports do `TeamSwitcher` e `NavProjects`
2. **Adicionar** import do `SimpleBrand`
3. **Substituir** o componente no `SidebarHeader`
4. **Customizar** conforme necessário

O componente é totalmente compatível e não quebra funcionalidades existentes.
















