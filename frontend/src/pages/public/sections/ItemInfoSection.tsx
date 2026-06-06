interface Item {
  status: string;
  car_brand?: string | null;
  model_brand?: string | null;
  condition?: string | null;
  scale?: string | null;
  brand?: string | null;
  price?: number | null;
  original_price?: number | null;
}

interface ItemInfoSectionProps {
  item: Item;
  isMobile: boolean;
  panelPadding: string;
}

export const ItemInfoSection = ({
  item,
  isMobile,
  panelPadding,
}: ItemInfoSectionProps) => {
  return (
    <div>
      <div
        style={{
          backgroundColor: "#fff",
          padding: panelPadding,
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a1a1a",
            margin: "0 0 20px 0",
            paddingBottom: "12px",
            borderBottom: "2px solid #f0f0f0",
          }}
        >
          Thông tin sản phẩm
        </h2>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: "15px", color: "#666", fontWeight: "500" }}
            >
              Trạng thái:
            </span>
            <span
              style={{
                padding: "6px 12px",
                backgroundColor:
                  item.status === "con_hang"
                    ? "#d4edda"
                    : item.status === "giu_cho"
                      ? "#fff3cd"
                      : item.status === "preorder"
                        ? "#cfe2ff"
                        : "#f8d7da",
                color:
                  item.status === "con_hang"
                    ? "#155724"
                    : item.status === "giu_cho"
                      ? "#856404"
                      : item.status === "preorder"
                        ? "#084298"
                        : "#721c24",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {item.status === "con_hang"
                ? "Còn hàng"
                : item.status === "giu_cho"
                  ? "Giữ chỗ"
                  : item.status === "preorder"
                    ? "Pre-order"
                    : "Đã bán"}
            </span>
          </div>

          {/* Car Brand */}
          {item.car_brand && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Hãng xe:
              </span>
              <span
                style={{
                  fontSize: "15px",
                  color: "#1a1a1a",
                  fontWeight: "600",
                }}
              >
                {item.car_brand}
              </span>
            </div>
          )}

          {/* Model Brand */}
          {item.model_brand && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Hãng mô hình:
              </span>
              <span
                style={{
                  fontSize: "15px",
                  color: "#1a1a1a",
                  fontWeight: "600",
                }}
              >
                {item.model_brand}
              </span>
            </div>
          )}

          {/* Condition */}
          {item.condition && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Tình trạng:
              </span>
              <span
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    item.condition === "new" ? "#e7f3ff" : "#fff4e6",
                  color: item.condition === "new" ? "#0066cc" : "#cc6600",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {item.condition === "new" ? "Mới" : "Cũ"}
              </span>
            </div>
          )}

          {/* Scale */}
          {item.scale && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Tỷ lệ:
              </span>
              <span
                style={{
                  fontSize: "15px",
                  color: "#1a1a1a",
                  fontWeight: "600",
                }}
              >
                {item.scale}
              </span>
            </div>
          )}

          {/* Brand */}
          {item.brand && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                Thương hiệu:
              </span>
              <span
                style={{
                  fontSize: "15px",
                  color: "#1a1a1a",
                  fontWeight: "600",
                }}
              >
                {item.brand}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Price Section */}
      {(item.price != null || item.original_price != null) && (
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
              color: "#1a1a1a",
              margin: "0 0 20px 0",
              paddingBottom: "12px",
              borderBottom: "2px solid #f0f0f0",
            }}
          >
            Giá
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {item.original_price != null && (
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#999",
                    marginBottom: "4px",
                  }}
                >
                  Giá gốc:
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: "#999",
                    textDecoration: "line-through",
                    fontWeight: "500",
                  }}
                >
                  {item.original_price.toLocaleString("vi-VN")} đ
                </div>
              </div>
            )}
            {item.price != null && (
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Giá bán:
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "28px" : "32px",
                    color: "#007bff",
                    fontWeight: "700",
                  }}
                >
                  {item.price.toLocaleString("vi-VN")} đ
                </div>
                {item.original_price != null &&
                  item.original_price > item.price && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "6px 12px",
                        backgroundColor: "#d4edda",
                        color: "#155724",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      Giảm{" "}
                      {(
                        (1 - item.price / item.original_price) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
