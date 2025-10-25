'use client';

import React from 'react';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomizableDashboard, useDashboardState } from '@/components/dashboard/customizable-dashboard';
import { createDashboardWidgets } from '@/components/dashboard/dashboard-widgets';
import { Settings, Plus, Eye, EyeOff } from 'lucide-react';

export default function CustomizableDashboardPage() {
  const initialWidgets = createDashboardWidgets();
  const {
    widgets,
    setWidgets,
    addWidget,
    removeWidget,
    updateWidget,
    resetLayout,
  } = useDashboardState(initialWidgets);

  const [isDragDisabled, setIsDragDisabled] = React.useState(false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);

  const handleAddWidget = () => {
    // Example: Add a new KPI widget
    addWidget({
      type: 'kpi',
      title: 'New KPI',
      description: 'Custom KPI widget',
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custom Metric</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>
        </div>
      ),
      size: 'small',
    });
  };

  const handleToggleDrag = () => {
    setIsDragDisabled(!isDragDisabled);
  };

  const handleTogglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customizable Dashboard</h1>
          <p className="text-muted-foreground">
            Drag and drop widgets to customize your dashboard layout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePreview}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Exit Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview Mode
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleDrag}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isDragDisabled ? 'Enable Drag' : 'Disable Drag'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddWidget}
            disabled={isPreviewMode}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
            <Badge variant="secondary">{widgets.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.length}</div>
            <p className="text-xs text-muted-foreground">
              Widgets configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Widgets</CardTitle>
            <Badge variant="secondary">
              {widgets.filter(w => w.type === 'kpi').length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {widgets.filter(w => w.type === 'kpi').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Key performance indicators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chart Widgets</CardTitle>
            <Badge variant="secondary">
              {widgets.filter(w => w.type === 'chart').length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {widgets.filter(w => w.type === 'chart').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Data visualizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Widgets</CardTitle>
            <Badge variant="secondary">
              {widgets.filter(w => !['kpi', 'chart'].includes(w.type)).length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {widgets.filter(w => !['kpi', 'chart'].includes(w.type)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tables and lists
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customizable Dashboard */}
      <CustomizableDashboard
        widgets={widgets}
        onWidgetsChange={setWidgets}
        onResetLayout={resetLayout}
        isDragDisabled={isDragDisabled || isPreviewMode}
        className={isPreviewMode ? 'opacity-75' : ''}
      />

      {/* Instructions */}
      {!isPreviewMode && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
            <CardDescription>
              Instructions for customizing your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Drag and Drop</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click and drag the grip handle to move widgets</li>
                  <li>• Widgets will automatically reorder</li>
                  <li>• Layout is saved automatically</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Widget Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <Badge variant="secondary" className="text-xs">KPI</Badge> Key performance indicators</li>
                  <li>• <Badge variant="secondary" className="text-xs">Chart</Badge> Data visualizations</li>
                  <li>• <Badge variant="secondary" className="text-xs">Table</Badge> Data tables</li>
                  <li>• <Badge variant="secondary" className="text-xs">List</Badge> Item lists</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

