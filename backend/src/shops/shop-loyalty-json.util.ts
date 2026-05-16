export type PreorderPointsBasis = 'paid_amount' | 'total_amount';

export type ShopLoyaltyResolved = {
  vnd_per_point: number;
  preorder_points_basis: PreorderPointsBasis;
};

const DEFAULTS: ShopLoyaltyResolved = {
  vnd_per_point: 1000,
  preorder_points_basis: 'paid_amount',
};

/** Reads `Shop.loyalty_json` with safe defaults for pre-order point conversion. */
export function parseShopLoyaltyJson(raw: unknown): ShopLoyaltyResolved {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...DEFAULTS };
  }
  const o = raw as Record<string, unknown>;
  let vnd_per_point = DEFAULTS.vnd_per_point;
  if (typeof o.vnd_per_point === 'number' && Number.isInteger(o.vnd_per_point) && o.vnd_per_point >= 1) {
    vnd_per_point = o.vnd_per_point;
  }
  let preorder_points_basis = DEFAULTS.preorder_points_basis;
  if (o.preorder_points_basis === 'paid_amount' || o.preorder_points_basis === 'total_amount') {
    preorder_points_basis = o.preorder_points_basis;
  }
  return { vnd_per_point, preorder_points_basis };
}
