import { Eye } from 'lucide-react';
import { SHOP_STAFF_READONLY_BANNER_TEXT } from '../../utils/shopStaffReadOnly';

export function ShopStaffReadOnlyBanner() {
  return (
    <div
      role="status"
      data-testid="shop-staff-readonly-banner"
      className="border-b border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <Eye size={16} className="shrink-0 text-amber-700" strokeWidth={2.25} aria-hidden />
        <span>{SHOP_STAFF_READONLY_BANNER_TEXT}</span>
      </div>
    </div>
  );
}
