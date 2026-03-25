'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { INR, CampaignStatus, VALID_STATUS_TRANSITIONS } from '@advantage/shared';
import { ArrowLeft, Calendar, Building2, User, History, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignROI } from '@/components/campaign-roi';
import { ActivityHistory } from '@/components/activity-history';

const WORKFLOW_STEPS = ['DRAFT', 'PROPOSAL_SENT', 'CLIENT_APPROVED', 'CREATIVE_PENDING', 'CREATIVE_APPROVED', 'LIVE', 'COMPLETED'];

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(({ data }) => setCampaign(data.data))
      .catch(() => router.push('/dashboard/campaigns'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/campaigns/${id}/status`, { status: newStatus });
      const { data } = await api.get(`/campaigns/${id}`);
      setCampaign(data.data);
    } catch (error: any) {
      toast({ title: 'Status update failed', description: error.response?.data?.error || 'Failed to update status.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!campaign) return null;

  const currentStepIndex = WORKFLOW_STEPS.indexOf(campaign.status);
  const progressPercent = campaign.status === 'CANCELLED' ? 0 : ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;
  const validTransitions = VALID_STATUS_TRANSITIONS[campaign.status as keyof typeof VALID_STATUS_TRANSITIONS] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.client?.companyName}</p>
        </div>
        <Badge variant={campaign.status === 'LIVE' ? 'success' : campaign.status === 'CANCELLED' ? 'destructive' : 'default' as any} className="text-sm px-3 py-1">
          {campaign.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Workflow Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step} className={`flex flex-col items-center ${i <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentStepIndex ? 'bg-primary text-primary-foreground'
                  : i === currentStepIndex ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted'
                }`}>
                  {i + 1}
                </div>
                <span className="text-[10px] mt-1 text-center max-w-[80px]">{step.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-2" />

          {validTransitions.length > 0 && (
            <div className="flex gap-2 mt-4 justify-end">
              {validTransitions.map((status) => (
                <Button
                  key={status}
                  variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                >
                  {status.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />ROI & Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Start: {new Date(campaign.startDate).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>End: {new Date(campaign.endDate).toLocaleDateString()}</span></div>
              <div>Budget: {INR.format(campaign.totalBudget)}</div>
              <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>Rep: {campaign.assignedTo?.name || 'Unassigned'}</span></div>
              {campaign.description && <div className="col-span-2 text-muted-foreground">{campaign.description}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bookings ({campaign.bookings?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              {campaign.bookings?.length > 0 ? (
                <div className="space-y-3">
                  {campaign.bookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{booking.asset?.name || booking.assetId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{INR.format(booking.amount)}</p>
                        <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'secondary' as any} className="text-xs">{booking.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Client</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{campaign.client?.companyName}</p>
              <p className="text-muted-foreground">{campaign.client?.contactPerson}</p>
              <p className="text-muted-foreground">{campaign.client?.email}</p>
              <p className="text-muted-foreground">{campaign.client?.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              {campaign.invoices?.length > 0 ? (
                <div className="space-y-2">
                  {campaign.invoices.map((inv: any) => (
                    <div key={inv.id} className="flex justify-between text-sm">
                      <span>{inv.invoiceNumber}</span>
                      <span>{INR.format(inv.totalAmount)}</span>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'warning' as any} className="text-xs">{inv.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No invoices</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="roi">
          <CampaignROI campaignId={id as string} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHistory entity="Campaign" entityId={id as string} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
