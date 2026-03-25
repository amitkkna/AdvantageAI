'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

export function FilterPanel({ fields, values, onChange, onClear, activeCount }: FilterPanelProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeCount > 0 && (
            <>
              <Badge variant="secondary" className="text-xs">{activeCount} active</Badge>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClear}>
                <X className="h-3 w-3 mr-1" />Clear
              </Button>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {fields.map((field) => (
            <div key={field.key}>
              {field.type === 'select' && field.options && (
                <Select value={values[field.key] || ''} onValueChange={(v) => onChange(field.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {field.label}</SelectItem>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === 'text' && (
                <Input
                  className="h-9 text-sm"
                  placeholder={field.placeholder || field.label}
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
              {field.type === 'date' && (
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
