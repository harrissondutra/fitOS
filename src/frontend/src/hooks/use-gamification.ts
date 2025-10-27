"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  difficulty: string;
  active: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  earnedAt?: string;
}

export function useGamification() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [recommendedChallenges, setRecommendedChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/challenges');
      
      if (!response.ok) throw new Error('Failed to fetch challenges');
      
      const data = await response.json();
      if (data.success) {
        setChallenges(data.data);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Erro ao carregar desafios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/challenges/recommended');
      
      if (!response.ok) throw new Error('Failed to fetch recommended challenges');
      
      const data = await response.json();
      if (data.success) {
        setRecommendedChallenges(data.data);
      }
    } catch (error) {
      console.error('Error fetching recommended challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async (userId: string) => {
    try {
      const response = await fetch(`/api/gamification/users/${userId}/badges`);
      
      if (!response.ok) throw new Error('Failed to fetch badges');
      
      const data = await response.json();
      if (data.success) {
        setBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/gamification/challenges/${challengeId}/join`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to join challenge');

      const data = await response.json();
      
      if (data.success) {
        toast.success('Você entrou no desafio!');
        await fetchChallenges();
        return true;
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Erro ao entrar no desafio');
      return false;
    }
  };

  const updateProgress = async (challengeId: string, progress: any) => {
    try {
      const response = await fetch(`/api/gamification/challenges/${challengeId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });

      if (!response.ok) throw new Error('Failed to update progress');

      const data = await response.json();
      
      if (data.success) {
        toast.success('Progresso atualizado!');
        await fetchChallenges();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchRecommendedChallenges();
  }, []);

  return {
    challenges,
    recommendedChallenges,
    badges,
    loading,
    joinChallenge,
    updateProgress,
    fetchBadges,
    refetchChallenges: fetchChallenges
  };
}

