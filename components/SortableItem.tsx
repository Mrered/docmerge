import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocFile } from '../types';
import { formatFileSize } from '../utils/formatters';

interface Props {
  file: DocFile;
  onRemove: (id: string) => void;
}

export const SortableItem: React.FC<Props> = ({ file, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-3 touch-none select-none"
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        
        {/* File Icon */}
        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center">
           <span className="text-xs font-bold">DOC</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{file.name}</h3>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>

      {/* Remove Button */}
      <button 
        onClick={() => onRemove(file.id)}
        className="ml-3 p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};
