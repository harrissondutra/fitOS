"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Cloud,
  Zap,
  Rocket,
  Mail,
  Smartphone,
  Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Provider {
  id: string;
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
  popular?: boolean;
  iconBg: string;
}

const providers: Provider[] = [
  {
    id: 'whatsapp-cloud',
    name: 'WhatsApp Business API (Cloud)',
    description: 'API oficial do WhatsApp com integração direta',
    Icon: Cloud,
    iconBg: 'bg-green-500',
    recommended: true,
  },
  {
    id: 'evolution-api',
    name: 'Evolution API',
    description: 'API WhatsApp Evolution - solução robusta',
    Icon: Smartphone,
    iconBg: 'bg-teal-600',
  },
  {
    id: 'evolution-go',
    name: 'Evolution Go',
    description: 'API WhatsApp Evolution Go - performance otimizada',
    Icon: Rocket,
    iconBg: 'bg-blue-500',
    popular: true,
  },
  {
    id: 'notificame',
    name: 'Notificame',
    description: 'Provedor WhatsApp brasileiro',
    Icon: Mail,
    iconBg: 'bg-purple-600',
  },
  {
    id: 'z-api',
    name: 'Z-API',
    description: 'API WhatsApp Z-API',
    Icon: Zap,
    iconBg: 'bg-green-600',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Twilio WhatsApp Business API',
    Icon: Phone,
    iconBg: 'bg-red-500',
  },
];

export default function SuperAdminWhatsAppPage() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Canal do WhatsApp</h1>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Conecte a oferecer suporte a seus clientes pelo WhatsApp
          </p>
        </div>
      </div>

      {/* Seleção de Provedor */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Provedor de API</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer hover:border-purple-500 transition-all duration-300 group relative overflow-hidden"
                onClick={() => handleProviderClick(provider)}
              >
                {/* Gradient overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className={`${provider.iconBg} p-3 rounded-lg text-white shrink-0`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <provider.Icon className="h-6 w-6" />
                    </motion.div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        {provider.recommended && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            <Badge className="bg-green-100 text-green-700 border-green-300" variant="outline">
                              Recomendado
                            </Badge>
                          </motion.div>
                        )}
                        {provider.popular && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300" variant="outline">
                              Popular
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {provider.description}
                      </CardDescription>
                    </div>
                    <motion.div
                      className="group-hover:translate-x-2 transition-transform duration-300"
                    >
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && (
                <div className={`${selectedProvider.iconBg} p-2 rounded-lg text-white`}>
                  <selectedProvider.Icon className="h-5 w-5" />
                </div>
              )}
              Configurar {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A configuração desta integração será implementada em breve.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
