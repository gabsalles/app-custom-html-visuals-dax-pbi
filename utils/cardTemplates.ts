// utils/cardTemplates.ts - v0.5.0 Card Templates

import { CardConfig } from '../types';

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  template: Partial<CardConfig>;
}

/**
 * v0.5.0 - Predefined card templates for quick setup
 * Use templates for common card types
 */
export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'kpi-simple',
    name: '📊 Simple KPI',
    description: 'Basic KPI with single trending comparator',
    icon: 'trendingUp',
    template: {
      type: 'simple',
      icon: 'trendingUp',
      iconPosition: 'top',
      iconSize: 40,
      comparisons: [
        {
          id: 'comp1',
          label: 'MoM',
          value: '0%',
          trend: 'up',
          measurePlaceholder: '[Variance]',
          invertColor: false,
          displayMode: 'trend+value',
          iconType: 'trending',
        }
      ]
    }
  },

  {
    id: 'growth-yoy',
    name: '⬆️ Growth YoY',
    description: 'Year-over-year growth comparison',
    icon: 'arrowTrendingUp',
    template: {
      type: 'simple',
      icon: 'arrowTrendingUp',
      iconPosition: 'left',
      iconSize: 36,
      comparisons: [
        {
          id: 'comp1',
          label: 'YoY Change',
          value: '0%',
          trend: 'up',
          measurePlaceholder: '[YoY_Change]',
          invertColor: false,
          displayMode: 'trend+value',
          iconType: 'arrow',
        },
        {
          id: 'comp2',
          label: 'MoM',
          value: '0%',
          trend: 'up',
          measurePlaceholder: '[MoM_Change]',
          invertColor: false,
          displayMode: 'trend-only',
          iconType: 'trending',
        }
      ]
    }
  },

  {
    id: 'rating-score',
    name: '⭐ Rating/Score',
    description: 'Display ratings or satisfaction scores',
    icon: 'star',
    template: {
      type: 'simple',
      icon: 'star',
      iconPosition: 'top',
      iconSize: 44,
      comparisons: [
        {
          id: 'comp1',
          label: 'Rating',
          value: '4.5/5',
          trend: 'up',
          measurePlaceholder: '[Rating]',
          invertColor: false,
          displayMode: 'custom',
          iconType: 'star',
          showValue: true,
        }
      ]
    }
  },

  {
    id: 'progress-target',
    name: '🎯 Progress to Target',
    description: 'Show progress towards a goal',
    icon: 'target',
    template: {
      type: 'progress',
      icon: 'target',
      iconPosition: 'top',
      iconSize: 40,
      progressHeight: 8,
      progressColor: '#10b981',
      progressBackgroundColor: '#e5e7eb',
      progressValue: 65,
      comparisons: [
        {
          id: 'comp1',
          label: 'vs Target',
          value: '65%',
          trend: 'up',
          measurePlaceholder: '[Progress_Pct]',
          invertColor: false,
          displayMode: 'proportion-only',
          iconType: 'bar',
        }
      ]
    }
  },

  {
    id: 'metric-status',
    name: '✅ Status Indicator',
    description: 'Simple up/down status indicator',
    icon: 'checkmarkCircle',
    template: {
      type: 'simple',
      icon: 'checkmarkCircle',
      iconPosition: 'top',
      iconSize: 48,
      comparisons: [
        {
          id: 'comp1',
          label: 'Status',
          value: '✓',
          trend: 'up',
          measurePlaceholder: '[Status]',
          invertColor: false,
          displayMode: 'trend-only',
          iconType: 'check',
        }
      ]
    }
  },
];

/**
 * Create a new card from a template
 * Returns a card config ready to use
 */
export const createCardFromTemplate = (
  templateId: string,
  overrides: Partial<CardConfig> = {}
): CardConfig => {
  const template = CARD_TEMPLATES.find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const id = Math.random().toString(36).substr(2, 9);

  return {
    id,
    title: 'Novo Card',
    measurePlaceholder: '[Medida]',
    formatType: 'currency',
    decimalPlaces: 0,
    prefix: '',
    suffix: '',
    value: 'R$ 0',
    progressValue: 50,
    icon: 'chart',
    iconPosition: 'top',
    iconSize: 40,
    iconPadding: 8,
    iconRounded: false,
    colSpan: 1,
    rowSpan: 1,
    comparisons: [],
    ...template.template,
    ...overrides,
  } as CardConfig;
};
