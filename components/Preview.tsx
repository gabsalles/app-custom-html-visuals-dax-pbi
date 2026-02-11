
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GlobalConfig, CardConfig, ViewportMode } from '../types';
import { TrendingUp, TrendingDown, ZoomIn, ZoomOut, RotateCcw, BoxSelect, Grip, Eye } from 'lucide-react';
import { iconPaths } from '../utils/icons';

interface PreviewProps {
  global: GlobalConfig;
  cards: CardConfig[];
  viewport: ViewportMode | 'custom';
  customDimensions?: { width: number, height: number };
  onCardClick?: (id: string) => void;
  selectedCardId?: string | null;
}

const Preview: React.FC<PreviewProps> = ({ global, cards, viewport, customDimensions, onCardClick, selectedCardId }) => {
  // Navigation State
  const [scale, setScale] = useState(0.85); // Start slightly zoomed out
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle Spacebar for Pan Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'Space') { 
        setIsSpacePressed(true); 
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); 
      } 
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) { 
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.05), 5);
      setScale(newScale);
    }
  };

  const resetView = () => {
    setScale(0.85);
    setOffset({ x: 0, y: 0 });
  };

  const hexToRgb = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return '79, 70, 229'; 
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const dynamicStyles = `
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

    * { font-family: 'Bradesco Sans', 'Inter', -apple-system, sans-serif !important; }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes loadBar { from { width: 0; } }

    .artboard { 
        display: grid; 
        grid-template-columns: repeat(${global.columns}, 1fr); 
        gap: var(--p-gap); 
        width: 100%; 
        height: 100%;
        padding: var(--p-pad);
        box-sizing: border-box;
    }
    .p-card { 
      background: var(--card-bg, var(--p-bg)); 
      border-radius: var(--p-radius); 
      padding: var(--p-pad); 
      min-height: var(--p-min-h); 
      border: 1px solid rgba(0,0,0,0.06); 
      display: flex; 
      flex-direction: column; 
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
      position: relative; 
      overflow: hidden;
      opacity: ${global.animation === 'none' ? 1 : 0}; 
      animation: ${global.animation !== 'none' ? `${global.animation} ${global.animationDuration}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : 'none'};
      cursor: pointer;
      container-type: size;
    }
    .p-card.selected { 
      border-color: var(--card-accent); 
      box-shadow: 0 0 30px rgba(var(--card-accent-rgb), 0.3); 
      z-index: 10;
      transform: scale(1.02);
    }
    .p-card::before { content: ''; position: absolute; left: 0; top: 15px; bottom: 15px; width: 4px; background: var(--card-accent); border-radius: 0 4px 4px 0; }
    
    .card-content { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .body-section { flex: 1; display: flex; flex-direction: column; justify-content: center; }

    .footer { 
        margin-top: auto; 
        display: flex; 
        flex-direction: column; 
        gap: 6px; 
        padding-top: 10px; 
        border-top: 1px solid rgba(0,0,0,0.03); 
    }

    @container (max-height: 180px) {
      .card-content { flex-direction: row; align-items: center; gap: 20px; }
      .header-body { flex: 1; border-right: 1px solid rgba(0,0,0,0.05); padding-right: 15px; }
      .footer { margin-top: 0; border-top: none; border-left: none; padding-top: 0; justify-content: center; min-width: 120px; }
    }

    .p-row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--card-text-sub, var(--p-text-sub)); }
    .p-badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.04); display: flex; align-items: center; gap: 3px; }
    .p-track { width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .p-fill { height: 100%; background: var(--card-accent); border-radius: 10px; width: 0; animation: loadBar 1s ease-out forwards; }

    ${viewport === 'mobile' ? `.artboard { grid-template-columns: 1fr !important; }` : ''}
    ${viewport === 'tablet' ? `.artboard { grid-template-columns: repeat(2, 1fr) !important; }` : ''}

    .dot-grid {
      background-image: radial-gradient(#2d2d30 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .transparent-pattern {
      background-image: linear-gradient(45deg, #1a1a1c 25%, transparent 25%), 
                        linear-gradient(-45deg, #1a1a1c 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #1a1a1c 75%), 
                        linear-gradient(-45deg, transparent 75%, #1a1a1c 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      background-color: #161618;
    }
  `;

  const isCustom = viewport === 'custom' && customDimensions;
  const simWidth = isCustom ? customDimensions.width : viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : 1000;
  const simHeight = isCustom ? customDimensions.height : 600;

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#0f0f11] overflow-hidden relative dot-grid ${isPanning || isSpacePressed ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
        <style>{dynamicStyles}</style>
        
        {/* TOP UI LAYER */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-xl text-white/90 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 ring-1 ring-white/5">
                <BoxSelect size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    Visual <span className="text-indigo-300">{simWidth} x {simHeight}</span>
                </span>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                   <Eye size={12} className="text-indigo-400" />
                   <span className="text-[10px] font-bold text-white/50">{Math.round(scale * 100)}%</span>
                </div>
            </div>
        </div>

        {/* NAVIGATION TOOLBAR */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
           <div className="flex flex-col bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
             <button onClick={() => setScale(prev => Math.min(prev + 0.1, 5))} className="p-3 hover:bg-white/5 rounded-xl text-white/60 hover:text-white transition-all" title="Zoom In"><ZoomIn size={20}/></button>
             <button onClick={() => setScale(prev => Math.max(prev - 0.1, 0.05))} className="p-3 hover:bg-white/5 rounded-xl text-white/60 hover:text-white transition-all" title="Zoom Out"><ZoomOut size={20}/></button>
             <div className="h-px bg-white/5 mx-2 my-1" />
             <button onClick={resetView} className="p-3 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all" title="Reset Camera"><RotateCcw size={20}/></button>
           </div>
           
           <div className="bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 text-[9px] font-black text-white/30 uppercase text-center flex items-center gap-2 tracking-widest">
              <Grip size={12} className="text-indigo-500/50" /> [Espaço] + Arrastar
           </div>
        </div>

        {/* WORLD LAYER */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
          style={{ 
            transformOrigin: 'center center',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            pointerEvents: isPanning ? 'none' : 'auto'
          }}
        >
          {/* Simulation Object - Now Transparent/Checkerboard */}
          <div 
            className="transparent-pattern rounded-sm relative transition-all shadow-[0_0_150px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
            style={{ 
              width: simWidth, 
              height: simHeight,
              minWidth: simWidth,
              minHeight: simHeight,
              border: '1px solid #3f3f46'
            }}
          >
            {/* Context Label */}
            <div className="absolute -top-7 left-0 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                Power BI Visual Area
            </div>

            <div className="artboard">
              {cards.map((card, idx) => {
                const fTitle = card.fontSizeTitle || global.fontSizeTitle;
                const fValue = card.fontSizeValue || global.fontSizeValue;
                const fSub   = card.fontSizeSub   || global.fontSizeSub;
                const accent = card.accentColor || global.primaryColor;
                const cardBg = card.cardBackgroundColor || global.cardBackgroundColor;
                const textColorTitle = card.textColorTitle || global.textColorTitle;
                const textColorValue = card.textColorValue || global.textColorValue;
                const textColorSub = card.textColorSub || global.textColorSub;
                
                const accentRgb = hexToRgb(accent);
                const isSelected = selectedCardId === card.id;

                return (
                <div 
                  key={`${card.id}-${global.animation}-${cards.length}`} 
                  className={`p-card ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onCardClick?.(card.id); }}
                  style={{ 
                    '--card-accent': accent, 
                    '--card-accent-rgb': accentRgb,
                    '--card-bg': cardBg,
                    '--card-text-title': textColorTitle,
                    '--card-text-val': textColorValue,
                    '--card-text-sub': textColorSub
                  } as any}
                >
                  <div className="card-content">
                    <div className="header-body">
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: 'var(--card-text-title)' }} className="uppercase tracking-widest leading-none truncate pr-4">{card.title}</span>
                        <div className="text-gray-400 opacity-20 flex-shrink-0">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                        </div>
                      </div>

                      <div className="body-section">
                        <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: 'var(--card-text-val)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{card.value}</div>
                        {card.type === 'progress' && <div className="p-track"><div className="p-fill" style={{ width: `${card.progressValue}%` }} /></div>}
                      </div>
                    </div>

                    <div className="footer">
                      {card.comparisons.map((comp) => (
                        <div key={comp.id} className="p-row" style={{ fontSize: `${fSub}px` }}>
                            <span className="truncate pr-2">{comp.label}</span>
                            {comp.trend !== 'none' && (
                              <span className="p-badge whitespace-nowrap" style={{ color: comp.trend === 'up' ? (comp.invertColor ? global.negativeColor : global.positiveColor) : (comp.invertColor ? global.positiveColor : global.negativeColor) }}>
                                {comp.trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {comp.value}
                              </span>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Preview;
