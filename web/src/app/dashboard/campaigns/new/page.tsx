'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  clientId: z.string().min(1, 'Client is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalBudget: z.string().min(1, 'Budget is required'),
  description: z.string().optional(),
}).refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CampaignForm = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: '', clientId: '', startDate: '', endDate: '', totalBudget: '', description: '' },
  });

  useEffect(() => {
    api.get('/clients', { params: { limit: 100 } }).then(({ data }) => setClients(data.data || []));
  }, []);

  const onSubmit = async (form: CampaignForm) => {
    setLoading(true);
    try {
      await api.post('/campaigns', { ...form, totalBudget: parseFloat(form.totalBudget) });
      toast({ title: 'Campaign created', description: 'New campaign has been created successfully.' });
      router.push('/dashboard/campaigns');
    } catch (error: any) {
      toast({ title: 'Failed to create campaign', description: error.response?.data?.error || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const FormError = ({ field }: { field: keyof CampaignForm }) =>
    errors[field] ? <p className="text-sm text-destructive">{errors[field]?.message}</p> : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Campaign</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input {...register('name')} />
              <FormError field="name" />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={watch('clientId')} onValueChange={(v) => setValue('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormError field="clientId" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...register('startDate')} />
                <FormError field="startDate" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...register('endDate')} />
                <FormError field="endDate" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Budget (INR)</Label>
              <Input type="number" {...register('totalBudget')} />
              <FormError field="totalBudget" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register('description')} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Campaign'}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
