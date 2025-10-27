export const testData = {
  users: {
    nutritionist: {
      email: 'nutritionist@test.com',
      password: 'password123',
      name: 'Dr. Maria Silva',
      crn: 'CRN-12345'
    },
    client: {
      email: 'client@test.com',
      password: 'password123',
      name: 'João Silva',
      phone: '+5511999999999'
    },
    admin: {
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User'
    }
  },

  nutrition: {
    clients: [
      {
        name: 'Ana Costa',
        email: 'ana@test.com',
        phone: '+5511888888888',
        age: 30,
        weight: 70,
        height: 170,
        gender: 'female'
      },
      {
        name: 'Carlos Lima',
        email: 'carlos@test.com',
        phone: '+5511777777777',
        age: 35,
        weight: 80,
        height: 175,
        gender: 'male'
      }
    ],

    mealPlans: [
      {
        name: 'Plano de Perda de Peso',
        description: 'Plano para perda de peso saudável',
        calories: 1500,
        protein: 120,
        carbs: 150,
        fat: 50
      },
      {
        name: 'Plano de Ganho de Massa',
        description: 'Plano para ganho de massa muscular',
        calories: 2500,
        protein: 200,
        carbs: 250,
        fat: 80
      }
    ],

    foods: [
      {
        name: 'Arroz Branco',
        category: 'Cereais',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3
      },
      {
        name: 'Frango Grelhado',
        category: 'Carnes',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6
      },
      {
        name: 'Maçã',
        category: 'Frutas',
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2
      }
    ]
  },

  crm: {
    deals: [
      {
        title: 'Consultoria Nutricional Empresarial',
        client: 'TechCorp Ltda',
        value: 15000,
        stage: 'lead',
        priority: 'high',
        probability: 20
      },
      {
        title: 'Plano Nutricional Individual',
        client: 'João Silva',
        value: 2500,
        stage: 'qualified',
        priority: 'medium',
        probability: 60
      }
    ],

    pipelines: [
      {
        name: 'Pipeline Nutricional',
        description: 'Pipeline principal para consultas nutricionais',
        stages: ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado']
      }
    ],

    workflows: [
      {
        name: 'Follow-up de Leads',
        description: 'Automação para follow-up de leads não qualificados',
        status: 'active'
      }
    ]
  },

  whatsapp: {
    messages: [
      {
        to: '+5511999999999',
        body: 'Olá! Bem-vindo ao nosso programa nutricional.',
        status: 'delivered'
      },
      {
        to: '+5511888888888',
        body: 'Sua consulta está agendada para amanhã às 10:00.',
        status: 'read'
      }
    ],

    templates: [
      {
        name: 'welcome_message',
        category: 'UTILITY',
        language: 'pt_BR',
        status: 'APPROVED',
        body: 'Olá {{nome}}, bem-vindo ao nosso programa nutricional!'
      },
      {
        name: 'appointment_reminder',
        category: 'UTILITY',
        language: 'pt_BR',
        status: 'APPROVED',
        body: 'Sua consulta está agendada para {{data}} às {{hora}}.'
      }
    ]
  },

  marketing: {
    campaigns: [
      {
        name: 'Boas-vindas Novos Clientes',
        subject: 'Bem-vindo ao nosso programa nutricional!',
        type: 'welcome',
        audience: 'Novos Clientes',
        status: 'active'
      },
      {
        name: 'Lembrete de Consulta',
        subject: 'Sua consulta está chegando!',
        type: 'reminder',
        audience: 'Clientes com Consulta',
        status: 'scheduled'
      }
    ],

    templates: [
      {
        name: 'Template de Boas-vindas',
        category: 'Onboarding',
        description: 'Template para novos clientes',
        subject: 'Bem-vindo ao nosso programa nutricional!'
      },
      {
        name: 'Template de Lembrete',
        category: 'Agendamento',
        description: 'Template para lembretes de consulta',
        subject: 'Sua consulta está chegando!'
      }
    ]
  },

  api: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    endpoints: {
      auth: '/api/auth',
      nutrition: '/api/nutrition',
      crm: '/api/crm',
      whatsapp: '/api/whatsapp',
      marketing: '/api/marketing'
    }
  },

  testFiles: {
    image: 'test-files/test-image.jpg',
    document: 'test-files/test-document.pdf',
    template: 'test-files/test-template.html'
  },

  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000,
    veryLong: 30000
  },

  selectors: {
    loading: '[data-testid="loading"]',
    error: '[data-testid="error"]',
    success: '[data-testid="success"]',
    modal: '[data-testid="modal"]',
    toast: '[data-testid="toast"]',
    notification: '[data-testid="notification"]'
  }
};

