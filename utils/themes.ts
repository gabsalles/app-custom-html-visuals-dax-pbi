// utils/themes.ts - v0.5.0 Theme System

import { GlobalConfig } from '../types';

export type ThemeName = 'modern' | 'professional' | 'dark' | 'vibrant' | 'minimalist';

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    primaryColor: string;
    cardBackgroundColor: string;
    canvasBackgroundColor: string;
    textColorTitle: string;
    textColorValue: string;
    textColorSub: string;
    positiveColor: string;
    negativeColor: string;
    neutralColor: string;
  };
}

/**
 * v0.5.0 - Predefined themes for quick styling
 * Apply any theme with a single click!
 */
export const THEMES: Record<ThemeName, Theme> = {
  modern: {
    name: 'modern',
    label: '✨ Modern',
    description: 'Vibrant, futuristic. Best for: Startups, Tech',
    colors: {
      primaryColor: '#6366f1',      // Indigo
      cardBackgroundColor: '#ffffff',
      canvasBackgroundColor: '#f9fafb',
      textColorTitle: '#1f2937',
      textColorValue: '#111827',
      textColorSub: '#6b7280',
      positiveColor: '#10b981',     // Emerald
      negativeColor: '#ef4444',     // Red
      neutralColor: '#9ca3af',
    },
  },

  professional: {
    name: 'professional',
    label: '💼 Professional',
    description: 'Neutral, elegant. Best for: Executives, Business',
    colors: {
      primaryColor: '#1f2937',      // Dark gray
      cardBackgroundColor: '#ffffff',
      canvasBackgroundColor: '#f3f4f6',
      textColorTitle: '#111827',
      textColorValue: '#1f2937',
      textColorSub: '#6b7280',
      positiveColor: '#0891b2',     // Cyan
      negativeColor: '#dc2626',     // Dark Red
      neutralColor: '#9ca3af',
    },
  },

  dark: {
    name: 'dark',
    label: '🌙 Dark Mode',
    description: 'Dark backgrounds. Best for: Late night, OLED',
    colors: {
      primaryColor: '#818cf8',      // Light indigo
      cardBackgroundColor: '#1f2937',
      canvasBackgroundColor: '#111827',
      textColorTitle: '#f3f4f6',
      textColorValue: '#e5e7eb',
      textColorSub: '#9ca3af',
      positiveColor: '#34d399',     // Light green
      negativeColor: '#f87171',     // Light red
      neutralColor: '#6b7280',
    },
  },

  vibrant: {
    name: 'vibrant',
    label: '🔥 Vibrant',
    description: 'Bold, saturated colors. Best for: Marketing, Attention',
    colors: {
      primaryColor: '#dc2626',      // Bold red
      cardBackgroundColor: '#ffffff',
      canvasBackgroundColor: '#fef2f2',
      textColorTitle: '#7c2d12',
      textColorValue: '#991b1b',
      textColorSub: '#b45309',
      positiveColor: '#ea580c',     // Orange
      negativeColor: '#be185d',     // Pink
      neutralColor: '#92400e',
    },
  },

  minimalist: {
    name: 'minimalist',
    label: '⚪ Minimalist',
    description: 'Clean, minimal. Best for: Data, Focus',
    colors: {
      primaryColor: '#404040',      // Dark gray
      cardBackgroundColor: '#ffffff',
      canvasBackgroundColor: '#fafafa',
      textColorTitle: '#000000',
      textColorValue: '#262626',
      textColorSub: '#737373',
      positiveColor: '#171717',     // Almost black
      negativeColor: '#737373',     // Gray
      neutralColor: '#a3a3a3',
    },
  },
};

/**
 * Apply a theme to global config
 * Returns new GlobalConfig with theme colors applied
 */
export const applyTheme = (
  currentConfig: GlobalConfig,
  themeName: ThemeName
): GlobalConfig => {
  const theme = THEMES[themeName];

  return {
    ...currentConfig,
    primaryColor: theme.colors.primaryColor,
    cardBackgroundColor: theme.colors.cardBackgroundColor,
    canvasBackgroundColor: theme.colors.canvasBackgroundColor,
    textColorTitle: theme.colors.textColorTitle,
    textColorValue: theme.colors.textColorValue,
    textColorSub: theme.colors.textColorSub,
    positiveColor: theme.colors.positiveColor,
    negativeColor: theme.colors.negativeColor,
    neutralColor: theme.colors.neutralColor,
  };
};

/**
 * Get all available themes
 */
export const getAvailableThemes = (): Theme[] => {
  return Object.values(THEMES);
};
