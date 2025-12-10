'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Video, 
  Phone,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Star,
  FileText,
  Users,
  Camera,
  Mic,
  Send,
  Download
} from 'lucide-react';

export default function ConsultationsPage() {
  const upcomingConsultations = [
    {
      id: 1,
      type: "Consulta de Acompanhamento",
      nutritionist: "Dra. Maria Silva",
      date: "Amanhã",
      time: "14:00",
      duration: 45,
      status: "confirmed",
      platform: "Videochamada",
      notes: "Avaliação de progresso e ajuste do plano alimentar"
    },
    {
      id: 2,
      type: "Consulta Nutricional",
      nutritionist: "Dra. Maria Silva",
      date: "Próxima semana",
      time: "16:00",
      duration: 60,
      status: "scheduled",
      platform: "Presencial",
      notes: "Primeira consulta após 4 semanas de acompanhamento"
    }
  ];

  const pastConsultations = [
    {
      id: 1,
      type: "Primeira Consulta",
      nutritionist: "Dra. Maria Silva",
      date: "15/01/2024",
      time: "14:00",
      duration: 60,
      status: "completed",
      platform: "Presencial",
      rating: 5,
      summary: "Anamnese completa, avaliação inicial e criação do plano alimentar personalizado",
      recommendations: [
        "Iniciar plano alimentar de 2000kcal",
        "Fazer 5 refeições por dia",
        "Beber 2.5L de água diariamente",
        "Próxima consulta em 2 semanas"
      ]
    },
    {
      id: 2,
      type: "Follow-up",
      nutritionist: "Dra. Maria Silva",
      date: "29/01/2024",
      time: "15:00",
      duration: 45,
      status: "completed",
      platform: "Videochamada",
      rating: 5,
      summary: "Avaliação de progresso, ajustes no plano e orientações sobre suplementação",
      recommendations: [
        "Aumentar consumo de proteínas",
        "Adicionar suplemento de vitamina D",
        "Manter hidratação adequada",
        "Próxima consulta em 2 semanas"
      ]
    },
    {
      id: 3,
      type: "Consulta de Emergência",
      nutritionist: "Dra. Maria Silva",
      date: "12/02/2024",
      time: "10:00",
      duration: 30,
      status: "completed",
      platform: "Videochamada",
      rating: 4,
      summary: "Dúvidas sobre substituições alimentares e ajustes no plano",
      recommendations: [
        "Substituir arroz branco por integral",
        "Adicionar mais vegetais no jantar",
        "Manter horários das refeições"
      ]
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "Dra. Maria Silva",
      message: "Olá! Como está se sentindo com o novo plano alimentar?",
      timestamp: "10:30",
      read: true
    },
    {
      id: 2,
      sender: "Você",
      message: "Está indo muito bem! Estou conseguindo seguir todas as refeições.",
      timestamp: "10:35",
      read: true
    },
    {
      id: 3,
      sender: "Dra. Maria Silva",
      message: "Que ótimo! Lembre-se de beber bastante água ao longo do dia. Nos vemos amanhã na consulta!",
      timestamp: "10:40",
      read: false
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmada</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Agendada</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Videochamada':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'Presencial':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'Telefone':
        return <Phone className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas e comunicação com sua nutricionista
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Consultas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingConsultations.length}</div>
            <p className="text-xs text-muted-foreground">
              Consultas agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastConsultations.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de consultas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Baseado em {pastConsultations.length} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.filter(m => !m.read).length}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="schedule">Agendar</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
              <CardDescription>
                Suas consultas agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingConsultations.map((consultation) => (
                  <div key={consultation.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getPlatformIcon(consultation.platform)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{consultation.type}</h3>
                        {getStatusBadge(consultation.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {consultation.nutritionist} • {consultation.platform}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {consultation.date} às {consultation.time} • {consultation.duration} min
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {consultation.notes}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consultas</CardTitle>
              <CardDescription>
                Suas consultas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastConsultations.map((consultation) => (
                  <div key={consultation.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(consultation.platform)}
                        <div>
                          <h3 className="font-semibold">{consultation.type}</h3>
                          <div className="text-sm text-muted-foreground">
                            {consultation.nutritionist} • {consultation.date} às {consultation.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{consultation.rating}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium">Resumo:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.summary}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium">Recomendações:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {consultation.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversa com Nutricionista</CardTitle>
              <CardDescription>
                Sua comunicação direta com Dra. Maria Silva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'Você' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-lg ${
                      message.sender === 'Você' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm font-medium mb-1">{message.sender}</div>
                      <div className="text-sm">{message.message}</div>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'Você' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Input placeholder="Digite sua mensagem..." className="flex-1" />
                  <Button size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendar Nova Consulta</CardTitle>
              <CardDescription>
                Escolha o melhor horário para sua consulta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Consulta</Label>
                    <Select defaultValue="acompanhamento">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acompanhamento">Consulta de Acompanhamento</SelectItem>
                        <SelectItem value="nutricional">Consulta Nutricional</SelectItem>
                        <SelectItem value="emergencia">Consulta de Emergência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Modalidade</Label>
                    <Select defaultValue="presencial">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="video">Videochamada</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data</Label>
                    <Input type="date" className="w-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Horário</Label>
                    <Select defaultValue="14:00">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Observações</Label>
                  <Textarea 
                    className="w-full h-20" 
                    placeholder="Descreva o motivo da consulta ou suas principais dúvidas..."
                  />
                </div>
                
                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Consulta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2 text-blue-600" />
              Consulta Online
            </CardTitle>
            <CardDescription>
              Inicie uma consulta por videochamada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Iniciar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Relatório Semanal
            </CardTitle>
            <CardDescription>
              Envie seu relatório de progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Enviar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-purple-600" />
              Baixar Receitas
            </CardTitle>
            <CardDescription>
              Receitas personalizadas do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Baixar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


