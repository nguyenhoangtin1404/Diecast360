import type { FC, ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { publicRouteNeedsCatalogShopContact } from '../../config/routes';
import { usePublicShopContext } from '../../hooks/usePublicShopContext';
import { usePublicShopContact } from '../../hooks/usePublicShopContact';
import type { PublicShopContactResponse } from '../../types/shopContactPublic';

function SpinnerBlock({ caption }: { caption: string }) {
  return (
    <div className="relative min-h-[50vh] px-4 py-16 sm:px-6" role="status" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl">
        <div className="py-16 text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-shop/25 border-t-shop"
            aria-hidden
          />
          <p className="mt-4 text-sm font-medium text-slate-500">{caption}</p>
        </div>
      </div>
    </div>
  );
}

function MissingShopScopePanel() {
  return (
    <div className="relative min-h-[50vh] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900 shadow-corporate-card">
          <p className="font-semibold">Chưa chọn cửa hàng</p>
          <p className="mt-1 text-sm text-amber-800/90">
            Thêm <code className="rounded bg-amber-100/80 px-1">?shop_id=</code> vào URL (UUID hoặc slug cửa hàng), hoặc cấu hình biến build{' '}
            <code className="rounded bg-amber-100/80 px-1">VITE_PUBLIC_CATALOG_SHOP_ID</code> cho bản triển khai một-cửa-hàng.
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicShopContactErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="relative min-h-[50vh] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800 shadow-corporate-card">
          <p className="font-semibold">Không tải được cấu hình cửa hàng</p>
          <p className="mt-1 text-sm text-rose-700/90">Vui lòng thử lại.</p>
          <button
            type="button"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            onClick={onRetry}
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Blocks public main content until catalog shop context is ready and
 * `GET /public/shops/:id/contact` has succeeded (branding + contact for header/theme).
 * Skipped for `/preorders` and `/my-orders`, which resolve shop independently.
 */
export const PublicShopMainGate: FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const needsCatalogContact = publicRouteNeedsCatalogShopContact(pathname);
  const { shopContextReady, publicApiShopReady } = usePublicShopContext();
  const contactQuery: UseQueryResult<PublicShopContactResponse> = usePublicShopContact(needsCatalogContact);

  if (!needsCatalogContact) {
    return <>{children}</>;
  }

  if (!shopContextReady) {
    return <SpinnerBlock caption="Đang tải…" />;
  }

  if (!publicApiShopReady) {
    return <MissingShopScopePanel />;
  }

  if (contactQuery.isPending) {
    return <SpinnerBlock caption="Đang tải cửa hàng…" />;
  }

  if (contactQuery.isError) {
    return <PublicShopContactErrorPanel onRetry={() => void contactQuery.refetch()} />;
  }

  return <>{children}</>;
};
