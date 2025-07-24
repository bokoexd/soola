import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    customRed: Palette['primary'];
  }
  interface PaletteOptions {
    customRed?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#0267A1', // Blue
    },
    secondary: {
      main: '#FCB70F', // Yellow
    },
    error: {
      main: '#D33824', // Red
    },
    background: {
      default: '#F7E5C3', // Light Yellow/Cream
      paper: '#F7E5C3', // Light Yellow/Cream for Paper components
    },
    customRed: {
      main: '#D33824', // Custom Red
    },
  },
  typography: {
    fontFamily: ['Montserrat', 'Aileron', 'sans-serif'].join(','),
    h1: {
      fontFamily: 'More Sugar', // Title font
    },
    h2: {
      fontFamily: 'More Sugar', // Title font
    },
    h3: {
      fontFamily: 'More Sugar', // Title font
    },
    h4: {
      fontFamily: 'More Sugar', // Title font
    },
    h5: {
      fontFamily: 'More Sugar', // Title font
    },
    h6: {
      fontFamily: 'More Sugar', // Title font
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase buttons
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#FCB70F', // Yellow for chips
          color: '#0267A1', // Blue text for chips
        },
      },
    },
  },
});

export default theme;
