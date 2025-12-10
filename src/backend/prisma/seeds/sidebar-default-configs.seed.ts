import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultMenus = {
  starter: [
    // Core
    { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: 'BarChart3', module: 'core', isVisible: true, order: 0, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    
    // Training (TRAINER only)
    { id: 'clients', title: 'Clientes', url: '/trainer/clients', icon: 'Users', module: 'training', isVisible: true, order: 1, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'workouts', title: 'Treinos', url: '/trainer/workouts', icon: 'Target', module: 'training', isVisible: true, order: 2, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'exercises', title: 'Exercícios', url: '/trainer/exercises', icon: 'Dumbbell', module: 'training', isVisible: true, order: 3, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    
    // Scheduling
    { id: 'schedule', title: 'Agendamentos', url: '/schedule', icon: 'CalendarDays', module: 'scheduling', isVisible: true, order: 4, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    
    // Core
    { id: 'chat', title: 'Chat IA', url: '/trainer/chat', icon: 'MessageSquare', module: 'core', isVisible: true, order: 5, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    { id: 'profile', title: 'Perfil', url: '/settings/profile', icon: 'User', module: 'core', isVisible: true, order: 6 }
  ],
  
  professional: [
    // Core
    { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: 'BarChart3', module: 'core', isVisible: true, order: 0, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    
    // Training
    { id: 'clients', title: 'Clientes', url: '/trainer/clients', icon: 'Users', module: 'training', isVisible: true, order: 1, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'workouts', title: 'Treinos', url: '/trainer/workouts', icon: 'Target', module: 'training', isVisible: true, order: 2, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'exercises', title: 'Exercícios', url: '/trainer/exercises', icon: 'Dumbbell', module: 'training', isVisible: true, order: 3, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'assessments', title: 'Avaliações', url: '/trainer/assessments', icon: 'Stethoscope', module: 'training', isVisible: true, order: 4, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    
    // Nutrition (NUTRITIONIST only)
    { id: 'nutrition', title: 'Nutrição', url: '/nutritionist/dashboard', icon: 'Apple', module: 'nutrition', isVisible: true, order: 5, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'nutrition-clients', title: 'Clientes Nutrição', url: '/nutritionist/clients', icon: 'Users2', module: 'nutrition', isVisible: true, order: 6, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'meal-plans', title: 'Planos Alimentares', url: '/nutritionist/meal-plans', icon: 'UtensilsCrossed', module: 'nutrition', isVisible: true, order: 7, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'bioimpedance', title: 'Bioimpedância', url: '/nutritionist/bioimpedance', icon: 'Activity', module: 'nutrition', isVisible: true, order: 8, requiredFeature: 'biometricAnalysis', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    
    // Scheduling
    { id: 'schedule', title: 'Agendamentos', url: '/schedule', icon: 'CalendarDays', module: 'scheduling', isVisible: true, order: 9, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    
    // CRM
    { id: 'crm', title: 'CRM', url: '/crm', icon: 'MessageCircle', module: 'crm', isVisible: true, order: 10, requiredFeature: 'crmFeatures', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    
    // Communication
    { id: 'whatsapp', title: 'WhatsApp', url: '/whatsapp', icon: 'MessageSquare', module: 'communication', isVisible: true, order: 11, requiredFeature: 'whatsappIntegration', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    
    // Analytics
    { id: 'analytics', title: 'Analytics', url: '/analytics', icon: 'PieChart', module: 'analytics', isVisible: true, order: 12, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    
    // Core
    { id: 'chat', title: 'Chat IA', url: '/trainer/chat', icon: 'MessageSquare', module: 'core', isVisible: true, order: 13, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    { id: 'profile', title: 'Perfil', url: '/settings/profile', icon: 'User', module: 'core', isVisible: true, order: 14 }
  ],
  
  enterprise: [
    // Todos os menus do professional estão incluídos no array completo
    { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: 'BarChart3', module: 'core', isVisible: true, order: 0, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    { id: 'clients', title: 'Clientes', url: '/trainer/clients', icon: 'Users', module: 'training', isVisible: true, order: 1, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'workouts', title: 'Treinos', url: '/trainer/workouts', icon: 'Target', module: 'training', isVisible: true, order: 2, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'exercises', title: 'Exercícios', url: '/trainer/exercises', icon: 'Dumbbell', module: 'training', isVisible: true, order: 3, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'assessments', title: 'Avaliações', url: '/trainer/assessments', icon: 'Stethoscope', module: 'training', isVisible: true, order: 4, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'] },
    { id: 'nutrition', title: 'Nutrição', url: '/nutritionist/dashboard', icon: 'Apple', module: 'nutrition', isVisible: true, order: 5, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'nutrition-clients', title: 'Clientes Nutrição', url: '/nutritionist/clients', icon: 'Users2', module: 'nutrition', isVisible: true, order: 6, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'meal-plans', title: 'Planos Alimentares', url: '/nutritionist/meal-plans', icon: 'UtensilsCrossed', module: 'nutrition', isVisible: true, order: 7, requiredFeature: 'aiNutritionPlanning', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'bioimpedance', title: 'Bioimpedância', url: '/nutritionist/bioimpedance', icon: 'Activity', module: 'nutrition', isVisible: true, order: 8, requiredFeature: 'biometricAnalysis', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'] },
    { id: 'schedule', title: 'Agendamentos', url: '/schedule', icon: 'CalendarDays', module: 'scheduling', isVisible: true, order: 9, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    { id: 'crm', title: 'CRM', url: '/crm', icon: 'MessageCircle', module: 'crm', isVisible: true, order: 10, requiredFeature: 'crmFeatures', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { id: 'whatsapp', title: 'WhatsApp', url: '/whatsapp', icon: 'MessageSquare', module: 'communication', isVisible: true, order: 11, requiredFeature: 'whatsappIntegration', requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { id: 'analytics', title: 'Analytics', url: '/analytics', icon: 'PieChart', module: 'analytics', isVisible: true, order: 12, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { id: 'chat', title: 'Chat IA', url: '/trainer/chat', icon: 'MessageSquare', module: 'core', isVisible: true, order: 13, requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'NUTRITIONIST'] },
    { id: 'profile', title: 'Perfil', url: '/settings/profile', icon: 'User', module: 'core', isVisible: true, order: 14 },
    
    // Enterprise extras
    { id: 'marketplace', title: 'Marketplace', url: '/marketplace', icon: 'Store', module: 'marketplace', isVisible: true, order: 15 },
    { id: 'integrations', title: 'Integrações', url: '/integrations', icon: 'Zap', module: 'admin', isVisible: true, order: 16, requiredFeature: 'apiAccess', requiredRoles: ['SUPER_ADMIN', 'OWNER'] },
    { id: 'white-label', title: 'White Label', url: '/super-admin/white-label', icon: 'Palette', module: 'admin', isVisible: true, order: 17, requiredFeature: 'customBranding', requiredRoles: ['SUPER_ADMIN', 'OWNER'] }
  ]
};

export async function seedSidebarConfigs() {
  console.log('🎨 Seeding sidebar default configs...');
  
  for (const [plan, menus] of Object.entries(defaultMenus)) {
    try {
      const existing = await prisma.sidebarMenuConfig.findFirst({
        where: { plan, isActive: true }
      });
      
      if (!existing) {
        await prisma.sidebarMenuConfig.create({
          data: {
            plan,
            menuItems: menus as any,
            version: 1,
            isActive: true,
            changelog: 'Initial configuration'
          }
        });
        console.log(`✅ Created sidebar config for plan: ${plan} (${menus.length} menus)`);
      } else {
        // Atualizar config existente se estiver inativa ou se quisermos recriar
        console.log(`⏭️  Sidebar config already exists for plan: ${plan}, clearing and recreating...`);
        await prisma.sidebarMenuConfig.deleteMany({ where: { plan } });
        await prisma.sidebarMenuConfig.create({
          data: {
            plan,
            menuItems: menus as any,
            version: 1,
            isActive: true,
            changelog: 'Recreated configuration'
          }
        });
        console.log(`✅ Recreated sidebar config for plan: ${plan} (${menus.length} menus)`);
      }
    } catch (error) {
      console.error(`❌ Error seeding ${plan}:`, error);
    }
  }
  
  console.log('✅ Sidebar configs seeding completed');
}

// Executar se chamado diretamente
if (require.main === module) {
  seedSidebarConfigs()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}

