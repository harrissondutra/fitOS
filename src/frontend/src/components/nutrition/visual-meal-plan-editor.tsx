'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Clock,
  Target,
  Calculator,
  Zap,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets
} from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string;
  icon: any;
}

interface MealItem {
  id: string;
  food: FoodItem;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
}

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface VisualMealPlanEditorProps {
  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  macroTargets: MacroTargets;
  foodDatabase: FoodItem[];
}

export function VisualMealPlanEditor({
  meals,
  setMeals,
  macroTargets,
  foodDatabase
}: VisualMealPlanEditorProps) {
  const [draggedFood, setDraggedFood] = useState<FoodItem | null>(null);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dragging from food database to meal
    if (source.droppableId === 'food-database') {
      const food = foodDatabase.find(f => f.id === draggableId);
      if (food && destination.droppableId.startsWith('meal-')) {
        const mealId = destination.droppableId.replace('meal-', '');
        addFoodToMeal(mealId, food, 100); // Default 100g
      }
    }

    // If reordering within a meal
    if (source.droppableId === destination.droppableId && source.droppableId.startsWith('meal-')) {
      const mealId = source.droppableId.replace('meal-', '');
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        const newItems = Array.from(meal.items);
        const [removed] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, removed);
        
        const updatedMeal = {
          ...meal,
          items: newItems
        };
        
        setMeals(meals.map(m => m.id === mealId ? updatedMeal : m));
      }
    }
  };

  const addFoodToMeal = (mealId: string, food: FoodItem, quantity: number) => {
    const newItem: MealItem = {
      id: Date.now().toString(),
      food,
      quantity,
      calories: Math.round((food.calories * quantity) / 100),
      protein: Math.round((food.protein * quantity) / 100),
      carbs: Math.round((food.carbs * quantity) / 100),
      fat: Math.round((food.fat * quantity) / 100),
      fiber: Math.round((food.fiber * quantity) / 100)
    };

    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          items: [...meal.items, newItem]
        };
      }
      return meal;
    }));
  };

  const removeItemFromMeal = (mealId: string, itemId: string) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          items: meal.items.filter(item => item.id !== itemId)
        };
      }
      return meal;
    }));
  };

  const updateItemQuantity = (mealId: string, itemId: string, quantity: number) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          items: meal.items.map(item => {
            if (item.id === itemId) {
              const food = item.food;
              return {
                ...item,
                quantity,
                calories: Math.round((food.calories * quantity) / 100),
                protein: Math.round((food.protein * quantity) / 100),
                carbs: Math.round((food.carbs * quantity) / 100),
                fat: Math.round((food.fat * quantity) / 100),
                fiber: Math.round((food.fiber * quantity) / 100)
              };
            }
            return item;
          })
        };
      }
      return meal;
    }));
  };

  const calculateMealTotals = (meal: Meal) => {
    return meal.items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + item.fiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const calculateTotalMacros = () => {
    return meals.reduce((acc, meal) => {
      const mealTotals = calculateMealTotals(meal);
      return {
        calories: acc.calories + mealTotals.calories,
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat,
        fiber: acc.fiber + mealTotals.fiber
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const totals = calculateTotalMacros();

  const getMacroProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMacroStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 95 && percentage <= 105) return 'perfect';
    if (percentage >= 90 && percentage <= 110) return 'good';
    if (percentage >= 80 && percentage <= 120) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Macro Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Progresso dos Macros
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso em relação às metas definidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calorias</span>
                  <span className="text-sm">{totals.calories}/{macroTargets.calories}</span>
                </div>
                <Progress value={getMacroProgress(totals.calories, macroTargets.calories)} className="h-2" />
                <div className={`text-xs ${getStatusColor(getMacroStatus(totals.calories, macroTargets.calories))}`}>
                  {Math.round(getMacroProgress(totals.calories, macroTargets.calories))}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Proteína</span>
                  <span className="text-sm">{totals.protein}/{macroTargets.protein}g</span>
                </div>
                <Progress value={getMacroProgress(totals.protein, macroTargets.protein)} className="h-2" />
                <div className={`text-xs ${getStatusColor(getMacroStatus(totals.protein, macroTargets.protein))}`}>
                  {Math.round(getMacroProgress(totals.protein, macroTargets.protein))}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Carboidratos</span>
                  <span className="text-sm">{totals.carbs}/{macroTargets.carbs}g</span>
                </div>
                <Progress value={getMacroProgress(totals.carbs, macroTargets.carbs)} className="h-2" />
                <div className={`text-xs ${getStatusColor(getMacroStatus(totals.carbs, macroTargets.carbs))}`}>
                  {Math.round(getMacroProgress(totals.carbs, macroTargets.carbs))}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gorduras</span>
                  <span className="text-sm">{totals.fat}/{macroTargets.fat}g</span>
                </div>
                <Progress value={getMacroProgress(totals.fat, macroTargets.fat)} className="h-2" />
                <div className={`text-xs ${getStatusColor(getMacroStatus(totals.fat, macroTargets.fat))}`}>
                  {Math.round(getMacroProgress(totals.fat, macroTargets.fat))}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fibras</span>
                  <span className="text-sm">{totals.fiber}/{macroTargets.fiber}g</span>
                </div>
                <Progress value={getMacroProgress(totals.fiber, macroTargets.fiber)} className="h-2" />
                <div className={`text-xs ${getStatusColor(getMacroStatus(totals.fiber, macroTargets.fiber))}`}>
                  {Math.round(getMacroProgress(totals.fiber, macroTargets.fiber))}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Food Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Apple className="w-5 h-5 mr-2" />
              Base de Alimentos
            </CardTitle>
            <CardDescription>
              Arraste alimentos para as refeições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="food-database" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-wrap gap-2 min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  {foodDatabase.map((food, index) => (
                    <Draggable key={food.id} draggableId={food.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <food.icon className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="text-sm font-medium">{food.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {food.calories} kcal
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>

        {/* Meals */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => {
            const mealTotals = calculateMealTotals(meal);
            
            return (
              <Card key={meal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {meal.name}
                  </CardTitle>
                  <CardDescription>
                    {meal.time} • {meal.items.length} alimentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={`meal-${meal.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] p-2 border-2 border-dashed rounded-lg transition-colors ${
                          snapshot.isDraggingOver 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        {meal.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 bg-white border rounded-lg shadow-sm ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <item.food.icon className="w-4 h-4 text-gray-600" />
                                    <div>
                                      <div className="text-sm font-medium">{item.food.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.calories} kcal
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(meal.id, item.id, Number(e.target.value))}
                                      className="w-16 h-6 text-xs"
                                    />
                                    <span className="text-xs text-muted-foreground">g</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeItemFromMeal(meal.id, item.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {meal.items.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Arraste alimentos aqui
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                  
                  {meal.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Calorias:</span>
                          <span className="font-medium">{mealTotals.calories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Proteína:</span>
                          <span className="font-medium">{mealTotals.protein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carboidratos:</span>
                          <span className="font-medium">{mealTotals.carbs}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gorduras:</span>
                          <span className="font-medium">{mealTotals.fat}g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
