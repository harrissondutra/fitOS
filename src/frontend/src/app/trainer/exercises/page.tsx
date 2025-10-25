'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseFilters } from '@/shared/types';
import { Search, Filter, Plus, Dumbbell, Target, Clock, Users } from 'lucide-react';

export default function TrainerExercisesPage() {
  const [filters, setFilters] = useState<ExerciseFilters>({
    search: '',
    category: '',
    muscleGroup: '',
    difficulty: '',
    equipment: '',
  });

  const { exercises, loading, error, refetch } = useExercises(filters);

  const handleFilterChange = (key: keyof ExerciseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      muscleGroup: '',
      difficulty: '',
      equipment: '',
    });
  };

  const strengthExercises = exercises?.filter(exercise => exercise.category === 'strength') || [];
  const cardioExercises = exercises?.filter(exercise => exercise.category === 'cardio') || [];
  const flexibilityExercises = exercises?.filter(exercise => exercise.category === 'flexibility') || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground">Browse and manage exercises for your workouts</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground">Browse and manage exercises for your workouts</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Error loading exercises</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          <p className="text-muted-foreground">Browse and manage exercises for your workouts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available exercises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strength</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strengthExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              Strength exercises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cardio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardioExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              Cardio exercises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flexibility</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flexibilityExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              Flexibility exercises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Muscle Group</label>
              <Select value={filters.muscleGroup || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, muscleGroup: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All muscles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All muscles</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="shoulders">Shoulders</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="full-body">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={filters.difficulty || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Exercises ({exercises?.length || 0})</TabsTrigger>
          <TabsTrigger value="strength">Strength ({strengthExercises.length})</TabsTrigger>
          <TabsTrigger value="cardio">Cardio ({cardioExercises.length})</TabsTrigger>
          <TabsTrigger value="flexibility">Flexibility ({flexibilityExercises.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {exercises && exercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.category || filters.muscleGroup || filters.difficulty
                      ? 'Try adjusting your filters to see more results.'
                      : 'No exercises available in the library.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strength" className="space-y-4">
          {strengthExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {strengthExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No strength exercises</h3>
                  <p className="text-muted-foreground">No strength exercises found with current filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cardio" className="space-y-4">
          {cardioExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cardioExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No cardio exercises</h3>
                  <p className="text-muted-foreground">No cardio exercises found with current filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flexibility" className="space-y-4">
          {flexibilityExercises.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {flexibilityExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No flexibility exercises</h3>
                  <p className="text-muted-foreground">No flexibility exercises found with current filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
