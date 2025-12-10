import { useState, useEffect, useCallback } from 'react';

interface NutritionStats {
    calories: { consumed: number; target: number; percentage: number };
    protein: { consumed: number; target: number; percentage: number };
    carbs: { consumed: number; target: number; percentage: number };
    fat: { consumed: number; target: number; percentage: number };
    fiber: { consumed: number; target: number; percentage: number };
    water: { consumed: number; target: number; percentage: number };
}

interface ProgressData {
    weight: { current: number; start: number; target: number; change: number };
    bodyFat: { current: number; start: number; target: number; change: number };
    muscle: { current: number; start: number; target: number; change: number };
}

interface Meal {
    id: string;
    name: string;
    time: string;
    calories: number;
    foods: string[];
    status: 'completed' | 'pending';
}

interface UseNutritionReturn {
    todayStats: NutritionStats | null;
    progressData: ProgressData | null;
    recentMeals: Meal[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useNutrition(userId?: string): UseNutritionReturn {
    const [todayStats, setTodayStats] = useState<NutritionStats | null>(null);
    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNutritionData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split('T')[0];

            // Buscar dados do dia atual (food diary)
            const diaryResponse = await fetch(`/api/nutrition/food-diary?clientId=${userId}&date=${today}`, {
                credentials: 'include',
            });

            if (!diaryResponse.ok) {
                throw new Error('Failed to fetch nutrition data');
            }

            const diaryData = await diaryResponse.json();

            // Processar entradas do diário para calcular totais
            const entries = diaryData.data || [];
            const totals = entries.reduce((acc: any, entry: any) => {
                acc.calories += entry.calories || 0;
                acc.protein += entry.protein || 0;
                acc.carbs += entry.carbohydrates || 0;
                acc.fat += entry.fat || 0;
                acc.fiber += entry.fiber || 0;
                return acc;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

            // Buscar metas nutricionais
            const goalsResponse = await fetch(`/api/nutrition/goals?clientId=${userId}`, {
                credentials: 'include',
            });

            let goals = {
                calories: 2000,
                protein: 120,
                carbs: 200,
                fat: 70,
                fiber: 25,
                water: 2500
            };

            if (goalsResponse.ok) {
                const goalsData = await goalsResponse.json();
                if (goalsData.data && goalsData.data.length > 0) {
                    const activeGoal = goalsData.data[0];
                    goals = {
                        calories: activeGoal.caloriesTarget || goals.calories,
                        protein: activeGoal.proteinTarget || goals.protein,
                        carbs: activeGoal.carbsTarget || goals.carbs,
                        fat: activeGoal.fatTarget || goals.fat,
                        fiber: activeGoal.fiberTarget || goals.fiber,
                        water: activeGoal.waterTarget || goals.water
                    };
                }
            }

            // Calcular percentagens
            const stats: NutritionStats = {
                calories: {
                    consumed: totals.calories,
                    target: goals.calories,
                    percentage: Math.round((totals.calories / goals.calories) * 100)
                },
                protein: {
                    consumed: totals.protein,
                    target: goals.protein,
                    percentage: Math.round((totals.protein / goals.protein) * 100)
                },
                carbs: {
                    consumed: totals.carbs,
                    target: goals.carbs,
                    percentage: Math.round((totals.carbs / goals.carbs) * 100)
                },
                fat: {
                    consumed: totals.fat,
                    target: goals.fat,
                    percentage: Math.round((totals.fat / goals.fat) * 100)
                },
                fiber: {
                    consumed: totals.fiber,
                    target: goals.fiber,
                    percentage: Math.round((totals.fiber / goals.fiber) * 100)
                },
                water: {
                    consumed: 0, // TODO: adicionar tracking de água
                    target: goals.water,
                    percentage: 0
                }
            };

            setTodayStats(stats);

            // Buscar dados de progresso (peso, gordura, músculo) do analytics
            const analyticsResponse = await fetch(`/api/analytics/member/${userId}`, {
                credentials: 'include',
            });

            if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                const progress = analyticsData.data;

                setProgressData({
                    weight: {
                        current: progress?.currentWeight || 0,
                        start: progress?.startWeight || 0,
                        target: progress?.goalWeight || 0,
                        change: (progress?.currentWeight || 0) - (progress?.startWeight || 0)
                    },
                    bodyFat: {
                        current: progress?.currentBodyFat || 0,
                        start: progress?.startBodyFat || 0,
                        target: progress?.goalBodyFat || 0,
                        change: (progress?.currentBodyFat || 0) - (progress?.startBodyFat || 0)
                    },
                    muscle: {
                        current: progress?.currentMuscleMass || 0,
                        start: progress?.startMuscleMass || 0,
                        target: progress?.goalMuscleMass || 0,
                        change: (progress?.currentMuscleMass || 0) - (progress?.startMuscleMass || 0)
                    }
                });
            }

            // Agrupar entradas do diário por refeição
            const mealsMap = new Map<string, any>();
            entries.forEach((entry: any) => {
                const mealName = entry.mealType || 'Outros';
                if (!mealsMap.has(mealName)) {
                    mealsMap.set(mealName, {
                        id: entry.id,
                        name: mealName,
                        time: new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        calories: 0,
                        foods: [],
                        status: 'completed' as const
                    });
                }
                const meal = mealsMap.get(mealName);
                meal.calories += entry.calories || 0;
                meal.foods.push(entry.foodName || entry.name);
            });

            setRecentMeals(Array.from(mealsMap.values()));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching nutrition data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchNutritionData();
        }
    }, [userId, fetchNutritionData]);

    return {
        todayStats,
        progressData,
        recentMeals,
        loading,
        error,
        refetch: fetchNutritionData,
    };
}
