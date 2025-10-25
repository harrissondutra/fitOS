'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Activity, MessageSquare, Target, User, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
}

const activityTypes = [
  { value: 'all', label: 'Todas as Atividades' },
  { value: 'appointment', label: 'Agendamentos' },
  { value: 'bioimpedance', label: 'Bioimpedância' },
  { value: 'crm_interaction', label: 'Interações CRM' },
  { value: 'goal', label: 'Metas' },
  { value: 'comment', label: 'Comentários' },
];

const activityIcons = {
  appointment: Calendar,
  bioimpedance: Activity,
  crm_interaction: MessageSquare,
  goal: Target,
  comment: MessageSquare,
  default: Clock,
};

  const activityColors = {
    appointment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    bioimpedance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    crm_interaction: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    goal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    comment: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

export default function TimelinePage() {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'appointment' | 'bioimpedance' | 'crm_interaction' | 'goal' | 'comment'>('all');
  const [clientFilter, setMemberFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/timeline');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Erro ao buscar timeline:', error);
      toast.error('Erro ao carregar timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesType = filter === 'all' || activity.type === filter;
    const matchesMember = clientFilter === 'all' || activity.client.id === clientFilter;
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesMember && matchesSearch;
  });

  const groupedActivities = filteredActivities.reduce((acc: any, activity) => {
    const date = format(new Date(activity.createdAt), 'yyyy-MM-dd', { locale: ptBR });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});

  const getActivityIcon = (type: string) => {
    return activityIcons[type as keyof typeof activityIcons] || activityIcons.default;
  };

  const getActivityColor = (type: string) => {
    return activityColors[type as keyof typeof activityColors] || activityColors.default;
  };

  const getActivityTypeLabel = (type: string) => {
    return activityTypes.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeline de Atividades</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades dos clientes em ordem cronológica
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, descrição ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={clientFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {Array.from(new Set(activities.map(a => a.client.id))).map((clientId) => {
                  const client = activities.find(a => a.client.id === clientId)?.client;
                  return (
                    <SelectItem key={clientId} value={clientId}>
                      {client?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'As atividades dos clientes aparecerão aqui quando forem registradas.'
                  : `Nenhuma atividade do tipo "${getActivityTypeLabel(filter)}" encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.keys(groupedActivities)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">
                      {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                    </h2>
                  </div>
                  <Separator className="flex-1" />
                  <Badge variant="outline">
                    {groupedActivities[date].length} atividade{groupedActivities[date].length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Activities for this date */}
                <div className="space-y-3">
                  {groupedActivities[date]
                    .sort((a: TimelineActivity, b: TimelineActivity) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((activity: TimelineActivity) => {
                      const Icon = getActivityIcon(activity.type);
                      const colorClass = getActivityColor(activity.type);
                      
                      return (
                        <Card key={activity.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-full ${colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold">{activity.title}</h3>
                                      <Badge className={colorClass}>
                                        {getActivityTypeLabel(activity.type)}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {activity.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{activity.client.name}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          {format(new Date(activity.createdAt), 'HH:mm', { locale: ptBR })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Activity Data */}
                                {activity.data && Object.keys(activity.data).length > 0 && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-2">Detalhes:</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      {Object.entries(activity.data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="font-medium capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                                          </span>
                                          <span className="text-muted-foreground">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
