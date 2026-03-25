'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useUrlFilters(defaults: Record<string, string> = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const result: Record<string, string> = { ...defaults };
    searchParams.forEach((value, key) => {
      if (value) result[key] = value;
    });
    return result;
  }, [searchParams, defaults]);

  const setFilters = useCallback((newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(newFilters)) {
      if (value && value !== defaults[key]) {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, defaults]);

  const setFilter = useCallback((key: string, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  }, [filters, setFilters]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => value && key !== 'page' && key !== 'limit' && value !== defaults[key]).length;
  }, [filters, defaults]);

  return { filters, setFilter, setFilters, clearFilters, activeCount };
}
