'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Calendar, User, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  appointment: {
    id: string;
    title: string;
    scheduledAt: string;
    client: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function CommentsPage() {
  const [comments, setComments] = useState<AppointmentComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingComment, setEditingComment] = useState<AppointmentComment | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'appointments'>('all');
  const [formData, setFormData] = useState({
    appointmentId: '',
    content: '',
  });

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointment-comments');
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingComment 
        ? `/api/appointment-comments/${editingComment.id}`
        : '/api/appointment-comments';
      
      const method = editingComment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingComment ? 'Comentário atualizado com sucesso!' : 'Comentário criado com sucesso!'
        );
        setShowCreateDialog(false);
        setEditingComment(null);
        resetForm();
        fetchComments();
      } else {
        throw new Error('Erro ao salvar comentário');
      }
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      toast.error('Erro ao salvar comentário');
    }
  };

  const handleEdit = (comment: AppointmentComment) => {
    setEditingComment(comment);
    setFormData({
      appointmentId: comment.appointment.id,
      content: comment.content,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      const response = await fetch(`/api/appointment-comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Comentário excluído com sucesso!');
        fetchComments();
      } else {
        throw new Error('Erro ao excluir comentário');
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast.error('Erro ao excluir comentário');
    }
  };

  const resetForm = () => {
    setFormData({
      appointmentId: '',
      content: '',
    });
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingComment(null);
    resetForm();
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'recent') {
      const commentDate = new Date(comment.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return commentDate >= weekAgo;
    }
    if (filter === 'appointments') {
      return comment.appointment.title.toLowerCase().includes('agendamento');
    }
    return true;
  });

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
          <h1 className="text-3xl font-bold">Comentários</h1>
          <p className="text-muted-foreground">
            Gerencie comentários e notas dos agendamentos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comentário
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{comments.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">
                  {comments.filter(c => {
                    const commentDate = new Date(c.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return commentDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(comments.map(c => c.appointment.id)).size}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos ({comments.length})
        </Button>
        <Button
          variant={filter === 'recent' ? 'default' : 'outline'}
          onClick={() => setFilter('recent')}
        >
          Recentes ({comments.filter(c => {
            const commentDate = new Date(c.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return commentDate >= weekAgo;
          }).length})
        </Button>
        <Button
          variant={filter === 'appointments' ? 'default' : 'outline'}
          onClick={() => setFilter('appointments')}
        >
          Agendamentos ({comments.filter(c => c.appointment.title.toLowerCase().includes('agendamento')).length})
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comentário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'recent' ? 'Nenhum comentário foi feito esta semana' :
                 filter === 'appointments' ? 'Nenhum comentário relacionado a agendamentos' :
                 'Os comentários aparecerão aqui quando forem criados'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Comentário
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{comment.user.name}</h3>
                          <Badge variant="outline">{comment.user.role}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(comment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(comment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pl-11">
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>

                  {/* Appointment Info */}
                  <div className="pl-11">
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{comment.appointment.title}</span>
                      <span>•</span>
                      <User className="h-4 w-4" />
                      <span>{comment.appointment.client.name}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(comment.appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComment ? 'Editar Comentário' : 'Criar Novo Comentário'}
            </DialogTitle>
            <DialogDescription>
              {editingComment 
                ? 'Atualize o conteúdo do comentário.'
                : 'Adicione um comentário ou nota para um agendamento.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentId">Agendamento *</Label>
              <Input
                id="appointmentId"
                value={formData.appointmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentId: e.target.value }))}
                placeholder="ID do agendamento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Comentário *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite seu comentário ou nota..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingComment ? 'Atualizar' : 'Criar'} Comentário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
