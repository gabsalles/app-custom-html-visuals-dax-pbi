import React, { useState, useMemo } from 'react';
import { CardConfig, GlobalConfig, ComparisonConfig, DonutChartConfig, AppTab, DonutSlice } from '../types';
import { iconDefinitions, IconCategory } from '../utils/icons';
import { Trash2, Plus, Type, Palette, Layout, ChevronDown, MousePointer2, X, Binary, ALargeSmall, Droplets, CalendarDays, CalendarRange, PieChart, Layers, Wand2, AlignLeft, AlignCenter, AlignRight, Component, BarChart3, Search, Database, PanelTop, PanelLeft, PanelRight, Sun, Grid3X3, ArrowUp, ArrowDown, ArrowLeft, Settings2, Sparkles } from 'lucide-react';

interface EditorProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  cards: CardConfig[];
  setCards: React.Dispatch<React.SetStateAction<CardConfig[]>>;
  donuts: DonutChartConfig[];
  setDonuts: React.Dispatch<React.SetStateAction<DonutChartConfig[]>>;
  activeAppTab: AppTab;
  setActiveAppTab: (tab: AppTab) => void;
  selectedCardId: string | null;
  setSelectedCardId: (id: string | null) => void;
}

// --- NOVOS COMPONENTES DE UI (BLINDADOS CONTRA BUGS DE CSS) ---
const CustomInput = ({ className = '', ...props }: any) => (
  <input 
    {...props} 
    className={`w-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all placeholder:text-slate-400 placeholder:font-normal ${className}`} 
  />
);

const CustomSelect = ({ className = '', children, ...props }: any) => (
  <div className="relative w-full">
    <select 
      {...props} 
      className={`w-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg pl-3 pr-8 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
  </div>
);

const CustomRange = ({ className = '', ...props }: any) => (
  <input 
    type="range" 
    {...props} 
    className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${className}`} 
  />
);

const Field = ({ label, children, className = "" }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{label}</label>
    {children}
  </div>
);

const ColorPickerSimple = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
    <input type="color" value={value && value.startsWith('#') ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
    <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent text-[11px] font-mono outline-none font-bold text-slate-700 uppercase tracking-tighter" />
  </div>
);

const SegmentedControl = ({ options, value, onChange }: { options: { val: string, icon?: any, label?: string }[], value: string, onChange: (v: string) => void }) => (
  <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
    {options.map((opt) => (
      <button key={opt.val} onClick={() => onChange(opt.val)} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] font-bold ${value === opt.val ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`} title={opt.label || opt.val}>
        {opt.icon ? <opt.icon size={14} /> : opt.label}
      </button>
    ))}
  </div>
);

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}>
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SectionHeader = ({ icon: Icon, title, rightElement }: any) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600"><Icon size={14} /></div>
      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{title}</span>
    </div>
    {rightElement}
  </div>
);

const MeasureSelect = ({ label, value, onChange, bindings }: { label: string, value: string, onChange: (val: string) => void, bindings: any[] }) => {
  const isBound = bindings.some(b => b.value === value);
  const [mode, setMode] = useState<'select' | 'manual'>(isBound || value === '' ? 'select' : 'manual');

  return (
    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <button onClick={() => setMode(mode === 'select' ? 'manual' : 'select')} className="text-[9px] font-bold text-indigo-500 uppercase hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded transition-colors">
          {mode === 'select' ? 'Digitar Manual' : 'Selecionar da Lista'}
        </button>
      </div>
      {mode === 'select' ? (
        <CustomSelect value={value} onChange={(e: any) => { if(e.target.value === 'custom') setMode('manual'); else onChange(e.target.value); }}>
          <option value="">Selecione uma medida...</option>
          {bindings.map(b => ( <option key={b.id} value={b.value}>{b.label}</option> ))}
          <option disabled>──────────</option>
          <option value="custom">+ Digitar Manualmente</option>
        </CustomSelect>
      ) : (
        <CustomInput value={value} onChange={(e: any) => onChange(e.target.value)} className="font-mono text-indigo-600" placeholder="Ex: [Total Vendas]" />
      )}
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ globalConfig, setGlobalConfig, cards, setCards, donuts, setDonuts, activeAppTab, setActiveAppTab, selectedCardId, setSelectedCardId }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'layout' | 'style' | 'colors' | 'interactive'>('layout');
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<IconCategory | 'all'>('all');

  const selectedCard = useMemo(() => cards.find(c => c.id === selectedCardId), [cards, selectedCardId]);
  const selectedDonut = useMemo(() => donuts.find(d => d.id === selectedCardId), [donuts, selectedCardId]);
  const isEditingItem = selectedCardId !== null && (selectedCard || selectedDonut);

  const filteredIcons = useMemo(() => Object.entries(iconDefinitions).filter(([name, def]) => {
      const matchesSearch = name.toLowerCase().includes(iconSearch.toLowerCase()) || def.tags.some(tag => tag.toLowerCase().includes(iconSearch.toLowerCase()));
      const matchesCategory = activeIconCategory === 'all' || def.category === activeIconCategory;
      return matchesSearch && matchesCategory;
  }), [iconSearch, activeIconCategory]);

  const applyBradescoPreset = () => setGlobalConfig({ ...globalConfig, primaryColor: '#cc092f', cardBackgroundColor: '#ffffff', textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280', positiveColor: '#059669', negativeColor: '#DC2626', hoverEffect: 'lift', borderRadius: 20, fontWeightTitle: 800, fontWeightValue: 800, animation: 'fadeInUp', shadowIntensity: 10, shadowBlur: 20, shadowDistance: 10, textAlign: 'left' });
  const updateCard = (id: string, field: keyof CardConfig, value: any) => setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  const updateDonut = (id: string, field: keyof DonutChartConfig, value: any) => setDonuts(donuts.map(d => d.id === id ? { ...d, [field]: value } : d));

  const moveItem = (index: number, direction: 1 | -1, type: 'cards' | 'charts') => {
    const list = type === 'cards' ? [...cards] : [...donuts];
    if (index + direction < 0 || index + direction >= list.length) return;
    [list[index], list[index + direction]] = [list[index + direction], list[index]];
    type === 'cards' ? setCards(list as CardConfig[]) : setDonuts(list as DonutChartConfig[]);
  };

  const addComparison = (cardId: string, type: 'mom' | 'yoy' | 'custom' = 'custom') => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    let label = 'Novo Comp', logic = 'TRUE()', measure = '[Medida]';
    if (type === 'mom') { label = 'vs Mês Anterior'; logic = '[Variação Mês] > 0'; measure = '[Variação % Mês]'; }
    if (type === 'yoy') { label = 'vs Ano Anterior'; logic = '[Variação Ano] > 0'; measure = '[Variação % Ano]'; }
    const newComp: ComparisonConfig = { id: Math.random().toString(36).substr(2, 9), label, value: '0%', trend: 'up', logic, measurePlaceholder: measure, invertColor: false };
    updateCard(cardId, 'comparisons', [...card.comparisons, newComp]);
  };

  const addSlice = (donutId: string) => {
    const donut = donuts.find(d => d.id === donutId);
    if (!donut) return;
    updateDonut(donutId, 'slices', [...donut.slices, { id: Math.random().toString(36).substr(2, 9), label: `Fatia ${donut.slices.length + 1}`, measurePlaceholder: '10', color: globalConfig.primaryColor, value: '25' }]);
  };

  const updateSlice = (donutId: string, sliceId: string, field: keyof DonutSlice, val: any) => {
      const donut = donuts.find(d => d.id === donutId);
      if (donut) updateDonut(donutId, 'slices', donut.slices.map(s => s.id === sliceId ? { ...s, [field]: val } : s));
  };

  const deleteSlice = (donutId: string, sliceId: string) => {
       const donut = donuts.find(d => d.id === donutId);
       if (donut) updateDonut(donutId, 'slices', donut.slices.filter(s => s.id !== sliceId));
  };

  // --- RENDERS DE EDIÇÃO ESPECÍFICA (O PAINEL DE PROPRIEDADES) ---
  if (isEditingItem) {
    if (selectedCard) {
      const card = selectedCard;
      return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 z-20 animate-fadeIn">
          <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
             <button onClick={() => setSelectedCardId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"><ArrowLeft size={16}/></button>
             <div className="flex-1">
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">Propriedades do Card</p>
                <input value={card.title} onChange={(e) => updateCard(card.id, 'title', e.target.value)} className="w-full font-bold text-sm text-slate-800 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors" placeholder="Título do Card" />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-20">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <SectionHeader icon={Grid3X3} title="Dimensões no Grid" />
                 <div className="grid grid-cols-2 gap-4">
                    <Field label="Colunas (Largura)"><CustomInput type="number" min="1" max={globalConfig.columnsDesktop || 3} value={card.colSpan || 1} onChange={(e: any) => updateCard(card.id, 'colSpan', +e.target.value)}/></Field>
                    <Field label="Linhas (Altura)"><CustomInput type="number" min="1" value={card.rowSpan || 1} onChange={(e: any) => updateCard(card.id, 'rowSpan', +e.target.value)}/></Field>
                 </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <SectionHeader icon={Binary} title="Dados & Formatação" />
                 <div className="space-y-4">
                    <MeasureSelect label="Medida Principal (DAX)" value={card.measurePlaceholder} onChange={(v) => updateCard(card.id, 'measurePlaceholder', v)} bindings={globalConfig.dataBindings || []} />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Formato">
                            <CustomSelect value={card.formatType} onChange={(e: any) => updateCard(card.id, 'formatType', e.target.value)}>
                                <option value="none">Texto Livre</option><option value="integer">Inteiro (1.000)</option><option value="decimal">Decimal (1.000,00)</option><option value="currency">Moeda (R$ 1.000)</option><option value="currency_short">Moeda Curta (R$ 1M)</option><option value="short">Curto (1M)</option><option value="percent">Porcentagem (%)</option>
                            </CustomSelect>
                        </Field>
                        <Field label="Decimais"><CustomInput type="number" value={card.decimalPlaces} onChange={(e: any) => updateCard(card.id, 'decimalPlaces', +e.target.value)}/></Field>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-all">
                 <SectionHeader icon={BarChart3} title="Barra de Progresso" rightElement={<ToggleSwitch checked={card.type === 'progress'} onChange={() => updateCard(card.id, 'type', card.type === 'progress' ? 'simple' : 'progress')} />} />
                 {card.type === 'progress' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                       <MeasureSelect label="Medida Realizado" value={card.progressMeasure || ''} onChange={(v) => updateCard(card.id, 'progressMeasure', v)} bindings={globalConfig.dataBindings || []} />
                       <MeasureSelect label="Medida Meta (Alvo)" value={card.progressTarget || ''} onChange={(v) => updateCard(card.id, 'progressTarget', v)} bindings={globalConfig.dataBindings || []} />
                       <div className="grid grid-cols-2 gap-4">
                           <Field label="Cor da Barra"><ColorPickerSimple value={card.progressColor || card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'progressColor', v)} /></Field>
                           <Field label="Altura (px)"><CustomInput type="number" value={card.progressHeight || 8} onChange={(e: any) => updateCard(card.id, 'progressHeight', +e.target.value)}/></Field>
                       </div>
                       <Field label={`Preview no Editor: ${card.progressValue || 50}%`}><CustomRange min="0" max="100" value={card.progressValue || 50} onChange={(e: any) => updateCard(card.id, 'progressValue', +e.target.value)}/></Field>
                    </div>
                 )}
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <SectionHeader icon={Component} title="Iconografia" />
                 <div className="space-y-5">
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconDefinitions[card.icon || 'chart']?.path || iconDefinitions.circle.path}/></svg></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Atual: {card.icon || 'chart'}</span>
                       </div>
                       <button onClick={() => setIconSelectorOpen(!iconSelectorOpen)} className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">TROCAR</button>
                    </div>
                    
                    {iconSelectorOpen && (
                       <div className="p-3 bg-slate-800 rounded-2xl shadow-xl space-y-3 animate-fadeIn relative z-20">
                          <input type="text" placeholder="Pesquisar ícones..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-400"/>
                          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar-dark">
                             {['all', 'finance', 'people', 'legal', 'tech'].map((cat) => (
                               <button key={cat} onClick={() => setActiveIconCategory(cat as any)} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeIconCategory === cat ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{cat}</button>
                             ))}
                          </div>
                          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar-dark p-1">
                            {filteredIcons.map(([name, def]) => (
                               <button key={name} title={name} onClick={() => { updateCard(card.id, 'icon', name); setIconSelectorOpen(false); }} className={`p-2.5 rounded-xl border flex justify-center transition-all ${card.icon === name ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'}`}>
                                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d={def.path}/></svg>
                               </button>
                            ))}
                          </div>
                       </div>
                    )}

                    <Field label="Posição em Relação ao Texto">
                       <SegmentedControl options={[{val:'top', icon:PanelTop, label:'Topo'}, {val:'left', icon:PanelLeft, label:'Esq'}, {val:'right', icon:PanelRight, label:'Dir'}]} value={card.iconPosition || 'top'} onChange={(v) => updateCard(card.id, 'iconPosition', v)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Tamanho (px)"><CustomInput type="number" value={card.iconSize || 24} onChange={(e: any) => updateCard(card.id, 'iconSize', +e.target.value)}/></Field>
                        <Field label="Padding Interno"><CustomInput type="number" value={card.iconPadding || 8} onChange={(e: any) => updateCard(card.id, 'iconPadding', +e.target.value)}/></Field>
                        <Field label="Cor do Ícone"><ColorPickerSimple value={card.iconColor || card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'iconColor', v)} /></Field>
                        <Field label="Cor de Fundo"><ColorPickerSimple value={card.iconBackgroundColor || 'transparent'} onChange={(v) => updateCard(card.id, 'iconBackgroundColor', v)} /></Field>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <SectionHeader icon={Droplets} title="Aparência Específica" />
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Acento Local"><ColorPickerSimple value={card.accentColor || globalConfig.primaryColor} onChange={(v) => updateCard(card.id, 'accentColor', v)} /></Field>
                    <Field label="Fundo Local"><ColorPickerSimple value={card.cardBackgroundColor || globalConfig.cardBackgroundColor} onChange={(v) => updateCard(card.id, 'cardBackgroundColor', v)} /></Field>
                 </div>
                 <Field label="Alinhamento Específico">
                    <SegmentedControl options={[{val:'left', icon:AlignLeft}, {val:'center', icon:AlignCenter}, {val:'right', icon:AlignRight}]} value={card.textAlign || globalConfig.textAlign || 'left'} onChange={(v) => updateCard(card.id, 'textAlign', v)} />
                 </Field>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <SectionHeader icon={ArrowUp} title="Comparativos (Badges)" rightElement={
                    <div className="flex gap-1">
                       <button onClick={() => addComparison(card.id, 'mom')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[8px] font-black text-slate-600 transition-colors">+ MOM</button>
                       <button onClick={() => addComparison(card.id, 'yoy')} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[8px] font-black text-slate-600 transition-colors">+ YOY</button>
                    </div>
                 } />
                 <div className="space-y-3">
                    {card.comparisons.map((comp) => (
                       <div key={comp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                          <button onClick={() => updateCard(card.id, 'comparisons', card.comparisons.filter(c => c.id !== comp.id))} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                             <Field label="Rótulo (Texto)"><CustomInput value={comp.label} onChange={(e: any) => { const newC = [...card.comparisons]; newC.find(x => x.id === comp.id)!.label = e.target.value; updateCard(card.id, 'comparisons', newC); }}/></Field>
                             <MeasureSelect label="Medida Variância" value={comp.measurePlaceholder} onChange={(v) => { const newC = [...card.comparisons]; newC.find(x => x.id === comp.id)!.measurePlaceholder = v; updateCard(card.id, 'comparisons', newC); }} bindings={globalConfig.dataBindings || []} />
                          </div>
                          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                             <span className="text-[9px] font-black text-slate-500 uppercase">Inverter Cores (Vermelho = Bom)</span>
                             <ToggleSwitch checked={comp.invertColor || false} onChange={(v) => { const newC = [...card.comparisons]; newC.find(x => x.id === comp.id)!.invertColor = v; updateCard(card.id, 'comparisons', newC); }} />
                          </div>
                       </div>
                    ))}
                    {card.comparisons.length === 0 && <p className="text-xs text-center text-slate-400 py-2">Nenhum comparativo adicionado.</p>}
                    <button onClick={() => addComparison(card.id)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">+ ADICIONAR MANUAL</button>
                 </div>
              </div>
          </div>
        </div>
      );
    }
    
    // --- EDIÇÃO DE GRÁFICO (DONUT) ---
    if (selectedDonut) {
      const donut = selectedDonut;
      return (
         <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 z-20 animate-fadeIn">
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
               <button onClick={() => setSelectedCardId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"><ArrowLeft size={16}/></button>
               <div className="flex-1">
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">Propriedades do Gráfico</p>
                  <input value={donut.title} onChange={(e) => updateDonut(donut.id, 'title', e.target.value)} className="w-full font-bold text-sm text-slate-800 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors" placeholder="Título do Gráfico" />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-20">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <SectionHeader icon={Grid3X3} title="Dimensões no Grid" />
                  <div className="grid grid-cols-2 gap-4">
                     <Field label="Colunas (Largura)"><CustomInput type="number" min="1" max={globalConfig.columnsDesktop || 3} value={donut.colSpan || 1} onChange={(e: any) => updateDonut(donut.id, 'colSpan', +e.target.value)}/></Field>
                     <Field label="Linhas (Altura)"><CustomInput type="number" min="1" value={donut.rowSpan || 1} onChange={(e: any) => updateDonut(donut.id, 'rowSpan', +e.target.value)}/></Field>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <SectionHeader icon={Type} title="Tipografia do Gráfico" />
                  <div className="grid grid-cols-3 gap-3">
                     <Field label="Título"><CustomInput type="number" value={donut.fontSizeTitle || globalConfig.fontSizeTitle} onChange={(e: any) => updateDonut(donut.id, 'fontSizeTitle', +e.target.value)} className="px-2"/></Field>
                     <Field label="V. Central"><CustomInput type="number" value={donut.fontSizeValue || 16} onChange={(e: any) => updateDonut(donut.id, 'fontSizeValue', +e.target.value)} className="px-2"/></Field>
                     <Field label="Rótulo"><CustomInput type="number" value={donut.fontSizeLabel || 9} onChange={(e: any) => updateDonut(donut.id, 'fontSizeLabel', +e.target.value)} className="px-2"/></Field>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <SectionHeader icon={PieChart} title="Formato Base" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <Field label="Modo">
                        <CustomSelect value={donut.mode} onChange={(e: any) => updateDonut(donut.id, 'mode', e.target.value)}>
                           <option value="completeness">Atingimento (Meta)</option>
                           <option value="distribution">Distribuição (Fatias)</option>
                        </CustomSelect>
                     </Field>
                     <Field label="Geometria">
                        <CustomSelect value={donut.geometry} onChange={(e: any) => updateDonut(donut.id, 'geometry', e.target.value)}>
                           <option value="full">Círculo (360º)</option>
                           <option value="semicircle">Semicírculo (Gauge)</option>
                        </CustomSelect>
                     </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <Field label="Espessura da Linha"><CustomInput type="number" value={donut.ringThickness || 12} onChange={(e: any) => updateDonut(donut.id, 'ringThickness', +e.target.value)}/></Field>
                      <Field label="Escala (Tamanho %)"><CustomInput type="number" value={donut.chartSize || 90} onChange={(e: any) => updateDonut(donut.id, 'chartSize', +e.target.value)}/></Field>
                  </div>
                  {donut.mode !== 'distribution' && (
                     <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Cantos Arredondados</span>
                        <ToggleSwitch checked={donut.roundedCorners ?? true} onChange={(v) => updateDonut(donut.id, 'roundedCorners', v)} />
                     </div>
                  )}
               </div>

               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <SectionHeader icon={Database} title="Dados & Fatias" rightElement={donut.mode === 'distribution' ? <button onClick={() => addSlice(donut.id)} className="text-[10px] font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100">+ Fatia</button> : null} />
                  
                  {donut.mode === 'completeness' ? (
                     <div className="space-y-4">
                        <MeasureSelect label="Realizado (Valor)" value={donut.completenessMeasure} onChange={(v) => updateDonut(donut.id, 'completenessMeasure', v)} bindings={globalConfig.dataBindings || []} />
                        <MeasureSelect label="Meta (Target Total)" value={donut.completenessTarget} onChange={(v) => updateDonut(donut.id, 'completenessTarget', v)} bindings={globalConfig.dataBindings || []} />
                        <Field label="Cor da Barra de Progresso"><ColorPickerSimple value={donut.accentColor || globalConfig.primaryColor} onChange={(v) => updateDonut(donut.id, 'accentColor', v)} /></Field>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {donut.slices.map((slice) => (
                           <div key={slice.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
                              <button onClick={() => deleteSlice(donut.id, slice.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                              <div className="flex gap-2 mb-3 pr-6">
                                 <input type="color" value={slice.color} onChange={(e) => updateSlice(donut.id, slice.id, 'color', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer p-0 border-0" />
                                 <input value={slice.label} onChange={(e) => updateSlice(donut.id, slice.id, 'label', e.target.value)} className="flex-1 bg-transparent text-[11px] font-bold text-slate-700 outline-none border-b border-slate-300 focus:border-indigo-400 placeholder-slate-400 py-1 px-2" placeholder="Nome da Fatia"/>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <MeasureSelect label="Medida (DAX)" value={slice.measurePlaceholder} onChange={(v) => updateSlice(donut.id, slice.id, 'measurePlaceholder', v)} bindings={globalConfig.dataBindings || []} />
                                  <Field label="Preview (%)"><CustomInput type="number" value={slice.value} onChange={(e: any) => updateSlice(donut.id, slice.id, 'value', e.target.value)}/></Field>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <SectionHeader icon={Type} title="Conteúdo Central" rightElement={<ToggleSwitch checked={donut.showCenterText} onChange={(v) => updateDonut(donut.id, 'showCenterText', v)} />} />
                  {donut.showCenterText && (
                     <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <Field label="Rótulo Fixo"><CustomInput value={donut.centerTextLabel} onChange={(e: any) => updateDonut(donut.id, 'centerTextLabel', e.target.value)}/></Field>
                        <MeasureSelect label="Medida do Valor" value={donut.centerTextValueMeasure} onChange={(v) => updateDonut(donut.id, 'centerTextValueMeasure', v)} bindings={globalConfig.dataBindings || []} />
                     </div>
                  )}
               </div>
            </div>
         </div>
      );
    }
  }

  // --- RENDER DA VISÃO GLOBAL ---
  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 shadow-xl z-20">
      
      <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
         <button onClick={applyBradescoPreset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 hover:shadow-xl hover:scale-[1.01] transition-all"><Wand2 size={14} /> Aplicar Tema Bradesco</button>
         
         <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setActiveAppTab('cards')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeAppTab === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Layers size={14} /> Cards</button>
            <button onClick={() => setActiveAppTab('charts')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeAppTab === 'charts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><PieChart size={14} /> Gráficos</button>
         </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[350px] shrink-0 border-b border-slate-200 bg-white">
         <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar shrink-0">
            {[{ id: 'data', icon: Database, label: 'Dados' }, { id: 'layout', icon: Layout, label: 'Layout' }, { id: 'style', icon: Type, label: 'Fontes' }, { id: 'colors', icon: Palette, label: 'Cores' }, { id: 'interactive', icon: Sparkles, label: 'Efeitos' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[65px] flex flex-col items-center justify-center gap-1.5 py-3 text-[9px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}>
               <tab.icon size={16} /> {tab.label}
            </button>
            ))}
         </div>

         <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
            {activeTab === 'data' && (
               <div className="space-y-4 animate-fadeIn">
                  <SectionHeader icon={Database} title="Biblioteca de Medidas" rightElement={<button onClick={() => setGlobalConfig({ ...globalConfig, dataBindings: [...(globalConfig.dataBindings || []), { id: Math.random().toString(), label: 'Nova Medida', value: '[Medida]' }] })} className="px-2 py-1 bg-indigo-600 text-white rounded font-bold text-[9px] hover:bg-indigo-700">+ Add</button>} />
                  <div className="space-y-2">
                     {(globalConfig.dataBindings || []).map(b => (
                        <div key={b.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm group">
                           <div className="flex-1 space-y-1">
                              <input value={b.label} onChange={(e) => setGlobalConfig({ ...globalConfig, dataBindings: globalConfig.dataBindings.map(x => x.id === b.id ? {...x, label: e.target.value} : x) })} className="w-full text-[11px] font-bold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-200 placeholder-slate-300" placeholder="Rótulo (Ex: Vendas)"/>
                              <input value={b.value} onChange={(e) => setGlobalConfig({ ...globalConfig, dataBindings: globalConfig.dataBindings.map(x => x.id === b.id ? {...x, value: e.target.value} : x) })} className="w-full text-[10px] font-mono text-indigo-500 bg-transparent outline-none border-b border-transparent focus:border-indigo-200 placeholder-indigo-200" placeholder="DAX (Ex: [Total])"/>
                           </div>
                           <button onClick={() => setGlobalConfig({ ...globalConfig, dataBindings: globalConfig.dataBindings.filter(x => x.id !== b.id) })} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'layout' && (
            <div className="space-y-5 animate-fadeIn">
               {/* NOVO BLOCO RESPONSIVO */}
               <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <SectionHeader icon={Grid3X3} title="Colunas Responsivas (Grid)" />
                  <div className="grid grid-cols-3 gap-3">
                     <Field label="Desktop (>800px)"><CustomInput type="number" min="1" value={globalConfig.columnsDesktop || 3} onChange={(e: any) => setGlobalConfig({...globalConfig, columnsDesktop: +e.target.value})}/></Field>
                     <Field label="Tablet (<800px)"><CustomInput type="number" min="1" value={globalConfig.columnsTablet || 2} onChange={(e: any) => setGlobalConfig({...globalConfig, columnsTablet: +e.target.value})}/></Field>
                     <Field label="Mobile (<500px)"><CustomInput type="number" min="1" value={globalConfig.columnsMobile || 1} onChange={(e: any) => setGlobalConfig({...globalConfig, columnsMobile: +e.target.value})}/></Field>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed mt-2 italic">O visual se adaptará magicamente ao redimensionar a caixa no Power BI.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Field label="Espaçamento (Gap px)"><CustomInput type="number" value={globalConfig.gap} onChange={(e: any) => setGlobalConfig({...globalConfig, gap: +e.target.value})}/></Field>
                  <Field label="Arredondamento"><CustomInput type="number" value={globalConfig.borderRadius} onChange={(e: any) => setGlobalConfig({...globalConfig, borderRadius: +e.target.value})}/></Field>
               </div>
               
               {/* O resto da aba de Layout continua aqui com o bg-white de Margem... */}
               <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-center mb-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margem do Canvas</label>
                        <CustomSelect value={globalConfig.marginType || 'all'} onChange={(e: any) => setGlobalConfig({...globalConfig, marginType: e.target.value as 'all' | 'specific'})}>
                           <option value="all">Uniforme</option><option value="specific">Especificar Lados</option>
                        </CustomSelect>
                     </div>
                     {(globalConfig.marginType || 'all') === 'all' ? (
                        <Field label="Margem Total (px)"><CustomInput type="number" value={globalConfig.marginAll ?? 10} onChange={(e: any) => setGlobalConfig({...globalConfig, marginAll: +e.target.value})}/></Field>
                     ) : (
                        <div className="grid grid-cols-2 gap-3">
                           <Field label="Topo"><CustomInput type="number" value={globalConfig.marginTop ?? 10} onChange={(e: any) => setGlobalConfig({...globalConfig, marginTop: +e.target.value})}/></Field>
                           <Field label="Direita"><CustomInput type="number" value={globalConfig.marginRight ?? 10} onChange={(e: any) => setGlobalConfig({...globalConfig, marginRight: +e.target.value})}/></Field>
                           <Field label="Baixo"><CustomInput type="number" value={globalConfig.marginBottom ?? 10} onChange={(e: any) => setGlobalConfig({...globalConfig, marginBottom: +e.target.value})}/></Field>
                           <Field label="Esquerda"><CustomInput type="number" value={globalConfig.marginLeft ?? 10} onChange={(e: any) => setGlobalConfig({...globalConfig, marginLeft: +e.target.value})}/></Field>
                        </div>
                     )}
                  </div>

                  <Field label="Alinhamento Padrão de Textos">
                     <SegmentedControl options={[{val:'left', icon:AlignLeft}, {val:'center', icon:AlignCenter}, {val:'right', icon:AlignRight}]} value={globalConfig.textAlign || 'left'} onChange={(v) => setGlobalConfig({...globalConfig, textAlign: v as any})} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                     <Field label="Arredondamento"><CustomInput type="number" value={globalConfig.borderRadius} onChange={(e: any) => setGlobalConfig({...globalConfig, borderRadius: +e.target.value})}/></Field>
                     <Field label="Altura Mínima (px)"><CustomInput type="number" value={globalConfig.cardMinHeight} onChange={(e: any) => setGlobalConfig({...globalConfig, cardMinHeight: +e.target.value})}/></Field>
                  </div>
               </div>
            )}

            {activeTab === 'style' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={ALargeSmall} title="Tamanhos de Fonte (px)" />
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Título"><CustomInput type="number" value={globalConfig.fontSizeTitle} onChange={(e: any) => setGlobalConfig({...globalConfig, fontSizeTitle: +e.target.value})}/></Field>
                        <Field label="Valor Principal"><CustomInput type="number" value={globalConfig.fontSizeValue} onChange={(e: any) => setGlobalConfig({...globalConfig, fontSizeValue: +e.target.value})}/></Field>
                        <Field label="Subtítulo"><CustomInput type="number" value={globalConfig.fontSizeSub} onChange={(e: any) => setGlobalConfig({...globalConfig, fontSizeSub: +e.target.value})}/></Field>
                        <Field label="Badges"><CustomInput type="number" value={globalConfig.fontSizeBadge || 10} onChange={(e: any) => setGlobalConfig({...globalConfig, fontSizeBadge: +e.target.value})}/></Field>
                     </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={Settings2} title="Peso da Fonte (100-900)" />
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Peso Título"><CustomInput type="number" step="100" min="100" max="900" value={globalConfig.fontWeightTitle} onChange={(e: any) => setGlobalConfig({...globalConfig, fontWeightTitle: +e.target.value})}/></Field>
                        <Field label="Peso Valor"><CustomInput type="number" step="100" min="100" max="900" value={globalConfig.fontWeightValue} onChange={(e: any) => setGlobalConfig({...globalConfig, fontWeightValue: +e.target.value})}/></Field>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'colors' && (
               <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={Palette} title="Cores Base" />
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Primária (Acento)"><ColorPickerSimple value={globalConfig.primaryColor} onChange={(v) => setGlobalConfig({...globalConfig, primaryColor: v})} /></Field>
                        <Field label="Fundo do Canvas"><ColorPickerSimple value={globalConfig.canvasBackgroundColor || '#f8fafc'} onChange={(v) => setGlobalConfig({...globalConfig, canvasBackgroundColor: v})} /></Field>
                        <Field label="Fundo do Card" className="col-span-2"><ColorPickerSimple value={globalConfig.cardBackgroundColor} onChange={(v) => setGlobalConfig({...globalConfig, cardBackgroundColor: v})} /></Field>
                     </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={Type} title="Cores de Texto" />
                     <Field label="Título"><ColorPickerSimple value={globalConfig.textColorTitle} onChange={(v) => setGlobalConfig({...globalConfig, textColorTitle: v})} /></Field>
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Valor Central"><ColorPickerSimple value={globalConfig.textColorValue} onChange={(v) => setGlobalConfig({...globalConfig, textColorValue: v})} /></Field>
                        <Field label="Subtítulo"><ColorPickerSimple value={globalConfig.textColorSub} onChange={(v) => setGlobalConfig({...globalConfig, textColorSub: v})} /></Field>
                     </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={Binary} title="Semântica (Badges)" />
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Positivo (Bom)"><ColorPickerSimple value={globalConfig.positiveColor} onChange={(v) => setGlobalConfig({...globalConfig, positiveColor: v})} /></Field>
                        <Field label="Negativo (Ruim)"><ColorPickerSimple value={globalConfig.negativeColor} onChange={(v) => setGlobalConfig({...globalConfig, negativeColor: v})} /></Field>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'interactive' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={Sun} title="Sombras (Shadow Drop)" />
                     <Field label={`Intensidade: ${globalConfig.shadowIntensity || 0}%`}><CustomRange min="0" max="100" value={globalConfig.shadowIntensity || 0} onChange={(e: any) => setGlobalConfig({...globalConfig, shadowIntensity: +e.target.value})}/></Field>
                     <Field label={`Desfoque (Blur): ${globalConfig.shadowBlur || 0}px`}><CustomRange min="0" max="50" value={globalConfig.shadowBlur || 0} onChange={(e: any) => setGlobalConfig({...globalConfig, shadowBlur: +e.target.value})}/></Field>
                     <Field label={`Distância Y: ${globalConfig.shadowDistance || 0}px`}><CustomRange min="0" max="30" value={globalConfig.shadowDistance || 0} onChange={(e: any) => setGlobalConfig({...globalConfig, shadowDistance: +e.target.value})}/></Field>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                     <SectionHeader icon={MousePointer2} title="Comportamento" />
                     <Field label="Efeito Hover (Mouse over)">
                        <div className="grid grid-cols-2 gap-2">
                           {['none', 'lift', 'scale', 'glow', 'border'].map(eff => (
                              <button key={eff} onClick={() => setGlobalConfig({...globalConfig, hoverEffect: eff as any})} className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${globalConfig.hoverEffect === eff ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{eff}</button>
                           ))}
                        </div>
                     </Field>
                     <Field label="Animação de Entrada">
                        <CustomSelect value={globalConfig.animation} onChange={(e: any) => setGlobalConfig({...globalConfig, animation: e.target.value as any})}>
                           <option value="none">Nenhuma</option><option value="fadeInUp">Fade In Up</option><option value="popIn">Pop In</option><option value="slideRight">Slide Right</option>
                        </CustomSelect>
                     </Field>
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="flex-1 min-h-[250px] flex flex-col bg-slate-100/50">
         <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-white/50 backdrop-blur shrink-0">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={14} className="text-indigo-500"/> Hierarquia</h3>
            <button onClick={() => activeAppTab === 'cards' ? setCards([...cards, { id: Math.random().toString(36).substr(2, 9), title: 'Novo Card', measurePlaceholder: '[Vendas]', formatType: 'currency', decimalPlaces: 0, prefix: '', suffix: '', type: 'simple', targetMeasurePlaceholder: '1', value: 'R$ 0', progressValue: 0, icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false, isOpen: true, comparisons: [], colSpan: 1, rowSpan: 1 }]) : setDonuts([...donuts, { id: Math.random().toString(36).substr(2, 9), title: 'Nova Rosca', mode: 'completeness', geometry: 'full', ringThickness: 12, roundedCorners: true, showCenterText: true, centerTextLabel: 'KPI', centerTextValueMeasure: '[Valor]', completenessMeasure: '[Vendas]', completenessTarget: '[Meta]', slices: [], isOpen: true, colSpan: 1, rowSpan: 1 }])} className="p-1 bg-white text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 shadow-sm transition-colors"><Plus size={16}/></button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {(activeAppTab === 'cards' ? cards : donuts).map((item, idx, arr) => (
               <div key={item.id} onClick={() => setSelectedCardId(item.id)} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                     <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                        {activeAppTab === 'cards' ? <Layout size={14}/> : <PieChart size={14}/>}
                     </div>
                     <span className="text-xs font-bold text-slate-700 truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button disabled={idx === 0} onClick={() => moveItem(idx, -1, activeAppTab)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"><ArrowUp size={14}/></button>
                      <button disabled={idx === arr.length - 1} onClick={() => moveItem(idx, 1, activeAppTab)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"><ArrowDown size={14}/></button>
                      <div className="w-px h-4 bg-slate-200 mx-0.5" />
                      <button onClick={() => activeAppTab === 'cards' ? setCards(cards.filter(c=>c.id!==item.id)) : setDonuts(donuts.filter(d=>d.id!==item.id))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
               </div>
            ))}
            {(activeAppTab === 'cards' ? cards : donuts).length === 0 && (
               <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Nenhum item na tela.
               </div>
            )}
         </div>
      </div>
      
      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; height: 4px; }
         .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
         .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Editor;