import { Spinner360 } from "../../../components/Spinner360/Spinner360";

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

interface ItemMediaSectionProps {
  itemName: string;
  images: ItemImage[];
  spinnerFrames: SpinFrame[];
  isMobile: boolean;
  mobileSpinnerSize: number;
  panelPadding: string;
}

export const ItemMediaSection = ({
  itemName,
  images,
  spinnerFrames,
  isMobile,
  mobileSpinnerSize,
  panelPadding,
}: ItemMediaSectionProps) => {
  const hasSpinner = spinnerFrames.length > 0;

  if (hasSpinner) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: panelPadding,
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: "20px",
            color: "#1a1a1a",
            paddingBottom: "12px",
            borderBottom: "2px solid #f0f0f0",
          }}
        >
          360° View
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: isMobile ? "12px" : "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "12px",
          }}
        >
          <Spinner360
            frames={spinnerFrames.map((f: SpinFrame) => ({
              id: f.id,
              image_url: f.image_url,
              thumbnail_url: f.thumbnail_url ?? undefined,
              frame_index: f.frame_index,
            }))}
            autoplay={false}
            width={isMobile ? mobileSpinnerSize : 500}
            height={isMobile ? mobileSpinnerSize : 500}
          />
        </div>
      </div>
    );
  }

  if (images && images.length > 0) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: panelPadding,
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: "20px",
            color: "#1a1a1a",
            paddingBottom: "12px",
            borderBottom: "2px solid #f0f0f0",
          }}
        >
          Hình ảnh
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {images.slice(0, 4).map((img) => (
            <div
              key={img.id}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                aspectRatio: "1",
              }}
            >
              <img
                src={img.url}
                alt={itemName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
        {images.length > 4 && (
          <div
            style={{
              marginTop: "12px",
              textAlign: "center",
              fontSize: "14px",
              color: "#666",
            }}
          >
            +{images.length - 4} hình ảnh khác
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: panelPadding,
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #f1f5f9",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#1a1a1a",
        }}
      >
        Hình ảnh sản phẩm
      </h2>
      <p
        style={{
          color: "#64748b",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        Sản phẩm hiện chưa có ảnh hiển thị. Vui lòng quay lại sau.
      </p>
    </div>
  );
};
