'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, RotateCcw, Settings } from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list';
  title: string;
  description?: string;
  component: React.ReactNode;
  size: 'small' | 'medium' | 'large';
  order: number;
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  isDragDisabled?: boolean;
}

function SortableWidget({ widget, isDragDisabled = false }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSizeClasses = () => {
    switch (widget.size) {
      case 'small':
        return 'md:col-span-1';
      case 'medium':
        return 'md:col-span-2';
      case 'large':
        return 'md:col-span-3';
      default:
        return 'md:col-span-2';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getSizeClasses()} ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className={`cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted ${
                  isDragDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{widget.title}</CardTitle>
                {widget.description && (
                  <CardDescription className="text-sm">
                    {widget.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {widget.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {widget.size}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {widget.component}
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomizableDashboardProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  onResetLayout?: () => void;
  isDragDisabled?: boolean;
  className?: string;
}

export function CustomizableDashboard({
  widgets,
  onWidgetsChange,
  onResetLayout,
  isDragDisabled = false,
  className = '',
}: CustomizableDashboardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = widgets.findIndex((widget) => widget.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex);
        
        // Update order property
        const updatedWidgets = newWidgets.map((widget, index) => ({
          ...widget,
          order: index,
        }));

        onWidgetsChange(updatedWidgets);
      }
    }
  }, [widgets, onWidgetsChange]);

  const handleResetLayout = () => {
    if (onResetLayout) {
      onResetLayout();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customizable Dashboard</h2>
          <p className="text-muted-foreground">
            Drag and drop widgets to customize your dashboard layout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            disabled={isDragDisabled}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Layout
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map(widget => widget.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {widgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isDragDisabled={isDragDisabled}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No widgets configured</h3>
              <p className="text-muted-foreground mb-4">
                Add widgets to customize your dashboard
              </p>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Add Widgets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for managing dashboard state
export function useDashboardState(initialWidgets: DashboardWidget[] = []) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);

  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id' | 'order'>) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      order: widgets.length,
    };
    setWidgets(prev => [...prev, newWidget]);
  }, [widgets.length]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(initialWidgets);
  }, [initialWidgets]);

  return {
    widgets,
    setWidgets,
    addWidget,
    removeWidget,
    updateWidget,
    resetLayout,
  };
}

















