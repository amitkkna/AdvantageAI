'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { toast } from '@/components/ui/use-toast';
import { INR } from '@advantage/shared';
import { Plus, Eye, Calendar, Download } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: any = { limit: 50 };
    if (statusFilter) params.status = statusFilter;
    api.get('/campaigns', { params })
      .then(({ data }) => setCampaigns(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statusColor = (status: string): string => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'PROPOSAL_SENT': return 'outline';
      case 'CLIENT_APPROVED': return 'default';
      case 'LIVE': return 'success';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleExport = () => {
    exportToCSV(campaigns.map((c) => ({
      Name: c.name,
      Status: c.status,
      Client: c.client?.companyName || '',
      'Start Date': new Date(c.startDate).toLocaleDateString(),
      'End Date': new Date(c.endDate).toLocaleDateString(),
      Budget: c.totalBudget,
      Bookings: c._count?.bookings || 0,
      Rep: c.assignedTo?.name || '',
    })), 'campaigns');
    toast({ title: 'Exported', description: 'Campaigns exported to CSV.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={campaigns.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
          <Link href="/dashboard/campaigns/new">
            <Button><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
          </Link>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="LIVE">Live</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>)}</div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No campaigns found</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge variant={statusColor(campaign.status) as any}>{campaign.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{campaign.client?.companyName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                      <span>Budget: {INR.format(campaign.totalBudget)}</span>
                      <span>{campaign._count?.bookings || 0} bookings</span>
                      {campaign.assignedTo && <span>Rep: {campaign.assignedTo.name}</span>}
                    </div>
                  </div>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" />View</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
