export const Theme = {
  colors: {
    bgPage: '#f4f7fc',
    bgSurface: '#ffffff',
    bgSurfaceSoft: '#f8fbff',
    bgSubtle: '#eef3fb',
    
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    
    brand: '#2d6cdf',
    brandDark: '#205bcf',
    brandLight: '#4f84e7',
    brandAccent: '#6C63FF', // Purple from the PDF/web visualizer
    
    success: '#0f766e',
    successBg: '#e6f4f2',
    warning: '#b45309',
    danger: '#be123c',
    dangerBg: '#ffebe6',
    
    border: '#dbe5f4',
    borderStrong: '#c8d8f1',
  },
  fonts: {
    // Rely on system fonts for maximum platform compatibility
    sans: 'System',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
  },
  shadow: {
    sm: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    md: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  }
};
