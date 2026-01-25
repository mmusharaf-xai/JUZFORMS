import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableCanvasProps {
  children: React.ReactNode;
  isEmpty?: boolean;
}

const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ children, isEmpty }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[300px] border-2 border-dashed rounded-lg p-4 transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-gray-200',
        isEmpty && 'flex items-center justify-center'
      )}
    >
      {isEmpty ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg mb-2">Drag and drop widgets here</p>
          <p className="text-sm">to build your form</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default DroppableCanvas;
