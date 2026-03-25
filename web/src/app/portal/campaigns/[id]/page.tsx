'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';

export default function ClientCampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    api.get(`/campaigns/${id}`).then(({ data }) => setCampaign(data.data)).catch(() => router.push('/portal/campaigns'));
  }, [id]);

  if (!campaign) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-3xl font-bold">{campaign.name}</h1>
        <Badge>{campaign.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Campaign Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span>{INR.format(campaign.totalBudget)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rep</span><span>{campaign.assignedTo?.name || 'N/A'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Booked Locations ({campaign.bookings?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {campaign.bookings?.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{b.asset?.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{INR.format(b.amount)}</p>
                  <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'secondary' as any} className="text-xs">{b.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
