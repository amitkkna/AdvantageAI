'use client';

import { useAuthStore } from '@/stores/auth-store';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultFallback() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <ShieldAlert className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
      </p>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

/** Hook version for conditional rendering */
export function useHasRole(allowedRoles: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  return !!user && allowedRoles.includes(user.role);
}
