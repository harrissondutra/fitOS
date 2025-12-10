'use client';

/**
 * Food Search Dialog - FitOS Sprint 7
 * 
 * Componente para buscar e adicionar alimentos da base TBCA/TACO
 * Usa shadcn/ui: Dialog, Input, ScrollArea, Button, Badge
 */

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  baseUnit: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, quantity: number, unit: string) => void;
  mealType?: string;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche'
};

export function FoodSearchDialog({ open, onClose, onSelectFood, mealType }: Props) {
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  // Search foods
  const { data, error, isLoading } = useSWR(
    search.length >= 2 
      ? `/api/nutrition/foods/search?q=${encodeURIComponent(search)}&limit=50`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  );

  const foods = data?.data || [];

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedFood(null);
      setQuantity(100);
      setUnit('g');
    }
  }, [open]);

  const handleAdd = () => {
    if (!selectedFood) {
      toast.error('Selecione um alimento');
      return;
    }

    onSelectFood(selectedFood, quantity, unit);
    onClose();
    toast.success(`${selectedFood.name} adicionado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Adicionar Alimento {mealType && `- ${mealTypeLabels[mealType]}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar na base TBCA/TACO (min 2 caracteres)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {search.length < 2 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Buscando alimentos...
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center text-sm text-destructive py-4">
              Erro ao buscar alimentos. Tente novamente.
            </div>
          )}

          {/* Food List */}
          {search.length >= 2 && !isLoading && !error && (
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {foods.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Nenhum alimento encontrado para "{search}"
                  </div>
                ) : (
                  foods.map((food: FoodItem) => (
                    <div
                      key={food.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFood?.id === food.id
                          ? 'bg-accent border-primary'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedFood(food)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{food.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(food.calories)} kcal
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>P: {food.protein.toFixed(1)}g</span>
                        <span>C: {food.carbs.toFixed(1)}g</span>
                        <span>G: {food.fat.toFixed(1)}g</span>
                        {food.fiber && (
                          <span>F: {food.fiber.toFixed(1)}g</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Selected Food Input */}
          {selectedFood && (
            <div className="border-t pt-4 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Unidade
                  </label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="g"
                  />
                </div>
              </div>

              {/* Estimated macros */}
              <div className="p-3 bg-accent rounded-lg">
                <p className="text-xs font-medium mb-1">Valores estimados:</p>
                <div className="flex gap-3 text-xs">
                  <span>Cal: {Math.round((selectedFood.calories * quantity) / 100)}</span>
                  <span>P: {((selectedFood.protein * quantity) / 100).toFixed(1)}g</span>
                  <span>C: {((selectedFood.carbs * quantity) / 100).toFixed(1)}g</span>
                  <span>G: {((selectedFood.fat * quantity) / 100).toFixed(1)}g</span>
                </div>
              </div>

              <Button onClick={handleAdd} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Diário
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

