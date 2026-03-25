'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  isCustomizing: boolean;
}

export function SortableWidget({ id, children, isCustomizing }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isCustomizing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -top-2 -left-2 z-10 p-1 bg-background border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-accent"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}
