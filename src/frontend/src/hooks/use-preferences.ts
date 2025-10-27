"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface UserPreferences {
  id: string;
  userId: string;
  fitnessGoals: string[];
  preferredWorkoutTypes: string[];
  workoutDuration: string;
  intensityLevel: string;
  preferredWorkoutDays: string[];
  preferredWorkoutTime: string;
  dietaryRestrictions: string[];
  nutritionGoals: string[];
  preferredMusicGenres: string[];
  spotifyConnected: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: string;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
        toast.success('Preferências atualizadas com sucesso!');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erro ao atualizar preferências');
    } finally {
      setUpdating(false);
    }
  };

  return {
    preferences,
    loading,
    updating,
    updatePreferences,
    refetch: fetchPreferences
  };
}

