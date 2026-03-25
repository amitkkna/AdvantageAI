'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { Eye, Calendar } from 'lucide-react';

export default function ClientCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    api.get('/campaigns', { params: { limit: 50 } }).then(({ data }) => setCampaigns(data.data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Campaigns</h1>
      <div className="space-y-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</span>
                  <span>Budget: {INR.format(c.totalBudget)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{c.status.replace(/_/g, ' ')}</Badge>
                <Link href={`/portal/campaigns/${c.id}`}>
                  <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" />View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
