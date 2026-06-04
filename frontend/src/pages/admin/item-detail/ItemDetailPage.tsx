import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, uploadFile } from "../../../api/client";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import type { ApiResponse, CategoryItem } from "../../../types/category";
import { showToast } from "../../../utils/toast";
import type { FacebookPost } from "../../../types/item.types";
import type { ItemStatus } from "../../../constants/item";
import {
  jumpToStepWithAutoSave,
  navigateStepWithAutoSave,
  type ProductStep,
} from "../itemStepNavigation";
import {
  buildStepUrlAfterCreate,
  evaluateFinishDecision,
  parseProductStepFromSearchParams,
  shouldBlockEnterSubmit,
} from "../itemWorkflow";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useOptionalActiveShopId } from "../../../hooks/useOptionalActiveShopId";

import type {
  AttributeRow,
  AiDescriptionResponse,
  ItemData,
  ItemResponse,
  ItemImage,
  SpinSet,
  CampaignSummary,
  UpdateItemResponse,
  SavePayload,
  QrData,
} from "./types";
import {
  newAttributeRowId,
  attributeRowsFromApi,
  buildAttributesPayload,
  formatNumber,
  parseNumber,
  toLocalDatetimeInput,
  MAX_ITEM_ATTRIBUTE_KEYS,
} from "./utils";
import { ItemBasicInfoSection } from "./sections/ItemBasicInfoSection";
import { ItemImagesSection } from "./sections/ItemImagesSection";
import { ItemSpinnerSection } from "./sections/ItemSpinnerSection";
import { ItemAiSection } from "./sections/ItemAiSection";
import { ItemQrSection } from "./sections/ItemQrSection";
import { PreorderCloseConfirmModal } from "./components/PreorderCloseConfirmModal";



const PRODUCT_STEPS: Array<{
  id: ProductStep;
  title: string;
  shortTitle: string;
}> = [
  { id: 1, title: "Thông tin cơ bản", shortTitle: "Thông tin" },
  { id: 2, title: "Hình ảnh", shortTitle: "Hình ảnh" },
  { id: 3, title: "Ảnh 360", shortTitle: "Ảnh 360" },
  { id: 4, title: "AI gen nội dung FB", shortTitle: "AI FB" },
  { id: 5, title: "Mã QR sản phẩm", shortTitle: "Mã QR" },
];

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("con_hang");
  const [isPublic, setIsPublic] = useState(false);
  const [carBrand, setCarBrand] = useState("");
  const [modelBrand, setModelBrand] = useState("");
  const [condition, setCondition] = useState<"new" | "old">("new");
  const [price, setPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [scale, setScale] = useState<string>("1:64");
  const [brand, setBrand] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>(() => [
    { id: newAttributeRowId(), key: "", value: "" },
  ]);
  const [preorderClosesAt, setPreorderClosesAt] = useState<string>("");
  const [preorderDays, setPreorderDays] = useState<string>("");
  const [preorderPrice, setPreorderPrice] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [lastImageUploadFailed, setLastImageUploadFailed] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedSpinSetId, setSelectedSpinSetId] = useState<string | null>(
    null,
  );
  const [newSpinSetLabel, setNewSpinSetLabel] = useState("");
  const [newSpinSetIsDefault, setNewSpinSetIsDefault] = useState(false);
  const [showCreateSpinSet, setShowCreateSpinSet] = useState(false);
  const [uploadingFrames, setUploadingFrames] = useState(false);

  // AI Description states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDescription, setAiDescription] =
    useState<AiDescriptionResponse | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiPreviewTab, setAiPreviewTab] = useState<
    "short" | "long" | "bullets" | "seo"
  >("short");

  // FB Post AI states
  const [fbPostContent, setFbPostContent] = useState("");
  const [fbPostInstructions, setFbPostInstructions] = useState("");
  const [isGeneratingFbPost, setIsGeneratingFbPost] = useState(false);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [newFbLinkInput, setNewFbLinkInput] = useState("");
  const [isSavingFbLink, setIsSavingFbLink] = useState(false);
  const [isPublishingToFb, setIsPublishingToFb] = useState(false);
  const [publishFbMessage, setPublishFbMessage] = useState<string | null>(null);

  // QR states
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const isLoadingQrRef = useRef(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrRetryKey, setQrRetryKey] = useState(0);
  const [confirmDaBanOpen, setConfirmDaBanOpen] = useState(false);

  const socialSellingRef = useRef<HTMLDivElement>(null);
  const stepNavInFlightRef = useRef(false);
  const imagePreviewUrlsRef = useRef<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStep = useMemo(
    () => parseProductStepFromSearchParams(searchParams),
    [searchParams],
  );
  const currentStep: ProductStep = urlStep ?? 1;
  const setCurrentStep = useCallback(
    (step: ProductStep) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("step", String(step));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const isMobile = useIsMobile();
  const activeShopId = useOptionalActiveShopId();

  const { data, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const response = await apiClient.get(`/items/${id}`);
      return response.data;
    },
    enabled: !!id && id !== "new",
  });

  const { data: carBrandsData } = useQuery({
    queryKey: ["categories", "car_brand", activeShopId ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "car_brand" });
      if (activeShopId) params.set("shop_id", activeShopId);
      const response = (await apiClient.get(
        `/categories?${params.toString()}`,
      )) as ApiResponse<{ categories: CategoryItem[] }>;
      return response.data;
    },
    enabled: Boolean(activeShopId),
  });

  const { data: modelBrandsData } = useQuery({
    queryKey: ["categories", "model_brand", activeShopId ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "model_brand" });
      if (activeShopId) params.set("shop_id", activeShopId);
      const response = (await apiClient.get(
        `/categories?${params.toString()}`,
      )) as ApiResponse<{ categories: CategoryItem[] }>;
      return response.data;
    },
    enabled: Boolean(activeShopId),
  });

  const { data: campaignSummary } = useQuery({
    queryKey: ["preorder-campaign-summary", id],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/preorders/admin/campaigns/${encodeURIComponent(id!)}/summary`,
      )) as ApiResponse<CampaignSummary>;
      return res.data;
    },
    enabled: Boolean(id && id !== "new" && data?.item?.status === "preorder"),
    staleTime: 30_000,
  });

  const hasCampaignOrders =
    data?.item?.status === "preorder" && (campaignSummary?.total ?? 0) > 0;

  const activeCarBrands = useMemo(
    () => (carBrandsData?.categories || []).filter((c: CategoryItem) => c.is_active),
    [carBrandsData],
  );
  const activeModelBrands = useMemo(
    () => (modelBrandsData?.categories || []).filter((c: CategoryItem) => c.is_active),
    [modelBrandsData],
  );

  useEffect(() => {
    imagePreviewUrlsRef.current = imagePreviewUrls;
  }, [imagePreviewUrls]);

  useEffect(() => {
    if (!data) return;
    queueMicrotask(() => {
      if (data.item) {
        const item = data.item;
        setName(item.name || "");
        setDescription(item.description || "");
        setStatus(item.status || "con_hang");
        setIsPublic(item.is_public || false);
        setCarBrand(item.car_brand || "");
        setModelBrand(item.model_brand || "");
        setCondition(item.condition === "old" ? "old" : "new");
        setPrice(item.price ? item.price.toString() : "");
        setOriginalPrice(
          item.original_price ? item.original_price.toString() : "",
        );
        setScale(item.scale || "1:64");
        setBrand(item.brand || "");
        setFbPostContent(item.fb_post_content || "");
        const closesAt = item.preorder_closes_at;
        if (closesAt) {
          setPreorderClosesAt(toLocalDatetimeInput(closesAt));
          const diffMs = new Date(closesAt).getTime() - Date.now();
          const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          setPreorderDays(String(diffDays));
        } else {
          setPreorderClosesAt("");
          setPreorderDays("");
        }
        setPreorderPrice(item.preorder_price != null ? String(item.preorder_price) : "");
        const q = (item as { quantity?: unknown }).quantity;
        setQuantity(
          typeof q === "number" && Number.isFinite(q)
            ? String(Math.max(0, Math.floor(q)))
            : "",
        );
        setAttributeRows(
          attributeRowsFromApi((item as { attributes?: unknown }).attributes),
        );
      }
      if (data.facebook_posts) {
        setFacebookPosts(data.facebook_posts || []);
      }

      if (data.spin_sets && data.spin_sets.length > 0) {
        const defaultSpinSet = (data.spin_sets as SpinSet[]).find(
          (set) => set.is_default,
        );
        if (defaultSpinSet) {
          setSelectedSpinSetId(defaultSpinSet.id);
        } else {
          setSelectedSpinSetId(
            (prev) => prev ?? (data.spin_sets[0] as SpinSet).id,
          );
        }
      }
    });
  }, [data]);

  useEffect(() => {
    return () => {
      imagePreviewUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore errors when revoking URLs
        }
      });
    };
  }, []);

  useEffect(() => {
    if (
      searchParams.get("section") === "social-selling" &&
      socialSellingRef.current &&
      data
    ) {
      setCurrentStep(4);
      setTimeout(() => {
        socialSellingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [searchParams, data, setCurrentStep]);

  useEffect(() => {
    queueMicrotask(() => {
      setQrData(null);
      setQrError(null);
    });
  }, [id]);

  useEffect(() => {
    if (currentStep !== 5 || !id || id === "new" || qrData !== null) return;
    const abort = new AbortController();
    isLoadingQrRef.current = true;
    queueMicrotask(() => {
      if (abort.signal.aborted) return;
      setIsLoadingQr(true);
      setQrError(null);
    });
    apiClient
      .get(`/items/${id}/qr`, { signal: abort.signal })
      .then((res) => setQrData((res as unknown as { data: QrData }).data))
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "CanceledError") return;
        setQrError("Không thể tải mã QR. Vui lòng thử lại.");
      })
      .finally(() => {
        if (abort.signal.aborted) return;
        isLoadingQrRef.current = false;
        setIsLoadingQr(false);
      });
    return () => {
      abort.abort();
      isLoadingQrRef.current = false;
    };
  }, [currentStep, id, qrData, qrRetryKey]);

  const extractItemIdFromResponse = (response: unknown): string | null => {
    const isApiResponse = (r: unknown): r is ApiResponse<ItemResponse> => {
      return typeof r === "object" && r !== null && "data" in r && "ok" in r;
    };

    const responseData = isApiResponse(response)
      ? response.data
      : (response as ItemResponse);
    const extractedId =
      responseData?.item?.id || (responseData as { id?: string })?.id;
    return extractedId || null;
  };

  useEffect(() => {
    if (id === "new") {
      queueMicrotask(() => {
        setCondition("new");
        setQuantity("");
        setAttributeRows([{ id: newAttributeRowId(), key: "", value: "" }]);
      });
    }
  }, [id]);

  const saveMutation = useMutation({
    mutationFn: async ({ itemData }: SavePayload) => {
      if (id === "new") {
        return apiClient.post("/items", itemData);
      } else {
        return apiClient.patch(`/items/${id}`, itemData);
      }
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      const itemId = id === "new" ? extractItemIdFromResponse(response) : id;
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: ["item", itemId] });
        queryClient.invalidateQueries({ queryKey: ["preorder-campaign-summary", itemId] });
      }
      if (id === "new" && !itemId) {
        showToast("Không thể tạo sản phẩm. Vui lòng thử lại.");
        return;
      }

      if (itemId && selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("is_cover", i === 0 ? "true" : "false");
            await uploadFile(`/items/${itemId}/images`, formData);
          }
          queryClient.invalidateQueries({ queryKey: ["item", itemId] });
          setSelectedFiles([]);
          imagePreviewUrls.forEach((url) => {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // ignore
            }
          });
          setImagePreviewUrls([]);
          setLastImageUploadFailed(false);
        } catch (error) {
          console.error("Error uploading images:", error);
          setLastImageUploadFailed(true);
          alert("Có lỗi khi upload ảnh. Vui lòng thử lại.");
        } finally {
          setUploadingImages(false);
        }
      }

      if (!variables?.silent) {
        const notification = document.createElement("div");
        notification.textContent =
          id === "new"
            ? "Đã tạo sản phẩm thành công!"
            : "Đã cập nhật sản phẩm thành công!";
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideIn 0.3s ease-out;
        `;

        const checkIcon = document.createElement("span");
        checkIcon.textContent = "✓";
        checkIcon.style.cssText = `
          font-size: 18px;
          font-weight: bold;
        `;
        notification.appendChild(checkIcon);
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.animation = "slideOut 0.3s ease-out";
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }

      const respData = (response as unknown as ApiResponse<UpdateItemResponse>)?.data;
      const arrivedCount = respData?.preorders_arrived_count ?? 0;
      const pendingCount = respData?.preorders_pending_count ?? 0;
      const autoCancelledCount = respData?.preorders_auto_cancelled_count ?? 0;
      const withDepositCount = respData?.preorders_with_deposit_count ?? 0;

      if (arrivedCount > 0) {
        showToast(`Đã tự động chuyển ${arrivedCount} đơn pre-order sang "Hàng về"`);
      }
      if (pendingCount > 0) {
        showToast(`Còn ${pendingCount} đơn chờ xác nhận cần xử lý thủ công.`);
      }
      if (autoCancelledCount > 0 || withDepositCount > 0) {
        const parts: string[] = [];
        if (autoCancelledCount > 0) parts.push(`tự động hủy ${autoCancelledCount} đơn chưa cọc`);
        if (withDepositCount > 0) parts.push(`${withDepositCount} đơn đã cọc cần hủy thủ công`);
        showToast(`Pre-order: ${parts.join(' · ')}.`);
      }

      if (id === "new" && variables?.navigateAfterCreate) {
        setTimeout(() => {
          navigate(`/admin/items/${itemId}`);
        }, 500);
      }
    },
  });

  const buildItemData = (): ItemData => {
    const itemData: ItemData = {
      name,
      description,
      status: status as ItemStatus,
      is_public: isPublic,
    };

    if (carBrand) itemData.car_brand = carBrand;
    if (modelBrand) itemData.model_brand = modelBrand;
    if (condition) itemData.condition = condition as "new" | "old";
    if (scale) itemData.scale = scale;
    if (brand) itemData.brand = brand;
    if (price) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum >= 0) {
        itemData.price = priceNum;
      }
    }
    if (originalPrice) {
      const originalPriceNum = parseFloat(originalPrice);
      if (!isNaN(originalPriceNum) && originalPriceNum >= 0) {
        itemData.original_price = originalPriceNum;
      }
    }

    if (status === "da_ban") {
      itemData.quantity = 0;
    } else {
      const qt = quantity.trim();
      if (qt !== "") {
        const qn = parseInt(qt, 10);
        if (!Number.isNaN(qn) && qn >= 0) {
          itemData.quantity = qn;
        }
      }
    }

    const attrs = buildAttributesPayload(attributeRows);
    if (attrs.ok) {
      itemData.attributes = attrs.value;
    }

    if (status === "preorder") {
      itemData.preorder_closes_at = preorderClosesAt
        ? new Date(preorderClosesAt).toISOString()
        : null;
    } else {
      itemData.preorder_closes_at = null;
    }

    if (preorderPrice) {
      const ppNum = parseFloat(preorderPrice);
      if (!isNaN(ppNum) && ppNum >= 0) {
        itemData.preorder_price = ppNum;
      }
    } else {
      itemData.preorder_price = null;
    }

    return itemData;
  };

  const validateInventoryBeforeSave = (): boolean => {
    if (status !== "da_ban" && quantity.trim() !== "") {
      const qn = parseInt(quantity.trim(), 10);
      if (Number.isNaN(qn) || qn < 0 || !Number.isInteger(qn)) {
        showToast("Số lượng phải là số nguyên ≥ 0.");
        return false;
      }
    }
    const attrCheck = buildAttributesPayload(attributeRows);
    if (!attrCheck.ok) {
      showToast(attrCheck.message);
      return false;
    }
    return true;
  };

  const saveCurrentItem = async (silent = false, skipDaBanConfirm = false): Promise<boolean> => {
    if (!name.trim()) {
      showToast("Vui lòng nhập tên sản phẩm trước khi chuyển bước.");
      return false;
    }
    if (!validateInventoryBeforeSave()) {
      return false;
    }
    if (
      !skipDaBanConfirm &&
      data?.item?.status === "preorder" &&
      status === "da_ban" &&
      (campaignSummary?.total ?? 0) > 0
    ) {
      setConfirmDaBanOpen(true);
      return false;
    }
    try {
      const response = await saveMutation.mutateAsync({
        itemData: buildItemData(),
        silent,
        navigateAfterCreate: !silent,
      });
      if (id === "new") {
        const createdItemId = extractItemIdFromResponse(response);
        if (!createdItemId) {
          showToast("Không thể tạo sản phẩm. Vui lòng thử lại.");
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Auto-save failed:", error);
      showToast("Không thể lưu dữ liệu. Vui lòng thử lại.");
      return false;
    }
  };

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (shouldBlockEnterSubmit(e.key, target.tagName)) {
      e.preventDefault();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      imagePreviewUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore errors
        }
      });

      setSelectedFiles(files);

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls(previews);
    }
  };

  const handleUploadImage = async (
    file: File,
    isCover: boolean = false,
  ): Promise<void> => {
    if (!id || id === "new") return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_cover", isCover ? "true" : "false");

    try {
      await uploadFile(`/items/${id}/images`, formData);
      setLastImageUploadFailed(false);
      queryClient.invalidateQueries({ queryKey: ["item", id] });
    } catch (error) {
      console.error("Error uploading image:", error);
      setLastImageUploadFailed(true);
      throw error;
    }
  };

  const createSpinSetMutation = useMutation({
    mutationFn: async (data: { label?: string; is_default?: boolean }) => {
      if (!id || id === "new") throw new Error("Item ID is required");
      return apiClient.post(`/items/${id}/spin-sets`, data);
    },
    onSuccess: () => {
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
      setShowCreateSpinSet(false);
      setNewSpinSetLabel("");
      setNewSpinSetIsDefault(false);
    },
  });

  const updateSpinSetMutation = useMutation({
    mutationFn: async ({
      spinSetId,
      data,
    }: {
      spinSetId: string;
      data: { label?: string; is_default?: boolean };
    }) => {
      return apiClient.patch(`/spin-sets/${spinSetId}`, data);
    },
    onSuccess: () => {
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
    },
  });

  const uploadFrameMutation = useMutation({
    mutationFn: async ({
      spinSetId,
      file,
      frameIndex,
    }: {
      spinSetId: string;
      file: File;
      frameIndex?: number;
    }) => {
      const formData = new FormData();
      formData.append("frame", file);
      if (frameIndex !== undefined) {
        formData.append("frame_index", frameIndex.toString());
      }
      return uploadFile(`/spin-sets/${spinSetId}/frames`, formData);
    },
    onSuccess: () => {
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
    },
  });

  const deleteFrameMutation = useMutation({
    mutationFn: async ({
      spinSetId,
      frameId,
    }: {
      spinSetId: string;
      frameId: string;
    }) => {
      return apiClient.delete(`/spin-sets/${spinSetId}/frames/${frameId}`);
    },
    onSuccess: () => {
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
    },
  });

  const reorderFramesMutation = useMutation({
    mutationFn: async ({
      spinSetId,
      frameIds,
    }: {
      spinSetId: string;
      frameIds: string[];
    }) => {
      return apiClient.patch(`/spin-sets/${spinSetId}/frames/order`, {
        frame_ids: frameIds,
      });
    },
    onSuccess: () => {
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
    },
    onError: (error) => {
      console.error("Error reordering frames:", error);
      alert(
        "Có lỗi khi sắp xếp frames: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
      if (id && id !== "new") {
        queryClient.invalidateQueries({ queryKey: ["item", id] });
      }
    },
  });

  const handleUploadFrames = async (
    e: React.ChangeEvent<HTMLInputElement>,
    spinSetId: string,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setUploadingFrames(true);

    try {
      for (const file of files) {
        await uploadFrameMutation.mutateAsync({ spinSetId, file });
      }
    } catch (error) {
      console.error("Error uploading frames:", error);
      alert("Có lỗi khi upload frames");
    } finally {
      setUploadingFrames(false);
      e.target.value = "";
    }
  };

  const handleMoveFrame = (
    spinSetId: string,
    frameId: string,
    direction: "up" | "down",
    spinSets: SpinSet[],
  ) => {
    const spinSet = spinSets.find((set) => set.id === spinSetId);
    if (!spinSet || !spinSet.frames || spinSet.frames.length === 0) return;

    const frames = [...spinSet.frames].sort(
      (a, b) => a.frame_index - b.frame_index,
    );
    const currentIndex = frames.findIndex((f) => f.id === frameId);

    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === frames.length - 1) return;

    const newOrder = [...frames];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[currentIndex],
    ];

    const frameIds = newOrder.map((f) => f.id);
    reorderFramesMutation.mutate({ spinSetId, frameIds });
  };

  const handleGenerateAiDescription = async () => {
    if (!id || id === "new") {
      alert("Vui lòng lưu sản phẩm trước khi tạo mô tả AI.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await apiClient.post(`/items/${id}/ai-description`, {});
      const result = response.data;

      if (!result) throw new Error("No data received");

      setAiDescription(result);
      setShowAiPreview(true);
      setAiPreviewTab("short");
    } catch (error) {
      console.error("Error generating AI description:", error);
      alert("Có lỗi khi tạo mô tả AI. Vui lòng thử lại.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAcceptAiDescription = () => {
    if (!aiDescription) return;
    if (!validateInventoryBeforeSave()) {
      return;
    }
    const newDescription = aiDescription.long_description;
    setDescription(newDescription);
    setShowAiPreview(false);
    setAiDescription(null);
    const merged = buildItemData();
    merged.description = newDescription;
    saveMutation.mutate({ itemData: merged });
  };

  if (isLoading && id !== "new")
    return <div style={{ padding: "20px" }}>Đang tải...</div>;

  const item = data?.item;
  const images = (data?.images || []) as ItemImage[];
  const spinSets = (data?.spin_sets || []) as SpinSet[];
  const isNewItem = id === "new";

  const addAttributeRow = () => {
    setAttributeRows((prev) => {
      if (prev.length >= MAX_ITEM_ATTRIBUTE_KEYS) {
        showToast(`Tối đa ${MAX_ITEM_ATTRIBUTE_KEYS} thuộc tính.`);
        return prev;
      }
      return [...prev, { id: newAttributeRowId(), key: "", value: "" }];
    });
  };

  const removeAttributeRow = (rowId: string) => {
    setAttributeRows((prev) => {
      if (prev.length <= 1) {
        return [{ id: newAttributeRowId(), key: "", value: "" }];
      }
      return prev.filter((r) => r.id !== rowId);
    });
  };

  const updateAttributeRow = (
    rowId: string,
    field: "key" | "value",
    value: string,
  ) => {
    setAttributeRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    );
  };

  const goToStep = (step: ProductStep) => {
    void (async () => {
      if (stepNavInFlightRef.current) return;
      if (isNewItem && step > 1) {
        showToast("Vui lòng lưu sản phẩm trước để mở các bước tiếp theo.");
        return;
      }
      stepNavInFlightRef.current = true;
      try {
        await jumpToStepWithAutoSave({
          currentStep,
          targetStep: step,
          isBusy: saveMutation.isPending || uploadingImages,
          saveCurrentItem,
          setCurrentStep,
        });
      } finally {
        stepNavInFlightRef.current = false;
      }
    })();
  };

  const goToNextStep = async () => {
    if (isNewItem && currentStep === 1) {
      if (!name.trim()) {
        showToast("Vui lòng nhập tên sản phẩm trước khi chuyển bước.");
        return;
      }
      if (!validateInventoryBeforeSave()) {
        return;
      }

      try {
        const response = await saveMutation.mutateAsync({
          itemData: buildItemData(),
          silent: true,
          navigateAfterCreate: false,
        });
        const createdItemId = extractItemIdFromResponse(response);
        if (!createdItemId) {
          showToast("Không thể tạo sản phẩm. Vui lòng thử lại.");
          return;
        }
        navigate(buildStepUrlAfterCreate(createdItemId, 2));
      } catch (error) {
        console.error("Create item before next step failed:", error);
        showToast("Không thể lưu dữ liệu. Vui lòng thử lại.");
      }
      return;
    }

    await navigateStepWithAutoSave({
      currentStep,
      direction: "next",
      isBusy: saveMutation.isPending || uploadingImages,
      saveCurrentItem,
      setCurrentStep,
    });
  };

  const goToPrevStep = async () => {
    await navigateStepWithAutoSave({
      currentStep,
      direction: "prev",
      isBusy: saveMutation.isPending || uploadingImages,
      saveCurrentItem,
      setCurrentStep,
    });
  };

  const handleSaveAndBackToList = async () => {
    const saved = await saveCurrentItem(true);
    if (!saved) return;

    let missingImages = images.length === 0;
    let missingSpin360 = !spinSets.some((set) => (set.frames?.length || 0) > 0);
    try {
      const response = await apiClient.get(`/items/${id}`);
      const latest = response.data;
      const latestImages = (latest.images || []) as ItemImage[];
      const latestSpinSets = (latest.spin_sets || []) as SpinSet[];
      missingImages = latestImages.length === 0;
      missingSpin360 = !latestSpinSets.some(
        (set) => (set.frames?.length || 0) > 0,
      );
    } catch (error) {
      console.error("Cannot verify media before finishing:", error);
    }

    const preDecision = evaluateFinishDecision(
      { lastImageUploadFailed, missingImages, missingSpin360 },
      false,
    );
    const confirmed =
      preDecision.warnings.length === 0 ||
      window.confirm(
        `Cảnh báo dữ liệu media:\n${preDecision.warnings.join("\n")}\n\nBạn vẫn muốn hoàn tất và về danh sách sản phẩm?`,
      );
    const finishDecision = evaluateFinishDecision(
      { lastImageUploadFailed, missingImages, missingSpin360 },
      confirmed,
    );

    if (!finishDecision.proceed) {
      if (finishDecision.fallbackStep) {
        setCurrentStep(finishDecision.fallbackStep);
      }
      showToast("Vui lòng bổ sung ảnh/ảnh 360 trước khi hoàn tất.");
      return;
    }

    showToast("Đã lưu sản phẩm thành công.");
    navigate("/admin/items");
  };

  const isBusy = saveMutation.isPending || uploadingImages;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .item-detail-shell {
          max-width: 1280px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 20px 16px 32px;
        }
        .product-stepper {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
          max-width: 800px;
        }
        .product-step-btn {
          border: 1px solid #d8dee9;
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .product-step-btn.active {
          border-color: #007bff;
          background: #e9f2ff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.08);
        }
        .product-step-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .product-step-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #f0f2f5;
          color: #333;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .product-step-btn.active .product-step-index {
          background: #007bff;
          color: #fff;
        }
        @media (max-width: 768px) {
          .product-stepper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .product-step-btn {
            padding: 8px 10px;
          }
          .item-detail-shell {
            padding: 16px 12px 20px;
          }
          .item-detail-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .item-detail-heading {
            font-size: 24px;
          }
          .item-detail-form,
          .item-detail-sections {
            max-width: 100%;
          }
          .item-detail-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .item-detail-toolbar > * {
            width: 100%;
          }
          .item-detail-actions {
            position: sticky;
            bottom: 0;
            padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px));
            background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 22%);
          }
          .item-detail-actions button {
            flex: 1 1 100%;
            min-height: 44px;
          }
        }
      `}</style>
      <div className="item-detail-shell">
        <div style={{ marginBottom: "24px" }}>
          <div
            className="item-detail-header-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => navigate("/admin/items")}
              style={{
                padding: "8px 16px",
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.borderColor = "#007bff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#ddd";
              }}
            >
              <ArrowLeft size={18} />
              <span>Quay lại danh sách</span>
            </button>
            {id && id !== "new" && (
              <Link
                to={`/admin/preorders/create?item_id=${encodeURIComponent(id)}`}
                style={{
                  padding: "8px 16px",
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
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#f59e0b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#ddd";
                }}
              >
                <span aria-hidden>⏳</span>
                <span>Chiến dịch Pre-order</span>
              </Link>
            )}
          </div>
          <div
            className="item-detail-header-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              }}
            >
              {id === "new" ? (
                <Plus size={24} color="white" />
              ) : (
                <Edit size={24} color="white" />
              )}
            </div>
            <div>
              <h1
                className="item-detail-heading"
                style={{
                  margin: 0,
                  fontSize: isMobile ? "24px" : "28px",
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.15",
                }}
              >
                {id === "new" ? "Tạo sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h1>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                {id === "new"
                  ? "Thêm sản phẩm mới vào kho"
                  : `Chỉnh sửa thông tin sản phẩm: ${item?.name || ""}`}
              </p>
            </div>
          </div>
        </div>

        {confirmDaBanOpen && campaignSummary && (
          <PreorderCloseConfirmModal
            campaignSummary={campaignSummary}
            isSaving={saveMutation.isPending}
            onCancel={() => setConfirmDaBanOpen(false)}
            onConfirm={() => {
              setConfirmDaBanOpen(false);
              void saveCurrentItem(false, true);
            }}
          />
        )}

        <div className="product-stepper">
          {PRODUCT_STEPS.map((step) => {
            const disabled = isNewItem && step.id > 1;
            return (
              <button
                key={step.id}
                type="button"
                className={`product-step-btn ${currentStep === step.id ? "active" : ""} ${disabled ? "disabled" : ""}`}
                onClick={() => goToStep(step.id)}
                disabled={disabled}
              >
                <span className="product-step-index">{step.id}</span>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                  }}
                >
                  {isMobile ? step.shortTitle : step.title}
                </div>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={preventEnterSubmit}
          className="item-detail-form"
          style={{
            maxWidth: "800px",
            display: currentStep === 1 ? "block" : "none",
          }}
        >
          <ItemBasicInfoSection
            id={id}
            isMobile={isMobile}
            isBusy={isBusy}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            carBrand={carBrand}
            setCarBrand={setCarBrand}
            modelBrand={modelBrand}
            setModelBrand={setModelBrand}
            scale={scale}
            setScale={setScale}
            brand={brand}
            setBrand={setBrand}
            originalPrice={originalPrice}
            setOriginalPrice={setOriginalPrice}
            price={price}
            setPrice={setPrice}
            preorderPrice={preorderPrice}
            setPreorderPrice={setPreorderPrice}
            condition={condition}
            setCondition={setCondition}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            status={status}
            setStatus={setStatus}
            quantity={quantity}
            setQuantity={setQuantity}
            preorderClosesAt={preorderClosesAt}
            setPreorderClosesAt={setPreorderClosesAt}
            preorderDays={preorderDays}
            setPreorderDays={setPreorderDays}
            attributeRows={attributeRows}
            addAttributeRow={addAttributeRow}
            removeAttributeRow={removeAttributeRow}
            updateAttributeRow={updateAttributeRow}
            selectedFiles={selectedFiles}
            imagePreviewUrls={imagePreviewUrls}
            handleFileSelect={handleFileSelect}
            activeCarBrands={activeCarBrands}
            activeModelBrands={activeModelBrands}
            carBrandsData={carBrandsData}
            modelBrandsData={modelBrandsData}
            campaignSummary={campaignSummary}
            hasCampaignOrders={hasCampaignOrders}
            isGeneratingAi={isGeneratingAi}
            handleGenerateAiDescription={handleGenerateAiDescription}
            formatNumber={formatNumber}
            parseNumber={parseNumber}
            toLocalDatetimeInput={toLocalDatetimeInput}
          />
        </form>

        {id !== "new" && item && (
          <div
            className="item-detail-sections"
            style={{ marginTop: "40px", maxWidth: "800px" }}
          >
            <div style={{ display: currentStep === 2 ? "block" : "none" }}>
              <ItemImagesSection
                id={id!}
                isMobile={isMobile}
                images={images}
                uploadingImages={uploadingImages}
                setUploadingImages={setUploadingImages}
                handleUploadImage={handleUploadImage}
              />
            </div>
            <div style={{ display: currentStep === 3 ? "block" : "none" }}>
              <ItemSpinnerSection
                id={id!}
                spinSets={spinSets}
                selectedSpinSetId={selectedSpinSetId}
                setSelectedSpinSetId={setSelectedSpinSetId}
                showCreateSpinSet={showCreateSpinSet}
                setShowCreateSpinSet={setShowCreateSpinSet}
                newSpinSetLabel={newSpinSetLabel}
                setNewSpinSetLabel={setNewSpinSetLabel}
                newSpinSetIsDefault={newSpinSetIsDefault}
                setNewSpinSetIsDefault={setNewSpinSetIsDefault}
                uploadingFrames={uploadingFrames}
                createSpinSetMutation={createSpinSetMutation}
                updateSpinSetMutation={updateSpinSetMutation}
                deleteFrameMutation={deleteFrameMutation}
                reorderFramesMutation={reorderFramesMutation}
                handleUploadFrames={handleUploadFrames}
                handleMoveFrame={handleMoveFrame}
              />
            </div>
            <div style={{ display: currentStep === 4 ? "block" : "none" }}>
              <ItemAiSection
                id={id!}
                isMobile={isMobile}
                socialSellingRef={socialSellingRef}
                fbPostContent={fbPostContent}
                setFbPostContent={setFbPostContent}
                fbPostInstructions={fbPostInstructions}
                setFbPostInstructions={setFbPostInstructions}
                isGeneratingFbPost={isGeneratingFbPost}
                setIsGeneratingFbPost={setIsGeneratingFbPost}
                facebookPosts={facebookPosts}
                setFacebookPosts={setFacebookPosts}
                newFbLinkInput={newFbLinkInput}
                setNewFbLinkInput={setNewFbLinkInput}
                isSavingFbLink={isSavingFbLink}
                setIsSavingFbLink={setIsSavingFbLink}
                isPublishingToFb={isPublishingToFb}
                setIsPublishingToFb={setIsPublishingToFb}
                publishFbMessage={publishFbMessage}
                setPublishFbMessage={setPublishFbMessage}
                showAiPreview={showAiPreview}
                setShowAiPreview={setShowAiPreview}
                aiDescription={aiDescription}
                setAiDescription={setAiDescription}
                aiPreviewTab={aiPreviewTab}
                setAiPreviewTab={setAiPreviewTab}
                handleAcceptAiDescription={handleAcceptAiDescription}
              />
            </div>
          </div>
        )}

        {/* Step 5: QR Code — rendered outside the id/item guard so new items see the save-first prompt */}
        <div
          style={{
            display: currentStep === 5 ? "block" : "none",
            maxWidth: "800px",
          }}
        >
          <ItemQrSection
            id={id}
            itemName={data?.item?.name ?? ""}
            isPublic={data?.item?.is_public}
            isLoadingQr={isLoadingQr}
            qrError={qrError}
            qrData={qrData}
            setQrError={setQrError}
            setQrRetryKey={setQrRetryKey}
          />
        </div>

        <div
          className="item-detail-actions"
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
            maxWidth: "800px",
          }}
        >
          <button
            type="button"
            onClick={goToPrevStep}
            disabled={
              currentStep === 1 || isBusy
            }
            style={{
              padding: "10px 16px",
              background:
                currentStep === 1 || isBusy
                  ? "#d2d6dc"
                  : "#4b5563",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                currentStep === 1 || isBusy
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Bước trước
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            disabled={
              currentStep === 5 || isBusy
            }
            style={{
              padding: "10px 16px",
              background:
                currentStep === 5 || isBusy
                  ? "#d2d6dc"
                  : "linear-gradient(90deg, var(--ct-primary, #4f46e5), var(--ct-secondary, #7c3aed))",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor:
                currentStep === 5 || isBusy
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow:
                currentStep === 5 || isBusy
                  ? "none"
                  : "0 4px 14px 0 rgb(var(--shop-primary-rgb) / 0.28)",
            }}
          >
            {saveMutation.isPending ? "Đang lưu..." : "Bước tiếp →"}
          </button>
          {currentStep === 5 && (
            <button
              type="button"
              onClick={handleSaveAndBackToList}
              disabled={isBusy}
              style={{
                padding: "10px 16px",
                background:
                  isBusy
                    ? "#d2d6dc"
                    : "linear-gradient(90deg, var(--ct-primary, #4f46e5), var(--ct-secondary, #7c3aed))",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor:
                  isBusy
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow:
                  isBusy
                    ? "none"
                    : "0 4px 14px 0 rgb(var(--shop-primary-rgb) / 0.28)",
              }}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Hoàn tất"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
