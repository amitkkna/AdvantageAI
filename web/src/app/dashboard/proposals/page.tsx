'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { INR } from '@advantage/shared';
import { FileText, Download, ArrowLeft, MapPin, Ruler, Building2, Star, ExternalLink } from 'lucide-react';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/proposals', { params: { limit: 50 } })
      .then(({ data }) => setProposals(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const viewProposal = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/proposals/${id}`);
      setSelectedProposal(data.data);
    } catch {
      toast({ title: 'Load failed', description: 'Failed to load proposal.', variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadPdf = async (id: string) => {
    setDownloading(true);
    try {
      const response = await api.get(`/proposals/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Download failed', description: 'Failed to download PDF.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const updateProposalStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/proposals/${id}/status`, { status });
      toast({ title: 'Status updated', description: `Proposal marked as ${status}` });
      if (selectedProposal?.id === id) viewProposal(id);
      api.get('/proposals', { params: { limit: 50 } }).then(({ data }) => setProposals(data.data || []));
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to update status', variant: 'destructive' });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'default';
      case 'VIEWED': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  // ── Detail View ──
  if (selectedProposal) {
    const assets = (selectedProposal.assets as any[]) || [];
    const totalMonthly = assets.reduce((s: number, a: any) => s + (a.monthlyRate || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedProposal(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedProposal.title}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedProposal.client?.companyName} &bull; {new Date(selectedProposal.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant={statusColor(selectedProposal.status) as any} className="text-sm px-3 py-1">
              {selectedProposal.status}
            </Badge>
            {selectedProposal.status === 'DRAFT' && (
              <Button size="sm" variant="outline" onClick={() => updateProposalStatus(selectedProposal.id, 'SENT')}>
                Mark as Sent
              </Button>
            )}
            {(selectedProposal.status === 'SENT' || selectedProposal.status === 'VIEWED') && (
              <>
                <Button size="sm" onClick={() => updateProposalStatus(selectedProposal.id, 'APPROVED')}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateProposalStatus(selectedProposal.id, 'REJECTED')}>
                  Reject
                </Button>
              </>
            )}
            {selectedProposal.status === 'REJECTED' && (
              <Button size="sm" variant="outline" onClick={() => updateProposalStatus(selectedProposal.id, 'DRAFT')}>
                Revert to Draft
              </Button>
            )}
            <Button onClick={() => downloadPdf(selectedProposal.id)} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-primary">{INR.format(selectedProposal.totalBudget)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-2xl font-bold">{INR.format(totalMonthly)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Locations</p>
              <p className="text-2xl font-bold">{assets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Cities</p>
              <p className="text-2xl font-bold">{[...new Set(assets.map((a: any) => a.city).filter(Boolean))].length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {selectedProposal.description && (
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Overview</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedProposal.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Asset Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Billboard Locations ({assets.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset: any, i: number) => (
              <Card key={asset.assetId || i} className="overflow-hidden">
                {/* Map thumbnail */}
                <div className="h-40 bg-muted relative">
                  {asset.assetId ? (
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(asset.city + ' ' + (asset.address || ''))}&z=15&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <MapPin className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-primary text-primary-foreground font-bold">{i + 1}</Badge>
                  </div>
                  {asset.score && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {asset.score}/100
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-base">{asset.name || 'Billboard'}</h3>
                    {asset.code && <p className="text-xs text-muted-foreground">{asset.code}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{asset.city}{asset.address ? ` — ${asset.address}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{asset.width || '?'} x {asset.height || '?'} ft</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{(asset.type || '').replace(/_/g, ' ')}</span>
                    </div>
                    {asset.vendor && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{asset.vendor}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{INR.format(asset.monthlyRate || 0)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                    {asset.assetId && (
                      <a href={`/dashboard/assets/${asset.assetId}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                        View Details <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cost Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cost Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assets.map((asset: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{asset.name || `Site ${i + 1}`} ({asset.city})</span>
                  <span className="font-medium">{INR.format(asset.monthlyRate || 0)}/mo</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Monthly</span>
                <span className="text-primary">{INR.format(totalMonthly)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Campaign Budget</span>
                <span className="text-primary">{INR.format(selectedProposal.totalBudget)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setSelectedProposal(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
          <Button onClick={() => downloadPdf(selectedProposal.id)} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Proposals</h1>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No proposals yet</p>
            <p className="text-sm mt-1">Use the AI Campaign Planner to generate proposals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Card key={p.id} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer" onClick={() => viewProposal(p.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.client?.companyName} &bull; {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">{INR.format(p.totalBudget)}</p>
                    <Badge variant={statusColor(p.status) as any}>{p.status}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadPdf(p.id); }}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
