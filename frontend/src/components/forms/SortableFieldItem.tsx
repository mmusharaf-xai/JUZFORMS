import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField } from '@/types';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import FieldPreview from './FieldPreview';

interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border rounded-lg p-4 bg-white transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 cursor-grab text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <FieldPreview field={field} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SortableFieldItem;
