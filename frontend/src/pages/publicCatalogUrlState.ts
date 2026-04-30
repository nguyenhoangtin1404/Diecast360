import { sanitizeShopIdQueryParam } from '../utils/sanitizeShopId';

export type CatalogSortBy = 'name' | 'price' | 'created_at';
export type CatalogSortOrder = 'asc' | 'desc';

export interface CatalogUrlState {
  /** Sanitized public shop scope; empty = omit from URL. */
  shopId: string;
  search: string;
  carBrand: string | null;
  modelBrand: string | null;
  condition: 'new' | 'old' | null;
  sortBy: CatalogSortBy;
  sortOrder: CatalogSortOrder;
}

const DEFAULT_SORT_BY: CatalogSortBy = 'created_at';
const DEFAULT_SORT_ORDER: CatalogSortOrder = 'desc';
const MAX_SEARCH_LENGTH = 200;

const toNullable = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const parseSortBy = (raw: string | null): CatalogSortBy => {
  if (raw === 'name' || raw === 'price' || raw === 'created_at') {
    return raw;
  }

  return DEFAULT_SORT_BY;
};

export const parseSortOrder = (raw: string | null): CatalogSortOrder => {
  if (raw === 'asc' || raw === 'desc') {
    return raw;
  }

  return DEFAULT_SORT_ORDER;
};

export const parseCondition = (raw: string | null): 'new' | 'old' | null => {
  if (raw === 'new' || raw === 'old') {
    return raw;
  }

  return null;
};

export const parseCatalogUrlState = (searchParams: URLSearchParams): CatalogUrlState => {
  const rawSearch = searchParams.get('q');

  return {
    shopId: sanitizeShopIdQueryParam(searchParams.get('shop_id')),
    search: (rawSearch?.trim() ?? '').slice(0, MAX_SEARCH_LENGTH),
    carBrand: toNullable(searchParams.get('car_brand')),
    modelBrand: toNullable(searchParams.get('model_brand')),
    condition: parseCondition(searchParams.get('condition')),
    sortBy: parseSortBy(searchParams.get('sort_by')),
    sortOrder: parseSortOrder(searchParams.get('sort_order')),
  };
};

export const buildCatalogSearchParams = (state: CatalogUrlState): URLSearchParams => {
  const params = new URLSearchParams();
  const trimmedSearch = state.search.trim();

  if (state.shopId) {
    params.set('shop_id', state.shopId);
  }

  if (trimmedSearch) {
    params.set('q', trimmedSearch);
  }

  if (state.carBrand) {
    params.set('car_brand', state.carBrand);
  }

  if (state.modelBrand) {
    params.set('model_brand', state.modelBrand);
  }

  if (state.condition) {
    params.set('condition', state.condition);
  }

  if (state.sortBy !== DEFAULT_SORT_BY) {
    params.set('sort_by', state.sortBy);
  }

  if (state.sortOrder !== DEFAULT_SORT_ORDER) {
    params.set('sort_order', state.sortOrder);
  }

  return params;
};
