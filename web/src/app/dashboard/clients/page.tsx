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
import { Plus } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

const clientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  industry: z.string().min(1, 'Industry is required'),
  gstNumber: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { companyName: '', contactPerson: '', email: '', phone: '', address: '', city: 'Raipur', industry: '', gstNumber: '' },
  });

  const fetchClients = () => {
    api.get('/clients', { params: { limit: 100 } })
      .then(({ data }) => setClients(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const onSubmit = async (data: ClientForm) => {
    try {
      await api.post('/clients', data);
      setShowCreate(false);
      reset();
      fetchClients();
      toast({ title: 'Client created', description: `${data.companyName} has been added.` });
    } catch (error: any) {
      toast({ title: 'Failed to create client', description: error.response?.data?.error || 'Something went wrong.', variant: 'destructive' });
    }
  };

  const FormError = ({ field }: { field: keyof ClientForm }) =>
    errors[field] ? <p className="text-sm text-destructive">{errors[field]?.message}</p> : null;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SALES', 'FINANCE']}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) reset(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Company Name</Label><Input {...register('companyName')} /><FormError field="companyName" /></div>
                <div><Label>Contact Person</Label><Input {...register('contactPerson')} /><FormError field="contactPerson" /></div>
                <div><Label>Email</Label><Input type="email" {...register('email')} /><FormError field="email" /></div>
                <div><Label>Phone</Label><Input {...register('phone')} /><FormError field="phone" /></div>
              </div>
              <div><Label>Address</Label><Input {...register('address')} /><FormError field="address" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input {...register('city')} /><FormError field="city" /></div>
                <div><Label>Industry</Label><Input {...register('industry')} /><FormError field="industry" /></div>
              </div>
              <Button type="submit" className="w-full">Create Client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{client.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{client.email}</p>
              <p>{client.phone}</p>
              <p className="text-muted-foreground">{client.city}</p>
              <Badge variant="outline">{client.industry}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </RoleGuard>
  );
}
