import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { WidgetType } from '@/types';

interface WidgetItemProps {
  widget: {
    type: WidgetType;
    label: string;
    icon: React.ElementType;
  };
}

const WidgetItem: React.FC<WidgetItemProps> = ({ widget }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `widget-${widget.type}`,
  });

  const Icon = widget.icon;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 border rounded-lg cursor-grab hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-sm">{widget.label}</span>
    </div>
  );
};

export default WidgetItem;
