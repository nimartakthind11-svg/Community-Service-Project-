export const Colors = {
  primary: '#B8234D',
  primaryDark: '#93183B',
  primaryLight: '#FCE4EC',
  primaryMuted: '#E07A94',

  background: '#FFF5F6',
  surface: '#FFFFFF',
  surfaceTint: '#FFEBF1',
  surfaceMuted: '#F8EFF1',

  border: '#F4D6DD',
  borderStrong: '#E5B8C4',
  borderLight: '#FAEAEE',

  text: '#2D151E',
  textSecondary: '#7E646E',
  textMuted: '#A8919A',
  textInverse: '#FFFFFF',
  textAccent: '#B8234D',

  chipBackground: '#FDE8EF',
  chipText: '#B8234D',
  chipBorder: '#F7CCD7',

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#F2D8DF',
  tabBarActivePill: '#FDE8EF',
  tabBarActive: '#B8234D',
  tabBarInactive: '#967C86',

  success: '#12B76A',
  successLight: '#ECFDF3',
  warning: '#F79009',
  warningLight: '#FFFAEB',
  danger: '#F04438',
  dangerLight: '#FEF3F2',

  overlay: 'rgba(45, 21, 30, 0.45)',
} as const;

export const Typography = {
  family: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  sizes: {
    display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
    title1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
    title2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
    title3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
    headline: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    callout: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    subhead: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
    footnote: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
    caption: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
    pill: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.5 },
  },
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const Radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const Shadows = {
  soft: {
    shadowColor: '#8C324E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: '#8C324E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  floating: {
    shadowColor: '#8C324E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const Layout = {
  minTouchTarget: 44,
  maxContentWidth: 640,
  tabBarHeight: 64,
  headerHeight: 52,
} as const;
