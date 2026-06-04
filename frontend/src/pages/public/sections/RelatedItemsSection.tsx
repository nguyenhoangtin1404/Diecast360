import { ItemCard } from "../../../components/catalog/ItemCard";
import { useIsMobile } from "../../../hooks/useIsMobile";
import type { RelatedItem } from "../../../types/item.types";
import { useRelatedItems } from "../hooks/useRelatedItems";

interface RelatedItemsSectionProps {
  currentItemId: string;
  carBrand?: string | null;
  modelBrand?: string | null;
  effectiveShopId: string;
  shopSearch: string;
  shopContextReady: boolean;
  publicApiShopReady: boolean;
}

export const RelatedItemsSection = ({
  currentItemId,
  carBrand,
  modelBrand,
  effectiveShopId,
  shopSearch,
  shopContextReady,
  publicApiShopReady,
}: RelatedItemsSectionProps) => {
  const isMobile = useIsMobile();
  const { finalItems, isLoading } = useRelatedItems({
    currentItemId,
    carBrand,
    modelBrand,
    effectiveShopId,
    shopContextReady,
    publicApiShopReady,
  });

  if (isLoading) return null;
  if (finalItems.length === 0) return null;

  return (
    <div
      style={{
        marginTop: isMobile ? "40px" : "60px",
        borderTop: "1px solid #eee",
        paddingTop: isMobile ? "24px" : "40px",
      }}
    >
      <h2
        style={{
          fontSize: isMobile ? "22px" : "24px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: "24px",
        }}
      >
        Sản phẩm liên quan
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "160px" : "200px"}, 1fr))`,
          gap: isMobile ? "14px" : "20px",
        }}
      >
        {finalItems.map((item: RelatedItem, index: number) => (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            shopSearch={shopSearch}
          />
        ))}
      </div>
    </div>
  );
};
