// types.ts

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
  labelColor?: string;
  labelFontSize?: number;
  icon?: string;
  showIcon?: boolean;
}

export interface DataBinding {
  id: string;
  label: string;
  value: string;
}

export interface CardConfig {
  id: string;
  title: string;
  measurePlaceholder: string;
  formatType: FormatType;
  decimalPlaces: number;
  prefix: string;
  suffix: string;
  type: CardType;
  
  colSpan?: number;
  rowSpan?: number;

  progressMeasure?: string;
  progressTarget?: string;
  progressColor?: string;
  progressBackgroundColor?: string;
  progressHeight?: number;
  progressValue: number;

  targetMeasurePlaceholder: string;
  value: string;
  
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
  value: string;
}

// types.ts

// ... (outras interfaces mantidas)

export interface DonutChartConfig {
  id: string;
  title: string;
  mode: 'completeness' | 'distribution';
  geometry: 'full' | 'semicircle';
  
  colSpan?: number;
  rowSpan?: number;

  ringThickness: number;
  roundedCorners: boolean;
  
  // --- NOVO CAMPO: TAMANHO DO GRÁFICO ---
  chartSize?: number; // Porcentagem (ex: 90 para 90%)

  showCenterText: boolean;
  centerTextLabel: string;
  centerTextValueMeasure: string;
  completenessMeasure: string;
  completenessTarget: string;
  slices: DonutSlice[];
  isOpen?: boolean;
  cardBackgroundColor?: string;
  accentColor?: string;
  textAlign?: TextAlign;

  fontSizeTitle?: number;
  fontSizeValue?: number;
  fontSizeLabel?: number;
}

// ... (resto do arquivo mantido)

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
  dataBindings: DataBinding[];
}