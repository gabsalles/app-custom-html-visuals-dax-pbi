
export type CardType = 'simple' | 'progress' | 'ring';
export type TrendDirection = 'up' | 'down' | 'neutral' | 'none';
export type AnimationType = 'none' | 'fadeInUp' | 'popIn' | 'slideRight';
export type HoverEffect = 'none' | 'lift' | 'scale' | 'glow' | 'border';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type FormatType = 'none' | 'integer' | 'decimal' | 'currency' | 'currency_short' | 'percent' | 'short';

export interface ComparisonConfig {
  id: string;
  label: string;
  value: string;
  trend: TrendDirection;
  logic: string; // DAX Expression
  measurePlaceholder: string; // New: DAX Measure name for the value
  invertColor?: boolean; // If true, positive logic = negative color
}

export interface CardConfig {
  id: string;
  title: string;
  measurePlaceholder: string;
  formatType: FormatType;
  decimalPlaces: number;
  type: CardType;
  targetMeasurePlaceholder: string;
  value: string;
  progressValue: number;
  icon: string;
  isOpen?: boolean;
  accentColor?: string; // Local accent override
  
  // Font Overrides (Optional)
  fontSizeTitle?: number;
  fontSizeValue?: number;
  fontSizeSub?: number;
  
  // Multiple Comparisons
  comparisons: ComparisonConfig[];
}

export interface GlobalConfig {
  columns: number;
  gap: number;
  padding: number;
  primaryColor: string;
  cardBackgroundColor: string;
  textColorTitle: string;
  textColorValue: string;
  textColorSub: string;
  positiveColor: string;
  negativeColor: string;
  neutralColor: string;
  borderRadius: number;
  cardMinHeight: number;
  fontSizeTitle: number;
  fontSizeValue: number;
  fontSizeSub: number;
  fontWeightTitle: number;
  fontWeightValue: number;
  animation: AnimationType;
  animationDuration: number;
  hoverEffect: HoverEffect;
}
