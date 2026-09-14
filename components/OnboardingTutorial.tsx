import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { TutorialStepV2 } from '../utils/tutorialSteps';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  action?: string;
  ctaText?: string;
  hint?: string;
}

interface OnboardingTutorialProps {
  currentStep: number;
  totalSteps: number;
  step: TutorialStepV2;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onAutoAdvance?: () => void; // Called when auto-advance condition is met
}

/**
 * OnboardingTutorial v2 - Complete rewrite with auto-advance detection
 *
 * Features:
 * - Auto-advance when user completes the step's action
 * - Field-level highlighting (not just panels)
 * - Click/Input/Modal event detection
 * - Smart popover positioning
 * - Persistent backdrop allowing interaction
 * - Visual feedback when action is completed
 */
export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  currentStep,
  totalSteps,
  step,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onAutoAdvance,
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const [autoAdvanceDetected, setAutoAdvanceDetected] = useState(false);

  // Listen for auto-advance triggers
  useEffect(() => {
    console.log(`📚 Step ${step.id}: autoAdvanceTrigger = ${step.autoAdvanceTrigger}`);

    if (!step.autoAdvanceTrigger || step.autoAdvanceTrigger === 'none') {
      console.log(`⏭️ No auto-advance for this step`);
      return;
    }

    const handleAutoAdvance = () => {
      setAutoAdvanceDetected(true);
      setTimeout(() => {
        onAutoAdvance?.();
      }, 800); // Show success feedback before advancing
    };

    if (step.autoAdvanceTrigger === 'click' && step.triggerSelector) {
      const handler = () => {
        handleAutoAdvance();
      };
      const element = document.querySelector(step.triggerSelector);
      if (element) {
        element.addEventListener('click', handler);
        return () => element.removeEventListener('click', handler);
      }
    } else if (step.autoAdvanceTrigger === 'input' && step.triggerSelector) {
      const handler = (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (step.triggerValue === 'minLength=3') {
          if (input.value.length >= 3) {
            handleAutoAdvance();
          }
        } else if (step.triggerValue) {
          if (input.value === step.triggerValue) {
            handleAutoAdvance();
          }
        }
      };

      const element = document.querySelector(step.triggerSelector);
      if (element) {
        element.addEventListener('input', handler);
        return () => element.removeEventListener('input', handler);
      }
    } else if (step.autoAdvanceTrigger === 'modal') {
      // Watch for modal changes using MutationObserver for robustness

      // Para template-gallery: watch if it disappears
      if (step.id === 'template-selection') {
        console.log('🎯 Watching for template gallery closure...');

        // Check immediately first
        const galleryExists = document.querySelector('[data-tutorial="template-gallery"]');
        console.log('Gallery exists now:', !!galleryExists);

        const observer = new MutationObserver(() => {
          const gallery = document.querySelector('[data-tutorial="template-gallery"]');
          console.log('MutationObserver fired - Gallery exists:', !!gallery);

          if (!gallery) {
            console.log('✅ Gallery closed! Auto-advancing...');
            handleAutoAdvance();
            observer.disconnect();
          }
        });

        // Watch the entire document for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false,
          characterData: false,
        });

        return () => {
          console.log('Cleaning up modal observer');
          observer.disconnect();
        };
      }

      // For icon selector: watch if it opens
      if (step.id === 'customize-icon') {
        const observer = new MutationObserver(() => {
          const iconSelector = document.querySelector('[data-tutorial="icon-selector"]');
          if (iconSelector) {
            handleAutoAdvance();
            observer.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        return () => observer.disconnect();
      }
    }
  }, [step.autoAdvanceTrigger, step.triggerSelector, step.triggerValue, onAutoAdvance, step.id]);

  return (
    <>
      {/* Backdrop - Light and non-interactive, allows clicking behind */}
      <div className="fixed inset-0 bg-black/10 z-40 animate-fadeIn pointer-events-none" />

      {/* Field-level highlighting */}
      {step.highlightSelector && (
        <TutorialSpotlight
          selector={step.highlightSelector}
          secondary={step.highlightSecondary}
          showGlow={!autoAdvanceDetected}
        />
      )}

      {/* Success indicator when auto-advance condition met */}
      {autoAdvanceDetected && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-45">
          <div className="bg-white rounded-full p-6 shadow-2xl animate-scaleIn">
            <CheckCircle size={48} className="text-green-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      <div className="fixed z-50 animate-fadeIn">
        <TutorialPopover
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isFirst={isFirst}
          isLast={isLast}
          progress={progress}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onComplete={onComplete}
          targetElement={step.highlightSelector}
          autoAdvanceDetected={autoAdvanceDetected}
        />
      </div>
    </>
  );
};

interface TutorialPopoverProps {
  step: TutorialStepV2;
  currentStep: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  targetElement?: string;
  autoAdvanceDetected?: boolean;
}

/**
 * TutorialPopover - The actual popover bubble with enhanced positioning
 */
const TutorialPopover: React.FC<TutorialPopoverProps> = ({
  step,
  currentStep,
  totalSteps,
  isFirst,
  isLast,
  progress,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  targetElement,
  autoAdvanceDetected,
}) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    if (targetElement) {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const popoverWidth = 360;
        const popoverHeight = 280;
        const spacing = 30;
        const viewportPadding = 20;

        let top = rect.bottom + spacing;
        let left = rect.left + rect.width / 2 - popoverWidth / 2;

        // Try right first
        const rightPosition = rect.right + spacing;
        if (rightPosition + popoverWidth < window.innerWidth - viewportPadding) {
          left = rightPosition;
          top = rect.top + rect.height / 2 - popoverHeight / 2;
        }
        // Try left
        else {
          const leftPosition = rect.left - popoverWidth - spacing;
          if (leftPosition > viewportPadding) {
            left = leftPosition;
            top = rect.top + rect.height / 2 - popoverHeight / 2;
          }
          // Default: below
          else {
            if (left < viewportPadding) {
              left = viewportPadding;
            }
            if (left + popoverWidth > window.innerWidth - viewportPadding) {
              left = window.innerWidth - popoverWidth - viewportPadding;
            }

            if (top + popoverHeight > window.innerHeight - viewportPadding) {
              top = rect.top - popoverHeight - spacing;
            }
          }
        }

        // Fallback: center if still off-screen
        if (top < viewportPadding) {
          top = window.innerHeight / 2 - popoverHeight / 2;
        }

        setPosition({
          top: `${Math.max(viewportPadding, top)}px`,
          left: `${Math.max(viewportPadding, left)}px`,
        });
      }
    }
  }, [targetElement]);

  const showCTA = step.ctaText && !step.ctaHidden;

  return (
    <div
      className={`w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative transition-all ${
        autoAdvanceDetected ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
      }`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translate(0, 0)',
      }}
    >
      {/* Pointer arrow */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45" />

      {/* Header with progress bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1">
              Passo {currentStep + 1} de {totalSteps}
            </div>
            <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <p className="text-[13px] text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">
          {step.description}
        </p>

        {step.action && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
            <p className="text-[11px] font-bold text-indigo-700 flex items-start gap-2">
              <span className="text-indigo-500 text-lg leading-none">→</span>
              {step.action}
            </p>
          </div>
        )}

        {step.hint && (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg mb-4">
            <p className="text-[9px] text-slate-600 italic">{step.hint}</p>
          </div>
        )}

        {autoAdvanceDetected && step.feedback && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-[11px] font-bold text-green-700">{step.feedback}</p>
          </div>
        )}
      </div>

      {/* Footer with buttons */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
        {showCTA && (
          <button
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          >
            {step.ctaText}
          </button>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Voltar"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            {!isLast ? (
              <button
                onClick={onNext}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                <CheckCircle size={14} /> Pronto!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TutorialSpotlight - Enhanced highlighting for specific fields
 */
interface TutorialSpotlightProps {
  selector: string;
  secondary?: string[];
  showGlow?: boolean;
}

const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  selector,
  secondary,
  showGlow = true,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [secondaryRects, setSecondaryRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    const element = document.querySelector(selector);
    if (element) {
      setRect(element.getBoundingClientRect());
    }

    // Collect secondary elements
    if (secondary && secondary.length > 0) {
      const rects: DOMRect[] = [];
      secondary.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          rects.push(el.getBoundingClientRect());
        }
      });
      setSecondaryRects(rects);
    }

    const handleResize = () => {
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selector, secondary]);

  if (!rect) return null;

  const padding = 12;
  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const borderRadius = 16;

  return (
    <svg
      className={`fixed inset-0 z-41 pointer-events-none transition-opacity ${
        !showGlow ? 'opacity-30' : 'opacity-100'
      }`}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx={borderRadius}
            fill="black"
          />
          {/* Also mask out secondary elements */}
          {secondaryRects.map((srect, i) => (
            <rect
              key={i}
              x={srect.left - padding}
              y={srect.top - padding}
              width={srect.width + padding * 2}
              height={srect.height + padding * 2}
              rx={8}
              fill="black"
            />
          ))}
        </mask>

        <filter id="tutorial-glow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main glow effect */}
      <g filter="url(#tutorial-glow)">
        {/* Outer massive glow */}
        <rect
          x={left - 50}
          y={top - 50}
          width={width + 100}
          height={height + 100}
          rx={borderRadius + 20}
          fill="none"
          strokeWidth="60"
          stroke="rgba(79, 70, 229, 0.2)"
          style={{ filter: 'blur(40px)' }}
        />
        {/* Medium glow */}
        <rect
          x={left - 30}
          y={top - 30}
          width={width + 60}
          height={height + 60}
          rx={borderRadius + 15}
          fill="none"
          strokeWidth="40"
          stroke="rgba(79, 70, 229, 0.4)"
          style={{ filter: 'blur(25px)' }}
        />
        {/* Inner glow */}
        <rect
          x={left - 15}
          y={top - 15}
          width={width + 30}
          height={height + 30}
          rx={borderRadius + 8}
          fill="none"
          strokeWidth="25"
          stroke="rgba(79, 70, 229, 0.6)"
          style={{ filter: 'blur(12px)' }}
        />
        {/* Bright border */}
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={borderRadius}
          fill="rgba(79, 70, 229, 0.1)"
          strokeWidth="4"
          stroke="rgba(79, 70, 229, 1)"
          style={{
            filter:
              'drop-shadow(0 0 30px rgba(79, 70, 229, 1)) drop-shadow(0 0 50px rgba(79, 70, 229, 0.7))',
          }}
        />

        {/* Secondary elements - subtle glow */}
        {secondaryRects.map((srect, i) => (
          <rect
            key={i}
            x={srect.left - padding}
            y={srect.top - padding}
            width={srect.width + padding * 2}
            height={srect.height + padding * 2}
            rx={8}
            fill="rgba(79, 70, 229, 0.05)"
            strokeWidth="2"
            stroke="rgba(79, 70, 229, 0.3)"
            style={{ filter: 'blur(2px)' }}
          />
        ))}
      </g>

      {/* Dark overlay */}
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.15)"
        mask="url(#spotlight-mask)"
      />
    </svg>
  );
};

export default OnboardingTutorial;
