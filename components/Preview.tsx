import React, { useState, useRef, useEffect } from 'react';
import { GlobalConfig, CardConfig, ViewportMode, DonutChartConfig, AppTab } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, BoxSelect, TrendingUp, TrendingDown, GripHorizontal } from 'lucide-react';
import { iconPaths } from '../utils/icons';

interface PreviewProps {
  global: GlobalConfig;
  cards: CardConfig[];
  donuts: DonutChartConfig[];
  activeAppTab: AppTab;
  viewport: ViewportMode | 'custom';
  customDimensions?: { width: number, height: number };
  setCustomDimensions?: (dim: { width: number, height: number }) => void;
  onCardClick?: (id: string) => void;
  selectedCardId?: string | null;
}

// Tipos de redimensionamento
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const Preview: React.FC<PreviewProps> = ({ 
  global, cards, donuts, activeAppTab, viewport, 
  customDimensions, setCustomDimensions, 
  onCardClick, selectedCardId 
}) => {
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Estado para Resize expandido
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startDim = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const resetView = () => { setScale(0.85); setOffset({ x: 0, y: 0 }); };

  // Handler de Mouse Unificado
  const handleMouseDown = (e: React.MouseEvent, type: 'pan' | ResizeHandle) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      if (type === 'pan') {
          if (isSpacePressed || e.button === 1 || e.button === 0) {
             setIsPanning(true);
             e.preventDefault();
          }
      } else {
          if (customDimensions) {
              startDim.current = { w: customDimensions.width, h: customDimensions.height };
              setIsResizing(type);
              e.stopPropagation();
              e.preventDefault();
          }
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      if (isPanning) {
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else if (isResizing && setCustomDimensions && customDimensions) {
          const scaledDx = dx / scale;
          const scaledDy = dy / scale;

          let newW = startDim.current.w;
          let newH = startDim.current.h;
          let offX = 0;
          let offY = 0;

          if (isResizing.includes('e')) { // Direita (East)
             newW += scaledDx;
             offX = scaledDx / 2;
          } else if (isResizing.includes('w')) { // Esquerda (West)
             newW -= scaledDx;
             offX = scaledDx / 2; 
          }

          if (isResizing.includes('s')) { // Baixo (South)
             newH += scaledDy;
             offY = scaledDy / 2;
          } else if (isResizing.includes('n')) { // Cima (North)
             newH -= scaledDy;
             offY = scaledDy / 2;
          }

          const finalW = Math.max(100, Math.round(newW));
          const finalH = Math.max(100, Math.round(newH));
          
          setCustomDimensions({ width: finalW, height: finalH });
          startDim.current = { w: finalW, h: finalH };
          
          setOffset(prev => ({ x: prev.x + offX, y: prev.y + offY }));
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      setIsResizing(null);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const primaryRgb = hexToRgb(global.primaryColor);

  let animationKeyframes = '';
  if (global.animation === 'fadeInUp') {
    animationKeyframes = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  } else if (global.animation === 'popIn') {
    animationKeyframes = `@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`;
  } else if (global.animation === 'slideRight') {
    animationKeyframes = `@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`;
  }

  let hoverStyles = '';
  switch (global.hoverEffect) {
    case 'lift': 
      hoverStyles = `
        transform: translateY(-6px) !important; 
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease !important;
        box-shadow: 0 15px 30px rgba(0,0,0,0.15); 
        border-color: var(--p-primary);
      `; 
      break;
    case 'scale': 
      hoverStyles = `
        transform: scale(1.02) !important; 
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
        z-index: 10;
      `; 
      break;
    case 'glow': hoverStyles = `box-shadow: 0 0 25px rgba(${primaryRgb}, 0.5) !important; border-color: var(--p-primary);`; break;
    case 'border': hoverStyles = `border-color: var(--p-primary) !important; border-width: 2px; padding: calc(var(--p-pad) - 1px);`; break;
  }

  const animationRule = global.animation !== 'none' ? `${global.animation} ${global.animationDuration}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : 'none';

  const dynamicStyles = `
    ${animationKeyframes}
    @keyframes loadBar { from { width: 0; } }
    @keyframes fillRing { to { stroke-dashoffset: var(--offset); } }
    :root { --p-primary: ${global.primaryColor}; --p-bg: ${global.cardBackgroundColor}; --p-text-title: ${global.textColorTitle}; --p-text-val: ${global.textColorValue}; --p-text-sub: ${global.textColorSub}; --p-radius: ${global.borderRadius}px; --p-gap: ${global.gap}px; --p-pad: ${global.padding}px; --p-min-h: ${global.cardMinHeight}px; --p-badge-size: ${global.fontSizeBadge || 10}px;}
    
    .p-container { 
        display: grid; 
        grid-template-columns: repeat(${global.columns}, 1fr); 
        grid-auto-rows: 1fr; /* Responsividade Vertical - Linhas esticam */
        gap: var(--p-gap); 
        padding: 10px; 
        width: 100%; height: 100%; box-sizing: border-box; 
    }
    
    .p-card { 
        background: var(--p-bg); 
        border-radius: var(--p-radius); 
        padding: var(--p-pad); 
        min-height: var(--p-min-h); 
        border: 1px solid rgba(0,0,0,0.08); 
        display: flex; 
        flex-direction: column; 
        transition: all 0.25s; 
        position: relative; 
        overflow: hidden; 
        opacity: ${global.animation !== 'none' ? 0 : 1}; 
        animation: ${animationRule}; 
    }
    
    .p-card:hover { ${hoverStyles} }
    .p-card.selected { border-color: var(--p-primary); box-shadow: 0 0 0 4px rgba(${primaryRgb}, 0.2); }
    .p-card::before { content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 4px; background: var(--p-primary); border-radius: 0 4px 4px 0; }
    .p-card.compact { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px; padding-right: 12px; }
    .p-card.compact::before { top: 15%; bottom: 15%; display: block; }
    
    /* Cabeçalho e Rodapé com Flex-Shrink 0 para não encolherem */
    .p-header { display: flex; align-items: center; margin-bottom: 4px; width: 100%; gap: 8px; flex-shrink: 0; }
    .p-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-height: 0; }
    .p-footer { margin-top: auto; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(0,0,0,0.03); flex-shrink: 0; }
    
    .p-card.compact .p-footer { margin-top: 0; padding-top: 0; border-top: none; align-items: flex-end; justify-content: center; }
    .p-row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--p-text-sub); }
    .p-badge { font-size: var(--p-badge-size); font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.04); display: flex; align-items: center; gap: 3px; }
    .p-track { width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .p-fill { height: 100%; background: var(--p-primary); border-radius: 10px; width: 0; animation: loadBar 1s ease-out forwards; }
    .ring-box { position: relative; width: 48px; height: 48px; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-val { fill: none; stroke: var(--p-primary); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 126; stroke-dashoffset: 126; animation: fillRing 1.2s ease-out forwards; }
    .donut-ring { fill: transparent; stroke: #f3f4f6; transition: stroke-dasharray 0.5s ease; }
    .donut-segment { fill: transparent; transition: stroke-dasharray 0.5s ease; }
  `;

  const simWidth = viewport === 'custom' && customDimensions ? customDimensions.width : viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : 1000;
  const simHeight = viewport === 'custom' && customDimensions ? customDimensions.height : 600;

  const Handle = ({ dir, className, children }: { dir: ResizeHandle, className: string, children?: React.ReactNode }) => (
    <div 
        onMouseDown={(e) => handleMouseDown(e, dir)}
        className={`absolute z-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group ${className}`}
    >
        {children || <div className="bg-indigo-500 rounded-full shadow-lg" style={{ width: '100%', height: '100%' }} />}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#0f0f11] overflow-hidden relative select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={(e) => handleMouseDown(e, 'pan')}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => { if (e.ctrlKey || e.altKey) { e.preventDefault(); setScale(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.05), 5)); } }}
    >
        <style>{dynamicStyles}</style>
        
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

        <div 
          className="absolute inset-0 flex items-center justify-center origin-center"
          style={{ 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, 
              transition: isPanning || isResizing ? 'none' : 'transform 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)' 
          }}
        >
          <div 
            className="rounded-sm relative border border-white/10 shadow-2xl transition-colors"
            style={{ 
              backgroundColor: global.canvasBackgroundColor || '#f3f4f6', // <-- APLICA A COR AQUI
              width: simWidth, height: simHeight, minWidth: simWidth, minHeight: simHeight 
            }}
          >
            {viewport === 'custom' && (
                <>
                    <Handle dir="n" className="top-0 left-0 right-0 h-4 -mt-2 cursor-ns-resize"><div className="w-12 h-1.5 bg-indigo-500 rounded-full" /></Handle>
                    <Handle dir="s" className="bottom-0 left-0 right-0 h-4 -mb-2 cursor-ns-resize"><div className="w-12 h-1.5 bg-indigo-500 rounded-full" /></Handle>
                    <Handle dir="e" className="right-0 top-0 bottom-0 w-4 -mr-2 cursor-ew-resize"><div className="h-12 w-1.5 bg-indigo-500 rounded-full" /></Handle>
                    <Handle dir="w" className="left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize"><div className="h-12 w-1.5 bg-indigo-500 rounded-full" /></Handle>
                    <Handle dir="nw" className="-top-3 -left-3 w-8 h-8 cursor-nwse-resize text-indigo-500"><GripHorizontal size={20} className="drop-shadow-lg rotate-90" /></Handle>
                    <Handle dir="ne" className="-top-3 -right-3 w-8 h-8 cursor-nesw-resize text-indigo-500"><GripHorizontal size={20} className="drop-shadow-lg rotate-90" /></Handle>
                    <Handle dir="sw" className="-bottom-3 -left-3 w-8 h-8 cursor-nesw-resize text-indigo-500"><GripHorizontal size={20} className="drop-shadow-lg" /></Handle>
                    <Handle dir="se" className="-bottom-3 -right-3 w-8 h-8 cursor-nwse-resize text-indigo-500"><GripHorizontal size={20} className="drop-shadow-lg" /></Handle>
                    <div className="absolute inset-0 border-2 border-indigo-500/0 hover:border-indigo-500/30 transition-colors pointer-events-none" />
                </>
            )}

            <div className="p-container">
              {activeAppTab === 'cards' ? cards.map((card, idx) => {
                const isCompact = global.cardMinHeight < 140;
                const baseFTitle = card.fontSizeTitle || global.fontSizeTitle;
                const baseFValue = card.fontSizeValue || global.fontSizeValue;
                const fSub = card.fontSizeSub || global.fontSizeSub;
                const fTitle = isCompact ? Math.min(baseFTitle, 10) : baseFTitle;
                const fValue = isCompact ? Math.min(baseFValue, 26) : baseFValue;
                
                const iconColor = card.iconColor || card.accentColor || global.primaryColor;
                const iconSize = card.iconSize || 40;
                const iconBg = card.iconBackgroundColor || 'transparent';
                const iconPadding = card.iconPadding || 8;
                const iconRounded = card.iconRounded ? '50%' : '8px';
                const iconPosition = card.iconPosition || 'top';
                const align = card.textAlign || global.textAlign || 'left';

                const IconElement = (
                  <div style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    padding: `${iconPadding}px`,
                    backgroundColor: iconBg,
                    borderRadius: iconRounded,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                  </div>
                );

                const gridStyle = {
                    gridColumn: `span ${card.colSpan || 1}`,
                    gridRow: `span ${card.rowSpan || 1}`
                };

                if (isCompact) {
                   return (
                    <div key={card.id} className={`p-card compact ${selectedCardId === card.id ? 'selected' : ''}`} 
                        style={{ 
                            animationDelay: `${idx * 0.1}s`, 
                            '--p-bg': card.cardBackgroundColor || global.cardBackgroundColor,
                            '--p-primary': card.accentColor || global.primaryColor,
                            ...gridStyle 
                        } as any}
                        onClick={(e) => { e.stopPropagation(); onCardClick?.(card.id); }}>
                      
                      <div className="flex flex-col justify-center z-10" style={{ maxWidth: '60%', marginLeft: '8px' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                           <div style={{ color: iconColor, width: '14px', height: '14px', display: 'flex' }}>
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
    
                      <div className="flex flex-col items-end justify-center gap-1 z-10 h-full">
                         {card.comparisons.map((comp) => {
                            let badgeColor = global.neutralColor;
                            if (comp.trend === 'up') {
                                badgeColor = comp.invertColor ? global.negativeColor : global.positiveColor;
                            } else if (comp.trend === 'down') {
                                badgeColor = comp.invertColor ? global.positiveColor : global.negativeColor;
                            }
                            return (
                                <div key={comp.id} className="flex items-center gap-2" style={{ fontSize: `${fSub}px`, fontWeight: 600, color: global.textColorSub }}>
                                   <span className="hidden sm:inline">{comp.label}</span>
                                   {comp.trend !== 'none' && (
                                     <span className="p-badge" style={{ color: badgeColor }}>
                                       {comp.trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {comp.value}
                                     </span>
                                   )}
                                </div>
                            );
                         })}
                      </div>
                      
                      {card.type === 'progress' && (
                         <div className="absolute bottom-0 left-0 h-1 transition-all duration-1000" style={{ width: `${card.progressValue}%`, backgroundColor: global.primaryColor }} />
                      )}
                    </div>
                   );
                }
    
                let headerContent;
                let headerStyle: React.CSSProperties = {};

                if (iconPosition === 'top') {
                    headerStyle = { flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', justifyContent: 'center' };
                    headerContent = (
                      <>
                        {card.type === 'ring' ? renderRing(card, global) : IconElement}
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle, marginTop: '4px' }} className="uppercase tracking-widest">{card.title}</span>
                      </>
                    );
                } else if (iconPosition === 'right') {
                    headerStyle = { justifyContent: 'space-between' };
                    headerContent = (
                      <>
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{card.title}</span>
                        {card.type === 'ring' ? renderRing(card, global) : IconElement}
                      </>
                    );
                } else {
                    headerStyle = { justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' };
                    headerContent = (
                      <>
                        {card.type !== 'ring' && IconElement}
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{card.title}</span>
                      </>
                    );
                }

                return (
                <div key={card.id} className={`p-card ${selectedCardId === card.id ? 'selected' : ''}`} 
                  style={{ 
                      animationDelay: `${idx * 0.1}s`, 
                      '--p-bg': card.cardBackgroundColor || global.cardBackgroundColor, 
                      '--p-primary': card.accentColor || global.primaryColor,
                      ...gridStyle 
                  } as any}
                  onClick={(e) => { e.stopPropagation(); onCardClick?.(card.id); }}>
                  
                  <div className="p-header" style={headerStyle}>
                     {headerContent}
                  </div>
    
                  <div className="p-body">
                     <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, letterSpacing: '-0.5px', textAlign: align as any }}>{card.value}</div>
                     {card.type === 'progress' && <div className="p-track" style={{ height: `${card.progressHeight || 6}px` }}><div className="p-fill" style={{ width: `${card.progressValue}%`, background: card.progressColor || card.accentColor || global.primaryColor }} /></div>}
                  </div>
    
                  <div className="p-footer">
                    {card.comparisons.map((comp) => {
                       let badgeColor = global.neutralColor;
                       if (comp.trend === 'up') {
                           badgeColor = comp.invertColor ? global.negativeColor : global.positiveColor;
                       } else if (comp.trend === 'down') {
                           badgeColor = comp.invertColor ? global.positiveColor : global.negativeColor;
                       }
                       return (
                           <div key={comp.id} className="p-row" style={{ fontSize: `${fSub}px` }}>
                              <span>{comp.label}</span>
                              {comp.trend !== 'none' && (
                                <span className="p-badge" style={{ color: badgeColor }}>
                                  {comp.trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {comp.value}
                                </span>
                              )}
                           </div>
                       );
                    })}
                  </div>
                </div>
              )}) : donuts.map((donut, idx) => {
                 const isSemi = donut.geometry === 'semicircle';
                 const radius = 40;
                 const circ = 2 * Math.PI * radius;
                 const isSelected = selectedCardId === donut.id;
                 const align = donut.textAlign || global.textAlign || 'left';
                 const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
                 const rotation = isSemi ? -180 : -90;
                 const circumferenceDivisor = isSemi ? 2 : 1;
                 const gridStyle = {
                    gridColumn: `span ${donut.colSpan || 1}`,
                    gridRow: `span ${donut.rowSpan || 1}`
                 };
                 
                 const lineCap = (donut.mode === 'distribution') ? 'butt' : (donut.roundedCorners ? 'round' : 'butt');
                 const titleSize = donut.fontSizeTitle || global.fontSizeTitle;
                 const valueSize = donut.fontSizeValue || 16;
                 const labelSize = donut.fontSizeLabel || 9;
                 const sizePct = donut.chartSize || 90; // Pegando o tamanho configurado no editor

                return (
                  <div key={donut.id} className={`p-card ${isSelected ? 'selected' : ''}`} 
                    style={{ 
                        '--p-bg': donut.cardBackgroundColor || global.cardBackgroundColor,
                        '--p-primary': donut.accentColor || global.primaryColor,
                        animationDelay: `${idx * 0.1}s`, 
                        ...gridStyle 
                    } as any} 
                    onClick={(e) => { e.stopPropagation(); onCardClick?.(donut.id); }}>
                    <div className="mb-4 flex" style={{ justifyContent: flexAlign }}>
                       <span style={{ fontSize: `${titleSize}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{donut.title}</span>
                    </div>
                    
                    {/* CONTAINER DO GRÁFICO - FLEXÍVEL E RESPONSIVO */}
                    <div className="flex-1 relative flex justify-center items-center" style={{ minHeight: 0, alignItems: isSemi ? 'flex-end' : 'center' }}>
                       
                       <svg 
                          viewBox="0 0 100 100" 
                          preserveAspectRatio="xMidYMid meet"
                          style={{ 
                             width: `${sizePct}%`, 
                             height: `${sizePct}%`, 
                             maxWidth: '100%',
                             maxHeight: isSemi ? '60%' : '100%', 
                             overflow: 'visible' 
                          }}
                       >
                          <circle cx="50" cy="50" r={radius} className="donut-ring" strokeWidth={donut.ringThickness} strokeDasharray={isSemi ? `${circ/2} ${circ}` : '0 0'} transform={`rotate(${rotation} 50 50)`} />
                          {donut.mode === 'completeness' ? (
                             <circle 
                               cx="50" cy="50" r={radius} 
                               className="donut-segment" 
                               stroke={donut.accentColor || global.primaryColor} 
                               strokeWidth={donut.ringThickness} 
                               strokeDasharray={`${(75/100) * (circ/circumferenceDivisor)} ${circ}`} 
                               strokeDashoffset="0"
                               strokeLinecap={lineCap}
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
                                    strokeLinecap={lineCap}
                                    transform={`rotate(${rotation} 50 50)`}
                                  />
                                );
                                return acc;
                             }, [])
                          )}
                       </svg>

                       {donut.showCenterText && (
                          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: isSemi ? '65%' : '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                             <div style={{ fontSize: `${labelSize}px`, fontWeight: 800, color: global.textColorSub }} className="uppercase leading-none">{donut.centerTextLabel}</div>
                             <div style={{ fontSize: `${valueSize}px`, fontWeight: 800, color: global.textColorValue }} className="leading-none mt-1">75%</div>
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

const renderRing = (card: any, global: any) => (
   <div className="ring-box">
      <svg viewBox="0 0 50 50" className="ring-svg">
        <circle className="ring-bg" cx="25" cy="25" r="20" />
        <circle className="ring-val" cx="25" cy="25" r="20" style={{"--offset": 126 - (126 * Math.min(1, Math.max(0, card.progressValue / 100)))} as any} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{color: global.textColorValue}}>{card.progressValue}%</div>
   </div>
);

export default Preview;