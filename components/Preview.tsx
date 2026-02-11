import React, { useState, useRef, useEffect } from 'react';
import { GlobalConfig, CardConfig, ViewportMode, DonutChartConfig, AppTab } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, BoxSelect, TrendingUp, TrendingDown } from 'lucide-react';
import { iconPaths } from '../utils/icons';

interface PreviewProps {
  global: GlobalConfig;
  cards: CardConfig[];
  donuts: DonutChartConfig[];
  activeAppTab: AppTab;
  viewport: ViewportMode | 'custom';
  customDimensions?: { width: number, height: number };
  onCardClick?: (id: string) => void;
  selectedCardId?: string | null;
}

const Preview: React.FC<PreviewProps> = ({ global, cards, donuts, activeAppTab, viewport, customDimensions, onCardClick, selectedCardId }) => {
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Atalhos de teclado para Pan (Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const resetView = () => { setScale(0.85); setOffset({ x: 0, y: 0 }); };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const primaryRgb = hexToRgb(global.primaryColor);
  const isCompact = global.cardMinHeight < 140; // Definição global do modo compacto

  // Animações e Efeitos
  let animationKeyframes = '';
  const dur = `${global.animationDuration}s`;
  if (global.animation === 'fadeInUp') {
    animationKeyframes = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  } else if (global.animation === 'popIn') {
    animationKeyframes = `@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`;
  } else if (global.animation === 'slideRight') {
    animationKeyframes = `@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`;
  }

  let hoverStyles = '';
  switch (global.hoverEffect) {
    case 'lift': hoverStyles = `transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); border-color: var(--p-primary);`; break;
    case 'scale': hoverStyles = `transform: scale(1.02); z-index: 10;`; break;
    case 'glow': hoverStyles = `box-shadow: 0 0 25px rgba(${primaryRgb}, 0.5); border-color: var(--p-primary);`; break;
    case 'border': hoverStyles = `border-color: var(--p-primary); border-width: 2px; padding: calc(var(--p-pad) - 1px);`; break;
  }

  const animationRule = global.animation !== 'none' ? `${global.animation} ${dur} cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : 'none';

  const dynamicStyles = `
    ${animationKeyframes}
    @keyframes loadBar { from { width: 0; } }
    @keyframes fillRing { to { stroke-dashoffset: var(--offset); } }

    :root {
      --p-primary: ${global.primaryColor};
      --p-bg: ${global.cardBackgroundColor};
      --p-text-title: ${global.textColorTitle};
      --p-text-val: ${global.textColorValue};
      --p-text-sub: ${global.textColorSub};
      --p-radius: ${global.borderRadius}px;
      --p-gap: ${global.gap}px;
      --p-pad: ${global.padding}px;
      --p-min-h: ${global.cardMinHeight}px;
    }

    .p-container { display: grid; grid-template-columns: repeat(${global.columns}, 1fr); gap: var(--p-gap); padding: 10px; width: 100%; height: 100%; box-sizing: border-box; }
    
    /* === ESTILO UNIFICADO DO CARD === */
    .p-card { 
      background: var(--p-bg); 
      border-radius: var(--p-radius); 
      padding: var(--p-pad); 
      min-height: var(--p-min-h); 
      border: 1px solid rgba(0,0,0,0.08); 
      display: flex; flex-direction: column; 
      transition: all 0.25s; 
      position: relative; overflow: hidden; 
      opacity: ${global.animation !== 'none' ? 0 : 1};
      animation: ${animationRule};
    }
    .p-card:hover { ${hoverStyles} }
    .p-card.selected { border-color: var(--p-primary); box-shadow: 0 0 0 4px rgba(${primaryRgb}, 0.2); }
    
    /* Barra lateral padrão */
    .p-card::before { content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 4px; background: var(--p-primary); border-radius: 0 4px 4px 0; }
    
    /* === MODO COMPACTO (OVERRIDE) === */
    .p-card.compact {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px;
        padding-right: 12px;
    }
    .p-card.compact::before { top: 15%; bottom: 15%; display: block; }
    
    /* ELEMENTOS INTERNOS */
    .p-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; width: 100%; }
    .p-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-height: 0; }
    .p-footer { margin-top: auto; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(0,0,0,0.03); }
    
    .p-card.compact .p-footer { margin-top: 0; padding-top: 0; border-top: none; align-items: flex-end; justify-content: center; }

    .p-row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--p-text-sub); }
    .p-badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.04); display: flex; align-items: center; gap: 3px; }
    
    .p-track { width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .p-fill { height: 100%; background: var(--p-primary); border-radius: 10px; width: 0; animation: loadBar 1s ease-out forwards; }
    
    .ring-box { position: relative; width: 48px; height: 48px; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-bg { fill: none; stroke: rgba(0,0,0,0.05); stroke-width: 5; }
    .ring-val { fill: none; stroke: var(--p-primary); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 126; stroke-dashoffset: 126; animation: fillRing 1.2s ease-out forwards; }

    /* DONUT STYLES */
    .donut-ring { fill: transparent; stroke: #f3f4f6; transition: stroke-dasharray 0.5s ease; }
    .donut-segment { fill: transparent; transition: stroke-dasharray 0.5s ease; }
  `;

  const simWidth = viewport === 'custom' && customDimensions ? customDimensions.width : viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : 1000;
  const simHeight = viewport === 'custom' && customDimensions ? customDimensions.height : 600;

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#0f0f11] overflow-hidden relative ${isPanning || isSpacePressed ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={(e) => { if (isSpacePressed || e.button === 1) { setIsPanning(true); lastMousePos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); } }}
      onMouseMove={(e) => { if (isPanning) { setOffset(prev => ({ x: prev.x + (e.clientX - lastMousePos.current.x), y: prev.y + (e.clientY - lastMousePos.current.y) })); lastMousePos.current = { x: e.clientX, y: e.clientY }; } }}
      onMouseUp={() => setIsPanning(false)}
      onWheel={(e) => { if (e.ctrlKey || e.altKey) { e.preventDefault(); setScale(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.05), 5)); } }}
    >
        <style>{dynamicStyles}</style>
        
        {/* UI TOOLBARS */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-xl text-white/90 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10">
                <BoxSelect size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Preview: <span className="text-indigo-300">{simWidth}x{simHeight}</span></span>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[10px] font-bold opacity-50">{Math.round(scale * 100)}%</span>
            </div>
        </div>

        <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
           <div className="flex flex-col bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
             <button onClick={() => setScale(prev => Math.min(prev + 0.1, 5))} className="p-3 text-white/60 hover:text-white"><ZoomIn size={20}/></button>
             <button onClick={() => setScale(prev => Math.max(prev - 0.1, 0.05))} className="p-3 text-white/60 hover:text-white"><ZoomOut size={20}/></button>
             <div className="h-px bg-white/5 mx-2 my-1" />
             <button onClick={resetView} className="p-3 text-indigo-400 hover:text-indigo-300"><RotateCcw size={20}/></button>
           </div>
        </div>

        {/* WORLD */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, pointerEvents: isPanning ? 'none' : 'auto' }}
        >
          <div 
            className="bg-[#161618] rounded-sm relative border border-white/10 shadow-2xl transition-all duration-300"
            style={{ width: simWidth, height: simHeight, minWidth: simWidth, minHeight: simHeight }}
          >
            <div className="p-container">
              {activeAppTab === 'cards' ? cards.map((card, idx) => {
                const baseFTitle = card.fontSizeTitle || global.fontSizeTitle;
                const baseFValue = card.fontSizeValue || global.fontSizeValue;
                const fSub = card.fontSizeSub || global.fontSizeSub;

                // Ajuste fino de fonte para modo compacto
                const fTitle = isCompact ? Math.min(baseFTitle, 10) : baseFTitle;
                const fValue = isCompact ? Math.min(baseFValue, 26) : baseFValue;

                // --- MODO COMPACTO (HORIZONTAL) ---
                if (isCompact) {
                   return (
                    <div key={card.id} className={`p-card compact ${selectedCardId === card.id ? 'selected' : ''}`} 
                         style={{ animationDelay: `${idx * 0.1}s` } as any}
                         onClick={() => onCardClick?.(card.id)}>
                      
                      {/* Adicionei margem na esquerda para não colar na barra colorida */}
                      <div className="flex flex-col justify-center z-10" style={{ maxWidth: '60%', marginLeft: '8px' }}>
                        
                        {/* NOVO BLOCO COM ÍCONE + TÍTULO */}
                        <div className="flex items-center gap-2 mb-0.5">
                           <div className="text-gray-400 opacity-80">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                           </div>
                           <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                             {card.title}
                           </span>
                        </div>
                        
                        <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, lineHeight: 1, whiteSpace: 'nowrap' }}>
                          {card.value}
                        </div>
                      </div>
    
                      {/* Direita: Comparativos */}
                      <div className="flex flex-col items-end justify-center gap-1 z-10 h-full">
                         {card.comparisons.map((comp) => (
                            <div key={comp.id} className="flex items-center gap-2" style={{ fontSize: `${fSub}px`, fontWeight: 600, color: global.textColorSub }}>
                               <span className="hidden sm:inline">{comp.label}</span>
                               {comp.trend !== 'none' && (
                                 <span className="p-badge" style={{ color: comp.trend === 'up' ? global.positiveColor : global.negativeColor }}>
                                   {comp.trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {comp.value}
                                 </span>
                               )}
                            </div>
                         ))}
                      </div>
    
                      {/* Ícone Marca d'água (Fundo) */}
                      <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none" style={{ color: global.textColorValue }}>
                          <svg viewBox="0 0 24 24" width="90" height="90" fill="currentColor"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                      </div>
    
                      {/* Barra de Progresso no Rodapé */}
                      {card.type === 'progress' && (
                         <div className="absolute bottom-0 left-0 h-1 transition-all duration-1000" style={{ width: `${card.progressValue}%`, backgroundColor: global.primaryColor }} />
                      )}
                    </div>
                   );
                }
    
                // --- MODO PADRÃO (VERTICAL) ---
                return (
                <div key={card.id} className={`p-card ${selectedCardId === card.id ? 'selected' : ''}`} 
                     style={{ animationDelay: `${idx * 0.1}s` } as any}
                     onClick={() => onCardClick?.(card.id)}>
                  
                  <div className="p-header">
                    <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{card.title}</span>
                    {card.type === 'ring' ? (
                       <div className="ring-box">
                          <svg viewBox="0 0 50 50" className="ring-svg">
                            <circle className="ring-bg" cx="25" cy="25" r="20" />
                            <circle className="ring-val" cx="25" cy="25" r="20" style={{"--offset": 126 - (126 * Math.min(1, Math.max(0, card.progressValue / 100)))} as any} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{color: global.textColorValue}}>{card.progressValue}%</div>
                       </div>
                    ) : (
                       <div className="text-gray-400 opacity-70 transition-transform hover:scale-110">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                       </div>
                    )}
                  </div>
    
                  <div className="p-body">
                     <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, letterSpacing: '-0.5px' }}>{card.value}</div>
                     {card.type === 'progress' && <div className="p-track"><div className="p-fill" style={{ width: `${card.progressValue}%` }} /></div>}
                  </div>
    
                  <div className="p-footer">
                    {card.comparisons.map((comp) => (
                       <div key={comp.id} className="p-row" style={{ fontSize: `${fSub}px` }}>
                          <span>{comp.label}</span>
                          {comp.trend !== 'none' && (
                            <span className="p-badge" style={{ color: comp.trend === 'up' ? global.positiveColor : global.negativeColor }}>
                              {comp.trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {comp.value}
                            </span>
                          )}
                       </div>
                    ))}
                  </div>
                </div>
              )}) : donuts.map((donut, idx) => {
                 // --- RENDERIZAÇÃO DE DONUTS (Mantida igual) ---
                const isSemi = donut.geometry === 'semicircle';
                const radius = 40;
                const circ = 2 * Math.PI * radius;
                const isSelected = selectedCardId === donut.id;
                const align = donut.textAlign || global.textAlign || 'left';
                const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
                const rotation = isSemi ? -180 : -90;
                const circumferenceDivisor = isSemi ? 2 : 1;

                return (
                  <div key={donut.id} className={`p-card ${isSelected ? 'selected' : ''}`} style={{ background: donut.cardBackgroundColor || global.cardBackgroundColor, animationDelay: `${idx * 0.1}s` } as any} onClick={() => onCardClick?.(donut.id)}>
                    <div className="mb-4 flex" style={{ justifyContent: flexAlign }}>
                       <span style={{ fontSize: `${donut.fontSizeTitle || global.fontSizeTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{donut.title}</span>
                    </div>
                    <div className="flex-1 relative flex justify-center p-2" style={{ alignItems: isSemi ? 'flex-end' : 'center' }}>
                       <svg viewBox="0 0 100 100" className="w-full h-full" style={{ maxHeight: isSemi ? '60%' : '100%', overflow: 'visible' }}>
                          <circle cx="50" cy="50" r={radius} className="donut-ring" strokeWidth={donut.ringThickness} strokeDasharray={isSemi ? `${circ/2} ${circ}` : '0 0'} transform={`rotate(${rotation} 50 50)`} />
                          {donut.mode === 'completeness' ? (
                             <circle 
                               cx="50" cy="50" r={radius} 
                               className="donut-segment" 
                               stroke={donut.accentColor || global.primaryColor} 
                               strokeWidth={donut.ringThickness} 
                               strokeDasharray={`${(75/100) * (circ/circumferenceDivisor)} ${circ}`} 
                               strokeDashoffset="0"
                               strokeLinecap={donut.roundedCorners ? 'round' : 'butt'}
                               transform={`rotate(${rotation} 50 50)`}
                             />
                          ) : (
                             donut.slices.reduce((acc: React.ReactNode[], slice, i) => {
                                const val = parseFloat(slice.value) || 0;
                                const currentOffset = donut.slices.slice(0, i).reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
                                acc.push(
                                  <circle 
                                    key={slice.id} cx="50" cy="50" r={radius} 
                                    className="donut-segment" 
                                    stroke={slice.color} 
                                    strokeWidth={donut.ringThickness} 
                                    strokeDasharray={`${(val/100) * (circ/circumferenceDivisor)} ${circ}`} 
                                    strokeDashoffset={`${-(currentOffset/100) * (circ/circumferenceDivisor)}`}
                                    strokeLinecap={donut.roundedCorners ? 'round' : 'butt'}
                                    transform={`rotate(${rotation} 50 50)`}
                                  />
                                );
                                return acc;
                             }, [])
                          )}
                       </svg>
                       {donut.showCenterText && (
                          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: isSemi ? '65%' : '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                             <div className="text-[8px] font-black uppercase text-gray-400 leading-none">{donut.centerTextLabel}</div>
                             <div className="text-sm font-black text-gray-700 leading-none mt-1">75%</div>
                          </div>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Preview;