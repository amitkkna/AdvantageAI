'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { ClipboardCheck, MapPin } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

export default function FieldCheckinsPage() {
  const [checkins, setCheckins] = useState<any[]>([]);

  useEffect(() => {
    api.get('/field-checkins').then(({ data }) => setCheckins(data.data || []));
  }, []);

  const conditionColor = (c: string) => {
    switch (c) { case 'GOOD': return 'success'; case 'NEEDS_REPAIR': return 'warning'; case 'DAMAGED': return 'destructive'; default: return 'secondary'; }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'FIELD']}>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Field Check-ins</h1>
      <div className="space-y-3">
        {checkins.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ClipboardCheck className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">{c.asset?.name} ({c.asset?.code})</p>
                  <p className="text-sm text-muted-foreground">By {c.user?.name} - {new Date(c.createdAt).toLocaleString()}</p>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </div>
              </div>
              <Badge variant={conditionColor(c.condition) as any}>{c.condition.replace(/_/g, ' ')}</Badge>
            </CardContent>
          </Card>
        ))}
        {checkins.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No field check-ins recorded</CardContent></Card>}
      </div>
    </div>
    </RoleGuard>
  );
}
