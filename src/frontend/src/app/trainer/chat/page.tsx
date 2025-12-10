'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Paperclip, Image } from 'lucide-react';
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

interface Conversation {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export default function TrainerChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Polling a cada 3s
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const conv = conversations.find(c => c.userId === selectedUserId);
      if (conv) setSelectedConversation(conv);
    }
  }, [selectedUserId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/trainer-chat/conversations');
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      const response = await api.get(`/api/trainer-chat/conversation/${selectedConversation.userId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await api.post('/api/trainer-chat/message', {
        receiverId: selectedConversation.userId,
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Conversas</h2>
        </div>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                selectedConversation?.userId === conv.userId ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={conv.user.image} />
                  <AvatarFallback>
                    {getInitials(conv.user.firstName, conv.user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {conv.user.firstName} {conv.user.lastName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="default">{conv.unreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation.user.image} />
                  <AvatarFallback>
                    {getInitials(selectedConversation.user.firstName, selectedConversation.user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-muted-foreground">Comece a conversa!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSender = msg.senderId === selectedConversation.userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSender ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-xs rounded-lg p-3 ${
                        isSender ? 'bg-muted' : 'bg-primary text-primary-foreground'
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
            <div className="p-4 border-t flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa selecionada</h3>
              <p className="text-muted-foreground">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

