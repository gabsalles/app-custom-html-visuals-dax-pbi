import React, { useState, useMemo } from 'react';
import { CardConfig, GlobalConfig, CardType, HoverEffect, ComparisonConfig, DonutChartConfig, AppTab } from '../types';
import { iconDefinitions, IconCategory } from '../utils/icons';
import { Trash2, Plus, Type, Palette, Layout, ChevronDown, ChevronRight, MousePointer2, X, Binary, Sparkles, ALargeSmall, Droplets, CalendarDays, CalendarRange, PieChart, Layers, Wand2, AlignLeft, AlignCenter, AlignRight, Component, BarChart3, Search, Database, PanelTop, PanelLeft, PanelRight, Save, Sun, Grid3X3} from 'lucide-react';

interface EditorProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  cards: CardConfig[];
  setCards: React.Dispatch<React.SetStateAction<CardConfig[]>>;
  donuts: DonutChartConfig[];
  setDonuts: React.Dispatch<React.SetStateAction<DonutChartConfig[]>>;
  activeAppTab: AppTab;
  setActiveAppTab: (tab: AppTab) => void;
}

// Componente Helper: Seletor Inteligente de Medidas
const MeasureSelect = ({ 
    label, 
    value, 
    onChange, 
    bindings 
  }: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    bindings: any[] 
  }) => {
  const isBound = bindings.some(b => b.value === value);
  const [mode, setMode] = useState<'select' | 'manual'>(isBound || value === '' ? 'select' : 'manual');

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
        <button 
          onClick={() => setMode(mode === 'select' ? 'manual' : 'select')} 
          className="text-[8px] font-bold text-indigo-500 uppercase hover:text-indigo-700"
        >
          {mode === 'select' ? 'Digitar Manual' : 'Selecionar da Lista'}
        </button>
      </div>
      {mode === 'select' ? (
        <div className="relative">
            <select 
              value={value} 
              onChange={(e) => {
                 if(e.target.value === 'custom') setMode('manual');
                 else onChange(e.target.value);
              }} 
              className="input-field appearance-none cursor-pointer"
            >
              <option value="">Selecione uma medida...</option>
              {bindings.map(b => (
                <option key={b.id} value={b.value}>{b.label}</option>
              ))}
              <option disabled>──────────</option>
              <option value="custom">+ Digitar Manualmente</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronDown size={14} />
            </div>
        </div>
      ) : (
        <input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="input-field font-mono text-indigo-600 text-[11px]" 
          placeholder="Ex: [Total Vendas]"
        />
      )}
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ globalConfig, setGlobalConfig, cards, setCards, donuts, setDonuts, activeAppTab, setActiveAppTab }) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'style' | 'colors' | 'interactive' | 'data'>('layout');
  const [iconSelectorOpen, setIconSelectorOpen] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<IconCategory | 'all'>('all');

  const filteredIcons = useMemo(() => {
    return Object.entries(iconDefinitions).filter(([name, def]) => {
      const matchesSearch = name.toLowerCase().includes(iconSearch.toLowerCase()) || 
                           def.tags.some(tag => tag.toLowerCase().includes(iconSearch.toLowerCase()));
      const matchesCategory = activeIconCategory === 'all' || def.category === activeIconCategory;
      return matchesSearch && matchesCategory;
    });
  }, [iconSearch, activeIconCategory]);

  const applyBradescoPreset = () => {
    setGlobalConfig({
      ...globalConfig,
      primaryColor: '#cc092f',
      cardBackgroundColor: '#ffffff',
      textColorTitle: '#86868B',
      textColorValue: '#1D1D1F',
      textColorSub: '#6B7280',
      positiveColor: '#059669',
      negativeColor: '#DC2626',
      hoverEffect: 'lift',
      borderRadius: 20,
      fontWeightTitle: 800,
      fontWeightValue: 800,
      animation: 'fadeInUp',
      shadowIntensity: 10,
      shadowBlur: 20,
      shadowDistance: 10,
      textAlign: 'left'
    });
  };

  const updateCard = (id: string, field: keyof CardConfig, value: any) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateDonut = (id: string, field: keyof DonutChartConfig, value: any) => {
    setDonuts(donuts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addComparison = (cardId: string, type: 'mom' | 'yoy' | 'custom' = 'custom') => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    let label = 'Novo Comp';
    let logic = 'TRUE()';
    let measure = '[Medida]';

    if (type === 'mom') { label = 'vs Mês Anterior'; logic = '[Variação Mês] > 0'; measure = '[Variação % Mês]'; }
    if (type === 'yoy') { label = 'vs Ano Anterior'; logic = '[Variação Ano] > 0'; measure = '[Variação % Ano]'; }

    const newComp: ComparisonConfig = {
      id: Math.random().toString(36).substr(2, 9),
      label, value: '0%', trend: 'up', logic, measurePlaceholder: measure, invertColor: false
    };
    updateCard(cardId, 'comparisons', [...card.comparisons, newComp]);
  };

  const handleAddBinding = () => {
     const newBinding = { id: Math.random().toString(36).substr(2,9), label: 'Nova Medida', value: '[Medida]' };
     setGlobalConfig({ ...globalConfig, dataBindings: [...(globalConfig.dataBindings || []), newBinding] });
  };

  const handleUpdateBinding = (id: string, field: 'label' | 'value', val: string) => {
     const newBindings = globalConfig.dataBindings.map(b => b.id === id ? { ...b, [field]: val } : b);
     setGlobalConfig({ ...globalConfig, dataBindings: newBindings });
  };

  const handleDeleteBinding = (id: string) => {
     setGlobalConfig({ ...globalConfig, dataBindings: globalConfig.dataBindings.filter(b => b.id !== id) });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl z-20">
      {/* SELETOR PRINCIPAL */}
      <div className="p-5 border-b bg-gray-50/50 space-y-4">
        <div className="flex bg-gray-200/50 p-1 rounded-2xl border border-gray-200">
          <button onClick={() => setActiveAppTab('cards')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAppTab === 'cards' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><Layers size={14} /> Cards</button>
          <button onClick={() => setActiveAppTab('charts')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAppTab === 'charts' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><PieChart size={14} /> Gráficos</button>
        </div>
        <button onClick={applyBradescoPreset} className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-gradient-to-r from-[#85001a] to-[#cc092f] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all"><Wand2 size={16} /> Aplicar Bradesco UI</button>
      </div>

      {/* ABAS GLOBAIS */}
      <div className="flex border-b overflow-x-auto custom-scrollbar">
        {[
          { id: 'data', icon: Database, label: 'Dados' }, 
          { id: 'layout', icon: Layout, label: 'Layout' },
          { id: 'style', icon: Type, label: 'Fontes' },
          { id: 'colors', icon: Palette, label: 'Cores' },
          { id: 'interactive', icon: MousePointer2, label: 'Efeitos' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-4 text-[9px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600 bg-indigo-50/40' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar bg-white">
        <div className="space-y-6">
          {/* --- NOVA ABA DE DADOS --- */}
          {activeTab === 'data' && (
            <div className="space-y-4 animate-fadeIn">
               <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2"><Database size={14} className="text-indigo-600"/><span className="text-[10px] font-black text-indigo-700 uppercase">Biblioteca de Medidas</span></div>
                     <button onClick={handleAddBinding} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={14}/></button>
                  </div>
                  <div className="space-y-3">
                     {(globalConfig.dataBindings || []).map((binding) => (
                        <div key={binding.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-indigo-100 shadow-sm group">
                           <div className="flex-1 space-y-1">
                              <input 
                                value={binding.label} 
                                onChange={(e) => handleUpdateBinding(binding.id, 'label', e.target.value)}
                                className="w-full text-[11px] font-bold text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-200 placeholder-gray-300"
                                placeholder="Nome (Ex: Vendas)"
                              />
                              <input 
                                value={binding.value} 
                                onChange={(e) => handleUpdateBinding(binding.id, 'value', e.target.value)}
                                className="w-full text-[10px] font-mono text-indigo-500 bg-transparent outline-none border-b border-transparent focus:border-indigo-200 placeholder-indigo-200"
                                placeholder="DAX (Ex: [Total Vendas])"
                              />
                           </div>
                           <button onClick={() => handleDeleteBinding(binding.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                     ))}
                     {(globalConfig.dataBindings || []).length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs">
                           Nenhuma medida cadastrada.<br/>Clique em + para adicionar.
                        </div>
                     )}
                  </div>
               </div>
               <div className="text-[10px] text-gray-400 px-2 leading-relaxed">
                  💡 <strong>Dica:</strong> Cadastre suas medidas aqui para selecioná-las rapidamente nos Cards e Gráficos. Isso evita erros de digitação no DAX.
               </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 gap-5">
                    <Field label="Colunas"><input type="number" value={globalConfig.columns} onChange={(e) => setGlobalConfig({...globalConfig, columns: +e.target.value})} className="input-field"/></Field>
                    <Field label="Espaçamento"><input type="number" value={globalConfig.gap} onChange={(e) => setGlobalConfig({...globalConfig, gap: +e.target.value})} className="input-field"/></Field>
                </div>
                <Field label="Alinhamento Global do Texto">
                   <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                      {['left', 'center', 'right'].map((align: any) => (
                          <button key={align} onClick={() => setGlobalConfig({...globalConfig, textAlign: align})} className={`flex-1 py-2 rounded-lg flex justify-center transition-all ${globalConfig.textAlign === align ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}>
                             {align === 'left' ? <AlignLeft size={16}/> : align === 'center' ? <AlignCenter size={16}/> : <AlignRight size={16}/>}
                          </button>
                      ))}
                   </div>
                </Field>
                <div className="grid grid-cols-2 gap-5">
                    <Field label="Altura Mínima"><input type="number" value={globalConfig.cardMinHeight} onChange={(e) => setGlobalConfig({...globalConfig, cardMinHeight: +e.target.value})} className="input-field"/></Field>
                    <Field label="Arredondamento"><input type="number" value={globalConfig.borderRadius} onChange={(e) => setGlobalConfig({...globalConfig, borderRadius: +e.target.value})} className="input-field"/></Field>
                </div>
            </div>
          )}
          {activeTab === 'style' && (
            <div className="space-y-6 animate-fadeIn">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2"><Type size={14} className="text-gray-600"/><span className="text-[10px] font-black text-gray-700 uppercase">Tamanhos (px)</span></div>
                  <div className="grid grid-cols-2 gap-5">
                      <Field label="Tamanho Título"><input type="number" value={globalConfig.fontSizeTitle} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeTitle: +e.target.value})} className="input-field"/></Field>
                      <Field label="Tamanho Valor"><input type="number" value={globalConfig.fontSizeValue} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeValue: +e.target.value})} className="input-field"/></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                      <Field label="Tamanho Subtítulo"><input type="number" value={globalConfig.fontSizeSub} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeSub: +e.target.value})} className="input-field"/></Field>
                      <Field label="Tamanho Badge (Var)"><input type="number" value={globalConfig.fontSizeBadge || 10} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeBadge: +e.target.value})} className="input-field"/></Field>
                  </div>
               </div>

               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2"><ALargeSmall size={14} className="text-gray-600"/><span className="text-[10px] font-black text-gray-700 uppercase">Espessura (Peso)</span></div>
                  <div className="grid grid-cols-2 gap-5">
                      <Field label="Peso Título (100-900)"><input type="number" value={globalConfig.fontWeightTitle} onChange={(e) => setGlobalConfig({...globalConfig, fontWeightTitle: +e.target.value})} className="input-field"/></Field>
                      <Field label="Peso Valor (100-900)"><input type="number" value={globalConfig.fontWeightValue} onChange={(e) => setGlobalConfig({...globalConfig, fontWeightValue: +e.target.value})} className="input-field"/></Field>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6 animate-fadeIn">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2"><Palette size={14} className="text-gray-600"/><span className="text-[10px] font-black text-gray-700 uppercase">Tema Principal</span></div>
                  <Field label="Cor Primária (Accent)"><ColorPickerSimple value={globalConfig.primaryColor} onChange={(v) => setGlobalConfig({...globalConfig, primaryColor: v})} /></Field>
                  <Field label="Fundo do Card"><ColorPickerSimple value={globalConfig.cardBackgroundColor} onChange={(v) => setGlobalConfig({...globalConfig, cardBackgroundColor: v})} /></Field>
               </div>
               {/* ... (Resto das cores igual) ... */}
            </div>
          )}
          {activeTab === 'interactive' && (
             <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-white border rounded-2xl space-y-4">
                 <div className="flex items-center gap-2"><Sun size={14} className="text-orange-500"/><span className="text-[10px] font-black text-orange-600 uppercase">Sombras & Profundidade</span></div>
                 <Field label={`Intensidade: ${globalConfig.shadowIntensity || 0}%`}><input type="range" min="0" max="100" value={globalConfig.shadowIntensity || 0} onChange={(e) => setGlobalConfig({...globalConfig, shadowIntensity: +e.target.value})} className="range-slider accent-orange-500"/></Field>
                 <Field label={`Desfoque (Blur): ${globalConfig.shadowBlur || 0}px`}><input type="range" min="0" max="50" value={globalConfig.shadowBlur || 0} onChange={(e) => setGlobalConfig({...globalConfig, shadowBlur: +e.target.value})} className="range-slider accent-orange-500"/></Field>
                 <Field label={`Distância Y: ${globalConfig.shadowDistance || 0}px`}><input type="range" min="0" max="30" value={globalConfig.shadowDistance || 0} onChange={(e) => setGlobalConfig({...globalConfig, shadowDistance: +e.target.value})} className="range-slider accent-orange-500"/></Field>
              </div>
              <Field label="Efeito de Foco (Hover)">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {['none', 'lift', 'scale', 'glow', 'border'].map(eff => (
                    <button key={eff} onClick={() => setGlobalConfig({...globalConfig, hoverEffect: eff as any})} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${globalConfig.hoverEffect === eff ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{eff}</button>
                  ))}
                </div>
              </Field>
              <Field label="Animação de Entrada">
                <select value={globalConfig.animation} onChange={(e) => setGlobalConfig({...globalConfig, animation: e.target.value as any})} className="input-field">
                  <option value="none">Nenhuma</option>
                  <option value="fadeInUp">Fade In Up</option>
                  <option value="popIn">Pop In</option>
                  <option value="slideRight">Slide Right</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        {/* LISTAGEM DE ITENS DINÂMICA */}
        <div className="pt-6 border-t space-y-4">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gerenciar {activeAppTab === 'cards' ? 'Cards' : 'Gráficos'}</h3>
             <button onClick={() => activeAppTab === 'cards' ? setCards([...cards, { id: Math.random().toString(36).substr(2, 9), title: 'Nova Métrica', measurePlaceholder: '[Vendas]', formatType: 'currency', decimalPlaces: 0, prefix: '', suffix: '', type: 'simple', targetMeasurePlaceholder: '1', value: 'R$ 0', progressValue: 0, icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false, isOpen: true, comparisons: [], colSpan: 1, rowSpan: 1 }]) : setDonuts([...donuts, { id: Math.random().toString(36).substr(2, 9), title: 'Nova Rosca', mode: 'completeness', geometry: 'full', ringThickness: 12, roundedCorners: true, showCenterText: true, centerTextLabel: 'KPI', centerTextValueMeasure: '[Valor]', completenessMeasure: '[Vendas]', completenessTarget: '[Meta]', slices: [], isOpen: true, colSpan: 1, rowSpan: 1 }])} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-transform active:scale-90"><Plus size={20}/></button>
          </div>

          <div className="space-y-3">
            {activeAppTab === 'cards' ? (
              cards.map(card => (
                <div key={card.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${card.isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'hover:border-indigo-200'}`}>
                  <div className="flex justify-between items-center p-4 cursor-pointer bg-gray-50/50" onClick={() => updateCard(card.id, 'isOpen', !card.isOpen)}>
                     <div className="flex items-center gap-3">{card.isOpen ? <ChevronDown size={16} className="text-indigo-600 font-bold"/> : <ChevronRight size={16} className="text-gray-400"/>}<span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{card.title}</span></div>
                     <button onClick={(e) => { e.stopPropagation(); setCards(cards.filter(c => c.id !== card.id)); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                  {card.isOpen && (
                    <div className="p-5 border-t space-y-6 animate-fadeIn">
                      <Field label="Título"><input value={card.title} onChange={(e) => updateCard(card.id, 'title', e.target.value)} className="input-field font-bold"/></Field>
                      
                      {/* --- NOVO BLOCO: DIMENSÕES GRID --- */}
                      <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
                         <div className="flex items-center gap-2"><Grid3X3 size={14} className="text-purple-600"/><span className="text-[10px] font-black text-purple-700 uppercase">Dimensões do Card (Grid)</span></div>
                         <div className="grid grid-cols-2 gap-4">
                             <Field label="Ocupar Colunas"><input type="number" min="1" max={globalConfig.columns} value={card.colSpan || 1} onChange={(e) => updateCard(card.id, 'colSpan', +e.target.value)} className="input-field"/></Field>
                             <Field label="Ocupar Linhas"><input type="number" min="1" value={card.rowSpan || 1} onChange={(e) => updateCard(card.id, 'rowSpan', +e.target.value)} className="input-field"/></Field>
                         </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                         <div className="flex items-center gap-2"><Binary size={14} className="text-gray-600"/><span className="text-[10px] font-black text-gray-700 uppercase">Dados & Formato</span></div>
                         <MeasureSelect 
                            label="Medida (DAX)" 
                            value={card.measurePlaceholder} 
                            onChange={(v) => updateCard(card.id, 'measurePlaceholder', v)} 
                            bindings={globalConfig.dataBindings || []} 
                         />
                         <div className="grid grid-cols-2 gap-3">
                            <Field label="Formato">
                               <select value={card.formatType} onChange={(e) => updateCard(card.id, 'formatType', e.target.value)} className="input-field">
                                  <option value="none">Nenhum (Texto)</option>
                                  <option value="integer">Inteiro (1.000)</option>
                                  <option value="decimal">Decimal (1.000,00)</option>
                                  <option value="currency">Moeda (R$ 1.000)</option>
                                  <option value="currency_short">Moeda Compacta (R$ 1M)</option>
                                  <option value="short">Compacto (1M)</option>
                                  <option value="percent">Porcentagem (%)</option>
                               </select>
                            </Field>
                            <Field label="Casas Decimais"><input type="number" value={card.decimalPlaces} onChange={(e) => updateCard(card.id, 'decimalPlaces', +e.target.value)} className="input-field"/></Field>
                         </div>
                      </div>
                      
                      {/* BARRA DE PROGRESSO */}
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><BarChart3 size={14} className="text-blue-600"/><span className="text-[10px] font-black text-blue-700 uppercase">Barra de Progresso</span></div>
                            <button onClick={() => updateCard(card.id, 'type', card.type === 'progress' ? 'simple' : 'progress')} className={`w-12 h-6 rounded-full relative transition-all ${card.type === 'progress' ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${card.type === 'progress' ? 'left-7' : 'left-1'}`} /></button>
                         </div>
                         
                         {card.type === 'progress' && (
                           <div className="space-y-4 pt-2 animate-fadeIn">
                              <MeasureSelect 
                                label="Medida do Valor (Progresso)" 
                                value={card.progressMeasure || ''} 
                                onChange={(v) => updateCard(card.id, 'progressMeasure', v)} 
                                bindings={globalConfig.dataBindings || []} 
                              />
                              <MeasureSelect 
                                label="Meta (Target)" 
                                value={card.progressTarget || ''} 
                                onChange={(v) => updateCard(card.id, 'progressTarget', v)} 
                                bindings={globalConfig.dataBindings || []} 
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <Field label="Cor da Barra"><ColorPickerSimple value={card.progressColor || card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'progressColor', v)} /></Field>
                                  <Field label="Altura (px)"><input type="number" value={card.progressHeight || 8} onChange={(e) => updateCard(card.id, 'progressHeight', +e.target.value)} className="input-field" /></Field>
                              </div>
                              <Field label="Preview Valor (0-100)"><input type="range" min="0" max="100" value={card.progressValue || 50} onChange={(e) => updateCard(card.id, 'progressValue', +e.target.value)} className="range-slider accent-blue-600" /></Field>
                           </div>
                         )}
                      </div>

                      {/* ICONOGRAFIA */}
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                         <div className="flex items-center gap-2"><Component size={14} className="text-indigo-600"/><span className="text-[10px] font-black text-indigo-700 uppercase">Iconografia</span></div>
                         <div className="space-y-4">
                           <div className="col-span-2">
                               <div className="flex justify-between items-center mb-2">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ícone Selecionado</label>
                                 <button onClick={() => setIconSelectorOpen(iconSelectorOpen === card.id ? null : card.id)} className="text-[9px] font-bold text-indigo-600 underline">
                                   {iconSelectorOpen === card.id ? 'Fechar Grade' : 'Abrir Grade de Ícones'}
                                 </button>
                               </div>
                               {iconSelectorOpen === card.id && (
                                 <div className="p-3 bg-white rounded-2xl border shadow-xl space-y-4 animate-fadeIn border-indigo-200">
                                    <div className="space-y-3">
                                      <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" placeholder="Pesquisar ícones..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-300"/>
                                      </div>
                                      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                        {['all', 'finance', 'people', 'legal', 'ops', 'tech', 'general'].map((cat) => (
                                          <button key={cat} onClick={() => setActiveIconCategory(cat as any)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeIconCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                            {cat}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                      {filteredIcons.map(([name, def]) => (
                                        <button key={name} title={name} onClick={() => { updateCard(card.id, 'icon', name); setIconSelectorOpen(null); }} className={`group p-2.5 rounded-xl hover:bg-indigo-50 border transition-all flex justify-center items-center ${card.icon === name ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-white border-gray-50 text-gray-400'}`}>
                                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d={def.path}/></svg>
                                        </button>
                                      ))}
                                    </div>
                                 </div>
                               )}
                           </div>
                           
                           <div className="space-y-2">
                             <Field label="Posição em Relação ao Texto">
                                <div className="flex bg-white/50 p-1 rounded-xl border border-indigo-200/50">
                                  {[
                                    { val: 'top', icon: PanelTop, label: 'Topo' },
                                    { val: 'left', icon: PanelLeft, label: 'Esq.' },
                                    { val: 'right', icon: PanelRight, label: 'Dir.' }
                                  ].map((opt) => (
                                    <button 
                                      key={opt.val} 
                                      onClick={() => updateCard(card.id, 'iconPosition', opt.val)} 
                                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                        (card.iconPosition || 'top') === opt.val 
                                          ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
                                          : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                      }`}
                                      title={opt.label}
                                    >
                                      <opt.icon size={16} />
                                    </button>
                                  ))}
                                </div>
                             </Field>
                           </div>

                           <div className="grid grid-cols-2 gap-4 pt-2">
                             <Field label="Tamanho (px)"><input type="number" value={card.iconSize || 24} onChange={(e) => updateCard(card.id, 'iconSize', +e.target.value)} className="input-field"/></Field>
                             <Field label="Padding (px)"><input type="number" value={card.iconPadding || 8} onChange={(e) => updateCard(card.id, 'iconPadding', +e.target.value)} className="input-field"/></Field>
                             <Field label="Cor Ícone"><ColorPickerSimple value={card.iconColor || card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'iconColor', v)}/></Field>
                             <Field label="Cor Fundo"><ColorPickerSimple value={card.iconBackgroundColor || 'transparent'} onChange={(v) => updateCard(card.id, 'iconBackgroundColor', v)}/></Field>
                           </div>
                         </div>
                      </div>
                      
                      {/* Override de Estilo */}
                      <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
                        <div className="flex items-center gap-2"><Droplets size={14} className="text-amber-600"/><span className="text-[10px] font-black text-amber-700 uppercase">Override de Estilo</span></div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Acento Local"><ColorPickerSimple value={card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'accentColor', v)} /></Field>
                          <Field label="Fundo Local"><ColorPickerSimple value={card.cardBackgroundColor || globalConfig.cardBackgroundColor} onChange={(v) => updateCard(card.id, 'cardBackgroundColor', v)} /></Field>
                        </div>
                        <Field label="Alinhamento Texto (Local)">
                           <div className="flex bg-white p-1 rounded-xl border border-amber-200/50">
                              {['left', 'center', 'right'].map((align: any) => (
                                  <button key={align} onClick={() => updateCard(card.id, 'textAlign', align)} className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${card.textAlign === align ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-300 hover:text-gray-500'}`}>
                                     {align === 'left' ? <AlignLeft size={14}/> : align === 'center' ? <AlignCenter size={14}/> : <AlignRight size={14}/>}
                                  </button>
                              ))}
                           </div>
                        </Field>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comparativos</label>
                          <div className="flex gap-2">
                             <button onClick={() => addComparison(card.id, 'mom')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-[8px] font-black text-gray-600 hover:bg-gray-200"><CalendarDays size={10}/> MOM</button>
                             <button onClick={() => addComparison(card.id, 'yoy')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-[8px] font-black text-gray-600 hover:bg-gray-200"><CalendarRange size={10}/> YOY</button>
                          </div>
                        </div>
                        <div className="space-y-3">
                           {card.comparisons.map(comp => (
                             <div key={comp.id} className="p-4 bg-white border border-gray-100 rounded-xl relative group shadow-sm">
                                <button onClick={() => updateCard(card.id, 'comparisons', card.comparisons.filter(c => c.id !== comp.id))} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <Field label="Rótulo"><input value={comp.label} onChange={(e) => { const newC = [...card.comparisons]; const idx = newC.findIndex(x => x.id === comp.id); newC[idx].label = e.target.value; updateCard(card.id, 'comparisons', newC); }} className="input-field text-[11px]"/></Field>
                                  <MeasureSelect 
                                     label="Medida Variância" 
                                     value={comp.measurePlaceholder} 
                                     onChange={(v) => { const newC = [...card.comparisons]; const idx = newC.findIndex(x => x.id === comp.id); newC[idx].measurePlaceholder = v; updateCard(card.id, 'comparisons', newC); }}
                                     bindings={globalConfig.dataBindings || []} 
                                  />
                                </div>
                                <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <button onClick={() => { const newC = [...card.comparisons]; const idx = newC.findIndex(x => x.id === comp.id); newC[idx].invertColor = !newC[idx].invertColor; updateCard(card.id, 'comparisons', newC); }} className={`w-10 h-6 rounded-full relative transition-all flex-shrink-0 ${comp.invertColor ? 'bg-red-500' : 'bg-green-500'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${comp.invertColor ? 'left-5' : 'left-1'}`} /></button>
                                    <span className="text-[10px] font-bold text-gray-600">{comp.invertColor ? 'Invertido (Aumentar é Ruim)' : 'Padrão (Aumentar é Bom)'}</span>
                                </div>
                             </div>
                           ))}
                           <button onClick={() => addComparison(card.id)} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[9px] font-black text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-all">+ ADICIONAR PERSONALIZADO</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // LÓGICA DE DONUTS
              donuts.map(donut => (
                <div key={donut.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${donut.isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'hover:border-indigo-200'}`}>
                   <div className="flex justify-between items-center p-4 cursor-pointer bg-gray-50/50" onClick={() => updateDonut(donut.id, 'isOpen', !donut.isOpen)}>
                     <div className="flex items-center gap-3">{donut.isOpen ? <ChevronDown size={16} className="text-indigo-600 font-bold"/> : <ChevronRight size={16} className="text-gray-400"/>}<span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{donut.title}</span></div>
                     <button onClick={(e) => { e.stopPropagation(); setDonuts(donuts.filter(d => d.id !== donut.id)); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                   </div>
                   {donut.isOpen && (
                     <div className="p-5 border-t space-y-6 animate-fadeIn">
                       <Field label="Título"><input value={donut.title} onChange={(e) => updateDonut(donut.id, 'title', e.target.value)} className="input-field font-bold"/></Field>
                       
                       {/* --- NOVO BLOCO: DIMENSÕES GRID (DONUTS) --- */}
                       <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
                         <div className="flex items-center gap-2"><Grid3X3 size={14} className="text-purple-600"/><span className="text-[10px] font-black text-purple-700 uppercase">Dimensões do Card (Grid)</span></div>
                         <div className="grid grid-cols-2 gap-4">
                             <Field label="Ocupar Colunas"><input type="number" min="1" max={globalConfig.columns} value={donut.colSpan || 1} onChange={(e) => updateDonut(donut.id, 'colSpan', +e.target.value)} className="input-field"/></Field>
                             <Field label="Ocupar Linhas"><input type="number" min="1" value={donut.rowSpan || 1} onChange={(e) => updateDonut(donut.id, 'rowSpan', +e.target.value)} className="input-field"/></Field>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                         <Field label="Modo">
                            <select value={donut.mode} onChange={(e) => updateDonut(donut.id, 'mode', e.target.value)} className="input-field">
                              <option value="completeness">Atingimento (Meta)</option>
                              <option value="distribution">Distribuição (Fatias)</option>
                            </select>
                         </Field>
                         <Field label="Geometria">
                            <select value={donut.geometry} onChange={(e) => updateDonut(donut.id, 'geometry', e.target.value)} className="input-field">
                              <option value="full">Círculo Completo</option>
                              <option value="semicircle">Semicírculo (Gauge)</option>
                            </select>
                         </Field>
                       </div>
                       
                       <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                          <div className="flex items-center gap-2"><Binary size={14} className="text-gray-600"/><span className="text-[10px] font-black text-gray-700 uppercase">Dados do Gráfico</span></div>
                          {donut.mode === 'completeness' ? (
                            <>
                             <MeasureSelect 
                                label="Medida Realizado" 
                                value={donut.completenessMeasure} 
                                onChange={(v) => updateDonut(donut.id, 'completenessMeasure', v)} 
                                bindings={globalConfig.dataBindings || []} 
                             />
                             <MeasureSelect 
                                label="Medida Meta (Target)" 
                                value={donut.completenessTarget} 
                                onChange={(v) => updateDonut(donut.id, 'completenessTarget', v)} 
                                bindings={globalConfig.dataBindings || []} 
                             />
                            </>
                          ) : (
                            <div className="text-xs text-gray-500 p-2">Adicionar fatias (não implementado nesta UI simplificada)</div>
                          )}
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         <Field label="Espessura Anel"><input type="number" value={donut.ringThickness} onChange={(e) => updateDonut(donut.id, 'ringThickness', +e.target.value)} className="input-field"/></Field>
                         <Field label="Cor Principal"><ColorPickerSimple value={donut.accentColor || globalConfig.primaryColor} onChange={(v) => updateDonut(donut.id, 'accentColor', v)} /></Field>
                       </div>
                       
                       <div className="p-3 border rounded-xl flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Texto Central</label>
                          <button onClick={() => updateDonut(donut.id, 'showCenterText', !donut.showCenterText)} className={`w-10 h-5 rounded-full relative transition-all ${donut.showCenterText ? 'bg-indigo-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${donut.showCenterText ? 'left-6' : 'left-1'}`} /></button>
                       </div>
                       {donut.showCenterText && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                             <Field label="Rótulo (Texto)"><input value={donut.centerTextLabel} onChange={(e) => updateDonut(donut.id, 'centerTextLabel', e.target.value)} className="input-field"/></Field>
                             <MeasureSelect 
                                label="Medida Valor" 
                                value={donut.centerTextValueMeasure} 
                                onChange={(v) => updateDonut(donut.id, 'centerTextValueMeasure', v)} 
                                bindings={globalConfig.dataBindings || []} 
                             />
                          </div>
                       )}
                     </div>
                   )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <style>{`
         .input-field { width: 100%; padding: 10px 14px; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 12px; font-size: 13px; font-weight: 500; outline: none; transition: all 0.3s; color: #1e293b; }
         .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08); background: #fff; }
         .range-slider { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; appearance: none; cursor: pointer; }
         .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
         .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

const Field = ({ label, children, className = "" }: any) => <div className={`space-y-1.5 ${className}`}><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block pl-1">{label}</label>{children}</div>;
const ColorPickerSimple = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-gray-100 shadow-sm"><input type="color" value={value && value.startsWith('#') ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 bg-transparent"/><input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent text-[11px] font-mono outline-none font-black text-gray-700 uppercase tracking-tighter"/></div>
);

export default Editor;