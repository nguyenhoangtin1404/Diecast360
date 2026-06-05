import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import type { RelatedItem } from "../../../types/item.types";

interface UseRelatedItemsParams {
  currentItemId: string;
  carBrand?: string | null;
  modelBrand?: string | null;
  effectiveShopId: string;
  shopContextReady: boolean;
  publicApiShopReady: boolean;
}

export function useRelatedItems({
  currentItemId,
  carBrand,
  modelBrand,
  effectiveShopId,
  shopContextReady,
  publicApiShopReady,
}: UseRelatedItemsParams) {
  const shouldQueryCar = Boolean(currentItemId && carBrand);
  const shouldQueryModel = Boolean(currentItemId && modelBrand);

  // Query 1: Items with same Car Brand
  const {
    data: carData,
    isLoading: carLoading,
    isFetched: carFetched,
  } = useQuery({
    queryKey: ["related-items-car", currentItemId, carBrand, effectiveShopId],
    queryFn: async () => {
      if (!carBrand) return { items: [], pagination: { total: 0 } };

      const params = new URLSearchParams({
        page_size: "6",
        sort_by: "created_at",
        sort_order: "desc",
        car_brand: carBrand,
      });
      if (effectiveShopId) {
        params.set("shop_id", effectiveShopId);
      }
      const response = await apiClient.get(
        `/public/items?${params.toString()}`,
      );
      return response.data;
    },
    enabled: shopContextReady && publicApiShopReady && shouldQueryCar,
  });

  // Query 2: Items with same Model Brand
  const {
    data: modelData,
    isLoading: modelLoading,
    isFetched: modelFetched,
  } = useQuery({
    queryKey: [
      "related-items-model",
      currentItemId,
      modelBrand,
      effectiveShopId,
    ],
    queryFn: async () => {
      if (!modelBrand) return { items: [], pagination: { total: 0 } };

      const params = new URLSearchParams({
        page_size: "6",
        sort_by: "created_at",
        sort_order: "desc",
        model_brand: modelBrand,
      });
      if (effectiveShopId) {
        params.set("shop_id", effectiveShopId);
      }
      const response = await apiClient.get(
        `/public/items?${params.toString()}`,
      );
      return response.data;
    },
    enabled: shopContextReady && publicApiShopReady && shouldQueryModel,
  });

  const uniqueSeedCount = useMemo(() => {
    const unique = new Set<string>();
    const addItems = (items: RelatedItem[]) => {
      items.forEach((item) => {
        if (item.id !== currentItemId) {
          unique.add(item.id);
        }
      });
    };

    addItems(carData?.items || []);
    addItems(modelData?.items || []);

    return unique.size;
  }, [carData, modelData, currentItemId]);

  const carQuerySettled = !shouldQueryCar || carFetched;
  const modelQuerySettled = !shouldQueryModel || modelFetched;
  const readyForFallbackQuery = carQuerySettled && modelQuerySettled;

  // Query 3: Fallback to recent items
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["related-items-recent", currentItemId, effectiveShopId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page_size: "6",
        sort_by: "created_at",
        sort_order: "desc",
      });
      if (effectiveShopId) {
        params.set("shop_id", effectiveShopId);
      }
      const response = await apiClient.get(
        `/public/items?${params.toString()}`,
      );
      return response.data;
    },
    enabled:
      shopContextReady &&
      publicApiShopReady &&
      !!currentItemId &&
      readyForFallbackQuery &&
      uniqueSeedCount < 5,
  });

  const finalItems = useMemo(() => {
    // Collect all candidate items
    const carItems = carData?.items || [];
    const modelItems = modelData?.items || [];
    const recentItems = recentData?.items || [];

    // Merge strategy: Car > Model > Recent
    // Use a Map to deduplicate by ID
    const uniqueItems = new Map();

    const addItems = (items: RelatedItem[]) => {
      items.forEach((item) => {
        if (item.id !== currentItemId && !uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, item);
        }
      });
    };

    addItems(carItems);
    addItems(modelItems);

    // Only add recent if we still need more items
    if (uniqueItems.size < 5) {
      addItems(recentItems);
    }

    return Array.from(uniqueItems.values()).slice(0, 5);
  }, [carData, modelData, recentData, currentItemId]);

  const isLoading =
    (carLoading && !carData) ||
    (modelLoading && !modelData) ||
    (recentLoading && !recentData);

  return { finalItems, isLoading };
}
