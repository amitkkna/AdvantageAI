'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { FileText, Receipt, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClientDocumentsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/proposals', { params: { limit: 50 } }),
      api.get('/invoices', { params: { limit: 50 } }),
    ]).then(([pRes, iRes]) => {
      setProposals(pRes.data.data || []);
      setInvoices(iRes.data.data || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documents</h1>
      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="proposals">
          <div className="space-y-3">
            {proposals.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{INR.format(p.totalBudget)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{p.status}</Badge>
                    {p.pdfUrl && <Button variant="outline" size="sm"><Download className="h-3 w-3" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {proposals.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No proposals yet</CardContent></Card>}
          </div>
        </TabsContent>
        <TabsContent value="invoices">
          <div className="space-y-3">
            {invoices.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Receipt className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{INR.format(inv.totalAmount)}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning' as any}>{inv.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {invoices.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No invoices yet</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
