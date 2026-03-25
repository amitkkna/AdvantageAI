'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { INR } from '@advantage/shared';
import {
  Plus, ArrowLeft, ArrowRightLeft, MessageSquarePlus, Phone, Mail, Building2,
  MapPin, Calendar, StickyNote, User, ExternalLink,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'default',
  CONTACTED: 'secondary',
  QUALIFIED: 'warning',
  PROPOSAL_SENT: 'default',
  CONVERTED: 'success',
  LOST: 'destructive',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'destructive',
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '',
    industry: '', budget: '', requirements: '', priority: 'MEDIUM',
    source: '', assignedToId: '', cities: '', assetTypes: '',
    startDate: '', endDate: '',
  });

  const fetchEnquiries = () => {
    const params: any = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    api.get('/enquiries', { params })
      .then(({ data }) => setEnquiries(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEnquiries(); }, [statusFilter]);

  useEffect(() => {
    api.get('/users', { params: { role: 'SALES' } })
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => {});
  }, []);

  const viewEnquiry = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/enquiries/${id}`);
      setSelectedEnquiry(data.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load enquiry', variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload: any = {
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        priority: form.priority,
      };
      if (form.industry) payload.industry = form.industry;
      if (form.budget) payload.budget = parseFloat(form.budget);
      if (form.requirements) payload.requirements = form.requirements;
      if (form.source) payload.source = form.source;
      if (form.assignedToId) payload.assignedToId = form.assignedToId;
      if (form.cities) payload.cities = form.cities.split(',').map((c: string) => c.trim());
      if (form.assetTypes) payload.assetTypes = form.assetTypes.split(',').map((t: string) => t.trim());
      if (form.startDate) payload.startDate = form.startDate;
      if (form.endDate) payload.endDate = form.endDate;

      await api.post('/enquiries', payload);
      toast({ title: 'Success', description: 'Enquiry created successfully' });
      setShowCreateDialog(false);
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', industry: '', budget: '', requirements: '', priority: 'MEDIUM', source: '', assignedToId: '', cities: '', assetTypes: '', startDate: '', endDate: '' });
      fetchEnquiries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to create enquiry', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: string, lostReason?: string) => {
    try {
      await api.patch(`/enquiries/${id}/status`, { status, lostReason });
      toast({ title: 'Status updated' });
      if (selectedEnquiry?.id === id) viewEnquiry(id);
      fetchEnquiries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to update status', variant: 'destructive' });
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedEnquiry) return;
    try {
      await api.post(`/enquiries/${selectedEnquiry.id}/add-note`, { text: newNote });
      setNewNote('');
      viewEnquiry(selectedEnquiry.id);
      toast({ title: 'Note added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  const convertEnquiry = async () => {
    if (!selectedEnquiry) return;
    setConverting(true);
    try {
      const { data } = await api.post(`/enquiries/${selectedEnquiry.id}/convert`);
      toast({ title: 'Converted', description: `Enquiry converted to campaign successfully` });
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to convert', variant: 'destructive' });
    } finally {
      setConverting(false);
    }
  };

  // ── Detail View ──
  if (selectedEnquiry) {
    const cities = (selectedEnquiry.cities as string[]) || [];
    const assetTypes = (selectedEnquiry.assetTypes as string[]) || [];
    const notes = (selectedEnquiry.notes as any[]) || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedEnquiry(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedEnquiry.companyName}</h1>
              <p className="text-sm text-muted-foreground">{selectedEnquiry.contactPerson} - {selectedEnquiry.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={STATUS_COLORS[selectedEnquiry.status] as any} className="text-sm px-3 py-1">
              {selectedEnquiry.status.replace('_', ' ')}
            </Badge>
            <Badge variant={PRIORITY_COLORS[selectedEnquiry.priority] as any} className="text-sm px-3 py-1">
              {selectedEnquiry.priority}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedEnquiry.phone}</div>
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedEnquiry.email}</div>
              {selectedEnquiry.industry && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /> {selectedEnquiry.industry}</div>}
              {selectedEnquiry.source && <div className="flex items-center gap-2 text-sm"><ExternalLink className="h-4 w-4 text-muted-foreground" /> Source: {selectedEnquiry.source}</div>}
              {selectedEnquiry.assignedTo && <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /> Assigned: {selectedEnquiry.assignedTo.name}</div>}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedEnquiry.budget && <div className="text-sm"><span className="text-muted-foreground">Budget:</span> <span className="font-semibold">{INR.format(selectedEnquiry.budget)}</span></div>}
              {cities.length > 0 && <div className="text-sm"><span className="text-muted-foreground">Cities:</span> <div className="flex flex-wrap gap-1 mt-1">{cities.map((c: string) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div></div>}
              {assetTypes.length > 0 && <div className="text-sm"><span className="text-muted-foreground">Asset Types:</span> <div className="flex flex-wrap gap-1 mt-1">{assetTypes.map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t.replace(/_/g, ' ')}</Badge>)}</div></div>}
              {selectedEnquiry.startDate && <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /> {new Date(selectedEnquiry.startDate).toLocaleDateString()} - {selectedEnquiry.endDate ? new Date(selectedEnquiry.endDate).toLocaleDateString() : 'TBD'}</div>}
              {selectedEnquiry.requirements && <div className="text-sm mt-2"><span className="text-muted-foreground">Details:</span><p className="mt-1">{selectedEnquiry.requirements}</p></div>}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedEnquiry.status === 'NEW' && (
                <Button className="w-full" size="sm" onClick={() => updateStatus(selectedEnquiry.id, 'CONTACTED')}>
                  Mark as Contacted
                </Button>
              )}
              {selectedEnquiry.status === 'CONTACTED' && (
                <Button className="w-full" size="sm" onClick={() => updateStatus(selectedEnquiry.id, 'QUALIFIED')}>
                  Mark as Qualified
                </Button>
              )}
              {selectedEnquiry.status === 'QUALIFIED' && (
                <Button className="w-full" size="sm" onClick={() => updateStatus(selectedEnquiry.id, 'PROPOSAL_SENT')}>
                  Mark Proposal Sent
                </Button>
              )}
              {(selectedEnquiry.status === 'PROPOSAL_SENT' || selectedEnquiry.status === 'QUALIFIED') && (
                <Button className="w-full" size="sm" variant="default" onClick={convertEnquiry} disabled={converting}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  {converting ? 'Converting...' : 'Convert to Campaign'}
                </Button>
              )}
              {!['CONVERTED', 'LOST'].includes(selectedEnquiry.status) && (
                <Button className="w-full" size="sm" variant="destructive" onClick={() => {
                  const reason = prompt('Reason for losing this enquiry:');
                  if (reason !== null) updateStatus(selectedEnquiry.id, 'LOST', reason);
                }}>
                  Mark as Lost
                </Button>
              )}
              {selectedEnquiry.status === 'LOST' && (
                <Button className="w-full" size="sm" variant="outline" onClick={() => updateStatus(selectedEnquiry.id, 'NEW')}>
                  Reopen Enquiry
                </Button>
              )}
              {selectedEnquiry.campaign && (
                <a href={`/dashboard/campaigns/${selectedEnquiry.campaign.id}`} className="block">
                  <Button className="w-full" size="sm" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Campaign
                  </Button>
                </a>
              )}
              {selectedEnquiry.lostReason && (
                <div className="p-3 bg-destructive/10 rounded-md text-sm">
                  <span className="font-medium text-destructive">Lost Reason:</span> {selectedEnquiry.lostReason}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proposals */}
        {selectedEnquiry.proposals?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Proposals ({selectedEnquiry.proposals.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedEnquiry.proposals.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{INR.format(p.totalBudget)}</p>
                    </div>
                    <Badge variant={STATUS_COLORS[p.status] as any}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Add</Button>
            </div>
            {notes.length > 0 ? (
              <div className="space-y-2 mt-3">
                {notes.slice().reverse().map((note: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(note.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Enquiries</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Enquiry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Enquiry</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company Name *</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div><Label>Contact Person *</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              <div><Label>Budget</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
              <div><Label>Cities (comma-separated)</Label><Input value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })} placeholder="Raipur, Bhilai" /></div>
              <div><Label>Asset Types (comma-separated)</Label><Input value={form.assetTypes} onChange={(e) => setForm({ ...form, assetTypes: e.target.value })} placeholder="BILLBOARD, HOARDING" /></div>
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Website, Referral..." /></div>
              <div className="col-span-2"><Label>Requirements</Label><Input value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Campaign details..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !form.companyName || !form.email || !form.phone || !form.contactPerson}>
                {creating ? 'Creating...' : 'Create Enquiry'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="NEW">New</TabsTrigger>
          <TabsTrigger value="CONTACTED">Contacted</TabsTrigger>
          <TabsTrigger value="QUALIFIED">Qualified</TabsTrigger>
          <TabsTrigger value="PROPOSAL_SENT">Proposal Sent</TabsTrigger>
          <TabsTrigger value="CONVERTED">Converted</TabsTrigger>
          <TabsTrigger value="LOST">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading enquiries...</div>
      ) : enquiries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No enquiries yet</p>
            <p className="text-sm mt-1">Create your first enquiry to start the sales pipeline.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <Card key={e.id} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer" onClick={() => viewEnquiry(e.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquarePlus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{e.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.contactPerson} &bull; {e.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {e.assignedTo && <span className="text-xs text-muted-foreground">Assigned: {e.assignedTo.name}</span>}
                      {e.budget && <span className="text-xs text-muted-foreground">&bull; {INR.format(e.budget)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex gap-2 mb-1">
                      <Badge variant={PRIORITY_COLORS[e.priority] as any} className="text-xs">{e.priority}</Badge>
                      <Badge variant={STATUS_COLORS[e.status] as any}>{e.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
