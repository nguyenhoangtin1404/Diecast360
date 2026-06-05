import type { CampaignSummary } from "../types";

interface Props {
  campaignSummary: CampaignSummary;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PreorderCloseConfirmModal({
  campaignSummary,
  isSaving,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "440px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>
          Xác nhận chuyển sang "Đã bán"
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#444" }}>
          Hành động này sẽ:
        </p>
        <ul style={{ margin: "0 0 16px", paddingLeft: "20px", fontSize: "14px", lineHeight: "1.8" }}>
          {campaignSummary.cancelable > 0 && (
            <li>
              Tự động hủy{" "}
              <strong>{campaignSummary.cancelable} đơn chưa cọc</strong>
            </li>
          )}
          {campaignSummary.with_deposit > 0 && (
            <li>
              <strong style={{ color: "#dc3545" }}>
                {campaignSummary.with_deposit} đơn đã cọc
              </strong>{" "}
              — cần liên hệ hoàn tiền thủ công
            </li>
          )}
          {campaignSummary.arrived > 0 && (
            <li>{campaignSummary.arrived} đơn "Hàng về" giữ nguyên</li>
          )}
        </ul>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#888" }}>
          Hành động này <strong>không thể hoàn tác</strong>. Tiếp tục?
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Hủy bỏ
          </button>
          <button
            disabled={isSaving}
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#dc3545",
              color: "white",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Xác nhận chuyển Đã bán
          </button>
        </div>
      </div>
    </div>
  );
}
