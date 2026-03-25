'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  LayoutDashboard, MapPin, Megaphone, Calendar, FileText,
  Users, Building2, Bot, Bell, Receipt, ImagePlus,
  BarChart3, ClipboardCheck, ChevronLeft, ChevronRight, Activity, Upload, MessageSquarePlus, Brain
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Enquiries', href: '/dashboard/enquiries', icon: MessageSquarePlus, roles: ['ADMIN', 'SALES'] },
  { title: 'Assets', href: '/dashboard/assets', icon: MapPin },
  { title: 'Map View', href: '/dashboard/map', icon: MapPin },
  { title: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { title: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { title: 'AI Planner', href: '/dashboard/ai-chat', icon: Bot },
  { title: 'AI Agent', href: '/dashboard/ai-agent', icon: Brain, roles: ['ADMIN', 'SALES', 'FINANCE'] },
  { title: 'Proposals', href: '/dashboard/proposals', icon: FileText },
  { title: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { title: 'Creatives', href: '/dashboard/creatives', icon: ImagePlus },
  { title: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['ADMIN', 'SALES', 'FINANCE'] },
  { title: 'Vendors', href: '/dashboard/vendors', icon: Building2, roles: ['ADMIN', 'SALES'] },
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['ADMIN', 'SALES', 'FINANCE'] },
  { title: 'Field Check-ins', href: '/dashboard/field-checkins', icon: ClipboardCheck, roles: ['ADMIN', 'FIELD'] },
  { title: 'Bulk Import', href: '/dashboard/import', icon: Upload, roles: ['ADMIN', 'SALES'] },
  { title: 'Activity Logs', href: '/dashboard/activity-logs', icon: Activity, roles: ['ADMIN'] },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

const clientNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { title: 'Campaigns', href: '/portal/campaigns', icon: Megaphone },
  { title: 'Map', href: '/portal/map', icon: MapPin },
  { title: 'Analytics', href: '/portal/analytics', icon: BarChart3 },
  { title: 'Creatives', href: '/portal/creatives', icon: ImagePlus },
  { title: 'Documents', href: '/portal/documents', icon: FileText },
  { title: 'AI Planner', href: '/portal/ai-chat', icon: Bot },
  { title: 'Notifications', href: '/portal/notifications', icon: Bell },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);

  const items = user?.role === 'CLIENT' ? clientNavItems : navItems;
  const filteredItems = items.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isMobile = !!mobile;
  const isCollapsed = !isMobile && collapsed;

  return (
    <div className={cn(
      'flex flex-col h-full bg-card border-r transition-all duration-300',
      isMobile ? 'w-full' : isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {(!isCollapsed || isMobile) && (
          <Link href="/dashboard" className="flex items-center space-x-2" onClick={onNavigate}>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              AV
            </div>
            <span className="font-semibold text-lg">AdVantage</span>
          </Link>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1" data-tour="sidebar">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobile) && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            {user?.name} ({user?.role})
          </div>
        </div>
      )}
    </div>
  );
}
