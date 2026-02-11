
export type CardType = 'simple' | 'progress' | 'ring';
export type TrendDirection = 'up' | 'down' | 'neutral' | 'none';
export type AnimationType = 'none' | 'fadeInUp' | 'popIn' | 'slideRight';
export type HoverEffect = 'none' | 'lift' | 'scale' | 'glow' | 'border';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type AppTab = 'cards' | 'charts';
export type TextAlign = 'left' | 'center' | 'right';
export type IconPosition = 'left' | 'top' | 'right';

export type FormatType = 'none' | 'integer' | 'decimal' | 'currency' | 'currency_short' | 'percent' | 'short';

export interface ComparisonConfig {
  id: string;
  label: string;
  value: string;
  trend: TrendDirection;
  logic: string; 
  measurePlaceholder: string; 
  invertColor?: boolean;
  // Advanced Customization
  labelColor?: string; // New
  labelFontSize?: number; // New
  icon?: string; // New: Icon specific for comparison
  showIcon?: boolean; // New
}

export interface CardConfig {
  id: string;
  title: string;
  measurePlaceholder: string;
  formatType: FormatType;
  decimalPlaces: number;
  prefix: string;
  suffix: string;
  type: CardType; // 'simple' | 'progress' | 'ring'
  
  // Progress Bar Specifics
  progressMeasure?: string; // Measure for the progress calculation
  progressTarget?: string; // Target for progress
  progressColor?: string;
  progressBackgroundColor?: string;
  progressHeight?: number;
  progressValue: number; // For preview

  targetMeasurePlaceholder: string;
  value: string;
  
  // Icon Configuration
  icon: string;
  iconPosition: IconPosition;
  iconSize: number;
  iconColor?: string;
  iconBackgroundColor?: string;
  iconPadding: number;
  iconRounded: boolean;

  isOpen?: boolean;
  accentColor?: string; 
  textAlign?: TextAlign;
  
  fontSizeTitle?: number;
  fontSizeValue?: number;
  fontSizeSub?: number;
  cardBackgroundColor?: string;
  textColorTitle?: string;
  textColorValue?: string;
  textColorSub?: string;
  comparisons: ComparisonConfig[];
}

export interface DonutSlice {
  id: string;
  label: string;
  measurePlaceholder: string;
  color: string;
  value: string; // Preview value
}

export interface DonutChartConfig {
  id: string;
  title: string;
  mode: 'completeness' | 'distribution';
  geometry: 'full' | 'semicircle';
  ringThickness: number;
  roundedCorners: boolean;
  showCenterText: boolean;
  centerTextLabel: string;
  centerTextValueMeasure: string;
  completenessMeasure: string;
  completenessTarget: string;
  slices: DonutSlice[];
  isOpen?: boolean;
  cardBackgroundColor?: string;
  accentColor?: string;
  fontSizeTitle?: number;
  textAlign?: TextAlign;
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
  
  // Shadow config
  shadowIntensity: number;
  shadowBlur: number;
  shadowDistance: number;

  fontSizeTitle: number;
  fontSizeValue: number;
  fontSizeSub: number;
  fontSizeBadge: number;
  fontWeightTitle: number;
  fontWeightValue: number;
  textAlign: TextAlign;
  
  animation: AnimationType;
  animationDuration: number;
  hoverEffect: HoverEffect;
}
