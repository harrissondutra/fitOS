'use client';

// Desabilitar pre-rendering estático para esta página

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { 
  Dumbbell, 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  ArrowRight,
  Play,
  Star
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const features = [
    {
      icon: Brain,
      title: 'Personal Trainer IA',
      description: 'Receba recomendações de treinos personalizadas alimentadas por IA avançada',
      color: 'text-blue-500',
    },
    {
      icon: Dumbbell,
      title: 'Treinos Inteligentes',
      description: 'Programas de treino adaptativos que evoluem com seu progresso',
      color: 'text-green-500',
    },
    {
      icon: Users,
      title: 'Multi-Inquilino',
      description: 'Perfeito para academias, personal trainers e comunidades fitness',
      color: 'text-purple-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Insights abrangentes sobre sua jornada fitness',
      color: 'text-orange-500',
    },
    {
      icon: Zap,
      title: 'Tempo Real',
      description: 'Atualizações ao vivo e feedback instantâneo durante os treinos',
      color: 'text-yellow-500',
    },
    {
      icon: Shield,
      title: 'Auto-hospedado',
      description: 'Privacidade total dos dados com zero dependências externas',
      color: 'text-red-500',
    },
  ];

  const stats = [
    { label: 'Usuários Ativos', value: '10K+' },
    { label: 'Treinos Criados', value: '50K+' },
    { label: 'Interações IA', value: '1M+' },
    { label: 'Academias Conectadas', value: '500+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">FitOS</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Recursos
              </a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                Sobre
              </a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contato
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                  Entrar
                </Button>
                <Button onClick={() => router.push('/auth/register')}>
                  Começar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Fitness workout background"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-4">
            🚀 Agora com treinamento alimentado por IA
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            O Futuro do Fitness
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            FitOS é o primeiro sistema operacional de fitness auto-hospedado do mundo com personal trainer IA, 
            arquitetura multi-inquilino e zero dependências externas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => router.push('/auth/register')}>
              <Play className="mr-2 h-5 w-5" />
              Começar Teste Grátis
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/demo')}>
              <Star className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para fitness moderno
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Construído com tecnologia de ponta e projetado para escalabilidade, 
              privacidade e performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-muted ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fitness Images Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transforme sua vida fitness
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Veja como nossa plataforma pode revolucionar sua jornada de treino
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Mulher fazendo exercícios na academia"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Homem levantando peso na academia"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Exercícios funcionais ao ar livre"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Fitness motivation background"
            fill
            className="object-cover opacity-10"
          />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua jornada fitness?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já estão experimentando o futuro do fitness com o FitOS.
          </p>
          <Button size="lg" onClick={() => router.push('/auth/register')}>
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">FitOS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FitOS. Todos os direitos reservados. Construído com ❤️ para a comunidade fitness.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
