'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import {
  LayoutDashboard, MapPin, Megaphone, Calendar, FileText,
  Users, Building2, Bot, Bell, BarChart3, ClipboardCheck,
  Activity, Receipt, ImagePlus, User, Search, Moon, Sun, LogOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface SearchResult {
  id: string;
  label: string;
  type: 'asset' | 'campaign' | 'client';
  subtitle?: string;
}

const navPages = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Assets', href: '/dashboard/assets', icon: MapPin },
  { label: 'Map View', href: '/dashboard/map', icon: MapPin },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { label: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { label: 'AI Planner', href: '/dashboard/ai-chat', icon: Bot },
  { label: 'Proposals', href: '/dashboard/proposals', icon: FileText },
  { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Creatives', href: '/dashboard/creatives', icon: ImagePlus },
  { label: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['ADMIN', 'SALES', 'FINANCE'] },
  { label: 'Vendors', href: '/dashboard/vendors', icon: Building2, roles: ['ADMIN', 'SALES'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['ADMIN', 'SALES', 'FINANCE'] },
  { label: 'Field Check-ins', href: '/dashboard/field-checkins', icon: ClipboardCheck, roles: ['ADMIN', 'FIELD'] },
  { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: Activity, roles: ['ADMIN'] },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search API when query changes
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const [assets, campaigns, clients] = await Promise.all([
          api.get('/assets', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } })),
          api.get('/campaigns', { params: { limit: 50 } }).catch(() => ({ data: { data: [] } })),
          ['ADMIN', 'SALES', 'FINANCE'].includes(user?.role || '')
            ? api.get('/clients', { params: { limit: 50 } }).catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
        ]);

        const searchResults: SearchResult[] = [];

        (assets.data.data || []).forEach((a: any) => {
          searchResults.push({ id: a.id, label: `${a.code} - ${a.name}`, type: 'asset', subtitle: `${a.city} | ${a.type}` });
        });

        (campaigns.data.data || []).filter((c: any) =>
          c.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5).forEach((c: any) => {
          searchResults.push({ id: c.id, label: c.name, type: 'campaign', subtitle: c.status });
        });

        (clients.data.data || []).filter((c: any) =>
          c.companyName.toLowerCase().includes(query.toLowerCase()) ||
          c.contactPerson?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5).forEach((c: any) => {
          searchResults.push({ id: c.id, label: c.companyName, type: 'client', subtitle: c.contactPerson });
        });

        setResults(searchResults);
      } catch { setResults([]); }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.role]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const filteredPages = navPages.filter((p) => {
    if (p.roles && (!user || !p.roles.includes(user.role))) return false;
    return true;
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search assets, campaigns, clients or type a command..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? 'Searching...' : 'No results found.'}</CommandEmpty>

        {/* Search results */}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((r) => (
              <CommandItem
                key={`${r.type}-${r.id}`}
                onSelect={() => navigate(
                  r.type === 'asset' ? `/dashboard/assets/${r.id}`
                    : r.type === 'campaign' ? `/dashboard/campaigns/${r.id}`
                    : `/dashboard/clients`
                )}
              >
                {r.type === 'asset' ? <MapPin className="mr-2 h-4 w-4" /> :
                 r.type === 'campaign' ? <Megaphone className="mr-2 h-4 w-4" /> :
                 <Users className="mr-2 h-4 w-4" />}
                <div>
                  <p className="text-sm">{r.label}</p>
                  {r.subtitle && <p className="text-xs text-muted-foreground">{r.subtitle}</p>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation */}
        <CommandGroup heading="Pages">
          {filteredPages.map((page) => (
            <CommandItem key={page.href} onSelect={() => navigate(page.href)}>
              <page.icon className="mr-2 h-4 w-4" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); }}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </CommandItem>
          <CommandItem onSelect={() => { logout(); router.push('/login'); setOpen(false); }}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
