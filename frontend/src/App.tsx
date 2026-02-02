import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/admin/LoginPage';
import { ItemsPage } from './pages/admin/ItemsPage';
import { ItemDetailPage } from './pages/admin/ItemDetailPage';
import { AiImportPage } from './pages/admin/AiImportPage';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { PublicItemDetailPage } from './pages/PublicItemDetailPage';
import { ContactPage } from './pages/ContactPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><PublicCatalogPage /></Layout>} />
            <Route path="/items/:id" element={<Layout><PublicItemDetailPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/items/import"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AiImportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
