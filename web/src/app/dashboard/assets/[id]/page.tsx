'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { MapPin, Calendar, Building2, Edit, ArrowLeft, Camera, History } from 'lucide-react';
import { AssetPhotoGallery } from '@/components/asset-photo-gallery';
import { ActivityHistory } from '@/components/activity-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/assets/${id}`)
      .then(({ data }) => setAsset(data.data))
      .catch(() => router.push('/dashboard/assets'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!asset) return null;

  const statusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success'; case 'PARTIALLY_BOOKED': return 'warning';
      case 'FULLY_BOOKED': return 'destructive'; default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-muted-foreground">{asset.code}</p>
          </div>
          <Badge variant={statusColor(asset.status) as any}>{asset.status.replace(/_/g, ' ')}</Badge>
        </div>
        <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Edit</Button>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />Photos ({asset.photos?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssetPhotoGallery photos={asset.photos || []} assetName={asset.name} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {asset.type.replace(/_/g, ' ')}</div>
                <div><span className="text-muted-foreground">Lighting:</span> {asset.lighting.replace(/_/g, ' ')}</div>
                <div><span className="text-muted-foreground">Size:</span> {asset.width} x {asset.height} ft</div>
                <div><span className="text-muted-foreground">Faces:</span> {asset.faces}</div>
                <div><span className="text-muted-foreground">Monthly Rate:</span> {INR.format(asset.monthlyRate)}</div>
                <div><span className="text-muted-foreground">Daily Rate:</span> {asset.dailyRate ? INR.format(asset.dailyRate) : 'N/A'}</div>
                <div><span className="text-muted-foreground">Traffic:</span> {asset.trafficCount?.toLocaleString() || 'N/A'}</div>
                <div><span className="text-muted-foreground">Landmark:</span> {asset.landmark || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{asset.address}, {asset.city}, {asset.state}</span>
              </div>
              <div className="bg-muted rounded-lg h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p>Map View</p>
                  <p className="text-xs mt-1">{asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Vendor</CardTitle></CardHeader>
            <CardContent>
              {asset.vendor && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{asset.vendor.name}</p>
                  <p className="text-muted-foreground">{asset.vendor.contactPerson}</p>
                  <p className="text-muted-foreground">{asset.vendor.email}</p>
                  <p className="text-muted-foreground">{asset.vendor.phone}</p>
                  <Badge variant="outline">Reliability: {asset.vendor.reliabilityScore}%</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Active Bookings</CardTitle></CardHeader>
            <CardContent>
              {asset.bookings?.length > 0 ? (
                <div className="space-y-3">
                  {asset.bookings.map((b: any) => (
                    <div key={b.id} className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium">{b.campaign?.name}</p>
                      <p className="text-muted-foreground">{b.campaign?.client?.companyName}</p>
                      <p className="text-xs mt-1">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                      </p>
                      <Badge variant={b.status === 'CONFIRMED' ? 'default' : 'secondary'} className="mt-1">
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active bookings</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHistory entity="Asset" entityId={id as string} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
