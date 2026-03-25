'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Plus, Building2 } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

const vendorSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().default('Chhattisgarh'),
  gstNumber: z.string().optional(),
});

type VendorForm = z.infer<typeof vendorSchema>;

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: '', contactPerson: '', email: '', phone: '', address: '', city: 'Raipur', state: 'Chhattisgarh', gstNumber: '' },
  });

  const fetchVendors = () => {
    api.get('/vendors', { params: { limit: 100 } })
      .then(({ data }) => setVendors(data.data || []));
  };

  useEffect(() => { fetchVendors(); }, []);

  const onSubmit = async (data: VendorForm) => {
    try {
      await api.post('/vendors', data);
      setShowCreate(false);
      reset();
      fetchVendors();
      toast({ title: 'Vendor created', description: `${data.name} has been added.` });
    } catch (error: any) {
      toast({ title: 'Failed to create vendor', description: error.response?.data?.error || 'Something went wrong.', variant: 'destructive' });
    }
  };

  const FormError = ({ field }: { field: keyof VendorForm }) =>
    errors[field] ? <p className="text-sm text-destructive">{errors[field]?.message}</p> : null;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SALES']}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Vendor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Vendor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Company Name</Label><Input {...register('name')} /><FormError field="name" /></div>
                <div><Label>Contact Person</Label><Input {...register('contactPerson')} /><FormError field="contactPerson" /></div>
                <div><Label>Email</Label><Input type="email" {...register('email')} /><FormError field="email" /></div>
                <div><Label>Phone</Label><Input {...register('phone')} /><FormError field="phone" /></div>
              </div>
              <div><Label>Address</Label><Input {...register('address')} /><FormError field="address" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input {...register('city')} /><FormError field="city" /></div>
                <div><Label>GST Number</Label><Input {...register('gstNumber')} /></div>
              </div>
              <Button type="submit" className="w-full">Create Vendor</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{vendor.email}</p>
              <p>{vendor.phone}</p>
              <p className="text-muted-foreground">{vendor.city}, {vendor.state}</p>
              {vendor.gstNumber && <p className="text-xs text-muted-foreground">GST: {vendor.gstNumber}</p>}
              <Badge variant="outline">Reliability: {vendor.reliabilityScore}%</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </RoleGuard>
  );
}
