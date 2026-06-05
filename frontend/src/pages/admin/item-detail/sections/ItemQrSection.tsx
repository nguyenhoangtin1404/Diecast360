import { showToast } from "../../../../utils/toast";
import { printQrCode } from "../../../../utils/printQr";
import type { QrData } from "../types";

interface Props {
  id: string | undefined;
  itemName: string;
  isPublic: boolean | undefined;
  isLoadingQr: boolean;
  qrError: string | null;
  qrData: QrData | null;
  setQrError: (v: string | null) => void;
  setQrRetryKey: (fn: (k: number) => number) => void;
}

export function ItemQrSection({
  id,
  itemName,
  isPublic,
  isLoadingQr,
  qrError,
  qrData,
  setQrError,
  setQrRetryKey,
}: Props) {
  return (
    <>
      <h2
        style={{
          marginTop: "40px",
          fontSize: "24px",
          fontWeight: "600",
          color: "#1a1a1a",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        Mã QR sản phẩm
      </h2>

      {!id || id === "new" ? (
        <div
          style={{
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "10px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Lưu sản phẩm trước khi tạo mã QR.
        </div>
      ) : isLoadingQr ? (
        <div
          style={{ padding: "20px", color: "#6b7280", fontSize: "14px" }}
        >
          Đang tạo mã QR...
        </div>
      ) : qrError ? (
        <div
          style={{
            padding: "16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            color: "#dc2626",
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{qrError}</span>
          <button
            type="button"
            onClick={() => {
              setQrError(null);
              setQrRetryKey((k) => k + 1);
            }}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </div>
      ) : qrData ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }}
          >
            <img
              src={qrData.image_data_url}
              alt="Mã QR sản phẩm"
              style={{
                width: "200px",
                height: "200px",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "6px",
                fontWeight: "500",
              }}
            >
              Link sản phẩm (trong QR)
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#374151",
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}
            >
              {qrData.resolve_url}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(qrData.resolve_url).then(
                  () => showToast("Đã copy link QR", "success"),
                  () => showToast("Không thể copy", "error"),
                );
              }}
              style={{
                padding: "9px 16px",
                background: "#4b5563",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              📋 Copy link
            </button>
            <a
              href={qrData.image_data_url}
              download={`qr-${id}.png`}
              style={{
                padding: "9px 16px",
                background:
                  "linear-gradient(90deg, var(--ct-primary, #4f46e5), var(--ct-secondary, #7c3aed))",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ⬇ Tải PNG
            </a>
            <button
              type="button"
              onClick={() =>
                printQrCode(
                  qrData.image_data_url,
                  itemName,
                  qrData.resolve_url,
                )
              }
              style={{
                padding: "9px 16px",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              🖨 In QR
            </button>
          </div>

          {!isPublic && (
            <div
              style={{
                padding: "12px 14px",
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#92400e",
              }}
            >
              ⚠️ Sản phẩm đang ở chế độ riêng tư. Người quét QR sẽ thấy lỗi
              "sản phẩm không tồn tại" cho đến khi bạn bật công khai.
            </div>
          )}

          <div
            style={{
              padding: "12px 14px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#1e40af",
            }}
          >
            💡 Mã QR này dẫn đến trang sản phẩm công khai. Trong tương lai
            sẽ hỗ trợ thêm các hành động như <strong>thêm giỏ hàng</strong>{" "}
            và <strong>thanh toán</strong>.
          </div>
        </div>
      ) : null}
    </>
  );
}
