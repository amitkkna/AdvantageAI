'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { exportToCSV } from '@/lib/export';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { Download } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');

  useEffect(() => {
    Promise.all([
      api.get('/bookings', { params: { limit: 100 } }),
      api.get('/bookings/calendar'),
    ]).then(([bookingsRes, ganttRes]) => {
      setBookings(bookingsRes.data.data || []);
      setGanttData(ganttRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    const rows = bookings.map((b) => ({
      Asset: b.asset?.name || '',
      'Asset Code': b.asset?.code || '',
      Campaign: b.campaign?.name || '',
      Client: b.campaign?.client?.companyName || '',
      'Start Date': new Date(b.startDate).toLocaleDateString(),
      'End Date': new Date(b.endDate).toLocaleDateString(),
      Amount: b.amount,
      Status: b.status,
    }));
    exportToCSV(rows, 'bookings');
    toast({ title: 'Exported', description: `${rows.length} bookings exported to CSV.` });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'HOLD': return 'warning'; case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'destructive'; default: return 'secondary';
    }
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'asset.name', header: 'Asset', cell: ({ row }) => (
      <div><p className="font-medium">{row.original.asset?.name}</p><p className="text-xs text-muted-foreground">{row.original.asset?.code}</p></div>
    )},
    { accessorKey: 'campaign.name', header: 'Campaign', cell: ({ row }) => (
      <div><p>{row.original.campaign?.name}</p><p className="text-xs text-muted-foreground">{row.original.campaign?.client?.companyName}</p></div>
    )},
    { accessorKey: 'startDate', header: 'Start', cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString() },
    { accessorKey: 'endDate', header: 'End', cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString() },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-medium">{INR.format(row.original.amount)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColor(row.original.status) as any}>{row.original.status}</Badge> },
  ];

  // Gantt helpers
  const today = new Date();
  const ganttStart = new Date(today); ganttStart.setMonth(ganttStart.getMonth() - 1);
  const ganttEnd = new Date(today); ganttEnd.setMonth(ganttEnd.getMonth() + 5);
  const totalDays = Math.ceil((ganttEnd.getTime() - ganttStart.getTime()) / (1000 * 60 * 60 * 24));
  const getPosition = (date: Date) => Math.max(0, Math.min(100, (Math.ceil((date.getTime() - ganttStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100));
  const months: Date[] = [];
  for (let d = new Date(ganttStart); d <= ganttEnd; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={bookings.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : view === 'table' ? (
        <DataTable columns={columns} data={bookings} searchKey="search" searchPlaceholder="Search bookings..." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Booking Calendar</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex border-b mb-2 min-w-[800px]">
                <div className="w-48 shrink-0 text-sm font-medium p-2">Asset</div>
                <div className="flex-1 flex">
                  {months.map((m) => (
                    <div key={m.toISOString()} className="flex-1 text-xs text-center p-1 border-l">
                      {m.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                    </div>
                  ))}
                </div>
              </div>
              {ganttData.slice(0, 15).map((asset) => (
                <div key={asset.id} className="flex border-b min-w-[800px] hover:bg-muted/50">
                  <div className="w-48 shrink-0 text-xs p-2 truncate">
                    <span className="font-medium">{asset.code}</span><br />{asset.name}
                  </div>
                  <div className="flex-1 relative h-12">
                    {months.map((m) => <div key={m.toISOString()} className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/10" style={{ left: `${getPosition(m)}%` }} />)}
                    {asset.bookings?.map((b: any) => {
                      const left = getPosition(new Date(b.startDate));
                      const right = getPosition(new Date(b.endDate));
                      return (
                        <div key={b.id} className={`absolute top-2 h-8 rounded text-[9px] text-white px-1 flex items-center overflow-hidden ${b.status === 'CONFIRMED' ? 'bg-blue-500' : 'bg-orange-400'}`}
                          style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }} title={`${b.campaign?.name} (${b.status})`}>
                          {b.campaign?.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
