'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'kpi-totalAssets', visible: true, order: 0 },
  { id: 'kpi-occupancy', visible: true, order: 1 },
  { id: 'kpi-activeCampaigns', visible: true, order: 2 },
  { id: 'kpi-totalRevenue', visible: true, order: 3 },
  { id: 'kpi-pendingInvoices', visible: true, order: 4 },
  { id: 'kpi-totalClients', visible: true, order: 5 },
  { id: 'chart-revenue', visible: true, order: 6 },
  { id: 'chart-occupancy', visible: true, order: 7 },
];

export function useDashboardConfig() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/dashboard-config')
      .then(({ data }) => {
        const config = data.data;
        if (Array.isArray(config) && config.length > 0) {
          setWidgets(config);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback(async (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    try {
      await api.put('/dashboard-config', { widgets: newWidgets });
    } catch (error) {
      console.error('Failed to save dashboard config:', error);
    }
  }, []);

  const toggleWidget = useCallback((id: string) => {
    const updated = widgets.map((w) => w.id === id ? { ...w, visible: !w.visible } : w);
    save(updated);
  }, [widgets, save]);

  const reorder = useCallback((activeId: string, overId: string) => {
    const oldIndex = widgets.findIndex((w) => w.id === activeId);
    const newIndex = widgets.findIndex((w) => w.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...widgets];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    const reordered = updated.map((w, i) => ({ ...w, order: i }));
    save(reordered);
  }, [widgets, save]);

  const reset = useCallback(() => {
    save(DEFAULT_WIDGETS);
  }, [save]);

  return { widgets: widgets.sort((a, b) => a.order - b.order), loaded, toggleWidget, reorder, reset };
}
