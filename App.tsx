import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import DaxHighlighter from './components/DaxHighlighter';
import { generateDAX } from './utils/daxGenerator';
import { GlobalConfig, CardConfig, DonutChartConfig, ViewportMode, AppTab } from './types';
import { parseDaxToState } from './utils/daxParser';
import {
  Code, Eye, Copy, Check, Settings2, Download, Upload,
  Trash2, RotateCcw, FileCode2, X, Undo2, Redo2,
  Monitor, FlipVertical, RectangleHorizontal, LayoutGrid, SquareDashedBottom,
  Layers, Plus, GripVertical, Layout, PieChart,
  HelpCircle, Sparkles, Database, Play // <- Adicione estes ícones
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Power BI canvas presets (replaces mobile/tablet/desktop)
// ─────────────────────────────────────────────────────────────
const PBI_PRESETS = [
  // { id: 'tile-sm',    label: 'Tile P.',     w: 300,  h: 150, icon: SquareDashedBottom },
  // { id: 'card-wide',  label: 'Card Largo',  w: 580,  h: 200, icon: RectangleHorizontal },
  { id: 'kpi-strip',  label: 'Faixa KPIs', w: 1100, h: 180, icon: FlipVertical },
  { id: 'half-page',  label: 'Meia Pág.',  w: 640,  h: 360, icon: LayoutGrid },
  { id: 'full-page',  label: 'Pág. Inteira', w: 1280, h: 720, icon: Monitor },
  { id: 'custom',     label: 'Custom',      w: 800,  h: 400, icon: Settings2 },
] as const;

type PresetId = (typeof PBI_PRESETS)[number]['id'];

// ─────────────────────────────────────────────────────────────
// Default state
// ─────────────────────────────────────────────────────────────
const INITIAL_GLOBAL: GlobalConfig = {
  columnsDesktop: 3, columnsTablet: 2, columnsMobile: 1,
  gap: 20, padding: 24,
  marginType: 'all', marginAll: 10, marginTop: 10, marginRight: 10, marginBottom: 10, marginLeft: 10,
  primaryColor: '#4f46e5', cardBackgroundColor: '#ffffff',
  canvasBackgroundColor: '#f3f4f6',
  textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280',
  positiveColor: '#059669', negativeColor: '#DC2626', neutralColor: '#4B5563',
  animation: 'fadeInUp', animationDuration: 0.6, hoverEffect: 'lift',
  borderRadius: 10, cardMinHeight: 110,
  fontSizeTitle: 10, fontSizeValue: 32, fontSizeSub: 11, fontSizeBadge: 10,
  fontWeightTitle: 800, fontWeightValue: 800,
  shadowIntensity: 0, shadowBlur: 0, shadowDistance: 0, textAlign: 'left',
  dataBindings: [
    { id: 'db1', label: 'Total Vendas', value: '[Total Vendas]' },
    { id: 'db2', label: 'Meta do Mês',  value: '[Meta Vendas]' },
  ]
};

const INITIAL_CARDS: CardConfig[] = [
  {
    id: '1', title: 'Exemplo Vendas', measurePlaceholder: '[Total Vendas]',
    formatType: 'currency', decimalPlaces: 0, prefix: '', suffix: '',
    targetMeasurePlaceholder: '1000000', value: 'R$ 842.500', type: 'progress',
    progressValue: 84, progressHeight: 8, icon: 'chart', iconPosition: 'top',
    iconSize: 40, iconPadding: 8, iconRounded: false, isOpen: true,
    comparisons: [{ id: 'c1', label: 'vs Meta', value: '+14%', trend: 'up', logic: '[Vendas] > [Meta]', measurePlaceholder: '[Meta]' }],
    colSpan: 1, rowSpan: 1,
  }
];

const INITIAL_DONUTS: DonutChartConfig[] = [
  {
    id: 'd1', title: 'Atingimento', mode: 'completeness', geometry: 'full',
    ringThickness: 12, roundedCorners: true, showCenterText: true,
    centerTextLabel: 'KPI', centerTextValueMeasure: '[% Meta]',
    completenessMeasure: '[Total Vendas]', completenessTarget: '[Meta Vendas]',
    slices: [], isOpen: false, colSpan: 1, rowSpan: 1,
  }
];

// ─────────────────────────────────────────────────────────────
// History snapshot type
// ─────────────────────────────────────────────────────────────
interface Snapshot {
  gc: GlobalConfig;
  c: CardConfig[];
  d: DonutChartConfig[];
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
const App: React.FC = () => {
  // ── App state ──────────────────────────────────────────────
  const [activeAppTab, setActiveAppTab] = useState<AppTab>('cards');

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem('pbi-global');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.columns !== undefined) {
        parsed.columnsDesktop = parsed.columns;
        parsed.columnsTablet  = Math.max(1, parsed.columns - 1);
        parsed.columnsMobile  = 1;
        delete parsed.columns;
      }
      return { ...INITIAL_GLOBAL, ...parsed };
    }
    return INITIAL_GLOBAL;
  });

  const [cards, setCards] = useState<CardConfig[]>(() => {
    const saved = localStorage.getItem('pbi-cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [donuts, setDonuts] = useState<DonutChartConfig[]>(() => {
    const saved = localStorage.getItem('pbi-donuts');
    return saved ? JSON.parse(saved) : INITIAL_DONUTS;
  });

  const [testValues, setTestValues] = useState<Record<string, number>>({});

  // ── Auto-save ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('pbi-global', JSON.stringify(globalConfig)); }, [globalConfig]);
  useEffect(() => { localStorage.setItem('pbi-cards',  JSON.stringify(cards));        }, [cards]);
  useEffect(() => { localStorage.setItem('pbi-donuts', JSON.stringify(donuts));       }, [donuts]);

  // ── Undo / Redo ────────────────────────────────────────────
  const historyRef      = useRef<Snapshot[]>([]);
  const historyIdxRef   = useRef(-1);
  const isUndoRedoRef   = useRef(false);
  const debounceRef     = useRef<ReturnType<typeof setTimeout>>();
  const [historySize, setHistorySize]  = useState(0); 
  const [historyIdx,  setHistoryIdx]   = useState(-1);
  
  useEffect(() => {
    if (isUndoRedoRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }
      historyRef.current  = historyRef.current.slice(0, historyIdxRef.current + 1);
      historyRef.current.push({
        gc: JSON.parse(JSON.stringify(globalConfig)),
        c:  JSON.parse(JSON.stringify(cards)),
        d:  JSON.parse(JSON.stringify(donuts)),
      });
      if (historyRef.current.length > 30) historyRef.current.shift();
      else historyIdxRef.current++;
      setHistorySize(historyRef.current.length);
      setHistoryIdx(historyIdxRef.current);
    }, 400);
  }, [globalConfig, cards, donuts]);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    isUndoRedoRef.current = true;
    historyIdxRef.current--;
    const snap = historyRef.current[historyIdxRef.current];
    setGlobalConfig(snap.gc);
    setCards(snap.c);
    setDonuts(snap.d);
    setHistoryIdx(historyIdxRef.current);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    historyIdxRef.current++;
    const snap = historyRef.current[historyIdxRef.current];
    setGlobalConfig(snap.gc);
    setCards(snap.c);
    setDonuts(snap.d);
    setHistoryIdx(historyIdxRef.current);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Resizable panels (Left and Right) ────────────────────────
  const [leftWidth, setLeftWidth] = useState(260);
  const [leftOpen, setLeftOpen]   = useState(true);
  const isResizingLeftRef         = useRef(false);
  const resizeStartXLeft          = useRef(0);
  const resizeStartWLeft          = useRef(0);

  const [rightWidth, setRightWidth] = useState(380);
  const [rightOpen, setRightOpen]   = useState(true);
  const isResizingRightRef          = useRef(false);
  const resizeStartXRight           = useRef(0);
  const resizeStartWRight           = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isResizingLeftRef.current) {
        const delta = e.clientX - resizeStartXLeft.current;
        setLeftWidth(Math.max(220, Math.min(450, resizeStartWLeft.current + delta)));
      } else if (isResizingRightRef.current) {
        const delta = resizeStartXRight.current - e.clientX; // Invertido pois cresce p/ esquerda
        setRightWidth(Math.max(300, Math.min(600, resizeStartWRight.current + delta)));
      }
    };
    const onUp = () => { 
      isResizingLeftRef.current = false; 
      isResizingRightRef.current = false;
      document.body.style.cursor = ''; 
      document.body.style.userSelect = ''; 
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── UI state ───────────────────────────────────────────────
  const [isHelpOpen, setIsHelpOpen] = useState(() => {
  return localStorage.getItem('daxilizer-help-seen') !== 'true';
  });
  const handleCloseHelp = () => {
  setIsHelpOpen(false);
  localStorage.setItem('daxilizer-help-seen', 'true');
  };
  const [viewMode,         setViewMode]         = useState<'preview' | 'code'>('preview');
  const [activePreset,     setActivePreset]     = useState<PresetId>('kpi-strip');
  const [customDimensions, setCustomDimensions] = useState({ width: 800, height: 400 });
  const [copied,           setCopied]           = useState(false);
  const [selectedCardId,   setSelectedCardId]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDaxModalOpen,   setIsDaxModalOpen]   = useState(false);
  const [daxImportText,    setDaxImportText]    = useState('');

  // ── Derived ────────────────────────────────────────────────
  const currentPreset  = PBI_PRESETS.find(p => p.id === activePreset)!;
  const simWidth  = activePreset === 'custom' ? customDimensions.width  : currentPreset.w;
  const simHeight = activePreset === 'custom' ? customDimensions.height : currentPreset.h;

  const daxCode = useMemo(() => {
    const items = activeAppTab === 'cards' ? cards : donuts;
    return generateDAX(globalConfig, items, activeAppTab);
  }, [globalConfig, cards, donuts, activeAppTab]);

  // ── Handlers ───────────────────────────────────────────────
  const handleCardClick = useCallback((id: string) => {
    setSelectedCardId(id);
    if (activeAppTab === 'cards') {
      setCards(prev => prev.map(c => ({ ...c, isOpen: c.id === id })));
    } else {
      setDonuts(prev => prev.map(d => ({ ...d, isOpen: d.id === id })));
    }
  }, [activeAppTab]);

  const handleReorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (activeAppTab === 'cards') {
      setCards(prev => {
        const list = [...prev];
        const from = list.findIndex(x => x.id === fromId);
        const to   = list.findIndex(x => x.id === toId);
        if (from < 0 || to < 0) return prev;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        return list;
      });
    } else {
      setDonuts(prev => {
        const list = [...prev];
        const from = list.findIndex(x => x.id === fromId);
        const to   = list.findIndex(x => x.id === toId);
        if (from < 0 || to < 0) return prev;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        return list;
      });
    }
  }, [activeAppTab]);

  const handleDaxImportSubmit = () => {
    if (!daxImportText.trim()) return;
    const result = parseDaxToState(daxImportText, globalConfig);
    if (result.success && result.items) {
      setActiveAppTab(result.tab as AppTab);
      setGlobalConfig(prev => ({ ...prev, ...(result.global as GlobalConfig) }));
      if (result.tab === 'cards') setCards(result.items as CardConfig[]);
      else setDonuts(result.items as DonutChartConfig[]);
      setIsDaxModalOpen(false);
      setDaxImportText('');
      alert(result.type === 'perfect'
        ? '✨ Visual restaurado com 100% de precisão!'
        : '⚠️ DAX Antigo detectado. Medidas e Títulos foram recuperados, mas reconfigure layout (fontes, ícones, tamanhos).');
    } else {
      alert('Erro: Não foi possível identificar o código DAX. Verifique se copiou o código inteiro.');
    }
  };

  const handleExport = () => {
    const project = { version: '1.0', timestamp: new Date().toISOString(), globalConfig, cards, donuts };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `pbi-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string);
        if (!project || typeof project !== 'object' || (!project.globalConfig && !project.cards && !project.donuts))
          throw new Error('Formato inválido.');
        if (project.globalConfig) {
          let gc = project.globalConfig;
          if (gc.columns !== undefined) { gc.columnsDesktop = gc.columns; gc.columnsTablet = Math.max(1, gc.columns - 1); gc.columnsMobile = 1; delete gc.columns; }
          setGlobalConfig(prev => ({ ...prev, ...gc }));
        }
        if (project.cards  && Array.isArray(project.cards))  setCards(project.cards);
        if (project.donuts && Array.isArray(project.donuts)) setDonuts(project.donuts);
        alert('Projeto carregado com sucesso!');
      } catch {
        alert('Erro ao carregar arquivo. Verifique se o arquivo é válido.');
      } finally {
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
      setTestValues({});
      localStorage.clear();
    }
  };

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < historySize - 1;

  // ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans text-gray-900">

      {/* ── COLUNA ESQUERDA: Camadas (Hierarquia) ── */}
      <div
        className="z-20 shadow-xl relative flex flex-col flex-shrink-0 transition-all duration-300 border-r border-slate-200 bg-white"
        style={{ width: leftOpen ? leftWidth : 0, overflow: 'hidden', minWidth: leftOpen ? 220 : 0 }}
      >
        <div className="flex-1 flex flex-col min-w-[220px] w-full overflow-hidden">
          {/* Conteúdo exato da aba de Camadas / Hierarquia que você já tinha */}
          <div className="p-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <Layers size={14} className="text-indigo-500" /> Camadas
              </h3>
              <button 
                onClick={() => {
                  const id = Math.random().toString(36).substr(2, 9);
                  if (activeAppTab === 'cards') {
                    setCards([...cards, { id, title: 'Novo Card', measurePlaceholder: '[Vendas]', formatType: 'currency', decimalPlaces: 0, prefix: '', suffix: '', type: 'simple', targetMeasurePlaceholder: '1', value: 'R$ 0', progressValue: 0, icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false, comparisons: [], colSpan: 1, rowSpan: 1 }]);
                  } else {
                    setDonuts([...donuts, { id, title: 'Nova Rosca', mode: 'completeness', geometry: 'full', ringThickness: 12, roundedCorners: true, showCenterText: true, centerTextLabel: 'KPI', centerTextValueMeasure: '[Valor]', completenessMeasure: '[Vendas]', completenessTarget: '[Meta]', slices: [], colSpan: 1, rowSpan: 1 }]);
                  }
                  setSelectedCardId(id);
                }}
                className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors border border-indigo-100"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-medium italic">Gerencie os itens do seu visual</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {(activeAppTab === 'cards' ? cards : donuts).map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedCardId(item.id)}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedCardId === item.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
              >
                <GripVertical size={14} className="text-slate-200 group-hover:text-indigo-300" />
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                  {activeAppTab === 'cards' ? <Layout size={14}/> : <PieChart size={14}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-700 truncate leading-none">{item.title}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">{(item as any).type || (item as any).mode}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (activeAppTab === 'cards') setCards(cards.filter(c => c.id !== item.id)); else setDonuts(donuts.filter(d => d.id !== item.id)); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Elementos</span>
                <span className="text-indigo-600">{(activeAppTab === 'cards' ? cards : donuts).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de recolher e handle de resize (Esquerda) */}
      <div className="relative z-30 flex-shrink-0">
        <button onClick={() => setLeftOpen(o => !o)} className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-12 bg-white border border-slate-200 rounded-r-xl shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all z-40 text-xs font-black" title={leftOpen ? 'Recolher painel' : 'Expandir painel'}>
          {leftOpen ? '‹' : '›'}
        </button>
      </div>
      {leftOpen && (
        <div className="w-1.5 flex-shrink-0 cursor-col-resize z-30 group relative" onMouseDown={(e) => { isResizingLeftRef.current = true; resizeStartXLeft.current = e.clientX; resizeStartWLeft.current = leftWidth; e.preventDefault(); }}>
          <div className="absolute inset-y-0 left-0 w-1.5 bg-indigo-400/0 group-hover:bg-indigo-400/60 transition-colors rounded-full" />
        </div>
      )}

      {/* ── COLUNA CENTRAL: Toolbar + Canvas ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0f0f11]">
        {/* Toolbar */}
        <div className="h-14 bg-white/90 backdrop-blur-md border-b flex items-center justify-between px-4 shadow-sm z-10 gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button onClick={() => setViewMode('preview')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><Eye size={13} /> Visual</button>
            <button onClick={() => setViewMode('code')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'code' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><Code size={13} /> DAX</button>
          </div>

          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto">
              {PBI_PRESETS.map(preset => (
                <button key={preset.id} onClick={() => { setActivePreset(preset.id); if (preset.id !== 'custom') setCustomDimensions({ width: preset.w, height: preset.h }); }} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${activePreset === preset.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}><preset.icon size={13} /> {preset.label}</button>
              ))}
              {/* Custom size inputs */}
              {activePreset === 'custom' && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-gray-300 ml-1 text-[10px] font-mono">
                  <span className="text-gray-400">W</span>
                  <input
                    type="number"
                    value={customDimensions.width}
                    onChange={(e) => setCustomDimensions(d => ({ ...d, width: +e.target.value }))}
                    // 👇 Removido o text-white e adicionado text-slate-700
                    className="w-14 text-center font-bold outline-none border-b border-transparent focus:border-indigo-400 bg-transparent text-slate-700"
                  />
                  <span className="text-gray-300">×</span>
                  <span className="text-gray-400">H</span>
                  <input
                    type="number"
                    value={customDimensions.height}
                    onChange={(e) => setCustomDimensions(d => ({ ...d, height: +e.target.value }))}
                    // 👇 Removido o text-white e adicionado text-slate-700
                    className="w-14 text-center font-bold outline-none border-b border-transparent focus:border-indigo-400 bg-transparent text-slate-700"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* 👇 Adicione o botão de Ajuda aqui 👇 */}
            <button onClick={() => setIsHelpOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Como usar">
              <HelpCircle size={16} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" /> {/* Linha divisória charmosa */}
            <button onClick={undo} disabled={!canUndo} className="p-2 text-gray-400 hover:text-indigo-600"><Undo2 size={16} /></button>
            <button onClick={redo} disabled={!canRedo} className="p-2 text-gray-400 hover:text-indigo-600"><Redo2 size={16} /></button>
            <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500"><RotateCcw size={16} /></button>
            {/* 👇 Elementos adicionados para Importação (Upload) 👇 */}
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 text-gray-400 hover:text-indigo-600"
              title="Importar projeto (Upload JSON)"
            >
              <Upload size={16} />
            </button>
            {/* 👆 Fim da adição 👆 */}
            <button onClick={handleExport} className="p-2 text-gray-400 hover:text-indigo-600"><Download size={16} /></button>
            <button onClick={() => setIsDaxModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold"><FileCode2 size={15} /> Ler DAX</button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'preview' ? (
            <Preview
              global={globalConfig} cards={cards} donuts={donuts} activeAppTab={activeAppTab}
              viewport="custom" customDimensions={{ width: simWidth, height: simHeight }}
              setCustomDimensions={(dim) => { setActivePreset('custom'); setCustomDimensions(dim); }}
              onCardClick={handleCardClick} selectedCardId={selectedCardId} testValues={testValues} onReorder={handleReorder}
            />
          ) : (
            <div className="w-full h-full bg-[#1e1e1e] overflow-hidden">
              <DaxHighlighter code={daxCode} />
            </div>
          )}
        </div>
      </div>

      {/* ── COLUNA DIREITA: Editor (Propriedades) ── */}
      {rightOpen && (
        <div className="w-1.5 flex-shrink-0 cursor-col-resize z-30 group relative" onMouseDown={(e) => { isResizingRightRef.current = true; resizeStartXRight.current = e.clientX; resizeStartWRight.current = rightWidth; e.preventDefault(); }}>
          <div className="absolute inset-y-0 right-0 w-1.5 bg-indigo-400/0 group-hover:bg-indigo-400/60 transition-colors rounded-full" />
        </div>
      )}
      {/* Botão de recolher (Direita) */}
      <div className="relative z-30 flex-shrink-0">
        <button onClick={() => setRightOpen(o => !o)} className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-12 bg-white border border-slate-200 rounded-l-xl shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all z-40 text-xs font-black" title={rightOpen ? 'Recolher painel' : 'Expandir painel'}>
          {rightOpen ? '›' : '‹'}
        </button>
      </div>
      
      <div
        className="z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] relative flex flex-col flex-shrink-0 transition-all duration-300 border-l border-slate-200 bg-white"
        style={{ width: rightOpen ? rightWidth : 0, overflow: 'hidden', minWidth: rightOpen ? 300 : 0 }}
      >
        <div className="flex-1 flex flex-col min-w-[300px] w-full overflow-hidden">
          <Editor
            globalConfig={globalConfig}
            setGlobalConfig={setGlobalConfig}
            cards={cards}
            setCards={setCards}
            donuts={donuts}
            setDonuts={setDonuts}
            activeAppTab={activeAppTab}
            setActiveAppTab={setActiveAppTab}
            selectedCardId={selectedCardId}
            setSelectedCardId={setSelectedCardId}
            testValues={testValues}
            setTestValues={setTestValues}
          />
        </div>
      </div>

      {/* Modais (Importação DAX) */}
      {isDaxModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileCode2 className="text-indigo-400" /> Restaurar via DAX</h3>
              <button onClick={() => setIsDaxModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <textarea value={daxImportText} onChange={(e) => setDaxImportText(e.target.value)} placeholder="Cole o código aqui..." className="w-full h-64 bg-gray-900 text-indigo-300 p-4 rounded-xl border border-gray-700 focus:border-indigo-500 focus:outline-none resize-none font-mono text-xs" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsDaxModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-xs uppercase">Cancelar</button>
              <button onClick={handleDaxImportSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs uppercase shadow-lg shadow-indigo-900/40">Restaurar</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de Ajuda (Estilo Apple / Steve Jobs) ── */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4" onClick={handleCloseHelp}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden cursor-default border border-slate-100 transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="p-6 md:p-12 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
              
              {/* Efeito de luz de fundo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Simplicidade é a sofisticação máxima.</h2>
                  <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-xl">
                    O Power BI é incrivelmente poderoso, mas seus visuais nativos não são. Nós criamos o DAXILIZER para resolver isso. Não adicionando complexidade, mas removendo-a completamente.
                  </p>
                </div>
                <button onClick={handleCloseHelp} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 relative z-10">
                
                {/* Passo 1 */}
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 flex-shrink-0 shadow-sm"><Layout size={24} /></div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 mb-2">1. O Design</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Use a barra lateral direita para esculpir seu visual. Sombras, arredondamentos e tipografia. Tudo o que você vê no centro é exatamente o que você terá.</p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm"><Database size={24} /></div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-indigo-600 mb-2">2. A Conexão</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Vá na aba 'Dados' e cadastre o nome das medidas que você já tem no Power BI (ex: <code className="bg-slate-100 px-1 rounded text-slate-700">[Total]</code>). Nós faremos a ponte mágica entre o design e seus números reais.</p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0 shadow-sm"><Sparkles size={24} /></div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-violet-600 mb-2">3. A Mágica</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Clique em <strong className="text-slate-700">DAX</strong> no topo. Em milissegundos, condensamos todo o seu layout em uma única e brilhante fórmula DAX que embute HTML e CSS.</p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm"><Play size={24} className="ml-0.5" /></div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-emerald-600 mb-2">4. O Palco</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Baixe o visual grátis <strong className="text-slate-700">HTML Content</strong> na loja da Microsoft no Power BI. Crie uma nova medida, cole nosso código, e coloque essa medida no visual. Fim.</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center relative z-10">
                <button onClick={handleCloseHelp} className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
                  Começar a criar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;