import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReportProvider } from '@/context/ReportContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import ReportsListPage from '@/pages/ReportsListPage';
import ProgressPage from '@/pages/ProgressPage';
import ReportPage from '@/pages/ReportPage';
import KnowledgePage from '@/pages/KnowledgePage';

/**
 * Root application component.
 * Uses pure CSS for styling via CSS variables (Stripe dark-first tokens).
 * MUI is kept only for specific components that still depend on it.
 */
function App() {
  return (
    <ReportProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/reports" element={<ReportsListPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ReportProvider>
  );
}

export default App;
