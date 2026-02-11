import React, { useState, useMemo } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { generateDAX } from './utils/daxGenerator';
import { GlobalConfig, CardConfig, ViewportMode } from './types';
import { Code, Eye, Copy, Check, Monitor, Smartphone, Tablet } from 'lucide-react';

const App: React.FC = () => {
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    columns: 3, gap: 20, padding: 24,
    primaryColor: '#4f46e5', cardBackgroundColor: '#ffffff',
    textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280',
    positiveColor: '#059669', negativeColor: '#DC2626', neutralColor: '#4B5563',
    animation: 'fadeInUp', animationDuration: 0.6, hoverEffect: 'lift',
    borderRadius: 20, cardMinHeight: 160,
    fontSizeTitle: 10, fontSizeValue: 32, fontSizeSub: 11,
    fontWeightTitle: 800, fontWeightValue: 800,
  });

  const [cards, setCards] = useState<CardConfig[]>([
    {
      id: '1', title: 'Performance Vendas', measurePlaceholder: 'FORMAT([Vendas], "R$ #,##0")', targetMeasurePlaceholder: '1000000',
      value: 'R$ 842.500', type: 'progress', progressValue: 84, icon: 'chart', isOpen: true,
      comparisons: [
        { id: 'c1', label: 'vs Mês Anterior', value: '+14%', trend: 'up', logic: '[Vendas] > [Vendas LM]' },
        { id: 'c2', label: 'vs Meta Anual', value: '-2.5%', trend: 'down', logic: '[Vendas] < [Meta]' }
      ]
    },
    {
      id: '2', title: 'Novos Clientes', measurePlaceholder: 'COUNT(Clientes[ID])', targetMeasurePlaceholder: '',
      value: '1.242', type: 'simple', progressValue: 0, icon: 'users', isOpen: false,
      comparisons: [
        { id: 'c3', label: 'Taxa Crescimento', value: '8.4%', trend: 'up', logic: 'TRUE()' }
      ]
    },
    {
      id: '3', title: 'NPS Score', measurePlaceholder: '[NPS_Score]', targetMeasurePlaceholder: '100',
      value: '78', type: 'ring', progressValue: 78, icon: 'activity', isOpen: false,
      comparisons: [
        { id: 'c4', label: 'Zona de Excelência', value: 'Alvo: 85', trend: 'none', logic: 'TRUE()' }
      ]
    }
  ]);

  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [copied, setCopied] = useState(false);

  const daxCode = useMemo(() => generateDAX(globalConfig, cards), [globalConfig, cards]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans text-gray-900">
      <div className="w-[420px] z-20 shadow-2xl relative">
        <Editor globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} cards={cards} setCards={setCards} />
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 shadow-sm z-10">
           <div className="flex bg-gray-200/50 p-1 rounded-xl border">
             <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><Eye size={14} /> Design</button>
             <button onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'code' ? 'bg-white text-indigo-600 shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><Code size={14} /> Código DAX</button>
           </div>
           
           <div className="flex items-center gap-4">
              {viewMode === 'preview' && (
                <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-xl border">
                    <button onClick={() => setViewport('mobile')} className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Smartphone size={16} /></button>
                    <button onClick={() => setViewport('tablet')} className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Tablet size={16} /></button>
                    <button onClick={() => setViewport('desktop')} className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Monitor size={16} /></button>
                </div>
              )}
              
              {viewMode === 'code' && (
                <button onClick={() => { navigator.clipboard.writeText(daxCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all transform active:scale-95 shadow-lg ${copied ? 'bg-green-500 shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado!' : 'Copiar Medida'}
                </button>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'preview' ? (
             <Preview global={globalConfig} cards={cards} viewport={viewport} />
          ) : (
            <div className="w-full h-full bg-[#1e1e1e] p-10 overflow-auto">
               <div className="max-w-4xl mx-auto bg-black/20 rounded-2xl p-6 border border-white/5">
                  <pre className="font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{daxCode}</pre>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
