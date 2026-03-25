'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { Megaphone, Calendar, TrendingUp, Eye, IndianRupee } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ClientPortalDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/client/dashboard'),
      api.get('/campaigns', { params: { limit: 5 } }),
    ]).then(([statsRes, campRes]) => {
      setStats(statsRes.data.data);
      setCampaigns(campRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Welcome Back</h1>
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>)}</div>
    </div>;
  }

  const kpis = [
    { title: 'Active Campaigns', value: stats?.activeCampaigns || 0, icon: Megaphone, color: 'text-blue-600' },
    { title: 'Total Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'text-green-600' },
    { title: 'Total Spend', value: INR.format(stats?.totalSpend || 0), icon: IndianRupee, color: 'text-purple-600' },
    { title: 'Days Remaining', value: stats?.daysRemaining || 0, icon: Calendar, color: 'text-orange-600' },
    { title: 'Impressions', value: (stats?.impressions || 0).toLocaleString(), icon: Eye, color: 'text-cyan-600' },
    { title: 'Avg CPM', value: `${INR.symbol}${stats?.avgCpm || 0}`, icon: TrendingUp, color: 'text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Client Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Active Campaigns</CardTitle></CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>{c.status.replace(/_/g, ' ')}</Badge>
                    <p className="text-sm font-medium mt-1">{INR.format(c.totalBudget)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground">No active campaigns</p>}
        </CardContent>
      </Card>
    </div>
  );
}
