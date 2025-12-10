'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, User } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  attachments: string[];
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
    role: string;
  };
}

export default function ClientChatPage() {
  const [trainerInfo, setTrainerInfo] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrainerInfo();
    fetchMessages();
    
    // Polling para atualizar mensagens a cada 3 segundos
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTrainerInfo = async () => {
    try {
      // TODO: Buscar info do trainer
      setTrainerInfo({
        id: 'trainer-1',
        firstName: 'João',
        lastName: 'Silva',
        role: 'TRAINER'
      });
    } catch (error) {
      console.error('Error fetching trainer info:', error);
    }
  };

  const fetchMessages = async () => {
    if (!trainerInfo) return;

    try {
      const response = await api.get(`/api/trainer-chat/conversation/${trainerInfo.id}`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !trainerInfo) return;

    try {
      await api.post('/api/trainer-chat/message', {
        receiverId: trainerInfo.id,
        message: newMessage
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar mensagem');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!trainerInfo) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando informações do trainer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-muted/50">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          <User className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium">
            {trainerInfo.firstName} {trainerInfo.lastName}
          </p>
          <p className="text-sm text-muted-foreground">Seu Personal Trainer</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
            <p className="text-sm text-muted-foreground">
              Comece a conversa com seu trainer!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.senderId !== trainerInfo.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs rounded-lg p-3 ${
                  isSender 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p>{msg.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 bg-muted/50">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

