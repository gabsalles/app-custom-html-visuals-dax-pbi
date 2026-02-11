import React from 'react';
import { GlobalConfig, CardConfig, ViewportMode } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { iconPaths } from '../utils/icons';

interface PreviewProps {
  global: GlobalConfig;
  cards: CardConfig[];
  viewport: ViewportMode;
}

const Preview: React.FC<PreviewProps> = ({ global, cards, viewport }) => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const primaryRgb = hexToRgb(global.primaryColor);
  
  let hoverStyles = '';
  switch (global.hoverEffect) {
    case 'lift': hoverStyles = `transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); border-color: var(--p-primary);`; break;
    case 'scale': hoverStyles = `transform: scale(1.03); border-color: var(--p-primary);`; break;
    case 'glow': hoverStyles = `box-shadow: 0 0 25px rgba(${primaryRgb}, 0.5); border-color: var(--p-primary);`; break;
    case 'border': hoverStyles = `border-color: var(--p-primary); border-width: 2px; padding: calc(var(--p-pad) - 1px);`; break;
  }

  const animationDuration = `${global.animationDuration}s`;
  const animationRule = global.animation === 'none' ? 'none' : `${global.animation} ${animationDuration} cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;

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

    * {
      font-family: 'Bradesco Sans', 'Inter', -apple-system, sans-serif !important;
    }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popIn { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes slideRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes loadBar { from { width: 0; } }
    @keyframes fillRing { to { stroke-dashoffset: var(--offset); } }

    .artboard { display: grid; grid-template-columns: repeat(${global.columns}, 1fr); gap: var(--p-gap); width: 100%; padding: 10px; }
    .p-card { 
      background-color: var(--p-bg); border-radius: var(--p-radius); padding: var(--p-pad); 
      min-height: var(--p-min-h); border: 1px solid rgba(0,0,0,0.08); display: flex; flex-direction: column; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;
      opacity: ${global.animation === 'none' ? 1 : 0}; animation: ${animationRule};
    }
    .p-card:hover { ${hoverStyles} }
    .p-card::before { content: ''; position: absolute; left: 0; top: 15px; bottom: 15px; width: 4px; background: var(--p-primary); border-radius: 0 4px 4px 0; }
    .footer { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.03); }
    .p-row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--p-text-sub); }
    .p-badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.04); display: flex; align-items: center; gap: 3px; }
    .p-track { width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .p-fill { height: 100%; background: var(--p-primary); border-radius: 10px; width: 0; animation: loadBar 1s ease-out forwards; }
    .ring-box { position: relative; width: 48px; height: 48px; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-bg { fill: none; stroke: rgba(0,0,0,0.05); stroke-width: 5; }
    .ring-val { fill: none; stroke: var(--p-primary); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 126; stroke-dashoffset: 126; animation: fillRing 1.2s ease-out forwards; }

    ${viewport === 'mobile' ? `.artboard { grid-template-columns: 1fr !important; }` : ''}
    ${viewport === 'tablet' ? `.artboard { grid-template-columns: repeat(2, 1fr) !important; }` : ''}
  `;

  const containerWidth = viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%';

  return (
    <div className="w-full h-full bg-[#f0f2f5] p-12 overflow-y-auto flex justify-center items-start">
        <style>{dynamicStyles}</style>
        <div style={{ width: containerWidth, transition: 'width 0.4s ease' }} className="artboard">
          {cards.map((card, idx) => {
            const fTitle = card.fontSizeTitle || global.fontSizeTitle;
            const fValue = card.fontSizeValue || global.fontSizeValue;
            const fSub   = card.fontSizeSub   || global.fontSizeSub;

            return (
            <div key={`${card.id}-${global.animation}-${global.hoverEffect}-${cards.length}`} className="p-card" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex justify-between items-center mb-2">
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

              <div className="py-1">
                 <div style={{ fontSize: `${fValue}px`, fontWeight: global.fontWeightValue, color: global.textColorValue, letterSpacing: '-0.5px' }}>{card.value}</div>
                 {card.type === 'progress' && <div className="p-track"><div className="p-fill" style={{ width: `${card.progressValue}%` }} /></div>}
              </div>

              <div className="footer">
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
          )})}
        </div>
    </div>
  );
};

export default Preview;
