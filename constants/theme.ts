/**
 * SplitIt! — motyw wizualny.
 * Ciemny, "fintech premium" styl inspirowany Apple Pay / Revolut.
 */

export const colors = {
  // Tła
  background: '#0B0C10',
  backgroundElevated: '#15161C',
  card: '#1B1D25',
  cardBorder: 'rgba(255,255,255,0.06)',

  // Tekst
  textPrimary: '#F5F6FA',
  textSecondary: '#9A9DAE',
  textTertiary: '#5F6273',

  // Akcenty
  accent: '#6C6CE5',
  accentSecondary: '#4ECDC4',
  accentGradient: ['#6C6CE5', '#5B8DEF'] as const,

  // Status
  danger: '#FF5C7A',
  dangerSoft: 'rgba(255,92,122,0.12)',
  success: '#4ECDC4',
  warning: '#FFC66D',

  // Divider
  divider: 'rgba(255,255,255,0.08)',
};

// Paleta ładnych, stonowanych kolorów przypisywanych osobom.
export const personColorPalette = [
  '#5B8DEF', // niebieski
  '#FF6B9D', // róż
  '#4ECDC4', // turkus
  '#FFC66D', // musztardowy
  '#9B8CFF', // fiolet
  '#FF8C6B', // koral
  '#6EDCA0', // mięta
  '#FF6B6B', // czerwony
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  round: 999,
};

export const typography = {
  receiptTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  receiptSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  footerName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  footerAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
};
