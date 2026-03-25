'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Bell, LogOut, User, Search, Menu } from 'lucide-react';
import { CommandPalette } from '@/components/command-palette';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Generate breadcrumbs
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-2 text-sm">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center">
            {i > 0 && <span className="mx-2 text-muted-foreground">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center space-x-3">
        <CommandPalette />
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground h-9 px-3"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          data-tour="search"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-tour="theme-toggle">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => router.push(user?.role === 'CLIENT' ? '/portal/notifications' : '/dashboard/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-tour="user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
