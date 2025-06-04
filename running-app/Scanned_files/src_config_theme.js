// Thème principal de l'application

// Couleurs
export const colors = {
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    primaryLight: '#C8E6C9',
    
    secondary: '#FF9800',
    secondaryDark: '#F57C00',
    secondaryLight: '#FFE0B2',
    
    danger: '#F44336',
    warning: '#FFC107',
    success: '#4CAF50',
    info: '#2196F3',
    
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9E9E9E',
      hint: '#9E9E9E',
      white: 'white',
    },
    
    background: {
      default: '#F5F5F5',
      paper: 'white',
      dark: '#212121',
    },
    
    border: '#EEEEEE',
    divider: '#EEEEEE',
    
    // Status bar
    statusBar: '#388E3C',
  };
  
  // Typographie
  export const typography = {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
      huge: 32,
    },
    lineHeight: {
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      xxl: 32,
    },
  };
  
  // Espacement
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  // Bordures arrondies
  export const borderRadius = {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 999,
  };
  
  // Ombres
  export const shadows = {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  };
  
  // Styles communs
  export const commonStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: spacing.md,
    },
    card: {
      backgroundColor: colors.background.paper,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  };
  
  // Thème sombre (exemple, à implémenter si nécessaire)
  export const darkTheme = {
    colors: {
      ...colors,
      primary: '#66BB6A',
      primaryDark: '#43A047',
      primaryLight: '#A5D6A7',
      
      text: {
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        disabled: '#999999',
        hint: '#999999',
        white: 'white',
      },
      
      background: {
        default: '#121212',
        paper: '#1E1E1E',
        dark: '#000000',
      },
      
      border: '#333333',
      divider: '#333333',
    },
  };
  
  // Thème principal par défaut
  const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    commonStyles,
  };
  
  export default theme;