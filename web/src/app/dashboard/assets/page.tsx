'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { toast } from '@/components/ui/use-toast';
import { INR, AssetType, AssetStatus } from '@advantage/shared';
import { Plus, MapPin, Eye, Download, LayoutGrid, List, RefreshCw, Gauge } from 'lucide-react';
import { FilterPanel, type FilterField } from '@/components/filter-panel';
import { SavedViewsDropdown } from '@/components/saved-views-dropdown';
import { useUrlFilters } from '@/hooks/use-url-filters';

const CG_CITIES = ['Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur', 'Raigarh', 'Dhamtari'];

const filterFields: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search assets...' },
  { key: 'city', label: 'City', type: 'select', options: CG_CITIES.map((c) => ({ label: c, value: c })) },
  { key: 'type', label: 'Type', type: 'select', options: Object.values(AssetType).map((t) => ({ label: t.replace(/_/g, ' '), value: t })) },
  { key: 'status', label: 'Status', type: 'select', options: Object.values(AssetStatus).map((s) => ({ label: s.replace(/_/g, ' '), value: s })) },
];

const statusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'success';
    case 'PARTIALLY_BOOKED': return 'warning';
    case 'FULLY_BOOKED': return 'destructive';
    case 'MAINTENANCE': return 'secondary';
    default: return 'outline';
  }
};

const scoreColor = (score: number | null) => {
  if (!score) return 'text-muted-foreground';
  if (score >= 75) return 'text-green-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 35) return 'text-orange-500';
  return 'text-red-500';
};

const scoreRingColor = (score: number | null) => {
  if (!score) return 'stroke-muted';
  if (score >= 75) return 'stroke-green-500';
  if (score >= 55) return 'stroke-yellow-500';
  if (score >= 35) return 'stroke-orange-500';
  return 'stroke-red-500';
};

const BREAKDOWN_LABELS: Record<string, { label: string; max: number }> = {
  trafficVolume: { label: 'Traffic Volume', max: 20 },
  physicalCondition: { label: 'Physical Condition', max: 20 },
  sizeVisibility: { label: 'Size & Visibility', max: 15 },
  campaignPerformance: { label: 'Campaign Performance', max: 15 },
  vendorReliability: { label: 'Vendor Reliability', max: 10 },
  lightingQuality: { label: 'Lighting Quality', max: 10 },
  availability: { label: 'Availability', max: 10 },
};

function ScoreRing({ score, size = 40 }: { score: number | null; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score ? (score / 100) * circumference : 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3}
          className={scoreRingColor(score)} strokeDasharray={circumference}
          strokeDashoffset={circumference - progress} strokeLinecap="round" />
      </svg>
      <span className={`absolute text-xs font-bold ${scoreColor(score)}`}>{score ?? '—'}</span>
    </div>
  );
}

function ScoreBreakdownTooltip({ asset }: { asset: any }) {
  const breakdown = asset.scoreBreakdown;
  if (!breakdown || !asset.score) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help"><ScoreRing score={null} /></div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Score not calculated yet. Click &quot;Recalculate Scores&quot;.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help"><ScoreRing score={asset.score} /></div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64 p-3">
          <p className="font-semibold text-sm mb-2">Quality Score: {asset.score}/100</p>
          <div className="space-y-1.5">
            {Object.entries(BREAKDOWN_LABELS).map(([key, { label, max }]) => {
              const val = breakdown[key] ?? 0;
              const pct = (val / max) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val}/{max}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AssetsPageInner() {
  const { filters, setFilter, setFilters, clearFilters, activeCount } = useUrlFilters();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      const { data } = await api.get('/assets', { params });
      setAssets(data.data);
      setTotalPages(data.meta?.totalPages || 1);
      setTotal(data.meta?.total || data.data.length);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateScores = async () => {
    setRecalculating(true);
    try {
      const { data } = await api.post('/assets/recalculate-scores');
      toast({ title: 'Scores Updated', description: `Recalculated scores for ${data.data.updated} assets.` });
      fetchAssets();
    } catch {
      toast({ title: 'Error', description: 'Failed to recalculate scores.', variant: 'destructive' });
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [page, filters.city, filters.type, filters.status]);

  useEffect(() => {
    const timer = setTimeout(() => { if (filters.search !== undefined) fetchAssets(); }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billboard Assets</h1>
          {!loading && <p className="text-sm text-muted-foreground mt-1">{total} assets found</p>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" className="rounded-r-none px-3" onClick={() => setViewMode('card')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-l-none px-3" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={recalculateScores} disabled={recalculating}>
            {recalculating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Gauge className="mr-2 h-4 w-4" />}
            {recalculating ? 'Scoring...' : 'Recalculate Scores'}
          </Button>
          <SavedViewsDropdown entity="Asset" currentFilters={filters} onApply={(f) => { setFilters(f); setPage(1); }} />
          <Button variant="outline" onClick={() => {
            const rows = assets.map((a) => ({
              Code: a.code, Name: a.name, Type: a.type, City: a.city, Score: a.score ?? '',
              'Size (ft)': `${a.width}x${a.height}`, Status: a.status,
              'Monthly Rate': a.monthlyRate, Vendor: a.vendor?.name || '',
            }));
            exportToCSV(rows, 'assets');
            toast({ title: 'Exported', description: `${rows.length} assets exported to CSV.` });
          }} disabled={assets.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Link href="/dashboard/assets/new">
            <Button><Plus className="mr-2 h-4 w-4" />Add Asset</Button>
          </Link>
        </div>
      </div>

      <FilterPanel fields={filterFields} values={filters}
        onChange={(key, value) => { setFilter(key, value); setPage(1); }}
        onClear={() => { clearFilters(); setPage(1); }}
        activeCount={activeCount}
      />

      {loading ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="animate-pulse space-y-0">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-14 border-b last:border-b-0 bg-muted/30" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No assets found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new asset.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{asset.code}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <ScoreBreakdownTooltip asset={asset} />
                        <Badge variant={statusColor(asset.status) as any}>
                          {asset.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />{asset.city}, {asset.state}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Type:</span> {asset.type.replace(/_/g, ' ')}</div>
                      <div><span className="text-muted-foreground">Size:</span> {asset.width}x{asset.height} ft</div>
                      <div><span className="text-muted-foreground">Rate:</span> {INR.format(asset.monthlyRate)}/mo</div>
                      <div><span className="text-muted-foreground">Vendor:</span> {asset.vendor?.name}</div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Link href={`/dashboard/assets/${asset.id}`}>
                        <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" />View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">City</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size (ft)</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate/Mo</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{asset.code}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{asset.name}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <ScoreBreakdownTooltip asset={asset} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {asset.city}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{asset.type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-sm">{asset.width}x{asset.height}</td>
                          <td className="px-4 py-3 text-sm font-medium">{INR.format(asset.monthlyRate)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusColor(asset.status) as any} className="text-xs">
                              {asset.status.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/dashboard/assets/${asset.id}`}>
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <AssetsPageInner />
    </Suspense>
  );
}
