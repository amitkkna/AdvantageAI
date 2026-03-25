'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bookmark, Star, Trash2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface SavedFilter {
  id: string;
  name: string;
  entity: string;
  filters: Record<string, any>;
  isDefault: boolean;
}

interface SavedViewsDropdownProps {
  entity: string;
  currentFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}

export function SavedViewsDropdown({ entity, currentFilters, onApply }: SavedViewsDropdownProps) {
  const [views, setViews] = useState<SavedFilter[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');

  const fetchViews = () => {
    api.get('/saved-filters', { params: { entity } })
      .then(({ data }) => setViews(data.data || []))
      .catch(() => {});
  };

  useEffect(() => { fetchViews(); }, [entity]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await api.post('/saved-filters', { name: saveName.trim(), entity, filters: currentFilters });
      toast({ title: 'View saved' });
      setSaveName('');
      setShowSave(false);
      fetchViews();
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/saved-filters/${id}`);
      setViews((prev) => prev.filter((v) => v.id !== id));
      toast({ title: 'View deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/saved-filters/${id}`, { isDefault: true });
      fetchViews();
    } catch {}
  };

  const hasActiveFilters = Object.values(currentFilters).some(Boolean);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Bookmark className="h-4 w-4" />
            Saved Views
            {views.length > 0 && <span className="text-xs text-muted-foreground">({views.length})</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">No saved views</div>
          )}
          {views.map((view) => (
            <DropdownMenuItem key={view.id} onClick={() => onApply(view.filters)} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {view.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                {view.name}
              </span>
              <span className="flex items-center gap-0.5">
                {!view.isDefault && (
                  <button onClick={(e) => handleSetDefault(view.id, e)} className="p-1 hover:text-yellow-500" title="Set as default">
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button onClick={(e) => handleDelete(view.id, e)} className="p-1 hover:text-red-500" title="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!hasActiveFilters}
            onClick={() => setShowSave(true)}
          >
            <Save className="h-4 w-4 mr-2" />Save current view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Filter View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="View name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSave(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!saveName.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
