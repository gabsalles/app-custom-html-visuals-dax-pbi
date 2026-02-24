import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import DaxHighlighter from './components/DaxHighlighter';
import { generateDAX } from './utils/daxGenerator';
import { GlobalConfig, CardConfig, DonutChartConfig, ViewportMode, AppTab } from './types';
import { Code, Eye, Copy, Check, Monitor, Smartphone, Tablet, Settings2, Download, Upload, FileJson, Trash2, RotateCcw } from 'lucide-react';

// --- CONFIGURAÇÕES INICIAIS (DEFAULTS) ---
const INITIAL_GLOBAL: GlobalConfig = {
  columns: 3, gap: 20, padding: 24,
  primaryColor: '#4f46e5', cardBackgroundColor: '#ffffff',
  canvasBackgroundColor: '#f3f4f6', // <-- ADICIONAR ESTA LINHA (um cinza claro padrão)
  textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280',
  positiveColor: '#059669', negativeColor: '#DC2626', neutralColor: '#4B5563',
  animation: 'fadeInUp', animationDuration: 0.6, hoverEffect: 'lift',
  borderRadius: 20, cardMinHeight: 160,
  fontSizeTitle: 10, fontSizeValue: 32, fontSizeSub: 11, fontSizeBadge: 10,
  fontWeightTitle: 800, fontWeightValue: 800,
  shadowIntensity: 0, shadowBlur: 0, shadowDistance: 0, textAlign: 'left',
  dataBindings: [
    { id: 'db1', label: 'Total Vendas', value: '[Total Vendas]' },
    { id: 'db2', label: 'Meta do Mês', value: '[Meta Vendas]' },
  ]
};

const INITIAL_CARDS: CardConfig[] = [
  {
    id: '1', title: 'Exemplo Vendas', measurePlaceholder: '[Total Vendas]', formatType: 'currency', decimalPlaces: 0, 
    prefix: '', suffix: '', targetMeasurePlaceholder: '1000000', value: 'R$ 842.500', type: 'progress', progressValue: 84, progressHeight: 8,
    icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false, isOpen: true,
    comparisons: [{ id: 'c1', label: 'vs Meta', value: '+14%', trend: 'up', logic: '[Vendas] > [Meta]', measurePlaceholder: '[Meta]' }]
  }
];

const INITIAL_DONUTS: DonutChartConfig[] = [
  {
    id: 'd1', title: 'Atingimento', mode: 'completeness', geometry: 'full', ringThickness: 12, roundedCorners: true,
    showCenterText: true, centerTextLabel: 'KPI', centerTextValueMeasure: '[% Meta]',
    completenessMeasure: '[Total Vendas]', completenessTarget: '[Meta Vendas]', slices: [], isOpen: false
  }
];

const App: React.FC = () => {
  // --- STATE MANAGEMENT COM LAZY INITIALIZATION (LOCAL STORAGE) ---
  const [activeAppTab, setActiveAppTab] = useState<AppTab>('cards');
  
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem('pbi-global');
    return saved ? JSON.parse(saved) : INITIAL_GLOBAL;
  });

  const [cards, setCards] = useState<CardConfig[]>(() => {
    const saved = localStorage.getItem('pbi-cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [donuts, setDonuts] = useState<DonutChartConfig[]>(() => {
    const saved = localStorage.getItem('pbi-donuts');
    return saved ? JSON.parse(saved) : INITIAL_DONUTS;
  });

  // --- AUTO-SAVE EFFECTS ---
  useEffect(() => { localStorage.setItem('pbi-global', JSON.stringify(globalConfig)); }, [globalConfig]);
  useEffect(() => { localStorage.setItem('pbi-cards', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('pbi-donuts', JSON.stringify(donuts)); }, [donuts]);

  // --- UI STATES ---
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<ViewportMode | 'custom'>('desktop');
  const [customDimensions, setCustomDimensions] = useState({ width: 800, height: 400 });
  const [copied, setCopied] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- ACTIONS: EXPORT / IMPORT / RESET ---
  const handleExport = () => {
    const project = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      globalConfig,
      cards,
      donuts
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pbi-visuals-project-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = JSON.parse(content);
        
        // Validação básica para garantir que é um JSON válido do nosso projeto
        if (!project || typeof project !== 'object' || (!project.globalConfig && !project.cards && !project.donuts)) {
          throw new Error("Formato de projeto inválido ou vazio.");
        }

        // Faz o merge do Global Config (protege contra propriedades novas que não existiam no JSON salvo)
        if (project.globalConfig) {
          setGlobalConfig(prev => ({ ...prev, ...project.globalConfig }));
        }
        
        // Garante que só seta os estados se realmente forem arrays, evitando crashes de ".map is not a function"
        if (project.cards && Array.isArray(project.cards)) {
          setCards(project.cards);
        }
        
        if (project.donuts && Array.isArray(project.donuts)) {
          setDonuts(project.donuts);
        }
        
        alert('Projeto carregado com sucesso!');
      } catch (err) {
        console.error("Erro ao importar projeto:", err);
        alert('Erro ao carregar arquivo. O arquivo pode estar corrompido ou ser de um formato incompatível.');
      } finally {
        // Limpa o input dentro do finally para garantir que sempre permita re-upload do mesmo arquivo
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Tem certeza? Isso apagará todo o seu trabalho atual e voltará ao padrão.')) {
      setGlobalConfig(INITIAL_GLOBAL);
      setCards(INITIAL_CARDS);
      setDonuts(INITIAL_DONUTS);
      localStorage.clear();
    }
  };

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
        {/* HEADER TOOLBAR */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 shadow-sm z-10">
           
           {/* Left: View Mode Toggle */}
           <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
             <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Eye size={14} /> Visual</button>
             <button onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'code' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Code size={14} /> Código DAX</button>
           </div>
           
           {/* Center: Viewport Controls (Only visible in Preview) */}
           {viewMode === 'preview' && (
             <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button onClick={() => setViewport('mobile')} className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Mobile (375px)"><Smartphone size={16} /></button>
                        <button onClick={() => setViewport('tablet')} className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Tablet (768px)"><Tablet size={16} /></button>
                        <button onClick={() => setViewport('desktop')} className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Desktop (1000px)"><Monitor size={16} /></button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button onClick={() => setViewport('custom')} className={`p-2 rounded-lg transition-all ${viewport === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Custom Size"><Settings2 size={16} /></button>
                  </div>
                  {viewport === 'custom' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm text-xs font-mono animate-fadeIn">
                      <span className="text-gray-400">W:</span>
                      <input type="number" value={customDimensions.width} onChange={(e) => setCustomDimensions({ ...customDimensions, width: +e.target.value })} className="w-10 text-center font-bold outline-none border-b border-transparent focus:border-indigo-500" />
                      <span className="text-gray-300">x</span>
                      <span className="text-gray-400">H:</span>
                      <input type="number" value={customDimensions.height} onChange={(e) => setCustomDimensions({ ...customDimensions, height: +e.target.value })} className="w-10 text-center font-bold outline-none border-b border-transparent focus:border-indigo-500" />
                    </div>
                  )}
             </div>
           )}

           {/* Right: Actions (Import/Export/Copy) */}
           <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
              
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Resetar Tudo"><RotateCcw size={18} /></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Importar JSON"><Upload size={18} /></button>
                <button onClick={handleExport} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Exportar JSON"><Download size={18} /></button>
              </div>

              {viewMode === 'code' && (
                <button onClick={() => { navigator.clipboard.writeText(daxCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all transform active:scale-95 shadow-lg shadow-indigo-200 ${copied ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado!' : 'Copiar DAX'}
                </button>
              )}
           </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative bg-[#0f0f11]">
          {viewMode === 'preview' ? (
             <Preview 
                global={globalConfig} 
                cards={cards} 
                donuts={donuts}
                activeAppTab={activeAppTab}
                viewport={viewport as ViewportMode} 
                customDimensions={viewport === 'custom' ? customDimensions : undefined}
                
                setCustomDimensions={setCustomDimensions}
                
                onCardClick={handleCardClick}
                selectedCardId={selectedCardId}
             />
          ) : (
            <div className="w-full h-full bg-[#1e1e1e] p-0 overflow-hidden flex flex-col">
               <DaxHighlighter code={daxCode} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;