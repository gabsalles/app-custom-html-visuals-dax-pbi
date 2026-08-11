import React from 'react';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // optional: instruction for user action
  ctaText?: string; // Call-to-action button text
  ctaAction?: () => void; // Action when CTA is clicked
  hint?: string; // Additional hint
}

interface OnboardingTutorialProps {
  currentStep: number;
  totalSteps: number;
  step: TutorialStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

/**
 * OnboardingTutorial - Interactive tutorial component
 * v0.5.0 - Step-by-step guided onboarding
 */
export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  currentStep,
  totalSteps,
  step,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Backdrop - NO BLUR, very light - NOT closeable by clicking */}
      <div className="fixed inset-0 bg-black/10 z-40 animate-fadeIn pointer-events-none" />

      {/* Spotlight overlay with strong glow on target element */}
      {step.targetElement && (
        <TutorialSpotlight selector={step.targetElement} />
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
          targetElement={step.targetElement}
        />
      </div>
    </>
  );
};

interface TutorialPopoverProps {
  step: TutorialStep;
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
}

/**
 * TutorialPopover - The actual popover bubble with content
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
}) => {
  // Calculate popover position based on target element
  const [position, setPosition] = React.useState({ top: '50%', left: '50%' });

  React.useEffect(() => {
    if (targetElement) {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const popoverWidth = 360;
        const popoverHeight = 280;
        const spacing = 16;
        const viewportPadding = 20;

        // Try to position below the element
        let top = rect.bottom + spacing;
        let left = rect.left + rect.width / 2 - popoverWidth / 2;

        // Adjust horizontal position if off-screen
        if (left < viewportPadding) {
          left = viewportPadding;
        }
        if (left + popoverWidth > window.innerWidth - viewportPadding) {
          left = window.innerWidth - popoverWidth - viewportPadding;
        }

        // If popover would go below viewport, position above instead
        if (top + popoverHeight > window.innerHeight - viewportPadding) {
          top = rect.top - popoverHeight - spacing;
        }

        // If still off-screen vertically, position it in center
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

  return (
    <div
      className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
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
        <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
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
      </div>

      {/* Footer with buttons */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
        {/* CTA Button if provided */}
        {step.ctaText && step.ctaAction && (
          <button
            onClick={() => {
              step.ctaAction!();
            }}
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
 * TutorialSpotlight - Highlight effect on target element
 */
interface TutorialSpotlightProps {
  selector: string;
}

const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({ selector }) => {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const element = document.querySelector(selector);
    if (element) {
      setRect(element.getBoundingClientRect());
    }

    const handleResize = () => {
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selector]);

  if (!rect) return null;

  const padding = 12; // Aumentado para mais espaço visual
  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const borderRadius = 16;

  return (
    <svg
      className="fixed inset-0 z-41 pointer-events-none"
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
        </mask>
      </defs>

      {/* Spotlight glow effect - VERY STRONG GLOW */}
      <g>
        {/* Outer glow layers */}
        <rect
          x={left - 20}
          y={top - 20}
          width={width + 40}
          height={height + 40}
          rx={borderRadius + 10}
          fill="none"
          strokeWidth="40"
          stroke="rgba(79, 70, 229, 0.15)"
          style={{
            filter: 'blur(30px)',
          }}
        />
        {/* Inner glow */}
        <rect
          x={left - 10}
          y={top - 10}
          width={width + 20}
          height={height + 20}
          rx={borderRadius + 5}
          fill="none"
          strokeWidth="20"
          stroke="rgba(79, 70, 229, 0.3)"
          style={{
            filter: 'blur(15px)',
          }}
        />
        {/* Main highlight border */}
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={borderRadius}
          fill="rgba(79, 70, 229, 0.05)"
          strokeWidth="3"
          stroke="rgba(79, 70, 229, 1)"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(79, 70, 229, 0.8))',
          }}
        />
      </g>

      {/* Dark overlay with spotlight hole - light */}
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
