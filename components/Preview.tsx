import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GlobalConfig, CardConfig, ViewportMode, DonutChartConfig, BarChartConfig, AppTab, ComparisonConfig } from '../types';
import { chartTypeRegistry } from '../utils/chartTypes';
import { ZoomIn, ZoomOut, RotateCcw, BoxSelect, TrendingUp, TrendingDown, GripHorizontal } from 'lucide-react';
import { iconPaths } from '../utils/icons';
import { formatTestValue } from '../utils/formatTestValue';
import { resolveConditionalColor } from '../utils/conditionalFormatting';
import { buildRenderItems } from '../utils/categoricalCards';
import {
  resolveCompletenessPct, resolveDistributionTotal, resolveChartSizePct,
  resolveGaugeSemiGeometry,
} from '../utils/gaugeMath';
import {
  CONTAINER_BREAKPOINT_TABLET_PX, CONTAINER_BREAKPOINT_MOBILE_PX,
  DONUT_RADIUS, DONUT_CIRCUMFERENCE, RING_RADIUS, RING_CIRCUMFERENCE,
  BADGE_PADDING, BADGE_RADIUS_PX, BADGE_BG_ALPHA_HEX,
  BADGE_ICON_SIZE_PX, BADGE_ICON_STROKE_WIDTH,
  PROGRESS_BAR_DEFAULT_HEIGHT_PX, PROGRESS_BAR_RADIUS_PX,
  ANIMATION_EASING_DEFAULT, ANIMATION_EASING_POP_IN, CARD_BASE_TRANSITION,
} from '../utils/visualConstants';

interface PreviewProps {
  global: GlobalConfig;
  cards: CardConfig[];
  donuts: DonutChartConfig[];
  bars: BarChartConfig[];
  activeAppTab: AppTab;
  viewport: ViewportMode | 'custom';
  customDimensions?: { width: number, height: number };
  setCustomDimensions?: (dim: { width: number, height: number }) => void;
  onCardClick?: (id: string) => void;
  selectedCardId?: string | null;
  testValues?: Record<string, number>;
  onReorder?: (fromId: string, toId: string) => void;
}

// Tipos de redimensionamento
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const Preview: React.FC<PreviewProps> = ({ 
  global, cards, donuts, bars, activeAppTab, viewport,
  customDimensions, setCustomDimensions, 
  onCardClick, selectedCardId, testValues = {}, onReorder
}) => {
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [dragFromId, setDragFromId] = useState<string | null>(null);
  const [dragOverId, setDragOverId]  = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  
  // Estado para Resize expandido
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startDim = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(true); };
    const handleKeyUp   = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    const handleMouseUp = () => {
      if (isDraggingRef.current && dragFromId && dragOverId && dragFromId !== dragOverId) {
        onReorder?.(dragFromId, dragOverId);
      }
      isDraggingRef.current = false;
      setDragFromId(null);
      setDragOverId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup',   handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup',   handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragFromId, dragOverId, onReorder]);

  const resetView = () => { setScale(0.85); setOffset({ x: 0, y: 0 }); };

  // Handler de Mouse Unificado
  const handleMouseDown = (e: React.MouseEvent, type: 'pan' | ResizeHandle) => {
      // Don't start pan if a card drag is already in progress
      if (isDraggingRef.current) return;
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

  const handlePanMouseUp = () => {
      setIsPanning(false);
      setIsResizing(null);
      // card drag completion is handled by the global window listener
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const primaryRgb = hexToRgb(global.primaryColor);

  // Fase 3: card em modo categórico vira um grupo com mini-grid próprio.
  // Cards normais passam intactos. Ver utils/categoricalCards.ts.
  const { items: renderItems, effectiveTestValues } = useMemo(
    () => buildRenderItems(cards, testValues), [cards, testValues]
  );

  let animationKeyframes = '';
  if (global.animation === 'fadeInUp') {
    animationKeyframes = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  } else if (global.animation === 'popIn') {
    animationKeyframes = `@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`;
  } else if (global.animation === 'slideRight') {
    animationKeyframes = `@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`;
  }

  // --- CÁLCULO DINÂMICO DE SOMBRAS ---
  const shadowAlpha = (global.shadowIntensity || 0) / 100;
  const shadowDist = global.shadowDistance || 0;
  const shadowBlur = global.shadowBlur || 0;
  
  // Sombra base (para o estado normal)
  const baseShadow = `0 ${shadowDist}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha})`;
  // Sombra expandida (para o efeito Hover Lift)
  const liftShadow = `0 ${shadowDist + 10}px ${shadowBlur + 10}px rgba(0,0,0,${shadowAlpha + 0.1})`;

  let hoverStyles = '';
  switch (global.hoverEffect) {
    case 'lift': 
      hoverStyles = `
        transform: translateY(-6px) !important; 
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease !important;
        box-shadow: ${liftShadow} !important; 
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

  // Fase 0.6 item 6: cada animação usa sua própria curva (igual a daxGenerator.ts),
  // em vez de uma cubic-bezier genérica para todas — só assim o popIn "salta" de verdade.
  const animationEasing = global.animation === 'popIn' ? ANIMATION_EASING_POP_IN : ANIMATION_EASING_DEFAULT;
  const animationRule = global.animation !== 'none' ? `${global.animation} ${global.animationDuration}s ${animationEasing} forwards` : 'none';

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
      --p-badge-size: ${global.fontSizeBadge || 10}px;
      --p-shadow: ${baseShadow}; /* ← SOMBRA BASE APLICADA AQUI */
    }
    
    /* NOVO: O wrapper define o contêiner responsivo */
    .p-wrapper { 
        container-type: inline-size; 
        width: 100%; height: 100%; box-sizing: border-box; 
    }
    
    /* O Grid padrão carrega a versão de DESKTOP */
    .p-container { 
        display: grid; 
        grid-template-columns: repeat(${global.columnsDesktop || 3}, 1fr); 
        grid-auto-rows: 1fr;
        gap: var(--p-gap); 
        padding: ${(global.marginType || 'all') === 'specific' ? `${global.marginTop ?? 10}px ${global.marginRight ?? 10}px ${global.marginBottom ?? 10}px ${global.marginLeft ?? 10}px` : `${global.marginAll ?? 10}px`}; 
        width: 100%; height: 100%; box-sizing: border-box; 
    }
    
    /* REGRAS RESPONSIVAS AUTOMÁTICAS */
    @container (max-width: ${CONTAINER_BREAKPOINT_TABLET_PX}px) {
        .p-container { grid-template-columns: repeat(${global.columnsTablet || 2}, 1fr); }
    }
    @container (max-width: ${CONTAINER_BREAKPOINT_MOBILE_PX}px) {
        .p-container { grid-template-columns: repeat(${global.columnsMobile || 1}, 1fr); }
        /* Se cair pra mobile, força qualquer card a ocupar apenas 1 linha/coluna para não quebrar a tela */
        .p-card { grid-column: span 1 !important; grid-row: span 1 !important; }
    }

    .p-card { 
        background: var(--p-bg); 
        border-radius: var(--p-radius); 
        padding: var(--p-pad); 
        min-height: var(--p-min-h); 
        border: 1px solid rgba(0,0,0,0.08); 
        box-shadow: var(--p-shadow); /* ← INJETA A SOMBRA NO CARD */
        display: flex;
        flex-direction: column;
        transition: ${CARD_BASE_TRANSITION}; /* Fase 0.6 item 7 */
        position: relative;
        overflow: hidden; 
        opacity: ${global.animation !== 'none' ? 0 : 1}; 
        animation: ${animationRule}; 
    }
    
    .p-card:hover { ${hoverStyles} }
    .p-card.selected { border-color: var(--p-primary); box-shadow: 0 0 0 4px rgba(${primaryRgb}, 0.2); }
    /* Fase 2: variável PRÓPRIA da accent bar, separada de --p-primary — assim a
       formatação condicional afeta só a borda, sem mudar hover/seleção/anel/barra
       de progresso, que continuam presos ao accentColor estático via --p-primary. */
    .p-card::before { content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 4px; background: var(--p-accent-bar); border-radius: 0 4px 4px 0; }
    .p-card.compact { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px; padding-right: 12px; }
    .p-card.compact::before { top: 15%; bottom: 15%; display: block; }
    
    /* Cabeçalho e Rodapé com Flex-Shrink 0 para não encolherem */
    .p-header { display: flex; align-items: center; margin-bottom: 4px; width: 100%; gap: 8px; flex-shrink: 0; }
    .p-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-height: 0; }
    .p-footer { margin-top: auto; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(0,0,0,0.03); flex-shrink: 0; }
    
    .p-card.compact .p-footer { margin-top: 0; padding-top: 0; border-top: none; align-items: flex-end; justify-content: center; }
    .p-row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--p-text-sub); }
    /* Fase 0.6 item 1: padding/radius alinhados com daxGenerator.ts (.badge).
       Sem background fixo aqui — cada badge tinta o próprio fundo (item 2, ver renderComparison).
       gap ajustado pra 4px (mesmo valor de produção) — divergência extra encontrada ao aplicar o item 1. */
    .p-badge { font-size: var(--p-badge-size); font-weight: 800; padding: ${BADGE_PADDING}; border-radius: ${BADGE_RADIUS_PX}px; display: flex; align-items: center; gap: 4px; }
    /* Fase 0.6 itens 4/5: height aqui é sempre sobrescrito pelo inline style de cada card
       (mantido só por higiene, nunca renderiza de fato); radius em pílula (100px), como produção. */
    .p-track { width: 100%; height: ${PROGRESS_BAR_DEFAULT_HEIGHT_PX}px; background: rgba(0,0,0,0.05); border-radius: ${PROGRESS_BAR_RADIUS_PX}px; overflow: hidden; margin: 10px 0; }
    .p-fill { height: 100%; background: var(--p-primary); border-radius: ${PROGRESS_BAR_RADIUS_PX}px; width: 0; animation: loadBar 1s ease-out forwards; }
    .ring-box { position: relative; width: 48px; height: 48px; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-bg { fill: transparent; stroke: #f3f4f6; stroke-width: 5; }
    .ring-val { fill: none; stroke: var(--p-primary); stroke-width: 5; stroke-linecap: round; stroke-dasharray: ${RING_CIRCUMFERENCE}; stroke-dashoffset: ${RING_CIRCUMFERENCE}; animation: fillRing 1.2s ease-out forwards; }
    .donut-ring { fill: transparent; stroke: #f3f4f6; transition: stroke-dasharray 0.5s ease; }
    .donut-segment { fill: transparent; transition: stroke-dasharray 0.5s ease; }
  `;

  const simWidth  = customDimensions ? customDimensions.width  : 800;
  const simHeight = customDimensions ? customDimensions.height : 400;

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
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        backgroundPosition: `${offset.x}px ${offset.y}px`
      }}
      onMouseDown={(e) => handleMouseDown(e, 'pan')}
      onMouseMove={handleMouseMove}
      onMouseUp={handlePanMouseUp}
      onMouseLeave={handlePanMouseUp}
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

          {/* Canvas wrapper */}
            <div className="p-wrapper">
              {/* Empty state */}
              {(activeAppTab === 'cards' ? cards : activeAppTab === 'donuts' ? donuts : bars).length === 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '100%', minHeight: '120px'
                }}>
                  <div style={{
                    border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 32px',
                    textAlign: 'center', color: '#94a3b8', maxWidth: '280px'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Canvas vazio</div>
                    <div style={{ fontSize: '11px', lineHeight: 1.5 }}>Clique em <strong>+</strong> em Hierarquia para adicionar um card.</div>
                  </div>
                </div>
              )}
              <div className="p-container">
              {activeAppTab === 'cards' ? (() => {
                // Fase 3: renderiza UM card. Reaproveitado tanto pra cards de topo (chamado
                // direto) quanto pra slots dentro do mini-grid de um grupo categórico
                // (chamado com clickId = id do card molde, já que o slot não tem config própria).
                const renderCardItem = (card: CardConfig, idx: number, clickId?: string) => {
                const effectiveSelectedId = clickId ?? card.id;
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

                // Focus-dim: when editing a specific card, dim others. Slot usa o id
                // do molde (effectiveSelectedId) — todo o grupo acende junto.
                const isFocused = selectedCardId === effectiveSelectedId;
                const isDimmed  = selectedCardId !== null && !isFocused;
                // Canvas drag-and-drop
                const isDragTarget = dragOverId === card.id && dragFromId !== card.id;

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

                // Live test value resolution — effectiveTestValues cobre cards normais
                // (mesma chave de sempre) e slots sintéticos da Fase 3 (chave sintética,
                // seedada por flattenCategoricalCards). Nenhuma mudança pra quem não usa isso.
                const testMain = effectiveTestValues[card.id];
                const displayValue = testMain !== undefined ? formatTestValue(testMain, card) : card.value;
                // Fase 2: cor da accent bar — sem valor de teste, sem regras, ou nenhuma regra
                // casando, cai no accentColor normal (comportamento inalterado pra quem não usa isso).
                const accentBarColor = resolveConditionalColor(testMain, card.conditionalRules, card.accentColor || global.primaryColor);
                const resolveComp = (comp: any) => {
                  const key = `${card.id}_${comp.id}`;
                  const tv = effectiveTestValues[key];
                  if (tv === undefined) return { value: comp.value, trend: comp.trend };
                  const trend = tv > 0 ? 'up' : tv < 0 ? 'down' : 'none';
                  const pct = `${tv >= 0 ? '+' : ''}${(tv * 100).toFixed(1)}%`;
                  return { value: pct, trend };
                };

                // v0.4.0 - Advanced Comparison Rendering
                const renderComparison = (comp: ComparisonConfig, resolved: any) => {
                  const displayMode = comp.displayMode || 'trend+value';
                  const iconType = comp.iconType || 'trending';

                  let badgeColor = global.neutralColor;
                  if (resolved.trend === 'up') {
                    badgeColor = comp.invertColor ? global.negativeColor : global.positiveColor;
                  } else if (resolved.trend === 'down') {
                    badgeColor = comp.invertColor ? global.positiveColor : global.negativeColor;
                  }

                  // Select icon based on iconType
                  // Fase 0.6 item 3: size/strokeWidth alinhados com .badge svg de daxGenerator.ts
                  let trendIcon = null;
                  if (iconType === 'trending') {
                    trendIcon = resolved.trend === 'up'
                      ? <TrendingUp size={BADGE_ICON_SIZE_PX} strokeWidth={BADGE_ICON_STROKE_WIDTH} />
                      : <TrendingDown size={BADGE_ICON_SIZE_PX} strokeWidth={BADGE_ICON_STROKE_WIDTH} />;
                  } else if (iconType === 'proportion') {
                    trendIcon = <span style={{ fontSize: '10px', fontWeight: 'bold' }}>—</span>;
                  } else if (iconType === 'arrow') {
                    trendIcon = <span style={{ fontSize: '10px', fontWeight: 'bold' }}>→</span>;
                  } else if (iconType === 'check') {
                    trendIcon = resolved.trend === 'up' ? <span style={{ fontSize: '10px' }}>✓</span> : <span style={{ fontSize: '10px' }}>✗</span>;
                  } else if (iconType === 'bar') {
                    trendIcon = <span style={{ fontSize: '10px', fontWeight: 'bold' }}>▯</span>;
                  } else if (iconType === 'dot') {
                    trendIcon = <span style={{ fontSize: '8px', fontWeight: 'bold' }}>●</span>;
                  } else if (iconType === 'star') {
                    trendIcon = <span style={{ fontSize: '10px' }}>⭐</span>;
                  } else if (iconType === 'alert') {
                    trendIcon = <span style={{ fontSize: '10px' }}>⚠</span>;
                  }

                  // Fase 0.6 item 2: fundo tintado pela cor SEMÂNTICA do trend (badgeColor),
                  // igual a daxGenerator.ts (`${trueColor}1A`/`${falseColor}1A`) — não pela
                  // comp.labelColor do modo 'custom', que segue controlando só o texto/ícone,
                  // como já fazia antes (comportamento de labelColor não alterado aqui).
                  const badgeBg = `${badgeColor}${BADGE_BG_ALPHA_HEX}`;

                  // Render based on displayMode
                  if (displayMode === 'trend-only') {
                    return <span className="p-badge" style={{ color: badgeColor, backgroundColor: badgeBg }}>{trendIcon}</span>;
                  } else if (displayMode === 'proportion-only') {
                    return <span className="p-badge" style={{ color: badgeColor, backgroundColor: badgeBg }}>{resolved.value}</span>;
                  } else if (displayMode === 'custom') {
                    return <span className="p-badge" style={{ color: comp.labelColor || badgeColor, backgroundColor: badgeBg }}>{trendIcon} {comp.valueLabel || resolved.value}</span>;
                  } else {
                    // default: trend+value
                    return <span className="p-badge" style={{ color: badgeColor, backgroundColor: badgeBg }}>{trendIcon} {resolved.value}</span>;
                  }
                };

                if (isCompact) {
                   return (
                    <div key={card.id}
                        className={`p-card compact ${isFocused ? 'selected' : ''}`}
                        onMouseDown={(e) => { e.stopPropagation(); isDraggingRef.current = true; setDragFromId(card.id); setDragOverId(card.id); }}
                        onMouseEnter={() => { if (isDraggingRef.current) setDragOverId(card.id); }}
                        style={{
                            animationDelay: `${idx * 0.1}s`,
                            '--p-bg': card.cardBackgroundColor || global.cardBackgroundColor,
                            '--p-primary': card.accentColor || global.primaryColor,
                            '--p-accent-bar': accentBarColor,
                            ...gridStyle,
                            opacity: isDimmed ? 0.35 : dragFromId === card.id && dragOverId !== card.id ? 0.3 : 1,
                            outline: isDragTarget ? `2px dashed ${global.primaryColor}` : isFocused && selectedCardId ? `2px solid ${global.primaryColor}` : 'none',
                            outlineOffset: '3px',
                            transition: 'opacity 0.2s ease, outline 0.15s ease',
                            cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                        } as any}
                        onClick={(e) => { if (!isDraggingRef.current || dragFromId === card.id) { e.stopPropagation(); onCardClick?.(effectiveSelectedId); } }}>

                      <div className="flex flex-col justify-center z-10" style={{ maxWidth: '60%', marginLeft: '8px' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                           <div style={{ color: iconColor, width: '14px', height: '14px', display: 'flex' }}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconPaths[card.icon] || iconPaths['circle']} /></svg>
                           </div>
                           <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                             {card.title}
                           </span>
                        </div>
                        {/* Fase 1 (fechamento): nowrap removido — sem proteção de overflow no
                            valor (ellipsis seria enganoso), preferimos quebrar linha a cortar/vazar.
                            overflowWrap cobre o caso de um número longo sem espaço nenhum pra quebrar. */}
                        <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, lineHeight: 1.1, overflowWrap: 'break-word' }}>
                          {displayValue}
                        </div>
                      </div>
    
                      <div className="flex flex-col items-end justify-center gap-1 z-10 h-full">
                         {card.comparisons.map((comp) => {
                            const resolved = resolveComp(comp);
                            return (
                                <div key={comp.id} className="flex items-center gap-2" style={{ fontSize: `${fSub}px`, fontWeight: 600, color: global.textColorSub }}>
                                   <span className="hidden sm:inline" style={comp.labelColor ? { color: comp.labelColor } : undefined}>{comp.label}</span>
                                   {resolved.trend !== 'none' && renderComparison(comp, resolved)}
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
                        {/* Fase 1 item 2: header 'top' é flex-column sem align-items:stretch —
                            sem max-width o span só cresce com o conteúdo; com ele, overflow-hidden
                            + text-ellipsis passam a ter uma caixa real pra cortar. */}
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle, marginTop: '4px' }} className="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{card.title}</span>
                      </>
                    );
                } else if (iconPosition === 'right') {
                    headerStyle = { justifyContent: 'space-between' };
                    headerContent = (
                      <>
                        {/* Fase 1 item 2: min-w-0 é o que falta pro flex-shrink realmente cortar o
                            texto — sem ele, o span trava na largura do conteúdo (min-width:auto
                            do flexbox) e o ellipsis nunca chega a aparecer, mesmo declarado. */}
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{card.title}</span>
                        {card.type === 'ring' ? renderRing(card, global) : IconElement}
                      </>
                    );
                } else {
                    headerStyle = { justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' };
                    headerContent = (
                      <>
                        {card.type !== 'ring' && IconElement}
                        <span style={{ fontSize: `${fTitle}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{card.title}</span>
                      </>
                    );
                }

                return (
                <div key={card.id} className={`p-card ${isFocused ? 'selected' : ''}`}
                  onMouseDown={(e) => { e.stopPropagation(); isDraggingRef.current = true; setDragFromId(card.id); setDragOverId(card.id); }}
                  onMouseEnter={() => { if (isDraggingRef.current) setDragOverId(card.id); }}
                  style={{
                      animationDelay: `${idx * 0.1}s`,
                      '--p-bg': card.cardBackgroundColor || global.cardBackgroundColor,
                      '--p-primary': card.accentColor || global.primaryColor,
                      '--p-accent-bar': accentBarColor,
                      ...gridStyle,
                      opacity: isDimmed ? 0.35 : dragFromId === card.id && dragOverId !== card.id ? 0.3 : 1,
                      outline: isDragTarget ? `2px dashed ${global.primaryColor}` : isFocused && selectedCardId ? `2px solid ${global.primaryColor}` : 'none',
                      outlineOffset: '3px',
                      transition: 'opacity 0.2s ease, outline 0.15s ease',
                      cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                  } as any}
                  onClick={(e) => { if (!isDraggingRef.current || dragFromId === card.id) { e.stopPropagation(); onCardClick?.(effectiveSelectedId); } }}>

                  <div className="p-header" style={headerStyle}>
                     {headerContent}
                  </div>
    
                  <div className="p-body">
                     {/* Fase 1 (fechamento): já quebrava linha por padrão (sem nowrap definido);
                         overflowWrap cobre o caso de um número longo sem espaço pra quebrar. */}
                     <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, letterSpacing: '-0.5px', textAlign: align as any, overflowWrap: 'break-word' }}>{displayValue}</div>
                     {card.type === 'progress' && <div className="p-track" style={{ height: `${card.progressHeight || PROGRESS_BAR_DEFAULT_HEIGHT_PX}px` }}><div className="p-fill" style={{ width: `${card.progressValue}%`, background: card.progressColor || card.accentColor || global.primaryColor }} /></div>}
                  </div>
    
                  <div className="p-footer">
                    {card.comparisons.map((comp) => {
                       const resolved = resolveComp(comp);
                       return (
                           <div key={comp.id} className="p-row" style={{ fontSize: `${fSub}px` }}>
                              {/* Fase 1 item 4: labelColor já era respeitado em daxGenerator.ts
                                  pra este rótulo em TODOS os modos — faltava só aqui. */}
                              <span style={{ color: comp.labelColor || global.textColorSub }}>{comp.label}</span>
                              {resolved.trend !== 'none' && renderComparison(comp, resolved)}
                           </div>
                       );
                    })}
                  </div>
                </div>
                );
                }; // fim de renderCardItem

                // Fase 3: monta a lista final — cards normais direto, grupos categóricos
                // como 1 wrapper (mini-grid próprio) contendo os slots renderizados
                // via renderCardItem, com clickId apontando sempre pro card molde.
                return renderItems.map((item, idx) => {
                  if (item.kind === 'card') {
                    return <React.Fragment key={item.card.id}>{renderCardItem(item.card, idx)}</React.Fragment>;
                  }
                  const { sourceCard, groupLabel, slots } = item.data;
                  const groupSelected = selectedCardId === sourceCard.id;
                  const groupDimmed = selectedCardId !== null && !groupSelected;
                  const groupAccent = sourceCard.accentColor || global.primaryColor;
                  const groupGridStyle = {
                    gridColumn: `span ${sourceCard.colSpan || 1}`,
                    gridRow: `span ${sourceCard.rowSpan || 1}`,
                  };
                  return (
                    <div key={sourceCard.id}
                      style={{
                        ...groupGridStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: groupDimmed ? 0.35 : 1,
                        outline: groupSelected ? `2px dashed ${groupAccent}` : 'none',
                        outlineOffset: '3px',
                        borderRadius: 'var(--p-radius)',
                        transition: 'opacity 0.2s ease, outline 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => { e.stopPropagation(); onCardClick?.(sourceCard.id); }}
                    >
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 pb-2 flex-shrink-0">
                        {groupLabel}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${sourceCard.categorical?.columns || 3}, 1fr)`,
                        gridAutoRows: '1fr',
                        gap: `${global.gap}px`,
                        flex: 1,
                        minHeight: 0,
                      }}>
                        {slots.map((slot, i) => (
                          <React.Fragment key={slot.id}>{renderCardItem(slot, i, sourceCard.id)}</React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                });
              })() : activeAppTab === 'donuts' ? donuts.map((donut, idx) => {
                 const isSemi = donut.geometry === 'semicircle';
                 const radius = DONUT_RADIUS;
                 const circ = DONUT_CIRCUMFERENCE;
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
                 // Fix do gauge (round 2 — aspect-ratio): clamp defensivo (protege
                 // contra estado salvo antes do fix, ex. chartSize: 901010101) +
                 // geometria do semicírculo (viewBox recortado + aspect-ratio CSS
                 // com a MESMA proporção, zero letterbox) extraída pra
                 // utils/gaugeMath.ts (testável, ver gaugeMath.test.ts).
                 const sizePct = resolveChartSizePct(donut.chartSize);
                 const semiGeometry = resolveGaugeSemiGeometry(donut.ringThickness);
                 // Fase 0.5 / Fase 4 etapa 0: extraído pra utils/gaugeMath.ts — testável
                 // de verdade agora, não só validado contra fórmula copiada à mão.
                 const completenessPct = resolveCompletenessPct(donut.previewPercent);
                 // Não é o mesmo dado que centerTextValueMeasure resolve em produção (medida
                 // DAX arbitrária e independente das fatias, sem mecanismo de teste hoje) —
                 // é a melhor aproximação real no preview (ver Fase 0.5 follow-up).
                 const distributionTotal = resolveDistributionTotal(donut.slices);
                 // Fase 1 item 1: mesmo mecanismo de testValues dos cards, agora também
                 // cobrindo centerTextValueMeasure — quando o usuário preenche o campo
                 // "Valor de Teste (Preview)" no Editor, o texto central passa a mostrar
                 // o valor real testado (sem "%" fixo, já que a medida pode ser qualquer coisa)
                 // em vez da aproximação por percentual (fallback abaixo, mantido para não
                 // quebrar donuts que ainda não usaram o novo campo).
                 const centerTestValue = testValues[`${donut.id}_centerText`];
                 const centerTextDisplay = centerTestValue !== undefined
                   ? `${centerTestValue}`
                   : (donut.mode === 'completeness' ? `${completenessPct}%` : `${distributionTotal}%`);

                return (
                  <div key={donut.id} className={`p-card ${isSelected ? 'selected' : ''}`} 
                    style={{ 
                        '--p-bg': donut.cardBackgroundColor || global.cardBackgroundColor,
                        '--p-primary': donut.accentColor || global.primaryColor,
                        // Fase 2 é só pra cards — donut usa a cor estática de sempre, sem regras.
                        '--p-accent-bar': donut.accentColor || global.primaryColor,
                        animationDelay: `${idx * 0.1}s`,
                        ...gridStyle 
                    } as any} 
                    onClick={(e) => { e.stopPropagation(); onCardClick?.(donut.id); }}>
                    <div className="mb-4 flex" style={{ justifyContent: flexAlign }}>
                       <span style={{ fontSize: `${titleSize}px`, fontWeight: global.fontWeightTitle, color: global.textColorTitle }} className="uppercase tracking-widest">{donut.title}</span>
                    </div>
                    
                    {/* CONTAINER DO GRÁFICO - FLEXÍVEL E RESPONSIVO
                        Fix do gauge: overflow:hidden adicionado pra bater com
                        .chart-box da produção (daxGenerator.ts) — divergência
                        pré-existente encontrada durante o diagnóstico. */}
                    <div className="flex-1 relative flex justify-center items-center" style={{ minHeight: 0, alignItems: isSemi ? 'flex-end' : 'center', overflow: 'hidden' }}>

                       {/* Fix do gauge (round 2): wrapper próprio, position:relative, é o que
                           permite o texto central usar top:50% de novo (relativo à caixa real
                           do gráfico, não ao container inteiro) — necessário porque o modo
                           semicírculo ancora embaixo (alignItems:flex-end), então "50% do
                           container" e "50% da caixa do gráfico" NÃO coincidem mais. No modo
                           círculo cheio (center) os dois sempre coincidiam, então o wrapper
                           aqui só unifica os dois casos num só formato de código. */}
                       <div style={isSemi ? {
                          position: 'relative',
                          width: `${sizePct}%`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          // Fix do gauge (causa raiz): aspect-ratio com a MESMA proporção do
                          // viewBox recortado abaixo — o browser decide sozinho se largura ou
                          // altura disponível é o limite, sem sobra (ver gaugeMath.ts).
                          aspectRatio: semiGeometry.aspectRatio,
                          height: 'auto',
                       } : {
                          position: 'relative',
                          width: `${sizePct}%`,
                          height: `${sizePct}%`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                       }}>
                          <svg
                             viewBox={isSemi ? semiGeometry.viewBox : '0 0 100 100'}
                             preserveAspectRatio="xMidYMid meet"
                             style={{ width: '100%', height: '100%', overflow: 'visible' }}
                          >
                             <circle cx="50" cy="50" r={radius} className="donut-ring" strokeWidth={donut.ringThickness} strokeDasharray={isSemi ? `${circ/2} ${circ}` : '0 0'} transform={`rotate(${rotation} 50 50)`} />
                             {donut.mode === 'completeness' ? (
                                <circle
                                  cx="50" cy="50" r={radius}
                                  className="donut-segment"
                                  stroke={donut.accentColor || global.primaryColor}
                                  strokeWidth={donut.ringThickness}
                                  strokeDasharray={`${(completenessPct/100) * (circ/circumferenceDivisor)} ${circ}`}
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
                             // Fix do gauge: 50%/50% relativo ao WRAPPER (não mais ao container
                             // inteiro) — funciona nos dois modos porque o recorte do viewBox
                             // (semicírculo) já É a região do conteúdo, então seu próprio centro
                             // cai em 50% da caixa recortada. Sem fórmula/constante calibrada.
                             <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                <div style={{ fontSize: `${labelSize}px`, fontWeight: 800, color: global.textColorSub }} className="uppercase leading-none">{donut.centerTextLabel}</div>
                                <div style={{ fontSize: `${valueSize}px`, fontWeight: 800, color: global.textColorValue }} className="leading-none mt-1">{centerTextDisplay}</div>
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )
              }) : (
                // Fase 4, Etapa 5 — despacho puro: nenhuma lógica de barra mora aqui,
                // só a chamada pro contrato (utils/chartTypes/bar/barChartType.tsx).
                bars.map((barConfig) => (
                  <React.Fragment key={barConfig.id}>
                    {chartTypeRegistry.bar.renderPreview(barConfig, {
                      global,
                      selectedId: selectedCardId ?? null,
                      onSelect: (id: string) => onCardClick?.(id),
                      testValues,
                    })}
                  </React.Fragment>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

const renderRing = (card: any, global: any) => (
   <div className="ring-box">
      <svg viewBox="0 0 50 50" className="ring-svg">
        <circle className="ring-bg" cx="25" cy="25" r={RING_RADIUS} />
        <circle className="ring-val" cx="25" cy="25" r={RING_RADIUS} style={{"--offset": RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * Math.min(1, Math.max(0, card.progressValue / 100)))} as any} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{color: global.textColorValue}}>{card.progressValue}%</div>
   </div>
);

export default Preview;
