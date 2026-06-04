import { Plus, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryQuickManage } from "../../../../components/admin/CategoryQuickManage";
import { InventoryTimeline } from "../../../../components/admin/InventoryTimeline";
import type { CategoryItem } from "../../../../types/category";
import type { AttributeRow, CampaignSummary } from "../types";
import type { ItemStatus } from "../../../../constants/item";
import { MAX_ITEM_ATTRIBUTE_KEYS } from "../utils";
import { SegmentedControl } from "../components/SegmentedControl";

interface Props {
  id: string | undefined;
  isMobile: boolean;
  isBusy: boolean;

  name: string;
  setName: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  carBrand: string;
  setCarBrand: (v: string) => void;

  modelBrand: string;
  setModelBrand: (v: string) => void;

  scale: string;
  setScale: (v: string) => void;

  brand: string;
  setBrand: (v: string) => void;

  originalPrice: string;
  setOriginalPrice: (v: string) => void;

  price: string;
  setPrice: (v: string) => void;

  preorderPrice: string;
  setPreorderPrice: (v: string) => void;

  condition: "new" | "old";
  setCondition: (v: "new" | "old") => void;

  isPublic: boolean;
  setIsPublic: (v: boolean) => void;

  status: string;
  setStatus: (v: string) => void;

  quantity: string;
  setQuantity: (v: string) => void;

  preorderClosesAt: string;
  setPreorderClosesAt: (v: string) => void;

  preorderDays: string;
  setPreorderDays: (v: string) => void;

  attributeRows: AttributeRow[];
  addAttributeRow: () => void;
  removeAttributeRow: (rowId: string) => void;
  updateAttributeRow: (rowId: string, field: "key" | "value", value: string) => void;

  selectedFiles: File[];
  imagePreviewUrls: string[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

  activeCarBrands: CategoryItem[];
  activeModelBrands: CategoryItem[];
  carBrandsData: { categories: CategoryItem[] } | undefined;
  modelBrandsData: { categories: CategoryItem[] } | undefined;

  campaignSummary: CampaignSummary | undefined;
  hasCampaignOrders: boolean;

  isGeneratingAi: boolean;
  handleGenerateAiDescription: () => void;

  formatNumber: (v: string) => string;
  parseNumber: (v: string) => string;
  toLocalDatetimeInput: (date: Date | string) => string;
}

export function ItemBasicInfoSection({
  id,
  isMobile,
  isBusy,
  name,
  setName,
  description,
  setDescription,
  carBrand,
  setCarBrand,
  modelBrand,
  setModelBrand,
  scale,
  setScale,
  brand,
  setBrand,
  originalPrice,
  setOriginalPrice,
  price,
  setPrice,
  preorderPrice,
  setPreorderPrice,
  condition,
  setCondition,
  isPublic,
  setIsPublic,
  status,
  setStatus,
  quantity,
  setQuantity,
  preorderClosesAt,
  setPreorderClosesAt,
  preorderDays,
  setPreorderDays,
  attributeRows,
  addAttributeRow,
  removeAttributeRow,
  updateAttributeRow,
  selectedFiles,
  imagePreviewUrls,
  handleFileSelect,
  activeCarBrands,
  activeModelBrands,
  carBrandsData,
  modelBrandsData,
  campaignSummary,
  hasCampaignOrders,
  isGeneratingAi,
  handleGenerateAiDescription,
  formatNumber,
  parseNumber,
  toLocalDatetimeInput,
}: Props) {
  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
          }}
        >
          Tên sản phẩm <span style={{ color: "#dc3545" }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
        />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <div
          className="item-detail-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <label
            style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
          >
            Mô tả
          </label>
          {id && id !== "new" && (
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={isGeneratingAi}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: isGeneratingAi
                  ? "#ccc"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: isGeneratingAi ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <Sparkles size={14} />
              {isGeneratingAi ? "Đang tạo..." : "Tạo mô tả AI"}
            </button>
          )}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            minHeight: "100px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
            resize: "vertical",
            fontFamily: "inherit",
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
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label
              style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
            >
              Hãng xe
            </label>
            <CategoryQuickManage
              type="car_brand"
              categories={carBrandsData?.categories || []}
            />
          </div>
          <select
            value={carBrand}
            onChange={(e) => setCarBrand(e.target.value)}
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
              cursor: "pointer",
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
          >
            <option value="">-- Chọn hãng xe --</option>
            {activeCarBrands.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label
              style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
            >
              Hãng mô hình
            </label>
            <CategoryQuickManage
              type="model_brand"
              categories={modelBrandsData?.categories || []}
            />
          </div>
          <select
            value={modelBrand}
            onChange={(e) => setModelBrand(e.target.value)}
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
              cursor: "pointer",
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
          >
            <option value="">-- Chọn hãng mô hình --</option>
            {activeModelBrands.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
            <option value="OTHER BRAND">Hãng khác</option>
          </select>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Tỷ lệ
          </label>
          <input
            type="text"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            placeholder="1:64"
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
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Thương hiệu
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
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
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Giá gốc
          </label>
          <input
            type="text"
            value={originalPrice ? formatNumber(originalPrice) : ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              const parsed = parseNumber(inputValue);
              if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
                setOriginalPrice(parsed);
              }
            }}
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
              const parsed = parseNumber(e.target.value);
              if (
                parsed === "" ||
                (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)
              ) {
                setOriginalPrice(parsed);
              }
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Giá bán
          </label>
          <input
            type="text"
            value={price ? formatNumber(price) : ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              const parsed = parseNumber(inputValue);
              if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
                setPrice(parsed);
              }
            }}
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
              const parsed = parseNumber(e.target.value);
              if (
                parsed === "" ||
                (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)
              ) {
                setPrice(parsed);
              }
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Giá pre-order
          </label>
          <input
            type="text"
            value={preorderPrice ? formatNumber(preorderPrice) : ""}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value);
              if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
                setPreorderPrice(parsed);
              }
            }}
            placeholder="Để trống nếu không có"
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
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.boxShadow = "none";
              const parsed = parseNumber(e.target.value);
              if (
                parsed === "" ||
                (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)
              ) {
                setPreorderPrice(parsed);
              }
            }}
          />
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", marginBottom: 0 }}>
            Hiển thị ở catalog khi pre-order đang mở
          </p>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Tình trạng
          </label>
          <SegmentedControl
            ariaLabel="Tình trạng sản phẩm"
            disabled={isBusy}
            options={[
              { value: "new", label: "Mới", minWidth: "80px" },
              { value: "old", label: "Cũ", minWidth: "80px" },
            ]}
            value={condition}
            onChange={setCondition}
            mobile={isMobile}
            fullWidthOnMobile
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Công khai
          </label>
          <SegmentedControl
            ariaLabel="Hiển thị công khai"
            disabled={isBusy}
            options={[
              { value: "public", label: "Công khai", minWidth: "80px" },
              { value: "private", label: "Riêng tư", minWidth: "80px" },
            ]}
            value={isPublic ? "public" : "private"}
            onChange={(next) => setIsPublic(next === "public")}
            mobile={isMobile}
          />
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
          }}
        >
          Trạng thái
        </label>
        <SegmentedControl
          ariaLabel="Trạng thái kho"
          disabled={isBusy}
          options={[
            { value: "con_hang", label: "Còn hàng", minWidth: "70px" },
            { value: "giu_cho", label: "Giữ chỗ", minWidth: "70px" },
            { value: "da_ban", label: "Đã bán", minWidth: "70px" },
            { value: "preorder", label: "Pre-order", minWidth: "70px" },
          ]}
          value={status as ItemStatus}
          onChange={(next) => setStatus(next)}
          mobile={isMobile}
          fullWidthOnMobile
        />
        {hasCampaignOrders && campaignSummary && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px 12px",
              background: "#f0f7ff",
              border: "1px solid #b6d4fe",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#084298",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ marginRight: "4px" }}>📋 Chiến dịch:</span>
            {campaignSummary.pending > 0 && (
              <Link
                to={`/admin/preorders?item_id=${encodeURIComponent(id!)}&status=PENDING_CONFIRMATION`}
                style={{ color: "#084298", fontWeight: 600, textDecoration: "none" }}
              >
                {campaignSummary.pending} chờ xác nhận
              </Link>
            )}
            {campaignSummary.pending > 0 && campaignSummary.waiting > 0 && <span> · </span>}
            {campaignSummary.waiting > 0 && (
              <Link
                to={`/admin/preorders?item_id=${encodeURIComponent(id!)}&status=WAITING_FOR_GOODS`}
                style={{ color: "#084298", fontWeight: 600, textDecoration: "none" }}
              >
                {campaignSummary.waiting} chờ hàng
              </Link>
            )}
            {(campaignSummary.pending > 0 || campaignSummary.waiting > 0) && campaignSummary.arrived > 0 && <span> · </span>}
            {campaignSummary.arrived > 0 && (
              <Link
                to={`/admin/preorders?item_id=${encodeURIComponent(id!)}&status=ARRIVED`}
                style={{ color: "#084298", fontWeight: 600, textDecoration: "none" }}
              >
                {campaignSummary.arrived} hàng về
              </Link>
            )}
          </div>
        )}
      </div>

      {status === "preorder" && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            border: "1px solid #b6d4fe",
            borderRadius: "10px",
            background: "#f0f7ff",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#084298",
            }}
          >
            ⏳ Thời hạn đặt hàng pre-order
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "140px 1fr",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1e3a5f",
                }}
              >
                Số ngày
              </label>
              <input
                type="number"
                min="1"
                value={preorderDays}
                onChange={(e) => {
                  const days = e.target.value;
                  setPreorderDays(days);
                  const n = parseInt(days, 10);
                  if (!isNaN(n) && n > 0) {
                    const d = new Date();
                    d.setDate(d.getDate() + n);
                    d.setHours(23, 59, 0, 0);
                    setPreorderClosesAt(toLocalDatetimeInput(d));
                  } else if (days === "") {
                    setPreorderClosesAt("");
                  }
                }}
                placeholder="VD: 14"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid #93c5fd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                  color: "#1a1a1a",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#007bff";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1e3a5f",
                }}
              >
                Ngày / giờ đóng đặt hàng
              </label>
              <input
                type="datetime-local"
                value={preorderClosesAt}
                onChange={(e) => {
                  const val = e.target.value;
                  setPreorderClosesAt(val);
                  if (val) {
                    const diffMs = new Date(val).getTime() - Date.now();
                    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                    setPreorderDays(String(diffDays));
                  } else {
                    setPreorderDays("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid #93c5fd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                  color: "#1a1a1a",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#007bff";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,123,255,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
          {preorderClosesAt && (
            <button
              type="button"
              onClick={() => { setPreorderClosesAt(""); setPreorderDays(""); }}
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Xóa thời hạn (mở vô thời hạn)
            </button>
          )}
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px", marginBottom: 0 }}>
            Để trống = pre-order mở không giới hạn thời gian.
          </p>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
          }}
        >
          Số lượng tồn kho
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={status === "da_ban"}
          value={status === "da_ban" ? "0" : quantity}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setQuantity(v);
          }}
          placeholder="Ví dụ: 5"
          style={{
            width: "100%",
            maxWidth: "200px",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
            color: "#1a1a1a",
            backgroundColor: status === "da_ban" ? "#f3f4f6" : "#fff",
          }}
          onFocus={(e) => {
            if (status === "da_ban") return;
            e.currentTarget.style.borderColor = "#007bff";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(0, 123, 255, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {status === "da_ban" ? (
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Trạng thái đã bán: hệ thống luôn lưu số lượng 0.
          </p>
        ) : (
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Để trống khi tạo mới để dùng mặc định (1). Chỉ nhập số nguyên ≥
            0.
          </p>
        )}
      </div>
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <label
            style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
          >
            Thuộc tính tùy chỉnh
          </label>
          <button
            type="button"
            onClick={addAttributeRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background:
                "linear-gradient(90deg, var(--ct-primary, #4f46e5), var(--ct-secondary, #7c3aed))",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 4px 14px 0 rgb(var(--shop-primary-rgb) / 0.24)",
            }}
          >
            <Plus size={14} />
            Thêm dòng
          </button>
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "#6b7280",
            marginBottom: "10px",
          }}
        >
          Tối đa {MAX_ITEM_ATTRIBUTE_KEYS} cặp. Giá trị để trống được lưu là
          null. Nhập <code>true</code> / <code>false</code> hoặc số nguyên
          để lưu đúng kiểu.
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {attributeRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={row.key}
                onChange={(e) =>
                  updateAttributeRow(row.id, "key", e.target.value)
                }
                placeholder="Tên (ví dụ: mau_sac)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) =>
                  updateAttributeRow(row.id, "value", e.target.value)
                }
                placeholder="Giá trị"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={() => removeAttributeRow(row.id)}
                aria-label="Xóa dòng thuộc tính"
                style={{
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="#6b7280" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {id === "new" && (
        <div style={{ marginBottom: "10px" }}>
          <label>Tải lên hình ảnh:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
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
          />
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ color: "#666", marginBottom: "8px" }}>
                Đã chọn {selectedFiles.length} ảnh
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "120px" : "150px"}, 1fr))`,
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                {imagePreviewUrls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #ddd",
                      padding: "5px",
                      borderRadius: "4px",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFiles[index]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        Dữ liệu sẽ tự động lưu khi bạn nhấn nút Bước tiếp hoặc Bước trước.
      </div>
      {id && id !== "new" && <InventoryTimeline itemId={id} />}
    </>
  );
}
