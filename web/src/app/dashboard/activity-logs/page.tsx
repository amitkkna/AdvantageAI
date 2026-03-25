'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { Activity, User, Clock } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  STATUS_CHANGE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  LOGIN: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  EXPORT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  REJECT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    const params: any = { page, limit: 30 };
    if (entityFilter) params.entity = entityFilter;
    api.get('/activity-logs', { params })
      .then(({ data }) => {
        setLogs(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, entityFilter]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Entities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="Campaign">Campaign</SelectItem>
            <SelectItem value="Booking">Booking</SelectItem>
            <SelectItem value="Asset">Asset</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Creative">Creative</SelectItem>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : logs.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><Activity className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No activity logs found</p></CardContent></Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.user?.name || 'System'}</span>
                    <Badge variant="outline" className={actionColors[log.action] || ''}>{log.action}</Badge>
                    <Badge variant="secondary" className="text-xs">{log.entity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(log.metadata as any)?.description || `${log.action} ${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
