import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ROUTES } from "../../config/routes";
import { apiClient } from "../../api/client";
import { usePublicShopContext } from "../../hooks/usePublicShopContext";
import { Gallery } from "../../components/Gallery";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useViewportWidth } from "../../hooks/useViewportWidth";
import { ItemMediaSection } from "./sections/ItemMediaSection";
import { ItemInfoSection } from "./sections/ItemInfoSection";
import { RelatedItemsSection } from "./sections/RelatedItemsSection";

interface SpinFrame {
  id: string;
  frame_index: number;
  image_url: string;
  thumbnail_url?: string | null;
}

interface ItemImage {
  id: string;
  url: string;
  thumbnail_url?: string | null;
}

const MOBILE_SPINNER_MIN_SIZE = 220;
const MOBILE_SPINNER_MAX_SIZE = 320;
// 84px = page padding + panel breathing room to keep the spinner from touching card edges on phones.
const MOBILE_SPINNER_HORIZONTAL_PADDING = 84;

export const PublicItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { effectiveShopId, shopContextReady, publicApiShopReady } =
    usePublicShopContext();
  const isMobile = useIsMobile();
  const viewportWidth = useViewportWidth();

  const shopQuery = useMemo(
    () =>
      effectiveShopId ? `?shop_id=${encodeURIComponent(effectiveShopId)}` : "",
    [effectiveShopId],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-item", id, effectiveShopId],
    queryFn: async () => {
      const path =
        effectiveShopId.length > 0
          ? `/public/items/${id}?shop_id=${encodeURIComponent(effectiveShopId)}`
          : `/public/items/${id}`;
      const response = await apiClient.get(path);
      return response.data;
    },
    enabled: !!id && shopContextReady && publicApiShopReady,
  });

  // Response structure: {item, images, spinner} (already unwrapped by apiClient)
  const { item, images: imagesData, spinner } = data || {};
  const images = useMemo(() => (imagesData || []) as ItemImage[], [imagesData]);
  const spinnerFrames = useMemo(
    () =>
      (spinner?.frames || []).filter((frame: SpinFrame) =>
        Boolean(frame?.image_url),
      ),
    [spinner],
  );

  if (isLoading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Đang tải...</div>
    );
  if (error) {
    console.error("Error loading item:", error);
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Sản phẩm không tồn tại hoặc không được công khai.
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Sản phẩm không tồn tại hoặc không được công khai.
        </p>
      </div>
    );
  }

  const pagePadding = isMobile ? "20px 12px 32px" : "40px 20px";
  const panelPadding = isMobile ? "18px" : "24px";
  const mobileSpinnerSize = Math.max(
    MOBILE_SPINNER_MIN_SIZE,
    Math.min(
      MOBILE_SPINNER_MAX_SIZE,
      viewportWidth - MOBILE_SPINNER_HORIZONTAL_PADDING,
    ),
  );

  const isFromQr = searchParams.get("source") === "qr";

  return (
    <div style={{ padding: pagePadding, maxWidth: "1200px", margin: "0 auto" }}>
      {isFromQr && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#1e40af",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📷</span>
          <span>Bạn đang xem sản phẩm qua mã QR</span>
        </div>
      )}
      {/* Back Button */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => {
            const catalogSearch = searchParams.toString();
            navigate(
              catalogSearch ? `${ROUTES.home}?${catalogSearch}` : ROUTES.home,
            );
          }}
          style={{
            padding: isMobile ? "12px 16px" : "10px 20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "white",
            color: "#333",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
            e.currentTarget.style.borderColor = "#007bff";
            e.currentTarget.style.transform = "translateX(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Header Section */}
      <div style={{ marginBottom: isMobile ? "28px" : "40px" }}>
        <h1
          style={{
            fontSize: isMobile ? "28px" : "36px",
            fontWeight: "700",
            color: "#1a1a1a",
            margin: "0 0 16px 0",
            lineHeight: "1.2",
            letterSpacing: "-0.5px",
          }}
        >
          {item.name}
        </h1>

        {item.description && (
          <p
            style={{
              fontSize: isMobile ? "16px" : "18px",
              color: "#666",
              lineHeight: "1.8",
              margin: "0 0 24px 0",
            }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: isMobile ? "20px" : "40px",
          marginBottom: isMobile ? "28px" : "40px",
        }}
      >
        {/* Left Column - Product Info */}
        <ItemInfoSection item={item} isMobile={isMobile} panelPadding={panelPadding} />

        {/* Right Column - Images/Spinner */}
        <ItemMediaSection
          itemName={item.name}
          images={images}
          spinnerFrames={spinnerFrames}
          isMobile={isMobile}
          mobileSpinnerSize={mobileSpinnerSize}
          panelPadding={panelPadding}
        />
      </div>

      {/* Full Gallery Section */}
      <Gallery images={images} itemName={item.name} />

      {/* Related Items Section */}
      <RelatedItemsSection
        currentItemId={item.id}
        carBrand={item.car_brand}
        modelBrand={item.model_brand}
        effectiveShopId={effectiveShopId}
        shopSearch={shopQuery}
        shopContextReady={shopContextReady}
        publicApiShopReady={publicApiShopReady}
      />
    </div>
  );
};
