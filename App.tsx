
import React, { useState, useMemo, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { generateDAX } from './utils/daxGenerator';
import { GlobalConfig, CardConfig, DonutChartConfig, ViewportMode, AppTab } from './types';
import { Code, Eye, Copy, Check, Monitor, Smartphone, Tablet, Settings2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeAppTab, setActiveAppTab] = useState<AppTab>('cards');
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    columns: 3, gap: 20, padding: 24,
    primaryColor: '#4f46e5', cardBackgroundColor: '#ffffff',
    textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280',
    positiveColor: '#059669', negativeColor: '#DC2626', neutralColor: '#4B5563',
    animation: 'fadeInUp', animationDuration: 0.6, hoverEffect: 'lift',
    borderRadius: 20, cardMinHeight: 160,
    fontSizeTitle: 10, fontSizeValue: 32, fontSizeSub: 11, fontSizeBadge: 10, // <--- ADICIONAR AQUI (ex: 10 ou 11)
    fontWeightTitle: 800, fontWeightValue: 800,
    shadowIntensity: 0, shadowBlur: 0, shadowDistance: 0, textAlign: 'left',
  });

  const [cards, setCards] = useState<CardConfig[]>([
    {
      id: '1', title: 'Performance Vendas', measurePlaceholder: '[Vendas]', formatType: 'currency', decimalPlaces: 0, 
      prefix: '', suffix: '', 
      targetMeasurePlaceholder: '1000000', value: 'R$ 842.500', type: 'progress', progressValue: 84, progressHeight: 8,
      icon: 'chart', iconPosition: 'top', iconSize: 24, iconPadding: 8, iconRounded: false,
      isOpen: true,
      comparisons: [
        { id: 'c1', label: 'vs Mês Anterior', value: '+14%', trend: 'up', logic: '[Vendas] > [Vendas LM]', measurePlaceholder: '[Vendas LM]' }
      ]
    }
  ]);

  const [donuts, setDonuts] = useState<DonutChartConfig[]>([
    {
      id: 'd1', title: 'Atingimento Meta', mode: 'completeness', geometry: 'full', ringThickness: 12, roundedCorners: true,
      showCenterText: true, centerTextLabel: 'Progresso', centerTextValueMeasure: '[% Meta]',
      completenessMeasure: '[Vendas]', completenessTarget: '[Meta]',
      slices: [], isOpen: false
    }
  ]);

  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<ViewportMode | 'custom'>('desktop');
  const [customDimensions, setCustomDimensions] = useState({ width: 800, height: 400 });
  const [copied, setCopied] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const daxCode = useMemo(() => {
    const items = activeAppTab === 'cards' ? cards : donuts;
    return generateDAX(globalConfig, items, activeAppTab);
  }, [globalConfig, cards, donuts, activeAppTab]);

  const handleCardClick = useCallback((id: string) => {
    setSelectedCardId(id);
    if (activeAppTab === 'cards') {
      setCards(prev => prev.map(c => ({ ...c, isOpen: c.id === id })));
    } else {
      setDonuts(prev => prev.map(d => ({ ...d, isOpen: d.id === id })));
    }
  }, [activeAppTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans text-gray-900">
      <div className="w-[420px] z-20 shadow-2xl relative">
        <Editor 
          globalConfig={globalConfig} 
          setGlobalConfig={setGlobalConfig} 
          cards={cards} 
          setCards={setCards} 
          donuts={donuts}
          setDonuts={setDonuts}
          activeAppTab={activeAppTab}
          setActiveAppTab={setActiveAppTab}
        />
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 shadow-sm z-10">
           <div className="flex bg-gray-200/50 p-1 rounded-xl border">
             <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><Eye size={14} /> Design</button>
             <button onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'code' ? 'bg-white text-indigo-600 shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><Code size={14} /> Código DAX</button>
           </div>
           
           <div className="flex items-center gap-6">
              {viewMode === 'preview' && (
                <div className="flex items-center gap-4">
                    {viewport === 'custom' && (
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm animate-fadeIn">
                        <input 
                          type="number" 
                          value={customDimensions.width} 
                          onChange={(e) => setCustomDimensions({ ...customDimensions, width: +e.target.value })} 
                          className="w-16 text-center text-xs font-bold border-b border-gray-200 focus:border-indigo-600 outline-none" 
                          placeholder="W"
                        />
                        <span className="text-gray-300 text-xs">x</span>
                        <input 
                          type="number" 
                          value={customDimensions.height} 
                          onChange={(e) => setCustomDimensions({ ...customDimensions, height: +e.target.value })} 
                          className="w-16 text-center text-xs font-bold border-b border-gray-200 focus:border-indigo-600 outline-none" 
                          placeholder="H"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-xl border">
                          <button onClick={() => setViewport('mobile')} className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Mobile"><Smartphone size={16} /></button>
                          <button onClick={() => setViewport('tablet')} className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Tablet"><Tablet size={16} /></button>
                          <button onClick={() => setViewport('desktop')} className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Desktop"><Monitor size={16} /></button>
                          <button onClick={() => setViewport('custom')} className={`p-2 rounded-lg transition-all ${viewport === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Custom Size"><Settings2 size={16} /></button>
                    </div>
                </div>
              )}
              
              {viewMode === 'code' && (
                <button onClick={() => { navigator.clipboard.writeText(daxCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all transform active:scale-95 shadow-lg ${copied ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado!' : 'Copiar Medida'}
                </button>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'preview' ? (
             <Preview 
                global={globalConfig} 
                cards={cards} 
                donuts={donuts}
                activeAppTab={activeAppTab}
                viewport={viewport as ViewportMode} 
                customDimensions={viewport === 'custom' ? customDimensions : undefined}
                onCardClick={handleCardClick}
                selectedCardId={selectedCardId}
             />
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
