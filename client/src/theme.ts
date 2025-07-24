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
    fontFamily: ['Montserrat', 'system-ui', 'sans-serif'].join(','),
    h1: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
    },
    h2: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
    },
    h3: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
    },
    h4: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
    },
    h5: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
    },
    h6: {
      fontFamily: 'Dancing Script, cursive', // Replace with Google Font
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
