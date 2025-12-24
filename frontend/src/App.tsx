import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoginPage } from './pages/admin/LoginPage';
import { ItemsPage } from './pages/admin/ItemsPage';
import { ItemDetailPage } from './pages/admin/ItemDetailPage';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { PublicItemDetailPage } from './pages/PublicItemDetailPage';

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
            <Route path="/" element={<PublicCatalogPage />} />
            <Route path="/items/:id" element={<PublicItemDetailPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/items"
              element={
                <ProtectedRoute>
                  <ItemsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items/:id"
              element={
                <ProtectedRoute>
                  <ItemDetailPage />
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
