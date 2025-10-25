import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client } from '@/shared/types';
import { 
  User, 
  Calendar, 
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onAssignTrainer?: (client: Client) => void;
  onUnassignTrainer?: (client: Client) => void;
  showActions?: boolean;
}

export function ClientCard({ 
  client, 
  onEdit, 
  onDelete, 
  onAssignTrainer,
  onUnassignTrainer,
  showActions = true 
}: ClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'standard':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'basic':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-none dark:hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{client.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {client.email} • {client.phone || 'No phone'}
              </CardDescription>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onAssignTrainer && (
                  <DropdownMenuItem onClick={() => onAssignTrainer(client)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Trainer
                  </DropdownMenuItem>
                )}
                {onUnassignTrainer && client.trainers && client.trainers.length > 0 && (
                  <DropdownMenuItem onClick={() => onUnassignTrainer(client)}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Unassign Trainer
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(client)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
          <Badge variant="outline" className={getMembershipTypeColor(client.membershipType)}>
            {client.membershipType}
          </Badge>
        </div>
        
        {client.goals && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Goals:</h4>
            <div className="text-sm text-muted-foreground">
              {typeof client.goals === 'string' ? client.goals : 'Goals set'}
            </div>
          </div>
        )}
        
        {client.trainers && client.trainers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Trainers:</h4>
            <div className="flex flex-wrap gap-1">
              {client.trainers.slice(0, 2).map((trainer, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {trainer.trainer.firstName} {trainer.trainer.lastName}
                </Badge>
              ))}
              {client.trainers.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{client.trainers.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
