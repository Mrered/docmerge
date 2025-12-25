import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DocFile, SortType, PWAInstallPromptEvent } from './types';
import { DropZone } from './components/DropZone';
import { SortableItem } from './components/SortableItem';
import { mergeDocs } from './services/mergeService';
import { formatFileSize } from './utils/formatters';

const App: React.FC = () => {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [sortType, setSortType] = useState<SortType>('manual');
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPromptEvent | null>(null);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // Drag Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleFilesAdded = (newFiles: File[]) => {
    const docFiles: DocFile[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      lastModified: f.lastModified
    }));
    setFiles(prev => [...prev, ...docFiles]);
    setSortType('manual'); // Reset sort to manual on add
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setSortType('manual');
    }
  };

  const sortFiles = (type: SortType) => {
    setSortType(type);
    if (type === 'manual') return;

    const sorted = [...files].sort((a, b) => {
      if (type === 'name') return a.name.localeCompare(b.name);
      if (type === 'size') return b.size - a.size;
      if (type === 'date') return b.lastModified - a.lastModified;
      return 0;
    });
    setFiles(sorted);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsMerging(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const blob = await mergeDocs(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
      link.href = url;
      link.download = `合并文档_${timestamp}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('合并失败，请确保文件未损坏且格式正确。');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Doc Merge</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">合并大师</p>
            </div>
          </div>
          {installPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              获取 APP
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-32">
        {/* Upload Area */}
        <DropZone onFilesAdded={handleFilesAdded} />

        {/* Controls */}
        {files.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                文件列表
              </h2>
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                {(['name', 'date', 'size'] as SortType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => sortFiles(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      sortType === t 
                        ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t === 'name' && '名称'}
                    {t === 'date' && '时间'}
                    {t === 'size' && '大小'}
                  </button>
                ))}
              </div>
            </div>

            {/* Draggable List */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={files.map(f => f.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 pb-8">
                  {files.map(file => (
                    <SortableItem 
                      key={file.id} 
                      file={file} 
                      onRemove={handleRemove} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] z-50 transition-colors duration-300">
        <div className="max-w-2xl mx-auto p-4">
           <div className="flex items-center gap-4">
             <div className="hidden sm:block text-slate-500 dark:text-slate-400 text-sm font-medium">
               {files.length > 0 ? (
                  <span>已选 <span className="text-brand-600 dark:text-brand-400 font-bold">{files.length}</span> 个文件 · {formatFileSize(files.reduce((a,b) => a + b.size, 0))}</span>
               ) : (
                  '等待上传...'
               )}
             </div>
             <button
              onClick={handleMerge}
              disabled={files.length === 0 || isMerging}
              className={`flex-1 h-14 rounded-2xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                files.length === 0 || isMerging
                  ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/30'
              }`}
             >
               {isMerging ? (
                 <>
                  <svg className="animate-spin h-5 w-5 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>处理中...</span>
                 </>
               ) : (
                 <>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   <span>开始合并</span>
                 </>
               )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;