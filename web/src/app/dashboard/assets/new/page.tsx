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
import { AssetType, LightingType } from '@advantage/shared';

const assetSchema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  type: z.string().min(1, 'Type is required'),
  lighting: z.string().min(1, 'Lighting is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().default('Chhattisgarh'),
  latitude: z.string().min(1, 'Latitude is required'),
  longitude: z.string().min(1, 'Longitude is required'),
  width: z.string().min(1, 'Width is required'),
  height: z.string().min(1, 'Height is required'),
  faces: z.string().default('1'),
  monthlyRate: z.string().min(1, 'Monthly rate is required'),
  dailyRate: z.string().optional(),
  trafficCount: z.string().optional(),
  landmark: z.string().optional(),
  description: z.string().optional(),
  vendorId: z.string().optional(),
});

type AssetForm = z.infer<typeof assetSchema>;

export default function NewAssetPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      code: '', name: '', type: 'BILLBOARD', address: '', city: 'Raipur',
      state: 'Chhattisgarh', latitude: '', longitude: '', width: '', height: '',
      lighting: 'FRONT_LIT', faces: '1', monthlyRate: '', dailyRate: '',
      trafficCount: '', landmark: '', description: '', vendorId: '',
    },
  });

  useEffect(() => {
    api.get('/vendors', { params: { limit: 100 } }).then(({ data }) => setVendors(data.data || []));
  }, []);

  const onSubmit = async (form: AssetForm) => {
    setLoading(true);
    try {
      await api.post('/assets', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        width: parseFloat(form.width),
        height: parseFloat(form.height),
        faces: parseInt(form.faces),
        monthlyRate: parseFloat(form.monthlyRate),
        dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
        trafficCount: form.trafficCount ? parseInt(form.trafficCount) : undefined,
      });
      toast({ title: 'Asset created', description: 'New asset has been added successfully.' });
      router.push('/dashboard/assets');
    } catch (error: any) {
      toast({ title: 'Failed to create asset', description: error.response?.data?.error || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const FormError = ({ field }: { field: keyof AssetForm }) =>
    errors[field] ? <p className="text-sm text-destructive">{errors[field]?.message}</p> : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Add New Asset</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Asset Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Code</Label>
                <Input {...register('code')} placeholder="RPR-XXX" />
                <FormError field="code" />
              </div>
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input {...register('name')} placeholder="Location Name" />
                <FormError field="name" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={watch('type')} onValueChange={(v) => setValue('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(AssetType).map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lighting</Label>
                <Select value={watch('lighting')} onValueChange={(v) => setValue('lighting', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(LightingType).map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register('address')} />
              <FormError field="address" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register('city')} />
                <FormError field="city" />
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" {...register('latitude')} />
                <FormError field="latitude" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" {...register('longitude')} />
                <FormError field="longitude" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Width (ft)</Label>
                <Input type="number" {...register('width')} />
                <FormError field="width" />
              </div>
              <div className="space-y-2">
                <Label>Height (ft)</Label>
                <Input type="number" {...register('height')} />
                <FormError field="height" />
              </div>
              <div className="space-y-2">
                <Label>Faces</Label>
                <Input type="number" {...register('faces')} />
              </div>
              <div className="space-y-2">
                <Label>Traffic Count</Label>
                <Input type="number" {...register('trafficCount')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Rate (INR)</Label>
                <Input type="number" {...register('monthlyRate')} />
                <FormError field="monthlyRate" />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={watch('vendorId')} onValueChange={(v) => setValue('vendorId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Landmark</Label>
              <Input {...register('landmark')} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Asset'}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
