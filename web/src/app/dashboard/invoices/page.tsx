'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { exportToCSV } from '@/lib/export';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { Download, DollarSign, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const fetchInvoices = () => {
    const params: any = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    api.get('/invoices', { params })
      .then(({ data }) => setInvoices(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, [statusFilter]);

  useEffect(() => {
    api.get('/invoices/summary')
      .then(({ data }) => setSummary(data.data))
      .catch(() => {});
  }, []);

  const handleExport = () => {
    const rows = invoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      Campaign: inv.campaign?.name || '',
      Client: inv.client?.companyName || '',
      Amount: inv.amount,
      Tax: inv.tax,
      Total: inv.totalAmount,
      Status: inv.status,
      'Due Date': new Date(inv.dueDate).toLocaleDateString(),
      'Paid At': inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '',
      'Payment Method': inv.paymentMethod || '',
      'Payment Ref': inv.paymentRef || '',
    }));
    exportToCSV(rows, 'invoices');
    toast({ title: 'Exported', description: `${rows.length} invoices exported to CSV.` });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const payload: any = { status };
      if (status === 'PAID') {
        const method = prompt('Payment method (e.g., Bank Transfer, UPI, Cheque):');
        if (method === null) return;
        payload.paymentMethod = method;
        const ref = prompt('Payment reference/transaction ID (optional):');
        if (ref) payload.paymentRef = ref;
      }
      await api.patch(`/invoices/${id}/status`, payload);
      toast({ title: 'Invoice updated', description: `Invoice marked as ${status}` });
      fetchInvoices();
      // Refresh summary
      api.get('/invoices/summary').then(({ data }) => setSummary(data.data)).catch(() => {});
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to update', variant: 'destructive' });
    }
  };

  const statusColor = (s: string) => {
    switch (s) { case 'PAID': return 'success'; case 'SENT': return 'default'; case 'OVERDUE': return 'destructive'; case 'CANCELLED': return 'secondary'; default: return 'secondary'; }
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'invoiceNumber', header: 'Invoice #', cell: ({ row }) => <span className="font-medium">{row.original.invoiceNumber}</span> },
    { accessorKey: 'campaign.name', header: 'Campaign', cell: ({ row }) => row.original.campaign?.name || '-' },
    { accessorKey: 'client.companyName', header: 'Client', cell: ({ row }) => row.original.client?.companyName || '-' },
    { accessorKey: 'totalAmount', header: 'Amount', cell: ({ row }) => <span className="font-medium">{INR.format(row.original.totalAmount)}</span> },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => {
      const due = new Date(row.original.dueDate);
      const isOverdue = row.original.status !== 'PAID' && due < new Date();
      return <span className={isOverdue ? 'text-red-500 font-medium' : ''}>{due.toLocaleDateString()}</span>;
    }},
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColor(row.original.status) as any}>{row.original.status}</Badge> },
    { accessorKey: 'paymentMethod', header: 'Payment', cell: ({ row }) => {
      if (row.original.status !== 'PAID') return '-';
      return (
        <div className="text-xs">
          <div>{row.original.paymentMethod || 'N/A'}</div>
          {row.original.paymentRef && <div className="text-muted-foreground">{row.original.paymentRef}</div>}
        </div>
      );
    }},
    { id: 'actions', header: '', cell: ({ row }) => {
      const inv = row.original;
      return (
        <div className="flex gap-1">
          {inv.status === 'DRAFT' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'SENT')}>Send</Button>
          )}
          {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
            <Button size="sm" onClick={() => updateStatus(inv.id, 'PAID')}>Mark Paid</Button>
          )}
          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
            <Button size="sm" variant="ghost" onClick={() => updateStatus(inv.id, 'CANCELLED')}>Cancel</Button>
          )}
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button variant="outline" onClick={handleExport} disabled={invoices.length === 0}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-bold">{INR.format(summary.totalInvoiced)}</p>
                <p className="text-xs text-muted-foreground">{summary.totalCount} invoices</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-bold text-green-600">{INR.format(summary.collected)}</p>
                <p className="text-xs text-muted-foreground">{summary.collectedCount} paid</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold text-red-600">{INR.format(summary.overdue)}</p>
                <p className="text-xs text-muted-foreground">{summary.overdueCount} overdue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-amber-600">{INR.format(summary.pending)}</p>
                <p className="text-xs text-muted-foreground">{summary.pendingCount} pending</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="SENT">Sent</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
          <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
      ) : (
        <DataTable columns={columns} data={invoices} searchKey="search" searchPlaceholder="Search invoices..." />
      )}
    </div>
  );
}
