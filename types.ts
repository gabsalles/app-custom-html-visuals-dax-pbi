// types.ts

export type CardType = 'simple' | 'progress' | 'ring';
export type TrendDirection = 'up' | 'down' | 'neutral' | 'none';
export type AnimationType = 'none' | 'fadeInUp' | 'popIn' | 'slideRight';
export type HoverEffect = 'none' | 'lift' | 'scale' | 'glow' | 'border';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type AppTab = 'cards' | 'donuts' | 'bars';
export type TextAlign = 'left' | 'center' | 'right';
export type IconPosition = 'left' | 'top' | 'right';

export type FormatType = 'none' | 'integer' | 'decimal' | 'currency' | 'currency_short' | 'percent' | 'short';
export type ThemeName = 'modern' | 'professional' | 'dark' | 'vibrant' | 'minimalist';

// Fase 2: Formatação Condicional
export type ConditionalOperator = '>' | '>=' | '<' | '<=' | '=' | 'between';

export interface ConditionalRule {
  id: string;
  operator: ConditionalOperator;
  value: number;
  value2?: number; // usado só quando operator === 'between'
  color: string;
  label?: string; // ex.: "Crítico", "Atenção", "Ok" — só documentação, não afeta a lógica
}

// Fase 3: Cards Agregados por Categoria (Opção 1 — toggle no CardConfig existente)
export type CategoricalSortBy = 'value_desc' | 'value_asc' | 'alpha';

export interface CategoricalConfig {
  column: string; // texto livre, ex: "'Produtos'[Categoria]" — mesmo padrão de measurePlaceholder
  maxSlots: number; // padrão 10
  showOthersBucket: boolean; // padrão true — título+valor apenas, sem comparativos/condicional
  sortBy: CategoricalSortBy; // padrão 'value_desc' — Outros só faz sentido pleno nessa ordenação
  testCategories?: string[]; // nomes fictícios pro preview, ex: ["Norte","Sul","Sudeste"]
  // Colunas do MINI-GRID próprio do grupo — independente de columnsDesktop/Tablet/Mobile
  // do canvas principal. O grupo inteiro é 1 item do grid principal (usa colSpan/rowSpan
  // do próprio card molde); dentro dele, os slots se organizam nessa quantidade de colunas.
  columns: number; // padrão 3
}

export interface ComparisonConfig {
  id: string;
  label: string;
  value: string;
  trend: TrendDirection;
  measurePlaceholder: string;
  invertColor?: boolean;
  // Advanced Customization
  labelColor?: string;
  labelFontSize?: number;
  icon?: string;
  showIcon?: boolean;

  // v0.4.0 - Advanced Display Modes
  displayMode?: 'trend+value' | 'trend-only' | 'proportion-only' | 'custom';
  iconType?: 'trending' | 'proportion' | 'arrow' | 'check' | 'bar' | 'dot' | 'star' | 'alert';
  showValue?: boolean;
  valueFormat?: FormatType;
  valueLabel?: string;
  customIcon?: string;
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
  // Fase 2: regras avaliadas em ORDEM, primeira que casar vence. Se nenhuma casar
  // (ou a lista estiver vazia/indefinida), usa accentColor normalmente — sem mudança
  // de comportamento pra cards que não configuram isso.
  conditionalRules?: ConditionalRule[];
  // Fase 3: presença deste campo = modo categórico ativo. O card vira um "molde"
  // que se expande em até categorical.maxSlots cards no canvas (Opção 1 aprovada:
  // toggle no CardConfig existente, não um tipo de item novo). Sem isso, comportamento
  // de card único de sempre — sem mudança pra quem não usa a feature.
  categorical?: CategoricalConfig;
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
  // Porcentagem (ex: 90 para 90%). Faixa válida: GAUGE_CHART_SIZE_MIN (30) a
  // GAUGE_CHART_SIZE_MAX (100) — ver utils/visualConstants.ts. Leitura em
  // Preview.tsx/daxGenerator.ts sempre passa por resolveChartSizePct()
  // (utils/gaugeMath.ts), que reclampa defensivamente valores fora da faixa
  // (proteção contra estado salvo antes desse clamp existir no input).
  chartSize?: number;

  showCenterText: boolean;
  centerTextLabel: string;
  centerTextValueMeasure: string;
  completenessMeasure: string;
  completenessTarget: string;
  // Fase 0.5: valor de teste (0-100) só para o preview do modo 'completeness'.
  // Espelha o papel de DonutSlice.value no modo 'distribution' — o cálculo real
  // em produção usa _D{di}_Pct = MIN(1, MAX(0, DIVIDE(...))) em utils/daxGenerator.ts.
  previewPercent?: number;
  slices: DonutSlice[];
  isOpen?: boolean;
  cardBackgroundColor?: string;
  accentColor?: string;
  textAlign?: TextAlign;

  fontSizeTitle?: number;
  fontSizeValue?: number;
  fontSizeLabel?: number;
}

// Fase 4, Etapa 5 (protótipo) → único modo desde então: 1 coluna + 1 medida,
// N categorias descobertas via DAX (TOPN+CONCATENATEX+RANKX). O modo manual
// (BarSlice[], barra por barra) existiu e foi removido — categorical não é
// mais opcional, é a única forma de configurar um gráfico de barras.
export interface BarChartConfig {
  id: string;
  title: string;
  colSpan?: number;
  rowSpan?: number;
  cardBackgroundColor?: string;
  accentColor?: string;
  textAlign?: TextAlign;
  fontSizeTitle?: number;
  fontSizeValue?: number;
  fontSizeLabel?: number;
  formatType?: FormatType;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  barOrientation?: BarOrientation;
  categorical: BarCategoricalConfig;
}

export type BarOrientation = 'horizontal' | 'ranking' | 'vertical';

export interface BarCategoricalConfig {
  column: string; // mesmo padrão de CategoricalConfig.column — picker via MeasureSelect
  measurePlaceholder: string;
  // 'fixed': maxCategories é usado direto no DAX (literal). 'parameter': o DAX usa
  // maxCategoriesParamExpr (ex: um What-if Parameter criado pelo usuário no Power BI
  // Desktop) — maxCategories vira só o valor usado pra fatiar o PREVIEW no app, já
  // que não existe motor DAX no navegador pra simular o parâmetro de verdade.
  maxCategoriesMode: 'fixed' | 'parameter';
  maxCategories: number; // default 10
  maxCategoriesParamExpr?: string; // ex: SELECTEDVALUE('MaxCategorias'[MaxCategorias Value], 10)
  sortBy: CategoricalSortBy; // reaproveita o enum dos cards categóricos (value_desc/value_asc/alpha)
  sortEnabled: boolean; // mostra o botão "Ordenar" no HTML gerado
  useGradient?: boolean;
  subtitle?: string;
  testCategories?: string[];
}

// ... (resto do arquivo mantido)

export interface GlobalConfig {
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  gap: number;
  padding: number;

  // --- NOVOS CAMPOS PARA MARGEM EXTERNA ---
  marginType: 'all' | 'specific';
  marginAll: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  // ---------------------------------------

  // v0.5.0 - Theme system
  currentTheme?: ThemeName;

  primaryColor: string;
  cardBackgroundColor: string;
  canvasBackgroundColor: string;
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