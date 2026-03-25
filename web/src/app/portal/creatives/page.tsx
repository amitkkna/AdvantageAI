'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { ImagePlus, Upload } from 'lucide-react';

export default function ClientCreativesPage() {
  const [creatives, setCreatives] = useState<any[]>([]);

  useEffect(() => {
    api.get('/creatives').then(({ data }) => setCreatives(data.data || []));
  }, []);

  const statusColor = (s: string) => {
    switch (s) { case 'APPROVED': return 'success'; case 'REJECTED': return 'destructive'; default: return 'warning'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creative Manager</h1>
        <Button><Upload className="mr-2 h-4 w-4" />Upload Creative</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Size Guides</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Billboard (40x20 ft)</p>
            <p className="text-xs text-muted-foreground">File: 12000x6000px, 300 DPI</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Unipole (20x10 ft)</p>
            <p className="text-xs text-muted-foreground">File: 6000x3000px, 300 DPI</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Bus Shelter (8x4 ft)</p>
            <p className="text-xs text-muted-foreground">File: 2400x1200px, 300 DPI</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{c.fileName}</p>
                <p className="text-xs text-muted-foreground">{c.asset?.name}</p>
              </div>
              <Badge variant={statusColor(c.status) as any}>{c.status}</Badge>
              {c.rejectionReason && <p className="text-xs text-destructive">{c.rejectionReason}</p>}
            </CardContent>
          </Card>
        ))}
        {creatives.length === 0 && <Card className="col-span-full"><CardContent className="p-12 text-center text-muted-foreground">Upload creatives for your booked locations</CardContent></Card>}
      </div>
    </div>
  );
}
