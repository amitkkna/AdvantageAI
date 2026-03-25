'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import {
  MapPin, Megaphone, Users, Receipt, TrendingUp,
  AlertCircle, Settings, RotateCcw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from '@/components/sortable-widget';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  occupancyRate: number;
  totalRevenue: number;
  revenueTarget: number;
  activeCampaigns: number;
  totalClients: number;
  pendingInvoices: number;
  outstandingAmount: number;
}

const WIDGET_LABELS: Record<string, string> = {
  'kpi-totalAssets': 'Total Assets',
  'kpi-occupancy': 'Occupancy Rate',
  'kpi-activeCampaigns': 'Active Campaigns',
  'kpi-totalRevenue': 'Total Revenue',
  'kpi-pendingInvoices': 'Pending Invoices',
  'kpi-totalClients': 'Total Clients',
  'chart-revenue': 'Revenue Chart',
  'chart-occupancy': 'Occupancy Chart',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [customizing, setCustomizing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { widgets, loaded, toggleWidget, reorder, reset } = useDashboardConfig();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          api.get('/analytics/admin/dashboard'),
          api.get('/analytics/revenue').catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data.data);
        setRevenue(revenueRes.data.data || []);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !loaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiMap: Record<string, { title: string; value: string | number; subtitle: string; icon: any; color: string }> = {
    'kpi-totalAssets': { title: 'Total Assets', value: stats?.totalAssets || 0, subtitle: `${stats?.availableAssets || 0} available`, icon: MapPin, color: 'text-blue-600' },
    'kpi-occupancy': { title: 'Occupancy Rate', value: `${stats?.occupancyRate || 0}%`, subtitle: 'Current utilization', icon: TrendingUp, color: 'text-green-600' },
    'kpi-activeCampaigns': { title: 'Active Campaigns', value: stats?.activeCampaigns || 0, subtitle: `${stats?.totalClients || 0} clients`, icon: Megaphone, color: 'text-purple-600' },
    'kpi-totalRevenue': { title: 'Total Revenue', value: INR.format(stats?.totalRevenue || 0), subtitle: `Target: ${INR.format(stats?.revenueTarget || 0)}`, icon: Receipt, color: 'text-orange-600' },
    'kpi-pendingInvoices': { title: 'Pending Invoices', value: stats?.pendingInvoices || 0, subtitle: INR.format(stats?.outstandingAmount || 0), icon: AlertCircle, color: 'text-red-600' },
    'kpi-totalClients': { title: 'Total Clients', value: stats?.totalClients || 0, subtitle: 'Active advertisers', icon: Users, color: 'text-indigo-600' },
  };

  const occupancyData = [
    { name: 'Available', value: stats?.availableAssets || 0, color: '#22c55e' },
    { name: 'Booked', value: (stats?.totalAssets || 0) - (stats?.availableAssets || 0), color: '#3b82f6' },
  ];

  const visibleKpis = widgets.filter((w) => w.visible && w.id.startsWith('kpi-'));
  const visibleCharts = widgets.filter((w) => w.visible && w.id.startsWith('chart-'));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorder(active.id as string, over.id as string);
    }
  };

  const renderKpi = (widgetId: string) => {
    const card = kpiMap[widgetId];
    if (!card) return null;
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderChart = (widgetId: string) => {
    if (widgetId === 'chart-revenue') {
      return (
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => INR.format(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }
    if (widgetId === 'chart-occupancy') {
      return (
        <Card>
          <CardHeader><CardTitle>Asset Occupancy</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {occupancyData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Live Data</Badge>
            <Button
              variant={customizing ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setCustomizing(!customizing); if (!customizing) setSheetOpen(true); }}
            >
              <Settings className="h-4 w-4 mr-1" />
              {customizing ? 'Done' : 'Customize'}
            </Button>
          </div>
        </div>

        <SortableContext items={visibleKpis.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleKpis.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id} isCustomizing={customizing}>
                {renderKpi(widget.id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>

        <SortableContext items={visibleCharts.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleCharts.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id} isCustomizing={customizing}>
                {renderChart(widget.id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Customize Dashboard</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Toggle widgets on/off. Drag handles on the dashboard to reorder.</p>
            {widgets.map((widget) => (
              <div key={widget.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{WIDGET_LABELS[widget.id] || widget.id}</span>
                <Switch checked={widget.visible} onCheckedChange={() => toggleWidget(widget.id)} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />Reset to Default
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DndContext>
  );
}
