import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ShopProvider } from './contexts/ShopContext.tsx';
import { ROUTES } from './config/routes';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/admin/LoginPage';
import { ItemsPage } from './pages/admin/ItemsPage';
import { ItemDetailPage } from './pages/admin/ItemDetailPage';
import { AiImportPage } from './pages/admin/AiImportPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { FacebookPostsPage } from './pages/admin/FacebookPostsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import ShopsPage from './pages/admin/ShopsPage';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { PublicItemDetailPage } from './pages/PublicItemDetailPage';
import { ContactPage } from './pages/ContactPage';
import { PreOrdersPage } from './pages/admin/PreOrdersPage';
import { CreatePreOrderPage } from './pages/admin/preorders/CreatePreOrderPage';
import { PreOrderManagementPage } from './pages/admin/preorders/PreOrderManagementPage';
import { PreOrdersPage as PublicPreOrdersPage } from './pages/public/PreOrdersPage';
import { MyOrdersPage } from './pages/public/MyOrdersPage';

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
        <ShopProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.home} element={<Layout><PublicCatalogPage /></Layout>} />
              <Route path={ROUTES.preorders} element={<Layout><PublicPreOrdersPage /></Layout>} />
              <Route path={ROUTES.myOrders} element={<Layout><MyOrdersPage /></Layout>} />
              <Route path="/items/:id" element={<Layout><PublicItemDetailPage /></Layout>} />
              <Route path={ROUTES.contact} element={<Layout><ContactPage /></Layout>} />
              <Route path={ROUTES.adminLogin} element={<LoginPage />} />
              <Route
                path={ROUTES.admin.preorders}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PreOrdersPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.preordersCreate}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreatePreOrderPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.preordersManage}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PreOrderManagementPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.itemsImport}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AiImportPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.categories}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CategoriesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.items}
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
              <Route
                path={ROUTES.admin.reports}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.facebookPosts}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FacebookPostsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.admin.shops}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ShopsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
            </Routes>
          </BrowserRouter>
        </ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
