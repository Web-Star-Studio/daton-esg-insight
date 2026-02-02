/**
 * Daton Design System - Design Tokens
 * 
 * Documentação formal dos tokens de design para uso consistente
 * em toda a aplicação.
 * 
 * NOTA: Estes tokens são referência de documentação.
 * Os valores reais são definidos em index.css como CSS variables
 * e em tailwind.config.ts para uso com classes Tailwind.
 */

export const DESIGN_TOKENS = {
  // ============ CORES SEMÂNTICAS ============
  colors: {
    primary: {
      DEFAULT: 'hsl(151, 100%, 37%)', // #00bf63 - Verde Daton
      light: 'hsl(151, 60%, 85%)',
      dark: 'hsl(151, 100%, 32%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    secondary: {
      DEFAULT: 'hsl(210, 17%, 96%)',
      foreground: 'hsl(0, 0%, 9%)',
    },
    destructive: {
      DEFAULT: 'hsl(0, 84%, 60%)', // Vermelho
      light: 'hsl(0, 84%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    success: {
      DEFAULT: 'hsl(151, 100%, 37%)', // Verde
      light: 'hsl(151, 60%, 90%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    warning: {
      DEFAULT: 'hsl(38, 92%, 50%)', // Laranja
      light: 'hsl(38, 92%, 90%)',
      foreground: 'hsl(0, 0%, 9%)',
    },
    info: {
      DEFAULT: 'hsl(199, 89%, 48%)', // Azul
      light: 'hsl(199, 89%, 90%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    neutral: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 96%)',
      200: 'hsl(0, 0%, 91%)',
      300: 'hsl(0, 0%, 83%)',
      400: 'hsl(0, 0%, 64%)',
      500: 'hsl(0, 0%, 45%)',
      600: 'hsl(0, 0%, 32%)',
      700: 'hsl(0, 0%, 21%)',
      800: 'hsl(0, 0%, 9%)',
      900: 'hsl(0, 0%, 4%)',
    },
  },

  // ============ TIPOGRAFIA ============
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ============ ESPAÇAMENTO (8px Grid) ============
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },

  // ============ BORDER RADIUS ============
  borderRadius: {
    none: '0',
    sm: '0.5rem',     // 8px - Inputs pequenos
    DEFAULT: '0.75rem', // 12px - Cards, botões
    lg: '1rem',       // 16px - Modais
    full: '9999px',   // Circular - Avatars, badges
  },

  // ============ SOMBRAS ============
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },

  // ============ TRANSIÇÕES ============
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ============ BREAKPOINTS ============
  breakpoints: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1366px',
    '2xl': '1920px',
  },

  // ============ Z-INDEX ============
  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 150,
    popover: 200,
    tooltip: 250,
    toast: 300,
  },
} as const;

// Tipos para autocomplete
export type ColorToken = keyof typeof DESIGN_TOKENS.colors;
export type SpacingToken = keyof typeof DESIGN_TOKENS.spacing;
export type ShadowToken = keyof typeof DESIGN_TOKENS.shadows;
