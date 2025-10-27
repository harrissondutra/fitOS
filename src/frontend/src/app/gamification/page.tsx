"use client";

import { useGamification } from "@/hooks/use-gamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Calendar, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";

export default function GamificationPage() {
  const { challenges, recommendedChallenges, badges, loading, joinChallenge } = useGamification();

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId);
  };

  if (loading && challenges.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gamificação</h1>
        <p className="text-muted-foreground">Participe de desafios e conquiste badges</p>
      </div>

      {/* Recommended Challenges */}
      {recommendedChallenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Desafios Recomendados para Você</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recommendedChallenges.map((challenge) => (
              <Card key={challenge.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{challenge.name}</CardTitle>
                      <CardDescription className="mt-2">{challenge.description}</CardDescription>
                    </div>
                    <Badge variant="default">{challenge.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(challenge.startDate).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline">{challenge.difficulty}</Badge>
                  </div>

                  <Button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="w-full"
                  >
                    Participar do Desafio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Desafios Ativos</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{challenge.name}</CardTitle>
                      <CardDescription className="mt-2">{challenge.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{challenge.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm text-muted-foreground">60%</span>
                    </div>
                    <Progress value={60} />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Termina em {new Date(challenge.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Seus Badges</CardTitle>
          </div>
          <CardDescription>Conquistas desbloqueadas</CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-2">
                  <div className="text-4xl">{badge.icon}</div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {badge.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Você ainda não conquistou nenhum badge
            </p>
          )}
        </CardContent>
      </Card>

      {challenges.length === 0 && recommendedChallenges.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Nenhum desafio disponível no momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

