'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Check,
  ArrowRight,
  Dumbbell,
  Brain,
  LineChart,
  ShieldCheck,
  Smartphone,
  Zap,
  Menu,
  X,
  Crown,
  Building,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  User,
  LogIn,
  ChevronDown,
  ArrowUp,
  Star
} from 'lucide-react';
import { usePlans } from '@/hooks/use-plans';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Imagens para o Hero Dinâmico
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop", // Gym Dark
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop", // Crossfit
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop", // Yoga/Sretching
  "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop"  // Runner/Tech
];

export default function HomePage() {
  const router = useRouter();
  const { plans: backendPlans, isLoading } = usePlans();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    setMounted(true);

    // Rotação automática do Hero
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInView = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Metadata para enriquecer os dados do backend
  const PLAN_METADATA: Record<string, any> = {
    individual: {
      icon: Zap,
      description: 'Para começar sua jornada fitness',
      limitations: ['Sem gestão de clientes', 'Sem CRM', 'Sem white-label'],
      cta: 'Começar Grátis',
      popular: false,
      order: 1
    },
    starter: {
      icon: Star,
      description: 'Perfeito para personal trainers',
      limitations: ['Sem domínio personalizado', 'Sem API'],
      cta: 'Escolher Starter',
      popular: false,
      order: 2
    },
    professional: {
      icon: Crown,
      description: 'Para academias em crescimento',
      limitations: [],
      cta: 'Escolher Professional',
      popular: true,
      order: 3
    },
    enterprise: {
      icon: Building,
      description: 'Para grandes redes',
      limitations: [],
      cta: 'Fale com Vendas',
      popular: false,
      order: 4
    }
  };

  const plans = backendPlans?.map(plan => {
    const metadata = PLAN_METADATA[plan.id] || {
      icon: Star,
      description: plan.name,
      limitations: [],
      cta: 'Escolher Plano',
      popular: false,
      order: 99
    };

    const price = typeof plan.price === 'object' && plan.price !== null
      ? plan.price
      : { monthly: Number(plan.price || 0), yearly: Number(plan.price || 0) * 12 * 0.8 };

    return {
      ...plan,
      ...metadata,
      price
    };
  }).sort((a: any, b: any) => (a.order || 99) - (b.order || 99)) || [];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden selection:bg-[#10B981] selection:text-white">

      {/* 
        HEADER FLUTUANTE (Apple Island Style) 
      */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl border border-white/20 shadow-lg shadow-black/5 rounded-[2rem] px-6 py-4 flex items-center justify-between"
        >
          {/* Logo Section - Fixed with standard img */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="relative h-8 w-auto">
              {/* Using standard img tag to guarantee rendering if Next/Image fails locally */}
              <img
                src="/images/logomarca.png"
                alt="FitOS Logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#1D1D1F]">FitOS</span>
          </div>

          {/* Desktop Links - Minimalist */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Recursos</NavLink>
            <NavLink href="#pricing">Preços</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </div>

          {/* Auth Actions - Pill Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#1D1D1F] hover:text-[#10B981] hover:bg-transparent font-medium text-[15px] px-4 transition-colors"
              onClick={() => router.push('/auth/login')}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-[#1D1D1F] hover:bg-[#10B981] text-white rounded-full px-6 py-5 text-[15px] font-medium shadow-md hover:shadow-lg hover:shadow-[#10B981]/20 transition-all hover:scale-[1.02]"
              onClick={() => router.push('/auth/signup')}
            >
              Criar Conta
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-[#1D1D1F]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay with Blur */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-4 right-4 z-40 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 border border-white/20 md:hidden origin-top"
          >
            <div className="flex flex-col space-y-2">
              <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Recursos</MobileNavLink>
              <MobileNavLink href="#pricing" onClick={() => setMobileMenuOpen(false)}>Preços</MobileNavLink>
              <MobileNavLink href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</MobileNavLink>
              <div className="h-px bg-gray-200 my-4"></div>
              <Button className="w-full bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-xl h-12" onClick={() => router.push('/auth/login')}>Entrar</Button>
              <Button className="w-full bg-[#10B981] text-white hover:bg-[#059669] rounded-xl h-12 mt-2" onClick={() => router.push('/auth/signup')}>Criar Conta</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        HERO SECTION - BOLD & OPTIMIZED LANDSCAPE
      */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 lg:max-w-xl flex-1 text-center lg:text-left"
            >
              <Badge variant="secondary" className="bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide uppercase mb-2 border border-[#10B981]/20">
                SISTEMA OPERACIONAL FITNESS
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#1D1D1F] leading-[1.0]">
                Treinos.<br />
                Inteligência.<br />
                <span className="text-[#10B981]">Evolução.</span>
              </h1>

              <p className="text-lg md:text-xl text-[#86868B] font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                A plataforma definitiva para quem leva saúde a sério. Simples, poderosa e incrivelmente eficiente.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-14 px-8 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-bold text-lg shadow-xl shadow-[#10B981]/30 transition-all hover:scale-[1.02]"
                  onClick={() => router.push('/auth/signup')}
                >
                  Criar Conta Gratuita
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 px-8 text-[#1D1D1F] hover:text-[#10B981] hover:bg-transparent text-lg font-medium group border-2 border-transparent hover:border-[#10B981]/10"
                  onClick={() => router.push('/demo')}
                >
                  Como funciona <span className="ml-1 group-hover:translate-x-1 transition-transform">›</span>
                </Button>
              </div>
            </motion.div>

            {/* Right Content - HORIZONTAL HERO IMAGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full lg:max-w-[640px] flex-1"
            >
              <div className="aspect-[16/10] rounded-[2rem] shadow-2xl bg-white overflow-hidden ring-1 ring-black/5 transform hover:scale-[1.01] transition-transform duration-700">
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={currentHeroIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={HERO_IMAGES[currentHeroIndex]}
                      alt="Hero Fitness"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </motion.div>
                </AnimatePresence>

                {/* Floating Widget - Smaller & Positioned */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-xl border border-white/50 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="text-[10px] md:text-xs text-[#86868B] font-bold uppercase tracking-wider mb-1">Status Atual</p>
                    <h3 className="text-lg md:text-xl font-bold text-[#1D1D1F]">Treino de Força</h3>

                    <div className="mt-2 h-1.5 w-full bg-[#E5E5EA] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
                        className="h-full bg-[#10B981]"
                      />
                    </div>
                  </div>
                  <div className="h-10 w-10 md:h-14 md:w-14 bg-[#10B981] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg shadow-[#10B981]/30">85%</div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator - Flow Position (No Overlap) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="w-full flex flex-col items-center gap-3 cursor-pointer group mt-16 lg:mt-24"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-xs font-semibold tracking-widest text-[#86868B] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
              Descubra mais
            </span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-[26px] h-[42px] rounded-full border-2 border-[#1D1D1F]/20 flex justify-center p-2 bg-white/50 backdrop-blur-sm group-hover:border-[#10B981]/50 transition-colors">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1 h-1.5 rounded-full bg-[#10B981]"
                />
              </div>
              <ChevronDown className="w-4 h-4 text-[#86868B] animate-bounce mt-1" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Features - Apple Grid Style */}
      <motion.section
        id="features"
        className="py-32 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div variants={fadeInView} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-4">Poderoso. Simples.</h2>
            <p className="text-xl text-[#86868B] font-medium">
              Tecnologia avançada envelopada em uma interface intuitiva.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-[#10B981]" />}
              title="Inteligência Artificial"
              description="Adaptação automática de cargas."
            />
            <FeatureCard
              icon={<LineChart className="h-8 w-8 text-[#10B981]" />}
              title="Analytics"
              description="Métricas precisas de volume."
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8 text-[#10B981]" />}
              title="Sempre com você"
              description="Funciona offline no seu iPhone."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-[#10B981]" />}
              title="Privado"
              description="Seus dados são criptografados."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-[#10B981]" />}
              title="Rápido"
              description="Zero latência, foco no treino."
            />
            <FeatureCard
              icon={<Dumbbell className="h-8 w-8 text-[#10B981]" />}
              title="Exercícios"
              description="Biblioteca visual em 4K."
            />
          </div>
        </div>
      </motion.section>

      {/* Pricing Section - Minimalist Cards */}
      <motion.section
        id="pricing"
        className="py-32 bg-[#F5F5F7]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div variants={fadeInView} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-6">Escolha o seu plano.</h2>

            {/* Minimalist Toggle */}
            <div className="bg-[#E5E5EA] p-1 rounded-full inline-flex items-center">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'}`}
              >
                Anual <span className="text-[#10B981] text-[10px] ml-1 font-bold">-17%</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = plan.price[billingCycle];

              return (
                <motion.div
                  variants={fadeInView}
                  key={plan.id}
                  className={`
                    relative flex flex-col p-6 rounded-[2rem] transition-all duration-300
                    ${plan.popular
                      ? 'bg-white shadow-2xl scale-105 z-10 ring-2 ring-[#10B981] border-transparent'
                      : 'bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white hover:shadow-xl hover:-translate-y-1'
                    }
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <div className="bg-[#10B981] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#10B981]/20 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Recomendado
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center mb-4
                      ${plan.popular ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-600'}
                    `}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#1D1D1F]">{plan.name}</h3>
                    <p className="text-sm text-[#86868B] font-medium leading-relaxed h-[40px]">{plan.description}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
                        {price === 0 ? 'Grátis' : `R$ ${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-[#86868B] font-medium text-sm">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-[#10B981]" strokeWidth={3} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`
                      w-full h-11 rounded-xl font-bold text-sm transition-all duration-300
                      ${plan.popular
                        ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg hover:shadow-[#10B981]/30'
                        : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-900 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => router.push(plan.id === 'enterprise' ? '/contact' : '/auth/signup')}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* FAQ - Clean & Simple */}
      <motion.section
        id="faq"
        className="py-32 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <motion.div variants={fadeInView} className="text-center mb-16">
            <h2 className="text-4xl font-semibold tracking-tight text-[#1D1D1F]">Perguntas frequentes.</h2>
          </motion.div>

          <motion.div variants={fadeInView}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-[#E5E5EA] py-2">
                <AccordionTrigger className="text-[#1D1D1F] hover:text-[#10B981] hover:no-underline text-lg font-medium">É gratuito?</AccordionTrigger>
                <AccordionContent className="text-[#86868B] text-base leading-relaxed pb-4">
                  Sim! O plano Starter é gratuito para sempre e oferece acesso aos recursos essenciais para você começar sua jornada fitness sem custo algum.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b border-[#E5E5EA] py-2">
                <AccordionTrigger className="text-[#1D1D1F] hover:text-[#10B981] hover:no-underline text-lg font-medium">Como funciona a IA?</AccordionTrigger>
                <AccordionContent className="text-[#86868B] text-base leading-relaxed pb-4">
                  Nossa Inteligência Artificial analisa seu histórico de treinos, recuperação e feedback para sugerir cargas ideais e progressões automáticas, garantindo que você esteja sempre evoluindo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b border-[#E5E5EA] py-2">
                <AccordionTrigger className="text-[#1D1D1F] hover:text-[#10B981] hover:no-underline text-lg font-medium">Posso cancelar a qualquer momento?</AccordionTrigger>
                <AccordionContent className="text-[#86868B] text-base leading-relaxed pb-4">
                  Com certeza. Não acreditamos em fidelidade forçada. Você pode cancelar ou alterar seu plano Pro ou Enterprise direto no painel do usuário a qualquer momento, sem multas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b border-[#E5E5EA] py-2">
                <AccordionTrigger className="text-[#1D1D1F] hover:text-[#10B981] hover:no-underline text-lg font-medium">Funciona em quais dispositivos?</AccordionTrigger>
                <AccordionContent className="text-[#86868B] text-base leading-relaxed pb-4">
                  O FitOS é uma plataforma web responsiva (PWA), o que significa que funciona perfeitamente em qualquer dispositivo com navegador moderno: iPhone, Android, iPad, Tablets e Desktop.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b border-[#E5E5EA] py-2">
                <AccordionTrigger className="text-[#1D1D1F] hover:text-[#10B981] hover:no-underline text-lg font-medium">Meus dados estão seguros?</AccordionTrigger>
                <AccordionContent className="text-[#86868B] text-base leading-relaxed pb-4">
                  Segurança é nossa prioridade. Utilizamos criptografia de ponta a ponta e seguimos rigorosamente a LGPD. Seus dados de saúde e pagamento nunca são compartilhados com terceiros.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer - Minimal */}
      <footer className="py-12 bg-[#F5F5F7] border-t border-[#E5E5EA]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
              <div className="relative h-8 w-auto">
                <img
                  src="/images/logomarca.png"
                  alt="FitOS"
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="text-xl font-semibold tracking-tight text-[#1D1D1F]">FitOS</span>
            </div>
            <div className="text-xs text-[#86868B]">
              Copyright © 2025 Sistudo sistemas. Todos os direitos reservados.
            </div>
            <div className="flex gap-4">
              <SocialBtn icon={<Twitter className="w-4 h-4" />} />
              <SocialBtn icon={<Instagram className="w-4 h-4" />} />
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 p-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Subcomponents ----

const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <a href={href} className="text-[13px] font-medium text-[#1D1D1F]/80 hover:text-[#10B981] transition-colors">
    {children}
  </a>
);

const MobileNavLink = ({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) => (
  <a href={href} onClick={onClick} className="block text-xl font-medium text-[#1D1D1F] py-3 border-b border-gray-100 last:border-0">
    {children}
  </a>
)

const SocialBtn = ({ icon }: { icon: React.ReactNode }) => (
  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#86868B] shadow-sm hover:scale-110 transition-transform cursor-pointer hover:text-[#10B981]">
    {icon}
  </div>
)

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 }
    }}
    className="p-8 bg-[#F5F5F7] rounded-[1.5rem] hover:bg-white hover:shadow-xl transition-all duration-500"
  >
    <div className="mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1">{title}</h3>
    <p className="text-sm text-[#86868B] font-medium leading-relaxed">{description}</p>
  </motion.div>
)
