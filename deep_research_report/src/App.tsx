import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ReportProvider } from '@/context/ReportContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import ProgressPage from '@/pages/ProgressPage';
import ReportPage from '@/pages/ReportPage';

/**
 * MUI theme configuration with Chinese-optimized typography and blue primary palette.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: [
      '"PingFang SC"',
      '"Microsoft YaHei"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

/**
 * Root application component.
 * Sets up routing, theme, and global report state provider.
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReportProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ReportProvider>
    </ThemeProvider>
  );
}

export default App;
