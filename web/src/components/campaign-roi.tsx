'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { DollarSign, Eye, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CampaignROIProps {
  campaignId: string;
}

export function CampaignROI({ campaignId }: CampaignROIProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analytics/campaign/${campaignId}/roi`)
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-8">No analytics data available for this campaign.</p>;
  }

  const { summary, dailyTrend, bookingBreakdown } = data;

  const kpis = [
    { title: 'Total Spend', value: INR.format(summary.totalSpend), icon: DollarSign, color: 'text-green-600' },
    { title: 'Impressions', value: summary.totalImpressions.toLocaleString(), icon: Eye, color: 'text-blue-600' },
    { title: 'Total Reach', value: summary.totalReach.toLocaleString(), icon: Users, color: 'text-purple-600' },
    { title: 'CPM', value: `${INR.format(summary.cpm)}`, icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.totalBudget > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={Math.min(summary.budgetUtilization, 100)} className="flex-1" />
              <span className="text-sm font-medium">{summary.budgetUtilization}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {INR.format(summary.totalSpend)} of {INR.format(summary.totalBudget)} budget used
            </p>
          </CardContent>
        </Card>
      )}

      {dailyTrend.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Impressions & Reach</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="impressions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="reach" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {bookingBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Performance by Asset</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, bookingBreakdown.length * 50)}>
              <BarChart data={bookingBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="assetCode" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="impressions" fill="#3b82f6" name="Impressions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
