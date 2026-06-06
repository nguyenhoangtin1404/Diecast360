import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../api/client";
import type { ItemImage } from "../types";

interface Props {
  id: string;
  isMobile: boolean;
  images: ItemImage[];
  uploadingImages: boolean;
  setUploadingImages: (v: boolean) => void;
  handleUploadImage: (file: File, isCover?: boolean) => Promise<void>;
}

export function ItemImagesSection({
  id,
  isMobile,
  images,
  uploadingImages,
  setUploadingImages,
  handleUploadImage,
}: Props) {
  const queryClient = useQueryClient();

  return (
    <>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#1a1a1a",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        Hình ảnh
      </h2>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          multiple
          accept="image/*"
          aria-label="Upload item images"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
            color: "#1a1a1a",
            backgroundColor: "#fff",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#007bff";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(0, 123, 255, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.boxShadow = "none";
          }}
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              setUploadingImages(true);
              try {
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  await handleUploadImage(
                    file,
                    images.length === 0 && i === 0,
                  );
                }
              } catch (error) {
                console.error("Error uploading images:", error);
                alert("Có lỗi khi upload ảnh");
              } finally {
                setUploadingImages(false);
                e.target.value = "";
              }
            }
          }}
          disabled={uploadingImages}
        />
        {uploadingImages && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: "#f0f7ff",
              borderRadius: "8px",
              color: "#007bff",
              fontSize: "14px",
            }}
          >
            Đang upload ảnh, vui lòng đợi...
          </div>
        )}
      </div>
      {images.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "150px" : "200px"}, 1fr))`,
            gap: "15px",
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                border: img.is_cover
                  ? "2px solid #007bff"
                  : "1px solid #ddd",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={img.thumbnail_url || img.url}
                  alt="Item"
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== img.url) {
                      target.src = img.url;
                    }
                  }}
                />
                {img.is_cover && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Ảnh đại diện
                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                Thứ tự: {img.display_order + 1}
              </div>
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={async () => {
                    try {
                      await apiClient.patch(
                        `/items/${id}/images/${img.id}`,
                        { is_cover: true },
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["item", id],
                      });
                    } catch (error) {
                      console.error(
                        "Error setting cover image:",
                        error,
                      );
                      alert("Có lỗi khi đặt ảnh đại diện");
                    }
                  }}
                  disabled={img.is_cover}
                  style={{
                    padding: "6px 12px",
                    cursor: img.is_cover ? "not-allowed" : "pointer",
                    backgroundColor: img.is_cover ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    flex: 1,
                  }}
                >
                  {img.is_cover
                    ? "Đã là ảnh đại diện"
                    : "Đặt làm ảnh đại diện"}
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Bạn có chắc muốn xóa ảnh này?")) {
                      try {
                        await apiClient.delete(
                          `/items/${id}/images/${img.id}`,
                        );
                        queryClient.invalidateQueries({
                          queryKey: ["item", id],
                        });
                      } catch (error) {
                        console.error("Error deleting image:", error);
                        alert("Có lỗi khi xóa ảnh");
                      }
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontSize: "12px",
                    flex: 1,
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#666",
            border: "1px dashed #ddd",
            borderRadius: "8px",
          }}
        >
          <p>Chưa có ảnh nào được upload.</p>
          <p style={{ fontSize: "14px", marginTop: "8px" }}>
            Sử dụng nút bên trên để upload ảnh cho sản phẩm.
          </p>
        </div>
      )}
    </>
  );
}
