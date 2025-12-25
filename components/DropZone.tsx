import React, { useCallback } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Explicitly type 'f' as 'any' to avoid TS error
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
      <div className="border-[3px] border-dashed border-brand-200 dark:border-slate-700 group-hover:border-brand-500 dark:group-hover:border-brand-400 rounded-3xl p-8 bg-brand-50/50 dark:bg-slate-800/50 group-hover:bg-brand-50 dark:group-hover:bg-slate-800 transition-all text-center backdrop-blur-sm">
        <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-brand-900 dark:text-slate-100 font-semibold text-lg">点击或拖拽上传</p>
        <p className="text-brand-500 dark:text-slate-400 text-sm mt-1">支持 .docx 格式</p>
      </div>
    </div>
  );
};