import React, { useCallback } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Explicitly type 'f' as 'any' to avoid TS error 'Property name does not exist on type unknown'
    const files = Array.from(e.dataTransfer.files).filter((f: any) => 
      f.name.endsWith('.docx') || f.name.endsWith('.doc')
    ) as File[];
    if (files.length > 0) onFilesAdded(files);
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      onFilesAdded(files);
    }
  };

  return (
    <div 
      className="w-full relative group cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input 
        type="file" 
        multiple 
        accept=".docx,.doc" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleInputChange}
      />
      <div className="border-2 border-dashed border-brand-300 group-hover:border-brand-500 rounded-xl p-8 bg-brand-50/50 group-hover:bg-brand-50 transition-all text-center">
        <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-brand-700 font-medium text-lg">点击或拖拽上传 Word 文档</p>
        <p className="text-brand-400 text-sm mt-1">支持 .docx 格式</p>
      </div>
    </div>
  );
};