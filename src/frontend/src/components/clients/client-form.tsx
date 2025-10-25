'use client';

import { useState } from 'react';
import { useForm } from '@/hooks/use-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientFormData, Client, User } from '@/shared/types';
import { X, Plus, Save, Loader2, User as UserIcon } from 'lucide-react';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ClientForm({ client, onSubmit, onCancel, loading = false }: ClientFormProps) {
  // Auth removed - using default values
  const user = { role: 'ADMIN' as const };
  const [goals, setGoals] = useState<string[]>(
    client?.goals || []
  );
  const [newGoal, setNewGoal] = useState('');

  const { values, setValuesCustom, errors, setErrors, handleSubmit, isSubmitting } = useForm<ClientFormData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    status: client?.status || 'active',
    membershipType: client?.membershipType || 'basic',
    goals: client?.goals || [],
    biometricData: client?.biometricData || {},
    userId: client?.userId || '',
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      await onSubmit({
        ...data,
        goals,
      });
    } catch (error) {
      console.error('Error submitting client:', error);
    }
  };

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      const updated = [...goals, newGoal.trim()];
      setGoals(updated);
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    const updated = goals.filter((_, i) => i !== index);
    setGoals(updated);
  };

  const goalCategories = [
    'Weight Loss',
    'Muscle Gain',
    'Strength Training',
    'Cardio Fitness',
    'Flexibility',
    'Sports Performance',
    'General Health',
    'Rehabilitation',
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {client ? 'Edit Member' : 'Add New Member'}
        </CardTitle>
        <CardDescription>
          {client ? 'Update client information and goals' : 'Add a new client to your organization'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValuesCustom({ name: e.target.value })}
                placeholder="e.g., John Doe"
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValuesCustom({ email: e.target.value })}
                placeholder="john@example.com"
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => setValuesCustom({ phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => setValuesCustom({ status: value as 'active' | 'inactive' | 'suspended' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={values.membershipType}
              onValueChange={(value) => setValuesCustom({ membershipType: value as 'basic' | 'premium' | 'vip' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select clientship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label>Fitness Goals</Label>
            <div className="flex gap-2">
              <Select value={newGoal} onValueChange={setNewGoal}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goalCategories.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addGoal} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {goals.map((goal, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {goal}
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="biometricData">Biometric Data</Label>
            <Textarea
              id="biometricData"
              value={JSON.stringify(values.biometricData || {})}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setValuesCustom({ biometricData: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder="Enter biometric data as JSON..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {client ? 'Update Member' : 'Add Member'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
