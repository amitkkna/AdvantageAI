'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { ImagePlus, Check, X, CheckSquare, Square, RotateCcw, PenLine } from 'lucide-react';

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCreatives = () => {
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/creatives', { params }).then(({ data }) => setCreatives(data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCreatives(); }, [statusFilter]);

  const handleReview = async (id: string, status: string, revisionNotes?: string) => {
    try {
      const payload: any = { status };
      if (status === 'REJECTED') {
        const reason = prompt('Rejection reason:');
        if (reason === null) return;
        payload.rejectionReason = reason;
      }
      if (status === 'REVISION_REQUESTED') {
        const notes = revisionNotes || prompt('What changes are needed?');
        if (notes === null) return;
        payload.revisionNotes = notes;
      }
      await api.patch(`/creatives/${id}/review`, payload);
      toast({ title: `Creative ${status.toLowerCase().replace('_', ' ')}` });
      fetchCreatives();
    } catch (error: any) {
      toast({ title: 'Review failed', description: error.response?.data?.error || 'Failed to update.', variant: 'destructive' });
    }
  };

  const handleResubmit = async (id: string) => {
    try {
      await api.patch(`/creatives/${id}/resubmit`, {});
      toast({ title: 'Creative resubmitted for review' });
      fetchCreatives();
    } catch (error: any) {
      toast({ title: 'Resubmit failed', description: error.response?.data?.error || 'Failed to resubmit.', variant: 'destructive' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = creatives.filter((c) => c.status === 'PENDING').map((c) => c.id);
    setSelected((prev) => prev.size === pendingIds.length ? new Set() : new Set(pendingIds));
  };

  const bulkAction = async (status: string) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) => api.patch(`/creatives/${id}/review`, { status }))
      );
      toast({ title: `Bulk ${status.toLowerCase().replace('_', ' ')}`, description: `${selected.size} creatives updated.` });
      setSelected(new Set());
      fetchCreatives();
    } catch {
      toast({ title: 'Bulk action failed', description: 'Some creatives could not be updated.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const pendingCount = creatives.filter((c) => c.status === 'PENDING').length;
  const revisionCount = creatives.filter((c) => c.status === 'REVISION_REQUESTED').length;

  const statusColor = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'destructive';
      case 'REVISION_REQUESTED': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creatives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount > 0 && <span className="text-amber-500 font-medium">{pendingCount} pending review</span>}
            {pendingCount > 0 && revisionCount > 0 && ' | '}
            {revisionCount > 0 && <span className="text-orange-500 font-medium">{revisionCount} awaiting revision</span>}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAllPending}>
              {selected.size === pendingCount ? <CheckSquare className="mr-1 h-4 w-4" /> : <Square className="mr-1 h-4 w-4" />}
              Select All Pending ({pendingCount})
            </Button>
            {selected.size > 0 && (
              <>
                <Button size="sm" onClick={() => bulkAction('APPROVED')} disabled={bulkLoading}>
                  <Check className="mr-1 h-3 w-3" />Approve ({selected.size})
                </Button>
                <Button size="sm" variant="destructive" onClick={() => bulkAction('REJECTED')} disabled={bulkLoading}>
                  <X className="mr-1 h-3 w-3" />Reject ({selected.size})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REVISION_REQUESTED">Revision Needed</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading creatives...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatives.map((c) => (
            <Card key={c.id} className={`relative ${selected.has(c.id) ? 'ring-2 ring-primary' : ''}`}>
              {c.status === 'PENDING' && (
                <button
                  className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-muted"
                  onClick={() => toggleSelect(c.id)}
                >
                  {selected.has(c.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{c.fileName}</p>
                  <p className="text-xs text-muted-foreground">{c.asset?.name} ({c.asset?.width}x{c.asset?.height} ft)</p>
                  <p className="text-xs text-muted-foreground">{c.booking?.campaign?.name}</p>
                </div>

                {/* Rejection/Revision reason */}
                {(c.status === 'REJECTED' || c.status === 'REVISION_REQUESTED') && c.rejectionReason && (
                  <div className={`p-2 rounded text-xs ${c.status === 'REVISION_REQUESTED' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    <span className="font-medium">{c.status === 'REVISION_REQUESTED' ? 'Revision needed: ' : 'Rejected: '}</span>
                    {c.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={statusColor(c.status) as any}>
                    {c.status === 'REVISION_REQUESTED' ? 'REVISION NEEDED' : c.status}
                  </Badge>

                  {/* Action buttons based on status */}
                  {c.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleReview(c.id, 'APPROVED')} title="Approve">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReview(c.id, 'REVISION_REQUESTED')} title="Request Revision">
                        <PenLine className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReview(c.id, 'REJECTED')} title="Reject">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {(c.status === 'REVISION_REQUESTED' || c.status === 'REJECTED') && (
                    <Button size="sm" variant="outline" onClick={() => handleResubmit(c.id)} title="Resubmit for review">
                      <RotateCcw className="h-3 w-3 mr-1" />Resubmit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {creatives.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center text-muted-foreground">
                <ImagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No creatives {statusFilter ? `with status "${statusFilter}"` : 'uploaded yet'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
