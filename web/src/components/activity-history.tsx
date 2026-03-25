'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, User } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

interface ActivityHistoryProps {
  entity: string;
  entityId: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  STATUS_CHANGE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  REJECT: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

function DiffView({ before, after }: { before: any; after: any }) {
  if (!before || !after) return null;

  const changes: { key: string; oldVal: any; newVal: any }[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (['updatedAt', 'createdAt', 'id'].includes(key)) continue;
    const oldVal = before[key];
    const newVal = after[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, oldVal, newVal });
    }
  }

  if (changes.length === 0) return <p className="text-xs text-muted-foreground">No field changes detected</p>;

  return (
    <div className="space-y-1 mt-2">
      {changes.map((c) => (
        <div key={c.key} className="text-xs font-mono bg-muted rounded px-2 py-1">
          <span className="text-muted-foreground">{c.key}:</span>{' '}
          <span className="line-through text-red-500">{String(c.oldVal ?? 'null')}</span>{' '}
          <span className="text-green-600">{String(c.newVal ?? 'null')}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityHistory({ entity, entityId }: ActivityHistoryProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api.get(`/activity-logs/entity/${entity}/${entityId}`, { params: { page: 1, limit: 20 } })
      .then(({ data }) => {
        setLogs(data.data || []);
        setHasMore((data.meta?.totalPages || 1) > 1);
      })
      .finally(() => setLoading(false));
  }, [entity, entityId]);

  const loadMore = () => {
    const nextPage = page + 1;
    api.get(`/activity-logs/entity/${entity}/${entityId}`, { params: { page: nextPage, limit: 20 } })
      .then(({ data }) => {
        setLogs((prev) => [...prev, ...(data.data || [])]);
        setHasMore(nextPage < (data.meta?.totalPages || 1));
        setPage(nextPage);
      });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  if (logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No history recorded for this record.</p>;
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="relative pl-6">
        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />

        {logs.map((log) => {
          const isExpanded = expanded.has(log.id);
          const hasDiff = log.metadata?.before && log.metadata?.after;

          return (
            <div key={log.id} className="relative pb-6 last:pb-0">
              <div className="absolute left-[-17px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />

              <div className="ml-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{log.user.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{log.user.role}</Badge>
                </div>

                {log.metadata?.description && (
                  <p className="text-xs text-muted-foreground mt-1">{log.metadata.description}</p>
                )}

                {hasDiff && (
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? 'Hide changes' : 'View changes'}
                  </button>
                )}

                {isExpanded && hasDiff && (
                  <DiffView before={log.metadata.before} after={log.metadata.after} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <Button variant="outline" size="sm" onClick={loadMore}>Load more</Button>
        </div>
      )}
    </ScrollArea>
  );
}
