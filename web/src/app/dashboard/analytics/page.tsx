'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportToCSV } from '@/lib/export';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [months, setMonths] = useState(12);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = () => {
    const params: any = { months };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    Promise.all([
      api.get('/analytics/revenue', { params }).catch(() => ({ data: { data: [] } })),
      api.get('/analytics/utilization').catch(() => ({ data: { data: [] } })),
    ]).then(([revRes, utilRes]) => {
      setRevenue(revRes.data.data || []);
      setUtilization(utilRes.data.data || []);
    });
  };

  useEffect(() => { fetchData(); }, [months]);

  const handleExportRevenue = () => {
    exportToCSV(revenue.map((r) => ({ Month: r.month, Revenue: r.revenue })), 'revenue');
    toast({ title: 'Exported', description: 'Revenue data exported to CSV.' });
  };

  const handleExportUtilization = () => {
    exportToCSV(utilization.map((u) => ({ Code: u.code, Name: u.name, 'Utilization %': u.utilizationRate, Revenue: u.revenue || 0 })), 'utilization');
    toast({ title: 'Exported', description: 'Utilization data exported to CSV.' });
  };

  const avgUtilization = utilization.length ? Math.round(utilization.reduce((s, u) => s + u.utilizationRate, 0) / utilization.length) : 0;
  const totalRevenue = revenue.reduce((s, r) => s + (r.revenue || 0), 0);

  const pieData = [
    { name: 'High (>70%)', value: utilization.filter((u) => u.utilizationRate > 70).length, color: '#22c55e' },
    { name: 'Medium (30-70%)', value: utilization.filter((u) => u.utilizationRate >= 30 && u.utilizationRate <= 70).length, color: '#f59e0b' },
    { name: 'Low (<30%)', value: utilization.filter((u) => u.utilizationRate < 30).length, color: '#ef4444' },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SALES', 'FINANCE']}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Revenue ({months}mo)</p>
            <p className="text-2xl font-bold text-primary">{INR.format(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg Utilization</p>
            <p className="text-2xl font-bold">{avgUtilization}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Assets Tracked</p>
            <p className="text-2xl font-bold">{utilization.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-1">
              {[3, 6, 12, 24].map((m) => (
                <Button key={m} variant={months === m ? 'default' : 'outline'} size="sm" onClick={() => { setMonths(m); setStartDate(''); setEndDate(''); }}>
                  {m}mo
                </Button>
              ))}
            </div>
            {(startDate || endDate) && (
              <Button size="sm" onClick={fetchData}>Apply</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Revenue</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleExportRevenue}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => INR.format(v)} />
                <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Utilization Distribution */}
        <Card>
          <CardHeader><CardTitle>Utilization Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Utilization Bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Asset Utilization</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleExportUtilization}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, utilization.length * 28)}>
              <BarChart data={utilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="code" type="category" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="utilizationRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}
