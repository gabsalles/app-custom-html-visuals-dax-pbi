import React, { useState } from 'react';
import { CardConfig, GlobalConfig, CardType, HoverEffect, ComparisonConfig, TrendDirection, FormatType } from '../types';
import { Trash2, Plus, BarChart, PieChart, Square, Type, Palette, Layout, Settings, ChevronDown, ChevronRight, MousePointer2, Play, PlusCircle, X, Hash, Binary } from 'lucide-react';
import { iconPaths } from '../utils/icons';

interface EditorProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  cards: CardConfig[];
  setCards: React.Dispatch<React.SetStateAction<CardConfig[]>>;
}

const Editor: React.FC<EditorProps> = ({ globalConfig, setGlobalConfig, cards, setCards }) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'style' | 'colors' | 'interactive'>('layout');

  const updateCard = (id: string, field: keyof CardConfig, value: any) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addComparison = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const newComp: ComparisonConfig = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Novo Comp',
      value: '0%',
      trend: 'up',
      logic: 'TRUE()'
    };
    updateCard(cardId, 'comparisons', [...card.comparisons, newComp]);
  };

  const removeComparison = (cardId: string, compId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    updateCard(cardId, 'comparisons', card.comparisons.filter(cp => cp.id !== compId));
  };

  const updateComparison = (cardId: string, compId: string, field: keyof ComparisonConfig, value: any) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const newComps = card.comparisons.map(cp => cp.id === compId ? { ...cp, [field]: value } : cp);
    updateCard(cardId, 'comparisons', newComps);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex border-b">
        {[
          { id: 'layout', icon: Layout, label: 'Layout' },
          { id: 'style', icon: Type, label: 'Fontes' },
          { id: 'colors', icon: Palette, label: 'Cores' },
          { id: 'interactive', icon: MousePointer2, label: 'Ação' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="bg-white rounded-xl space-y-4">
          {activeTab === 'layout' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Colunas"><input type="number" value={globalConfig.columns} onChange={(e) => setGlobalConfig({...globalConfig, columns: +e.target.value})} className="input-field"/></Field>
              <Field label="Espaço (px)"><input type="number" value={globalConfig.gap} onChange={(e) => setGlobalConfig({...globalConfig, gap: +e.target.value})} className="input-field"/></Field>
              <Field label="Altura Min"><input type="number" value={globalConfig.cardMinHeight} onChange={(e) => setGlobalConfig({...globalConfig, cardMinHeight: +e.target.value})} className="input-field"/></Field>
              <Field label="Padding"><input type="number" value={globalConfig.padding} onChange={(e) => setGlobalConfig({...globalConfig, padding: +e.target.value})} className="input-field"/></Field>
              <Field label="Bordas"><input type="number" value={globalConfig.borderRadius} onChange={(e) => setGlobalConfig({...globalConfig, borderRadius: +e.target.value})} className="input-field"/></Field>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tamanho Titulo"><input type="number" value={globalConfig.fontSizeTitle} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeTitle: +e.target.value})} className="input-field"/></Field>
                <Field label="Peso Titulo"><select value={globalConfig.fontWeightTitle} onChange={(e) => setGlobalConfig({...globalConfig, fontWeightTitle: +e.target.value})} className="input-field"><option value={400}>Regular</option><option value={700}>Bold</option></select></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tamanho Valor"><input type="number" value={globalConfig.fontSizeValue} onChange={(e) => setGlobalConfig({...globalConfig, fontSizeValue: +e.target.value})} className="input-field"/></Field>
                <Field label="Peso Valor"><select value={globalConfig.fontWeightValue} onChange={(e) => setGlobalConfig({...globalConfig, fontWeightValue: +e.target.value})} className="input-field"><option value={400}>Regular</option><option value={800}>Extra Bold</option></select></Field>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><ColorPicker label="Fundo" value={globalConfig.cardBackgroundColor} onChange={(v) => setGlobalConfig({...globalConfig, cardBackgroundColor: v})}/><ColorPicker label="Destaque" value={globalConfig.primaryColor} onChange={(v) => setGlobalConfig({...globalConfig, primaryColor: v})}/></div>
              <div className="grid grid-cols-3 gap-2 border-t pt-3"><ColorPicker label="Título" value={globalConfig.textColorTitle} onChange={(v) => setGlobalConfig({...globalConfig, textColorTitle: v})}/><ColorPicker label="Valor" value={globalConfig.textColorValue} onChange={(v) => setGlobalConfig({...globalConfig, textColorValue: v})}/><ColorPicker label="Sub" value={globalConfig.textColorSub} onChange={(v) => setGlobalConfig({...globalConfig, textColorSub: v})}/></div>
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="space-y-5">
              <Field label="Efeito Hover">
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['none', 'lift', 'scale', 'glow', 'border'].map(eff => (
                    <button key={eff} onClick={() => setGlobalConfig({...globalConfig, hoverEffect: eff as HoverEffect})} className={`py-2 rounded text-[9px] font-bold uppercase border transition-all ${globalConfig.hoverEffect === eff ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{eff}</button>
                  ))}
                </div>
              </Field>
              <Field label="Animação Entrada">
                <select value={globalConfig.animation} onChange={(e) => setGlobalConfig({...globalConfig, animation: e.target.value as any})} className="input-field mt-1"><option value="none">Nenhuma</option><option value="fadeInUp">Fade Up</option><option value="popIn">Pop In</option><option value="slideRight">Slide Right</option></select>
              </Field>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-3 border-t">
          <div className="flex justify-between items-center"><h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Cards de Dados</h3><button onClick={() => setCards([...cards, { id: Math.random().toString(36).substr(2, 9), title: 'Métrica', measurePlaceholder: '[Valor]', formatType: 'integer', decimalPlaces: 0, type: 'simple', targetMeasurePlaceholder: '1', value: '0', progressValue: 50, icon: 'chart', comparisons: [], isOpen: true }])} className="p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Plus size={16}/></button></div>

          {cards.map((card, idx) => (
            <div key={card.id} className="bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:border-indigo-200">
              <div className="flex justify-between items-center p-3 cursor-pointer bg-gray-50/50" onClick={() => setCards(cards.map(c => c.id === card.id ? {...c, isOpen: !c.isOpen} : {...c, isOpen: false}))}>
                <div className="flex items-center gap-2">{card.isOpen ? <ChevronDown size={14} className="text-indigo-500"/> : <ChevronRight size={14} className="text-gray-400"/>}<span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{card.title || 'Novo Card'}</span></div>
                <button onClick={(e) => { e.stopPropagation(); setCards(cards.filter(c => c.id !== card.id)); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
              </div>

              {card.isOpen && (
                <div className="p-4 border-t space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Título"><input type="text" value={card.title} onChange={(e) => updateCard(card.id, 'title', e.target.value)} className="input-field"/></Field>
                    <Field label="Visual"><select value={card.type} onChange={(e) => updateCard(card.id, 'type', e.target.value)} className="input-field"><option value="simple">Simples</option><option value="progress">Barra</option><option value="ring">Anel</option></select></Field>
                  </div>
                  
                  {/* SEÇÃO DE DADOS EM DESTAQUE */}
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Binary size={14} className="text-indigo-600"/>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Inteligência de Dados</span>
                     </div>
                     <Field label="Medida DAX (Nome da Medida)">
                        <input 
                           type="text" 
                           value={card.measurePlaceholder} 
                           onChange={(e) => updateCard(card.id, 'measurePlaceholder', e.target.value)} 
                           className="input-field font-mono text-[10px] bg-white border-indigo-200 text-indigo-700"
                           placeholder="Ex: [Total Vendas]"
                        />
                     </Field>
                     <div className="grid grid-cols-2 gap-3">
                        <Field label="Formatação">
                            <select 
                                value={card.formatType} 
                                onChange={(e) => updateCard(card.id, 'formatType', e.target.value as FormatType)} 
                                className="input-field bg-white text-[11px] font-bold"
                            >
                                <option value="none">Nenhuma</option>
                                <option value="integer">Inteiro (1.000)</option>
                                <option value="decimal">Decimal (1.000,00)</option>
                                <option value="currency">Moeda (R$)</option>
                                <option value="percent">Porcentagem (%)</option>
                                <option value="short">Compacto (K/M)</option>
                            </select>
                        </Field>
                        <Field label="Decimais">
                            <input 
                                type="number" 
                                min="0" 
                                max="4" 
                                value={card.decimalPlaces} 
                                onChange={(e) => updateCard(card.id, 'decimalPlaces', +e.target.value)} 
                                className="input-field bg-white"
                            />
                        </Field>
                     </div>
                     <div className="border-t border-gray-200 pt-3 mt-1">
                        <Field label="Valor Preview (Somente para visualização)">
                            <input 
                            type="text" 
                            value={card.value} 
                            onChange={(e) => updateCard(card.id, 'value', e.target.value)} 
                            className="input-field bg-white border-gray-200 text-gray-500 font-bold"
                            placeholder="Ex: R$ 1.500"
                            />
                        </Field>
                     </div>
                     {card.type !== 'simple' && (
                       <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3">
                          <Field label="Progresso Preview %">
                             <input type="number" value={card.progressValue} onChange={(e) => updateCard(card.id, 'progressValue', +e.target.value)} className="input-field bg-white"/>
                          </Field>
                          <Field label="Medida Alvo (DAX)">
                             <input type="text" value={card.targetMeasurePlaceholder} onChange={(e) => updateCard(card.id, 'targetMeasurePlaceholder', e.target.value)} className="input-field bg-white font-mono text-[10px]"/>
                          </Field>
                       </div>
                     )}
                  </div>

                  {/* TIPOGRAFIA LOCAL */}
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Tipografia (Local Override)</label>
                    <div className="grid grid-cols-3 gap-2">
                       <Field label="Título"><input type="number" placeholder="Global" value={card.fontSizeTitle || ''} onChange={(e) => updateCard(card.id, 'fontSizeTitle', e.target.value ? +e.target.value : undefined)} className="input-field"/></Field>
                       <Field label="Valor"><input type="number" placeholder="Global" value={card.fontSizeValue || ''} onChange={(e) => updateCard(card.id, 'fontSizeValue', e.target.value ? +e.target.value : undefined)} className="input-field"/></Field>
                       <Field label="Sub"><input type="number" placeholder="Global" value={card.fontSizeSub || ''} onChange={(e) => updateCard(card.id, 'fontSizeSub', e.target.value ? +e.target.value : undefined)} className="input-field"/></Field>
                    </div>
                  </div>

                  {/* SELETOR DE ÍCONES EXPANDIDO */}
                  {card.type !== 'ring' && (
                    <Field label="Escolher Ícone">
                      <div className="grid grid-cols-6 gap-2 mt-2 p-3 bg-white rounded-lg border max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                        {Object.keys(iconPaths).map(icon => (
                          <button 
                            key={icon} 
                            onClick={() => updateCard(card.id, 'icon', icon)} 
                            className={`p-2 rounded-lg transition-all border flex items-center justify-center ${card.icon === icon ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-indigo-300 hover:bg-white'}`}
                            title={icon}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconPaths[icon]}/></svg>
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}

                  {/* COMPARATIVOS MÚLTIPLOS */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Comparativos</label>
                       <button onClick={() => addComparison(card.id)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold"><PlusCircle size={12}/> ADICIONAR NOVO</button>
                    </div>
                    {card.comparisons.map((comp) => (
                      <div key={comp.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group transition-all hover:bg-white hover:shadow-md">
                        <button onClick={() => removeComparison(card.id, comp.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"><X size={12}/></button>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                           <Field label="Rótulo"><input type="text" value={comp.label} onChange={(e) => updateComparison(card.id, comp.id, 'label', e.target.value)} className="input-field bg-white" placeholder="Ex: vs Mês Ant."/></Field>
                           <Field label="Valor Preview"><input type="text" value={comp.value} onChange={(e) => updateComparison(card.id, comp.id, 'value', e.target.value)} className="input-field bg-white font-bold" placeholder="Ex: +15%"/></Field>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <Field label="Ícone">
                              <select value={comp.trend} onChange={(e) => updateComparison(card.id, comp.id, 'trend', e.target.value as TrendDirection)} className="input-field bg-white text-[10px] font-bold">
                                 <option value="up">▲ Positivo</option>
                                 <option value="down">▼ Negativo</option>
                                 <option value="none">Nenhum</option>
                              </select>
                           </Field>
                           <div className="col-span-2">
                              <Field label="Fórmula Lógica (DAX)">
                                 <input type="text" value={comp.logic} onChange={(e) => updateComparison(card.id, comp.id, 'logic', e.target.value)} className="input-field bg-white font-mono text-[9px]" placeholder="Ex: [Vendas] > [Meta]"/>
                              </Field>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
         .input-field { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; outline: none; transition: all 0.2s; }
         .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }: any) => <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block pl-1">{label}</label>{children}</div>;
const ColorPicker = ({ label, value, onChange }: any) => (
  <Field label={label}><div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border transition-all hover:border-gray-300"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shadow-sm"/><input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-[11px] font-mono outline-none uppercase font-bold text-gray-600"/></div></Field>
);

export default Editor;